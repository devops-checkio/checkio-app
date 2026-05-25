"use client";

import { CHEKIOButton, CHEKIOModal } from "@/components";
import { useToast } from "@/hooks/use-toast";
import { useCompleteManualAssistance } from "@/service/mantainer.service";
import { useGetSchedule } from "@/service/schedule.service";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coffee,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import {
  AssistanceCompleteManualDto,
  AssistanceResponseDto,
} from "../../_components/assistance.dto";
import { isAssistanceDayEditable } from "../_utils/assistance-date-lock";

/** Same offset logic as schedule.bll computeBreakInstantsForAutocomplete */
function computeBreakInstantsForModal(
  scheduleStartIso: string,
  breakStartIso: string,
  breakEndIso: string,
  /** Inicio efectivo del turno (marca real o inicio teórico); debe coincidir con la entrada del formulario. */
  shiftStartAnchor: DateTime,
): { start: DateTime; end: DateTime } {
  const templateShiftStart = DateTime.fromISO(scheduleStartIso).toUTC();
  const templateBreakStart = DateTime.fromISO(breakStartIso).toUTC();
  const templateBreakEnd = DateTime.fromISO(breakEndIso).toUTC();
  const startOffsetMinutes = templateBreakStart.diff(
    templateShiftStart,
    "minutes",
  ).minutes;
  const endOffsetMinutes = templateBreakEnd.diff(
    templateShiftStart,
    "minutes",
  ).minutes;
  const breakStart = shiftStartAnchor.plus({ minutes: startOffsetMinutes });
  let breakEnd = shiftStartAnchor.plus({ minutes: endOffsetMinutes });
  if (breakEnd.toMillis() <= breakStart.toMillis()) {
    breakEnd = breakEnd.plus({ days: 1 });
  }
  return { start: breakStart, end: breakEnd };
}

interface Break {
  publicId: string;
  startTime: DateTime;
  endTime: DateTime;
  isRegisteredStartTime: boolean;
  isRegisteredEndTime: boolean;
  scheduleStartTime: DateTime;
  scheduleEndTime: DateTime;
}

interface FormValues {
  startTime: DateTime;
  endTime: DateTime;
  scheduleStartTime: DateTime;
  scheduleEndTime: DateTime;
  isRegisteredStartTime: boolean;
  isRegisteredEndTime: boolean;
  adjustmentNote?: string;
  breaks: Break[];
}

interface ModalCompleteAssistanceProps {
  isOpen: boolean;
  onClose: () => void;
  assistance: AssistanceResponseDto;
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLoadingText?: string;
  cleanSelectedRows?: () => void;
  defaultValues?: FormValues;
}

function formatUtcTimeForInput(dateTime: DateTime): string {
  if (!dateTime?.isValid) {
    return "00:00:00";
  }
  return dateTime.setZone("UTC").toFormat("HH:mm:ss");
}

/**
 * `input type="time"` controlado solo con DateTime suele bloquearse al escribir o al usar el picker:
 * mientras hay foco usamos string local; al cambiar/ blur aplicamos la hora al instante UTC (mismo día calendario en UTC).
 */
function UtcTimeInput({
  value,
  onChange,
  className,
  icon,
}: {
  value: DateTime;
  onChange: (next: DateTime) => void;
  className: string;
  icon: ReactNode;
}) {
  const formatted = formatUtcTimeForInput(value);
  const [local, setLocal] = useState(formatted);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setLocal(formatted);
    }
  }, [formatted, focused]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || !value?.isValid) {
      return;
    }
    const parts = trimmed.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1] ?? "", 10);
    const secPart = parts[2];
    const seconds =
      secPart !== undefined && secPart !== "" ? parseInt(secPart, 10) : 0;
    if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
      return;
    }
    const next = value.toUTC().set({
      hour: hours,
      minute: minutes,
      second: seconds,
      millisecond: 0,
    });
    if (next.isValid) {
      onChange(next);
    }
  };

  return (
    <div className="relative">
      {icon}
      <input
        type="time"
        step="1"
        className={className}
        value={focused ? local : formatted}
        onFocus={() => {
          setFocused(true);
          setLocal(formatted);
        }}
        onChange={(e) => {
          const v = e.target.value;
          setLocal(v);
          if (v && e.currentTarget.validity.valid) {
            commit(v);
          }
        }}
        onBlur={() => {
          setFocused(false);
          commit(local);
        }}
      />
    </div>
  );
}

const ModalCompleteAssistanceComponent = ({
  isOpen,
  onClose,
  title = "Autocompletar Marcaciones",
  message = "Seleccione las fechas y horarios según el horario programado del empleado:",
  buttonText = "Autocompletar",
  buttonLoadingText = "Procesando...",
  cleanSelectedRows,
  assistance,
  defaultValues,
}: ModalCompleteAssistanceProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useCompleteManualAssistance();
  const isEditableByDate = isAssistanceDayEditable(assistance);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: defaultValues,
  });

  const { fields, remove } = useFieldArray({
    control,
    name: "breaks",
  });

  const watchedStart = useWatch({ control, name: "startTime" });
  const watchedEnd = useWatch({ control, name: "endTime" });

  const exitIsNextCalendarDay = useMemo(() => {
    if (!watchedStart || !watchedEnd) return false;
    const a = watchedStart.toUTC();
    const b = watchedEnd.toUTC();
    return (
      b.year !== a.year || b.month !== a.month || b.day !== a.day
    );
  }, [watchedStart, watchedEnd]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (!isEditableByDate) {
        toast({
          title: "Acción no permitida",
          description: "Solo puedes autocompletar marcaciones de días anteriores a hoy.",
          variant: "destructive",
        });
        return;
      }

      const payload: AssistanceCompleteManualDto = {
        startTime: data.startTime.toISO()!,
        endTime: data.endTime.toISO()!,
        adjustmentNote: data.adjustmentNote || undefined,
        breaks: data.breaks.map((break_) => ({
          startTime: break_.startTime.toISO()!,
          endTime: break_.endTime.toISO()!,
          publicId: break_.publicId,
        })),
      };

      await mutateAsync({
        assistance: payload,
        assistanceId: assistance.publicId,
      });

      toast({
        title: "Marcaciones autocompletadas",
        description:
          "Las marcaciones han sido autocompletadas correctamente según el horario seleccionado",
      });

      queryClient.invalidateQueries({
        queryKey: ["GetAllAssistancesIncomplete"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetAllAssistancesWithoutSchedule"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetAllAssistancesCompleted"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetAllAssistancesAbsent"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetAssistanceCount"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["GetAssistance", assistance.publicId],
      });

      cleanSelectedRows?.();
      onClose();
    } catch (error: any) {
      console.error("Validation failed:", error);
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Error al completar las marcaciones",
      );
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={isPending ? () => {} : onClose}
      title="Completar Marcación"
      size="lg"
    >
      <div className="space-y-6 py-4">
        <p className="text-gray-700 flex items-center gap-3 text-lg mb-4">
          <AlertCircle className="h-5 w-5 text-blue-500" />
          {message}
        </p>
        {!isEditableByDate && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            No puedes completar marcaciones para hoy o fechas futuras.
          </p>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500 h-4 w-4" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2 mb-2">
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <span className="text-gray-700">Nota de ajuste</span>
                </label>
                <Controller
                  name="adjustmentNote"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-gray-500">
                        <FileText className="h-4 w-4" />
                      </div>
                      <textarea
                        className="w-full pl-10 py-2 border border-gray-300 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                        placeholder="Ingrese una nota sobre el ajuste realizado (opcional)"
                        rows={2}
                        {...field}
                      />
                    </div>
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <span className="text-green-700">Hora de entrada</span>
                  {defaultValues?.isRegisteredStartTime ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                      ✓ Marcada
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-bold">
                      ! Recomendada
                    </span>
                  )}
                </label>
                <Controller
                  name="startTime"
                  control={control}
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <UtcTimeInput
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full pl-10 py-2 border border-green-300 bg-green-50 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-green-600"
                      icon={
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      }
                    />
                  )}
                />
                {errors.startTime && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  Hora de salida
                  {defaultValues?.isRegisteredEndTime ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                      ✓ Marcada
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-bold">
                      ! Recomendada
                    </span>
                  )}
                </label>
                <Controller
                  name="endTime"
                  control={control}
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <UtcTimeInput
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full pl-10 py-2 border border-red-300 bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-red-600"
                      icon={
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-600">
                          <ChevronLeft className="h-4 w-4" />
                        </div>
                      }
                    />
                  )}
                />
                {errors.endTime && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
              {exitIsNextCalendarDay && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                    La salida queda registrada en el día siguiente respecto al
                    día de la asistencia.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Pausas y Colaciones</h3>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border p-4 rounded-md bg-orange-50 border-orange-300"
                >
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 gap-4">
                        <span className="text-gray-700">Hora Inicio</span>
                        {field?.isRegisteredStartTime ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                            ✓ Marcada
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-bold">
                            ! Recomendada
                          </span>
                        )}
                      </label>
                      <Controller
                        name={`breaks.${index}.startTime`}
                        control={control}
                        render={({ field }) => (
                          <UtcTimeInput
                            value={field.value}
                            onChange={field.onChange}
                            className="w-full pl-10 py-2 border border-orange-300 bg-orange-50 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-orange-600"
                            icon={
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-600">
                                <Coffee className="h-4 w-4" />
                              </div>
                            }
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora Término
                        {field?.isRegisteredEndTime ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                            ✓ Marcada
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-bold">
                            ! Recomendada
                          </span>
                        )}
                      </label>
                      <Controller
                        name={`breaks.${index}.endTime`}
                        control={control}
                        render={({ field }) => (
                          <UtcTimeInput
                            value={field.value}
                            onChange={field.onChange}
                            className="w-full pl-10 py-2 border border-orange-300 bg-orange-50 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-orange-600"
                            icon={
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-600">
                                <Coffee className="h-4 w-4" />
                              </div>
                            }
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <CHEKIOButton
              variant="secondaryBlue"
              onClick={onClose}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
              Cancelar
            </CHEKIOButton>
            <CHEKIOButton
              variant="primary"
              type="submit"
              disabled={isPending || !isEditableByDate}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {buttonLoadingText}
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  {buttonText}
                </>
              )}
            </CHEKIOButton>
          </div>
        </form>
      </div>
    </CHEKIOModal>
  );
};

export default function ModalCompleteAssistance({
  isOpen,
  onClose,
  assistance,
}: ModalCompleteAssistanceProps) {
  const { data: schedule, isLoading } = useGetSchedule(
    assistance.Schedule.publicId,
  );

  if (isLoading) return <div>Cargando...</div>;

  const setAssistanceDate = {
    year: assistance.year,
    month: assistance.month,
    day: assistance.day,
  };
  const startScheduleTime = DateTime.fromISO(schedule?.startTime!)
    .toUTC()
    .set(setAssistanceDate);
  const endScheduleTime = startScheduleTime.plus({
    hours: schedule?.workHours,
    minutes: schedule?.workMinutes,
  });

  const startScheduleMark = assistance.Marks.find(
    (x) =>
      x.type === "CHECK_IN" &&
      x.isAditional == false &&
      x.isOfficial == true &&
      x.scheduleBreakPublicId == null,
  );

  const endScheduleMark = assistance.Marks.find(
    (x) =>
      x.type === "CHECK_OUT" &&
      x.isAditional == false &&
      x.isOfficial == true &&
      x.scheduleBreakPublicId == null,
  );

  /** Same instant as form entrada/salida: marca oficial si existe, si no horario teórico. */
  const resolvedStartTime = startScheduleMark
    ? DateTime.fromISO(startScheduleMark.timestamp).toUTC().setZone("UTC", {
        keepLocalTime: true,
      })
    : startScheduleTime.setZone("UTC");

  const resolvedEndTime = endScheduleMark
    ? DateTime.fromISO(endScheduleMark.timestamp).toUTC().setZone("UTC", {
        keepLocalTime: true,
      })
    : endScheduleTime.setZone("UTC");

  const defaultValues: FormValues = {
    startTime: resolvedStartTime,
    scheduleStartTime: startScheduleTime.setZone("UTC"),
    isRegisteredStartTime: startScheduleMark != null,
    endTime: resolvedEndTime,
    scheduleEndTime: endScheduleTime.setZone("UTC"),
    isRegisteredEndTime: endScheduleMark != null,
    breaks:
      schedule?.ScheduleBreaks?.map((x) => {
        const scheduleMarks = assistance.Marks.filter(
          (y) => y.scheduleBreakPublicId == x.publicId,
        );

        const breakStart = scheduleMarks.find(
          (y) =>
            y.type === "CHECK_IN" &&
            y.isAditional == false &&
            y.isOfficial == true,
        );
        const breakEnd = scheduleMarks.find(
          (y) =>
            y.type === "CHECK_OUT" &&
            y.isAditional == false &&
            y.isOfficial == true,
        );

        const computed = computeBreakInstantsForModal(
          schedule!.startTime!,
          x.startTime,
          x.endTime,
          resolvedStartTime,
        );

        return {
          publicId: x.publicId!,
          startTime: breakStart
            ? DateTime.fromISO(breakStart.timestamp)
                .toUTC()
                .set(setAssistanceDate)
                .setZone("UTC", {
                  keepLocalTime: true,
                })
            : computed.start.setZone("UTC"),
          isRegisteredStartTime: breakStart != null,
          isRegisteredEndTime: breakEnd != null,
          endTime: breakEnd
            ? DateTime.fromISO(breakEnd.timestamp).toUTC().setZone("UTC", {
                keepLocalTime: true,
              })
            : computed.end.setZone("UTC"),
          scheduleStartTime: DateTime.fromISO(x.startTime)
            .toUTC()
            .setZone("UTC", {
              keepLocalTime: true,
            }),
          scheduleEndTime: DateTime.fromISO(x.endTime).toUTC().setZone("UTC", {
            keepLocalTime: true,
          }),
        };
      }) ?? [],
  };

  return (
    <ModalCompleteAssistanceComponent
      key={assistance.publicId}
      isOpen={isOpen}
      onClose={onClose}
      assistance={assistance}
      defaultValues={defaultValues}
    />
  );
}
