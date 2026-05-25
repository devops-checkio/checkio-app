"use client";

import { CHEKIOButton } from "@/components";
import { useShiftEditorTour } from "@/hooks/useShiftEditorTour";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface ShiftEditorLayoutProps {
  title: string;
  breadcrumbs: string[];
  canShowTour: boolean;
  children: React.ReactNode;
}

export function ShiftEditorLayout({
  title,
  breadcrumbs,
  canShowTour,
  children,
}: ShiftEditorLayoutProps) {
  const t = useTranslations("mantainers.shifts");
  const { startTour } = useShiftEditorTour();
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <CHEKIOButton
                type="button"
                variant="secondaryBlue"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg p-0"
                onClick={() => router.push("/mantainers/shifts")}
                aria-label="Volver al listado de turnos"
              >
                <ChevronLeft className="h-4 w-4" />
              </CHEKIOButton>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                  {title}
                </h1>
                {breadcrumbs.length > 0 && (
                  <nav
                    className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500"
                    aria-label="Breadcrumb"
                  >
                    {breadcrumbs.map((crumb, index) => (
                      <span key={index} className="flex items-center gap-1.5">
                        {index > 0 && (
                          <ChevronRight
                            className="h-4 w-4 shrink-0 text-gray-400"
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
              </div>
            </div>
            <CHEKIOButton
              variant="secondaryBlue"
              onClick={() => startTour()}
              disabled={!canShowTour}
              title={!canShowTour ? t("form.loading") : undefined}
              className="flex shrink-0 items-center gap-2 self-start sm:self-auto"
            >
              <HelpCircle className="h-4 w-4" />
              {t("editorTour.startButton")}
            </CHEKIOButton>
          </div>
          <div className="p-5 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
