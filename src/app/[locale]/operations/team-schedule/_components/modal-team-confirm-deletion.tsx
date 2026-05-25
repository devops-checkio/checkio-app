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
import { useDeleteEmployeeSchedule } from "@/service/schedule.service";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { DateTime } from "luxon";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export interface TeamDeletionEntry {
  employeeId: string;
  employeeName: string;
  date: string;
  /** Tipo de celda del calendario: EMPLOYEE_SHIFT | EMPLOYEE_SCHEDULE | FREEDOM_* */
  recordType?: string;
  scheduleOptions?: Array<{
    scheduleId: string;
    scheduleCode: string;
    scheduleName?: string;
  }>;
}

/** Tipos que vienen del turno (sin override directo en BD) — no se pueden eliminar */
const SHIFT_ONLY_TYPES = new Set(["EMPLOYEE_SHIFT", "FREEDOM_SHIFT"]);

interface DeletionItem extends TeamDeletionEntry {
  id: string;
  displayDate: string;
  status: "pending" | "processing" | "success" | "error" | "skipped";
  error?: string;
  selectedScheduleIds?: string[];
}

interface ModalTeamConfirmDeletionProps {
  isOpen: boolean;
  onClose: () => void;
  entries: TeamDeletionEntry[];
  onSuccess: () => void;
}

const localeToLuxon = (locale: string) =>
  locale === "es"
    ? "es"
    : locale === "en"
      ? "en"
      : locale === "pt"
        ? "pt"
        : "fr";

function extractErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  const message = data?.message;

  if (Array.isArray(message)) {
    return message.filter(Boolean).join(" | ") || fallback;
  }

  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  if (typeof data?.error === "string" && data.error.trim().length > 0) {
    return data.error;
  }

  if (typeof error?.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

const ModalTeamConfirmDeletion = ({
  isOpen,
  onClose,
  entries,
  onSuccess,
}: ModalTeamConfirmDeletionProps) => {
  const t = useTranslations("operations.teamSchedule.modals.deletion");
  const locale = useLocale();
  const luxonLocale = localeToLuxon(locale);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canDelete } = useCookieSession();
  const [isPending, setIsPending] = useState(false);
  const [items, setItems] = useState<DeletionItem[]>([]);
  const deleteEmployeeSchedule = useDeleteEmployeeSchedule();

  const hasActionableItems = items.some((i) => i.status !== "skipped");
  const hasInvalidScheduleSelection = items.some(
    (item) =>
      item.status !== "skipped" &&
      item.scheduleOptions &&
      item.scheduleOptions.length > 1 &&
      (!item.selectedScheduleIds || item.selectedScheduleIds.length === 0),
  );

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
        status: SHIFT_ONLY_TYPES.has(entry.recordType ?? "")
          ? "skipped"
          : "pending",
        error: SHIFT_ONLY_TYPES.has(entry.recordType ?? "")
          ? "El horario de este día proviene del turno activo del empleado y no tiene asignación directa que eliminar."
          : undefined,
        selectedScheduleId:
          entry.scheduleOptions && entry.scheduleOptions.length >= 1
            ? entry.scheduleOptions.map((option) => option.scheduleId)
            : undefined,
      })),
    );
  }, [entries, luxonLocale]);

  const getStatusBadge = (status: string) => {
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
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3" />
            {t("status.error")}
          </span>
        );
      case "skipped":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
            <AlertCircle className="w-3 h-3" />
            No aplica
          </span>
        );
      default:
        return null;
    }
  };

  const processDeletions = async () => {
    setIsPending(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Skip entries pre-marcadas como "no aplica" (turno sin override directo)
      if (SHIFT_ONLY_TYPES.has(entry.recordType ?? "")) continue;

      setItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: "processing" } : item,
        ),
      );

      try {
        const selectedScheduleIds = items[i]?.selectedScheduleIds;
        const scheduleIdsToDelete =
          entry.scheduleOptions && entry.scheduleOptions.length > 0
            ? (selectedScheduleIds ?? [])
            : [undefined];

        const rowErrors: string[] = [];
        for (const scheduleId of scheduleIdsToDelete) {
          try {
            await deleteEmployeeSchedule.mutateAsync({
              employeeId: entry.employeeId,
              date: new Date(entry.date),
              ...(scheduleId ? { scheduleId } : {}),
            });
          } catch (rowError: any) {
            const scheduleLabel =
              entry.scheduleOptions?.find(
                (option) => option.scheduleId === scheduleId,
              )?.scheduleCode ?? "horario seleccionado";
            const reason = extractErrorMessage(
              rowError,
              t("errorDeleteAssignment"),
            );
            rowErrors.push(`${scheduleLabel}: ${reason}`);
          }
        }

        if (rowErrors.length > 0) {
          errorCount++;
          setItems((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? {
                    ...item,
                    status: "error",
                    error: Array.from(new Set(rowErrors)).join(" | "),
                  }
                : item,
            ),
          );
        } else {
          successCount++;
          setItems((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: "success" } : item,
            ),
          );
        }
      } catch (error: any) {
        errorCount++;
        const reason = extractErrorMessage(error, t("errorDeleteAssignment"));
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "error",
                  error: reason,
                }
              : item,
          ),
        );
      }
    }

    if (successCount === 0 && errorCount === 0) {
      // Todos fueron skipped — no se hizo nada
      toast({
        title: "Sin cambios",
        description:
          "Los días seleccionados provienen del turno activo y no tienen asignación directa que eliminar.",
        variant: "destructive",
      });
    } else if (errorCount === 0) {
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

    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ["GetCalendar"] });
      queryClient.invalidateQueries({ queryKey: ["GetAbsences"] });
    }
    setIsPending(false);

    if (errorCount === 0 && successCount > 0) {
      onSuccess();
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="6xl"
    >
      <div className="space-y-6">
        <p className="text-gray-700 flex items-center gap-3 text-base">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          {t("message")}
        </p>

        <div className="border overflow-hidden max-h-72 overflow-y-auto rounded-lg">
          <CHEKIOTable>
            <CHEKIOTableHeader>
              <tr>
                <CHEKIOTableHead>{t("table.employee")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("table.date")}</CHEKIOTableHead>
                <CHEKIOTableHead>Horario a eliminar</CHEKIOTableHead>
                <CHEKIOTableHead>{t("table.status")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("table.message")}</CHEKIOTableHead>
              </tr>
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {items.length === 0 ? (
                <tr>
                  <CHEKIOTableCell colSpan={5} className="text-center py-10">
                    <p className="text-gray-600 font-medium">
                      {t("noDaysSelected")}
                    </p>
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
                      {item.scheduleOptions &&
                      item.scheduleOptions.length > 1 ? (
                        <div className="flex w-[260px] flex-wrap gap-1.5">
                          {item.scheduleOptions.map((option) => {
                            const isSelected =
                              !!item.selectedScheduleIds?.includes(
                                option.scheduleId,
                              );
                            return (
                              <button
                                key={option.scheduleId}
                                type="button"
                                disabled={
                                  isPending || item.status === "skipped"
                                }
                                onClick={() =>
                                  setItems((prev) =>
                                    prev.map((it, idx) => {
                                      if (idx !== index) return it;
                                      const current =
                                        it.selectedScheduleIds ?? [];
                                      const next = current.includes(
                                        option.scheduleId,
                                      )
                                        ? current.filter(
                                            (id) => id !== option.scheduleId,
                                          )
                                        : [...current, option.scheduleId];
                                      return {
                                        ...it,
                                        selectedScheduleIds: next,
                                      };
                                    }),
                                  )
                                }
                                className={`rounded border px-2 py-1 text-xs transition ${
                                  isSelected
                                    ? "border-red-300 bg-red-50 text-red-700"
                                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                }`}
                              >
                                {option.scheduleCode}
                                {option.scheduleName
                                  ? ` - ${option.scheduleName}`
                                  : ""}
                              </button>
                            );
                          })}
                        </div>
                      ) : item.scheduleOptions &&
                        item.scheduleOptions.length === 1 ? (
                        <span className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200 inline-block">
                          {item.scheduleOptions[0].scheduleCode}
                          {item.scheduleOptions[0].scheduleName
                            ? ` - ${item.scheduleOptions[0].scheduleName}`
                            : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Todos</span>
                      )}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {getStatusBadge(item.status)}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {item.status === "skipped" && item.error ? (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 block">
                          {item.error}
                        </span>
                      ) : item.status === "error" && item.error ? (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200 block">
                          {item.error}
                        </span>
                      ) : item.status === "success" ? (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                          {t("deletedOk")}
                        </span>
                      ) : item.status === "processing" ? null : (
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                          {t("waiting")}
                        </span>
                      )}
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
            variant="destructive"
            onClick={processDeletions}
            disabled={
              isPending ||
              items.length === 0 ||
              !hasActionableItems ||
              hasInvalidScheduleSelection ||
              !canDelete(
                OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS,
              )
            }
            className="!text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("deleting")}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {t("buttons.delete")}
              </>
            )}
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
};

export default ModalTeamConfirmDeletion;
