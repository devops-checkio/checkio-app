"use client";

import { CHEKIOButton, CHEKIOModal } from "@/components";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructionsModal({
  isOpen,
  onClose,
}: InstructionsModalProps) {
  const t = useTranslations("webMarking");

  const INSTRUCTIONS = [
    t("instruction1"),
    t("instruction2"),
    t("instruction3"),
    t("instruction4"),
    t("instruction5"),
  ] as const;

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("instructions")}
      size="3xl"
    >
      <div className="flex gap-8">
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-5 text-gray-900 tracking-tight">
            {t("instructionsTitle")}
          </h3>
          <ol className="space-y-3">
            {INSTRUCTIONS.map((instruction, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/50 transition-colors duration-200"
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed pt-0.5">
                  {instruction}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-xl border border-blue-200/60">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm text-blue-800">
                <strong className="font-bold">{t("important")}</strong>{" "}
                {t("importantNote")}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <CHEKIOButton
          variant="primary"
          onClick={onClose}
          className="px-6 h-11 transition-all duration-200 hover:shadow-lg rounded-xl"
        >
          {t("understood")}
        </CHEKIOButton>
      </div>
    </CHEKIOModal>
  );
}
