"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
} from "@/components";
import SystemInput from "@/components/ui/system-input";
import { useCookieSession } from "@/context/useCookieSession";
import { useToast } from "@/hooks/use-toast";
import { useRejectHourlyPermission } from "@/service/hourly-permission.service";
import axios from "axios";
import { AlertCircle, Loader2, X } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  HourlyPermissionResponseDto,
  HourlyPermissionType,
} from "./hourly-permission.dto";

interface HourlyPermissionRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  request: HourlyPermissionResponseDto;
}

interface RejectFormData {
  rejectionReason: string;
}

const HourlyPermissionRejectModal = ({
  isOpen,
  onClose,
  onSuccess,
  request,
}: HourlyPermissionRejectModalProps) => {
  const t = useTranslations("operations.requests.hourlyPermission.modal.reject");
  const { toast } = useToast();
  const { user } = useCookieSession();
  const [isPending, setIsPending] = useState(false);
  const rejectHourlyPermission = useRejectHourlyPermission();

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectFormData>({
    defaultValues: {
      rejectionReason: "",
    },
  });

  const handleClose = () => {
    reset();
    setIsPending(false);
    onClose();
  };

  const onSubmit: SubmitHandler<RejectFormData> = async (data) => {
    setIsPending(true);

    try {
      await rejectHourlyPermission.mutateAsync({
        publicId: request.publicId,
        rejectedBy: user?.publicId || user?.email || "",
        rejectionReason: data.rejectionReason,
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
          description: error.response?.data.message || t("toast.error.description"),
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

  const getTitle = () => {
    switch (request.type) {
      case HourlyPermissionType.ENTRY:
        return t("title.entry");
      case HourlyPermissionType.EXIT:
        return t("title.exit");
      case HourlyPermissionType.BOTH:
        return t("title.both");
      default:
        return t("title.default");
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="py-4">
        {/* Request Details */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-6">
          <h4 className="font-medium text-gray-900">
            {t("details.title")}
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">{t("details.fields.employee")}:</span>
              <p className="text-gray-600">{request.employeeName}</p>
            </div>
            <div>
              <span className="font-medium">{t("details.fields.date")}:</span>
              <p className="text-gray-600">
                {DateTime.fromISO(request.date as string).toFormat(
                  "dd/MM/yyyy"
                )}
              </p>
            </div>

            {/* Conditional fields based on permission type */}
            {request.type === HourlyPermissionType.ENTRY && (
              <>
                <div>
                  <span className="font-medium">{t("details.fields.startTime")}:</span>
                  <p className="text-gray-600">
                    {DateTime.fromISO(request.startTime as string).toFormat(
                      "HH:mm"
                    )}
                  </p>
                </div>
                <div>
                  <span className="font-medium">{t("details.fields.reasonEntry")}:</span>
                  <p className="text-gray-600">{request.reason}</p>
                </div>
              </>
            )}

            {request.type === HourlyPermissionType.EXIT && (
              <>
                <div>
                  <span className="font-medium">{t("details.fields.endTime")}:</span>
                  <p className="text-gray-600">
                    {DateTime.fromISO(request.endTime as string).toFormat(
                      "HH:mm"
                    )}
                  </p>
                </div>
                <div>
                  <span className="font-medium">
                    {t("details.fields.reasonExit")}:
                  </span>
                  <p className="text-gray-600">{request.reason}</p>
                </div>
              </>
            )}

            {request.type === HourlyPermissionType.BOTH && (
              <>
                <div>
                  <span className="font-medium">{t("details.fields.startTime")}:</span>
                  <p className="text-gray-600">
                    {DateTime.fromISO(request.startTime as string).toFormat(
                      "HH:mm"
                    )}
                  </p>
                </div>
                <div>
                  <span className="font-medium">{t("details.fields.endTime")}:</span>
                  <p className="text-gray-600">
                    {DateTime.fromISO(request.endTime as string).toFormat(
                      "HH:mm"
                    )}
                  </p>
                </div>
                <div>
                  <span className="font-medium">{t("details.fields.reasonBoth")}:</span>
                  <p className="text-gray-600">{request.reason}</p>
                </div>
              </>
            )}

            <div>
              <span className="font-medium">{t("details.fields.type")}:</span>
              <p className="text-gray-600">{getTypeLabel(request.type)}</p>
            </div>
            <div>
              <span className="font-medium">{t("details.fields.withSalary")}:</span>
              <p className="text-gray-600">
                {request.withSalary ? t("details.fields.withSalaryYes") : t("details.fields.withSalaryNo")}
              </p>
            </div>

            {request.observation && (
              <div className="col-span-2">
                <span className="font-medium">{t("details.fields.observation")}:</span>
                <p className="text-gray-600">{request.observation}</p>
              </div>
            )}
            <div>
              <span className="font-medium">{t("details.fields.requestedBy")}:</span>
              <p className="text-gray-600">{request.requestedBy}</p>
            </div>
            <div>
              <span className="font-medium">{t("details.fields.createdAt")}:</span>
              <p className="text-gray-600">
                {DateTime.fromISO(request.createdAt as string).toFormat(
                  "dd/MM/yyyy HH:mm"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Rejection Reason */}
        <div className="mb-6">
          <SystemInput
            control={control}
            label={t("fields.rejectionReason")}
            attribute="rejectionReason"
            errors={errors}
            rules={{
              required: t("validation.rejectionReasonRequired"),
            }}
            type="textarea"
            placeholder={
              request.type === HourlyPermissionType.ENTRY
                ? t("placeholders.rejectionReason.entry")
                : request.type === HourlyPermissionType.EXIT
                ? t("placeholders.rejectionReason.exit")
                : t("placeholders.rejectionReason.both")
            }
          />
        </div>

        {/* Warning Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 text-lg mt-0.5 h-5 w-5" />
            <div>
              <h4 className="font-medium text-red-800 mb-1">
                {t("confirmation.title")}
              </h4>
              <p className="text-red-700 text-sm">
                {request.type === HourlyPermissionType.ENTRY &&
                  t("confirmation.description.entry")}
                {request.type === HourlyPermissionType.EXIT &&
                  t("confirmation.description.exit")}
                {request.type === HourlyPermissionType.BOTH &&
                  t("confirmation.description.both")}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
            type="submit"
            variant="destructive"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("buttons.processing")}
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                {t("buttons.reject")}
              </>
            )}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
};

export { HourlyPermissionRejectModal };
