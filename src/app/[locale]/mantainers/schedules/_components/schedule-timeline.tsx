"use client";

import { Card } from "antd";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { BreakType, ScheduleBreakDto } from "./schedule.dto";
import { positionInTime } from "@/utils/control-overlap";

interface ScheduleTimelineProps {
  startTime: string; // Formato HH:mm
  endTime: string; // Formato HH:mm
  totalDays: number;
  breaks: ScheduleBreakDto[];
}

interface BreakTime {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: BreakType;
  description?: string;
  deductible: boolean;
  day: number; // Día calculado basado en la línea de tiempo
}

export default function ScheduleTimeline({
  startTime,
  endTime,
  totalDays,
  breaks,
}: ScheduleTimelineProps) {
  const t = useTranslations("mantainers.schedules.timeline");
  // Convertir horas string a minutos desde medianoche para facilitar cálculos
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  // Procesar pausas: extraer solo HH:mm y usar el campo day de cada pausa
  const processBreaks = (): BreakTime[] => {
    return breaks.map((breakItem) => {
      // Extraer solo la hora (HH:mm) de la fecha
      let breakStartTime: string;
      let breakEndTime: string;

      if (breakItem.startTime instanceof Date) {
        breakStartTime = DateTime.fromJSDate(breakItem.startTime)
          .setZone("local", { keepLocalTime: true })
          .toFormat("HH:mm");
      } else if (typeof breakItem.startTime === "string") {
        // Si es string ISO, extraer solo la hora
        const dateStr = breakItem.startTime.replace("Z", "");
        const [, timePart] = dateStr.split("T");
        const [hours, minutes] = timePart.split(":").map(Number);
        breakStartTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      } else {
        breakStartTime = "00:00";
      }

      if (breakItem.endTime instanceof Date) {
        breakEndTime = DateTime.fromJSDate(breakItem.endTime)
          .setZone("local", { keepLocalTime: true })
          .toFormat("HH:mm");
      } else if (typeof breakItem.endTime === "string") {
        // Si es string ISO, extraer solo la hora
        const dateStr = breakItem.endTime.replace("Z", "");
        const [, timePart] = dateStr.split("T");
        const [hours, minutes] = timePart.split(":").map(Number);
        breakEndTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      } else {
        breakEndTime = "00:00";
      }

      // Usar el campo day directamente de la pausa (definido en la tabla)
      // El día indica en qué línea temporal debe aparecer la pausa
      const breakDay = breakItem.day || 1;

      return {
        startTime: breakStartTime,
        endTime: breakEndTime,
        type: breakItem.type,
        description: breakItem.description,
        deductible: breakItem.deductible,
        day: breakDay,
      };
    });
  };

  const processedBreaks = processBreaks();

  // Calcular los días del horario
  const scheduleStartMinutes = timeToMinutes(startTime);
  const scheduleEndMinutes = timeToMinutes(endTime);

  return (
    <Card
      title={
        totalDays > 1
          ? t("titleWithDays", { days: totalDays })
          : t("title")
      }
      bordered={false}
    >
      <div className="space-y-6">
        {Array.from({ length: totalDays }, (_, dayIndex) => {
          // Calcular inicio y fin del día en la línea de tiempo
          let dayStartTime: string;
          let dayEndTime: string;

          if (dayIndex === 0) {
            dayStartTime = startTime;
            dayEndTime =
              dayIndex === totalDays - 1
                ? endTime
                : "23:59";
          } else if (dayIndex === totalDays - 1) {
            dayStartTime = "00:00";
            dayEndTime = endTime;
          } else {
            dayStartTime = "00:00";
            dayEndTime = "23:59";
          }

          const dayStartMinutes = timeToMinutes(dayStartTime);
          const dayEndMinutes = timeToMinutes(dayEndTime);
          const dayDuration = dayEndMinutes - dayStartMinutes;

          // No mostrar días sin duración
          if (dayDuration <= 0) {
            return null;
          }

          // Obtener pausas del día actual (basado en cálculo de línea de tiempo)
          const dayBreaks = processedBreaks.filter(
            (b) => b.day === dayIndex + 1
          );

          // Función para calcular posición porcentual en el día
          const getPosition = (time: string): number => {
            const timeMinutes = timeToMinutes(time);
            const diff = timeMinutes - dayStartMinutes;
            return Math.max(0, Math.min(100, (diff / dayDuration) * 100));
          };

          return (
            <div key={dayIndex} className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">
                  {t("day", { day: dayIndex + 1 })}
                </h4>
                <div className="text-xs text-gray-500">
                  {dayStartTime} - {dayEndTime}
                </div>
              </div>

              {/* Línea de tiempo */}
              <div className="relative pb-20">
                {/* Línea base */}
                <div className="h-3 bg-gray-300 rounded-full relative mt-8">
                  {/* Período de trabajo */}
                  <div
                    className="absolute h-3 bg-blue-500 rounded-full"
                    style={{
                      left: "0%",
                      width: "100%",
                    }}
                  />

                  {/* Marcador de entrada */}
                  <div
                    className="absolute -top-1 transform -translate-x-1/2"
                    style={{ left: "0%" }}
                  >
                    <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    <div className="absolute top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <div className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                        {t("entry")}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {dayStartTime}
                      </div>
                    </div>
                  </div>

                  {/* Pausas y colaciones */}
                  {dayBreaks.map((breakItem, breakIndex) => {
                    const breakStartPos = getPosition(breakItem.startTime);
                    const breakEndPos = getPosition(breakItem.endTime);
                    const breakWidth = Math.max(
                      0.5,
                      breakEndPos - breakStartPos
                    );

                    // Validar que las posiciones sean válidas
                    if (
                      isNaN(breakStartPos) ||
                      isNaN(breakEndPos) ||
                      breakStartPos < 0 ||
                      breakEndPos > 100
                    ) {
                      return null;
                    }

                    const isLunch = breakItem.type === BreakType.LUNCH;

                    return (
                      <div key={`${breakItem.startTime}-${breakIndex}`}>
                        {/* Marcador de inicio de pausa */}
                        <div
                          className="absolute -top-1 transform -translate-x-1/2"
                          style={{ left: `${breakStartPos}%` }}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
                              isLunch ? "bg-orange-500" : "bg-yellow-500"
                            }`}
                          >
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                          {/* Etiqueta arriba para colación, abajo para pausa */}
                          <div
                            className={`absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap ${
                              isLunch ? "bottom-full mb-2" : "top-5"
                            }`}
                          >
                            <div
                              className={`text-xs font-medium px-2 py-1 rounded border ${
                                isLunch
                                  ? "text-orange-700 bg-orange-50 border-orange-200"
                                  : "text-yellow-700 bg-yellow-50 border-yellow-200"
                              }`}
                            >
                              {isLunch ? t("lunch") : t("break")}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {breakItem.startTime}
                            </div>
                          </div>
                        </div>

                        {/* Marcador de fin de pausa */}
                        <div
                          className="absolute -top-1 transform -translate-x-1/2"
                          style={{ left: `${breakEndPos}%` }}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
                              isLunch ? "bg-orange-500" : "bg-yellow-500"
                            }`}
                          >
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                          {/* Etiqueta arriba para colación, abajo para pausa */}
                          <div
                            className={`absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap ${
                              isLunch ? "bottom-full mb-2" : "top-5"
                            }`}
                          >
                            <div
                              className={`text-xs font-medium px-2 py-1 rounded border ${
                                isLunch
                                  ? "text-orange-700 bg-orange-50 border-orange-200"
                                  : "text-yellow-700 bg-yellow-50 border-yellow-200"
                              }`}
                            >
                              {isLunch ? t("endLunch") : t("endBreak")}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {breakItem.endTime}
                            </div>
                          </div>
                        </div>

                        {/* Barra de pausa */}
                        <div
                          className={`absolute h-3 ${
                            isLunch ? "bg-orange-400" : "bg-yellow-400"
                          } opacity-75 rounded-full`}
                          style={{
                            left: `${breakStartPos}%`,
                            width: `${breakWidth}%`,
                          }}
                        />
                      </div>
                    );
                  })}

                  {/* Marcador de salida */}
                  <div
                    className="absolute -top-1 transform -translate-x-1/2"
                    style={{ left: "100%" }}
                  >
                    <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    <div className="absolute top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <div className="text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200">
                        {t("exit")}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {dayEndTime}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leyenda */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-600 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span>{t("workPeriod")}</span>
                </div>
                {dayBreaks.some((b) => b.type === BreakType.LUNCH) && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded" />
                    <span>{t("lunch")}</span>
                  </div>
                )}
                {dayBreaks.some((b) => b.type === BreakType.BREAK) && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded" />
                    <span>{t("break")}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

