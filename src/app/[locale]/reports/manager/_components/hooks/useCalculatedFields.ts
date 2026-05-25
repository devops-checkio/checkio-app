import { useToast } from "@/hooks/use-toast";
import { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { CalculationType } from "../dto/modal-props.dto";
import { FIELD_CATEGORIES, FieldCategory, ReportField, ReportFormData } from "../report.dto";

interface UseCalculatedFieldsParams {
  fields: UseFieldArrayReturn<ReportFormData, "fields", "id">["fields"];
  append: UseFieldArrayReturn<ReportFormData, "fields", "id">["append"];
  replace: UseFieldArrayReturn<ReportFormData, "fields", "id">["replace"];
  setValue: UseFormReturn<ReportFormData>["setValue"];
  watch: UseFormReturn<ReportFormData>["watch"];
  calculatedFieldName: string;
  calculatedHeaderTransform: "DEFAULT" | "UPPER" | "LOWER";
  selectedFieldsForCalculation: string[];
  calculationType: CalculationType;
  customFormula: string;
  calculatedFieldFormat: string | undefined;
  editingCalculatedField: ReportField | null;
  editingCalculatedFieldIndex: number | null;
  setCalculatedFieldName: (name: string) => void;
  setCalculatedHeaderTransform: (transform: "DEFAULT" | "UPPER" | "LOWER") => void;
  setSelectedFieldsForCalculation: (fields: string[] | ((prev: string[]) => string[])) => void;
  setCalculationType: (type: CalculationType) => void;
  setCustomFormula: (formula: string) => void;
  setCalculatedFieldFormat: (format: string | undefined) => void;
  setEditingCalculatedField: (field: ReportField | null) => void;
  setEditingCalculatedFieldIndex: (index: number | null) => void;
  setIsCalculatedFieldModalOpen: (open: boolean) => void;
}

export const useCalculatedFields = ({
  fields,
  append,
  replace,
  setValue,
  watch,
  calculatedFieldName,
  calculatedHeaderTransform,
  selectedFieldsForCalculation,
  calculationType,
  customFormula,
  calculatedFieldFormat,
  editingCalculatedField,
  editingCalculatedFieldIndex,
  setCalculatedFieldName,
  setCalculatedHeaderTransform,
  setSelectedFieldsForCalculation,
  setCalculationType,
  setCustomFormula,
  setCalculatedFieldFormat,
  setEditingCalculatedField,
  setEditingCalculatedFieldIndex,
  setIsCalculatedFieldModalOpen,
}: UseCalculatedFieldsParams) => {
  const { toast } = useToast();

  const handleCreateCalculatedField = () => {
    if (calculatedFieldName.trim() === "") {
      toast({
        title: "Error",
        description: "Debe ingresar un nombre para la columna calculada",
        variant: "destructive",
      });
      return;
    }

    if (
      calculationType === CalculationType.CUSTOM &&
      (!customFormula || customFormula.trim() === "")
    ) {
      toast({
        title: "Error",
        description:
          "Debe ingresar una fórmula personalizada cuando selecciona cálculo personalizado",
        variant: "destructive",
      });
      return;
    }

    const currentFields = watch("fields") || fields;
    const allAvailableFields = Object.values(FIELD_CATEGORIES).flatMap(
      (category) => category.fields
    );
    
    if (selectedFieldsForCalculation.length < 2) {
      toast({
        title: "Error",
        description:
          "Debe seleccionar al menos 2 campos numéricos para calcular",
        variant: "destructive",
      });
      return;
    }

    const validSelectedFields = selectedFieldsForCalculation.filter((fieldId) => {
      // Primero buscar en los campos del formulario
      const fieldInForm = currentFields.find((f) => f.id === fieldId);
      if (fieldInForm) {
        // Si está en el formulario, debe ser numérico y no consolidado/calculado
        if (
          fieldInForm.type !== "number" ||
          fieldInForm.isConsolidated ||
          fieldInForm.isCalculated
        ) {
          return false;
        }
        return true;
      }

      // Si no está en el formulario, buscar en las categorías
      const field = allAvailableFields.find((f) => f.id === fieldId);
      if (!field || field.type !== "number") {
        return false;
      }

      // Verificar que no esté en el formulario como consolidado o calculado
      // (buscando por name + table en caso de que el ID sea diferente)
      const existingField = currentFields.find(
        (f) => f.name === field.name && f.table === field.table
      );
      if (
        existingField &&
        (existingField.isConsolidated || existingField.isCalculated)
      ) {
        return false;
      }

      return true;
    });

    if (validSelectedFields.length < 2) {
      toast({
        title: "Error",
        description:
          "Debe seleccionar al menos 2 campos numéricos válidos para calcular",
        variant: "destructive",
      });
      return;
    }

    // Normalize selected fields to category IDs (keep consistency with consolidated fields)
    const mappedFieldIds = validSelectedFields
      .map((fieldId) => {
        // If it's already a category id, keep it
        const categoryField = allAvailableFields.find((f) => f.id === fieldId);
        if (categoryField) return categoryField.id;

        // If it's a form field id, map to category field by name+table
        const formField = currentFields.find((f) => f.id === fieldId);
        if (formField) {
          const categoryMatch = allAvailableFields.find(
            (f) => f.name === formField.name && f.table === formField.table
          );
          if (categoryMatch) return categoryMatch.id;
        }

        return null;
      })
      .filter((id): id is string => !!id);

    if (mappedFieldIds.length < 2) {
      toast({
        title: "Error",
        description:
          "No se pudieron mapear los campos seleccionados. Asegúrate de que los campos sean válidos.",
        variant: "destructive",
      });
      return;
    }
    
    // Determine numeric fields present in form and category-only fields
    const numericFields = currentFields.filter(
      (field) => field.type === "number" && !field.isConsolidated && !field.isCalculated
    );

    const fieldsFromCategories = mappedFieldIds
      .map((categoryId) => allAvailableFields.find((f) => f.id === categoryId))
      .filter((f): f is NonNullable<typeof f> => !!f && f.type === "number")
      // exclude ones already represented by a numeric field in the form (by name+table)
      .filter((catField) =>
        !numericFields.some((nf) => nf.name === catField.name && nf.table === catField.table)
      );

    const calculationTypeStr =
      calculationType === CalculationType.SUM
        ? "sum"
        : calculationType === CalculationType.SUBTRACT
        ? "subtract"
        : calculationType === CalculationType.MULTIPLY
        ? "multiply"
        : calculationType === CalculationType.DIVIDE
        ? "divide"
        : calculationType === CalculationType.AVERAGE
        ? "average"
        : calculationType === CalculationType.CUSTOM
        ? "custom"
        : "sum";

    const uniqueMappedIds = Array.from(new Set(mappedFieldIds));

    const calculatedFieldNames = uniqueMappedIds
      .map((id) => allAvailableFields.find((f) => f.id === id)?.displayName)
      .filter(Boolean) as string[];

    const calculatedField: ReportField = {
      id: uuidv4(),
      name: `calculated_${calculatedFieldName
        .toLowerCase()
        .replace(/\s+/g, "_")}`,
      displayName: calculatedFieldName,
      type: "number",
      table: "calculated",
      category: FieldCategory.EMPLOYEE,
      selected: true,
      order: fields.length,
      columnIndex: fields.length + 1,
      isCalculated: true,
      headerTransform: calculatedHeaderTransform,
      calculatedFields: calculatedFieldNames,
      // Store category IDs for consistency with consolidated fields
      calculatedFieldIds: uniqueMappedIds,
      calculationType: calculationTypeStr as "sum" | "subtract" | "multiply" | "divide" | "average" | "custom",
      aggregationType: "sum",
      format: calculatedFieldFormat || "decimal",
      formula:
        calculationType === CalculationType.CUSTOM ? customFormula : undefined,
      description: `Columna calculada: ${calculatedFieldNames.join(
        ` ${
          calculationType === CalculationType.SUM
            ? "+"
            : calculationType === CalculationType.SUBTRACT
            ? "-"
            : calculationType === CalculationType.MULTIPLY
            ? "×"
            : calculationType === CalculationType.DIVIDE
            ? "÷"
            : calculationType === CalculationType.CUSTOM
            ? `(${customFormula})`
            : "promedio"
        } `
      )}`,
      isSortable: false,
      isFilterable: false,
    };

    if (editingCalculatedField && editingCalculatedFieldIndex !== null) {
      const updatedFields = [...fields];
      const updatedField = {
        ...calculatedField,
        id: editingCalculatedField.id,
        calculatedFieldIds: uniqueMappedIds,
        calculatedFields: calculatedFieldNames,
      };
      
      updatedFields[editingCalculatedFieldIndex] = updatedField;
      
      replace(updatedFields);
      
      setEditingCalculatedField(null);
      setEditingCalculatedFieldIndex(null);
      toast({
        title: "Columna calculada actualizada",
        description: `${calculatedFieldName} ha sido actualizada`,
      });
    } else {
      append(calculatedField);
      toast({
        title: "Columna calculada creada",
        description: `${calculatedFieldName} ha sido agregada al reporte`,
      });
    }

    setIsCalculatedFieldModalOpen(false);
    setEditingCalculatedField(null);
    setEditingCalculatedFieldIndex(null);
    setCalculatedFieldName("");
    setCalculatedHeaderTransform("DEFAULT");
    setSelectedFieldsForCalculation([]);
    setCalculationType(CalculationType.SUM);
    setCustomFormula("");
    setCalculatedFieldFormat("minutes");
  };

  const handleCloseCalculatedFieldModal = () => {
    setIsCalculatedFieldModalOpen(false);
    if (!editingCalculatedField) {
      setCalculatedFieldName("");
      setCalculatedHeaderTransform("DEFAULT");
      setSelectedFieldsForCalculation([]);
      setCalculationType(CalculationType.SUM);
      setCustomFormula("");
      setCalculatedFieldFormat("minutes");
    } else {
      setEditingCalculatedField(null);
      setEditingCalculatedFieldIndex(null);
    }
  };

  const handleCreateCalculatedFieldFromModal = (data: {
    name: string;
    headerTransform: "DEFAULT" | "UPPER" | "LOWER";
    calculationType: CalculationType;
    customFormula?: string;
    format?: string;
    fieldIds: string[];
  }) => {
    setCalculatedFieldName(data.name);
    setCalculatedHeaderTransform(data.headerTransform);
    setCalculationType(data.calculationType);
    setCustomFormula(data.customFormula || "");
    setCalculatedFieldFormat(data.format || "decimal");
    setSelectedFieldsForCalculation(data.fieldIds);
    
    setTimeout(() => {
      handleCreateCalculatedField();
    }, 0);
  };

  const toggleFieldForCalculation = (fieldId: string) => {
    setSelectedFieldsForCalculation((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  return {
    handleCreateCalculatedField,
    handleCloseCalculatedFieldModal,
    handleCreateCalculatedFieldFromModal,
    toggleFieldForCalculation,
  };
};
