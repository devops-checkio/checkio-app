import { DateTime } from "luxon";

/** Normaliza a yyyy-MM-dd desde ISO, fecha Excel o dd/mm/yyyy. */
export function normalizeDateOnlyString(
  value: string | number | undefined | null,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) {
    const epoch = DateTime.fromMillis((value - 25569) * 86400 * 1000, {
      zone: "utc",
    });
    return epoch.isValid ? epoch.toFormat("yyyy-MM-dd") : undefined;
  }
  const s = String(value).trim();
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.includes("T")) return s.split("T")[0];
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (ddmmyyyy) {
    const d = parseInt(ddmmyyyy[1], 10);
    const m = parseInt(ddmmyyyy[2], 10);
    const y = parseInt(ddmmyyyy[3], 10);
    const dt = DateTime.fromObject({ year: y, month: m, day: d });
    return dt.isValid ? dt.toFormat("yyyy-MM-dd") : undefined;
  }
  const parsed = DateTime.fromISO(s);
  if (parsed.isValid) return parsed.toFormat("yyyy-MM-dd");
  return undefined;
}

/** Combina fecha local (yyyy-MM-dd) + hora HH:mm y devuelve ISO UTC. */
export function combineLocalDateAndTimeToUtcIso(
  dateStr: string | undefined,
  timeStr: string | undefined,
): string | undefined {
  const dateOnly = normalizeDateOnlyString(dateStr);
  if (!dateOnly) return undefined;
  const time = (timeStr || "00:00").trim();
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(time);
  const hour = match ? parseInt(match[1], 10) : 0;
  const minute = match ? parseInt(match[2], 10) : 0;
  const dt = DateTime.fromISO(dateOnly, { zone: "local" }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });
  if (!dt.isValid) return undefined;
  return dt.toUTC().toISO() ?? undefined;
}

/** Día de aplicación PER_HOURS: inicio del día local en ISO UTC. */
export function perHoursApplicationStartUtcIso(
  dateStr: string | undefined,
): string | undefined {
  const d = normalizeDateOnlyString(dateStr);
  if (!d) return undefined;
  const startOfDay = DateTime.fromISO(d, { zone: "local" }).startOf("day");
  if (!startOfDay.isValid) return undefined;
  return startOfDay.toUTC().toISO() ?? undefined;
}

/** Misma lógica que el detalle (modal): instante en zona local, fecha + hora. */
export function formatOvertimeIsoForTable(
  iso: string | Date | undefined | null,
): string {
  if (iso === undefined || iso === null) return "-";
  const raw =
    typeof iso === "string" ? iso : new Date(iso).toISOString();
  const dt = DateTime.fromISO(raw).setZone("local");
  if (!dt.isValid) return "-";
  return dt.toFormat("dd/MM/yyyy HH:mm");
}

export function splitIsoToLocalDateAndTime(
  iso: string | Date | undefined,
): { date: string; time: string } {
  if (!iso) return { date: "", time: "00:00" };
  const raw =
    typeof iso === "string" ? iso : new Date(iso).toISOString();
  const dt = DateTime.fromISO(raw).setZone("local");
  if (!dt.isValid) return { date: "", time: "00:00" };
  return {
    date: dt.toFormat("yyyy-MM-dd"),
    time: dt.toFormat("HH:mm"),
  };
}

export function isScheduleEndAfterStart(
  startIso: string | undefined,
  endIso: string | undefined,
): boolean {
  if (!startIso || !endIso) return false;
  const a = DateTime.fromISO(startIso);
  const b = DateTime.fromISO(endIso);
  if (!a.isValid || !b.isValid) return false;
  return b > a;
}

/** Construye `startDate`/`endDate` en ISO UTC según tipo de solicitud. */
export function buildOvertimeApiDates(
  type: "PER_SCHEDULE" | "PER_HOURS",
  row: {
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
  },
): { startDate: string | undefined; endDate: string | undefined } {
  if (type === "PER_SCHEDULE") {
    return {
      startDate: combineLocalDateAndTimeToUtcIso(row.startDate, row.startTime),
      endDate: combineLocalDateAndTimeToUtcIso(row.endDate, row.endTime),
    };
  }
  return {
    startDate: perHoursApplicationStartUtcIso(row.startDate),
    endDate: undefined,
  };
}

/** Normaliza hora desde Excel (fracción del día) o texto HH:mm. */
export function normalizeTimeString(
  value: string | number | undefined | null,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 0 && value < 1) {
      const totalMinutes = Math.round(value * 24 * 60);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }
  const s = String(value).trim();
  if (!s) return undefined;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (m) {
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h >= 0 && h < 24 && min >= 0 && min < 60) {
      return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }
  }
  return undefined;
}
