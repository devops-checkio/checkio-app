import { FormatOptionDto } from "../dto/format-options.dto";
import { CalculationType } from "../dto/modal-props.dto";
import { FIELD_CATEGORIES, FieldCategory, ReportField } from "../report.dto";
import { evaluateCustomFormula } from "./calculation-utils";

export interface GetFormatOptionsParams {
  field: ReportField;
  reportFields?: ReportField[];
}

const extractValueFromTag = (
  tag: string,
  row: Record<string, unknown>
): unknown => {
  if (tag === "assistance.Schedule.contractedHours") {
    const assistance = row.Assistance as Record<string, unknown> | undefined;
    if (assistance && typeof assistance === "object") {
      const schedule = assistance.Schedule as Record<string, unknown> | undefined;
      if (schedule && typeof schedule === "object") {
        const workHours = (schedule.workHours as number | undefined) || 0;
        const workMinutes = (schedule.workMinutes as number | undefined) || 0;
        return workHours + workMinutes / 60;
      }
    }
    return 0;
  }

  if (tag === "assistance.Marks.actualWorkedHours") {
    const assistance = row.Assistance as Record<string, unknown> | undefined;
    if (assistance && typeof assistance === "object") {
      const marks = assistance.Marks as Array<Record<string, unknown>> | undefined;
      if (marks && Array.isArray(marks)) {
        const checkInMark = marks.find(
          (m) => m.type === "CHECK_IN" && (m.scheduleBreakId === null || m.scheduleBreakId === undefined)
        );
        const checkOutMark = marks.find(
          (m) => m.type === "CHECK_OUT" && (m.scheduleBreakId === null || m.scheduleBreakId === undefined)
        );
        if (checkInMark && checkOutMark) {
          const checkInTimestamp = checkInMark.timestamp;
          const checkOutTimestamp = checkOutMark.timestamp;
          if (checkInTimestamp && checkOutTimestamp) {
            const checkInDate = checkInTimestamp instanceof Date
              ? checkInTimestamp
              : new Date(checkInTimestamp as string);
            const checkOutDate = checkOutTimestamp instanceof Date
              ? checkOutTimestamp
              : new Date(checkOutTimestamp as string);
            const diffMs = checkOutDate.getTime() - checkInDate.getTime();
            return diffMs / (1000 * 60 * 60);
          }
        }
      }
    }
    return 0;
  }

  if (tag === "assistance.Marks.overtimeHours") {
    const assistance = row.Assistance as Record<string, unknown> | undefined;
    if (assistance && typeof assistance === "object") {
      return assistance.overtimeHours as number | undefined || 0;
    }
    return 0;
  }

  if (tag === "assistance.Marks.delayHours") {
    const assistance = row.Assistance as Record<string, unknown> | undefined;
    if (assistance && typeof assistance === "object") {
      return assistance.delayHours as number | undefined || 0;
    }
    return 0;
  }

  if (tag === "assistance.Marks.earlyExitHours") {
    const assistance = row.Assistance as Record<string, unknown> | undefined;
    if (assistance && typeof assistance === "object") {
      return assistance.earlyExitHours as number | undefined || 0;
    }
    return 0;
  }

  if (tag === "assistance.Schedule.startTime" || tag === "Assistance.Schedule.startTime") {
    const assistance = (row.Assistance || row.assistance) as Record<string, unknown> | undefined;
    if (assistance && typeof assistance === "object") {
      const schedule = (assistance.Schedule || assistance.schedule) as Record<string, unknown> | undefined;
      if (schedule && typeof schedule === "object") {
        return schedule.startTime;
      }
    }
    return undefined;
  }

  if (tag === "assistance.Schedule.endTime" || tag === "Assistance.Schedule.endTime") {
    const assistance = (row.Assistance || row.assistance) as Record<string, unknown> | undefined;
    if (assistance && typeof assistance === "object") {
      const schedule = (assistance.Schedule || assistance.schedule) as Record<string, unknown> | undefined;
      if (schedule && typeof schedule === "object") {
        return schedule.endTime;
      }
    }
    return undefined;
  }

  const parts = tag.split(".");
  
  if (parts.length === 2) {
    const [tableName, fieldName] = parts;
    const normalizedTableName = tableName.charAt(0).toUpperCase() + tableName.slice(1).toLowerCase();
    const tableObj = (row[tableName] || row[normalizedTableName]) as Record<string, unknown> | undefined;
    if (tableObj && typeof tableObj === "object") {
      return tableObj[fieldName];
    }
  }
  
  if (parts.length >= 3) {
    const [tableName, nestedRelation, ...restParts] = parts;
    const normalizedTableName = tableName.charAt(0).toUpperCase() + tableName.slice(1).toLowerCase();
    const tableObj = (row[tableName] || row[normalizedTableName]) as Record<string, unknown> | undefined;
    
    if (!tableObj || typeof tableObj !== "object") {
      return undefined;
    }
    
    if (nestedRelation === "Schedule" || nestedRelation === "schedule") {
      const schedule = (tableObj.Schedule || tableObj.schedule) as Record<string, unknown> | undefined;
      if (schedule && typeof schedule === "object") {
        const fieldName = restParts.join(".");
        if (fieldName === "endTime") {
          const startTime = schedule.startTime;
          const workHours = schedule.workHours as number | undefined;
          const workMinutes = schedule.workMinutes as number | undefined;
          
          if (startTime && (workHours !== undefined || workMinutes !== undefined)) {
            try {
              const startDate = startTime instanceof Date
                ? startTime
                : new Date(startTime as string);
              const totalMinutes = (workHours || 0) * 60 + (workMinutes || 0);
              const endDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);
              return endDate.toISOString();
            } catch {
              return undefined;
            }
          }
        }
        return schedule[fieldName];
      }
    }
    
    if (nestedRelation === "Marks" || nestedRelation === "marks") {
      const marks = (tableObj.Marks || tableObj.marks) as Array<Record<string, unknown>> | undefined;
      if (marks && Array.isArray(marks)) {
        const markTagMatch = tag.match(/\[([^\]]+)\]\.(.+)$/);
        if (markTagMatch) {
          const filters = markTagMatch[1];
          const fieldName = markTagMatch[2];
          
          if (filters.includes("type=CHECK_IN&noBreak")) {
            const mark = marks.find(
              (m) => m.type === "CHECK_IN" && (m.scheduleBreakId === null || m.scheduleBreakId === undefined)
            );
            return mark?.[fieldName];
          }
          if (filters.includes("type=CHECK_OUT&noBreak")) {
            const mark = marks.find(
              (m) => m.type === "CHECK_OUT" && (m.scheduleBreakId === null || m.scheduleBreakId === undefined)
            );
            return mark?.[fieldName];
          }
          if (filters.includes("type=CHECK_IN&breakType=LUNCH")) {
            const mark = marks.find((m) => {
              const scheduleBreak = m.ScheduleBreak as Record<string, unknown> | undefined;
              return m.type === "CHECK_IN" && scheduleBreak?.type === "LUNCH";
            });
            return mark?.[fieldName];
          }
          if (filters.includes("type=CHECK_OUT&breakType=LUNCH")) {
            const mark = marks.find((m) => {
              const scheduleBreak = m.ScheduleBreak as Record<string, unknown> | undefined;
              return m.type === "CHECK_OUT" && scheduleBreak?.type === "LUNCH";
            });
            return mark?.[fieldName];
          }
          if (filters.includes("type=CHECK_IN&breakType=BREAK")) {
            const mark = marks.find((m) => {
              const scheduleBreak = m.ScheduleBreak as Record<string, unknown> | undefined;
              return m.type === "CHECK_IN" && scheduleBreak?.type === "BREAK";
            });
            return mark?.[fieldName];
          }
          if (filters.includes("type=CHECK_OUT&breakType=BREAK")) {
            const mark = marks.find((m) => {
              const scheduleBreak = m.ScheduleBreak as Record<string, unknown> | undefined;
              return m.type === "CHECK_OUT" && scheduleBreak?.type === "BREAK";
            });
            return mark?.[fieldName];
          }
        } else {
          const fieldName = restParts[restParts.length - 1];
          
          if (tag.includes("type=CHECK_IN&noBreak")) {
            const mark = marks.find(
              (m) => m.type === "CHECK_IN" && (m.scheduleBreakId === null || m.scheduleBreakId === undefined)
            );
            return mark?.[fieldName];
          }
          if (tag.includes("type=CHECK_OUT&noBreak")) {
            const mark = marks.find(
              (m) => m.type === "CHECK_OUT" && (m.scheduleBreakId === null || m.scheduleBreakId === undefined)
            );
            return mark?.[fieldName];
          }
          if (tag.includes("type=CHECK_IN&breakType=LUNCH")) {
            const mark = marks.find((m) => {
              const scheduleBreak = m.ScheduleBreak as Record<string, unknown> | undefined;
              return m.type === "CHECK_IN" && scheduleBreak?.type === "LUNCH";
            });
            return mark?.[fieldName];
          }
          if (tag.includes("type=CHECK_OUT&breakType=LUNCH")) {
            const mark = marks.find((m) => {
              const scheduleBreak = m.ScheduleBreak as Record<string, unknown> | undefined;
              return m.type === "CHECK_OUT" && scheduleBreak?.type === "LUNCH";
            });
            return mark?.[fieldName];
          }
          if (tag.includes("type=CHECK_IN&breakType=BREAK")) {
            const mark = marks.find((m) => {
              const scheduleBreak = m.ScheduleBreak as Record<string, unknown> | undefined;
              return m.type === "CHECK_IN" && scheduleBreak?.type === "BREAK";
            });
            return mark?.[fieldName];
          }
          if (tag.includes("type=CHECK_OUT&breakType=BREAK")) {
            const mark = marks.find((m) => {
              const scheduleBreak = m.ScheduleBreak as Record<string, unknown> | undefined;
              return m.type === "CHECK_OUT" && scheduleBreak?.type === "BREAK";
            });
            return mark?.[fieldName];
          }
        }
      }
    }
  }
  
  return undefined;
};

export const getFormatOptionsForField = ({
  field,
  reportFields = [],
}: GetFormatOptionsParams): FormatOptionDto[] => {
  if (
    field.isCalculated &&
    field.calculatedFieldIds &&
    field.calculatedFieldIds.length > 0
  ) {
    let selectedFieldsData = field.calculatedFieldIds
      .map((fieldId) => reportFields.find((f) => f.id === fieldId))
      .filter((f): f is ReportField => f !== undefined);

    if (selectedFieldsData.length === 0) {
      const allFields = Object.values(FIELD_CATEGORIES).flatMap(
        (category) => category.fields
      );
      selectedFieldsData = field.calculatedFieldIds
        .map((fieldId) => allFields.find((f) => f.id === fieldId))
        .filter((f) => f !== undefined) as ReportField[];
    }

    if (
      selectedFieldsData.length === 0 &&
      field.calculatedFields &&
      field.calculatedFields.length > 0
    ) {
      const allFields = Object.values(FIELD_CATEGORIES).flatMap(
        (category) => category.fields
      );
      selectedFieldsData = field.calculatedFields
        .map((fieldName) => {
          const inReport = reportFields.find((f) => f.name === fieldName);
          if (inReport) return inReport;
          return allFields.find((f) => f.name === fieldName);
        })
        .filter((f): f is ReportField => f !== undefined);
    }

    const hasMinutesField = selectedFieldsData.some(
      (f) =>
        f.name?.toLowerCase().includes("minutes") ||
        f.name?.toLowerCase().includes("minutos") ||
        f.displayName?.toLowerCase().includes("minutos")
    );

    const hasHoursField = selectedFieldsData.some(
      (f) =>
        f.name?.toLowerCase().includes("hour") ||
        f.name?.toLowerCase().includes("hora") ||
        f.displayName?.toLowerCase().includes("hora")
    );

    if (hasMinutesField) {
      return [
        { value: "minutes", label: "Por Minutos → 300 min" },
        { value: "hours_hhmm", label: "Por Horas (HH:mm) → 05:00" },
        { value: "hours_decimal", label: "Por Horas Decimales → 5.00 hrs" },
        {
          value: "hours_decimal_no_unit",
          label: "Por Horas (sin unidad) → 5.00",
        },
        { value: "decimal", label: "Decimal → 300.00" },
      ];
    }

    if (hasHoursField) {
      return [
        { value: "default", label: "Número Estándar → 9.08" },
        { value: "hours_hhmm", label: "Por Horas (HH:mm) → 09:05" },
        { value: "hours_decimal", label: "Por Horas Decimales → 9.08 hrs" },
        {
          value: "hours_decimal_no_unit",
          label: "Por Horas (sin unidad) → 9.08",
        },
        { value: "hours_minutes", label: "Por Minutos → 545 min" },
      ];
    }
  }

  const isLunchDurationField =
    field.name === "lunchDuration" ||
    field.displayName.toLowerCase().includes("duración de colación") ||
    field.displayName.toLowerCase().includes("colación");

  if (isLunchDurationField) {
    return [
      { value: "decimal", label: "Decimal en Horas → 1.00" },
      { value: "hours_hhmm", label: "Por Hora (HH:mm) → 01:00" },
      { value: "lunch_minutes", label: "Decimal en Minutos → 60 min" },
    ];
  }

  const isHoursField =
    field.type === "number" &&
    (field.name.toLowerCase().includes("hour") ||
      field.name.toLowerCase().includes("hora") ||
      field.displayName.toLowerCase().includes("hora"));

  if (isHoursField) {
    return [
      { value: "default", label: "Número Estándar → 9.08" },
      { value: "hours_hhmm", label: "Por Horas (HH:mm) → 09:05" },
      { value: "hours_decimal", label: "Por Horas Decimales → 9.08 hrs" },
      {
        value: "hours_decimal_no_unit",
        label: "Por Horas (sin unidad) → 9.08",
      },
      { value: "hours_minutes", label: "Por Minutos → 545 min" },
    ];
  }

  if (field.type === "date") {
    return [
      {
        value: "date_only",
        label: "--- Solo Fecha ---",
        disabled: true,
      },
      { value: "dd/MM/yyyy", label: "dd/MM/yyyy (15/01/2024)" },
      { value: "dd-MM-yyyy", label: "dd-MM-yyyy (15-01-2024)" },
      { value: "yyyy-MM-dd", label: "yyyy-MM-dd (2024-01-15)" },
      { value: "dd/MM/yy", label: "dd/MM/yy (15/01/24)" },
      { value: "dd MMM yyyy", label: "dd MMM yyyy (15 Ene 2024)" },
      { value: "dd MMMM yyyy", label: "dd MMMM yyyy (15 Enero 2024)" },
      {
        value: "separator_1",
        label: "--- Fecha y Hora ---",
        disabled: true,
      },
      {
        value: "dd/MM/yyyy HH:mm",
        label: "dd/MM/yyyy HH:mm (15/01/2024 08:30)",
      },
      {
        value: "dd-MM-yyyy HH:mm",
        label: "dd-MM-yyyy HH:mm (15-01-2024 08:30)",
      },
      {
        value: "yyyy-MM-dd HH:mm",
        label: "yyyy-MM-dd HH:mm (2024-01-15 08:30)",
      },
      {
        value: "dd/MM/yyyy hh:mm A",
        label: "dd/MM/yyyy hh:mm A (15/01/2024 08:30 AM)",
      },
      {
        value: "dd/MM/yyyy HH:mm:ss",
        label: "dd/MM/yyyy HH:mm:ss (15/01/2024 08:30:45)",
      },
    ];
  }

  if (field.type === "time") {
    return [
      { value: "HH:mm", label: "HH:mm (08:30)" },
      { value: "hh:mm A", label: "hh:mm A (08:30 AM)" },
      { value: "HH:mm:ss", label: "HH:mm:ss (08:30:45)" },
      { value: "H:mm", label: "H:mm (8:30)" },
      { value: "h:mm A", label: "h:mm A (8:30 AM)" },
    ];
  }

  if (field.type === "datetime") {
    return [
      {
        value: "date_only",
        label: "--- Solo Fecha ---",
        disabled: true,
      },
      {
        value: "dd/MM/yyyy",
        label: "dd/MM/yyyy (15/01/2024)",
      },
      {
        value: "dd-MM-yyyy",
        label: "dd-MM-yyyy (15-01-2024)",
      },
      {
        value: "yyyy-MM-dd",
        label: "yyyy-MM-dd (2024-01-15)",
      },
      {
        value: "dd/MM/yy",
        label: "dd/MM/yy (15/01/24)",
      },
      {
        value: "separator_1",
        label: "--- Solo Hora ---",
        disabled: true,
      },
      {
        value: "HH:mm",
        label: "HH:mm (08:30)",
      },
      {
        value: "hh:mm A",
        label: "hh:mm A (08:30 AM)",
      },
      {
        value: "HH:mm:ss",
        label: "HH:mm:ss (08:30:45)",
      },
      {
        value: "H:mm",
        label: "H:mm (8:30)",
      },
      {
        value: "h:mm A",
        label: "h:mm A (8:30 AM)",
      },
      {
        value: "separator_2",
        label: "--- Fecha y Hora ---",
        disabled: true,
      },
      {
        value: "dd/MM/yyyy HH:mm",
        label: "dd/MM/yyyy HH:mm (15/01/2024 08:30)",
      },
      {
        value: "dd-MM-yyyy HH:mm",
        label: "dd-MM-yyyy HH:mm (15-01-2024 08:30)",
      },
      {
        value: "yyyy-MM-dd HH:mm",
        label: "yyyy-MM-dd HH:mm (2024-01-15 08:30)",
      },
      {
        value: "dd/MM/yyyy hh:mm A",
        label: "dd/MM/yyyy hh:mm A (15/01/2024 08:30 AM)",
      },
      {
        value: "dd/MM/yyyy HH:mm:ss",
        label: "dd/MM/yyyy HH:mm:ss (15/01/2024 08:30:45)",
      },
    ];
  }

  const isMinutesFieldDirect =
    field.type === "number" &&
    (field.name?.toLowerCase().includes("minutes") ||
      field.name?.toLowerCase().includes("minutos") ||
      field.displayName?.toLowerCase().includes("minutos"));

  if (isMinutesFieldDirect) {
    return [
      { value: "minutes", label: "Por Minutos → 300 min" },
      { value: "hours_hhmm", label: "Por Horas (HH:mm) → 05:00" },
      { value: "hours_decimal", label: "Por Horas Decimales → 5.00 hrs" },
      {
        value: "hours_decimal_no_unit",
        label: "Por Horas (sin unidad) → 5.00",
      },
      { value: "decimal", label: "Decimal → 300.00" },
    ];
  }

  // Format options for day field (day of month or day of week)
  const isDayField =
    field.type === "number" &&
    (field.name?.toLowerCase() === "day" ||
      field.displayName?.toLowerCase() === "día");

  if (isDayField) {
    return [
      { value: "default", label: "Numérico → 1, 2, 3..." },
      { value: "day_text", label: "Texto (Día de la semana) → Lunes, Martes..." },
      { value: "decimal", label: "Decimal → 1.00" },
    ];
  }

  // Format options for month field
  const isMonthField =
    field.type === "number" &&
    (field.name?.toLowerCase() === "month" ||
      field.displayName?.toLowerCase() === "mes");

  if (isMonthField) {
    return [
      { value: "default", label: "Numérico → 1, 2, 3..." },
      { value: "month_text", label: "Texto (Nombre del mes) → Enero, Febrero..." },
      { value: "decimal", label: "Decimal → 1.00" },
    ];
  }

  // Format options for year field
  const isYearField =
    field.type === "number" &&
    (field.name?.toLowerCase() === "year" ||
      field.displayName?.toLowerCase() === "año");

  if (isYearField) {
    return [
      { value: "default", label: "Número Estándar → 2024" },
      { value: "decimal", label: "Decimal → 2024.00" },
    ];
  }

  if (field.type === "number") {
    return [
      { value: "default", label: "Número Estándar → 1.234" },
      { value: "currency", label: "Moneda → $1.234 CLP" },
      { value: "decimal", label: "Decimal → 1.23" },
    ];
  }

  return [];
};

export const formatTimeValue = (value: unknown, timeFormat: string): string => {
  if (!value) return "-";

  let date: Date;

  // If value is a string that looks like a full ISO datetime (contains 'T'),
  // parse it as a Date. Otherwise, if it's a time-only string like "08:30",
  // split by ':' and build a Date using today's date with the provided time.
  if (typeof value === "string") {
    const str = value as string;
    if (str.includes("T")) {
      date = new Date(str);
      if (isNaN(date.getTime())) return "-";
    } else if (str.includes(":")) {
      const [hours, minutes, seconds] = str.split(":");
      date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(seconds ? parseInt(seconds, 10) : 0);
    } else {
      date = new Date(str);
      if (isNaN(date.getTime())) return "-";
    }
  } else {
    date = new Date(value as string | number);
    if (isNaN(date.getTime())) return "-";
  }

  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ampm = hours24 >= 12 ? "PM" : "AM";

  if (timeFormat === "HH:mm") {
    return `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  } else if (timeFormat === "hh:mm A") {
    return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )} ${ampm}`;
  } else if (timeFormat === "HH:mm:ss") {
    return `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  } else if (timeFormat === "hh:mm:ss A") {
    return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")} ${ampm}`;
  } else if (timeFormat === "H:mm") {
    return `${hours24}:${String(minutes).padStart(2, "0")}`;
  } else if (timeFormat === "h:mm A") {
    return `${hours12}:${String(minutes).padStart(2, "0")} ${ampm}`;
  }

  return `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
};

const isZeroTimeString = (v: unknown): boolean => {
  if (!v) return true;
  if (typeof v === "string") {
    const s = v.trim();
    if (s === "00:00" || s === "00:00:00") return true;
    // ISO midnight like 1970-01-01T00:00:00Z or ending with T00:00:00
    if (/T?00:00(:00(\.0+)?)?(Z|$)/.test(s)) return true;
  }
  if (v instanceof Date) {
    return v.getHours() === 0 && v.getMinutes() === 0 && v.getSeconds() === 0;
  }
  return false;
};

export const formatFieldValue = (
  value: unknown,
  field: ReportField,
  row?: Record<string, unknown>,
  rowIndex?: number,
  allFields?: ReportField[],
  reportFields?: ReportField[]
): string => {
  if (field.isConsolidated && field.consolidatedFields && row) {
    const separator = field.consolidatedSeparator || " ";
    const allAvailableFields = Object.values(FIELD_CATEGORIES).flatMap(
      (category) => category.fields
    );
    const values = (
      field.consolidatedFieldIds ||
      field.consolidatedFields
        .map((name) => {
          return allAvailableFields.find((f) => f.name === name)?.id || "";
        })
        .filter(Boolean)
    )
      .map((fieldIdOrName) => {
        const sourceField = field.consolidatedFieldIds
          ? allAvailableFields.find((f) => f.id === fieldIdOrName)
          : allAvailableFields.find((f) => f.name === fieldIdOrName);
        if (!sourceField) return null;

        let fieldValue: unknown = undefined;
        if (sourceField.category === FieldCategory.OVERTIME) {
          const overtimeKey =
            `overtime_${sourceField.name}` as keyof typeof row;
          fieldValue = row[overtimeKey];
        } else if (sourceField.category === FieldCategory.HOLIDAY) {
          const holidayKey = `holiday_${sourceField.name}` as keyof typeof row;
          fieldValue = row[holidayKey];
        } else if (sourceField.category === FieldCategory.ABSENCE) {
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
          const absenceRowIndex =
            rowIndex !== undefined ? rowIndex : (row.id as number) ? (row.id as number) - 1 : 0;
          const example =
            absenceExamples[absenceRowIndex] || absenceExamples[0];
          if (
            sourceField.name === "startDate" ||
            sourceField.name === "endDate" ||
            sourceField.name === "status" ||
            sourceField.name === "absenceType" ||
            sourceField.name === "totalDays" ||
            sourceField.name === "reason"
          ) {
            fieldValue = example[sourceField.name as keyof typeof example];
          } else {
            fieldValue = row[sourceField.name as keyof typeof row];
          }
        } else if (
          sourceField.table === "Job" ||
          sourceField.table === "Branch" ||
          sourceField.table === "Company" ||
          sourceField.table === "Shift" ||
          sourceField.table === "Schedule" ||
          sourceField.table === "Assistance" ||
          sourceField.table === "Absence" ||
          sourceField.table === "OvertimeRequest" ||
          sourceField.table === "Holiday"
        ) {
          const tableName = sourceField.table;
          const fieldName = sourceField.name;
          if (
            tableName &&
            row[tableName as keyof typeof row] &&
            typeof row[tableName as keyof typeof row] === "object"
          ) {
            const nestedObj = row[tableName as keyof typeof row] as Record<
              string,
              unknown
            >;
            fieldValue = nestedObj[fieldName];
          } else {
            fieldValue = row[sourceField.name as keyof typeof row];
          }
        } else {
          fieldValue = row[sourceField.name as keyof typeof row];
        }

        if (
          fieldValue !== null &&
          fieldValue !== undefined &&
          fieldValue !== ""
        ) {
          const fieldFormat = field.consolidatedFieldFormats?.find(
            (fmt) =>
              fmt.fieldId ===
              (field.consolidatedFieldIds ? fieldIdOrName : sourceField.id)
          );
          const tempField: ReportField = {
            ...sourceField,
            format: fieldFormat?.format || (sourceField as ReportField).format,
            timeFormat:
              fieldFormat?.timeFormat ||
              (sourceField as ReportField).timeFormat,
          };
          return formatFieldValue(
            fieldValue,
            tempField,
            row,
            rowIndex,
            allFields
          );
        }
        return null;
      })
      .filter((v) => v !== null);
    return values.length > 0 ? values.join(separator) : "-";
  }

  if (
    field.isCalculated &&
    field.calculatedFieldIds &&
    field.calculatedFieldIds.length > 0 &&
    row &&
    allFields
  ) {
    const calculatedValues = field.calculatedFieldIds
      .map((fieldId, index) => {
        let sourceField = reportFields?.find((f) => f.id === fieldId);

        if (!sourceField && allFields) {
          sourceField = allFields.find((f) => f.id === fieldId);
        }

        if (
          !sourceField &&
          field.calculatedFields &&
          field.calculatedFields.length > index
        ) {
          const fieldName = field.calculatedFields[index];
          const foundInReport = reportFields?.find((f) => f.name === fieldName);
          if (foundInReport) {
            sourceField = foundInReport;
          } else {
            const foundInAll = allFields?.find((f) => f.name === fieldName);
            if (foundInAll) {
              sourceField = foundInAll;
            }
          }
        }

        if (!sourceField) {
          return null;
        }

        if (sourceField.type !== "number") {
          return null;
        }

        let fieldValue: unknown = undefined;
        if (sourceField.category === FieldCategory.OVERTIME) {
          const overtimeKey =
            `overtime_${sourceField.name}` as keyof typeof row;
          fieldValue = row[overtimeKey];
        } else if (sourceField.category === FieldCategory.HOLIDAY) {
          const holidayKey = `holiday_${sourceField.name}` as keyof typeof row;
          fieldValue = row[holidayKey];
        } else if (sourceField.category === FieldCategory.ABSENCE) {
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
          const absenceRowIndex =
            rowIndex !== undefined ? rowIndex : (row.id as number) ? (row.id as number) - 1 : 0;
          const example =
            absenceExamples[absenceRowIndex] || absenceExamples[0];
          if (
            sourceField.name === "startDate" ||
            sourceField.name === "endDate" ||
            sourceField.name === "status" ||
            sourceField.name === "absenceType" ||
            sourceField.name === "reason" ||
            sourceField.name === "totalDays"
          ) {
            fieldValue = example[sourceField.name as keyof typeof example];
          } else {
            fieldValue = row[sourceField.name as keyof typeof row];
          }
        } else if (
          sourceField.table === "Job" ||
          sourceField.table === "Branch" ||
          sourceField.table === "Company" ||
          sourceField.table === "Shift" ||
          sourceField.table === "Schedule" ||
          sourceField.table === "Assistance" ||
          sourceField.table === "Absence" ||
          sourceField.table === "OvertimeRequest" ||
          sourceField.table === "Holiday"
        ) {
          const tableName = sourceField.table;
          const fieldName = sourceField.name;
          if (
            tableName &&
            row[tableName as keyof typeof row] &&
            typeof row[tableName as keyof typeof row] === "object"
          ) {
            const nestedObj = row[tableName as keyof typeof row] as Record<
              string,
              unknown
            >;
            fieldValue = nestedObj[fieldName];
          } else {
            fieldValue = row[sourceField.name as keyof typeof row];
          }
        } else {
          fieldValue = row[sourceField.name as keyof typeof row];
        }

        if (
          fieldValue !== null &&
          fieldValue !== undefined &&
          typeof fieldValue === "number"
        ) {
          return fieldValue;
        }

        if (reportFields) {
          const reportField = reportFields.find((f) => f.id === fieldId);
          if (reportField && reportField.type === "number") {
            const reportFieldValue = row[reportField.name as keyof typeof row];
            if (
              reportFieldValue !== null &&
              reportFieldValue !== undefined &&
              typeof reportFieldValue === "number"
            ) {
              return reportFieldValue;
            }
          }
        }
        return null;
      })
      .filter((v): v is number => v !== null && typeof v === "number");

    if (calculatedValues.length === 0) return "-";

    let result: number;
    
    if (
      field.calculationType === CalculationType.CUSTOM &&
      field.formula &&
      field.formula.trim() !== ""
    ) {
      const fieldNames = field.calculatedFields || [];
      result = evaluateCustomFormula({
        formula: field.formula,
        values: calculatedValues,
        fieldNames,
      });
    } else {
      switch (field.calculationType || CalculationType.SUM) {
        case CalculationType.SUM:
          result = calculatedValues.reduce((a, b) => a + b, 0);
          break;
        case CalculationType.SUBTRACT:
          result = calculatedValues.reduce((a, b) => a - b);
          break;
        case CalculationType.MULTIPLY:
          result = calculatedValues.reduce((a, b) => a * b, 1);
          break;
        case CalculationType.DIVIDE:
          result =
            calculatedValues.length > 1
              ? calculatedValues.reduce((a, b) => a / b)
              : calculatedValues[0];
          break;
        case CalculationType.AVERAGE:
          result =
            calculatedValues.reduce((a, b) => a + b, 0) / calculatedValues.length;
          break;
        default:
          result = calculatedValues.reduce((a, b) => a + b, 0);
      }
    }

    let hasMinutesSourceFields = field.calculatedFieldIds?.some(
      (fieldId, index) => {
        let sourceField =
          reportFields?.find((f) => f.id === fieldId) ||
          allFields?.find((f) => f.id === fieldId);

        if (
          !sourceField &&
          field.calculatedFields &&
          field.calculatedFields.length > index
        ) {
          const fieldName = field.calculatedFields[index];
          sourceField =
            reportFields?.find((f) => f.name === fieldName) ||
            allFields?.find((f) => f.name === fieldName);
        }

        return (
          sourceField &&
          (sourceField.name?.toLowerCase().includes("minutes") ||
            sourceField.name?.toLowerCase().includes("minutos") ||
            sourceField.displayName?.toLowerCase().includes("minutos"))
        );
      }
    );

    const isResultMinutesField =
      hasMinutesSourceFields ||
      field.name?.toLowerCase().includes("minutes") ||
      field.name?.toLowerCase().includes("minutos") ||
      field.displayName?.toLowerCase().includes("minutos");

    const resultField: ReportField = {
      ...field,
      isCalculated: false,
      name: isResultMinutesField
        ? field.name?.toLowerCase().includes("minutes") ||
          field.name?.toLowerCase().includes("minutos")
          ? field.name
          : (field.name || "calculated") + "_minutes"
        : field.name,
      displayName: isResultMinutesField
        ? field.displayName?.toLowerCase().includes("minutos")
          ? field.displayName
          : (field.displayName || "Calculated") + " (minutos)"
        : field.displayName || "Calculated",
    };

    return formatFieldValue(
      result,
      resultField,
      row,
      rowIndex,
      allFields,
      reportFields
    );
  }

  if (value === null || value === undefined || value === "") {
    if (field.originalTags && field.originalTags.length > 0 && row) {
      const extractedValue = extractValueFromTag(field.originalTags[0], row);
      if (extractedValue !== undefined && extractedValue !== null) {
        return formatFieldValue(
          extractedValue,
          field,
          row,
          rowIndex,
          allFields,
          reportFields
        );
      }
    }
    
    const isMarkField = field.originalTags?.some(
      (tag) => tag.includes("Marks") && tag.includes("timestamp")
    );
    const isScheduleTimeField = field.originalTags?.some(
      (tag) => tag.includes("Schedule") && (tag.includes("startTime") || tag.includes("endTime"))
    );
    
    // if ((isMarkField || isScheduleTimeField) && field.type === "time") {
    //   return "--:--:--";
    // }
    
    return "-";
  }

  if (field.type === "date") {
    const date = new Date(value as string | number);
    if (isNaN(date.getTime())) return "-";

    const format = field.format || "dd/MM/yyyy";

    if (format.includes("HH:mm") || format.includes("hh:mm")) {
      const dateFormat = format.split(" ")[0];
      const timeFormat = format.split(" ")[1] || "HH:mm";

      let formattedDate = "";
      if (dateFormat === "dd/MM/yyyy") {
        formattedDate = date.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } else if (dateFormat === "dd-MM-yyyy") {
        formattedDate = date
          .toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "-");
      } else if (dateFormat === "yyyy-MM-dd") {
        formattedDate = date.toISOString().split("T")[0];
      } else {
        formattedDate = date.toLocaleDateString("es-ES");
      }

      const formattedTime = formatTimeValue(value, timeFormat);
      return `${formattedDate} ${formattedTime}`;
    }

    if (format === "dd/MM/yyyy") {
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } else if (format === "MM/dd/yyyy") {
      return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    } else if (format === "yyyy-MM-dd") {
      return date.toISOString().split("T")[0];
    } else if (format === "dd-MM-yyyy") {
      return date
        .toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "-");
    } else if (format === "dd/MM/yy") {
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    } else if (format === "dd MMM yyyy") {
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } else if (format === "dd MMMM yyyy") {
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    return date.toLocaleDateString("es-ES");
  }

  if (field.type === "datetime") {
    const date = new Date(value as string | number);
    if (isNaN(date.getTime())) return "-";

    const dateFormat = field.format;
    const timeFormat = field.timeFormat;

    if (dateFormat && !timeFormat) {
      if (dateFormat === "dd/MM/yyyy") {
        return date.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } else if (dateFormat === "MM/dd/yyyy") {
        return date.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        });
      } else if (dateFormat === "yyyy-MM-dd") {
        return date.toISOString().split("T")[0];
      } else if (dateFormat === "dd-MM-yyyy") {
        return date
          .toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "-");
      } else if (dateFormat === "dd/MM/yy") {
        return date.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        });
      } else if (dateFormat === "dd MMM yyyy") {
        return date.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      } else if (dateFormat === "dd MMMM yyyy") {
        return date.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }
      return date.toLocaleDateString("es-ES");
    }

    if (timeFormat && !dateFormat) {
      return formatTimeValue(value, timeFormat);
    }

    if (dateFormat && timeFormat) {
      let formattedDate = "";
      if (dateFormat === "dd/MM/yyyy") {
        formattedDate = date.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } else if (dateFormat === "dd-MM-yyyy") {
        formattedDate = date
          .toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "-");
      } else if (dateFormat === "yyyy-MM-dd") {
        formattedDate = date.toISOString().split("T")[0];
      } else if (dateFormat === "dd/MM/yy") {
        formattedDate = date.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        });
      } else {
        formattedDate = date.toLocaleDateString("es-ES");
      }

      const formattedTime = formatTimeValue(value, timeFormat);
      return `${formattedDate} ${formattedTime}`;
    }

    return date.toLocaleString("es-ES");
  }

  if (field.type === "time") {
    const timeFormat = field.timeFormat || "HH:mm";
    const isMarkField = field.originalTags?.some(
      (tag) => tag.includes("Marks") && tag.includes("timestamp")
    );
    const isScheduleTimeField = field.originalTags?.some(
      (tag) => tag.includes("Schedule") && (tag.includes("startTime") || tag.includes("endTime"))
    );

    // If this is a schedule/mark time and it's a zero/midnight value, show placeholder
    // if ((isMarkField || isScheduleTimeField) && isZeroTimeString(value)) {
    //   return "--:--:--";
    // }

    return formatTimeValue(value, timeFormat);
  }

  if (field.type === "number") {
    // Check if it's a day field
    const isDayField =
      field.name?.toLowerCase() === "day" ||
      field.displayName?.toLowerCase() === "día";

    // Check if it's a month field
    const isMonthField =
      field.name?.toLowerCase() === "month" ||
      field.displayName?.toLowerCase() === "mes";

    // Check if it's a year field
    const isYearField =
      field.name?.toLowerCase() === "year" ||
      field.displayName?.toLowerCase() === "año";

    // Format day field
    if (isDayField) {
      const numericValue = Number(value);
      if (isNaN(numericValue)) return String(value);

      if (field.format === "day_text") {
        // Convert day number (1-31) to day of week name
        // This requires the actual date (day, month, year) to determine day of week
        const dayNames = [
          "Domingo",
          "Lunes",
          "Martes",
          "Miércoles",
          "Jueves",
          "Viernes",
          "Sábado",
        ];
        // Try to get the full date from row data
        if (row) {
          // Check if we have Assistance data with day, month, year
          if (row.Assistance) {
            const assistance = row.Assistance as Record<string, unknown>;
            if (
              assistance.day &&
              assistance.month &&
              assistance.year
            ) {
              try {
                const date = new Date(
                  Number(assistance.year),
                  Number(assistance.month) - 1,
                  Number(assistance.day)
                );
                if (!isNaN(date.getTime())) {
                  const dayOfWeek = date.getDay();
                  return dayNames[dayOfWeek] || String(numericValue);
                }
              } catch (e) {
                // Fall through to numeric format
              }
            }
          }
          // Try to get day, month, year directly from row
          if (row.day && row.month && row.year) {
            try {
              const date = new Date(
                Number(row.year),
                Number(row.month) - 1,
                Number(row.day)
              );
              if (!isNaN(date.getTime())) {
                const dayOfWeek = date.getDay();
                return dayNames[dayOfWeek] || String(numericValue);
              }
            } catch (e) {
              // Fall through to numeric format
            }
          }
        }
        // Fallback: return numeric value if we can't determine day of week
        return String(Math.round(numericValue));
      } else if (field.format === "decimal") {
        return numericValue.toFixed(2);
      }
      // Default: numeric format
      return String(Math.round(numericValue));
    }

    // Format month field
    if (isMonthField) {
      const numericValue = Number(value);
      if (isNaN(numericValue)) return String(value);

      if (field.format === "month_text") {
        const monthNames = [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ];
        const monthIndex = Math.round(numericValue) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          return monthNames[monthIndex];
        }
        return String(Math.round(numericValue));
      } else if (field.format === "decimal") {
        return numericValue.toFixed(2);
      }
      // Default: numeric format
      return String(Math.round(numericValue));
    }

    // Format year field
    if (isYearField) {
      const numericValue = Number(value);
      if (isNaN(numericValue)) return String(value);

      if (field.format === "decimal") {
        return numericValue.toFixed(2);
      }
      // Default: numeric format
      return String(Math.round(numericValue));
    }

    const isMinutesFieldByName =
      field.name?.toLowerCase().includes("minutes") ||
      field.name?.toLowerCase().includes("minutos") ||
      field.displayName?.toLowerCase().includes("minutos");

    let isMinutesField = isMinutesFieldByName;

    if (field.isCalculated && !isMinutesFieldByName && allFields) {
      const hasMinutesSourceField = (field.calculatedFieldIds || []).some((fieldId) => {
        const sourceField = allFields.find((f) => f.id === fieldId);
        if (!sourceField) return false;
        return (
          sourceField.name?.toLowerCase().includes("minutes") ||
          sourceField.name?.toLowerCase().includes("minutos") ||
          sourceField.displayName?.toLowerCase().includes("minutos")
        );
      });
      
      if (hasMinutesSourceField) {
        isMinutesField = true;
      } else if (reportFields) {
        const hasMinutesSourceFieldInReport = (field.calculatedFieldIds || []).some((fieldId) => {
          const sourceField = reportFields.find((f) => f.id === fieldId);
          if (!sourceField) return false;
          return (
            sourceField.name?.toLowerCase().includes("minutes") ||
            sourceField.name?.toLowerCase().includes("minutos") ||
            sourceField.displayName?.toLowerCase().includes("minutos")
          );
        });
        if (hasMinutesSourceFieldInReport) {
          isMinutesField = true;
        }
      }
    }

    let numericValue = Number(value);

    // Special display rule: for contracted or actual worked hours (either by name
    // or by original tag), when the value is zero or missing we show a placeholder
    // "--:--:--" instead of 00:00:00.
    const hasContractedTag = field.originalTags?.some((t) => t.includes("assistance.Schedule.contractedHours"));
    const hasActualWorkedTag = field.originalTags?.some((t) => t.includes("assistance.Marks.actualWorkedHours"));
    if (
      ((field.name === "contractedHours" || hasContractedTag) || (field.name === "actualWorkedHours" || hasActualWorkedTag)) &&
      (!numericValue || numericValue === 0 || Number.isNaN(numericValue))
    ) {
      return "--:--:--";
    }

    if (!field.format || field.format === "default") {
      if (isMinutesField) {
        return `${Math.round(numericValue)} min`;
      }
      return numericValue.toLocaleString("es-ES");
    }

    if (field.format === "currency") {
      return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
      }).format(numericValue);
    } else if (field.format === "minutes") {
      return `${Math.round(numericValue)} min`;
    } else if (field.format === "decimal") {
      if (isMinutesField) {
        return numericValue.toFixed(2);
      }
      return numericValue.toFixed(2);
    } else if (field.format === "hours_hhmm") {
      let totalHours = numericValue;
      if (isMinutesField) {
        totalHours = numericValue / 60;
      } else if (numericValue > 24) {
        totalHours = numericValue / 60;
      }
      if (!totalHours || totalHours === 0 || Number.isNaN(totalHours)) {
        return "--:--:--";
      }
      const hours = Math.floor(totalHours);
      const minutes = Math.round((totalHours - hours) * 60);
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    } else if (field.format === "hours_decimal") {
      let totalHours = numericValue;
      if (isMinutesField) {
        totalHours = numericValue / 60;
      } else if (numericValue > 24) {
        totalHours = numericValue / 60;
      }
      return `${totalHours.toFixed(2)} hrs`;
    } else if (field.format === "hours_minutes") {
      if (isMinutesField) {
        return `${Math.round(numericValue)} min`;
      }
      const totalMinutes = Math.round(numericValue * 60);
      return `${totalMinutes} min`;
    } else if (field.format === "hours_decimal_no_unit") {
      let totalHours = numericValue;
      if (isMinutesField) {
        totalHours = numericValue / 60;
      } else if (numericValue > 24) {
        totalHours = numericValue / 60;
      }
      return totalHours.toFixed(2);
    }
    return numericValue.toLocaleString("es-ES");
  }

  if (field.type === "string") {
    const stringValue = String(value);

    if (field.name === "status") {
      const statusMap: Record<string, string> = {
        PENDING: "Pendiente",
        APPROVED: "Aprobado",
        REJECTED: "Rechazado",
      };
      return statusMap[stringValue] || stringValue;
    }

    if (field.name === "type" && field.category === FieldCategory.OVERTIME) {
      const typeMap: Record<string, string> = {
        PER_SCHEDULE: "Por Horario",
        PER_HOURS: "Por Horas",
      };
      return typeMap[stringValue] || stringValue;
    }

    if (field.name === "absenceType") {
      const absenceTypeMap: Record<string, string> = {
        Vacaciones: "Vacaciones",
        Enfermedad: "Enfermedad",
        Permiso: "Permiso",
        Personal: "Personal",
        Maternidad: "Maternidad",
        Paternidad: "Paternidad",
      };
      return absenceTypeMap[stringValue] || stringValue;
    }

    return stringValue;
  }

  if (field.type === "boolean") {
    if (typeof value === "boolean") {
      return value ? "Sí" : "No";
    }
    if (value === "true" || value === true) {
      return "Sí";
    }
    if (value === "false" || value === false) {
      return "No";
    }
    return String(value);
  }

  return String(value);
};
