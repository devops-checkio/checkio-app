"use client";

import { CHEKIOButton, CHEKIOModal } from "@/components";
import { useGetDeviceClaimCode, useGetDeviceQrCode } from "@/service/mantainer.service";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { DeviceType } from "./device.dto";
import type { DeviceResponseDto } from "./device.dto";
import { useToast } from "@/hooks/use-toast";

interface ModalDeviceQrProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDevice: DeviceResponseDto;
  qrCode?: string;
  claimCodeFromCreate?: string;
}

export default function ModalDeviceQr({
  isOpen,
  onClose,
  selectedDevice,
  qrCode: qrCodeProp,
  claimCodeFromCreate,
}: ModalDeviceQrProps) {
  const t = useTranslations("mantainers.devices");
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const isKiosko = selectedDevice.type === DeviceType.KIOSKO;

  const { data: qrData, isLoading: qrLoading } = useGetDeviceQrCode(
    !isKiosko ? selectedDevice.publicId : null,
  );
  const {
    data: claimData,
    isLoading: claimLoading,
    refetch: refetchClaimCode,
    isFetching: claimFetching,
  } = useGetDeviceClaimCode(
    isKiosko ? selectedDevice.publicId : null,
    isOpen && isKiosko && !claimCodeFromCreate,
  );

  const qrCode = qrCodeProp ?? qrData?.qrCode;
  const claimCode = claimCodeFromCreate ?? claimData?.claimCode;
  const showQrLoading = !isKiosko && !qrCodeProp && !!selectedDevice.publicId && qrLoading;
  const showClaimLoading =
    isKiosko && !claimCodeFromCreate && (claimLoading || claimFetching);

  const handleCopyClaimCode = useCallback(() => {
    if (claimCode) {
      navigator.clipboard.writeText(claimCode);
      toast({
        title: t("qr.claimCode.copied"),
      });
    }
  }, [claimCode, toast, t]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(15 * 60);
    }
  }, [isOpen]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isKiosko ? t("qr.titleKiosko") : t("qr.title")
      }
      size="4xl"
    >
      <div className="flex gap-8">
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-500">{t("qr.timeRemaining")}</p>
            <p className="text-2xl font-bold text-blue-600">
              {String(minutes).padStart(2, "0")}:
              {String(seconds).padStart(2, "0")}
            </p>
          </div>

          {isKiosko ? (
            <>
              {showClaimLoading ? (
                <div className="flex flex-col items-center justify-center w-[300px] min-h-[120px] bg-white rounded-lg shadow-md p-6">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                  <p className="mt-4 text-sm text-gray-500">
                    {t("qr.claimCode.generating")}
                  </p>
                </div>
              ) : claimCode ? (
                <div className="w-full max-w-sm">
                  <div className="p-6 bg-white rounded-lg shadow-md border-2 border-blue-100">
                    <p className="text-sm text-gray-500 mb-2 text-center">
                      {t("qr.claimCode.label")}
                    </p>
                    <p className="text-3xl font-mono font-bold text-center tracking-widest text-gray-900 mb-4">
                      {claimCode}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <CHEKIOButton
                        variant="secondaryBlue"
                        onClick={handleCopyClaimCode}
                        className="text-sm px-3 py-1.5"
                      >
                        <Copy className="h-4 w-4" />
                        {t("qr.claimCode.copy")}
                      </CHEKIOButton>
                      {!claimCodeFromCreate && (
                        <CHEKIOButton
                          variant="refresh"
                          onClick={() => refetchClaimCode()}
                          disabled={claimFetching}
                          className="text-sm px-3 py-1.5"
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${claimFetching ? "animate-spin" : ""}`}
                          />
                          {t("qr.claimCode.regenerate")}
                        </CHEKIOButton>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500 text-center">
                    {t("qr.claimCode.instruction")}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-[300px] min-h-[120px] bg-white rounded-lg shadow-md p-6">
                  <CHEKIOButton
                    variant="primary"
                    onClick={() => refetchClaimCode()}
                    disabled={claimFetching}
                    className="px-4 py-2"
                  >
                    {claimFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {t("qr.claimCode.generate")}
                  </CHEKIOButton>
                </div>
              )}
            </>
          ) : (
            <>
              {showQrLoading ? (
                <div className="flex flex-col items-center justify-center w-[300px] h-[300px] bg-white rounded-lg shadow-md">
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                  <p className="mt-4 text-sm text-gray-500">
                    {t("qr.generating")}
                  </p>
                </div>
              ) : qrCode ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCode}
                    alt="QR Code"
                    width={300}
                    height={300}
                    className="max-w-[300px] p-4 bg-white rounded-lg shadow-md"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-[300px] h-[300px] bg-white rounded-lg shadow-md">
                  <p className="text-sm text-gray-500">{t("qr.generating")}</p>
                </div>
              )}
              <p className="mt-4 text-sm text-gray-500 text-center">
                {t("qr.scanInstruction")}
              </p>
            </>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            {isKiosko
              ? t("qr.stepsKiosko.title")
              : t("qr.steps.title")}
          </h3>
          <ol className="space-y-4">
            {(isKiosko
              ? [
                  t("qr.stepsKiosko.step1"),
                  t("qr.stepsKiosko.step2"),
                  t("qr.stepsKiosko.step3"),
                  t("qr.stepsKiosko.step4"),
                ]
              : [
                  t("qr.steps.step1"),
                  t("qr.steps.step2"),
                  t("qr.steps.step3"),
                  t("qr.steps.step4"),
                  t("qr.steps.step5"),
                ]
            ).map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <p className="text-gray-600">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-blue-700">
              <strong className="font-semibold">{t("qr.noteLabel")}</strong>{" "}
              {isKiosko ? t("qr.noteKiosko") : t("qr.note")}
            </p>
          </div>
        </div>
      </div>
    </CHEKIOModal>
  );
}
