"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { useGetEstablishmentAttendanceDashboard } from "@/service/mantainer.service";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import { AlertTriangle, Download, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  EstablishmentAttendanceFindDto,
  EstablishmentAttendanceMode,
  EstablishmentAttendanceOperationalStatus,
  EstablishmentAttendanceStudentDto,
} from "../../_components/establishment.dto";
import EstablishmentAttendanceCharts from "./establishment-attendance-charts";
import EstablishmentAttendanceKpis from "./establishment-attendance-kpis";
import EstablishmentAttendanceTable from "./establishment-attendance-table";
import EstablishmentAttendanceTimeline from "./establishment-attendance-timeline";

interface EstablishmentAttendanceDashboardProps {
  establishmentId: string;
  timezone?: string;
}

const statusOptions = [
  EstablishmentAttendanceOperationalStatus.ALL,
  EstablishmentAttendanceOperationalStatus.INSIDE,
  EstablishmentAttendanceOperationalStatus.EXITED,
  EstablishmentAttendanceOperationalStatus.ABSENT,
  EstablishmentAttendanceOperationalStatus.NOT_ARRIVED,
  EstablishmentAttendanceOperationalStatus.INCOMPLETE,
  EstablishmentAttendanceOperationalStatus.WITHOUT_SCHEDULE,
];

export default function EstablishmentAttendanceDashboard({
  establishmentId,
  timezone,
}: EstablishmentAttendanceDashboardProps) {
  const t = useTranslations("mantainers.establishments.attendance");
  const { companyId } = useCookieSession();
  const today = DateTime.now().toFormat("yyyy-MM-dd");
  const [mode, setMode] = useState<EstablishmentAttendanceMode>(
    EstablishmentAttendanceMode.DAY,
  );
  const [date, setDate] = useState(today);
  const [startDate, setStartDate] = useState(DateTime.now().startOf("month").toFormat("yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(today);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EstablishmentAttendanceOperationalStatus>(
    EstablishmentAttendanceOperationalStatus.ALL,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filter = useMemo<EstablishmentAttendanceFindDto>(
    () => ({
      companyId: companyId ?? "",
      mode,
      date: mode === EstablishmentAttendanceMode.DAY ? date : undefined,
      startDate: mode === EstablishmentAttendanceMode.PERIOD ? startDate : undefined,
      endDate: mode === EstablishmentAttendanceMode.PERIOD ? endDate : undefined,
      search: search || undefined,
      status,
      page,
      pageSize,
      sort: "desc",
    }),
    [companyId, mode, date, startDate, endDate, search, status, page, pageSize],
  );

  const { data, isLoading, isError, refetch, isFetching } =
    useGetEstablishmentAttendanceDashboard(establishmentId, filter, {
      enabled: !!companyId,
    });

  const handleModeChange = (nextMode: EstablishmentAttendanceMode) => {
    setMode(nextMode);
    setPage(1);
  };

  const handleStatusChange = (nextStatus: EstablishmentAttendanceOperationalStatus) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleExport = async () => {
    const rows = data?.students ?? [];
    if (rows.length === 0) return;
    const headers: HeaderMapping[] = [
      { attribute: "date", header: t("table.headers.date") },
      { attribute: "firstName", header: t("table.headers.student") },
      { attribute: "lastName", header: t("table.headers.student") },
      { attribute: "documentNumber", header: t("table.headers.document") },
      { attribute: "scheduleName", header: t("table.headers.schedule") },
      { attribute: "firstCheckInAt", header: t("table.headers.checkIn") },
      { attribute: "lastCheckOutAt", header: t("table.headers.checkOut") },
      { attribute: "operationalStatus", header: t("table.headers.status") },
      { attribute: "minutesInside", header: t("table.headers.minutes") },
    ];
    await generateExcel(rows, headers, t("exportFilename"));
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("header.badge")}
            </div>
            <h2 className="mt-3 text-xl font-bold text-gray-950">{t("header.title")}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("header.subtitle", {
                timezone: data?.metadata?.timezone ?? timezone ?? "-",
                lastUpdatedAt: data?.metadata?.lastUpdatedAt
                  ? DateTime.fromISO(data.metadata.lastUpdatedAt).toFormat("HH:mm")
                  : "-",
              })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <CHEKIOButton
              variant={mode === EstablishmentAttendanceMode.DAY ? "primary" : "secondaryBlue"}
              onClick={() => handleModeChange(EstablishmentAttendanceMode.DAY)}
            >
              {t("filters.dayMode")}
            </CHEKIOButton>
            <CHEKIOButton
              variant={mode === EstablishmentAttendanceMode.PERIOD ? "primary" : "secondaryBlue"}
              onClick={() => handleModeChange(EstablishmentAttendanceMode.PERIOD)}
            >
              {t("filters.periodMode")}
            </CHEKIOButton>
            <CHEKIOButton variant="refresh" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              {t("filters.refresh")}
            </CHEKIOButton>
            <CHEKIOButton variant="approve" onClick={handleExport}>
              <Download className="h-4 w-4" />
              {t("filters.export")}
            </CHEKIOButton>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-12">
          {mode === EstablishmentAttendanceMode.DAY ? (
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                {t("filters.date")}
              </label>
              <CHEKIOInput
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          ) : (
            <>
              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {t("filters.startDate")}
                </label>
                <CHEKIOInput
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {t("filters.endDate")}
                </label>
                <CHEKIOInput
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </>
          )}

          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              {t("filters.status")}
            </label>
            <CHEKIOSelect
              value={status}
              onValueChange={(value) =>
                handleStatusChange(value as EstablishmentAttendanceOperationalStatus)
              }
            >
              <CHEKIOSelectTrigger>
                <CHEKIOSelectValue />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                {statusOptions.map((option) => (
                  <CHEKIOSelectItem key={option} value={option}>
                    {t(`status.${option}`)}
                  </CHEKIOSelectItem>
                ))}
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              {t("filters.search")}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <CHEKIOInput
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder={t("filters.searchPlaceholder")}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </section>

      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <span>{t("errors.load")}</span>
        </div>
      )}

      <EstablishmentAttendanceKpis summary={data?.summary} isLoading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <EstablishmentAttendanceCharts charts={data?.charts} isLoading={isLoading} />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <InsightsPanel insights={data?.insights ?? []} />
          <EstablishmentAttendanceTimeline events={data?.charts?.timeline ?? []} />
        </div>
      </div>

      <EstablishmentAttendanceTable
        students={data?.students ?? []}
        pagination={data?.pagination}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
      />
    </div>
  );
}

function InsightsPanel({
  insights,
}: {
  insights: { type: string; title: string; description: string; value: number }[];
}) {
  const t = useTranslations("mantainers.establishments.attendance.insights");

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{t("title")}</h3>
      <p className="mt-1 text-xs text-gray-500">{t("subtitle")}</p>
      <div className="mt-4 space-y-3">
        {insights.length === 0 ? (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
            {t("empty")}
          </div>
        ) : (
          insights.map((insight) => (
            <div
              key={`${insight.type}-${insight.value}`}
              className="rounded-lg border border-amber-100 bg-amber-50 p-3"
            >
              <p className="font-semibold text-amber-900">{insight.title}</p>
              <p className="mt-1 text-xs text-amber-800">{insight.description}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
