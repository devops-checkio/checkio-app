"use client";

import {
  CHEKIOButton,
  CHEKIOHeader,
  CHEKIOInput,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { useGetGlobalEstablishmentAttendanceDashboard } from "@/service/mantainer.service";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import {
  EstablishmentAttendanceMode,
  EstablishmentAttendanceOperationalStatus,
  GlobalEstablishmentAttendanceFindDto,
  GlobalEstablishmentAttendanceRiskLevel,
  GlobalEstablishmentAttendanceSortBy,
} from "@/app/[locale]/mantainers/establishments/_components/establishment.dto";
import { ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import GlobalEstablishmentCards from "./global-establishment-cards";
import GlobalEstablishmentCharts from "./global-establishment-charts";
import GlobalEstablishmentKpis from "./global-establishment-kpis";
import GlobalEstablishmentRankingTable from "./global-establishment-ranking-table";

const statusOptions = [
  EstablishmentAttendanceOperationalStatus.ALL,
  EstablishmentAttendanceOperationalStatus.INSIDE,
  EstablishmentAttendanceOperationalStatus.EXITED,
  EstablishmentAttendanceOperationalStatus.ABSENT,
  EstablishmentAttendanceOperationalStatus.NOT_ARRIVED,
  EstablishmentAttendanceOperationalStatus.INCOMPLETE,
  EstablishmentAttendanceOperationalStatus.WITHOUT_SCHEDULE,
];

const riskOptions: (GlobalEstablishmentAttendanceRiskLevel | "ALL")[] = [
  "ALL",
  GlobalEstablishmentAttendanceRiskLevel.OK,
  GlobalEstablishmentAttendanceRiskLevel.ATTENTION,
  GlobalEstablishmentAttendanceRiskLevel.CRITICAL,
];

const sortOptions = [
  GlobalEstablishmentAttendanceSortBy.RISK,
  GlobalEstablishmentAttendanceSortBy.ABSENTEEISM,
  GlobalEstablishmentAttendanceSortBy.PRESENCE,
  GlobalEstablishmentAttendanceSortBy.NAME,
  GlobalEstablishmentAttendanceSortBy.CODE,
];

export default function GlobalEstablishmentAttendanceDashboard() {
  const t = useTranslations("assistanceEstablishmentsDashboard");
  const tOperationalStatus = useTranslations(
    "mantainers.establishments.attendance.status",
  );
  const { companyId } = useCookieSession();
  const today = DateTime.now().toFormat("yyyy-MM-dd");
  const [mode, setMode] = useState<EstablishmentAttendanceMode>(
    EstablishmentAttendanceMode.DAY,
  );
  const [date, setDate] = useState(today);
  const [startDate, setStartDate] = useState(
    DateTime.now().startOf("month").toFormat("yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(today);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EstablishmentAttendanceOperationalStatus>(
    EstablishmentAttendanceOperationalStatus.ALL,
  );
  const [risk, setRisk] = useState<(GlobalEstablishmentAttendanceRiskLevel | "ALL")>(
    "ALL",
  );
  const [sortBy, setSortBy] = useState<GlobalEstablishmentAttendanceSortBy>(
    GlobalEstablishmentAttendanceSortBy.RISK,
  );
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filter = useMemo<GlobalEstablishmentAttendanceFindDto>(
    () => ({
      companyId: companyId ?? "",
      mode,
      date: mode === EstablishmentAttendanceMode.DAY ? date : undefined,
      startDate: mode === EstablishmentAttendanceMode.PERIOD ? startDate : undefined,
      endDate: mode === EstablishmentAttendanceMode.PERIOD ? endDate : undefined,
      search: search.trim() || undefined,
      status,
      riskLevel:
        risk === "ALL" ? undefined : (risk as GlobalEstablishmentAttendanceRiskLevel),
      sortBy,
      sort,
      page,
      pageSize,
    }),
    [
      companyId,
      mode,
      date,
      startDate,
      endDate,
      search,
      status,
      risk,
      sortBy,
      sort,
      page,
      pageSize,
    ],
  );

  const { data, isLoading, isError, refetch, isFetching } =
    useGetGlobalEstablishmentAttendanceDashboard(filter, {
      enabled: !!companyId,
    });

  const pagination = data?.pagination;

  const handleExport = async () => {
    const rows = data?.ranking ?? [];
    if (rows.length === 0) return;
    const headers: HeaderMapping[] = [
      { attribute: "code", header: "Code" },
      { attribute: "name", header: "Establishment" },
      { attribute: "summary.expectedCount", header: t("ranking.expected") },
      { attribute: "summary.presentCount", header: t("ranking.present") },
      {
        attribute: "summary.absentCount",
        header: t("ranking.absent"),
        render: (_v, record: { summary?: { absentCount?: number; notArrivedCount?: number } }) =>
          (record?.summary?.absentCount ?? 0) +
          (record?.summary?.notArrivedCount ?? 0),
      },
      { attribute: "summary.presencePercentage", header: t("ranking.presencePct") },
      { attribute: "summary.insideCount", header: t("ranking.inside") },
      { attribute: "summary.exitedCount", header: t("ranking.exited") },
      { attribute: "summary.lateCount", header: t("ranking.late") },
      { attribute: "summary.earlyDepartureCount", header: t("ranking.earlyExit") },
      { attribute: "summary.missingCheckoutCount", header: t("ranking.noCheckout") },
      { attribute: "riskLevel", header: t("ranking.risk") },
    ];
    await generateExcel(rows, headers, t("exportFilename"));
  };

  if (!companyId) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {t("states.noCompany")}
      </p>
    );
  }

  if (isError) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {t("states.error")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <CHEKIOHeader
        title={t("header.title")}
        subtitle={
          data?.metadata
            ? `${data.metadata.startDate} — ${data.metadata.endDate} · ${t("header.lastRefresh")}: ${DateTime.fromISO(data.metadata.lastUpdatedAt).toFormat("HH:mm:ss")}`
            : undefined
        }
        breadcrumbs={[
          t("header.breadcrumbs.assistance"),
          t("header.breadcrumbs.dashboard"),
        ]}
      />

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <CHEKIOSelect
            value={mode}
            onValueChange={(v) => {
              setMode(v as EstablishmentAttendanceMode);
              setPage(1);
            }}
          >
            <CHEKIOSelectTrigger className="w-[160px]">
              <CHEKIOSelectValue />
            </CHEKIOSelectTrigger>
            <CHEKIOSelectContent>
              <CHEKIOSelectItem value={EstablishmentAttendanceMode.DAY}>
                {t("header.rangeDay")}
              </CHEKIOSelectItem>
              <CHEKIOSelectItem value={EstablishmentAttendanceMode.PERIOD}>
                {t("header.rangePeriod")}
              </CHEKIOSelectItem>
            </CHEKIOSelectContent>
          </CHEKIOSelect>

          {mode === EstablishmentAttendanceMode.DAY ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{t("filters.today")}</label>
              <CHEKIOInput
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                }}
                className="w-[160px]"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <CHEKIOInput
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <CHEKIOInput
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </>
          )}

          <div className="min-w-[200px] flex-1">
            <CHEKIOInput
              placeholder={t("filters.searchPlaceholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <CHEKIOSelect
            value={status}
            onValueChange={(v) => {
              setStatus(v as EstablishmentAttendanceOperationalStatus);
              setPage(1);
            }}
          >
            <CHEKIOSelectTrigger className="w-[200px]">
              <CHEKIOSelectValue placeholder={t("filters.status")} />
            </CHEKIOSelectTrigger>
            <CHEKIOSelectContent>
              {statusOptions.map((s) => (
                <CHEKIOSelectItem key={s} value={s}>
                  {tOperationalStatus(s)}
                </CHEKIOSelectItem>
              ))}
            </CHEKIOSelectContent>
          </CHEKIOSelect>

          <CHEKIOSelect
            value={risk}
            onValueChange={(v) => {
              setRisk(v as GlobalEstablishmentAttendanceRiskLevel | "ALL");
              setPage(1);
            }}
          >
            <CHEKIOSelectTrigger className="w-[200px]">
              <CHEKIOSelectValue placeholder={t("filters.risk")} />
            </CHEKIOSelectTrigger>
            <CHEKIOSelectContent>
              {riskOptions.map((r) => (
                <CHEKIOSelectItem key={r} value={r}>
                  {r === "ALL" ? t("filters.riskAll") : t(`risk.${r}`)}
                </CHEKIOSelectItem>
              ))}
            </CHEKIOSelectContent>
          </CHEKIOSelect>

          <CHEKIOSelect
            value={sortBy}
            onValueChange={(v) => {
              setSortBy(v as GlobalEstablishmentAttendanceSortBy);
              setPage(1);
            }}
          >
            <CHEKIOSelectTrigger className="w-[200px]">
              <CHEKIOSelectValue placeholder={t("filters.sortBy")} />
            </CHEKIOSelectTrigger>
            <CHEKIOSelectContent>
              {sortOptions.map((s) => (
                <CHEKIOSelectItem key={s} value={s}>
                  {t(`sort.${s}`)}
                </CHEKIOSelectItem>
              ))}
            </CHEKIOSelectContent>
          </CHEKIOSelect>

          <CHEKIOSelect
            value={sort}
            onValueChange={(v) => {
              setSort(v as "asc" | "desc");
              setPage(1);
            }}
          >
            <CHEKIOSelectTrigger className="w-[120px]">
              <CHEKIOSelectValue />
            </CHEKIOSelectTrigger>
            <CHEKIOSelectContent>
              <CHEKIOSelectItem value="desc">{t("filters.sortDesc")}</CHEKIOSelectItem>
              <CHEKIOSelectItem value="asc">{t("filters.sortAsc")}</CHEKIOSelectItem>
            </CHEKIOSelectContent>
          </CHEKIOSelect>

          <CHEKIOButton
            variant="secondaryBlue"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {t("filters.refresh")}
          </CHEKIOButton>
          <CHEKIOButton variant="secondary" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {t("filters.export")}
          </CHEKIOButton>
        </div>
      </section>

      <GlobalEstablishmentKpis summary={data?.summary} isLoading={isLoading} />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">{t("cards.title")}</h2>
        <GlobalEstablishmentCards centers={data?.establishments} isLoading={isLoading} />
      </div>

      {!isLoading && pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{t("filters.rowsPerPage")}</span>
            <CHEKIOSelect
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <CHEKIOSelectTrigger className="w-20">
                <CHEKIOSelectValue />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <CHEKIOSelectItem key={n} value={String(n)}>
                    {n}
                  </CHEKIOSelectItem>
                ))}
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          </div>
          <div className="flex items-center gap-2">
            <span>
              {t("pagination.page", {
                current: pagination.current,
                total: pagination.totalPages,
              })}
            </span>
            <CHEKIOButton
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.current <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </CHEKIOButton>
            <CHEKIOButton
              variant="secondary"
              onClick={() => setPage((p) => p + 1)}
              disabled={pagination.current >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </CHEKIOButton>
          </div>
        </div>
      )}

      <GlobalEstablishmentCharts
        charts={data?.charts}
        mode={data?.metadata?.mode}
        isLoading={isLoading}
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("ranking.title")}
        </h2>
        <GlobalEstablishmentRankingTable ranking={data?.ranking} isLoading={isLoading} />
      </div>
    </div>
  );
}
