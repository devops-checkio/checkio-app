import { AlertCircle, Clock } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";

export function renderMarkCell(
  mark:
    | {
        timestamp: string;
        isAditional: boolean;
        hash: string;
        isManual?: boolean;
        adjustmentNote?: string;
        isGenerated?: boolean;
      }
    | null
    | undefined,
  _type: "CHECK_IN" | "CHECK_OUT",
): React.ReactNode {
  const date = mark
    ? DateTime.fromISO(mark.timestamp).toUTC().toFormat("HH:mm:ss")
    : "";

  const getTextClass = () => {
    if (!mark) return "text-red-500 font-medium";
    if (mark.isGenerated) return "text-red-500 font-medium";
    return "font-medium";
  };

  return (
    <div className="flex items-center gap-1 text-sm">
      <span className={getTextClass()}>{mark ? date : "--:--:--"}</span>
      {mark?.isAditional && (
        <div title="Marca adicional">
          <Clock className="h-4 w-4 text-yellow-500" />
        </div>
      )}
      {/* {mark?.isManual && (
        <div title={`Marca manual - ${mark.adjustmentNote}`}>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </div>
      )} */}
      {mark?.hash && (
        <span className="text-xs text-gray-400" title={`Hash: ${mark.hash}`}>
          ✓
        </span>
      )}
    </div>
  );
}

export function renderBreaksCell(
  colacionMarks: any[],
  options?: { textSize?: "xs" | "sm" },
): React.ReactNode {
  const sizeClass = options?.textSize === "xs" ? "text-xs" : "text-sm";

  return (
    <div className={`flex flex-col gap-1 ${sizeClass}`}>
      {colacionMarks.length > 0
        ? colacionMarks.map((col: any, idx: number) => {
            const time = col.timestamp
              ? DateTime.fromISO(col.timestamp).toUTC().toFormat("HH:mm:ss")
              : "--:--:--";
            return (
              <div
                key={col.publicId ?? idx}
                className="flex items-center gap-1"
              >
                <span
                  className={
                    col.isManual ? "text-red-500 font-medium" : "font-medium"
                  }
                >
                  {time}
                </span>
                {col.isManual && (
                  <div title={`Marca manual - ${col.adjustmentNote}`}>
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  </div>
                )}
                {col.hash && (
                  <span
                    className="text-xs text-gray-400"
                    title={`Hash: ${col.hash}`}
                  >
                    ✓
                  </span>
                )}
              </div>
            );
          })
        : "-"}
    </div>
  );
}

export function renderAdditionalMarks(marks: any[]): React.ReactNode {
  const additionalMarks = (marks ?? []).filter((m: any) => m.isAditional);
  const checkInAdditional = additionalMarks.find(
    (m: any) => m.type === "CHECK_IN",
  );
  const checkOutAdditional = additionalMarks.find(
    (m: any) => m.type === "CHECK_OUT",
  );
  const breakAdditional = additionalMarks.filter((m: any) =>
    m.type?.includes("BREAK"),
  );

  const formatMarkTime = (mark: any) => {
    if (!mark) return "--:--:--";
    try {
      return DateTime.fromISO(mark.timestamp).toUTC().toFormat("HH:mm:ss");
    } catch {
      return "--:--:--";
    }
  };

  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex items-center gap-1">
        <span className="text-gray-500">Entrada:</span>
        <span className="font-medium text-green-600">
          {formatMarkTime(checkInAdditional)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">Colación:</span>
        <span className="font-medium text-green-600">
          {breakAdditional.length > 0
            ? `${breakAdditional.length} marca(s)`
            : "--:--:--"}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">Salida:</span>
        <span className="font-medium text-green-600">
          {formatMarkTime(checkOutAdditional)}
        </span>
      </div>
    </div>
  );
}
