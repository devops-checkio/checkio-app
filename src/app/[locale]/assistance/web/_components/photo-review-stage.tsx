"use client";

import { CHEKIOButton } from "@/components";
import { Camera, Check, ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import StepIndicator from "./step-indicator";
import { MarkingStage } from "./web-marking.dto";

interface PhotoReviewStageProps {
  photo: string;
  onAccept: () => void;
  onReject: () => void;
  currentStage: MarkingStage;
}

export default function PhotoReviewStage({
  photo,
  onAccept,
  onReject,
  currentStage,
}: PhotoReviewStageProps) {
  const t = useTranslations("webMarking");

  return (
    <div className="w-full h-[80vh] bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100/80 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                {t("photoCaptured")}
              </h3>
              <p className="text-xs text-gray-500">
                {t("retakePhotoDescription")}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-700">
            Paso 2 de 4
          </span>
        </div>
        <StepIndicator currentStage={currentStage} compact />
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 w-full h-full">
            <img
              src={photo}
              alt="Captura"
              className="w-full h-full object-cover"
            />
            {/* Subtle gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 sm:p-5 border-t border-gray-100/80 bg-white/60 backdrop-blur-sm">
        <div className="flex gap-3">
          <CHEKIOButton
            variant="approve"
            onClick={onAccept}
            className="flex-1 h-12 text-base transition-all duration-200 hover:shadow-lg rounded-xl"
          >
            <Check className="h-4 w-4" />
            {t("accept") || "Aceptar"}
          </CHEKIOButton>
          <CHEKIOButton
            variant="reject"
            onClick={onReject}
            className="flex-1 h-12 text-base transition-all duration-200 hover:shadow-lg rounded-xl"
          >
            <Camera className="h-4 w-4" />
            {t("retakePhoto")}
          </CHEKIOButton>
        </div>
      </div>
    </div>
  );
}
