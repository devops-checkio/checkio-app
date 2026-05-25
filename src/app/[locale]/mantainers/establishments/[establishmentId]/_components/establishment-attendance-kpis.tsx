"use client";

import { CHEKIOLoading } from "@/components";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  DoorOpen,
  LogOut,
  TimerReset,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { EstablishmentAttendanceSummaryDto } from "../../_components/establishment.dto";

interface EstablishmentAttendanceKpisProps {
  summary?: EstablishmentAttendanceSummaryDto;
  isLoading?: boolean;
}

const kpiClassName =
  "rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md";

export default function EstablishmentAttendanceKpis({
  summary,
  isLoading,
}: EstablishmentAttendanceKpisProps) {
  const t = useTranslations("mantainers.establishments.attendance.kpis");

  const items = [
    {
      key: "expected",
      label: t("expected"),
      value: summary?.expectedCount ?? 0,
      icon: Users,
      className: "bg-blue-50 text-blue-700",
    },
    {
      key: "present",
      label: t("present"),
      value: summary?.presentCount ?? 0,
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "presence",
      label: t("presence"),
      value: `${summary?.presencePercentage ?? 0}%`,
      icon: Activity,
      className: "bg-cyan-50 text-cyan-700",
    },
    {
      key: "absent",
      label: t("absent"),
      value: summary?.absentCount ?? 0,
      icon: AlertTriangle,
      className: "bg-red-50 text-red-700",
    },
    {
      key: "inside",
      label: t("inside"),
      value: summary?.insideCount ?? 0,
      icon: DoorOpen,
      className: "bg-indigo-50 text-indigo-700",
    },
    {
      key: "exited",
      label: t("exited"),
      value: summary?.exitedCount ?? 0,
      icon: LogOut,
      className: "bg-slate-50 text-slate-700",
    },
    {
      key: "averageMinutes",
      label: t("averageMinutes"),
      value: `${summary?.averageMinutesInside ?? 0} min`,
      icon: Clock3,
      className: "bg-amber-50 text-amber-700",
    },
    {
      key: "late",
      label: t("late"),
      value: summary?.lateCount ?? 0,
      icon: TimerReset,
      className: "bg-orange-50 text-orange-700",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.key} className={kpiClassName}>
            <CHEKIOLoading />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <section key={item.key} className={kpiClassName}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-950">
                  {item.value}
                </p>
              </div>
              <div className={`rounded-xl p-2 ${item.className}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
