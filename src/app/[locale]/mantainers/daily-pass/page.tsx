"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
  CHEKIOButton,
  CHEKIOLoading,
  CHEKIOModal,
  CHEKIOHeader,
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
import { useToast } from "@/hooks/use-toast";
import { useDailyPassTour } from "@/hooks/useDailyPassTour";
import { useDeleteDailyPass, useGetDailyPasses } from "@/service/daily-pass.service";
import { handleError } from "@/utils/error";
import {
  Activity,
  AlertCircle,
  HelpCircle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Hash,
  Loader2,
  Plus,
  QrCode,
  Ticket,
  Trash2,
  User,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import {
  DailyPassResponseDto,
  DailyPassStatus,
} from "@/app/[locale]/operations/daily-passes/_components/daily-pass.dto";
import ModalDailyPassQr from "./_components/modal-daily-pass-qr";
import DailyPassModalUpsert from "./_components/modal-daily-pass-upsert";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY_BLUE = "secondaryBlue",
}

function DailyPassContent() {
  const t = useTranslations("mantainers.dailyPass");
  const { startTour } = useDailyPassTour();
  const { toast } = useToast();
  const { canRead, canCreate, canDelete, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPassId, setDeletingPassId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState<DailyPassResponseDto | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { mutate: deleteDailyPass, isPending: isDeletingPass } =
    useDeleteDailyPass();

  const {
    data: dailyPassesData,
    isLoading,
    refetch,
  } = useGetDailyPasses({
    page,
    pageSize,
    sort: "desc",
  } as any);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingPassId(id);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingPass) {
      setIsDeleteModalOpen(false);
      setDeletingPassId(null);
      setDeleteError(null);
    }
  };

  const handleOpenQrModal = (pass: DailyPassResponseDto) => {
    setSelectedPass(pass);
    setQrModalOpen(true);
  };

  const handleCloseQrModal = () => {
    setQrModalOpen(false);
    setSelectedPass(null);
  };

  const handleDelete = (id: string) => {
    setDeleteError(null);
    deleteDailyPass(id, {
      onSuccess: () => {
        toast({
          title: t("delete.success"),
          variant: "default",
        });
        handleCloseDeleteModal();
        refetch();
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          t("delete.error");
        setDeleteError(errorMessage);
        handleError(error, toast);
      },
    });
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const dailyPasses = dailyPassesData?.data || [];
  const pagination = dailyPassesData?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const getStatusBadge = (status: DailyPassStatus) => {
    const statusConfig = {
      [DailyPassStatus.ACTIVE]: {
        className: "bg-emerald-50 text-emerald-700",
        text: t("status.active"),
      },
      [DailyPassStatus.EXPIRED]: {
        className: "bg-red-50 text-red-700",
        text: t("status.expired"),
      },
      [DailyPassStatus.DEACTIVATED]: {
        className: "bg-gray-100 text-gray-600",
        text: t("status.deactivated"),
      },
    };

    const config = statusConfig[status];
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
      >
        {config.text}
      </span>
    );
  };

  const addButton = canCreate(OrganizationPermissionCode.DAILY_PASS_OPERATIONS) ? (
    <CHEKIOButton variant={ButtonVariant.PRIMARY} onClick={handleOpenModal}>
      <Plus className="h-4 w-4" />
      {t("buttons.add")}
    </CHEKIOButton>
  ) : null;

  const canShowTour = isLoading || dailyPasses.length > 0;

  return (
    <>
      <CHEKIOHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[
          t("breadcrumbs.dashboard"),
          t("breadcrumbs.maintainers"),
          t("breadcrumbs.dailyPass"),
        ]}
        actions={
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={() => startTour()}
            disabled={!canShowTour}
            title={!canShowTour ? t("table.noDataDescription") : undefined}
          >
            <HelpCircle className="h-4 w-4" />
            {t("tour.startButton")}
          </CHEKIOButton>
        }
      />
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <CHEKIOLoading
              size="lg"
              variant="modern"
              text={t("table.loading")}
            />
          </div>
        ) : dailyPasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <Ticket className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
            {addButton && (
              <CHEKIOButton
                variant={ButtonVariant.PRIMARY}
                onClick={handleOpenModal}
                className="mt-6 gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("buttons.add")}
              </CHEKIOButton>
            )}
          </div>
        ) : (
          <>
            <div
              className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3"
              data-tour="daily-pass-toolbar"
            >
              {addButton}
            </div>
            <div className="overflow-x-auto" data-tour="daily-pass-table">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[180px]">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.name")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Hash className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.documentNumber")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Activity className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.status")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      <span className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.expiresAt")}
                      </span>
                    </CHEKIOTableHead>
                    {canDelete(
                      OrganizationPermissionCode.DAILY_PASS_OPERATIONS
                    ) && (
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {dailyPasses.map((pass: DailyPassResponseDto, index: number) => (
                    <CHEKIOTableRow key={pass.publicId} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                        {pass.employeeName ||
                          (pass.employee
                            ? `${pass.employee.firstName ?? ""} ${pass.employee.lastName ?? ""}`.trim() || "-"
                            : "-")}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 font-mono text-sm text-gray-600">
                        {pass.employee?.documentNumber || "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        {getStatusBadge(pass.status)}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {DateTime.fromISO(
                          typeof pass.endDate === "string"
                            ? pass.endDate
                            : pass.endDate.toISOString()
                        ).toFormat("dd/MM/yyyy HH:mm")}
                      </CHEKIOTableCell>
                      {canDelete(
                        OrganizationPermissionCode.DAILY_PASS_OPERATIONS
                      ) && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {pass.status === DailyPassStatus.ACTIVE &&
                              pass.qrCode && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenQrModal(pass)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                                  title={t("buttons.viewQrCode")}
                                  aria-label={t("ariaLabels.viewQrCode")}
                                >
                                  <QrCode className="h-4 w-4" />
                                </button>
                              )}
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(pass.publicId)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                              title={t("buttons.delete")}
                              aria-label={t("ariaLabels.deletePass")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </CHEKIOTableCell>
                      )}
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>

            <div
              className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between"
              data-tour="daily-pass-pagination"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: dailyPasses.length,
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
                  variant={ButtonVariant.SECONDARY_BLUE}
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
                  variant={ButtonVariant.SECONDARY_BLUE}
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  {t("pagination.next")}
                  <ChevronRight className="h-4 w-4" />
                </CHEKIOButton>
              </div>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <DailyPassModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={() => refetch()}
          organizationRef="your-organization-ref"
        />
      )}

      {canDelete(OrganizationPermissionCode.DAILY_PASS_OPERATIONS) && (
        <CHEKIOModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          title={t("delete.title")}
          size="md"
        >
          <div className="space-y-6">
            <p className="text-gray-700 flex items-center gap-3 text-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              {t("delete.message")}
            </p>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-red-700 text-sm">{deleteError}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <CHEKIOButton
                variant="secondary"
                onClick={handleCloseDeleteModal}
                disabled={isDeletingPass}
              >
                <X className="h-4 w-4" />
                {t("buttons.cancel")}
              </CHEKIOButton>
              <CHEKIOButton
                variant="destructive"
                onClick={() => {
                  if (deletingPassId) {
                    handleDelete(deletingPassId);
                  }
                }}
                disabled={isDeletingPass}
              >
                {isDeletingPass ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("delete.deleting")}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {t("buttons.delete")}
                  </>
                )}
              </CHEKIOButton>
            </div>
          </div>
        </CHEKIOModal>
      )}

      {qrModalOpen && selectedPass && (
        <ModalDailyPassQr
          isOpen={qrModalOpen}
          onClose={handleCloseQrModal}
          qrCode={selectedPass.qrCode || ""}
          expiresAt={
            selectedPass.qrExpiresAt
              ? typeof selectedPass.qrExpiresAt === "string"
                ? new Date(selectedPass.qrExpiresAt)
                : selectedPass.qrExpiresAt
              : selectedPass.endDate
              ? typeof selectedPass.endDate === "string"
                ? new Date(selectedPass.endDate)
                : selectedPass.endDate
              : undefined
          }
        />
      )}
    </>
  );
}

export default function DailyPassPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.DAILY_PASS_OPERATIONS
      }
    >
      <DailyPassContent />
    </AccessNotGranted>
  );
}
