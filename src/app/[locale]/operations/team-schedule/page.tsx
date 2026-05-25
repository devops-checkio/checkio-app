"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import { CHEKIOButton, CHEKIOHeader } from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useGetAbsences, useGetEmployees } from "@/service/mantainer.service";
import {
  CalendarPlus,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AbsenceResponseDto } from "../absences/_components/absence.dto";
import { PersonType } from "../../mantainers/schedules/_components/schedule.dto";
import { DayCellRecord, TeamScheduleType } from "./_components/day-cell";
import ModalTeamConfirmDeletion, {
  TeamDeletionEntry,
} from "./_components/modal-team-confirm-deletion";
import ModalTeamConfirmFreeDay, {
  TeamFreeDayEntry,
} from "./_components/modal-team-confirm-free-day";
import ModalTeamMassAssignment, {
  TeamAssignmentEntry,
} from "./_components/modal-team-mass-assignment";
import { TeamScheduleGrid } from "./_components/team-schedule-grid";
import {
  TeamScheduleFilters,
  TeamScheduleToolbar,
} from "./_components/team-schedule-toolbar";

// ─── Types ────────────────────────────────────────────────────────────────────
type ExistingScheduleSlot = {
  publicId: string;
  code: string;
  startTime: string;
  workHours: number;
  workMinutes: number;
};

type SelectionEntry = {
  date: string;
  schedule: string; // code string — used by modals
  recordType?: string; // EMPLOYEE_SHIFT | EMPLOYEE_SCHEDULE | FREEDOM_*
  startTime?: string;
  workHours?: number;
  workMinutes?: number;
  scheduleName?: string;
  scheduleOptions?: Array<{
    scheduleId: string;
    scheduleCode: string;
    scheduleName?: string;
  }>;
  /** Horarios ya asignados en la celda (para validar traslapes en asignación masiva). */
  existingScheduleSlots?: ExistingScheduleSlot[];
};
type SelectionState = Record<string, Record<string, SelectionEntry>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toUtcDateKeyFromDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function parseUtcDate(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }
  const raw = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [y, m, day] = raw.split("-").map((part) => Number(part));
  if (!y || !m || !day) return null;
  return new Date(Date.UTC(y, m - 1, day));
}

/** yyyy-mm-dd: hoy o anterior en calendario local (no seleccionable). */
function isTodayOrPastLocalDateKey(dateKey: string): boolean {
  const raw = dateKey.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const [y, m, d] = raw.split("-").map((part) => Number(part));
  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth() + 1;
  const cd = now.getDate();
  if (y < cy) return true;
  if (y > cy) return false;
  if (m < cm) return true;
  if (m > cm) return false;
  return d <= cd;
}

function buildExistingScheduleSlots(
  record: DayCellRecord | undefined,
): ExistingScheduleSlot[] | undefined {
  if (!record) return undefined;
  if (
    record.type === TeamScheduleType.ABSENCE ||
    record.type === TeamScheduleType.FREEDAY_REQUEST
  ) {
    return undefined;
  }
  if (record.scheduleDetails?.length) {
    const slots = record.scheduleDetails
      .map((detail) => {
        const s = detail.schedule;
        if (!s?.publicId || !s.startTime) return null;
        return {
          publicId: s.publicId,
          code: s.code ?? "",
          startTime: s.startTime,
          workHours: s.workHours ?? 0,
          workMinutes: s.workMinutes ?? 0,
        };
      })
      .filter((x): x is ExistingScheduleSlot => x !== null);
    return slots.length ? slots : undefined;
  }
  const s = record.schedule;
  if (
    s?.publicId &&
    s.startTime &&
    (record.type === TeamScheduleType.EMPLOYEE_SHIFT ||
      record.type === TeamScheduleType.EMPLOYEE_SCHEDULE ||
      record.type === TeamScheduleType.FREEDOM_SHIFT ||
      record.type === TeamScheduleType.FREEDOM_SCHEDULE)
  ) {
    return [
      {
        publicId: s.publicId,
        code: s.code ?? "",
        startTime: s.startTime,
        workHours: s.workHours ?? 0,
        workMinutes: s.workMinutes ?? 0,
      },
    ];
  }
  return undefined;
}

// ─── Main component ───────────────────────────────────────────────────────────
function TeamScheduleContent() {
  const t = useTranslations("operations.teamSchedule");
  const { companyId, canCreate, canDelete, getTemplateUser } =
    useCookieSession();
  const templateUser = getTemplateUser();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState<TeamScheduleFilters>({
    search: "",
    documentNumber: "",
    branchId: undefined,
    personType: "EMPLOYEE",
  });
  const prevCompanyIdRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    const prev = prevCompanyIdRef.current;
    if (prev != null && prev !== companyId) {
      setFilters((f) => ({ ...f, branchId: undefined }));
    }
    prevCompanyIdRef.current = companyId;
  }, [companyId]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedDays, setSelectedDays] = useState<SelectionState>({});

  const [isFreeDayModalOpen, setIsFreeDayModalOpen] = useState(false);
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const visibleMonthRange = useMemo(() => {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));
    return {
      startDate,
      endDate,
      startDateKey: toUtcDateKeyFromDate(startDate),
      endDateKey: toUtcDateKeyFromDate(endDate),
    };
  }, [year, month]);

  const { data: absences, isLoading: isLoadingAbsences } = useGetAbsences({
    page: 1,
    pageSize: 500,
    sort: "asc",
    companyId: companyId || "",
    branchId: filters.branchId,
    fromDate: visibleMonthRange.startDateKey,
    toDate: visibleMonthRange.endDateKey,
    queryEnabled: !!companyId,
  });

  const absencesByEmployeeDay = useMemo(() => {
    const map: Record<
      string,
      Record<
        string,
        {
          absenceTypeName: string;
          typeCode: string;
          startDate: string | Date;
          endDate: string | Date;
          withoutPay: boolean;
        }
      >
    > = {};

    (absences?.data ?? []).forEach((absence: AbsenceResponseDto) => {
      const empKey = String(
        absence.employee?.publicId ?? absence.employeeId ?? "",
      ).trim();
      if (!empKey || empKey === "undefined" || empKey === "null") return;

      const absenceStart = parseUtcDate(absence.startDate);
      const absenceEnd = parseUtcDate(absence.endDate);
      if (!absenceStart || !absenceEnd) return;

      const rangeStart =
        absenceStart > visibleMonthRange.startDate
          ? absenceStart
          : visibleMonthRange.startDate;
      const rangeEnd =
        absenceEnd < visibleMonthRange.endDate
          ? absenceEnd
          : visibleMonthRange.endDate;
      if (rangeStart > rangeEnd) return;

      const name =
        absence.absenceType?.name || absence.absenceTypeName || "Ausencia";
      const typeCode =
        name.length <= 4
          ? name.toUpperCase()
          : `${name.slice(0, 4).toUpperCase()}`;

      for (
        let current = new Date(rangeStart);
        current <= rangeEnd;
        current = new Date(
          Date.UTC(
            current.getUTCFullYear(),
            current.getUTCMonth(),
            current.getUTCDate() + 1,
          ),
        )
      ) {
        const dayKey = toUtcDateKeyFromDate(current);
        if (!map[empKey]) map[empKey] = {};
        map[empKey][dayKey] = {
          absenceTypeName: name,
          typeCode,
          startDate: absence.startDate,
          endDate: absence.endDate,
          withoutPay: absence.withoutPay,
        };
      }
    });

    return map;
  }, [absences?.data, visibleMonthRange]);

  const { data: employeesData, isLoading: isLoadingEmployees } =
    useGetEmployees({
      page,
      pageSize,
      sort: "asc",
      search: filters.search || undefined,
      companyId: companyId || "",
      status: "active",
      documentNumber: filters.documentNumber || undefined,
      branchId: filters.branchId,
      personType:
        filters.personType === "ALL"
          ? undefined
          : (filters.personType as PersonType | undefined),
    });

  useEffect(() => {
    setPage(1);
  }, [filters, companyId]);

  useEffect(() => {
    setSelectedDays({});
  }, [month, year]);

  // ── Toggle ──
  const handleDayToggle = useCallback(
    (
      employeeId: string,
      dateStr: string,
      record: DayCellRecord | undefined,
    ) => {
      if (isTodayOrPastLocalDateKey(dateStr)) return;
      setSelectedDays((prev) => {
        const employeeDays = { ...(prev[employeeId] ?? {}) };
        if (employeeDays[dateStr]) {
          delete employeeDays[dateStr];
        } else if (record?.type === TeamScheduleType.ABSENCE) {
          const typeName = record.absence?.typeName ?? "Ausencia";
          const extra = record.absence?.withoutPay ? " · sin goce" : "";
          employeeDays[dateStr] = {
            date: dateStr,
            schedule: "AU",
            recordType: record.type,
            scheduleName: `${typeName}${extra}`,
          };
        } else if (record?.type === TeamScheduleType.FREEDAY_REQUEST) {
          employeeDays[dateStr] = {
            date: dateStr,
            schedule: "P",
            recordType: record.type,
            scheduleName:
              record.freedayRequest?.reason?.trim() || "Permiso aprobado",
          };
        } else {
          const isFree =
            record?.type === TeamScheduleType.FREEDOM_SHIFT ||
            record?.type === TeamScheduleType.FREEDOM_SCHEDULE;
          const scheduleCode = record?.schedule?.code ?? (isFree ? "L" : "-");
          employeeDays[dateStr] = {
            date: dateStr,
            schedule: scheduleCode,
            recordType: record?.type,
            startTime: record?.schedule?.startTime as string | undefined,
            workHours: record?.schedule?.workHours,
            workMinutes: record?.schedule?.workMinutes,
            scheduleName: record?.schedule?.name,
            existingScheduleSlots: buildExistingScheduleSlots(record),
            scheduleOptions:
              record?.scheduleDetails && record.scheduleDetails.length > 0
                ? record.scheduleDetails
                    .map((detail) => ({
                      scheduleId: detail.schedule.publicId,
                      scheduleCode: detail.schedule.code,
                      scheduleName: detail.schedule.name,
                    }))
                    .filter((option) => !!option.scheduleId)
                : record?.schedule?.publicId
                  ? [
                      {
                        scheduleId: record.schedule.publicId,
                        scheduleCode: record.schedule.code,
                        scheduleName: record.schedule.name,
                      },
                    ]
                  : undefined,
          };
        }
        const next = { ...prev, [employeeId]: employeeDays };
        if (Object.keys(next[employeeId]).length === 0) {
          delete next[employeeId];
        }
        return next;
      });
    },
    [],
  );

  const clearSelection = useCallback(() => setSelectedDays({}), []);

  // ── Derived counts ──
  const totalSelectedCount = useMemo(
    () =>
      Object.values(selectedDays).reduce(
        (acc, days) => acc + Object.keys(days).length,
        0,
      ),
    [selectedDays],
  );

  const totalSelectedEmployees = useMemo(
    () => Object.keys(selectedDays).length,
    [selectedDays],
  );

  const canSelectCells =
    canCreate(OrganizationPermissionCode.TEAM_SCHEDULE_OPERATIONS) ||
    canDelete(OrganizationPermissionCode.TEAM_SCHEDULE_OPERATIONS) ||
    canCreate(OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS) ||
    canDelete(OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS);

  const employees = employeesData?.data ?? [];

  const getEmployee = (employeeId: string) =>
    employees.find((e: any) => e.publicId === employeeId);

  const getEmployeeName = (employeeId: string): string => {
    const emp = getEmployee(employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}`.trim() : employeeId;
  };

  const getEmployeeDocNum = (employeeId: string): string =>
    getEmployee(employeeId)?.documentNumber ?? "";

  // ── Modal entries ──
  const freeDayEntries = useMemo<TeamFreeDayEntry[]>(
    () =>
      Object.entries(selectedDays).flatMap(([employeeId, days]) =>
        Object.entries(days).map(([date, dto]) => ({
          employeeId,
          employeeName: getEmployeeName(employeeId),
          date,
          schedule: dto.schedule,
        })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDays, employees],
  );

  const deletionEntries = useMemo<TeamDeletionEntry[]>(
    () =>
      Object.entries(selectedDays).flatMap(([employeeId, days]) =>
        Object.entries(days).map(([date, dto]) => ({
          employeeId,
          employeeName: getEmployeeName(employeeId),
          date,
          recordType: dto.recordType,
          scheduleOptions: dto.scheduleOptions,
        })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDays, employees],
  );

  const assignmentEntries = useMemo<TeamAssignmentEntry[]>(
    () =>
      Object.entries(selectedDays).flatMap(([employeeId, days]) =>
        Object.entries(days).map(([date, dto]) => ({
          employeeId,
          employeeName: getEmployeeName(employeeId),
          date,
          schedule: dto.schedule,
          existingScheduleSlots: dto.existingScheduleSlots,
          personType: getEmployee(employeeId)?.personType as
            | PersonType
            | undefined,
        })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDays, employees],
  );

  const pagination = employeesData?.pagination;

  return (
    <>
      <CHEKIOHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[
          t("breadcrumbs.operations"),
          t("breadcrumbs.teamSchedule"),
        ]}
        icon={CalendarRange}
        actions={
          <div
            className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-200/80 bg-gradient-to-r from-gray-50 to-slate-50/80 px-3 py-1.5 text-xs text-gray-600 shadow-sm"
            title={t("subtitle")}
          >
            <ListChecks
              className="h-4 w-4 shrink-0"
              style={{ color: `${templateUser.primary}` }}
            />
            <span className="font-medium text-gray-700">
              {t("headerBadge")}
            </span>
          </div>
        }
      />

      <TeamScheduleToolbar
        key={companyId ?? "no-company"}
        currentDate={currentDate}
        filters={filters}
        onPrevMonth={() =>
          setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
          )
        }
        onNextMonth={() =>
          setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
          )
        }
        onTodayMonth={() => setCurrentDate(new Date())}
        onMonthChange={(m) =>
          setCurrentDate(new Date(currentDate.getFullYear(), m, 1))
        }
        onYearChange={(y) =>
          setCurrentDate(new Date(y, currentDate.getMonth(), 1))
        }
        onFiltersChange={setFilters}
        onClearSelection={clearSelection}
        selectionBar={
          totalSelectedCount > 0 ? (
            <>
              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                {t("actions.daysSelected", {
                  count: totalSelectedCount,
                  employees: totalSelectedEmployees,
                })}
              </span>
              {(canCreate(
                OrganizationPermissionCode.TEAM_SCHEDULE_OPERATIONS,
              ) ||
                canCreate(
                  OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS,
                )) && (
                <CHEKIOButton
                  type="button"
                  variant="approve"
                  onClick={() => setIsFreeDayModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  {t("actions.freeDay")}
                </CHEKIOButton>
              )}
              {(canDelete(
                OrganizationPermissionCode.TEAM_SCHEDULE_OPERATIONS,
              ) ||
                canDelete(
                  OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS,
                )) && (
                <CHEKIOButton
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeletionModalOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("actions.delete")}
                </CHEKIOButton>
              )}
              {(canCreate(
                OrganizationPermissionCode.TEAM_SCHEDULE_OPERATIONS,
              ) ||
                canCreate(
                  OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS,
                )) && (
                <CHEKIOButton
                  type="button"
                  variant="primary"
                  onClick={() => setIsAssignmentModalOpen(true)}
                >
                  <CalendarPlus className="h-4 w-4" />
                  {t("actions.assign")}
                </CHEKIOButton>
              )}
              <CHEKIOButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-slate-500 hover:text-slate-800"
                title="Limpiar selección"
              >
                <X className="h-4 w-4" />
              </CHEKIOButton>
            </>
          ) : undefined
        }
      />

      {/* Grid */}
      <div className="min-w-0 max-w-full rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/[0.03]">
        <TeamScheduleGrid
          employees={employees}
          isLoadingEmployees={isLoadingEmployees}
          month={month}
          year={year}
          companyId={companyId}
          absencesByEmployeeDay={absencesByEmployeeDay}
          isLoadingAbsences={isLoadingAbsences}
          selectedDays={selectedDays}
          canSelect={canSelectCells}
          onDayToggle={handleDayToggle}
        />

        {/* Pagination */}
        {!isLoadingEmployees && pagination && pagination.totalCount > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/90 px-5 py-3.5 sm:flex-row">
            <span className="text-sm text-gray-600">
              {t("filters.pagination.showing", {
                current: employees.length,
                total: pagination.totalCount,
              })}
            </span>
            <div className="flex items-center gap-2">
              <CHEKIOButton
                variant="secondaryBlue"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("filters.pagination.previous")}
              </CHEKIOButton>
              <span className="min-w-[7rem] rounded-lg border border-gray-200 bg-white px-4 py-2 text-center text-sm font-medium tabular-nums text-gray-800 shadow-sm">
                {t("filters.pagination.page", {
                  current: page,
                  total: pagination.totalPages,
                })}
              </span>
              <CHEKIOButton
                variant="secondaryBlue"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages}
                className="gap-1.5"
              >
                {t("filters.pagination.next")}
                <ChevronRight className="h-4 w-4" />
              </CHEKIOButton>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ModalTeamConfirmFreeDay
        isOpen={isFreeDayModalOpen}
        onClose={() => setIsFreeDayModalOpen(false)}
        entries={freeDayEntries}
        onSuccess={() => {
          setIsFreeDayModalOpen(false);
          clearSelection();
        }}
      />

      <ModalTeamConfirmDeletion
        isOpen={isDeletionModalOpen}
        onClose={() => setIsDeletionModalOpen(false)}
        entries={deletionEntries}
        onSuccess={() => {
          setIsDeletionModalOpen(false);
          clearSelection();
        }}
      />

      {isAssignmentModalOpen && (
        <ModalTeamMassAssignment
          isOpen={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
          entries={assignmentEntries}
          companyIds={companyId ? [companyId] : []}
          personType={
            filters.personType === "ALL"
              ? undefined
              : (filters.personType as PersonType | undefined)
          }
          onSuccess={() => {
            setIsAssignmentModalOpen(false);
            clearSelection();
          }}
        />
      )}
    </>
  );
}

export default function TeamSchedulePage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={[
        OrganizationPermissionCode.TEAM_SCHEDULE_OPERATIONS,
        OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS,
      ]}
    >
      <TeamScheduleContent />
    </AccessNotGranted>
  );
}
