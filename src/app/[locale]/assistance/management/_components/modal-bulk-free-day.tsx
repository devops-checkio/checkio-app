"use client";

import {
  AlertConfirmModal,
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOProgressBar,
} from "@/components";
import { useToast } from "@/hooks/use-toast";
import { useSetFreeDayFromAssistance } from "@/service/mantainer.service";
import { AlertCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  FreeDayConfirmationPhrase,
  getAxiosErrorMessage,
  isFreeDayConfirmationValid,
} from "./free-day-confirmation";

export interface ModalBulkFreeDayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistancePublicIds: string[];
  onCompleted?: () => void;
}

export function ModalBulkFreeDay({
  open,
  onOpenChange,
  assistancePublicIds,
  onCompleted,
}: ModalBulkFreeDayProps) {
  const { toast } = useToast();
  const [confirmationPhrase, setConfirmationPhrase] = useState("");
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const { mutateAsync: setFreeDayFromAssistance } =
    useSetFreeDayFromAssistance();

  const resetLocalState = useCallback(() => {
    setConfirmationPhrase("");
    setProgressCurrent(0);
    setProgressTotal(0);
    setIsProcessing(false);
  }, []);

  useEffect(() => {
    if (!open) {
      resetLocalState();
    }
  }, [open, resetLocalState]);

  const uniqueIds = [...new Set(assistancePublicIds.filter(Boolean))];
  const count = uniqueIds.length;

  const handleConfirm = async () => {
    if (!isFreeDayConfirmationValid(confirmationPhrase)) {
      toast({
        title: "Frase de confirmación incorrecta",
        description: `Debe escribir exactamente "${FreeDayConfirmationPhrase.CONFIRM}"`,
        variant: "destructive",
      });
      return;
    }

    if (count === 0) {
      toast({
        title: "Sin registros seleccionados",
        description: "Seleccione al menos una asistencia.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgressTotal(count);
    setProgressCurrent(0);

    let success = 0;
    let failed = 0;
    let firstError = "";

    const trimmedPhrase = confirmationPhrase.trim();

    for (let i = 0; i < uniqueIds.length; i++) {
      const assistanceId = uniqueIds[i];
      try {
        await setFreeDayFromAssistance({
          assistanceId,
          confirmationPhrase: trimmedPhrase,
        });
        success++;
      } catch (err) {
        failed++;
        if (!firstError) {
          firstError = getAxiosErrorMessage(err);
        }
      }
      setProgressCurrent(i + 1);
    }

    setIsProcessing(false);

    if (failed === 0) {
      toast({
        title: "Día libre asignado",
        description: `Se procesaron ${success} registro(s): asistencia eliminada y día libre registrado.`,
      });
      onOpenChange(false);
      onCompleted?.();
    } else if (success === 0) {
      toast({
        title: "Error al asignar día libre",
        description: firstError || "No se pudo procesar ningún registro.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Proceso completado con errores",
        description: `Correctos: ${success}. Fallidos: ${failed}.${firstError ? ` Ejemplo: ${firstError}` : ""}`,
        variant: "destructive",
      });
      onOpenChange(false);
      onCompleted?.();
    }
  };

  return (
    <AlertConfirmModal
      open={open}
      onOpenChange={(next) => {
        if (!isProcessing) {
          onOpenChange(next);
        }
      }}
      title={`Dar día libre (${count} registro${count === 1 ? "" : "s"})`}
      variant="destructive"
      maxWidth="lg"
    >
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 mb-2">
                Acción destructiva - Consecuencias
              </p>
              <p className="text-sm text-red-700 mb-2">
                Al confirmar, para cada registro seleccionado se realizarán las
                siguientes acciones de forma irreversible:
              </p>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1 mb-2">
                <li>
                  Se eliminará permanentemente el registro de asistencia del
                  día
                </li>
                <li>
                  Se eliminarán todas las marcaciones asociadas (entrada,
                  salida, colaciones)
                </li>
                <li>Se registrará el día como día libre para el empleado</li>
              </ul>
              <p className="text-sm font-medium text-red-800">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        </div>

        {isProcessing && progressTotal > 0 && (
          <CHEKIOProgressBar
            current={progressCurrent}
            total={progressTotal}
            text="Procesando registros..."
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Para confirmar, escriba exactamente:{" "}
            <span className="font-mono font-semibold text-gray-900">
              {FreeDayConfirmationPhrase.CONFIRM}
            </span>
          </label>
          <CHEKIOInput
            type="text"
            value={confirmationPhrase}
            onChange={(e) => setConfirmationPhrase(e.target.value)}
            placeholder={FreeDayConfirmationPhrase.CONFIRM}
            className="w-full"
            disabled={isProcessing}
          />
        </div>

        <div className="flex justify-end gap-4 pt-2">
          <CHEKIOButton
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancelar
          </CHEKIOButton>
          <CHEKIOButton
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={
              isProcessing ||
              !isFreeDayConfirmationValid(confirmationPhrase) ||
              count === 0
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              "Confirmar y dar día libre"
            )}
          </CHEKIOButton>
        </div>
      </div>
    </AlertConfirmModal>
  );
}
