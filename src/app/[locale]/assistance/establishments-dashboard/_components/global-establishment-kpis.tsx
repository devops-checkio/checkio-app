"use client";

import { CHEKIOLoading } from "@/components";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  DoorOpen,
  LogOut,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { GlobalEstablishmentAttendanceSummaryDto } from "@/app/[locale]/mantainers/establishments/_components/establishment.dto";

interface GlobalEstablishmentKpisProps {
  summary?: GlobalEstablishmentAttendanceSummaryDto;
  isLoading?: boolean;
}

const card =
  "rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md";

export default function GlobalEstablishmentKpis({
  summary,
  isLoading,
}: GlobalEstablishmentKpisProps) {
  const t = useTranslations("assistanceEstablishmentsDashboard.kpis");

  const items = [
    {
      key: "expected",
      label: t("expected"),
      value: summary?.expectedCount ?? 0,
      icon: Users,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      key: "present",
      label: t("present"),
      value: summary?.presentCount ?? 0,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "presenceRate",
      label: t("presenceRate"),
      value: `${summary?.presencePercentage ?? 0}%`,
      icon: Activity,
      tone: "bg-cyan-50 text-cyan-700",
    },
    {
      key: "absent",
      label: t("absent"),
      value: summary?.absentCount ?? 0,
      icon: AlertTriangle,
      tone: "bg-red-50 text-red-700",
    },
    {
      key: "inside",
      label: t("inside"),
      value: summary?.insideCount ?? 0,
      icon: DoorOpen,
      tone: "bg-indigo-50 text-indigo-700",
    },
    {
      key: "exited",
      label: t("exited"),
      value: summary?.exitedCount ?? 0,
      icon: LogOut,
      tone: "bg-slate-50 text-slate-700",
    },
    {
      key: "criticalEstablishments",
      label: t("criticalEstablishments"),
      value: summary?.criticalCentersCount ?? 0,
      icon: ShieldAlert,
      tone: "bg-rose-50 text-rose-700",
    },
    {
      key: "attentionEstablishments",
      label: t("attentionEstablishments"),
      value: summary?.attentionCentersCount ?? 0,
      icon: AlertTriangle,
      tone: "bg-amber-50 text-amber-800",
    },
    {
      key: "avgMinutes",
      label: t("avgMinutes"),
      value: `${summary?.averageMinutesInside ?? 0} min`,
      icon: Clock3,
      tone: "bg-violet-50 text-violet-700",
    },
    {
      key: "establishmentsWithActivity",
      label: t("establishmentsWithActivity"),
      value: summary?.centersWithActivityCount ?? 0,
      icon: Building2,
      tone: "bg-teal-50 text-teal-800",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <div key={item.key} className={card}>
            <CHEKIOLoading />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.key} className={card}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{item.value}</p>
            </div>
            <div className={`rounded-lg p-2 ${item.tone}`}>
              <item.icon className="h-4 w-4" aria-hidden />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
