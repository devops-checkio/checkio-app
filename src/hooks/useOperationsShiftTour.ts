"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function useOperationsShiftTour() {
  const t = useTranslations("operations.shift");

  const startTour = useCallback(() => {
    const steps: DriveStep[] = [
      {
        popover: {
          title: t("tour.steps.welcome.title"),
          description: t("tour.steps.welcome.description"),
        },
      },
    ];

    const addStep = (element: string | null, stepKey: string) => {
      if (!element) {
        steps.push({
          popover: {
            title: t(`tour.steps.${stepKey}.title`),
            description: t(`tour.steps.${stepKey}.description`),
          },
        });
      } else if (document.querySelector(`[data-tour="${element}"]`)) {
        steps.push({
          element: `[data-tour="${element}"]`,
          popover: {
            title: t(`tour.steps.${stepKey}.title`),
            description: t(`tour.steps.${stepKey}.description`),
          },
        });
      }
    };

    addStep("shift-operations-tabs", "tabs");

    if (document.querySelector('[data-tour="shift-operations-info-btn"]')) {
      addStep("shift-operations-info-btn", "infoBtn");
    }

    addStep("shift-operations-filters", "filters");
    addStep("shift-operations-toolbar", "toolbar");
    addStep("shift-operations-table", "table");

    if (document.querySelector('[data-tour="shift-operations-pagination"]')) {
      addStep("shift-operations-pagination", "pagination");
    }

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
