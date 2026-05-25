"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function useEstablishmentsTour() {
  const t = useTranslations("mantainers.establishments");

  const startTour = useCallback(() => {
    const steps: DriveStep[] = [
      {
        popover: {
          title: t("tour.steps.welcome.title"),
          description: t("tour.steps.welcome.description"),
        },
      },
      {
        element: '[data-tour="establishments-toolbar"]',
        popover: {
          title: t("tour.steps.actions.title"),
          description: t("tour.steps.actions.description"),
        },
      },
      {
        element: '[data-tour="establishments-table"]',
        popover: {
          title: t("tour.steps.table.title"),
          description: t("tour.steps.table.description"),
        },
      },
    ];

    if (document.querySelector('[data-tour="establishments-pagination"]')) {
      steps.push({
        element: '[data-tour="establishments-pagination"]',
        popover: {
          title: t("tour.steps.pagination.title"),
          description: t("tour.steps.pagination.description"),
        },
      });
    }

    const driverObj = driver({
      showProgress: true,
      steps,
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "Finalizar",
    });

    driverObj.drive();
  }, [t]);

  return { startTour };
}
