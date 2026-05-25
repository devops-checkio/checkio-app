"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
  CHEKIOButton,
  CHEKIOTab,
  CHEKIOTabs,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import {
  useGetActiveDailyPasses,
  useGetExpiredDailyPasses,
} from "@/service/daily-pass.service";
import { QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import DailyPassModal from "./_components/daily-pass-modal";
import TabActive from "./_components/tab-active";
import TabExpired from "./_components/tab-expired";

function DailyPassesContent() {
  const [activeTab, setActiveTab] = useState("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { canCreate } = useCookieSession();
  const t = useTranslations("dailyPasses");

  // Get counts for tabs
  const { data: activePassesData } = useGetActiveDailyPasses({
    page: 1,
    pageSize: 1, // Just get count
    sort: "desc",
  });

  const { data: expiredPassesData } = useGetExpiredDailyPasses({
    page: 1,
    pageSize: 1, // Just get count
    sort: "desc",
  });

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {canCreate(OrganizationPermissionCode.DAILY_PASS_OPERATIONS) && (
        <div className="mb-4 flex justify-end">
          <CHEKIOButton variant="primary" onClick={handleOpenModal}>
            <QrCode className="h-4 w-4" />
            {t("createPass")}
          </CHEKIOButton>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <CHEKIOTabs value={activeTab} onValueChange={setActiveTab}>
          <CHEKIOTab
            value="active"
            label={`${t("activePasses")} (${activePassesData?.pagination?.totalCount || 0})`}
          />
          <CHEKIOTab
            value="expired"
            label={`${t("expiredPasses")} (${expiredPassesData?.pagination?.totalCount || 0})`}
          />
        </CHEKIOTabs>

        {activeTab === "active" && <TabActive />}
        {activeTab === "expired" && <TabExpired />}
      </div>

      {isModalOpen && (
        <DailyPassModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={() => {}}
        />
      )}
    </>
  );
}

export default function DailyPassesPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.DAILY_PASS_OPERATIONS
      }
    >
      <DailyPassesContent />
    </AccessNotGranted>
  );
}
