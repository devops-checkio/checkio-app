"use client";

import {
  CHEKIOButton,
  CHEKIOLoading,
  CHEKIOStatCard,
} from "@/components";
import { Skeleton } from "@/components/ui/skeleton";
import { useCookieSession } from "@/context/useCookieSession";
import { hasPendingConsent, useCheckConsent } from "@/service/consent.service";
import { useGetCalendar, useGetHolidays } from "@/service/mantainer.service";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { CardFreeDay } from "../operations/schedule/_components/card-free-day";
import { CardHolidayDay } from "../operations/schedule/_components/card-holiday";
import { CardSchedule } from "../operations/schedule/_components/card-schedule";
import { CardShiftSchedule } from "../operations/schedule/_components/card-shift-schedule";

export default function HomeEmployee() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("common");
  const tEmployee = useTranslations("homeEmployee");
  const tConsent = useTranslations("consent");
  const { profile } = useCookieSession();
  const { data: consentStatus, isFetching: isConsentFetching } = useCheckConsent(
    undefined,
    !!profile
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get employee calendar data
  const { data: calendar, isLoading: isLoadingCalendar } = useGetCalendar({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    employeeId: profile?.user.employeeId || "",
  });

  // Get holidays data
  const { data: holidays, isLoading: isLoadingHolidays } = useGetHolidays({
    page: 1,
    pageSize: 100,
    sort: "asc",
  });

  // Get today's schedule
  const today = new Date();
  const todaySchedule = calendar?.find(
    (schedule: any) => schedule.day === today.getDate()
  );

  // Acción principal: Marcar asistencia (soporte y perfil no existen)
  const mainAction = {
    title: t("markAttendance"),
    description: tEmployee("markAttendanceDescription"),
    icon: CheckCircle,
    href: "/assistance/web",
    bg: "#10b981",
    buttonBg: "#059669",
  };

  // Función para obtener el tipo de horario
  const getScheduleType = (schedule: any) => {
    if (!schedule) return null;

    switch (schedule.type) {
      case "EMPLOYEE_SHIFT":
        return {
          type: "shift",
          label: tEmployee("shift"),
          color: "bg-blue-100 text-blue-800",
        };
      case "EMPLOYEE_SCHEDULE":
        return {
          type: "schedule",
          label: tEmployee("schedule"),
          color: "bg-green-100 text-green-800",
        };
      case "FREEDOM_SHIFT":
        return {
          type: "freedom",
          label: tEmployee("freedomShift"),
          color: "bg-purple-100 text-purple-800",
        };
      case "FREEDOM_SCHEDULE":
        return {
          type: "freedom",
          label: tEmployee("freedomSchedule"),
          color: "bg-purple-100 text-purple-800",
        };
      default:
        return null;
    }
  };

  const scheduleInfo = getScheduleType(todaySchedule);

  // Nombres de los días en español
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Función para obtener los días del mes actual
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Función para obtener el primer día de la semana del mes
  const getFirstDayOfMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 7 : firstDay;
  };

  // Función para renderizar el calendario usando los componentes del sistema
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];

    // Añadir celdas vacías para los días anteriores al primer día del mes
    for (let i = 1; i < firstDayOfMonth; i++) {
      days.push(
        <div
          key={`empty-start-${i}`}
          className="space-y-2 bg-gray-50 text-center h-full flex flex-col items-center justify-center border border-gray-200 rounded-xl p-2 min-h-[80px] relative"
        >
          <img
            src="/logos/logo.svg"
            alt=""
            className="h-12 w-auto max-w-16 opacity-[0.12] select-none"
            aria-hidden
          />
        </div>
      );
    }

    // Añadir los días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const record = calendar?.find((schedule: any) => schedule.day === day);
      const date = new Date(year, month, day);
      const isToday = new Date().toDateString() === date.toDateString();
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const isPast = dateString < todayString;

      const isHoliday = holidays?.data.some((holiday) => {
        const holidayDate = new Date(holiday.date as string)
          .toISOString()
          .split("T")[0];
        return holidayDate === dateString;
      });

      if (record && record.type === "EMPLOYEE_SHIFT") {
        days.push(
          <CardShiftSchedule
            key={`day-${day}`}
            day={day}
            isBlocked={isPast}
            isSelected={isToday}
            schedule={record.schedule}
            isHoliday={isHoliday}
            onClick={() => {}}
          />
        );
      } else if (record && record.type === "EMPLOYEE_SCHEDULE") {
        days.push(
          <CardSchedule
            key={`day-${day}`}
            day={day}
            isBlocked={isPast}
            isSelected={isToday}
            schedule={record.schedule}
            isHoliday={isHoliday}
            onClick={() => {}}
          />
        );
      } else if (isHoliday) {
        days.push(
          <CardHolidayDay
            key={`day-${day}`}
            day={day}
            isBlocked={isPast}
            isSelected={isToday}
            onClick={() => {}}
          />
        );
      } else {
        if (record?.type === "FREEDOM_SCHEDULE") {
          days.push(
            <CardSchedule
              key={`day-${day}`}
              day={day}
              isBlocked={isPast}
              isSelected={isToday}
              schedule={record.schedule}
              isHoliday={isHoliday}
              onClick={() => {}}
            />
          );
        } else {
          days.push(
            <CardFreeDay
              key={`day-${day}`}
              day={day}
              isBlocked={isPast}
              isSelected={isToday}
              onClick={() => {}}
            />
          );
        }
      }
    }

    // Calcular cuántos días vacíos necesitamos al final para completar la última semana
    const remainingDays = 7 - ((daysInMonth + firstDayOfMonth - 1) % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push(
          <div
            key={`empty-end-${i}`}
            className="space-y-2 bg-gray-50 text-center h-full flex flex-col items-center justify-center border border-gray-200 rounded-xl p-2 min-h-[80px] relative"
          >
            <img
              src="/logos/logo.svg"
              alt=""
              className="h-12 w-auto max-w-16 opacity-[0.12] select-none"
              aria-hidden
            />
          </div>
        );
      }
    }

    return days;
  };

  if (isLoadingCalendar || isLoadingHolidays) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Today's Schedule Skeleton */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 rounded" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-7 w-32 rounded" />
                </div>
              </div>
            </div>
            <div className="flex flex-col md:items-end gap-2">
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-10 w-36 rounded-md" />
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-8 w-32 rounded" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        </div>

        {/* Calendar Skeleton */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-48 rounded" />
          </div>

          {/* Calendar Navigation Skeleton */}
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-7 w-40 rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-10 w-16 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-md" />
            </div>
          </div>

          {/* Calendar Grid Skeleton */}
          <div className="grid grid-cols-7 gap-2">
            {/* Week day headers */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={`header-${i}`}
                className="flex items-center justify-center py-2"
              >
                <Skeleton className="h-3 w-8 rounded" />
              </div>
            ))}

            {/* Empty cells at start */}
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={`empty-start-${i}`}
                className="h-full min-h-[80px] rounded-lg bg-gray-50/80"
              />
            ))}

            {/* Day cells skeleton */}
            {Array.from({ length: 33 }).map((_, i) => (
              <div
                key={`day-skel-${i}`}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-2.5 min-h-[80px] relative"
              >
                <Skeleton className="absolute top-2 right-2 h-3.5 w-5 rounded" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-3.5 w-16 rounded" />
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const showConsentBanner =
    !isConsentFetching && hasPendingConsent(consentStatus);

  return (
    <>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Alerta de consentimiento pendiente */}
        {showConsentBanner && (
          <div className="rounded-xl bg-amber-50 border-l-4 border-amber-500 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-amber-800">
                  {tConsent("alertTitle")}
                </h3>
                <p className="mt-1 text-sm text-amber-700">
                  {tConsent("alertDescription")}
                </p>
                <CHEKIOButton
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push(`/${locale}/consent`)}
                >
                  {tConsent("acceptPolicies")}
                </CHEKIOButton>
              </div>
            </div>
          </div>
        )}

        {/* Horario de Hoy - Destacado */}
        {todaySchedule && (
          <div className="rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-[#2563eb] bg-[#dbeafe]/50 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#2563eb] rounded-lg">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {tEmployee("todaySchedule")}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${scheduleInfo?.color}`}
                    >
                      {scheduleInfo?.label}
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {todaySchedule.schedule?.name ||
                        todaySchedule.schedule?.code ||
                        "-"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-2">
                <div className="text-sm text-gray-600">
                  {today.toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <CHEKIOButton
                  variant="primary"
                  onClick={() =>
                    router.push(
                      showConsentBanner
                        ? `/${locale}/consent`
                        : `/${locale}/assistance/web`
                    )
                  }
                >
                  {t("markAttendance")}
                </CHEKIOButton>
              </div>
            </div>
          </div>
        )}

        {/* Estadística Hora Actual y Marcar Asistencia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CHEKIOStatCard
            title={tEmployee("currentTime")}
            value={currentTime}
            variant="blue"
            icon={Clock}
          />

          <div
            className="relative overflow-hidden rounded-xl p-6 shadow-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md"
            style={{ backgroundColor: mainAction.bg }}
          >
            <div
              className="absolute right-4 top-4 opacity-40"
              style={{ color: "rgba(255,255,255,0.15)" }}
            >
              <mainAction.icon className="h-16 w-16" strokeWidth={0.5} />
            </div>
            <div className="relative flex flex-col gap-4">
              <p className="text-base font-semibold text-white">
                {mainAction.title}
              </p>
              <p className="text-sm text-white/95">{mainAction.description}</p>
              <CHEKIOButton
                className="w-full justify-center gap-1.5 border-0 text-white hover:opacity-90"
                style={{ backgroundColor: mainAction.buttonBg }}
                size="sm"
                onClick={() =>
                  router.push(
                    showConsentBanner
                      ? `/${locale}/consent`
                      : `/${locale}/assistance/web`
                  )
                }
              >
                {t("access")}
                <ChevronRight className="h-4 w-4" />
              </CHEKIOButton>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Calendario de Asistencia */}
          <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <CalendarDays className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                {tEmployee("monthlySchedule")}
              </h3>
            </div>

            <div className="space-y-4">
              {/* Navegación del mes */}
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800 capitalize">
                  {currentDate.toLocaleDateString("es-ES", {
                    month: "long",
                    year: "numeric",
                  })}
                </h4>
                <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50/50">
                  <button
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() - 1,
                          1
                        )
                      )
                    }
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-l-lg transition-colors"
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-x border-gray-200 transition-colors"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() + 1,
                          1
                        )
                      )
                    }
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-r-lg transition-colors"
                    aria-label="Mes siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

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

              {/* Calendario */}
              <div className="relative grid grid-cols-7 gap-3">
                {/* Días de la semana */}
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500 py-3 bg-gray-50/80 rounded-t-lg"
                  >
                    {day}
                  </div>
                ))}

                {renderCalendar()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
