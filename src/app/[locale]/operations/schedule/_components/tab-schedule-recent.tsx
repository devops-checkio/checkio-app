"use client";

import { useTranslations } from "next-intl";
import TabBase from "./tab-base";

export const TabScheduleRecent = () => {
  const t = useTranslations("operations.schedule");
  return (
    <TabBase status="recent_dismissals" title={t("tabTitles.recentDismissals")} />
  );
};
