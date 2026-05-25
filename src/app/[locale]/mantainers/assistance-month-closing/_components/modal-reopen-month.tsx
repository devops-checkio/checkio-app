"use client";

import { CHEKIOInput, CHEKIOModal } from "@/components";
import { CheckIOButton } from "@/components/template/checkIO-button";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ModalReopenMonthProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
  year: number;
  month: number;
}

export default function ModalReopenMonth({
  open,
  onClose,
  onConfirm,
  isLoading,
  year,
  month,
}: ModalReopenMonthProps) {
  const t = useTranslations("mantainers.assistanceMonthClosing");
  const [reason, setReason] = useState("");
  const monthName = t(`months.${month}`);

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <CHEKIOModal
      isOpen={open}
      onClose={handleClose}
      title={t("reopenModal.title")}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 text-lg font-bold uppercase">
          {monthName?.[0]}
        </span>
        <span className="text-base text-gray-800 font-semibold">
          {monthName} <span className="text-gray-500 font-normal">{year}</span>
        </span>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("reopenModal.reasonLabel")}
        </label>
        <CHEKIOInput
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("reopenModal.reasonPlaceholder")}
          disabled={isLoading}
          className="w-full mb-4"
        />
        <div className="flex justify-end">
          <CheckIOButton
            variant="solid"
            color="default"
            onClick={handleConfirm}
            loading={isLoading}
            label={t("reopenModal.confirmReopen")}
            className="min-w-[120px]"
            disabled={!reason.trim() || isLoading}
          />
        </div>
      </div>
    </CHEKIOModal>
  );
}
