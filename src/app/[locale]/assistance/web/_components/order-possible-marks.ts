import { PossibleMarkToDoDto } from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import { DateTime } from "luxon";

function getTimeMillis(mark: PossibleMarkToDoDto): number {
  if (!mark.time) return Number.MAX_SAFE_INTEGER;
  const dt = DateTime.fromISO(mark.time, { zone: "utc" });
  return dt.isValid ? dt.toMillis() : Number.MAX_SAFE_INTEGER;
}

/**
 * Sorts possible marks: non-additional first (by time ascending), then additional (by time ascending).
 * Same order used when displaying the list and when picking the "first" automatic mark.
 */
export function sortPossibleMarks(marks: PossibleMarkToDoDto[]): PossibleMarkToDoDto[] {
  return [...marks].sort((a, b) => {
    if (a.isAditional !== b.isAditional) {
      return a.isAditional ? 1 : -1;
    }
    return getTimeMillis(a) - getTimeMillis(b);
  });
}
