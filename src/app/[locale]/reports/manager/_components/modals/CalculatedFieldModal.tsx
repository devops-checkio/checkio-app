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
import { useEffect, useState } from "react";
import { CalculatedFieldModalPropsDto, CalculationType } from "../dto/modal-props.dto";
import { FIELD_CATEGORIES, ReportField } from "../report.dto";
import { validateCustomFormula } from "../utils/calculation-utils";

export default function CalculatedFieldModal({
  isOpen,
  onClose,
  onCreate,
  editingField,
  fieldName,
  headerTransform,
  calculationType,
  customFormula,
  format,
  selectedFields,
  availableFields,
  onFieldNameChange,
  onHeaderTransformChange,
  onCalculationTypeChange,
  onFormulaChange,
  onFormatChange,
  onToggleField,
  evaluateCustomFormula,
  getFormatOptions,
}: CalculatedFieldModalPropsDto) {
  const [formulaError, setFormulaError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (calculationType === CalculationType.CUSTOM && customFormula) {
      const validation = validateCustomFormula(customFormula, selectedFields.length);
      if (!validation.isValid) {
        setFormulaError(validation.error);
      } else {
        setFormulaError(undefined);
      }
    } else {
      setFormulaError(undefined);
    }
  }, [customFormula, selectedFields.length, calculationType]);

  const handleCreate = () => {
    if (fieldName.trim() === "" || selectedFields.length < 2) {
      return;
    }

    if (calculationType === CalculationType.CUSTOM) {
      const validation = validateCustomFormula(customFormula, selectedFields.length);
      if (!validation.isValid) {
        return;
      }
    }

    onCreate({
      name: fieldName,
      headerTransform,
      calculationType,
      formula:
        calculationType === CalculationType.CUSTOM ? customFormula : undefined,
      format,
      fieldIds: selectedFields,
    });
  };

  const getFormatOptionsForCalculatedField = () => {
    if (selectedFields.length === 0) {
      return [
        { value: "default", label: "Número Estándar → 1.234" },
        { value: "currency", label: "Moneda → $1.234 CLP" },
        { value: "decimal", label: "Decimal → 1.23" },
      ];
    }

    const selectedFieldsData = selectedFields
      .map((fieldId) => availableFields.find((f) => f.id === fieldId))
      .filter((f): f is ReportField => f !== undefined);

    if (selectedFieldsData.length === 0) {
      return [
        { value: "default", label: "Número Estándar → 1.234" },
        { value: "currency", label: "Moneda → $1.234 CLP" },
        { value: "decimal", label: "Decimal → 1.23" },
      ];
    }

    const hasMinutesField = selectedFieldsData.some(
      (f) =>
        f.name?.toLowerCase().includes("minutes") ||
        f.name?.toLowerCase().includes("minutos") ||
        f.displayName?.toLowerCase().includes("minutos")
    );

    const hasHoursField = selectedFieldsData.some(
      (f) =>
        f.name?.toLowerCase().includes("hour") ||
        f.name?.toLowerCase().includes("hora") ||
        f.displayName?.toLowerCase().includes("hora")
    );

    if (hasMinutesField) {
      return [
        { value: "minutes", label: "Por Minutos → 300 min" },
        { value: "hours_hhmm", label: "Por Horas (HH:mm) → 05:00" },
        { value: "hours_decimal", label: "Por Horas Decimales → 5.00 hrs" },
        {
          value: "hours_decimal_no_unit",
          label: "Por Horas (sin unidad) → 5.00",
        },
        { value: "decimal", label: "Decimal → 300.00" },
      ];
    }

    if (hasHoursField) {
      return [
        { value: "default", label: "Número Estándar → 9.08" },
        { value: "hours_hhmm", label: "Por Horas (HH:mm) → 09:05" },
        { value: "hours_decimal", label: "Por Horas Decimales → 9.08 hrs" },
        {
          value: "hours_decimal_no_unit",
          label: "Por Horas (sin unidad) → 9.08",
        },
        { value: "hours_minutes", label: "Por Horas y Minutos → 9h 5m" },
        { value: "decimal", label: "Decimal → 9.08" },
      ];
    }

    return [
      { value: "default", label: "Número Estándar → 1.234" },
      { value: "currency", label: "Moneda → $1.234 CLP" },
      { value: "decimal", label: "Decimal → 1.23" },
    ];
  };

  const evaluateFormula = (formula: string): string => {
    if (!formula.trim() || selectedFields.length === 0) return "";

    try {
      const exampleValues: number[] = [];
      const fieldNames: string[] = [];
      selectedFields.forEach((fieldId, index) => {
        exampleValues.push((index + 1) * 10);
        const field = availableFields.find((f) => f.id === fieldId);
        if (field) {
          fieldNames.push(field.displayName);
        } else {
          fieldNames.push(String.fromCharCode(65 + index));
        }
      });

      const result = evaluateCustomFormula(formula, exampleValues, fieldNames);

      if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
        const valuesStr = exampleValues
          .map((value, index) => `${String.fromCharCode(65 + index)}=${value}`)
          .join(", ");
        return `${valuesStr} → ${result.toFixed(2)}`;
      }
      return "";
    } catch {
      return "";
    }
  };

  const formatOptions = getFormatOptionsForCalculatedField();

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingField ? "Editar Columna Calculada" : "Crear Columna Calculada"
      }
      size="5xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Columna Calculada *
            </label>
            <CHEKIOInput
              type="text"
              value={fieldName}
              onChange={(e) => onFieldNameChange(e.target.value)}
              placeholder="Ej: Minutos Totales"
              className="rounded-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Este será el nombre de la columna en el reporte
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
              Tipo de Cálculo *
            </label>
            <CHEKIOSelect
              value={calculationType}
              onValueChange={(value) =>
                onCalculationTypeChange(value as CalculationType)
              }
            >
              <CHEKIOSelectTrigger className="rounded-none">
                <CHEKIOSelectValue />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                <CHEKIOSelectItem value={CalculationType.SUM}>
                  Suma (+)
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={CalculationType.SUBTRACT}>
                  Resta (-)
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={CalculationType.MULTIPLY}>
                  Multiplicación (×)
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={CalculationType.DIVIDE}>
                  División (÷)
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={CalculationType.AVERAGE}>
                  Promedio
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={CalculationType.CUSTOM}>
                  Personalizado (Fórmula)
                </CHEKIOSelectItem>
              </CHEKIOSelectContent>
            </CHEKIOSelect>
            <p className="text-xs text-gray-500 mt-1">
              Seleccione el tipo de operación para calcular la columna
            </p>
          </div>
        </div>

        {calculationType === CalculationType.CUSTOM && (
          <div>
            <div
              className={`grid gap-4 ${
                selectedFields.length >= 2 ? "grid-cols-3" : "grid-cols-2"
              }`}
            >
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fórmula Personalizada *
                </label>
                <CHEKIOInput
                  type="text"
                  value={customFormula}
                  onChange={(e) => onFormulaChange(e.target.value)}
                  placeholder="Ej: A*B-10, (A+B)/2"
                  className={`rounded-none ${
                    formulaError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                  }`}
                />
                {formulaError ? (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    {formulaError}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Use A, B, C... para referirse a los campos seleccionados
                  </p>
                )}
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ejemplo en tiempo real
                </label>
                {(() => {
                  const exampleResult = formulaError ? null : evaluateFormula(customFormula);

                  return (
                    <div className={`min-h-10 p-3 rounded flex items-center ${
                      formulaError 
                        ? "bg-red-50 border border-red-200" 
                        : "bg-blue-50 border border-blue-200"
                    }`}>
                      <div className="w-full">
                        {formulaError ? (
                          <p className="text-xs text-red-700 font-medium">
                            {formulaError}
                          </p>
                        ) : exampleResult ? (
                          <p className="text-xs text-blue-700 font-mono">
                            {exampleResult}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 italic">
                            Ingrese una fórmula válida para ver el ejemplo
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <p className="text-xs text-gray-500 mt-1">
                  {formulaError 
                    ? "Corrija los errores en la fórmula" 
                    : "Resultado de la fórmula con valores de ejemplo"}
                </p>
              </div>
              {selectedFields.length >= 2 && (
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato de Visualización *
                  </label>
                  <CHEKIOSelect
                    value={format || "minutes"}
                    onValueChange={(value) => onFormatChange(value)}
                  >
                    <CHEKIOSelectTrigger className="rounded-none">
                      <CHEKIOSelectValue />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      {formatOptions.map((option) => (
                        <CHEKIOSelectItem key={option.value} value={option.value}>
                          {option.label}
                        </CHEKIOSelectItem>
                      ))}
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                  <p className="text-xs text-gray-500 mt-1">
                    Seleccione cómo se mostrará el resultado calculado
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {calculationType !== CalculationType.CUSTOM &&
          selectedFields.length >= 2 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato de Visualización *
              </label>
              <CHEKIOSelect
                value={format || "minutes"}
                onValueChange={(value) => onFormatChange(value)}
              >
                <CHEKIOSelectTrigger className="rounded-none">
                  <CHEKIOSelectValue />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  {formatOptions.map((option) => (
                    <CHEKIOSelectItem key={option.value} value={option.value}>
                      {option.label}
                    </CHEKIOSelectItem>
                  ))}
                </CHEKIOSelectContent>
              </CHEKIOSelect>
              <p className="text-xs text-gray-500 mt-2">
                Seleccione cómo se mostrará el resultado calculado
              </p>
            </div>
          )}

        {calculationType === CalculationType.CUSTOM && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-800 mb-2">
                  Información sobre la fórmula:
                </p>
                <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                  <li>
                    Use <strong>punto</strong> como separador decimal (ej: 1.5, 0.25)
                  </li>
                  <li>
                    <strong>Operadores:</strong> +, -, *, /, ()
                  </li>
                  <li>
                    <strong>Ejemplos:</strong> <code className="bg-white px-1 py-0.5 rounded text-xs">(A+B)/2</code>,{" "}
                    <code className="bg-white px-1 py-0.5 rounded text-xs">A*1.5</code>,{" "}
                    <code className="bg-white px-1 py-0.5 rounded text-xs">A*B-10</code>
                  </li>
                </ul>
              </div>
              {selectedFields.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-800 mb-2">
                    Campos disponibles:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFields.map((fieldId, index) => {
                      const field = availableFields.find(
                        (f) => f.id === fieldId
                      );
                      if (!field) return null;
                      return (
                        <span
                          key={fieldId}
                          className="text-xs bg-white border border-blue-300 rounded px-2 py-0.5 font-medium text-blue-700"
                        >
                          {String.fromCharCode(65 + index)} = {field.displayName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campos Seleccionados para Calcular * (mínimo 2)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            {editingField
              ? "Agregue o elimine campos numéricos o de tiempo del cálculo. Solo se pueden seleccionar campos que ya estén agregados al reporte."
              : "Solo se pueden seleccionar campos numéricos o de tiempo que ya estén agregados al reporte"}
          </p>
          <div className="border border-gray-200 rounded p-4 max-h-64 overflow-y-auto bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {availableFields
                  .filter(
                    (field) =>
                      (field.type === "number" || field.type === "time" || Boolean(field.timeFormat)) &&
                      !field.isConsolidated &&
                      !field.isCalculated
                  )
                .filter((field, index, self) => {
                  // Eliminar duplicados basándose en name + table
                  return (
                    index ===
                    self.findIndex(
                      (f) => f.name === field.name && f.table === field.table
                    )
                  );
                })
                .map((field) => {
                  const isSelected = selectedFields.includes(field.id);
                  // Buscar la categoría del campo desde FIELD_CATEGORIES
                  const fieldWithCategory = Object.values(FIELD_CATEGORIES)
                    .flatMap((category) =>
                      category.fields.map((f) => ({
                        ...f,
                        categoryTitle: category.title,
                      }))
                    )
                    .find((f) => f.id === field.id);
                  
                  // Si no se encuentra, buscar por el enum de categoría
                  let categoryTitle = fieldWithCategory?.categoryTitle;
                  if (!categoryTitle && field.category) {
                    // Buscar la categoría usando el enum como clave
                    const categoryKey = field.category as keyof typeof FIELD_CATEGORIES;
                    categoryTitle = FIELD_CATEGORIES[categoryKey]?.title || "Sin categoría";
                  } else if (!categoryTitle) {
                    categoryTitle = "Sin categoría";
                  }
                  
                  return (
                    <label
                      key={field.id}
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
                            onChange={() => onToggleField(field.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span
                            className={`text-xs font-medium ${
                              isSelected ? "text-blue-900" : "text-gray-700"
                            }`}
                          >
                            {field.displayName}
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
                          {categoryTitle}
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
          {availableFields.filter(
            (field) =>
              (field.type === "number" || field.type === "time" || Boolean(field.timeFormat)) &&
              !field.isConsolidated &&
              !field.isCalculated
          ).length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              No hay campos numéricos o de tiempo disponibles. Agregue campos apropiados al
              reporte primero.
            </p>
          )}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <strong>Nota sobre totales:</strong> El total de una columna
              calculada corresponde a la suma (o agregación) de los valores ya
              calculados por cada fila. Por ejemplo, si la fórmula es{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded">(A+B)/2</code>, primero se calcula el resultado para cada
              fila, y luego se suman esos resultados para obtener el total.
            </p>
          </div>
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
            disabled={
              fieldName.trim() === "" ||
              selectedFields.length < 2 ||
              (calculationType === CalculationType.CUSTOM && !!formulaError)
            }
          >
            {editingField
              ? "Actualizar Columna Calculada"
              : "Crear Columna Calculada"}
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
}
