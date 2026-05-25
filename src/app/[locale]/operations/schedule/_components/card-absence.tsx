"use client";

import { useTranslations } from "next-intl";
import {
  CALENDAR_CARD_DAY_NUMBER,
  CALENDAR_CARD_DAY_POSITION,
  getCalendarCardClasses,
} from "./calendar-card-styles";

function formatDateLabel(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export const CardAbsence = ({
  isSelected = false,
  day,
  absenceTypeName,
  startDate,
  endDate,
  withoutPay,
  onClick,
  isBlocked = false,
}: {
  isSelected?: boolean;
  day: number;
  absenceTypeName: string;
  startDate: string | Date;
  endDate: string | Date;
  withoutPay: boolean;
  onClick?: () => void;
  isBlocked?: boolean;
}) => {
  const t = useTranslations("operations.schedule.cards");
  const formattedStartDate = formatDateLabel(startDate);
  const formattedEndDate = formatDateLabel(endDate);
  const rangeLabel =
    formattedStartDate === formattedEndDate
      ? formattedStartDate
      : `${formattedStartDate} - ${formattedEndDate}`;

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
        <div
          className={`h-2 w-2 rounded-full ${
            isBlocked ? "bg-gray-400" : "bg-violet-500"
          }`}
        />
        <h4
          className={`text-sm font-medium ${
            isSelected
              ? "text-blue-800"
              : isBlocked
              ? "text-gray-500"
              : "text-violet-800"
          }`}
        >
          {t("absence")}
        </h4>
      </div>

      <div className="space-y-1">
        <div
          className={`flex items-center justify-center gap-2 rounded-lg p-1.5 min-w-[120px] ${
            isSelected
              ? "bg-blue-100"
              : isBlocked
              ? "bg-gray-200"
              : "bg-violet-50"
          }`}
        >
          <span
            className={`text-xs font-medium truncate max-w-[100px] ${
              isSelected
                ? "text-blue-800"
                : isBlocked
                ? "text-gray-500"
                : "text-violet-800"
            }`}
          >
            {absenceTypeName}
          </span>
        </div>

        <div
          className={`text-xs ${
            isSelected
              ? "text-blue-700"
              : isBlocked
              ? "text-gray-400"
              : "text-violet-700"
          }`}
        >
          {rangeLabel}
        </div>

        {withoutPay && (
          <div
            className={`text-[11px] font-medium ${
              isSelected
                ? "text-blue-700"
                : isBlocked
                ? "text-gray-400"
                : "text-violet-600"
            }`}
          >
            {t("withoutPay")}
          </div>
        )}
      </div>
    </div>
  );
};
