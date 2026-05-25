"use client";

import { useCookieSession } from "@/context/useCookieSession";
import { useTranslations } from "next-intl";
import { AlertCircle, Clock, UtensilsCrossed } from "lucide-react";

/** Tope de horas de trabajo semanales para alerta (normativa aplicable al producto). */
enum ShiftWeeklyLegalWorkLimit {
  MAX_WORK_HOURS = 43,
}

interface SummaryShiftProps {
  workHours: {
    total: string;
  };
  healthHours: {
    total: string;
  };
  /** Horas de trabajo semanal equivalente (decimal) para comparar con el tope legal. */
  weeklyWorkHoursDecimal: number;
}

export function SummaryShift({
  workHours,
  healthHours,
  weeklyWorkHoursDecimal,
}: SummaryShiftProps) {
  const t = useTranslations("mantainers.shifts.form.summary");
  const { getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const isOverLimit =
    weeklyWorkHoursDecimal > ShiftWeeklyLegalWorkLimit.MAX_WORK_HOURS;
  const iconStyle = { color: `${templateUser.primary}99` };

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      data-tour="shifts-editor-summary"
    >
      {isOverLimit && (
        <div
          className="border-b border-red-200 bg-red-50 px-5 py-4"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-100">
              <AlertCircle
                className="h-4 w-4 text-red-600"
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-900">
                {t("warning")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-red-800">
                {t("warningMessage", {
                  hours: workHours.total,
                  limit: ShiftWeeklyLegalWorkLimit.MAX_WORK_HOURS,
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 md:p-5">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
              <Clock className="h-4 w-4 flex-shrink-0" style={iconStyle} />
              {t("workHours")}
            </span>
            <p
              className={`mt-3 text-xl font-semibold tabular-nums md:text-2xl ${
                isOverLimit ? "text-red-600" : "text-gray-900"
              }`}
            >
              {workHours.total}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 md:p-5">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
              <UtensilsCrossed
                className="h-4 w-4 flex-shrink-0"
                style={iconStyle}
              />
              {t("healthHours")}
            </span>
            <p className="mt-3 text-xl font-semibold tabular-nums text-gray-900 md:text-2xl">
              {healthHours.total}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
