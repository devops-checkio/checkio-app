"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { CHEKIOButton } from "./CHEKIOButton";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, Loader2 } from "lucide-react";

export type CHEKIOStatCardVariant =
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "cyan";

export type CHEKIOStatCardLayout =
  | "default"
  | "outline"
  | "compact"
  | "minimal";

const VARIANT_STYLES: Record<
  CHEKIOStatCardVariant,
  {
    bg: string;
    buttonBg: string;
    iconBg: string;
    text: string;
    border: string;
    lightBg: string;
  }
> = {
  blue: {
    bg: "#3b82f6",
    buttonBg: "#2563eb",
    iconBg: "rgba(255,255,255,0.15)",
    text: "#1e40af",
    border: "#2563eb",
    lightBg: "rgba(59,130,246,0.08)",
  },
  green: {
    bg: "#10b981",
    buttonBg: "#059669",
    iconBg: "rgba(255,255,255,0.15)",
    text: "#047857",
    border: "#059669",
    lightBg: "rgba(16,185,129,0.08)",
  },
  orange: {
    bg: "#f59e0b",
    buttonBg: "#d97706",
    iconBg: "rgba(255,255,255,0.15)",
    text: "#b45309",
    border: "#d97706",
    lightBg: "rgba(245,158,11,0.08)",
  },
  red: {
    bg: "#ef4444",
    buttonBg: "#dc2626",
    iconBg: "rgba(255,255,255,0.15)",
    text: "#b91c1c",
    border: "#dc2626",
    lightBg: "rgba(239,68,68,0.08)",
  },
  cyan: {
    bg: "#06b6d4",
    buttonBg: "#0891b2",
    iconBg: "rgba(255,255,255,0.15)",
    text: "#0e7490",
    border: "#0891b2",
    lightBg: "rgba(6,182,212,0.08)",
  },
};

export interface CHEKIOStatCardProps {
  title: string;
  value: number | string;
  variant: CHEKIOStatCardVariant;
  icon?: LucideIcon;
  /** Optional secondary text (e.g. "en el período seleccionado") */
  subtitle?: string;
  /** Layout visual: default (filled), outline, compact, minimal */
  layout?: CHEKIOStatCardLayout;
  isLoading?: boolean;
  /** Delay in ms before starting count-up (sync with card entrance animation). */
  countUpDelayMs?: number;
  onView?: () => void;
  viewLabel?: string;
}

const COUNT_UP_DURATION_MS = 650;

export function CHEKIOStatCard({
  title,
  value,
  variant,
  icon: Icon,
  subtitle,
  layout = "default",
  isLoading = false,
  countUpDelayMs = 0,
  onView,
  viewLabel = "Ver",
}: CHEKIOStatCardProps) {
  const styles = VARIANT_STYLES[variant];
  const isNumeric = typeof value === "number";
  const countUpValue = useCountUp(
    isNumeric ? (value as number) : 0,
    COUNT_UP_DURATION_MS,
    countUpDelayMs,
    isNumeric && !isLoading,
  );
  const displayValue =
    isLoading ? null : isNumeric ? countUpValue : (value as string);

  const isLight = layout === "outline" || layout === "minimal";
  const valueColor = isLight ? styles.text : "white";
  const titleColor = isLight ? "text-gray-600" : "text-white/95";
  const iconColor = isLight ? styles.text : styles.iconBg;
  const iconOpacity = isLight ? "opacity-20" : "opacity-40";

  if (layout === "compact") {
    return (
      <div
        className="relative overflow-hidden rounded-lg p-4 shadow-sm transition-all duration-300 ease-out hover:shadow-md flex items-center gap-4"
        style={{ backgroundColor: styles.bg }}
      >
        {Icon && (
          <div className={`flex-shrink-0 ${iconOpacity}`} style={{ color: iconColor }}>
            <Icon className="h-10 w-10" strokeWidth={0.5} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p
            className="text-xl font-bold tabular-nums truncate"
            style={{ color: valueColor }}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: valueColor }} />
            ) : (
              displayValue
            )}
          </p>
          <p className={`text-sm font-medium truncate ${titleColor}`}>{title}</p>
          {subtitle && (
            <p className={`text-xs truncate ${titleColor} opacity-90`}>{subtitle}</p>
          )}
        </div>
        {onView && viewLabel && (
          <CHEKIOButton
            className="flex-shrink-0 border-0 text-white hover:opacity-90"
            style={{ backgroundColor: styles.buttonBg }}
            size="sm"
            onClick={onView}
          >
            {viewLabel}
            <ChevronRight className="h-4 w-4" />
          </CHEKIOButton>
        )}
      </div>
    );
  }

  if (layout === "outline") {
    return (
      <div
        className="relative overflow-hidden rounded-lg p-6 shadow-sm transition-all duration-300 ease-out hover:shadow-md bg-white border-2"
        style={{ borderColor: styles.border }}
      >
        {Icon && (
          <div
            className={`absolute right-4 top-4 ${iconOpacity}`}
            style={{ color: iconColor }}
          >
            <Icon className="h-14 w-14" strokeWidth={0.5} />
          </div>
        )}
        <div className="relative flex flex-col gap-4">
          <p
            className="text-3xl font-bold tabular-nums"
            style={{ color: valueColor }}
          >
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: valueColor }} />
            ) : (
              displayValue
            )}
          </p>
          <p className={`text-sm font-medium ${titleColor}`}>{title}</p>
          {subtitle && (
            <p className={`text-xs ${titleColor} opacity-90`}>{subtitle}</p>
          )}
          {onView && viewLabel && (
            <CHEKIOButton
              className="w-full justify-center gap-1.5 border-0 text-white hover:opacity-90"
              style={{ backgroundColor: styles.buttonBg }}
              size="sm"
              onClick={onView}
            >
              {viewLabel}
              <ChevronRight className="h-4 w-4" />
            </CHEKIOButton>
          )}
        </div>
      </div>
    );
  }

  if (layout === "minimal") {
    return (
      <div
        className="relative overflow-hidden rounded-lg p-6 shadow-sm transition-all duration-300 ease-out hover:shadow-md border border-gray-200"
        style={{ backgroundColor: styles.lightBg }}
      >
        {Icon && (
          <div
            className={`absolute right-4 top-4 ${iconOpacity}`}
            style={{ color: iconColor }}
          >
            <Icon className="h-12 w-12" strokeWidth={0.5} />
          </div>
        )}
        <div className="relative flex flex-col gap-3">
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ color: valueColor }}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: valueColor }} />
            ) : (
              displayValue
            )}
          </p>
          <p className={`text-sm font-medium ${titleColor}`}>{title}</p>
          {subtitle && (
            <p className={`text-xs ${titleColor} opacity-90`}>{subtitle}</p>
          )}
          {onView && viewLabel && (
            <CHEKIOButton
              variant="secondaryBlue"
              className="w-full justify-center gap-1.5"
              size="sm"
              onClick={onView}
            >
              {viewLabel}
              <ChevronRight className="h-4 w-4" />
            </CHEKIOButton>
          )}
        </div>
      </div>
    );
  }

  // default
  return (
    <div
      className="relative overflow-hidden rounded-md p-6 shadow-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md"
      style={{ backgroundColor: styles.bg }}
    >
      {Icon && (
        <div
          className="absolute right-4 top-4 opacity-40"
          style={{ color: styles.iconBg }}
        >
          <Icon className="h-16 w-16" strokeWidth={0.5} />
        </div>
      )}
      <div className="relative flex flex-col gap-4">
        <p className="text-3xl font-bold text-white tabular-nums">
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          ) : (
            displayValue
          )}
        </p>
        <p className="text-sm font-medium text-white/95">{title}</p>
        {subtitle && (
          <p className="text-xs text-white/80">{subtitle}</p>
        )}
        {onView && viewLabel && (
          <CHEKIOButton
            className="w-full justify-center gap-1.5 border-0 text-white hover:opacity-90"
            style={{ backgroundColor: styles.buttonBg }}
            size="sm"
            onClick={onView}
          >
            {viewLabel}
            <ChevronRight className="h-4 w-4" />
          </CHEKIOButton>
        )}
      </div>
    </div>
  );
}
