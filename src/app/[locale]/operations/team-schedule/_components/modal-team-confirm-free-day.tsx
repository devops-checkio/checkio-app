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
import { useToast } from "@/hooks/use-toast";
import { useSetFreeScheduleDay } from "@/service/schedule.service";
import { useQueryClient } from "@tanstack/react-query";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { DateTime } from "luxon";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export interface TeamFreeDayEntry {
  employeeId: string;
  employeeName: string;
  date: string;
  schedule: string;
}

interface FreeDayItem extends TeamFreeDayEntry {
  id: string;
  displayDate: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

interface ModalTeamConfirmFreeDayProps {
  isOpen: boolean;
  onClose: () => void;
  entries: TeamFreeDayEntry[];
  onSuccess: () => void;
}

const localeToLuxon = (locale: string) =>
  locale === "es" ? "es" : locale === "en" ? "en" : locale === "pt" ? "pt" : "fr";

const ModalTeamConfirmFreeDay = ({
  isOpen,
  onClose,
  entries,
  onSuccess,
}: ModalTeamConfirmFreeDayProps) => {
  const t = useTranslations("operations.teamSchedule.modals.freeDay");
  const locale = useLocale();
  const luxonLocale = localeToLuxon(locale);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate } = useCookieSession();
  const [isPending, setIsPending] = useState(false);
  const [items, setItems] = useState<FreeDayItem[]>([]);
  const setFreeScheduleDay = useSetFreeScheduleDay();

  useEffect(() => {
    setItems(
      entries.map((entry, index) => ({
        ...entry,
        id: `item-${index}`,
        displayDate: DateTime.fromFormat(entry.date, "yyyy-MM-dd")
          .setLocale(luxonLocale)
          .toLocaleString({
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
        status: "pending",
      }))
    );
  }, [entries, luxonLocale]);

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
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3" />
              {t("status.error")}
            </span>
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
        );
      default:
        return null;
    }
  };

  const processFreeDays = async () => {
    setIsPending(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      setItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: "processing" } : item
        )
      );

      try {
        await setFreeScheduleDay.mutateAsync({
          date: new Date(entry.date),
          employeeId: entry.employeeId,
        });

        successCount++;
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "success" } : item
          )
        );
      } catch (error: any) {
        errorCount++;
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "error",
                  error:
                    error?.response?.data?.message || t("errorProcessDay"),
                }
              : item
          )
        );
      }
    }

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

    queryClient.invalidateQueries({ queryKey: ["GetCalendar"] });
    queryClient.invalidateQueries({ queryKey: ["GetAbsences"] });
    setIsPending(false);

    if (errorCount === 0) {
      onSuccess();
    }
  };

  return (
    <CHEKIOModal isOpen={isOpen} onClose={onClose} title={t("title")} size="lg">
      <div className="space-y-6">
        <p className="text-gray-700 flex items-center gap-3 text-base">
          <AlertCircle className="h-5 w-5 text-green-500 shrink-0" />
          {t("message")}
        </p>

        <div className="border overflow-hidden max-h-72 overflow-y-auto rounded-lg">
          <CHEKIOTable>
            <CHEKIOTableHeader>
              <tr>
                <CHEKIOTableHead>{t("table.employee")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("table.date")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("table.status")}</CHEKIOTableHead>
              </tr>
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {items.length === 0 ? (
                <tr>
                  <CHEKIOTableCell colSpan={3} className="text-center py-10">
                    <p className="text-gray-600 font-medium">{t("noDaysSelected")}</p>
                  </CHEKIOTableCell>
                </tr>
              ) : (
                items.map((item, index) => (
                  <CHEKIOTableRow key={item.id} index={index}>
                    <CHEKIOTableCell className="text-sm font-medium text-gray-900">
                      {item.employeeName}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="text-sm text-gray-600">
                      {item.displayDate}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {getStatusBadge(item.status, item.error)}
                    </CHEKIOTableCell>
                  </CHEKIOTableRow>
                ))
              )}
            </CHEKIOTableBody>
          </CHEKIOTable>
        </div>

        <div className="flex justify-end gap-4">
          <CHEKIOButton variant="secondary" onClick={onClose} disabled={isPending}>
            <X className="h-4 w-4" />
            {t("buttons.cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            variant="primary"
            onClick={processFreeDays}
            disabled={
              isPending ||
              items.length === 0 ||
              !canCreate(OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS)
            }
            className="bg-green-600 hover:bg-green-700 !text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("processing")}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {t("buttons.confirm")}
              </>
            )}
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
};

export default ModalTeamConfirmFreeDay;
