"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOLoading,
  CHEKIOModal,
  CHEKIOTab,
  CHEKIOTabs,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetSchedule } from "@/service/schedule.service";
import { checkOverlap, positionInTime } from "@/utils/control-overlap";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { BreakType, ScheduleBreakDto } from "./schedule.dto";
import ScheduleTimeline from "./schedule-timeline";

interface SchedulePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicId: string | null;
}

export default function SchedulePreviewModal({
  isOpen,
  onClose,
  publicId,
}: SchedulePreviewModalProps) {
  const t = useTranslations("mantainers.schedules");
  const tPreview = useTranslations("mantainers.schedules.preview");
  const { data: schedule, isLoading } = useGetSchedule(publicId);
  const [calculatedEndTime, setCalculatedEndTime] = useState<DateTime | null>(
    null
  );
  const [totalDays, setTotalDays] = useState<number>(0);
  const [validatedBreaks, setValidatedBreaks] = useState<ScheduleBreakDto[]>(
    []
  );
  const [activeTab, setActiveTab] = useState<"distribution" | "configuration">(
    "distribution"
  );

  const validateBreaks = useCallback(
    (breaksToValidate: ScheduleBreakDto[]) => {
      if (!schedule?.startTime || !calculatedEndTime) return breaksToValidate;

      // Crear DateTime sin zona horaria (solo hora local)
      const scheduleStart = DateTime.fromISO(schedule.startTime)
        .setZone("local", { keepLocalTime: true });
      const scheduleEnd = calculatedEndTime;

      return breaksToValidate.map((breakItem) => {
        // Convertir fechas de string ISO a Date objects sin zona horaria
        let breakStartDate: Date;
        let breakEndDate: Date;

        if (typeof breakItem.startTime === "string") {
          const dateStr = breakItem.startTime.replace("Z", "");
          const [datePart, timePart] = dateStr.split("T");
          const [year, month, day] = datePart.split("-").map(Number);
          const [hours, minutes, seconds = 0] = timePart
            .split(":")
            .map((s: string) => parseFloat(s));
          breakStartDate = new Date(
            year,
            month - 1,
            day,
            hours,
            minutes,
            seconds
          );
        } else {
          breakStartDate = breakItem.startTime as Date;
        }

        if (typeof breakItem.endTime === "string") {
          const dateStr = breakItem.endTime.replace("Z", "");
          const [datePart, timePart] = dateStr.split("T");
          const [year, month, day] = datePart.split("-").map(Number);
          const [hours, minutes, seconds = 0] = timePart
            .split(":")
            .map((s: string) => parseFloat(s));
          breakEndDate = new Date(
            year,
            month - 1,
            day,
            hours,
            minutes,
            seconds
          );
        } else {
          breakEndDate = breakItem.endTime as Date;
        }

        // Crear DateTime sin zona horaria para pausas (solo hora local)
        let breakStart = DateTime.fromJSDate(breakStartDate).setZone(
          "local",
          { keepLocalTime: true }
        );
        let breakEnd = DateTime.fromJSDate(breakEndDate).setZone(
          "local",
          { keepLocalTime: true }
        );

        if (breakItem.day < 1 || breakItem.day > totalDays) {
          return {
            ...breakItem,
            error: t("form.breaks.validation.dayRange", { totalDays }),
          };
        }

        [breakStart, breakEnd] = positionInTime(
          breakStart,
          breakEnd,
          breakItem.day
        );

        if (breakItem.day > totalDays) {
          return {
            ...breakItem,
            error: t("form.breaks.validation.cannotEndNextDay"),
          };
        }

        if (breakStart < scheduleStart) {
          return {
            ...breakItem,
            error: t("form.breaks.validation.startsBeforeSchedule"),
          };
        }
        if (breakEnd > scheduleEnd) {
          return {
            ...breakItem,
            error: t("form.breaks.validation.endsAfterSchedule"),
          };
        }

        const hasOverlap = breaksToValidate.some((otherBreak) => {
          if (otherBreak.publicId === breakItem.publicId) return false;

          [breakStart, breakEnd] = positionInTime(
            breakStart,
            breakEnd,
            breakItem.day
          );

          // Convertir otras pausas también
          let otherStartDate: Date;
          let otherEndDate: Date;

          if (typeof otherBreak.startTime === "string") {
            const dateStr = otherBreak.startTime.replace("Z", "");
            const [datePart, timePart] = dateStr.split("T");
            const [year, month, day] = datePart.split("-").map(Number);
            const [hours, minutes, seconds = 0] = timePart
              .split(":")
              .map((s: string) => parseFloat(s));
            otherStartDate = new Date(
              year,
              month - 1,
              day,
              hours,
              minutes,
              seconds
            );
          } else {
            otherStartDate = otherBreak.startTime as Date;
          }

          if (typeof otherBreak.endTime === "string") {
            const dateStr = otherBreak.endTime.replace("Z", "");
            const [datePart, timePart] = dateStr.split("T");
            const [year, month, day] = datePart.split("-").map(Number);
            const [hours, minutes, seconds = 0] = timePart
              .split(":")
              .map((s: string) => parseFloat(s));
            otherEndDate = new Date(
              year,
              month - 1,
              day,
              hours,
              minutes,
              seconds
            );
          } else {
            otherEndDate = otherBreak.endTime as Date;
          }

          let otherStart = DateTime.fromJSDate(otherStartDate).setZone(
            "local",
            { keepLocalTime: true }
          );
          let otherEnd = DateTime.fromJSDate(otherEndDate).setZone(
            "local",
            { keepLocalTime: true }
          );
          [otherStart, otherEnd] = positionInTime(
            otherStart,
            otherEnd,
            otherBreak.day
          );

          return checkOverlap(breakStart, breakEnd, otherStart, otherEnd);
        });

        if (hasOverlap) {
          return { ...breakItem, error: t("form.breaks.validation.overlaps") };
        }

        return { ...breakItem, error: undefined };
      });
    },
    [schedule, calculatedEndTime, totalDays]
  );

  useEffect(() => {
    if (schedule?.startTime && schedule?.workHours) {
      // Convertir startTime de string ISO a Date sin zona horaria
      const dateStr = schedule.startTime.replace("Z", "");
      const [datePart, timePart] = dateStr.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes, seconds = 0] = timePart
        .split(":")
        .map((s: string) => parseFloat(s));
      const startDate = new Date(
        year,
        month - 1,
        day,
        hours,
        minutes,
        seconds
      );

      // Crear DateTime sin zona horaria (solo hora local)
      const start = DateTime.fromJSDate(startDate).setZone("local", {
        keepLocalTime: true,
      });
      const end = start.plus({
        hours: schedule.workHours,
        minutes: schedule.workMinutes || 0,
      });
      const startDay = start.startOf("day");
      const endDay = end.startOf("day");
      const totalDays = Math.ceil(endDay.diff(startDay, "days").days + 1);
      setCalculatedEndTime(end);
      setTotalDays(totalDays);
    }
  }, [schedule]);

  useEffect(() => {
    if (schedule?.ScheduleBreaks) {
      const validated = validateBreaks(schedule.ScheduleBreaks);
      setValidatedBreaks(validated);
    }
  }, [schedule?.ScheduleBreaks, validateBreaks]);

  // Helper function to format time like in page.tsx
  const formatTime = (timeString: string | Date): string => {
    let date: Date;
    if (typeof timeString === "string") {
      const dateStr = timeString.replace("Z", "");
      const [datePart, timePart] = dateStr.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes, seconds = 0] = timePart
        .split(":")
        .map((s: string) => parseFloat(s));
      date = new Date(year, month - 1, day, hours, minutes, seconds);
    } else {
      date = timeString;
    }
    return DateTime.fromJSDate(date)
      .setZone("local", { keepLocalTime: true })
      .toFormat("HH:mm");
  };

  // Convertir breaks a formato Date para ScheduleTimeline
  const processedBreaksForTimeline: ScheduleBreakDto[] = validatedBreaks.map(
    (breakItem) => {
      let breakStartDate: Date;
      let breakEndDate: Date;

      if (typeof breakItem.startTime === "string") {
        const dateStr = breakItem.startTime.replace("Z", "");
        const [datePart, timePart] = dateStr.split("T");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hours, minutes, seconds = 0] = timePart
          .split(":")
          .map((s: string) => parseFloat(s));
        breakStartDate = new Date(
          year,
          month - 1,
          day,
          hours,
          minutes,
          seconds
        );
      } else {
        breakStartDate = breakItem.startTime as Date;
      }

      if (typeof breakItem.endTime === "string") {
        const dateStr = breakItem.endTime.replace("Z", "");
        const [datePart, timePart] = dateStr.split("T");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hours, minutes, seconds = 0] = timePart
          .split(":")
          .map((s: string) => parseFloat(s));
        breakEndDate = new Date(
          year,
          month - 1,
          day,
          hours,
          minutes,
          seconds
        );
      } else {
        breakEndDate = breakItem.endTime as Date;
      }

      return {
        ...breakItem,
        startTime: breakStartDate,
        endTime: breakEndDate,
      };
    }
  );

  if (isLoading) {
    return (
      <CHEKIOModal
        isOpen={isOpen}
        onClose={onClose}
        title={tPreview("title")}
        size="6xl"
      >
        <div className="flex justify-center items-center h-64">
          <CHEKIOLoading size="lg" variant="modern" text={tPreview("loading")} />
        </div>
      </CHEKIOModal>
    );
  }

  if (!schedule) {
    return (
      <CHEKIOModal
        isOpen={isOpen}
        onClose={onClose}
        title={tPreview("title")}
        size="6xl"
      >
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600 font-medium">{tPreview("notFound")}</p>
        </div>
      </CHEKIOModal>
    );
  }

  // Helper para obtener el startTime formateado
  const getFormattedStartTime = () => {
    if (!schedule?.startTime) return "";
    const dateStr = schedule.startTime.replace("Z", "");
    const [datePart, timePart] = dateStr.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes, seconds = 0] = timePart
      .split(":")
      .map((s: string) => parseFloat(s));
    const startDate = new Date(
      year,
      month - 1,
      day,
      hours,
      minutes,
      seconds
    );
    return DateTime.fromJSDate(startDate)
      .setZone("local", { keepLocalTime: true })
      .toFormat("HH:mm");
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={tPreview("title")}
      size="6xl"
    >
      <div className="space-y-6">
        {/* Información Básica - Siempre visible */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {tPreview("basicInfo.name")}
            </label>
            <CHEKIOInput
              type="text"
              value={schedule.name}
              readOnly
              disabled
              className="bg-gray-50 cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {tPreview("basicInfo.code")}
            </label>
            <CHEKIOInput
              type="text"
              value={schedule.code}
              readOnly
              disabled
              className="bg-gray-50 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="w-full">
          <CHEKIOTabs>
            <CHEKIOTab
              active={activeTab === "distribution"}
              onClick={() => setActiveTab("distribution")}
            >
              {tPreview("tabs.distribution")}
            </CHEKIOTab>
            <CHEKIOTab
              active={activeTab === "configuration"}
              onClick={() => setActiveTab("configuration")}
            >
              {tPreview("tabs.configuration")}
            </CHEKIOTab>
          </CHEKIOTabs>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "distribution" && (
              <div>
                {schedule?.startTime && calculatedEndTime ? (
                  <ScheduleTimeline
                    startTime={getFormattedStartTime()}
                    endTime={calculatedEndTime.toFormat("HH:mm")}
                    totalDays={totalDays}
                    breaks={processedBreaksForTimeline}
                  />
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-600 font-medium">
                      {tPreview("breaks.distribution.cannotShow")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "configuration" && (
              <div className="space-y-6">
                {/* Configuración del Horario */}
                <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    {tPreview("scheduleConfig.title")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {tPreview("scheduleConfig.startTime")}
                      </label>
                      <CHEKIOInput
                        type="time"
                        value={formatTime(schedule.startTime)}
                        readOnly
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {tPreview("scheduleConfig.workHours")}
                      </label>
                      <CHEKIOInput
                        type="number"
                        value={schedule.workHours}
                        readOnly
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {tPreview("scheduleConfig.workMinutes")}
                      </label>
                      <CHEKIOInput
                        type="number"
                        value={schedule.workMinutes || 0}
                        readOnly
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {tPreview("scheduleConfig.discountMinutes")}
                      </label>
                      <CHEKIOInput
                        type="number"
                        value={schedule.discountMinutes || 0}
                        readOnly
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {tPreview("scheduleConfig.calculatedEndTime")}
                      </label>
                      <CHEKIOInput
                        type="time"
                        value={calculatedEndTime?.toFormat("HH:mm") || ""}
                        readOnly
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Pausas y Colaciones */}
                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {tPreview("breaks.title")}
                  </h3>

                  {validatedBreaks.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-600 font-medium">
                        {tPreview("breaks.noBreaks")}
                      </p>
                    </div>
                  ) : (
                    <CHEKIOTable>
                      <CHEKIOTableHeader>
                        <tr>
                          <CHEKIOTableHead>{tPreview("breaks.table.headers.description")}</CHEKIOTableHead>
                          <CHEKIOTableHead>{tPreview("breaks.table.headers.type")}</CHEKIOTableHead>
                          <CHEKIOTableHead>{tPreview("breaks.table.headers.day")}</CHEKIOTableHead>
                          <CHEKIOTableHead>{tPreview("breaks.table.headers.startTime")}</CHEKIOTableHead>
                          <CHEKIOTableHead>{tPreview("breaks.table.headers.endTime")}</CHEKIOTableHead>
                          <CHEKIOTableHead>{tPreview("breaks.table.headers.status")}</CHEKIOTableHead>
                          <CHEKIOTableHead>{tPreview("breaks.table.headers.deductible")}</CHEKIOTableHead>
                        </tr>
                      </CHEKIOTableHeader>
                      <CHEKIOTableBody>
                        {validatedBreaks.map((breakItem, index) => (
                          <CHEKIOTableRow
                            key={breakItem.publicId}
                            index={index}
                            className={breakItem.error ? "bg-red-100" : ""}
                          >
                            <CHEKIOTableCell>
                              <span className="text-gray-900">
                                {breakItem.description}
                              </span>
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              <span className="text-gray-700">
                                {breakItem.type === BreakType.LUNCH
                                  ? tPreview("breaks.table.type.lunch")
                                  : tPreview("breaks.table.type.break")}
                              </span>
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              <span className="text-gray-700">
                                {tPreview("breaks.table.day", { day: breakItem.day })}
                              </span>
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              <span className="text-gray-700">
                                {formatTime(breakItem.startTime as string)}
                              </span>
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              <span className="text-gray-700">
                                {formatTime(breakItem.endTime as string)}
                              </span>
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              {breakItem.error ? (
                                <span className="text-red-500 text-sm">
                                  {breakItem.error}
                                </span>
                              ) : (
                                <span className="text-green-500 text-sm">
                                  {tPreview("breaks.table.status.valid")}
                                </span>
                              )}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              <Checkbox checked={breakItem.deductible} disabled />
                            </CHEKIOTableCell>
                          </CHEKIOTableRow>
                        ))}
                      </CHEKIOTableBody>
                    </CHEKIOTable>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t mt-6">
        <CHEKIOButton variant="secondaryBlue" onClick={onClose}>
          {tPreview("close")}
        </CHEKIOButton>
      </div>
    </CHEKIOModal>
  );
}
