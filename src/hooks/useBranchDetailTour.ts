"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function useBranchDetailTour(activeTab: string) {
  const t = useTranslations("mantainers.branches");

  const startTour = useCallback(() => {
    const tabKey = `detailTour.tabs.${activeTab}`;
    const steps: DriveStep[] = [];

    const addStep = (element: string | null, stepKey: string) => {
      if (!element) {
        steps.push({
          popover: {
            title: t(`${tabKey}.steps.${stepKey}.title`),
            description: t(`${tabKey}.steps.${stepKey}.description`),
          },
        });
      } else if (document.querySelector(`[data-tour="${element}"]`)) {
        steps.push({
          element: `[data-tour="${element}"]`,
          popover: {
            title: t(`${tabKey}.steps.${stepKey}.title`),
            description: t(`${tabKey}.steps.${stepKey}.description`),
          },
        });
      }
    };

    const addWelcome = () => {
      steps.push({
        popover: {
          title: t(`${tabKey}.steps.welcome.title`),
          description: t(`${tabKey}.steps.welcome.description`),
        },
      });
    };

    switch (activeTab) {
      case "0":
        addWelcome();
        addStep("branch-detail-tab-basic-info", "basicInfo");
        break;
      case "1":
        addWelcome();
        addStep("branch-detail-tab-geolocation", "geolocation");
        break;
      case "2":
        addWelcome();
        addStep("branch-detail-tab-params", "params");
        addStep("branch-detail-tab-tolerances", "tolerances");
        addStep("branch-detail-tab-schedules", "schedules");
        addStep("branch-detail-tab-automatic", "automatic");
        break;
      default:
        return;
    }

    if (steps.length === 0) return;

    const driverObj = driver({
      showProgress: true,
      steps,
      nextBtnText: t("tour.buttons.next"),
      prevBtnText: t("tour.buttons.previous"),
      doneBtnText: t("tour.buttons.done"),
    });

    driverObj.drive();
  }, [t, activeTab]);

  return { startTour };
}
