import { DateTime } from "luxon";

function isUseTimeShiftEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_USE_TIME_SHIFT === "true" ||
    process.env.NEXT_PUBLIC_USE_TIME_SHIFT === "1"
  );
}

export type AssistanceDateLike = {
  year: number;
  month: number;
  day: number;
  Employee?: {
    personType?: "EMPLOYEE" | "STUDENT";
  };
};

export function getTodayUtcStart(): DateTime {
  return DateTime.utc().startOf("day");
}

export function getAssistanceUtcDayStart(assistance: AssistanceDateLike): DateTime {
  return DateTime.fromObject({
    year: assistance.year,
    month: assistance.month,
    day: assistance.day,
  })
    .toUTC()
    .startOf("day");
}

/**
 * Regla de negocio:
 * - Solo se permite editar asistencias de días anteriores a "hoy".
 * - No se permite editar "hoy" ni fechas futuras.
 * - Con `NEXT_PUBLIC_USE_TIME_SHIFT=true` (o `1`), siempre retorna true (sin bloqueo por fecha).
 */
export function isAssistanceDayEditable(assistance: AssistanceDateLike): boolean {
  if (isUseTimeShiftEnabled()) {
    return true;
  }
  // Regla especial: para estudiantes no aplican bloqueos por fecha (hoy/futuro).
  if (assistance.Employee?.personType === "STUDENT") {
    return true;
  }
  const assistanceDayStart = getAssistanceUtcDayStart(assistance);
  const todayStart = getTodayUtcStart();
  return assistanceDayStart < todayStart;
}

