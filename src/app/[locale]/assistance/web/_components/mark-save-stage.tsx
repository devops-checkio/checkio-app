"use client";

import {
  EmployeeDeviceResponseDto,
  PossibleMarkToDoDto,
} from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import { useToast } from "@/hooks/use-toast";
import { useCreateMark } from "@/service/mantainer.service";
import { Check, Home, ImageUp, Loader2, Save, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import StepIndicator from "./step-indicator";
import { LocationData, MarkingStage } from "./web-marking.dto";

enum SaveStep {
  UPLOADING = 0,
  CREATING = 1,
  REDIRECTING = 2,
}

interface MarkSaveStageProps {
  photo: string;
  mark: PossibleMarkToDoDto;
  employeeShift: EmployeeDeviceResponseDto;
  onComplete: () => void;
  locationData: LocationData | null;
}

const SAVE_STEPS = [
  { key: SaveStep.UPLOADING, icon: ImageUp, label: "uploadingImage" },
  { key: SaveStep.CREATING, icon: Save, label: "creatingMark" },
  { key: SaveStep.REDIRECTING, icon: Home, label: "redirectingHome" },
] as const;

export default function MarkSaveStage({
  photo,
  mark,
  employeeShift,
  onComplete,
  locationData,
}: MarkSaveStageProps) {
  const t = useTranslations("webMarking");
  const router = useRouter();
  const { toast } = useToast();
  const { mutate: createMark } = useCreateMark();
  const [showConfetti, setShowConfetti] = useState(false);
  const hasProcessedRef = useRef(false);
  const [currentStep, setCurrentStep] = useState<SaveStep>(SaveStep.UPLOADING);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const uploadImageToS3 = async (
    imageDataUrl: string,
    uploadUrl: string
  ): Promise<void> => {
    try {
      const base64Data = imageDataUrl.split(",")[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/jpeg" });

      const xhr = new XMLHttpRequest();

      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });
        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"));
        });
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", "image/jpeg");
        xhr.send(blob);
      });
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      throw error;
    }
  };

  const handleSave = useCallback(async () => {
    if (hasProcessedRef.current) {
      return;
    }
    hasProcessedRef.current = true;

    try {
      setCurrentStep(SaveStep.UPLOADING);

      const markToSave = {
        scheduleId: mark.scheduleId,
        withDiscount: mark.withDiscount,
        scheduleBreakId: mark.scheduleBreakId,
        isAditional: mark.isAditional,
        time: mark.time,
        type: mark.type,
        automaticMark:
          typeof mark.automaticMark === "boolean" ? mark.automaticMark : false,
        authorizedZones:
          employeeShift.authorizedZones &&
          Array.isArray(employeeShift.authorizedZones) &&
          employeeShift.authorizedZones.length > 0 &&
          employeeShift.authorizedZones.some(
            (zone) =>
              zone &&
              typeof zone === "object" &&
              zone.id &&
              zone.latitude &&
              zone.longitude
          )
            ? employeeShift.authorizedZones.filter(
                (zone) =>
                  zone &&
                  typeof zone === "object" &&
                  zone.id &&
                  zone.latitude &&
                  zone.longitude
              )
            : undefined,
        isWithinAuthorizedZone: employeeShift.isWithinAuthorizedZone,
        isWithinWithMargin: employeeShift.isWithinWithMargin,
        latitude: locationData?.latitude ?? undefined,
        longitude: locationData?.longitude ?? undefined,
      };

      if (photo && employeeShift.uploadUrl) {
        try {
          await uploadImageToS3(photo, employeeShift.uploadUrl);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          toast({
            title: t("markingError"),
            description:
              t("imageUploadError") ||
              "Error al subir la imagen. Por favor, intente nuevamente.",
            variant: "destructive",
          });
          return;
        }
      }

      setCurrentStep(SaveStep.CREATING);

      await new Promise<void>((resolve, reject) => {
        createMark(
          {
            mark: markToSave as any,
            assistanceId: employeeShift.assistanceId,
            attemptMarkId: employeeShift.attemptMarkId,
          },
          {
            onSuccess: () => {
              resolve();
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });

      setCurrentStep(SaveStep.REDIRECTING);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);

      toast({
        title: t("successfulMarking"),
        description: t("successfulMarkingDescription"),
      });

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      hasProcessedRef.current = false;
      console.error("Error creating mark:", error);
      toast({
        title: t("markingError"),
        description: t("markingErrorDescription"),
        variant: "destructive",
      });
    }
  }, [photo, mark, employeeShift, locationData, createMark, router, toast, t]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    if (!hasProcessedRef.current) {
      handleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}
      <div className="w-full h-[80vh] bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100/80 bg-white/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                  {t("markingInProgress") || "Marcación en Progreso"}
                </h2>
                <p className="text-xs text-gray-500">
                  {t("processingMarking") || "Procesando marcación"}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-700">
              Paso 4 de 4
            </span>
          </div>
          <StepIndicator currentStage={MarkingStage.MARK_SAVE} compact />
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-pulse">
                <Save className="w-10 h-10 text-white" />
              </div>
              <p className="text-sm text-gray-500">
                {t("pleaseWait") || "Por favor espere..."}
              </p>
            </div>

            <div className="space-y-3">
              {SAVE_STEPS.map((step, index) => {
                const isCompleted = currentStep > step.key;
                const isActive = currentStep === step.key;
                const Icon = step.icon;

                return (
                  <div
                    key={step.key}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                      isActive
                        ? "bg-blue-50/80 border border-blue-200/60 shadow-sm"
                        : isCompleted
                          ? "bg-emerald-50/80 border border-emerald-200/60 shadow-sm"
                          : "bg-gray-50/50 border border-gray-100"
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                        isCompleted
                          ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/25"
                          : isActive
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25"
                            : "bg-gray-200"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-white animate-step-check-in" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold transition-colors duration-300 ${
                          isCompleted
                            ? "text-emerald-700"
                            : isActive
                              ? "text-blue-700"
                              : "text-gray-400"
                        }`}
                      >
                        {t(step.label) || step.label}
                      </p>
                      {isActive && (
                        <div className="mt-2 h-1 bg-blue-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-shimmer" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
