"use client";

import { useTranslations } from "next-intl";
import {
  getCalendarCardClasses,
  CALENDAR_CARD_DAY_NUMBER,
  CALENDAR_CARD_DAY_POSITION,
} from "./calendar-card-styles";

export const CardFreeDay = ({
  isSelected = false,
  day,
  onClick,
  isBlocked = false,
}: {
  isSelected?: boolean;
  day: number;
  onClick?: () => void;
  isBlocked?: boolean;
}) => {
  const t = useTranslations("operations.schedule.cards");
  return (
    <div
      onClick={isBlocked ? undefined : onClick}
      className={`space-y-2 text-center ${getCalendarCardClasses(
        isSelected,
        isBlocked
      )}`}
    >
      <div className={CALENDAR_CARD_DAY_POSITION}>
        <span className={CALENDAR_CARD_DAY_NUMBER}>{day}</span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <h4 className="text-sm font-medium text-gray-900">{t("freeDay")}</h4>
      </div>

      <div className="space-y-1">
        <div
          className={`flex items-center justify-center gap-2 rounded-lg p-1.5 min-w-[120px] ${
            isSelected ? "bg-blue-100" : "bg-gray-50"
          }`}
        >
          <span className="text-xs font-medium">00:00</span>
          <span className="text-xs text-green-500">{t("until")}</span>
          <span className="text-xs font-medium">23:59</span>
        </div>

        <div className="text-xs text-green-500">{t("fullDayFree")}</div>
      </div>
    </div>
  );
};
