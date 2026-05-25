"use client";

import {
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { Badge } from "@/components/ui/badge";
import { DateTime } from "luxon";
import { FIELD_CATEGORIES, FieldCategory, ReportField, SAMPLE_DATA, TotalRow, TotalRowType } from "../report.dto";
import { formatFieldValue } from "../utils/format-utils";
import { calculateTotal } from "./preview-utils";

interface ReportPreviewProps {
  fields: ReportField[];
  totalRows: TotalRow[];
  headerTransform?: "DEFAULT" | "UPPER" | "LOWER";
}

const getColumnLetter = (index: number) => {
  return String.fromCharCode(65 + index);
};

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

  const parts = tag.split(".");
  
  if (parts.length === 2) {
    const [tableName, fieldName] = parts;
    const tableObj = row[tableName] as Record<string, unknown> | undefined;
    if (tableObj && typeof tableObj === "object") {
      return tableObj[fieldName];
    }
  }
  
  if (parts.length >= 3) {
    const [tableName, nestedRelation, ...restParts] = parts;
    const tableObj = row[tableName] as Record<string, unknown> | undefined;
    
    if (!tableObj || typeof tableObj !== "object") {
      return undefined;
    }
    
    if ((tableName === "Assistance" && nestedRelation === "Schedule") || nestedRelation === "Schedule") {
      const schedule = tableObj[nestedRelation] as Record<string, unknown> | undefined;
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
              // Solo la hora
              return endDate.toISOString().substring(11, 19);
            } catch {
              return undefined;
            }
          }
        }
        if (fieldName === "startTime" && schedule[fieldName]) {
          try {
            const value = schedule[fieldName];
            const date = value instanceof Date ? value : new Date(value as string);
            // Extraer solo la hora (HH:mm:ss)
            return date.toISOString().substring(11, 19);
          } catch {
            return undefined;
          }
        }
        return schedule[fieldName];
      }
    }
    
    if (tableName === "Assistance" && nestedRelation === "Marks") {
      const marks = tableObj[nestedRelation] as Array<Record<string, unknown>> | undefined;
      if (marks && Array.isArray(marks) && marks.length > 0) {
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
    
    
    if (nestedRelation === "Marks") {
      const marks = tableObj[nestedRelation] as Array<Record<string, unknown>> | undefined;
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

// Helper function to reconstruct totalRow columns for non-CUSTOM types
const reconstructTotalRowColumns = (totalRow: TotalRow, fields: ReportField[]): TotalRow => {
  if (totalRow.type === TotalRowType.CUSTOM) {
    return totalRow; // For CUSTOM, use saved columns
  }

  // For SUM/AVG/etc, always reconstruct all numeric columns
  const numericFields = fields.filter(
    (field) =>
      field.type === "number" &&
      (field.aggregationType !== "none" || field.isCalculated) &&
      !field.isConsolidated
  );

  const reconstructedColumns = numericFields.map((field) => {
    const aggType =
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
        : "SUM";

    return {
      fieldId: field.id,
      aggregationType: aggType as "SUM" | "AVG" | "COUNT" | "MIN" | "MAX" | "NONE",
      format: field.format,
    };
  });

  return {
    ...totalRow,
    columns: reconstructedColumns,
    // Preservar groupBy explícitamente
    groupBy: totalRow.groupBy,
    labelTemplate: totalRow.labelTemplate,
    showGroupContext: totalRow.showGroupContext,
  };
};

const calculateWeekNumber = (year: number, month: number, day: number): number => {
  const date = DateTime.fromObject({ year, month, day });
  return date.weekNumber;
};

const getGroupKey = (r: Record<string, unknown>, groupBy: string[]) => {
  const keys: string[] = [];
  
  if (groupBy.includes("employee")) {
    const firstName = (r.firstName as string) || "";
    const lastName = (r.lastName as string) || "";
    const secondLastName = (r.secondLastName as string) || "";
    const key = `employee:${firstName}|${lastName}|${secondLastName}`;
    keys.push(key);
  }
  
  const assistance = r.Assistance as Record<string, unknown> | Record<string, unknown>[] | undefined;
  if (assistance) {
    const assistanceObj = Array.isArray(assistance) ? assistance[0] : assistance;
    
    if (groupBy.includes("month")) {
      const year = (assistanceObj?.year as number) || 0;
      const month = (assistanceObj?.month as number) || 0;
      keys.push(`month:${year}-${month}`);
    }
    
    if (groupBy.includes("week")) {
      const year = (assistanceObj?.year as number) || 0;
      const month = (assistanceObj?.month as number) || 0;
      const day = (assistanceObj?.day as number) || 0;
      if (year > 0 && month > 0 && day > 0) {
        const weekNumber = calculateWeekNumber(year, month, day);
        keys.push(`week:${year}-W${weekNumber}`);
      } else {
        keys.push(`week:${year}-${month}-${day}`);
      }
    }
  } else {
    if (groupBy.includes("month")) {
      const year = (r.year as number) || 0;
      const month = (r.month as number) || 0;
      keys.push(`month:${year}-${month}`);
    }
    
    if (groupBy.includes("week")) {
      const year = (r.year as number) || 0;
      const month = (r.month as number) || 0;
      const day = (r.day as number) || 0;
      if (year > 0 && month > 0 && day > 0) {
        const weekNumber = calculateWeekNumber(year, month, day);
        keys.push(`week:${year}-W${weekNumber}`);
      } else {
        keys.push(`week:${year}-${month}-${day}`);
      }
    }
  }
  
  const result = keys.join("|");
  return result || "default";
};

export default function ReportPreview({
  fields,
  totalRows,
}: ReportPreviewProps) {
  const reconstructedTotalRows = totalRows.map((tr) => {
    return reconstructTotalRowColumns(tr, fields);
  });
  
  const groupedTotalRows = reconstructedTotalRows.filter(
    (tr) => {
      if (!tr.groupBy || !Array.isArray(tr.groupBy) || tr.groupBy.length === 0) {
        return false;
      }
      const validGroups = ["employee", "month", "week"];
      return tr.groupBy.some(g => validGroups.includes(g));
    }
  );

  const finalTotalRows = reconstructedTotalRows.filter(
    (tr) =>
      !tr.groupBy ||
      tr.groupBy.length === 0 ||
      (tr.groupBy.length === 1 && tr.groupBy[0] === "none")
  );
  
  const topTotalRows = finalTotalRows.filter(
    (tr) => tr.position === "top"
  );
  const bottomTotalRows = finalTotalRows.filter(
    (tr) => tr.position === "bottom"
  );
  const sampleData = SAMPLE_DATA.slice(0, 3);

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Vista Previa del Reporte (Simulación Excel)
      </h3>
      <div className="border border-gray-300 rounded-sm overflow-hidden shadow-md bg-white">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
          <span className="text-gray-700 text-sm font-medium">
            Vista Previa
          </span>
        </div>
        <div className="bg-white">
          <CHEKIOTable>
            <CHEKIOTableHeader>
              <tr>
                {fields.map((field, index) => (
                  <CHEKIOTableHead
                    key={field.id}
                    className="bg-gray-600 text-white font-semibold border-r border-gray-500 last:border-r-0 text-sm px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-calibri text-white">{field.displayName}</span>
                      <Badge
                        variant="outline"
                        className="text-xs bg-gray-500 text-white border-gray-400 font-normal"
                      >
                        {getColumnLetter(index)}
                      </Badge>
                    </div>
                  </CHEKIOTableHead>
                ))}
              </tr>
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              <>
                {topTotalRows.map((totalRow) => (
                  <CHEKIOTableRow
                    key={`total-top-${totalRow.id}`}
                    index={-1}
                    className="bg-gray-100 font-semibold border-b-2 border-gray-400"
                  >
                    {fields.map((field) => {
                      const totalValue = calculateTotal(
                        field,
                        totalRow,
                        fields
                      );
                      return (
                        <CHEKIOTableCell
                          key={field.id}
                          className="border-r border-gray-300 last:border-r-0 text-sm px-3 py-2 text-gray-800"
                        >
                          {totalValue ||
                            (totalRow.showLabel && field === fields[0]
                              ? totalRow.label
                              : "")}
                        </CHEKIOTableCell>
                      );
                    })}
                  </CHEKIOTableRow>
                ))}
                {sampleData.map((row, rowIndex) => {
                  const previousRow = rowIndex > 0 ? sampleData[rowIndex - 1] : null;
                  const isLastRow = rowIndex === sampleData.length - 1;
                  
                  return (
                    <>
                      {previousRow && groupedTotalRows.map((totalRow) => {
                        if (!totalRow.groupBy || totalRow.groupBy.length === 0) return null;
                        
                        const prevKey = getGroupKey(previousRow, totalRow.groupBy);
                        const currKey = getGroupKey(row, totalRow.groupBy);
                        const shouldShow = prevKey !== currKey;
                        
                        if (!shouldShow) return null;
                        
                        const groupRows: Record<string, unknown>[] = [];
                        
                        for (let i = 0; i < rowIndex; i++) {
                          const r = sampleData[i];
                          const rKey = getGroupKey(r, totalRow.groupBy);
                          if (rKey === prevKey) {
                            groupRows.push({ ...r, __previewIndex: i });
                          }
                        }
                        
                        if (groupRows.length === 0) {
                          groupRows.push({ ...previousRow!, __previewIndex: rowIndex - 1 });
                        }
                        
                        const prevFirstName = (previousRow!.firstName as string) || "";
                        const prevLastName = (previousRow!.lastName as string) || "";
                        const prevSecondLastName = (previousRow!.secondLastName as string) || "";
                        const prevEmployeeName = `${prevFirstName} ${prevLastName} ${prevSecondLastName}`.trim();
                        
                        const prevAssistance = previousRow!.Assistance as Record<string, unknown> | Record<string, unknown>[] | undefined;
                        const prevAssistanceObj = prevAssistance 
                          ? (Array.isArray(prevAssistance) ? prevAssistance[0] : prevAssistance)
                          : null;
                        
                        const prevMonth = prevAssistanceObj ? ((prevAssistanceObj.month as number) || 1) : 1;
                        const prevYear = prevAssistanceObj ? ((prevAssistanceObj.year as number) || 2024) : 2024;
                        const prevDay = prevAssistanceObj ? ((prevAssistanceObj.day as number) || 1) : 1;
                        const prevWeek = prevAssistanceObj ? calculateWeekNumber(prevYear, prevMonth, prevDay) : 1;
                        
                        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                        
                        const weekStart = DateTime.fromObject({ year: prevYear, month: prevMonth, day: prevDay })
                          .startOf('week')
                          .toFormat('dd/MM');
                        const weekEnd = DateTime.fromObject({ year: prevYear, month: prevMonth, day: prevDay })
                          .endOf('week')
                          .toFormat('dd/MM');
                        const prevWeekRange = `${weekStart} - ${weekEnd}`;
                        
                        let groupLabel = totalRow.label;
                        if (totalRow.labelTemplate) {
                          groupLabel = totalRow.labelTemplate
                            .replace(/\{employee\}/g, prevEmployeeName || "Empleado")
                            .replace(/\{firstName\}/g, prevFirstName)
                            .replace(/\{lastName\}/g, prevLastName)
                            .replace(/\{secondLastName\}/g, prevSecondLastName)
                            .replace(/\{month\}/g, prevMonth.toString())
                            .replace(/\{monthName\}/g, monthNames[prevMonth - 1] || "Enero")
                            .replace(/\{year\}/g, prevYear.toString())
                            .replace(/\{week\}/g, prevWeek.toString())
                            .replace(/\{weekRange\}/g, prevWeekRange);
                        } else if (totalRow.showGroupContext) {
                          const contextParts: string[] = [];
                          if (totalRow.groupBy.includes("employee")) {
                            contextParts.push(prevEmployeeName || "Empleado");
                          }
                          if (totalRow.groupBy.includes("month")) {
                            contextParts.push(`${monthNames[prevMonth - 1] || "Enero"} ${prevYear}`);
                          }
                          if (totalRow.groupBy.includes("week")) {
                            contextParts.push(`Semana ${prevWeek}`);
                          }
                          if (contextParts.length > 0) {
                            groupLabel = `${totalRow.label} - ${contextParts.join(" - ")}`;
                          }
                        }
                        
                        return (
                          <CHEKIOTableRow
                            key={`group-total-${totalRow.id}-${rowIndex}`}
                            index={-2}
                            className="bg-blue-50 font-semibold border-b-2 border-blue-300"
                          >
                            {fields.map((field) => {
                              const totalValue = calculateTotal(
                                field,
                                totalRow,
                                fields,
                                groupRows.length > 0 ? groupRows : undefined
                              );
                              return (
                                <CHEKIOTableCell
                                  key={field.id}
                                  className="border-r border-gray-300 last:border-r-0 text-sm px-3 py-2 text-blue-800"
                                >
                                  {totalValue ||
                                    (totalRow.showLabel && field === fields[0]
                                      ? groupLabel
                                      : "")}
                                </CHEKIOTableCell>
                              );
                            })}
                          </CHEKIOTableRow>
                        );
                      })}
                      <CHEKIOTableRow
                        key={rowIndex}
                        index={rowIndex}
                        className={`border-b border-gray-200 ${
                          rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50 transition-colors`}
                      >
                        {fields.map((field) => {
                      if (field.isConsolidated) {
                        const formattedValue = formatFieldValue(
                          null,
                          field,
                          row,
                          rowIndex,
                          Object.values(FIELD_CATEGORIES).flatMap(
                            (category) => category.fields
                          ),
                          fields
                        );
                        return (
                          <CHEKIOTableCell
                            key={field.id}
                            className="border-r border-gray-200 last:border-r-0 text-sm px-3 py-2 text-gray-700"
                          >
                            {formattedValue}
                          </CHEKIOTableCell>
                        );
                      }

                      if (field.isCalculated) {
                        const formattedValue = formatFieldValue(
                          null,
                          field,
                          row,
                          rowIndex,
                          Object.values(FIELD_CATEGORIES).flatMap(
                            (category) => category.fields
                          ),
                          fields
                        );
                        return (
                          <CHEKIOTableCell
                            key={field.id}
                            className="border-r border-gray-200 last:border-r-0 bg-blue-50 font-semibold text-sm px-3 py-2 text-gray-800"
                          >
                            {formattedValue}
                          </CHEKIOTableCell>
                        );
                      }

                      let rawValue: unknown = undefined;

                      if (
                        field.category === FieldCategory.OVERTIME
                      ) {
                        const overtimeKey =
                          `overtime_${field.name}` as keyof typeof row;
                        rawValue = row[overtimeKey];
                      } else if (
                        field.category === FieldCategory.HOLIDAY
                      ) {
                        const holidayKey =
                          `holiday_${field.name}` as keyof typeof row;
                        rawValue = row[holidayKey];
                      } else if (
                        field.table === "Job" ||
                        field.table === "Branch" ||
                        field.table === "Company" ||
                        field.table === "Shift" ||
                        field.table === "Schedule" ||
                        field.table === "Assistance" ||
                        field.table === "Absence" ||
                        field.table === "OvertimeRequest" ||
                        field.table === "Holiday"
                      ) {
                        if (field.originalTags && field.originalTags.length > 0) {
                          rawValue = extractValueFromTag(
                            field.originalTags[0],
                            row
                          );
                        } else {
                          const tableName = field.table;
                          const fieldName = field.name;
                          if (
                            tableName &&
                            row[tableName as keyof typeof row] &&
                            typeof row[tableName as keyof typeof row] ===
                              "object"
                          ) {
                            const nestedObj = row[
                              tableName as keyof typeof row
                            ] as Record<string, unknown>;
                            rawValue = nestedObj[fieldName];
                          } else {
                            rawValue =
                              row[field.name as keyof typeof row];
                          }
                        }
                      } else {
                        rawValue =
                          row[field.name as keyof typeof row];
                      }

                      if (
                        rawValue === undefined ||
                        rawValue === null
                      ) {
                        if (
                          field.category === FieldCategory.SCHEDULE &&
                          field.name === "totalHours"
                        ) {
                          const scheduleHours = [45, 32, 40];
                          rawValue = scheduleHours[rowIndex] || 45;
                        } else if (field.originalTags && field.originalTags.length > 0) {
                          rawValue = extractValueFromTag(field.originalTags[0], row);
                        }
                      }

                      const formattedValue = formatFieldValue(
                        rawValue,
                        field,
                        row,
                        rowIndex,
                        Object.values(FIELD_CATEGORIES).flatMap(
                          (category) => category.fields
                        ),
                        fields
                      );
                      return (
                        <CHEKIOTableCell
                          key={field.id}
                          className="border-r border-gray-200 last:border-r-0 text-sm px-3 py-2 text-gray-700"
                        >
                          {formattedValue}
                        </CHEKIOTableCell>
                      );
                    })}
                    </CHEKIOTableRow>
                    </>
                  );
                  })}
                {sampleData.length > 0 && groupedTotalRows.map((totalRow) => {
                  if (!totalRow.groupBy || totalRow.groupBy.length === 0) return null;
                  
                  const lastRow = sampleData[sampleData.length - 1];
                  const lastKey = getGroupKey(lastRow, totalRow.groupBy);
                  const lastGroupRows: Record<string, unknown>[] = [];
                  
                  for (let i = 0; i < sampleData.length; i++) {
                    const r = sampleData[i];
                    const rKey = getGroupKey(r, totalRow.groupBy);
                    if (rKey === lastKey) {
                      lastGroupRows.push({ ...r, __previewIndex: i });
                    }
                  }
                  
                  const lastFirstName = (lastRow.firstName as string) || "";
                  const lastLastName = (lastRow.lastName as string) || "";
                  const lastSecondLastName = (lastRow.secondLastName as string) || "";
                  const lastEmployeeName = `${lastFirstName} ${lastLastName} ${lastSecondLastName}`.trim();
                  
                  const lastAssistance = lastRow.Assistance as Record<string, unknown> | Record<string, unknown>[] | undefined;
                  const lastAssistanceObj = lastAssistance 
                    ? (Array.isArray(lastAssistance) ? lastAssistance[0] : lastAssistance)
                    : null;
                  
                  const lastMonth = lastAssistanceObj ? ((lastAssistanceObj.month as number) || 1) : 1;
                  const lastYear = lastAssistanceObj ? ((lastAssistanceObj.year as number) || 2024) : 2024;
                  const lastDay = lastAssistanceObj ? ((lastAssistanceObj.day as number) || 1) : 1;
                  const lastWeek = lastAssistanceObj && lastYear > 0 && lastMonth > 0 && lastDay > 0 
                    ? calculateWeekNumber(lastYear, lastMonth, lastDay) 
                    : 1;
                  
                  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                  
                  const weekStart = DateTime.fromObject({ year: lastYear, month: lastMonth, day: lastDay })
                    .startOf('week')
                    .toFormat('dd/MM');
                  const weekEnd = DateTime.fromObject({ year: lastYear, month: lastMonth, day: lastDay })
                    .endOf('week')
                    .toFormat('dd/MM');
                  const lastWeekRange = `${weekStart} - ${weekEnd}`;
                  
                  let groupLabel = totalRow.label;
                  if (totalRow.labelTemplate) {
                    groupLabel = totalRow.labelTemplate
                      .replace(/\{employee\}/g, lastEmployeeName || "Empleado")
                      .replace(/\{firstName\}/g, lastFirstName)
                      .replace(/\{lastName\}/g, lastLastName)
                      .replace(/\{secondLastName\}/g, lastSecondLastName)
                      .replace(/\{month\}/g, lastMonth.toString())
                      .replace(/\{monthName\}/g, monthNames[lastMonth - 1] || "Enero")
                      .replace(/\{year\}/g, lastYear.toString())
                      .replace(/\{week\}/g, lastWeek.toString())
                      .replace(/\{weekRange\}/g, lastWeekRange);
                  } else if (totalRow.showGroupContext) {
                    const contextParts: string[] = [];
                    if (totalRow.groupBy.includes("employee")) {
                      contextParts.push(lastEmployeeName || "Empleado");
                    }
                    if (totalRow.groupBy.includes("month")) {
                      contextParts.push(`${monthNames[lastMonth - 1] || "Enero"} ${lastYear}`);
                    }
                    if (totalRow.groupBy.includes("week")) {
                      contextParts.push(`Semana ${lastWeek}`);
                    }
                    if (contextParts.length > 0) {
                      groupLabel = `${totalRow.label} - ${contextParts.join(" - ")}`;
                    }
                  }
                  
                  const hasShownTotalForLastGroup = sampleData.length > 1 && (() => {
                    const secondLastRow = sampleData[sampleData.length - 2];
                    const secondLastKey = getGroupKey(secondLastRow, totalRow.groupBy);
                    return secondLastKey !== lastKey;
                  })();
                  
                  const shouldShowLastGroupTotal = !hasShownTotalForLastGroup && lastGroupRows.length > 0;
                  
                  if (shouldShowLastGroupTotal) {
                    return (
                      <CHEKIOTableRow
                        key={`group-total-last-${totalRow.id}`}
                        index={-2}
                        className="bg-blue-50 font-semibold border-b-2 border-blue-300"
                      >
                        {fields.map((field) => {
                          const totalValue = calculateTotal(
                            field,
                            totalRow,
                            fields,
                            lastGroupRows.length > 0 ? lastGroupRows : undefined
                          );
                          return (
                            <CHEKIOTableCell
                              key={field.id}
                              className="border-r border-gray-300 last:border-r-0 text-sm px-3 py-2 text-blue-800"
                            >
                              {totalValue ||
                                (totalRow.showLabel && field === fields[0]
                                  ? groupLabel
                                  : "")}
                            </CHEKIOTableCell>
                          );
                        })}
                      </CHEKIOTableRow>
                    );
                  }
                  return null;
                })}
                {bottomTotalRows.map((totalRow) => (
                  <CHEKIOTableRow
                    key={`total-bottom-${totalRow.id}`}
                    index={-1}
                    className="bg-gray-100 font-semibold border-t-2 border-gray-400"
                  >
                    {fields.map((field) => {
                      const totalValue = calculateTotal(
                        field,
                        totalRow,
                        fields
                      );
                      return (
                        <CHEKIOTableCell
                          key={field.id}
                          className="border-r border-gray-300 last:border-r-0 text-sm px-3 py-2 text-gray-800"
                        >
                          {totalValue ||
                            (totalRow.showLabel && field === fields[0]
                              ? totalRow.label
                              : "")}
                        </CHEKIOTableCell>
                      );
                    })}
                  </CHEKIOTableRow>
                ))}
              </>
            </CHEKIOTableBody>
          </CHEKIOTable>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-4">
        Mostrando {Math.min(SAMPLE_DATA.length, 5)} filas de ejemplo. El
        reporte final incluirá todos los datos según los filtros
        aplicados.
      </p>
    </div>
  );
}
