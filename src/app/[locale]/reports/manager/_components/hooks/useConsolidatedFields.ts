import { useToast } from "@/hooks/use-toast";
import { Dispatch, SetStateAction } from "react";
import { UseFieldArrayReturn } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { FIELD_CATEGORIES, FieldCategory, ReportField, ReportFormData } from "../report.dto";

interface UseConsolidatedFieldsParams {
  fields: UseFieldArrayReturn<ReportFormData, "fields", "id">["fields"];
  append: UseFieldArrayReturn<ReportFormData, "fields", "id">["append"];
  consolidatedFieldName: string;
  consolidatedHeaderTransform: "DEFAULT" | "UPPER" | "LOWER";
  selectedFieldsForConsolidation: string[];
  consolidatedSeparator: string;
  consolidatedFieldFormats: Map<string, { format?: string; timeFormat?: string }>;
  setConsolidatedFieldName: (name: string) => void;
  setConsolidatedHeaderTransform: (transform: "DEFAULT" | "UPPER" | "LOWER") => void;
  setSelectedFieldsForConsolidation: Dispatch<SetStateAction<string[]>>;
  setConsolidatedSeparator: (separator: string) => void;
  setConsolidatedFieldsSearchTerm: (term: string) => void;
  setConsolidatedFieldFormats: (formats: Map<string, { format?: string; timeFormat?: string }>) => void;
  setExpandedFormatFields: (fields: Set<string>) => void;
  setIsConsolidatedModalOpen: (open: boolean) => void;
}

export const useConsolidatedFields = ({
  fields,
  append,
  consolidatedFieldName,
  consolidatedHeaderTransform,
  selectedFieldsForConsolidation,
  consolidatedSeparator,
  consolidatedFieldFormats,
  setConsolidatedFieldName,
  setConsolidatedHeaderTransform,
  setSelectedFieldsForConsolidation,
  setConsolidatedSeparator,
  setConsolidatedFieldsSearchTerm,
  setConsolidatedFieldFormats,
  setExpandedFormatFields,
  setIsConsolidatedModalOpen,
}: UseConsolidatedFieldsParams) => {
  const { toast } = useToast();

  const handleCreateConsolidatedField = (data?: {
    name: string;
    headerTransform: "DEFAULT" | "UPPER" | "LOWER";
    separator: string;
    fieldIds: string[];
    fieldFormats: Array<{
      fieldId: string;
      format?: string;
      timeFormat?: string;
    }>;
  }) => {
    const fieldName = data?.name || consolidatedFieldName;
    const headerTransform = data?.headerTransform || consolidatedHeaderTransform;
    const separator = data?.separator || consolidatedSeparator;
    const fieldIds = data?.fieldIds || selectedFieldsForConsolidation;
    const fieldFormats = data?.fieldFormats || Array.from(
      consolidatedFieldFormats.entries()
    ).map(([fieldId, formats]) => ({
      fieldId,
      format: formats.format,
      timeFormat: formats.timeFormat,
    }));

    if (fieldName.trim() === "" || fieldIds.length < 2) {
      toast({
        title: "Error",
        description:
          "Debe ingresar un nombre y seleccionar al menos 2 campos para consolidar",
        variant: "destructive",
      });
      return;
    }

    const allAvailableFields = Object.values(FIELD_CATEGORIES).flatMap(
      (category) => category.fields
    );
    const selectedFieldsData = fieldIds.map((fieldId) =>
      allAvailableFields.find((f) => f.id === fieldId)
    );

    if (selectedFieldsData.some((f) => !f)) {
      toast({
        title: "Error",
        description: "Uno o más campos seleccionados no fueron encontrados",
        variant: "destructive",
      });
      return;
    }

    const consolidatedField: ReportField = {
      id: uuidv4(),
      name: `consolidated_${fieldName
        .toLowerCase()
        .replace(/\s+/g, "_")}`,
      displayName: fieldName,
      type: "string",
      table: "consolidated",
      category: FieldCategory.EMPLOYEE,
      selected: true,
      order: fields.length,
      columnIndex: fields.length + 1,
      isConsolidated: true,
      headerTransform: headerTransform,
      consolidatedFields: fieldIds
        .map(
          (fieldId) =>
            allAvailableFields.find((f) => f.id === fieldId)?.name || ""
        )
        .filter(Boolean),
      consolidatedFieldIds: fieldIds,
      consolidatedSeparator: separator,
      consolidatedFieldFormats: fieldFormats,
      description: `Campo consolidado: ${selectedFieldsData
        .map((f) => f?.displayName)
        .join(` ${separator} `)}`,
      isSortable: false,
      isFilterable: false,
    };

    append(consolidatedField);
    setIsConsolidatedModalOpen(false);
    setConsolidatedFieldName("");
    setConsolidatedHeaderTransform("DEFAULT");
    setSelectedFieldsForConsolidation([]);
    setConsolidatedSeparator(" ");
    setConsolidatedFieldsSearchTerm("");
    setConsolidatedFieldFormats(new Map());
    setExpandedFormatFields(new Set());
    toast({
      title: "Campo consolidado creado",
      description: `${fieldName} ha sido agregado al reporte`,
    });
  };

  const handleCloseConsolidatedModal = () => {
    setIsConsolidatedModalOpen(false);
    setConsolidatedFieldName("");
    setConsolidatedHeaderTransform("DEFAULT");
    setSelectedFieldsForConsolidation([]);
    setConsolidatedSeparator(" ");
    setConsolidatedFieldsSearchTerm("");
    setConsolidatedFieldFormats(new Map());
    setExpandedFormatFields(new Set());
  };

  const toggleFieldForConsolidation = (fieldId: string) => {
    setSelectedFieldsForConsolidation((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const moveConsolidatedFieldUp = (index: number) => {
    if (index === 0) return;
    setSelectedFieldsForConsolidation((prev) => {
      const newFields = [...prev];
      [newFields[index - 1], newFields[index]] = [
        newFields[index],
        newFields[index - 1],
      ];
      return newFields;
    });
  };

  const moveConsolidatedFieldDown = (index: number) => {
    setSelectedFieldsForConsolidation((prev) => {
      if (index === prev.length - 1) return prev;
      const newFields = [...prev];
      [newFields[index], newFields[index + 1]] = [
        newFields[index + 1],
        newFields[index],
      ];
      return newFields;
    });
  };

  return {
    handleCreateConsolidatedField,
    handleCloseConsolidatedModal,
    toggleFieldForConsolidation,
    moveConsolidatedFieldUp,
    moveConsolidatedFieldDown,
  };
};
