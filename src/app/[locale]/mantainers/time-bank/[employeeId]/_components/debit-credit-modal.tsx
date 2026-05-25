"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
} from "@/components";
import SystemInput from "@/components/ui/system-input";
import {
  useApproveTimeBankTransaction,
  useCreateTimeBankTransaction,
} from "@/service/mantainer.service";
import { TimeBankTransactionType } from "../../_components/time-bank.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Calculator,
  Clock,
  Info,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const debitCreditSchema = z.object({
  operationType: z.enum(["CREDIT", "DEBIT"], {
    required_error: "Debe seleccionar el tipo de operación",
  }),
  hours: z.coerce
    .number()
    .min(0.1, "Las horas deben ser mayor a 0")
    .max(1000, "Las horas no pueden exceder 1000"),
  description: z
    .string()
    .min(1, "Debe ingresar una descripción")
    .max(500, "La descripción no puede exceder 500 caracteres"),
  reference: z.string().optional(),
  effectiveDate: z.string().min(1, "Debe seleccionar una fecha efectiva"),
});

type DebitCreditFormData = z.infer<typeof debitCreditSchema>;

interface DebitCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreement: any;
  employee: any;
}

export default function DebitCreditModal({
  isOpen,
  onClose,
  agreement,
  employee,
}: DebitCreditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [operationType, setOperationType] = useState<"CREDIT" | "DEBIT">(
    "CREDIT",
  );

  const createTransactionMutation = useCreateTimeBankTransaction();
  const approveTransactionMutation = useApproveTimeBankTransaction();

  const isSubmitting =
    createTransactionMutation.isPending ||
    approveTransactionMutation.isPending;

  const {
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<DebitCreditFormData>({
    resolver: zodResolver(debitCreditSchema),
    defaultValues: {
      operationType: "CREDIT",
      hours: 0,
      description: "",
      reference: "",
      effectiveDate: new Date().toISOString().split("T")[0],
    },
  });

  const watchedHours = watch("hours");
  const watchedOperationType = watch("operationType");

  const handleOperationTypeChange = (type: "CREDIT" | "DEBIT") => {
    setOperationType(type);
    setValue("operationType", type);
  };

  const calculateNewBalance = (): number => {
    const current = Number(agreement?.availableHours) || 0;
    const hours = Number(watchedHours) || 0;
    return watchedOperationType === "CREDIT"
      ? current + hours
      : Math.max(0, current - hours);
  };

  const handleClose = () => {
    reset();
    setOperationType("CREDIT");
    onClose();
  };

  const onSubmit = async (data: DebitCreditFormData) => {
    try {
      const transactionType =
        data.operationType === "CREDIT"
          ? TimeBankTransactionType.ADD
          : TimeBankTransactionType.SUBTRACT;

      const transaction = await createTransactionMutation.mutateAsync({
        timeBankId: agreement.publicId,
        type: transactionType,
        amount: data.hours,
        integrationCode: [data.description, data.reference, data.effectiveDate]
          .filter(Boolean)
          .join(" | "),
      });

      if (transaction?.publicId) {
        await approveTransactionMutation.mutateAsync(transaction.publicId);
      }

      queryClient.invalidateQueries({ queryKey: ["GetTimeBanks"] });
      queryClient.invalidateQueries({ queryKey: ["GetTimeBankTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["GetTimeBankByEmployeeId"] });
      queryClient.invalidateQueries({ queryKey: ["GetTimeBankStats"] });

      toast({
        title:
          data.operationType === "CREDIT"
            ? "Horas acreditadas correctamente"
            : "Horas debitadas correctamente",
        variant: "default",
      });

      handleClose();
    } catch (error: any) {
      toast({
        title: "Error al procesar la operación",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "No se pudo completar la operación. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const employeeName =
    employee.name ||
    (employee.firstName
      ? `${employee.firstName} ${employee.lastName ?? ""}`.trim()
      : "el empleado");

  const totalHours =
    (agreement.availableHours ?? 0) + (agreement.usedHours ?? 0);

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Operación de Banco de Horas"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <p className="text-sm text-gray-600">
          Realiza operaciones de débito o crédito en el banco de horas de{" "}
          <strong>{employeeName}</strong>
        </p>

        {/* Saldo Actual */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Clock className="h-4 w-4 text-blue-600" />
            Saldo Actual
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {(agreement.availableHours ?? 0).toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Disponibles</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {(agreement.usedHours ?? 0).toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Utilizadas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {totalHours.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Totales</div>
            </div>
          </div>
        </div>

        {/* Tipo de Operación */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">
            Tipo de Operación
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Creditar */}
            <div
              className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                operationType === "CREDIT"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleOperationTypeChange("CREDIT")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    operationType === "CREDIT"
                      ? "border-green-500 bg-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {operationType === "CREDIT" && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-gray-900">
                      Creditar Horas
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    Agregar horas al banco del empleado
                  </p>
                </div>
              </div>
            </div>

            {/* Debitar */}
            <div
              className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                operationType === "DEBIT"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleOperationTypeChange("DEBIT")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    operationType === "DEBIT"
                      ? "border-orange-500 bg-orange-500"
                      : "border-gray-300"
                  }`}
                >
                  {operationType === "DEBIT" && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-gray-900">
                      Debitar Horas
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    Consumir horas del banco del empleado
                  </p>
                </div>
              </div>
            </div>
          </div>
          {errors.operationType && (
            <p className="text-sm text-red-600">
              {errors.operationType.message}
            </p>
          )}
        </div>

        {/* Detalles */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">
            Detalles de la Operación
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SystemInput
              attribute="hours"
              label="Cantidad de Horas"
              control={control}
              type="number"
              value={watch("hours")}
              onChange={(value) => setValue("hours", parseFloat(value) || 0)}
              errors={errors}
              tooltip="Ingrese la cantidad de horas a debitar o acreditar"
            />
            <SystemInput
              attribute="effectiveDate"
              label="Fecha Efectiva"
              control={control}
              type="date"
              value={watch("effectiveDate")}
              onChange={(value) => setValue("effectiveDate", value)}
              errors={errors}
              tooltip="Fecha en que se efectúa la operación"
            />
          </div>
          <SystemInput
            attribute="description"
            label="Descripción"
            control={control}
            value={watch("description")}
            onChange={(value) => setValue("description", value)}
            errors={errors}
            tooltip="Descripción detallada de la operación (obligatorio)"
          />
          <SystemInput
            attribute="reference"
            label="Referencia (Opcional)"
            control={control}
            value={watch("reference")}
            onChange={(value) => setValue("reference", value)}
            errors={errors}
            tooltip="Número de referencia, documento o código relacionado"
          />
        </div>

        {/* Vista previa */}
        {watchedHours > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Info className="h-4 w-4 text-blue-600" />
              Vista Previa
            </h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-600">Saldo Actual</div>
                <div className="text-xl font-bold text-blue-600">
                  {(agreement.availableHours ?? 0).toFixed(1)} hrs
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Nuevo Saldo</div>
                <div
                  className={`text-xl font-bold ${
                    watchedOperationType === "CREDIT"
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                >
                  {calculateNewBalance().toFixed(1)} hrs
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-600">
              <span className="font-medium">Operación:</span>{" "}
              {watchedOperationType === "CREDIT" ? "Crédito" : "Débito"} de{" "}
              {watchedHours} horas
              {" — "}
              <span className="font-medium">Diferencia:</span>{" "}
              {watchedOperationType === "CREDIT" ? "+" : "−"}
              {watchedHours} hrs
            </div>
          </div>
        )}

        {/* Advertencia saldo insuficiente */}
        {operationType === "DEBIT" &&
          watchedHours > (agreement.availableHours ?? 0) && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">Saldo insuficiente</p>
                  <p className="mt-1">
                    Está intentando debitar {watchedHours} horas pero solo hay{" "}
                    {(agreement.availableHours ?? 0).toFixed(1)} horas
                    disponibles. Esta operación resultará en saldo negativo.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Botones */}
        <div className="flex justify-end gap-3 border-t pt-4">
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
            disabled={isSubmitting || !watchedHours || watchedHours <= 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : operationType === "CREDIT" ? (
              <>
                <TrendingUp className="h-4 w-4" />
                Creditar Horas
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4" />
                Debitar Horas
              </>
            )}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}
