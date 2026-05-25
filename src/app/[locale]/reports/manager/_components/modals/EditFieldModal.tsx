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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { FormatOptionDto } from "../dto/format-options.dto";
import { EditFieldModalPropsDto } from "../dto/modal-props.dto";
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
  onToggleFieldForConsolidation: (fieldId: string) => void;
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
  onToggleFieldForConsolidation,
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
          onClick={() => onToggleFieldForConsolidation(fieldId)}
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

export default function EditFieldModal({
  field,
  onSave,
  onClose,
  isOpen,
  selectedFieldsForConsolidation,
  consolidatedSeparator,
  consolidatedFieldFormats,
  consolidatedFieldsSearchTerm,
  onToggleFieldForConsolidation,
  onMoveFieldUp,
  onMoveFieldDown,
  onFormatChange,
  onSearchChange,
  onSeparatorChange,
  expandedFormatFields,
  onToggleFormatExpanded,
  getFormatOptions,
}: EditFieldModalPropsDto) {
  const [editingField, setEditingField] = useState<ReportField>(field);
  const [isOrderSectionExpanded, setIsOrderSectionExpanded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    setEditingField(field);
  }, [field]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedFieldsForConsolidation.findIndex(
      (id) => id === active.id
    );
    const newIndex = selectedFieldsForConsolidation.findIndex(
      (id) => id === over.id
    );

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

  const handleSave = () => {
    onSave(editingField);
  };

  const handleFormatChangeForConsolidated = (
    fieldId: string,
    value: string,
  ) => {
    if (value === "date_only" || value.startsWith("separator_")) {
      return;
    }

    const currentFormat = consolidatedFieldFormats.get(fieldId) || {};
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
      } else {
        const [dateFormat, timeFormat] = value.split(" ");
        newFormat = {
          ...currentFormat,
          format: dateFormat || "dd/MM/yyyy",
          timeFormat: timeFormat || "HH:mm",
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
      title="Configurar Campo"
      size="5xl"
      className="w-[1100px]"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:gap-8">
          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Campo
            </label>
            <CHEKIOInput
              type="text"
              value={editingField.displayName}
              onChange={(e) =>
                setEditingField({
                  ...editingField,
                  displayName: e.target.value,
                })
              }
              className="rounded-none"
            />
          </div>
          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Formato del Encabezado
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setEditingField({
                    ...editingField,
                    headerTransform: "DEFAULT",
                  })
                }
                className={`px-3 py-1.5 border rounded transition-all text-xs ${
                  (editingField.headerTransform || "DEFAULT") === "DEFAULT"
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-300 hover:border-gray-400 bg-white text-gray-600"
                }`}
              >
                Por Defecto
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditingField({
                    ...editingField,
                    headerTransform: "UPPER",
                  })
                }
                className={`px-3 py-1.5 border rounded transition-all text-xs ${
                  editingField.headerTransform === "UPPER"
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-300 hover:border-gray-400 bg-white text-gray-600"
                }`}
              >
                MAYÚSCULAS
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditingField({
                    ...editingField,
                    headerTransform: "LOWER",
                  })
                }
                className={`px-3 py-1.5 border rounded transition-all text-xs ${
                  editingField.headerTransform === "LOWER"
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-300 hover:border-gray-400 bg-white text-gray-600"
                }`}
              >
                minúsculas
              </button>
            </div>
          </div>
        </div>

        {editingField.isConsolidated ? (
          <>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setIsOrderSectionExpanded(!isOrderSectionExpanded)}
                className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-blue-50 to-gray-50 hover:from-blue-100 hover:to-gray-100 border-b border-gray-200 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`transition-transform duration-300 ${isOrderSectionExpanded ? "rotate-180" : ""}`}>
                    <ChevronDown className="h-5 w-5 text-blue-600" />
                  </div>
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
                    {selectedFieldsForConsolidation.length} {selectedFieldsForConsolidation.length === 1 ? "campo" : "campos"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1 ${
                    isOrderSectionExpanded 
                      ? "bg-red-100 text-red-700" 
                      : "bg-green-100 text-green-700"
                  }`}>
                    <ChevronDown className={`inline h-3 w-3 transition-transform ${isOrderSectionExpanded ? "rotate-180" : "rotate-0"}`} />
                    {isOrderSectionExpanded ? "Ocultar" : "Mostrar"}
                  </span>
                </div>
              </button>
              {isOrderSectionExpanded && (
                <div className="p-4 bg-white">
                  {selectedFieldsForConsolidation.length === 0 ? (
                    <div className="border border-gray-200 rounded p-4 text-center text-gray-500 text-sm">
                      No hay campos seleccionados. Selecciona campos de la lista de
                      abajo.
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={selectedFieldsForConsolidation}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {selectedFieldsForConsolidation.map((fieldId, index) => {
                            const allAvailableFields = Object.values(
                              FIELD_CATEGORIES,
                            ).flatMap((category) =>
                              category.fields.map((f) => ({
                                ...f,
                                categoryTitle: category.title,
                              })),
                            );
                            const sourceField = allAvailableFields.find(
                              (f) => f.id === fieldId,
                            );
                            if (!sourceField) return null;

                            const currentFormat = consolidatedFieldFormats.get(fieldId);
                            const formatOptions = getFormatOptions(
                              sourceField as ReportField,
                            );
                            const isDateField = sourceField.type === "date";
                            const isTimeField = sourceField.type === "time";
                            const isDateTimeField = sourceField.type === "datetime";
                            const isFormatExpanded = expandedFormatFields.has(fieldId);

                            return (
                              <SortableConsolidatedFieldItem
                                key={fieldId}
                                fieldId={fieldId}
                                index={index}
                                sourceField={sourceField as ReportField & { categoryTitle?: string }}
                                currentFormat={currentFormat}
                                formatOptions={formatOptions}
                                isDateField={isDateField}
                                isTimeField={isTimeField}
                                isDateTimeField={isDateTimeField}
                                isFormatExpanded={isFormatExpanded}
                                onToggleFormatExpanded={onToggleFormatExpanded}
                                onFormatChange={handleFormatChangeForConsolidated}
                                onToggleFieldForConsolidation={onToggleFieldForConsolidation}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              )}
            </div>

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
                  value={consolidatedFieldsSearchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 rounded-none"
                />
              </div>
              <ScrollArea className="h-64 border border-gray-200 rounded p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {Object.values(FIELD_CATEGORIES)
                    .flatMap((category) =>
                      category.fields.map((f) => ({
                        ...f,
                        categoryTitle: category.title,
                      })),
                    )
                    .filter((f) => {
                      if (!consolidatedFieldsSearchTerm.trim()) return true;
                      const searchLower =
                        consolidatedFieldsSearchTerm.toLowerCase();
                      return (
                        f.displayName.toLowerCase().includes(searchLower) ||
                        f.name.toLowerCase().includes(searchLower) ||
                        (f.categoryTitle || "")
                          .toLowerCase()
                          .includes(searchLower) ||
                        (f.description || "")
                          .toLowerCase()
                          .includes(searchLower)
                      );
                    })
                    .map((f) => {
                      const isSelected = selectedFieldsForConsolidation.includes(f.id);
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
                                onChange={() => onToggleFieldForConsolidation(f.id)}
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
              </ScrollArea>
              <p className="text-xs text-gray-500 mt-2">
                Seleccionados: {selectedFieldsForConsolidation.length} campos
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Separador *
              </label>
              <CHEKIOSelect
                value={consolidatedSeparator}
                onValueChange={onSeparatorChange}
              >
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
              <p className="text-xs text-gray-500 mt-2">
                Ejemplo: Campo1{consolidatedSeparator}Campo2
                {consolidatedSeparator}Campo3
              </p>
            </div>
          </>
        ) : (
          (() => {
            const formatOptions = getFormatOptions(editingField);
            if (formatOptions.length === 0) return null;

            const getCurrentFormat = () => {
              if (editingField.type === "time" && editingField.timeFormat) {
                return editingField.timeFormat;
              }
              if (editingField.type === "datetime") {
                const currentFormat = editingField.format;
                const currentTimeFormat = editingField.timeFormat;

                if (
                  currentFormat &&
                  currentTimeFormat &&
                  (currentFormat.includes("/") ||
                    currentFormat.includes("-")) &&
                  currentFormat.split(" ").length === 1
                ) {
                  return `${currentFormat} ${currentTimeFormat}`;
                }
                if (currentFormat && !currentTimeFormat) {
                  return currentFormat;
                }
                if (currentTimeFormat && !currentFormat) {
                  return currentTimeFormat;
                }
                return currentFormat || "dd/MM/yyyy";
              }
              return editingField.format || formatOptions[0]?.value || "";
            };

            const handleFormatChange = (value: string) => {
              if (value === "date_only" || value.startsWith("separator_")) {
                return;
              }

              if (editingField.type === "time") {
                setEditingField({
                  ...editingField,
                  timeFormat: value,
                  format: undefined,
                });
              } else if (editingField.type === "datetime") {
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
                  setEditingField({
                    ...editingField,
                    format: value,
                    timeFormat: undefined,
                  });
                } else if (timeOnlyFormats.includes(value)) {
                  setEditingField({
                    ...editingField,
                    format: undefined,
                    timeFormat: value,
                  });
                } else {
                  const [dateFormat, timeFormat] = value.split(" ");
                  setEditingField({
                    ...editingField,
                    format: dateFormat || "dd/MM/yyyy",
                    timeFormat: timeFormat || "HH:mm",
                  });
                }
              } else {
                setEditingField({
                  ...editingField,
                  format: value === "default" ? undefined : value,
                });
              }
            };

            const formatLabel =
              editingField.type === "number" &&
              (editingField.name.toLowerCase().includes("hour") ||
                editingField.name.toLowerCase().includes("hora") ||
                editingField.displayName.toLowerCase().includes("hora"))
                ? "Formato de Horas"
                : editingField.type === "date"
                  ? "Formato de Fecha"
                  : editingField.type === "time"
                    ? "Formato de Hora"
                    : editingField.type === "datetime"
                      ? "Formato de Fecha y Hora"
                      : "Formato";

            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formatLabel}
                </label>
                <CHEKIOSelect
                  value={getCurrentFormat()}
                  onValueChange={handleFormatChange}
                >
                  <CHEKIOSelectTrigger className="rounded-none">
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
                <p className="text-xs text-gray-500 mt-2">
                  Este formato se aplicará en el archivo Excel generado
                </p>
              </div>
            );
          })()
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <CHEKIOButton
            variant="secondary"
            onClick={onClose}
            className="rounded-none"
          >
            Cancelar
          </CHEKIOButton>
          <CHEKIOButton
            variant="primary"
            onClick={handleSave}
            className="rounded-none"
          >
            Guardar
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
}
