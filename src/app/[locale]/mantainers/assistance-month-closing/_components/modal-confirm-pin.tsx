"use client";

import { CHEKIOButton, CHEKIOInput, CHEKIOModal } from "@/components";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ModalConfirmPinProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  isLoading: boolean;
  year: number;
  month: number;
}

export default function ModalConfirmPin({
  open,
  onClose,
  onConfirm,
  isLoading,
  year,
  month,
}: ModalConfirmPinProps) {
  const t = useTranslations("mantainers.assistanceMonthClosing");
  const [pin, setPin] = useState("");

  const handleConfirm = () => {
    const trimmed = pin.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setPin("");
  };

  const handleClose = () => {
    setPin("");
    onClose();
  };

  return (
    <CHEKIOModal
      isOpen={open}
      onClose={handleClose}
      title={t("confirmPinModal.title")}
    >
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          {t("confirmPinModal.description", { month: t(`months.${month}`), year })}
        </p>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t("confirmPinModal.pinLabel")}
          </label>
          <CHEKIOInput
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder={t("confirmPinModal.pinPlaceholder")}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <CHEKIOButton
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t("buttons.cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading || pin.length < 4}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("buttons.processing")}
              </>
            ) : (
              t("confirmPinModal.confirmButton")
            )}
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
}
