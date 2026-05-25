import { CalculationType } from "../dto/modal-props.dto";
import { ReportTemplateColumnDto } from "../report-template.dto";
import { FIELD_CATEGORIES, ReportField, TotalRow, TotalRowType, FieldCategory } from "../report.dto";

interface ReportFormData {
  name: string;
  description?: string;
  headerTransform?: "DEFAULT" | "UPPER" | "LOWER";
  reportType?: "ASSISTANCE" | "EMPLOYEE_DATA";
  fields: ReportField[];
  totalRows?: TotalRow[];
}

export const getReportJson = (
  watch: () => ReportFormData,
  fields: ReportField[],
  getValues: () => ReportFormData
): string => {
  const reportData = watch();
  const currentFields = fields;

  const getRelationshipPath = (table: string, fieldName: string): string => {
    const relationshipMap: Record<string, string> = {
      Employee: "employee",
      Job: "job",
      Branch: "branch",
      Company: "company",
      Schedule: "schedule",
      Shift: "shift",
      Assistance: "assistance",
      Absence: "absence",
      OvertimeRequest: "overtimeRequest",
      Holiday: "holiday",
    };

    const basePath = relationshipMap[table] || table.toLowerCase();
    return `${basePath}.${fieldName}`;
  };

  const normalizeTag = (tag: string): string => {
    const parts = tag.split(".");
    if (parts.length >= 1) {
      parts[0] = parts[0].toLowerCase();
    }
    return parts.join(".");
  };

  const getFieldTag = (field: ReportField): string => {
    if (field.originalTags && field.originalTags.length > 0) {
      return normalizeTag(field.originalTags[0]);
    }
    if (field.isConsolidated && field.consolidatedFields) {
      const allFields = Object.values(FIELD_CATEGORIES).flatMap(
        (cat) => cat.fields
      );
      const tags =
        field.consolidatedFieldIds && field.consolidatedFieldIds.length > 0
          ? field.consolidatedFieldIds
              .map((fieldId) => {
                const sourceField = allFields.find((f) => f.id === fieldId);
                if (sourceField) {
                  return getRelationshipPath(sourceField.table, sourceField.name);
                }
                return null;
              })
              .filter((tag): tag is string => tag !== null)
          : field.consolidatedFields
              .map((fieldName) => {
                const sourceField = allFields.find(
                  (f) => f.table === 'Employee' && f.name === fieldName
                );
                if (sourceField) {
                  return getRelationshipPath(sourceField.table, sourceField.name);
                }
                return null;
              })
              .filter((tag): tag is string => tag !== null);
      return tags.join(` ${field.consolidatedSeparator || " "} `);
    }
    return getRelationshipPath(field.table, field.name);
  };

  const getFieldType = (field: ReportField): string => {
    if (field.isConsolidated) {
      return "CONSOLIDATED";
    }
    if (field.isCalculated) {
      return "CALCULATED";
    }
    if (
      field.type === "number" &&
      field.aggregationType &&
      field.aggregationType !== "none"
    ) {
      return "AGGREGATE";
    }
    return field.type.toUpperCase();
  };

  const allFields = Object.values(FIELD_CATEGORIES).flatMap(
    (cat) => cat.fields
  );
    const DURATION_FORMATS = new Set([
    'hours_hhmm',
    'hours_decimal',
    'hours_decimal_no_unit',
    'hours_minutes',
    'minutes',
  ]);
  const json: {
    name: string;
    description: string;
    headerTransform: string;
    reportType?: "ASSISTANCE" | "EMPLOYEE_DATA";
    columns: unknown[];
    totalRows?: unknown[];
  } = {
    name: reportData.name,
    description: reportData.description || "",
    headerTransform: reportData.headerTransform || "DEFAULT",
    reportType: reportData.reportType,
    columns: currentFields.map((field, index) => {
      const globalHeaderTransform = reportData.headerTransform || "DEFAULT";
      
      const isExplicitlyDayText = ((field.format || "") as string).toLowerCase() === "day_text";
      const isDateType = (field.type || "").toString().toLowerCase() === "date";

      let shouldIncludeInTotals =
        (field.category === FieldCategory.ATTENDANCE ||
        field.category === FieldCategory.SCHEDULE ||
        field.category === FieldCategory.OVERTIME ||
        field.type === "number" ||
        ((field.format && DURATION_FORMATS.has((field.format || "").toString())) || false) ||
        field.isCalculated) &&
        // Exclude explicit day text or plain date fields from totals
        !isExplicitlyDayText &&
        !isDateType;

      // Never auto-include plain time-of-day fields (TIME/DATETIME) as summable totals
      if ((field.type || "").toString().toLowerCase() === "time" || (field.type || "").toString().toLowerCase() === "datetime") {
        // Only include if the field explicitly defines a timeFormat that represents a duration
        if (!field.timeFormat) {
          shouldIncludeInTotals = false;
        }
      }

      // If this is a consolidated field built from assistance.day/month/year (a date), don't include
      if (field.isConsolidated && field.consolidatedFields && Array.isArray(field.consolidatedFields)) {
        const lowerNames = field.consolidatedFields.map((n) => n.toString().toLowerCase());
        if (lowerNames.includes("day") || lowerNames.includes("month") || lowerNames.includes("year") || lowerNames.includes("date")) {
          shouldIncludeInTotals = false;
        }
      }

      const baseColumn = {
        fieldId: field.id,
        columnName: field.displayName,
        headerTransform: field.headerTransform || globalHeaderTransform,
        position: index,
        type: getFieldType(field),
        tags: [getFieldTag(field)],
        includeInTotals: shouldIncludeInTotals,
      };

      if (field.isConsolidated && field.consolidatedFields) {
        const consolidatedTags =
          field.consolidatedFieldIds && field.consolidatedFieldIds.length > 0
            ? field.consolidatedFieldIds
                .map((fieldId) => {
                  const sourceField = currentFields.find((f) => f.id === fieldId);
                  if (sourceField) {
                    return getFieldTag(sourceField);
                  }

                  const fieldFromAllFields = allFields.find((f) => f.id === fieldId);
                  if (fieldFromAllFields) {
                    return getFieldTag(fieldFromAllFields);
                  }

                  return null;
                })
                .filter((tag): tag is string => tag !== null)
            : field.consolidatedFields
                .map((fieldName) => {
                  const sourceField = currentFields.find(
                    (f) => f.name === fieldName
                  );
                  if (sourceField) {
                    return getFieldTag(sourceField);
                  }

                  const fieldFromAllFields = allFields.find(
                    (f) => f.table === 'Employee' && f.name === fieldName
                  );
                  if (fieldFromAllFields) {
                    return getFieldTag(fieldFromAllFields);
                  }

                  return null;
                })
                .filter((tag): tag is string => tag !== null);

        return {
          ...baseColumn,
          tags: consolidatedTags,
          format: field.format,
          timeFormat: field.timeFormat,
          separator: field.consolidatedSeparator || " ",
        };
      }

      if (field.isCalculated) {
        const formFields = currentFields;
        let effectiveFieldIds =
          (field.calculatedFieldIds && field.calculatedFieldIds.length > 0
            ? field.calculatedFieldIds
            : (field.calculatedFields || [])
                .map((fieldName) => {
                  const inReport = formFields.find((f) => f.name === fieldName);
                  if (inReport) return inReport.id;
                  const sourceField = allFields.find(
                    (f) => f.name === fieldName
                  );
                  return sourceField?.id || null;
                })
                .filter((id): id is string => id !== null)) || [];

        if (effectiveFieldIds.length === 0) {
          // Include numeric fields and time/duration-like fields so user can create
          // calculated columns that operate on time values (e.g., salida - entrada)
          const allNumericOrTimeFields = formFields.filter((f) =>
            (f.type === "number" || f.type === "time" || Boolean(f.timeFormat)) &&
            !f.isConsolidated &&
            !f.isCalculated &&
            f.id !== field.id
          );
          effectiveFieldIds = allNumericOrTimeFields.map((f) => f.id);
        }

        const mappedToFormFieldIds = effectiveFieldIds.map((fieldId) => {
          const fieldInForm = formFields.find((f) => f.id === fieldId);
          if (fieldInForm) {
            return fieldId;
          }
          
          const fieldFromCategories = allFields.find((f) => f.id === fieldId);
          if (fieldFromCategories) {
            const matchingFormField = formFields.find((f) => 
              !f.isConsolidated && 
              !f.isCalculated &&
              f.name === fieldFromCategories.name && 
              f.table === fieldFromCategories.table
            );
            if (matchingFormField) {
              return matchingFormField.id;
            }
          }
          
          return fieldId;
        });

        const validFieldIds = mappedToFormFieldIds.filter((fieldId) => {
          return formFields.some((f) => f.id === fieldId);
        });

        const seenFieldIdsForMapping = new Set<string>();
        const uniqueFieldIds = validFieldIds.filter((fieldId) => {
          if (seenFieldIdsForMapping.has(fieldId)) {
            return false;
          }
          seenFieldIdsForMapping.add(fieldId);
          return true;
        });

        const calcType = field.calculationType as unknown;
        const calculationTypeStr =
          calcType === CalculationType.SUM || calcType === "sum" || calcType === "SUM"
            ? "SUM"
            : calcType === CalculationType.SUBTRACT || calcType === "subtract" || calcType === "SUBTRACT"
            ? "SUBTRACT"
            : calcType === CalculationType.MULTIPLY || calcType === "multiply" || calcType === "MULTIPLY"
            ? "MULTIPLY"
            : calcType === CalculationType.DIVIDE || calcType === "divide" || calcType === "DIVIDE"
            ? "DIVIDE"
            : calcType === CalculationType.AVERAGE || calcType === "average" || calcType === "AVERAGE"
            ? "AVERAGE"
            : calcType === CalculationType.CUSTOM || calcType === "custom" || calcType === "CUSTOM"
            ? "CUSTOM"
            : "SUM";

        const sourceFieldIdsArray = [...uniqueFieldIds];
        
        const fieldMapping: Record<string, string> = {};
        sourceFieldIdsArray.forEach((fieldId, index) => {
          const letter = String.fromCharCode(65 + index);
          fieldMapping[letter] = fieldId;
        });

        const calculatedColumn: Record<string, unknown> = {
          ...baseColumn,
          sourceFieldIds: sourceFieldIdsArray,
          calculationType: calculationTypeStr,
          fieldMapping: fieldMapping,
          format: field.format,
          timeFormat: field.timeFormat,
        };
        
        delete calculatedColumn.tags;

        const calcTypeForFormula = field.calculationType as unknown;
        if (
          (calcTypeForFormula === CalculationType.CUSTOM ||
            calcTypeForFormula === "custom") &&
          field.formula
        ) {
          calculatedColumn.formula = field.formula;
        }

        return calculatedColumn;
      }

      if (field.format || field.timeFormat) {
        return {
          ...baseColumn,
          format: field.format,
          timeFormat: field.timeFormat,
        };
      }

      if (field.aggregationType && field.aggregationType !== "none") {
        const aggColumn: Record<string, unknown> = {
          ...baseColumn,
          aggregation: field.aggregationType.toUpperCase(),
        };
        if (field.format) {
          aggColumn.format = field.format;
        }
        if (field.timeFormat) {
          aggColumn.timeFormat = field.timeFormat;
        }
        return aggColumn;
      }

      return baseColumn;
    }),
    totalRows: undefined,
  };



  if (reportData.totalRows && reportData.totalRows.length > 0) {
    json.totalRows = reportData.totalRows.map((totalRow) => {
      const formFields = currentFields;

      // Para tipos SUM/AVG/etc (no CUSTOM), siempre reconstruir todas las columnas numéricas
      // Para CUSTOM, usar las columnas guardadas
      let columnsForTotal: Array<Record<string, unknown>> = [];
      
      if (totalRow.type === TotalRowType.CUSTOM) {
        // Para CUSTOM, usar las columnas guardadas y mapear fieldId antiguos a nuevos
        const columnsBeforeProcessing = totalRow.columns || [];
        const processedColumns: Array<Record<string, unknown> | null> = [];
        const allFields = Object.values(FIELD_CATEGORIES).flatMap(
          (cat) => cat.fields
        );
        
        columnsForTotal = (totalRow.columns && totalRow.columns.length > 0)
          ? totalRow.columns.map(col => {
              const colBefore = { ...col };
              // Primero intentar encontrar el campo por ID directo
              let fieldForCol = formFields.find(
                (field) => field.id === col.fieldId
              );
              
              // Si no se encuentra, buscar en json.columns usando el fieldId antiguo para obtener los tags
              if (!fieldForCol) {
                const backendCol = (json.columns as ReportTemplateColumnDto[]).find(
                  (c) => c.fieldId === col.fieldId
                );
                
                if (backendCol && backendCol.tags && Array.isArray(backendCol.tags) && backendCol.tags.length > 0) {
                  const firstTag = backendCol.tags[0] as string;
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
                    const mappedTable = tableMapping[tableName] || tableName;
                    
                    if (mappedTable) {
                      const categoryField = allFields.find(
                        (f) => f.table === mappedTable && f.name === fieldName
                      );
                      
                      if (categoryField) {
                        fieldForCol = formFields.find(
                          (f) => f.name === categoryField.name && f.table === categoryField.table && !f.isConsolidated && !f.isCalculated
                        );
                      }
                    } else {
                      const categoryField = allFields.find(
                        (f) => f.table === "Employee" && f.name === fieldName
                      );
                      
                      if (categoryField) {
                        fieldForCol = formFields.find(
                          (f) => f.name === categoryField.name && f.table === categoryField.table && !f.isConsolidated && !f.isCalculated
                        );
                      }
                    }
                  } else if (parts.length === 1) {
                    const fieldName = parts[0];
                    const categoryField = allFields.find(
                      (f) => f.table === "Employee" && f.name === fieldName
                    );
                    
                    if (categoryField) {
                      fieldForCol = formFields.find(
                        (f) => f.name === categoryField.name && f.table === categoryField.table && !f.isConsolidated && !f.isCalculated
                      );
                    }
                  }
                  
                  if (!fieldForCol && parts.length >= 3 && parts[0] === "employee") {
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
                    
                    const categoryField = allFields.find(
                      (f) => f.table === mappedTable && f.name === fieldName
                    );
                    
                    if (categoryField) {
                      fieldForCol = formFields.find(
                        (f) => f.name === categoryField.name && f.table === categoryField.table && !f.isConsolidated && !f.isCalculated
                      );
                    }
                  } else if (!fieldForCol && parts.length === 2 && parts[0] === "employee") {
                    const fieldName = parts[1];
                    const categoryField = allFields.find(
                      (f) => f.table === "Employee" && f.name === fieldName
                    );
                    
                    if (categoryField) {
                      fieldForCol = formFields.find(
                        (f) => f.name === categoryField.name && f.table === categoryField.table && !f.isConsolidated && !f.isCalculated
                      );
                    }
                  }
                } else {
                  // Si no encontramos en json.columns, buscar directamente en formFields usando el tag del campo original
                  // Esto puede pasar si el campo fue eliminado y re-agregado
                  const categoryField = allFields.find((f) => f.id === col.fieldId);
                  if (categoryField) {
                    fieldForCol = formFields.find(
                      (f) => f.name === categoryField.name && f.table === categoryField.table && !f.isConsolidated && !f.isCalculated
                    );
                  }
                }
              }
              
              if (!fieldForCol) {
                processedColumns.push(null);
                return null;
              }
              
              if (!col.aggregationType) {
                processedColumns.push(null);
                return null;
              }
              
              const result = {
                fieldId: fieldForCol.id,
                aggregationType: (col.aggregationType as string).toUpperCase() as "SUM" | "AVG" | "COUNT" | "MIN" | "MAX" | "NONE",
                format: col.format || fieldForCol.format,
                timeFormat: (col as unknown as Record<string, unknown>).timeFormat || fieldForCol.timeFormat,
              };
              
              processedColumns.push(result);
              return result;
            }).filter((col) => col !== null) as Array<Record<string, unknown>>
          : [];
      } else {
        // Para SUM/AVG/etc, siempre reconstruir todas las columnas numéricas
        const numericFieldsForTotal = formFields.filter(
          (field) =>
            field.type === "number" &&
            (field.aggregationType !== "none" || field.isCalculated) &&
            !field.isConsolidated
        );

        if (numericFieldsForTotal.length > 0) {
          columnsForTotal = numericFieldsForTotal.map((field) => {
            const column: Record<string, unknown> = {
              fieldId: field.id,
              aggregationType:
                totalRow.type === TotalRowType.SUM
                  ? "SUM"
                  : totalRow.type === TotalRowType.AVG
                  ? "AVG"
                  : totalRow.type === TotalRowType.COUNT
                  ? "COUNT"
                  : totalRow.type === TotalRowType.MIN
                  ? "MIN"
                  : totalRow.type === TotalRowType.MAX
                  ? "MAX"
                  : "SUM",
              format: field.format,
              timeFormat: field.timeFormat,
            };
            return column;
          });
        }
      }

      const result: Record<string, unknown> = {
        id: totalRow.id,
        label: totalRow.label,
        type: totalRow.type,
        position: totalRow.position,
        showLabel: totalRow.showLabel,
        headerTransform: totalRow.headerTransform || reportData.headerTransform || "DEFAULT",
        columns: columnsForTotal,
      };
      
      // Incluir groupBy si existe
      if (totalRow.groupBy && Array.isArray(totalRow.groupBy) && totalRow.groupBy.length > 0) {
        result.groupBy = totalRow.groupBy;
      }
      
      // Incluir labelTemplate si existe
      if (totalRow.labelTemplate) {
        result.labelTemplate = totalRow.labelTemplate;
      }
      
      // Incluir showGroupContext si existe
      if (totalRow.showGroupContext) {
        result.showGroupContext = totalRow.showGroupContext;
      }
      
      return result;
    });
  }

  // If user provided totalRows, ensure we sanitize columns to remove non-summable fields
  if (json.totalRows && Array.isArray(json.totalRows)) {
    const allJsonCols = (json.columns as Record<string, unknown>[]) || [];
    json.totalRows = (json.totalRows as Record<string, unknown>[]).map((tr) => {
      const trCopy = { ...tr };
      const cols = (trCopy.columns as Record<string, unknown>[]) || [];
      const sanitized = cols.filter((c) => {
        const fieldId = (c as any).fieldId as string | undefined;
        if (!fieldId) return false;
        const src = allJsonCols.find((jc) => (jc.fieldId as string) === fieldId);
        if (!src) return true; // keep if we can't resolve source

        const srcFormat = ((src.format as string) || "").toLowerCase();
        const srcType = ((src.type as string) || "").toString().toUpperCase();
        const srcTags: string[] = Array.isArray(src.tags) ? (src.tags as string[]) : [];

        // Exclude day_text format
        if (srcFormat === "day_text") return false;

        // Exclude plain time/datetime fields (time of day)
        if (srcType === "TIME" || srcType === "DATETIME") return false;

        // Exclude consolidated date fields that are built from assistance.day/month/year
        if (srcType === "CONSOLIDATED") {
          const tagsStr = srcTags.join(" ");
          if (
            tagsStr.includes("assistance.day") ||
            tagsStr.includes("assistance.month") ||
            tagsStr.includes("assistance.year") ||
            tagsStr.includes("assistance.date")
          ) {
            return false;
          }
        }

        return true;
      });

      return {
        ...trCopy,
        columns: sanitized,
      };
    });
  }

  if (Array.isArray(json.columns)) {
    const numericColumnsForCalc = (json.columns as unknown[]).filter((col): col is Record<string, unknown> => {
      const colTyped = col as Record<string, unknown>;
      const type = colTyped.type;
      return (
        type === "AGGREGATE" ||
        type === "NUMBER" ||
        (type === "CALCULATED" && !!colTyped.format)
      );
    });

    json.columns = (json.columns as unknown[]).map((col): Record<string, unknown> => {
      const colTyped = col as Record<string, unknown>;
      if (colTyped.type === "CALCULATED") {
        let finalSourceFieldIds = (colTyped.sourceFieldIds as string[]) && (colTyped.sourceFieldIds as string[]).length > 0
          ? (colTyped.sourceFieldIds as string[])
          : [];

        if (finalSourceFieldIds.length === 0) {
          const sourceCols = numericColumnsForCalc.filter(
            (c) => ((c.position as number) < (colTyped.position as number))
          );
          finalSourceFieldIds = sourceCols
            .map((c) => c.fieldId as string)
            .filter(Boolean);
        }

        let finalFieldMapping = (colTyped.fieldMapping as Record<string, string>) && Object.keys(colTyped.fieldMapping as Record<string, string>).length > 0
          ? (colTyped.fieldMapping as Record<string, string>)
          : {};

        if (Object.keys(finalFieldMapping).length === 0 && finalSourceFieldIds.length > 0) {
          finalFieldMapping = {};
          finalSourceFieldIds.forEach((fieldId: string, index: number) => {
            const letter = String.fromCharCode(65 + index);
            finalFieldMapping[letter] = fieldId;
          });
        }

        return {
          ...colTyped,
          sourceFieldIds: finalSourceFieldIds,
          fieldMapping: finalFieldMapping,
        };
      }

      return colTyped;
    });

    const calculatedCols = (json.columns as unknown[]).filter((col): col is Record<string, unknown> => {
      const colTyped = col as Record<string, unknown>;
      return Boolean(
        colTyped.type === "CALCULATED" && 
        (colTyped.format || colTyped.timeFormat) && 
        (colTyped.sourceFieldIds as string[]) && 
        (colTyped.sourceFieldIds as string[]).length > 0
      );
    });

    json.columns = (json.columns as unknown[]).map((col): Record<string, unknown> => {
      const colTyped = col as Record<string, unknown>;
      if (colTyped.type === "AGGREGATE" && !colTyped.format && !colTyped.timeFormat) {
        for (const calcCol of calculatedCols) {
          const calcColAny = calcCol as Record<string, unknown>;
          if (
            (calcColAny.sourceFieldIds as string[]) &&
            Array.isArray(calcColAny.sourceFieldIds) &&
            (calcColAny.sourceFieldIds as string[]).includes(colTyped.fieldId as string)
          ) {
            const updatedCol: Record<string, unknown> = { ...colTyped };
            if (calcColAny.format) {
              updatedCol.format = calcColAny.format;
            }
            if (calcColAny.timeFormat) {
              updatedCol.timeFormat = calcColAny.timeFormat;
            }
            return updatedCol;
          }
        }
      }

      return colTyped;
    });
  }

  if (json.totalRows && json.totalRows.length > 0) {
      const numericColumnsForTotals = ((json.columns || []) as unknown[]).filter((col): col is Record<string, unknown> => {
        const colTyped = col as Record<string, unknown>;
        const format = ((colTyped.format as string) || '').toLowerCase();
        // Exclude non-summable day text columns
        if (format === 'day_text') return false;

        // Include explicitly-marked columns, numeric, aggregate or calculated columns.
        // Important: do NOT include plain TIME/DATETIME columns even if includeInTotals is true.
        // Only include time-like columns if they have a timeFormat (i.e., represent durations or calculated time values).
        const type = (colTyped.type || '').toString().toUpperCase();
        const isTimeType = type === 'TIME' || type === 'DATETIME';
        const includeFlag = (colTyped as any).includeInTotals === true;
        const fmt = (colTyped.format as string) || '';
        const isDurationFormat = DURATION_FORMATS.has(fmt.toString());

        // Exclude plain time-of-day fields (TIME/DATETIME) unless they use a duration format
        if (isTimeType && !isDurationFormat) {
          return false;
        }

        return (
          type === "AGGREGATE" ||
          type === "CALCULATED" ||
          type === "NUMBER" ||
          (includeFlag && !isTimeType) ||
          isDurationFormat
        );
      });

    json.totalRows = (json.totalRows as unknown[]).map((tr): Record<string, unknown> => {
      const trTyped = tr as Record<string, unknown>;
      let columnsForTotal = (trTyped.columns as unknown[]) || [];

      if (!columnsForTotal || columnsForTotal.length === 0) {
        columnsForTotal = numericColumnsForTotals.map((col): Record<string, unknown> => {
          const colAny = col as Record<string, unknown>;
          const type = (trTyped.type || "SUM") as TotalRowType;
          const aggregationType =
            type === TotalRowType.SUM
              ? "SUM"
              : type === TotalRowType.AVG
              ? "AVG"
              : type === TotalRowType.COUNT
              ? "COUNT"
              : type === TotalRowType.MIN
              ? "MIN"
              : type === TotalRowType.MAX
              ? "MAX"
              : (colAny.aggregationType as string)?.toUpperCase();

          return {
            fieldId: colAny.fieldId,
            aggregationType,
            format: colAny.format,
            timeFormat: colAny.timeFormat,
          };
        });
      }

      columnsForTotal = (columnsForTotal as unknown[]).map((col): Record<string, unknown> => {
        const colTyped = col as Record<string, unknown>;
        const sourceCol = numericColumnsForTotals.find(
          (c) => c.fieldId === colTyped.fieldId
        );
        
        let formatToUse = colTyped.format as string | undefined;
        let timeFormatToUse = colTyped.timeFormat as string | undefined;
        
        if (sourceCol) {
          const sourceColAny = sourceCol as Record<string, unknown>;
          if (sourceColAny.format !== undefined) {
            formatToUse = sourceColAny.format as string;
          }
          if (sourceColAny.timeFormat !== undefined) {
            timeFormatToUse = sourceColAny.timeFormat as string;
          }
        }
        
        if (!formatToUse && !timeFormatToUse) {
          const calculatedCols = numericColumnsForTotals.filter(
            (c) => {
              const cTyped = c as Record<string, unknown>;
              return cTyped.type === "CALCULATED" && (cTyped.sourceFieldIds as string[]) && Array.isArray(cTyped.sourceFieldIds);
            }
          );
          
          for (const calcCol of calculatedCols) {
            const calcColAny = calcCol as Record<string, unknown>;
            if (
              (calcColAny.sourceFieldIds as string[]) &&
              (calcColAny.sourceFieldIds as string[]).includes(colTyped.fieldId as string) &&
              (calcColAny.format || calcColAny.timeFormat)
            ) {
              if (calcColAny.format && !formatToUse) {
                formatToUse = calcColAny.format as string;
              }
              if (calcColAny.timeFormat && !timeFormatToUse) {
                timeFormatToUse = calcColAny.timeFormat as string;
              }
              break;
            }
          }
        }
        
        const updatedCol: Record<string, unknown> = {
          ...colTyped,
          aggregationType: (colTyped.aggregationType as string)?.toUpperCase() || colTyped.aggregationType,
        };
        
        if (formatToUse !== undefined) {
          updatedCol.format = formatToUse;
        }
        if (timeFormatToUse !== undefined) {
          updatedCol.timeFormat = timeFormatToUse;
        }
        
        return updatedCol;
      });

      // Remove day_text columns (not summable) and ensure TIME/includeInTotals columns are present
      columnsForTotal = (columnsForTotal as unknown[]).filter((c) => {
        const cTyped = c as Record<string, unknown>;
        const fmt = ((cTyped.format as string) || '').toLowerCase();
        return fmt !== 'day_text';
      });

      // Find missing numeric/time columns that should be included
      const existingFieldIds = new Set(
        (columnsForTotal as unknown[])
          .map((c) => (c as Record<string, unknown>).fieldId)
          .filter(Boolean) as string[],
      );

      const additionalCols = (numericColumnsForTotals as Record<string, unknown>[]).filter((nc) => {
        const ncId = nc.fieldId as string;
        if (!ncId) return false;
        if (existingFieldIds.has(ncId)) return false;
        const type = ((nc.type as string) || '').toUpperCase();
        const isTimeType = type === 'TIME' || type === 'DATETIME';
        const includeFlag = (nc as any).includeInTotals === true;
        const ncFmt = ((nc.format as string) || '').toString();
        const isDuration = DURATION_FORMATS.has(ncFmt);
        // Only add if explicitly marked for totals AND not a plain time type, or if it has a duration format
        return (includeFlag && !isTimeType) || isDuration;
      }).map((nc) => {
        return {
          fieldId: nc.fieldId,
          aggregationType: (trTyped.type as string) === 'SUM' ? 'SUM' : ((trTyped.type as string) || 'SUM'),
          format: nc.format,
          timeFormat: nc.timeFormat,
        } as Record<string, unknown>;
      });

      const result: Record<string, unknown> = {
        ...trTyped,
        columns: [...columnsForTotal, ...additionalCols],
      };
      
      // Preservar groupBy, labelTemplate y showGroupContext si existen
      if (trTyped.groupBy) {
        result.groupBy = trTyped.groupBy;
      }
      if (trTyped.labelTemplate) {
        result.labelTemplate = trTyped.labelTemplate;
      }
      if (trTyped.showGroupContext !== undefined) {
        result.showGroupContext = trTyped.showGroupContext;
      }
      
      return result;
    });
  }

  // Final sanitization: ensure totalRows do not contain date or plain time-of-day columns
  if (json.totalRows && Array.isArray(json.totalRows)) {
    const allJsonCols = (json.columns as Record<string, unknown>[]) || [];
    json.totalRows = (json.totalRows as Record<string, unknown>[]).map((tr) => {
      const trCopy = { ...tr } as Record<string, unknown>;
      const cols = (trCopy.columns as Record<string, unknown>[]) || [];
      const filtered = cols.filter((c) => {
        const fieldId = (c as any).fieldId as string | undefined;
        if (!fieldId) return false;
        const src = allJsonCols.find((jc) => (jc.fieldId as string) === fieldId);
        if (!src) return true; // keep unknowns

        const srcFormat = ((src.format as string) || '').toLowerCase();
        const srcType = ((src.type as string) || '').toString().toUpperCase();
        const srcTags: string[] = Array.isArray(src.tags) ? (src.tags as string[]) : [];

        // exclude day_text
        if (srcFormat === 'day_text') return false;

        // exclude plain time/datetime fields (time of day) unless their format is a duration
        if ((srcType === 'TIME' || srcType === 'DATETIME') && !DURATION_FORMATS.has(srcFormat)) return false;

        // exclude consolidated date fields
        if (srcType === 'CONSOLIDATED') {
          const tagsStr = srcTags.join(' ');
          if (tagsStr.includes('assistance.day') || tagsStr.includes('assistance.month') || tagsStr.includes('assistance.year') || tagsStr.includes('assistance.date')) {
            return false;
          }
        }

        return true;
      });

      return {
        ...trCopy,
        columns: filtered,
      };
    });
  }

  // Ensure json.columns never mark plain time-of-day or consolidated date columns as includeInTotals
  if (Array.isArray(json.columns)) {
    json.columns = (json.columns as Record<string, unknown>[]).map((col) => {
      const c = { ...col } as Record<string, unknown>;
      const type = ((c.type as string) || "").toString().toUpperCase();
      const fmt = ((c.format as string) || "").toLowerCase();
      const tags: string[] = Array.isArray(c.tags) ? (c.tags as string[]) : [];

      // If plain day text or date consolidated, never include in totals
      if (fmt === "day_text" || type === "DATE") {
        c.includeInTotals = false;
        return c;
      }

      // If consolidated field built from assistance day/month/year, never include
      if (type === "CONSOLIDATED") {
        const tagsStr = tags.join(" ");
        if (tagsStr.includes("assistance.day") || tagsStr.includes("assistance.month") || tagsStr.includes("assistance.year") || tagsStr.includes("assistance.date")) {
          c.includeInTotals = false;
          return c;
        }
      }

      // If it's a time-of-day field (TIME/DATETIME) that is not a duration format, never include
      if ((type === "TIME" || type === "DATETIME") && !DURATION_FORMATS.has(fmt)) {
        c.includeInTotals = false;
        return c;
      }

      return c;
    });
  }

  return JSON.stringify(json, null, 2);
};
