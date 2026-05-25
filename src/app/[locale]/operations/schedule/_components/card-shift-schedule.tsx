"use client";

import { ScheduleResponseDto } from "@/app/[locale]/mantainers/schedules/_components/schedule.dto";
import { useTranslations } from "next-intl";
import {
  getCalendarCardClasses,
  CALENDAR_CARD_DAY_NUMBER,
  CALENDAR_CARD_DAY_POSITION,
} from "./calendar-card-styles";

export const CardShiftSchedule = ({
  isSelected = false,
  day,
  schedule,
  onClick,
  isHoliday = false,
  isBlocked = false,
}: {
  isSelected?: boolean;
  day: number;
  schedule: ScheduleResponseDto;
  onClick?: () => void;
  isHoliday?: boolean;
  isBlocked?: boolean;
}) => {
  const t = useTranslations("operations.schedule.cards");
  if (isHoliday) {
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
              isBlocked ? "bg-gray-400" : "bg-red-500"
            }`}
          />
          <h4
            className={`text-sm font-medium ${
              isBlocked ? "text-gray-500" : "text-gray-900"
            }`}
          >
            {schedule?.code}
            <span
              className={`text-xs ml-1 ${
                isBlocked ? "text-gray-400" : "text-red-500"
              }`}
            >
              ({t("holiday")})
            </span>
          </h4>
        </div>

        <div className="space-y-1">
          <div
            className={`flex items-center justify-center gap-2 rounded-lg p-1.5 min-w-[120px] ${
              isSelected
                ? "bg-blue-100"
                : isBlocked
                ? "bg-gray-200"
                : "bg-red-50"
            }`}
          >
            <span className="text-xs font-medium truncate max-w-[100px]">
              {schedule?.name}
            </span>
          </div>

          <div className="text-xs text-gray-500">
            <span className={isBlocked ? "text-gray-400" : "text-red-500"}>
              {t("holidayWithSchedule")}
            </span>{" "}
            • {schedule?.workHours}h {schedule?.workMinutes}m
          </div>
        </div>
      </div>
    );
  }
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
            isBlocked ? "bg-gray-400" : "bg-blue-500"
          }`}
        />
        <h4
          className={`text-sm font-medium ${
            isBlocked ? "text-gray-500" : "text-gray-900"
          }`}
        >
          {schedule?.code}
        </h4>
      </div>

      <div className="space-y-1">
        <div
          className={`flex items-center justify-center gap-2 rounded-lg p-1.5 min-w-[120px] ${
            isBlocked ? "bg-gray-200" : "bg-blue-50"
          }`}
        >
          <span className="text-xs font-medium truncate max-w-[100px]">
            {schedule?.name}
          </span>
        </div>

        <div className="text-xs text-gray-500">
          {t("total")}: {schedule?.workHours}h {schedule?.workMinutes}m
        </div>
      </div>
    </div>
  );
};
