import { CalculationType } from "../dto/modal-props.dto";
import { FIELD_CATEGORIES, FieldCategory, ReportField, SAMPLE_DATA, TotalRow } from "../report.dto";
import { evaluateCustomFormula } from "../utils/calculation-utils";
import { formatFieldValue } from "../utils/format-utils";

export const getCalculatedFieldNumericValue = (
  field: ReportField,
  row: Record<string, unknown>,
  rowIndex: number,
  previewFields: ReportField[],
  visited?: Set<string>
): number | null => {
  // Only proceed for calculated fields (or fields declared with type

  if (!field.isCalculated && field.type !== "CALCULATED") return null;

  const sourceIdsFromArray: string[] | undefined = (field as any).calculatedFieldIds || (field as any).sourceFieldIds || (field as any).sourceFieldId;
  const fieldMapping: Record<string, string> | undefined = (field as any).fieldMapping;

  const sourceFieldIds: string[] = [];
  if (Array.isArray(sourceIdsFromArray) && sourceIdsFromArray.length > 0) {
    sourceFieldIds.push(...sourceIdsFromArray);
  }
  if (fieldMapping && typeof fieldMapping === "object") {
    const keys = Object.keys(fieldMapping);
    keys.forEach((k) => {
      const id = fieldMapping[k];
      if (id) sourceFieldIds.push(id);
    });
  }

  if (sourceFieldIds.length === 0) return null;

  const allFields = Object.values(FIELD_CATEGORIES).flatMap(
    (category) => category.fields
  );

  // Only use the selected fields for calculation. Preserve order from the
  const coercedValuesWithNulls = sourceFieldIds
    .map((fieldId) => {
      let sourceField = previewFields.find((f) => f.id === fieldId);
      if (!sourceField) {
        sourceField = allFields.find((f) => f.id === fieldId);
      }
      if (!sourceField) {
        return null;
      }
      // If the source field is itself calculated, compute it recursively
      if ((sourceField.isCalculated || sourceField.type === "CALCULATED")) {
        // detect cycles
        const newVisited = new Set(visited ? Array.from(visited) : []);
        if (newVisited.has(sourceField.id)) {
          return null;
        }
        newVisited.add(sourceField.id);
        const nested = getCalculatedFieldNumericValue(sourceField, row, rowIndex, previewFields, newVisited);
        return nested;
      }
      let sourceRawValue: unknown = undefined;
      if (sourceField.category === FieldCategory.OVERTIME) {
        const overtimeKey = `overtime_${sourceField.name}` as keyof typeof row;
        sourceRawValue = row[overtimeKey];
        if (sourceRawValue === undefined || sourceRawValue === null) {
          const overtimeExamples: Record<string, number[]> = {
            aditionHoursBeforeMinutes: [300, 0, 300],
            aditionHoursAfterMinutes: [180, 240, 90],
          };
          const exampleValues = overtimeExamples[sourceField.name] || [0];
          sourceRawValue = exampleValues[rowIndex] || 0;
        }
      } else if (sourceField.category === FieldCategory.HOLIDAY) {
        const holidayKey = `holiday_${sourceField.name}` as keyof typeof row;
        sourceRawValue = row[holidayKey];
      } else {
        sourceRawValue = row[sourceField.name as keyof typeof row];
      }
      // Try to coerce various source formats into a numeric value
      const parseNumeric = (val: unknown, sf?: ReportField): number | null => {
        if (typeof val === "number") {
          // If the source field name indicates minutes, convert to hours (decimal)
          if (sf && sf.name && typeof sf.name === "string" && sf.name.toLowerCase().includes("min")) {
            return (val as number) / 60;
          }
          return val;
        }
        if (typeof val === "string") {
          const trimmed = val.trim();
          // formats like "123" or "1.23"
          const asNumber = parseFloat(trimmed.replace(/,/g, "."));
          if (!isNaN(asNumber)) return asNumber;

          // formats like "5 min" or "0 min"
          const minMatch = trimmed.match(/(-?\d+(?:\.\d+)?)\s*min/);
          if (minMatch) return parseFloat(minMatch[1]) / 60;

          // time format HH:mm or H:mm -> convert to minutes
          const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            // convert to decimal hours
            return hours + minutes / 60;
          }
        }
        return null;
      };

      const coerced = parseNumeric(sourceRawValue, sourceField);
      if (coerced !== null) return coerced;
      return null;
    });

  if (!coercedValuesWithNulls || coercedValuesWithNulls.length === 0) return null;

  const calculatedValues =
    field.calculationType === CalculationType.CUSTOM
      ? coercedValuesWithNulls.map((v) => (v === null ? 0 : v))
      : coercedValuesWithNulls.filter((v): v is number => v !== null && typeof v === "number");

  if (calculatedValues.length === 0) return null;

  let calculatedResult: number;
  if (
    field.calculationType === CalculationType.CUSTOM &&
    field.formula &&
    field.formula.trim() !== ""
  ) {
    // evaluator replace named fields if the formula references them.
    const fieldNamesFromArray: string[] = Array.isArray(field.calculatedFields)
      ? field.calculatedFields
      : [];
    const mappingNames: string[] = fieldMapping
      ? Object.keys(fieldMapping).sort()
      : [];
    const fieldNames = fieldNamesFromArray.length === calculatedValues.length
      ? fieldNamesFromArray
      : mappingNames.length === calculatedValues.length
      ? mappingNames
      : fieldNamesFromArray;

    calculatedResult = evaluateCustomFormula({
      formula: field.formula,
      values: calculatedValues,
      fieldNames,
    });
  } else {
    switch (field.calculationType || CalculationType.SUM) {
      case CalculationType.SUM:
        calculatedResult = calculatedValues.reduce((a, b) => a + b, 0);
        break;
      case CalculationType.SUBTRACT:
        calculatedResult = calculatedValues.reduce((a, b) => a - b);
        break;
      case CalculationType.MULTIPLY:
        calculatedResult = calculatedValues.reduce((a, b) => a * b, 1);
        break;
      case CalculationType.DIVIDE:
        calculatedResult =
          calculatedValues.length > 1
            ? calculatedValues.reduce((a, b) => a / b)
            : calculatedValues[0];
        break;
      case CalculationType.AVERAGE:
        calculatedResult =
          calculatedValues.reduce((a, b) => a + b, 0) / calculatedValues.length;
        break;
      default:
        calculatedResult = calculatedValues.reduce((a, b) => a + b, 0);
    }
  }

  return calculatedResult;
};

export const calculateTotal = (
  field: ReportField,
  totalRow: TotalRow,
  previewFields: ReportField[],
  groupData?: Record<string, unknown>[]
): string => {
  const column = totalRow.columns.find(
    (col) => col.fieldId === field.id
  );
  
  if (!column) {
    return "";
  }
  
  const normalizedAggType = column.aggregationType?.toLowerCase() || "";
  if (normalizedAggType === "none") {
    return "";
  }

  const values: number[] = [];
  const dataToUse = groupData || SAMPLE_DATA.slice(0, 5);
  dataToUse.forEach((row, rowIndex) => {
    const previewIndex = (row as any).__previewIndex ?? rowIndex;
    let rawValue: unknown = undefined;

    if (field.isConsolidated) {
      return;
    }

    if (field.isCalculated || field.type === "CALCULATED") {
      const calculatedValue = getCalculatedFieldNumericValue(field, row, previewIndex, previewFields);
      if (calculatedValue !== null) {
        rawValue = calculatedValue;
      } else {
        return;
      }
    } else if (field.category === FieldCategory.OVERTIME) {
      const overtimeKey = `overtime_${field.name}` as keyof typeof row;
      rawValue = row[overtimeKey];
      if (rawValue === undefined || rawValue === null) {
        const overtimeExamples: Record<string, number[]> = {
          aditionHoursBeforeMinutes: [300, 0, 300],
          aditionHoursAfterMinutes: [180, 240, 90],
        };
        const exampleValues = overtimeExamples[field.name] || [0];
        rawValue = exampleValues[previewIndex] || 0;
      }
      
    } else if (field.category === FieldCategory.ABSENCE) {
      const absenceExamples = [
        {
          startDate: "2024-01-15",
          endDate: "2024-01-29",
          status: "APPROVED",
          absenceType: "Vacaciones",
          reason: "Vacaciones de verano",
          totalDays: 15,
        },
        {
          startDate: "2024-01-10",
          endDate: "2024-01-12",
          status: "APPROVED",
          absenceType: "Enfermedad",
          reason: "Gripe",
          totalDays: 3,
        },
        {
          startDate: "2024-01-20",
          endDate: "2024-01-20",
          status: "PENDING",
          absenceType: "Permiso",
          reason: "Permiso médico",
          totalDays: 1,
        },
      ];
      const example =
        absenceExamples[rowIndex] || absenceExamples[0];
      if (
        field.name === "startDate" ||
        field.name === "endDate" ||
        field.name === "status" ||
        field.name === "absenceType" ||
        field.name === "reason" ||
        field.name === "totalDays"
      ) {
        rawValue = example[field.name as keyof typeof example];
      } else {
        rawValue = row[field.name as keyof typeof row];
      }
    } else if (field.category === FieldCategory.HOLIDAY) {
      const holidayKey = `holiday_${field.name}` as keyof typeof row;
      rawValue = row[holidayKey];
    } else if (
      field.category === FieldCategory.SCHEDULE &&
      field.name === "totalHours"
    ) {
      const scheduleHours = [45, 32, 40];
      rawValue = scheduleHours[rowIndex] || 45;
    } else {
      rawValue = row[field.name as keyof typeof row];
    }


    if (
      rawValue !== undefined &&
      rawValue !== null &&
      typeof rawValue === "number"
    ) {
      values.push(rawValue);
    }
  });

  if (values.length === 0) return "";

  const aggType = (column.aggregationType || "").toLowerCase();
  
  let result: number;
  switch (aggType) {
    case "sum":
      result = values.reduce((a, b) => a + b, 0);
      break;
    case "avg":
      result =
        values.reduce((a, b) => a + b, 0) / values.length;
      break;
    case "count":
      result = values.length;
      break;
    case "min":
      result = Math.min(...values);
      break;
    case "max":
      result = Math.max(...values);
      break;
    default:
      return "";
  }

  const fieldWithFormat: ReportField = {
    ...field,
    format: column.format || field.format,
    isCalculated: false,
  };

  return formatFieldValue(
    result,
    fieldWithFormat,
    {},
    0,
    Object.values(FIELD_CATEGORIES).flatMap(
      (category) => category.fields
    ),
    previewFields
  );
};
