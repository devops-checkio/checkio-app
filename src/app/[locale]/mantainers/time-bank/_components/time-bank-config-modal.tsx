"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SystemSelect from "@/components/ui/select";
import SystemInput from "@/components/ui/system-input";
import { useCookieSession } from "@/context/useCookieSession";
import { useGetEmployees as useGetEmployeesList } from "@/service/mantainer.service";
import { useCreateTimeBank } from "@/service/mantainer.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  CreateTimeBankDto,
  TimeBankType,
  TimeBankTypeOptions,
} from "./time-bank.dto";

const timeBankCreateSchema = z
  .object({
    employeeId: z.string().min(1, "Debe seleccionar un empleado"),
    timeBankType: z.nativeEnum(TimeBankType, {
      required_error: "Debe seleccionar un tipo de banco de horas",
    }),
    hoursPerDay: z.coerce.number().optional(),
    startDate: z.string().min(1, "Debe seleccionar una fecha de inicio"),
    endDate: z.string().min(1, "Debe seleccionar una fecha de término"),
    durationMonths: z.coerce
      .number()
      .min(1, "Mínimo 1 mes")
      .max(12, "Máximo 12 meses"),
    totalHours: z.coerce
      .number()
      .min(0, "Las horas totales deben ser mayor o igual a 0"),
  })
  .refine(
    (data) => {
      // Si es tipo REST_DAYS, hoursPerDay es requerido
      if (data.timeBankType === TimeBankType.REST_DAYS) {
        return data.hoursPerDay && data.hoursPerDay > 0;
      }
      return true;
    },
    {
      message: "Debe especificar cuántas horas equivalen a un día de descanso",
      path: ["hoursPerDay"],
    },
  );

type TimeBankCreateFormData = z.infer<typeof timeBankCreateSchema>;

interface TimeBankConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** When set, form is for this employee only; selector is hidden and employeeId is fixed */
  preselectedEmployeePublicId?: string;
  /** Display name for preselected employee (e.g. "Juan Pérez") */
  preselectedEmployeeName?: string;
}

export default function TimeBankConfigModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedEmployeePublicId,
  preselectedEmployeeName,
}: TimeBankConfigModalProps) {
  const { companyId } = useCookieSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: employees } = useGetEmployeesList({
    page: 1,
    pageSize: 1000,
    sort: "asc",
    companyId: companyId || "",
    status: "active",
  });

  const createTimeBank = useCreateTimeBank();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<TimeBankCreateFormData>({
    resolver: zodResolver(timeBankCreateSchema),
    defaultValues: {
      employeeId: "",
      timeBankType: TimeBankType.ECONOMIC_HOURS,
      hoursPerDay: 8,
      startDate: DateTime.now().toFormat("yyyy-MM-dd"),
      endDate: DateTime.now().plus({ months: 12 }).toFormat("yyyy-MM-dd"),
      durationMonths: 12,
      totalHours: 0,
    },
  });

  const durationMonths = watch("durationMonths");
  const startDate = watch("startDate");
  const timeBankType = watch("timeBankType");

  // When opened with preselected employee, set employeeId and reset form defaults
  useEffect(() => {
    if (isOpen && preselectedEmployeePublicId) {
      setValue("employeeId", preselectedEmployeePublicId);
    }
    if (isOpen && !preselectedEmployeePublicId) {
      setValue("employeeId", "");
    }
  }, [isOpen, preselectedEmployeePublicId, setValue]);

  // Update end date when duration changes
  const handleDurationChange = (value: string) => {
    const months = parseInt(value);
    setValue("durationMonths", months);
    if (startDate) {
      const newEndDate = DateTime.fromISO(startDate)
        .plus({ months })
        .toFormat("yyyy-MM-dd");
      setValue("endDate", newEndDate);
    }
  };

  // Update end date when start date changes
  const handleStartDateChange = (value: string) => {
    setValue("startDate", value);
    if (value && durationMonths) {
      const newEndDate = DateTime.fromISO(value)
        .plus({ months: durationMonths })
        .toFormat("yyyy-MM-dd");
      setValue("endDate", newEndDate);
    }
  };

  const onSubmit = async (data: TimeBankCreateFormData) => {
    setIsSubmitting(true);
    try {
      const timeBankData: CreateTimeBankDto = {
        employeeId: data.employeeId,
        type: data.timeBankType,
        hoursPerDay:
          data.timeBankType === TimeBankType.REST_DAYS
            ? data.hoursPerDay || 0
            : 0,
        startDate: data.startDate,
        endDate: data.endDate,
        availableHours: data.totalHours,
      };

      await createTimeBank.mutateAsync(timeBankData);
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      console.error("Error creating time bank:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Configurar Banco de Horas
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Configura un nuevo banco de horas para un empleado seleccionado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Employee Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">
              Selección de Empleado
            </h3>
            {preselectedEmployeePublicId ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-sm font-medium text-gray-700">
                  Banco de horas para:{" "}
                  <span className="text-gray-900">
                    {preselectedEmployeeName || preselectedEmployeePublicId}
                  </span>
                </p>
              </div>
            ) : (
              <SystemSelect
                attribute="employeeId"
                label="Empleado"
                control={control}
                value={watch("employeeId")}
                onChange={(value) => setValue("employeeId", value)}
                options={employees?.data.map((employee: any) => ({
                  value: employee.publicId,
                  label: `${employee.firstName} ${employee.lastName} - ${employee.documentNumber}`,
                }))}
                placeholder="Seleccionar empleado"
                errors={errors}
              />
            )}
          </div>

          {/* Time Bank Type Selection */}
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
                    <div className="flex-shrink-0">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          timeBankType === option.value
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {timeBankType === option.value && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {option.label}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.timeBankType && (
              <p className="text-sm text-red-600">
                {errors.timeBankType.message}
              </p>
            )}
          </div>

          {/* Hours Per Day (only for REST_DAYS) */}
          {timeBankType === TimeBankType.REST_DAYS && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">
                Configuración de Días de Descanso
              </h3>
              <SystemInput
                attribute="hoursPerDay"
                label="Horas por Día de Descanso"
                control={control}
                type="number"
                value={watch("hoursPerDay")}
                onChange={(value) =>
                  setValue("hoursPerDay", parseFloat(value) || 0)
                }
                errors={errors}
                tooltip="Especifique cuántas horas equivalen a un día de descanso"
              />
            </div>
          )}

          {/* Duration Configuration */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">
              Configuración de Duración
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SystemInput
                attribute="startDate"
                label="Fecha de Inicio"
                control={control}
                type="date"
                value={watch("startDate")}
                onChange={handleStartDateChange}
                errors={errors}
              />

              <SystemInput
                attribute="durationMonths"
                label="Duración (Meses)"
                control={control}
                type="number"
                value={watch("durationMonths")}
                onChange={handleDurationChange}
                errors={errors}
                tooltip="Máximo 12 meses"
              />

              <SystemInput
                attribute="endDate"
                label="Fecha de Término"
                control={control}
                type="date"
                value={watch("endDate")}
                disabled
                errors={errors}
                tooltip="Calculada automáticamente"
              />
            </div>
          </div>

          {/* Total Hours */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">
              Horas Iniciales
            </h3>
            <SystemInput
              attribute="totalHours"
              label="Horas Totales Iniciales"
              control={control}
              type="number"
              value={watch("totalHours")}
              onChange={(value) =>
                setValue("totalHours", parseFloat(value) || 0)
              }
              errors={errors}
              tooltip={
                timeBankType === TimeBankType.ECONOMIC_HOURS
                  ? "Horas extras acumuladas inicialmente"
                  : "Horas acumuladas para días de descanso"
              }
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? "Creando..." : "Crear Banco de Horas"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
