"use client";

import { cn } from "@/lib/utils";
import { FileText, Loader2 } from "lucide-react";
import Image from "next/image";

interface CHEKIOLoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "dots" | "pulse" | "modern" | "gradient";
  text?: string;
  className?: string;
}

export function CHEKIOLoading({
  size = "md",
  variant = "modern",
  text,
  className,
}: CHEKIOLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const containerSizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  if (variant === "modern") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4",
          className
        )}
      >
        {/* Modern Professional Loading Animation */}
        <div className={cn("relative", containerSizeClasses[size])}>
          {/* Outer rotating ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 animate-spin"
            style={{
              maskImage:
                "conic-gradient(from 180deg, transparent 20%, black 80%)",
              WebkitMaskImage:
                "conic-gradient(from 180deg, transparent 20%, black 80%)",
            }}
          ></div>

          {/* Inner pulsing core */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse shadow-lg">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400/50 to-purple-500/50 animate-ping"></div>
            </div>
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0">
            <div
              className="absolute top-2 right-4 w-1 h-1 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0s" }}
            ></div>
            <div
              className="absolute bottom-3 left-3 w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.3s" }}
            ></div>
            <div
              className="absolute top-4 left-2 w-1 h-1 bg-emerald-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.6s" }}
            ></div>
          </div>
        </div>

        {text && (
          <div className="text-center">
            <span
              className={cn(
                "font-medium tracking-wide bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent",
                textSizeClasses[size]
              )}
            >
              {text}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === "gradient") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4",
          className
        )}
      >
        {/* Gradient Wave Loading */}
        <div className={cn("relative", containerSizeClasses[size])}>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 backdrop-blur-sm"></div>

          {/* Multiple rotating layers */}
          <div
            className="absolute inset-2 rounded-xl border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 animate-spin opacity-60"
            style={{
              maskImage:
                "linear-gradient(45deg, transparent 30%, black 50%, transparent 70%)",
              WebkitMaskImage:
                "linear-gradient(45deg, transparent 30%, black 50%, transparent 70%)",
              animationDuration: "2s",
            }}
          ></div>

          <div
            className="absolute inset-3 rounded-lg border-2 border-transparent bg-gradient-to-r from-purple-500 to-emerald-500 animate-spin opacity-40"
            style={{
              maskImage:
                "linear-gradient(-45deg, transparent 30%, black 50%, transparent 70%)",
              WebkitMaskImage:
                "linear-gradient(-45deg, transparent 30%, black 50%, transparent 70%)",
              animationDuration: "1.5s",
              animationDirection: "reverse",
            }}
          ></div>

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText
              className={cn("text-blue-600 animate-pulse", sizeClasses[size])}
            />
          </div>
        </div>

        {text && (
          <div className="text-center">
            <span
              className={cn(
                "text-gray-700 font-medium tracking-wide",
                textSizeClasses[size]
              )}
            >
              {text}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <div className="flex gap-2">
          <div
            className={cn(
              "bg-gradient-to-br from-blue-500 to-blue-600 rounded-full animate-bounce shadow-md",
              size === "sm"
                ? "h-2 w-2"
                : size === "md"
                ? "h-2.5 w-2.5"
                : size === "lg"
                ? "h-3 w-3"
                : "h-4 w-4"
            )}
            style={{ animationDelay: "0ms" }}
          />
          <div
            className={cn(
              "bg-gradient-to-br from-purple-500 to-purple-600 rounded-full animate-bounce shadow-md",
              size === "sm"
                ? "h-2 w-2"
                : size === "md"
                ? "h-2.5 w-2.5"
                : size === "lg"
                ? "h-3 w-3"
                : "h-4 w-4"
            )}
            style={{ animationDelay: "150ms" }}
          />
          <div
            className={cn(
              "bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full animate-bounce shadow-md",
              size === "sm"
                ? "h-2 w-2"
                : size === "md"
                ? "h-2.5 w-2.5"
                : size === "lg"
                ? "h-3 w-3"
                : "h-4 w-4"
            )}
            style={{ animationDelay: "300ms" }}
          />
        </div>
        {text && (
          <span
            className={cn(
              "bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent ml-3 font-medium",
              textSizeClasses[size]
            )}
          >
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="relative">
          <div
            className={cn(
              "bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full animate-pulse shadow-xl",
              size === "sm"
                ? "h-4 w-4"
                : size === "md"
                ? "h-6 w-6"
                : size === "lg"
                ? "h-8 w-8"
                : "h-12 w-12"
            )}
          />
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-r from-blue-400/50 via-purple-400/50 to-emerald-400/50 rounded-full animate-ping",
              size === "sm"
                ? "h-4 w-4"
                : size === "md"
                ? "h-6 w-6"
                : size === "lg"
                ? "h-8 w-8"
                : "h-12 w-12"
            )}
          />
        </div>
        {text && (
          <span
            className={cn(
              "bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent ml-4 font-medium",
              textSizeClasses[size]
            )}
          >
            {text}
          </span>
        )}
      </div>
    );
  }

  // Modern spinner variant (default)
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative">
        <Loader2
          className={cn(
            "animate-spin text-blue-600 drop-shadow-lg",
            sizeClasses[size]
          )}
        />
        <div
          className={cn(
            "absolute inset-0 animate-spin text-purple-400/30",
            sizeClasses[size]
          )}
          style={{ animationDirection: "reverse", animationDuration: "3s" }}
        >
          <Loader2 className="w-full h-full" />
        </div>
      </div>
      {text && (
        <span
          className={cn(
            "bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent ml-3 font-medium",
            textSizeClasses[size]
          )}
        >
          {text}
        </span>
      )}
    </div>
  );
}

// Professional full screen loading component
interface CHEKIOFullScreenLoadingProps {
  text?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function CHEKIOFullScreenLoading({
  text = "Procesando documentos...",
  size = "lg",
}: CHEKIOFullScreenLoadingProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      {/* Modern glass container */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-blue-500/10 p-12 max-w-md mx-auto">
        {/* Professional Rubrika Logo */}
        <div className="mb-8 text-center">
          <Image
            src="/logos/logo.svg"
            alt="Checkio"
            width={160}
            height={24}
            className="h-6 w-auto drop-shadow-sm mx-auto"
          />
        </div>

        {/* Enhanced Loading Animation */}
        <div className="text-center mb-8">
          <CHEKIOLoading size={size} variant="modern" />
        </div>

        {/* Professional Loading Text */}
        <div className="text-center">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3 tracking-wide">
            Sistema de Gestión Documental
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">{text}</p>
        </div>

        {/* Modern Progress indicator */}
        <div className="w-full bg-gray-100/80 rounded-full h-2 shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 h-2 rounded-full shadow-sm animate-pulse transition-all duration-1000 ease-out"
            style={{ width: "75%" }}
          >
            <div className="h-full bg-gradient-to-r from-white/30 to-transparent rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Subtle loading steps indicator */}
        <div className="flex justify-center items-center mt-6 gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <div
            className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}

// Professional inline loading component
interface CHEKIOInlineLoadingProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

export function CHEKIOInlineLoading({
  text,
  size = "sm",
}: CHEKIOInlineLoadingProps) {
  return (
    <div className="flex items-center justify-center py-6">
      <CHEKIOLoading size={size} variant="modern" text={text} />
    </div>
  );
}

// Professional document processing loading component
interface CHEKIODocumentProcessingProps {
  text?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showLogo?: boolean;
}

export function CHEKIODocumentProcessing({
  text = "Procesando documento...",
  size = "md",
  showLogo = false,
}: CHEKIODocumentProcessingProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl shadow-blue-500/5">
      {showLogo && (
        <div className="mb-6">
          <Image
            src="/logo-rubrika-iso.svg"
            alt="Rubrika"
            width={120}
            height={18}
            className="h-5 w-auto drop-shadow-sm"
          />
        </div>
      )}

      <CHEKIOLoading size={size} variant="gradient" />

      {text && (
        <p className="text-sm bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent mt-4 text-center font-medium tracking-wide">
          {text}
        </p>
      )}

      {/* Modern document processing steps */}
      <div className="mt-6 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full animate-pulse shadow-md flex items-center justify-center">
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
          <span className="font-medium text-emerald-600">Validando</span>
        </div>

        <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-300 to-blue-300 rounded-full opacity-60"></div>

        <div className="flex flex-col items-center gap-2">
          <div
            className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full animate-pulse shadow-md flex items-center justify-center"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
          <span className="font-medium text-blue-600">Procesando</span>
        </div>

        <div className="w-8 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full opacity-60"></div>

        <div className="flex flex-col items-center gap-2">
          <div
            className="w-3 h-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full animate-pulse shadow-md flex items-center justify-center"
            style={{ animationDelay: "1s" }}
          >
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
          <span className="font-medium text-purple-600">Guardando</span>
        </div>
      </div>
    </div>
  );
}
