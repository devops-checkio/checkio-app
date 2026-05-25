"use client";

import {
  CHEKIOButton,
  CHEKIOTab,
  CHEKIOTabs,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import {
  useGetApprovedHourlyPermissions,
  useGetPendingHourlyPermissions,
  useGetRejectedHourlyPermissions,
} from "@/service/hourly-permission.service";
import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import AccessNotGranted from "../../../_components/acces-not-granted";
import { HourlyPermissionModal } from "./_components/hourly-permission-modal";
import TabApprovedHourlyPermissions from "./_components/tab-approved-hourly-permissions";
import TabPendingHourlyPermissions from "./_components/tab-pending-hourly-permissions";
import TabRejectedHourlyPermissions from "./_components/tab-rejected-hourly-permissions";

function HourlyPermissionsContent() {
  const t = useTranslations("operations.requests.hourlyPermission");
  const [activeTab, setActiveTab] = useState("pending");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { canCreate, companyId } = useCookieSession();

  // Use same data source/permissions as each tab list to keep counters accurate.
  const { data: pendingCountData } = useGetPendingHourlyPermissions({
    page: 1,
    pageSize: 1,
    sort: "desc",
    companyId: companyId ?? undefined,
  });
  const { data: approvedCountData } = useGetApprovedHourlyPermissions({
    page: 1,
    pageSize: 1,
    sort: "desc",
    companyId: companyId ?? undefined,
  });
  const { data: rejectedCountData } = useGetRejectedHourlyPermissions({
    page: 1,
    pageSize: 1,
    sort: "desc",
    companyId: companyId ?? undefined,
  });

  const pendingCount = pendingCountData?.pagination?.totalCount ?? 0;
  const approvedCount = approvedCountData?.pagination?.totalCount ?? 0;
  const rejectedCount = rejectedCountData?.pagination?.totalCount ?? 0;

  if (!companyId) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-600">{t("selectCompanyHint")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/50 px-5 py-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:flex-1 md:pr-3">
            <CHEKIOTabs className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <CHEKIOTab
                value="pending"
                label={`${t("tabs.pending.label")} (${pendingCount})`}
              />
              <CHEKIOTab
                value="approved"
                label={`${t("tabs.approved.label")} (${approvedCount})`}
              />
              <CHEKIOTab
                value="rejected"
                label={`${t("tabs.rejected.label")} (${rejectedCount})`}
              />
            </CHEKIOTabs>
          </div>
          {canCreate(
            OrganizationPermissionCode.REQUEST_HOURLY_PERMISSION_OPERATIONS
          ) && (
            <div className="flex justify-end md:flex-none">
              <CHEKIOButton
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <PlusCircle className="h-4 w-4" />
                {t("buttons.newRequest")}
              </CHEKIOButton>
            </div>
          )}
        </div>

        {activeTab === "pending" && <TabPendingHourlyPermissions />}
        {activeTab === "approved" && <TabApprovedHourlyPermissions />}
        {activeTab === "rejected" && <TabRejectedHourlyPermissions />}
      </div>

      {/* Create Modal */}
      <HourlyPermissionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          // Refresh data will be handled by React Query
        }}
        mode="create"
      />
    </>
  );
}

export default function HourlyPermissionsPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={[
        OrganizationPermissionCode.REQUEST_HOURLY_PERMISSION_OPERATIONS,
        OrganizationPermissionCode.REQUEST_OPERATION_OPERATIONS,
      ]}
    >
      <HourlyPermissionsContent />
    </AccessNotGranted>
  );
}
