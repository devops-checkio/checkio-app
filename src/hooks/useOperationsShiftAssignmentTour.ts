"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function useOperationsShiftAssignmentTour() {
  const t = useTranslations("operations.shift");

  const startTour = useCallback(() => {
    const steps: DriveStep[] = [
      {
        popover: {
          title: t("assignmentTour.steps.welcome.title"),
          description: t("assignmentTour.steps.welcome.description"),
        },
      },
    ];

    const addStep = (element: string | null, stepKey: string) => {
      if (!element) {
        steps.push({
          popover: {
            title: t(`assignmentTour.steps.${stepKey}.title`),
            description: t(`assignmentTour.steps.${stepKey}.description`),
          },
        });
      } else if (document.querySelector(`[data-tour="${element}"]`)) {
        steps.push({
          element: `[data-tour="${element}"]`,
          popover: {
            title: t(`assignmentTour.steps.${stepKey}.title`),
            description: t(`assignmentTour.steps.${stepKey}.description`),
          },
        });
      }
    };

    addStep("shift-assignment-sidebar", "sidebar");
    addStep("shift-assignment-header-config", "headerConfig");

    if (document.querySelector('[data-tour="shift-assignment-employee-config"]')) {
      addStep("shift-assignment-employee-config", "employeeConfig");
    }

    addStep("shift-assignment-bottom-bar", "bottomBar");
    addStep("shift-assignment-submit-btn", "submitBtn");

    const driverObj = driver({
      showProgress: true,
      steps,
      nextBtnText: t("tour.buttons.next"),
      prevBtnText: t("tour.buttons.previous"),
      doneBtnText: t("tour.buttons.done"),
    });

    driverObj.drive();
  }, [t]);

  return { startTour };
}
