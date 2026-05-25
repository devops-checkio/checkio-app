"use client";

import { useCookieSession } from "@/context/useCookieSession";
import { useGetCalendar } from "@/service/mantainer.service";
import { Skeleton } from "@/components/ui/skeleton";
import { DayCell, DayCellRecord, TeamScheduleType } from "./day-cell";
import { TeamAbsenceDayInfo } from "./team-absence.types";
import { User } from "lucide-react";

function toUtcDateKey(year: number, month: number, day: number): string {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toISOString().split("T")[0];
}

/** Hoy o días anteriores en calendario local (no seleccionables); solo futuro desde mañana. */
function isTodayOrPastLocalCalendarDay(
  year: number,
  month: number,
  day: number,
): boolean {
  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth() + 1;
  const cd = now.getDate();
  if (year < cy) return true;
  if (year > cy) return false;
  if (month < cm) return true;
  if (month > cm) return false;
  return day <= cd;
}

interface EmployeeScheduleRowProps {
  rowIndex?: number;
  employee: {
    publicId: string;
    firstName: string;
    lastName: string;
    documentNumber?: string;
  };
  month: number;
  year: number;
  daysInMonth: number;
  selectedDays: Record<string, { date: string; schedule: string }>;
  /** Por día (clave yyyy-mm-dd UTC), misma lógica que schedule/[employeId]. */
  absencesByDate: Record<string, TeamAbsenceDayInfo>;
  holidays: Array<{ date: string | Date }>;
  canSelect: boolean;
  onDayToggle: (
    employeeId: string,
    dateStr: string,
    record: DayCellRecord | undefined
  ) => void;
}

export function EmployeeScheduleRow({
  rowIndex = 0,
  employee,
  month,
  year,
  daysInMonth,
  selectedDays,
  absencesByDate,
  holidays,
  canSelect,
  onDayToggle,
}: EmployeeScheduleRowProps) {
  const { getTemplateUser } = useCookieSession();
  const primary = getTemplateUser().primary;
  const rowAnimDelay = Math.min(rowIndex, 16) * 35;

  const { data: calendar, isLoading } = useGetCalendar({
    month,
    year,
    employeeId: employee.publicId,
  });

  const today = new Date();
  const fullName = `${employee.firstName} ${employee.lastName}`.trim();

  const isHolidayDate = (dateStr: string): boolean =>
    holidays.some((h) => {
      const hDate = new Date(h.date).toISOString().split("T")[0];
      return hDate === dateStr;
    });

  const getRecordForDay = (day: number): DayCellRecord | undefined => {
    const dateStr = toUtcDateKey(year, month, day);
    const absence = absencesByDate[dateStr];
    if (absence) {
      return {
        day,
        type: TeamScheduleType.ABSENCE,
        schedule: null,
        absence: {
          typeName: absence.absenceTypeName,
          typeCode: absence.typeCode,
          startDate: absence.startDate,
          endDate: absence.endDate,
          withoutPay: absence.withoutPay,
        },
      };
    }
    if (!calendar) return undefined;
    return calendar.find((r: DayCellRecord) => r.day === day);
  };

  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <tr
      className="team-schedule-row-animate group border-b border-gray-100/90 transition-colors hover:bg-slate-50/60"
      style={{ animationDelay: `${rowAnimDelay}ms` }}
    >
      {/* Sticky employee name column */}
      <td className="sticky left-0 z-10 w-[200px] min-w-[200px] max-w-[200px] border-r border-gray-200 bg-white px-3 py-2 shadow-[4px_0_14px_-8px_rgba(0,0,0,0.12)] transition-colors group-hover:bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white bg-gradient-to-br from-blue-100 to-blue-50 text-[10px] font-bold text-blue-800 shadow-sm ring-1 ring-blue-100/80">
            {initials || <User className="h-3.5 w-3.5 text-blue-600" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
              {fullName}
            </p>
            {employee.documentNumber && (
              <p className="text-[10px] text-gray-400 leading-tight">
                {employee.documentNumber}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Day cells */}
      {isLoading
        ? Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const isTodayCol =
              today.getFullYear() === year &&
              today.getMonth() + 1 === month &&
              today.getDate() === day;
            return (
              <td
                key={i}
                className="px-0.5 py-1"
                style={
                  isTodayCol
                    ? {
                        background: `linear-gradient(180deg, ${primary}12, ${primary}05 60%, transparent)`,
                        boxShadow: `inset 2px 0 0 ${primary}`,
                      }
                    : undefined
                }
              >
                <Skeleton className="w-[72px] h-[58px] rounded-md" />
              </td>
            );
          })
        : Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = toUtcDateKey(year, month, day);
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() + 1 === month &&
              today.getDate() === day;
            const isNonSelectableDay =
              isTodayOrPastLocalCalendarDay(year, month, day);
            const isSelected = !!selectedDays[dateStr];
            const isHoliday = isHolidayDate(dateStr);
            const record = getRecordForDay(day);

            return (
              <td
                key={day}
                className="px-0.5 py-1"
                style={
                  isToday
                    ? {
                        background: `linear-gradient(180deg, ${primary}12, ${primary}05 60%, transparent)`,
                        boxShadow: `inset 2px 0 0 ${primary}`,
                      }
                    : undefined
                }
              >
                <DayCell
                  record={record}
                  isHoliday={isHoliday}
                  isSelected={isSelected}
                  isToday={isToday}
                  isPastDate={isNonSelectableDay}
                  canSelect={canSelect && !isNonSelectableDay}
                  onClick={() => onDayToggle(employee.publicId, dateStr, record)}
                />
              </td>
            );
          })}
    </tr>
  );
}
