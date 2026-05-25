"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { Badge } from "@/components/ui/badge";
import { AggregationType, TotalRowModalPropsDto } from "../dto/modal-props.dto";
import { TotalRowType } from "../report.dto";

export default function TotalRowModal({
  isOpen,
  onClose,
  onCreate,
  editingTotalRow,
  label,
  type,
  position,
  showLabel,
  headerTransform,
  selectedFieldsForTotal,
  availableFields,
  onLabelChange,
  onTypeChange,
  onPositionChange,
  onShowLabelChange,
  onHeaderTransformChange,
  onToggleFieldForTotal,
}: TotalRowModalPropsDto) {
  const handleCreate = () => {
    const columns: Array<{
      fieldId: string;
      aggregationType: AggregationType;
      format?: string;
    }> = [];

    if (type === TotalRowType.CUSTOM) {
      selectedFieldsForTotal.forEach((aggType, fieldId) => {
        if (aggType !== "none" && aggType !== "NONE") {
          const field = availableFields.find((f) => f.id === fieldId);
          columns.push({
            fieldId,
            aggregationType: aggType,
            format: field?.format,
          });
        }
      });
    } else {
      const numericFields = availableFields.filter(
        (field) =>
          field.type === "number" &&
          (field.aggregationType !== "none" || field.isCalculated) &&
          !field.isConsolidated
      );

      numericFields.forEach((field) => {
        const aggType =
          type === TotalRowType.SUM
            ? "SUM"
            : type === TotalRowType.AVG
            ? "AVG"
            : type === TotalRowType.COUNT
            ? "COUNT"
            : type === TotalRowType.MIN
            ? "MIN"
            : type === TotalRowType.MAX
            ? "MAX"
            : "SUM";
        columns.push({
          fieldId: field.id,
          aggregationType: aggType,
          format: field.format,
        });
      });
    }

    onCreate({
      label,
      type,
      position,
      showLabel,
      headerTransform,
      columns,
    });
  };


  const getAggregationLabel = (
    aggregationType: string | undefined
  ): string => {
    const normalized = aggregationType?.toLowerCase() || "";
    if (normalized === "sum") return "Suma";
    if (normalized === "avg") return "Promedio";
    if (normalized === "count") return "Conteo";
    if (normalized === "min") return "Mínimo";
    if (normalized === "max") return "Máximo";
    return "Ninguno";
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingTotalRow ? "Editar Fila de Totales" : "Crear Fila de Totales"
      }
      size="5xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Fila de Totales *
            </label>
            <CHEKIOInput
              type="text"
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder="Ej: Total de Horas Extras"
              className="rounded-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Este será el nombre que aparecerá en la primera columna (si está
              habilitado)
            </p>
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato del Encabezado
            </label>
            <div className="flex items-center gap-2 h-10">
              <button
                type="button"
                onClick={() => onHeaderTransformChange("DEFAULT")}
                className={`px-3 py-1.5 border rounded transition-all text-xs h-full ${
                  headerTransform === "DEFAULT"
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-300 hover:border-gray-400 bg-white text-gray-600"
                }`}
              >
                Por Defecto
              </button>
              <button
                type="button"
                onClick={() => onHeaderTransformChange("UPPER")}
                className={`px-3 py-1.5 border rounded transition-all text-xs h-full ${
                  headerTransform === "UPPER"
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-300 hover:border-gray-400 bg-white text-gray-600"
                }`}
              >
                MAYÚSCULAS
              </button>
              <button
                type="button"
                onClick={() => onHeaderTransformChange("LOWER")}
                className={`px-3 py-1.5 border rounded transition-all text-xs h-full ${
                  headerTransform === "LOWER"
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-300 hover:border-gray-400 bg-white text-gray-600"
                }`}
              >
                minúsculas
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Formato de visualización del encabezado
            </p>
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Total *
            </label>
            <CHEKIOSelect
              value={type}
              onValueChange={(value) => onTypeChange(value as TotalRowType)}
            >
              <CHEKIOSelectTrigger className="rounded-none">
                <CHEKIOSelectValue />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                <CHEKIOSelectItem value={TotalRowType.SUM}>
                  Suma (SUM)
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={TotalRowType.AVG}>
                  Promedio (AVG)
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={TotalRowType.COUNT}>
                  Conteo (COUNT)
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={TotalRowType.MIN}>
                  Mínimo (MIN)
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={TotalRowType.MAX}>
                  Máximo (MAX)
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={TotalRowType.CUSTOM}>
                  Personalizado (Seleccionar por columna)
                </CHEKIOSelectItem>
              </CHEKIOSelectContent>
            </CHEKIOSelect>
            <p className="text-xs text-gray-500 mt-1">
              {type === TotalRowType.CUSTOM
                ? "Seleccione el tipo de agregación para cada columna numérica"
                : "Se aplicará a todos los campos numéricos con agregación"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Posición de la Fila *
            </label>
            <CHEKIOSelect
              value={position}
              onValueChange={(value) =>
                onPositionChange(value as "top" | "bottom")
              }
            >
              <CHEKIOSelectTrigger className="rounded-none">
                <CHEKIOSelectValue />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                <CHEKIOSelectItem value="top">
                  Arriba (Después de encabezados)
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value="bottom">
                  Abajo (Al final del reporte)
                </CHEKIOSelectItem>
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          </div>

          <div className="flex items-center gap-2 pt-8">
            <input
              type="checkbox"
              id="showLabel"
              checked={showLabel}
              onChange={(e) => onShowLabelChange(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label
              htmlFor="showLabel"
              className="text-sm font-medium text-gray-700"
            >
              Mostrar etiqueta en la primera columna
            </label>
          </div>
        </div>

        {type === TotalRowType.CUSTOM ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Campos y Tipo de Agregación *
            </label>
            <div className="border border-gray-200 rounded p-4 max-h-64 overflow-y-auto bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableFields
                  .filter(
                    (field) =>
                      field.type === "number" &&
                      (field.aggregationType !== "none" || field.isCalculated)
                  )
                  .map((field) => {
                    const currentAggType =
                      selectedFieldsForTotal.get(field.id) || "none";
                    const isSelected =
                      currentAggType !== "none" && currentAggType !== "NONE";
                    return (
                      <div
                        key={field.id}
                        className={`relative flex flex-col p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "bg-blue-50 border-blue-500 shadow-sm"
                            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <span
                              className={`text-sm font-medium ${
                                isSelected ? "text-blue-900" : "text-gray-700"
                              }`}
                            >
                              {field.displayName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              isSelected
                                ? "bg-blue-100 border-blue-300 text-blue-700"
                                : "bg-gray-100 border-gray-300 text-gray-600"
                            }`}
                          >
                            {(() => {
                              const typeMap: Record<string, string> = {
                                string: "Texto",
                                number: "Número",
                                date: "Fecha",
                                datetime: "Fecha y Hora",
                                time: "Hora",
                                boolean: "Sí/No",
                              };
                              return typeMap[field.type] || field.type;
                            })()}
                          </Badge>
                          <CHEKIOSelect
                            value={currentAggType}
                            onValueChange={(value) =>
                              onToggleFieldForTotal(
                                field.id,
                                value as AggregationType
                              )
                            }
                          >
                            <CHEKIOSelectTrigger className="w-32 rounded-none text-xs h-8">
                              <CHEKIOSelectValue />
                            </CHEKIOSelectTrigger>
                            <CHEKIOSelectContent>
                              <CHEKIOSelectItem value="none">
                                Ninguno
                              </CHEKIOSelectItem>
                              <CHEKIOSelectItem value="sum">Suma</CHEKIOSelectItem>
                              <CHEKIOSelectItem value="avg">
                                Promedio
                              </CHEKIOSelectItem>
                              <CHEKIOSelectItem value="count">
                                Conteo
                              </CHEKIOSelectItem>
                              <CHEKIOSelectItem value="min">Mínimo</CHEKIOSelectItem>
                              <CHEKIOSelectItem value="max">Máximo</CHEKIOSelectItem>
                            </CHEKIOSelectContent>
                          </CHEKIOSelect>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            {availableFields.filter(
              (field) =>
                field.type === "number" && field.aggregationType !== "none"
            ).length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No hay campos numéricos con agregación disponibles. Agregue
                campos numéricos primero.
              </p>
            )}
          </div>
        ) : null}

        <div className="flex justify-end gap-4 pt-4 border-t">
          <CHEKIOButton
            variant="secondary"
            onClick={onClose}
            className="rounded-none"
          >
            Cancelar
          </CHEKIOButton>
          <CHEKIOButton
            variant="primary"
            onClick={handleCreate}
            className="rounded-none"
          >
            {editingTotalRow ? "Actualizar" : "Crear"} Fila de Totales
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
}
