"use client";

import { useTranslations } from "next-intl";
import { ShiftEditor } from "../_components/shift-editor";
import { ShiftEditorLayout } from "./_components/shift-editor-layout";

export default function ShiftCreatePage() {
  const t = useTranslations("mantainers.shifts");

  return (
    <ShiftEditorLayout
      title={t("form.title.create")}
      breadcrumbs={[
        t("breadcrumbs.dashboard"),
        t("breadcrumbs.maintainers"),
        t("breadcrumbs.shifts"),
        t("form.title.create"),
      ]}
      canShowTour={true}
    >
      <ShiftEditor />
    </ShiftEditorLayout>
  );
}
