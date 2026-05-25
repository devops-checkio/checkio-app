"use client";

import {
  CHEKIOButton,
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
import { useGetApprovedFreedayRequests } from "@/service/freeday.service";
import { CalendarCheck, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { FreedayRequestModal } from "./freeday-request-modal";
import { FreedayRequestResponseDto, FreedayRequestStatus } from "./freeday.dto";

export default function TabApprovedRequests() {
  const t = useTranslations("operations.requests.freeday.approved");
  const { canUpdate, companyId } = useCookieSession();
  const [selectedRequest, setSelectedRequest] =
    useState<FreedayRequestResponseDto | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Get approved requests
  const { data: approvedRequestsData, isLoading } =
    useGetApprovedFreedayRequests({
      page,
      pageSize,
      sort: "desc",
      companyId: companyId ?? undefined,
    });

  const handleViewRequest = (request: FreedayRequestResponseDto) => {
    setSelectedRequest(request);
    setIsRequestModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsRequestModalOpen(false);
    setSelectedRequest(null);
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const requests = approvedRequestsData?.data || [];
  const pagination = approvedRequestsData?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const getStatusLabel = (status: FreedayRequestStatus) => {
    switch (status) {
      case FreedayRequestStatus.PENDING:
        return t("status.pending");
      case FreedayRequestStatus.APPROVED:
        return t("status.approved");
      case FreedayRequestStatus.REJECTED:
        return t("status.rejected");
      default:
        return "";
    }
  };

  const getStatusClass = (status: FreedayRequestStatus) => {
    switch (status) {
      case FreedayRequestStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case FreedayRequestStatus.APPROVED:
        return "bg-green-100 text-green-800";
      case FreedayRequestStatus.REJECTED:
        return "bg-red-100 text-red-800";
      default:
        return "";
    }
  };

  return (
    <>
      {isLoading ? (
        <>
          <div className="overflow-x-auto">
            <CHEKIOTable className="w-full rounded-none border-0 shadow-none">
              <CHEKIOTableHeader>
                <tr>
                  <CHEKIOTableHead>{t("table.headers.employee")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.absenceType")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.startDate")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.endDate")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.withSalary")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.requestedBy")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.approvedBy")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.approvedAt")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.status")}</CHEKIOTableHead>
                  {canUpdate(OrganizationPermissionCode.REQUEST_FREEDAY_OPERATIONS) && (
                    <CHEKIOTableHead>{t("table.headers.actions")}</CHEKIOTableHead>
                  )}
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {[...Array(10)].map((_, index) => (
                  <CHEKIOTableRow key={index} index={index}>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      <div className="mt-1 h-3 w-32 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-6 w-14 animate-pulse rounded-full bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                    </CHEKIOTableCell>
                    {canUpdate(OrganizationPermissionCode.REQUEST_FREEDAY_OPERATIONS) && (
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                      </CHEKIOTableCell>
                    )}
                  </CHEKIOTableRow>
                ))}
              </CHEKIOTableBody>
            </CHEKIOTable>
          </div>
          <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
        </>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-24">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
            <CalendarCheck className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t("table.noData")}
          </h3>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto" data-tour="freeday-table">
            <CHEKIOTable className="w-full rounded-none border-0 shadow-none">
            <CHEKIOTableHeader>
              <tr>
                <CHEKIOTableHead>{t("table.headers.employee")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("table.headers.absenceType")}</CHEKIOTableHead>
                <CHEKIOTableHead>
                  {t("table.headers.startDate")}
                </CHEKIOTableHead>
                <CHEKIOTableHead>{t("table.headers.endDate")}</CHEKIOTableHead>
                <CHEKIOTableHead>
                  {t("table.headers.withSalary")}
                </CHEKIOTableHead>
                <CHEKIOTableHead>
                  {t("table.headers.requestedBy")}
                </CHEKIOTableHead>
                <CHEKIOTableHead>
                  {t("table.headers.approvedBy")}
                </CHEKIOTableHead>
                <CHEKIOTableHead>
                  {t("table.headers.approvedAt")}
                </CHEKIOTableHead>
                <CHEKIOTableHead>{t("table.headers.status")}</CHEKIOTableHead>
                {canUpdate(
                  OrganizationPermissionCode.REQUEST_FREEDAY_OPERATIONS
                ) && (
                  <CHEKIOTableHead className="text-right">
                    {t("table.headers.actions")}
                  </CHEKIOTableHead>
                )}
              </tr>
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {requests.map(
                (request: FreedayRequestResponseDto, index: number) => (
                  <CHEKIOTableRow key={request.publicId} index={index}>
                    <CHEKIOTableCell>
                      <div>
                        <div className="font-medium">
                          {request.employeeName || "-"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.employeeEmail || "-"}
                        </div>
                      </div>
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <div className="max-w-xs truncate" title={request.absenceTypeName || request.reason || ""}>
                        {request.absenceTypeName || request.reason || "-"}
                      </div>
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {DateTime.fromISO(
                        typeof request.startDate === "string"
                          ? request.startDate
                          : request.startDate.toISOString()
                      )
                        .toUTC()
                        .toFormat("dd/MM/yyyy")}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {DateTime.fromISO(
                        typeof request.endDate === "string"
                          ? request.endDate
                          : request.endDate.toISOString()
                      )
                        .toUTC()
                        .toFormat("dd/MM/yyyy")}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          request.withSalary
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {request.withSalary ? t("yes") : t("no")}
                      </span>
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {request.requestedBy || "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {request.approvedBy || "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {request.approvedAt
                        ? DateTime.fromISO(
                            typeof request.approvedAt === "string"
                              ? request.approvedAt
                              : request.approvedAt.toISOString()
                          ).toFormat("dd/MM/yyyy HH:mm")
                        : "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(
                          request.status
                        )}`}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </CHEKIOTableCell>
                    {canUpdate(
                      OrganizationPermissionCode.REQUEST_FREEDAY_OPERATIONS
                    ) && (
                      <CHEKIOTableCell>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewRequest(request)}
                            aria-label={t("ariaLabels.viewRequest")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </CHEKIOTableCell>
                    )}
                  </CHEKIOTableRow>
                )
              )}
            </CHEKIOTableBody>
          </CHEKIOTable>
          </div>

          {requests.length > 0 && (
            <div
              className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between"
              data-tour="freeday-pagination"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: requests.length,
                    total: pagination.totalCount,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    {t("pagination.recordsPerPage")}:
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
                  {t("pagination.previous")}
                </CHEKIOButton>
                <span className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                  {t("pagination.page", {
                    current: pagination.current,
                    total: pagination.totalPages,
                  })}
                </span>
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  {t("pagination.next")}
                  <ChevronRight className="h-4 w-4" />
                </CHEKIOButton>
              </div>
            </div>
          )}
        </>
      )}

      {isRequestModalOpen && selectedRequest && (
        <FreedayRequestModal
          isOpen={isRequestModalOpen}
          onClose={handleCloseModal}
          request={selectedRequest}
          mode="view"
        />
      )}
    </>
  );
}
