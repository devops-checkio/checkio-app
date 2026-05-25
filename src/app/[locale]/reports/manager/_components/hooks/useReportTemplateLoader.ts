import { useEffect, useState } from "react";
import { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import { ReportTemplateColumnDto, ReportTemplateTotalRowDto } from "../report-template.dto";
import { FIELD_CATEGORIES, FieldCategory, ReportField, ReportFormData, TotalRow, TotalRowType } from "../report.dto";

interface UseReportTemplateLoaderParams {
  existingTemplate: {
    name?: string;
    description?: string;
    headerTransform?: string;
    reportType?: "ASSISTANCE" | "EMPLOYEE_DATA";
    columns: ReportTemplateColumnDto[];
    totalRows?: ReportTemplateTotalRowDto[];
  } | null | undefined;
  templateId: string | null;
  setValue: UseFormReturn<ReportFormData>["setValue"];
  replace: UseFieldArrayReturn<ReportFormData, "fields", "id">["replace"];
}

export const useReportTemplateLoader = ({
  existingTemplate,
  templateId,
  setValue,
  replace,
}: UseReportTemplateLoaderParams) => {
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  useEffect(() => {
    if (existingTemplate && !isLoadingTemplate && templateId) {
      setIsLoadingTemplate(true);
      
      
      setValue("name", existingTemplate.name || "");
      setValue("description", existingTemplate.description || "");
      setValue("headerTransform", (existingTemplate.headerTransform || "DEFAULT") as "DEFAULT" | "UPPER" | "LOWER");
      setValue("reportType", existingTemplate.reportType);

      const allFields = Object.values(FIELD_CATEGORIES).flatMap(
        (cat) => cat.fields
      );

      const mappedFields: ReportField[] = existingTemplate.columns.map(
        (col: ReportTemplateColumnDto) => {
          if (col.type === "CONSOLIDATED") {
            const firstTag = col.tags && col.tags.length > 0 ? col.tags[0] : null;
            let baseField: ReportField | null = null;
            
            if (firstTag) {
              const parts = firstTag.split(".");
              const fieldName = parts[parts.length - 1];
              const foundField = allFields.find((f) => f.name === fieldName);
              if (foundField) {
                baseField = foundField;
              }
            }
            
            if (!baseField) {
              baseField = allFields.find((f) => f.category === FieldCategory.EMPLOYEE) || allFields[0];
            }
            
            const field: ReportField = {
              ...baseField,
              id: col.fieldId,
              name: col.columnName.toLowerCase().replace(/\s+/g, ""),
              displayName: col.columnName,
              selected: true,
              order: col.position,
              headerTransform: col.headerTransform,
              isConsolidated: true,
              consolidatedSeparator: col.separator || " ",
              type: "string",
              originalTags: col.tags || [],
            };
            
            if (col.tags && col.tags.length > 0) {
              field.consolidatedFields = col.tags.map((tag) => {
                const parts = tag.split(".");
                return parts[parts.length - 1];
              });
              field.consolidatedFieldIds = col.tags
                .map((tag) => {
                  const parts = tag.split(".");
                  const fieldName = parts[parts.length - 1];
                  
                  let fieldFromCategories: ReportField | null = null;
                  
                  if (parts.length >= 2) {
                    const tableName = parts[0];
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
                    const mappedTable = tableMapping[tableName];
                    if (mappedTable) {
                      fieldFromCategories = allFields.find(
                        (f) => f.table === mappedTable && f.name === fieldName
                      ) || null;
                    } else {
                      fieldFromCategories = allFields.find(
                        (f) => f.table === "Employee" && f.name === fieldName
                      ) || null;
                    }
                  } else if (parts.length === 1) {
                    fieldFromCategories = allFields.find(
                      (f) => f.table === "Employee" && f.name === fieldName
                    ) || null;
                  }
                  
                  if (!fieldFromCategories && parts.length >= 3 && parts[0] === "employee") {
                    const tableName = parts[1];
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
                    const mappedTable = tableMapping[tableName] || tableName;
                    fieldFromCategories = allFields.find(
                      (f) => f.table === mappedTable && f.name === fieldName
                    ) || null;
                  } else if (!fieldFromCategories && parts.length === 2 && parts[0] === "employee") {
                    fieldFromCategories = allFields.find(
                      (f) => f.table === "Employee" && f.name === fieldName
                    ) || null;
                  }
                  
                  return fieldFromCategories?.id || null;
                })
                .filter((id): id is string => !!id);
            }
            if (col.format) field.format = col.format;
            if (col.timeFormat) field.timeFormat = col.timeFormat;
            
            return field;
          } else if (col.type === "CALCULATED") {
            const firstSourceFieldId = col.sourceFieldIds && col.sourceFieldIds.length > 0 
              ? col.sourceFieldIds[0] 
              : null;
            let baseField: ReportField | null = null;
            
            if (firstSourceFieldId) {
              const sourceColumn = existingTemplate.columns.find(
                (c) => c.fieldId === firstSourceFieldId
              );
              
              if (sourceColumn && sourceColumn.tags && sourceColumn.tags.length > 0) {
                const firstTag = sourceColumn.tags[0];
                const parts = firstTag.split(".");
                const fieldName = parts[parts.length - 1];
                
                let fieldFromCategories: ReportField | null = null;
                
                if (parts.length >= 2) {
                  const tableName = parts[0];
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
                  const mappedTable = tableMapping[tableName];
                  if (mappedTable) {
                    fieldFromCategories = allFields.find(
                      (f) => f.table === mappedTable && f.name === fieldName && f.type === "number"
                    ) || null;
                  } else {
                    fieldFromCategories = allFields.find(
                      (f) => f.table === "Employee" && f.name === fieldName && f.type === "number"
                    ) || null;
                  }
                } else if (parts.length === 1) {
                  fieldFromCategories = allFields.find(
                    (f) => f.table === "Employee" && f.name === fieldName && f.type === "number"
                  ) || null;
                }
                
                if (!fieldFromCategories && parts.length >= 3 && parts[0] === "employee") {
                  const tableName = parts[1];
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
                  const mappedTable = tableMapping[tableName] || tableName;
                  fieldFromCategories = allFields.find(
                    (f) => f.table === mappedTable && f.name === fieldName && f.type === "number"
                  ) || null;
                } else if (!fieldFromCategories && parts.length === 2 && parts[0] === "employee") {
                  fieldFromCategories = allFields.find(
                    (f) => f.table === "Employee" && f.name === fieldName && f.type === "number"
                  ) || null;
                }
                
                if (fieldFromCategories) {
                  baseField = fieldFromCategories;
                }
              }
            }
            
            if (!baseField) {
              baseField = allFields.find((f) => f.type === "number") || allFields[0] || null;
            }
            
            const field: ReportField = {
              ...baseField,
              id: col.fieldId,
              name: col.columnName.toLowerCase().replace(/\s+/g, ""),
              displayName: col.columnName,
              selected: true,
              order: col.position,
              headerTransform: col.headerTransform,
              isCalculated: true,
              calculationType: col.formula 
                ? "custom" 
                : (col.calculationType?.toLowerCase() || "sum") as "sum" | "subtract" | "multiply" | "divide" | "average" | "custom",
              type: "number",
            };
            
            const calculatedFieldIds: string[] = [];
            const calculatedFields: string[] = [];
            
            if (col.sourceFieldIds && col.sourceFieldIds.length > 0) {
              col.sourceFieldIds.forEach((sourceFieldId) => {
                const sourceColumn = existingTemplate.columns.find(
                  (c) => c.fieldId === sourceFieldId
                );
                
                if (sourceColumn && sourceColumn.tags && sourceColumn.tags.length > 0) {
                  const firstTag = sourceColumn.tags[0];
                  const parts = firstTag.split(".");
                  const fieldName = parts[parts.length - 1];
                  
                  let fieldFromCategories: ReportField | null = null;
                  
                  if (parts.length >= 2) {
                    const tableName = parts[0];
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
                    const mappedTable = tableMapping[tableName];
                    if (mappedTable) {
                      fieldFromCategories = allFields.find(
                        (f) => f.table === mappedTable && f.name === fieldName && f.type === "number"
                      ) || null;
                    } else {
                      fieldFromCategories = allFields.find(
                        (f) => f.table === "Employee" && f.name === fieldName && f.type === "number"
                      ) || null;
                    }
                  } else if (parts.length === 1) {
                    fieldFromCategories = allFields.find(
                      (f) => f.table === "Employee" && f.name === fieldName && f.type === "number"
                    ) || null;
                  }
                  
                  if (!fieldFromCategories && parts.length >= 3 && parts[0] === "employee") {
                    const tableName = parts[1];
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
                    const mappedTable = tableMapping[tableName] || tableName;
                    fieldFromCategories = allFields.find(
                      (f) => f.table === mappedTable && f.name === fieldName && f.type === "number"
                    ) || null;
                  } else if (!fieldFromCategories && parts.length === 2 && parts[0] === "employee") {
                    fieldFromCategories = allFields.find(
                      (f) => f.table === "Employee" && f.name === fieldName && f.type === "number"
                    ) || null;
                  }
                  
                  if (fieldFromCategories) {
                    calculatedFieldIds.push(fieldFromCategories.id);
                    calculatedFields.push(fieldName);
                  }
                }
              });
            }
            
            field.calculatedFieldIds = calculatedFieldIds;
            
            if (col.fieldMapping && Object.keys(col.fieldMapping).length > 0) {
              const fieldNames: string[] = [];
              Object.values(col.fieldMapping).forEach((mappedFieldId) => {
                const mappedColumn = existingTemplate.columns.find(
                  (c) => c.fieldId === mappedFieldId
                );
                if (mappedColumn && mappedColumn.tags && mappedColumn.tags.length > 0) {
                  const parts = mappedColumn.tags[0].split(".");
                  fieldNames.push(parts[parts.length - 1]);
                }
              });
              field.calculatedFields = fieldNames;
            } else if (calculatedFields.length > 0) {
              field.calculatedFields = calculatedFields;
            }
            
            if (col.formula) {
              field.formula = col.formula;
            }
            
            if (col.format) field.format = col.format;
            if (col.timeFormat) field.timeFormat = col.timeFormat;
            
            return field;
          } else if (col.type === "AGGREGATE") {
            const firstTag = col.tags && col.tags.length > 0 ? col.tags[0] : null;
            let baseField: ReportField | null = null;
            let fieldNameFromTag: string | null = null;
            
            if (firstTag) {
              const parts = firstTag.split(".");
              fieldNameFromTag = parts[parts.length - 1];
              const foundField = allFields.find((f) => f.name === fieldNameFromTag);
              if (foundField) {
                baseField = foundField;
              }
            }
            
            if (!baseField) {
              baseField = allFields.find((f) => f.type === "number") || allFields[0] || null;
            }
            
            if (!baseField) {
              return null;
            }
            
            const field: ReportField = {
              ...baseField,
              id: col.fieldId,
              name: fieldNameFromTag || baseField.name,
              displayName: col.columnName,
              selected: true,
              order: col.position,
              headerTransform: col.headerTransform,
              type: "number",
              category: baseField.category,
            };
            
            const aggregationValue = col.aggregation || "sum";
            field.aggregationType = aggregationValue.toLowerCase() as "sum" | "avg" | "count" | "min" | "max" | "none";
            if (col.format) field.format = col.format;
            if (col.timeFormat) field.timeFormat = col.timeFormat;
            
            return field;
          } else {
            // Primero intentar buscar por fieldId
            let sourceField = allFields.find((f) => f.id === col.fieldId);
            
            // Si no se encuentra por fieldId, buscar por el tag
            if (!sourceField && col.tags && col.tags.length > 0) {
              const firstTag = col.tags[0];
              const parts = firstTag.split(".");
              
              const normalizedTag = firstTag.toLowerCase();
              
              if (!sourceField && (firstTag.includes("Marks") || firstTag.includes("marks"))) {
                const markField = allFields.find(
                  (f) => {
                    const originalTags = (f as ReportField).originalTags;
                    return originalTags && originalTags.some(
                      (tag) => tag.toLowerCase() === normalizedTag
                    );
                  }
                );
                if (markField) {
                  sourceField = markField;
                }
              }
              
              if (!sourceField && (firstTag.includes("Schedule") || firstTag.includes("schedule"))) {
                const scheduleField = allFields.find(
                  (f) => {
                    const originalTags = (f as ReportField).originalTags;
                    return originalTags && originalTags.some(
                      (tag) => tag.toLowerCase() === normalizedTag
                    );
                  }
                );
                if (scheduleField) {
                  sourceField = scheduleField;
                }
              }
              
              if (!sourceField && parts.length >= 2) {
                const tableName = parts[0];
                const fieldName = parts[parts.length - 1];
                
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
                
                const mappedTable = tableMapping[tableName];
                if (mappedTable) {
                  sourceField = allFields.find(
                    (f) => f.table === mappedTable && f.name === fieldName
                  );
                } else {
                  sourceField = allFields.find(
                    (f) => f.table === "Employee" && f.name === fieldName
                  );
                }
              } else if (!sourceField && parts.length === 1) {
                const fieldName = parts[0];
                sourceField = allFields.find(
                  (f) => f.table === "Employee" && f.name === fieldName
                );
              }
              
              if (!sourceField && parts.length >= 3 && parts[0] === "employee") {
                const tableName = parts[1];
                const fieldName = parts[parts.length - 1];
                
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
                
                const mappedTable = tableMapping[tableName] || tableName;
                sourceField = allFields.find(
                  (f) => f.table === mappedTable && f.name === fieldName
                );
              } else if (!sourceField && parts.length === 2 && parts[0] === "employee") {
                const fieldName = parts[1];
                sourceField = allFields.find(
                  (f) => f.table === "Employee" && f.name === fieldName
                );
              }
              
              if (!sourceField && parts.length >= 3 && (parts[0] === "assistance" || parts[0] === "Assistance")) {
                const tableName = parts[1];
                const fieldName = parts[parts.length - 1];
                
                const tableMapping: Record<string, string> = {
                  schedule: "Schedule",
                  marks: "Marks",
                };
                
                const mappedTable = tableMapping[tableName?.toLowerCase()] || tableName;
                if (mappedTable === "Schedule" || mappedTable === "Marks") {
                  sourceField = allFields.find(
                    (f) => {
                      const originalTags = (f as ReportField).originalTags;
                      return originalTags && originalTags.some(
                        (tag) => tag.toLowerCase() === normalizedTag
                      );
                    }
                  );
                }
              }
            }
            
            if (!sourceField) {
              return null;
            }

            const field: ReportField = {
              ...sourceField,
              id: col.fieldId,
              displayName: col.columnName,
              selected: true,
              order: col.position,
              headerTransform: col.headerTransform,
              originalTags: col.tags || [],
            };

            if (col.format) field.format = col.format;
            if (col.timeFormat) field.timeFormat = col.timeFormat;

            return field;
          }
        }
      ).filter((f): f is ReportField => f !== null);

      const fieldsWithValidatedIds = mappedFields.map((field) => {
        if (field.isConsolidated && field.consolidatedFieldIds) {
          const validConsolidatedFieldIds = field.consolidatedFieldIds.filter((id) =>
            allFields.some((f) => f.id === id)
          );
          return {
            ...field,
            consolidatedFieldIds: validConsolidatedFieldIds,
          };
        }
        if (field.isCalculated && field.calculatedFieldIds) {
          const validCalculatedFieldIds = field.calculatedFieldIds.filter((id) =>
            allFields.some((f) => f.id === id && f.type === "number")
          );
          return {
            ...field,
            calculatedFieldIds: validCalculatedFieldIds,
          };
        }
        return field;
      });

      replace(fieldsWithValidatedIds);

      if (existingTemplate.totalRows && existingTemplate.totalRows.length > 0) {
        const mappedTotalRows: TotalRow[] = existingTemplate.totalRows.map(
          (tr: ReportTemplateTotalRowDto) => {
            const mappedColumns = tr.columns
              .filter((col) => col.aggregationType)
              .map((col) => {
                let matchingField = fieldsWithValidatedIds.find(
                  (field) => field.id === col.fieldId
                );
                
                if (!matchingField && existingTemplate.columns) {
                  const backendCol = existingTemplate.columns.find(
                    (c) => c.fieldId === col.fieldId
                  );
                  
                  if (backendCol && backendCol.tags && backendCol.tags.length > 0) {
                    const firstTag = backendCol.tags[0];
                    const parts = firstTag.split(".");
                    
                    if (parts.length >= 2) {
                      const tableName = parts[0];
                      const fieldName = parts[parts.length - 1];
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
                      const mappedTable = tableMapping[tableName];
                      if (mappedTable) {
                        matchingField = fieldsWithValidatedIds.find(
                          (f) => f.name === fieldName && f.table === mappedTable && !f.isConsolidated && !f.isCalculated
                        );
                      } else {
                        matchingField = fieldsWithValidatedIds.find(
                          (f) => f.table === "Employee" && f.name === fieldName && !f.isConsolidated && !f.isCalculated
                        );
                      }
                    } else if (parts.length === 1) {
                      const fieldName = parts[0];
                      matchingField = fieldsWithValidatedIds.find(
                        (f) => f.table === "Employee" && f.name === fieldName && !f.isConsolidated && !f.isCalculated
                      );
                    }
                    
                    if (!matchingField && parts.length >= 3 && parts[0] === "employee") {
                      const tableName = parts[1];
                      const fieldName = parts[parts.length - 1];
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
                      const mappedTable = tableMapping[tableName] || tableName;
                      
                      matchingField = fieldsWithValidatedIds.find(
                        (f) => f.name === fieldName && f.table === mappedTable && !f.isConsolidated && !f.isCalculated
                      );
                    } else if (!matchingField && parts.length === 2 && parts[0] === "employee") {
                      const fieldName = parts[1];
                      matchingField = fieldsWithValidatedIds.find(
                        (f) => f.table === "Employee" && f.name === fieldName && !f.isConsolidated && !f.isCalculated
                      );
                    }
                  }
                }
                
                if (!matchingField) {
                  return null;
                }
                
                return {
                  fieldId: matchingField.id,
                  aggregationType: (col.aggregationType as string).toUpperCase() as "SUM" | "AVG" | "COUNT" | "MIN" | "MAX" | "NONE",
                  format: col.format || undefined,
                };
              })
              .filter((col): col is { fieldId: string; aggregationType: "SUM" | "AVG" | "COUNT" | "MIN" | "MAX" | "NONE"; format: string | undefined } => col !== null);
            
            return {
              id: tr.id,
              label: tr.label,
              type: tr.type as TotalRowType,
              position: tr.position,
              showLabel: tr.showLabel,
              headerTransform: tr.headerTransform || "DEFAULT",
              columns: mappedColumns,
              groupBy: tr.groupBy && Array.isArray(tr.groupBy) ? tr.groupBy : undefined,
              labelTemplate: tr.labelTemplate || undefined,
              showGroupContext: tr.showGroupContext || false,
            };
          }
        );
        
        setValue("totalRows", mappedTotalRows);
      }

      setIsLoadingTemplate(false);
    }
  }, [existingTemplate, setValue, templateId, isLoadingTemplate, replace]);

  return { isLoadingTemplate };
};
