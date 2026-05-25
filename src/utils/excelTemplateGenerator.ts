import ExcelJS from "exceljs";

export interface TemplateField {
  key: string;
  label: string;
  type: "text" | "date" | "select" | "number";
  exampleValue?: string | number;
  options?: string[];
}

function getColumnLetter(index: number): string {
  let s = "";
  let n = index;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export async function generateExcelTemplate(
  fields: TemplateField[],
  entityName: string,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Plantilla");

  const headers = fields.map((f) => f.label);
  worksheet.addRow(headers);

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  const exampleRow = fields.map((field) => {
    if (field.exampleValue !== undefined) return field.exampleValue;
    switch (field.type) {
      case "date":
        return "01/01/2024";
      case "number":
        return 0;
      case "select":
        return field.options?.[0] ?? "";
      case "text":
      default:
        return `Ejemplo ${field.label}`;
    }
  });
  worksheet.addRow(exampleRow);

  if (fields.some((f) => f.options && f.options.length > 0)) {
    const listSheet = workbook.addWorksheet("Listas");
    let listCol = 1;
    fields.forEach((field, colIndex) => {
      if (field.options && field.options.length > 0) {
        const letter = getColumnLetter(listCol);
        field.options.forEach((opt, r) => {
          listSheet.getCell(r + 1, listCol).value = opt;
        });
        const colLetter = getColumnLetter(colIndex + 1);
        const definedName = `Lista_${field.key}`.replace(/[^a-zA-Z0-9_]/g, "_");
        const locStr = `Listas!$${letter}$1:$${letter}$${field.options.length}`;
        workbook.definedNames.add(locStr, definedName);
        for (let row = 2; row <= 51; row++) {
          worksheet.getCell(row, colIndex + 1).dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [definedName],
            showErrorMessage: false,
          };
        }
        listCol++;
      }
    });
  }

  fields.forEach((field, index) => {
    worksheet.getColumn(index + 1).width = Math.max(
      field.label.length + 5,
      15,
    );
  });

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `plantilla_${entityName}_${timestamp}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
