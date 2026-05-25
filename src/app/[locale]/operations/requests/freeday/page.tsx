"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
  CHEKIOButton,
  CHEKIOHeader,
  CHEKIOTab,
  CHEKIOTabs,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { useFreedayTour } from "@/hooks/useFreedayTour";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import {
  useGetApprovedFreedayRequests,
  useGetPendingFreedayRequests,
  useGetRejectedFreedayRequests,
} from "@/service/freeday.service";
import { HelpCircle, PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FreedayRequestModal } from "./_components/freeday-request-modal";
import TabApprovedRequests from "./_components/tab-approved-requests";
import TabPendingRequests from "./_components/tab-pending-requests";
import TabRejectedRequests from "./_components/tab-rejected-requests";

enum TabValue {
  PENDING = "1",
  APPROVED = "2",
  REJECTED = "3",
}

function FreedayRequestsContent() {
  const t = useTranslations("operations.requests.freeday");
  const { startTour } = useFreedayTour();
  const canShowTour = true;
  const [activeTab, setActiveTab] = useState<TabValue>(TabValue.PENDING);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { isProfileEmployee, profile, companyId } = useCookieSession();

  const canShowNewRequestButton =
    isProfileEmployee() && Boolean(profile?.user?.employeeId);

  // Use same data source as each tab list to keep counters accurate.
  const { data: pendingCountData } = useGetPendingFreedayRequests({
    page: 1,
    pageSize: 1,
    sort: "desc",
    companyId: companyId ?? undefined,
  });
  const { data: approvedCountData } = useGetApprovedFreedayRequests({
    page: 1,
    pageSize: 1,
    sort: "desc",
    companyId: companyId ?? undefined,
  });
  const { data: rejectedCountData } = useGetRejectedFreedayRequests({
    page: 1,
    pageSize: 1,
    sort: "desc",
    companyId: companyId ?? undefined,
  });
  const pendingCount = pendingCountData?.pagination?.totalCount ?? 0;
  const approvedCount = approvedCountData?.pagination?.totalCount ?? 0;
  const rejectedCount = rejectedCountData?.pagination?.totalCount ?? 0;

  const handleTabChange = (value: TabValue) => {
    setActiveTab(value);
  };

  if (!companyId) {
    return (
      <>
        <CHEKIOHeader
          title={t("title")}
          subtitle={t("subtitle")}
          breadcrumbs={[
            t("breadcrumbs.dashboard"),
            t("breadcrumbs.operations"),
            t("breadcrumbs.requests"),
            t("breadcrumbs.freeday"),
          ]}
          actions={
            <CHEKIOButton
              variant="secondaryBlue"
              onClick={startTour}
              disabled={!canShowTour}
            >
              <HelpCircle className="h-4 w-4" />
              {t("tour.startButton")}
            </CHEKIOButton>
          }
        />
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">{t("selectCompanyHint")}</p>
        </div>
      </>
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
          t("breadcrumbs.requests"),
          t("breadcrumbs.freeday"),
        ]}
        actions={
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={startTour}
            disabled={!canShowTour}
          >
            <HelpCircle className="h-4 w-4" />
            {t("tour.startButton")}
          </CHEKIOButton>
        }
      />
      <div className="space-y-6">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div
            className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/50 px-5 py-3 md:flex-row md:items-center md:justify-between"
            data-tour="freeday-tabs"
          >
            <div className="w-full md:flex-1 md:pr-3">
              <CHEKIOTabs className="w-full">
                <CHEKIOTab
                  active={activeTab === TabValue.PENDING}
                  onClick={() => handleTabChange(TabValue.PENDING)}
                >
                  {t("tabs.pending")} ({pendingCount})
                </CHEKIOTab>
                <CHEKIOTab
                  active={activeTab === TabValue.APPROVED}
                  onClick={() => handleTabChange(TabValue.APPROVED)}
                >
                  {t("tabs.approved")} ({approvedCount})
                </CHEKIOTab>
                <CHEKIOTab
                  active={activeTab === TabValue.REJECTED}
                  onClick={() => handleTabChange(TabValue.REJECTED)}
                >
                  {t("tabs.rejected")} ({rejectedCount})
                </CHEKIOTab>
              </CHEKIOTabs>
            </div>

            {canShowNewRequestButton && (
              <div className="flex justify-end md:flex-none" data-tour="freeday-toolbar">
                <CHEKIOButton
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                  {t("buttons.add")}
                </CHEKIOButton>
              </div>
            )}
          </div>

        {activeTab === TabValue.PENDING && <TabPendingRequests />}
        {activeTab === TabValue.APPROVED && <TabApprovedRequests />}
        {activeTab === TabValue.REJECTED && <TabRejectedRequests />}
        </div>
      </div>

      {/* Create Modal */}
      <FreedayRequestModal
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

export default function FreedayRequestsPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={[
        OrganizationPermissionCode.REQUEST_FREEDAY_OPERATIONS,
        OrganizationPermissionCode.REQUEST_OPERATION_OPERATIONS,
      ]}
    >
      <FreedayRequestsContent />
    </AccessNotGranted>
  );
}
