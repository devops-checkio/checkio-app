"use client";

import TimeBankConfigModal from "@/app/[locale]/mantainers/time-bank/_components/time-bank-config-modal";
import {
  CHEKIOActionButton,
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
import { useGetAssistancesPendingDelayApproval } from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Settings,
  User,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useState } from "react";
import { AssistanceResponseDto } from "../../_components/assistance.dto";
import { AssistanceDelayApproveModal } from "./assistance-delay-approve-modal";
import { AssistanceDelayRejectModal } from "./assistance-delay-reject-modal";

function formatSecondsToHoursMinutes(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

interface TabPendingDelayApprovalProps {
  filters?: Record<string, unknown>;
}

export default function TabPendingDelayApproval({
  filters = {},
}: TabPendingDelayApprovalProps) {
  const t = useTranslations("assistanceManagement.tabs.delayApproval");
  const queryClient = useQueryClient();
  const { companyId, canCreate, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const [selectedAssistance, setSelectedAssistance] =
    useState<AssistanceResponseDto | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isTimeBankConfigModalOpen, setIsTimeBankConfigModalOpen] =
    useState(false);
  const [timeBankConfigEmployeePublicId, setTimeBankConfigEmployeePublicId] =
    useState<string | null>(null);
  const [timeBankConfigEmployeeName, setTimeBankConfigEmployeeName] =
    useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const queryParams = {
    ...filters,
    page,
    pageSize,
    sort: "desc" as const,
    companyId: companyId ?? undefined,
  };

  const { data, isLoading } =
    useGetAssistancesPendingDelayApproval(queryParams);

  const handleApprove = (assistance: AssistanceResponseDto) => {
    setSelectedAssistance(assistance);
    setIsApproveModalOpen(true);
  };

  const handleReject = (assistance: AssistanceResponseDto) => {
    setSelectedAssistance(assistance);
    setIsRejectModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsApproveModalOpen(false);
    setIsRejectModalOpen(false);
    setSelectedAssistance(null);
  };

  const handleOpenTimeBankConfig = (item: AssistanceResponseDto) => {
    const publicId = item.Employee?.publicId;
    if (!publicId) return;
    const name = item.Employee
      ? `${item.Employee.firstName} ${item.Employee.lastName} ${item.Employee.secondLastName || ""}`.trim()
      : "";
    setTimeBankConfigEmployeePublicId(publicId);
    setTimeBankConfigEmployeeName(name);
    setIsTimeBankConfigModalOpen(true);
  };

  const handleCloseTimeBankConfig = () => {
    setIsTimeBankConfigModalOpen(false);
    setTimeBankConfigEmployeePublicId(null);
    setTimeBankConfigEmployeeName("");
  };

  const handleTimeBankConfigSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["GetAssistancesPendingExtraApproval"],
    });
    queryClient.invalidateQueries({
      queryKey: ["GetAssistancesPendingDelayApproval"],
    });
    queryClient.invalidateQueries({ queryKey: ["GetAssistanceCount"] });
    handleCloseTimeBankConfig();
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const list = data?.data ?? [];
  const paginationData = data?.pagination ?? {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const TableHeaderCell = ({
    icon: Icon,
    label,
  }: {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    label: string;
  }) => (
    <CHEKIOTableHead className="min-w-[100px]">
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
        {label}
      </span>
    </CHEKIOTableHead>
  );

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <>
            <div
              className="overflow-x-auto"
              data-tour="assistance-management-tab-table"
            >
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <TableHeaderCell icon={User} label={t("headers.employee")} />
                    <TableHeaderCell icon={Calendar} label={t("headers.date")} />
                    <TableHeaderCell icon={Clock} label={t("headers.delaySeconds")} />
                    <TableHeaderCell icon={Clock} label={t("headers.earlyDepartureSeconds")} />
                    <CHEKIOTableHead className="min-w-[100px] text-right">{t("headers.actions")}</CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {[...Array(pageSize)].map((_, index) => (
                    <CHEKIOTableRow key={index} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                        </div>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>
            <div
              className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between"
              data-tour="assistance-management-tab-pagination"
            >
              <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
              <div className="flex gap-2">
                <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
          </>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <Clock className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t("noData")}</h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              No hay solicitudes de atrasos pendientes de aprobación.
            </p>
          </div>
        ) : (
          <>
            <div
              className="overflow-x-auto"
              data-tour="assistance-management-tab-table"
            >
            <CHEKIOTable className="rounded-none border-0 shadow-none">
              <CHEKIOTableHeader>
                <tr>
                  <TableHeaderCell icon={User} label={t("headers.employee")} />
                  <TableHeaderCell icon={Calendar} label={t("headers.date")} />
                  <TableHeaderCell icon={Clock} label={t("headers.delaySeconds")} />
                  <TableHeaderCell icon={Clock} label={t("headers.earlyDepartureSeconds")} />
                  <CHEKIOTableHead className="min-w-[100px] text-right">{t("headers.actions")}</CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {list.map((item: AssistanceResponseDto, index: number) => (
                <CHEKIOTableRow key={item.publicId} index={index}>
                  <CHEKIOTableCell className="px-5 py-3.5">
                    <div className="font-medium">
                      {item.Employee
                        ? `${item.Employee.firstName} ${item.Employee.lastName} ${item.Employee.secondLastName || ""}`.trim()
                        : "-"}
                    </div>
                  </CHEKIOTableCell>
                  <CHEKIOTableCell className="px-5 py-3.5">
                    {String(item.day).padStart(2, "0")}/
                    {String(item.month).padStart(2, "0")}/{item.year}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell className="px-5 py-3.5">
                    {formatSecondsToHoursMinutes(item.delaySeconds ?? 0)}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell className="px-5 py-3.5">
                    {formatSecondsToHoursMinutes(
                      item.earlyDepartureSeconds ?? 0,
                    )}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell className="px-5 py-3.5">
                    <div className="flex flex-row gap-2 justify-center items-center flex-wrap">
                      {item.hasTimeBank === false ? (
                        <div className="flex flex-row gap-2 items-center flex-wrap">
                          {canCreate(
                            OrganizationPermissionCode.BANK_MAINTENANCE,
                          ) ? (
                            <CHEKIOActionButton
                              variant="view"
                              onClick={() => handleOpenTimeBankConfig(item)}
                              className="h-auto w-auto px-3 py-1.5 gap-1.5"
                            >
                              <Settings className="h-4 w-4" />
                              <span>{t("configureTimeBank")}</span>
                            </CHEKIOActionButton>
                          ) : (
                            <Link
                              href="/mantainers/time-bank"
                              className="text-primary hover:underline text-sm font-medium"
                            >
                              {t("noTimeBank")}
                            </Link>
                          )}
                        </div>
                      ) : (
                        <CHEKIOActionButton
                          variant="edit"
                          onClick={() => handleApprove(item)}
                          className="h-auto w-auto px-3 py-1.5 gap-1.5"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{t("approve")}</span>
                        </CHEKIOActionButton>
                      )}
                      <CHEKIOActionButton
                        variant="delete"
                        onClick={() => handleReject(item)}
                        className="h-auto w-auto px-3 py-1.5 gap-1.5"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>{t("reject")}</span>
                      </CHEKIOActionButton>
                    </div>
                  </CHEKIOTableCell>
                </CHEKIOTableRow>
              ))}
            </CHEKIOTableBody>
          </CHEKIOTable>
            </div>

          {list.length > 0 && (
            <div
              className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between"
              data-tour="assistance-management-tab-pagination"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: list.length,
                    total: paginationData.totalCount,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    {t("pagination.recordsPerPage")}:
                  </label>
                  <CHEKIOSelect
                    value={pageSize.toString()}
                    onValueChange={(value) =>
                      handlePageSizeChange(parseInt(value, 10))
                    }
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
                    current: paginationData.current,
                    total: paginationData.totalPages,
                  })}
                </span>
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= paginationData.totalPages}
                >
                  {t("pagination.next")}
                  <ChevronRight className="h-4 w-4" />
                </CHEKIOButton>
              </div>
            </div>
          )}
        </>
        )}
      </div>

      {isApproveModalOpen && selectedAssistance && (
        <AssistanceDelayApproveModal
          isOpen={isApproveModalOpen}
          onClose={handleCloseModals}
          onSuccess={handleCloseModals}
          assistance={selectedAssistance}
        />
      )}

      {isRejectModalOpen && selectedAssistance && (
        <AssistanceDelayRejectModal
          isOpen={isRejectModalOpen}
          onClose={handleCloseModals}
          onSuccess={handleCloseModals}
          assistance={selectedAssistance}
        />
      )}

      <TimeBankConfigModal
        isOpen={isTimeBankConfigModalOpen}
        onClose={handleCloseTimeBankConfig}
        onSuccess={handleTimeBankConfigSuccess}
        preselectedEmployeePublicId={
          timeBankConfigEmployeePublicId ?? undefined
        }
        preselectedEmployeeName={timeBankConfigEmployeeName || undefined}
      />
    </>
  );
}
