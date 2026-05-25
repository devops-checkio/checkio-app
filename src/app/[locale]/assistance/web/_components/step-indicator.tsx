"use client";

import { Camera, Check, Image as ImageIcon, MapPin, Save } from "lucide-react";
import { MarkingStage } from "./web-marking.dto";

const STAGES = [
  { key: MarkingStage.PHOTO_CAPTURE, icon: Camera, label: "Captura" },
  { key: MarkingStage.PHOTO_REVIEW, icon: ImageIcon, label: "Revisión" },
  { key: MarkingStage.MARKS_SEARCH, icon: MapPin, label: "Ubicación" },
  { key: MarkingStage.MARK_SAVE, icon: Save, label: "Guardar" },
] as const;

interface StepIndicatorProps {
  currentStage: MarkingStage;
  compact?: boolean;
}

export default function StepIndicator({
  currentStage,
  compact = false,
}: StepIndicatorProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <div
              key={stage.key}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isCompleted
                  ? "bg-emerald-500 w-6"
                  : isActive
                    ? "bg-blue-500 w-8"
                    : "bg-gray-300"
              }`}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const Icon = stage.icon;

        return (
          <div key={stage.key} className="flex items-center gap-1 sm:gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all duration-500
                  ${
                    isCompleted
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20"
                      : isActive
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-gray-100 text-gray-400"
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 animate-step-check-in" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span
                className={`text-[9px] sm:text-[10px] font-medium transition-colors duration-300 ${
                  isActive
                    ? "text-blue-700"
                    : isCompleted
                      ? "text-emerald-600"
                      : "text-gray-400"
                }`}
              >
                {stage.label}
              </span>
            </div>
            {index < STAGES.length - 1 && (
              <div
                className={`w-4 sm:w-6 h-0.5 rounded-full transition-all duration-500 mb-4 ${
                  index < currentIndex
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
