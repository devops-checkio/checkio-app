"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useMessages, useTranslations } from "next-intl";
import { useCallback } from "react";

export function useAssistanceManagementDetailTour(activeTab: string) {
  const t = useTranslations("assistanceManagement");
  const messages = useMessages();

  const startTour = useCallback(() => {
    const steps: DriveStep[] = [];

    const tabSpecificSteps = new Set(["welcome", "toolbar", "table"]);

    const getRawMessage = (path: string): string | undefined => {
      const parts = path.split(".");
      let obj: unknown = (messages as Record<string, unknown>)?.assistanceManagement;
      for (const part of parts) {
        if (obj == null) return undefined;
        obj = (obj as Record<string, unknown>)?.[part];
      }
      return typeof obj === "string" ? obj : undefined;
    };

    const addStep = (element: string | null, stepKey: string) => {
      const useTabSpecific = tabSpecificSteps.has(stepKey);
      const commonTitleKey = `detailTour.tabs.common.steps.${stepKey}.title`;
      const commonDescKey = `detailTour.tabs.common.steps.${stepKey}.description`;
      const tabTitleKey = `detailTour.tabs.${activeTab}.steps.${stepKey}.title`;
      const tabDescKey = `detailTour.tabs.${activeTab}.steps.${stepKey}.description`;

      const getTitle = () => {
        if (useTabSpecific) {
          try {
            return t(tabTitleKey);
          } catch {
            // Fallback to common
          }
        }
        try {
          return t(commonTitleKey);
        } catch {
          return "";
        }
      };

      const getDescription = (): string => {
        if (stepKey === "table") {
          const rawDesc =
            getRawMessage(`detailTour.tabs.${activeTab}.steps.table.description`) ??
            getRawMessage("detailTour.tabs.common.steps.table.description");
          if (typeof rawDesc === "string") return rawDesc;
          return "";
        }
        if (useTabSpecific) {
          try {
            return t(tabDescKey);
          } catch {
            // Fallback to common
          }
        }
        try {
          return t(commonDescKey);
        } catch {
          return "";
        }
      };

      const title = getTitle();
      const description = getDescription();
      if (!title && !description) return;

      if (!element) {
        steps.push({
          popover: {
            title: title || undefined,
            description: description || undefined,
          },
        });
      } else if (document.querySelector(`[data-tour="${element}"]`)) {
        steps.push({
          element: `[data-tour="${element}"]`,
          popover: {
            title: title || undefined,
            description: description || undefined,
          },
        });
      }
    };

    const addWelcome = () => {
      try {
        steps.push({
          popover: {
            title: t(`detailTour.tabs.${activeTab}.steps.welcome.title`),
            description: t(
              `detailTour.tabs.${activeTab}.steps.welcome.description`,
            ),
          },
        });
      } catch {
        // Fallback if tab-specific welcome missing
        steps.push({
          popover: {
            title: t("detailTour.tabs.common.steps.welcome.title"),
            description: t("detailTour.tabs.common.steps.welcome.description"),
          },
        });
      }
    };

    switch (activeTab) {
      case "1":
      case "2":
      case "3":
        addWelcome();
        addStep("assistance-management-tabs", "tabs");
        addStep("assistance-management-filters", "filters");
        addStep("assistance-management-tab-toolbar", "toolbar");
        addStep("assistance-management-tab-table", "table");
        addStep("assistance-management-tab-pagination", "pagination");
        break;
      case "4":
      case "5":
        addWelcome();
        addStep("assistance-management-tabs", "tabs");
        addStep("assistance-management-filters", "filters");
        addStep(null, "toolbar");
        addStep("assistance-management-tab-table", "table");
        addStep("assistance-management-tab-pagination", "pagination");
        break;
      case "7":
      case "8":
        addWelcome();
        addStep("assistance-management-tabs", "tabs");
        addStep("assistance-management-filters", "filters");
        addStep(null, "toolbar");
        addStep("assistance-management-tab-table", "table");
        addStep("assistance-management-tab-pagination", "pagination");
        break;
      case "6":
        addWelcome();
        addStep("assistance-management-tabs", "tabs");
        addStep("assistance-management-filters", "filters");
        break;
      default:
        return;
    }

    if (steps.length === 0) return;

    const driverObj = driver({
      showProgress: true,
      steps,
      nextBtnText: t("detailTour.buttons.next"),
      prevBtnText: t("detailTour.buttons.previous"),
      doneBtnText: t("detailTour.buttons.done"),
    });

    driverObj.drive();
  }, [t, activeTab, messages]);

  return { startTour };
}
