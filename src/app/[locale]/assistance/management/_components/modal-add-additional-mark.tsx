"use client";

import { CHEKIOButton, CHEKIOModal } from "@/components";
import { useToast } from "@/hooks/use-toast";
import { useCreateAdditionalMark } from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Calendar, FileText, Loader2, X } from "lucide-react";
import { DateTime } from "luxon";
import { Controller, useForm } from "react-hook-form";
import {
  getTodayUtcStart,
  isAssistanceDayEditable,
} from "../_utils/assistance-date-lock";
import {
  AssistanceResponseDto,
  CreateAdditionalMarkDto,
} from "../../_components/assistance.dto";

interface FormValues {
  type: "CHECK_IN" | "CHECK_OUT";
  date: string;
  time: string;
  adjustmentNote?: string;
}

interface ModalAddAdditionalMarkProps {
  isOpen: boolean;
  onClose: () => void;
  assistance: AssistanceResponseDto;
  onSuccess?: () => void;
}

const ModalAddAdditionalMark = ({
  isOpen,
  onClose,
  assistance,
  onSuccess,
}: ModalAddAdditionalMarkProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useCreateAdditionalMark();

  // Calcular fecha de la asistencia
  const assistanceDate = DateTime.fromObject({
    year: assistance.year,
    month: assistance.month,
    day: assistance.day,
  }).toUTC();

  const isEditableByDate = isAssistanceDayEditable({
    year: assistance.year,
    month: assistance.month,
    day: assistance.day,
  });

  // Capar cualquier acción para que nunca se pueda seleccionar "hoy" en el date-picker.
  // (Regla de negocio: solo días anteriores a "hoy".)
  const todayUtcStart = getTodayUtcStart();
  const yesterdayUtcStart = todayUtcStart.minus({ days: 1 });

  // Calcular fecha máxima (día siguiente si el horario termina al día siguiente)
  let maxDate = assistanceDate;
  if (assistance.Schedule?.endDate) {
    const endDate = DateTime.fromISO(assistance.Schedule.endDate).toUTC();
    const endDateOnly = endDate.startOf("day");
    const assistanceDateOnly = assistanceDate.startOf("day");

    // Si el horario termina en el día siguiente, permitir hasta ese día
    if (endDateOnly > assistanceDateOnly) {
      maxDate = endDateOnly;
    }
  }

  // Forzar límite UI a "ayer" como máximo.
  if (maxDate.startOf("day") > yesterdayUtcStart) {
    maxDate = yesterdayUtcStart;
  }

  const minDateFormatted = assistanceDate.toFormat("yyyy-MM-dd");
  const maxDateFormatted = maxDate.toFormat("yyyy-MM-dd");
  const defaultDateFormatted = assistanceDate.toFormat("yyyy-MM-dd");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      type: "CHECK_IN",
      date: defaultDateFormatted,
      time: "00:00",
      adjustmentNote: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (!isEditableByDate) {
        toast({
          title: "Acción no permitida",
          description: "Solo puedes crear marcaciones de días anteriores a hoy.",
          variant: "destructive",
        });
        return;
      }

      const selectedDate = DateTime.fromISO(data.date, { zone: "UTC" }).startOf(
        "day"
      );
      const selectedDateTime = DateTime.fromISO(`${data.date}T${data.time}`, {
        zone: "UTC",
      });

      if (!selectedDateTime.isValid) {
        toast({
          title: "Error",
          description: "La fecha y hora ingresadas no son válidas",
          variant: "destructive",
        });
        return;
      }

      // Validar que la fecha está en el rango permitido
      const minDate = assistanceDate.startOf("day");
      const maxDateOnly = maxDate.startOf("day");

      if (selectedDate < minDate || selectedDate > maxDateOnly) {
        toast({
          title: "Error",
          description: `La fecha debe estar entre ${minDate.toFormat(
            "dd/MM/yyyy"
          )} y ${maxDateOnly.toFormat("dd/MM/yyyy")}`,
          variant: "destructive",
        });
        return;
      }

      const payload: CreateAdditionalMarkDto = {
        type: data.type,
        time: selectedDateTime.toISO()!,
        adjustmentNote: data.adjustmentNote || undefined,
        scheduleId: assistance.Schedule?.publicId,
      };

      await mutateAsync({
        mark: payload,
        assistanceId: assistance.publicId,
      });

      toast({
        title: "Marca adicional creada",
        description: "La marca adicional ha sido creada correctamente",
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
      queryClient.invalidateQueries({
        queryKey: ["GetAssistance", assistance.publicId],
      });

      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating additional mark:", error);
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={isPending ? () => {} : onClose}
      title="Agregar Marca Adicional"
      size="md"
    >
      <div className="space-y-6 py-4">
        <p className="text-gray-700 flex items-center gap-3 text-lg">
          <AlertCircle className="h-5 w-5 text-blue-500" />
          Complete los datos para crear una marca adicional
        </p>

        {!isEditableByDate && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            No puedes crear marcaciones para hoy o fechas futuras. Selecciona un día anterior.
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Marca *
              </label>
              <Controller
                name="type"
                control={control}
                rules={{ required: "El tipo de marca es requerido" }}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={!isEditableByDate || isPending}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CHECK_IN">Entrada</option>
                    <option value="CHECK_OUT">Salida</option>
                  </select>
                )}
              />
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <Controller
                  name="date"
                  control={control}
                  rules={{
                    required: "La fecha es requerida",
                    validate: (value) => {
                      const selectedDate = DateTime.fromISO(value, {
                        zone: "UTC",
                      }).startOf("day");
                      const minDate = assistanceDate.startOf("day");
                      const maxDateOnly = maxDate.startOf("day");

                      if (
                        selectedDate < minDate ||
                        selectedDate > maxDateOnly
                      ) {
                        return `La fecha debe estar entre ${minDate.toFormat(
                          "dd/MM/yyyy"
                        )} y ${maxDateOnly.toFormat("dd/MM/yyyy")}`;
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="date"
                      min={minDateFormatted}
                      max={maxDateFormatted}
                      disabled={!isEditableByDate || isPending}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.date.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora *
                </label>
                <Controller
                  name="time"
                  control={control}
                  rules={{ required: "La hora es requerida" }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="time"
                      step="1"
                      disabled={!isEditableByDate || isPending}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                />
                {errors.time && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.time.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Nota de Ajuste (Opcional)
              </label>
              <Controller
                name="adjustmentNote"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Ingrese una nota sobre la marca adicional (opcional)"
                  />
                )}
              />
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
                  Creando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Crear Marca
                </>
              )}
            </CHEKIOButton>
          </div>
        </form>
      </div>
    </CHEKIOModal>
  );
};

export default ModalAddAdditionalMark;
