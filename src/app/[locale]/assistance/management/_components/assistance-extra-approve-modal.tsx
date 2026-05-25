"use client";

import { CHEKIOButton, CHEKIOInput, CHEKIOModal } from "@/components";
import { useToast } from "@/hooks/use-toast";
import { useSetAssistanceExtraApproval } from "@/service/mantainer.service";
import axios from "axios";
import { CheckCircle, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AssistanceResponseDto } from "../../_components/assistance.dto";

function formatSecondsToHoursMinutes(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

interface AssistanceExtraApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  assistance: AssistanceResponseDto;
}

export function AssistanceExtraApproveModal({
  isOpen,
  onClose,
  onSuccess,
  assistance,
}: AssistanceExtraApproveModalProps) {
  const t = useTranslations("assistanceManagement.approval.extra.approve");
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const totalExtraSeconds = assistance.extraSeconds ?? 0;
  const totalExtraMinutes = Math.ceil(totalExtraSeconds / 60);
  const [approvedMinutes, setApprovedMinutes] = useState(totalExtraMinutes);
  const mutate = useSetAssistanceExtraApproval();

  useEffect(() => {
    if (isOpen) {
      setApprovedMinutes(Math.ceil(totalExtraSeconds / 60));
    }
  }, [isOpen, totalExtraSeconds]);

  const handleClose = () => {
    setIsPending(false);
    onClose();
  };

  const handleApprove = async () => {
    setIsPending(true);
    try {
      const approvedSeconds =
        approvedMinutes >= totalExtraMinutes
          ? undefined
          : Math.min(approvedMinutes * 60, totalExtraSeconds);
      await mutate.mutateAsync({
        publicId: assistance.publicId,
        status: "APPROVED",
        ...(approvedSeconds !== undefined && { approvedSeconds }),
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
  const extraFormatted = formatSecondsToHoursMinutes(
    assistance.extraSeconds ?? 0,
  );

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
              <span className="font-medium text-gray-500">
                {t("details.employee")}
              </span>
              <p className="text-gray-900">{employeeName}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">
                {t("details.date")}
              </span>
              <p className="text-gray-900">{dateStr}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">
                {t("details.extraSeconds")}
              </span>
              <p className="text-gray-900">{extraFormatted}</p>
            </div>
          </div>
        </div>
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm">
          {t("warningNoUndo")}
        </p>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("amountToApprove")}
          </label>
          <CHEKIOInput
            type="number"
            min={0}
            max={totalExtraMinutes}
            value={approvedMinutes}
            onChange={(e) => {
              const v = e.target.valueAsNumber;
              if (!Number.isNaN(v))
                setApprovedMinutes(
                  Math.max(0, Math.min(totalExtraMinutes, Math.floor(v))),
                );
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            {t("amountToApproveHint", { max: totalExtraMinutes })}
          </p>
        </div>
        <div className="flex justify-end gap-4">
          <CHEKIOButton
            variant="secondary"
            onClick={handleClose}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
            {t("buttons.cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            variant="primary"
            onClick={handleApprove}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("buttons.processing")}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                {t("buttons.approve")}
              </>
            )}
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
}
