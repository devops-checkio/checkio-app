"use client";

import { CHEKIOButton, CHEKIOModal } from "@/components";
import { Loader2, Trash2, XCircle } from "lucide-react";

interface DeleteSubUnitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  subUnitName: string;
  onConfirm: () => void | Promise<void>;
  isDeleting: boolean;
  errorMessage?: string | null;
}

export function DeleteSubUnitConfirmModal({
  isOpen,
  onClose,
  subUnitName,
  onConfirm,
  isDeleting,
  errorMessage,
}: DeleteSubUnitConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar subunidad"
      size="md"
    >
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <XCircle className="h-8 w-8 text-red-600 mt-1 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-900">
              ¿Está seguro que desea eliminar la subunidad?
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {subUnitName}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Esta acción no se puede deshacer. Si la subunidad tiene hijos,
              la eliminación fallará.
            </p>
          </div>
        </div>
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {errorMessage}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </CHEKIOButton>
          <CHEKIOButton
            variant="primary"
            onClick={() => onConfirm()}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Eliminar
              </>
            )}
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
}
