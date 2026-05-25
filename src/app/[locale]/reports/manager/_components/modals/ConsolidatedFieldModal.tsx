"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue
} from "@/components";
import { Badge } from "@/components/ui/badge";

// DnD kit
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Icons
import { ChevronDown, GripVertical, Search, Trash2 } from "lucide-react";

// React
import { useState } from "react";

// Local types
import { FormatOptionDto } from "../dto/format-options.dto";
import { ConsolidatedFieldModalPropsDto } from "../dto/modal-props.dto";
import { FIELD_CATEGORIES, ReportField } from "../report.dto";

interface SortableConsolidatedFieldItemProps {
  fieldId: string;
  index: number;
  sourceField: ReportField & { categoryTitle?: string };
  currentFormat: { format?: string; timeFormat?: string } | undefined;
  formatOptions: FormatOptionDto[];
  isDateField: boolean;
  isTimeField: boolean;
  isDateTimeField: boolean;
  isFormatExpanded: boolean;
  onToggleFormatExpanded: (fieldId: string) => void;
  onFormatChange: (fieldId: string, value: string) => void;
  onToggleField: (fieldId: string) => void;
}

function SortableConsolidatedFieldItem({
  fieldId,
  index,
  sourceField,
  currentFormat,
  formatOptions,
  isDateField,
  isTimeField,
  isDateTimeField,
  isFormatExpanded,
  onToggleFormatExpanded,
  onFormatChange,
  onToggleField,
}: SortableConsolidatedFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 rounded bg-gray-50 ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <div className="flex items-center gap-2 p-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-gray-500 w-6 text-center">
          {index + 1}
        </span>
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-900">
            {sourceField.displayName}
          </span>
          <Badge variant="outline" className="text-xs ml-2">
            {sourceField.categoryTitle || sourceField.category}
          </Badge>
          {(isDateField || isTimeField || isDateTimeField) &&
            formatOptions.length > 0 && (
              <CHEKIOButton
                type="button"
                variant="secondaryBlue"
                size="sm"
                onClick={() => onToggleFormatExpanded(fieldId)}
                className="ml-2 h-6 text-xs"
              >
                {isFormatExpanded ? "Ocultar" : "Editar"} Formato
              </CHEKIOButton>
            )}
        </div>
        <CHEKIOButton
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onToggleField(fieldId)}
          className="h-7 px-2 flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          <span className="text-xs font-medium">Eliminar</span>
        </CHEKIOButton>
      </div>
      {isFormatExpanded && formatOptions.length > 0 && (
        <div className="px-3 pb-3 border-t border-gray-200 pt-3">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Formato de {sourceField.displayName}
          </label>
          <CHEKIOSelect
            value={
              isTimeField
                ? currentFormat?.timeFormat ||
                  formatOptions[0]?.value ||
                  ""
                : isDateTimeField || isDateField
                  ? currentFormat?.format && currentFormat?.timeFormat
                    ? `${currentFormat.format} ${currentFormat.timeFormat}`
                    : currentFormat?.format ||
                      currentFormat?.timeFormat ||
                      formatOptions[0]?.value ||
                      ""
                  : currentFormat?.format ||
                    formatOptions[0]?.value ||
                    ""
            }
            onValueChange={(value) => onFormatChange(fieldId, value)}
          >
            <CHEKIOSelectTrigger className="w-full rounded-none">
              <CHEKIOSelectValue placeholder="Seleccionar formato" />
            </CHEKIOSelectTrigger>
            <CHEKIOSelectContent>
              {formatOptions.map((option: FormatOptionDto) => (
                <CHEKIOSelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={
                    option.disabled
                      ? "text-gray-400 font-semibold cursor-default"
                      : ""
                  }
                >
                  {option.label}
                </CHEKIOSelectItem>
              ))}
            </CHEKIOSelectContent>
          </CHEKIOSelect>
        </div>
      )}
    </div>
  );
}

export default function ConsolidatedFieldModal({
  isOpen,
  onClose,
  onCreate,
  fieldName,
  headerTransform,
  separator,
  selectedFields,
  fieldFormats,
  searchTerm,
  expandedFormatFields,
  onFieldNameChange,
  onHeaderTransformChange,
  onSeparatorChange,
  onToggleField,
  onMoveFieldUp,
  onMoveFieldDown,
  onSearchChange,
  onFormatChange,
  onToggleFormatExpanded,
  getFormatOptions,
}: ConsolidatedFieldModalPropsDto) {
  const [isOrderSectionExpanded, setIsOrderSectionExpanded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedFields.findIndex((id) => id === active.id);
    const newIndex = selectedFields.findIndex((id) => id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      // Calcular cuántos movimientos necesitamos hacer
      if (oldIndex < newIndex) {
        // Moviendo hacia abajo: mover desde oldIndex hasta newIndex
        for (let i = oldIndex; i < newIndex; i++) {
          onMoveFieldDown(i);
        }
      } else {
        // Moviendo hacia arriba: mover desde oldIndex hasta newIndex
        for (let i = oldIndex; i > newIndex; i--) {
          onMoveFieldUp(i);
        }
      }
    }
  };

  const handleCreate = () => {
    if (fieldName.trim() === "" || selectedFields.length < 2) {
      return;
    }

    const fieldFormatsArray = Array.from(fieldFormats.entries()).map(
      ([fieldId, formats]) => ({
        fieldId,
        format: formats.format,
        timeFormat: formats.timeFormat,
      }),
    );

    onCreate({
      name: fieldName,
      headerTransform,
      separator,
      fieldIds: selectedFields,
      fieldFormats: fieldFormatsArray,
    });
  };

  const handleFormatChangeForField = (fieldId: string, value: string) => {
    if (value === "date_only" || value.startsWith("separator_")) {
      return;
    }

    const currentFormat = fieldFormats.get(fieldId) || {};
    const allAvailableFields = Object.values(FIELD_CATEGORIES).flatMap(
      (category) => category.fields,
    );
    const sourceField = allAvailableFields.find((f) => f.id === fieldId);
    if (!sourceField) return;

    const isTimeField = sourceField.type === "time";
    const isDateTimeField = sourceField.type === "datetime";
    const isDateField = sourceField.type === "date";

    let newFormat: { format?: string; timeFormat?: string } = {};

    if (isTimeField) {
      newFormat = {
        ...currentFormat,
        timeFormat: value,
        format: undefined,
      };
    } else if (isDateTimeField || isDateField) {
      const dateOnlyFormats = [
        "dd/MM/yyyy",
        "dd-MM-yyyy",
        "yyyy-MM-dd",
        "dd/MM/yy",
        "dd MMM yyyy",
        "dd MMMM yyyy",
      ];
      const timeOnlyFormats = [
        "HH:mm",
        "hh:mm A",
        "HH:mm:ss",
        "H:mm",
        "h:mm A",
      ];

      if (dateOnlyFormats.includes(value)) {
        newFormat = {
          ...currentFormat,
          format: value,
          timeFormat: undefined,
        };
      } else if (timeOnlyFormats.includes(value)) {
        newFormat = {
          ...currentFormat,
          format: undefined,
          timeFormat: value,
        };
      } else if (value.includes(" ")) {
        const [dateFormat, timeFormat] = value.split(" ");
        newFormat = {
          ...currentFormat,
          format: dateFormat || "dd/MM/yyyy",
          timeFormat: timeFormat || "HH:mm",
        };
      } else {
        newFormat = {
          ...currentFormat,
          format: value,
          timeFormat: undefined,
        };
      }
    } else {
      newFormat = {
        ...currentFormat,
        format: value === "default" ? undefined : value,
      };
    }

    onFormatChange(fieldId, newFormat);
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Campo Consolidado"
      size="5xl"
      className="w-[1400px]"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:gap-8">
          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Campo Consolidado *
            </label>
            <CHEKIOInput
              type="text"
              value={fieldName}
              onChange={(e) => onFieldNameChange(e.target.value)}
              placeholder="Ej: Nombre Completo"
              className="rounded-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Este será el nombre de la columna en el reporte
            </p>
          </div>
          <div className="flex-1 flex flex-col">
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
        </div>
        <div className="flex flex-col mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Separador *
          </label>
          <CHEKIOSelect value={separator} onValueChange={onSeparatorChange}>
            <CHEKIOSelectTrigger className="rounded-none">
              <CHEKIOSelectValue />
            </CHEKIOSelectTrigger>
            <CHEKIOSelectContent>
              <CHEKIOSelectItem value=" ">Espacio ( )</CHEKIOSelectItem>
              <CHEKIOSelectItem value=", ">Coma (, )</CHEKIOSelectItem>
              <CHEKIOSelectItem value=" - ">Guión ( - )</CHEKIOSelectItem>
              <CHEKIOSelectItem value="_">Guión Bajo (_)</CHEKIOSelectItem>
              <CHEKIOSelectItem value="/">Barra (/)</CHEKIOSelectItem>
            </CHEKIOSelectContent>
          </CHEKIOSelect>
          <p className="text-xs text-gray-500 mt-1">
            Ejemplo: Campo1{separator}Campo2{separator}Campo3
          </p>
        </div>

        {selectedFields.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setIsOrderSectionExpanded(!isOrderSectionExpanded)}
              className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-blue-50 to-gray-50 hover:from-blue-100 hover:to-gray-100 border-b border-gray-200 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {/* Removed ChevronDown icon */}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-gray-800">
                    Campos Seleccionados para Consolidar (Orden)
                  </span>
                  <span className="text-xs text-gray-600 mt-0.5">
                    {isOrderSectionExpanded 
                      ? "Haz clic para ocultar y reordenar campos" 
                      : "Haz clic para mostrar y reordenar campos"}
                  </span>
                </div>
                <span className="ml-2 text-xs font-semibold text-white bg-blue-600 px-3 py-1 rounded-full">
                  {selectedFields.length} {selectedFields.length === 1 ? "campo" : "campos"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                  isOrderSectionExpanded 
                    ? "bg-red-100 text-red-700" 
                    : "bg-green-100 text-green-700"
                }`}>
                  {isOrderSectionExpanded ? "Ocultar" : "Mostrar"}
                </span>
              </div>
            </button>
            {isOrderSectionExpanded && (
              <div className="p-4 bg-white">
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={selectedFields}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedFields.map((fieldId, index) => {
                        const allAvailableFields = Object.values(
                          FIELD_CATEGORIES,
                        ).flatMap((category) =>
                          category.fields.map((f) => ({
                            ...f,
                            categoryTitle: category.title,
                          })),
                        );
                        const field = allAvailableFields.find((f) => f.id === fieldId);
                        if (!field) return null;

                        const currentFormat = fieldFormats.get(fieldId);
                        const formatOptions = getFormatOptions(field as ReportField);
                        const isDateField = field.type === "date";
                        const isTimeField = field.type === "time";
                        const isDateTimeField = field.type === "datetime";
                        const isFormatExpanded = expandedFormatFields.has(fieldId);

                        return (
                          <SortableConsolidatedFieldItem
                            key={fieldId}
                            fieldId={fieldId}
                            index={index}
                            sourceField={field as ReportField & { categoryTitle?: string }}
                            currentFormat={currentFormat}
                            formatOptions={formatOptions}
                            isDateField={isDateField}
                            isTimeField={isTimeField}
                            isDateTimeField={isDateTimeField}
                            isFormatExpanded={isFormatExpanded}
                            onToggleFormatExpanded={onToggleFormatExpanded}
                            onFormatChange={handleFormatChangeForField}
                            onToggleField={onToggleField}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Campos para Consolidar * (mínimo 2)
          </label>
          <div className="relative mb-3">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <CHEKIOInput
              type="search"
              placeholder="Buscar campos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 rounded-none"
            />
          </div>
          <div className="border border-gray-200 rounded p-4 max-h-64 overflow-y-auto bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
              {Object.values(FIELD_CATEGORIES)
                .flatMap((category) =>
                  category.fields.map((f) => ({
                    ...f,
                    categoryTitle: category.title,
                  })),
                )
                .filter((f) => {
                  if (!searchTerm.trim()) return true;
                  const searchLower = searchTerm.toLowerCase();
                  return (
                    f.displayName.toLowerCase().includes(searchLower) ||
                    f.name.toLowerCase().includes(searchLower) ||
                    (f.categoryTitle || "")
                      .toLowerCase()
                      .includes(searchLower) ||
                    (f.description || "").toLowerCase().includes(searchLower)
                  );
                })
                .map((f) => {
                  const isSelected = selectedFields.includes(f.id);
                  return (
                    <label
                      key={`${f.category}_${f.id}`}
                      className={`relative flex flex-col cursor-pointer p-2 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "bg-blue-50 border-blue-500 shadow-sm"
                          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleField(f.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span
                            className={`text-xs font-medium ${
                              isSelected ? "text-blue-900" : "text-gray-700"
                            }`}
                          >
                            {f.displayName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            isSelected
                              ? "bg-blue-100 border-blue-300 text-blue-700"
                              : "bg-gray-100 border-gray-300 text-gray-600"
                          }`}
                        >
                          {f.categoryTitle || f.category}
                        </Badge>
                      </div>
                    </label>
                  );
                })}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Seleccionados: {selectedFields.length} campos
          </p>
        </div>

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
            Crear Campo
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
}
