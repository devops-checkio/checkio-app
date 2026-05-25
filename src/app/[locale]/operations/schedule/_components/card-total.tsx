"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

enum LegalWeeklyWorkHoursLimit {
  MAX = 43,
}

export const CardTotal = ({
  weekHours = 0,
  weekMinutes = 0,
  weekSeconds = 0,
}: {
  weekHours?: number;
  weekMinutes?: number;
  weekSeconds?: number;
}) => {
  const t = useTranslations("operations.schedule.cards");
  const totalHoursDecimal =
    weekHours + weekMinutes / 60 + weekSeconds / 3600;
  const exceedsLegalWeeklyLimit =
    totalHoursDecimal > LegalWeeklyWorkHoursLimit.MAX;

  return (
    <div
      className={cn(
        "space-y-2 text-center h-full flex flex-col justify-center border rounded-xl p-2.5 shadow-sm min-h-[90px]",
        exceedsLegalWeeklyLimit
          ? "border-red-300 bg-red-50"
          : "border-gray-200 bg-slate-50",
      )}
    >
      <div className="flex items-center justify-center gap-2">
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            exceedsLegalWeeklyLimit ? "bg-red-600" : "bg-blue-600",
          )}
        />
        <h4
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            exceedsLegalWeeklyLimit ? "text-red-800" : "text-gray-700",
          )}
        >
          {t("weekly")}
        </h4>
      </div>

      <div className="space-y-1">
        <div
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg p-2 min-w-[120px] border",
            exceedsLegalWeeklyLimit
              ? "bg-red-100 border-red-200"
              : "bg-blue-50 border-blue-100",
          )}
        >
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              exceedsLegalWeeklyLimit ? "text-red-800" : "text-blue-800",
            )}
          >
            {weekHours}h {weekMinutes}m {weekSeconds}s
          </span>
        </div>
        {exceedsLegalWeeklyLimit && (
          <p className="text-[10px] font-medium leading-tight text-red-700 px-0.5">
            {t("weeklyExceedsLegal", { limit: LegalWeeklyWorkHoursLimit.MAX })}
          </p>
        )}
      </div>
    </div>
  );
};
