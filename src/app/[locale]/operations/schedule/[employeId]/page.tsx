"use client";
import {
  CHEKIOButton,
  CHEKIOHeader,
  CHEKIOLoading,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import {
  useGetAbsences,
  useGetCalendar,
  useGetEmployee,
  useGetHolidays,
} from "@/service/mantainer.service";
import { Calendar, ChevronLeft, ChevronRight, PlusCircle, Trash2, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { AbsenceResponseDto } from "../../absences/_components/absence.dto";
import { CardAbsence } from "../_components/card-absence";
import { CardFreeDay } from "../_components/card-free-day";
import { CardHolidayDay } from "../_components/card-holiday";
import { CardSchedule } from "../_components/card-schedule";
import { CardShiftSchedule } from "../_components/card-shift-schedule";
import ModalConfirmDeletion from "../_components/modal-confirm-deletion";
import ModalConfirmFreeDay from "../_components/modal-confirm-free-day";
import ModalMassAssignment, {
  MassAssignmentExistingSlot,
} from "../_components/modal-mass-assignment";
import { Skeleton } from "@/components/ui/skeleton";
import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";

enum EmployeeScheduleType {
  EMPLOYEE_SHIFT = "EMPLOYEE_SHIFT",
  EMPLOYEE_SCHEDULE = "EMPLOYEE_SCHEDULE",
  FREEDOM_SHIFT = "FREEDOM_SHIFT",
  FREEDOM_SCHEDULE = "FREEDOM_SCHEDULE",
}

function buildExistingSlotsFromCalendarRecord(
  record: any,
): MassAssignmentExistingSlot[] | undefined {
  if (!record) return undefined;
  if (record.scheduleDetails?.length) {
    const slots = record.scheduleDetails
      .map((detail: any) => {
        const s = detail?.schedule;
        if (!s?.publicId || !s.startTime) return null;
        return {
          publicId: s.publicId,
          code: s.code,
          startTime: s.startTime,
          workHours: s.workHours,
          workMinutes: s.workMinutes,
        };
      })
      .filter((x: MassAssignmentExistingSlot | null): x is MassAssignmentExistingSlot => !!x);
    return slots.length ? slots : undefined;
  }
  const s = record.schedule;
  if (
    s?.publicId &&
    s.startTime &&
    (record.type === EmployeeScheduleType.EMPLOYEE_SHIFT ||
      record.type === EmployeeScheduleType.EMPLOYEE_SCHEDULE ||
      record.type === EmployeeScheduleType.FREEDOM_SCHEDULE)
  ) {
    return [
      {
        publicId: s.publicId,
        code: s.code,
        startTime: s.startTime,
        workHours: s.workHours,
        workMinutes: s.workMinutes,
      },
    ];
  }
  return undefined;
}

function scheduleOptionsFromCalendarRecord(record: any): Array<{
  scheduleId: string;
  scheduleCode: string;
  scheduleName?: string;
}> | undefined {
  if (!record) return undefined;
  if (record.scheduleDetails?.length) {
    const opts = record.scheduleDetails
      .map((detail: any) => {
        const s = detail?.schedule;
        if (!s?.publicId) return null;
        return {
          scheduleId: s.publicId,
          scheduleCode: s.code,
          scheduleName: s.name,
        };
      })
      .filter(
        (x: { scheduleId: string; scheduleCode: string; scheduleName?: string } | null): x is {
          scheduleId: string;
          scheduleCode: string;
          scheduleName?: string;
        } => x !== null,
      );
    return opts.length ? opts : undefined;
  }
  const s = record.schedule;
  if (s?.publicId) {
    return [
      {
        scheduleId: s.publicId,
        scheduleCode: s.code,
        scheduleName: s.name,
      },
    ];
  }
  return undefined;
}

export type SelectedDayDto = {
  date: string;
  schedule: string;
  error?: string;
  existingScheduleSlots?: MassAssignmentExistingSlot[];
  recordType?: string;
  scheduleOptions?: Array<{
    scheduleId: string;
    scheduleCode: string;
    scheduleName?: string;
  }>;
};
const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;
const WEEK_DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

type CalendarAbsenceDay = {
  publicId: string;
  absenceTypeName: string;
  startDate: string | Date;
  endDate: string | Date;
  withoutPay: boolean;
};

function toUtcDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function parseUtcDate(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
    );
  }

  const [year, month, day] = value
    .slice(0, 10)
    .split("-")
    .map((part) => Number(part));

  return new Date(Date.UTC(year, month - 1, day));
}

function EmployeeScheduleContent() {
  const t = useTranslations("operations.schedule.employee");
  const tBreadcrumbs = useTranslations("operations.schedule");
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromStudentSchedule = searchParams.get("from") === "student-schedule";
  const employeId = params.employeId as string;
  const { canUpdate, canDelete, canCreate, companyId } = useCookieSession();
  const canManageScheduleAssignment =
    canCreate(OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS) ||
    canCreate(
      OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS,
    );
  const canDeleteScheduleAssignment =
    canDelete(OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS) ||
    canDelete(
      OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS,
    );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [isModalConfirmFreeDayOpen, setIsModalConfirmFreeDayOpen] =
    useState(false);
  const [isModalConfirmDeletionOpen, setIsModalConfirmDeletionOpen] =
    useState(false);
  const [isModalMassAssignmentOpen, setIsModalMassAssignmentOpen] =
    useState(false);
  const [selectedDays, setSelectedDays] = useState<
    Record<string, SelectedDayDto>
  >({});
  const { data: holidays, isLoading: isLoadingHolidays } = useGetHolidays({
    page: 1,
    pageSize: 100,
    sort: "asc",
  });

  const { data: employee, isLoading: isLoadingEmployee } =
    useGetEmployee(employeId);

  const visibleMonthRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month + 1, 0));

    return {
      startDate,
      endDate,
      startDateKey: toUtcDateKey(startDate),
      endDateKey: toUtcDateKey(endDate),
    };
  }, [currentDate]);

  const { data: absences, isLoading: isLoadingAbsences } = useGetAbsences({
    page: 1,
    pageSize: 500,
    sort: "asc",
    employeeId: employeId,
    fromDate: visibleMonthRange.startDateKey,
    toDate: visibleMonthRange.endDateKey,
  });

  const { data: calendar, isLoading: isLoadingCalendar } = useGetCalendar({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    employeeId: employeId,
  });

  const absencesByDay = useMemo<Record<string, CalendarAbsenceDay>>(() => {
    const absenceMap: Record<string, CalendarAbsenceDay> = {};

    (absences?.data ?? []).forEach((absence: AbsenceResponseDto) => {
      const absenceStart = parseUtcDate(absence.startDate);
      const absenceEnd = parseUtcDate(absence.endDate);
      const rangeStart =
        absenceStart > visibleMonthRange.startDate
          ? absenceStart
          : visibleMonthRange.startDate;
      const rangeEnd =
        absenceEnd < visibleMonthRange.endDate
          ? absenceEnd
          : visibleMonthRange.endDate;

      for (
        let current = new Date(rangeStart);
        current <= rangeEnd;
        current = new Date(
          Date.UTC(
            current.getUTCFullYear(),
            current.getUTCMonth(),
            current.getUTCDate() + 1
          )
        )
      ) {
        absenceMap[toUtcDateKey(current)] = {
          publicId: absence.publicId,
          absenceTypeName:
            absence.absenceType?.name || absence.absenceTypeName || t("cards.absence"),
          startDate: absence.startDate,
          endDate: absence.endDate,
          withoutPay: absence.withoutPay,
        };
      }
    });

    return absenceMap;
  }, [absences?.data, t, visibleMonthRange.endDate, visibleMonthRange.startDate]);

  const meses = useMemo(
    () => MONTH_KEYS.map((key) => t(`months.${key}`)),
    [t]
  );
  const weekDays = useMemo(
    () => WEEK_DAY_KEYS.map((key) => t(`weekDays.${key}`)),
    [t]
  );

  // Generar opciones de años (desde 2020 hasta 2030)
  const generateYearOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      years.push({ value: year, label: year.toString() });
    }
    return years;
  };

  // Generar opciones de meses
  const generateMonthOptions = () => {
    return meses.map((month, index) => ({
      value: index,
      label: month,
    }));
  };

  // Función para obtener los días del mes actual
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Función para obtener el primer día de la semana del mes (0 = Domingo, 1 = Lunes, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    // Convertir de 0-6 (Dom-Sáb) a 1-7 (Lun-Dom)
    return firstDay === 0 ? 7 : firstDay;
  };

  const getLastDayOfMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getTotalWeekDays = (year: number, month: number) => {
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInMonth = getDaysInMonth(year, month);

    // Calcular el número total de días que ocupará en la cuadrícula (incluyendo días del mes anterior)
    const totalDaysInGrid = firstDay - 1 + daysInMonth;

    // Calcular el número de semanas dividiendo por 7 y redondeando hacia arriba
    return Math.ceil(totalDaysInGrid / 7);
  };

  // Función para cambiar al mes anterior
  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  // Función para cambiar al mes siguiente
  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  // Función para cambiar al mes actual
  const currentMonth = () => {
    setCurrentDate(new Date());
  };

  // Función para cambiar año
  const handleYearChange = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
  };

  // Función para cambiar mes
  const handleMonthChange = (month: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), month, 1));
  };

  // Generar los días del calendario
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const lastDayOfMonth = getLastDayOfMonth(year, month);
    const days = [];

    // Añadir celdas vacías para los días anteriores al primer día del mes
    for (let i = 1; i < firstDayOfMonth; i++) {
      days.push(
        <div
          key={`empty-start-${i}`}
          className="space-y-2 bg-gray-50 text-center h-full flex flex-col items-center justify-center border border-gray-200 rounded-xl p-2 min-h-[90px] relative"
        >
          <img
            src="/logos/logo.svg"
            alt=""
            className="h-12 w-auto max-w-16 opacity-[0.12] select-none"
            aria-hidden
          />
        </div>,
      );
    }

    // Añadir los días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const record = calendar?.find((schedule: any) => schedule.day === day);
      const date = new Date(year, month, day);
      const isToday = new Date().toDateString() === date.toDateString();
      const dateString = toUtcDateKey(new Date(Date.UTC(year, month, day)));
      const isSelected = selectedDays[dateString]?.date === dateString;
      const absence = absencesByDay[dateString];

      const isHoliday = holidays?.data.some((holiday) => {
        const holidayDate = new Date(holiday.date as string)
          .toISOString()
          .split("T")[0];
        return holidayDate === dateString;
      });

      // Obtener el día de la semana (1 = lunes, 7 = domingo)
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
      const isPast = date < new Date();

      if (absence) {
        days.push(
          <CardAbsence
            key={`day-${day}`}
            day={day}
            isBlocked={isPast}
            isSelected={isSelected}
            absenceTypeName={absence.absenceTypeName}
            startDate={absence.startDate}
            endDate={absence.endDate}
            withoutPay={absence.withoutPay}
            onClick={() => {
              setSelectedDays((prev) => {
                const newSet = { ...prev };
                if (newSet[dateString]) {
                  delete newSet[dateString];
                } else {
                  newSet[dateString] = {
                    date: dateString,
                    schedule: absence.absenceTypeName,
                  };
                }
                return newSet;
              });
            }}
          />,
        );
      } else if (record && record.type === EmployeeScheduleType.EMPLOYEE_SHIFT) {
        days.push(
          <CardShiftSchedule
            key={`day-${day}`}
            day={day}
            isBlocked={isPast}
            isSelected={isSelected}
            schedule={record.schedule}
            isHoliday={isHoliday}
            onClick={() => {
              setSelectedDays((prev) => {
                const newSet = { ...prev };
                if (newSet[dateString]) {
                  delete newSet[dateString];
                } else {
                  newSet[dateString] = {
                    date: dateString,
                    schedule: record.schedule?.code ?? "-",
                    recordType: record.type,
                    scheduleOptions: scheduleOptionsFromCalendarRecord(record),
                    existingScheduleSlots:
                      buildExistingSlotsFromCalendarRecord(record),
                  };
                }
                return newSet;
              });
            }}
          />,
        );
      } else if (
        record &&
        record.type === EmployeeScheduleType.EMPLOYEE_SCHEDULE
      ) {
        days.push(
          <CardSchedule
            key={`day-${day}`}
            day={day}
            isBlocked={isPast}
            isSelected={isSelected}
            schedule={record.schedule}
            establishmentName={record.establishmentName}
            scheduleDetails={record.scheduleDetails}
            isHoliday={isHoliday}
            onClick={() => {
              setSelectedDays((prev) => {
                const newSet = { ...prev };
                if (newSet[dateString]) {
                  delete newSet[dateString];
                } else {
                  newSet[dateString] = {
                    date: dateString,
                    schedule: record.schedule?.code ?? "-",
                    recordType: record.type,
                    scheduleOptions: scheduleOptionsFromCalendarRecord(record),
                    existingScheduleSlots:
                      buildExistingSlotsFromCalendarRecord(record),
                  };
                }
                return newSet;
              });
            }}
          />,
        );
      } else if (isHoliday) {
        days.push(
          <CardHolidayDay
            key={`day-${day}`}
            day={day}
            isBlocked={isPast}
            isSelected={isSelected}
            onClick={() => {
              setSelectedDays((prev) => {
                const newSet = { ...prev };
                if (newSet[dateString]) {
                  delete newSet[dateString];
                } else {
                  newSet[dateString] = {
                    date: dateString,
                    schedule: "Holiday",
                  };
                }
                return newSet;
              });
            }}
          />,
        );
      } else {
        if (record?.type === EmployeeScheduleType.FREEDOM_SCHEDULE) {
          days.push(
            <CardSchedule
              key={`day-${day}`}
              day={day}
              isBlocked={isPast}
              isSelected={isSelected}
              schedule={record.schedule}
              establishmentName={record.establishmentName}
              scheduleDetails={record.scheduleDetails}
              isHoliday={isHoliday}
              onClick={() => {
                setSelectedDays((prev) => {
                  const newSet = { ...prev };
                  if (newSet[dateString]) {
                    delete newSet[dateString];
                  } else {
                    newSet[dateString] = {
                      date: dateString,
                      schedule: record.schedule?.code ?? "-",
                      recordType: record.type,
                      scheduleOptions: scheduleOptionsFromCalendarRecord(record),
                      existingScheduleSlots:
                        buildExistingSlotsFromCalendarRecord(record),
                    };
                  }
                  return newSet;
                });
              }}
            />,
          );
        } else {
          days.push(
            <CardFreeDay
              key={`day-${day}`}
              day={day}
              isBlocked={isPast}
              isSelected={isSelected}
              onClick={() => {
                setSelectedDays((prev) => {
                  const newSet = { ...prev };
                  if (newSet[dateString]) {
                    delete newSet[dateString];
                  } else {
                    newSet[dateString] = {
                      date: dateString,
                      schedule: "Free",
                    };
                  }
                  return newSet;
                });
              }}
            />,
          );
        }
      }

    }

    // Obtener el día de la semana del último día del mes
    const lastDate = new Date(year, month, daysInMonth);
    const lastDayOfWeek = lastDate.getDay() === 0 ? 7 : lastDate.getDay();

    // Si el mes no terminó en domingo, completar la semana con cards vacíos y agregar el total
    if (lastDayOfWeek < 7) {
      // Calcular cuántos días faltan para completar la semana
      const remainingDaysInWeek = 7 - lastDayOfWeek;

      // Agregar cards vacíos para completar la semana
      for (let i = 1; i <= remainingDaysInWeek; i++) {
        days.push(
          <div
            key={`empty-end-${i}`}
            className="space-y-2 bg-gray-50 text-center h-full flex flex-col items-center justify-center border border-gray-200 rounded-xl p-2 min-h-[90px] relative"
          >
            <img
              src="/logos/logo.svg"
              alt=""
              className="h-12 w-auto max-w-16 opacity-[0.12] select-none"
              aria-hidden
            />
          </div>,
        );
      }

    }
    return days;
  };

  const employeeName = employee
    ? `${employee.firstName || ""} ${employee.lastName || ""}`.trim()
    : t("loadingName");
  const isStudentEmployee = employee?.personType === "STUDENT";
  const isStudentContext = fromStudentSchedule || isStudentEmployee;
  const backRoute = isStudentContext
    ? "/operations/student-schedule"
    : "/operations/schedule";

  const scheduleDeletionEntries = useMemo(
    () =>
      Object.keys(selectedDays).map((date) => ({
        date,
        recordType: selectedDays[date]?.recordType,
        scheduleOptions: selectedDays[date]?.scheduleOptions,
      })),
    [selectedDays],
  );

  const selectedDaysCount = Object.keys(selectedDays).length;

  if (isLoadingCalendar || isLoadingEmployee || isLoadingAbsences) {
    return (
      <>
        <CHEKIOHeader
          title={fromStudentSchedule ? t("titleStudent") : t("title")}
          subtitle={t("loadingName")}
          breadcrumbs={[
            tBreadcrumbs("breadcrumbs.operations"),
            tBreadcrumbs(
              fromStudentSchedule
                ? "breadcrumbs.studentSchedule"
                : "breadcrumbs.schedule",
            ),
            t("loadingName"),
          ]}
          icon={Calendar}
          onBack={() => router.push(backRoute)}
          backStyle="secondaryBlue"
          backAriaLabel={
            isStudentContext ? t("backAriaLabelStudent") : t("backAriaLabel")
          }
        />

        {/* Toolbar Skeleton - mirrors real toolbar layout */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {/* Nav group: Prev | Hoy | Next */}
              <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50/50 overflow-hidden">
                <Skeleton className="h-10 w-10 rounded-none" />
                <Skeleton className="h-10 w-14 rounded-none border-x border-gray-200" />
                <Skeleton className="h-10 w-10 rounded-none" />
              </div>
              {/* Month/Year selects */}
              <Skeleton className="h-10 w-[130px] rounded-md" />
              <Skeleton className="h-10 w-[100px] rounded-md" />
            </div>
            {/* Employee summary card */}
            <div className="flex items-center gap-3 rounded-lg bg-gray-50/50 px-4 py-2 border border-gray-200">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-28 rounded" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-14 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid Skeleton - mirrors real grid structure */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
          <div className="grid grid-cols-8 gap-3">
            {/* Header row - same style as real headers */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={`header-${i}`}
                className="flex items-center justify-center py-3 bg-gray-50/80 rounded-t-lg"
              >
                <Skeleton className="h-3 w-8 rounded" />
              </div>
            ))}
            <div className="flex items-center justify-center py-3 bg-gray-50/80 rounded-t-lg">
              <Skeleton className="h-3 w-12 rounded" />
            </div>

            {/* Day cell skeleton - mimics CardFreeDay structure */}
            {[...Array(2)].map((_, i) => (
              <div
                key={`empty-skel-${i}`}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2.5 min-h-[90px]"
              >
                <Skeleton className="h-8 w-8 rounded-lg opacity-50" />
              </div>
            ))}
            {[...Array(5)].map((_, i) => (
              <div
                key={`day-skel-${i}`}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-2.5 min-h-[90px] relative"
              >
                <Skeleton className="absolute top-2 right-2 h-3.5 w-5 rounded" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-3.5 w-16 rounded" />
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            ))}
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-slate-50/80 p-2.5 min-h-[90px]">
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-3 w-12 rounded" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
            {/* 4 full weeks */}
            {[0, 1, 2, 3].map((week) => (
              <React.Fragment key={`week-${week}`}>
                {[...Array(7)].map((_, i) => (
                  <div
                    key={`day-w${week}-${i}`}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-2.5 min-h-[90px] relative"
                  >
                    <Skeleton className="absolute top-2 right-2 h-3.5 w-5 rounded" />
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <Skeleton className="h-3.5 w-16 rounded" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-lg" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                ))}
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-slate-50/80 p-2.5 min-h-[90px]">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-3 w-12 rounded" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              </React.Fragment>
            ))}
            {/* Last partial week */}
            {[...Array(5)].map((_, i) => (
              <div
                key={`day-last-${i}`}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-2.5 min-h-[90px] relative"
              >
                <Skeleton className="absolute top-2 right-2 h-3.5 w-5 rounded" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-3.5 w-16 rounded" />
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            ))}
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-slate-50/80 p-2.5 min-h-[90px]">
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-3 w-12 rounded" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
            {[...Array(2)].map((_, i) => (
              <div
                key={`empty-end-skel-${i}`}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2.5 min-h-[90px]"
              >
                <Skeleton className="h-8 w-8 rounded-lg opacity-50" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CHEKIOHeader
        title={isStudentContext ? t("titleStudent") : t("title")}
        subtitle={
          isStudentContext
            ? t("subtitleStudent", { name: employeeName })
            : t("subtitle", { name: employeeName })
        }
        breadcrumbs={[
          tBreadcrumbs("breadcrumbs.operations"),
          tBreadcrumbs(
            isStudentContext
              ? "breadcrumbs.studentSchedule"
              : "breadcrumbs.schedule",
          ),
          employeeName,
        ]}
        icon={Calendar}
        onBack={() => router.push(backRoute)}
        backStyle="secondaryBlue"
        backAriaLabel={
          isStudentContext ? t("backAriaLabelStudent") : t("backAriaLabel")
        }
      />

      {/* Calendar Toolbar Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Navigation Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50/50">
              <button
                onClick={prevMonth}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-l-lg transition-colors"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={currentMonth}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-x border-gray-200 transition-colors"
              >
                {t("buttons.today")}
              </button>
              <button
                onClick={nextMonth}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-r-lg transition-colors"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Month/Year Selectors */}
            <div className="flex gap-2">
              <CHEKIOSelect
                value={currentDate.getMonth().toString()}
                onValueChange={(value: string) =>
                  handleMonthChange(parseInt(value))
                }
              >
                <CHEKIOSelectTrigger className="w-[130px]">
                  <CHEKIOSelectValue placeholder={t("month")} />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  {generateMonthOptions().map((month) => (
                    <CHEKIOSelectItem
                      key={month.value}
                      value={month.value.toString()}
                    >
                      {month.label}
                    </CHEKIOSelectItem>
                  ))}
                </CHEKIOSelectContent>
              </CHEKIOSelect>
              <CHEKIOSelect
                value={currentDate.getFullYear().toString()}
                onValueChange={(value: string) =>
                  handleYearChange(parseInt(value))
                }
              >
                <CHEKIOSelectTrigger className="w-[100px]">
                  <CHEKIOSelectValue placeholder={t("year")} />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  {generateYearOptions().map((year) => (
                    <CHEKIOSelectItem
                      key={year.value}
                      value={year.value.toString()}
                    >
                      {year.label}
                    </CHEKIOSelectItem>
                  ))}
                </CHEKIOSelectContent>
              </CHEKIOSelect>
            </div>
          </div>

          {/* Right: Employee Summary */}
          <div className="flex items-center gap-3 rounded-lg bg-gray-50/50 px-4 py-2 border border-gray-200">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
              {employeeName?.[0] || "?"}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                {employeeName}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">
                  {t("document")}:
                </span>
                <span className="text-xs font-mono text-gray-700">
                  {employee?.documentNumber || t("na")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar - Only visible when days are selected */}
      {selectedDaysCount > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedDaysCount} {selectedDaysCount === 1 ? "día seleccionado" : "días seleccionados"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {canManageScheduleAssignment && (
                <CHEKIOButton
                  variant="primary"
                  onClick={() => setIsModalConfirmFreeDayOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <PlusCircle className="h-4 w-4" />
                  {t("buttons.freeDay")}
                </CHEKIOButton>
              )}
              {canDeleteScheduleAssignment && (
                <CHEKIOButton
                  variant="destructive"
                  onClick={() => setIsModalConfirmDeletionOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("buttons.delete")}
                </CHEKIOButton>
              )}
              {canManageScheduleAssignment && (
                <CHEKIOButton
                  variant="primary"
                  onClick={() => setIsModalMassAssignmentOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <PlusCircle className="h-4 w-4" />
                  {t("buttons.assign")}
                </CHEKIOButton>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid Container */}
      <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm p-4">
        {/* Watermark when calendar is empty */}
        {(!calendar || calendar.length === 0) && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl"
            aria-hidden
          >
            <img
              src="/logos/logo.svg"
              alt=""
              className="h-[280px] w-auto max-w-[320px] opacity-[0.06] select-none"
            />
          </div>
        )}
        <div className="relative grid grid-cols-7 gap-3">
        {/* Cabecera de los días de la semana */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 py-3 bg-gray-50/80 rounded-t-lg"
          >
            {day}
          </div>
        ))}
        {/* Días del mes */}
        {renderCalendar()}
      </div>
      </div>

      <ModalConfirmFreeDay
        isOpen={isModalConfirmFreeDayOpen}
        onClose={() => setIsModalConfirmFreeDayOpen(false)}
        selectedDays={selectedDays}
        cleanSelectedDays={() => setSelectedDays({})}
        employeeId={employeId}
      />
      <ModalConfirmDeletion
        isOpen={isModalConfirmDeletionOpen}
        onClose={() => setIsModalConfirmDeletionOpen(false)}
        entries={scheduleDeletionEntries}
        cleanSelectedDays={() => setSelectedDays({})}
        employeeId={employeId}
      />
      {isModalMassAssignmentOpen && (
        <ModalMassAssignment
          isOpen={isModalMassAssignmentOpen}
          onClose={() => setIsModalMassAssignmentOpen(false)}
          selectedDays={Object.keys(selectedDays)}
          assignmentEntries={Object.keys(selectedDays).map((date) => ({
            date,
            existingScheduleSlots: selectedDays[date]?.existingScheduleSlots,
          }))}
          cleanSelectedDays={() => setSelectedDays({})}
          employeeId={employeId}
          companyIds={
            employee?.organizationId
              ? [employee.organizationId]
              : employee?.companyId
                ? [employee.companyId]
                : companyId
                  ? [companyId]
                  : undefined
          }
          personType={employee?.personType}
        />
      )}
    </>
  );
}

export default function EmployeeSchedulePage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={[
        OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS,
        OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS,
      ]}
    >
      <EmployeeScheduleContent />
    </AccessNotGranted>
  );
}
