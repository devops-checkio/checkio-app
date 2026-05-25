"use client";

import {
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
  CHEKIOStatCard,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import {
  useGetAssistanceCount,
  useGetBranches,
  useGetJobs,
} from "@/service/mantainer.service";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileQuestion,
  Timer,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AssistanceCountFindAllDto } from "@/app/[locale]/assistance/_components/assistance.dto";
import AttendanceStatusChart from "./AttendanceStatusChart";
import QuickActions from "./QuickActions";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function getLast30DaysRange(): { startDate: string; endDate: string } {
  const endDate = new Date().toLocaleDateString("en-CA");
  const startDate = new Date(Date.now() - THIRTY_DAYS_MS).toLocaleDateString(
    "en-CA",
  );
  return { startDate, endDate };
}

enum PeriodFilter {
  /** Mismo criterio por defecto que assistance/management (rango últimos 30 días). */
  LAST_30_DAYS = "last30Days",
  THIS_MONTH = "thisMonth",
  LAST_MONTH = "lastMonth",
  CUSTOM_RANGE = "customRange",
}

function getMonthString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getLastMonth(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d;
}

export default function HomeAdmin() {
  const router = useRouter();
  const t = useTranslations("homeAdmin");
  const { companyId } = useCookieSession();

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(
    PeriodFilter.LAST_30_DAYS,
  );
  const [customStartDate, setCustomStartDate] = useState<string>(
    () => getLast30DaysRange().startDate,
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    () => getLast30DaysRange().endDate,
  );
  const [branchId, setBranchId] = useState<string>("");
  const [jobId, setJobId] = useState<string>("");

  const { data: jobs, isLoading: isLoadingJobs } = useGetJobs({
    page: 1,
    pageSize: 500,
    sort: "asc",
  });
  const { data: branches, isLoading: isLoadingBranches } = useGetBranches({
    page: 1,
    pageSize: 500,
    sort: "asc",
  });
  const isFiltersLoading = isLoadingJobs || isLoadingBranches;

  const summaryParams = useMemo((): AssistanceCountFindAllDto | undefined => {
    if (!companyId) return undefined;
    const base: AssistanceCountFindAllDto = { companyId };
    if (branchId) base.branchId = branchId;
    if (jobId) base.jobId = jobId;
    const now = new Date();
    if (periodFilter === PeriodFilter.LAST_30_DAYS) {
      const { startDate, endDate } = getLast30DaysRange();
      return { ...base, startDate, endDate };
    }
    if (periodFilter === PeriodFilter.THIS_MONTH) {
      return { ...base, month: getMonthString(now) };
    }
    if (periodFilter === PeriodFilter.LAST_MONTH) {
      return { ...base, month: getMonthString(getLastMonth()) };
    }
    if (
      periodFilter === PeriodFilter.CUSTOM_RANGE &&
      customStartDate &&
      customEndDate
    ) {
      return { ...base, startDate: customStartDate, endDate: customEndDate };
    }
    const { startDate, endDate } = getLast30DaysRange();
    return { ...base, startDate, endDate };
  }, [companyId, periodFilter, customStartDate, customEndDate, branchId, jobId]);

  const { data: assistanceCount, isLoading } = useGetAssistanceCount(
    summaryParams,
    { enabled: !!companyId },
  );

  const navigateToTab = useCallback(
    (tab: string) => {
      router.push(`/assistance/management?tab=${tab}`);
    },
    [router],
  );

  const kpiCards = useMemo(
    () => [
      {
        key: "completed",
        title: t("completed"),
        value: assistanceCount?.completedCount ?? 0,
        variant: "green" as const,
        icon: CheckCircle2,
        tab: "4",
      },
      {
        key: "absent",
        title: t("absent"),
        value: assistanceCount?.absentCount ?? 0,
        variant: "red" as const,
        icon: XCircle,
        tab: "3",
      },
      {
        key: "incomplete",
        title: t("incomplete"),
        value: assistanceCount?.incompleteCount ?? 0,
        variant: "orange" as const,
        icon: AlertCircle,
        tab: "1",
      },
      {
        key: "withoutSchedule",
        title: t("withoutSchedule"),
        value: assistanceCount?.withoutScheduleCount ?? 0,
        variant: "cyan" as const,
        icon: FileQuestion,
        tab: "2",
      },
      {
        key: "pendingExtraApproval",
        title: t("pendingExtraApproval"),
        value: assistanceCount?.extraPendingApprovalCount ?? 0,
        variant: "blue" as const,
        icon: Timer,
        tab: "7",
      },
      {
        key: "pendingDelayApproval",
        title: t("pendingDelayApproval"),
        value: assistanceCount?.delayPendingApprovalCount ?? 0,
        variant: "orange" as const,
        icon: Clock,
        tab: "8",
      },
    ],
    [assistanceCount, t],
  );

  return (
    <div
      className="flex-1 p-8 pt-6"
      style={{ animation: "homeadmin-fade-slide-in 0.35s ease-out both" }}
    >
      <div className="space-y-6 transition-all duration-300">
        {/* Filtros: periodo */}
        <div
          className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300"
          style={{
            animation: "dashboard-panel-in 0.4s ease-out both",
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
            <div className="md:col-span-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("period")}
              </label>
              {isFiltersLoading ? (
                <div className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
              ) : (
                <CHEKIOSelect
                  value={periodFilter}
                  onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}
                >
                <CHEKIOSelectTrigger>
                  <CHEKIOSelectValue />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  <CHEKIOSelectItem value={PeriodFilter.LAST_30_DAYS}>
                    {t("last30Days")}
                  </CHEKIOSelectItem>
                  <CHEKIOSelectItem value={PeriodFilter.THIS_MONTH}>
                    {t("thisMonth")}
                  </CHEKIOSelectItem>
                  <CHEKIOSelectItem value={PeriodFilter.LAST_MONTH}>
                    {t("lastMonth")}
                  </CHEKIOSelectItem>
                  <CHEKIOSelectItem value={PeriodFilter.CUSTOM_RANGE}>
                    {t("customRange")}
                  </CHEKIOSelectItem>
                </CHEKIOSelectContent>
              </CHEKIOSelect>
              )}
            </div>
            {!isFiltersLoading && periodFilter === PeriodFilter.CUSTOM_RANGE && (
              <>
                <div className="md:col-span-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t("startDate")}
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t("endDate")}
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </>
            )}
            <div className="md:col-span-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("branch")}
              </label>
              {isFiltersLoading ? (
                <div className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
              ) : (
                <CHEKIOSelect
                  value={branchId || "all"}
                  onValueChange={(v) => setBranchId(v === "all" ? "" : v)}
                >
                  <CHEKIOSelectTrigger>
                    <CHEKIOSelectValue placeholder={t("allBranches")} />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    <CHEKIOSelectItem value="all">{t("allBranches")}</CHEKIOSelectItem>
                    {branches?.data.map((branch: { publicId: string; name: string }) => (
                      <CHEKIOSelectItem key={branch.publicId} value={branch.publicId}>
                        {branch.name}
                      </CHEKIOSelectItem>
                    ))}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              )}
            </div>
            <div className="md:col-span-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("job")}
              </label>
              {isFiltersLoading ? (
                <div className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
              ) : (
                <CHEKIOSelect
                  value={jobId || "all"}
                  onValueChange={(v) => setJobId(v === "all" ? "" : v)}
                >
                  <CHEKIOSelectTrigger>
                    <CHEKIOSelectValue placeholder={t("allJobs")} />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    <CHEKIOSelectItem value="all">{t("allJobs")}</CHEKIOSelectItem>
                    {jobs?.data.map((job: { publicId: string; name: string }) => (
                      <CHEKIOSelectItem key={job.publicId} value={job.publicId}>
                        {job.name}
                      </CHEKIOSelectItem>
                    ))}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              )}
            </div>
          </div>
        </div>

        {/* KPIs Asistencia */}
        {!companyId ? (
          <div
            className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm transition-all duration-300"
            style={{ animation: "dashboard-panel-in 0.4s ease-out both" }}
          >
            <p className="text-gray-700">{t("selectCompany")}</p>
          </div>
        ) : isLoading ? (
          <>
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
              style={{
                animation: "dashboard-panel-in 0.4s ease-out 0.05s both",
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-lg p-6 shadow-sm transition-all duration-300"
                  style={{
                    backgroundColor: "rgb(229 231 235)",
                    animation: "dashboard-card-in 0.5s ease-out both",
                    animationDelay: `${80 + i * 70}ms`,
                  }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="h-8 w-16 animate-pulse rounded bg-gray-300" />
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-300" />
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-300" />
                    <div className="h-9 w-full animate-pulse rounded-md bg-gray-300" />
                  </div>
                </div>
              ))}
            </div>

            {/* Skeleton gráfico */}
            <div
              className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300"
              style={{
                animation: "homeadmin-fade-slide-in 0.5s ease-out 0.35s both",
              }}
            >
              <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
              <div className="flex h-[280px] items-end justify-around gap-4 px-4">
                {[40, 65, 45, 80, 55].map((h, i) => (
                  <div
                    key={i}
                    className="w-12 animate-pulse rounded-t bg-gray-200"
                    style={{ height: `${h}%`, minHeight: "24px" }}
                  />
                ))}
              </div>
            </div>

            {/* Skeleton QuickActions */}
            <div
              className="space-y-4"
              style={{
                animation: "homeadmin-fade-slide-in 0.5s ease-out 0.45s both",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-lg bg-gray-200"
                    style={{
                      animation: "dashboard-card-in 0.5s ease-out both",
                      animationDelay: `${80 + i * 90}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
              style={{
                animation: "dashboard-panel-in 0.4s ease-out 0.05s both",
              }}
            >
              {kpiCards.map((card, index) => {
                const cardDelayMs = 80 + index * 70;
                return (
                  <div
                    key={card.key}
                    style={{
                      animation: "dashboard-card-in 0.5s ease-out both",
                      animationDelay: `${cardDelayMs}ms`,
                    }}
                  >
                    <CHEKIOStatCard
                      title={card.title}
                      value={card.value}
                      variant={card.variant}
                      icon={card.icon}
                      subtitle={t("inPeriod")}
                      isLoading={isLoading}
                      countUpDelayMs={cardDelayMs}
                      onView={() => navigateToTab(card.tab)}
                      viewLabel={t("view")}
                    />
                  </div>
                );
              })}
            </div>

            {/* Gráfica distribución por estado */}
            <div
              style={{
                animation: "homeadmin-fade-slide-in 0.5s ease-out 0.35s both",
              }}
            >
              <AttendanceStatusChart data={assistanceCount} />
            </div>
          </>
        )}

        {/* QuickActions */}
        <div
          style={{
            animation: "homeadmin-fade-slide-in 0.5s ease-out 0.45s both",
          }}
        >
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
