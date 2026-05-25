"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import { CHEKIOHeader, CHEKIOTab, CHEKIOTabs } from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TabScheduleFuture } from "./_components/tab-schedule-future";
import { TabScheduleInactive } from "./_components/tab-schedule-inactive";
import { TabSchedulePast } from "./_components/tab-schedule-past";
import { TabScheduleRecent } from "./_components/tab-schedule-recent";

enum TabValue {
  ACTIVE = "active",
  EXPIRING = "expiring",
  RECENT_DISMISSALS = "recent_dismissals",
  INACTIVE = "inactive",
}

function ScheduleContent() {
  const t = useTranslations("operations.schedule");
  const { canRead } = useCookieSession();
  const [activeTab, setActiveTab] = useState<TabValue>(TabValue.ACTIVE);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
  };

  const canViewScheduleIndex =
    canRead(OrganizationPermissionCode.SCHEDULE_MAINTENANCE) ||
    canRead(OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS) ||
    canRead(
      OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS,
    );

  if (!canViewScheduleIndex) {
    return (
      <div className="px-4 py-6 lg:px-6">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-600 shadow-sm">
          {t("accessDenied") || "No tiene permiso para ver este módulo."}
        </div>
      </div>
    );
  }

  return (
    <>
      <CHEKIOHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[
          t("breadcrumbs.dashboard"),
          t("breadcrumbs.operations"),
          t("breadcrumbs.schedule"),
        ]}
      />
      <div className="">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-3">
            <CHEKIOTabs
              value={activeTab}
              onValueChange={handleTabChange}
              variant="underline"
              className="border-b-0 bg-transparent"
            >
              <CHEKIOTab value={TabValue.ACTIVE} label={t("tabs.active")} />
              <CHEKIOTab value={TabValue.EXPIRING} label={t("tabs.expiring")} />
              <CHEKIOTab
                value={TabValue.RECENT_DISMISSALS}
                label={t("tabs.recentDismissals")}
              />
              <CHEKIOTab value={TabValue.INACTIVE} label={t("tabs.inactive")} />
            </CHEKIOTabs>
          </div>

          {activeTab === TabValue.ACTIVE && <TabScheduleFuture />}
          {activeTab === TabValue.EXPIRING && <TabSchedulePast />}
          {activeTab === TabValue.RECENT_DISMISSALS && <TabScheduleRecent />}
          {activeTab === TabValue.INACTIVE && <TabScheduleInactive />}
        </div>
      </div>
    </>
  );
}

export default function SchedulePage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={[
        OrganizationPermissionCode.SCHEDULE_MAINTENANCE,
        OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS,
        OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS,
      ]}
    >
      <ScheduleContent />
    </AccessNotGranted>
  );
}
