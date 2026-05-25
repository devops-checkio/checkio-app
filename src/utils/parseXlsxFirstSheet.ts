import type { CellValue } from "exceljs";
import ExcelJS from "exceljs";

function cellToPlainValue(value: CellValue): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray((value as { richText: { text: string }[] }).richText)) {
      return (value as { richText: { text: string }[] }).richText
        .map((r) => r.text)
        .join("");
    }
    if ("result" in value) {
      return (value as { result?: unknown }).result;
    }
    if ("text" in value && typeof (value as { text: string }).text === "string") {
      return (value as { text: string }).text;
    }
  }
  return String(value);
}

/**
 * Reads the first worksheet like XLSX.utils.sheet_to_json (first row = headers).
 */
export async function parseFirstWorksheetToJsonRecords(
  input: ArrayBuffer,
): Promise<Record<string, unknown>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(input);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return [];
  }

  const headerRow = sheet.getRow(1);
  const columnCount = Math.max(
    sheet.actualColumnCount || 0,
    headerRow.actualCellCount || 0,
    1,
  );

  const headers: string[] = [];
  for (let c = 1; c <= columnCount; c++) {
    const raw = cellToPlainValue(headerRow.getCell(c).value);
    headers.push(
      raw === null || raw === undefined ? "" : String(raw).trim(),
    );
  }

  const records: Record<string, unknown>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }
    const rec: Record<string, unknown> = {};
    let hasAny = false;
    for (let c = 1; c <= columnCount; c++) {
      const key = headers[c - 1];
      if (!key) {
        continue;
      }
      const raw = cellToPlainValue(row.getCell(c).value);
      const val =
        raw === undefined || raw === "" ? null : raw;
      if (val !== null && val !== undefined) {
        hasAny = true;
      }
      rec[key] = val;
    }
    if (hasAny) {
      records.push(rec);
    }
  });

  return records;
}
