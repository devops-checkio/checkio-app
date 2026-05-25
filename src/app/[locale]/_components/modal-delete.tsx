"use client";

import { CHEKIOButton, CHEKIOModal } from "@/components";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useState } from "react";

interface ModalDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void> | void;
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLoadingText?: string;
  buttonColor?: string;
}

const ModalDelete = ({
  isOpen,
  onClose,
  onDelete,
  title = "Confirmar eliminación",
  message = "¿Está seguro de que desea eliminar este elemento?",
  buttonText = "Eliminar",
  buttonLoadingText = "Eliminando...",
  buttonColor = "red",
}: ModalDeleteProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onDelete();
      // Solo cerrar el modal si la operación fue exitosa
      onClose();
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      // Mostrar el error en el modal
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Error al eliminar el elemento. Por favor, inténtelo de nuevo."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setError(null);
      onClose();
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={isDeleting ? () => {} : handleClose}
      title={title}
      size="xl"
    >
      <div className="space-y-6 py-4">
        <p className="text-gray-700 flex items-center gap-3 text-lg">
          <AlertCircle className="text-red-500 h-5 w-5 animate-bounce" />
          {message}
        </p>

        {/* Mostrar mensaje de error si existe */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500 h-4 w-4" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <CHEKIOButton
            variant="secondary"
            onClick={handleClose}
            disabled={isDeleting}
          >
            <X className="h-4 w-4" />
            Cancelar
          </CHEKIOButton>
          <CHEKIOButton
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? (
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

export default ModalDelete;
