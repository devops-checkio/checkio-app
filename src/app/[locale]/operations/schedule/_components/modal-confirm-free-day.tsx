"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useToast } from "@/hooks/use-toast";
import { useSetFreeScheduleDay } from "@/service/schedule.service";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { DateTime } from "luxon";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { SelectedDayDto } from "./employee-schedule.types";

interface FreeDayItem {
  id: string;
  date: string;
  schedule: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

interface ModalConfirmFreeDayProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDays: Record<string, SelectedDayDto>;
  employeeId: string;
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLoadingText?: string;
  cleanSelectedDays?: () => void;
}

const localeToLuxon = (locale: string) =>
  locale === "es"
    ? "es"
    : locale === "en"
      ? "en"
      : locale === "pt"
        ? "pt"
        : "fr";

const ModalConfirmFreeDay = ({
  isOpen,
  onClose,
  selectedDays,
  employeeId,
  title,
  message,
  buttonText,
  buttonLoadingText,
  cleanSelectedDays,
}: ModalConfirmFreeDayProps) => {
  const t = useTranslations("operations.schedule.modalFreeDay");
  const locale = useLocale();
  const luxonLocale = localeToLuxon(locale);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate } = useCookieSession();
  const [isPending, setIsPending] = useState(false);
  const [freeDays, setFreeDays] = useState<FreeDayItem[]>([]);
  const setFreeScheduleDay = useSetFreeScheduleDay();

  const modalTitle = title ?? t("title");
  const modalMessage = message ?? t("message");
  const confirmButtonText = buttonText ?? t("buttons.confirm");
  const confirmButtonLoadingText = buttonLoadingText ?? t("processing");

  useEffect(() => {
    if (Object.keys(selectedDays).length > 0) {
      setFreeDays(
        Object.keys(selectedDays).map((day, index) => ({
          id: `day-${index}`,
          date: DateTime.fromFormat(day, "yyyy-MM-dd")
            .setLocale(luxonLocale)
            .toLocaleString({
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          schedule: selectedDays[day].schedule,
          status: "pending",
        })),
      );
    } else {
      setFreeDays([]);
    }
  }, [selectedDays, luxonLocale]);

  const getScheduleBadge = (text: string) => {
    switch (text) {
      case "Holiday":
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            {t("badges.holiday")}
          </span>
        );
      case "Free":
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            {t("badges.free")}
          </span>
        );
      default:
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {t("badges.shift")}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string, error?: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {t("status.pending")}
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            <Loader2 className="w-3 h-3 animate-spin" />
            {t("status.processing")}
          </span>
        );
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            {t("status.success")}
          </span>
        );
      case "error":
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3" />
              {t("status.error")}
            </span>
            {error && (
              <span className="text-xs text-red-500 mt-1">{error}</span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const processFreeDays = async () => {
    setIsPending(true);

    // Procesar cada día libre secuencialmente
    for (let i = 0; i < freeDays.length; i++) {
      const day = freeDays[i];
      const dateKey = Object.keys(selectedDays)[i];

      // Actualizar el estado a "procesando" para el día actual
      setFreeDays((prev) =>
        prev.map((d, index) =>
          index === i ? { ...d, status: "processing" } : d,
        ),
      );

      try {
        await setFreeScheduleDay.mutateAsync({
          date: new Date(dateKey),
          employeeId,
        });

        // Actualizar el estado a éxito
        setFreeDays((prev) =>
          prev.map((d, index) =>
            index === i ? { ...d, status: "success" } : d,
          ),
        );
      } catch (error: any) {
        // Actualizar el estado a error
        setFreeDays((prev) =>
          prev.map((d, index) =>
            index === i
              ? {
                  ...d,
                  status: "error",
                  error: error?.response?.data?.message || t("errorProcessDay"),
                }
              : d,
          ),
        );
      }
    }

    // Verificar si todos fueron exitosos
    const successCount = freeDays.filter(
      (day) => day.status === "success",
    ).length;
    const errorCount = freeDays.filter((day) => day.status === "error").length;

    if (errorCount === 0) {
      toast({
        title: t("toast.successTitle"),
        description: t("toast.successDescription"),
      });
    } else {
      toast({
        title: t("toast.completedWithErrorsTitle"),
        description: t("toast.completedWithErrorsDescription", {
          successCount,
          errorCount,
        }),
        variant: "destructive",
      });
    }

    // Invalidar consultas para actualizar los datos
    queryClient.invalidateQueries({
      queryKey: ["GetCalendar"],
    });

    setIsPending(false);
    cleanSelectedDays?.();
  };

  return (
    <CHEKIOModal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <div className="space-y-6">
        <p className="text-gray-700 flex items-center gap-3 text-lg">
          <AlertCircle className="h-5 w-5 text-green-500" />
          {modalMessage}
        </p>

        <div className="border overflow-hidden max-h-64 overflow-y-auto">
          <CHEKIOTable>
            <CHEKIOTableHeader>
              <tr>
                <CHEKIOTableHead>{t("table.date")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("table.schedule")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("table.status")}</CHEKIOTableHead>
              </tr>
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {freeDays.length === 0 ? (
                <tr>
                  <CHEKIOTableCell colSpan={3} className="text-center py-10">
                    <p className="text-gray-600 font-medium">
                      {t("noDaysSelected")}
                    </p>
                  </CHEKIOTableCell>
                </tr>
              ) : (
                freeDays.map((day, index) => (
                  <CHEKIOTableRow key={day.id} index={index}>
                    <CHEKIOTableCell className="font-medium">
                      {day.date}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {getScheduleBadge(day.schedule)}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {getStatusBadge(day.status, day.error)}
                    </CHEKIOTableCell>
                  </CHEKIOTableRow>
                ))
              )}
            </CHEKIOTableBody>
          </CHEKIOTable>
        </div>

        <div className="flex justify-end gap-4">
          <CHEKIOButton
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
            {t("buttons.cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            variant="primary"
            onClick={processFreeDays}
            disabled={
              isPending ||
              (!canCreate(
                OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS,
              ) &&
                !canCreate(
                  OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS,
                ))
            }
            className="bg-green-600 hover:bg-green-700 !text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {confirmButtonLoadingText}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {confirmButtonText}
              </>
            )}
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
};

export default ModalConfirmFreeDay;
