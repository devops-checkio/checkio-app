/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import SystemInput from "@/components/ui/system-input";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateSchedule,
  useGetSchedule,
  useUpdateSchedule,
} from "@/service/schedule.service";
import { checkOverlap, positionInTime } from "@/utils/control-overlap";
import { DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { InputNumber, Modal, Select, Table } from "antd";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  BreakType,
  ScheduleBreakCreateDto,
  ScheduleBreakDto,
  ScheduleBreakUpdateDto,
  ScheduleCreateDto,
  ScheduleResponseDto,
  ScheduleUpdateDto,
} from "./schedule.dto";

interface ScheduleModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  publicId: string | null;
  isPreview: boolean;
  // Nuevas props para mejor integración
  showCreateButton?: boolean;
  showEditButton?: boolean;
}

interface ScheduleModalUpsertContentProps {
  isOpen: boolean;
  onClose: () => void;
  editingSchedule: ScheduleResponseDto | undefined;
  onSuccess: () => void;
  publicId: string | null;
  isPreview: boolean;
  showCreateButton?: boolean;
  showEditButton?: boolean;
}

interface CustomAlertProps {
  type: "success" | "error";
  message: string;
  description: string;
  onClose: () => void;
}

const CustomAlert = ({
  type,
  message,
  description,
  onClose,
}: CustomAlertProps) => {
  const bgColor = type === "success" ? "bg-green-50" : "bg-red-50";
  const borderColor =
    type === "success" ? "border-green-200" : "border-red-200";
  const textColor = type === "success" ? "text-green-800" : "text-red-800";
  const iconColor = type === "success" ? "text-green-500" : "text-red-500";

  return (
    <div
      className={`${bgColor} border ${borderColor} rounded-lg p-4 relative animate-fade-in`}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={18} />
      </button>
      <div className="flex items-start gap-3">
        {type === "success" ? (
          <CheckCircle2 className={`${iconColor} mt-0.5`} size={20} />
        ) : (
          <AlertCircle className={`${iconColor} mt-0.5`} size={20} />
        )}
        <div className="flex-1">
          <h4 className={`font-medium ${textColor}`}>{message}</h4>
          <p className={`text-sm mt-1 ${textColor} opacity-90`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

function ScheduleModalUpsertContent({
  isOpen,
  onClose,
  editingSchedule,
  onSuccess,
  isPreview,
  showCreateButton = true,
  showEditButton = true,
}: ScheduleModalUpsertContentProps) {
  const { toast } = useToast();
  const { mutate: createSchedule, isPending: isCreatingSchedule } =
    useCreateSchedule();
  const { mutate: updateSchedule, isPending: isUpdatingSchedule } =
    useUpdateSchedule();
  const [calculatedEndTime, setCalculatedEndTime] = useState<DateTime | null>(
    null
  );
  const [totalDays, setTotalDays] = useState<number>(0);
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ScheduleCreateDto | ScheduleUpdateDto>({
    defaultValues: editingSchedule
      ? {
          name: editingSchedule.name,
          code: editingSchedule.code,
          startTime: new Date(editingSchedule.startTime.replace("Z", "")),
          workHours: editingSchedule.workHours,
          workMinutes: editingSchedule.workMinutes,
          discountMinutes: editingSchedule.discountMinutes,
          ScheduleBreaks: editingSchedule.ScheduleBreaks,
        }
      : {
          name: "",
          code: "",
          startTime: new Date(new Date().setHours(8, 0, 0, 0)),
          workHours: 8,
          workMinutes: 0,
          discountMinutes: 0,
          ScheduleBreaks: [],
        },
  });

  const breaks = watch("ScheduleBreaks");
  const startTime = watch("startTime");
  const workHours = watch("workHours");
  const workMinutes = watch("workMinutes");
  const discountMinutes = watch("discountMinutes");

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
    description: string;
  } | null>(null);

  const validateBreaks = useCallback(
    (breaksToValidate: ScheduleBreakDto[]) => {
      if (!startTime || !calculatedEndTime) return breaksToValidate;

      const scheduleStart = DateTime.fromJSDate(startTime as Date);
      const scheduleEnd = calculatedEndTime;

      return breaksToValidate.map((breakItem) => {
        let breakStart = DateTime.fromJSDate(breakItem.startTime as Date);
        let breakEnd = DateTime.fromJSDate(breakItem.endTime as Date);

        if (breakItem.day < 1 || breakItem.day > totalDays) {
          return {
            ...breakItem,
            error: `El día debe estar entre 1 y ${totalDays}`,
          };
        }

        [breakStart, breakEnd] = positionInTime(
          breakStart,
          breakEnd,
          breakItem.day
        );

        if (breakItem.day > totalDays) {
          return {
            ...breakItem,
            error:
              "La pausa no puede terminar al día siguiente en el último día",
          };
        }

        if (breakStart < scheduleStart) {
          return {
            ...breakItem,
            error: "La pausa comienza antes del horario del día",
          };
        }
        if (breakEnd > scheduleEnd) {
          return {
            ...breakItem,
            error: "La pausa termina después del horario del día",
          };
        }

        const hasOverlap = breaksToValidate.some((otherBreak) => {
          if (otherBreak.publicId === breakItem.publicId) return false;

          [breakStart, breakEnd] = positionInTime(
            breakStart,
            breakEnd,
            breakItem.day
          );
          let otherStart = DateTime.fromJSDate(otherBreak.startTime as Date);
          let otherEnd = DateTime.fromJSDate(otherBreak.endTime as Date);
          [otherStart, otherEnd] = positionInTime(
            otherStart,
            otherEnd,
            otherBreak.day
          );

          return checkOverlap(breakStart, breakEnd, otherStart, otherEnd);
        });

        if (hasOverlap) {
          return { ...breakItem, error: "La pausa se traslapa con otra" };
        }

        return { ...breakItem, error: undefined };
      });
    },
    [startTime, calculatedEndTime, totalDays]
  );

  const handleBreakChange = (index: number, field: string, value: any) => {
    const currentBreaks = [...(breaks || [])];

    // Create a new object to ensure reference changes are detected
    currentBreaks[index] = {
      ...currentBreaks[index],
      [field]:
        field === "startTime" || field === "endTime"
          ? new Date(value) // Create a new Date instance to ensure reference change
          : value,
    };

    const validatedBreaks = validateBreaks(currentBreaks);
    setValue("ScheduleBreaks", validatedBreaks, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  useEffect(() => {
    if (startTime && workHours) {
      const start = DateTime.fromJSDate(startTime as Date);
      const end = start.plus({
        hours: workHours,
        minutes: workMinutes || 0,
      });
      const startDay = start.startOf("day");
      const endDay = end.startOf("day");
      const totalDays = Math.ceil(endDay.diff(startDay, "days").days + 1);
      setCalculatedEndTime(end);
      setTotalDays(totalDays);

      const startFormatted = start.toFormat("HH:mm");
      const endFormatted = end.toFormat("HH:mm");

      const hasBreaks = breaks?.length > 0;
      const hasLunch = breaks?.find((b) => b.type === BreakType.LUNCH);
      const hasDiscount = discountMinutes > 0;

      const lunchMinutes = hasLunch
        ? (editingSchedule
            ? DateTime.fromISO(hasLunch?.endTime as string)
                .diff(DateTime.fromISO(hasLunch?.startTime as string))
                .as("minutes")
            : DateTime.fromJSDate(hasLunch?.endTime as Date)
                .diff(DateTime.fromJSDate(hasLunch?.startTime as Date))
                .as("minutes")) || ""
        : "";

      const breakInfo = hasBreaks ? (hasLunch ? "C/C" : "S/C") : "S/C";
      const deductibleInfo = hasDiscount ? "C/D" : "S/D";

      if (workHours < 24) {
        const generatedName = `${startFormatted} - ${endFormatted} ${breakInfo} ${
          hasLunch ? lunchMinutes : hasDiscount ? discountMinutes : ""
        } ${deductibleInfo}`;
        setValue("name", generatedName);
      } else {
        const generatedName = `${startFormatted} - ${endFormatted} ${breakInfo} ${
          hasLunch ? lunchMinutes : hasDiscount ? discountMinutes : ""
        } ${deductibleInfo} ${workHours}:${workMinutes}`;
        setValue("name", generatedName);
      }
    }
  }, [startTime, workHours, workMinutes, breaks, discountMinutes, setValue]);

  useEffect(() => {
    if (breaks?.length) {
      const validatedBreaks = validateBreaks(breaks);
      const hasChanges = validatedBreaks.some((newBreak, index) => {
        if (index >= breaks.length) return true;
        const oldBreak = breaks[index];

        // Compare dates by their time values instead of reference
        const startTimeChanged =
          newBreak.startTime instanceof Date &&
          oldBreak.startTime instanceof Date
            ? newBreak.startTime.getTime() !== oldBreak.startTime.getTime()
            : newBreak.startTime !== oldBreak.startTime;

        const endTimeChanged =
          newBreak.endTime instanceof Date && oldBreak.endTime instanceof Date
            ? newBreak.endTime.getTime() !== oldBreak.endTime.getTime()
            : newBreak.endTime !== oldBreak.endTime;

        return (
          newBreak.error !== oldBreak.error ||
          startTimeChanged ||
          endTimeChanged ||
          newBreak.day !== oldBreak.day ||
          newBreak.type !== oldBreak.type ||
          newBreak.deductible !== oldBreak.deductible ||
          newBreak.description !== oldBreak.description
        );
      });

      if (hasChanges) {
        setValue("ScheduleBreaks", validatedBreaks);
      }
    }
  }, [breaks, validateBreaks, setValue]);

  const breakColumns = [
    {
      title: "Descripción",
      dataIndex: "description",
      key: "description",
      render: (_: string, record: ScheduleBreakDto, index: number) => (
        <Controller
          name={`ScheduleBreaks.${index}.description`}
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              disabled={isPreview}
              className="w-full border rounded px-2 py-1"
              onChange={(e) =>
                handleBreakChange(index, "description", e.target.value)
              }
              value={field.value}
            />
          )}
        />
      ),
    },
    {
      title: "Tipo",
      dataIndex: "type",
      key: "type",
      render: (_: string, record: ScheduleBreakDto, index: number) => (
        <Controller
          name={`ScheduleBreaks.${index}.type`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              disabled={isPreview}
              options={[
                { label: "Pausa", value: BreakType.BREAK },
                { label: "Colación", value: BreakType.LUNCH },
              ]}
              onChange={(value) => {
                field.onChange(value);
                handleBreakChange(index, "type", value);
              }}
            />
          )}
        />
      ),
    },
    {
      title: "Día",
      dataIndex: "day",
      key: "day",
      width: "150px",
      render: (_: number, record: ScheduleBreakDto, index: number) => (
        <Controller
          name={`ScheduleBreaks.${index}.day`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              disabled={isPreview}
              options={Array.from({ length: totalDays }, (_, i) => ({
                label: `Día ${i + 1}`,
                value: i + 1,
              }))}
              onChange={(value) => {
                field.onChange(value);
                handleBreakChange(index, "day", value);
              }}
            />
          )}
        />
      ),
    },
    {
      title: "Hora Inicio",
      dataIndex: "startTime",
      key: "startTime",
      render: (_: Date, record: ScheduleBreakDto, index: number) => (
        <Controller
          name={`ScheduleBreaks.${index}.startTime`}
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Hora de Inicio
              </label>
              <div className="relative">
                <input
                  type="time"
                  {...field}
                  onChange={(e) => {
                    const timeString = e.target.value;
                    const [hours, minutes] = timeString.split(":").map(Number);
                    const date = new Date();
                    date.setHours(hours, minutes, 0, 0);
                    field.onChange(date);
                  }}
                  value={
                    field.value
                      ? new Date(field.value).toLocaleTimeString("en-US", {
                          hour12: false,
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""
                  }
                  disabled={isPreview}
                  className="w-full h-10 px-3 py-2 border rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              {fieldState.error && (
                <p className="text-sm text-red-500">
                  {fieldState.error.message}
                </p>
              )}
              <div className="text-xs text-gray-500">
                Hora de inicio del turno
              </div>
            </div>
          )}
        />
      ),
    },
    {
      title: "Hora Término",
      dataIndex: "endTime",
      key: "endTime",
      render: (_: Date, record: ScheduleBreakDto, index: number) => (
        <Controller
          name={`ScheduleBreaks.${index}.endTime`}
          control={control}
          render={({ field, fieldState }) => (
            <TimePicker
              name={`ScheduleBreaks.${index}.endTime`}
              control={control}
              error={!!fieldState.error}
              disabled={isPreview}
              errorMessage={fieldState.error?.message}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                handleBreakChange(index, "endTime", value);
              }}
            />
          )}
        />
      ),
    },
    {
      title: "Estado",
      key: "error",
      render: (_: any, record: ScheduleBreakDto) =>
        record.error ? (
          <span className="text-red-500 text-sm">{record.error}</span>
        ) : (
          <span className="text-green-500 text-sm">Válido</span>
        ),
    },
    {
      title: "Descuento",
      dataIndex: "deductible",
      key: "deductible",
      render: (_: any, record: ScheduleBreakDto, index: number) => (
        <Controller
          name={`ScheduleBreaks.${index}.deductible`}
          control={control}
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                handleBreakChange(index, "deductible", checked);
              }}
              disabled={isPreview}
            />
          )}
        />
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_: any, record: ScheduleBreakDto) => (
        <>
          {!isPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const updatedBreaks = breaks.filter(
                  (b: ScheduleBreakDto) => b.publicId !== record.publicId
                );
                setValue("ScheduleBreaks", validateBreaks(updatedBreaks), {
                  shouldDirty: true,
                  shouldTouch: true,
                });
              }}
            >
              <DeleteOutlined />
            </Button>
          )}
        </>
      ),
    },
  ];

  const onSubmit = (data: ScheduleCreateDto | ScheduleUpdateDto) => {
    const hasErrors = data.ScheduleBreaks.some(
      (b: ScheduleBreakDto | ScheduleBreakUpdateDto) => b.error
    );
    if (hasErrors) {
      setAlert({
        type: "error",
        message: "Error en las pausas",
        description:
          "Hay pausas con errores. Por favor corrígelas antes de continuar.",
      });
      return;
    }
    if (editingSchedule) {
      updateSchedule(
        {
          ...data,
          publicId: editingSchedule.publicId,
          startTime: DateTime.fromJSDate(data.startTime as Date)
            .setZone("utc", { keepLocalTime: true })
            .toJSDate(),
        } as ScheduleUpdateDto,
        {
          onSuccess: () => {
            setAlert({
              type: "success",
              message: "Horario actualizado",
              description: "El horario se ha actualizado correctamente",
            });
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 1500);
          },
          onError: (error: any) => {
            const errorMessage =
              error?.response?.data?.message ||
              (typeof error?.response?.data === 'string' ? error.response.data : null) ||
              (error?.message?.includes('status code') ? null : error?.message) ||
              "Ha ocurrido un error al actualizar el horario";
            setAlert({
              type: "error",
              message: "Error al actualizar el horario",
              description: errorMessage,
            });
          },
          onSettled: () => {
            onClose();
          },
        }
      );
    } else {
      createSchedule(
        {
          ...data,
          startTime: DateTime.fromJSDate(data.startTime as Date)
            .setZone("utc", { keepLocalTime: true })
            .toJSDate(),
          ScheduleBreaks: data.ScheduleBreaks.map(
            ({ publicId, ...rest }) => rest
          ),
          name: watch("name"),
        } as ScheduleCreateDto,
        {
          onSuccess: () => {
            setAlert({
              type: "success",
              message: "Horario creado",
              description: "El horario se ha creado correctamente",
            });
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 1500);
          },
          onError: (error: any) => {
            const errorMessage =
              error?.response?.data?.message ||
              (typeof error?.response?.data === 'string' ? error.response.data : null) ||
              (error?.message?.includes('status code') ? null : error?.message) ||
              "Ha ocurrido un error al crear el horario";
            setAlert({
              type: "error",
              message: "Error al crear el horario",
              description: errorMessage,
            });
          },
          onSettled: () => {
            onClose();
          },
        }
      );
    }
  };

  const handleAddBreak = () => {
    const newBreak: ScheduleBreakCreateDto | ScheduleBreakUpdateDto = {
      publicId: crypto.randomUUID(),
      description: "",
      type: BreakType.BREAK,
      startTime: new Date(new Date().setHours(0, 0, 0, 0)),
      endTime: new Date(new Date().setHours(0, 0, 0, 0)),
      deductible: false,
      day: 1,
    };
    const currentBreaks = breaks || [];
    setValue("ScheduleBreaks", validateBreaks([...currentBreaks, newBreak]), {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleAddLunchBreak = () => {
    const lunchBreak: ScheduleBreakCreateDto | ScheduleBreakUpdateDto = {
      publicId: crypto.randomUUID(),
      description: "Colación",
      type: BreakType.LUNCH,
      startTime: new Date(new Date().setHours(12, 0, 0, 0)), // Default to 12:00 PM
      endTime: new Date(new Date().setHours(13, 0, 0, 0)), // Default to 1:00 PM
      deductible: true, // Lunch is typically deductible
      day: 1,
    };
    const currentBreaks = breaks || [];
    setValue("ScheduleBreaks", validateBreaks([...currentBreaks, lunchBreak]), {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  let title = editingSchedule ? "Editar Horario" : "Agregar Horario";
  if (isPreview) {
    title = "Vista Previa";
  }

  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={onClose}
      width={1200}
      footer={null}
    >
      <form
        id="scheduleForm"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {alert && (
          <CustomAlert
            type={alert.type}
            message={alert.message}
            description={alert.description}
            onClose={() => setAlert(null)}
          />
        )}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <div className="h-10 px-3 py-2 border rounded-md bg-gray-50 flex items-center">
              {watch("name")}
            </div>
          </div>
          <SystemInput
            control={control}
            label="Código"
            attribute="code"
            placeholder="Ingrese el código del horario"
            errors={errors}
            disabled={isPreview}
            rules={{ required: "Por favor ingrese el código del horario" }}
          />
        </div>

        <div className="bg-gray-50 p-6 rounded-lg space-y-6">
          <h3 className="text-lg font-medium text-gray-900">
            Configuración del Horario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Controller
              name="startTime"
              control={control}
              rules={{ required: "Por favor ingrese la hora de inicio" }}
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Inicio
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      {...field}
                      onChange={(e) => {
                        const timeString = e.target.value;
                        const [hours, minutes] = timeString
                          .split(":")
                          .map(Number);
                        const date = new Date();
                        date.setHours(hours, minutes, 0, 0);
                        field.onChange(date);
                      }}
                      value={
                        field.value
                          ? new Date(field.value).toLocaleTimeString("en-US", {
                              hour12: false,
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""
                      }
                      disabled={isPreview}
                      className="w-full h-10 px-3 py-2 border rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>
                  {fieldState.error && (
                    <p className="text-sm text-red-500">
                      {fieldState.error.message}
                    </p>
                  )}
                  <div className="text-xs text-gray-500">
                    Hora de inicio del turno
                  </div>
                </div>
              )}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Cantidad de Horas
              </label>
              <Controller
                name="workHours"
                control={control}
                rules={{ required: "Por favor ingrese la cantidad de horas" }}
                render={({ field }) => (
                  <div className="space-y-1">
                    <InputNumber
                      {...field}
                      disabled={isPreview}
                      min={1}
                      className="w-full h-10 rounded-md shadow-sm border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all"
                    />
                    <div className="text-xs text-gray-500">
                      Horas laborales en el turno
                    </div>
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Cantidad de Minutos
              </label>
              <Controller
                name="workMinutes"
                control={control}
                rules={{ required: "Por favor ingrese la cantidad de minutos" }}
                render={({ field }) => (
                  <div className="space-y-1">
                    <InputNumber
                      {...field}
                      disabled={isPreview}
                      min={0}
                      max={59}
                      className="w-full h-10 rounded-md shadow-sm border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all"
                    />
                    <div className="text-xs text-gray-500">
                      Minutos adicionales a las horas laborales
                    </div>
                  </div>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Minutos de Colación a Descontar
              </label>
              <Controller
                name="discountMinutes"
                control={control}
                rules={{
                  required:
                    "Por favor ingrese los minutos de colación a descontar",
                }}
                render={({ field }) => (
                  <div className="space-y-1">
                    <InputNumber
                      {...field}
                      disabled={isPreview}
                      min={0}
                      className="w-full h-10 rounded-md shadow-sm border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all"
                    />
                    <div className="text-xs text-gray-500">
                      Tiempo de colación no contabilizado como trabajo
                    </div>
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Hora Término (Calculada)
              </label>
              <div className="h-10 px-4 border rounded-md bg-white shadow-sm text-center flex items-center justify-center font-medium text-gray-800">
                {calculatedEndTime?.toLocaleString(DateTime.TIME_SIMPLE)}
              </div>
              <div className="text-xs text-gray-500">
                Calculada automáticamente según los valores ingresados
              </div>
            </div>
          </div>
        </div>

        {totalDays > 1 && (
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <div className="text-sm text-gray-600 font-medium">
              Este horario incluye {totalDays} días
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(1 / totalDays) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              {Array.from({ length: totalDays }, (_, i) => {
                const dayStart = new Date(startTime);
                dayStart.setDate(dayStart.getDate() + i);

                let displayStartTime: string;
                let displayEndTime: string;

                if (i === 0) {
                  displayStartTime = dayStart.toLocaleTimeString();
                  displayEndTime = "23:59:59";
                } else if (i === totalDays - 1) {
                  displayStartTime = "00:00:00";
                  displayEndTime =
                    calculatedEndTime?.toLocaleString(DateTime.TIME_SIMPLE) ||
                    "";
                } else {
                  displayStartTime = "00:00:00";
                  displayEndTime = "23:59:59";
                }

                return (
                  <div key={i} className="flex flex-col items-center">
                    <span className="font-medium">Día {i + 1}</span>
                    <span>{displayStartTime}</span>
                    <span>a</span>
                    <span>{displayEndTime}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Pausas y Colaciones
            </h3>
            {!isPreview && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLunchBreak}
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  Agregar Colación
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleAddBreak}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Agregar Pausa
                </Button>
              </div>
            )}
          </div>

          <Table
            columns={breakColumns}
            dataSource={breaks}
            pagination={false}
            rowKey="id"
            rowClassName={(record) => (record.error ? "bg-red-100" : "")}
            className="bg-white rounded-lg shadow-sm"
          />
        </div>

        {!isPreview && (
          <div className="flex justify-end pt-4">
            <Button
              key="submit-button"
              type="submit"
              form="scheduleForm"
              disabled={isCreatingSchedule || isUpdatingSchedule}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingSchedule || isUpdatingSchedule ? (
                <div className="flex items-center gap-2">
                  <LoadingOutlined />
                  <span>
                    {editingSchedule ? "Actualizando..." : "Creando..."}
                  </span>
                </div>
              ) : editingSchedule ? (
                "ACTUALIZAR"
              ) : (
                "GUARDAR"
              )}
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}

export default function ScheduleModalUpsert({
  publicId,
  isOpen,
  onClose,
  onSuccess,
  isPreview,
  showCreateButton = true,
  showEditButton = true,
}: ScheduleModalUpsertProps) {
  const { data: schedule, isLoading } = useGetSchedule(publicId);

  if (isLoading) return <div>Cargando...</div>;
  return (
    <ScheduleModalUpsertContent
      isOpen={isOpen}
      onClose={onClose}
      editingSchedule={schedule}
      onSuccess={onSuccess}
      publicId={publicId}
      isPreview={isPreview}
      showCreateButton={showCreateButton}
      showEditButton={showEditButton}
    />
  );
}
