"use client";

import { ScheduleResponseDto } from "@/app/[locale]/mantainers/schedules/_components/schedule.dto";
import {
  ScheduleShiftResponseDto,
  ShiftResponseDto,
} from "@/app/[locale]/mantainers/shifts/_components/shifth.dto";
import { CHEKIOButton, CHEKIOModal, ScheduleDayTimelineStrip } from "@/components";
import { useGetSchedulesByShiftId, useGetShift } from "@/service/shift.service";
import { Coffee, Loader2 } from "lucide-react";
import { DateTime } from "luxon";
import { useMemo } from "react";

export type ShiftCycleEmployeeContext = {
  dayIndex: number;
  weekIndex: number;
  startDate?: string;
  endDate?: string | null;
  ruleHoliday?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  shiftPublicId: string | null;
  employeeContext?: ShiftCycleEmployeeContext | null;
};

const WEEKDAY_MATCH: {
  re: RegExp;
  title: string;
  short: string;
  order: number;
}[] = [
  { re: /lunes/i, title: "Lunes", short: "Lun", order: 0 },
  { re: /martes/i, title: "Martes", short: "Mar", order: 1 },
  { re: /mi[ée]rcoles/i, title: "Miércoles", short: "Mié", order: 2 },
  { re: /jueves/i, title: "Jueves", short: "Jue", order: 3 },
  { re: /viernes/i, title: "Viernes", short: "Vie", order: 4 },
  { re: /s[áa]bado/i, title: "Sábado", short: "Sáb", order: 5 },
  { re: /domingo/i, title: "Domingo", short: "Dom", order: 6 },
];

function weekdayMeta(dayLabel: string, dayIndex: number) {
  const raw = (dayLabel || "").trim();
  for (const w of WEEKDAY_MATCH) {
    if (w.re.test(raw)) {
      return { title: w.title, short: w.short, sort: w.order };
    }
  }
  return {
    title: raw || `Día ${dayIndex}`,
    short: raw ? raw.slice(0, 3) : `${dayIndex}`,
    sort: 100 + dayIndex,
  };
}

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

function formatTimeLabel(isoOrDate: string | Date | undefined): string {
  const dt = parseScheduleDateTime(isoOrDate);
  return dt ? dt.toFormat("HH:mm") : "—";
}

function formatWorkDuration(s: ScheduleResponseDto): string {
  const h = s.workHours ?? 0;
  const m = s.workMinutes ?? 0;
  if (h === 0 && m === 0) return "—";
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

/** Posición en el ciclo (0…semanas×7−1) que corresponde al calendario de hoy, según la asignación. */
function cyclePositionForCalendarToday(
  shiftWeeks: number | undefined,
  ctx: ShiftCycleEmployeeContext,
): { weekIndex: number; dayIndex: number } | null {
  if (!ctx.startDate) return null;
  const anchor = DateTime.fromISO(ctx.startDate, {
    zone: "utc",
  }).startOf("day");
  if (!anchor.isValid) return null;
  const today = DateTime.now().toUTC().startOf("day");
  const end = ctx.endDate
    ? DateTime.fromISO(ctx.endDate, { zone: "utc" }).startOf("day")
    : null;
  if (end?.isValid && today > end) return null;
  if (today < anchor) return null;

  const cycleDays = Math.max(1, (shiftWeeks ?? 1) * 7);
  const dayNorm = ((ctx.dayIndex % 7) + 7) % 7;
  let baseLinear = ctx.weekIndex * 7 + dayNorm;
  baseLinear = ((baseLinear % cycleDays) + cycleDays) % cycleDays;

  const deltaDays = Math.floor(
    today.diff(anchor.startOf("day"), "days").as("days"),
  );
  const linear =
    (((baseLinear + deltaDays) % cycleDays) + cycleDays) % cycleDays;

  return {
    weekIndex: Math.floor(linear / 7),
    dayIndex: linear % 7,
  };
}

function sameCycleSlot(
  slot: ScheduleShiftResponseDto,
  pos: { weekIndex: number; dayIndex: number },
): boolean {
  const sd = ((slot.dayIndex % 7) + 7) % 7;
  const pd = ((pos.dayIndex % 7) + 7) % 7;
  return slot.weekIndex === pos.weekIndex && sd === pd;
}

/** Quita del nombre el prefijo de rango horario para no duplicar lo que ya va en grande. */
function supplementalScheduleCaption(
  name: string,
  startStr: string,
  endStr: string,
): string {
  let s = name.trim();
  if (!s) return "";
  const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const exact = new RegExp(
    `^${esc(startStr)}\\s*[-–—]\\s*${esc(endStr)}\\s*`,
    "i",
  );
  const trimmed = s.replace(exact, "").trim();
  if (trimmed.length > 0) return trimmed;
  const loose = s.replace(
    /^\d{1,2}:\d{2}\s*[-–—]\s*\d{1,2}:\d{2}\s*/i,
    "",
  ).trim();
  return loose.length > 0 ? loose : s;
}

function SlotDayCard({
  slot,
  detail,
  isCalendarToday,
}: {
  slot: ScheduleShiftResponseDto;
  detail: ScheduleResponseDto | undefined;
  isCalendarToday: boolean;
}) {
  const meta = weekdayMeta(slot.day, slot.dayIndex);
  const breaks = detail?.ScheduleBreaks ?? [];
  const isFreeDay = !detail;

  const startUtc =
    detail != null ? parseScheduleDateTime(detail.startTime) : null;
  const endUtc =
    detail != null && startUtc != null
      ? startUtc.plus({
          hours: detail.workHours ?? 0,
          minutes: detail.workMinutes ?? 0,
        })
      : null;
  const rangeStartStr = startUtc ? startUtc.toFormat("HH:mm") : "—";
  const rangeEndStr = endUtc ? endUtc.toFormat("HH:mm") : "—";
  const caption =
    detail != null
      ? supplementalScheduleCaption(
          detail.name ?? "",
          rangeStartStr,
          rangeEndStr,
        )
      : "";
  const scheduleCodeLine = detail?.code?.trim() ?? "";
  const discountHint =
    detail != null && (detail.discountMinutes ?? 0) > 0
      ? `${detail.discountMinutes} min`
      : "";

  return (
    <div
      className={`relative flex min-h-0 min-w-0 flex-col rounded-xl border px-3 py-3 shadow-sm transition-shadow sm:px-4 sm:py-4 ${
        isCalendarToday
          ? "border-sky-400 bg-gradient-to-b from-sky-50/90 to-white ring-2 ring-sky-300/50"
          : isFreeDay
            ? "border-dashed border-emerald-200/90 bg-emerald-50/50"
            : "border-slate-200/90 bg-white hover:border-slate-300"
      }`}
    >
      {isCalendarToday ? (
        <span className="absolute right-1.5 top-1.5 z-10 rounded-md bg-sky-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm sm:right-2 sm:top-2 sm:text-[10px]">
          Hoy
        </span>
      ) : null}
      <div className="text-center">
        <p className="text-sm font-bold leading-tight text-slate-900 sm:text-base">
          {meta.title}
        </p>
      </div>

      {detail ? (
        <>
          <div className="mt-2.5 space-y-1.5 text-center">
            {scheduleCodeLine ? (
              <p className="text-[11px] font-medium leading-snug text-slate-600 tabular-nums sm:text-xs">
                {scheduleCodeLine}
              </p>
            ) : null}
            <p className="font-mono text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl">
              {rangeStartStr} – {rangeEndStr}
            </p>
            <div className="space-y-0.5 text-[10px] leading-snug text-slate-600 sm:text-xs">
              {caption ? (
                <p className="line-clamp-4 break-words font-medium text-slate-700">
                  {caption}
                </p>
              ) : null}
              <p className="text-slate-500">
                {formatWorkDuration(detail)}
                {discountHint ? (
                  <span className="text-slate-400"> · {discountHint}</span>
                ) : null}
              </p>
            </div>
          </div>
          <ScheduleDayTimelineStrip schedule={detail} />
          {breaks.length > 0 && (
            <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2">
              <p className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase text-slate-500 sm:text-xs">
                <Coffee className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                Pausas
              </p>
              <ul className="space-y-1 text-[10px] leading-snug text-slate-600 sm:text-xs">
                {breaks.map((b) => (
                  <li
                    key={b.publicId ?? `${b.day}-${b.type}-${b.startTime}`}
                    className="text-center"
                  >
                    {formatTimeLabel(b.startTime)}–{formatTimeLabel(b.endTime)}{" "}
                    <span className="text-slate-400">({b.type})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="mt-3 flex flex-1 flex-col items-center justify-center py-4 text-center sm:py-5">
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-800 sm:text-base">
            DIA LIBRE
          </p>
          <p className="mt-1.5 px-1 text-xs leading-snug text-emerald-700/85 sm:text-sm">
            Sin jornada en este día del ciclo
          </p>
        </div>
      )}
    </div>
  );
}

export default function ShiftCycleDetailModal({
  isOpen,
  onClose,
  shiftPublicId,
  employeeContext,
}: Props) {
  const enabled = isOpen && !!shiftPublicId;

  const { data: shift, isLoading: loadingShift } = useGetShift(
    enabled ? shiftPublicId! : undefined,
  );
  const { data: scheduleDetails = [], isLoading: loadingSchedules } =
    useGetSchedulesByShiftId(enabled ? shiftPublicId! : undefined);

  const isLoading = enabled && (loadingShift || loadingSchedules);

  const scheduleByPublicId = useMemo(() => {
    const m = new Map<string, ScheduleResponseDto>();
    for (const s of scheduleDetails) {
      m.set(s.publicId, s);
    }
    return m;
  }, [scheduleDetails]);

  const todayCyclePosition = useMemo(() => {
    if (!shift || !employeeContext?.startDate) return null;
    return cyclePositionForCalendarToday(shift.weeks, employeeContext);
  }, [shift, employeeContext]);

  const weeksBlocks = useMemo(() => {
    if (!shift?.schedules?.length) return [];
    const ordered = [...shift.schedules].sort(
      (a, b) => a.weekIndex - b.weekIndex || a.dayIndex - b.dayIndex,
    );
    const byWeek = new Map<number, typeof ordered>();
    for (const slot of ordered) {
      const w = slot.weekIndex ?? 0;
      if (!byWeek.has(w)) byWeek.set(w, []);
      byWeek.get(w)!.push(slot);
    }
    return [...byWeek.entries()]
      .sort(([a], [b]) => a - b)
      .map(([weekIndex, slots]) => ({
        weekIndex,
        slots: [...slots].sort(
          (a, b) =>
            weekdayMeta(a.day, a.dayIndex).sort -
            weekdayMeta(b.day, b.dayIndex).sort,
        ),
      }));
  }, [shift]);

  const renderBody = (s: ShiftResponseDto) => (
    <div className="max-h-[min(82vh,960px)] space-y-6 overflow-y-auto overflow-x-hidden pr-1 [-webkit-overflow-scrolling:touch]">
      {weeksBlocks.map(({ weekIndex, slots }, wi) => (
        <div key={weekIndex} className="space-y-3">
          {(s.weeks ?? 1) > 1 && (
            <h3 className="text-center text-sm font-semibold text-slate-800 sm:text-base">
              Semana {weekIndex + 1} del ciclo
            </h3>
          )}
          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,150px),1fr))] gap-3 sm:min-w-0 sm:gap-4">
            {slots.map((slot, idx) => {
              const detail = slot.scheduleId
                ? scheduleByPublicId.get(slot.scheduleId)
                : undefined;
              const isCalendarToday =
                todayCyclePosition != null &&
                sameCycleSlot(slot, todayCyclePosition);
              return (
                <SlotDayCard
                  key={`${slot.weekIndex}-${slot.dayIndex}-${wi}-${idx}`}
                  slot={slot}
                  detail={detail}
                  isCalendarToday={isCalendarToday}
                />
              );
            })}
          </div>
        </div>
      ))}

      {weeksBlocks.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          Este turno no tiene días configurados en el ciclo.
        </p>
      )}
    </div>
  );

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={shift ? `${shift.name}` : "Detalle del turno"}
      size="7xl"
    >
      <div className="py-1 sm:py-2">
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="text-base text-slate-600">Cargando ciclo y horarios…</p>
          </div>
        )}
        {!isLoading && shift && renderBody(shift)}
        {!isLoading && !shift && shiftPublicId && (
          <p className="py-8 text-center text-base text-red-600">
            No se pudo cargar el turno.
          </p>
        )}
        <div className="mt-4 flex justify-end border-t border-gray-100 pt-3 sm:mt-6 sm:pt-4">
          <CHEKIOButton variant="secondaryBlue" type="button" onClick={onClose}>
            Cerrar
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
}
