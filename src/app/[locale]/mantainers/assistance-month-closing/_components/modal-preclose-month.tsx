"use client";

import { CHEKIOButton } from "@/components";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ModalPrecloseMonthProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  year: number;
  month: number;
}

export default function ModalPrecloseMonth({
  open,
  onClose,
  onConfirm,
  isLoading,
  year,
  month,
}: ModalPrecloseMonthProps) {
  const t = useTranslations("mantainers.assistanceMonthClosing");
  const monthName = t(`months.${month}`);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b bg-gray-50">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-6 h-6 text-blue-600"
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 8v4M12 16h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-xl font-semibold text-gray-900">
            {t("precloseModal.title")}
          </span>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="ml-auto text-gray-400 hover:text-gray-700 rounded-full p-1 transition"
            aria-label={t("buttons.cancel")}
            tabIndex={0}
            type="button"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
              <path
                d="M6 6l8 8M6 14L14 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 flex items-center gap-3">
            <svg
              className="w-5 h-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-base text-blue-900">
              {t("precloseModal.description")}
            </span>
          </div>
          <div className="bg-gray-100 rounded px-3 py-2 flex items-center justify-between">
            <span className="text-base font-semibold text-gray-800">
              {monthName} {year}
            </span>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-3 px-6 pb-5 border-t bg-gray-50">
          <CHEKIOButton
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[100px] rounded-lg px-4 py-2 text-gray-800 border border-gray-300 hover:bg-gray-200 transition"
            tabIndex={0}
          >
            {t("buttons.cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            variant="primary"
            onClick={onConfirm}
            disabled={isLoading}
            className={`min-w-[140px] rounded-lg px-4 py-2 flex items-center justify-center gap-2 ${
              isLoading ? "opacity-75 cursor-not-allowed" : ""
            }`}
            tabIndex={0}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>{t("buttons.processing")}</span>
              </>
            ) : (
              <span>{t("precloseModal.confirmButton")}</span>
            )}
          </CHEKIOButton>
        </div>
      </div>
    </div>
  );
}
