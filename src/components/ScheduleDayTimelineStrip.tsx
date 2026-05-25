"use client";

import { ScheduleResponseDto } from "@/app/[locale]/mantainers/schedules/_components/schedule.dto";
import { DateTime } from "luxon";

/** Misma convención que mantenedor de horarios: instante → componentes en UTC. */
function parseScheduleDateTime(
  isoOrDate: string | Date | undefined,
): DateTime | null {
  if (isoOrDate == null) return null;
  const dt =
    isoOrDate instanceof Date
      ? DateTime.fromJSDate(isoOrDate)
      : DateTime.fromISO(String(isoOrDate));
  return dt.isValid ? dt.toUTC() : null;
}

function workDurationMinutes(s: ScheduleResponseDto): number {
  return (s.workHours ?? 0) * 60 + (s.workMinutes ?? 0);
}

function EmptyDayTimelineStrip({ className = "" }: { className?: string }) {
  return (
    <div className={`mt-2 ${className}`.trim()}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100" />
      <div className="mt-1 flex justify-between text-[10px] leading-none text-slate-400 tabular-nums sm:text-xs">
        <span>0</span>
        <span>12</span>
        <span>24h</span>
      </div>
    </div>
  );
}

type Props = {
  /** Sin horario: misma franja gris y marcas, sin bloque teal (alto uniforme en las cards). */
  schedule?: ScheduleResponseDto | null;
  className?: string;
};

/**
 * Franja horizontal 0–24 h con marcas 0 / 12 / 24h y segmento teal del horario
 * (misma visual que el modal de detalle de ciclo de turno).
 */
export function ScheduleDayTimelineStrip({
  schedule,
  className = "",
}: Props) {
  if (schedule == null) {
    return <EmptyDayTimelineStrip className={className} />;
  }

  const start = parseScheduleDateTime(schedule.startTime);
  const durationMin = workDurationMinutes(schedule);

  if (!start || durationMin <= 0) {
    return <EmptyDayTimelineStrip className={className} />;
  }

  const startM = start.hour * 60 + start.minute;
  const dayMin = 24 * 60;
  const leftPct = Math.min(100, (startM / dayMin) * 100);
  const widthPct = Math.min(100 - leftPct, (durationMin / dayMin) * 100);

  return (
    <div className={`mt-2 ${className}`.trim()}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="absolute inset-y-0 rounded-full bg-teal-500/90"
          style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 2)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] leading-none text-slate-400 tabular-nums sm:text-xs">
        <span>0</span>
        <span>12</span>
        <span>24h</span>
      </div>
    </div>
  );
}
