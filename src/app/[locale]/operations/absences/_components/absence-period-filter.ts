import { DateTime } from "luxon";

export enum AbsencePeriodFilterMode {
  RANGE = "RANGE",
  YEAR = "YEAR",
  LAST_MONTH = "LAST_MONTH",
}

export function parseDisplayDateToStartOfDay(raw: string): DateTime | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let dt = DateTime.fromFormat(trimmed, "dd/MM/yyyy");
  if (!dt.isValid) {
    dt = DateTime.fromFormat(trimmed, "d/M/yyyy");
  }
  if (!dt.isValid) return null;
  return dt.startOf("day");
}

export type PeriodIsoResult =
  | { ok: true; fromDate: string; toDate: string }
  | { ok: false; errorKey: PeriodValidationErrorKey };

export type PeriodValidationErrorKey =
  | "requiredRange"
  | "invalidFrom"
  | "invalidTo"
  | "fromAfterTo"
  | "requiredYear";

export function resolvePeriodToIso(
  mode: AbsencePeriodFilterMode,
  input: {
    fromDateDisplay: string;
    toDateDisplay: string;
    filterYear: string;
  },
): PeriodIsoResult {
  const now = DateTime.now();

  if (mode === AbsencePeriodFilterMode.LAST_MONTH) {
    const start = now.minus({ months: 1 }).startOf("month");
    const end = now.minus({ months: 1 }).endOf("month");
    return {
      ok: true,
      fromDate: start.toFormat("yyyy-MM-dd"),
      toDate: end.toFormat("yyyy-MM-dd"),
    };
  }

  if (mode === AbsencePeriodFilterMode.YEAR) {
    const y = parseInt(input.filterYear, 10);
    if (!Number.isFinite(y) || y < 1900 || y > 2100) {
      return { ok: false, errorKey: "requiredYear" };
    }
    const start = DateTime.local(y, 1, 1).startOf("day");
    const end = DateTime.local(y, 12, 31).startOf("day");
    return {
      ok: true,
      fromDate: start.toFormat("yyyy-MM-dd"),
      toDate: end.toFormat("yyyy-MM-dd"),
    };
  }

  const fromDt = parseDisplayDateToStartOfDay(input.fromDateDisplay);
  const toDt = parseDisplayDateToStartOfDay(input.toDateDisplay);

  if (!input.fromDateDisplay.trim() || !input.toDateDisplay.trim()) {
    return { ok: false, errorKey: "requiredRange" };
  }
  if (!fromDt) {
    return { ok: false, errorKey: "invalidFrom" };
  }
  if (!toDt) {
    return { ok: false, errorKey: "invalidTo" };
  }
  if (fromDt > toDt) {
    return { ok: false, errorKey: "fromAfterTo" };
  }

  return {
    ok: true,
    fromDate: fromDt.toFormat("yyyy-MM-dd"),
    toDate: toDt.toFormat("yyyy-MM-dd"),
  };
}

export function getLastMonthDisplayRange(): {
  fromDisplay: string;
  toDisplay: string;
} {
  const start = DateTime.now().minus({ months: 1 }).startOf("month");
  const end = DateTime.now().minus({ months: 1 }).endOf("month");
  return {
    fromDisplay: start.toFormat("dd/MM/yyyy"),
    toDisplay: end.toFormat("dd/MM/yyyy"),
  };
}

export function buildYearOptions(
  backYears = 12,
  forwardYears = 1,
): number[] {
  const y = DateTime.now().year;
  const out: number[] = [];
  for (let i = y - backYears; i <= y + forwardYears; i += 1) {
    out.push(i);
  }
  return out.reverse();
}
