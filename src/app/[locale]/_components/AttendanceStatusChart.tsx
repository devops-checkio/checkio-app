"use client";

import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AssistanceCountDto } from "../assistance/_components/assistance.dto";

const COLORS = {
  completed: "#10b981",
  absent: "#ef4444",
  incomplete: "#f59e0b",
  withoutSchedule: "#06b6d4",
};

interface AttendanceStatusChartProps {
  data?: AssistanceCountDto | null;
}

export default function AttendanceStatusChart({ data }: AttendanceStatusChartProps) {
  const t = useTranslations("homeAdmin");

  const chartData = [
    {
      name: t("completed"),
      value: data?.completedCount ?? 0,
      fill: COLORS.completed,
    },
    {
      name: t("absent"),
      value: data?.absentCount ?? 0,
      fill: COLORS.absent,
    },
    {
      name: t("incomplete"),
      value: data?.incompleteCount ?? 0,
      fill: COLORS.incomplete,
    },
    {
      name: t("withoutSchedule"),
      value: data?.withoutScheduleCount ?? 0,
      fill: COLORS.withoutSchedule,
    },
  ].filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          {t("attendanceByStatus")}
        </h3>
        <div className="flex h-48 items-center justify-center text-gray-500">
          {t("noData")}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">
        {t("attendanceByStatus")}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          barCategoryGap="12%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => [value, ""]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />
          <Legend />
          <Bar
            dataKey="value"
            name={t("chartCount")}
            radius={[0, 4, 4, 0]}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
