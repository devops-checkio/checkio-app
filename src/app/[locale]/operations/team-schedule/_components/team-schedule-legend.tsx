"use client";

import { useTranslations } from "next-intl";

interface TeamScheduleLegendProps {
  primaryColor: string;
}

/** Píldoras de referencia: mismos tonos que las celdas del calendario. */
export function TeamScheduleLegend({ primaryColor }: TeamScheduleLegendProps) {
  const t = useTranslations("operations.teamSchedule.legend");

  const items: Array<{ key: string; pill: string; label: string }> = [
    {
      key: "unassigned",
      pill:
        "border border-gray-200 bg-white text-gray-500 shadow-sm",
      label: t("unassigned"),
    },
    {
      key: "holiday",
      pill:
        "border border-orange-200 bg-orange-50 text-orange-700 shadow-sm",
      label: t("holiday"),
    },
    {
      key: "free",
      pill:
        "border border-gray-200 bg-gray-100 text-gray-600 shadow-sm",
      label: t("free"),
    },
    {
      key: "shift",
      pill: "border border-blue-200 bg-blue-50 text-blue-800 shadow-sm",
      label: t("shift"),
    },
    {
      key: "schedule",
      pill:
        "border border-green-200 bg-green-50 text-green-800 shadow-sm",
      label: t("schedule"),
    },
    {
      key: "edited",
      pill:
        "border border-amber-200 bg-amber-50 text-amber-800 shadow-sm",
      label: t("edited"),
    },
    {
      key: "absence",
      pill: "border border-red-200 bg-red-50 text-red-800 shadow-sm",
      label: t("absence"),
    },
    {
      key: "permission",
      pill:
        "border border-purple-200 bg-purple-50 text-purple-800 shadow-sm",
      label: t("permission"),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-gray-100 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/50 px-3 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {t("title")}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {items.map(({ key, pill, label }) => (
          <span
            key={key}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${pill}`}
            title={label}
          >
            {label}
          </span>
        ))}
        <span
          className="inline-flex items-center gap-1 rounded-full border border-gray-200/80 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600 shadow-sm"
          title={t("todayColumnHint")}
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full ring-1 ring-white shadow-sm"
            style={{ backgroundColor: primaryColor }}
            aria-hidden
          />
          {t("todayColumn")}
        </span>
      </div>
    </div>
  );
}
