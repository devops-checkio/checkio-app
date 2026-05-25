"use client";

import { HolidayResponseDto } from "@/app/[locale]/mantainers/holidays/_components/holidays.dto";
import { ScheduleResponseDto } from "@/app/[locale]/mantainers/schedules/_components/schedule.dto";
import {
  RotationType,
  ScheduleShiftResponseDto,
} from "@/app/[locale]/mantainers/shifts/_components/shifth.dto";
import { useToast } from "@/hooks/use-toast";
import { DateTime } from "luxon";

interface ShiftDayCardProps {
  type: RotationType;
  date: string | null;
  index: number;
  schedule?: ScheduleShiftResponseDto;
  scheduleDetails: ScheduleResponseDto[];
  selectedDayIndex: number;
  multipleSchedules?: ScheduleShiftResponseDto[];
  holidays: HolidayResponseDto[];
  startDate: DateTime;
  startDateWeek: DateTime;
  weekIndex: number;
  selectedWeekIndex: number;
  onScheduleSelect?: () => void;
}

export default function ShiftDayCard({
  date,
  startDate,
  startDateWeek,
  weekIndex,
  schedule,
  index,
  scheduleDetails = [],
  selectedDayIndex,
  selectedWeekIndex,
  multipleSchedules = [],
  holidays,
  type,
  onScheduleSelect,
}: ShiftDayCardProps) {
  const { toast } = useToast();
  const isMultipleSchedules = multipleSchedules.length > 1;
  const scheduleIds = [
    ...new Set(multipleSchedules.map((s) => s.scheduleId).filter(Boolean)),
  ];

  let dayStart: DateTime | null = null;

  if (type == RotationType.WEEKLY) {
    if (selectedDayIndex == index && selectedWeekIndex == weekIndex) {
      dayStart = startDateWeek
        .plus({
          days: index,
        })
        .toUTC();
    } else {
      dayStart = startDateWeek
        .plus({
          weeks: weekIndex,
          days: index,
        })
        .minus({ weeks: selectedWeekIndex })
        .toUTC();
    }
  } else {
    dayStart = date ? DateTime.fromISO(date).toUTC() : null;
  }

  const isHoliday = holidays.some(
    (holiday) =>
      DateTime.fromISO(holiday.date as string)
        .toUTC()
        .toFormat("yyyy-MM-dd") === dayStart?.toFormat("yyyy-MM-dd")
  );

  const renderContent = () => {
    if (isMultipleSchedules && multipleSchedules.length > 1) {
      const uniqueSchedules = multipleSchedules.filter((s) => s.scheduleId);
      if (uniqueSchedules.length > 1) {
        const scheduleDetail = scheduleDetails.find(
          (s) => s.publicId === uniqueSchedules[1].scheduleId
        );
        return (
          <div className="space-y-1 text-center h-[95px] w-full flex flex-col justify-center relative overflow-hidden">
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <h4 className={`text-xs font-medium text-gray-900`}>
                {scheduleDetail?.code}
              </h4>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 bg-blue-50 rounded-md p-1.5 min-w-[120px]">
                <span className="text-xs font-medium">
                  {scheduleDetail?.name}
                </span>
              </div>

              <div className="text-[10px] text-gray-500">
                Total: {scheduleDetail?.workHours}h{" "}
                {scheduleDetail?.workMinutes}m
              </div>
            </div>
          </div>
        );
      }
    }

    if (isHoliday) {
      if (schedule?.scheduleId) {
        // Feriado con horario asignado
        const scheduleDetail = scheduleDetails.find(
          (s) => s.publicId === schedule.scheduleId
        );

        const startDateToUse =
          type == RotationType.WEEKLY
            ? startDateWeek.minus({ weeks: selectedWeekIndex })
            : startDate;
        return (
          <div className="text-center h-[95px] w-full flex flex-col justify-center relative overflow-hidden">
            {isMultipleSchedules && (
              <div className="absolute -top-1 -right-1 mb-4">
                <div className="bg-orange-400 text-xs text-white px-1.5 py-0.5 rounded-full">
                  Inicia{" "}
                  {schedule
                    ? startDateToUse
                        .plus({
                          days: schedule.dayIndex + schedule.weekIndex * 7,
                        })
                        .toFormat("dd/MM")
                    : "+"}
                </div>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <h4 className={`text-xs font-medium text-gray-900 `}>
                Feriado - {scheduleDetail?.code}
              </h4>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 bg-orange-50 rounded-md p-1.5 min-w-[120px]">
                <span className="text-xs font-medium">
                  {scheduleDetail?.name}
                </span>
              </div>

              <div className="text-[10px] text-orange-500">
                Feriado con turno: {scheduleDetail?.workHours}h{" "}
                {scheduleDetail?.workMinutes}m
              </div>
            </div>
          </div>
        );
      }

      // Feriado sin horario
      return (
        <div className="space-y-1 text-center h-[95px] w-full flex flex-col justify-center overflow-hidden">
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <h4 className={`text-xs font-medium text-gray-900`}>Feriado</h4>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 bg-red-50 rounded-md p-1.5 min-w-[120px]">
              <span className="text-xs font-medium">00:00</span>
              <span className="text-xs text-red-500">hasta</span>
              <span className="text-xs font-medium">23:59</span>
            </div>

            <div className="text-[10px] text-red-500">Día feriado</div>
          </div>
        </div>
      );
    }

    if (schedule?.scheduleId == null) {
      return (
        <div className="space-y-1 text-center h-[95px] w-full flex flex-col justify-center overflow-hidden">
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <h4 className={`text-xs font-medium text-gray-900`}>Día Libre</h4>
          </div>

          <div className="space-y-1">
            <div
              className={`flex items-center justify-center gap-2 rounded-md p-1.5 min-w-[120px] ${
                selectedDayIndex === index + weekIndex * 7
                  ? "bg-green-100"
                  : "bg-gray-50"
              }`}
            >
              <span className="text-xs font-medium">00:00</span>
              <span className="text-xs text-green-500">hasta</span>
              <span className="text-xs font-medium">23:59</span>
            </div>

            <div className="text-[10px] text-green-500">Día completo libre</div>
          </div>
        </div>
      );
    }

    const scheduleDetail = schedule.scheduleId
      ? scheduleDetails.find((s) => s.publicId === schedule.scheduleId)
      : null;

    const startDateToUse =
      type == RotationType.WEEKLY
        ? startDateWeek.minus({ weeks: selectedWeekIndex })
        : startDate;

    return (
      <div className="space-y-1 text-center h-[95px] w-full flex flex-col justify-center relative overflow-hidden">
        {isMultipleSchedules && (
          <div className="absolute -top-1 -right-1">
            <div className="bg-orange-400 text-xs text-white px-1.5 py-0.5 rounded-full">
              Inicia{" "}
              {schedule && startDateToUse
                ? startDateToUse
                    .plus({
                      days: schedule.dayIndex + schedule.weekIndex * 7,
                    })
                    .toFormat("dd/MM")
                : "+"}
            </div>
          </div>
        )}
        <div className="flex items-center justify-center gap-2">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <h4 className={`text-xs font-medium text-gray-900`}>
                {scheduleDetail?.code}
                {isMultipleSchedules && (
                  <span className="text-[10px] text-gray-500 ml-1">
                    (Multiple)
                  </span>
                )}
              </h4>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 bg-blue-50 rounded-md p-1.5 min-w-[120px]">
            <span className="text-xs font-medium">{scheduleDetail?.name}</span>
          </div>

          <div className="text-[10px] text-gray-500">
            Total: {scheduleDetail?.workHours}h {scheduleDetail?.workMinutes}m
          </div>
        </div>
      </div>
    );
  };

  const getCardColor = () => {
    if (
      type == RotationType.WEEKLY &&
      startDate?.toFormat("E") !== dayStart?.toFormat("E")
    ) {
      return "border-gray-400 bg-gray-200 opacity-50 cursor-not-allowed";
    }

    if (isMultipleSchedules && scheduleIds.length == 1) {
      if (isHoliday) return "border-red-500 bg-red-50 opacity-50";
      return "border-orange-200 bg-orange-50 opacity-50";
    }

    if (selectedDayIndex + selectedWeekIndex * 7 === index + weekIndex * 7) {
      if (schedule?.scheduleId == null && !isHoliday)
        return "border-green-500 bg-green-50";
      if (isHoliday) return "border-red-500 bg-red-50";
      return "border-blue-500 bg-blue-50";
    }

    if (isHoliday) return "border-red-200 hover:shadow-md hover:bg-red-50";
    return "border-gray-200 hover:shadow-md hover:bg-gray-50";
  };

  const handleClick = () => {
    if (
      type == RotationType.WEEKLY &&
      startDate?.toFormat("E") !== dayStart?.toFormat("E")
    ) {
      toast({
        variant: "destructive",
        title: "No se puede seleccionar este día",
        description:
          "Este día es parte de un horario que inicia en otra fecha. Por favor selecciona el día donde inicia el horario, marcado en los cuadros sin indicadores de inicio.",
      });
      return;
    }

    if (isMultipleSchedules && multipleSchedules.length === 1) {
      return; // Do nothing for single schedule case
    }

    onScheduleSelect?.();
  };

  const renderCard = () => {
    if (isMultipleSchedules && multipleSchedules.length == 1) {
      return (
        <div className="w-full rounded-lg border p-2 transition-all cursor-not-allowed border-orange-200 bg-white">
          {renderContent()}
        </div>
      );
    }
    if (isMultipleSchedules && multipleSchedules.length > 1) {
      return (
        <div
          className={`w-full rounded-lg border p-2 transition-all ${getCardColor()}`}
          onClick={handleClick}
        >
          {renderContent()}
        </div>
      );
    }

    if (
      type == RotationType.WEEKLY &&
      startDate?.toFormat("E") === dayStart?.toFormat("E")
    ) {
      return (
        <div
          className={`w-full rounded-lg border p-2 transition-all cursor-pointer ${getCardColor()}`}
          onClick={handleClick}
        >
          {renderContent()}
        </div>
      );
    }

    if (
      type == RotationType.WEEKLY &&
      startDate?.toFormat("E") !== dayStart?.toFormat("E")
    ) {
      return (
        <div
          className={`w-full rounded-lg border p-2 transition-all cursor-pointer ${getCardColor()}`}
          onClick={handleClick}
        >
          {renderContent()}
        </div>
      );
    }

    return (
      <div
        className={`w-full rounded-lg border p-2 transition-all cursor-pointer ${getCardColor()}`}
        onClick={handleClick}
      >
        {renderContent()}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-1 w-full max-w-[113px]">
      <div className="flex items-center justify-center w-full bg-gray-100 rounded-t-lg py-1">
        <span className="text-xs font-semibold">
          {dayStart ? dayStart.toFormat("dd/MM") : "Sin fecha"}
        </span>
        <span className="text-[10px] text-gray-500 ml-1">
          {type == RotationType.WEEKLY
            ? ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][index % 7]
            : "Día"}
        </span>
      </div>
      {renderCard()}
    </div>
  );
}
