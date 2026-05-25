"use client";

import { CHEKIOButton, CHEKIOModal } from "@/components";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ModalCloseMonthProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  year: number;
  month: number;
}

export default function ModalCloseMonth({
  open,
  onClose,
  onConfirm,
  isLoading,
  year,
  month,
}: ModalCloseMonthProps) {
  const t = useTranslations("mantainers.assistanceMonthClosing");
  const monthName = t(`months.${month}`);

  return (
    <CHEKIOModal
      isOpen={open}
      onClose={onClose}
      title={t("closeModal.title")}
    >
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          {t("closeModal.description")}
        </p>
        <p className="text-sm font-medium text-gray-800">
          {monthName} {year}
        </p>
        <div className="flex justify-end gap-4 pt-4">
          <CHEKIOButton
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {t("buttons.cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            variant="primary"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("buttons.processing")}
              </>
            ) : (
              t("buttons.confirm")
            )}
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
}
