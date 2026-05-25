"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function useShiftsTour() {
  const t = useTranslations("mantainers.shifts");

  const startTour = useCallback(() => {
    const steps: DriveStep[] = [
      {
        popover: {
          title: t("tour.steps.welcome.title"),
          description: t("tour.steps.welcome.description"),
        },
      },
    ];

    if (document.querySelector('[data-tour="shifts-filters"]')) {
      steps.push({
        element: '[data-tour="shifts-filters"]',
        popover: {
          title: t("tour.steps.filters.title"),
          description: t("tour.steps.filters.description"),
        },
      });
    }

    if (document.querySelector('[data-tour="shifts-toolbar"]')) {
      steps.push({
        element: '[data-tour="shifts-toolbar"]',
        popover: {
          title: t("tour.steps.toolbar.title"),
          description: t("tour.steps.toolbar.description"),
        },
      });
    }

    if (document.querySelector('[data-tour="shifts-table"]')) {
      steps.push({
        element: '[data-tour="shifts-table"]',
        popover: {
          title: t("tour.steps.table.title"),
          description: t("tour.steps.table.description"),
        },
      });
    }

    if (document.querySelector('[data-tour="shifts-pagination"]')) {
      steps.push({
        element: '[data-tour="shifts-pagination"]',
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
