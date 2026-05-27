"use client";

import { CHEKIOButton, CHEKIOModal } from "@/components";
import { useToast } from "@/hooks/use-toast";
import {
  useGetDailyPassById,
  useRegenerateQrCode,
} from "@/service/daily-pass.service";
import { Copy, Download, Loader2, QrCode, RefreshCw } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import {
  buildDailyPassPdfItem,
  downloadDailyPassesPdf,
  mergeDailyPassData,
} from "./daily-pass-pdf";
import { DailyPassResponseDto, DailyPassStatus } from "./daily-pass.dto";

interface DailyPassQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  passPublicId: string;
  employeeName?: string;
  initialQrCode?: string;
  initialQrExpiresAt?: string | Date;
  status?: DailyPassStatus;
  initialPassData?: Partial<DailyPassResponseDto>;
}

export default function DailyPassQrModal({
  isOpen,
  onClose,
  passPublicId,
  employeeName,
  initialQrCode,
  initialQrExpiresAt,
  status,
  initialPassData,
}: DailyPassQrModalProps) {
  const t = useTranslations("dailyPasses.qrModal");
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(0);

  const { data: passData, isLoading, refetch } = useGetDailyPassById(
    isOpen ? passPublicId : "",
  );
  const regenerateQr = useRegenerateQrCode();

  const qrCode = passData?.qrCode ?? initialQrCode;
  const qrExpiresAt = passData?.qrExpiresAt ?? initialQrExpiresAt;
  const passStatus = passData?.status ?? status;
  const displayName = passData?.employeeName ?? employeeName;
  const passInfo = mergeDailyPassData(initialPassData, passData);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const expiresAtDate = useMemo(() => {
    if (!qrExpiresAt) return null;
    return typeof qrExpiresAt === "string"
      ? new Date(qrExpiresAt)
      : qrExpiresAt;
  }, [qrExpiresAt]);

  useEffect(() => {
    if (!isOpen || !expiresAtDate) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const expiration = expiresAtDate.getTime();
      return Math.max(0, Math.floor((expiration - now) / 1000));
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, expiresAtDate]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const handleCopyToken = async () => {
    if (!qrCode) return;
    try {
      await navigator.clipboard.writeText(qrCode);
      toast({
        title: t("copySuccess.title"),
        description: t("copySuccess.description"),
      });
    } catch {
      toast({
        title: t("copyError.title"),
        description: t("copyError.description"),
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerateQr.mutateAsync(passPublicId);
      await refetch();
      toast({
        title: t("regenerateSuccess.title"),
        description: t("regenerateSuccess.description"),
      });
    } catch {
      toast({
        title: t("regenerateError.title"),
        description: t("regenerateError.description"),
        variant: "destructive",
      });
    }
  };

  const canShowQr =
    passStatus !== DailyPassStatus.DEACTIVATED && Boolean(qrCode);
  const shouldShowLoading = isLoading && !qrCode;

  const handleDownloadPdf = async () => {
    if (!qrCode || !canShowQr) return;

    setIsDownloadingPdf(true);

    try {
      const pdfItem = await buildDailyPassPdfItem(passInfo || {}, qrCode);

      await downloadDailyPassesPdf(
        [pdfItem],
        {
          title: t("pdf.title"),
          employeeName: t("pdf.employeeName"),
          employeeDocument: t("pdf.employeeDocument"),
          employeeEmail: t("pdf.employeeEmail"),
          employeeJob: t("pdf.employeeJob"),
          employeeBranch: t("pdf.employeeBranch"),
          passStartDate: t("pdf.passStartDate"),
          passEndDate: t("pdf.passEndDate"),
          generatedAt: t("pdf.generatedAt"),
          qrLabel: t("pdf.qrLabel"),
        },
        `pase_diario_${DateTime.now().toFormat("yyyyMMdd_HHmm")}.pdf`,
      );

      toast({
        title: t("downloadSuccess.title"),
        description: t("downloadSuccess.description"),
      });
    } catch {
      toast({
        title: t("downloadError.title"),
        description: t("downloadError.description"),
        variant: "destructive",
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="2xl"
    >
      <div className="flex flex-col items-center gap-4 p-4">
        {displayName && (
          <p className="text-sm text-gray-600">
            {t("employee")}: <strong>{displayName}</strong>
          </p>
        )}

        {shouldShowLoading ? (
          <div className="flex items-center gap-2 py-12 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("loading")}</span>
          </div>
        ) : !canShowQr ? (
          <p className="py-8 text-center text-sm text-gray-600">
            {t("notAvailable")}
          </p>
        ) : (
          <>
            {expiresAtDate && (
              <div className="text-center">
                <p className="text-sm text-gray-500">{t("timeRemaining")}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {String(hours).padStart(2, "0")}:
                  {String(minutes).padStart(2, "0")}:
                  {String(seconds).padStart(2, "0")}
                </p>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <QRCodeSVG value={qrCode!} size={256} level="M" title={t("qrAlt")} />
            </div>

            <p className="max-w-md text-center text-sm text-gray-600">
              {t("scanHint")}
            </p>

            <div className="flex w-full max-w-md flex-wrap justify-center gap-2">
              <CHEKIOButton variant="secondary" onClick={handleCopyToken}>
                <Copy className="h-4 w-4" />
                {t("copyCode")}
              </CHEKIOButton>
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
              >
                {isDownloadingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {t("downloadPdf")}
              </CHEKIOButton>
              {passStatus === DailyPassStatus.ACTIVE && (
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={handleRegenerate}
                  disabled={regenerateQr.isPending}
                >
                  {regenerateQr.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {t("regenerate")}
                </CHEKIOButton>
              )}
            </div>
          </>
        )}

        <div className="w-full rounded-lg border-l-4 border-blue-500 bg-blue-50 p-3 text-sm text-blue-800">
          <QrCode className="mb-1 inline h-4 w-4" /> {t("emailNote")}
        </div>
      </div>
    </CHEKIOModal>
  );
}
