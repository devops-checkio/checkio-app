"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
} from "@/components";
import { CheckioInputDate } from "@/components/ui/checkio-input-date";
import SystemInput from "@/components/ui/system-input";
import { useToast } from "@/hooks/use-toast";
import { useUpdateTimeBank } from "@/service/mantainer.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  TimeBankResponseDto,
  TimeBankType,
  TimeBankTypeOptions,
  UpdateTimeBankDto,
} from "./time-bank.dto";
import { handleError } from "@/utils/error";
import { Loader2 } from "lucide-react";

const timeBankUpdateSchema = z.object({
  timeBankType: z.nativeEnum(TimeBankType, {
    required_error: "Debe seleccionar un tipo de banco de horas",
  }),
  hoursPerDay: z.coerce.number().min(0, "Las horas deben ser mayor o igual a 0"),
  startDate: z.string().min(1, "Debe seleccionar una fecha de inicio"),
  endDate: z.string().min(1, "Debe seleccionar una fecha de término"),
  availableHours: z.coerce
    .number()
    .min(0, "Las horas disponibles deben ser mayor o igual a 0"),
  usedHours: z.coerce
    .number()
    .min(0, "Las horas utilizadas deben ser mayor o igual a 0"),
});

type TimeBankUpdateFormData = z.infer<typeof timeBankUpdateSchema>;

interface TimeBankUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  timeBank: TimeBankResponseDto | null;
}

export default function TimeBankUpdateModal({
  isOpen,
  onClose,
  onSuccess,
  timeBank,
}: TimeBankUpdateModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateTimeBank = useUpdateTimeBank();

  const {
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<TimeBankUpdateFormData>({
    resolver: zodResolver(timeBankUpdateSchema),
    defaultValues: {
      timeBankType: TimeBankType.ECONOMIC_HOURS,
      hoursPerDay: 8,
      startDate: "",
      endDate: "",
      availableHours: 0,
      usedHours: 0,
    },
  });

  const timeBankType = watch("timeBankType");

  useEffect(() => {
    if (isOpen && timeBank) {
      reset({
        timeBankType: timeBank.type as TimeBankType,
        hoursPerDay: timeBank.hoursPerDay,
        startDate: timeBank.startDate,
        endDate: timeBank.endDate,
        availableHours: timeBank.availableHours,
        usedHours: timeBank.usedHours,
      });
    }
  }, [isOpen, timeBank, reset]);

  const onSubmit = async (data: TimeBankUpdateFormData) => {
    if (!timeBank?.publicId) return;

    setIsSubmitting(true);
    try {
      const updateData: UpdateTimeBankDto = {
        type: data.timeBankType as TimeBankType,
        hoursPerDay:
          data.timeBankType === TimeBankType.REST_DAYS ? data.hoursPerDay : 0,
        startDate: data.startDate,
        endDate: data.endDate,
        availableHours: data.availableHours,
        usedHours: data.usedHours,
      };

      await updateTimeBank.mutateAsync({
        publicId: timeBank.publicId,
        data: updateData,
      });

      toast({
        title: "Banco de horas actualizado",
        variant: "default",
      });
      onSuccess();
      onClose();
      reset();
    } catch (error: unknown) {
      handleError(error, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  if (!timeBank) return null;

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Banco de Horas"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-sm font-medium text-gray-700">
            Empleado:{" "}
            <span className="text-gray-900">
              {timeBank.employeeName || timeBank.employeeEmail || timeBank.publicId}
            </span>
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">
            Tipo de Banco de Horas
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {TimeBankTypeOptions.map((option) => (
              <div
                key={option.value}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  timeBankType === option.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setValue("timeBankType", option.value)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {option.label}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {timeBankType === TimeBankType.REST_DAYS && (
          <SystemInput
            control={control}
            label="Horas por Día"
            attribute="hoursPerDay"
            type="number"
            errors={errors}
            rules={{
              required: "Requerido para días de descanso",
              min: { value: 0.5, message: "Mínimo 0.5 horas" },
            }}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CheckioInputDate
            value={watch("startDate")}
            onChange={(value) => setValue("startDate", value || "")}
            label="Fecha de Inicio"
            required
            error={errors.startDate?.message}
          />
          <CheckioInputDate
            value={watch("endDate")}
            onChange={(value) => setValue("endDate", value || "")}
            label="Fecha de Fin"
            required
            error={errors.endDate?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SystemInput
            control={control}
            label="Horas Disponibles"
            attribute="availableHours"
            type="number"
            errors={errors}
            rules={{ min: { value: 0, message: "Mínimo 0" } }}
          />
          <SystemInput
            control={control}
            label="Horas Utilizadas"
            attribute="usedHours"
            type="number"
            errors={errors}
            rules={{ min: { value: 0, message: "Mínimo 0" } }}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <CHEKIOButton
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </CHEKIOButton>
          <CHEKIOButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}
