"use client";

import { EstablishmentResponseDto } from "@/app/[locale]/mantainers/establishments/_components/establishment.dto";
import {
  PersonType,
  ScheduleResponseDto,
} from "@/app/[locale]/mantainers/schedules/_components/schedule.dto";
import SelectScheduleDrawer from "@/app/[locale]/mantainers/shifts/editor/[shiftId]/_components/select-schedule-drawer";
import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
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
import { useGetEstablishments } from "@/service/mantainer.service";
import { useSetAssignedScheduleDay } from "@/service/schedule.service";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { DateTime } from "luxon";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

interface AssignmentItem {
  id: string;
  date: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

/** Slots ya asignados en un día (página empleado / tipos compartidos). */
export type MassAssignmentExistingSlot = {
  publicId: string;
  code?: string;
  startTime: string;
  workHours?: number;
  workMinutes?: number;
};

interface ModalMassAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDays: string[];
  employeeId: string;
  /** Por día: horarios ya asignados en el calendario (evitar POST duplicado / detectar traslapes). */
  assignmentEntries?: Array<{
    date: string;
    existingScheduleSlots?: MassAssignmentExistingSlot[];
  }>;
  /** Public company UUIDs for schedule list filter. Omit for no filter. Empty = company not ready yet (disables schedule picker). */
  companyIds?: string[];
  /** When "STUDENT", an establishment selector is shown and required */
  personType?: string;
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLoadingText?: string;
  cleanSelectedDays?: () => void;
}

type ScheduleTimeSlice = {
  startTime: string;
  workHours?: number;
  workMinutes?: number;
};

interface ScheduleRange {
  startMinute: number;
  endMinute: number;
}

function parseScheduleRange(schedule: ScheduleTimeSlice): ScheduleRange | null {
  const start = DateTime.fromISO(String(schedule.startTime), { zone: "utc" });
  if (!start.isValid) return null;

  const startMinute = start.hour * 60 + start.minute;
  const endMinute =
    startMinute +
    Number(schedule.workHours ?? 0) * 60 +
    Number(schedule.workMinutes ?? 0);

  return { startMinute, endMinute };
}

function schedulesTimeOverlap(
  a: ScheduleTimeSlice,
  b: ScheduleTimeSlice,
): boolean {
  const ra = parseScheduleRange(a);
  const rb = parseScheduleRange(b);
  if (!ra || !rb) return false;
  const overlapStart = Math.max(ra.startMinute, rb.startMinute);
  const overlapEnd = Math.min(ra.endMinute, rb.endMinute);
  return overlapStart < overlapEnd;
}

function slotsForAssignmentDate(
  assignmentEntries: ModalMassAssignmentProps["assignmentEntries"],
  dateKey: string,
): MassAssignmentExistingSlot[] {
  return (
    assignmentEntries?.find((e) => e.date === dateKey)?.existingScheduleSlots ??
    []
  );
}

function findOverlappingExistingSlotEmployee(
  candidate: ScheduleResponseDto,
  entries: ModalMassAssignmentProps["assignmentEntries"],
): MassAssignmentExistingSlot | null {
  if (!entries?.length) return null;
  for (const entry of entries) {
    for (const slot of entry.existingScheduleSlots ?? []) {
      if (slot.publicId === candidate.publicId) continue;
      if (!slot.startTime) continue;
      if (schedulesTimeOverlap(candidate, slot)) return slot;
    }
  }
  return null;
}

function findOverlappingAmongSelected(
  candidate: ScheduleResponseDto,
  alreadySelected: ScheduleResponseDto[],
): ScheduleResponseDto | null {
  for (const p of alreadySelected) {
    if (p.publicId === candidate.publicId) continue;
    if (schedulesTimeOverlap(candidate, p)) return p;
  }
  return null;
}

function minuteToHHmm(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const m = (normalized % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

const localeToLuxon = (locale: string) =>
  locale === "es"
    ? "es"
    : locale === "en"
      ? "en"
      : locale === "pt"
        ? "pt"
        : "fr";

const ModalMassAssignment = ({
  isOpen,
  onClose,
  selectedDays,
  employeeId,
  assignmentEntries,
  companyIds,
  personType,
  title,
  message,
  buttonText,
  buttonLoadingText,
  cleanSelectedDays,
}: ModalMassAssignmentProps) => {
  const t = useTranslations("operations.schedule.modalMassAssignment");
  const locale = useLocale();
  const luxonLocale = localeToLuxon(locale);
  const { toast } = useToast();
  const { canCreate } = useCookieSession();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [selectedSchedules, setSelectedSchedules] = useState<
    ScheduleResponseDto[]
  >([]);
  const [establishmentsByScheduleId, setEstablishmentsByScheduleId] = useState<
    Record<string, string>
  >({});
  const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false);
  const [assignmentItems, setAssignmentItems] = useState<AssignmentItem[]>([]);
  const setAssignedScheduleDay = useSetAssignedScheduleDay();

  const isStudent = personType === "STUDENT";
  const hasSelectedSchedules = selectedSchedules.length > 0;
  const firstCompanyId = companyIds?.[0];
  const { data: establishmentsData } = useGetEstablishments(
    { companyId: firstCompanyId, pageSize: 200 },
    { enabled: isStudent && !!firstCompanyId },
  );
  const establishments = establishmentsData?.data ?? [];

  useEffect(() => {
    if (selectedDays.length > 0) {
      setAssignmentItems(
        selectedDays.map((day, index) => ({
          id: `day-${index}`,
          date: DateTime.fromFormat(day, "yyyy-MM-dd")
            .setLocale(luxonLocale)
            .toLocaleString({
              weekday: "short",
              month: "short",
              day: "numeric",
            }),
          status: "pending",
        })),
      );
    } else {
      setAssignmentItems([]);
    }
  }, [selectedDays, luxonLocale]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedSchedules([]);
    setEstablishmentsByScheduleId({});
  }, [isOpen, selectedDays.join(","), isStudent]);

  useEffect(() => {
    setAssignmentItems((prev) =>
      prev.map((item) => ({
        ...item,
        status: "pending",
        error: undefined,
      })),
    );
  }, [selectedSchedules, establishmentsByScheduleId]);

  const modalTitle = title ?? t("title");
  const modalMessage = message ?? t("message");
  const assignButtonText = buttonText ?? t("buttons.assign");
  const assignButtonLoadingText = buttonLoadingText ?? t("assigning");

  const isAwaitingCompanyFilter =
    companyIds !== undefined && companyIds.length === 0;
  const drawerCompanyIds = companyIds === undefined ? [] : companyIds;

  const canAssignSchedule =
    canCreate(OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS) ||
    canCreate(
      OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS,
    );

  const getScheduleSelectBlockReason = useCallback(
    (schedule: ScheduleResponseDto): string | null => {
      const slot = findOverlappingExistingSlotEmployee(
        schedule,
        assignmentEntries,
      );
      if (slot) {
        return t("toast.overlapExisting", {
          candidate: schedule.code,
          existing: slot.code ?? slot.publicId,
        });
      }
      if (isStudent) {
        const other = findOverlappingAmongSelected(
          schedule,
          selectedSchedules,
        );
        if (other) {
          return t("toast.overlapAmongPicked", {
            candidate: schedule.code,
            other: other.code,
          });
        }
      }
      return null;
    },
    [assignmentEntries, isStudent, selectedSchedules, t],
  );

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

  const processAssignments = async () => {
    if (!hasSelectedSchedules) {
      toast({
        title: "Error",
        description: t("toast.errorSelectSchedule"),
        variant: "destructive",
      });
      return;
    }

    setIsPending(true);
    let successCount = 0;
    let errorCount = 0;
    const schedulesToAssign = isStudent
      ? selectedSchedules
      : selectedSchedules.slice(0, 1);

    for (const schedule of schedulesToAssign) {
      const conflictingExisting = findOverlappingExistingSlotEmployee(
        schedule,
        assignmentEntries,
      );
      if (conflictingExisting) {
        toast({
          title: t("toast.overlapTitle"),
          description: t("toast.overlapExisting", {
            candidate: schedule.code,
            existing:
              conflictingExisting.code ?? conflictingExisting.publicId,
          }),
          variant: "destructive",
        });
        setIsPending(false);
        return;
      }
    }

    if (schedulesToAssign.length > 1) {
      const overlapDetails: string[] = [];

      for (let i = 0; i < schedulesToAssign.length; i++) {
        for (let j = i + 1; j < schedulesToAssign.length; j++) {
          const first = schedulesToAssign[i];
          const second = schedulesToAssign[j];
          const firstRange = parseScheduleRange(first);
          const secondRange = parseScheduleRange(second);
          if (!firstRange || !secondRange) continue;

          const overlapStart = Math.max(
            firstRange.startMinute,
            secondRange.startMinute,
          );
          const overlapEnd = Math.min(
            firstRange.endMinute,
            secondRange.endMinute,
          );

          if (overlapStart < overlapEnd) {
            overlapDetails.push(
              `${first.code} (${minuteToHHmm(firstRange.startMinute)}-${minuteToHHmm(firstRange.endMinute)}) ` +
                `se traslapa con ${second.code} (${minuteToHHmm(secondRange.startMinute)}-${minuteToHHmm(secondRange.endMinute)}). ` +
                `Choque: ${minuteToHHmm(overlapStart)}-${minuteToHHmm(overlapEnd)}.`,
            );
          }
        }
      }

      if (overlapDetails.length > 0) {
        const overlapMessage = overlapDetails.join(" | ");
        setAssignmentItems((prev) =>
          prev.map((item) => ({
            ...item,
            status: "error",
            error: overlapMessage,
          })),
        );
        toast({
          title: t("toast.overlapSelectedSetsTitle"),
          description: overlapMessage,
          variant: "destructive",
        });
        setIsPending(false);
        return;
      }
    }

    const hasMissingEstablishment =
      isStudent &&
      schedulesToAssign.some(
        (schedule) => !establishmentsByScheduleId[schedule.publicId],
      );

    if (hasMissingEstablishment) {
      toast({
        title: "Error",
        description: t("toast.errorEstablishmentPerSchedule"),
        variant: "destructive",
      });
      setIsPending(false);
      return;
    }

    for (let i = 0; i < selectedDays.length; i++) {
      const dateKey = selectedDays[i];

      setAssignmentItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: "processing" } : item,
        ),
      );

      try {
        for (const schedule of schedulesToAssign) {
          const existingSlots = slotsForAssignmentDate(
            assignmentEntries,
            dateKey,
          );
          const alreadyOnDay = existingSlots.some(
            (slot) => slot.publicId === schedule.publicId,
          );
          if (alreadyOnDay) continue;

          await setAssignedScheduleDay.mutateAsync({
            employeeId,
            date: new Date(dateKey),
            scheduleId: schedule.publicId,
            ...(isStudent
              ? {
                  establishmentId:
                    establishmentsByScheduleId[schedule.publicId],
                }
              : {}),
          });
        }

        successCount++;
        setAssignmentItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "success",
                }
              : item,
          ),
        );
      } catch (error: any) {
        errorCount++;
        setAssignmentItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "error",
                  error:
                    error?.response?.data?.message || t("errorAssignSchedule"),
                }
              : item,
          ),
        );
      }
    }

    if (errorCount === 0) {
      toast({
        title: t("toast.successTitle"),
        description: t("toast.successDescription"),
      });
      onClose();
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
    }

    queryClient.invalidateQueries({ queryKey: ["GetCalendar"] });
    queryClient.invalidateQueries({ queryKey: ["GetAbsences"] });
    setIsPending(false);
  };

  /** Empleados: un solo horario; mostrar código y rango en el input. Estudiantes: pista genérica (detalle en tarjetas). */
  const scheduleReadOnlyInputValue = (() => {
    if (!hasSelectedSchedules) return "";
    if (isStudent) return t("hintSelectAnotherSchedule");
    const schedule = selectedSchedules[0];
    if (!schedule) return "";
    const label = schedule.code || schedule.name || "";
    if (!schedule.startTime) return label;
    const start = DateTime.fromISO(String(schedule.startTime), { zone: "utc" });
    if (!start.isValid) return label;
    const end = start.plus({
      hours: Number(schedule.workHours ?? 0),
      minutes: Number(schedule.workMinutes ?? 0),
    });
    return `${label} (${start.toFormat("HH:mm")} - ${end.toFormat("HH:mm")})`;
  })();

  const effectivePersonType = isStudent ? PersonType.STUDENT : PersonType.EMPLOYEE;

  return (
    <>
      <CHEKIOModal
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        size="lg"
      >
        <div className="space-y-6">
          <p className="text-gray-700 flex items-center gap-3 text-base">
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
            {modalMessage}
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("selectSchedule")}
            </label>
            <div className="flex items-center gap-2">
              <CHEKIOInput
                type="text"
                readOnly
                value={scheduleReadOnlyInputValue}
                placeholder={t("placeholder")}
                className="bg-gray-50"
              />
              <CHEKIOButton
                variant="primary"
                onClick={() => setIsScheduleDrawerOpen(true)}
                disabled={isAwaitingCompanyFilter || !canAssignSchedule}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                aria-label={t("selectButton")}
              >
                {t("selectButton")}
              </CHEKIOButton>
            </div>
            {!hasSelectedSchedules && !isAwaitingCompanyFilter && (
              <p className="text-xs text-red-500">{t("noScheduleError")}</p>
            )}
            {isStudent && hasSelectedSchedules && (
              <div className="mt-2 space-y-2">
                {selectedSchedules.map((schedule) => (
                  <div
                    key={schedule.publicId}
                    className="flex flex-col gap-2 rounded-md border border-blue-100 bg-blue-50/60 p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-blue-700">
                        {schedule.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSchedules((prev) =>
                            prev.filter(
                              (item) => item.publicId !== schedule.publicId,
                            ),
                          );
                          setEstablishmentsByScheduleId((prev) => {
                            const next = { ...prev };
                            delete next[schedule.publicId];
                            return next;
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        aria-label={t("removeScheduleAria", {
                          code: schedule.code,
                        })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <CHEKIOSelect
                      value={
                        establishmentsByScheduleId[schedule.publicId] ?? ""
                      }
                      onValueChange={(value) =>
                        setEstablishmentsByScheduleId((prev) => ({
                          ...prev,
                          [schedule.publicId]: value,
                        }))
                      }
                    >
                      <CHEKIOSelectTrigger
                        className={
                          establishmentsByScheduleId[schedule.publicId]
                            ? "w-full"
                            : "w-full border-red-300"
                        }
                      >
                        <CHEKIOSelectValue
                          placeholder={t("placeholderEstablishment")}
                        />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        {establishments.map((est: EstablishmentResponseDto) => (
                          <CHEKIOSelectItem
                            key={est.publicId}
                            value={est.publicId}
                          >
                            {est.name}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  </div>
                ))}
              </div>
            )}
            {isAwaitingCompanyFilter && (
              <p className="text-xs text-amber-600">
                {t("awaitingCompanyFilterHint")}
              </p>
            )}
          </div>

          <div className="border overflow-hidden max-h-72 overflow-y-auto rounded-lg">
            <CHEKIOTable>
              <CHEKIOTableHeader>
                <tr>
                  <CHEKIOTableHead>{t("table.date")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.status")}</CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {assignmentItems.length === 0 ? (
                  <tr>
                    <CHEKIOTableCell colSpan={2} className="text-center py-10">
                      <p className="text-gray-600 font-medium">
                        {t("noDaysSelected")}
                      </p>
                    </CHEKIOTableCell>
                  </tr>
                ) : (
                  assignmentItems.map((item, index) => (
                    <CHEKIOTableRow key={item.id} index={index}>
                      <CHEKIOTableCell className="text-sm text-gray-600">
                        {item.date}
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
              onClick={processAssignments}
              disabled={
                isPending ||
                isAwaitingCompanyFilter ||
                !hasSelectedSchedules ||
                assignmentItems.length === 0 ||
                !canAssignSchedule
              }
              className="bg-orange-600 hover:bg-orange-700 !text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {assignButtonLoadingText}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {assignButtonText}
                </>
              )}
            </CHEKIOButton>
          </div>
        </div>
      </CHEKIOModal>

      <SelectScheduleDrawer
        isOpen={isScheduleDrawerOpen && !isAwaitingCompanyFilter}
        onClose={() => setIsScheduleDrawerOpen(false)}
        getScheduleSelectBlockReason={getScheduleSelectBlockReason}
        onSelect={(schedule) => {
          const blockReason = getScheduleSelectBlockReason(schedule);
          if (blockReason) {
            toast({
              title: t("toast.overlapTitle"),
              description: blockReason,
              variant: "destructive",
            });
            return;
          }
          setSelectedSchedules((prev) => {
            if (isStudent) {
              const alreadySelected = prev.some(
                (item) => item.publicId === schedule.publicId,
              );
              return alreadySelected ? prev : [...prev, schedule];
            }
            return [schedule];
          });
          setIsScheduleDrawerOpen(false);
        }}
        companyIds={drawerCompanyIds}
        personType={effectivePersonType}
      />
    </>
  );
};

export default ModalMassAssignment;
