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
import { useToast } from "@/hooks/use-toast";
import { useGetReportsHistory } from "@/service/report-template.service";
import {
  Activity,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  History,
  Loader2,
  RefreshCw,
  User,
  XCircle,
} from "lucide-react";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ReportFilterDto,
  ReportResponseDto,
  ReportStatus,
} from "../manager/_components";

function ReportsHistoryContent() {
  const t = useTranslations("reports.history");
  const { toast } = useToast();
  const { canRead, getTemplateUser, companyId } = useCookieSession();
  const templateUser = getTemplateUser();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const { register, watch, setValue } = useForm<ReportFilterDto>({
    defaultValues: {
      search: "",
      status: undefined,
      startDate: "",
      endDate: "",
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const searchValue = watch("search");
  const statusValue = watch("status");
  const startDateValue = watch("startDate");
  const endDateValue = watch("endDate");

  const resolvedCompanyId =
    companyId && !Number.isNaN(Number(companyId)) ? Number(companyId) : undefined;
  const companyPublicIdParam =
    companyId && Number.isNaN(Number(companyId)) ? companyId : undefined;

  const params = {
    search: searchValue || undefined,
    status: statusValue || undefined,
    startDate: startDateValue || undefined,
    endDate: endDateValue || undefined,
    companyId: resolvedCompanyId,
    companyPublicId: companyPublicIdParam,
    page,
    pageSize,
    sort: "desc" as const,
  };

  const {
    data: reportsData,
    isLoading,
    isFetching,
    isRefetching,
    refetch: refetchReports,
  } = useGetReportsHistory(params);

  useEffect(() => {
    if (isLoading || !isMounted) {
      setCountdown(5);
      return;
    }

    if (isRefetching || isFetching) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, isMounted, isRefetching, isFetching]);

  useEffect(() => {
    if (!isLoading && isMounted && !isRefetching && !isFetching) {
      setCountdown(5);
    }
  }, [isRefetching, isFetching, isLoading, isMounted]);

  useEffect(() => {
    if (refetchTrigger > 0) {
      refetchReports();
    }
  }, [refetchTrigger, refetchReports]);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const translateStepDescription = (stepDescription: string): string => {
    if (!stepDescription) return "";

    let cleanStepDescription = stepDescription;
    if (stepDescription.includes(".")) {
      const parts = stepDescription.split(".");
      cleanStepDescription = parts[parts.length - 1];
    }

    const legacyMessageMap: Record<string, string> = {
      "Starting report generation": "STEP_STARTING",
      "Validating data": "STEP_VALIDATING",
      "Generating report": "STEP_GENERATING",
      "Saving report": "STEP_SAVING",
      "Report generated successfully": "STEP_COMPLETED",
    };

    let translationKey: string;
    if (cleanStepDescription.startsWith("STEP_")) {
      translationKey = cleanStepDescription;
    } else if (legacyMessageMap[cleanStepDescription]) {
      translationKey = legacyMessageMap[cleanStepDescription];
    } else {
      return stepDescription;
    }

    return t(`steps.${translationKey}`, { defaultValue: stepDescription });
  };

  const getStatusBadge = (status: ReportStatus | string) => {
    const statusStr = typeof status === "string" ? status : status;
    const statusConfig: Record<string, { bg: string; text: string }> = {
      SCHEDULED: {
        bg: "bg-gray-100",
        text: "text-gray-800",
      },
      PROCESSING: {
        bg: "bg-blue-100",
        text: "text-blue-800",
      },
      PENDING: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
      },
      COMPLETED: {
        bg: "bg-green-100",
        text: "text-green-800",
      },
      FAILED: {
        bg: "bg-red-100",
        text: "text-red-800",
      },
    };

    const config =
      statusConfig[statusStr] ||
      statusConfig[statusStr.toUpperCase()] ||
      statusConfig["SCHEDULED"];

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
      >
        {t(`status.${statusStr}`, { defaultValue: statusStr })}
      </span>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "-";
    const mb = bytes / (1024 * 1024);
    if (mb < 0.001) {
      return `${mb.toFixed(6)} MB`;
    }
    if (mb < 1) {
      return `${mb.toFixed(4)} MB`;
    }
    return `${Math.round(mb * 100) / 100} MB`;
  };

  const formatDuration = (milliseconds?: number) => {
    if (!milliseconds || milliseconds === 0) return "-";

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remainingHours = hours % 24;
      const remainingMinutes = minutes % 60;
      if (remainingHours > 0) {
        return `${days}d ${remainingHours}h ${remainingMinutes}m`;
      }
      return `${days}d ${remainingMinutes}m`;
    }

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      const remainingSeconds = seconds % 60;
      if (remainingMinutes > 0) {
        return `${hours}h ${remainingMinutes}m`;
      }
      return `${hours}h ${remainingSeconds}s`;
    }

    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${seconds}s`;
  };

  const getFileTypeLabel = (contentType?: string) => {
    if (!contentType) return t("table.notAvailable");
    if (contentType.includes("spreadsheet") || contentType.includes("excel")) {
      return t("fileTypes.excel");
    }
    if (contentType.includes("pdf")) {
      return t("fileTypes.pdf");
    }
    if (contentType.includes("csv")) {
      return t("fileTypes.csv");
    }
    if (contentType.includes("json")) {
      return t("fileTypes.json");
    }
    return t("fileTypes.file");
  };

  const handleDownload = async (report: ReportResponseDto) => {
    const downloadUrl = report.downloadUrl;
    if (!downloadUrl) {
      toast({
        title: t("toast.downloadError.title"),
        description: t("toast.downloadError.description"),
        variant: "destructive",
      });
      return;
    }

    try {
      const isAbsolute =
        downloadUrl.startsWith("http://") ||
        downloadUrl.startsWith("https://");

      const fileName = report.name
        ? `${report.name}.${report.fileExtension || "xlsx"}`
        : `reporte-${report.publicId || "file"}.${report.fileExtension || "xlsx"}`;

      if (isAbsolute) {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: t("toast.downloadSuccess.title"),
          description: t("toast.downloadSuccess.description"),
        });

        return;
      }

      const axiosInstance = (await import("@/utils/axios")).default;
      const response = await axiosInstance.get(downloadUrl, {
        responseType: "blob",
        headers: {
          Accept:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream",
        },
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: t("toast.downloadSuccess.title"),
        description: t("toast.downloadSuccess.description"),
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("toast.downloadErrorGeneric.description");
      toast({
        title: t("toast.downloadErrorGeneric.title"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleClearFilters = () => {
    setValue("search", "");
    setValue("status", undefined);
    setValue("startDate", "");
    setValue("endDate", "");
    setPage(1);
  };

  const formatDate = useCallback((date: string | Date | undefined): string => {
    if (!date) return "-";
    try {
      const dateStr =
        typeof date === "string"
          ? date
          : date instanceof Date
            ? date.toISOString()
            : "";
      if (!dateStr) return "-";
      const dt = DateTime.fromISO(dateStr);
      if (dt.isValid) {
        return dt.toFormat("dd/MM/yyyy HH:mm:ss");
      }
      return "-";
    } catch {
      return "-";
    }
  }, []);

  const reports = reportsData?.data || [];
  const pagination = reportsData?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const toolbarFilters = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-[200px]">
        <CHEKIOInput
          type="search"
          placeholder={t("filters.searchPlaceholder")}
          {...register("search")}
          onChange={(e) => {
            register("search").onChange(e);
            setPage(1);
          }}
        />
      </div>
      {isMounted && (
        <div className="min-w-[160px]">
          <CHEKIOSelect
            value={statusValue || undefined}
            onValueChange={(value) => {
              setValue(
                "status",
                value === "ALL" ? undefined : (value as ReportStatus)
              );
              setPage(1);
            }}
          >
            <CHEKIOSelectTrigger>
              <CHEKIOSelectValue
                placeholder={t("filters.statusPlaceholder")}
              />
            </CHEKIOSelectTrigger>
            <CHEKIOSelectContent>
              <CHEKIOSelectItem value="ALL">
                {t("filters.allStatuses")}
              </CHEKIOSelectItem>
              <CHEKIOSelectItem value={ReportStatus.SCHEDULED}>
                {t("status.SCHEDULED")}
              </CHEKIOSelectItem>
              <CHEKIOSelectItem value={ReportStatus.PROCESSING}>
                {t("status.PROCESSING")}
              </CHEKIOSelectItem>
              <CHEKIOSelectItem value={ReportStatus.PENDING}>
                {t("status.PENDING")}
              </CHEKIOSelectItem>
              <CHEKIOSelectItem value={ReportStatus.COMPLETED}>
                {t("status.COMPLETED")}
              </CHEKIOSelectItem>
              <CHEKIOSelectItem value={ReportStatus.FAILED}>
                {t("status.FAILED")}
              </CHEKIOSelectItem>
            </CHEKIOSelectContent>
          </CHEKIOSelect>
        </div>
      )}
      <div className="min-w-[140px]">
        <CHEKIOInput
          type="date"
          placeholder={t("filters.startDate")}
          {...register("startDate")}
          onChange={(e) => {
            register("startDate").onChange(e);
            setPage(1);
          }}
        />
      </div>
      <div className="min-w-[140px]">
        <CHEKIOInput
          type="date"
          placeholder={t("filters.endDate")}
          {...register("endDate")}
          onChange={(e) => {
            register("endDate").onChange(e);
            setPage(1);
          }}
        />
      </div>
      <CHEKIOButton
        variant="secondary"
        type="button"
        onClick={handleClearFilters}
      >
        <XCircle className="h-4 w-4" />
        {t("buttons.clear")}
      </CHEKIOButton>
    </div>
  );

  const toolbarActions = (
    <div className="flex items-center gap-2">
      {!isLoading && isMounted && (
        <CHEKIOButton
          variant="refresh"
          type="button"
          onClick={refetch}
          disabled={isFetching || isRefetching}
          title={t("refresh.clickToRefresh")}
        >
          {isFetching || isRefetching ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              {t("refresh.updating")}
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              {t("refresh.updatingIn", { countdown })}
            </>
          )}
        </CHEKIOButton>
      )}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Toolbar with filters */}
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
                  <CHEKIOTableHead className="min-w-[120px]">
                    <span className="flex items-center gap-2">
                      <FileText
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {t("table.headers.name")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[100px]">
                    <span className="flex items-center gap-2">
                      <Activity
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {t("table.headers.status")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[200px]">
                    <span className="flex items-center gap-2">
                      <Loader2
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {t("table.headers.step")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[120px]">
                    <span className="flex items-center gap-2">
                      <User
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {t("table.headers.requestedBy")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[140px]">
                    <span className="flex items-center gap-2">
                      <CalendarPlus
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {t("table.headers.createdAt")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[100px]">
                    <span className="flex items-center gap-2">
                      <Clock
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {t("table.headers.duration")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[100px]">
                    {t("table.headers.actions")}
                  </CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {[...Array(pageSize)].map((_, index) => (
                  <CHEKIOTableRow key={index} index={index}>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                    </CHEKIOTableCell>
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
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-24">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
            <History className="h-10 w-10 text-gray-400" />
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
                  <CHEKIOTableHead className="min-w-[120px]">
                    <span className="flex items-center gap-2">
                      <FileText
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {t("table.headers.name")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[100px]">
                    <span className="flex items-center gap-2">
                      <Activity
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {t("table.headers.status")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[200px]">
                    <span className="flex items-center gap-2">
                      <Loader2
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {t("table.headers.step")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[120px]">
                    <span className="flex items-center gap-2">
                      <User
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {t("table.headers.requestedBy")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[140px]">
                    <span className="flex items-center gap-2">
                      <CalendarPlus
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {t("table.headers.createdAt")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[100px]">
                    <span className="flex items-center gap-2">
                      <Clock
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {t("table.headers.duration")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[100px] text-right">
                    {t("table.headers.actions")}
                  </CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {reports.map(
                  (report: ReportResponseDto, index: number) => (
                    <CHEKIOTableRow
                      key={report.publicId || index}
                      index={index}
                    >
                      <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                        {report.name}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        {getStatusBadge(report.status as ReportStatus)}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="flex flex-col gap-2 w-full min-w-[200px]">
                          {report.stepDescription && (
                            <span className="text-sm text-gray-700 font-medium">
                              {translateStepDescription(
                                report.stepDescription
                              )}
                            </span>
                          )}
                          {(() => {
                            if (
                              !report.totalSteps ||
                              report.totalSteps <= 0
                            )
                              return null;
                            const currentStep =
                              Number(report.currentStep) || 0;
                            const totalSteps =
                              Number(report.totalSteps) || 5;
                            const validTotalSteps =
                              totalSteps > 10 ? 5 : totalSteps;
                            return (
                              <div className="relative h-4 w-full overflow-hidden rounded-none border border-gray-300 bg-gray-200">
                                <div
                                  className="absolute inset-0 bg-blue-600"
                                  style={{
                                    width: `${(currentStep / validTotalSteps) * 100}%`,
                                    backgroundImage:
                                      "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
                                  }}
                                />
                                <div className="absolute inset-0 z-10 flex items-center justify-center px-2 text-xs font-medium text-white">
                                  <span className="whitespace-nowrap">
                                    {currentStep}/{validTotalSteps}
                                    {report.fileSize && (
                                      <>
                                        <span className="ml-2">
                                          {formatFileSize(
                                            report.fileSize
                                          )}
                                        </span>
                                        {report.fileContentType && (
                                          <span className="ml-1">
                                            {getFileTypeLabel(
                                              report.fileContentType
                                            )}
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                          {(!report.totalSteps ||
                            report.totalSteps === 0) &&
                            report.status === "PROCESSING" && (
                              <div className="relative h-4 w-full overflow-hidden rounded-none border border-gray-300 bg-gray-200">
                                <div
                                  className="absolute inset-0 bg-blue-600"
                                  style={{
                                    width: `${((report.currentStep || 0) / 5) * 100}%`,
                                    backgroundImage:
                                      "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
                                  }}
                                />
                                <div className="absolute inset-0 z-10 flex items-center justify-center px-2 text-xs font-medium text-white">
                                  <span className="whitespace-nowrap">
                                    {report.currentStep || 0}/5
                                  </span>
                                </div>
                              </div>
                            )}
                          {!report.stepDescription &&
                            !report.totalSteps && (
                              <span className="text-xs text-gray-400">
                                {t("table.notAvailable")}
                              </span>
                            )}
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {report.createdBy || t("table.notAvailable")}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {formatDate(report.createdAt)}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm font-medium text-gray-600">
                        {formatDuration(report.processingDuration)}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-right">
                        {canRead(
                          OrganizationPermissionCode.ATTENDANCE_REPORTS
                        ) ? (
                          <button
                            type="button"
                            onClick={() => handleDownload(report)}
                            disabled={
                              !report.downloadUrl ||
                              !report.fileContentType ||
                              !(
                                report.status === ReportStatus.COMPLETED ||
                                report.status === "COMPLETED"
                              )
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                            title={t("buttons.download")}
                            aria-label={t("buttons.download")}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {t("table.notAvailable")}
                          </span>
                        )}
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  )
                )}
              </CHEKIOTableBody>
            </CHEKIOTable>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {t("pagination.showing", {
                  current: reports.length,
                  total: pagination.totalCount,
                })}
              </div>
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-medium text-gray-700">
                  {t("pagination.recordsPerPage")}
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
              <span className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                {t("pagination.page", {
                  current: pagination.current,
                  total: pagination.totalPages,
                })}
              </span>
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
        </>
      )}
    </div>
  );
}

export default function ReportsHistoryPage() {
  return <ReportsHistoryContent />;
}
