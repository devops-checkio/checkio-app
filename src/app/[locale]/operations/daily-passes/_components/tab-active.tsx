"use client";

import {
  CHEKIOActionButton,
  CHEKIOButton,
  CHEKIOLoading,
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
import {
  useDeactivateDailyPass,
  useGetActiveDailyPasses,
  useRenewDailyPass,
} from "@/service/daily-pass.service";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  QrCode,
  RotateCw,
  Trash2,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import DailyPassActionsModal from "./daily-pass-actions-modal";
import DailyPassQrModal from "./daily-pass-qr-modal";
import { DailyPassResponseDto, DailyPassStatus } from "./daily-pass.dto";

export default function TabActive() {
  const { toast } = useToast();
  const { companyId, canUpdate, canDelete } = useCookieSession();
  const t = useTranslations("dailyPasses");
  const [selectedPass, setSelectedPass] = useState<DailyPassResponseDto | null>(
    null
  );
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Get active passes with pagination
  const { data: activePassesData, isLoading } = useGetActiveDailyPasses({
    page,
    pageSize,
    sort: "desc",
    companyId: companyId ?? undefined,
  });

  // Mutations
  const deactivatePass = useDeactivateDailyPass();
  const renewPass = useRenewDailyPass();

  const handleViewPass = (pass: DailyPassResponseDto) => {
    setSelectedPass(pass);
    setIsActionsModalOpen(true);
  };

  const handleViewQr = (pass: DailyPassResponseDto) => {
    setSelectedPass(pass);
    setIsQrModalOpen(true);
  };

  const handleCloseActionsModal = () => {
    setIsActionsModalOpen(false);
    setSelectedPass(null);
  };

  const handleCloseQrModal = () => {
    setIsQrModalOpen(false);
    setSelectedPass(null);
  };

  const handleDeactivatePass = async (passId: string) => {
    try {
      await deactivatePass.mutateAsync(passId);

      toast({
        title: t("actionsModal.success"),
        description: t("actionsModal.success"),
      });

      handleCloseActionsModal();
    } catch (error) {
      toast({
        title: t("actionsModal.error"),
        description: t("actionsModal.error"),
        variant: "destructive",
      });
    }
  };

  const handleRenewPass = async (passId: string, additionalDays: number) => {
    try {
      await renewPass.mutateAsync({ publicId: passId, additionalDays });

      toast({
        title: t("actionsModal.success"),
        description: t("actionsModal.success"),
      });

      handleCloseActionsModal();
    } catch (error) {
      toast({
        title: t("actionsModal.error"),
        description: t("actionsModal.error"),
        variant: "destructive",
      });
    }
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const passes = activePassesData?.data || [];
  const pagination = activePassesData?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const getStatusBadge = (status: DailyPassStatus) => {
    switch (status) {
      case DailyPassStatus.ACTIVE:
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            {t("statusLabels.ACTIVE")}
          </span>
        );
      case DailyPassStatus.EXPIRED:
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            {t("statusLabels.EXPIRED")}
          </span>
        );
      case DailyPassStatus.DEACTIVATED:
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {t("statusLabels.DEACTIVATED")}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <CHEKIOLoading
            size="lg"
            variant="modern"
            text={t("table.loading") || "Cargando pases activos..."}
          />
        </div>
      ) : passes.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600 font-medium">
            {t("table.noData") || "No hay pases activos"}
          </p>
        </div>
      ) : (
        <>
          <CHEKIOTable>
            <CHEKIOTableHeader>
              <tr>
                <CHEKIOTableHead>{t("employee")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("startDate")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("endDate")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("reason")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("createdBy")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("createdAt")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("status")}</CHEKIOTableHead>
                {(canUpdate(OrganizationPermissionCode.DAILY_PASS_OPERATIONS) ||
                  canDelete(
                    OrganizationPermissionCode.DAILY_PASS_OPERATIONS
                  )) && <CHEKIOTableHead>{t("actions")}</CHEKIOTableHead>}
              </tr>
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {passes.map((pass, index) => (
                <CHEKIOTableRow key={pass.publicId} index={index}>
                  <CHEKIOTableCell>
                    <div>
                      <div className="font-medium">{pass.employeeName || "-"}</div>
                      <div className="text-sm text-gray-500">
                        {pass.employeeEmail || "-"}
                      </div>
                    </div>
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>
                    {pass.startDate
                      ? DateTime.fromISO(
                          typeof pass.startDate === "string"
                            ? pass.startDate
                            : pass.startDate.toISOString()
                        )
                          .toUTC()
                          .toFormat("dd/MM/yyyy")
                      : "-"}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>
                    {pass.endDate
                      ? DateTime.fromISO(
                          typeof pass.endDate === "string"
                            ? pass.endDate
                            : pass.endDate.toISOString()
                        )
                          .toUTC()
                          .toFormat("dd/MM/yyyy")
                      : "-"}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>
                    <div
                      className="max-w-xs truncate"
                      title={pass.reason || ""}
                    >
                      {pass.reason || "-"}
                    </div>
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>{pass.createdBy || "-"}</CHEKIOTableCell>
                  <CHEKIOTableCell>
                    {pass.createdAt
                      ? DateTime.fromISO(
                          typeof pass.createdAt === "string"
                            ? pass.createdAt
                            : pass.createdAt.toISOString()
                        ).toFormat("dd/MM/yyyy HH:mm")
                      : "-"}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>
                    {getStatusBadge(pass.status)}
                  </CHEKIOTableCell>
                  {(canUpdate(OrganizationPermissionCode.DAILY_PASS_OPERATIONS) ||
                    canDelete(
                      OrganizationPermissionCode.DAILY_PASS_OPERATIONS
                    )) && (
                    <CHEKIOTableCell>
                      <div className="flex flex-row gap-2 justify-center">
                        {canUpdate(
                          OrganizationPermissionCode.DAILY_PASS_OPERATIONS
                        ) && (
                          <>
                            <CHEKIOActionButton
                              variant="view"
                              onClick={() => handleViewPass(pass)}
                              aria-label={t("view")}
                              className="h-auto w-auto px-3 py-1.5 gap-1.5"
                            >
                              <Eye className="h-4 w-4" />
                              <span>{t("view")}</span>
                            </CHEKIOActionButton>
                            {pass.status === DailyPassStatus.ACTIVE && (
                              <CHEKIOActionButton
                                variant="edit"
                                onClick={() => handleViewQr(pass)}
                                aria-label={t("qrCode")}
                                className="h-auto w-auto px-3 py-1.5 gap-1.5"
                              >
                                <QrCode className="h-4 w-4" />
                                <span>{t("qrCode")}</span>
                              </CHEKIOActionButton>
                            )}
                          </>
                        )}
                        {canDelete(
                          OrganizationPermissionCode.DAILY_PASS_OPERATIONS
                        ) && (
                          <CHEKIOActionButton
                            variant="delete"
                            onClick={() => handleDeactivatePass(pass.publicId)}
                            aria-label={t("deactivate")}
                            className="h-auto w-auto px-3 py-1.5 gap-1.5"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>{t("deactivate")}</span>
                          </CHEKIOActionButton>
                        )}
                        {canUpdate(
                          OrganizationPermissionCode.DAILY_PASS_OPERATIONS
                        ) && (
                          <CHEKIOActionButton
                            variant="edit"
                            onClick={() => handleViewPass(pass)}
                            aria-label={t("renew")}
                            className="h-auto w-auto px-3 py-1.5 gap-1.5"
                          >
                            <RotateCw className="h-4 w-4" />
                            <span>{t("renew")}</span>
                          </CHEKIOActionButton>
                        )}
                      </div>
                    </CHEKIOTableCell>
                  )}
                </CHEKIOTableRow>
              ))}
            </CHEKIOTableBody>
          </CHEKIOTable>

          {passes.length > 0 && (
            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: passes.length,
                    total: pagination.totalCount,
                  }) || `Mostrando ${passes.length} de ${pagination.totalCount} resultados`}
                </div>
                {/* Selector de registros por página */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Registros por página:
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
                  {t("buttons.previous") || "Anterior"}
                </CHEKIOButton>
                <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                  {t("pagination.page", {
                    current: pagination.current,
                    total: pagination.totalPages,
                  }) || `Página ${pagination.current} de ${pagination.totalPages}`}
                </div>
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  {t("buttons.next") || "Siguiente"}
                  <ChevronRight className="h-4 w-4" />
                </CHEKIOButton>
              </div>
            </div>
          )}
        </>
      )}

      {isActionsModalOpen && selectedPass && (
        <DailyPassActionsModal
          isOpen={isActionsModalOpen}
          onClose={handleCloseActionsModal}
          pass={selectedPass}
          onDeactivate={handleDeactivatePass}
          onRenew={handleRenewPass}
        />
      )}

      {isQrModalOpen && selectedPass && (
        <DailyPassQrModal
          isOpen={isQrModalOpen}
          onClose={handleCloseQrModal}
          passPublicId={selectedPass.publicId}
          employeeName={selectedPass.employeeName}
          initialQrCode={selectedPass.qrCode}
          initialQrExpiresAt={selectedPass.qrExpiresAt}
          status={selectedPass.status}
        />
      )}
    </>
  );
}
