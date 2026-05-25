"use client";

import { CHEKIOButton } from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

export type CHEKIOHeaderVariant =
  | "default"
  | "minimal"
  | "elevated"
  | "accent"
  | "gradient";

interface CHEKIOHeaderProps {
  breadcrumbs?: string[];
  className?: string;
  actions?: React.ReactNode;
  onBack?: () => void;
  /**
   * `compact` = botón gris/blanco (por defecto, mismo criterio que detalle de empresa).
   * `secondaryBlue` = mismo estilo que el botón «volver» en detalle de sucursal.
   */
  backStyle?: "compact" | "secondaryBlue";
  /** Para `secondaryBlue`: texto accesible del botón atrás */
  backAriaLabel?: string;
  title?: string;
  subtitle?: string;
  variant?: CHEKIOHeaderVariant;
  /** Icono decorativo de fondo (estilo CHEKIOStatCard), se muestra grande y con baja opacidad */
  icon?: LucideIcon;
}

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <CHEKIOButton type="button" variant="outline" size="sm" onClick={onClick}>
    <ArrowLeft className="h-4 w-4" />
    Regresar
  </CHEKIOButton>
);

const BackButtonCompact = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center justify-center h-9 w-9 shrink-0 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1"
    aria-label="Regresar"
  >
    <ArrowLeft className="h-4 w-4" />
  </button>
);

/** Igual que `branches/[branchId]`: `CHEKIOButton` secondaryBlue + ChevronLeft. */
const BackButtonSecondaryBlue = ({
  onClick,
  ariaLabel = "Regresar",
}: {
  onClick: () => void;
  ariaLabel?: string;
}) => (
  <CHEKIOButton
    type="button"
    variant="secondaryBlue"
    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg p-0"
    onClick={onClick}
    aria-label={ariaLabel}
  >
    <ChevronLeft className="h-4 w-4" />
  </CHEKIOButton>
);

const BreadcrumbNav = ({
  breadcrumbs,
  subtitle,
  className,
}: {
  breadcrumbs: string[];
  subtitle?: string;
  className?: string;
}) => (
  <div
    className={cn(
      "mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500",
      className,
    )}
  >
    {breadcrumbs.length > 0 && (
      <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight
                className="h-4 w-4 text-gray-400 shrink-0"
                aria-hidden
              />
            )}
            <span
              className={
                index === breadcrumbs.length - 1
                  ? "font-medium text-gray-700"
                  : ""
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>
    )}
    {breadcrumbs.length > 0 && subtitle && (
      <span className="text-gray-400">•</span>
    )}
    {subtitle && <span>{subtitle}</span>}
  </div>
);

const ActionsBar = ({
  onBack,
  actions,
}: {
  onBack?: () => void;
  actions?: React.ReactNode;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
    {onBack && <BackButton onClick={onBack} />}
    {actions && (
      <div
        className={cn(
          "flex items-center gap-2 flex-wrap",
          onBack ? "ml-auto" : "w-full justify-end",
        )}
      >
        {actions}
      </div>
    )}
  </div>
);

export function CHEKIOHeader({
  breadcrumbs = [],
  className = "",
  actions,
  onBack,
  backStyle = "compact",
  backAriaLabel,
  title,
  subtitle,
  variant = "default",
  icon: Icon,
}: CHEKIOHeaderProps) {
  const { getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const primaryColor = templateUser?.primary ?? "#eb1d2e";

  const logo = (
    <Image
      width={28}
      height={28}
      src="/logos/logo.svg"
      alt="CheckIO"
      className="h-7 w-auto shrink-0"
    />
  );

  // Variant: default - limpio y profesional
  if (variant === "default") {
    return (
      <header className={cn("mb-6 border-b border-gray-200 pb-4", className)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
            {onBack &&
              (backStyle === "secondaryBlue" ? (
                <BackButtonSecondaryBlue
                  onClick={onBack}
                  ariaLabel={backAriaLabel}
                />
              ) : (
                <BackButtonCompact onClick={onBack} />
              ))}
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight sm:text-2xl">
                  {title}
                </h1>
              )}
              {(breadcrumbs.length > 0 || subtitle) && (
                <BreadcrumbNav breadcrumbs={breadcrumbs} subtitle={subtitle} />
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {actions}
            {logo}
          </div>
        </div>
      </header>
    );
  }

  // Variant: minimal - ultra limpio, sin bordes
  if (variant === "minimal") {
    return (
      <header className={cn("mb-8", className)}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="flex-1 min-w-0 space-y-1">
            {title && (
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 tracking-tight">
                {title}
              </h1>
            )}
            {(breadcrumbs.length > 0 || subtitle) && (
              <BreadcrumbNav
                breadcrumbs={breadcrumbs}
                subtitle={subtitle}
                className="text-gray-400"
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {onBack && <BackButton onClick={onBack} />}
            {actions}
            {(onBack || actions) && (
              <div className="hidden sm:block w-px h-8 bg-gray-200" />
            )}
            {logo}
          </div>
        </div>
      </header>
    );
  }

  // Variant: elevated - card con sombra
  if (variant === "elevated") {
    return (
      <header className={cn("mb-6", className)}>
        <div
          className={cn(
            "rounded-xl bg-white border border-gray-100 shadow-sm px-5 py-5 sm:px-6 sm:py-6",
            Icon && "relative overflow-hidden",
          )}
        >
          {Icon && (
            <div
              className="absolute right-4 top-4 text-gray-200/60"
              aria-hidden
            >
              <Icon className="h-20 w-20 sm:h-24 sm:w-24" strokeWidth={0.5} />
            </div>
          )}
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex flex-1 min-w-0 items-start gap-3 sm:items-center">
              {onBack &&
                (backStyle === "secondaryBlue" ? (
                  <BackButtonSecondaryBlue
                    onClick={onBack}
                    ariaLabel={backAriaLabel}
                  />
                ) : (
                  <BackButtonCompact onClick={onBack} />
                ))}
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
                    {title}
                  </h1>
                )}
                {(breadcrumbs.length > 0 || subtitle) && (
                  <BreadcrumbNav
                    breadcrumbs={breadcrumbs}
                    subtitle={subtitle}
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              {actions}
              {actions && <div className="h-8 w-px bg-gray-100" />}
              {logo}
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Variant: accent - franja lateral de color
  if (variant === "accent") {
    return (
      <header className={cn("mb-6", className)}>
        <div className="flex gap-4">
          <div
            className="w-1 rounded-full shrink-0"
            style={{ backgroundColor: primaryColor }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="flex-1 min-w-0">
                {title && (
                  <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
                    {title}
                  </h1>
                )}
                {(breadcrumbs.length > 0 || subtitle) && (
                  <BreadcrumbNav
                    breadcrumbs={breadcrumbs}
                    subtitle={subtitle}
                  />
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {actions}
                {logo}
              </div>
            </div>
            {onBack && (
              <div className="mt-4">
                <BackButton onClick={onBack} />
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  // Variant: gradient - fondo suave degradado
  if (variant === "gradient") {
    return (
      <header className={cn("mb-6", className)}>
        <div
          className="rounded-2xl px-5 py-6 sm:px-6 sm:py-8"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}03 50%, transparent 100%)`,
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
                  {title}
                </h1>
              )}
              {(breadcrumbs.length > 0 || subtitle) && (
                <BreadcrumbNav breadcrumbs={breadcrumbs} subtitle={subtitle} />
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
              {onBack && <BackButton onClick={onBack} />}
              {actions}
              {(onBack || actions) && (
                <div className="h-8 w-px bg-gray-200/80" />
              )}
              {logo}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return null;
}
