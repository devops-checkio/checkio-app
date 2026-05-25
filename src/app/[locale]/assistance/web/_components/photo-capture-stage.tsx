"use client";

import { CHEKIOButton } from "@/components";
import { Camera, HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import CameraViewer from "./camera-viewer";
import StepIndicator from "./step-indicator";
import { MarkingStage } from "./web-marking.dto";

interface PhotoCaptureStageProps {
  requiresPhoto: boolean;
  onPhotoCaptured: (photo: string) => void;
  onOpenInstructions?: () => void;
  currentStage: MarkingStage;
}

export default function PhotoCaptureStage({
  requiresPhoto,
  onPhotoCaptured,
  onOpenInstructions,
  currentStage,
}: PhotoCaptureStageProps) {
  const t = useTranslations("webMarking");

  return (
    <div className="w-full h-[80vh] bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100/80 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                {t("camera") || "Cámara"}
              </h2>
              <p className="text-xs text-gray-500">
                {requiresPhoto
                  ? t("photoGuide.title") || "Posicione su rostro en el centro"
                  : "Marcación sin foto requerida"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-xs font-semibold text-blue-700">
              Paso 1 de 4
            </span>
            {onOpenInstructions && (
              <button
                onClick={onOpenInstructions}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">{t("help") || "Ayuda"}</span>
              </button>
            )}
          </div>
        </div>
        <StepIndicator currentStage={currentStage} compact />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <CameraViewer
          requiresPhoto={requiresPhoto}
          onPhotoCapture={onPhotoCaptured}
        />
      </div>
    </div>
  );
}
