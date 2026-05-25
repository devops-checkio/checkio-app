"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOModal,
  CHEKIOTextarea,
} from "@/components";
import { useToast } from "@/hooks/use-toast";
import { useUpdateAbsence } from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { Loader2 } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { AbsenceResponseDto, AbsenceUpdateDto } from "./absence.dto";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";

interface AbsenceModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  absence: AbsenceResponseDto;
  onSuccess: () => void;
}

interface EditFormValues {
  startDate: string;
  endDate: string;
  reason: string;
  withoutPay: boolean;
}

export default function AbsenceModalUpsert({
  isOpen,
  onClose,
  absence,
  onSuccess,
}: AbsenceModalUpsertProps) {
  const { toast } = useToast();
  const t = useTranslations("operations.absences.edit");
  const { mutate: updateAbsence, isPending: isUpdatingAbsence } =
    useUpdateAbsence();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormValues>({
    defaultValues: {
      startDate: "",
      endDate: "",
      reason: "",
      withoutPay: false,
    },
  });

  useEffect(() => {
    if (isOpen && absence) {
      const format = (d: string | Date) => {
        const str = typeof d === "string" ? d : (d as Date).toISOString();
        return DateTime.fromISO(str).toUTC().toFormat("yyyy-MM-dd");
      };
      reset({
        startDate: format(absence.startDate),
        endDate: format(absence.endDate),
        reason: absence.reason ?? "",
        withoutPay: absence.withoutPay ?? false,
      });
    }
  }, [isOpen, absence, reset]);

  const { canUpdate } = useCookieSession();
  const hasUpdate = canUpdate(
    OrganizationPermissionCode.ASSIGNMENT_ABSENCE_OPERATIONS
  );

  if (!hasUpdate) {
    return (
      <CHEKIOModal isOpen={isOpen} onClose={onClose} title={t("title")} size="lg">
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-gray-900">{t("employeeInfo")}</h4>
            <p className="text-sm text-gray-600">
              {absence.employee?.firstName} {absence.employee?.lastName}
            </p>
            <p className="text-sm text-gray-500">
              {t("document")}: {absence.employee?.documentNumber}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{t("absenceType")}</h4>
            <p className="text-sm text-gray-600">{absence.absenceType?.name ?? "—"}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div>
              <label className="text-sm font-medium text-gray-700">{t("startDate")}</label>
              <div className="p-3 bg-white border rounded">{DateTime.fromISO(String(absence.startDate)).toFormat("yyyy-MM-dd")}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t("endDate")}</label>
              <div className="p-3 bg-white border rounded">{DateTime.fromISO(String(absence.endDate)).toFormat("yyyy-MM-dd")}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t("reason")}</label>
              <div className="p-3 bg-white border rounded">{absence.reason || "—"}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t("withoutPay")}</label>
              <div className="p-3 bg-white border rounded">{absence.withoutPay ? t("yes") : t("no")}</div>
            </div>
          </div>

          <div className="flex justify-end">
            <CHEKIOButton variant="secondary" onClick={onClose}>
              {t("cancel")}
            </CHEKIOButton>
          </div>
        </div>
      </CHEKIOModal>
    );
  }

  const onSubmit = (values: EditFormValues) => {
    const payload: AbsenceUpdateDto = {
      publicId: absence.publicId,
      startDate: values.startDate,
      endDate: values.endDate,
      reason: values.reason || undefined,
      withoutPay: values.withoutPay,
    };
    updateAbsence(payload, {
      onSuccess: () => {
        toast({
          title: t("successTitle"),
          variant: "default",
        });
        onSuccess();
        onClose();
      },
      onError: (error: unknown) => {
        handleError(error, toast);
      },
    });
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="lg"
    >
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-gray-900">{t("employeeInfo")}</h4>
          <p className="text-sm text-gray-600">
            {absence.employee?.firstName} {absence.employee?.lastName}
          </p>
          <p className="text-sm text-gray-500">
            {t("document")}: {absence.employee?.documentNumber}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">{t("absenceType")}</h4>
          <p className="text-sm text-gray-600">
            {absence.absenceType?.name ?? "—"}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("startDate")} *
              </label>
              <Controller
                name="startDate"
                control={control}
                rules={{ required: t("startDateRequired") }}
                render={({ field }) => (
                  <CHEKIOInput
                    type="date"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className={errors.startDate ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.startDate && (
                <p className="text-red-500 text-xs">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("endDate")} *
              </label>
              <Controller
                name="endDate"
                control={control}
                rules={{ required: t("endDateRequired") }}
                render={({ field }) => (
                  <CHEKIOInput
                    type="date"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className={errors.endDate ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.endDate && (
                <p className="text-red-500 text-xs">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("reason")}
            </label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <CHEKIOTextarea
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={t("reasonPlaceholder")}
                  rows={3}
                />
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <Controller
              name="withoutPay"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="withoutPay"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              )}
            />
            <label
              htmlFor="withoutPay"
              className="text-sm font-medium text-gray-700"
            >
              {t("withoutPay")}
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <CHEKIOButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isUpdatingAbsence}
            >
              {t("cancel")}
            </CHEKIOButton>
            <CHEKIOButton
              type="submit"
              variant="primary"
              disabled={isUpdatingAbsence}
            >
              {isUpdatingAbsence ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("save")
              )}
            </CHEKIOButton>
          </div>
        </form>
      </div>
    </CHEKIOModal>
  );
}
