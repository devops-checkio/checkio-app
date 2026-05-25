"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOLoading,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCookieSession } from "@/context/useCookieSession";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateReportTemplate,
  useGetReportTemplate,
  useUpdateReportTemplate,
} from "@/service/report-template.service";
import { handleError } from "@/utils/error";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Calculator,
  ChevronLeft,
  Loader2,
  Plus,
  PlusCircle,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  CalculatedFieldModal,
  CalculationType,
  ConsolidatedFieldModal,
  dateFormatOptions,
  datetimeFormatOptions,
  EditFieldModal,
  evaluateCustomFormula,
  FieldCategoryCard,
  formatFieldValue,
  getFormatOptionsForField,
  getReportJson,
  SortableField,
  timeFormatOptions,
  useCalculatedFields,
  useConsolidatedFields,
  useReportFields,
  useReportTemplateLoader,
  useTotalRows
} from "../_components";
import {
  CreateReportTemplateDto,
  ReportTemplateColumnDto,
  ReportTemplateTotalRowDto,
} from "../_components/report-template.dto";
import {
  FIELD_CATEGORIES,
  FieldCategory,
  ReportField,
  ReportFormData,
  SAMPLE_DATA,
  TotalRow,
  TotalRowType
} from "../_components/report.dto";

export default function CreateReportPage() {
  const t = useTranslations("reports.manager");
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");
  const { getTemplateUser } = useCookieSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<ReportField | null>(null);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(
    null
  );
  const [isConsolidatedModalOpen, setIsConsolidatedModalOpen] = useState(false);
  const [consolidatedFieldName, setConsolidatedFieldName] = useState("");
  const [consolidatedHeaderTransform, setConsolidatedHeaderTransform] = useState<"DEFAULT" | "UPPER" | "LOWER">("DEFAULT");
  const [selectedFieldsForConsolidation, setSelectedFieldsForConsolidation] =
    useState<string[]>([]);
  const [consolidatedSeparator, setConsolidatedSeparator] = useState(" ");
  const [consolidatedFieldsSearchTerm, setConsolidatedFieldsSearchTerm] =
    useState("");
  const [consolidatedFieldFormats, setConsolidatedFieldFormats] = useState<
    Map<string, { format?: string; timeFormat?: string }>
  >(new Map());
  const [expandedFormatFields, setExpandedFormatFields] = useState<Set<string>>(
    new Set()
  );
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const prevShowPreviewRef = useRef(false);
  const [isTotalRowModalOpen, setIsTotalRowModalOpen] = useState(false);
  const [editingTotalRow, setEditingTotalRow] = useState<TotalRow | null>(null);
  const [totalRowLabel, setTotalRowLabel] = useState("");
  const [totalRowType, setTotalRowType] = useState<TotalRowType>(
    TotalRowType.SUM
  );
  const [totalRowPosition, setTotalRowPosition] = useState<"top" | "bottom">(
    "bottom"
  );
  const [totalRowShowLabel, setTotalRowShowLabel] = useState(true);
  const [totalRowHeaderTransform, setTotalRowHeaderTransform] = useState<"DEFAULT" | "UPPER" | "LOWER">("DEFAULT");
  const [selectedFieldsForTotal, setSelectedFieldsForTotal] = useState<
    Map<string, "SUM" | "AVG" | "COUNT" | "MIN" | "MAX" | "NONE" | "sum" | "avg" | "count" | "min" | "max" | "none">
  >(new Map());
  const [totalRowFieldFormats, setTotalRowFieldFormats] = useState<
    Map<string, string>
  >(new Map());
  const [totalRowGroupBy, setTotalRowGroupBy] = useState<
    ("employee" | "month" | "week" | "none")[]
  >([]);
  const [totalRowLabelTemplate, setTotalRowLabelTemplate] = useState("");
  const [totalRowShowGroupContext, setTotalRowShowGroupContext] =
    useState(false);
  const [isCalculatedFieldModalOpen, setIsCalculatedFieldModalOpen] =
    useState(false);
  const [calculatedFieldName, setCalculatedFieldName] = useState("");
  const [calculatedHeaderTransform, setCalculatedHeaderTransform] = useState<"DEFAULT" | "UPPER" | "LOWER">("DEFAULT");
  const [selectedFieldsForCalculation, setSelectedFieldsForCalculation] =
    useState<string[]>([]);
  const [calculationType, setCalculationType] = useState<CalculationType>(
    CalculationType.SUM
  );
  const [customFormula, setCustomFormula] = useState<string>("");
  const [calculatedFieldFormat, setCalculatedFieldFormat] = useState<
    string | undefined
  >("minutes");
  const [editingCalculatedField, setEditingCalculatedField] =
    useState<ReportField | null>(null);
  const [editingCalculatedFieldIndex, setEditingCalculatedFieldIndex] =
    useState<number | null>(null);

  const { mutate: createTemplate, isPending: isCreating } =
    useCreateReportTemplate();
  const { mutate: updateTemplate, isPending: isUpdating } =
    useUpdateReportTemplate();
  const { data: existingTemplate, isLoading: isLoadingExisting } =
    useGetReportTemplate(templateId || "");

  const { control, handleSubmit, watch, setValue, getValues, register } =
    useForm<ReportFormData>({
      defaultValues: {
        name: "",
        description: "",
        headerTransform: "DEFAULT",
        fields: [],
        totalRows: [],
      },
    });

  const { fields, append, remove, move, replace } = useFieldArray({
    control,
    name: "fields",
  });

  useReportTemplateLoader({
    existingTemplate: existingTemplate || undefined,
    templateId,
    setValue,
    replace,
  });

  const {
    handleAddField,
    handleRemoveField,
    handleEditField,
    handleCloseEditModal,
    handleSaveFieldFormat,
    handleFormatChange,
  } = useReportFields({
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
    templateColumns: existingTemplate?.columns,
  });

  const {
    handleCreateTotalRow,
    handleCloseTotalRowModal,
    toggleFieldForTotal,
  } = useTotalRows({
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
  });

  const {
    handleCreateConsolidatedField,
    handleCloseConsolidatedModal,
    toggleFieldForConsolidation,
    moveConsolidatedFieldUp,
    moveConsolidatedFieldDown,
  } = useConsolidatedFields({
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
  });

  const {
    handleCreateCalculatedField,
    handleCloseCalculatedFieldModal,
    handleCreateCalculatedFieldFromModal,
    toggleFieldForCalculation,
  } = useCalculatedFields({
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
  });


  useEffect(() => {
    const justOpened = showPreview && !prevShowPreviewRef.current;
    prevShowPreviewRef.current = showPreview;

    if (justOpened && previewRef.current && fields.length > 0) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (previewRef.current) {
            const element = previewRef.current;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - 100;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        }, 200);
      });
    }
  }, [showPreview, fields.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);
      move(oldIndex, newIndex);
    }
  };






  const getFormatOptions = (field: ReportField) => {
    return getFormatOptionsForField({ field, reportFields: fields });
  };

  const onSubmit = async (data: ReportFormData) => {
    if (!data.name || data.name.trim() === "") {
      toast({
        title: t("create.validation.nameRequired"),
        description: t("create.validation.nameRequired"),
        variant: "destructive",
      });
      return;
    }

    if (!data.fields || data.fields.length === 0) {
      toast({
        title: t("create.validation.fieldsRequired"),
        description: t("create.validation.fieldsRequired"),
        variant: "destructive",
      });
      return;
    }

    const validateFieldIds = (fields: ReportField[]): { valid: boolean; errors: string[]; cleanedFields: ReportField[] } => {

      const errors: string[] = [];
      const allAvailableFields = Object.values(FIELD_CATEGORIES).flatMap(
        (category) => category.fields
      );

      // IDs antes de limpiar
      const allFieldIds = fields.map(f => f.id);
      const allAvailableFieldIds = allAvailableFields.map(f => f.id);

      const cleanedFields = fields.map((field) => {
        if (field.isCalculated && field.calculatedFieldIds) {
          // LOG de comparación por cada ID
          const validCalculatedFieldIds = field.calculatedFieldIds.filter((sourceId) => {
            const existsInFields = allFieldIds.includes(sourceId);
            const existsInAvailable = allAvailableFieldIds.includes(sourceId);
            if (!existsInFields && !existsInAvailable) {
              console.warn('[VALIDACIÓN][NO COINCIDE] ID inválido:', {
                fieldName: field.displayName,
                fieldId: field.id,
                invalidReferenceId: sourceId,
                calculatedFieldIds: field.calculatedFieldIds,
                allFieldIds,
                allAvailableFieldIds,
              });
              errors.push(`Campo calculado "${field.displayName}" referencia ID inexistente: ${sourceId}`);
              return false;
            }
            return true;
          });

          if (validCalculatedFieldIds.length !== field.calculatedFieldIds.length) {
            return {
              ...field,
              calculatedFieldIds: validCalculatedFieldIds,
            };
          }
        }

        if (field.isConsolidated && field.consolidatedFieldIds) {
          const validConsolidatedFieldIds = field.consolidatedFieldIds.filter((sourceId) => {
            const existsInFields = allFieldIds.includes(sourceId);
            const existsInAvailable = allAvailableFieldIds.includes(sourceId);
            if (!existsInFields && !existsInAvailable) {
              console.warn('[VALIDACIÓN][NO COINCIDE][CONSOLIDADO] ID inválido:', {
                fieldName: field.displayName,
                fieldId: field.id,
                invalidReferenceId: sourceId,
                consolidatedFieldIds: field.consolidatedFieldIds,
                allFieldIds,
                allAvailableFieldIds,
              });
              errors.push(`Campo consolidado "${field.displayName}" referencia ID inexistente: ${sourceId}`);
              return false;
            }
            return true;
          });

          if (validConsolidatedFieldIds.length !== field.consolidatedFieldIds.length) {
            return {
              ...field,
              consolidatedFieldIds: validConsolidatedFieldIds,
            };
          }
        }

        return field;
      });

      if (errors.length > 0) {
        console.error('[VALIDACIÓN][RESUMEN] Errores encontrados en referencias de campos:', errors);
      }

      return { valid: errors.length === 0, errors, cleanedFields };
    };

    // DIAGNOSTIC: snapshot the generated report JSON (what the UI shows) so
    // we can compare its column source IDs with the form `fields` used by
    // `validateFieldIds` to find mismatches.
    try {
      const _reportJsonString = getReportJsonLocal();
      const _reportJson = JSON.parse(_reportJsonString || "{}");
      console.log('[DIAGNOSTIC] reportJsonSnapshot - columns summary:',
        Array.isArray(_reportJson.columns)
          ? _reportJson.columns.map((c: any, i: number) => ({
              index: i,
              type: c?.type,
              id: c?.id ?? c?.fieldId,
              sourceFieldIds: c?.sourceFieldIds ?? c?.sourceFieldId ?? c?.fieldMapping ?? c?.calculatedFieldIds ?? null,
            }))
          : _reportJson.columns
      );
    } catch (_e) {
    }

    // y así preservar exactamente el JSON que el usuario ve en la previsualización.
    let fieldsToValidate = fields;
    let parsedReportJson: any = null;
    try {
      const _reportJsonString = getReportJsonLocal();
      parsedReportJson = JSON.parse(_reportJsonString || "{}");
      if (Array.isArray(parsedReportJson.columns)) {
        const columnSourceMap: Record<string, string[] | null> = Object.fromEntries(
          parsedReportJson.columns.map((c: any) => [c?.id, c?.sourceFieldIds ?? null])
        );

        const mapped = fields.map((f) => {
          if (f.isCalculated) {
            const src = columnSourceMap[f.id];
            if (Array.isArray(src) && src.length > 0) {
              const oldIds = f.calculatedFieldIds || [];
              const same = oldIds.length === src.length && src.every((id: string, i: number) => id === oldIds[i]);
              if (!same) {
                return { ...f, calculatedFieldIds: src };
              }
            }
          }
          return f;
        });

        const changed = mapped.some((m: any, idx: number) => m !== fields[idx]);
        if (changed) {
          // Actualizamos el form con los IDs remapeados para que la validación
          // reconozca las referencias tal como aparecen en la previsualización.
          replace(mapped);
          fieldsToValidate = mapped;
        }
      }
    } catch (_e) {
      // si falla el parseo, continuar con los fields actuales
      parsedReportJson = null;
    }

    const validation = validateFieldIds(fieldsToValidate);
    if (!validation.valid) {
      if (validation.cleanedFields.length > 0) {
        replace(validation.cleanedFields);
        toast({
          title: t("create.validation.cleanedReferences"),
          description: t("create.validation.cleanedReferences"),
          variant: "default",
        });
        return;
      }
      
      toast({
        title: t("create.validation.invalidReferences"),
        description: t("create.validation.invalidReferences"),
        variant: "destructive",
      });
      return;
    }

    try {
      const reportJson = parsedReportJson || JSON.parse(getReportJsonLocal());
      const templateData: CreateReportTemplateDto = {
        name: reportJson.name,
        description: reportJson.description,
        headerTransform: reportJson.headerTransform,
        reportType: reportJson.reportType as "ASSISTANCE" | "EMPLOYEE_DATA" | undefined,
        columns: reportJson.columns as ReportTemplateColumnDto[],
        totalRows: reportJson.totalRows as ReportTemplateTotalRowDto[],
      };

      if (templateId) {
        updateTemplate(
          { id: templateId, data: templateData },
          {
            onSuccess: () => {
              toast({
                title: t("toast.templateUpdated.title"),
                description: t("toast.templateUpdated.description"),
              });
              router.push("/reports/manager");
            },
            onError: (error: unknown) => {
              handleError(error, toast);
            },
          }
        );
      } else {
        createTemplate(templateData, {
          onSuccess: () => {
            toast({
              title: t("toast.templateCreated.title"),
              description: t("toast.templateCreated.description"),
            });
            router.push("/reports/manager");
          },
          onError: (error: unknown) => {
            handleError(error, toast);
          },
        });
      }
    } catch (error) {
      handleError(error, toast);
    }
  };

  const reportType = watch("reportType");
  
  const filteredCategories = Object.keys(FIELD_CATEGORIES)
    .filter((category) => {
      if (
        category === FieldCategory.POSITION ||
        category === FieldCategory.BRANCH ||
        category === FieldCategory.COMPANY
      ) {
        return false;
      }
      
      if (reportType === "EMPLOYEE_DATA" && category === FieldCategory.ATTENDANCE) {
        return false;
      }
      
      return FIELD_CATEGORIES[category as keyof typeof FIELD_CATEGORIES].title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    });

  const getColumnLetter = (index: number) => {
    return String.fromCharCode(65 + index);
  };

  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
  };

  const getReportJsonLocal = () => {
    return getReportJson(
      () => watch(),
      fields,
      () => getValues()
    );
  };

  const actions = (
    <div className="flex flex-row gap-2">
      <CHEKIOButton
        variant="secondaryBlue"
        onClick={handleTogglePreview}
      >
        {showPreview ? t("buttons.hidePreview") : t("buttons.showPreview")}
      </CHEKIOButton>
      <CHEKIOButton
        variant="primary"
        onClick={handleSubmit(onSubmit)}
        disabled={isCreating || isUpdating || isLoadingExisting}
      >
        {isCreating || isUpdating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {templateId ? t("buttons.updating") : t("buttons.creating")}
          </>
        ) : templateId ? (
          t("buttons.updateTemplate")
        ) : (
          t("buttons.createTemplate")
        )}
      </CHEKIOButton>
    </div>
  );

  return (
    <>

      {isLoadingExisting ? (
        <div className="flex justify-center py-8">
          <CHEKIOLoading
            size="lg"
            variant="modern"
            text={t("create.loading")}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Barra de acciones: Preview Excel, JSON, Guardar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CHEKIOButton
              type="button"
              variant="secondaryBlue"
              className="h-9 w-9 p-0 rounded-lg flex items-center justify-center"
              onClick={() => router.push("/reports/manager")}
              aria-label="Volver al listado de reportes"
            >
              <ChevronLeft className="h-4 w-4" />
            </CHEKIOButton>
            {actions}
          </div>

          {/* Información del Reporte */}
          <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("create.reportInfo")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("create.fields.reportName")}
              </label>
              <CHEKIOInput
                type="text"
                placeholder={t("create.fields.reportNamePlaceholder")}
                {...register("name", { required: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("create.fields.description")}
              </label>
              <CHEKIOInput
                type="text"
                placeholder={t("create.fields.descriptionPlaceholder")}
                {...register("description")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("create.fields.reportType")}
              </label>
              <CHEKIOSelect
                value={watch("reportType") || ""}
                onValueChange={(value) => setValue("reportType", value as "ASSISTANCE" | "EMPLOYEE_DATA" | undefined)}
              >
                <CHEKIOSelectTrigger>
                  <CHEKIOSelectValue placeholder={t("create.fields.reportTypePlaceholder")} />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  <CHEKIOSelectItem value="EMPLOYEE_DATA">{t("reportTypes.EMPLOYEE_DATA")}</CHEKIOSelectItem>
                  <CHEKIOSelectItem value="ASSISTANCE">{t("reportTypes.ASSISTANCE")}</CHEKIOSelectItem>
                </CHEKIOSelectContent>
              </CHEKIOSelect>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              {t("create.fields.headerTransform")}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setValue("headerTransform", "DEFAULT")}
                className={`px-3 py-1.5 border rounded transition-all text-xs ${
                  (watch("headerTransform") || "DEFAULT") === "DEFAULT"
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-300 hover:border-gray-400 bg-white text-gray-600"
                }`}
              >
                {t("modals.totalRow.default")}
              </button>
              <button
                type="button"
                onClick={() => setValue("headerTransform", "UPPER")}
                className={`px-3 py-1.5 border rounded transition-all text-xs ${
                  watch("headerTransform") === "UPPER"
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-300 hover:border-gray-400 bg-white text-gray-600"
                }`}
              >
                {t("modals.totalRow.upper")}
              </button>
              <button
                type="button"
                onClick={() => setValue("headerTransform", "LOWER")}
                className={`px-3 py-1.5 border rounded transition-all text-xs ${
                  watch("headerTransform") === "LOWER"
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-300 hover:border-gray-400 bg-white text-gray-600"
                }`}
              >
                {t("modals.totalRow.lower")}
              </button>
              <span className="text-xs text-gray-500 ml-2">
                {t("create.fields.headerTransformDescription")}
              </span>
            </div>
          </div>
        </div>

        {/* Move creation buttons above the card */}
        <div className="mt-4 flex gap-2">
          <CHEKIOButton
            type="button"
            variant="secondaryBlue"
            onClick={() => setIsConsolidatedModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("buttons.createConsolidatedField")}
          </CHEKIOButton>
          <CHEKIOButton
            type="button"
            variant="secondaryBlue"
            onClick={() => {
              setCalculatedFieldName("");
              setSelectedFieldsForCalculation([]);
              setCalculationType(CalculationType.SUM);
              setCalculatedFieldFormat("minutes");
              setIsCalculatedFieldModalOpen(true);
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {t("buttons.createCalculatedField")}
          </CHEKIOButton>
          <CHEKIOButton
            type="button"
            variant="secondaryBlue"
            onClick={() => {
              setEditingTotalRow(null);
              setTotalRowLabel("");
              setTotalRowType(TotalRowType.SUM);
              setTotalRowPosition("bottom");
              setTotalRowShowLabel(true);
              setTotalRowHeaderTransform("DEFAULT");
              setTotalRowGroupBy([]);
              setTotalRowLabelTemplate("");
              setTotalRowShowGroupContext(false);
              setSelectedFieldsForTotal(new Map());
              setIsTotalRowModalOpen(true);
            }}
          >
            <Calculator className="h-4 w-4 mr-2" />
            {t("buttons.addTotalRow")}
          </CHEKIOButton>
        </div>
        {/* ...existing code... */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full min-h-[650px]">
          {/* Panel Izquierdo - Categorías de Campos */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 p-4 h-full flex flex-col min-h-[530px] max-h-[800px]">
              <div className="mb-4">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <CHEKIOInput
                    type="search"
                    placeholder={t("create.fields.searchCategoriesPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-4">
                  {filteredCategories.map((category) => (
                    <FieldCategoryCard
                      key={category}
                      category={category as keyof typeof FIELD_CATEGORIES}
                      onAddField={handleAddField}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Panel Central - Campos Seleccionados */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 p-6 h-full flex flex-col min-h-[530px] max-h-[800px]">
              {/* Make the scroll area fill available space */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("create.fields.reportFields")}
                </h3>
                <Badge variant="secondary">
                  {t("table.fieldsSelected", { count: fields.length })}
                </Badge>
              </div>

              {fields.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <div className="text-center">
                    <p className="text-lg font-medium mb-2">
                      {t("table.noFieldsSelected")}
                    </p>
                    <p className="text-sm">
                      {t("table.noFieldsSelectedDescription")}
                    </p>
                  </div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={fields.map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ScrollArea className="flex-1 min-h-0">
                      <div className="space-y-3 mt-2 mx-2 mb-4">
                        {fields.map((field, index) => (
                          <SortableField
                            key={field.id}
                            field={field}
                            index={index}
                            onRemove={handleRemoveField}
                            onEdit={handleEditField}
                            onFormatChange={handleFormatChange}
                            dateFormatOptions={dateFormatOptions}
                            timeFormatOptions={timeFormatOptions}
                            datetimeFormatOptions={datetimeFormatOptions}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </SortableContext>
                </DndContext>
              )}
            </div>
            {/* ...existing code... */}
            {watch("totalRows") && watch("totalRows")!.length > 0 && (
              <div className="mt-4 bg-gray-50 border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {t("create.totalRows.configured")}
                </h4>
                <div className="space-y-2">
                  {watch("totalRows")!.map((totalRow, index) => (
                    <div
                      key={totalRow.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {totalRow.type}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900">
                          {totalRow.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({totalRow.position === "top" ? t("create.totalRows.top") : t("create.totalRows.bottom")})
                        </span>
                        <span className="text-xs text-gray-500">
                          {t("create.totalRows.columns", { count: totalRow.columns.length })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CHEKIOButton
                          type="button"
                          variant="secondaryBlue"
                          size="sm"
                          onClick={() => {
                            setEditingTotalRow(totalRow);
                            setTotalRowLabel(totalRow.label);
                            setTotalRowType(totalRow.type);
                            setTotalRowPosition(totalRow.position);
                            setTotalRowShowLabel(totalRow.showLabel);
                            setTotalRowHeaderTransform(totalRow.headerTransform || "DEFAULT");
                            setTotalRowGroupBy(
                              totalRow.groupBy && Array.isArray(totalRow.groupBy) && totalRow.groupBy.length > 0
                                ? totalRow.groupBy
                                : []
                            );
                            setTotalRowLabelTemplate(totalRow.labelTemplate || "");
                            setTotalRowShowGroupContext(totalRow.showGroupContext || false);
                            const fieldsMap = new Map<
                              string,
                              "sum" | "avg" | "count" | "min" | "max" | "none"
                            >();
                            const formatsMap = new Map<string, string>();
                            const currentFields = watch("fields") || fields;
                            const allAvailableFields = Object.values(FIELD_CATEGORIES).flatMap(
                              (category) => category.fields
                            );
                            
                            totalRow.columns.forEach((col) => {
                              if (!col.aggregationType) return;
                              
                              let matchingField = currentFields.find((f) => f.id === col.fieldId);
                              
                              if (!matchingField) {
                                const fieldFromCategories = allAvailableFields.find((cf) => cf.id === col.fieldId);
                                
                                if (fieldFromCategories) {
                                  matchingField = currentFields.find((f) => 
                                    f.name === fieldFromCategories.name && 
                                    f.table === fieldFromCategories.table &&
                                    !f.isConsolidated && 
                                    !f.isCalculated
                                  );
                                }
                              }
                              
                              if (matchingField) {
                                const aggTypeLower = (col.aggregationType as string).toLowerCase() as "sum" | "avg" | "count" | "min" | "max" | "none";
                                fieldsMap.set(matchingField.id, aggTypeLower);
                                if (col.format) {
                                  formatsMap.set(matchingField.id, col.format);
                                }
                              }
                            });
                            setSelectedFieldsForTotal(fieldsMap);
                            setTotalRowFieldFormats(formatsMap);
                            setIsTotalRowModalOpen(true);
                          }}
                        >
                          <Settings size={14} />
                          {t("buttons.editTotalRow")}
                        </CHEKIOButton>
                        <CHEKIOButton
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const currentTotalRows = watch("totalRows") || [];
                            const updatedTotalRows = currentTotalRows.filter(
                              (tr) => tr.id !== totalRow.id
                            );
                            setValue("totalRows", updatedTotalRows);
                            toast({
                              title: t("create.totalRows.deleted"),
                              description: t("create.totalRows.deletedDescription", { label: totalRow.label }),
                            });
                          }}
                        >
                          <Trash2 size={14} />
                          {t("buttons.deleteTotalRow")}
                        </CHEKIOButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview del Reporte */}
        {showPreview && fields.length > 0 && (
          <div ref={previewRef} className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("create.preview.title")}
            </h3>
            <div className="border border-gray-300 rounded-sm overflow-hidden shadow-md bg-white">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                <span className="text-gray-700 text-sm font-medium">
                  {t("create.preview.previewLabel")}
                </span>
              </div>
              <div className="bg-white">
                <CHEKIOTable>
                  <CHEKIOTableHeader>
                    <tr>
                      {(watch("fields") || fields).map((field, index) => (
                        <CHEKIOTableHead
                          key={field.id}
                          className="bg-gray-600 text-white font-semibold border-r border-gray-500 last:border-r-0 text-sm px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-calibri text-white">{field.displayName}</span>
                            <Badge
                              variant="outline"
                              className="text-xs bg-gray-500 text-white border-gray-400 font-normal"
                            >
                              {getColumnLetter(index)}
                            </Badge>
                          </div>
                        </CHEKIOTableHead>
                      ))}
                    </tr>
                  </CHEKIOTableHeader>
                  <CHEKIOTableBody>
                    {(() => {
                      const previewFields = fields;
                      const totalRows = watch("totalRows") || [];
                      // Reconstruir columnas de totalRows para tipos SUM/AVG/etc
                      const reconstructTotalRowColumns = (totalRow: TotalRow, fields: ReportField[]): TotalRow => {
                        if (totalRow.type === TotalRowType.CUSTOM) {
                          return totalRow;
                        }

                        const numericFields = fields.filter(
                          (field) =>
                            field.type === "number" &&
                            (field.aggregationType !== "none" || field.isCalculated) &&
                            !field.isConsolidated
                        );

                        const reconstructedColumns = numericFields.map((field) => {
                          const aggType =
                            totalRow.type === TotalRowType.SUM
                              ? "SUM"
                              : totalRow.type === TotalRowType.AVG
                              ? "AVG"
                              : totalRow.type === TotalRowType.COUNT
                              ? "COUNT"
                              : totalRow.type === TotalRowType.MIN
                              ? "MIN"
                              : totalRow.type === TotalRowType.MAX
                              ? "MAX"
                              : "SUM";

                          return {
                            fieldId: field.id,
                            aggregationType: aggType as "SUM" | "AVG" | "COUNT" | "MIN" | "MAX" | "NONE",
                            format: field.format,
                          };
                        });

                        return {
                          ...totalRow,
                          columns: reconstructedColumns,
                        };
                      };

                      const reconstructedTotalRows = (watch("totalRows") || []).map((tr) => {
                        const reconstructed = reconstructTotalRowColumns(tr, previewFields);
                        return {
                          ...reconstructed,
                          groupBy: tr.groupBy,
                          labelTemplate: tr.labelTemplate,
                          showGroupContext: tr.showGroupContext,
                        };
                      });
                      
                      const groupedTotalRows = reconstructedTotalRows.filter(
                        (tr) => {
                          if (!tr.groupBy || !Array.isArray(tr.groupBy) || tr.groupBy.length === 0) {
                            return false;
                          }
                          const validGroups = ["employee", "month", "week"];
                          return tr.groupBy.some(g => validGroups.includes(g));
                        }
                      );
                      
                      const finalTotalRows = reconstructedTotalRows.filter(
                        (tr) =>
                          !tr.groupBy ||
                          tr.groupBy.length === 0 ||
                          (tr.groupBy.length === 1 && tr.groupBy[0] === "none")
                      );
                      
                      const topTotalRows = finalTotalRows.filter(
                        (tr) => tr.position === "top"
                      );
                      const bottomTotalRows = finalTotalRows.filter(
                        (tr) => tr.position === "bottom"
                      );
                      const sampleData = SAMPLE_DATA.slice(0, 3);
                      
                      const calculateWeekNumber = (year: number, month: number, day: number): number => {
                        const date = DateTime.fromObject({ year, month, day });
                        return date.weekNumber;
                      };
                      
                      const getGroupKey = (r: Record<string, unknown>, groupBy: string[]) => {
                        const keys: string[] = [];
                        
                        if (groupBy.includes("employee")) {
                          const firstName = (r.firstName as string) || "";
                          const lastName = (r.lastName as string) || "";
                          const secondLastName = (r.secondLastName as string) || "";
                          const key = `employee:${firstName}|${lastName}|${secondLastName}`;
                          keys.push(key);
                        }
                        
                        const assistance = r.Assistance as Record<string, unknown> | Record<string, unknown>[] | undefined;
                        if (assistance) {
                          const assistanceObj = Array.isArray(assistance) ? assistance[0] : assistance;
                          
                          if (groupBy.includes("month")) {
                            const year = (assistanceObj?.year as number) || 0;
                            const month = (assistanceObj?.month as number) || 0;
                            keys.push(`month:${year}-${month}`);
                          }
                          
                          if (groupBy.includes("week")) {
                            const year = (assistanceObj?.year as number) || 0;
                            const month = (assistanceObj?.month as number) || 0;
                            const day = (assistanceObj?.day as number) || 0;
                            if (year > 0 && month > 0 && day > 0) {
                              const weekNumber = calculateWeekNumber(year, month, day);
                              keys.push(`week:${year}-W${weekNumber}`);
                            } else {
                              keys.push(`week:${year}-${month}-${day}`);
                            }
                          }
                        } else {
                          if (groupBy.includes("month")) {
                            const year = (r.year as number) || 0;
                            const month = (r.month as number) || 0;
                            keys.push(`month:${year}-${month}`);
                          }
                          
                          if (groupBy.includes("week")) {
                            const year = (r.year as number) || 0;
                            const month = (r.month as number) || 0;
                            const day = (r.day as number) || 0;
                            if (year > 0 && month > 0 && day > 0) {
                              const weekNumber = calculateWeekNumber(year, month, day);
                              keys.push(`week:${year}-W${weekNumber}`);
                            } else {
                              keys.push(`week:${year}-${month}-${day}`);
                            }
                          }
                        }
                        
                        const result = keys.join("|");
                        return result || "default";
                      };

                      type SampleDataRow = typeof SAMPLE_DATA[number];
                      
                      const getCalculatedFieldNumericValue = (
                        field: ReportField,
                        row: SampleDataRow,
                        rowIndex: number
                      ): number | null => {
                        if (!field.isCalculated || !field.calculatedFieldIds || field.calculatedFieldIds.length === 0) {
                          return null;
                        }

                        const allFields = Object.values(FIELD_CATEGORIES).flatMap(
                          (category) => category.fields
                        );

                        const calculatedValues = field.calculatedFieldIds
                          .map((fieldId) => {
                            let sourceField = previewFields.find((f) => f.id === fieldId);
                            if (!sourceField) {
                              sourceField = allFields.find((f) => f.id === fieldId);
                            }

                            if (!sourceField || sourceField.type !== "number") {
                              return null;
                            }

                            let sourceRawValue: string | number | boolean | null | undefined = undefined;

                            if (sourceField.category === FieldCategory.OVERTIME) {
                              const overtimeKey = `overtime_${sourceField.name}` as keyof typeof row;
                              const rawValue = row[overtimeKey];
                              if (
                                typeof rawValue === "number" ||
                                typeof rawValue === "string" ||
                                typeof rawValue === "boolean"
                              ) {
                                sourceRawValue = rawValue;
                              }
                              if (sourceRawValue === undefined || sourceRawValue === null) {
                                const overtimeExamples: Record<string, number[]> = {
                                  aditionHoursBeforeMinutes: [300, 0, 300],
                                  aditionHoursAfterMinutes: [180, 240, 90],
                                };
                                const exampleValues = overtimeExamples[sourceField.name] || [0];
                                sourceRawValue = exampleValues[rowIndex] || 0;
                              }
                            } else if (sourceField.category === FieldCategory.HOLIDAY) {
                              const holidayKey = `holiday_${sourceField.name}` as keyof typeof row;
                              const rawValue = row[holidayKey];
                              if (
                                typeof rawValue === "number" ||
                                typeof rawValue === "string" ||
                                typeof rawValue === "boolean"
                              ) {
                                sourceRawValue = rawValue;
                              }
                            } else {
                              const rawValue = row[sourceField.name as keyof typeof row];
                              if (
                                typeof rawValue === "number" ||
                                typeof rawValue === "string" ||
                                typeof rawValue === "boolean"
                              ) {
                                sourceRawValue = rawValue;
                              }
                            }

                            return typeof sourceRawValue === "number" ? sourceRawValue : null;
                          })
                          .filter((v): v is number => v !== null && typeof v === "number");

                        if (calculatedValues.length === 0) {
                          return null;
                        }

                        let calculatedResult: number;
                        if (
                          field.calculationType === CalculationType.CUSTOM &&
                          field.formula &&
                          field.formula.trim() !== ""
                        ) {
                          const fieldNames = field.calculatedFields || [];
                          calculatedResult = evaluateCustomFormula({
                            formula: field.formula,
                            values: calculatedValues,
                            fieldNames,
                          });
                        } else {
                          switch (field.calculationType || CalculationType.SUM) {
                            case CalculationType.SUM:
                              calculatedResult = calculatedValues.reduce((a, b) => a + b, 0);
                              break;
                            case CalculationType.SUBTRACT:
                              calculatedResult = calculatedValues.reduce((a, b) => a - b);
                              break;
                            case CalculationType.MULTIPLY:
                              calculatedResult = calculatedValues.reduce((a, b) => a * b, 1);
                              break;
                            case CalculationType.DIVIDE:
                              calculatedResult =
                                calculatedValues.length > 1
                                  ? calculatedValues.reduce((a, b) => a / b)
                                  : calculatedValues[0];
                              break;
                            case CalculationType.AVERAGE:
                              calculatedResult =
                                calculatedValues.reduce((a, b) => a + b, 0) / calculatedValues.length;
                              break;
                            default:
                              calculatedResult = calculatedValues.reduce((a, b) => a + b, 0);
                          }
                        }

                        return calculatedResult;
                      };

                      const calculateTotal = (
                        field: ReportField,
                        totalRow: TotalRow,
                        dataRows?: typeof sampleData
                      ): string => {
                        const column = totalRow.columns.find(
                          (col) => col.fieldId === field.id
                        );
                        
                        if (!column) {
                          return "";
                        }
                        
                        const normalizedAggType = column.aggregationType?.toLowerCase() || "";
                        if (normalizedAggType === "none") {
                          return "";
                        }

                        const dataToUse = dataRows || sampleData;
                        const values: number[] = [];
                        dataToUse.forEach((row, rowIndex) => {
                          let rawValue: string | number | boolean | null | undefined = undefined;

                          if (field.isConsolidated) {
                            return;
                          }

                          if (field.isCalculated) {
                            const calculatedValue = getCalculatedFieldNumericValue(field, row, rowIndex);
                            if (calculatedValue !== null) {
                              rawValue = calculatedValue;
                            } else {
                              return;
                            }
                          } else if (field.category === FieldCategory.OVERTIME) {
                            const overtimeKey = `overtime_${field.name}` as keyof typeof row;
                            const rawValueFromRow = row[overtimeKey];
                            if (
                              typeof rawValueFromRow === "number" ||
                              typeof rawValueFromRow === "string" ||
                              typeof rawValueFromRow === "boolean"
                            ) {
                              rawValue = rawValueFromRow;
                            }
                            if (rawValue === undefined || rawValue === null) {
                              const overtimeExamples: Record<string, number[]> = {
                                aditionHoursBeforeMinutes: [300, 0, 300],
                                aditionHoursAfterMinutes: [180, 240, 90],
                              };
                              const exampleValues = overtimeExamples[field.name] || [0];
                              rawValue = exampleValues[rowIndex] || 0;
                            }
                            
                          } else if (field.category === FieldCategory.ABSENCE) {
                            const absenceExamples = [
                              {
                                startDate: "2024-01-15",
                                endDate: "2024-01-29",
                                status: "APPROVED",
                                absenceType: "Vacaciones",
                                reason: "Vacaciones de verano",
                                totalDays: 15,
                              },
                              {
                                startDate: "2024-01-10",
                                endDate: "2024-01-12",
                                status: "APPROVED",
                                absenceType: "Enfermedad",
                                reason: "Gripe",
                                totalDays: 3,
                              },
                              {
                                startDate: "2024-01-20",
                                endDate: "2024-01-20",
                                status: "PENDING",
                                absenceType: "Permiso",
                                reason: "Permiso médico",
                                totalDays: 1,
                              },
                            ];
                            const example =
                              absenceExamples[rowIndex] || absenceExamples[0];
                            if (
                              field.name === "startDate" ||
                              field.name === "endDate" ||
                              field.name === "status" ||
                              field.name === "absenceType" ||
                              field.name === "reason" ||
                              field.name === "totalDays"
                            ) {
                              rawValue = example[field.name as keyof typeof example];
                            } else {
                              const rawValueFromRow = row[field.name as keyof typeof row];
                              if (
                                typeof rawValueFromRow === "number" ||
                                typeof rawValueFromRow === "string" ||
                                typeof rawValueFromRow === "boolean"
                              ) {
                                rawValue = rawValueFromRow;
                              }
                            }
                          } else if (field.category === FieldCategory.HOLIDAY) {
                            const holidayKey = `holiday_${field.name}` as keyof typeof row;
                            const rawValueFromRow = row[holidayKey];
                            if (
                              typeof rawValueFromRow === "number" ||
                              typeof rawValueFromRow === "string" ||
                              typeof rawValueFromRow === "boolean"
                            ) {
                              rawValue = rawValueFromRow;
                            }
                          } else if (field.category === FieldCategory.ATTENDANCE) {
                            const assistance = row.Assistance as Record<string, unknown> | Record<string, unknown>[] | undefined;
                            if (assistance) {
                              const assistanceObj = Array.isArray(assistance) ? assistance[0] : assistance;
                              if (field.name === "delayHours" || field.name === "earlyExitHours") {
                                const value = assistanceObj?.[field.name] as number | undefined;
                                if (value !== undefined && value !== null) {
                                  rawValue = value;
                                } else {
                                  const examples: Record<string, number[]> = {
                                    delayHours: [0.08, 0.00, 0.17],
                                    earlyExitHours: [0.00, 0.00, 0.00],
                                  };
                                  const exampleValues = examples[field.name] || [0];
                                  rawValue = exampleValues[rowIndex] || 0;
                                }
                              } else {
                                const rawValueFromRow = row[field.name as keyof typeof row];
                                if (
                                  typeof rawValueFromRow === "number" ||
                                  typeof rawValueFromRow === "string" ||
                                  typeof rawValueFromRow === "boolean"
                                ) {
                                  rawValue = rawValueFromRow;
                                }
                              }
                            } else {
                              const rawValueFromRow = row[field.name as keyof typeof row];
                              if (
                                typeof rawValueFromRow === "number" ||
                                typeof rawValueFromRow === "string" ||
                                typeof rawValueFromRow === "boolean"
                              ) {
                                rawValue = rawValueFromRow;
                              }
                            }
                          } else if (field.category === FieldCategory.SCHEDULE) {
                            if (field.name === "startTime" || field.name === "endTime") {
                              const assistance = row.Assistance as Record<string, unknown> | Record<string, unknown>[] | undefined;
                              if (assistance) {
                                const assistanceObj = Array.isArray(assistance) ? assistance[0] : assistance;
                                const schedule = assistanceObj?.Schedule as Record<string, unknown> | undefined;
                                if (schedule && schedule[field.name]) {
                                  rawValue = schedule[field.name] as string;
                                } else {
                                  const scheduleExamples: Record<string, string[]> = {
                                    startTime: ["2024-01-15T08:00:00", "2024-01-15T14:00:00", "2024-02-05T22:00:00"],
                                    endTime: ["2024-01-15T17:00:00", "2024-01-15T22:00:00", "2024-02-06T06:00:00"],
                                  };
                                  const exampleValues = scheduleExamples[field.name] || [];
                                  rawValue = exampleValues[rowIndex] || "";
                                }
                              } else {
                                const scheduleExamples: Record<string, string[]> = {
                                  startTime: ["2024-01-15T08:00:00", "2024-01-15T14:00:00", "2024-02-05T22:00:00"],
                                  endTime: ["2024-01-15T17:00:00", "2024-01-15T22:00:00", "2024-02-06T06:00:00"],
                                };
                                const exampleValues = scheduleExamples[field.name] || [];
                                rawValue = exampleValues[rowIndex] || "";
                              }
                            } else if (field.name === "totalHours") {
                            const scheduleHours = [45, 32, 40];
                            rawValue = scheduleHours[rowIndex] || 45;
                          } else {
                            const rawValueFromRow = row[field.name as keyof typeof row];
                            if (
                              typeof rawValueFromRow === "number" ||
                              typeof rawValueFromRow === "string" ||
                              typeof rawValueFromRow === "boolean"
                            ) {
                              rawValue = rawValueFromRow;
                            }
                          }
                          } else {
                            const rawValueFromRow = row[field.name as keyof typeof row];
                            if (
                              typeof rawValueFromRow === "number" ||
                              typeof rawValueFromRow === "string" ||
                              typeof rawValueFromRow === "boolean"
                            ) {
                              rawValue = rawValueFromRow;
                            }
                          }

                          if (field.type === "time" && (field.name === "startTime" || field.name === "endTime")) {
                            if (rawValue !== undefined && rawValue !== null && typeof rawValue === "string") {
                              const timeValue = new Date(rawValue);
                              if (!isNaN(timeValue.getTime())) {
                                const hours = timeValue.getHours();
                                const minutes = timeValue.getMinutes();
                                const totalMinutes = hours * 60 + minutes;
                                values.push(totalMinutes);
                              }
                            }
                          } else if (
                            rawValue !== undefined &&
                            rawValue !== null &&
                            typeof rawValue === "number"
                          ) {
                            values.push(rawValue);
                          }
                        });

                        if (values.length === 0) {
                          return "";
                        }

                        const aggType = (column.aggregationType || "").toLowerCase();
                        const format = column.format || field.format || "";
                        const isTimeField = field.type === "time" && (field.name === "startTime" || field.name === "endTime");
                        
                        let result: number;
                        switch (aggType) {
                          case "sum":
                            result = values.reduce((a, b) => a + b, 0);
                            if (isTimeField) {
                              const totalMinutes = result;
                              const hours = Math.floor(totalMinutes / 60) % 24;
                              const minutes = totalMinutes % 60;
                              result = hours * 60 + minutes;
                            }
                            break;
                          case "avg":
                            result = values.reduce((a, b) => a + b, 0) / values.length;
                            if (isTimeField) {
                              const avgMinutes = result;
                              const hours = Math.floor(avgMinutes / 60) % 24;
                              const minutes = Math.round(avgMinutes % 60);
                              result = hours * 60 + minutes;
                            }
                            break;
                          case "count":
                            result = values.length;
                            break;
                          case "min":
                            result = Math.min(...values);
                            break;
                          case "max":
                            result = Math.max(...values);
                            break;
                          default:
                            return "";
                        }
                        

                        const fieldWithFormat: ReportField = {
                          ...field,
                          format: isTimeField ? "time" : (column.format || field.format),
                          isCalculated: false,
                        };

                        if (isTimeField && (aggType === "sum" || aggType === "avg" || aggType === "min" || aggType === "max")) {
                          const totalMinutes = result;
                          const hours = Math.floor(totalMinutes / 60) % 24;
                          const minutes = totalMinutes % 60;
                          const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
                          return formatFieldValue(
                            timeString,
                            fieldWithFormat,
                            {},
                            0,
                            Object.values(FIELD_CATEGORIES).flatMap(
                              (category) => category.fields
                            ),
                            previewFields
                          );
                        }

                        return formatFieldValue(
                          result,
                          fieldWithFormat,
                          {},
                          0,
                          Object.values(FIELD_CATEGORIES).flatMap(
                            (category) => category.fields
                          ),
                          previewFields
                        );
                      };

                      return (
                        <>
                          {topTotalRows.map((totalRow) => (
                            <CHEKIOTableRow
                              key={`total-top-${totalRow.id}`}
                              index={-1}
                              className="bg-gray-100 font-semibold border-b-2 border-gray-400"
                            >
                              {previewFields.map((field) => {
                                const totalValue = calculateTotal(
                                  field,
                                  totalRow
                                );
                                return (
                                  <CHEKIOTableCell
                                    key={field.id}
                                    className="border-r border-gray-300 last:border-r-0 text-sm px-3 py-2 text-gray-800"
                                  >
                                    {totalValue ||
                                      (totalRow.showLabel && field === previewFields[0]
                                        ? totalRow.label
                                        : "")}
                                  </CHEKIOTableCell>
                                );
                              })}
                            </CHEKIOTableRow>
                          ))}
                          {sampleData.map((row, rowIndex) => {
                            const previousRow = rowIndex > 0 ? sampleData[rowIndex - 1] : null;
                            
                            return (
                              <React.Fragment key={`row-${rowIndex}`}>
                                {previousRow && groupedTotalRows.map((totalRow) => {
                                  if (!totalRow.groupBy || totalRow.groupBy.length === 0) return null;
                                  
                                  const prevKey = getGroupKey(previousRow, totalRow.groupBy);
                                  const currKey = getGroupKey(row, totalRow.groupBy);
                                  const shouldShow = prevKey !== currKey;
                                  
                                  if (!shouldShow) return null;
                                  
                                  const groupRows: typeof sampleData = [];
                                  
                                  for (let i = 0; i < rowIndex; i++) {
                                    const r = sampleData[i];
                                    const rKey = getGroupKey(r, totalRow.groupBy);
                                    if (rKey === prevKey) {
                                      groupRows.push(r);
                                    }
                                  }
                                  
                                  if (groupRows.length === 0) {
                                    groupRows.push(previousRow);
                                  }
                                  
                                  const prevFirstName = (previousRow.firstName as string) || "";
                                  const prevLastName = (previousRow.lastName as string) || "";
                                  const prevSecondLastName = (previousRow.secondLastName as string) || "";
                                  const prevEmployeeName = `${prevFirstName} ${prevLastName} ${prevSecondLastName}`.trim();
                                  
                                  const prevAssistance = previousRow.Assistance as Record<string, unknown> | Record<string, unknown>[] | undefined;
                                  const prevAssistanceObj = prevAssistance 
                                    ? (Array.isArray(prevAssistance) ? prevAssistance[0] : prevAssistance)
                                    : null;
                                  
                                  const prevMonth = prevAssistanceObj ? ((prevAssistanceObj.month as number) || 1) : 1;
                                  const prevYear = prevAssistanceObj ? ((prevAssistanceObj.year as number) || 2024) : 2024;
                                  const prevDay = prevAssistanceObj ? ((prevAssistanceObj.day as number) || 1) : 1;
                                  const prevWeek = prevAssistanceObj ? calculateWeekNumber(prevYear, prevMonth, prevDay) : 1;
                                  
                                  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                                  
                                  const weekStart = DateTime.fromObject({ year: prevYear, month: prevMonth, day: prevDay })
                                    .startOf('week')
                                    .toFormat('dd/MM');
                                  const weekEnd = DateTime.fromObject({ year: prevYear, month: prevMonth, day: prevDay })
                                    .endOf('week')
                                    .toFormat('dd/MM');
                                  const prevWeekRange = `${weekStart} - ${weekEnd}`;
                                  
                                  let groupLabel = totalRow.label;
                                  if (totalRow.labelTemplate) {
                                    groupLabel = totalRow.labelTemplate
                                      .replace(/\{employee\}/g, prevEmployeeName || "Empleado")
                                      .replace(/\{firstName\}/g, prevFirstName)
                                      .replace(/\{lastName\}/g, prevLastName)
                                      .replace(/\{secondLastName\}/g, prevSecondLastName)
                                      .replace(/\{month\}/g, prevMonth.toString())
                                      .replace(/\{monthName\}/g, monthNames[prevMonth - 1] || "Enero")
                                      .replace(/\{year\}/g, prevYear.toString())
                                      .replace(/\{week\}/g, prevWeek.toString())
                                      .replace(/\{weekRange\}/g, prevWeekRange);
                                  } else if (totalRow.showGroupContext) {
                                    const contextParts: string[] = [];
                                    if (totalRow.groupBy.includes("employee")) {
                                      contextParts.push(prevEmployeeName || "Empleado");
                                    }
                                    if (totalRow.groupBy.includes("month")) {
                                      contextParts.push(`${monthNames[prevMonth - 1] || "Enero"} ${prevYear}`);
                                    }
                                    if (totalRow.groupBy.includes("week")) {
                                      contextParts.push(`Semana ${prevWeek}`);
                                    }
                                    if (contextParts.length > 0) {
                                      groupLabel = `${totalRow.label} - ${contextParts.join(" - ")}`;
                                    }
                                  }
                                  
                                  return (
                                    <CHEKIOTableRow
                                      key={`group-total-${totalRow.id}-${rowIndex}`}
                                      index={-2}
                                      className="bg-blue-50 font-semibold border-b-2 border-blue-300"
                                    >
                                      {previewFields.map((field) => {
                                        const totalValue = calculateTotal(
                                          field,
                                          totalRow,
                                          groupRows.length > 0 ? groupRows : undefined
                                        );
                                        return (
                                          <CHEKIOTableCell
                                            key={field.id}
                                            className="border-r border-gray-300 last:border-r-0 text-sm px-3 py-2 text-blue-800"
                                          >
                                            {totalValue ||
                                              (totalRow.showLabel && field === previewFields[0]
                                                ? groupLabel
                                                : "")}
                                          </CHEKIOTableCell>
                                        );
                                      })}
                                    </CHEKIOTableRow>
                                  );
                                })}
                            <CHEKIOTableRow
                              key={rowIndex}
                              index={rowIndex}
                              className={`border-b border-gray-200 ${
                                rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                              } hover:bg-blue-50 transition-colors`}
                            >
                              {previewFields.map((field) => {
                                if (field.isConsolidated) {
                                  const formattedValue = formatFieldValue(
                                    null,
                                    field,
                                    row,
                                    rowIndex,
                                    Object.values(FIELD_CATEGORIES).flatMap(
                                      (category) => category.fields
                                    ),
                                    previewFields
                                  );
                                  return (
                                    <CHEKIOTableCell
                                      key={field.id}
                                      className="border-r border-gray-200 last:border-r-0 text-sm px-3 py-2 text-gray-700"
                                    >
                                      {formattedValue}
                                    </CHEKIOTableCell>
                                  );
                                }

                                if (field.isCalculated) {
                                  const formattedValue = formatFieldValue(
                                    null,
                                    field,
                                    row,
                                    rowIndex,
                                    Object.values(FIELD_CATEGORIES).flatMap(
                                      (category) => category.fields
                                    ),
                                    previewFields
                                  );
                                  return (
                                    <CHEKIOTableCell
                                      key={field.id}
                                      className="border-r border-gray-200 last:border-r-0 bg-blue-50 font-semibold text-sm px-3 py-2 text-gray-800"
                                    >
                                      {formattedValue}
                                    </CHEKIOTableCell>
                                  );
                                }

                                let rawValue: string | number | boolean | null | undefined = undefined;

                                if (
                                  field.category === FieldCategory.OVERTIME
                                ) {
                                  const overtimeKey =
                                    `overtime_${field.name}` as keyof typeof row;
                                  const rawValueFromRow = row[overtimeKey];
                                  if (
                                    typeof rawValueFromRow === "number" ||
                                    typeof rawValueFromRow === "string" ||
                                    typeof rawValueFromRow === "boolean"
                                  ) {
                                    rawValue = rawValueFromRow;
                                  }
                                } else if (
                                  field.category === FieldCategory.HOLIDAY
                                ) {
                                  const holidayKey =
                                    `holiday_${field.name}` as keyof typeof row;
                                  const rawValueFromRow = row[holidayKey];
                                  if (
                                    typeof rawValueFromRow === "number" ||
                                    typeof rawValueFromRow === "string" ||
                                    typeof rawValueFromRow === "boolean"
                                  ) {
                                    rawValue = rawValueFromRow;
                                  }
                                } else if (
                                  (field.table === "Assistance" || field.category === FieldCategory.SCHEDULE) &&
                                  (field.name === "startTime" || field.name === "endTime")
                                ) {
                                  const assistance = row.Assistance as Record<string, unknown> | Record<string, unknown>[] | undefined;
                                  if (assistance) {
                                    const assistanceObj = Array.isArray(assistance) ? assistance[0] : assistance;
                                    const schedule = assistanceObj?.Schedule as Record<string, unknown> | undefined;
                                    if (schedule && schedule[field.name]) {
                                      rawValue = schedule[field.name] as string;
                                    } else {
                                      rawValue = null;
                                    }
                                  } else {
                                    rawValue = null;
                                  }
                                } else if (
                                  field.table === "Assistance" &&
                                  field.originalTags &&
                                  field.originalTags.some(tag => 
                                    tag.includes("Marks") && 
                                    tag.includes("timestamp") &&
                                    (tag.includes("CHECK_IN&noBreak") || tag.includes("CHECK_OUT&noBreak"))
                                  )
                                ) {
                                  const assistance = row.Assistance as Record<string, unknown> | Record<string, unknown>[] | undefined;
                                  if (assistance) {
                                    const assistanceObj = Array.isArray(assistance) ? assistance[0] : assistance;
                                    const marks = assistanceObj?.Marks as Array<Record<string, unknown>> | undefined;
                                    if (marks && Array.isArray(marks)) {
                                      const isCheckIn = field.originalTags.some(tag => tag.includes("CHECK_IN&noBreak"));
                                      const isCheckOut = field.originalTags.some(tag => tag.includes("CHECK_OUT&noBreak"));
                                      
                                      let mark: Record<string, unknown> | undefined;
                                      if (isCheckIn) {
                                        mark = marks.find(
                                          (m) => m.type === "CHECK_IN" && (m.scheduleBreakId === null || m.scheduleBreakId === undefined)
                                        );
                                      } else if (isCheckOut) {
                                        mark = marks.find(
                                          (m) => m.type === "CHECK_OUT" && (m.scheduleBreakId === null || m.scheduleBreakId === undefined)
                                        );
                                      }
                                      
                                      if (mark && mark.timestamp) {
                                        rawValue = mark.timestamp as string;
                                      }
                                    }
                                  }
                                } else if (
                                  field.table === "Job" ||
                                  field.table === "Branch" ||
                                  field.table === "Company" ||
                                  field.table === "Shift" ||
                                  field.table === "Schedule" ||
                                  field.table === "Assistance" ||
                                  field.table === "Absence" ||
                                  field.table === "OvertimeRequest" ||
                                  field.table === "Holiday"
                                ) {
                                  const tableName = field.table;
                                  const fieldName = field.name;
                                  if (
                                    tableName &&
                                    row[tableName as keyof typeof row] &&
                                    typeof row[tableName as keyof typeof row] ===
                                      "object"
                                  ) {
                                    const nestedObj = row[
                                      tableName as keyof typeof row
                                    ] as Record<string, string | number | boolean | null | undefined>;
                                    const nestedValue = nestedObj[fieldName];
                                    if (
                                      typeof nestedValue === "number" ||
                                      typeof nestedValue === "string" ||
                                      typeof nestedValue === "boolean"
                                    ) {
                                      rawValue = nestedValue;
                                    }
                                  } else {
                                    const rawValueFromRow =
                                      row[field.name as keyof typeof row];
                                    if (
                                      typeof rawValueFromRow === "number" ||
                                      typeof rawValueFromRow === "string" ||
                                      typeof rawValueFromRow === "boolean"
                                    ) {
                                      rawValue = rawValueFromRow;
                                    }
                                  }
                                } else {
                                  const rawValueFromRow =
                                    row[field.name as keyof typeof row];
                                  if (
                                    typeof rawValueFromRow === "number" ||
                                    typeof rawValueFromRow === "string" ||
                                    typeof rawValueFromRow === "boolean"
                                  ) {
                                    rawValue = rawValueFromRow;
                                  }
                                }

                                if (
                                  rawValue === undefined ||
                                  rawValue === null
                                ) {
                                  if (
                                    field.category === FieldCategory.SCHEDULE &&
                                    field.name === "totalHours"
                                  ) {
                                    const scheduleHours = [45, 32, 40];
                                    rawValue = scheduleHours[rowIndex] || 45;
                                  } else if (
                                    field.category === FieldCategory.SCHEDULE &&
                                    (field.name === "startTime" || field.name === "endTime")
                                  ) {
                                    const assistance = row.Assistance as Record<string, unknown> | Record<string, unknown>[] | undefined;
                                    if (assistance) {
                                      const assistanceObj = Array.isArray(assistance) ? assistance[0] : assistance;
                                      const schedule = assistanceObj?.Schedule as Record<string, unknown> | undefined;
                                      if (schedule && schedule[field.name]) {
                                        rawValue = schedule[field.name] as string;
                                      } else {
                                        const scheduleExamples: Record<string, string[]> = {
                                          startTime: ["2024-01-15T08:00:00", "2024-01-15T14:00:00", "2024-02-05T22:00:00"],
                                          endTime: ["2024-01-15T17:00:00", "2024-01-15T22:00:00", "2024-02-06T06:00:00"],
                                        };
                                        const exampleValues = scheduleExamples[field.name] || [];
                                        rawValue = exampleValues[rowIndex] || "";
                                      }
                                    } else {
                                      const scheduleExamples: Record<string, string[]> = {
                                        startTime: ["2024-01-15T08:00:00", "2024-01-15T14:00:00", "2024-02-05T22:00:00"],
                                        endTime: ["2024-01-15T17:00:00", "2024-01-15T22:00:00", "2024-02-06T06:00:00"],
                                      };
                                      const exampleValues = scheduleExamples[field.name] || [];
                                      rawValue = exampleValues[rowIndex] || "";
                                    }
                                  } else if (
                                    field.category === FieldCategory.ATTENDANCE &&
                                    field.originalTags &&
                                    field.originalTags.some(tag => 
                                      tag.includes("Marks") && 
                                      tag.includes("timestamp") &&
                                      (tag.includes("CHECK_IN&noBreak") || tag.includes("CHECK_OUT&noBreak"))
                                    )
                                  ) {
                                    const assistance = row.Assistance as Record<string, unknown> | Record<string, unknown>[] | undefined;
                                    if (assistance) {
                                      const assistanceObj = Array.isArray(assistance) ? assistance[0] : assistance;
                                      const marks = assistanceObj?.Marks as Array<Record<string, unknown>> | undefined;
                                      if (marks && Array.isArray(marks)) {
                                        const isCheckIn = field.originalTags.some(tag => tag.includes("CHECK_IN&noBreak"));
                                        const isCheckOut = field.originalTags.some(tag => tag.includes("CHECK_OUT&noBreak"));
                                        
                                        let mark: Record<string, unknown> | undefined;
                                        if (isCheckIn) {
                                          mark = marks.find(
                                            (m) => m.type === "CHECK_IN" && (m.scheduleBreakId === null || m.scheduleBreakId === undefined)
                                          );
                                        } else if (isCheckOut) {
                                          mark = marks.find(
                                            (m) => m.type === "CHECK_OUT" && (m.scheduleBreakId === null || m.scheduleBreakId === undefined)
                                          );
                                        }
                                        
                                        if (mark && mark.timestamp) {
                                          rawValue = mark.timestamp as string;
                                        } else {
                                          rawValue = null;
                                        }
                                      } else {
                                        rawValue = null;
                                      }
                                    } else {
                                      rawValue = null;
                                    }
                                  }
                                }

                                const formattedValue = formatFieldValue(
                                  rawValue,
                                  field,
                                  row,
                                  rowIndex,
                                  Object.values(FIELD_CATEGORIES).flatMap(
                                    (category) => category.fields
                                  ),
                                  previewFields
                                );
                                return (
                                  <CHEKIOTableCell
                                    key={field.id}
                                    className="border-r border-gray-200 last:border-r-0 text-sm px-3 py-2 text-gray-700"
                                  >
                                    {formattedValue}
                                  </CHEKIOTableCell>
                                );
                              })}
                            </CHEKIOTableRow>
                              </React.Fragment>
                            );
                          })}
                          {sampleData.length > 0 && groupedTotalRows.map((totalRow) => {
                            if (!totalRow.groupBy || totalRow.groupBy.length === 0) return null;
                            
                            const lastRow = sampleData[sampleData.length - 1];
                            const lastKey = getGroupKey(lastRow, totalRow.groupBy);
                            const lastGroupRows: typeof sampleData = [];
                            
                            for (let i = 0; i < sampleData.length; i++) {
                              const r = sampleData[i];
                              const rKey = getGroupKey(r, totalRow.groupBy);
                              if (rKey === lastKey) {
                                lastGroupRows.push(r);
                              }
                            }
                            
                            if (lastGroupRows.length === 0) return null;
                            
                            const lastFirstName = (lastRow.firstName as string) || "";
                            const lastLastName = (lastRow.lastName as string) || "";
                            const lastSecondLastName = (lastRow.secondLastName as string) || "";
                            const lastEmployeeName = `${lastFirstName} ${lastLastName} ${lastSecondLastName}`.trim();
                            
                            const lastAssistance = lastRow.Assistance as Record<string, unknown> | Record<string, unknown>[] | undefined;
                            const lastAssistanceObj = lastAssistance 
                              ? (Array.isArray(lastAssistance) ? lastAssistance[0] : lastAssistance)
                              : null;
                            
                            const lastMonth = lastAssistanceObj ? ((lastAssistanceObj.month as number) || 1) : 1;
                            const lastYear = lastAssistanceObj ? ((lastAssistanceObj.year as number) || 2024) : 2024;
                            const lastDay = lastAssistanceObj ? ((lastAssistanceObj.day as number) || 1) : 1;
                            const lastWeek = lastAssistanceObj && lastYear > 0 && lastMonth > 0 && lastDay > 0 
                              ? calculateWeekNumber(lastYear, lastMonth, lastDay) 
                              : 1;
                            
                            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                              "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                            
                            const weekStart = DateTime.fromObject({ year: lastYear, month: lastMonth, day: lastDay })
                              .startOf('week')
                              .toFormat('dd/MM');
                            const weekEnd = DateTime.fromObject({ year: lastYear, month: lastMonth, day: lastDay })
                              .endOf('week')
                              .toFormat('dd/MM');
                            const lastWeekRange = `${weekStart} - ${weekEnd}`;
                            
                            let groupLabel = totalRow.label;
                            if (totalRow.labelTemplate) {
                              groupLabel = totalRow.labelTemplate
                                .replace(/\{employee\}/g, lastEmployeeName || "Empleado")
                                .replace(/\{firstName\}/g, lastFirstName)
                                .replace(/\{lastName\}/g, lastLastName)
                                .replace(/\{secondLastName\}/g, lastSecondLastName)
                                .replace(/\{month\}/g, lastMonth.toString())
                                .replace(/\{monthName\}/g, monthNames[lastMonth - 1] || "Enero")
                                .replace(/\{year\}/g, lastYear.toString())
                                .replace(/\{week\}/g, lastWeek.toString())
                                .replace(/\{weekRange\}/g, lastWeekRange);
                            } else if (totalRow.showGroupContext) {
                              const contextParts: string[] = [];
                              if (totalRow.groupBy.includes("employee")) {
                                contextParts.push(lastEmployeeName || "Empleado");
                              }
                              if (totalRow.groupBy.includes("month")) {
                                contextParts.push(`${monthNames[lastMonth - 1] || "Enero"} ${lastYear}`);
                              }
                              if (totalRow.groupBy.includes("week")) {
                                contextParts.push(`Semana ${lastWeek}`);
                              }
                              if (contextParts.length > 0) {
                                groupLabel = `${totalRow.label} - ${contextParts.join(" - ")}`;
                              }
                            }
                            
                            return (
                              <CHEKIOTableRow
                                key={`group-total-last-${totalRow.id}`}
                                index={-2}
                                className="bg-blue-50 font-semibold border-b-2 border-blue-300"
                              >
                                {previewFields.map((field) => {
                                  const totalValue = calculateTotal(
                                    field,
                                    totalRow,
                                    lastGroupRows.length > 0 ? lastGroupRows : undefined
                                  );
                                  return (
                                    <CHEKIOTableCell
                                      key={field.id}
                                      className="border-r border-gray-300 last:border-r-0 text-sm px-3 py-2 text-blue-800"
                                    >
                                      {totalValue ||
                                        (totalRow.showLabel && field === previewFields[0]
                                          ? groupLabel
                                          : "")}
                                    </CHEKIOTableCell>
                                  );
                                })}
                              </CHEKIOTableRow>
                            );
                          })}
                          {bottomTotalRows.map((totalRow) => (
                            <CHEKIOTableRow
                              key={`total-bottom-${totalRow.id}`}
                              index={-1}
                              className="bg-gray-100 font-semibold border-t-2 border-gray-400"
                            >
                              {previewFields.map((field) => {
                                const totalValue = calculateTotal(
                                  field,
                                  totalRow
                                );
                                return (
                                  <CHEKIOTableCell
                                    key={field.id}
                                    className="border-r border-gray-300 last:border-r-0 text-sm px-3 py-2 text-gray-800"
                                  >
                                    {totalValue ||
                                      (totalRow.showLabel && field === previewFields[0]
                                        ? totalRow.label
                                        : "")}
                                  </CHEKIOTableCell>
                                );
                              })}
                            </CHEKIOTableRow>
                          ))}
                        </>
                      );
                    })()}
                  </CHEKIOTableBody>
                </CHEKIOTable>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {t("create.preview.description", { count: Math.min(SAMPLE_DATA.length, 5) })}
            </p>
          </div>
        )}

        {/* Vista Previa del JSON */}
        {showJsonPreview && (
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("create.jsonPreview.title")}
              </h3>
              <CHEKIOButton
                variant="secondaryBlue"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(getReportJsonLocal());
                  toast({
                    title: t("toast.jsonCopied.title"),
                    description: t("toast.jsonCopied.description"),
                  });
                }}
              >
                {t("buttons.copyJson")}
              </CHEKIOButton>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded p-4 max-h-96 overflow-auto">
              <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
                {getReportJsonLocal()}
              </pre>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t("create.jsonPreview.description")}
            </p>
          </div>
        )}
      </div>
      )}

      {isEditModalOpen && editingField && (
        <EditFieldModal
          field={editingField}
          onSave={(updatedField) => {
            setEditingField(updatedField);
            handleSaveFieldFormat(updatedField);
          }}
          onClose={handleCloseEditModal}
          isOpen={isEditModalOpen}
          selectedFieldsForConsolidation={selectedFieldsForConsolidation}
          consolidatedSeparator={consolidatedSeparator}
          consolidatedFieldFormats={consolidatedFieldFormats}
          consolidatedFieldsSearchTerm={consolidatedFieldsSearchTerm}
          onToggleFieldForConsolidation={toggleFieldForConsolidation}
          onMoveFieldUp={moveConsolidatedFieldUp}
          onMoveFieldDown={moveConsolidatedFieldDown}
          onFormatChange={(fieldId, format) => {
            const newFormats = new Map(consolidatedFieldFormats);
            newFormats.set(fieldId, format);
            setConsolidatedFieldFormats(newFormats);
          }}
          onSearchChange={setConsolidatedFieldsSearchTerm}
          onSeparatorChange={setConsolidatedSeparator}
          expandedFormatFields={expandedFormatFields}
          onToggleFormatExpanded={(fieldId) => {
            const newExpanded = new Set(expandedFormatFields);
            if (newExpanded.has(fieldId)) {
              newExpanded.delete(fieldId);
            } else {
              newExpanded.add(fieldId);
            }
            setExpandedFormatFields(newExpanded);
          }}
          getFormatOptions={getFormatOptions}
        />
      )}

      <ConsolidatedFieldModal
        isOpen={isConsolidatedModalOpen}
        onClose={handleCloseConsolidatedModal}
        onCreate={handleCreateConsolidatedField}
        fieldName={consolidatedFieldName}
        headerTransform={consolidatedHeaderTransform}
        separator={consolidatedSeparator}
        selectedFields={selectedFieldsForConsolidation}
        fieldFormats={consolidatedFieldFormats}
        searchTerm={consolidatedFieldsSearchTerm}
        expandedFormatFields={expandedFormatFields}
        onFieldNameChange={setConsolidatedFieldName}
        onHeaderTransformChange={setConsolidatedHeaderTransform}
        onSeparatorChange={setConsolidatedSeparator}
        onToggleField={toggleFieldForConsolidation}
        onMoveFieldUp={moveConsolidatedFieldUp}
        onMoveFieldDown={moveConsolidatedFieldDown}
        onSearchChange={setConsolidatedFieldsSearchTerm}
        onFormatChange={(fieldId, format) => {
          const newFormats = new Map(consolidatedFieldFormats);
          newFormats.set(fieldId, format);
          setConsolidatedFieldFormats(newFormats);
        }}
        onToggleFormatExpanded={(fieldId) => {
          const newExpanded = new Set(expandedFormatFields);
          if (newExpanded.has(fieldId)) {
            newExpanded.delete(fieldId);
          } else {
            newExpanded.add(fieldId);
          }
          setExpandedFormatFields(newExpanded);
        }}
        getFormatOptions={getFormatOptions}
      />

      {/* Modal de Fila de Totales */}
      {isTotalRowModalOpen && (
        <CHEKIOModal
          isOpen={isTotalRowModalOpen}
          onClose={handleCloseTotalRowModal}
          title={
            editingTotalRow ? t("modals.totalRow.edit") : t("modals.totalRow.create")
          }
          size="5xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("modals.totalRow.name")}
                </label>
                <CHEKIOInput
                  type="text"
                  value={totalRowLabel}
                  onChange={(e) => setTotalRowLabel(e.target.value)}
                  placeholder={t("modals.totalRow.namePlaceholder")}
                  className="rounded-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("modals.totalRow.nameDescription")}
                </p>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("modals.totalRow.headerTransform")}
                </label>
                <div className="flex items-center gap-2 h-10">
                  <button
                    type="button"
                    onClick={() => setTotalRowHeaderTransform("DEFAULT")}
                    className={`px-3 py-1.5 border rounded transition-all text-xs h-full ${
                      totalRowHeaderTransform === "DEFAULT"
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-300 hover:border-gray-400 bg-white text-gray-600"
                    }`}
                  >
                    {t("modals.totalRow.default")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTotalRowHeaderTransform("UPPER")}
                    className={`px-3 py-1.5 border rounded transition-all text-xs h-full ${
                      totalRowHeaderTransform === "UPPER"
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-300 hover:border-gray-400 bg-white text-gray-600"
                    }`}
                  >
                    {t("modals.totalRow.upper")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTotalRowHeaderTransform("LOWER")}
                    className={`px-3 py-1.5 border rounded transition-all text-xs h-full ${
                      totalRowHeaderTransform === "LOWER"
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-300 hover:border-gray-400 bg-white text-gray-600"
                    }`}
                  >
                    {t("modals.totalRow.lower")}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t("modals.totalRow.headerTransformDescription")}
                </p>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("modals.totalRow.totalType")}
                </label>
                <CHEKIOSelect
                  value={totalRowType ?? TotalRowType.SUM}
                  onValueChange={(value) =>
                    setTotalRowType(value as TotalRowType)
                  }
                >
                  <CHEKIOSelectTrigger className="rounded-none">
                    <CHEKIOSelectValue />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    <CHEKIOSelectItem value={TotalRowType.SUM}>
                      {t("modals.totalRow.sum")}
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem value={TotalRowType.AVG}>
                      {t("modals.totalRow.avg")}
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem value={TotalRowType.COUNT}>
                      {t("modals.totalRow.count")}
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem value={TotalRowType.MIN}>
                      {t("modals.totalRow.min")}
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem value={TotalRowType.MAX}>
                      {t("modals.totalRow.max")}
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem value={TotalRowType.CUSTOM}>
                      {t("modals.totalRow.custom")}
                    </CHEKIOSelectItem>
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
                <p className="text-xs text-gray-500 mt-1">
                  {totalRowType === TotalRowType.CUSTOM
                    ? t("modals.totalRow.customDescription")
                    : t("modals.totalRow.defaultDescription")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("modals.totalRow.position")}
                </label>
                <CHEKIOSelect
                  value={totalRowPosition}
                  onValueChange={(value) =>
                    setTotalRowPosition(value as "top" | "bottom")
                  }
                >
                  <CHEKIOSelectTrigger className="rounded-none">
                    <CHEKIOSelectValue />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    <CHEKIOSelectItem value="top">
                      {t("modals.totalRow.top")}
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem value="bottom">
                      {t("modals.totalRow.bottom")}
                    </CHEKIOSelectItem>
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              </div>

              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="showLabel"
                  checked={totalRowShowLabel}
                  onChange={(e) => setTotalRowShowLabel(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label
                  htmlFor="showLabel"
                  className="text-sm font-medium text-gray-700"
                >
                  {t("modals.totalRow.showLabel")}
                </label>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                {t("modals.totalRow.grouping")}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("modals.totalRow.groupBy")}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={totalRowGroupBy.includes("employee")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTotalRowGroupBy([...totalRowGroupBy.filter(g => g !== "employee"), "employee"]);
                          } else {
                            setTotalRowGroupBy(totalRowGroupBy.filter(g => g !== "employee"));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{t("modals.totalRow.groupByEmployee")}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={totalRowGroupBy.includes("month")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTotalRowGroupBy([...totalRowGroupBy.filter(g => g !== "month"), "month"]);
                          } else {
                            setTotalRowGroupBy(totalRowGroupBy.filter(g => g !== "month"));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{t("modals.totalRow.groupByMonth")}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={totalRowGroupBy.includes("week")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTotalRowGroupBy([...totalRowGroupBy.filter(g => g !== "week"), "week"]);
                          } else {
                            setTotalRowGroupBy(totalRowGroupBy.filter(g => g !== "week"));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{t("modals.totalRow.groupByWeek")}</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t("modals.totalRow.groupByDescription")}
                  </p>
                </div>

                {totalRowGroupBy.length > 0 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("modals.totalRow.labelTemplate")}
                      </label>
                      <CHEKIOInput
                        type="text"
                        value={totalRowLabelTemplate}
                        onChange={(e) => setTotalRowLabelTemplate(e.target.value)}
                        placeholder="Ej: Total {employee} - {monthName} {year}"
                        className="rounded-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t("modals.totalRow.labelTemplateDescription")}
                      </p>
                      
                      <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          {t("modals.totalRow.insertVariable")}:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {totalRowGroupBy.includes("employee") && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setTotalRowLabelTemplate(totalRowLabelTemplate + "{employee}");
                                }}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
                              >
                                {t("modals.totalRow.variableEmployee")}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTotalRowLabelTemplate(totalRowLabelTemplate + "{firstName}");
                                }}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
                              >
                                {t("modals.totalRow.variableFirstName")}
                              </button>
                            </>
                          )}
                          {totalRowGroupBy.includes("month") && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setTotalRowLabelTemplate(totalRowLabelTemplate + "{monthName}");
                                }}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
                              >
                                {t("modals.totalRow.variableMonthName")}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTotalRowLabelTemplate(totalRowLabelTemplate + "{year}");
                                }}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
                              >
                                {t("modals.totalRow.variableYear")}
                              </button>
                            </>
                          )}
                          {totalRowGroupBy.includes("week") && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setTotalRowLabelTemplate(totalRowLabelTemplate + "{week}");
                                }}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
                              >
                                {t("modals.totalRow.variableWeek")}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTotalRowLabelTemplate(totalRowLabelTemplate + "{weekRange}");
                                }}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
                              >
                                {t("modals.totalRow.variableWeekRange")}
                              </button>
                            </>
                          )}
                        </div>
                        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs font-medium text-blue-900 mb-1">
                            {t("modals.totalRow.example")}:
                          </p>
                          <p className="text-xs text-blue-800">
                            {totalRowGroupBy.includes("employee") && totalRowGroupBy.includes("month")
                              ? t("modals.totalRow.exampleEmployeeMonth")
                              : totalRowGroupBy.includes("employee")
                              ? t("modals.totalRow.exampleEmployee")
                              : totalRowGroupBy.includes("month")
                              ? t("modals.totalRow.exampleMonth")
                              : totalRowGroupBy.includes("week")
                              ? t("modals.totalRow.exampleWeek")
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showGroupContext"
                        checked={totalRowShowGroupContext}
                        onChange={(e) => setTotalRowShowGroupContext(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label
                        htmlFor="showGroupContext"
                        className="text-sm font-medium text-gray-700"
                      >
                        {t("modals.totalRow.showGroupContext")}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      {t("modals.totalRow.showGroupContextDescription")}
                    </p>
                  </>
                )}
              </div>
            </div>

            {totalRowType === TotalRowType.CUSTOM ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("modals.totalRow.selectFields")}
                </label>
                <div className="border border-gray-200 rounded p-4 max-h-64 overflow-y-auto bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {fields
                      .filter(
                        (field) =>
                          field.type === "number" &&
                          (field.aggregationType !== "none" ||
                            field.isCalculated)
                      )
                      .map((field) => {
                        const currentAggType =
                          selectedFieldsForTotal.get(field.id) || "NONE";
                        const isSelected = currentAggType !== "none" && currentAggType !== "NONE";
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
                                <span className={`text-sm font-medium ${isSelected ? "text-blue-900" : "text-gray-700"}`}>
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
                                {field.type}
                              </Badge>
                              <CHEKIOSelect
                                value={currentAggType}
                                onValueChange={(value) =>
                                  toggleFieldForTotal(
                                    field.id,
                                    value as
                                      | "sum"
                                      | "avg"
                                      | "count"
                                      | "min"
                                      | "max"
                                      | "none"
                                  )
                                }
                              >
                                <CHEKIOSelectTrigger className="w-32 rounded-none text-xs h-8">
                                  <CHEKIOSelectValue />
                                </CHEKIOSelectTrigger>
                                <CHEKIOSelectContent>
                                  <CHEKIOSelectItem value="none">
                                    {t("modals.totalRow.none")}
                                  </CHEKIOSelectItem>
                                  <CHEKIOSelectItem value="sum">
                                    {t("aggregationTypes.sum")}
                                  </CHEKIOSelectItem>
                                  <CHEKIOSelectItem value="avg">
                                    {t("aggregationTypes.avg")}
                                  </CHEKIOSelectItem>
                                  <CHEKIOSelectItem value="count">
                                    {t("aggregationTypes.count")}
                                  </CHEKIOSelectItem>
                                  <CHEKIOSelectItem value="min">
                                    {t("aggregationTypes.min")}
                                  </CHEKIOSelectItem>
                                  <CHEKIOSelectItem value="max">
                                    {t("aggregationTypes.max")}
                                  </CHEKIOSelectItem>
                                </CHEKIOSelectContent>
                              </CHEKIOSelect>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
                {fields.filter(
                  (field) =>
                    field.type === "number" && field.aggregationType !== "none"
                ).length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {t("modals.totalRow.noNumericFields")}
                  </p>
                )}
              </div>
            ) : null}

            <div className="flex justify-end gap-4 pt-4 border-t">
              <CHEKIOButton
                variant="secondary"
                onClick={handleCloseTotalRowModal}
                className="rounded-none"
              >
                {t("buttons.cancel")}
              </CHEKIOButton>
              <CHEKIOButton
                variant="primary"
                onClick={() => handleCreateTotalRow()}
                className="rounded-none"
              >
                {editingTotalRow ? t("modals.totalRow.updateButton") : t("modals.totalRow.createButton")}
              </CHEKIOButton>
            </div>
          </div>
        </CHEKIOModal>
      )}

      {/* Modal de Columna Calculada */}
      {isCalculatedFieldModalOpen && (
        <CalculatedFieldModal
          isOpen={isCalculatedFieldModalOpen}
          onClose={handleCloseCalculatedFieldModal}
          onCreate={handleCreateCalculatedFieldFromModal}
          editingField={editingCalculatedField}
          fieldName={calculatedFieldName}
          headerTransform={calculatedHeaderTransform}
          calculationType={calculationType}
          customFormula={customFormula}
          format={calculatedFieldFormat}
          selectedFields={selectedFieldsForCalculation}
          availableFields={(() => {
            const formFields = watch("fields") || fields;
            // Solo mostrar campos que ya están en el reporte (formFields)
            // Eliminar duplicados basándose en name + table
            const uniqueFields = formFields.filter((field, index, self) => {
              return (
                index ===
                self.findIndex(
                  (f) => f.name === field.name && f.table === field.table
                )
              );
            });
            return uniqueFields;
          })()}
          onFieldNameChange={setCalculatedFieldName}
          onHeaderTransformChange={setCalculatedHeaderTransform}
          onCalculationTypeChange={setCalculationType}
          onFormulaChange={setCustomFormula}
          onFormatChange={setCalculatedFieldFormat}
          onToggleField={(fieldId) => {
            setSelectedFieldsForCalculation((prev) =>
              prev.includes(fieldId)
                ? prev.filter((id) => id !== fieldId)
                : [...prev, fieldId]
            );
          }}
          evaluateCustomFormula={(formula, values, fieldNames) => {
            return evaluateCustomFormula({ formula, values, fieldNames });
          }}
          getFormatOptions={getFormatOptions}
        />
      )}
    </>
  );
}
