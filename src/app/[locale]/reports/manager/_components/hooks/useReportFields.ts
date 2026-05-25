import { useToast } from "@/hooks/use-toast";
import { Dispatch, SetStateAction } from "react";
import { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import { CalculationType } from "../dto/modal-props.dto";
import { ReportTemplateColumnDto } from "../report-template.dto";
import { FIELD_CATEGORIES, ReportField, ReportFormData } from "../report.dto";
import { mapBdIdToCategoryId, mapBdIdToCategoryIdUsingTags } from "../utils/field-id-mapper";

interface UseReportFieldsParams {
  fields: UseFieldArrayReturn<ReportFormData, "fields", "id">["fields"];
  append: UseFieldArrayReturn<ReportFormData, "fields", "id">["append"];
  remove: UseFieldArrayReturn<ReportFormData, "fields", "id">["remove"];
  replace: UseFieldArrayReturn<ReportFormData, "fields", "id">["replace"];
  setValue: UseFormReturn<ReportFormData>["setValue"];
  getValues: UseFormReturn<ReportFormData>["getValues"];
  setEditingField: (field: ReportField | null) => void;
  setEditingFieldIndex: (index: number | null) => void;
  setEditingCalculatedField: (field: ReportField | null) => void;
  setEditingCalculatedFieldIndex: (index: number | null) => void;
  setCalculatedFieldName: (name: string) => void;
  setCalculatedHeaderTransform: (transform: "DEFAULT" | "UPPER" | "LOWER") => void;
  setSelectedFieldsForCalculation: Dispatch<SetStateAction<string[]>>;
  setCalculationType: (type: CalculationType) => void;
  setCalculatedFieldFormat: (format: string | undefined) => void;
  setCustomFormula: (formula: string) => void;
  setIsCalculatedFieldModalOpen: (open: boolean) => void;
  setSelectedFieldsForConsolidation: Dispatch<SetStateAction<string[]>>;
  setConsolidatedSeparator: (separator: string) => void;
  setConsolidatedFieldsSearchTerm: (term: string) => void;
  setConsolidatedFieldFormats: (formats: Map<string, { format?: string; timeFormat?: string }>) => void;
  setExpandedFormatFields: (fields: Set<string>) => void;
  setIsEditModalOpen: (open: boolean) => void;
  selectedFieldsForConsolidation: string[];
  consolidatedSeparator: string;
  consolidatedFieldFormats: Map<string, { format?: string; timeFormat?: string }>;
  editingField: ReportField | null;
  editingFieldIndex: number | null;
  templateColumns?: ReportTemplateColumnDto[];
}

export const useReportFields = ({
  fields,
  append,
  remove,
  replace,
  setValue,
  getValues,
  setEditingField,
  setEditingFieldIndex,
  setEditingCalculatedField,
  setEditingCalculatedFieldIndex,
  setCalculatedFieldName,
  setCalculatedHeaderTransform,
  setSelectedFieldsForCalculation,
  setCalculationType,
  setCalculatedFieldFormat,
  setCustomFormula,
  setIsCalculatedFieldModalOpen,
  setSelectedFieldsForConsolidation,
  setConsolidatedSeparator,
  setConsolidatedFieldsSearchTerm,
  setConsolidatedFieldFormats,
  setExpandedFormatFields,
  setIsEditModalOpen,
  selectedFieldsForConsolidation,
  consolidatedSeparator,
  consolidatedFieldFormats,
  editingField,
  editingFieldIndex,
  templateColumns,
}: UseReportFieldsParams) => {
  const { toast } = useToast();

  const handleAddField = (field: ReportField) => {
    const newField = {
      ...field,
      selected: true,
      order: fields.length,
      columnIndex: fields.length + 1,
      headerTransform: field.headerTransform || "DEFAULT",
    };
    append(newField);
    toast({
      title: "Campo agregado",
      description: `${field.displayName} ha sido agregado al reporte`,
    });
  };

  const handleRemoveField = (index: number) => {
    const field = fields[index];
    remove(index);
    toast({
      title: "Campo eliminado",
      description: `${field.displayName} ha sido eliminado del reporte`,
    });
  };

  const handleEditField = (field: ReportField) => {
    const fieldIndex = fields.findIndex((f) => f.id === field.id);
    if (fieldIndex !== -1) {
      const currentFields = getValues("fields");
      const currentField = currentFields[fieldIndex] || fields[fieldIndex];
      
      if (currentField.isCalculated) {
        setEditingCalculatedField({ ...currentField });
        setEditingCalculatedFieldIndex(fieldIndex);
        setCalculatedFieldName(currentField.displayName || "");
        setCalculatedHeaderTransform(currentField.headerTransform || "DEFAULT");
        
        const allAvailableFields = currentFields.length > 0 ? currentFields : fields;
        // Use a deduplicated list (by name+table) to match the modal's `availableFields`
        const uniqueAvailableFields = allAvailableFields.filter((field, index, self) =>
          index === self.findIndex((f) => f.name === field.name && f.table === field.table)
        );
        const allFieldsFromCategories = Object.values(FIELD_CATEGORIES).flatMap(
          (category) => category.fields
        );

        const mapToFormFieldId = (bdId: string): string | null => {
          const formMatch = uniqueAvailableFields.find(
            (f) => f.id === bdId && f.type === "number" && !f.isConsolidated && !f.isCalculated
          );
          if (formMatch) return formMatch.id;

          const categoryMatch = allFieldsFromCategories.find((f) => f.id === bdId);
          if (categoryMatch) {
            const matchByName = uniqueAvailableFields.find(
              (f) => f.name === categoryMatch.name && f.table === categoryMatch.table && f.type === "number" && !f.isConsolidated && !f.isCalculated
            );
            if (matchByName) return matchByName.id;
          }

          const combined = [...allAvailableFields, ...allFieldsFromCategories];
          const anyField = combined.find((f) => f.id === bdId);
          if (anyField) {
            const resolved = uniqueAvailableFields.find(
              (f) => f.name === anyField.name && f.table === anyField.table && f.type === "number" && !f.isConsolidated && !f.isCalculated
            );
            if (resolved) return resolved.id;
          }

          if (templateColumns && templateColumns.length > 0) {
            const categoryIdFromTags = mapBdIdToCategoryIdUsingTags(bdId, templateColumns, allFieldsFromCategories);
            if (categoryIdFromTags) {
              const cat = allFieldsFromCategories.find(cf => cf.id === categoryIdFromTags);
              if (cat) {
                const matchByCat = allAvailableFields.find(
                  (f) => f.name === cat.name && f.table === cat.table && f.type === "number" && !f.isConsolidated && !f.isCalculated
                );
                if (matchByCat) return matchByCat.id;
              }
            }
          }

          return null;
        };

        let candidateIds: string[] = [];

        if (currentField.calculatedFieldIds && currentField.calculatedFieldIds.length > 0) {
          candidateIds = currentField.calculatedFieldIds;
        } else if (currentField.calculatedFields && currentField.calculatedFields.length > 0) {
          candidateIds = currentField.calculatedFields
            .map((name) => allFieldsFromCategories.find((f) => f.name === name))
            .filter(Boolean)
            .map((f) => (f as ReportField).id);
        }

        const mappedFormFieldIds = Array.from(new Set(
          candidateIds
            .map((bdId) => mapToFormFieldId(bdId))
            .filter((id): id is string => !!id)
        ));

        setSelectedFieldsForCalculation(mappedFormFieldIds);
        const calculationTypeValue =
          currentField.calculationType === "sum"
            ? CalculationType.SUM
            : currentField.calculationType === "subtract"
            ? CalculationType.SUBTRACT
            : currentField.calculationType === "multiply"
            ? CalculationType.MULTIPLY
            : currentField.calculationType === "divide"
            ? CalculationType.DIVIDE
            : currentField.calculationType === "average"
            ? CalculationType.AVERAGE
            : currentField.calculationType === "custom"
            ? CalculationType.CUSTOM
            : CalculationType.SUM;
        setCalculationType(calculationTypeValue);
        setCalculatedFieldFormat(currentField.format || "minutes");
        setCustomFormula(currentField.formula || "");
        setIsCalculatedFieldModalOpen(true);
      } else {
        setEditingField({ ...currentField });
        setEditingFieldIndex(fieldIndex);
        if (currentField.isConsolidated && currentField.consolidatedFields) {
          const allAvailableFields = Object.values(FIELD_CATEGORIES).flatMap(
            (category) => category.fields
          );

          const mapStoredIdToCategoryId = (storedIdOrName: string): string | null => {
            const catById = allAvailableFields.find((f) => f.id === storedIdOrName);
            if (catById) return catById.id;

            const formField = fields.find((f) => f.id === storedIdOrName);
            if (formField && !formField.isConsolidated && !formField.isCalculated) {
              const cat = allAvailableFields.find(
                (f) => f.name === formField.name && f.table === formField.table
              );
              if (cat) return cat.id;
            }

            const byName = allAvailableFields.find((f) => f.name === storedIdOrName);
            if (byName) return byName.id;

            if (templateColumns && templateColumns.length > 0) {
              const categoryIdFromTags = mapBdIdToCategoryIdUsingTags(storedIdOrName, templateColumns, allAvailableFields);
              if (categoryIdFromTags) return categoryIdFromTags;
            }

            return null;
          };

          let selectedFieldIds: string[] = [];

          if (currentField.consolidatedFieldIds && currentField.consolidatedFieldIds.length > 0) {
            selectedFieldIds = currentField.consolidatedFieldIds
              .map((id) => mapStoredIdToCategoryId(id))
              .filter((id): id is string => !!id);
          }

          if (selectedFieldIds.length === 0 && currentField.consolidatedFields) {
            selectedFieldIds = currentField.consolidatedFields
              .map((fieldName) => mapStoredIdToCategoryId(fieldName))
              .filter((id): id is string => !!id);
          }

          const seen = new Set<string>();
          const uniqueOrdered = selectedFieldIds.filter((id) => {
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          });

          setSelectedFieldsForConsolidation(uniqueOrdered);
          setConsolidatedSeparator(currentField.consolidatedSeparator || " ");

          const formatsMap = new Map<string, { format?: string; timeFormat?: string }>();
          if (currentField.consolidatedFieldFormats) {
            currentField.consolidatedFieldFormats.forEach((fmt) => {
              const fieldInForm = fields.find((f) => f.id === fmt.fieldId) || allAvailableFields.find((f) => f.id === fmt.fieldId);
              if (fieldInForm) {
                const cat = allAvailableFields.find(
                  (f) => f.name === fieldInForm.name && f.table === fieldInForm.table
                );
                if (cat) {
                  formatsMap.set(cat.id, { format: fmt.format, timeFormat: fmt.timeFormat });
                }
              }
            });
          }
          setConsolidatedFieldFormats(formatsMap);
        }
        setIsEditModalOpen(true);
      }
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingField(null);
    setEditingFieldIndex(null);
    setSelectedFieldsForConsolidation([]);
    setConsolidatedSeparator(" ");
    setConsolidatedFieldsSearchTerm("");
    setConsolidatedFieldFormats(new Map());
    setExpandedFormatFields(new Set());
  };

  const getRelationshipPath = (table: string, fieldName: string): string => {
    const relationshipMap: Record<string, string> = {
      Job: "job",
      Branch: "branch",
      Company: "company",
      Schedule: "schedule",
      Shift: "shift",
      Assistance: "assistance",
      Absence: "absence",
      OvertimeRequest: "overtimeRequest",
      Holiday: "holiday",
    };
    const basePath = relationshipMap[table] || table.toLowerCase();
    return `${basePath}.${fieldName}`;
  };

  const generateTagsFromFields = (fields: ReportField[]): string[] => {
    return fields.map((f) => {
      if (f.table === "Employee") {
        return f.name;
      }
      return getRelationshipPath(f.table, f.name);
    });
  };

  const handleSaveFieldFormat = (updatedField?: ReportField) => {
    const fieldToSave = updatedField || editingField;
    if (fieldToSave && editingFieldIndex !== null) {
      const updatedFields = [...fields];

      if (fieldToSave.isConsolidated) {
        const allAvailableFields = Object.values(FIELD_CATEGORIES).flatMap(
          (category) => category.fields
        );
        const consolidatedFieldNames = selectedFieldsForConsolidation
          .map((fieldId) => {
            const foundField = allAvailableFields.find((f) => f.id === fieldId);
            return foundField?.name;
          })
          .filter(Boolean) as string[];

        if (consolidatedFieldNames.length < 2) {
          toast({
            title: "Error",
            description: "Debe seleccionar al menos 2 campos para consolidar",
            variant: "destructive",
          });
          return;
        }

        const selectedFieldsData = selectedFieldsForConsolidation
          .map((fieldId) => allAvailableFields.find((f) => f.id === fieldId))
          .filter(Boolean) as ReportField[];

        const consolidatedFieldFormatsArray = Array.from(
          consolidatedFieldFormats.entries()
        ).map(([fieldId, formats]) => ({
          fieldId,
          format: formats.format,
          timeFormat: formats.timeFormat,
        }));

        const mappedConsolidatedFieldIds = selectedFieldsForConsolidation
          .map((fieldIdFromCategories) => {
            const fieldFromCategories = allAvailableFields.find(
              (f) => f.id === fieldIdFromCategories
            );
            if (!fieldFromCategories) return null;

            // Always return the category id so the modal can consistently work with category IDs
            return fieldFromCategories.id;
          })
          .filter((id): id is string => !!id);
        
        if (mappedConsolidatedFieldIds.length < 2) {
          toast({
            title: "Error",
            description: "Debe seleccionar al menos 2 campos para consolidar",
            variant: "destructive",
          });
          return;
        }

        const selectedFieldsForTags = selectedFieldsForConsolidation
          .map((fieldId) => allAvailableFields.find((f) => f.id === fieldId))
          .filter(Boolean) as ReportField[];

        const generatedTags = generateTagsFromFields(selectedFieldsForTags);

          updatedFields[editingFieldIndex] = {
          ...fieldToSave,
          consolidatedFields: consolidatedFieldNames,
            consolidatedFieldIds: mappedConsolidatedFieldIds,
          consolidatedSeparator: consolidatedSeparator,
          consolidatedFieldFormats: consolidatedFieldFormatsArray,
          originalTags: generatedTags,
          description: `Campo consolidado: ${selectedFieldsData
            .map((f) => f?.displayName)
            .join(` ${consolidatedSeparator} `)}`,
        };
      } else {
        const oldField = fields[editingFieldIndex];

        if (oldField.isCalculated) {
          if (
            !oldField.calculatedFieldIds ||
            oldField.calculatedFieldIds.length === 0
          ) {
            toast({
              title: "Error",
              description:
                "El campo calculado no tiene campos fuente definidos. Por favor, recréelo.",
              variant: "destructive",
            });
            return;
          }

          updatedFields[editingFieldIndex] = {
            ...oldField,
            displayName: fieldToSave.displayName,
            headerTransform: fieldToSave.headerTransform,
            format: fieldToSave.format,
            timeFormat: fieldToSave.timeFormat,
            isCalculated: true,
            calculatedFieldIds: oldField.calculatedFieldIds,
            calculatedFields: oldField.calculatedFields || [],
            calculationType: oldField.calculationType || CalculationType.SUM,
            formula: oldField.formula,
          };
        } else {
          const editedFieldId = oldField.id;
          const oldFieldId = oldField.id;
          const newFieldId = fieldToSave.id || oldFieldId;
          
          updatedFields[editingFieldIndex] = {
            ...oldField,
            displayName: fieldToSave.displayName,
            headerTransform: fieldToSave.headerTransform || oldField.headerTransform || "DEFAULT",
            format: fieldToSave.format,
            timeFormat: fieldToSave.timeFormat,
            id: editedFieldId,
          };
          
          const campoFuenteNombre = oldField.name || oldField.displayName;
          const campoFuenteNombreAnterior = oldField.displayName || oldField.name;
          
          const camposCalculadosAfectados = updatedFields
            .map((f, idx) => ({ field: f, index: idx }))
            .filter(({ field }) => {
              if (!field.isCalculated || !field.calculatedFieldIds) return false;
              
              if (field.calculatedFieldIds.includes(editedFieldId)) {
                return true;
              }
              
              if (field.calculatedFields && campoFuenteNombre) {
                const nombresCoinciden = field.calculatedFields.includes(campoFuenteNombre) || 
                                          field.calculatedFields.includes(campoFuenteNombreAnterior);
                if (nombresCoinciden) return true;
              }
              
              if (campoFuenteNombre) {
                const algunIdCorrespondeAlCampoFuente = field.calculatedFieldIds.some(id => {
                  const campoConEsteId = updatedFields.find(f => f.id === id);
                  return campoConEsteId && 
                         (campoConEsteId.name === campoFuenteNombre || 
                          campoConEsteId.displayName === campoFuenteNombre ||
                          campoConEsteId.name === campoFuenteNombreAnterior ||
                          campoConEsteId.displayName === campoFuenteNombreAnterior);
                });
                if (algunIdCorrespondeAlCampoFuente) return true;
              }
              
              return false;
            });
          
          if (camposCalculadosAfectados.length > 0) {
            camposCalculadosAfectados.forEach(({ field, index }) => {
              if (field.calculatedFieldIds) {
                const idCorrecto = editedFieldId;
                
                const updatedCalculatedFieldIds = field.calculatedFieldIds.map(id => {
                  const campoConEsteId = updatedFields.find(f => f.id === id);
                  
                  if (campoConEsteId && campoFuenteNombre && 
                      (campoConEsteId.name === campoFuenteNombre || 
                       campoConEsteId.displayName === campoFuenteNombre ||
                       campoConEsteId.name === campoFuenteNombreAnterior ||
                       campoConEsteId.displayName === campoFuenteNombreAnterior)) {
                    return idCorrecto;
                  }
                  
                  if (id === editedFieldId || id === oldFieldId || id === newFieldId) {
                    return idCorrecto;
                  }
                  
                  return id;
                });
                
                updatedFields[index] = {
                  ...field,
                  calculatedFieldIds: updatedCalculatedFieldIds,
                };
              }
            });
          }
        }
      }

      replace(updatedFields);
      handleCloseEditModal();
      toast({
        title: "Campo actualizado",
        description: `${fieldToSave.displayName} ha sido actualizado`,
      });
    }
  };

  const handleFormatChange = (
    index: number,
    format: string,
    isTimeFormat = false
  ) => {
    const updatedFields = [...fields];
    if (isTimeFormat) {
      updatedFields[index] = {
        ...updatedFields[index],
        timeFormat: format,
      };
    } else {
      updatedFields[index] = {
        ...updatedFields[index],
        format: format,
      };
    }
    replace(updatedFields);
  };

  return {
    handleAddField,
    handleRemoveField,
    handleEditField,
    handleCloseEditModal,
    handleSaveFieldFormat,
    handleFormatChange,
  };
};
