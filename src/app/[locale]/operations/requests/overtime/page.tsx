"use client";

import {
  CHEKIOButton,
  CHEKIOHeader,
  CHEKIOTab,
  CHEKIOTabs,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useGetOvertimeRequestStats } from "@/service/overtime-request.service";
import { PlusCircle, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import AccessNotGranted from "../../../_components/acces-not-granted";
import { OvertimeRequestModal } from "./_components/overtime-request-modal";
import { OvertimeRequestModalMasive } from "./_components/overtime-request-modal-masive";
import TabApprovedOvertimeRequests from "./_components/tab-approved-overtime-requests";
import TabPendingOvertimeRequests from "./_components/tab-pending-overtime-requests";
import TabRejectedOvertimeRequests from "./_components/tab-rejected-overtime-requests";

function OvertimeRequestsContent() {
  const t = useTranslations("operations.requests.overtime");
  const [activeTab, setActiveTab] = useState("pending");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const { companyId, canCreate } = useCookieSession();

  // Get stats for tab counts (same filter as list: companyId)
  const { data: statsData } = useGetOvertimeRequestStats({
    companyId: companyId ?? undefined,
  });

  const toolbarButtons = (
    <div className="flex flex-row gap-2">
      {canCreate(OrganizationPermissionCode.REQUEST_OVERTIME_OPERATIONS) && (
        <>
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={() => setIsBulkModalOpen(true)}
          >
            <Upload className="h-4 w-4" />
            {t("buttons.bulkUpload")}
          </CHEKIOButton>
          <CHEKIOButton
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            {t("buttons.newRequest")}
          </CHEKIOButton>
        </>
      )}
    </div>
  );

  return (
    <>
      <CHEKIOHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[
          t("breadcrumbs.dashboard"),
          t("breadcrumbs.operations"),
          t("breadcrumbs.requests"),
          t("breadcrumbs.overtime"),
        ]}
      />
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-end">
          {toolbarButtons}
        </div>
        <div className="border-b border-gray-200 px-5 pt-3">
          <CHEKIOTabs
            value={activeTab}
            onValueChange={setActiveTab}
            variant="underline"
            className="border-b-0 bg-transparent"
          >
            <CHEKIOTab
              value="pending"
              label={`${t("tabs.pending.label")} (${statsData?.pending || 0})`}
            />
            <CHEKIOTab
              value="approved"
              label={`${t("tabs.approved.label")} (${statsData?.approved || 0})`}
            />
            <CHEKIOTab
              value="rejected"
              label={`${t("tabs.rejected.label")} (${statsData?.rejected || 0})`}
            />
          </CHEKIOTabs>
        </div>

        {activeTab === "pending" && <TabPendingOvertimeRequests />}
        {activeTab === "approved" && <TabApprovedOvertimeRequests />}
        {activeTab === "rejected" && <TabRejectedOvertimeRequests />}
      </div>

      {/* Create Modal */}
      <OvertimeRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          // Refresh data will be handled by React Query
        }}
        mode="create"
      />

      {/* Bulk Upload Modal */}
      <OvertimeRequestModalMasive
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          setIsBulkModalOpen(false);
          // Refresh data will be handled by React Query
        }}
      />
    </>
  );
}

export default function OvertimeRequestsPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={[
        OrganizationPermissionCode.REQUEST_OVERTIME_OPERATIONS,
        OrganizationPermissionCode.REQUEST_OPERATION_OPERATIONS,
      ]}
    >
      <OvertimeRequestsContent />
    </AccessNotGranted>
  );
}
