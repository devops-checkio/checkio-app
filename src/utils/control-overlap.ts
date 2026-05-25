import { DateTime } from "luxon";

const positionInTime = (
  breakStart: DateTime,
  breakEnd: DateTime,
  day: number
) => {
  breakStart = breakStart.plus({ days: day - 1 });
  breakEnd = breakEnd.plus({ days: day - 1 });

  if (breakStart.equals(breakEnd)) {
    breakEnd = breakEnd.plus({ days: 1 });
  }

  if (breakEnd < breakStart) {
    breakEnd = breakEnd.plus({ days: 1 });
  }

  return [breakStart, breakEnd];
};

function checkOverlap(
  breakStart: DateTime,
  breakEnd: DateTime,
  otherStart: DateTime,
  otherEnd: DateTime,
  options = { includeAdjacent: false }
) {
  // Validar que los rangos de fechas son válidos
  if (breakStart >= breakEnd || otherStart >= otherEnd) {
    return true;
  }

  // Validar que las fechas no son nulas
  if (!breakStart || !breakEnd || !otherStart || !otherEnd) {
    return true;
  }

  // Verificar traslape
  // Si includeAdjacent es true, considera traslape cuando hay contacto exacto
  // Si includeAdjacent es false, solo considera traslape cuando hay solapamiento real
  if (options.includeAdjacent) {
    return breakStart <= otherEnd && breakEnd >= otherStart;
  }

  // Permite contacto exacto (una pausa termina cuando otra comienza)
  // Solo considera traslape si hay solapamiento real
  return breakStart < otherEnd && breakEnd > otherStart;
}

export { checkOverlap, positionInTime };
