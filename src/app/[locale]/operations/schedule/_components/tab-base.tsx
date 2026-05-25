"use client";

import FilterJob from "@/app/[locale]/_components/filters/FilterJob";
import OrganizationSelector from "@/app/[locale]/mantainers/employees/_components/organization-selector";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { PaginationFilterDto } from "@/dto/pagination";
import { useGetBranches, useGetEmployees } from "@/service/mantainer.service";
import {
  Building2,
  CalendarClock,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Hash,
  Mail,
  Pencil,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

enum ButtonVariant {
  SEARCH = "search",
  REFRESH = "refresh",
  SECONDARY_BLUE = "secondaryBlue",
}

interface TabBaseProps {
  status: "active" | "expiring" | "recent_dismissals" | "inactive";
  title: string;
  personType?: "EMPLOYEE" | "STUDENT";
}

function ScheduleEmployeesTableHead({
  t,
  templatePrimary,
  canUpdateSchedule,
}: {
  t: (key: string) => string;
  templatePrimary: string;
  canUpdateSchedule: boolean;
}) {
  const ic = { color: `${templatePrimary}99` };
  return (
    <tr>
      <CHEKIOTableHead className="min-w-[88px]">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Hash className="h-4 w-4" style={ic} />
          {t("table.headers.code")}
        </span>
      </CHEKIOTableHead>
      <CHEKIOTableHead className="min-w-[120px]">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <User className="h-4 w-4" style={ic} />
          {t("table.headers.firstName")}
        </span>
      </CHEKIOTableHead>
      <CHEKIOTableHead className="min-w-[120px]">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <User className="h-4 w-4" style={ic} />
          {t("table.headers.lastName")}
        </span>
      </CHEKIOTableHead>
      <CHEKIOTableHead className="min-w-[140px]">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Hash className="h-4 w-4" style={ic} />
          {t("table.headers.documentNumber")}
        </span>
      </CHEKIOTableHead>
      <CHEKIOTableHead className="min-w-[180px]">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Mail className="h-4 w-4" style={ic} />
          {t("table.headers.email")}
        </span>
      </CHEKIOTableHead>
      <CHEKIOTableHead className="min-w-[120px]">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Building2 className="h-4 w-4" style={ic} />
          {t("table.headers.branch")}
        </span>
      </CHEKIOTableHead>
      <CHEKIOTableHead className="min-w-[110px]">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <CalendarPlus className="h-4 w-4" style={ic} />
          {t("table.headers.startDate")}
        </span>
      </CHEKIOTableHead>
      <CHEKIOTableHead className="min-w-[110px]">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <CalendarClock className="h-4 w-4" style={ic} />
          {t("table.headers.endDate")}
        </span>
      </CHEKIOTableHead>
      <CHEKIOTableHead className="min-w-[120px]">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <ClipboardList className="h-4 w-4" style={ic} />
          {t("table.headers.contractType")}
        </span>
      </CHEKIOTableHead>
      {canUpdateSchedule && (
        <CHEKIOTableHead className="min-w-[100px] text-right text-xs font-semibold uppercase tracking-wider">
          {t("table.headers.actions")}
        </CHEKIOTableHead>
      )}
    </tr>
  );
}

export default function TabBase({
  status,
  title,
  personType = "EMPLOYEE",
}: TabBaseProps) {
  const t = useTranslations("operations.schedule.tabBase");
  const router = useRouter();
  const { companyId, canUpdate, getTemplateUser } = useCookieSession();
  const canUpdateSchedule =
    canUpdate(OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS) ||
    canUpdate(
      OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS,
    );
  const templateUser = getTemplateUser();
  const templatePrimary = templateUser.primary;

  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "desc" as "asc" | "desc",
  });

  const { handleSubmit, watch, setValue, control, reset } = useForm({
    defaultValues: {
      search: "",
      documentNumber: "",
      jobId: undefined,
      branchId: undefined,
      organizationId: undefined,
    },
  });

  const { data: branches } = useGetBranches({
    page: 1,
    pageSize: 1000,
    sort: "asc",
  });

  const jobId = watch("jobId");

  const { data, isLoading, error, refetch } = useGetEmployees({
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    search: watch("search"),
    companyId: companyId || "",
    status,
    documentNumber: watch("documentNumber"),
    jobId: watch("jobId"),
    branchId: watch("branchId"),
    personType,
  });

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data]);

  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
      }));
    },
    []
  );

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: newPageSize,
      current: 1,
    }));
  }, []);

  const handleLevelChange = (
    value: string,
    field: "search" | "documentNumber" | "jobId" | "branchId" | "organizationId"
  ) => {
    setValue(field, value);
  };

  const onSubmitSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleClearSearch = () => {
    reset();
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  if (error) {
    return (
      <div className="px-5 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{t("error.message")}</p>
          <CHEKIOButton
            variant={ButtonVariant.SECONDARY_BLUE}
            onClick={() => refetch()}
            className="mt-4"
          >
            {t("error.retry")}
          </CHEKIOButton>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
          <Building2 className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {t("table.selectCompanyTitle")}
        </h3>
        <p className="mt-1 max-w-md text-center text-sm text-gray-500">
          {t("table.selectCompany")}
        </p>
      </div>
    );
  }

  const paginationFooter =
    !isLoading && data?.data && data.data.length > 0 ? (
      <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="text-sm text-gray-600">
            {t("pagination.showing", {
              current: data.data.length,
              total: pagination.totalCount,
            })}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              {t("pagination.recordsPerPage")}
            </label>
            <CHEKIOSelect
              value={pagination.pageSize.toString()}
              onValueChange={(value) => {
                handlePageSizeChange(parseInt(value, 10));
              }}
            >
              <CHEKIOSelectTrigger className="w-24">
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
            variant={ButtonVariant.SECONDARY_BLUE}
            onClick={() =>
              handlePaginationChange(
                pagination.current - 1,
                pagination.pageSize
              )
            }
            disabled={pagination.current === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            {t("pagination.previous")}
          </CHEKIOButton>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
            {t("pagination.page", {
              current: pagination.current,
              total: pagination.totalPages,
            })}
          </div>
          <CHEKIOButton
            variant={ButtonVariant.SECONDARY_BLUE}
            onClick={() =>
              handlePaginationChange(
                pagination.current + 1,
                pagination.pageSize
              )
            }
            disabled={pagination.current >= pagination.totalPages}
          >
            {t("pagination.next")}
            <ChevronRight className="h-4 w-4" />
          </CHEKIOButton>
        </div>
      </div>
    ) : null;

  return (
    <div className="w-full">
      <h2 className="sr-only">{title}</h2>
      <div className="border-b border-gray-200 px-5 py-4">
        <form
          onSubmit={handleSubmit(onSubmitSearch)}
          className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end"
        >
          <div className="space-y-1.5 md:col-span-3">
            <label
              htmlFor="schedule-filter-search"
              className="text-sm font-medium text-gray-700"
            >
              {t("search")}
            </label>
            <Controller
              name="search"
              control={control}
              render={({ field }) => (
                <CHEKIOInput
                  id="schedule-filter-search"
                  {...field}
                  placeholder={t("placeholderSearch")}
                />
              )}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="schedule-filter-document"
              className="text-sm font-medium text-gray-700"
            >
              {t("documentNumber")}
            </label>
            <Controller
              name="documentNumber"
              control={control}
              render={({ field }) => (
                <CHEKIOInput
                  id="schedule-filter-document"
                  {...field}
                  placeholder={t("placeholderDocument")}
                />
              )}
            />
          </div>
          <div className="md:col-span-2">
            <FilterJob
              control={control}
              value={jobId}
              onChange={(value) => handleLevelChange(value, "jobId")}
              onClear={() => setValue("jobId", undefined)}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              {t("branch")}
            </label>
            <Controller
              name="branchId"
              control={control}
              render={({ field }) => (
                <CHEKIOSelect
                  value={field.value || undefined}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleLevelChange(value, "branchId");
                  }}
                >
                  <CHEKIOSelectTrigger>
                    <CHEKIOSelectValue placeholder={t("selectBranch")} />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    {branches?.data.map((branch: { publicId: string; name: string }) => (
                      <CHEKIOSelectItem
                        key={branch.publicId}
                        value={branch.publicId}
                      >
                        {branch.name}
                      </CHEKIOSelectItem>
                    ))}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              )}
            />
          </div>
          {companyId && (
            <div className="md:col-span-3">
              <OrganizationSelector
                control={control}
                name="organizationId"
                companyId={companyId}
                layout="horizontal"
              />
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2 md:col-span-12">
            <CHEKIOButton
              variant={ButtonVariant.REFRESH}
              type="button"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
              {t("buttons.clear")}
            </CHEKIOButton>
            <CHEKIOButton variant={ButtonVariant.SEARCH} type="submit">
              <Search className="h-4 w-4" />
              {t("buttons.search")}
            </CHEKIOButton>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <>
            <CHEKIOTable className="rounded-none border-0 shadow-none">
              <CHEKIOTableHeader>
                <ScheduleEmployeesTableHead
                  t={t}
                  templatePrimary={templatePrimary}
                  canUpdateSchedule={canUpdateSchedule}
                />
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {Array.from({ length: pagination.pageSize }).map((_, index) => (
                  <CHEKIOTableRow key={index} index={index}>
                    {Array.from({ length: 9 }).map((__, ci) => (
                      <CHEKIOTableCell key={ci} className="px-5 py-3.5">
                        <Skeleton className="h-4 w-full max-w-[140px] rounded" />
                      </CHEKIOTableCell>
                    ))}
                    {canUpdateSchedule && (
                      <CHEKIOTableCell className="px-5 py-3.5 text-right">
                        <div className="flex justify-end">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                      </CHEKIOTableCell>
                    )}
                  </CHEKIOTableRow>
                ))}
              </CHEKIOTableBody>
            </CHEKIOTable>
            <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-36 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            </div>
          </>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
          </div>
        ) : (
          <>
            <CHEKIOTable className="rounded-none border-0 shadow-none">
              <CHEKIOTableHeader>
                <ScheduleEmployeesTableHead
                  t={t}
                  templatePrimary={templatePrimary}
                  canUpdateSchedule={canUpdateSchedule}
                />
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {data.data.map((employee: any, index: number) => {
                  const branch = branches?.data.find(
                    (b: any) => b.publicId === employee.branchId
                  );

                  return (
                    <CHEKIOTableRow key={employee.publicId} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5 font-mono text-sm text-gray-600">
                        {employee.code}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm font-medium text-gray-900">
                        {employee.firstName}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {employee.lastName}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {employee.documentNumber}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {employee.personalEmail}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {branch ? branch.name : "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm tabular-nums text-gray-600">
                        {DateTime.fromISO(employee.startDate).toFormat(
                          "dd/MM/yyyy"
                        )}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm tabular-nums text-gray-600">
                        {employee.endDate
                          ? DateTime.fromISO(employee.endDate).toFormat(
                              "dd/MM/yyyy"
                            )
                          : "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {employee.isIndefiniteTerm
                          ? t("contractType.indefinite")
                          : t("contractType.fixedTerm")}
                      </CHEKIOTableCell>
                      {canUpdateSchedule && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/operations/schedule/${employee.publicId}${
                                    personType === "STUDENT"
                                      ? "?from=student-schedule"
                                      : ""
                                  }`
                                )
                              }
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                              title={t("buttons.edit")}
                              aria-label={t("aria.editSchedule")}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </div>
                        </CHEKIOTableCell>
                      )}
                    </CHEKIOTableRow>
                  );
                })}
              </CHEKIOTableBody>
            </CHEKIOTable>
            {paginationFooter}
          </>
        )}
      </div>
    </div>
  );
}
