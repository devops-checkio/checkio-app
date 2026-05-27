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
import { useToast } from "@/hooks/use-toast";
import {
  getDailyPassById,
  regenerateDailyPassQr,
  useGetExpiredDailyPasses,
  useRenewDailyPass,
} from "@/service/daily-pass.service";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  QrCode,
  RotateCw,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import DailyPassActionsModal from "./daily-pass-actions-modal";
import {
  buildDailyPassPdfItem,
  downloadDailyPassesPdf,
  resolveCompanyLogoUrl,
} from "./daily-pass-pdf";
import DailyPassQrModal from "./daily-pass-qr-modal";
import { DailyPassResponseDto, DailyPassStatus } from "./daily-pass.dto";

export default function TabExpired() {
  const { toast } = useToast();
  const { companyId } = useCookieSession();
  const t = useTranslations("dailyPasses");
  const [selectedPass, setSelectedPass] = useState<DailyPassResponseDto | null>(
    null
  );
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedPassIds, setSelectedPassIds] = useState<string[]>([]);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Get expired passes with pagination
  const { data: expiredPassesData, isLoading } = useGetExpiredDailyPasses({
    page,
    pageSize,
    sort: "desc",
    companyId: companyId ?? undefined,
  });

  // Mutations
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
    setSelectedPassIds([]);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
    setSelectedPassIds([]);
  }, []);

  const passes = expiredPassesData?.data || [];
  const pagination = expiredPassesData?.pagination || {
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

  const handleSelectPass = (passId: string, checked: boolean) => {
    setSelectedPassIds((prev) =>
      checked ? [...new Set([...prev, passId])] : prev.filter((id) => id !== passId)
    );
  };

  const handleSelectAllPasses = (checked: boolean) => {
    if (checked) {
      setSelectedPassIds(passes.map((pass) => pass.publicId));
      return;
    }
    setSelectedPassIds([]);
  };

  const handleBulkDownload = async () => {
    if (!selectedPassIds.length) return;

    setIsBulkDownloading(true);
    try {
      const selectedPassesResults = await Promise.allSettled(
        selectedPassIds.map(async (id) => {
          const listedPass = passes.find((pass) => pass.publicId === id);
          if (listedPass?.qrCode) {
            return listedPass;
          }

          let pass = null;

          try {
            pass = await getDailyPassById(id);
          } catch {
            // If detail endpoint fails, try regenerating QR directly
            pass = await regenerateDailyPassQr(id);
          }

          if (!pass?.qrCode) {
            try {
              pass = await regenerateDailyPassQr(id);
            } catch {
              // Last fallback: try reading the pass again
              pass = await getDailyPassById(id);
            }
          }

          return pass;
        })
      );
      const selectedPasses = selectedPassesResults
        .filter((result): result is PromiseFulfilledResult<any> => {
          return result.status === "fulfilled";
        })
        .map((result) => result.value);
      const failedCount =
        selectedPassesResults.length - selectedPasses.length;

      if (failedCount === selectedPassesResults.length) {
        toast({
          title: t("bulkPdf.backendUnavailableTitle"),
          description: t("bulkPdf.backendUnavailableDescription"),
          variant: "destructive",
        });
        return;
      }

      const validPasses = selectedPasses.filter((pass) => Boolean(pass?.qrCode));

      if (!validPasses.length) {
        toast({
          title: t("bulkPdf.noQrTitle"),
          description: t("bulkPdf.noQrDescription"),
          variant: "destructive",
        });
        return;
      }

      const companyLogo = await resolveCompanyLogoUrl();
      const pdfItems = await Promise.all(
        validPasses.map((pass) =>
          buildDailyPassPdfItem(pass, pass.qrCode!, companyLogo),
        ),
      );

      await downloadDailyPassesPdf(
        pdfItems,
        {
          title: t("qrModal.pdf.title"),
          employeeName: t("qrModal.pdf.employeeName"),
          employeeDocument: t("qrModal.pdf.employeeDocument"),
          employeeEmail: t("qrModal.pdf.employeeEmail"),
          employeeJob: t("qrModal.pdf.employeeJob"),
          employeeBranch: t("qrModal.pdf.employeeBranch"),
          passStartDate: t("qrModal.pdf.passStartDate"),
          passEndDate: t("qrModal.pdf.passEndDate"),
          generatedAt: t("qrModal.pdf.generatedAt"),
          qrLabel: t("qrModal.pdf.qrLabel"),
        },
        `pases_diarios_consolidado_${DateTime.now().toFormat("yyyyMMdd_HHmm")}.pdf`
      );

      toast({
        title: t("bulkPdf.successTitle"),
        description:
          failedCount > 0
            ? t("bulkPdf.successWithErrorsDescription", {
                count: validPasses.length,
                failed: failedCount,
              })
            : t("bulkPdf.successDescription", { count: validPasses.length }),
      });
      setSelectedPassIds([]);
    } catch {
      toast({
        title: t("bulkPdf.errorTitle"),
        description: t("bulkPdf.errorDescription"),
        variant: "destructive",
      });
    } finally {
      setIsBulkDownloading(false);
    }
  };

  return (
    <>
      {passes.length > 0 && (
        <div className="mb-3 flex justify-end">
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={handleBulkDownload}
            disabled={!selectedPassIds.length || isBulkDownloading}
          >
            {isBulkDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t("bulkPdf.downloadSelected")} ({selectedPassIds.length})
          </CHEKIOButton>
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <CHEKIOLoading
            size="lg"
            variant="modern"
            text={t("table.loading") || "Cargando pases vencidos..."}
          />
        </div>
      ) : passes.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600 font-medium">
            {t("table.noData") || "No hay pases vencidos"}
          </p>
        </div>
      ) : (
        <>
          <CHEKIOTable>
            <CHEKIOTableHeader>
              <tr>
                <CHEKIOTableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={passes.length > 0 && selectedPassIds.length === passes.length}
                    onChange={(e) => handleSelectAllPasses(e.target.checked)}
                    className="rounded"
                  />
                </CHEKIOTableHead>
                <CHEKIOTableHead>{t("employee")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("startDate")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("endDate")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("reason")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("createdBy")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("createdAt")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("updatedAt")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("status")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("actions")}</CHEKIOTableHead>
              </tr>
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {passes.map((pass, index) => (
                <CHEKIOTableRow key={pass.publicId} index={index}>
                  <CHEKIOTableCell>
                    <input
                      type="checkbox"
                      checked={selectedPassIds.includes(pass.publicId)}
                      onChange={(e) =>
                        handleSelectPass(pass.publicId, e.target.checked)
                      }
                      className="rounded"
                    />
                  </CHEKIOTableCell>
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
                        ).toFormat("dd/MM/yyyy")
                      : "-"}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>
                    {pass.endDate
                      ? DateTime.fromISO(
                          typeof pass.endDate === "string"
                            ? pass.endDate
                            : pass.endDate.toISOString()
                        ).toFormat("dd/MM/yyyy")
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
                    {pass.updatedAt
                      ? DateTime.fromISO(
                          typeof pass.updatedAt === "string"
                            ? pass.updatedAt
                            : pass.updatedAt.toISOString()
                        ).toFormat("dd/MM/yyyy HH:mm")
                      : "-"}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>
                    {getStatusBadge(pass.status)}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>
                    <div className="flex flex-row gap-2 justify-center">
                      <CHEKIOActionButton
                        variant="view"
                        onClick={() => handleViewPass(pass)}
                        aria-label={t("view")}
                        className="h-auto w-auto px-3 py-1.5 gap-1.5"
                      >
                        <Eye className="h-4 w-4" />
                        <span>{t("view")}</span>
                      </CHEKIOActionButton>
                      {pass.status !== DailyPassStatus.DEACTIVATED && (
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
                      {(pass.status === DailyPassStatus.EXPIRED ||
                        pass.status === DailyPassStatus.DEACTIVATED) && (
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
          onDeactivate={() => {
            return Promise.resolve();
          }}
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
          initialPassData={selectedPass}
        />
      )}
    </>
  );
}
