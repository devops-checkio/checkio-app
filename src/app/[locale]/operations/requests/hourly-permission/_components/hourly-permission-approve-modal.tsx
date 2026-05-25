"use client";

import { CHEKIOButton, CHEKIOModal } from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { useToast } from "@/hooks/use-toast";
import { useApproveHourlyPermission } from "@/service/hourly-permission.service";
import axios from "axios";
import { CheckCircle, Loader2, X } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  HourlyPermissionResponseDto,
  HourlyPermissionType,
} from "./hourly-permission.dto";

interface HourlyPermissionApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  request: HourlyPermissionResponseDto;
}

const HourlyPermissionApproveModal = ({
  isOpen,
  onClose,
  onSuccess,
  request,
}: HourlyPermissionApproveModalProps) => {
  const t = useTranslations(
    "operations.requests.hourlyPermission.modal.approve"
  );
  const { toast } = useToast();
  const { user } = useCookieSession();
  const [isPending, setIsPending] = useState(false);
  const approveHourlyPermission = useApproveHourlyPermission();

  const handleClose = () => {
    setIsPending(false);
    onClose();
  };

  const handleApprove = async () => {
    setIsPending(true);

    try {
      await approveHourlyPermission.mutateAsync({
        publicId: request.publicId,
        approvedBy: user?.publicId || user?.email || "",
      });

      toast({
        title: t("toast.success.title"),
        description: t("toast.success.description"),
      });

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        toast({
          title: t("toast.error.title"),
          description:
            error.response?.data.message || t("toast.error.description"),
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

  const getTypeLabel = (type: HourlyPermissionType) => {
    switch (type) {
      case HourlyPermissionType.ENTRY:
        return t("types.entry");
      case HourlyPermissionType.EXIT:
        return t("types.exit");
      case HourlyPermissionType.BOTH:
        return t("types.both");
      default:
        return type;
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("title")}
      size="md"
    >
      <div className="py-4">
        {/* Request Details */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-6">
          <h4 className="font-medium text-gray-900">{t("details.title")}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">
                {t("details.fields.employee")}:
              </span>
              <p className="text-gray-600">{request.employeeName}</p>
            </div>
            <div>
              <span className="font-medium">{t("details.fields.date")}:</span>
              <p className="text-gray-600">
                {DateTime.fromISO(request.date as string)
                  .toUTC()
                  .toFormat("dd/MM/yyyy")}
              </p>
            </div>
            <div>
              <span className="font-medium">
                {t("details.fields.startTime")}:
              </span>
              <p className="text-gray-600">
                {request.startTime
                  ? DateTime.fromISO(request.startTime as string)
                      .toUTC()
                      .toFormat("HH:mm")
                  : "-"}
              </p>
            </div>
            <div>
              <span className="font-medium">
                {t("details.fields.endTime")}:
              </span>
              <p className="text-gray-600">
                {request.endTime
                  ? DateTime.fromISO(request.endTime as string)
                      .toUTC()
                      .toFormat("HH:mm")
                  : "-"}
              </p>
            </div>
            <div>
              <span className="font-medium">{t("details.fields.type")}:</span>
              <p className="text-gray-600">{getTypeLabel(request.type)}</p>
            </div>
            <div>
              <span className="font-medium">
                {t("details.fields.withSalary")}:
              </span>
              <p className="text-gray-600">
                {request.withSalary
                  ? t("details.fields.withSalaryYes")
                  : t("details.fields.withSalaryNo")}
              </p>
            </div>
            <div>
              <span className="font-medium">{t("details.fields.reason")}:</span>
              <p className="text-gray-600">{request.reason}</p>
            </div>
            {request.observation && (
              <div className="col-span-2">
                <span className="font-medium">
                  {t("details.fields.observation")}:
                </span>
                <p className="text-gray-600">{request.observation}</p>
              </div>
            )}
            <div>
              <span className="font-medium">
                {t("details.fields.requestedBy")}:
              </span>
              <p className="text-gray-600">{request.requestedBy}</p>
            </div>
            <div>
              <span className="font-medium">
                {t("details.fields.createdAt")}:
              </span>
              <p className="text-gray-600">
                {DateTime.fromISO(request.createdAt as string).toFormat(
                  "dd/MM/yyyy HH:mm"
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-600 text-lg mt-0.5 h-5 w-5" />
            <div>
              <h4 className="font-medium text-green-800 mb-1">
                {t("confirmation.title")}
              </h4>
              <p className="text-green-700 text-sm">
                {t("confirmation.description")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <CHEKIOButton
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
            {t("buttons.cancel")}
          </CHEKIOButton>

          <CHEKIOButton
            type="button"
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
};

export { HourlyPermissionApproveModal };
