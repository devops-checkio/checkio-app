"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import GlobalEstablishmentAttendanceDashboard from "./_components/global-establishment-attendance-dashboard";

export default function EstablishmentsStaffingDashboardPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.ESTABLISHMENT_MAINTENANCE}
    >
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <GlobalEstablishmentAttendanceDashboard />
      </div>
    </AccessNotGranted>
  );
}
