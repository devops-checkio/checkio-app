/**
 * Estilos base compartidos para las tarjetas del calendario de asistencia.
 * Mantiene consistencia visual entre CardHolidayDay, CardSchedule, CardShiftSchedule y CardFreeDay.
 */

export const CALENDAR_CARD_BASE =
  "h-full flex flex-col justify-center rounded-xl shadow-sm border border-gray-200 p-2.5 min-h-[90px] relative cursor-pointer transition-all duration-200";

export function getCalendarCardClasses(
  isSelected: boolean,
  isBlocked: boolean
): string {
  const base = CALENDAR_CARD_BASE;
  if (isBlocked) {
    return `${base} opacity-60 cursor-not-allowed bg-gray-100`;
  }
  if (isSelected) {
    return `${base} ring-2 ring-blue-400 bg-blue-50 hover:bg-blue-100 border-blue-200`;
  }
  return `${base} hover:shadow-md hover:border-gray-300 hover:bg-gray-50`;
}

export const CALENDAR_CARD_DAY_NUMBER = "text-sm font-bold text-gray-700";
export const CALENDAR_CARD_DAY_POSITION = "absolute top-1.5 right-2";
