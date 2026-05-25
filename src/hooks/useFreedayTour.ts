"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function useFreedayTour() {
  const t = useTranslations("operations.requests.freeday");

  const startTour = useCallback(() => {
    const steps: DriveStep[] = [
      {
        popover: {
          title: t("tour.steps.welcome.title"),
          description: t("tour.steps.welcome.description"),
        },
      },
      {
        element: '[data-tour="freeday-toolbar"]',
        popover: {
          title: t("tour.steps.toolbar.title"),
          description: t("tour.steps.toolbar.description"),
        },
      },
      {
        element: '[data-tour="freeday-tabs"]',
        popover: {
          title: t("tour.steps.tabs.title"),
          description: t("tour.steps.tabs.description"),
        },
      },
    ];

    // Add table step only when element exists (when tab has data)
    if (document.querySelector('[data-tour="freeday-table"]')) {
      steps.push({
        element: '[data-tour="freeday-table"]',
        popover: {
          title: t("tour.steps.table.title"),
          description: t("tour.steps.table.description"),
        },
      });
    }

    // Add pagination step only when element exists (when there's data)
    if (document.querySelector('[data-tour="freeday-pagination"]')) {
      steps.push({
        element: '[data-tour="freeday-pagination"]',
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
