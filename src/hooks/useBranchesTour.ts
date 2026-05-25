"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function useBranchesTour() {
  const t = useTranslations("mantainers.branches");

  const startTour = useCallback(() => {
    const steps: DriveStep[] = [
      {
        popover: {
          title: t("tour.steps.welcome.title"),
          description: t("tour.steps.welcome.description"),
        },
      },
      {
        element: '[data-tour="branches-toolbar"]',
        popover: {
          title: t("tour.steps.toolbar.title"),
          description: t("tour.steps.toolbar.description"),
        },
      },
      {
        element: '[data-tour="branches-table"]',
        popover: {
          title: t("tour.steps.table.title"),
          description: t("tour.steps.table.description"),
        },
      },
    ];

    // Add pagination step only when element exists (when there's data)
    if (document.querySelector('[data-tour="branches-pagination"]')) {
      steps.push({
        element: '[data-tour="branches-pagination"]',
        popover: {
          title: t("tour.steps.pagination.title"),
          description: t("tour.steps.pagination.description"),
        },
      });
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
