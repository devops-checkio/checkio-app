"use client";

import { useTranslations } from "next-intl";
import TabBase from "./tab-base";

export const TabScheduleFuture = () => {
  const t = useTranslations("operations.schedule");
  return <TabBase status="active" title={t("tabTitles.active")} />;
};
