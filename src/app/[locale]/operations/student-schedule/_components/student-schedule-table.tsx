"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import {
  useGetBranches,
  useGetCalendar,
  useGetEmployees,
} from "@/service/mantainer.service";
import {
  Badge,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Hash,
  Mail,
  Pencil,
  Search,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface StudentScheduleTableProps {
  status: "active" | "inactive";
}

interface Filters {
  search: string;
  documentNumber: string;
  branchId?: string;
}

function TodayAssignmentCell({ employeeId }: { employeeId: string }) {
  const now = new Date();
  const { data: calendar, isLoading } = useGetCalendar({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    employeeId,
  });

  if (isLoading) {
    return (
      <div className="h-4 w-14 animate-pulse rounded bg-gray-200" aria-hidden />
    );
  }

  const today = now.getDate();
  const todayRecord = (calendar ?? []).find((d: any) => d.day === today);
  const hasAssigned =
    !!todayRecord &&
    (todayRecord.type === "EMPLOYEE_SCHEDULE" ||
      todayRecord.type === "EMPLOYEE_SHIFT");

  return hasAssigned ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Sí
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      <XCircle className="h-3.5 w-3.5" />
      No
    </span>
  );
}

export default function StudentScheduleTable({
  status,
}: StudentScheduleTableProps) {
  const t = useTranslations("operations.studentSchedule");
  const router = useRouter();
  const { companyId, canUpdate, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    documentNumber: "",
    branchId: undefined,
  });

  const { data: branches } = useGetBranches({
    page: 1,
    pageSize: 1000,
    sort: "asc",
    companyId: companyId || undefined,
  });

  const {
    data: employeesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetEmployees({
    page,
    pageSize,
    sort: "asc",
    companyId: companyId || "",
    status,
    personType: "STUDENT",
    search: filters.search || undefined,
    documentNumber: filters.documentNumber || undefined,
    branchId: filters.branchId,
  });

  const canUpdateSchedule =
    canUpdate(
      OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS,
    ) || canUpdate(OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS);

  const employees = employeesData?.data ?? [];
  const pagination = employeesData?.pagination;

  const branchById = useMemo(() => {
    const map = new Map<string, string>();
    (branches?.data ?? []).forEach((b: any) => map.set(b.publicId, b.name));
    return map;
  }, [branches?.data]);

  const showActions = canUpdateSchedule;
  const colCount = showActions ? 7 : 6;

  if (isError) {
    return (
      <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-red-600">
            {(error as Error)?.message
              ? String((error as Error).message)
              : "Error al cargar estudiantes"}
          </span>
          <CHEKIOButton
            variant="secondaryBlue"
            size="sm"
            onClick={() => void refetch()}
            className="flex h-auto min-w-fit items-center gap-1.5 px-2 py-1.5 w-auto"
          >
            <span className="whitespace-nowrap text-xs">Reintentar</span>
          </CHEKIOButton>
        </div>
      </div>
    );
  }

  const primaryMuted = `${templateUser.primary}99`;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full">
        <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50/50 px-5 py-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative w-full min-w-0 sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <CHEKIOInput
                className="pl-9"
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
                placeholder={t("filters.searchPlaceholder")}
              />
            </div>
            <CHEKIOInput
              className="w-full sm:w-48"
              value={filters.documentNumber}
              onChange={(e) =>
                setFilters((f) => ({ ...f, documentNumber: e.target.value }))
              }
              placeholder={t("filters.documentPlaceholder")}
            />
            <CHEKIOSelect
              value={filters.branchId || "all"}
              onValueChange={(value) =>
                setFilters((f) => ({
                  ...f,
                  branchId: value === "all" ? undefined : value,
                }))
              }
            >
              <CHEKIOSelectTrigger className="w-full sm:w-56">
                <CHEKIOSelectValue placeholder={t("filters.branchAll")} />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                <CHEKIOSelectItem value="all">
                  {t("filters.branchAll")}
                </CHEKIOSelectItem>
                {(branches?.data ?? []).map((branch: any) => (
                  <CHEKIOSelectItem key={branch.publicId} value={branch.publicId}>
                    {branch.name}
                  </CHEKIOSelectItem>
                ))}
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <CHEKIOButton
              type="button"
              variant="search"
              className="flex items-center justify-center gap-1.5"
              onClick={() => setPage(1)}
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap text-sm">
                {t("filters.search")}
              </span>
            </CHEKIOButton>
            <CHEKIOButton
              type="button"
              variant="secondaryBlue"
              className="flex items-center justify-center gap-1.5"
              onClick={() => {
                setFilters({
                  search: "",
                  documentNumber: "",
                  branchId: undefined,
                });
                setPage(1);
              }}
            >
              <X className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap text-sm">
                {t("filters.clear")}
              </span>
            </CHEKIOButton>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <CHEKIOTable className="w-full rounded-none border-0 shadow-none">
            <CHEKIOTableHeader>
              <tr>
                <CHEKIOTableHead className="min-w-[110px]">
                  <span className="flex items-center gap-2">
                    <Hash
                      className="h-4 w-4"
                      style={{ color: primaryMuted }}
                    />
                    {t("table.headers.code")}
                  </span>
                </CHEKIOTableHead>
                <CHEKIOTableHead className="min-w-[180px]">
                  <span className="flex items-center gap-2">
                    <UserRound
                      className="h-4 w-4"
                      style={{ color: primaryMuted }}
                    />
                    {t("table.headers.name")}
                  </span>
                </CHEKIOTableHead>
                <CHEKIOTableHead className="min-w-[150px]">
                  <span className="flex items-center gap-2">
                    <Badge
                      className="h-4 w-4"
                      style={{ color: primaryMuted }}
                    />
                    {t("table.headers.document")}
                  </span>
                </CHEKIOTableHead>
                <CHEKIOTableHead className="min-w-[220px]">
                  <span className="flex items-center gap-2">
                    <Mail
                      className="h-4 w-4"
                      style={{ color: primaryMuted }}
                    />
                    {t("table.headers.email")}
                  </span>
                </CHEKIOTableHead>
                <CHEKIOTableHead className="min-w-[160px]">
                  <span className="flex items-center gap-2">
                    <Building2
                      className="h-4 w-4"
                      style={{ color: primaryMuted }}
                    />
                    {t("table.headers.branch")}
                  </span>
                </CHEKIOTableHead>
                <CHEKIOTableHead className="min-w-[200px]">
                  <span className="flex items-center gap-2">
                    <CalendarCheck
                      className="h-4 w-4"
                      style={{ color: primaryMuted }}
                    />
                    {t("table.headers.todaySchedule")}
                  </span>
                </CHEKIOTableHead>
                {showActions && (
                  <CHEKIOTableHead className="min-w-[100px] text-right">
                    {t("table.actions")}
                  </CHEKIOTableHead>
                )}
              </tr>
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {isLoading ? (
                Array.from({ length: pageSize }).map((_, index) => (
                  <CHEKIOTableRow key={`loading-${index}`} index={index}>
                    {Array.from({ length: colCount }).map((_, cellIndex) => {
                      const isActionsColumn =
                        showActions && cellIndex === colCount - 1;
                      return (
                        <CHEKIOTableCell
                          key={cellIndex}
                          className={
                            isActionsColumn
                              ? "px-5 py-3.5 text-right"
                              : "px-5 py-3.5"
                          }
                        >
                          {isActionsColumn ? (
                            <div className="ml-auto h-8 w-8 max-w-full animate-pulse rounded-lg bg-gray-200" />
                          ) : (
                            <div className="h-4 w-full min-w-0 max-w-full animate-pulse rounded bg-gray-200" />
                          )}
                        </CHEKIOTableCell>
                      );
                    })}
                  </CHEKIOTableRow>
                ))
              ) : employees.length === 0 ? (
                <CHEKIOTableRow index={0}>
                  <CHEKIOTableCell
                    colSpan={colCount}
                    className="px-6 py-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
                        <Users className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {t("table.noData")}
                      </h3>
                      <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
                        {t("subtitle")}
                      </p>
                    </div>
                  </CHEKIOTableCell>
                </CHEKIOTableRow>
              ) : (
                employees.map((student: any, index: number) => (
                  <CHEKIOTableRow
                    key={student.publicId}
                    index={index}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/operations/schedule/${student.publicId}`)
                    }
                  >
                    <CHEKIOTableCell className="px-5 py-3.5 font-mono text-sm text-gray-600 tabular-nums">
                      {student.code ?? "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                      {`${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() ||
                        "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600 tabular-nums">
                      {student.documentNumber ?? "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                      {student.personalEmail || "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                      {branchById.get(student.branchId || "") ||
                        student.branch ||
                        "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <TodayAssignmentCell employeeId={student.publicId} />
                    </CHEKIOTableCell>
                    {showActions && (
                      <CHEKIOTableCell
                        onClick={(e) => e.stopPropagation()}
                        className="px-5 py-3.5 text-right"
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/operations/schedule/${student.publicId}`,
                                )
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                              title={t("table.editSchedule")}
                              aria-label={t("table.editSchedule")}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("table.editSchedule")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </CHEKIOTableCell>
                    )}
                  </CHEKIOTableRow>
                ))
              )}
            </CHEKIOTableBody>
          </CHEKIOTable>
        </div>

        {!isLoading && pagination && pagination.totalCount > 0 && (
          <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="text-sm text-gray-600">
                {t("pagination.showing", {
                  current: employees.length,
                  total: pagination.totalCount,
                })}
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="student-schedule-page-size"
                  className="whitespace-nowrap text-sm font-medium text-gray-700"
                >
                  {t("pagination.recordsPerPage")}
                </label>
                <CHEKIOSelect
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                >
                  <CHEKIOSelectTrigger
                    id="student-schedule-page-size"
                    className="w-24"
                  >
                    <CHEKIOSelectValue />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    <CHEKIOSelectItem value="10">10</CHEKIOSelectItem>
                    <CHEKIOSelectItem value="20">20</CHEKIOSelectItem>
                    <CHEKIOSelectItem value="50">50</CHEKIOSelectItem>
                    <CHEKIOSelectItem value="100">100</CHEKIOSelectItem>
                    <CHEKIOSelectItem value="200">200</CHEKIOSelectItem>
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                {t("pagination.previous")}
              </CHEKIOButton>
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
                {t("pagination.page", {
                  current: page,
                  total: pagination.totalPages,
                })}
              </div>
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages}
              >
                {t("pagination.next")}
                <ChevronRight className="h-4 w-4" />
              </CHEKIOButton>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
