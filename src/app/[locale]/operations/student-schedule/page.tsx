"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import StudentScheduleBulkUploadModal from "@/app/[locale]/operations/student-schedule/_components/student-schedule-bulk-upload-modal";
import { CHEKIOButton, CHEKIOHeader, CHEKIOTab, CHEKIOTabs } from "@/components";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import StudentScheduleTable from "./_components/student-schedule-table";

enum TabValue {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

function StudentScheduleContent() {
  const t = useTranslations("operations.studentSchedule");
  const [activeTab, setActiveTab] = useState<TabValue>(TabValue.ACTIVE);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

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
          <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3">
            <CHEKIOButton
              variant="primary"
              onClick={() => setIsBulkModalOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Carga masiva
            </CHEKIOButton>
          </div>
          <div className="border-b border-gray-200 bg-white px-5 py-3">
            <CHEKIOTabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabValue)}
              variant="modern"
              className="w-full"
            >
              <CHEKIOTab value={TabValue.ACTIVE} label={t("tabs.active")} />
              <CHEKIOTab value={TabValue.INACTIVE} label={t("tabs.inactive")} />
            </CHEKIOTabs>
          </div>

          {activeTab === TabValue.ACTIVE && (
            <StudentScheduleTable status="active" />
          )}
          {activeTab === TabValue.INACTIVE && (
            <StudentScheduleTable status="inactive" />
          )}
        </div>
      </div>
      <StudentScheduleBulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
      />
    </>
  );
}

export default function StudentSchedulePage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS
      }
    >
      <StudentScheduleContent />
    </AccessNotGranted>
  );
}
