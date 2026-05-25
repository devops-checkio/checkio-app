"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import { CHEKIOButton, CHEKIOTab, CHEKIOTabs } from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, PlusCircle, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import EmployeeModalUpsert from "./_components/employee-modal-create";
import TabActive from "./_components/tab-active";
import TabExpiring from "./_components/tab-expiring";
import TabInactive from "./_components/tab-inactive";
import TabRecentDismissals from "./_components/tab-recent-dismissals";

enum TabValue {
  ACTIVE = "1",
  EXPIRING = "2",
  RECENT_DISMISSALS = "3",
  INACTIVE = "4",
}

enum ButtonVariant {
  PRIMARY = "primary",
}

function EmployeesContent() {
  const router = useRouter();
  const t = useTranslations("mantainers.employees");
  const {
    canCreate,
    canRead,
    isProfileAdmin,
    isProfileCustom,
    isProfileEmployee,
  } = useCookieSession();
  const [activeTab, setActiveTab] = useState<TabValue>(TabValue.ACTIVE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const [downloadExcelFn, setDownloadExcelFn] = useState<
    (() => Promise<void>) | null
  >(null);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
    setDownloadExcelFn(null);
    setIsGeneratingExcel(false);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    toast({
      title: t("toast.createSuccess.title"),
      description: t("toast.createSuccess.description"),
    });
  };

  const handleDownloadExcelReady = useCallback(
    (downloadFn: () => Promise<void>, isLoading: boolean) => {
      setDownloadExcelFn(() => downloadFn);
      setIsGeneratingExcel(isLoading);
    },
    [],
  );

  const handleDownloadExcel = async () => {
    if (downloadExcelFn) {
      await downloadExcelFn();
    }
  };

  const handleBulkUpload = () => {
    router.push("/mantainers/employees/bulk-upload");
  };

  const toolbarButtons = (
    <div className="flex flex-row gap-2">
      {canCreate(OrganizationPermissionCode.EMPLOYEE_MAINTENANCE) && (
        <>
          <CHEKIOButton
            variant={ButtonVariant.PRIMARY}
            onClick={handleOpenModal}
          >
            <PlusCircle className="h-4 w-4" />
            {t("buttons.add")}
          </CHEKIOButton>
          <CHEKIOButton
            variant={ButtonVariant.PRIMARY}
            onClick={handleBulkUpload}
          >
            <Upload className="h-4 w-4" />
            {t("buttons.bulkUpload")}
          </CHEKIOButton>
        </>
      )}
      {canRead(OrganizationPermissionCode.EMPLOYEE_MAINTENANCE) &&
        downloadExcelFn && (
          <CHEKIOButton
            variant="approve"
            onClick={handleDownloadExcel}
            disabled={isGeneratingExcel}
          >
            {isGeneratingExcel ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("buttons.generating")}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t("buttons.downloadExcel")}
              </>
            )}
          </CHEKIOButton>
        )}
    </div>
  );

  const renderContent = () => (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3">
        {toolbarButtons}
      </div>

      {[isProfileAdmin(), isProfileCustom()].includes(true) && (
        <>
          <div className="border-b border-gray-200 px-5 pt-4">
            <CHEKIOTabs
              value={activeTab}
              onValueChange={(value) => handleTabChange(value as TabValue)}
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

          <div>
            {activeTab === TabValue.ACTIVE && (
              <TabActive onDownloadExcelReady={handleDownloadExcelReady} />
            )}
            {activeTab === TabValue.EXPIRING && (
              <TabExpiring onDownloadExcelReady={handleDownloadExcelReady} />
            )}
            {activeTab === TabValue.RECENT_DISMISSALS && (
              <TabRecentDismissals
                onDownloadExcelReady={handleDownloadExcelReady}
              />
            )}
            {activeTab === TabValue.INACTIVE && (
              <TabInactive onDownloadExcelReady={handleDownloadExcelReady} />
            )}
          </div>
        </>
      )}

      {isProfileEmployee() && (
        <div>
          <TabActive onDownloadExcelReady={handleDownloadExcelReady} />
        </div>
      )}
    </div>
  );

  return (
    <>
      {renderContent()}

      <EmployeeModalUpsert
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingEmployee={null}
        onSuccess={handleSuccess}
      />
    </>
  );
}

export default function EmployeesPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.EMPLOYEE_MAINTENANCE
      }
    >
      <EmployeesContent />
    </AccessNotGranted>
  );
}
