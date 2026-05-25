"use client";

import { CHEKIOButton, CHEKIOModal } from "@/components";
import { useToast } from "@/hooks/use-toast";
import { useSetAssistanceExtraApproval } from "@/service/mantainer.service";
import axios from "axios";
import { Loader2, X, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AssistanceResponseDto } from "../../_components/assistance.dto";

function formatSecondsToHoursMinutes(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

interface AssistanceExtraRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  assistance: AssistanceResponseDto;
}

export function AssistanceExtraRejectModal({
  isOpen,
  onClose,
  onSuccess,
  assistance,
}: AssistanceExtraRejectModalProps) {
  const t = useTranslations("assistanceManagement.approval.extra.reject");
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const mutate = useSetAssistanceExtraApproval();

  const handleClose = () => {
    setIsPending(false);
    onClose();
  };

  const handleReject = async () => {
    setIsPending(true);
    try {
      await mutate.mutateAsync({
        publicId: assistance.publicId,
        status: "REJECTED",
      });
      toast({
        title: t("toast.success.title"),
        description: t("toast.success.description"),
      });
      onSuccess?.();
      handleClose();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast({
          title: t("toast.error.title"),
          description:
            error.response?.data?.message || t("toast.error.description"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("toast.error.title"),
          description: t("toast.error.description"),
          variant: "destructive",
        });
      }
    } finally {
      setIsPending(false);
    }
  };

  const employeeName = assistance.Employee
    ? `${assistance.Employee.firstName} ${assistance.Employee.lastName} ${assistance.Employee.secondLastName || ""}`.trim()
    : "-";
  const dateStr = `${String(assistance.day).padStart(2, "0")}/${String(assistance.month).padStart(2, "0")}/${assistance.year}`;
  const extraFormatted = formatSecondsToHoursMinutes(assistance.extraSeconds ?? 0);

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("title")}
      size="md"
    >
      <div className="py-4">
        <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-6">
          <h4 className="font-medium text-gray-900">{t("details.title")}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">{t("details.employee")}</span>
              <p className="text-gray-900">{employeeName}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">{t("details.date")}</span>
              <p className="text-gray-900">{dateStr}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">{t("details.extraSeconds")}</span>
              <p className="text-gray-900">{extraFormatted}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <CHEKIOButton variant="secondary" onClick={handleClose} disabled={isPending}>
            <X className="h-4 w-4" />
            {t("buttons.cancel")}
          </CHEKIOButton>
          <CHEKIOButton variant="destructive" onClick={handleReject} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("buttons.processing")}
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                {t("buttons.reject")}
              </>
            )}
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
}
