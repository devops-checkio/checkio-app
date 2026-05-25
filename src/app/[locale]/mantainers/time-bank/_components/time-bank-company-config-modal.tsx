"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import {
  TimeBankConfigDto,
  TimeBankConfigUpdateDto,
  useUpsertTimeBankConfig,
} from "@/service/mantainer.service";
import { Loader2, Settings } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentConfig?: TimeBankConfigDto;
  onSuccess: () => void;
}

function TimeBankCompanyConfigModal({
  isOpen,
  onClose,
  currentConfig,
  onSuccess,
}: Props) {
  const { companyId } = useCookieSession();
  const upsertConfig = useUpsertTimeBankConfig();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TimeBankConfigUpdateDto>({
    defaultValues: {
      hoursPerDay: currentConfig?.hoursPerDay ?? 8,
      maxDurationMonths: currentConfig?.maxDurationMonths ?? 12,
      allowNegativeBalance: currentConfig?.allowNegativeBalance ?? false,
      autoExpireEnabled: currentConfig?.autoExpireEnabled ?? false,
      autoExpireDays: currentConfig?.autoExpireDays ?? 30,
      requiresApprovalForConsumption:
        currentConfig?.requiresApprovalForConsumption ?? true,
    },
  });

  const autoExpireEnabled = watch("autoExpireEnabled");

  useEffect(() => {
    if (currentConfig) {
      reset({
        hoursPerDay: currentConfig.hoursPerDay,
        maxDurationMonths: currentConfig.maxDurationMonths,
        allowNegativeBalance: currentConfig.allowNegativeBalance,
        autoExpireEnabled: currentConfig.autoExpireEnabled,
        autoExpireDays: currentConfig.autoExpireDays,
        requiresApprovalForConsumption:
          currentConfig.requiresApprovalForConsumption,
      });
    }
  }, [currentConfig, reset]);

  const onSubmit = async (data: TimeBankConfigUpdateDto) => {
    if (!companyId) return;

    try {
      await upsertConfig.mutateAsync({ companyId, data });
      toast({
        title: "Configuración guardada",
        description: "La configuración del banco de horas fue actualizada.",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description:
          error?.response?.data?.message ||
          "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración del Banco de Horas"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Header icon */}
        <div className="flex items-center justify-center">
          <div className="p-3 bg-blue-50 rounded-full">
            <Settings className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* hoursPerDay */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Horas por día <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.5"
            min="1"
            max="24"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("hoursPerDay", {
              required: "Campo requerido",
              min: { value: 1, message: "Mínimo 1 hora" },
              max: { value: 24, message: "Máximo 24 horas" },
              valueAsNumber: true,
            })}
          />
          {errors.hoursPerDay && (
            <p className="text-xs text-red-600">
              {errors.hoursPerDay.message}
            </p>
          )}
        </div>

        {/* maxDurationMonths */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Duración máxima (meses) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            max="60"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("maxDurationMonths", {
              required: "Campo requerido",
              min: { value: 1, message: "Mínimo 1 mes" },
              max: { value: 60, message: "Máximo 60 meses" },
              valueAsNumber: true,
            })}
          />
          {errors.maxDurationMonths && (
            <p className="text-xs text-red-600">
              {errors.maxDurationMonths.message}
            </p>
          )}
        </div>

        {/* Toggle checkboxes */}
        <div className="space-y-3 bg-gray-50 rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register("allowNegativeBalance")}
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                Permitir saldo negativo
              </span>
              <p className="text-xs text-gray-500">
                Permite consumir más horas de las disponibles
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register("autoExpireEnabled")}
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                Activar expiración automática
              </span>
              <p className="text-xs text-gray-500">
                Las horas no utilizadas expiran automáticamente
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register("requiresApprovalForConsumption")}
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                Requerir aprobación para consumo
              </span>
              <p className="text-xs text-gray-500">
                Los días de descanso con cargo al banco requieren aprobación
              </p>
            </div>
          </label>
        </div>

        {/* autoExpireDays (only when autoExpireEnabled) */}
        {autoExpireEnabled && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Días para expirar <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="365"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("autoExpireDays", {
                required: autoExpireEnabled ? "Campo requerido" : false,
                min: { value: 1, message: "Mínimo 1 día" },
                max: { value: 365, message: "Máximo 365 días" },
                valueAsNumber: true,
              })}
            />
            {errors.autoExpireDays && (
              <p className="text-xs text-red-600">
                {errors.autoExpireDays.message}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <CHEKIOButton
            type="button"
            variant="secondaryBlue"
            onClick={onClose}
            disabled={upsertConfig.isPending}
          >
            Cancelar
          </CHEKIOButton>
          <CHEKIOButton
            type="submit"
            variant="primary"
            disabled={upsertConfig.isPending}
          >
            {upsertConfig.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Configuración"
            )}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}

export default TimeBankCompanyConfigModal;
