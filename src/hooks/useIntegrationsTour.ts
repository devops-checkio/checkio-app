"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function useIntegrationsTour() {
  const t = useTranslations("integrations");

  const startTour = useCallback(() => {
    const steps: DriveStep[] = [
      {
        popover: {
          title: t("tour.steps.welcome.title"),
          description: t("tour.steps.welcome.description"),
        },
      },
    ];

    if (document.querySelector('[data-tour="integrations-toolbar"]')) {
      steps.push({
        element: '[data-tour="integrations-toolbar"]',
        popover: {
          title: t("tour.steps.toolbar.title"),
          description: t("tour.steps.toolbar.description"),
        },
      });
    }

    if (document.querySelector('[data-tour="integrations-tabs"]')) {
      steps.push({
        element: '[data-tour="integrations-tabs"]',
        popover: {
          title: t("tour.steps.tabs.title"),
          description: t("tour.steps.tabs.description"),
        },
      });
    }

    if (document.querySelector('[data-tour="integrations-cards"]')) {
      steps.push({
        element: '[data-tour="integrations-cards"]',
        popover: {
          title: t("tour.steps.cards.title"),
          description: t("tour.steps.cards.description"),
        },
      });
    } else if (document.querySelector('[data-tour="integrations-empty"]')) {
      steps.push({
        element: '[data-tour="integrations-empty"]',
        popover: {
          title: t("tour.steps.empty.title"),
          description: t("tour.steps.empty.description"),
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
