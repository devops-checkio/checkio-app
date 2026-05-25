import { ReportTemplateColumnDto } from "../report-template.dto";
import { ReportField } from "../report.dto";

export function mapBdIdToCategoryId(
  bdId: string,
  formFields: ReportField[],
  categoryFields: ReportField[]
): string | null {
  const fieldInForm = formFields.find((f) => f.id === bdId);
  
  if (fieldInForm && 
      fieldInForm.type === "number" && 
      !fieldInForm.isConsolidated && 
      !fieldInForm.isCalculated) {
    const fieldFromCategories = categoryFields.find(
      (f) => f.name === fieldInForm.name && f.table === fieldInForm.table
    );
    return fieldFromCategories?.id || null;
  }
  
  const allFieldsCombined = [...formFields, ...categoryFields];
  const fieldById = allFieldsCombined.find((f) => f.id === bdId);
  
  if (fieldById && fieldById.type === "number") {
    const fieldFromCategories = categoryFields.find(
      (f) => f.name === fieldById.name && f.table === fieldById.table
    );
    if (fieldFromCategories) {
      return fieldFromCategories.id;
    }
    
    if (categoryFields.some((f) => f.id === bdId)) {
      return bdId;
    }
  }
  
  return null;
}

export function mapCategoryIdToBdId(
  categoryId: string,
  formFields: ReportField[],
  categoryFields: ReportField[]
): string | null {
  const fieldFromCategories = categoryFields.find((f) => f.id === categoryId);
  
  if (!fieldFromCategories) return null;
  
  const fieldInForm = formFields.find((f) => {
    if (f.isConsolidated || f.isCalculated) return false;
    return f.name === fieldFromCategories.name && 
           f.table === fieldFromCategories.table;
  });
  
  if (fieldInForm) {
    return fieldInForm.id;
  }
  
  return categoryId;
}

export function mapBdIdToCategoryIdUsingTags(
  bdId: string,
  templateColumns: ReportTemplateColumnDto[],
  categoryFields: ReportField[]
): string | null {
  const column = templateColumns.find((c) => c.fieldId === bdId);
  
  if (!column || !column.tags || column.tags.length === 0) {
    return null;
  }
  
  const tag = column.tags[0];
  const parts = tag.split(".");
  const fieldName = parts[parts.length - 1];
  
  let tableName = "Employee";
  if (parts.length >= 2) {
    const tableMapping: Record<string, string> = {
      job: "Job",
      branch: "Branch",
      company: "Company",
      schedule: "Schedule",
      shift: "Shift",
      assistance: "Assistance",
      absence: "Absence",
      overtimeRequest: "OvertimeRequest",
      holiday: "Holiday",
    };
    const mappedTable = tableMapping[parts[0]];
    tableName = mappedTable || "Employee";
  } else if (parts.length === 1) {
    tableName = "Employee";
  }
  
  if (tableName === "Employee" && parts.length >= 3 && parts[0] === "employee") {
    const tableMapping: Record<string, string> = {
      job: "Job",
      branch: "Branch",
      company: "Company",
      schedule: "Schedule",
      shift: "Shift",
      assistance: "Assistance",
      absence: "Absence",
      overtimeRequest: "OvertimeRequest",
      holiday: "Holiday",
    };
    const mappedTable = tableMapping[parts[1]];
    if (mappedTable) {
      tableName = mappedTable;
    }
  } else if (tableName === "Employee" && parts.length === 2 && parts[0] === "employee") {
    tableName = "Employee";
  }
  
  const fieldFromCategories = categoryFields.find(
    (f) => f.name === fieldName && f.table === tableName && f.type === "number"
  );
  
  return fieldFromCategories?.id || null;
}
