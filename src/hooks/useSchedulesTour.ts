"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function useSchedulesTour() {
  const t = useTranslations("mantainers.schedules");

  const startTour = useCallback(() => {
    const steps: DriveStep[] = [
      {
        popover: {
          title: t("tour.steps.welcome.title"),
          description: t("tour.steps.welcome.description"),
        },
      },
      {
        element: '[data-tour="schedules-tabs"]',
        popover: {
          title: t("tour.steps.tabs.title"),
          description: t("tour.steps.tabs.description"),
        },
      },
      {
        element: '[data-tour="schedules-filters"]',
        popover: {
          title: t("tour.steps.filters.title"),
          description: t("tour.steps.filters.description"),
        },
      },
      {
        element: '[data-tour="schedules-toolbar"]',
        popover: {
          title: t("tour.steps.toolbar.title"),
          description: t("tour.steps.toolbar.description"),
        },
      },
      {
        element: '[data-tour="schedules-table"]',
        popover: {
          title: t("tour.steps.table.title"),
          description: t("tour.steps.table.description"),
        },
      },
    ];

    // Add pagination step only when element exists (when there's data)
    if (document.querySelector('[data-tour="schedules-pagination"]')) {
      steps.push({
        element: '[data-tour="schedules-pagination"]',
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
