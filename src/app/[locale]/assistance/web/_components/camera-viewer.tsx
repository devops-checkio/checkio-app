"use client";

import { CHEKIOButton } from "@/components";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Camera, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

interface CameraViewerProps {
  requiresPhoto: boolean;
  onPhotoCapture: (photo: string) => void;
}

export default function CameraViewer({
  requiresPhoto,
  onPhotoCapture,
}: CameraViewerProps) {
  const t = useTranslations("webMarking");
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countdownSeconds = 2;
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const strategies = [
          () => `${window.location.origin}/models`,
          () => "/models",
          () => {
            const path = window.location.pathname;
            if (path.includes("/es/")) return "../models";
            if (path.includes("/en/")) return "../models";
            if (path.includes("/pt/")) return "../models";
            return "/models";
          },
        ];

        for (let i = 0; i < strategies.length; i++) {
          const strategy = strategies[i];
          const modelsPath = strategy();

          try {
            const manifestUrl = `${modelsPath}/ssd_mobilenetv1_model-weights_manifest.json`;
            const manifestResponse = await fetch(manifestUrl);

            if (manifestResponse.ok) {
              await faceapi.nets.ssdMobilenetv1.loadFromUri(modelsPath);
              setModelsLoaded(true);
              return;
            }
          } catch (strategyError) {
            console.error(`Strategy ${i + 1} failed:`, strategyError);
            continue;
          }
        }
        setModelsLoaded(false);
      } catch (error) {
        console.error("Error loading models:", error);
        setModelsLoaded(false);
      }
    };

    let retries = 0;
    const maxRetries = 2;
    const loadWithRetry = async () => {
      while (retries < maxRetries) {
        await loadModels();
        if (modelsLoaded) return;
        retries++;
        if (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    };

    loadWithRetry();
  }, []);

  const detectFace = useCallback(async () => {
    if (!webcamRef.current?.video || !modelsLoaded) {
      return;
    }

    try {
      if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
        return;
      }

      const detection = await faceapi.detectSingleFace(
        webcamRef.current.video,
        new faceapi.SsdMobilenetv1Options()
      );

      if (detection) {
        setFaceDetected(true);
        setProgress((prev) => {
          const newProgress = Math.min(100, prev + 100 / (countdownSeconds * 10));
          return newProgress;
        });
      } else {
        setFaceDetected(false);
        setProgress(0);
      }
    } catch (error) {
      console.error("Error detecting face:", error);
      setFaceDetected(false);
      setProgress(0);
    }
  }, [modelsLoaded, countdownSeconds]);

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
    if (!modelsLoaded || !webcamRef.current?.video || !requiresPhoto) {
      return;
    }

    const interval = setInterval(detectFace, 100);
    return () => clearInterval(interval);
  }, [modelsLoaded, detectFace, requiresPhoto]);

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) {
      return;
    }

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const video = webcamRef.current?.video;
        if (video?.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
        }
        onPhotoCapture(imageSrc);
        setFaceDetected(false);
        setProgress(0);
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
    }
  }, [onPhotoCapture]);

  useEffect(() => {
    if (progress >= 100 && faceDetected) {
      handleCapture();
    }
  }, [progress, faceDetected, handleCapture]);

  const faceGuideSize = windowSize.width < 400 ? 220 : 280;
  const circleCenter = faceGuideSize / 2;
  const circleRadius = circleCenter - 2;

  const faceGuideStyles = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: `${faceGuideSize}px`,
    height: `${faceGuideSize}px`,
    border: faceDetected ? "4px solid" : "4px dashed",
    borderColor: faceDetected
      ? `rgba(34, 197, 94, ${Math.max(0.8, progress / 100)})`
      : "rgba(59, 130, 246, 0.8)",
    borderRadius: "50%",
    pointerEvents: "none" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    boxShadow: faceDetected
      ? "0 0 30px rgba(34, 197, 94, 0.6), inset 0 0 30px rgba(34, 197, 94, 0.2), 0 0 60px rgba(34, 197, 94, 0.4)"
      : "0 0 25px rgba(59, 130, 246, 0.5), inset 0 0 25px rgba(59, 130, 246, 0.2), 0 0 50px rgba(59, 130, 246, 0.3)",
    animation: !faceDetected
      ? "pulse 2s ease-in-out infinite"
      : "zoomIn 0.3s ease-out",
  };

  const circleProgress = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: `${faceGuideSize}px`,
    height: `${faceGuideSize}px`,
  };

  if (!requiresPhoto) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl overflow-hidden w-full h-full max-h-[600px] flex items-center justify-center shadow-2xl">
          <div className="text-center p-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CheckCircleIcon className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold mb-2 tracking-tight">
              Marcación Sin Foto
            </h3>
            <p className="text-emerald-100">
              No se requiere captura de imagen
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex-1 min-h-0 relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl mb-4 ring-1 ring-black/10">
        <Webcam
          ref={webcamRef}
          className="w-full h-full object-cover rounded-2xl"
          mirrored={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Skeleton loading while models load */}
        {!modelsLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md rounded-2xl">
            <div className="text-center space-y-4 p-6">
              <div className="w-20 h-20 mx-auto rounded-full border-4 border-white/20 border-t-blue-400 animate-spin" />
              <div className="space-y-2">
                <p className="text-base font-semibold text-white">
                  Cargando detección facial...
                </p>
                <p className="text-sm text-white/60">Por favor espere</p>
              </div>
              <div className="w-48 mx-auto">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-shimmer" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overlay around face guide */}
        {modelsLoaded && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, transparent ${circleRadius + 10}px, rgba(0, 0, 0, 0.5) ${circleRadius + 40}px, rgba(0, 0, 0, 0.4) 100%)`,
            }}
          />
        )}

        {/* Visual Guide */}
        {modelsLoaded && (
          <>
            <div style={faceGuideStyles as React.CSSProperties}>
              <div className="flex flex-col items-center justify-center">
                <User className="w-16 h-16 text-white/40 mb-2" />
                <div className="text-white/60 text-sm font-medium text-center">
                  {faceDetected
                    ? "✓ Rostro detectado"
                    : "Posicione su rostro aquí"}
                </div>
              </div>
            </div>

            {/* Circular Progress */}
            <svg style={circleProgress as React.CSSProperties}>
              <circle
                cx={circleCenter}
                cy={circleCenter}
                r={circleRadius}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="3"
              />
              <circle
                cx={circleCenter}
                cy={circleCenter}
                r={circleRadius}
                fill="none"
                stroke={faceDetected ? "rgb(34, 197, 94)" : "rgb(59, 130, 246)"}
                strokeWidth="4"
                strokeDasharray={`${
                  2 * Math.PI * circleRadius * (progress / 100)
                } ${2 * Math.PI * circleRadius}`}
                transform={`rotate(-90 ${circleCenter} ${circleCenter})`}
                style={{
                  transition: "stroke-dasharray 0.1s linear",
                }}
                strokeLinecap="round"
              />
            </svg>

            {/* Status Indicator */}
            <div className="absolute top-4 left-0 right-0 text-center">
              <div
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold backdrop-blur-md transition-all duration-300 shadow-lg ${
                  faceDetected
                    ? "bg-emerald-500/90 text-white"
                    : "bg-blue-500/90 text-white"
                }`}
              >
                {faceDetected ? (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    {t("maintainPosition", {
                      seconds: Math.ceil(
                        countdownSeconds * (1 - progress / 100)
                      ),
                    })}
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {t("centerFace")}
                  </>
                )}
              </div>
            </div>

            {/* Contextual positioning instructions */}
            <div className="absolute bottom-6 left-0 right-0 text-center z-10">
              <div className="inline-block bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-xl shadow-lg border border-white/50">
                <p className="text-sm font-medium text-gray-700">
                  {faceDetected
                    ? t("faceDetectedInstruction") ||
                      "Mantenga su posición. La foto se capturará automáticamente..."
                    : t("positionFaceInstruction") ||
                      "Alinee su rostro dentro del círculo guía para continuar"}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 space-y-3">
        {!modelsLoaded && (
          <div className="text-center p-3 bg-amber-50/80 backdrop-blur-sm border border-amber-200/80 rounded-xl">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xs font-medium text-amber-700 mb-0.5">
              {t("faceDetectionUnavailable") ||
                "Detección facial no disponible"}
            </p>
            <p className="text-xs text-amber-600">
              {t("useManualCapture") || "Por favor use captura manual"}
            </p>
          </div>
        )}

        {modelsLoaded && !faceDetected && (
          <div className="text-center p-2 bg-red-50/80 backdrop-blur-sm border border-red-200/80 rounded-xl">
            <p className="text-xs font-medium text-red-600">
              {t("noFaceDetected")}
            </p>
          </div>
        )}

        <CHEKIOButton
          variant="primary"
          onClick={handleCapture}
          disabled={!webcamRef.current?.video}
          className="w-full h-12 text-base transition-all duration-300 hover:shadow-lg rounded-xl"
        >
          <Camera className="h-4 w-4" />
          {t("manualCapture") || "Captura Manual"}
        </CHEKIOButton>
      </div>
    </div>
  );
}
