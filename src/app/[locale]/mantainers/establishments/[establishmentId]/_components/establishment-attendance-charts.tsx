"use client";

import { CHEKIOLoading } from "@/components";
import { BarChart3, Flame, LineChart as LineChartIcon, PieChart } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EstablishmentAttendanceChartsDto } from "../../_components/establishment.dto";

interface EstablishmentAttendanceChartsProps {
  charts?: EstablishmentAttendanceChartsDto;
  isLoading?: boolean;
}

const STATUS_COLORS = ["#2563eb", "#10b981", "#ef4444", "#f59e0b", "#64748b"];

function ChartCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof PieChart;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export default function EstablishmentAttendanceCharts({
  charts,
  isLoading,
}: EstablishmentAttendanceChartsProps) {
  const t = useTranslations("mantainers.establishments.attendance.charts");

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-12">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-6">
            <CHEKIOLoading />
          </div>
        ))}
      </div>
    );
  }

  const statusData = charts?.statusBreakdown?.filter((item) => item.count > 0) ?? [];
  const trendData = charts?.absenteeismTrend ?? [];
  const histogramData = charts?.markingHistogram ?? [];
  const distributionData = charts?.minutesInsideDistribution ?? [];
  const heatmapData = charts?.weekdayHourHeatmap ?? [];
  const maxHeatmapValue = Math.max(...heatmapData.map((item) => item.value), 1);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <ChartCard title={t("statusBreakdown")} icon={PieChart}>
          {statusData.length === 0 ? (
            <EmptyChart label={t("empty")} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <RechartsPieChart>
                <Pie data={statusData} dataKey="count" nameKey="label" outerRadius={90}>
                  {statusData.map((entry, index) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="lg:col-span-8">
        <ChartCard title={t("absenteeismTrend")} icon={LineChartIcon}>
          {trendData.length === 0 ? (
            <EmptyChart label={t("empty")} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="expectedCount" name={t("expected")} fill="#dbeafe" />
                <Bar dataKey="absentCount" name={t("absent")} fill="#fecaca" />
                <Line
                  type="monotone"
                  dataKey="absenteeismPercentage"
                  name={t("absenteeism")}
                  stroke="#ef4444"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="lg:col-span-6">
        <ChartCard title={t("markingHistogram")} icon={BarChart3}>
          {histogramData.length === 0 ? (
            <EmptyChart label={t("empty")} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={histogramData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="checkInCount" name={t("checkIns")} fill="#10b981" />
                <Bar dataKey="checkOutCount" name={t("checkOuts")} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="lg:col-span-6">
        <ChartCard title={t("minutesInside")} icon={BarChart3}>
          {distributionData.length === 0 ? (
            <EmptyChart label={t("empty")} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name={t("students")} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="lg:col-span-12">
        <ChartCard title={t("heatmap")} icon={Flame}>
          {heatmapData.length === 0 ? (
            <EmptyChart label={t("empty")} />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {heatmapData.map((cell) => {
                const opacity = Math.max(0.15, cell.value / maxHeatmapValue);
                return (
                  <div
                    key={`${cell.weekday}-${cell.hour}`}
                    className="rounded-lg border border-blue-100 px-3 py-2 text-xs"
                    style={{ backgroundColor: `rgba(37, 99, 235, ${opacity})` }}
                    title={`${cell.weekdayLabel} ${cell.hour}:00 - ${cell.value}`}
                  >
                    <p className="font-semibold text-gray-950">
                      {cell.weekdayLabel} {String(cell.hour).padStart(2, "0")}:00
                    </p>
                    <p className="text-gray-700">{cell.value} {t("marks")}</p>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
      {label}
    </div>
  );
}
