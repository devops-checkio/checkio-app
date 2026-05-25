"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
  CHEKIOButton,
  CHEKIOHeader,
  CHEKIOInput,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
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
  useGetConsentHistory,
  type ConsentHistoryFilterDto,
  type ConsentHistoryItemDto,
} from "@/service/consent.service";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  FileText,
  Hash,
  Monitor,
  RotateCcw,
  Search,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import { DateTime } from "luxon";
import { QRCodeSVG } from "qrcode.react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const PURPOSE_CODES = [
  "ATTENDANCE_RECORD",
  "PHOTO_ON_CHECKIN",
  "BIOMETRY",
  "GEOLOCATION",
  "EMAIL",
] as const;

const STATUS_VALUES = ["ACTIVE", "DECLINED", "REVOKED"] as const;

function getPurposeNameKey(code: string): string {
  const map: Record<string, string> = {
    ATTENDANCE_RECORD: "attendanceRecord",
    PHOTO_ON_CHECKIN: "photoOnCheckin",
    BIOMETRY: "biometry",
    GEOLOCATION: "geolocation",
    EMAIL: "email",
  };
  return map[code] || code;
}

export default function ConsentHistoryPage() {
  const t = useTranslations("consent");
  const tHistory = useTranslations("consent.history");
  const { companyId, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const searchParams = useSearchParams();
  const employeePublicIdFromUrl = searchParams.get("employeePublicId");
  const employeePublicIdFilter = employeePublicIdFromUrl?.trim() || undefined;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const locale = useLocale();
  const [documentNumberFilter, setDocumentNumberFilter] = useState("");
  const [purposeCodeFilter, setPurposeCodeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [viewingItem, setViewingItem] = useState<ConsentHistoryItemDto | null>(
    null
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = useCallback((value: string, field: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }, []);

  const filters: ConsentHistoryFilterDto = {
    companyId: companyId ?? undefined,
    page,
    limit: pageSize,
    documentNumber: documentNumberFilter.trim() || undefined,
    purposeCode: purposeCodeFilter,
    status: statusFilter,
    employeePublicId: employeePublicIdFilter,
  };

  const { data, isLoading } = useGetConsentHistory(filters);

  const records = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setDocumentNumberFilter("");
    setPurposeCodeFilter(undefined);
    setStatusFilter(undefined);
    setPage(1);
  }, []);

  const getPurposeLabel = (code: string) => {
    const key = getPurposeNameKey(code);
    return t(`purpose.${key}` as "purpose.attendanceRecord") || code;
  };

  const getEmployeeName = (item: ConsentHistoryItemDto) => {
    if (item.Employee) {
      const first = (item.Employee as { firstName?: string }).firstName ?? "";
      const last = (item.Employee as { lastName?: string }).lastName ?? "";
      return `${first} ${last}`.trim() || item.employeeCode || "-";
    }
    return item.employeeCode || "-";
  };

  const getDocumentNumber = (item: ConsentHistoryItemDto) =>
    item.Employee?.documentNumber ?? "-";

  const getAcceptedContentText = (item: ConsentHistoryItemDto): string => {
    const content = item.acceptedContent;
    if (!content) return "";
    if (typeof content === "string") return content;
    if (typeof content !== "object") return "";
    const localeContent = content[locale as keyof typeof content];
    if (localeContent) return localeContent;
    return (
      content.es ??
      content.en ??
      content.pt ??
      content.fr ??
      (Object.values(content)[0] as string) ??
      ""
    );
  };

  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.CONSENT_HISTORY_OPERATIONS}
    >
      <CHEKIOHeader
        title={tHistory("title")}
        subtitle={tHistory("subtitle")}
        breadcrumbs={[t("breadcrumbs.dashboard"), t("breadcrumbs.consentHistory")]}
      />
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Filters toolbar */}
        <div className="grid grid-cols-1 gap-4 border-b border-gray-200 bg-gray-50/50 px-5 py-4 md:grid-cols-12">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              {tHistory("documentNumber")}
            </label>
            <div className="relative">
              <Hash
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                style={{ color: `${templateUser.primary}99` }}
              />
              <CHEKIOInput
                placeholder="RUT, DNI, CPF..."
                value={documentNumberFilter}
                onChange={(e) => setDocumentNumberFilter(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              {tHistory("purpose")}
            </label>
            <CHEKIOSelect
              value={purposeCodeFilter ?? "all"}
              onValueChange={(v) =>
                setPurposeCodeFilter(v === "all" ? undefined : v)
              }
            >
              <CHEKIOSelectTrigger>
                <CHEKIOSelectValue placeholder={tHistory("allPurposes")} />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                <CHEKIOSelectItem value="all">
                  {tHistory("allPurposes")}
                </CHEKIOSelectItem>
                {PURPOSE_CODES.map((code) => (
                  <CHEKIOSelectItem key={code} value={code}>
                    {getPurposeLabel(code)}
                  </CHEKIOSelectItem>
                ))}
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              {tHistory("status")}
            </label>
            <CHEKIOSelect
              value={statusFilter ?? "all"}
              onValueChange={(v) =>
                setStatusFilter(v === "all" ? undefined : v)
              }
            >
              <CHEKIOSelectTrigger>
                <CHEKIOSelectValue placeholder={tHistory("allStatuses")} />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                <CHEKIOSelectItem value="all">
                  {tHistory("allStatuses")}
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value="ACTIVE">
                  {tHistory("active")}
                </CHEKIOSelectItem>
                {STATUS_VALUES.map((status) => (
                  <CHEKIOSelectItem key={status} value={status}>
                    {status === "ACTIVE"
                      ? tHistory("active")
                      : status === "DECLINED"
                        ? tHistory("declined")
                        : tHistory("revoked")}
                  </CHEKIOSelectItem>
                ))}
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          </div>
          <div className="flex flex-col justify-end gap-2 md:col-span-6 md:flex-row md:items-end">
            <CHEKIOButton
              variant="search"
              onClick={handleSearch}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {tHistory("search")}
            </CHEKIOButton>
            <CHEKIOButton
              variant="secondaryBlue"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {tHistory("clear")}
            </CHEKIOButton>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="overflow-x-auto">
            <CHEKIOTable className="rounded-none border-0 shadow-none">
              <CHEKIOTableHeader>
                <tr>
                  <CHEKIOTableHead className="min-w-[120px]">
                    <span className="flex items-center gap-2">
                      <User
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {tHistory("employeeName")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[120px]">
                    <span className="flex items-center gap-2">
                      <Hash
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {tHistory("documentNumber")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[120px]">
                    <span className="flex items-center gap-2">
                      <FileText
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {tHistory("purpose")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[100px]">
                    <span className="flex items-center gap-2">
                      <Hash
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {tHistory("policyVersion")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[100px]">
                    <span className="flex items-center gap-2">
                      <Shield
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {tHistory("status")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[120px]">
                    <span className="flex items-center gap-2">
                      <Clock
                        className="h-4 w-4"
                        style={{ color: `${templateUser.primary}99` }}
                      />
                      {tHistory("acceptedAt")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[100px]">
                    {tHistory("method")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[80px] text-right">
                    {tHistory("actions")}
                  </CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {Array.from({ length: 8 }).map((_, index) => (
                  <CHEKIOTableRow key={index} index={index}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                      <CHEKIOTableCell
                        key={j}
                        className="px-5 py-3.5"
                      >
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                    ))}
                  </CHEKIOTableRow>
                ))}
              </CHEKIOTableBody>
            </CHEKIOTable>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <Shield className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {tHistory("noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {tHistory("noDataDescription")}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <User
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {tHistory("employeeName")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Hash
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {tHistory("documentNumber")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <FileText
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {tHistory("purpose")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Hash
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {tHistory("policyVersion")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Shield
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {tHistory("status")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Clock
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {tHistory("acceptedAt")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      {tHistory("method")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[80px] text-right">
                      {tHistory("actions")}
                    </CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {records.map((item, index) => (
                    <CHEKIOTableRow key={item.id} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 flex-shrink-0 text-gray-500" />
                          <div>
                            <span className="text-sm font-medium">
                              {getEmployeeName(item)}
                            </span>
                            <span className="block text-xs text-gray-500">
                              {item.employeeCode ?? "-"}
                            </span>
                          </div>
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 font-mono text-sm text-gray-600">
                        {getDocumentNumber(item)}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {getPurposeLabel(
                          item.Purpose?.code ?? String(item.purposeId)
                        )}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {item.Policy?.version ?? item.policyVersionId}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                            item.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : item.status === "DECLINED"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                          }`}
                        >
                          {item.status === "ACTIVE"
                            ? tHistory("active")
                            : item.status === "DECLINED"
                              ? tHistory("declined")
                              : tHistory("revoked")}
                        </span>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs">
                            {DateTime.fromISO(
                              typeof item.acceptedAt === "string"
                                ? item.acceptedAt
                                : new Date(item.acceptedAt).toISOString()
                            ).toFormat("dd/MM/yyyy")}
                          </span>
                          <span className="text-xs text-gray-500">
                            {DateTime.fromISO(
                              typeof item.acceptedAt === "string"
                                ? item.acceptedAt
                                : new Date(item.acceptedAt).toISOString()
                            ).toFormat("HH:mm:ss")}
                          </span>
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {item.method}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingItem(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                          title={tHistory("viewAcceptedContent")}
                          aria-label={tHistory("viewAcceptedContent")}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {tHistory("showing", {
                    current: records.length,
                    total,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <label className="whitespace-nowrap text-sm font-medium text-gray-700">
                    {tHistory("recordsPerPage")}:
                  </label>
                  <CHEKIOSelect
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      handlePageSizeChange(parseInt(value, 10));
                    }}
                  >
                    <CHEKIOSelectTrigger className="w-24">
                      <CHEKIOSelectValue />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      <CHEKIOSelectItem value="10">10</CHEKIOSelectItem>
                      <CHEKIOSelectItem value="20">20</CHEKIOSelectItem>
                      <CHEKIOSelectItem value="50">50</CHEKIOSelectItem>
                      <CHEKIOSelectItem value="100">100</CHEKIOSelectItem>
                      <CHEKIOSelectItem value="200">200</CHEKIOSelectItem>
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {tHistory("previous")}
                </CHEKIOButton>
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
                  {tHistory("page", {
                    current: page,
                    total: totalPages,
                  })}
                </div>
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  {tHistory("next")}
                  <ChevronRight className="h-4 w-4" />
                </CHEKIOButton>
              </div>
            </div>
          </>
        )}
      </div>

      <CHEKIOModal
        isOpen={!!viewingItem}
        onClose={() => {
          setViewingItem(null);
          setCopiedField(null);
        }}
        title={tHistory("acceptedContentTitle")}
        size="4xl"
      >
        {viewingItem && (
          <div className="space-y-6">
            {/* Header: employee, purpose, status badge */}
            <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 pb-4">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {getEmployeeName(viewingItem)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getPurposeLabel(
                        viewingItem.Purpose?.code ??
                          String(viewingItem.purposeId)
                      )}
                      {viewingItem.Policy?.version != null && (
                        <>
                          {" · "}
                          {tHistory("policyVersionLabel")}{" "}
                          {viewingItem.Policy.version}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-medium sm:self-center ${
                    viewingItem.status === "ACTIVE"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : viewingItem.status === "DECLINED"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {viewingItem.status === "ACTIVE" ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : viewingItem.status === "DECLINED" ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {viewingItem.status === "ACTIVE"
                    ? tHistory("active")
                    : viewingItem.status === "DECLINED"
                      ? tHistory("declined")
                      : tHistory("revoked")}
                </span>
              </div>
            </div>

            {/* Content: accepted text */}
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="h-4 w-4 text-gray-500" />
                {tHistory("acceptedContentTitle")}
              </h3>
              <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50 px-5 py-4">
                {getAcceptedContentText(viewingItem) ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                    {getAcceptedContentText(viewingItem)}
                  </p>
                ) : (
                  <p className="text-sm italic text-gray-500">
                    {tHistory("noContent")}
                  </p>
                )}
              </div>
            </div>

            {/* Audit trail */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-5 py-3">
                <Shield className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-800">
                  {tHistory("auditTrail")}
                </h3>
              </div>
              <div className="grid gap-6 p-5 sm:grid-cols-2">
                {/* Metadata */}
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="flex items-center gap-1.5 font-medium text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      {tHistory("acceptedAtLabel")}
                    </dt>
                    <dd className="mt-0.5 font-medium text-gray-900 tabular-nums">
                      {DateTime.fromISO(
                        typeof viewingItem.acceptedAt === "string"
                          ? viewingItem.acceptedAt
                          : new Date(viewingItem.acceptedAt).toISOString()
                      ).toFormat("dd/MM/yyyy HH:mm:ss")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">
                      {tHistory("methodLabel")}
                    </dt>
                    <dd className="mt-0.5 text-gray-800">
                      {viewingItem.method ?? tHistory("notAvailable")}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 font-medium text-gray-500">
                      <Hash className="h-3.5 w-3.5" />
                      {tHistory("recordId")}
                    </dt>
                    <dd className="mt-0.5 flex items-center gap-2">
                      <code className="block flex-1 truncate rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                        {viewingItem.publicId ??
                          viewingItem.id ??
                          tHistory("notAvailable")}
                      </code>
                      {(viewingItem.publicId ?? viewingItem.id) && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              String(viewingItem.publicId ?? viewingItem.id),
                              "recordId"
                            )
                          }
                          className="shrink-0 rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          title="Copy"
                          aria-label="Copy record ID"
                        >
                          {copiedField === "recordId" ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 font-medium text-gray-500">
                      <Monitor className="h-3.5 w-3.5" />
                      {tHistory("ipAddress")}
                    </dt>
                    <dd className="mt-0.5 font-mono text-xs text-gray-800">
                      {viewingItem.ipAddress ?? tHistory("notAvailable")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">
                      {tHistory("deviceInfo")}
                    </dt>
                    <dd className="mt-0.5 break-words text-xs text-gray-800">
                      {viewingItem.deviceInfo ?? tHistory("notAvailable")}
                    </dd>
                  </div>
                </dl>

                {/* Integrity verification: QR + hash */}
                <div className="sm:col-span-1">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Shield className="h-4 w-4 text-gray-500" />
                    {tHistory("integrityVerification")}
                  </h4>
                  {viewingItem.integrityHash ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                        <div className="flex shrink-0 items-center justify-center rounded-lg border border-white bg-white p-2 shadow-sm">
                          <QRCodeSVG
                            value={viewingItem.integrityHash}
                            size={128}
                            level="M"
                            title={tHistory("integrityHashQR")}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {tHistory("scanToVerify")}
                        </p>
                        <div className="flex w-full items-start gap-2">
                          <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1.5 font-mono text-xs text-gray-800 shadow-sm">
                            {viewingItem.integrityHash}
                          </code>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(viewingItem.integrityHash!, "hash")
                            }
                            className="shrink-0 rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                            title="Copy hash"
                            aria-label="Copy integrity hash"
                          >
                            {copiedField === "hash" ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/30 px-4 py-6 text-center text-sm text-gray-500">
                      {tHistory("notAvailable")}
                    </div>
                  )}
                </div>
              </div>

              {/* Revocation block */}
              {viewingItem.status === "REVOKED" && (
                <div className="border-t border-gray-100 bg-red-50/30 px-5 py-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-800">
                    <RotateCcw className="h-4 w-4" />
                    {tHistory("revocationDetails")}
                  </h4>
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-medium text-gray-600">
                        {tHistory("revokedAt")}
                      </dt>
                      <dd className="mt-0.5 tabular-nums text-gray-900">
                        {viewingItem.revokedAt
                          ? DateTime.fromISO(
                              typeof viewingItem.revokedAt === "string"
                                ? viewingItem.revokedAt
                                : new Date(
                                    viewingItem.revokedAt
                                  ).toISOString()
                            ).toFormat("dd/MM/yyyy HH:mm:ss")
                          : tHistory("notAvailable")}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-600">
                        {tHistory("revokedBy")}
                      </dt>
                      <dd className="mt-0.5 text-gray-900">
                        {viewingItem.revokedBy ?? tHistory("notAvailable")}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-4">
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={() => setViewingItem(null)}
              >
                {tHistory("close")}
              </CHEKIOButton>
            </div>
          </div>
        )}
      </CHEKIOModal>
    </AccessNotGranted>
  );
}
