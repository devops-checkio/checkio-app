import ExcelJS from "exceljs";

export interface HeaderMapping {
  attribute: string;
  header: string;
  render?: (value: any, record?: any) => any;
}

export const generateExcel = async (
  data: any[],
  headers: HeaderMapping[],
  filename: string,
  sheetName: string = "Sheet1"
): Promise<void> => {
  try {
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add headers
    const headerRow = worksheet.addRow(headers.map((h) => h.header));

    // Style header row
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F81BD" }, // Blue color
      };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" }, // White text
      };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    });

    // Map and add data rows
    data.forEach((item) => {
      const rowData = headers.map((mapping) => {
        // Handle nested attributes (e.g. "a.b.c")
        const getValue = (obj: any, path: string) => {
          return path.split(".").reduce((acc, part) => {
            return acc && acc[part];
          }, obj);
        };

        const value = getValue(item, mapping.attribute);
        return mapping.render ? mapping.render(value, item) : value;
      });
      worksheet.addRow(rowData);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      column.width = 15;
    });

    // Generate buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating excel:", error);
    throw new Error("Failed to generate excel file");
  }
};

export const downloadExcel = async (
  data: any[],
  headers: HeaderMapping[],
  options?: { filename?: string; sheetName?: string },
): Promise<void> => {
  const filename = options?.filename ?? "export";
  const sheetName = options?.sheetName ?? "Sheet1";
  return generateExcel(data, headers, filename, sheetName);
};

// Example usage:
/*
const data = [
  { 
    id: 1, 
    name: 'John',
    details: {
      age: 30,
      address: {
        city: 'New York'
      }
    }
  }
];

const headers = [
  { attribute: 'name', header: 'Nombre' },
  { attribute: 'details.age', header: 'Edad' },
  { attribute: 'details.address.city', header: 'Ciudad' }
];

generateExcel(data, headers, 'users', 'Usuarios');
*/
