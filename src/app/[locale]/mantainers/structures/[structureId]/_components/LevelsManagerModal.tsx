"use client";

import {
  CHEKIOActionButton,
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOModal,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateOrganizationalUnit,
  useUpdateOrganizationalUnitName,
} from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import { Edit, Loader2, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import type { OrganizationalUnitDto } from "./organizationalUnit.dto";

const MAX_LEVELS = 8;

interface LevelsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  structureId: string;
  levels: OrganizationalUnitDto[];
}

export function LevelsManagerModal({
  isOpen,
  onClose,
  structureId,
  levels,
}: LevelsManagerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPublicId, setEditingPublicId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [addLevelName, setAddLevelName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: updateName, isPending: isUpdatingName } =
    useUpdateOrganizationalUnitName();
  const { mutate: createLevel, isPending: isCreatingLevel } =
    useCreateOrganizationalUnit();

  const sortedLevels = [...(levels ?? [])].sort((a, b) => a.level - b.level);
  const canAddLevel = levels && levels.length < MAX_LEVELS;

  const handleStartEdit = useCallback((ou: OrganizationalUnitDto) => {
    setEditingPublicId(ou.publicId);
    setEditingName(ou.name);
    setError(null);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingPublicId || !editingName.trim()) {
      setError("El nombre no puede estar vacío");
      return;
    }
    setError(null);
    updateName(
      {
        publicId: editingPublicId,
        structureId,
        name: editingName.trim(),
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["GetOrganizationalUnits", structureId],
          });
          setEditingPublicId(null);
          setEditingName("");
          toast({
            title: "Éxito",
            description: "Nombre de nivel actualizado correctamente",
          });
        },
        onError: (err: unknown) => {
          setError(err instanceof Error ? err.message : "Error al actualizar");
        },
      },
    );
  }, [
    editingPublicId,
    editingName,
    structureId,
    updateName,
    queryClient,
    toast,
  ]);

  const handleCancelEdit = useCallback(() => {
    setEditingPublicId(null);
    setEditingName("");
    setError(null);
  }, []);

  const handleAddLevel = useCallback(() => {
    if (!addLevelName.trim()) {
      setError("El nombre del nivel es requerido");
      return;
    }
    setError(null);
    const nextLevel = (levels?.length ?? 0) + 1;
    createLevel(
      {
        name: addLevelName.trim(),
        level: nextLevel,
        structureId,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["GetOrganizationalUnits", structureId],
          });
          setAddLevelName("");
          setShowAddForm(false);
          toast({
            title: "Éxito",
            description: "Nivel creado correctamente",
          });
        },
        onError: (err: unknown) => {
          setError(err instanceof Error ? err.message : "Error al crear nivel");
        },
      },
    );
  }, [
    addLevelName,
    levels?.length,
    structureId,
    createLevel,
    queryClient,
    toast,
  ]);

  const handleClose = useCallback(() => {
    setEditingPublicId(null);
    setEditingName("");
    setAddLevelName("");
    setShowAddForm(false);
    setError(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Configurar nombres de niveles"
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {error}
          </div>
        )}

        <CHEKIOTable>
          <CHEKIOTableHeader>
            <tr>
              <CHEKIOTableHead>Nivel</CHEKIOTableHead>
              <CHEKIOTableHead>Nombre</CHEKIOTableHead>
              <CHEKIOTableHead className="w-24">Acciones</CHEKIOTableHead>
            </tr>
          </CHEKIOTableHeader>
          <CHEKIOTableBody>
            {sortedLevels.map((ou, index) => (
              <CHEKIOTableRow key={ou.publicId} index={index}>
                <CHEKIOTableCell>{ou.level}</CHEKIOTableCell>
                <CHEKIOTableCell>
                  {editingPublicId === ou.publicId ? (
                    <div className="flex items-center gap-2">
                      <CHEKIOInput
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                      />
                      <CHEKIOButton
                        variant="primary"
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={isUpdatingName}
                      >
                        {isUpdatingName ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Guardar"
                        )}
                      </CHEKIOButton>
                      <CHEKIOButton
                        variant="secondaryBlue"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isUpdatingName}
                      >
                        Cancelar
                      </CHEKIOButton>
                    </div>
                  ) : (
                    <span className="font-medium text-gray-900">{ou.name}</span>
                  )}
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  {editingPublicId === ou.publicId ? null : (
                    <CHEKIOActionButton
                      variant="edit"
                      size="sm"
                      onClick={() => handleStartEdit(ou)}
                      disabled={!!editingPublicId}
                    >
                      <Edit className="h-4 w-4" />
                    </CHEKIOActionButton>
                  )}
                </CHEKIOTableCell>
              </CHEKIOTableRow>
            ))}
          </CHEKIOTableBody>
        </CHEKIOTable>

        {showAddForm ? (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <CHEKIOInput
              value={addLevelName}
              onChange={(e) => setAddLevelName(e.target.value)}
              placeholder="Nombre del nuevo nivel"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddLevel();
                if (e.key === "Escape") {
                  setShowAddForm(false);
                  setAddLevelName("");
                }
              }}
            />
            <CHEKIOButton
              variant="primary"
              onClick={handleAddLevel}
              disabled={isCreatingLevel || !addLevelName.trim()}
            >
              {isCreatingLevel ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Crear"
              )}
            </CHEKIOButton>
            <CHEKIOButton
              variant="secondaryBlue"
              onClick={() => {
                setShowAddForm(false);
                setAddLevelName("");
              }}
              disabled={isCreatingLevel}
            >
              Cancelar
            </CHEKIOButton>
          </div>
        ) : (
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={() => setShowAddForm(true)}
            disabled={!canAddLevel}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar nivel
          </CHEKIOButton>
        )}

        {levels && levels.length >= MAX_LEVELS && (
          <p className="text-sm text-gray-500">
            Máximo {MAX_LEVELS} niveles permitidos.
          </p>
        )}
      </div>
    </CHEKIOModal>
  );
}
