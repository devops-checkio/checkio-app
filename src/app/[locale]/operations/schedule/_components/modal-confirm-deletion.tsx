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
import { useEffect, useRef, useState } from "react";

export interface ScheduleDeletionEntry {
  date: string;
  recordType?: string;
  scheduleOptions?: Array<{
    scheduleId: string;
    scheduleCode: string;
    scheduleName?: string;
  }>;
}

/** Tipos que vienen del turno (sin override directo en BD) — no se pueden eliminar */
const SHIFT_ONLY_TYPES = new Set(["EMPLOYEE_SHIFT", "FREEDOM_SHIFT"]);

interface DeletionItem {
  id: string;
  date: string;
  dateKey: string;
  schedule: string;
  scheduleOptions?: ScheduleDeletionEntry["scheduleOptions"];
  selectedScheduleIds?: string[];
  status: "pending" | "processing" | "success" | "error" | "skipped";
  error?: string;
}

interface ModalConfirmDeletionProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  /** Modo legacy: solo fechas yyyy-MM-dd */
  selectedDays?: string[];
  /** Modo preferido: mismos datos que team-schedule (horarios por día) */
  entries?: ScheduleDeletionEntry[];
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

/** Evita bucles infinitos cuando `entries` llega con nueva referencia pero mismo contenido o cuando deps del efecto no son estables. */
function fingerprintScheduleDeletionSource(
  source: ScheduleDeletionEntry[],
): string {
  return JSON.stringify(
    source.map((e) => ({
      d: e.date,
      r: e.recordType ?? "",
      o:
        e.scheduleOptions?.map((x) => [
          x.scheduleId,
          x.scheduleCode,
          x.scheduleName ?? "",
        ]) ?? [],
    })),
  );
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const err = error as {
    response?: { data?: { message?: unknown; error?: string } };
    message?: string;
  };
  const data = err?.response?.data;
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

  if (typeof err?.message === "string" && err.message.trim().length > 0) {
    return err.message;
  }

  return fallback;
}

const ModalConfirmDeletion = ({
  isOpen,
  onClose,
  selectedDays = [],
  entries,
  employeeId,
  title,
  message,
  buttonText,
  buttonLoadingText,
  cleanSelectedDays,
}: ModalConfirmDeletionProps) => {
  const t = useTranslations("operations.schedule.modalDeletion");
  const locale = useLocale();
  const luxonLocale = localeToLuxon(locale);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canDelete } = useCookieSession();
  const [isPending, setIsPending] = useState(false);
  const [deletionItems, setDeletionItems] = useState<DeletionItem[]>([]);
  const deletionItemsRef = useRef<DeletionItem[]>([]);
  const lastDeletionSourceSyncRef = useRef<string>("");
  const deleteEmployeeSchedule = useDeleteEmployeeSchedule();

  const modalTitle = title ?? t("title");
  const modalMessage = message ?? t("message");
  const deleteButtonText = buttonText ?? t("buttons.delete");
  const deleteButtonLoadingText = buttonLoadingText ?? t("deleting");

  useEffect(() => {
    deletionItemsRef.current = deletionItems;
  }, [deletionItems]);

  useEffect(() => {
    if (!isOpen) {
      lastDeletionSourceSyncRef.current = "";
      return;
    }

    const source: ScheduleDeletionEntry[] =
      entries && entries.length > 0
        ? entries
        : selectedDays.map((date) => ({ date }));

    const syncKey = `${locale}:${luxonLocale}:${fingerprintScheduleDeletionSource(source)}`;
    if (syncKey === lastDeletionSourceSyncRef.current) {
      return;
    }
    lastDeletionSourceSyncRef.current = syncKey;

    setDeletionItems(
      source.map((entry, index) => {
        const skipped = SHIFT_ONLY_TYPES.has(entry.recordType ?? "");
        const opts = entry.scheduleOptions;
        const initialSelected =
          opts && opts.length >= 1 ? opts.map((o) => o.scheduleId) : undefined;

        const displayDate = DateTime.fromFormat(entry.date, "yyyy-MM-dd")
          .setLocale(luxonLocale)
          .toLocaleString({
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });

        const scheduleLabel =
          opts?.length === 1
            ? opts[0].scheduleCode
            : opts && opts.length > 1
              ? opts.map((o) => o.scheduleCode).join(", ")
              : t("assignedSchedule");

        return {
          id: `day-${index}`,
          dateKey: entry.date,
          date: displayDate,
          schedule: scheduleLabel,
          scheduleOptions: opts,
          selectedScheduleIds: initialSelected,
          status: skipped ? "skipped" : "pending",
          error: skipped
            ? "El horario de este día proviene del turno activo del empleado y no tiene asignación directa que eliminar."
            : undefined,
        };
      }),
    );
    // `t` solo afecta literales de etiqueta; `locale`/`luxonLocale` cubren cambios de idioma visibles.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evitar re-ejecución si `t` no es estable entre renders
  }, [isOpen, entries, selectedDays, luxonLocale, locale]);

  const hasInvalidScheduleSelection = deletionItems.some(
    (item) =>
      item.status !== "skipped" &&
      item.scheduleOptions &&
      item.scheduleOptions.length > 1 &&
      (!item.selectedScheduleIds || item.selectedScheduleIds.length === 0),
  );

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
            {text || t("badges.shift")}
          </span>
        );
    }
  };

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

    const rows = deletionItemsRef.current;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.status === "skipped") continue;

      setDeletionItems((prev) =>
        prev.map((d, index) =>
          index === i ? { ...d, status: "processing" } : d,
        ),
      );

      const selectedScheduleIds =
        deletionItemsRef.current[i]?.selectedScheduleIds;
      const scheduleIdsToDelete =
        row.scheduleOptions && row.scheduleOptions.length > 0
          ? (selectedScheduleIds ?? [])
          : [undefined];

      const rowErrors: string[] = [];

      for (const scheduleId of scheduleIdsToDelete) {
        try {
          await deleteEmployeeSchedule.mutateAsync({
            employeeId,
            date: new Date(row.dateKey),
            ...(scheduleId ? { scheduleId } : {}),
          });
        } catch (rowError: unknown) {
          const scheduleLabel =
            row.scheduleOptions?.find((o) => o.scheduleId === scheduleId)
              ?.scheduleCode ?? "horario";
          rowErrors.push(
            `${scheduleLabel}: ${extractErrorMessage(rowError, t("errorDeleteAssignment"))}`,
          );
        }
      }

      if (rowErrors.length > 0) {
        errorCount++;
        setDeletionItems((prev) =>
          prev.map((d, index) =>
            index === i
              ? {
                  ...d,
                  status: "error",
                  error: Array.from(new Set(rowErrors)).join(" | "),
                }
              : d,
          ),
        );
      } else {
        successCount++;
        setDeletionItems((prev) =>
          prev.map((d, index) =>
            index === i ? { ...d, status: "success" } : d,
          ),
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const actionable = rows.filter((r) => r.status !== "skipped").length;
    if (actionable === 0) {
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
      cleanSelectedDays?.();
    } else {
      toast({
        title: t("toast.completedWithErrorsTitle"),
        description: t("toast.completedWithErrorsDescription", {
          successCount,
          errorCount,
        }),
        variant: "destructive",
      });
      if (successCount > 0) cleanSelectedDays?.();
    }

    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ["GetCalendar"] });
    }

    setIsPending(false);
  };

  const canDeleteSchedule =
    canDelete(OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS) ||
    canDelete(
      OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS,
    );

  return (
    <CHEKIOModal isOpen={isOpen} onClose={onClose} size="lg" title={modalTitle}>
      <div className="space-y-6">
        <p className="text-gray-700 flex items-center gap-3 text-lg">
          <AlertCircle className="h-5 w-5 text-red-500" />
          {modalMessage}
        </p>

        <div className="border overflow-hidden max-h-64 overflow-y-auto">
          <CHEKIOTable>
            <CHEKIOTableHeader>
              <tr>
                <CHEKIOTableHead>{t("table.date")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("table.schedule")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("table.status")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("table.message")}</CHEKIOTableHead>
              </tr>
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {deletionItems.length === 0 ? (
                <tr>
                  <CHEKIOTableCell colSpan={4} className="text-center py-10">
                    <p className="text-gray-600 font-medium">
                      {t("noDaysSelected")}
                    </p>
                  </CHEKIOTableCell>
                </tr>
              ) : (
                deletionItems.map((item, index) => (
                  <CHEKIOTableRow key={item.id} index={index}>
                    <CHEKIOTableCell className="font-medium">
                      {item.date}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {item.scheduleOptions &&
                      item.scheduleOptions.length > 1 ? (
                        <div className="flex max-w-[260px] flex-wrap gap-1.5">
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
                                  setDeletionItems((prev) =>
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
                                    ? "border-red-300 bg-red-50 text-red-800"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                {option.scheduleCode}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        getScheduleBadge(item.schedule)
                      )}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {getStatusBadge(item.status)}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {item.status === "error" && item.error ? (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200 block">
                          {item.error}
                        </span>
                      ) : item.status === "skipped" && item.error ? (
                        <span className="text-xs text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 block">
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
              !canDeleteSchedule ||
              hasInvalidScheduleSelection ||
              deletionItems.length === 0 ||
              deletionItems.every((d) => d.status === "skipped")
            }
            className="!text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {deleteButtonLoadingText}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {deleteButtonText}
              </>
            )}
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
};

export default ModalConfirmDeletion;
