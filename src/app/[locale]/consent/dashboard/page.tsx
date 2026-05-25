"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
  CHEKIOButton,
  CHEKIOHeader,
  CHEKIOInput,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
  CHEKIOStatCard,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import {
  useConsentDashboard,
  useConsentEmployeesPending,
  useConsentEmployeesRevoked,
  type ConsentEmployeesFilterDto,
  type EmployeeConsentStatusDto,
} from "@/service/consent.service";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Hash,
  RotateCcw,
  Search,
  Shield,
  User,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";

const PURPOSE_NAME_KEYS: Record<string, string> = {
  ATTENDANCE_RECORD: "attendanceRecord",
  PHOTO_ON_CHECKIN: "photoOnCheckin",
  BIOMETRY: "biometry",
  GEOLOCATION: "geolocation",
  EMAIL: "email",
};

function getPurposeLabel(code: string, t: (key: string) => string): string {
  const key = PURPOSE_NAME_KEYS[code];
  return key ? t(`purpose.${key}` as "purpose.attendanceRecord") || code : code;
}

export default function ConsentDashboardPage() {
  const t = useTranslations("consent");
  const tDashboard = useTranslations("consent.dashboard");
  const locale = useLocale();
  const { companyId, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();

  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(10);
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingSearchApplied, setPendingSearchApplied] = useState("");

  const [revokedPage, setRevokedPage] = useState(1);
  const [revokedPageSize, setRevokedPageSize] = useState(10);
  const [revokedSearch, setRevokedSearch] = useState("");
  const [revokedSearchApplied, setRevokedSearchApplied] = useState("");

  const { data: dashboardData, isLoading: isDashboardLoading } =
    useConsentDashboard(companyId ?? undefined);

  const pendingFilters: ConsentEmployeesFilterDto = {
    companyId: companyId ?? undefined,
    page: pendingPage,
    limit: pendingPageSize,
    search: pendingSearchApplied || undefined,
  };
  const {
    data: pendingData,
    isLoading: isPendingLoading,
  } = useConsentEmployeesPending(pendingFilters);

  const revokedFilters: ConsentEmployeesFilterDto = {
    companyId: companyId ?? undefined,
    page: revokedPage,
    limit: revokedPageSize,
    search: revokedSearchApplied || undefined,
  };
  const {
    data: revokedData,
    isLoading: isRevokedLoading,
  } = useConsentEmployeesRevoked(revokedFilters);

  const handlePendingSearch = useCallback(() => {
    setPendingSearchApplied(pendingSearch);
    setPendingPage(1);
  }, [pendingSearch]);

  const handleRevokedSearch = useCallback(() => {
    setRevokedSearchApplied(revokedSearch);
    setRevokedPage(1);
  }, [revokedSearch]);

  const handlePendingPageChange = useCallback((newPage: number) => {
    setPendingPage(newPage);
  }, []);

  const handlePendingPageSizeChange = useCallback((newSize: number) => {
    setPendingPageSize(newSize);
    setPendingPage(1);
  }, []);

  const handleRevokedPageChange = useCallback((newPage: number) => {
    setRevokedPage(newPage);
  }, []);

  const handleRevokedPageSizeChange = useCallback((newSize: number) => {
    setRevokedPageSize(newSize);
    setRevokedPage(1);
  }, []);

  const pendingRecords = pendingData?.data ?? [];
  const pendingTotal = pendingData?.total ?? 0;
  const pendingTotalPages = pendingData?.totalPages ?? 1;

  const revokedRecords = revokedData?.data ?? [];
  const revokedTotal = revokedData?.total ?? 0;
  const revokedTotalPages = revokedData?.totalPages ?? 1;

  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.CONSENT_HISTORY_OPERATIONS}
    >
      <CHEKIOHeader
        title={tDashboard("title")}
        subtitle={tDashboard("subtitle")}
        breadcrumbs={[t("breadcrumbs.dashboard"), tDashboard("title")]}
      />

      {!companyId ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-24">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
            <AlertCircle className="h-10 w-10 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {tDashboard("selectCompany")}
          </p>
        </div>
      ) : (
        <>
      {/* Policy version context */}
      {dashboardData?.activePolicyVersion && (
        <p className="mb-4 text-sm text-gray-600">
          {tDashboard("metricsForPolicy", {
            version: dashboardData.activePolicyVersion,
          })}
        </p>
      )}

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CHEKIOStatCard
          title={tDashboard("totalEmployees")}
          value={dashboardData?.totalEmployees ?? 0}
          variant="blue"
          icon={Users}
          isLoading={isDashboardLoading}
        />
        <CHEKIOStatCard
          title={tDashboard("compliant")}
          value={dashboardData?.compliantCount ?? 0}
          variant="green"
          icon={Shield}
          isLoading={isDashboardLoading}
        />
        <CHEKIOStatCard
          title={tDashboard("pending")}
          value={dashboardData?.pendingCount ?? 0}
          variant="orange"
          icon={AlertCircle}
          isLoading={isDashboardLoading}
        />
        <CHEKIOStatCard
          title={tDashboard("revoked")}
          value={dashboardData?.revokedCount ?? 0}
          variant="red"
          icon={XCircle}
          isLoading={isDashboardLoading}
        />
      </div>

      {/* Pending table */}
      <div className="mb-10 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-4">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {tDashboard("employeesPending")}
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                style={{ color: `${templateUser.primary}99` }}
              />
              <CHEKIOInput
                placeholder={t("history.documentNumber")}
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && handlePendingSearch()}
              />
            </div>
            <CHEKIOButton variant="search" onClick={handlePendingSearch}>
              <Search className="h-4 w-4" />
              {t("history.search")}
            </CHEKIOButton>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isPendingLoading ? (
            <div className="p-6">
              <div className="flex animate-pulse gap-4">
                <div className="h-10 flex-1 rounded bg-gray-200" />
                <div className="h-10 w-24 rounded bg-gray-200" />
              </div>
              <div className="mt-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded bg-gray-100"
                  />
                ))}
              </div>
            </div>
          ) : pendingRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
                <Shield className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {tDashboard("noPending")}
              </h3>
              <p className="mt-1 text-center text-sm text-gray-500">
                {tDashboard("noPendingDescription")}
              </p>
            </div>
          ) : (
            <>
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>
                      <span className="flex items-center gap-2">
                        <User
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {tDashboard("employeeName")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      <span className="flex items-center gap-2">
                        <Hash
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("history.documentNumber")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>{tDashboard("pendingPurposes")}</CHEKIOTableHead>
                    <CHEKIOTableHead className="text-right">
                      {t("history.actions")}
                    </CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {pendingRecords.map((row: EmployeeConsentStatusDto, index: number) => (
                    <CHEKIOTableRow key={row.employeePublicId} index={index}>
                      <CHEKIOTableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {row.firstName} {row.lastName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {row.code}
                          </span>
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="font-mono text-sm text-gray-600 tabular-nums">
                        {row.documentNumber || "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="flex flex-wrap gap-1">
                          {(row.pendingPurposes ?? []).map((code) => (
                            <span
                              key={code}
                              className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
                            >
                              {getPurposeLabel(code, t)}
                            </span>
                          ))}
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="text-right">
                        <Link
                          href={`/${locale}/consent/history?employeePublicId=${row.employeePublicId}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          {t("history.view")}
                        </Link>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
              {pendingTotal > 0 && (
                <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {t("history.showing", {
                        current: pendingRecords.length,
                        total: pendingTotal,
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="whitespace-nowrap text-sm font-medium text-gray-700">
                        {t("history.recordsPerPage")}:
                      </label>
                      <CHEKIOSelect
                        value={pendingPageSize.toString()}
                        onValueChange={(v) =>
                          handlePendingPageSizeChange(parseInt(v, 10))
                        }
                      >
                        <CHEKIOSelectTrigger className="w-24">
                          <CHEKIOSelectValue />
                        </CHEKIOSelectTrigger>
                        <CHEKIOSelectContent>
                          {[10, 20, 50, 100].map((n) => (
                            <CHEKIOSelectItem key={n} value={n.toString()}>
                              {n}
                            </CHEKIOSelectItem>
                          ))}
                        </CHEKIOSelectContent>
                      </CHEKIOSelect>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CHEKIOButton
                      variant="secondaryBlue"
                      onClick={() => handlePendingPageChange(pendingPage - 1)}
                      disabled={pendingPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t("history.previous")}
                    </CHEKIOButton>
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
                      {t("history.page", {
                        current: pendingPage,
                        total: pendingTotalPages,
                      })}
                    </div>
                    <CHEKIOButton
                      variant="secondaryBlue"
                      onClick={() => handlePendingPageChange(pendingPage + 1)}
                      disabled={pendingPage >= pendingTotalPages}
                    >
                      {t("history.next")}
                      <ChevronRight className="h-4 w-4" />
                    </CHEKIOButton>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Revoked table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-4">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {tDashboard("employeesRevoked")}
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                style={{ color: `${templateUser.primary}99` }}
              />
              <CHEKIOInput
                placeholder={t("history.documentNumber")}
                value={revokedSearch}
                onChange={(e) => setRevokedSearch(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && handleRevokedSearch()}
              />
            </div>
            <CHEKIOButton variant="search" onClick={handleRevokedSearch}>
              <Search className="h-4 w-4" />
              {t("history.search")}
            </CHEKIOButton>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isRevokedLoading ? (
            <div className="p-6">
              <div className="flex animate-pulse gap-4">
                <div className="h-10 flex-1 rounded bg-gray-200" />
                <div className="h-10 w-24 rounded bg-gray-200" />
              </div>
              <div className="mt-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 rounded bg-gray-100" />
                ))}
              </div>
            </div>
          ) : revokedRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
                <RotateCcw className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {tDashboard("noRevoked")}
              </h3>
              <p className="mt-1 text-center text-sm text-gray-500">
                {tDashboard("noRevokedDescription")}
              </p>
            </div>
          ) : (
            <>
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>
                      <span className="flex items-center gap-2">
                        <User
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {tDashboard("employeeName")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      <span className="flex items-center gap-2">
                        <Hash
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("history.documentNumber")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>{tDashboard("revokedPurposes")}</CHEKIOTableHead>
                    <CHEKIOTableHead className="text-right">
                      {t("history.actions")}
                    </CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {revokedRecords.map((row: EmployeeConsentStatusDto, index: number) => (
                    <CHEKIOTableRow key={row.employeePublicId} index={index}>
                      <CHEKIOTableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {row.firstName} {row.lastName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {row.code}
                          </span>
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="font-mono text-sm text-gray-600 tabular-nums">
                        {row.documentNumber || "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="flex flex-wrap gap-1">
                          {(row.revokedPurposes ?? []).map((code) => (
                            <span
                              key={code}
                              className="inline-flex rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800"
                            >
                              {getPurposeLabel(code, t)}
                            </span>
                          ))}
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="text-right">
                        <Link
                          href={`/${locale}/consent/history?employeePublicId=${row.employeePublicId}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          {t("history.view")}
                        </Link>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
              {revokedTotal > 0 && (
                <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {t("history.showing", {
                        current: revokedRecords.length,
                        total: revokedTotal,
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="whitespace-nowrap text-sm font-medium text-gray-700">
                        {t("history.recordsPerPage")}:
                      </label>
                      <CHEKIOSelect
                        value={revokedPageSize.toString()}
                        onValueChange={(v) =>
                          handleRevokedPageSizeChange(parseInt(v, 10))
                        }
                      >
                        <CHEKIOSelectTrigger className="w-24">
                          <CHEKIOSelectValue />
                        </CHEKIOSelectTrigger>
                        <CHEKIOSelectContent>
                          {[10, 20, 50, 100].map((n) => (
                            <CHEKIOSelectItem key={n} value={n.toString()}>
                              {n}
                            </CHEKIOSelectItem>
                          ))}
                        </CHEKIOSelectContent>
                      </CHEKIOSelect>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CHEKIOButton
                      variant="secondaryBlue"
                      onClick={() => handleRevokedPageChange(revokedPage - 1)}
                      disabled={revokedPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t("history.previous")}
                    </CHEKIOButton>
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
                      {t("history.page", {
                        current: revokedPage,
                        total: revokedTotalPages,
                      })}
                    </div>
                    <CHEKIOButton
                      variant="secondaryBlue"
                      onClick={() => handleRevokedPageChange(revokedPage + 1)}
                      disabled={revokedPage >= revokedTotalPages}
                    >
                      {t("history.next")}
                      <ChevronRight className="h-4 w-4" />
                    </CHEKIOButton>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
        </>
      )}
    </AccessNotGranted>
  );
}
