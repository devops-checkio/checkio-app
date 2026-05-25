"use client";

import { useTranslations } from "next-intl";
import TabBase from "./tab-base";

export const TabScheduleInactive = () => {
  const t = useTranslations("operations.schedule");
  return <TabBase status="inactive" title={t("tabTitles.inactive")} />;
};
