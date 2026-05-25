import { DateTime } from "luxon";

/** Valores en segundos (entrada, colación, salida). */
export interface DelayOvertimeData {
  entrada: number;
  colacion: number;
  salida: number;
}

export type AssistanceResumeDelays =
  | {
      atrasoEntrada?: number;
      excesoColacion?: number;
      atrasoSalida?: number;
    }
  | null
  | undefined;

/** Formatea segundos a HH:mm:ss. Valores en DelayOvertimeData están en segundos. */
export function formatSecondsToTime(seconds: number): string {
  if (seconds == null || seconds <= 0) return "--:--:--";
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function calculateDelays(
  markStart: any,
  startDate: DateTime,
  markEnd: any,
  endDate: DateTime
): DelayOvertimeData {
  let entrada = 0;
  let salida = 0;

  // Calcular atraso en entrada (segundos)
  if (markStart && startDate) {
    const markStartTime = DateTime.fromISO(markStart.timestamp).toUTC();
    const diff = markStartTime.diff(startDate, "seconds").seconds;
    entrada = Math.max(0, Math.round(diff));
  }

  // Calcular atraso en salida (segundos; si sale antes del horario programado)
  if (markEnd && endDate) {
    const markEndTime = DateTime.fromISO(markEnd.timestamp).toUTC();
    const diff = endDate.diff(markEndTime, "seconds").seconds;
    salida = Math.max(0, Math.round(diff));
  }

  return {
    entrada,
    colacion: 0, // Por ahora 0, podría expandirse
    salida,
  };
}

export function calculateOvertime(markEnd: any, endDate: DateTime): DelayOvertimeData {
  let salida = 0;

  // Calcular horas extras en salida (segundos)
  if (markEnd && endDate) {
    const markEndTime = DateTime.fromISO(markEnd.timestamp).toUTC();
    const diff = markEndTime.diff(endDate, "seconds").seconds;
    salida = Math.max(0, Math.round(diff));
  }

  return {
    entrada: 0, // No hay horas extras en entrada
    colacion: 0, // Por ahora 0, podría expandirse
    salida,
  };
}

/** Convierte resume del backend a DelayOvertimeData. Espera valores en segundos. */
export function delaysFromResume(
  resume: AssistanceResumeDelays,
): DelayOvertimeData {
  return {
    entrada: resume?.atrasoEntrada ?? 0,
    colacion: resume?.excesoColacion ?? 0,
    salida: resume?.atrasoSalida ?? 0,
  };
}

export function renderDelays(delayData: DelayOvertimeData) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex items-center gap-1">
        <span className="text-gray-500">Entrada:</span>
        <span className="font-medium text-red-600">
          {formatSecondsToTime(delayData.entrada)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">Colación:</span>
        <span className="font-medium text-red-600">
          {formatSecondsToTime(delayData.colacion)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">Salida:</span>
        <span className="font-medium text-red-600">
          {formatSecondsToTime(delayData.salida)}
        </span>
      </div>
    </div>
  );
}

export function renderOvertime(overtimeData: DelayOvertimeData) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex items-center gap-1">
        <span className="text-gray-500">Entrada:</span>
        <span className="font-medium text-green-600">
          {formatSecondsToTime(overtimeData.entrada)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">Colación:</span>
        <span className="font-medium text-green-600">
          {formatSecondsToTime(overtimeData.colacion)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">Salida:</span>
        <span className="font-medium text-green-600">
          {formatSecondsToTime(overtimeData.salida)}
        </span>
      </div>
    </div>
  );
}
