"use client";

import OrganizationSelector from "@/app/[locale]/mantainers/employees/_components/organization-selector";
import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOModal,
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
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteAbsence,
  useGetAbsenceTypes,
  useGetAbsences,
  useGetBranches,
  useGetJobs,
} from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import { handleError } from "@/utils/error";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import AbsenceModalUpsert from "./absence-modal-upsert";
import { AbsenceTypeResponseDto } from "@/app/[locale]/mantainers/absence-types/_components/absence-type.dto";
import {
  AbsenceFindFilterDto,
  AbsenceResponseDto,
  isAbsenceActionLocked,
} from "./absence.dto";
import {
  AbsencePeriodFilterMode,
  buildYearOptions,
  getLastMonthDisplayRange,
  resolvePeriodToIso,
} from "./absence-period-filter";

type AbsenceTabFilterFormValues = {
  search: string;
  documentNumber: string;
  jobId?: string;
  branchId?: string;
  organizationId?: string;
  absenceTypeId?: string;
  fromDateDisplay: string;
  toDateDisplay: string;
  filterYear: string;
  subUnit1Id?: string;
  subUnit2Id?: string;
  subUnit3Id?: string;
  subUnit4Id?: string;
  subUnit5Id?: string;
  subUnit6Id?: string;
  subUnit7Id?: string;
  subUnit8Id?: string;
};

export default function TabBase() {
  const { toast } = useToast();
  const t = useTranslations("operations.absences");
  const queryClient = useQueryClient();
  const { companyId, canDelete, canUpdate, isProfileEmployee, profile } =
    useCookieSession();
  const sessionEmployeePublicId = profile?.user?.employeeId;
  const ownEmployeeIdFilter =
    isProfileEmployee() && sessionEmployeePublicId
      ? sessionEmployeePublicId
      : undefined;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] =
    useState<AbsenceResponseDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAbsenceId, setDeletingAbsenceId] = useState<string | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [organizationSelectorKey, setOrganizationSelectorKey] = useState(0);
  const [periodMode, setPeriodMode] = useState<AbsencePeriodFilterMode>(
    AbsencePeriodFilterMode.RANGE,
  );
  const [initialPeriod] = useState(() => {
    const from = DateTime.now().minus({ months: 1 });
    const to = DateTime.now().plus({ months: 3 });
    return {
      fromIso: from.toFormat("yyyy-MM-dd"),
      toIso: to.toFormat("yyyy-MM-dd"),
      fromDisplay: from.toFormat("dd/MM/yyyy"),
      toDisplay: to.toFormat("dd/MM/yyyy"),
      filterYear: String(DateTime.now().year),
    };
  });
  const yearOptions = useMemo(() => buildYearOptions(), []);

  const [filterValues, setFilterValues] = useState({
    search: "",
    documentNumber: "",
    jobId: "",
    branchId: "",
    organizationId: "",
    absenceTypeId: "",
    fromDate: initialPeriod.fromIso,
    toDate: initialPeriod.toIso,
  });

  const { watch, setValue, control, reset, getValues } =
    useForm<AbsenceTabFilterFormValues>({
    defaultValues: {
      search: "",
      documentNumber: "",
      jobId: undefined,
      branchId: undefined,
      organizationId: undefined,
      absenceTypeId: undefined,
      fromDateDisplay: initialPeriod.fromDisplay,
      toDateDisplay: initialPeriod.toDisplay,
      filterYear: initialPeriod.filterYear,
      subUnit1Id: undefined,
      subUnit2Id: undefined,
      subUnit3Id: undefined,
      subUnit4Id: undefined,
      subUnit5Id: undefined,
      subUnit6Id: undefined,
      subUnit7Id: undefined,
      subUnit8Id: undefined,
    },
  });

  const { data: jobs } = useGetJobs({
    page: 1,
    pageSize: 200,
    sort: "asc",
  });

  const { data: branches } = useGetBranches({
    page: 1,
    pageSize: 200,
    sort: "asc",
  });

  const { data: absenceTypesData } = useGetAbsenceTypes({
    page: 1,
    pageSize: 200,
    sort: "asc",
  });

  const branchId = watch("branchId");
  const jobId = watch("jobId");
  const documentNumber = watch("documentNumber");
  const search = watch("search");
  const fromDateDisplay = watch("fromDateDisplay");
  const toDateDisplay = watch("toDateDisplay");
  const filterYear = watch("filterYear");
  const absenceTypeId = watch("absenceTypeId");
  const { mutate: deleteAbsence, isPending: isDeletingAbsence } =
    useDeleteAbsence();

  const getFilterParams = useCallback((): AbsenceFindFilterDto => {
    return {
      page,
      pageSize,
      search: filterValues.search,
      documentNumber: filterValues.documentNumber,
      jobId: filterValues.jobId,
      branchId: filterValues.branchId,
      organizationId: filterValues.organizationId,
      absenceTypeId: filterValues.absenceTypeId || undefined,
      fromDate: filterValues.fromDate,
      toDate: filterValues.toDate,
      employeeId: ownEmployeeIdFilter,
      companyId: companyId!,
    };
  }, [filterValues, page, pageSize, companyId, ownEmployeeIdFilter]);

  const { data: absencesData, isLoading } = useGetAbsences({
    ...getFilterParams(),
    queryEnabled: !!companyId,
  });

  useEffect(() => {
    if (refetchTrigger > 0) {
      // Refetch is handled by react-query automatically when params change
    }
  }, [refetchTrigger]);

  const handleOpenModal = (absence?: AbsenceResponseDto) => {
    if (absence) {
      setEditingAbsence(absence);
    } else {
      setEditingAbsence(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAbsence(null);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingAbsenceId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingAbsence) {
      setIsDeleteModalOpen(false);
      setDeletingAbsenceId(null);
      setDeleteError(null);
    }
  };

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
    queryClient.invalidateQueries({ queryKey: ["GetAbsences"] });
  };

  const handleDelete = (id: string) => {
    setDeleteError(null);
    deleteAbsence(id, {
      onSuccess: () => {
        toast({
          title: t("delete.success"),
          variant: "default",
        });
        handleCloseDeleteModal();
        refetch();
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message || error?.message || t("delete.error");
        setDeleteError(errorMessage);
        handleError(error, toast);
      },
    });
  };

  const handleSearch = useCallback(() => {
    const v = getValues();
    const resolved = resolvePeriodToIso(periodMode, {
      fromDateDisplay: v.fromDateDisplay ?? "",
      toDateDisplay: v.toDateDisplay ?? "",
      filterYear: v.filterYear ?? "",
    });
    if (!resolved.ok) {
      toast({
        title: t("filters.validation.title"),
        description: t(`filters.validation.${resolved.errorKey}`),
        variant: "destructive",
      });
      return;
    }
    if (periodMode === AbsencePeriodFilterMode.LAST_MONTH) {
      const { fromDisplay, toDisplay } = getLastMonthDisplayRange();
      setValue("fromDateDisplay", fromDisplay);
      setValue("toDateDisplay", toDisplay);
    }
    setFilterValues({
      search: v.search || "",
      documentNumber: v.documentNumber || "",
      jobId: v.jobId || "",
      branchId: v.branchId || "",
      organizationId: v.organizationId || "",
      absenceTypeId: v.absenceTypeId || "",
      fromDate: resolved.fromDate,
      toDate: resolved.toDate,
    });
    setPage(1);
    setRefetchTrigger((prev) => prev + 1);
  }, [getValues, periodMode, setValue, t, toast]);

  const handleReset = useCallback(() => {
    setPeriodMode(AbsencePeriodFilterMode.RANGE);
    reset({
      search: "",
      documentNumber: "",
      jobId: undefined,
      branchId: undefined,
      organizationId: undefined,
      absenceTypeId: undefined,
      fromDateDisplay: initialPeriod.fromDisplay,
      toDateDisplay: initialPeriod.toDisplay,
      filterYear: initialPeriod.filterYear,
      subUnit1Id: undefined,
      subUnit2Id: undefined,
      subUnit3Id: undefined,
      subUnit4Id: undefined,
      subUnit5Id: undefined,
      subUnit6Id: undefined,
      subUnit7Id: undefined,
      subUnit8Id: undefined,
    });
    setOrganizationSelectorKey((k) => k + 1);
    setFilterValues({
      search: "",
      documentNumber: "",
      jobId: "",
      branchId: "",
      organizationId: "",
      absenceTypeId: "",
      fromDate: initialPeriod.fromIso,
      toDate: initialPeriod.toIso,
    });
    setPage(1);
    setRefetchTrigger((prev) => prev + 1);
  }, [reset, initialPeriod]);

  const handlePeriodModeChange = (value: string) => {
    const mode = value as AbsencePeriodFilterMode;
    setPeriodMode(mode);
    if (mode === AbsencePeriodFilterMode.LAST_MONTH) {
      const { fromDisplay, toDisplay } = getLastMonthDisplayRange();
      setValue("fromDateDisplay", fromDisplay);
      setValue("toDateDisplay", toDisplay);
    }
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const absences = absencesData?.data || [];
  const pagination = absencesData?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const formatDate = (date: string | Date) => {
    const dateStr =
      typeof date === "string" ? date : (date as Date).toISOString();
    return DateTime.fromISO(dateStr)
      .toUTC()
      .setZone("UTC", {
        keepLocalTime: true,
      })
      .toFormat("dd/MM/yyyy");
  };

  const getJobName = (jobId: string | undefined) => {
    if (!jobId) return "-";
    const job = jobs?.data.find((job: any) => job.publicId === jobId);
    return job ? job.name : "-";
  };

  const getBranchName = (branchId: string | undefined) => {
    if (!branchId) return "-";
    const branch = branches?.data.find(
      (branch: any) => branch.publicId === branchId
    );
    return branch ? branch.name : "-";
  };

  // Calculate column count for colspan
  const hasActions =
    canUpdate(OrganizationPermissionCode.ASSIGNMENT_ABSENCE_OPERATIONS) ||
    canDelete(OrganizationPermissionCode.ASSIGNMENT_ABSENCE_OPERATIONS);
  const columnCount = hasActions ? 10 : 9;

  return (
    <>
      {/* Filtros: cuadrícula 4 columnas alineadas en dos filas + estructura organizacional */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-5">
          <div className="min-w-0 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("filters.search")}
            </label>
            <CHEKIOInput
              className="w-full"
              placeholder={t("filters.searchPlaceholder")}
              value={search || ""}
              onChange={(e) => setValue("search", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("filters.documentNumber")}
            </label>
            <CHEKIOInput
              className="w-full"
              placeholder={t("filters.documentNumberPlaceholder")}
              value={documentNumber || ""}
              onChange={(e) => setValue("documentNumber", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="absence-period-mode"
            >
              {t("filters.periodType")}
            </label>
            <CHEKIOSelect
              value={periodMode}
              onValueChange={handlePeriodModeChange}
            >
              <CHEKIOSelectTrigger id="absence-period-mode" className="w-full">
                <CHEKIOSelectValue />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                <CHEKIOSelectItem value={AbsencePeriodFilterMode.RANGE}>
                  {t("filters.periodTypes.range")}
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={AbsencePeriodFilterMode.YEAR}>
                  {t("filters.periodTypes.year")}
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={AbsencePeriodFilterMode.LAST_MONTH}>
                  {t("filters.periodTypes.lastMonth")}
                </CHEKIOSelectItem>
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          </div>
          <div className="min-w-0 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("filters.period")}
            </label>
            {periodMode === AbsencePeriodFilterMode.RANGE && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <CHEKIOInput
                  className="w-full"
                  inputMode="numeric"
                  placeholder={`${t("filters.dateRange.from")} (${t("filters.datePlaceholder")})`}
                  autoComplete="off"
                  value={fromDateDisplay || ""}
                  onChange={(e) =>
                    setValue("fromDateDisplay", e.target.value)
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  aria-label={t("filters.dateRange.from")}
                />
                <CHEKIOInput
                  className="w-full"
                  inputMode="numeric"
                  placeholder={`${t("filters.dateRange.to")} (${t("filters.datePlaceholder")})`}
                  autoComplete="off"
                  value={toDateDisplay || ""}
                  onChange={(e) => setValue("toDateDisplay", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  aria-label={t("filters.dateRange.to")}
                />
              </div>
            )}
            {periodMode === AbsencePeriodFilterMode.YEAR && (
              <div className="space-y-2">
                <CHEKIOSelect
                  value={filterYear || String(DateTime.now().year)}
                  onValueChange={(value) => setValue("filterYear", value)}
                >
                  <CHEKIOSelectTrigger
                    className="w-full"
                    aria-label={t("filters.year")}
                  >
                    <CHEKIOSelectValue
                      placeholder={t("filters.yearPlaceholder")}
                    />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    {yearOptions.map((y) => (
                      <CHEKIOSelectItem key={y} value={String(y)}>
                        {y}
                      </CHEKIOSelectItem>
                    ))}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
                <p className="text-xs text-gray-500">
                  {t("filters.yearSummary", { year: filterYear || "—" })}
                </p>
              </div>
            )}
            {periodMode === AbsencePeriodFilterMode.LAST_MONTH && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-sm text-gray-700">
                  {t("filters.lastMonthSummary", {
                    from: fromDateDisplay || "—",
                    to: toDateDisplay || "—",
                  })}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {t("filters.lastMonthHint")}
                </p>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("filters.job")}
            </label>
            <CHEKIOSelect
              value={jobId || "all"}
              onValueChange={(value: string) =>
                setValue("jobId", value === "all" ? undefined : (value as any))
              }
            >
              <CHEKIOSelectTrigger className="w-full">
                <CHEKIOSelectValue placeholder={t("filters.jobPlaceholder")} />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                <CHEKIOSelectItem value="all">
                  {t("filters.jobPlaceholder")}
                </CHEKIOSelectItem>
                {jobs?.data.map((job: any) => (
                  <CHEKIOSelectItem key={job.publicId} value={job.publicId}>
                    {job.name}
                  </CHEKIOSelectItem>
                ))}
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          </div>
          <div className="min-w-0 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("filters.branch")}
            </label>
            <CHEKIOSelect
              value={branchId || "all"}
              onValueChange={(value) =>
                setValue(
                  "branchId",
                  value === "all" ? undefined : (value as any)
                )
              }
            >
              <CHEKIOSelectTrigger className="w-full">
                <CHEKIOSelectValue
                  placeholder={t("filters.branchPlaceholder")}
                />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                <CHEKIOSelectItem value="all">
                  {t("filters.branchPlaceholder")}
                </CHEKIOSelectItem>
                {branches?.data.map((branch: any) => (
                  <CHEKIOSelectItem
                    key={branch.publicId}
                    value={branch.publicId}
                  >
                    {branch.name}
                  </CHEKIOSelectItem>
                ))}
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          </div>
          <div className="min-w-0 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("filters.absenceType")}
            </label>
            <CHEKIOSelect
              value={absenceTypeId || "all"}
              onValueChange={(value) =>
                setValue(
                  "absenceTypeId",
                  value === "all" ? undefined : value,
                )
              }
            >
              <CHEKIOSelectTrigger
                className="w-full"
                aria-label={t("filters.absenceType")}
              >
                <CHEKIOSelectValue
                  placeholder={t("filters.absenceTypePlaceholder")}
                />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                <CHEKIOSelectItem value="all">
                  {t("filters.absenceTypePlaceholder")}
                </CHEKIOSelectItem>
                {(absenceTypesData?.data ?? []).map(
                  (type: AbsenceTypeResponseDto) => (
                    <CHEKIOSelectItem key={type.publicId} value={type.publicId}>
                      {type.name}
                    </CHEKIOSelectItem>
                  ),
                )}
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          </div>
          <div
            className="hidden min-h-10 min-w-0 lg:block"
            aria-hidden="true"
          />
        </div>

        {companyId && (
          <div className="mt-5 overflow-x-auto rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-4 sm:px-5">
            <p className="mb-3 text-sm font-medium text-gray-800">
              {t("filters.organization")}
            </p>
            <OrganizationSelector
              key={organizationSelectorKey}
              control={control}
              name="organizationId"
              companyId={companyId}
              layout="horizontal"
            />
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <CHEKIOButton variant="search" onClick={handleSearch}>
            <Search className="h-4 w-4" />
            {t("buttons.search")}
          </CHEKIOButton>
          <CHEKIOButton variant="refresh" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            {t("buttons.clear")}
          </CHEKIOButton>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <>
            <div className="overflow-x-auto">
              <CHEKIOTable className="w-full rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>{t("table.headers.employee")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.lastName")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.documentNumber")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.job")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.branch")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.absenceType")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.startDate")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.endDate")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.createdAt")}</CHEKIOTableHead>
                    {hasActions && (
                      <CHEKIOTableHead className="text-right">{t("table.headers.actions")}</CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <CHEKIOTableRow key={index} index={index}>
                      <CHEKIOTableCell><Skeleton className="h-4 w-20 rounded" /></CHEKIOTableCell>
                      <CHEKIOTableCell><Skeleton className="h-4 w-24 rounded" /></CHEKIOTableCell>
                      <CHEKIOTableCell><Skeleton className="h-4 w-24 rounded" /></CHEKIOTableCell>
                      <CHEKIOTableCell><Skeleton className="h-4 w-16 rounded" /></CHEKIOTableCell>
                      <CHEKIOTableCell><Skeleton className="h-4 w-20 rounded" /></CHEKIOTableCell>
                      <CHEKIOTableCell><Skeleton className="h-4 w-20 rounded" /></CHEKIOTableCell>
                      <CHEKIOTableCell><Skeleton className="h-4 w-20 rounded" /></CHEKIOTableCell>
                      <CHEKIOTableCell><Skeleton className="h-4 w-20 rounded" /></CHEKIOTableCell>
                      <CHEKIOTableCell><Skeleton className="h-4 w-24 rounded" /></CHEKIOTableCell>
                      {hasActions && (
                        <CHEKIOTableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                          </div>
                        </CHEKIOTableCell>
                      )}
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>
            <div className="flex flex-col border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-40 rounded" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-10 w-24 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-lg" />
                <Skeleton className="h-10 w-24 rounded-md" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="overflow-x-auto">
            <CHEKIOTable className="w-full rounded-none border-0 shadow-none">
              <CHEKIOTableHeader>
                <tr>
                  <CHEKIOTableHead>
                    {t("table.headers.employee")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {t("table.headers.lastName")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {t("table.headers.documentNumber")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.job")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.branch")}</CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {t("table.headers.absenceType")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {t("table.headers.startDate")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {t("table.headers.endDate")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {t("table.headers.createdAt")}
                  </CHEKIOTableHead>
                  {hasActions && (
                    <CHEKIOTableHead className="text-right">
                      {t("table.headers.actions")}
                    </CHEKIOTableHead>
                  )}
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {absences.length === 0 ? (
                  <tr>
                    <CHEKIOTableCell
                      colSpan={columnCount}
                      className="text-center py-10"
                    >
                      <p className="text-gray-600 font-medium">
                        {t("table.noData")}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {t("table.noDataDescription")}
                      </p>
                    </CHEKIOTableCell>
                  </tr>
                ) : (
                  absences.map((absence: AbsenceResponseDto, index: number) => {
                    const actionsLocked = isAbsenceActionLocked(absence.source);
                    return (
                    <CHEKIOTableRow key={absence.publicId} index={index}>
                      <CHEKIOTableCell>
                        {absence.employee?.firstName || "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {absence.employee?.lastName || "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {absence.employee?.documentNumber || "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {getJobName(absence.employee?.jobId as string)}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {getBranchName(absence.employee?.branchId as string)}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {absence.absenceType?.name || "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {formatDate(absence.startDate)}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {formatDate(absence.endDate)}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {formatDate(absence.createdAt)}
                      </CHEKIOTableCell>
                      {hasActions && (
                        <CHEKIOTableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate(
                              OrganizationPermissionCode.ASSIGNMENT_ABSENCE_OPERATIONS
                            ) && (
                              <button
                                type="button"
                                disabled={actionsLocked}
                                onClick={() => {
                                  if (!actionsLocked) {
                                    handleOpenModal(absence);
                                  }
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
                                title={
                                  actionsLocked
                                    ? t("tooltips.actionLocked")
                                    : t("buttons.edit")
                                }
                                aria-label={
                                  actionsLocked
                                    ? t("ariaLabels.editAbsenceLocked")
                                    : t("ariaLabels.editAbsence")
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete(
                              OrganizationPermissionCode.ASSIGNMENT_ABSENCE_OPERATIONS
                            ) && (
                              <button
                                type="button"
                                disabled={actionsLocked}
                                onClick={() => {
                                  if (!actionsLocked) {
                                    handleOpenDeleteModal(absence.publicId);
                                  }
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
                                title={
                                  actionsLocked
                                    ? t("tooltips.actionLocked")
                                    : t("buttons.delete")
                                }
                                aria-label={
                                  actionsLocked
                                    ? t("ariaLabels.deleteAbsenceLocked")
                                    : t("ariaLabels.deleteAbsence")
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </CHEKIOTableCell>
                      )}
                    </CHEKIOTableRow>
                  );
                  })
                )}
              </CHEKIOTableBody>
            </CHEKIOTable>
            </div>

            {absences.length > 0 && (
              <div className="flex flex-col border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {t("pagination.showing", {
                      current: absences.length,
                      total: pagination.totalCount,
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      {t("pagination.recordsPerPage")}:
                    </label>
                    <CHEKIOSelect
                      value={pageSize.toString()}
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
                    variant="secondaryBlue"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("buttons.previous")}
                  </CHEKIOButton>
                  <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                    {t("pagination.page", {
                      current: pagination.current,
                      total: pagination.totalPages,
                    })}
                  </div>
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    {t("buttons.next")}
                    <ChevronRight className="h-4 w-4" />
                  </CHEKIOButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && editingAbsence && (
        <AbsenceModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          absence={editingAbsence}
          onSuccess={() => refetch()}
        />
      )}

      {canDelete(OrganizationPermissionCode.ASSIGNMENT_ABSENCE_OPERATIONS) && (
        <CHEKIOModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          title={t("delete.title")}
          size="md"
        >
          <div className="space-y-6">
            <p className="text-gray-700 flex items-center gap-3 text-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              {t("delete.message")}
            </p>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-red-700 text-sm">{deleteError}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <CHEKIOButton
                variant="secondary"
                onClick={handleCloseDeleteModal}
                disabled={isDeletingAbsence}
              >
                <X className="h-4 w-4" />
                {t("buttons.cancel")}
              </CHEKIOButton>
              <CHEKIOButton
                variant="destructive"
                onClick={() => {
                  if (deletingAbsenceId) {
                    handleDelete(deletingAbsenceId);
                  }
                }}
                disabled={isDeletingAbsence}
              >
                {isDeletingAbsence ? (
                  <>{t("buttons.deleting")}</>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {t("buttons.delete")}
                  </>
                )}
              </CHEKIOButton>
            </div>
          </div>
        </CHEKIOModal>
      )}
    </>
  );
}
