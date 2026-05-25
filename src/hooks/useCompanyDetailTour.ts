"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function useCompanyDetailTour(activeTab: string) {
  const t = useTranslations("mantainers.companies");

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
        addStep("company-detail-tab-basic-info", "basicInfo");
        addStep("company-detail-tab-system-config", "systemConfig");
        break;
      case "1":
        addWelcome();
        addStep("company-detail-tab-tolerances", "tolerances");
        addStep("company-detail-tab-schedule-config", "scheduleConfig");
        addStep("company-detail-tab-automatic-config", "automaticConfig");
        break;
      case "2":
        addWelcome();
        addStep("company-detail-tab-marking-config", "markingConfig");
        addStep("company-detail-tab-supervisor-notif", "supervisorNotif");
        addStep("company-detail-tab-system-notif", "systemNotif");
        break;
      case "3":
        addWelcome();
        addStep("company-detail-tab-overtime-type", "overtimeType");
        addStep("company-detail-tab-overtime-subtabs", "overtimeSubtabs");
        addStep("company-detail-tab-overtime-table", "overtimeTable");
        addStep("company-detail-tab-overtime-add", "overtimeAdd");
        break;
      case "4":
        addWelcome();
        addStep("company-detail-tab-notifications-add", "notificationsAdd");
        addStep("company-detail-tab-notifications-table", "notificationsTable");
        break;
      case "5":
        addWelcome();
        addStep("company-detail-tab-rules-explanation", "rulesExplanation");
        addStep("company-detail-tab-rules-new", "rulesNew");
        addStep("company-detail-tab-rules-table", "rulesTable");
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
