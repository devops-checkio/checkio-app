"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
  CHEKIOTab,
  CHEKIOTabs,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useGetAuditLogStats } from "@/service/audit.service";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AuditAction } from "./_components/audit.dto";
import TabAllLogs from "./_components/tab-all-logs";
import TabAuthentication from "./_components/tab-authentication";
import TabOperations from "./_components/tab-operations";

function AuditContent() {
  const [activeTab, setActiveTab] = useState("all");
  const t = useTranslations("audit");
  const { canRead } = useCookieSession();

  // Get stats for tab counts
  const { data: allStats } = useGetAuditLogStats();

  const { data: authStats } = useGetAuditLogStats({
    action: AuditAction.LOGIN,
  });

  const { data: operationStats } = useGetAuditLogStats({
    action: AuditAction.CREATE,
  });

  return (
    <>

      {canRead(OrganizationPermissionCode.AUDIT_OPERATIONS) ? (
        <>
          <CHEKIOTabs value={activeTab} onValueChange={setActiveTab}>
            <CHEKIOTab
          value="all"
          label={
            <div className="flex items-center gap-2">
              {t("allLogs")}
              {allStats?.totalCount !== undefined && allStats.totalCount > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                  {allStats.totalCount}
                </span>
              )}
            </div>
          }
        />
        <CHEKIOTab
          value="authentication"
          label={
            <div className="flex items-center gap-2">
              {t("authentication")}
              {authStats?.totalCount !== undefined && authStats.totalCount > 0 && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                  {authStats.totalCount}
                </span>
              )}
            </div>
          }
        />
        <CHEKIOTab
          value="operations"
          label={
            <div className="flex items-center gap-2">
              {t("crudOperations")}
              {operationStats?.totalCount !== undefined &&
                operationStats.totalCount > 0 && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">
                    {operationStats.totalCount}
                  </span>
                )}
            </div>
          }
        />
          </CHEKIOTabs>

          {activeTab === "all" && <TabAllLogs />}
          {activeTab === "authentication" && <TabAuthentication />}
          {activeTab === "operations" && <TabOperations />}
        </>
      ) : (
        <div className="p-6 text-gray-600">{t("accessDenied") || "No tiene permisos para ver los registros."}</div>
      )}
    </>
  );
}

export default function AuditPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.AUDIT_OPERATIONS // You may need to add this permission
      }
    >
      <AuditContent />
    </AccessNotGranted>
  );
}
