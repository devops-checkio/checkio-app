"use client";

import { CHEKIOButton, CHEKIOModal } from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { useToast } from "@/hooks/use-toast";
import { useApproveFreedayRequest } from "@/service/freeday.service";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { FreedayRequestResponseDto } from "./freeday.dto";

interface FreedayApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  request: FreedayRequestResponseDto;
}

interface ApproveFormData {
  approvedBy: string;
}

const FreedayApproveModal = ({
  isOpen,
  onClose,
  onSuccess,
  request,
}: FreedayApproveModalProps) => {
  const t = useTranslations("operations.requests.freeday.approveModal");
  const { toast } = useToast();
  const { user } = useCookieSession();
  const [isPending, setIsPending] = useState(false);

  const {
    handleSubmit,
    reset,
  } = useForm<ApproveFormData>({
    defaultValues: {
      approvedBy: user?.publicId || "",
    },
  });

  const approveFreedayRequest = useApproveFreedayRequest();

  const handleClose = () => {
    reset();
    setIsPending(false);
    onClose();
  };

  const onSubmit: SubmitHandler<ApproveFormData> = async (data) => {
    setIsPending(true);

    try {
      await approveFreedayRequest.mutateAsync({
        publicId: request.publicId,
        approvedBy: data.approvedBy,
      });

      toast({
        title: t("toastSuccessTitle"),
        description: t("toastSuccessDescription"),
      });

      onSuccess?.();
      handleClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: t("toastErrorTitle"),
        description:
          err.response?.data?.message ?? t("toastErrorDescription"),
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <CHEKIOModal
      title={t("title")}
      isOpen={isOpen}
      onClose={() => {
        if (!isPending) {
          handleClose();
        }
      }}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <h4 className="font-medium text-gray-900">{t("summaryTitle")}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">{t("employee")}:</span>
              <p className="text-gray-600">{request.employeeName ?? "—"}</p>
            </div>
            <div>
              <span className="font-medium">{t("reason")}:</span>
              <p className="text-gray-600">
                {request.absenceTypeName || request.reason || "—"}
              </p>
            </div>
            <div>
              <span className="font-medium">{t("startDate")}:</span>
              <p className="text-gray-600">
                {DateTime.fromISO(String(request.startDate))
                  .toUTC()
                  .toFormat("dd/MM/yyyy")}
              </p>
            </div>
            <div>
              <span className="font-medium">{t("endDate")}:</span>
              <p className="text-gray-600">
                {DateTime.fromISO(String(request.endDate))
                  .toUTC()
                  .toFormat("dd/MM/yyyy")}
              </p>
            </div>
            <div>
              <span className="font-medium">{t("withSalary")}:</span>
              <p className="text-gray-600">
                {request.withSalary ? t("yes") : t("no")}
              </p>
            </div>
            <div>
              <span className="font-medium">{t("requestedBy")}:</span>
              <p className="text-gray-600">
                {request.requestedByName || request.requestedBy || "—"}
              </p>
            </div>
            {request.observation && (
              <div className="col-span-2">
                <span className="font-medium">{t("observation")}:</span>
                <p className="text-gray-600">{request.observation}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-green-50 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
              aria-hidden
            />
            <div>
              <h4 className="font-medium text-green-900">
                {t("confirmTitle")}
              </h4>
              <p className="mt-1 text-sm text-green-800">
                {t("confirmDescription")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <CHEKIOButton
            type="button"
            variant="secondaryBlue"
            onClick={handleClose}
            disabled={isPending}
          >
            <XCircle className="h-4 w-4" />
            {t("cancel")}
          </CHEKIOButton>

          <CHEKIOButton type="submit" variant="primary" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("approving")}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {t("approve")}
              </>
            )}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
};

export { FreedayApproveModal };
