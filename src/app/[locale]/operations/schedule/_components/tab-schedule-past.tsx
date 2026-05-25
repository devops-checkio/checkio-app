"use client";

import { useTranslations } from "next-intl";
import TabBase from "./tab-base";

export const TabSchedulePast = () => {
  const t = useTranslations("operations.schedule");
  return <TabBase status="expiring" title={t("tabTitles.expiring")} />;
};
