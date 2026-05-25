import ExcelJS from "exceljs";

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ParseResult {
  data: Record<string, unknown>[];
  errors: ValidationError[];
  isValid: boolean;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: "text" | "date" | "select" | "number";
  required?: boolean;
  options?: string[];
  validator?: (value: unknown) => string | null;
}

function getCellValue(cell: ExcelJS.Cell | undefined): unknown {
  if (!cell || !cell.value) return "";
  const v = cell.value;
  if (typeof v === "object" && v !== null && "result" in v) {
    return (v as { result?: unknown }).result ?? "";
  }
  if (typeof v === "object" && v !== null && "richText" in v) {
    const rich = (v as { richText?: { text?: string }[] }).richText;
    return rich?.map((t) => t.text ?? "").join("") ?? "";
  }
  return v;
}

export async function parseExcelFile(
  file: File,
  fields: FieldDefinition[],
): Promise<ParseResult> {
  const errors: ValidationError[] = [];
  const data: Record<string, unknown>[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error("El archivo Excel no contiene hojas");
    }

    const rows: unknown[][] = [];
    worksheet.eachRow((row) => {
      const values: unknown[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        values[colNumber - 1] = getCellValue(cell);
      });
      rows.push(values);
    });

    if (rows.length === 0) {
      throw new Error("El archivo Excel está vacío");
    }

    const headerRow = rows[0] as (string | number)[];
    const headerMap = new Map<string, number>();
    headerRow.forEach((header, index) => {
      const h = String(header ?? "").trim().toLowerCase();
      if (h) headerMap.set(h, index);
    });

    const missingHeaders: string[] = [];
    fields.forEach((field) => {
      if (field.required !== true) return;
      const found = Array.from(headerMap.keys()).some((h) =>
        h.includes(field.label.toLowerCase()),
      );
      if (!found) missingHeaders.push(field.label);
    });

    if (missingHeaders.length > 0) {
      errors.push({
        row: 1,
        field: "Headers",
        message: `Faltan los siguientes encabezados: ${missingHeaders.join(", ")}`,
      });
      return { data: [], errors, isValid: false };
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      const rowData: Record<string, unknown> = {};
      const rowErrors: ValidationError[] = [];

      fields.forEach((field) => {
        let columnIndex = -1;
        for (const [header, index] of headerMap.entries()) {
          if (header.includes(field.label.toLowerCase())) {
            columnIndex = index;
            break;
          }
        }

        if (columnIndex === -1) {
          if (field.required !== true) {
            rowData[field.key] = null;
            return;
          }
          rowErrors.push({
            row: i + 1,
            field: field.label,
            message: `No se encontró la columna "${field.label}"`,
          });
          return;
        }

        const rawValue = row[columnIndex];
        let processedValue: unknown = rawValue;

        if (
          field.required &&
          (rawValue === "" || rawValue === null || rawValue === undefined)
        ) {
          rowErrors.push({
            row: i + 1,
            field: field.label,
            message: `El campo "${field.label}" es requerido`,
          });
          return;
        }

        if (
          !field.required &&
          (rawValue === "" || rawValue === null || rawValue === undefined)
        ) {
          rowData[field.key] = null;
          return;
        }

        switch (field.type) {
          case "number": {
            const numValue = Number(rawValue);
            if (isNaN(numValue)) {
              rowErrors.push({
                row: i + 1,
                field: field.label,
                message: `El campo "${field.label}" debe ser un número`,
              });
              return;
            }
            processedValue = numValue;
            break;
          }
          case "date": {
            const str = String(rawValue).trim();
            const parts = str.split("/");
            let dateValue: Date | null = null;
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10);
              const year = parseInt(parts[2], 10);
              if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                dateValue = new Date(year, month - 1, day);
              }
            }
            if (!dateValue || isNaN(dateValue.getTime())) {
              rowErrors.push({
                row: i + 1,
                field: field.label,
                message: `El campo "${field.label}" debe ser una fecha válida (DD/MM/YYYY)`,
              });
              return;
            }
            processedValue = str;
            break;
          }
          case "select": {
            const stringValue = String(rawValue).trim();
            if (
              field.options &&
              field.options.length > 0 &&
              !field.options.includes(stringValue)
            ) {
              rowErrors.push({
                row: i + 1,
                field: field.label,
                message: `El campo "${field.label}" debe ser uno de: ${field.options.join(", ")}`,
              });
              return;
            }
            processedValue = stringValue;
            break;
          }
          case "text":
          default:
            processedValue = String(rawValue).trim();
            break;
        }

        if (field.validator) {
          const validationError = field.validator(processedValue);
          if (validationError) {
            rowErrors.push({
              row: i + 1,
              field: field.label,
              message: validationError,
            });
            return;
          }
        }

        rowData[field.key] = processedValue;
      });

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        data.push(rowData);
      }
    }

    return {
      data,
      errors,
      isValid: errors.length === 0,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error desconocido al parsear el archivo";
    errors.push({
      row: 0,
      field: "Archivo",
      message: errorMessage,
    });
    return { data: [], errors, isValid: false };
  }
}
