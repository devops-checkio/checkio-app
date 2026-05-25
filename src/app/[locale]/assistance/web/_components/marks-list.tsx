"use client";

import { PossibleMarkToDoDto } from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import { CirclePlus, Clock, Coffee, LogIn, LogOut } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { sortPossibleMarks } from "./order-possible-marks";

interface MarksListProps {
  marks: PossibleMarkToDoDto[];
  onMarkSelect: (mark: PossibleMarkToDoDto) => void;
  disabled?: boolean;
}

export default function MarksList({
  marks,
  onMarkSelect,
  disabled = false,
}: MarksListProps) {
  const t = useTranslations("webMarking");

  const sortedMarks = useMemo(() => sortPossibleMarks(marks), [marks]);

  const getMarkLabel = (mark: PossibleMarkToDoDto): string => {
    const typeCheck =
      mark.type === "CHECK_IN" ? t("shiftEntry") : t("shiftExit");

    if (mark.scheduleId) {
      if (mark.scheduleBreakId) {
        return mark.type === "CHECK_IN" ? t("breakEntry") : t("breakExit");
      } else if (mark.isAditional) {
        return mark.type === "CHECK_IN"
          ? t("additionalEntry")
          : t("additionalExit");
      }
    }
    return typeCheck;
  };

  const getMarkIcon = (mark: PossibleMarkToDoDto) => {
    if (mark.scheduleId) {
      if (mark.scheduleBreakId) {
        return <Coffee className="w-7 h-7 text-white" />;
      } else if (mark.isAditional) {
        return <CirclePlus className="w-7 h-7 text-white" />;
      }
    }
    return mark.type === "CHECK_IN" ? (
      <LogIn className="w-7 h-7 text-white" />
    ) : (
      <LogOut className="w-7 h-7 text-white" />
    );
  };

  const getMarkStyles = (mark: PossibleMarkToDoDto) => {
    if (mark.scheduleId) {
      if (mark.scheduleBreakId) {
        return {
          gradient: "from-purple-500 to-pink-600",
          iconBg: "bg-white/20",
        };
      } else if (mark.isAditional) {
        return {
          gradient: "from-blue-500 to-indigo-600",
          iconBg: "bg-white/20",
        };
      }
    }
    if (mark.type === "CHECK_IN" && mark.isAditional == false) {
      return {
        gradient: "from-emerald-500 to-teal-600",
        iconBg: "bg-white/20",
      };
    }

    if (mark.type === "CHECK_OUT" && mark.isAditional == false) {
      return {
        gradient: "from-orange-500 to-red-600",
        iconBg: "bg-white/20",
      };
    }
    if (mark.type === "CHECK_IN" && mark.isAditional == true) {
      return {
        gradient: "from-purple-500 to-pink-600",
        iconBg: "bg-white/20",
      };
    }

    if (mark.type === "CHECK_OUT" && mark.isAditional == true) {
      return {
        gradient: "from-purple-500 to-pink-600",
        iconBg: "bg-white/20",
      };
    }
  };

  const formatTime = (time: string) => {
    try {
      const dateTime = DateTime.fromISO(time, { zone: "utc" });
      if (!dateTime.isValid) return time;
      return dateTime.setLocale("es-ES").toFormat("HH:mm");
    } catch {
      return time;
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-gray-700 tracking-tight">
        {t("availableMarks") || "Marcaciones Disponibles"}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sortedMarks.map((mark, index) => {
          const styles = getMarkStyles(mark);
          const icon = getMarkIcon(mark);
          const label = getMarkLabel(mark);

          return (
            <button
              key={index}
              onClick={() => !disabled && onMarkSelect(mark)}
              disabled={disabled}
              className={`
                animate-mark-card-in
                relative overflow-hidden rounded-2xl bg-gradient-to-br ${styles?.gradient || "from-emerald-500 to-teal-600"}
                p-5 shadow-xl hover:shadow-2xl transition-all duration-300
                transform hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                text-left w-full group ring-1 ring-white/10
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`${styles?.iconBg || "bg-white/20"} p-3 rounded-xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110`}
                >
                  {icon}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white mb-1.5 truncate">
                    {mark.title || label}
                  </h3>

                  <div className="flex items-center gap-3 flex-wrap">
                    {mark.time && (
                      <div className="flex items-center gap-1.5 text-white/90">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-sm font-semibold">
                          {formatTime(mark.time)}
                        </span>
                      </div>
                    )}

                    {mark.isAditional && (
                      <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white rounded-lg text-[11px] font-semibold border border-white/20">
                        {t("additional") || "Adicional"}
                      </span>
                    )}
                    {mark.scheduleBreakId && (
                      <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white rounded-lg text-[11px] font-semibold border border-white/20">
                        {t("break") || "Descanso"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hover shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
