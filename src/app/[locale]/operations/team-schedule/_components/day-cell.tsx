"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ScheduleResponseDto } from "@/app/[locale]/mantainers/schedules/_components/schedule.dto";

export enum TeamScheduleType {
  EMPLOYEE_SHIFT = "EMPLOYEE_SHIFT",
  EMPLOYEE_SCHEDULE = "EMPLOYEE_SCHEDULE",
  FREEDOM_SHIFT = "FREEDOM_SHIFT",
  FREEDOM_SCHEDULE = "FREEDOM_SCHEDULE",
  ABSENCE = "ABSENCE",
  FREEDAY_REQUEST = "FREEDAY_REQUEST",
}

export interface DayCellRecord {
  day: number;
  type: TeamScheduleType | string;
  schedule: ScheduleResponseDto | null;
  scheduleDetails?: Array<{
    schedule: ScheduleResponseDto;
    establishmentName?: string | null;
  }>;
  absence?: {
    typeName: string;
    typeCode: string;
    startDate: string | Date;
    endDate: string | Date;
    withoutPay?: boolean;
  } | null;
  freedayRequest?: {
    reason: string;
    startDate: string | Date;
    endDate: string | Date;
  } | null;
}

interface DayCellProps {
  record: DayCellRecord | undefined;
  isHoliday: boolean;
  isSelected: boolean;
  isToday: boolean;
  /** Hoy o días anteriores (local): no seleccionable y estilo atenuado */
  isPastDate?: boolean;
  canSelect: boolean;
  onClick: () => void;
}

function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return "--:--";
  // Handle ISO datetime strings like "2026-02-09T09:00:00.000Z"
  const timePart = timeStr.includes("T") ? timeStr.split("T")[1] : timeStr;
  const parts = timePart.split(":");
  return `${parts[0].padStart(2, "0")}:${(parts[1] || "00").padStart(2, "0")}`;
}

function formatDateShort(value: string | Date | undefined | null): string {
  if (!value) return "";
  const raw =
    typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  const [, m, d] = raw.split("-");
  const months = [
    "Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic",
  ];
  return `${Number(d)} ${months[Number(m) - 1] ?? ""}`;
}

// ─── Info popover ────────────────────────────────────────────────────────────
interface InfoLine {
  text: string;
  bold?: boolean;
}

function InfoIcon({ lines }: { lines: InfoLine[] }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (pos) {
      setPos(null);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setPos({ x: rect.left + rect.width / 2, y: rect.top });
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="absolute top-0.5 left-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity z-10 w-4 h-4 flex items-center justify-center text-[9px] leading-none text-gray-400 hover:text-blue-500 rounded-sm"
        onClick={handleClick}
        tabIndex={-1}
        aria-label="Ver detalle"
      >
        ℹ
      </button>
      {pos &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9999]"
              onClick={(e) => {
                e.stopPropagation();
                setPos(null);
              }}
            />
            <div
              className="fixed z-[10000] bg-white shadow-xl rounded-lg border border-gray-200/80 py-2 px-3 min-w-[140px] max-w-[210px] text-xs"
              style={{
                top: pos.y,
                left: pos.x,
                transform: "translate(-50%, calc(-100% - 8px))",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {lines.map((line, i) => (
                <p
                  key={i}
                  className={`leading-snug ${
                    line.bold ? "font-semibold text-gray-800" : "text-gray-500"
                  } ${i > 0 ? "mt-0.5" : ""}`}
                >
                  {line.text}
                </p>
              ))}
            </div>
          </>,
          document.body
        )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const BASE =
  "group/cell relative flex flex-col items-center justify-center w-[72px] h-[58px] rounded-lg border text-[10px] font-medium select-none transition-all duration-150 shrink-0 gap-0.5 shadow-sm hover:shadow";

export function DayCell({
  record,
  isHoliday,
  isSelected,
  isToday,
  isPastDate = false,
  canSelect,
  onClick,
}: DayCellProps) {
  const cursorClass = isPastDate
    ? "cursor-not-allowed"
    : canSelect
      ? "cursor-pointer"
      : "cursor-default";
  const pastMuted = isPastDate ? "opacity-[0.72] saturate-[0.85]" : "";

  /* ── Ausencia ── */
  if (record?.type === TeamScheduleType.ABSENCE) {
    const cls = isSelected
      ? "ring-2 ring-blue-400 bg-red-100 border-red-300 text-red-800"
      : "bg-red-50 border-red-200 text-red-800 hover:bg-red-100";
    const infoLines: InfoLine[] = [
      { text: record.absence?.typeName ?? "Ausencia", bold: true },
      ...(record.absence?.withoutPay ? [{ text: "Sin goce de sueldo" }] : []),
      ...(record.absence?.startDate && record.absence?.endDate
        ? [
            {
              text: `${formatDateShort(record.absence.startDate)} – ${formatDateShort(record.absence.endDate)}`,
            },
          ]
        : []),
    ];
    return (
      <div
        className={`${BASE} ${cls} ${cursorClass} ${pastMuted} px-1`}
        onClick={canSelect ? onClick : undefined}
      >
        <InfoIcon lines={infoLines} />
        <span className="text-[11px] font-bold leading-tight text-center w-full truncate px-0.5">
          AU
        </span>
      </div>
    );
  }

  /* ── Permiso / día libre aprobado (calendario API) ── */
  if (record?.type === TeamScheduleType.FREEDAY_REQUEST) {
    const cls = isSelected
      ? "ring-2 ring-blue-400 bg-purple-100 border-purple-300 text-purple-800"
      : "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100";
    const reason = record.freedayRequest?.reason?.trim();
    const infoLines: InfoLine[] = [
      { text: "Permiso aprobado", bold: true },
      ...(reason ? [{ text: reason }] : []),
      ...(record.freedayRequest?.startDate && record.freedayRequest?.endDate
        ? [
            {
              text: `${formatDateShort(record.freedayRequest.startDate)} – ${formatDateShort(record.freedayRequest.endDate)}`,
            },
          ]
        : []),
    ];
    return (
      <div
        className={`${BASE} ${cls} ${cursorClass} ${pastMuted} px-1`}
        onClick={canSelect ? onClick : undefined}
      >
        <InfoIcon lines={infoLines} />
        <span className="text-[11px] font-bold leading-tight text-center w-full truncate px-0.5">
          P
        </span>
        <span className="text-[9px] text-purple-500 leading-none">Permiso</span>
      </div>
    );
  }

  /* ── Feriado ── */
  if (isHoliday) {
    const cls = isSelected
      ? "ring-2 ring-blue-400 bg-blue-50 border-blue-300 text-blue-800"
      : "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100";
    return (
      <div
        className={`${BASE} ${cls} ${cursorClass} ${pastMuted}`}
        onClick={canSelect ? onClick : undefined}
        title="Feriado"
      >
        <span className="text-[14px] font-bold leading-none">F</span>
        <span className="text-[9px] text-orange-500 leading-none">Feriado</span>
      </div>
    );
  }

  /* ── Sin asignación ── */
  if (!record) {
    const cls = isSelected
      ? "ring-2 ring-blue-400 bg-blue-50 border-blue-300 text-blue-800"
      : isToday
        ? "bg-blue-50 border-blue-200 text-blue-600"
        : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50";
    return (
      <div
        className={`${BASE} ${cls} ${cursorClass} ${pastMuted}`}
        onClick={canSelect ? onClick : undefined}
        title="Sin asignación"
      >
        <span className="text-[13px] leading-none">-</span>
      </div>
    );
  }

  const isFreeType =
    record.type === TeamScheduleType.FREEDOM_SHIFT ||
    record.type === TeamScheduleType.FREEDOM_SCHEDULE;

  /* ── Día libre ── */
  if (isFreeType && !record.schedule) {
    const cls = isSelected
      ? "ring-2 ring-blue-400 bg-blue-50 border-blue-300 text-blue-800"
      : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200";
    return (
      <div
        className={`${BASE} ${cls} ${cursorClass} ${pastMuted}`}
        onClick={canSelect ? onClick : undefined}
        title="Día libre"
      >
        <span className="text-[14px] font-bold leading-none">L</span>
        <span className="text-[9px] text-gray-400 leading-none">Libre</span>
      </div>
    );
  }

  /* ── Turno (EMPLOYEE_SHIFT) ── */
  if (record.type === TeamScheduleType.EMPLOYEE_SHIFT) {
    const cls = isSelected
      ? "ring-2 ring-blue-400 bg-blue-100 border-blue-300 text-blue-800"
      : "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100";
    const code = record.schedule?.code ?? "T";
    const name = record.schedule?.name ?? code;
    const infoLines: InfoLine[] = [{ text: name, bold: true }];
    return (
      <div
        className={`${BASE} ${cls} ${cursorClass} ${pastMuted} px-1`}
        onClick={canSelect ? onClick : undefined}
      >
        <InfoIcon lines={infoLines} />
        <span className="text-[11px] font-bold leading-tight text-center w-full truncate px-0.5">
          {code}
        </span>
      </div>
    );
  }

  /* ── Horario directo (EMPLOYEE_SCHEDULE) o editado (FREEDOM_* con schedule) ── */
  if (
    record.type === TeamScheduleType.EMPLOYEE_SCHEDULE ||
    (isFreeType && record.schedule)
  ) {
    const isEdited = isFreeType;
    const cls = isSelected
      ? "ring-2 ring-blue-400 bg-blue-100 border-blue-300 text-blue-800"
      : isEdited
        ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
        : "bg-green-50 border-green-200 text-green-800 hover:bg-green-100";
    const textColor = isSelected
      ? "text-blue-800"
      : isEdited
        ? "text-amber-800"
        : "text-green-800";
    const scheduleDetails = record.scheduleDetails ?? [];
    const scheduleCodes =
      scheduleDetails.length > 0
        ? scheduleDetails
            .map((item) => item.schedule?.code)
            .filter((x): x is string => !!x)
        : [record.schedule?.code ?? "H"];
    const infoLines: InfoLine[] =
      scheduleDetails.length > 0
        ? [
            {
              text: isEdited
                ? "Horarios asignados (editado)"
                : "Horarios asignados",
              bold: true,
            },
            ...scheduleDetails.map((item) => {
              const code = item.schedule?.code ?? "H";
              const name = item.schedule?.name ?? code;
              const establishment = item.establishmentName
                ? ` · ${item.establishmentName}`
                : "";
              return { text: `${code} - ${name}${establishment}` };
            }),
          ]
        : [
            {
              text: `${record.schedule?.name ?? record.schedule?.code ?? "H"}${
                isEdited ? " (editado)" : ""
              }`,
              bold: true,
            },
          ];
    return (
      <div
        className={`${BASE} ${cls} ${cursorClass} ${pastMuted} ${textColor} px-1`}
        onClick={canSelect ? onClick : undefined}
      >
        <InfoIcon lines={infoLines} />
        {isEdited && (
          <span className="absolute top-0.5 right-1 text-[8px] text-amber-500 leading-none">
            ✎
          </span>
        )}
        <div className="flex max-h-[42px] w-full flex-col items-center overflow-y-auto px-0.5">
          {scheduleCodes.map((code, idx) => (
            <span
              key={`${code}-${idx}`}
              className="w-full truncate text-center text-[9px] font-bold leading-tight"
            >
              {code}
            </span>
          ))}
        </div>
      </div>
    );
  }

  /* ── Fallback ── */
  const cls = isSelected
    ? "ring-2 ring-blue-400 bg-blue-50 border-blue-300 text-blue-800"
    : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50";
  return (
    <div
      className={`${BASE} ${cls} ${cursorClass} ${pastMuted}`}
      onClick={canSelect ? onClick : undefined}
    >
      <span className="leading-none">-</span>
    </div>
  );
}
