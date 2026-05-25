import ScheduleModalUpsert from "@/app/[locale]/mantainers/schedules/_components/schedule-modal-upsert";
import {
  CHEKIOActionButton,
  CHEKIOButton,
  CHEKIOModal,
  ScheduleDayTimelineStrip,
} from "@/components";
import { checkOverlap } from "@/utils/control-overlap";
import { AlertCircle, Clock, Plus, Trash2 } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { ScheduleResponseDto } from "../../schedules/_components/schedule.dto";
import { ScheduleShiftUpsertDto } from "./shifth.dto";

interface ShiftWeekProps {
  day: string;
  scheduleDay: ScheduleResponseDto | null;
  selectedSchedules: ScheduleResponseDto[] | null;
  handleOpenDrawer: (day: string) => void;
  record: ScheduleShiftUpsertDto;
  schedulesRotating: ScheduleShiftUpsertDto[];
  handleDelete: () => void;
  onOverlapChange?: (hasOverlap: boolean) => void;
  canAddSchedule?: boolean;
}

const ShiftWeek = ({
  day,
  record,
  scheduleDay,
  selectedSchedules,
  handleOpenDrawer,
  schedulesRotating,
  handleDelete,
  onOverlapChange,
  canAddSchedule = true,
}: ShiftWeekProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalScheduleOpen, setIsModalScheduleOpen] = useState(false);
  let hasOverlap = false;
  let totalDays = 0;
  let overlappingSchedules: {
    schedule: ScheduleResponseDto;
    startDate: DateTime;
    endDate: DateTime;
  }[] = [];

  if (scheduleDay) {
    const startDate = DateTime.fromISO(scheduleDay.startTime)
      .set({
        year: DateTime.now().year,
        month: DateTime.now().month,
        day: DateTime.now().day,
      })
      .toUTC()
      .plus({
        days: record.dayIndex + record.weekIndex * 7,
      });

    const endDate = startDate.toUTC().plus({
      hours: scheduleDay.workHours,
      minutes: scheduleDay.workMinutes || 0,
    });

    const startDay = startDate.startOf("day");
    const endDay = endDate.startOf("day");
    totalDays = Math.ceil(endDay.diff(startDay, "days").days + 1);

    const endIndex = record.dayIndex + record.weekIndex * 7 + totalDays;
    const scheduleRotatingToCheck = [
      ...schedulesRotating.slice(
        record.dayIndex + record.weekIndex * 7,
        endIndex
      ),
    ];

    if (schedulesRotating.length < endIndex) {
      const totalDaysToAdd = endIndex - schedulesRotating.length;
      const first5Records = schedulesRotating.slice(0, totalDaysToAdd);
      first5Records.forEach((record, i) => {
        const newRecord = { ...record };
        newRecord.dayIndex = (record.dayIndex + i * 7) % 7;
        newRecord.weekIndex = record.weekIndex + 1;
        scheduleRotatingToCheck.push(newRecord);
      });
    }

    scheduleRotatingToCheck.forEach((rotationDay) => {
      if (!rotationDay.scheduleId) return;
      if (rotationDay.publicId === record.publicId) return;

      const scheduleToCheck = selectedSchedules?.find(
        (schedule) => schedule.publicId === rotationDay.scheduleId
      );

      if (!scheduleToCheck) return;

      const startDateToCheck = DateTime.fromISO(scheduleToCheck.startTime)
        .set({
          year: DateTime.now().year,
          month: DateTime.now().month,
          day: DateTime.now().day,
        })
        .toUTC()
        .plus({
          days: rotationDay.dayIndex + rotationDay.weekIndex * 7,
        });

      const endDateToCheck = startDateToCheck.toUTC().plus({
        hours: scheduleToCheck.workHours,
        minutes: scheduleToCheck.workMinutes || 0,
      });

      if (checkOverlap(startDate, endDate, startDateToCheck, endDateToCheck)) {
        hasOverlap = true;
        overlappingSchedules.push({
          schedule: scheduleToCheck,
          startDate: startDateToCheck,
          endDate: endDateToCheck,
        });
      }
    });
  }

  const handleCloseModalSchedule = () => {
    setIsModalScheduleOpen(false);
  };

  useEffect(() => {
    onOverlapChange?.(hasOverlap);
  }, [hasOverlap, onOverlapChange]);

  return (
    <div
      key={day}
      className="flex h-full min-h-0 w-full flex-col items-center space-y-3"
    >
      <div className="flex items-center justify-center w-full bg-gray-100 border-b-2 border-gray-300 py-2">
        <span className="text-sm font-semibold">{day}</span>
        <span className="text-xs text-gray-500 ml-2">{totalDays} días</span>
      </div>

      {!scheduleDay ? (
        <CHEKIOButton
          variant="secondaryBlue"
          type="button"
          onClick={() => handleOpenDrawer(day)}
          disabled={!canAddSchedule}
          title={!canAddSchedule ? "Seleccione al menos una empresa primero" : undefined}
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Asignar
        </CHEKIOButton>
      ) : (
        <div className="grid grid-cols-3 gap-2 w-full">
          <CHEKIOButton
            variant="secondaryBlue"
            type="button"
            onClick={() => handleOpenDrawer(day)}
            disabled={!canAddSchedule}
            title={!canAddSchedule ? "Seleccione al menos una empresa primero" : undefined}
            className="col-span-2 flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Cambiar
          </CHEKIOButton>
          <CHEKIOActionButton
            variant="delete"
            type="button"
            onClick={() => handleDelete()}
            className="w-full h-full flex items-center justify-center"
          >
            <Trash2 className="h-4 w-4" />
          </CHEKIOActionButton>
        </div>
      )}

      {scheduleDay ? (
        <div
          className={`relative flex min-h-0 w-full flex-1 flex-col border-2 p-3 transition-shadow hover:shadow-md ${
            hasOverlap ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
          }`}
        >
          {hasOverlap && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute -top-2 -right-2 text-red-600 transition-colors hover:text-red-700"
              aria-label="Ver conflictos"
            >
              <AlertCircle className="h-5 w-5 animate-pulse" />
            </button>
          )}
          <div className="flex min-h-0 flex-1 flex-col text-center">
            <div className="flex min-h-0 flex-1 flex-col space-y-2">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1 text-gray-600">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">Horario:</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      hasOverlap ? "bg-red-500 animate-pulse" : "bg-blue-500"
                    }`}
                  />
                  <h4 className="text-sm font-medium text-gray-900">
                    {scheduleDay.code}
                  </h4>
                </div>
                <div
                  className="flex cursor-pointer items-center justify-center gap-2 border border-blue-200 bg-blue-50 p-2 text-center transition-colors group hover:bg-blue-100"
                  onClick={() => setIsModalScheduleOpen(true)}
                >
                  <span className="text-center text-xs font-medium">
                    {scheduleDay.name}
                  </span>
                </div>
              </div>
              <div className="min-h-[4px] flex-1" aria-hidden />
            </div>
            <div className="shrink-0 space-y-1">
              <div className="text-center text-[10px] text-gray-500">
                Total: {scheduleDay.workHours}h {scheduleDay.workMinutes}m
              </div>
              <ScheduleDayTimelineStrip
                schedule={scheduleDay}
                className="px-0.5"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 w-full flex-1 flex-col border-2 border-gray-300 bg-gray-50 p-3 transition-shadow hover:shadow-md">
          <div className="flex min-h-0 flex-1 flex-col text-center">
            <div className="flex min-h-0 flex-1 flex-col space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <h4 className="text-sm font-medium text-gray-900">
                  Disponible para asignar
                </h4>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-yellow-600">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">Sin horario asignado</span>
                </div>
                <div className="flex cursor-pointer items-center justify-center gap-2 border border-yellow-200 bg-yellow-50 p-2 transition-colors group hover:bg-yellow-100">
                  <span className="text-xs font-medium text-gray-400">--:--</span>
                  <span className="text-xs text-yellow-600">hasta</span>
                  <span className="text-xs font-medium text-gray-400">--:--</span>
                </div>
                <div className="animate-pulse text-[10px] text-yellow-600">
                  Haga clic para asignar un horario
                </div>
              </div>
              <div className="min-h-[4px] flex-1" aria-hidden />
            </div>
            <div className="shrink-0 space-y-1">
              <div
                className="invisible select-none text-center text-[10px]"
                aria-hidden
              >
                Total: 0h 0m
              </div>
              <ScheduleDayTimelineStrip
                schedule={null}
                className="px-0.5"
              />
            </div>
          </div>
        </div>
      )}

      <CHEKIOModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Turnos en Conflicto"
        size="4xl"
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 border-2 border-red-300">
            <h3 className="font-medium mb-2">Turno Actual</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <p className="text-sm font-medium">{scheduleDay?.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Día asignado:</span> {day}
                </div>
                <div>
                  <span className="font-medium">Duración:</span>{" "}
                  {scheduleDay?.workHours}h {scheduleDay?.workMinutes}m
                </div>
                <div>
                  <span className="font-medium">Inicio:</span>{" "}
                  {DateTime.fromISO(scheduleDay?.startTime || "")
                    .toUTC()
                    .plus({ days: record.dayIndex })
                    .toFormat("dd/MM/yyyy HH:mm")}
                </div>
                <div>
                  <span className="font-medium">Fin:</span>{" "}
                  {DateTime.fromISO(scheduleDay?.startTime || "")
                    .toUTC()
                    .plus({
                      days: record.dayIndex,
                      hours: scheduleDay?.workHours || 0,
                      minutes: scheduleDay?.workMinutes || 0,
                    })
                    .toFormat("dd/MM/yyyy HH:mm")}
                </div>
              </div>
            </div>
          </div>

          {totalDays > 0 && scheduleDay && (
            <div className="space-y-2 w-full">
              <div className="text-sm text-gray-600 font-medium">
                Este horario incluye {totalDays}{" "}
                {totalDays === 1 ? "día" : "días"} desde {day}
              </div>
              <div className="relative w-full h-3 bg-gray-200 overflow-hidden">
                <div
                  className="absolute h-full bg-red-500"
                  style={{ width: `${(1 / totalDays) * 100}%` }}
                />
                {overlappingSchedules.map((item, index) => (
                  <div
                    key={index}
                    className="absolute h-full bg-yellow-500 opacity-50"
                    style={{
                      width: `${(1 / totalDays) * 100}%`,
                      left: `${
                        (Math.floor(
                          item.startDate.diff(
                            DateTime.fromISO(scheduleDay.startTime).plus({
                              days: record.dayIndex,
                            }),
                            "days"
                          ).days
                        ) /
                          totalDays) *
                        100
                      }%`,
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                {Array.from({ length: totalDays }, (_, i) => {
                  const dayStart = DateTime.fromISO(scheduleDay.startTime)
                    .toUTC()
                    .plus({ days: record.dayIndex + i });

                  let displayStartTime: string;
                  let displayEndTime: string;

                  if (i === 0) {
                    displayStartTime = dayStart.toFormat("HH:mm");
                    displayEndTime = "23:59";
                  } else if (i === totalDays - 1) {
                    displayStartTime = "00:00";
                    displayEndTime = dayStart
                      .plus({
                        hours: scheduleDay.workHours,
                        minutes: scheduleDay.workMinutes || 0,
                      })
                      .toFormat("HH:mm");
                  } else {
                    displayStartTime = "00:00";
                    displayEndTime = "23:59";
                  }

                  return (
                    <div key={i} className="flex flex-col items-center">
                      <span className="font-medium">Día {i + 1}</span>
                      <span>{displayStartTime}</span>
                      <span>a</span>
                      <span>{displayEndTime}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-medium">Turnos que se Solapan:</h3>
            {overlappingSchedules.map((item, index) => {
              // Calcular la duración del traslape
              const overlapStart = DateTime.max(
                item.startDate,
                DateTime.fromISO(scheduleDay?.startTime || "")
                  .set({
                    year: DateTime.now().year,
                    month: DateTime.now().month,
                    day: DateTime.now().day,
                  })
                  .plus({
                    days: record.dayIndex,
                  })
              );
              const overlapEnd = DateTime.min(
                item.endDate,
                DateTime.fromISO(scheduleDay?.startTime || "")
                  .set({
                    year: DateTime.now().year,
                    month: DateTime.now().month,
                    day: DateTime.now().day,
                  })
                  .plus({
                    days: record.dayIndex,
                  })
                  .plus({
                    hours: scheduleDay?.workHours || 0,
                    minutes: scheduleDay?.workMinutes || 0,
                  })
              );
              const overlapDuration = overlapEnd.diff(overlapStart, [
                "hours",
                "minutes",
              ]);
              const overlapHours = Math.floor(overlapDuration.hours);
              const overlapMinutes = Math.floor(overlapDuration.minutes);

              return (
                <div
                  key={index}
                  className="p-4 bg-gray-50 border-2 border-gray-300 space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <p className="text-sm font-medium">
                        {item.schedule.name}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="col-span-2 px-2 py-1 bg-red-100 text-red-700 border border-red-300">
                        <span className="font-medium">Traslape detectado:</span>{" "}
                        {overlapHours}h {overlapMinutes}m
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">
                          Inicio del traslape:
                        </span>
                        <br />
                        {overlapStart.toFormat("dd/MM/yyyy HH:mm")}
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">Fin del traslape:</span>
                        <br />
                        {overlapEnd.toFormat("dd/MM/yyyy HH:mm")}
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">
                          Horario conflictivo:
                        </span>
                        <br />
                        Inicio: {item.startDate.toFormat("dd/MM/yyyy HH:mm")}
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">Fin:</span>
                        <br />
                        {item.endDate.toFormat("dd/MM/yyyy HH:mm")}
                      </div>
                    </div>
                  </div>

                  <div className="relative w-full h-2 bg-gray-200 overflow-hidden">
                    <div
                      className="absolute h-full bg-gray-400"
                      style={{
                        width: `${(1 / totalDays) * 100}%`,
                        left: `${
                          (Math.floor(
                            item.startDate.diff(
                              DateTime.fromISO(scheduleDay?.startTime || "")
                                .set({
                                  year: DateTime.now().year,
                                  month: DateTime.now().month,
                                  day: DateTime.now().day,
                                })
                                .plus({
                                  days: record.dayIndex,
                                }),
                              "days"
                            ).days
                          ) /
                            totalDays) *
                          100
                        }%`,
                      }}
                    />
                    <div
                      className="absolute h-full bg-red-400"
                      style={{
                        width: `${
                          ((overlapDuration.hours +
                            overlapDuration.minutes / 60) /
                            (24 * totalDays)) *
                          100
                        }%`,
                        left: `${
                          (overlapStart.diff(
                            DateTime.fromISO(scheduleDay?.startTime || "")
                              .set({
                                year: DateTime.now().year,
                                month: DateTime.now().month,
                                day: DateTime.now().day,
                              })
                              .plus({
                                days: record.dayIndex,
                              }),
                            "hours"
                          ).hours /
                            (24 * totalDays)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CHEKIOModal>
      {isModalScheduleOpen && scheduleDay && (
        <ScheduleModalUpsert
          isOpen={isModalScheduleOpen}
          onClose={handleCloseModalSchedule}
          publicId={scheduleDay.publicId}
          onSuccess={() => {}}
          isPreview={true}
        />
      )}
    </div>
  );
};

export default ShiftWeek;
