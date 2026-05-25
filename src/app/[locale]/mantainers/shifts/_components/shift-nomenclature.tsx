import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { Control, UseFormSetValue, useWatch } from "react-hook-form";
import { ScheduleResponseDto } from "../../schedules/_components/schedule.dto";
import {
  RotationType,
  ScheduleShiftUpsertDto,
  ShiftCreateDto,
} from "./shifth.dto";

interface ShiftNomenclatureProps {
  control: Control<ShiftCreateDto>;
  setValue: UseFormSetValue<any>;
  atribute: string;
}

const DAYS_SHORT: Record<string, string> = {
  Lunes: "L",
  Martes: "Ma",
  Miercoles: "Mi",
  Jueves: "J",
  Viernes: "V",
  Sabado: "S",
  Domingo: "D",
};

export const ShiftNomenclature = ({
  control,
  setValue,
  atribute,
}: ShiftNomenclatureProps) => {
  const t = useTranslations("mantainers.shifts.editor.nomenclature");
  const [type, schedules, weeks, selectedSchedules, days] = useWatch({
    control,
    name: ["type", "schedules", "weeks", "selectedSchedules", "days"],
  }) as [
    RotationType,
    ScheduleShiftUpsertDto[],
    number,
    ScheduleResponseDto[],
    number
  ];

  const nomenclature = useMemo(() => {
    if (!schedules?.length || !selectedSchedules?.length) return "";

    const generateWeeklyNomenclature = () => {
        return Array.from({ length: weeks }, (_, weekIndex) => {
        const weekSchedules = schedules.filter(
          (s: ScheduleShiftUpsertDto) => s.weekIndex === weekIndex
        );
        let weekNomenclature = `${t("week", { week: weekIndex + 1 })} `;

        if (!weekSchedules.length) {
          weekNomenclature += t("free");
          return weekNomenclature.trim();
        }

        let currentGroup: {
          scheduleId: string | null;
          startDay: string;
          days: string[];
          timeRange?: string;
        } | null = null;

        weekSchedules.forEach((schedule, idx) => {
          const scheduleDetails = selectedSchedules.find(
            (s) => s.publicId === schedule.scheduleId
          );

          // Check if it's a free day or has schedule
          if (!schedule.scheduleId || !scheduleDetails) {
            // If we were tracking a work period, add it to nomenclature
            if (currentGroup && currentGroup.scheduleId) {
              weekNomenclature += `${DAYS_SHORT[currentGroup.startDay]}${
                currentGroup.days.length > 1
                  ? ` ${t("to")} ${
                      DAYS_SHORT[
                        currentGroup.days[currentGroup.days.length - 1]
                      ]
                    }`
                  : ""
              } ${currentGroup.timeRange} `;
              currentGroup = null;
            }

            // Start or continue free period
            if (!currentGroup || currentGroup.scheduleId !== null) {
              currentGroup = {
                scheduleId: null,
                startDay: schedule.day,
                days: [schedule.day],
              };
            } else {
              currentGroup.days.push(schedule.day);
            }
          } else {
            // If we were tracking a free period, add it to nomenclature
            if (currentGroup && currentGroup.scheduleId === null) {
              weekNomenclature += `${DAYS_SHORT[currentGroup.startDay]}${
                currentGroup.days.length > 1
                  ? ` ${t("to")} ${
                      DAYS_SHORT[
                        currentGroup.days[currentGroup.days.length - 1]
                      ]
                    }`
                  : ""
              } ${t("free")} `;
              currentGroup = null;
            }

            // Start new group or continue existing if same schedule
            if (
              !currentGroup ||
              currentGroup.scheduleId !== schedule.scheduleId
            ) {
              if (currentGroup) {
              weekNomenclature += `${DAYS_SHORT[currentGroup.startDay]}${
                currentGroup.days.length > 1
                  ? ` ${t("to")} ${
                      DAYS_SHORT[
                        currentGroup.days[currentGroup.days.length - 1]
                      ]
                    }`
                  : ""
                } ${currentGroup.timeRange} `;
              }
              currentGroup = {
                scheduleId: schedule.scheduleId,
                startDay: schedule.day,
                days: [schedule.day],
                timeRange: getTimeRange(scheduleDetails),
              };
            } else {
              currentGroup.days.push(schedule.day);
            }
          }

          // Handle last group at end of week
          if (idx === weekSchedules.length - 1 && currentGroup) {
            weekNomenclature += `${DAYS_SHORT[currentGroup.startDay]}${
              currentGroup.days.length > 1
                ? ` a ${
                    DAYS_SHORT[currentGroup.days[currentGroup.days.length - 1]]
                  }`
                : ""
            } ${currentGroup.scheduleId ? currentGroup.timeRange : t("free")}`;
          }
        });

        return weekNomenclature.trim();
      }).join("\n");
    };

    const generateDailyNomenclature = () => {
      let nomenclature = `${t("dailyPrefix")} `;

      if (!schedules.length) {
        nomenclature += t("free");
        return nomenclature.trim();
      }

      let consecutiveFree = 0;

      schedules.forEach((schedule, idx) => {
        const scheduleDetails = selectedSchedules.find(
          (s) => s.publicId === schedule.scheduleId
        );

        if (!scheduleDetails) {
          consecutiveFree++;
          if (idx === schedules.length - 1 && consecutiveFree > 0) {
            nomenclature += `${idx - consecutiveFree + 2} a ${idx + 1} Libre `;
          }
          return;
        }

        if (consecutiveFree > 0) {
          const freeDaysText =
            consecutiveFree === 1
              ? `${idx} ${t("free")} `
              : `${idx - consecutiveFree + 1} ${t("to")} ${idx} ${t("free")} `;
          nomenclature += freeDaysText;
          consecutiveFree = 0;
        }

        const timeRange = getTimeRange(scheduleDetails);
        nomenclature += `${t("day", { day: idx + 1 })} ${timeRange} `;
      });

      return nomenclature.trim();
    };

    const getTimeRange = (schedule: ScheduleResponseDto) => {
      const startTime = DateTime.fromISO(schedule.startTime)
        .toUTC()
        .toFormat("HH:mm");
      const endTime = DateTime.fromISO(schedule.startTime)
        .toUTC()
        .plus({
          hours: schedule.workHours,
          minutes: schedule.workMinutes,
        })
        .toFormat("HH:mm");
        return `${startTime} ${t("to")} ${endTime}`;
    };

    return type === RotationType.WEEKLY
      ? generateWeeklyNomenclature()
      : generateDailyNomenclature();
  }, [type, schedules, weeks, selectedSchedules]);

  // Update form value when nomenclature changes
  useEffect(() => {
    if (nomenclature !== undefined) {
      setValue(atribute, nomenclature);
    }
  }, [nomenclature, setValue, atribute]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {t("label")}
      </label>
      <textarea
        disabled
        value={nomenclature || ""}
        readOnly
        style={{ resize: "none", height: "auto" }}
        rows={
          type === RotationType.WEEKLY
            ? Math.ceil((weeks * 7) / 7)
            : Math.ceil(days / 7)
        }
        className="w-full border rounded-md p-2"
      />
    </div>
  );
};
