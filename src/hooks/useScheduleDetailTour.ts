"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function useScheduleDetailTour() {
  const t = useTranslations("mantainers.schedules");

  const startTour = useCallback(() => {
    const steps: DriveStep[] = [];
    const stepKey = "detailTour.steps";

    const addStep = (element: string | null, key: string) => {
      if (!element) {
        steps.push({
          popover: {
            title: t(`${stepKey}.${key}.title`),
            description: t(`${stepKey}.${key}.description`),
          },
        });
      } else if (document.querySelector(`[data-tour="${element}"]`)) {
        steps.push({
          element: `[data-tour="${element}"]`,
          popover: {
            title: t(`${stepKey}.${key}.title`),
            description: t(`${stepKey}.${key}.description`),
          },
        });
      }
    };

    addStep(null, "welcome");
    addStep("schedule-detail-basic-info", "basicInfo");
    addStep("schedule-detail-schedule-config", "scheduleConfig");
    addStep("schedule-detail-timeline", "timeline");
    addStep("schedule-detail-breaks", "breaks");

    if (steps.length === 0) return;

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
