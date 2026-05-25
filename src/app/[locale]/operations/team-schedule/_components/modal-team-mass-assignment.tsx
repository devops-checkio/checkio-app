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

/** Datos mínimos del horario ya pintado en la celda (traslapes vs nueva selección). */
export interface TeamExistingScheduleSlot {
  publicId: string;
  code: string;
  startTime: string;
  workHours?: number;
  workMinutes?: number;
}

export interface TeamAssignmentEntry {
  employeeId: string;
  employeeName: string;
  date: string;
  schedule: string;
  personType?: PersonType;
  existingScheduleSlots?: TeamExistingScheduleSlot[];
}

interface AssignmentItem extends TeamAssignmentEntry {
  id: string;
  displayDate: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

interface ScheduleRange {
  startMinute: number;
  endMinute: number;
}

interface ModalTeamMassAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  entries: TeamAssignmentEntry[];
  companyIds?: string[];
  personType?: PersonType;
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

/** Incluye slots del grid donde workHours/workMinutes pueden faltar; parseScheduleRange usa ?? 0 */
type ScheduleTimeSlice = {
  startTime: string;
  workHours?: number;
  workMinutes?: number;
};

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

function findOverlappingExistingSlot(
  candidate: ScheduleResponseDto,
  entries: TeamAssignmentEntry[],
): TeamExistingScheduleSlot | null {
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

const ModalTeamMassAssignment = ({
  isOpen,
  onClose,
  entries,
  companyIds,
  personType = PersonType.EMPLOYEE,
  onSuccess,
}: ModalTeamMassAssignmentProps) => {
  const t = useTranslations("operations.teamSchedule.modals.assignment");
  const locale = useLocale();
  const luxonLocale = localeToLuxon(locale);
  const { toast } = useToast();
  const { canCreate } = useCookieSession();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [selectedSchedules, setSelectedSchedules] = useState<
    ScheduleResponseDto[]
  >([]);
  const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false);
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const setAssignedScheduleDay = useSetAssignedScheduleDay();

  const selectedEntryPersonType = (() => {
    const personTypes = Array.from(
      new Set(entries.map((entry) => entry.personType).filter(Boolean)),
    ) as PersonType[];
    return personTypes.length === 1 ? personTypes[0] : undefined;
  })();

  const effectivePersonType =
    selectedEntryPersonType ?? personType ?? PersonType.EMPLOYEE;
  const isStudentAssignment = effectivePersonType === PersonType.STUDENT;
  const hasSelectedSchedules = selectedSchedules.length > 0;
  const [establishmentsByScheduleId, setEstablishmentsByScheduleId] = useState<
    Record<string, string>
  >({});

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
      })),
    );
  }, [entries, luxonLocale]);

  useEffect(() => {
    setSelectedSchedules([]);
    setEstablishmentsByScheduleId({});
  }, [entries, effectivePersonType]);

  useEffect(() => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        status: "pending",
        error: undefined,
      })),
    );
  }, [selectedSchedules, establishmentsByScheduleId]);

  const isAwaitingCompanyFilter =
    companyIds !== undefined && companyIds.length === 0;
  const drawerCompanyIds = companyIds === undefined ? [] : companyIds;
  const firstCompanyId = companyIds?.[0];
  const { data: establishmentsData } = useGetEstablishments(
    { companyId: firstCompanyId, pageSize: 200 },
    { enabled: isStudentAssignment && !!firstCompanyId },
  );
  const establishments = establishmentsData?.data ?? [];

  const getScheduleSelectBlockReason = useCallback(
    (schedule: ScheduleResponseDto): string | null => {
      if (isStudentAssignment) {
        const slot = findOverlappingExistingSlot(schedule, entries);
        if (slot) {
          return t("toast.overlapExisting", {
            candidate: schedule.code,
            existing: slot.code,
          });
        }
        const other = findOverlappingAmongSelected(schedule, selectedSchedules);
        if (other) {
          return t("toast.overlapAmongPicked", {
            candidate: schedule.code,
            other: other.code,
          });
        }
      }
      return null;
    },
    [entries, isStudentAssignment, selectedSchedules, t],
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
    const schedulesToAssign = isStudentAssignment
      ? selectedSchedules
      : selectedSchedules.slice(0, 1);

    if (isStudentAssignment) {
      for (const schedule of schedulesToAssign) {
        const conflictingExisting = findOverlappingExistingSlot(
          schedule,
          entries,
        );
        if (conflictingExisting) {
          toast({
            title: t("toast.overlapTitle"),
            description: t("toast.overlapExisting", {
              candidate: schedule.code,
              existing: conflictingExisting.code,
            }),
            variant: "destructive",
          });
          setIsPending(false);
          return;
        }
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
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            status: "error",
            error: overlapMessage,
          })),
        );
        toast({
          title: "Traslape de horarios seleccionados",
          description: overlapMessage,
          variant: "destructive",
        });
        setIsPending(false);
        return;
      }
    }

    const hasMissingEstablishment =
      isStudentAssignment &&
      schedulesToAssign.some(
        (schedule) => !establishmentsByScheduleId[schedule.publicId],
      );

    if (hasMissingEstablishment) {
      toast({
        title: "Error",
        description:
          "Para estudiantes, debe seleccionar un establecimiento por cada horario.",
        variant: "destructive",
      });
      setIsPending(false);
      return;
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      setItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: "processing" } : item,
        ),
      );

      try {
        for (const schedule of schedulesToAssign) {
          const alreadyOnDay = (entry.existingScheduleSlots ?? []).some(
            (slot) => slot.publicId === schedule.publicId,
          );
          if (alreadyOnDay) continue;

          await setAssignedScheduleDay.mutateAsync({
            employeeId: entry.employeeId,
            date: new Date(entry.date),
            scheduleId: schedule.publicId,
            ...(isStudentAssignment
              ? {
                  establishmentId:
                    establishmentsByScheduleId[schedule.publicId],
                }
              : {}),
          });
        }

        successCount++;
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "success",
                  schedule: schedulesToAssign.map((s) => s.code).join(", "),
                }
              : item,
          ),
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

  /** Trabajadores: un horario; mostrar código y rango. Estudiantes: pista genérica (detalle en tarjetas). */
  const scheduleReadOnlyInputValue = (() => {
    if (!hasSelectedSchedules) return "";
    if (isStudentAssignment) return t("hintSelectAnotherSchedule");
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

  return (
    <>
      <CHEKIOModal
        isOpen={isOpen}
        onClose={onClose}
        title={t("title")}
        size="lg"
      >
        <div className="space-y-6">
          <p className="text-gray-700 flex items-center gap-3 text-base">
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
            {t("message")}
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
                disabled={
                  isAwaitingCompanyFilter ||
                  !canCreate(
                    OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS,
                  )
                }
                className="bg-orange-600 hover:bg-orange-700 text-white"
                aria-label={t("selectButton")}
              >
                {t("selectButton")}
              </CHEKIOButton>
            </div>
            {!hasSelectedSchedules && !isAwaitingCompanyFilter && (
              <p className="text-xs text-red-500">{t("noScheduleError")}</p>
            )}
            {isStudentAssignment && hasSelectedSchedules && (
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
                        aria-label={`Quitar ${schedule.code}`}
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
                        <CHEKIOSelectValue placeholder="Seleccionar establecimiento" />
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
          </div>

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
                items.length === 0 ||
                !canCreate(
                  OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS,
                )
              }
              className="bg-orange-600 hover:bg-orange-700 !text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("assigning")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {t("buttons.assign")}
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
            if (isStudentAssignment) {
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

export default ModalTeamMassAssignment;
