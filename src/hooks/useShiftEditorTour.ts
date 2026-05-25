"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function useShiftEditorTour() {
  const t = useTranslations("mantainers.shifts");

  const startTour = useCallback(() => {
    const steps: DriveStep[] = [];

    const addStep = (element: string | null, stepKey: string) => {
      if (!element) {
        steps.push({
          popover: {
            title: t(`editorTour.steps.${stepKey}.title`),
            description: t(`editorTour.steps.${stepKey}.description`),
          },
        });
      } else if (document.querySelector(`[data-tour="${element}"]`)) {
        steps.push({
          element: `[data-tour="${element}"]`,
          popover: {
            title: t(`editorTour.steps.${stepKey}.title`),
            description: t(`editorTour.steps.${stepKey}.description`),
          },
        });
      }
    };

    addStep(null, "welcome");
    addStep("shifts-editor-basic-info", "basicInfo");
    addStep("shifts-editor-nomenclature", "nomenclature");
    addStep("shifts-editor-rotation-config", "rotationConfig");
    addStep("shifts-editor-mass-assignment", "massAssignment");
    addStep("shifts-editor-schedule-grid", "scheduleGrid");
    addStep("shifts-editor-submit", "submit");

    if (steps.length === 0) return;

    const driverObj = driver({
      showProgress: true,
      steps,
      nextBtnText: t("editorTour.buttons.next"),
      prevBtnText: t("editorTour.buttons.previous"),
      doneBtnText: t("editorTour.buttons.done"),
    });

    driverObj.drive();
  }, [t]);

  return { startTour };
}
