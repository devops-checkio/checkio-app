"use client";

import { CHEKIOLoading } from "@/components";
import { useGetSchedules } from "@/service/schedule.service";
import { useGetShift } from "@/service/shift.service";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { ShiftEditor } from "../../_components/shift-editor";
import { ShiftEditorLayout } from "../_components/shift-editor-layout";

export default function ShiftPage() {
  const t = useTranslations("mantainers.shifts");
  const { shiftId } = useParams();
  const { data: shift, isLoading: isLoadingShift } = useGetShift(shiftId);

  // Memoizar los scheduleIds para evitar re-renders innecesarios
  const scheduleIds = useMemo(() => {
    if (!shift?.schedules) return [];
    return shift.schedules
      .map((schedule) => schedule.scheduleId)
      .filter(Boolean);
  }, [shift?.schedules]);

  const schedulesPageSize = useMemo(
    () => Math.max(100, scheduleIds.length),
    [scheduleIds.length]
  );

  // Mismo criterio que shift.controller al guardar: filtrar horarios por empresas del turno.
  const scheduleFindBody = useMemo(() => {
    const companyIds =
      shift?.companies && shift.companies.length > 0
        ? shift.companies
        : undefined;
    return {
      publicIds: scheduleIds.length > 0 ? scheduleIds : undefined,
      includeBreaks: true as const,
      companyIds,
    };
  }, [scheduleIds, shift?.companies]);

  const { data: schedules, isLoading: isLoadingSchedules } = useGetSchedules(
    {
      page: 1,
      pageSize: schedulesPageSize,
      sort: "asc",
    },
    scheduleFindBody,
    {
      enabled: !!shift && scheduleIds.length > 0,
    }
  );

  const invalidReferencedScheduleCount = useMemo(() => {
    if (!shift || scheduleIds.length === 0 || !schedules?.data) return 0;
    const returned = new Set(schedules.data.map((s) => s.publicId));
    const referencedUnique = [...new Set(scheduleIds)];
    return referencedUnique.filter((id) => !returned.has(id)).length;
  }, [shift, scheduleIds, schedules?.data]);

  const isLoading =
    isLoadingShift ||
    (!!shift && scheduleIds.length > 0 && isLoadingSchedules);

  return (
    <ShiftEditorLayout
      title={t("form.title.edit")}
      breadcrumbs={[
        t("breadcrumbs.dashboard"),
        t("breadcrumbs.maintainers"),
        t("breadcrumbs.shifts"),
        t("form.title.edit"),
      ]}
      canShowTour={!isLoading}
    >
      {isLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <CHEKIOLoading size="lg" variant="modern" text={t("form.loading")} />
        </div>
      ) : (
        <ShiftEditor
          shift={shift}
          selectedSchedules={
            scheduleIds.length > 0 ? schedules?.data : undefined
          }
          invalidReferencedScheduleCount={invalidReferencedScheduleCount}
          key={"shift-editor-" + shiftId}
        />
      )}
    </ShiftEditorLayout>
  );
}
