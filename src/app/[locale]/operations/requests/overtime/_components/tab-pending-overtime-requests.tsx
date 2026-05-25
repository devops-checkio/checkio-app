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
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useGetPendingOvertimeRequests } from "@/service/overtime-request.service";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { OvertimeRequestApproveModal } from "./overtime-request-approve-modal";
import { OvertimeRequestModal } from "./overtime-request-modal";
import { OvertimeRequestRejectModal } from "./overtime-request-reject-modal";
import { formatOvertimeIsoForTable } from "./overtime-request-datetime";
import {
  OvertimeRequestResponseDto,
  OvertimeRequestType,
} from "./overtime-request.dto";
import { PendingOvertimeTableHeadRow } from "./overtime-tab-table-heads";

export default function TabPendingOvertimeRequests() {
  const t = useTranslations("operations.requests.overtime.tabs.pending");
  const { canUpdate, companyId, getTemplateUser } = useCookieSession();
  const templatePrimary = getTemplateUser().primary;
  const showActionsColumn = canUpdate(
    OrganizationPermissionCode.REQUEST_OVERTIME_APPROVAL_OPERATIONS,
  );
  const [selectedRequest, setSelectedRequest] =
    useState<OvertimeRequestResponseDto | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: pendingRequestsData, isLoading } =
    useGetPendingOvertimeRequests({
      page,
      pageSize,
      sort: "desc",
      companyId: companyId ?? undefined,
    });

  const handleViewRequest = (request: OvertimeRequestResponseDto) => {
    setSelectedRequest(request);
    setIsRequestModalOpen(true);
  };

  const handleApproveRequest = (request: OvertimeRequestResponseDto) => {
    setSelectedRequest(request);
    setIsApproveModalOpen(true);
  };

  const handleRejectRequest = (request: OvertimeRequestResponseDto) => {
    setSelectedRequest(request);
    setIsRejectModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsRequestModalOpen(false);
    setIsApproveModalOpen(false);
    setIsRejectModalOpen(false);
    setSelectedRequest(null);
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const getTypeLabel = (type: OvertimeRequestType) => {
    switch (type) {
      case OvertimeRequestType.PER_SCHEDULE:
        return t("types.perSchedule");
      case OvertimeRequestType.PER_HOURS:
        return t("types.perHours");
      default:
        return type;
    }
  };

  const data = pendingRequestsData?.data || [];
  const pagination = pendingRequestsData?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  return (
    <>
      {isLoading ? (
        <>
          <div className="overflow-x-auto">
            <CHEKIOTable className="rounded-none border-0 shadow-none">
              <CHEKIOTableHeader>
                <PendingOvertimeTableHeadRow
                  t={t}
                  templatePrimary={templatePrimary}
                  showActionsColumn={showActionsColumn}
                />
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {[...Array(10)].map((_, index) => (
                  <CHEKIOTableRow key={index} index={index}>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      <div className="mt-1 h-3 w-32 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                    </CHEKIOTableCell>
                    {showActionsColumn && (
                      <CHEKIOTableCell className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                        </div>
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
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
            <Clock className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t("table.noData")}
          </h3>
          <p className="mt-1 max-w-md text-center text-sm text-gray-500">
            {t("table.noDataDescription")}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <CHEKIOTable className="rounded-none border-0 shadow-none">
            <CHEKIOTableHeader>
              <PendingOvertimeTableHeadRow
                t={t}
                templatePrimary={templatePrimary}
                showActionsColumn={showActionsColumn}
              />
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {data.map(
                (request: OvertimeRequestResponseDto, index: number) => (
                  <CHEKIOTableRow key={request.publicId} index={index}>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.employeeName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.employeeEmail}
                        </div>
                      </div>
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          request.type === OvertimeRequestType.PER_SCHEDULE
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {getTypeLabel(request.type)}
                      </span>
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 text-sm tabular-nums text-gray-600">
                      {formatOvertimeIsoForTable(request.startDate)}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 text-sm tabular-nums text-gray-600">
                      {request.endDate
                        ? formatOvertimeIsoForTable(request.endDate)
                        : "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 text-sm tabular-nums text-gray-600">
                      {request.aditionHoursBeforeMinutes || "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 text-sm tabular-nums text-gray-600">
                      {request.aditionHoursAfterMinutes || "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 text-sm tabular-nums text-gray-600">
                      {formatOvertimeIsoForTable(request.createdAt)}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                        {t("status.pending")}
                      </span>
                    </CHEKIOTableCell>
                    {showActionsColumn && (
                      <CHEKIOTableCell className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleViewRequest(request)}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                            title={t("buttons.view")}
                            aria-label={t("ariaLabels.view")}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveRequest(request)}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                            title={t("buttons.approve")}
                            aria-label={t("ariaLabels.approve")}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(request)}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                            title={t("buttons.reject")}
                            aria-label={t("ariaLabels.reject")}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </CHEKIOTableCell>
                    )}
                  </CHEKIOTableRow>
                ),
              )}
            </CHEKIOTableBody>
          </CHEKIOTable>
          </div>

          {data.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: data.length,
                    total: pagination.totalCount,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    {t("pagination.recordsPerPage")}
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
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
                  {t("pagination.page", {
                    current: pagination.current,
                    total: pagination.totalPages,
                  })}
                </div>
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
        <OvertimeRequestModal
          isOpen={isRequestModalOpen}
          onClose={handleCloseModals}
          request={selectedRequest}
          mode="view"
        />
      )}

      {isApproveModalOpen && selectedRequest && (
        <OvertimeRequestApproveModal
          isOpen={isApproveModalOpen}
          onClose={handleCloseModals}
          onSuccess={handleCloseModals}
          request={selectedRequest}
        />
      )}

      {isRejectModalOpen && selectedRequest && (
        <OvertimeRequestRejectModal
          isOpen={isRejectModalOpen}
          onClose={handleCloseModals}
          onSuccess={handleCloseModals}
          request={selectedRequest}
        />
      )}
    </>
  );
}
