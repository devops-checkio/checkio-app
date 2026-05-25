"use client";

import { HolidayResponseDto } from "@/app/[locale]/mantainers/holidays/_components/holidays.dto";
import { ScheduleResponseDto } from "@/app/[locale]/mantainers/schedules/_components/schedule.dto";
import {
  RotationType,
  ScheduleShiftResponseDto,
} from "@/app/[locale]/mantainers/shifts/_components/shifth.dto";
import { DateTime } from "luxon";
import { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import ShiftDayCard from "./shift-day-card";

interface SelectorDayScheduleProps {
  startDate: DateTime;
  startDateWeek: DateTime;
  rotationType: RotationType;
  schedules: ScheduleShiftResponseDto[];
  scheduleDetails: ScheduleResponseDto[];
  holidays: HolidayResponseDto[];
  employeeIndex: number;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
}

const SelectorDaySchedule = ({
  startDate,
  startDateWeek,
  rotationType,
  schedules = [],
  scheduleDetails = [],
  holidays = [],
  getValues,
  employeeIndex,
  setValue,
}: SelectorDayScheduleProps) => {
  const selectedDayIndex = getValues(`employees.${employeeIndex}.dayIndex`);
  const selectedWeekIndex = getValues(`employees.${employeeIndex}.weekIndex`);

  const handleScheduleSelection = (dayIndex: number, weekIndex: number) => {
    setValue(
      `employees.${employeeIndex}.dayIndex`,
      selectedDayIndex + selectedWeekIndex * 7 === dayIndex + weekIndex * 7
        ? -1
        : dayIndex
    );
    setValue(`employees.${employeeIndex}.weekIndex`, weekIndex);

    setValue(`employees.${employeeIndex}`, {
      ...getValues(`employees.${employeeIndex}`),
      dayIndex: dayIndex,
      weekIndex: weekIndex,
      schedules: schedules.filter(
        (s) => s.weekIndex === weekIndex && s.dayIndex === dayIndex
      ),
    });

    setValue("weekNumber", weekIndex);
  };

  const renderWeek = (weekIndex: number) => {
    // Create a map to track schedule overlaps
    const scheduleMap = new Map<number, any[]>();

    const schedulesByWeek = schedules.filter(
      (schedule) => schedule.weekIndex == weekIndex
    );

    // Calculate total days and populate schedule map
    schedulesByWeek.forEach((schedule) => {
      if (!schedule) return;

      // Calculate the day index within the week (0-6)
      const dayIndex = schedule.dayIndex % 7;

      const details = scheduleDetails.find(
        (d) => d.publicId === schedule.scheduleId
      );
      let duration = 1;

      if (details) {
        const startDateTime = startDate.toUTC();
        const endDateTime = startDateTime.plus({
          hours: details.workHours,
          minutes: details.workMinutes || 0,
        });
        const durationDays = endDateTime.diff(startDateTime, "days");
        duration = Math.ceil(durationDays.days);
      }

      // Add schedule to map for each day it spans
      for (let i = 0; i < duration; i++) {
        const currentDayIndex = (dayIndex + i) % 7;
        if (!scheduleMap.has(currentDayIndex)) {
          scheduleMap.set(currentDayIndex, []);
        }

        const scheduleDateTime = startDateWeek
          .minus({ weeks: selectedWeekIndex })
          .plus({ days: dayIndex });

        const adjustedSchedule = {
          ...schedule,
          startDate: scheduleDateTime.toISO(),
        };

        scheduleMap.get(currentDayIndex)?.push(adjustedSchedule);
      }
    });

    // Create array of days for the week
    const daysInWeek = Array.from({ length: 7 }, (_, dayIndex) => {
      let currentDate: DateTime | null = null;
      if (rotationType == RotationType.WEEKLY) {
        currentDate = startDateWeek
          .minus({ weeks: selectedWeekIndex })
          .plus({ days: dayIndex });
      } else {
        if (startDate && DateTime.isDateTime(startDate)) {
          currentDate = startDate.plus({ days: dayIndex });
        }
      }

      // Get overlapping schedules from map
      const daySchedules = scheduleMap.get(dayIndex) || [];

      return {
        date: currentDate?.isValid ? currentDate.toISO() : null,
        schedules: daySchedules,
        dayIndex: dayIndex,
        weekIndex: weekIndex,
      };
    });

    return (
      <div className="flex gap-2">
        {daysInWeek.map((day) => (
          <ShiftDayCard
            key={`${weekIndex}-${day.dayIndex}`}
            index={day.dayIndex}
            weekIndex={day.weekIndex}
            date={day.date}
            startDateWeek={startDateWeek}
            schedule={day.schedules[0]}
            scheduleDetails={scheduleDetails}
            selectedDayIndex={selectedDayIndex}
            selectedWeekIndex={selectedWeekIndex}
            multipleSchedules={day.schedules}
            startDate={startDate}
            holidays={holidays}
            type={rotationType}
            onScheduleSelect={() =>
              handleScheduleSelection(day.dayIndex, day.weekIndex)
            }
          />
        ))}
      </div>
    );
  };

  const renderDaily = () => {
    // Create a map to track schedule overlaps
    const scheduleMap = new Map<number, any[]>();

    schedules.forEach((schedule) => {
      if (!schedule) return;

      const scheduleStartDay = schedule.dayIndex;

      // Add schedule to map for the correct day
      if (!scheduleMap.has(scheduleStartDay)) {
        scheduleMap.set(scheduleStartDay, []);
      }

      const adjustedDate = startDate
        .minus({ days: selectedDayIndex })
        .plus({ days: scheduleStartDay });

      scheduleMap.get(scheduleStartDay)?.push({
        ...schedule,
        startDate: adjustedDate.toISO(),
      });
    });

    // Sort the days to ensure they're displayed in order
    const sortedDays = Array.from(scheduleMap.entries()).sort(
      ([a], [b]) => a - b
    );

    return (
      <div className="flex gap-2">
        {sortedDays.map(([dayIndex, daySchedules]) => (
          <ShiftDayCard
            key={`daily-${dayIndex}`}
            index={dayIndex}
            weekIndex={0}
            date={daySchedules[0].startDate}
            startDateWeek={startDateWeek}
            schedule={daySchedules[0]}
            scheduleDetails={scheduleDetails}
            selectedDayIndex={selectedDayIndex}
            selectedWeekIndex={selectedWeekIndex}
            multipleSchedules={daySchedules}
            startDate={startDate}
            holidays={holidays}
            type={rotationType}
            onScheduleSelect={() => handleScheduleSelection(dayIndex, 0)}
          />
        ))}
      </div>
    );
  };
  return (
    <div className="space-y-1">
      {rotationType == RotationType.WEEKLY && (
        <>
          {schedules
            .reduce((weeks: number[], schedule) => {
              if (!weeks.includes(schedule.weekIndex)) {
                weeks.push(schedule.weekIndex);
              }
              return weeks;
            }, [])
            .sort()
            .map((weekIndex: number) => (
              <div key={weekIndex} className="flex items-center gap-1 mb-2">
                <div className="flex flex-col">
                  {[`${weekIndex + 1}`, " ", "a", "n", "a", "m", "e", "S"].map(
                    (letter, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-gray-500 transform -rotate-90 origin-center"
                        style={{ height: "12px" }}
                      >
                        {letter}
                      </span>
                    )
                  )}
                </div>
                {renderWeek(weekIndex)}
              </div>
            ))}
        </>
      )}
      {rotationType == RotationType.DAILY && (
        <div className="flex gap-2 overflow-x-auto pb-2">{renderDaily()}</div>
      )}
    </div>
  );
};

export default SelectorDaySchedule;
