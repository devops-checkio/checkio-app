/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import CompanySelector from "@/app/[locale]/_components/company-selector";
import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { CheckIOCheckbox } from "@/components/ui/checkio-checkbox";
import SystemInput from "@/components/ui/system-input";
import { useToast } from "@/hooks/use-toast";
import { useCreateShift, useUpdateShift } from "@/service/shift.service";
import { handleError } from "@/utils/error";
import { Check, Loader2, X } from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import {
  PersonType,
  ScheduleResponseDto,
} from "../../schedules/_components/schedule.dto";
import SelectScheduleDrawer from "../editor/[shiftId]/_components/select-schedule-drawer";
import { SummaryShift } from "../editor/[shiftId]/_components/summary-shift";
import { ShiftNomenclature } from "./shift-nomenclature";
import ShiftWeek from "./shift-week";
import {
  RotationType,
  ScheduleShiftUpsertDto,
  ShiftCreateDto,
  ShiftResponseDto,
} from "./shifth.dto";

const DAYS_OF_WEEK = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

// Helper function to create default values
const createDefaultValues = (
  shift?: ShiftResponseDto,
  selectedSchedules?: ScheduleResponseDto[],
) => {
  if (shift) {
    const validSchedulePublicIds = new Set(
      (selectedSchedules ?? []).map((s) => s.publicId),
    );
    return {
      name: shift.name,
      type: shift.type,
      nomenclature: shift.nomenclature,
      days: shift.days,
      weeks: shift.weeks,
      selectedSchedules: selectedSchedules || [],
      schedules: shift.schedules.map((schedule) => {
        const scheduleId =
          schedule.scheduleId && validSchedulePublicIds.has(schedule.scheduleId)
            ? schedule.scheduleId
            : "";
        return {
          ...schedule,
          publicId: schedule.publicId || uuidv4(),
          scheduleId,
        };
      }),
      companies: shift.companies,
    };
  }

  return {
    name: "",
    type: RotationType.WEEKLY,
    nomenclature: "",
    days: 0,
    weeks: 1,
    selectedSchedules: [],
    schedules: Array(7)
      .fill(null)
      .map((_, i) => ({
        publicId: uuidv4(),
        day: DAYS_OF_WEEK[i],
        dayIndex: i,
        weekIndex: 0,
        scheduleId: "",
      })),
    companies: [],
  };
};

export function ShiftEditor({
  shift,
  selectedSchedules,
  invalidReferencedScheduleCount = 0,
}: {
  shift?: ShiftResponseDto;
  selectedSchedules?: ScheduleResponseDto[];
  /** Cantidad de scheduleIds del turno que no vinieron del API (p. ej. no ligados a empresas del turno). */
  invalidReferencedScheduleCount?: number;
}) {
  const tForm = useTranslations("mantainers.shifts.form");
  const { toast } = useToast();
  const router = useRouter();
  const hasShownInvalidSchedulesToast = useRef(false);

  useEffect(() => {
    if (
      !shift ||
      invalidReferencedScheduleCount <= 0 ||
      hasShownInvalidSchedulesToast.current
    ) {
      return;
    }
    hasShownInvalidSchedulesToast.current = true;
    toast({
      title: tForm("invalidSchedules.title"),
      description: tForm("invalidSchedules.description", {
        count: invalidReferencedScheduleCount,
      }),
    });
  }, [shift, invalidReferencedScheduleCount, toast, tForm]);
  const { mutate: createShift, isPending: isCreatingShift } = useCreateShift();
  const { mutate: updateShift, isPending: isUpdatingShift } = useUpdateShift();

  // Estado para manejar días seleccionados
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [isMassAssignmentMode, setIsMassAssignmentMode] = useState(false);

  // Create default values
  const defaultValues = useMemo(
    () => createDefaultValues(shift, selectedSchedules),
    [shift, selectedSchedules],
  );

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShiftCreateDto>({
    defaultValues,
  });

  const {
    fields: rotatingFields,
    append: appendRotating,
    update: updateRotating,
    replace: replaceRotating,
  } = useFieldArray<ShiftCreateDto, "schedules", "publicId">({
    control,
    name: "schedules",
    keyName: "publicId",
  });

  const {
    fields: selectedSchedulesFields,
    append: appendSelectedSchedules,
    update: updateSelectedSchedules,
  } = useFieldArray<ShiftCreateDto, "selectedSchedules", "publicId">({
    control,
    name: "selectedSchedules",
  });

  const rotationType = watch("type");
  const days = watch("days");
  const weeks = watch("weeks");
  const companies = watch("companies") ?? [];
  const canAddSchedule = companies.length > 0;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<number>(0);

  const handleOpenDrawer = useCallback(
    (day: string, week: number) => {
      if (companies.length === 0) {
        toast({
          title: "Empresas requeridas",
          description:
            "Seleccione al menos una empresa primero para poder agregar horarios",
          variant: "destructive",
        });
        return;
      }
      setSelectedDay(day);
      setSelectedWeek(week);
      setIsDrawerOpen(true);
    },
    [companies.length, toast],
  );

  const handleDaySelection = useCallback((dayKey: string, checked: boolean) => {
    setSelectedDays((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(dayKey);
      } else {
        newSet.delete(dayKey);
      }
      return newSet;
    });
  }, []);

  const handleMassAssignment = useCallback(() => {
    if (selectedDays.size === 0) {
      toast({
        title: "Selección requerida",
        description:
          "Por favor seleccione al menos un día para asignar horario masivamente",
        variant: "destructive",
      });
      return;
    }
    setIsDrawerOpen(true);
  }, [selectedDays.size, toast]);

  const handleScheduleSelect = useCallback(
    (schedule: ScheduleResponseDto) => {
      const existingSchedule = selectedSchedulesFields.find(
        (field) => field.publicId === schedule.publicId,
      );

      if (!existingSchedule) {
        appendSelectedSchedules(schedule);
      }

      // Si estamos en modo asignación masiva
      if (isMassAssignmentMode && selectedDays.size > 0) {
        selectedDays.forEach((dayKey) => {
          const [day, weekIndexStr] = dayKey.split("-");
          const weekIndex = parseInt(weekIndexStr);

          if (rotationType === RotationType.WEEKLY) {
            const dayIndex = DAYS_OF_WEEK.indexOf(day);
            const targetIndex = weekIndex * DAYS_OF_WEEK.length + dayIndex;

            if (targetIndex >= 0 && targetIndex < rotatingFields.length) {
              const record = rotatingFields[targetIndex];
              const scheduleData: ScheduleShiftUpsertDto = {
                day,
                dayIndex,
                weekIndex,
                scheduleId: schedule.publicId,
                publicId: record?.publicId || uuidv4(),
              };
              updateRotating(targetIndex, scheduleData);
            }
          } else if (rotationType === RotationType.DAILY) {
            const dayIndex = parseInt(day.split(" ")[1]) - 1;

            if (dayIndex >= 0 && dayIndex < rotatingFields.length) {
              const record = rotatingFields[dayIndex];
              const scheduleData: ScheduleShiftUpsertDto = {
                day,
                dayIndex,
                weekIndex: 0,
                scheduleId: schedule.publicId,
                publicId: record?.publicId || uuidv4(),
              };
              updateRotating(dayIndex, scheduleData);
            }
          }
        });

        return;
      }

      // Lógica original para asignación individual
      if (rotationType === RotationType.WEEKLY) {
        let scheduleData: ScheduleShiftUpsertDto = {
          day: selectedDay,
          dayIndex: DAYS_OF_WEEK.indexOf(selectedDay),
          weekIndex: selectedWeek,
          scheduleId: schedule.publicId,
        };

        const targetIndex =
          selectedWeek * DAYS_OF_WEEK.length +
          DAYS_OF_WEEK.indexOf(selectedDay);

        if (targetIndex >= 0 && targetIndex < rotatingFields.length) {
          const record = rotatingFields[targetIndex];
          if (record?.publicId) {
            scheduleData = {
              ...scheduleData,
              publicId: record.publicId,
            };
          }

          updateRotating(targetIndex, scheduleData);
        }
      } else if (rotationType === RotationType.DAILY) {
        const dayIndex = parseInt(selectedDay.split(" ")[1]) - 1;
        let scheduleData: ScheduleShiftUpsertDto = {
          day: selectedDay,
          dayIndex,
          weekIndex: 0,
          scheduleId: schedule.publicId,
        };

        if (dayIndex >= 0 && dayIndex < rotatingFields.length) {
          const record = rotatingFields[dayIndex];
          if (record?.publicId) {
            scheduleData = {
              ...scheduleData,
              publicId: record.publicId,
            };
          }
          updateRotating(dayIndex, scheduleData);
        }
      }

      setIsDrawerOpen(false);
    },
    [
      rotationType,
      selectedDay,
      selectedWeek,
      selectedSchedulesFields,
      appendSelectedSchedules,
      rotatingFields,
      updateRotating,
      isMassAssignmentMode,
      selectedDays,
    ],
  );

  const handleDeleteSchedule = useCallback(
    (dayIndex: number, weekIndex: number) => {
      const index = rotatingFields.findIndex(
        (field) => field.dayIndex === dayIndex && field.weekIndex === weekIndex,
      );
      if (index !== -1) {
        const scheduleData: ScheduleShiftUpsertDto = {
          ...rotatingFields[index],
          scheduleId: "",
        };
        updateRotating(index, scheduleData);
      }
    },
    [rotatingFields, updateRotating],
  );

  const isFirstRender = useRef(true);
  const isEditing = useRef(!!shift);

  const handleRotationChange = useCallback(() => {
    // Obtener los horarios actuales del formulario
    const currentSchedules = watch("schedules");

    // Crear un mapa de horarios existentes para preservarlos
    const scheduleMap = new Map<string, string>();

    currentSchedules.forEach((field) => {
      if (field.scheduleId && field.scheduleId !== "") {
        const key = `${field.dayIndex}-${field.weekIndex}`;
        scheduleMap.set(key, field.scheduleId);
      }
    });

    if (rotationType === RotationType.DAILY && days > 0) {
      const newSchedules = Array(days)
        .fill(null)
        .map((_, i) => {
          const key = `${i}-0`;
          const existingScheduleId = scheduleMap.get(key);

          return {
            publicId: uuidv4(),
            day: `Día ${i + 1}`,
            dayIndex: i,
            weekIndex: 0,
            scheduleId: existingScheduleId || "",
          } as ScheduleShiftUpsertDto;
        });
      replaceRotating(newSchedules);
    } else if (rotationType === RotationType.WEEKLY && weeks > 0) {
      const newSchedules = Array(weeks * 7)
        .fill(null)
        .map((_, i) => {
          const dayIndex = i % 7;
          const weekIndex = Math.floor(i / 7);
          const key = `${dayIndex}-${weekIndex}`;
          const existingScheduleId = scheduleMap.get(key);

          return {
            publicId: uuidv4(),
            day: DAYS_OF_WEEK[dayIndex],
            dayIndex,
            weekIndex,
            scheduleId: existingScheduleId || "",
          } as ScheduleShiftUpsertDto;
        });
      replaceRotating(newSchedules);
    }
  }, [days, rotationType, replaceRotating, weeks, watch]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Solo ejecutar cuando cambien los valores que realmente importan
    if (
      (rotationType === RotationType.DAILY && days > 0) ||
      (rotationType === RotationType.WEEKLY && weeks > 0)
    ) {
      handleRotationChange();
    }
  }, [rotationType, days, weeks]);

  // Efecto para inicializar los schedules cuando se monta el componente
  useEffect(() => {
    if (!isEditing.current && rotatingFields.length === 0) {
      // Si no hay schedules y no estamos editando, inicializar con el valor por defecto
      if (rotationType === RotationType.WEEKLY && weeks > 0) {
        const newSchedules = Array(weeks * 7)
          .fill(null)
          .map(
            (_, i) =>
              ({
                publicId: uuidv4(),
                day: DAYS_OF_WEEK[i % 7],
                dayIndex: i % 7,
                weekIndex: Math.floor(i / 7),
                scheduleId: "",
              }) as ScheduleShiftUpsertDto,
          );
        replaceRotating(newSchedules);
      }
    }
  }, [
    isEditing.current,
    rotatingFields.length,
    rotationType,
    weeks,
    replaceRotating,
  ]);

  const onSubmit: SubmitHandler<ShiftCreateDto> = useCallback(
    ({ selectedSchedules, ...data }) => {
      const scheduleData = {
        ...data,
        days: rotationType === RotationType.DAILY ? days : weeks * 7,
        schedules: data.schedules.map((schedule) => ({
          day: schedule.day,
          dayIndex: schedule.dayIndex,
          weekIndex: schedule.weekIndex,
          scheduleId: schedule.scheduleId,
          publicId: schedule.publicId,
        })),
      };

      if (shift) {
        updateShift(
          {
            ...scheduleData,
            publicId: shift.publicId,
          },
          {
            onSuccess: () => {
              toast({
                title: "Turno actualizado correctamente",
                description: "El turno ha sido actualizado correctamente",
              });
              router.push("/mantainers/shifts");
            },
            onError: (error) => {
              handleError(error, toast);
            },
          },
        );
      } else {
        createShift(scheduleData, {
          onSuccess: () => {
            toast({
              title: "Turno creado correctamente",
              description: "El turno ha sido creado correctamente",
            });
            router.push("/mantainers/shifts");
          },
          onError: (error) => {
            handleError(error, toast);
          },
        });
      }
    },
    [shift, rotationType, days, weeks, updateShift, createShift, toast, router],
  );

  const getScheduleDetails = useCallback(
    (scheduleId: string): ScheduleResponseDto => {
      return selectedSchedulesFields.find(
        (field) => field.publicId === scheduleId,
      ) as ScheduleResponseDto;
    },
    [selectedSchedulesFields],
  );

  // Suma todas las celdas del ciclo; luego convierte a equivalente semanal para el tope legal.
  const totalHours = useMemo(() => {
    let cycleWorkSeconds = 0;
    let cycleHealthSeconds = 0;

    const schedules = watch("schedules");
    const rotationType = watch("type");
    const weeks = watch("weeks");
    const days = watch("days");

    const formatDuration = (totalSec: number) => {
      const sec = Math.max(0, Math.round(totalSec));
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      return `${h}h ${m}m ${s}s`;
    };

    schedules.forEach((schedule) => {
      if (schedule.scheduleId != "") {
        const details = getScheduleDetails(schedule.scheduleId);
        if (details) {
          const start = DateTime.fromISO(details.startTime).toUTC();
          const end = start.plus({
            hours: details.workHours,
            minutes: details.workMinutes || 0,
          });
          let slotWorkSeconds = end.diff(start, "seconds").seconds;

          details.ScheduleBreaks?.forEach((breakingTime) => {
            const bStart = DateTime.fromISO(breakingTime.startTime).toUTC();
            const bEnd = DateTime.fromISO(breakingTime.endTime).toUTC();
            const breakSeconds = bEnd.diff(bStart, "seconds").seconds;
            cycleHealthSeconds += breakSeconds;

            if (breakingTime.deductible) {
              slotWorkSeconds -= breakSeconds;
            }
          });

          const discountSec = (details.discountMinutes ?? 0) * 60;
          slotWorkSeconds = Math.max(0, slotWorkSeconds - discountSec);

          cycleWorkSeconds += slotWorkSeconds;
        }
      }
    });

    let weeklyWorkSeconds = cycleWorkSeconds;
    let weeklyHealthSeconds = cycleHealthSeconds;

    if (rotationType === RotationType.WEEKLY && weeks > 0) {
      weeklyWorkSeconds = cycleWorkSeconds / weeks;
      weeklyHealthSeconds = cycleHealthSeconds / weeks;
    } else if (rotationType === RotationType.DAILY && days > 0) {
      weeklyWorkSeconds = (cycleWorkSeconds * 7) / days;
      weeklyHealthSeconds = (cycleHealthSeconds * 7) / days;
    }

    const weeklyWorkHoursDecimal = weeklyWorkSeconds / 3600;

    return {
      work: {
        total: formatDuration(weeklyWorkSeconds),
      },
      health: {
        total: formatDuration(weeklyHealthSeconds),
      },
      weeklyWorkHoursDecimal,
    };
  }, [
    watch("schedules"),
    watch("type"),
    watch("weeks"),
    watch("days"),
    getScheduleDetails,
  ]);

  const [hasAnyOverlap, setHasAnyOverlap] = useState(false);
  const overlapsMap = useRef(new Map<string, boolean>());

  const handleOverlapChange = useCallback(
    (day: string, hasOverlap: boolean) => {
      overlapsMap.current.set(day, hasOverlap);
      const hasAny = Array.from(overlapsMap.current.values()).some(
        (value) => value,
      );
      setHasAnyOverlap(hasAny);
    },
    [],
  );

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div
          className="grid grid-cols-3 gap-4"
          data-tour="shifts-editor-basic-info"
        >
          <div className="flex flex-col gap-4">
            <SystemInput
              control={control}
              label="Nombre del Turno"
              attribute="name"
              errors={errors}
              rules={{ required: "Por favor ingrese el nombre del turno" }}
            />
            <CompanySelector
              control={control}
              name="companies"
              label="Empresas"
              mode="multiple"
              errors={errors}
              rules={{ required: "Por favor seleccione al menos una empresa" }}
              setValue={setValue}
            />
          </div>
          <div className="col-span-2">
            <SummaryShift
              workHours={totalHours.work}
              healthHours={totalHours.health}
              weeklyWorkHoursDecimal={totalHours.weeklyWorkHoursDecimal}
            />
          </div>
        </div>
        <div data-tour="shifts-editor-nomenclature">
          <ShiftNomenclature
            control={control}
            setValue={setValue}
            atribute="nomenclature"
          />
        </div>

        <div className="space-y-4">
          <div
            className="flex items-center gap-4"
            data-tour="shifts-editor-rotation-config"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Tipo de Rotación:</span>
              <CHEKIOSelect
                value={rotationType}
                onValueChange={(value) =>
                  setValue("type", value as RotationType)
                }
              >
                <CHEKIOSelectTrigger className="w-[200px]">
                  <CHEKIOSelectValue placeholder="Seleccione tipo" />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  <CHEKIOSelectItem value={RotationType.DAILY}>
                    Rotativo por Días
                  </CHEKIOSelectItem>
                  <CHEKIOSelectItem value={RotationType.WEEKLY}>
                    Rotativo Semanal
                  </CHEKIOSelectItem>
                </CHEKIOSelectContent>
              </CHEKIOSelect>
            </div>

            {rotationType === RotationType.DAILY && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Días de rotación:</span>
                <CHEKIOInput
                  type="number"
                  min={1}
                  value={days?.toString() || ""}
                  onChange={(e) =>
                    setValue(
                      "days",
                      e.target.value ? parseInt(e.target.value) : 0,
                    )
                  }
                  className="w-20"
                />
              </div>
            )}

            {rotationType === RotationType.WEEKLY && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Semanas de rotación:</span>
                <CHEKIOInput
                  type="number"
                  min={1}
                  value={weeks?.toString() || ""}
                  onChange={(e) =>
                    setValue(
                      "weeks",
                      e.target.value ? parseInt(e.target.value) : 0,
                    )
                  }
                  className="w-20"
                />
              </div>
            )}
            <div
              className="flex items-center gap-4 p-4 rounded-lg w-full"
              data-tour="shifts-editor-mass-assignment"
            >
              <div className="flex items-center gap-2">
                <CheckIOCheckbox
                  checked={isMassAssignmentMode}
                  onCheckedChange={(checked) => {
                    setIsMassAssignmentMode(checked as boolean);
                    if (!checked) {
                      setSelectedDays(new Set());
                    }
                  }}
                />
                <span className="text-sm font-medium text-blue-800">
                  Modo asignación masiva
                </span>
              </div>

              {isMassAssignmentMode && (
                <>
                  <span className="text-sm text-blue-600">
                    Días seleccionados: {selectedDays.size}
                  </span>
                  <CHEKIOButton
                    type="button"
                    variant="primary"
                    onClick={handleMassAssignment}
                    disabled={selectedDays.size === 0 || !canAddSchedule}
                    title={
                      !canAddSchedule
                        ? "Seleccione al menos una empresa primero"
                        : undefined
                    }
                  >
                    <Check className="h-4 w-4" />
                    Asignar horario masivo
                  </CHEKIOButton>
                  <CHEKIOButton
                    type="button"
                    variant="secondaryBlue"
                    onClick={() => {
                      setSelectedDays(new Set());
                      setIsMassAssignmentMode(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </CHEKIOButton>
                </>
              )}
            </div>
          </div>

          {/* Controles de asignación masiva */}

          <div data-tour="shifts-editor-schedule-grid">
            {rotationType === RotationType.DAILY && (
              <div className="grid grid-cols-7 items-stretch gap-2">
                {rotatingFields.map((field, index) => {
                  const details = field.scheduleId
                    ? getScheduleDetails(field.scheduleId)
                    : null;
                  const dayKey = `${field.day}-${field.weekIndex}`;
                  const isSelected = selectedDays.has(dayKey);

                  return (
                    <div
                      key={`SHIFT-DAILY-${index}`}
                      className="relative flex h-full min-h-0 flex-col"
                    >
                      {isMassAssignmentMode && (
                        <div className="absolute top-2 left-2 z-10">
                          <CheckIOCheckbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleDaySelection(dayKey, checked as boolean)
                            }
                            className="bg-white rounded shadow-sm"
                          />
                        </div>
                      )}
                      <div
                        className={`flex h-full min-h-0 flex-1 flex-col ${
                          isSelected ? "ring-2 ring-blue-500 rounded-lg" : ""
                        }`}
                      >
                        <ShiftWeek
                          day={`Día ${index + 1}`}
                          record={field as ScheduleShiftUpsertDto}
                          handleDelete={() =>
                            handleDeleteSchedule(
                              field.dayIndex,
                              field.weekIndex,
                            )
                          }
                          scheduleDay={details}
                          selectedSchedules={selectedSchedulesFields}
                          schedulesRotating={rotatingFields}
                          handleOpenDrawer={(day) => handleOpenDrawer(day, 0)}
                          onOverlapChange={(hasOverlap) =>
                            handleOverlapChange(field.day, hasOverlap)
                          }
                          canAddSchedule={canAddSchedule}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {rotationType === RotationType.WEEKLY && (
              <div className="grid grid-cols-7 items-stretch gap-2">
                {rotatingFields.map((field, index) => {
                  const weekIndex = Math.floor(index / 7);
                  const details = field.scheduleId
                    ? getScheduleDetails(field.scheduleId)
                    : null;
                  const dayKey = `${field.day}-${field.weekIndex}`;
                  const isSelected = selectedDays.has(dayKey);

                  return (
                    <div
                      key={`SHIFT-WEEKLY-${index}`}
                      className="relative flex h-full min-h-0 flex-col"
                    >
                      {isMassAssignmentMode && (
                        <div className="absolute top-2 left-2 z-10">
                          <CheckIOCheckbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleDaySelection(dayKey, checked as boolean)
                            }
                            className="bg-white rounded shadow-sm"
                          />
                        </div>
                      )}
                      <div
                        className={`flex h-full min-h-0 flex-1 flex-col ${
                          isSelected ? "ring-2 ring-blue-500 rounded-lg" : ""
                        }`}
                      >
                        <ShiftWeek
                          handleDelete={() =>
                            handleDeleteSchedule(
                              field.dayIndex,
                              field.weekIndex,
                            )
                          }
                          day={DAYS_OF_WEEK[index % 7]}
                          record={field as ScheduleShiftUpsertDto}
                          scheduleDay={details}
                          selectedSchedules={selectedSchedulesFields}
                          schedulesRotating={rotatingFields}
                          handleOpenDrawer={(day) =>
                            handleOpenDrawer(day, weekIndex)
                          }
                          onOverlapChange={(hasOverlap) =>
                            handleOverlapChange(field.day, hasOverlap)
                          }
                          canAddSchedule={canAddSchedule}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end" data-tour="shifts-editor-submit">
          {!hasAnyOverlap && (
            <CHEKIOButton
              type="submit"
              variant="primary"
              disabled={isCreatingShift || isUpdatingShift}
            >
              {isCreatingShift || isUpdatingShift ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </CHEKIOButton>
          )}
          {hasAnyOverlap && (
            <div className="flex items-center gap-2 text-red-500">
              <X className="h-4 w-4" />
              <span className="text-sm">
                No se puede guardar mientras existan conflictos en los horarios
              </span>
            </div>
          )}
        </div>
      </form>

      {isDrawerOpen && (
        <SelectScheduleDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
          }}
          onSelect={handleScheduleSelect}
          companyIds={companies}
          personType={PersonType.EMPLOYEE}
        />
      )}
    </>
  );
}
