"use client";

import { ScheduleResponseDto } from "@/app/[locale]/mantainers/schedules/_components/schedule.dto";
import { useTranslations } from "next-intl";
import { DateTime } from "luxon";
import {
  getCalendarCardClasses,
  CALENDAR_CARD_DAY_NUMBER,
  CALENDAR_CARD_DAY_POSITION,
} from "./calendar-card-styles";

export const CardSchedule = ({
  isSelected = false,
  day,
  schedule = null,
  establishmentName,
  scheduleDetails = [],
  onClick,
  isHoliday = false,
  isBlocked = false,
}: {
  isSelected?: boolean;
  day: number;
  schedule?: ScheduleResponseDto | null;
  establishmentName?: string | null;
  scheduleDetails?: Array<{
    schedule?: ScheduleResponseDto | null;
    establishmentName?: string | null;
  }>;
  onClick?: () => void;
  isHoliday?: boolean;
  isBlocked?: boolean;
}) => {
  const t = useTranslations("operations.schedule.cards");
  const baseDetails =
    scheduleDetails.length > 0
      ? scheduleDetails
      : [
          {
            schedule,
            establishmentName,
          },
        ];

  const formatTimeRange = (itemSchedule?: ScheduleResponseDto | null) => {
    if (!itemSchedule?.startTime) return "-";
    const start = DateTime.fromISO(String(itemSchedule.startTime), {
      zone: "utc",
    });
    const end = start.plus({
      hours: itemSchedule.workHours ?? 0,
      minutes: itemSchedule.workMinutes ?? 0,
    });
    return `${start.toFormat("HH:mm")} hasta ${end.toFormat("HH:mm")}`;
  };

  const getTimeRangeParts = (itemSchedule?: ScheduleResponseDto | null) => {
    if (!itemSchedule?.startTime) return { start: "-", end: "-" };
    const start = DateTime.fromISO(String(itemSchedule.startTime), {
      zone: "utc",
    });
    const end = start.plus({
      hours: itemSchedule.workHours ?? 0,
      minutes: itemSchedule.workMinutes ?? 0,
    });
    return { start: start.toFormat("HH:mm"), end: end.toFormat("HH:mm") };
  };

  const getScheduleLabel = (itemSchedule?: ScheduleResponseDto | null) => {
    if (!itemSchedule) return "-";
    return itemSchedule.code || itemSchedule.name || "-";
  };

  const getScheduleStartOrder = (itemSchedule?: ScheduleResponseDto | null) => {
    if (!itemSchedule?.startTime) return Number.MAX_SAFE_INTEGER;
    const start = DateTime.fromISO(String(itemSchedule.startTime), {
      zone: "utc",
    });
    return start.hour * 60 + start.minute;
  };

  const detailsToShow = [...baseDetails].sort(
    (a, b) => getScheduleStartOrder(a.schedule) - getScheduleStartOrder(b.schedule)
  );

  const titleLabel =
    detailsToShow.length <= 1
      ? schedule?.code || t("freeDay")
      : detailsToShow.length === 2
      ? "Doble horario"
      : detailsToShow.length === 3
      ? "Triple horario"
      : `${detailsToShow.length} horarios`;
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
              isSelected
                ? "text-blue-800"
                : isBlocked
                ? "text-gray-500"
                : "text-gray-900"
            }`}
          >
            {schedule?.code || t("freeDay")}
            <span
              className={`text-xs ml-1 ${
                isSelected
                  ? "text-blue-700"
                  : isBlocked
                  ? "text-gray-400"
                  : "text-red-500"
              }`}
            >
              ({t("edited")})
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
            <span
              className={`text-xs font-medium truncate max-w-[100px] ${
                isSelected ? "text-blue-800" : "text-gray-800"
              }`}
            >
              {schedule ? schedule.name : t("freeDay")}
            </span>
          </div>

          <div
            className={`text-xs ${
              isSelected ? "text-blue-700" : "text-gray-600"
            }`}
          >
            <span
              className={
                isBlocked
                  ? "text-gray-400"
                  : isSelected
                  ? "text-blue-700"
                  : "text-red-500"
              }
            >
              {t("modifiedSchedule")}
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
            isSelected
              ? "bg-blue-500"
              : isBlocked
              ? "bg-gray-400"
              : "bg-blue-500"
          }`}
        />
        <h4
          className={`text-sm font-medium ${
            isSelected
              ? "text-gray-900"
              : isBlocked
              ? "text-gray-500"
              : "text-gray-900"
          }`}
        >
          {titleLabel}
        </h4>
      </div>

      <div className="space-y-1">
        {detailsToShow.map((detail, index) => (
          <div key={`detail-${index}`} className="space-y-1 text-left">
            <div
              className={`rounded-md px-2 py-1.5 text-[11px] ${
                isSelected
                  ? "bg-blue-100/50 text-gray-900"
                  : isBlocked
                  ? "bg-gray-200 text-gray-500"
                  : "bg-blue-50/50 text-gray-900"
              }`}
            >
              <div className="truncate font-semibold" title={getScheduleLabel(detail.schedule)}>
                {getScheduleLabel(detail.schedule)}
                <span className="text-blue-700 font-semibold">{"    —    "}</span>
                <span className="font-semibold">{getTimeRangeParts(detail.schedule).start}</span>{" "}
                <span className="text-blue-700 font-semibold">hasta</span>{" "}
                <span className="font-semibold">{getTimeRangeParts(detail.schedule).end}</span>
              </div>
              <div className="truncate text-gray-700 font-semibold" title={detail.establishmentName ?? "-"}>
                {detail.establishmentName ?? "-"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
