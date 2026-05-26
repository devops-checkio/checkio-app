"use client";

import {
  CHEKIOButton,
  CHEKIOLoading,
  CHEKIOModal,
} from "@/components";
import { useToast } from "@/hooks/use-toast";
import { useAutocomplete } from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ModalAutocompleteAssistanceProps {
  isOpen: boolean;
  onClose: () => void;
  assistanceIds: string[];
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLoadingText?: string;
  cleanSelectedRows?: () => void;
}

const ModalAutocompleteAssistance = ({
  isOpen,
  onClose,
  assistanceIds,
  title = "Autocompletar Marcaciones",
  message = "¿Está seguro de que desea autocompletar las marcaciones?",
  buttonText = "Autocompletar",
  buttonLoadingText = "Procesando...",
  cleanSelectedRows,
}: ModalAutocompleteAssistanceProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: autocomplete, isPending } = useAutocomplete();

  const handleAutocomplete = async () => {
    if (assistanceIds.length === 0) {
      toast({
        title: "Sin acciones disponibles",
        description: "No hay asistencias editables (no se puede operar sobre hoy o fechas futuras).",
        variant: "destructive",
      });
      onClose();
      return;
    }

    await Promise.all(
      assistanceIds.map((assistanceId) =>
        autocomplete(
          { assistanceId },
          {
            onSuccess: () => {},
            onError: (error: any) => {
              handleError(error, toast);
            },
          }
        )
      )
    );
    toast({
      title: "Marcaciones autocompletadas",
      description: "Las marcaciones han sido autocompletadas correctamente",
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
      queryKey: ["GetAllAssistancesPendingMarks"],
    });
    queryClient.invalidateQueries({
      queryKey: ["GetAssistanceCount"],
    });
    for (const id of assistanceIds) {
      void queryClient.invalidateQueries({ queryKey: ["GetAssistance", id] });
    }
    cleanSelectedRows?.();
    onClose();
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={isPending ? () => {} : onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-6 py-4">
        <p className="text-gray-700 flex items-center gap-3 text-lg">
          <AlertCircle className="h-5 w-5 text-blue-500" />
          {message}
        </p>
        <div className="flex justify-end gap-4">
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
            disabled={isPending || assistanceIds.length === 0}
            onClick={handleAutocomplete}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {buttonLoadingText}
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                {buttonText}
              </>
            )}
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
};

export default ModalAutocompleteAssistance;
