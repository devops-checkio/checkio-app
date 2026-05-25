"use client";

import { useCookieSession } from "@/context/useCookieSession";
import { useTranslations } from "next-intl";
import { useGetHolidays } from "@/service/mantainer.service";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users, UserCircle2 } from "lucide-react";
import { EmployeeScheduleRow } from "./employee-schedule-row";
import { DayCellRecord } from "./day-cell";
import { TeamAbsenceDayInfo } from "./team-absence.types";
import { TeamScheduleLegend } from "./team-schedule-legend";

interface TeamScheduleGridProps {
  employees:
    | Array<{
        publicId: string;
        firstName: string;
        lastName: string;
        documentNumber?: string;
      }>
    | undefined;
  isLoadingEmployees: boolean;
  month: number;
  year: number;
  companyId: string | null;
  absencesByEmployeeDay: Record<string, Record<string, TeamAbsenceDayInfo>>;
  isLoadingAbsences: boolean;
  selectedDays: Record<string, Record<string, { date: string; schedule: string }>>;
  canSelect: boolean;
  onDayToggle: (
    employeeId: string,
    dateStr: string,
    record: DayCellRecord | undefined
  ) => void;
}

const CELL_W = 74; // px — must match day-cell w-[72px] + 2px padding
const COL_EMPLOYEE_W = 200;
const WEEKDAY_SHORT = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number): number {
  const d = new Date(year, month - 1, day).getDay();
  return d === 0 ? 7 : d;
}

export function TeamScheduleGrid({
  employees,
  isLoadingEmployees,
  month,
  year,
  companyId,
  absencesByEmployeeDay,
  isLoadingAbsences,
  selectedDays,
  canSelect,
  onDayToggle,
}: TeamScheduleGridProps) {
  const t = useTranslations("operations.teamSchedule");
  const { getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const primary = templateUser.primary;

  const { data: holidays } = useGetHolidays({
    page: 1,
    pageSize: 100,
    sort: "asc",
  });

  const daysInMonth = getDaysInMonth(year, month);
  const today = new Date();
  const tableMinWidth = `${COL_EMPLOYEE_W + daysInMonth * CELL_W}px`;

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-slate-50/50 to-white px-6 py-20">
        <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white shadow-sm">
          <Building2
            className="h-11 w-11"
            style={{ color: `${primary}88` }}
          />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {t("grid.selectCompanyTitle")}
        </h3>
        <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-gray-500">
          {t("grid.selectCompany")}
        </p>
      </div>
    );
  }

  if (!isLoadingEmployees && (!employees || employees.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-slate-50/40 to-white px-6 py-20">
        <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner">
          <Users
            className="h-11 w-11"
            style={{ color: `${primary}88` }}
          />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {t("grid.noEmployees")}
        </h3>
        <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-gray-500">
          {t("grid.noEmployeesDescription")}
        </p>
      </div>
    );
  }

  const holidayList = holidays?.data ?? [];
  const isLoadingGrid = isLoadingEmployees || isLoadingAbsences;

  return (
    <div className="min-w-0 w-full">
      <TeamScheduleLegend primaryColor={primary} />
      <div className="min-w-0 w-full overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <table
          className="table-fixed border-collapse"
          style={{ minWidth: tableMinWidth }}
        >
        <thead>
          <tr className="border-b border-gray-200">
            {/* Employee header — sticky top + sticky left (corner cell) */}
            <th
              className="sticky top-0 left-0 z-30 border-b border-r border-gray-200 bg-gray-50 px-3 py-2.5 text-left shadow-[4px_0_12px_-6px_rgba(0,0,0,0.08)]"
              style={{ minWidth: `${COL_EMPLOYEE_W}px`, width: `${COL_EMPLOYEE_W}px`, maxWidth: `${COL_EMPLOYEE_W}px` }}
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-600">
                <UserCircle2
                  className="h-3.5 w-3.5"
                  style={{ color: `${primary}99` }}
                />
                {t("grid.employee")}
              </span>
            </th>
            {/* Day headers */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dow = getDayOfWeek(year, month, day);
              const isToday =
                today.getFullYear() === year &&
                today.getMonth() + 1 === month &&
                today.getDate() === day;
              const isWeekend = dow === 6 || dow === 7;

              return (
                <th
                  key={day}
                  className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 px-0.5 py-1.5 text-center"
                  style={{
                    width: `${CELL_W}px`,
                    minWidth: `${CELL_W}px`,
                    ...(isToday
                      ? {
                          background: `linear-gradient(180deg, ${primary}18, ${primary}08 55%, transparent)`,
                          boxShadow: `inset 0 0 0 1px ${primary}33`,
                        }
                      : {}),
                  }}
                >
                  <div
                    className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition-colors ${
                      isToday
                        ? "text-white shadow-md"
                        : isWeekend
                          ? "bg-slate-50/80 text-gray-400"
                          : "text-gray-600"
                    }`}
                    style={
                      isToday
                        ? { backgroundColor: primary }
                        : undefined
                    }
                  >
                    <span className="text-[10px] font-medium leading-none">
                      {WEEKDAY_SHORT[dow]}
                    </span>
                    <span
                      className={`text-xs font-bold leading-none ${isToday ? "text-white" : ""}`}
                    >
                      {day}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {isLoadingGrid
            ? Array.from({ length: 5 }).map((_, ri) => {
                const stagger = Math.min(ri, 16) * 35;
                return (
                  <tr
                    key={ri}
                    className="team-schedule-row-animate border-b border-gray-100"
                    style={{ animationDelay: `${stagger}ms` }}
                  >
                    <td
                      className="sticky left-0 z-10 bg-white border-r border-gray-200 px-3 py-2"
                      style={{ width: `${COL_EMPLOYEE_W}px`, minWidth: `${COL_EMPLOYEE_W}px`, maxWidth: `${COL_EMPLOYEE_W}px` }}
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-3 w-24 rounded" />
                          <Skeleton className="h-2 w-16 rounded" />
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: daysInMonth }, (_, ci) => {
                      const d = ci + 1;
                      const isTodayCol =
                        today.getFullYear() === year &&
                        today.getMonth() + 1 === month &&
                        today.getDate() === d;
                      return (
                        <td
                          key={ci}
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
                    })}
                  </tr>
                );
              })
            : employees?.map((employee, rowIndex) => (
                <EmployeeScheduleRow
                  key={employee.publicId}
                  rowIndex={rowIndex}
                  employee={employee}
                  month={month}
                  year={year}
                  daysInMonth={daysInMonth}
                  selectedDays={selectedDays[employee.publicId] ?? {}}
                  absencesByDate={
                    absencesByEmployeeDay[employee.publicId] ?? {}
                  }
                  holidays={holidayList}
                  canSelect={canSelect}
                  onDayToggle={onDayToggle}
                />
              ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}
