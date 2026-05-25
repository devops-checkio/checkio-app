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
import { useCookieSession } from "@/context/useCookieSession";
import { PaginationFilterDto } from "@/dto/pagination";
import { useToast } from "@/hooks/use-toast";
import { useGetTimeBanks } from "@/service/mantainer.service";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import {
  Calendar,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  TimeBankFindFilterDto,
  TimeBankResponseDto,
  TimeBankType,
} from "./time-bank.dto";

type SearchFiltersForm = {
  search: string;
  type: TimeBankType | undefined;
  employeeId: string;
};

interface TabBaseTimeBankProps {
  status: "active" | "expired";
  onEdit: (timeBank: TimeBankResponseDto) => void;
  onDelete: (id: string) => void;
  onViewDetail?: (timeBank: TimeBankResponseDto) => void;
  refetchTrigger: number;
  canUpdate: boolean;
  canDelete: boolean;
  forcedEmployeeId?: string;
}

export default function TabBaseTimeBank({
  status,
  onEdit,
  onDelete,
  onViewDetail,
  refetchTrigger,
  canUpdate,
  canDelete,
  forcedEmployeeId,
}: TabBaseTimeBankProps) {
  const t = useTranslations("mantainers.timeBank");
  const { toast } = useToast();
  const { companyId, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();

  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "desc" as "asc" | "desc",
  });

  const { control, reset, watch } = useForm<SearchFiltersForm>({
    defaultValues: {
      search: "",
      type: undefined,
      employeeId: "",
    },
  });

  const formValues = watch();

  const [searchParams, setSearchParams] = useState({
    search: undefined as string | undefined,
    type: undefined as TimeBankType | undefined,
    employeeId: forcedEmployeeId,
  });

  const { data, isLoading, refetch } = useGetTimeBanks({
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    companyId: companyId?.toString(),
    status,
    search: searchParams.search,
    type: searchParams.type,
    employeeId: forcedEmployeeId || searchParams.employeeId,
  });

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data]);

  useEffect(() => {
    refetch();
  }, [refetchTrigger, refetch]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      current: newPage,
    }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: newPageSize,
      current: 1,
    }));
  }, []);

  const handleSearch = () => {
    setSearchParams({
      search: formValues.search || undefined,
      type: formValues.type,
      employeeId: forcedEmployeeId || formValues.employeeId || undefined,
    });
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  const handleResetSearch = () => {
    reset();
    setSearchParams({
      search: undefined,
      type: undefined,
      employeeId: forcedEmployeeId,
    });
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  const handleDownloadExcel = async () => {
    if (!data?.data) return;

    try {
      await generateExcel(
        data.data,
        TIME_BANK_COLUMNS_EXCEL,
        t("excel.filename", {
          status: status === "active" ? "activos" : "vencidos",
        }),
        t("excel.sheetName")
      );
      toast({
        title: t("toast.excelSuccess.title"),
        variant: "default",
      });
    } catch (error) {
      console.error("Error downloading excel:", error);
      toast({
        title: t("toast.excelError.title"),
        variant: "destructive",
      });
    }
  };

  const timeBanks = data?.data || [];
  const paginationData = data?.pagination || pagination;

  const TIME_BANK_COLUMNS_EXCEL: HeaderMapping[] = [
    {
      attribute: "employeeName",
      header: t("excel.headers.employeeName"),
    },
    {
      attribute: "employeeEmail",
      header: t("excel.headers.employeeEmail"),
    },
    {
      attribute: "type",
      header: t("excel.headers.type"),
      render: (type: string) =>
        type === TimeBankType.ECONOMIC_HOURS
          ? t("excel.type.economicHours")
          : t("excel.type.restDays"),
    },
    {
      attribute: "hoursPerDay",
      header: t("excel.headers.hoursPerDay"),
      render: (hours: number) => `${hours} ${t("excel.hoursPerDay")}`,
    },
    {
      attribute: "availableHours",
      header: t("excel.headers.availableHours"),
      render: (hours: number) => `${hours.toFixed(1)} ${t("excel.hours")}`,
    },
    {
      attribute: "usedHours",
      header: t("excel.headers.usedHours"),
      render: (hours: number) => `${hours.toFixed(1)} ${t("excel.hours")}`,
    },
    {
      attribute: "startDate",
      header: t("excel.headers.startDate"),
      render: (startDate: string) =>
        DateTime.fromISO(startDate).toFormat("dd/MM/yyyy"),
    },
    {
      attribute: "endDate",
      header: t("excel.headers.endDate"),
      render: (endDate: string) =>
        DateTime.fromISO(endDate).toFormat("dd/MM/yyyy"),
    },
    {
      attribute: "createdAt",
      header: t("excel.headers.createdAt"),
      render: (createdAt: string) =>
        DateTime.fromISO(createdAt).toFormat("dd/MM/yyyy HH:mm"),
    },
  ];

  const toolbarFilters = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-[180px]">
        <Controller
          name="search"
          control={control}
          render={({ field }) => (
            <CHEKIOInput
              {...field}
              value={field.value || ""}
              placeholder={t("filters.searchPlaceholder")}
            />
          )}
        />
      </div>
      <div className="min-w-[160px]">
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <CHEKIOSelect value={field.value} onValueChange={field.onChange}>
              <CHEKIOSelectTrigger>
                <CHEKIOSelectValue
                  placeholder={t("filters.typePlaceholder")}
                />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                <CHEKIOSelectItem value={TimeBankType.ECONOMIC_HOURS}>
                  {t("filters.typeOptions.economicHours")}
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={TimeBankType.REST_DAYS}>
                  {t("filters.typeOptions.restDays")}
                </CHEKIOSelectItem>
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          )}
        />
      </div>
      {!forcedEmployeeId && (
        <div className="min-w-[140px]">
          <Controller
            name="employeeId"
            control={control}
            render={({ field }) => (
              <CHEKIOInput
                {...field}
                value={field.value || ""}
                placeholder={t("filters.employeeIdPlaceholder")}
              />
            )}
          />
        </div>
      )}
      <CHEKIOButton variant="refresh" onClick={handleResetSearch}>
        <RefreshCw className="h-4 w-4" />
        {t("buttons.clear")}
      </CHEKIOButton>
      <CHEKIOButton variant="search" onClick={handleSearch}>
        <Search className="h-4 w-4" />
        {t("buttons.search")}
      </CHEKIOButton>
    </div>
  );

  const toolbarActions = (
    <CHEKIOButton
      variant="approve"
      onClick={handleDownloadExcel}
      disabled={!data?.data || timeBanks.length === 0}
    >
      <Download className="h-4 w-4" />
      {t("buttons.downloadExcel")}
    </CHEKIOButton>
  );

  const TableHeaderCell = ({
    icon: Icon,
    label,
  }: {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    label: string;
  }) => (
    <CHEKIOTableHead className="min-w-[100px]">
      <span className="flex items-center gap-2">
        <Icon
          className="h-4 w-4"
          style={{ color: `${templateUser.primary}99` }}
        />
        {label}
      </span>
    </CHEKIOTableHead>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50/50 px-5 py-4 md:flex-row md:items-center md:justify-between">
        {toolbarFilters}
        {toolbarActions}
      </div>

      {isLoading ? (
        <>
          <div className="overflow-x-auto">
            <CHEKIOTable className="rounded-none border-0 shadow-none">
              <CHEKIOTableHeader>
                <tr>
                  <TableHeaderCell icon={User} label={t("table.headers.employee")} />
                  <TableHeaderCell icon={DollarSign} label={t("table.headers.type")} />
                  <TableHeaderCell icon={Clock} label={t("table.headers.hoursPerDay")} />
                  <TableHeaderCell icon={TrendingUp} label={t("table.headers.availableHours")} />
                  <TableHeaderCell icon={TrendingDown} label={t("table.headers.usedHours")} />
                  <TableHeaderCell icon={Calendar} label={t("table.headers.period")} />
                  <TableHeaderCell icon={CalendarPlus} label={t("table.headers.createdAt")} />
                  {(canUpdate || canDelete || onViewDetail) && (
                    <CHEKIOTableHead className="min-w-[100px] text-right">
                      {t("table.headers.actions")}
                    </CHEKIOTableHead>
                  )}
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {[...Array(pagination.pageSize)].map((_, index) => (
                  <CHEKIOTableRow key={index} index={index}>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                          <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                        </div>
                      </div>
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-14 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-14 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="space-y-2">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </div>
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    {(canUpdate || canDelete || onViewDetail) && (
                      <CHEKIOTableCell className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                        </div>
                      </CHEKIOTableCell>
                    )}
                  </CHEKIOTableRow>
                ))}
              </CHEKIOTableBody>
            </CHEKIOTable>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
        </>
      ) : timeBanks.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-24">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
            <Wallet className="h-10 w-10 text-gray-400" />
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
          <div className="overflow-x-auto">
            <CHEKIOTable className="rounded-none border-0 shadow-none">
              <CHEKIOTableHeader>
                <tr>
                  <TableHeaderCell icon={User} label={t("table.headers.employee")} />
                  <TableHeaderCell icon={DollarSign} label={t("table.headers.type")} />
                  <TableHeaderCell icon={Clock} label={t("table.headers.hoursPerDay")} />
                  <TableHeaderCell icon={TrendingUp} label={t("table.headers.availableHours")} />
                  <TableHeaderCell icon={TrendingDown} label={t("table.headers.usedHours")} />
                  <TableHeaderCell icon={Calendar} label={t("table.headers.period")} />
                  <TableHeaderCell icon={CalendarPlus} label={t("table.headers.createdAt")} />
                  {(canUpdate || canDelete || onViewDetail) && (
                    <CHEKIOTableHead className="min-w-[100px] text-right">
                      {t("table.headers.actions")}
                    </CHEKIOTableHead>
                  )}
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {timeBanks.map((timeBank: TimeBankResponseDto, index: number) => {
                  const isEconomic =
                    timeBank.type === TimeBankType.ECONOMIC_HOURS;
                  return (
                    <CHEKIOTableRow key={timeBank.publicId} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {timeBank.employeeName || "N/A"}
                            </div>
                            {timeBank.employeeEmail && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <span>{timeBank.employeeEmail}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {isEconomic ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                              <DollarSign className="h-3.5 w-3.5" />
                              {t("table.type.economicHours")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {t("table.type.restDays")}
                            </span>
                          )}
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {timeBank.hoursPerDay != null ? (
                          <span>{timeBank.hoursPerDay}h/día</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <span className="font-semibold text-green-600">
                          {timeBank.availableHours.toFixed(1)} hrs
                        </span>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <span className="font-semibold text-orange-600">
                          {timeBank.usedHours.toFixed(1)} hrs
                        </span>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        <div className="space-y-1">
                          <div>
                            {DateTime.fromISO(timeBank.startDate).toFormat(
                              "dd/MM/yyyy"
                            )}{" "}
                            <span className="text-gray-500">
                              ({t("table.period.start")})
                            </span>
                          </div>
                          <div>
                            {DateTime.fromISO(timeBank.endDate).toFormat(
                              "dd/MM/yyyy"
                            )}{" "}
                            <span className="text-gray-500">
                              ({t("table.period.end")})
                            </span>
                          </div>
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {DateTime.fromISO(timeBank.createdAt).toFormat(
                          "dd/MM/yyyy HH:mm"
                        )}
                      </CHEKIOTableCell>
                      {(canUpdate || canDelete || onViewDetail) && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {onViewDetail && timeBank.employeePublicId && (
                              <button
                                type="button"
                                onClick={() => onViewDetail(timeBank)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                                title={t("buttons.viewDetail")}
                                aria-label={t("ariaLabels.viewDetail")}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() => onEdit(timeBank)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                title={t("buttons.edit")}
                                aria-label={t("ariaLabels.editTimeBank")}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => onDelete(timeBank.publicId)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                title={t("buttons.delete")}
                                aria-label={t("ariaLabels.deleteTimeBank")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </CHEKIOTableCell>
                      )}
                    </CHEKIOTableRow>
                  );
                })}
              </CHEKIOTableBody>
            </CHEKIOTable>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {t("pagination.showing", {
                  current: timeBanks.length,
                  total: paginationData.totalCount,
                })}
              </div>
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-medium text-gray-700">
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
                variant="secondaryBlue"
                onClick={() =>
                  handlePageChange(paginationData.current - 1)
                }
                disabled={paginationData.current === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                {t("buttons.previous")}
              </CHEKIOButton>
              <span className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                {t("pagination.page", {
                  current: paginationData.current,
                  total: paginationData.totalPages,
                })}
              </span>
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={() =>
                  handlePageChange(paginationData.current + 1)
                }
                disabled={
                  paginationData.current >= paginationData.totalPages
                }
              >
                {t("buttons.next")}
                <ChevronRight className="h-4 w-4" />
              </CHEKIOButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
