import { useToast } from "@/hooks/use-toast";
import { UseFormReturn } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { AggregationType } from "../dto/modal-props.dto";
import { ReportField, ReportFormData, TotalRow, TotalRowType } from "../report.dto";

interface UseTotalRowsParams {
  fields: ReportField[];
  watch: UseFormReturn<ReportFormData>["watch"];
  setValue: UseFormReturn<ReportFormData>["setValue"];
  totalRowLabel: string;
  totalRowType: TotalRowType;
  totalRowPosition: "top" | "bottom";
  totalRowShowLabel: boolean;
  totalRowHeaderTransform: "DEFAULT" | "UPPER" | "LOWER";
  selectedFieldsForTotal: Map<string, AggregationType>;
  totalRowFieldFormats: Map<string, string>;
  totalRowGroupBy: ("employee" | "month" | "week" | "none")[];
  totalRowLabelTemplate: string;
  totalRowShowGroupContext: boolean;
  editingTotalRow: TotalRow | null;
  setTotalRowLabel: (label: string) => void;
  setTotalRowType: (type: TotalRowType) => void;
  setTotalRowPosition: (position: "top" | "bottom") => void;
  setTotalRowShowLabel: (show: boolean) => void;
  setTotalRowHeaderTransform: (transform: "DEFAULT" | "UPPER" | "LOWER") => void;
  setSelectedFieldsForTotal: (fields: Map<string, AggregationType>) => void;
  setTotalRowFieldFormats: (formats: Map<string, string>) => void;
  setTotalRowGroupBy: (groupBy: ("employee" | "month" | "week" | "none")[]) => void;
  setTotalRowLabelTemplate: (template: string) => void;
  setTotalRowShowGroupContext: (show: boolean) => void;
  setEditingTotalRow: (row: TotalRow | null) => void;
  setIsTotalRowModalOpen: (open: boolean) => void;
}

export const useTotalRows = ({
  fields,
  watch,
  setValue,
  totalRowLabel,
  totalRowType,
  totalRowPosition,
  totalRowShowLabel,
  totalRowHeaderTransform,
  selectedFieldsForTotal,
  totalRowFieldFormats,
  totalRowGroupBy,
  totalRowLabelTemplate,
  totalRowShowGroupContext,
  editingTotalRow,
  setTotalRowLabel,
  setTotalRowType,
  setTotalRowPosition,
  setTotalRowShowLabel,
  setTotalRowHeaderTransform,
  setSelectedFieldsForTotal,
  setTotalRowFieldFormats,
  setTotalRowGroupBy,
  setTotalRowLabelTemplate,
  setTotalRowShowGroupContext,
  setEditingTotalRow,
  setIsTotalRowModalOpen,
}: UseTotalRowsParams) => {
  const { toast } = useToast();

  const handleCreateTotalRow = (data?: {
    label: string;
    type: TotalRowType;
    position: "top" | "bottom";
    showLabel: boolean;
    headerTransform: "DEFAULT" | "UPPER" | "LOWER";
    columns: Array<{
      fieldId: string;
      aggregationType: AggregationType;
      format?: string;
    }>;
  }) => {
    const label = data?.label || totalRowLabel;
    const type = data?.type || totalRowType;
    const position = data?.position || totalRowPosition;
    const showLabel = data?.showLabel ?? totalRowShowLabel;
    const headerTransform = data?.headerTransform || totalRowHeaderTransform;
    const columns = data?.columns || (() => {
      const cols: Array<{
        fieldId: string;
        aggregationType: AggregationType;
        format?: string;
      }> = [];
      selectedFieldsForTotal.forEach((aggType, fieldId) => {
        if (aggType !== "none" && aggType !== "NONE") {
          const fieldFormat = totalRowFieldFormats.get(fieldId);
          cols.push({
            fieldId,
            aggregationType: aggType,
            format: fieldFormat,
          });
        }
      });
      return cols;
    })();

    if (!label.trim()) {
      toast({
        title: "Error",
        description: "Debe ingresar un nombre para la fila de totales",
        variant: "destructive",
      });
      return;
    }

    const currentFields = watch("fields") || fields;
    const numericFields = currentFields.filter(
      (field) =>
        field.type === "number" &&
        (field.aggregationType !== "none" || field.isCalculated)
    );

    if (numericFields.length === 0) {
      toast({
        title: "Error",
        description:
          "Debe tener al menos un campo numérico con agregación para crear totales",
        variant: "destructive",
      });
      return;
    }

    if (columns.length === 0 && type === TotalRowType.CUSTOM) {
      toast({
        title: "Error",
        description:
          "Debe seleccionar al menos un campo con tipo de agregación para totales personalizados",
        variant: "destructive",
      });
      return;
    }

    const currentTotalRows = watch("totalRows") || [];
    let newTotalRow: TotalRow;

    if (editingTotalRow) {
      const columnsForTotal = type === TotalRowType.CUSTOM
        ? columns
            .filter((col) => col.aggregationType)
            .map((col) => ({
              fieldId: col.fieldId,
              aggregationType: (col.aggregationType as string).toUpperCase() as "SUM" | "AVG" | "COUNT" | "MIN" | "MAX" | "NONE",
              format: col.format,
            }))
        : numericFields.map((field) => {
            const fieldFormat =
              totalRowFieldFormats.get(field.id) || field.format;
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
                : (field.aggregationType || "SUM").toUpperCase();
            return {
              fieldId: field.id,
              aggregationType: aggType as "SUM" | "AVG" | "COUNT" | "MIN" | "MAX" | "NONE",
              format: fieldFormat,
            };
          });
      
      newTotalRow = {
        ...editingTotalRow,
        label,
        type,
        position,
        showLabel,
        headerTransform,
        columns: columnsForTotal,
        ...(totalRowGroupBy.length > 0 && { groupBy: totalRowGroupBy }),
        ...(totalRowLabelTemplate && { labelTemplate: totalRowLabelTemplate }),
        ...(totalRowShowGroupContext && { showGroupContext: totalRowShowGroupContext }),
      };

      const updatedTotalRows = currentTotalRows.map((tr) =>
        tr.id === editingTotalRow.id ? newTotalRow : tr
      );
      
      // Validar que groupBy se está incluyendo correctamente
      if (totalRowGroupBy.length > 0) {
        console.log('Guardando totalRow con groupBy:', totalRowGroupBy, 'totalRow:', newTotalRow);
      }
      
      setValue("totalRows", updatedTotalRows);
      toast({
        title: "Fila de totales actualizada",
        description: `${label} ha sido actualizada`,
      });
    } else {
      newTotalRow = {
        id: uuidv4(),
        label,
        type,
        position,
        showLabel,
        headerTransform,
        ...(totalRowGroupBy.length > 0 && { groupBy: totalRowGroupBy }),
        ...(totalRowLabelTemplate && { labelTemplate: totalRowLabelTemplate }),
        ...(totalRowShowGroupContext && { showGroupContext: totalRowShowGroupContext }),
        columns:
          type === TotalRowType.CUSTOM
            ? columns
                .filter((col) => col.aggregationType)
                .map((col) => ({
                  fieldId: col.fieldId,
                  aggregationType: (col.aggregationType as string).toUpperCase() as "SUM" | "AVG" | "COUNT" | "MIN" | "MAX" | "NONE",
                  format: col.format,
                }))
            : numericFields.map((field) => {
                const fieldFormat =
                  totalRowFieldFormats.get(field.id) || field.format;
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
                    : (field.aggregationType || "SUM").toUpperCase();
                return {
                  fieldId: field.id,
                  aggregationType: aggType as "SUM" | "AVG" | "COUNT" | "MIN" | "MAX" | "NONE",
                  format: fieldFormat,
                };
              }),
      };

      // Validar que groupBy se está incluyendo correctamente
      if (totalRowGroupBy.length > 0) {
        console.log('Creando totalRow con groupBy:', totalRowGroupBy, 'totalRow:', newTotalRow);
      }

      setValue("totalRows", [...currentTotalRows, newTotalRow]);
      toast({
        title: "Fila de totales creada",
        description: `${label} ha sido agregada`,
      });
    }

    setIsTotalRowModalOpen(false);
    setTotalRowLabel("");
    setTotalRowType(TotalRowType.SUM);
    setTotalRowPosition("bottom");
    setTotalRowShowLabel(true);
    setTotalRowHeaderTransform("DEFAULT");
    setSelectedFieldsForTotal(new Map());
    setTotalRowFieldFormats(new Map());
    setTotalRowGroupBy([]);
    setTotalRowLabelTemplate("");
    setTotalRowShowGroupContext(false);
    setEditingTotalRow(null);
  };

  const handleCloseTotalRowModal = () => {
    setIsTotalRowModalOpen(false);
    setTotalRowLabel("");
    setTotalRowType(TotalRowType.SUM);
    setTotalRowPosition("bottom");
    setTotalRowShowLabel(true);
    setTotalRowHeaderTransform("DEFAULT");
    setSelectedFieldsForTotal(new Map());
    setTotalRowGroupBy([]);
    setTotalRowLabelTemplate("");
    setTotalRowShowGroupContext(false);
    setEditingTotalRow(null);
  };

  const toggleFieldForTotal = (
    fieldId: string,
    aggregationType: "sum" | "avg" | "count" | "min" | "max" | "none"
  ) => {
    const newMap = new Map(selectedFieldsForTotal);
    if (aggregationType === "none") {
      newMap.delete(fieldId);
    } else {
      newMap.set(fieldId, aggregationType);
    }
    setSelectedFieldsForTotal(newMap);
  };

  return {
    handleCreateTotalRow,
    handleCloseTotalRowModal,
    toggleFieldForTotal,
  };
};
