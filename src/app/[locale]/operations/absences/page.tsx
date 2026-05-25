"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import { CHEKIOButton } from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import BatchAbsenceModal from "./_components/absence-selector-modal";
import TabBase from "./_components/tab-base";

function AbsencesContent() {
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const { canCreate } = useCookieSession();
  const t = useTranslations("operations.absences");

  const handleOpenBatchModal = () => {
    setIsBatchModalOpen(true);
  };

  const handleCloseBatchModal = () => {
    setIsBatchModalOpen(false);
  };

  const refetch = () => {
    // Handled by batch modal invalidating GetAbsences
  };

  const actions = (
    <div className="flex flex-row gap-2">
      {canCreate(OrganizationPermissionCode.ASSIGNMENT_ABSENCE_OPERATIONS) && (
        <CHEKIOButton variant="primary" onClick={handleOpenBatchModal}>
          <UserPlus className="h-4 w-4" />
          {t("buttons.batchAssignment")}
        </CHEKIOButton>
      )}
    </div>
  );

  return (
    <>
      <div className="mb-4 flex justify-end">{actions}</div>
      <TabBase />

      {isBatchModalOpen && (
        <BatchAbsenceModal
          isOpen={isBatchModalOpen}
          onClose={handleCloseBatchModal}
          onSuccess={refetch}
        />
      )}
    </>
  );
}

export default function AbsencesPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.ASSIGNMENT_ABSENCE_OPERATIONS
      }
    >
      <AbsencesContent />
    </AccessNotGranted>
  );
}
