"use client";

import { CHEKIOLoading } from "@/components";
import {
  EstablishmentAttendanceMode,
  GlobalEstablishmentAttendanceChartsDto,
} from "@/app/[locale]/mantainers/establishments/_components/establishment.dto";
import { BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface GlobalEstablishmentChartsProps {
  charts?: GlobalEstablishmentAttendanceChartsDto;
  mode?: EstablishmentAttendanceMode;
  isLoading?: boolean;
}

function ChartCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof BarChart3;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <p className="py-10 text-center text-sm text-gray-500" role="status">
      {label}
    </p>
  );
}

export default function GlobalEstablishmentCharts({
  charts,
  mode,
  isLoading,
}: GlobalEstablishmentChartsProps) {
  const t = useTranslations("assistanceEstablishmentsDashboard.charts");

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-12">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-6"
          >
            <CHEKIOLoading />
          </div>
        ))}
      </div>
    );
  }

  const presence = charts?.presenceByEstablishment ?? [];
  const absenteeism = charts?.absenteeismByEstablishment ?? [];
  const histogram = charts?.markingHistogram ?? [];
  const heatmap = charts?.weekdayHourHeatmap ?? [];
  const trend = charts?.absenteeismTrend ?? [];
  const maxHeat = Math.max(...heatmap.map((h) => h.value), 1);

  const presenceChartData = presence.map((p) => ({
    label: p.name.length > 18 ? `${p.name.slice(0, 16)}…` : p.name,
    fullName: p.name,
    value: p.presencePercentage,
  }));

  const absentChartData = absenteeism.map((p) => ({
    label: p.name.length > 18 ? `${p.name.slice(0, 16)}…` : p.name,
    fullName: p.name,
    value: p.absenteeismPercentage,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-6">
        <ChartCard title={t("presenceByCenter")} icon={BarChart3}>
          {presenceChartData.length === 0 ? (
            <Empty label={t("empty")} />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={presenceChartData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, t("presenceByCenter")]}
                  labelFormatter={(_, payload) =>
                    (payload?.[0]?.payload as { fullName?: string })?.fullName ?? ""
                  }
                />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} name="%" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="lg:col-span-6">
        <ChartCard title={t("absenteeismByCenter")} icon={BarChart3}>
          {absentChartData.length === 0 ? (
            <Empty label={t("empty")} />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={absentChartData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, t("absenteeismByCenter")]}
                  labelFormatter={(_, payload) =>
                    (payload?.[0]?.payload as { fullName?: string })?.fullName ?? ""
                  }
                />
                <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} name="%" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="lg:col-span-6">
        <ChartCard title={t("histogram")} icon={BarChart3}>
          {histogram.length === 0 ? (
            <Empty label={t("empty")} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={histogram}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="checkInCount" fill="#10b981" name="IN" radius={[2, 2, 0, 0]} />
                <Bar dataKey="checkOutCount" fill="#6366f1" name="OUT" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="lg:col-span-6">
        <ChartCard title={t("trend")} icon={LineChartIcon}>
          {trend.length === 0 ? (
            <Empty label={t("empty")} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="absentCount" fill="#fecaca" name="abs" radius={[2, 2, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="absenteeismPercentage"
                  stroke="#b91c1c"
                  strokeWidth={2}
                  dot={false}
                  name="%"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {mode === EstablishmentAttendanceMode.PERIOD && heatmap.length > 0 && (
        <div className="lg:col-span-12">
          <ChartCard title={t("heatmap")} icon={BarChart3}>
            <div className="overflow-x-auto">
              <div
                className="grid gap-0.5"
                style={{
                  gridTemplateColumns: `80px repeat(24, minmax(0, 1fr))`,
                }}
              >
                <div />
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="text-center text-[10px] text-gray-500">
                    {h}
                  </div>
                ))}
                {[1, 2, 3, 4, 5, 6, 7].map((weekday) => {
                  const label =
                    heatmap.find((c) => c.weekday === weekday)?.weekdayLabel ??
                    `D${weekday}`;
                  return (
                    <React.Fragment key={`w-${weekday}`}>
                      <div className="pr-2 text-xs text-gray-600">{label}</div>
                      {Array.from({ length: 24 }, (_, hour) => {
                        const cell = heatmap.find(
                          (c) => c.weekday === weekday && c.hour === hour,
                        );
                        const v = cell?.value ?? 0;
                        const intensity = v / maxHeat;
                        const bg =
                          v === 0
                            ? "#f8fafc"
                            : `rgba(37, 99, 235, ${0.15 + intensity * 0.85})`;
                        return (
                          <div
                            key={`${weekday}-${hour}`}
                            className="aspect-square min-h-[14px] rounded-sm"
                            style={{ backgroundColor: bg }}
                            title={`${label} ${hour}:00 — ${v}`}
                          />
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
