"use client";

import {
  CHEKIOActionButton,
  CHEKIOButton,
  CHEKIOModal,
  CHEKIOProgressBar,
  CHEKIOTab,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
  CHEKIOTabs,
} from "@/components";
import SystemInput from "@/components/ui/system-input";
import { useToast } from "@/hooks/use-toast";
import { useCreateAbsenceType } from "@/service/mantainer.service";
import { parseFirstWorksheetToJsonRecords } from "@/utils/parseXlsxFirstSheet";
import { Upload } from "antd";
import ExcelJS from "exceljs";
import {
  CheckCircle2,
  Download,
  Loader2,
  Plus,
  Trash2,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { AbsenceTypeCreateDto } from "./absence-type.dto";

interface AbsenceTypeModalMasiveProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AbsenceTypeFormData extends AbsenceTypeCreateDto {
  error?: string;
  success?: boolean;
  status?: "pending" | "processing" | "success" | "error";
}

interface FormValues {
  absenceTypes: AbsenceTypeFormData[];
}

export default function AbsenceTypeModalMasive({
  isOpen,
  onClose,
  onSuccess,
}: AbsenceTypeModalMasiveProps) {
  const tMassive = useTranslations("mantainers.absenceTypes.massive");
  const t = useTranslations("mantainers.absenceTypes");
  const { toast } = useToast();
  const { mutateAsync: createAbsenceType } = useCreateAbsenceType();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    getValues,
    watch,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      absenceTypes: [] as AbsenceTypeFormData[],
    },
  });

  const { fields, append, replace, remove } = useFieldArray({
    control,
    name: "absenceTypes",
  });

  const [activeTab, setActiveTab] = useState<string>("1");

  // Check if there are any invalid absence types
  const hasInvalidAbsenceTypes = () => {
    if (fields.length === 0) return false;

    // Get all form values at once
    const allValues = getValues();

    return fields.some((_, index) => {
      const absenceType = allValues.absenceTypes?.[index];

      // Check if any required field is missing or empty
      const hasMissingFields = !absenceType?.code || !absenceType?.name;

      return hasMissingFields;
    });
  };

  const downloadTemplate = useCallback(async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Tipos de Ausencia");

      const headers = [
        tMassive("excel.template.headers.code"),
        tMassive("excel.template.headers.name"),
      ];

      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4F81BD" },
        };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      worksheet.addRow([
        tMassive("excel.template.example.code"),
        tMassive("excel.template.example.name"),
      ]);

      worksheet.columns.forEach((col) => {
        col.width = 20;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = tMassive("excel.template.filename");
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando plantilla:", error);
      toast({
        title: "Error",
        description: "Error al generar la plantilla de Excel",
        variant: "destructive",
      });
    }
  }, [tMassive, toast]);

  const absenceTypes = watch("absenceTypes");

  const downloadSuccessfulAbsenceTypesExcel = useCallback(async () => {
    try {
      const data = getValues();
      const successfulAbsenceTypes = data.absenceTypes.filter(
        (absenceType: AbsenceTypeFormData) => absenceType?.status === "success"
      );

      if (successfulAbsenceTypes.length === 0) {
        toast({
          title: "Sin registros",
          description: "No hay tipos de ausencia cargados exitosamente",
          variant: "destructive",
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Tipos de Ausencia Exitosos");

      const headers = [
        tMassive("excel.template.headers.code"),
        tMassive("excel.template.headers.name"),
      ];

      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4F81BD" },
        };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      successfulAbsenceTypes.forEach((absenceType: AbsenceTypeFormData) => {
        worksheet.addRow([absenceType.code || "", absenceType.name || ""]);
      });

      worksheet.columns.forEach((col) => {
        col.width = 20;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tipos_ausencia_exitosos_${DateTime.now().toFormat(
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando Excel de éxitos:", error);
      toast({
        title: "Error",
        description:
          "Error al generar el archivo Excel de tipos de ausencia exitosos",
        variant: "destructive",
      });
    }
  }, [getValues, toast, tMassive]);

  const downloadErrorAbsenceTypesExcel = useCallback(async () => {
    try {
      const data = getValues();
      const errorAbsenceTypes = data.absenceTypes.filter(
        (absenceType: AbsenceTypeFormData) => absenceType?.status === "error"
      );

      if (errorAbsenceTypes.length === 0) {
        toast({
          title: "Sin registros",
          description: "No hay tipos de ausencia con errores",
          variant: "destructive",
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Tipos de Ausencia con Errores");

      const headers = [
        tMassive("excel.template.headers.code"),
        tMassive("excel.template.headers.name"),
        "Error",
      ];

      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDC3545" },
        };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };

        if (cell.value === "Error") {
          cell.note =
            "IMPORTANTE: Antes de volver a cargar este archivo, elimine la columna 'Error' (última columna)";
        }
      });

      errorAbsenceTypes.forEach((absenceType: AbsenceTypeFormData) => {
        worksheet.addRow([
          absenceType.code || "",
          absenceType.name || "",
          absenceType.error || "",
        ]);
      });

      worksheet.columns.forEach((col) => {
        col.width = 20;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tipos_ausencia_errores_${DateTime.now().toFormat(
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando Excel de errores:", error);
      toast({
        title: "Error",
        description:
          "Error al generar el archivo Excel de tipos de ausencia con errores",
        variant: "destructive",
      });
    }
  }, [getValues, toast, tMassive]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buf = e.target?.result;
      if (!(buf instanceof ArrayBuffer)) {
        return;
      }
      const jsonData = await parseFirstWorksheetToJsonRecords(buf);

      const formattedData: AbsenceTypeFormData[] = jsonData.map((row) => {
        const r = row as Record<string, unknown>;
        const pick = (...keys: (string | undefined)[]) => {
          for (const k of keys) {
            if (!k) continue;
            const v = r[k];
            if (v !== null && v !== undefined && String(v).trim() !== "") {
              return String(v);
            }
          }
          return "";
        };
        return {
          code: pick(
            "Código",
            "Code",
            "code",
            tMassive("excel.template.headers.code"),
          ),
          name: pick(
            "Nombre",
            "Name",
            "name",
            tMassive("excel.template.headers.name"),
          ),
          integrationCode: pick(
            "Código de Integración",
            "Integration Code",
            "integrationCode",
          ),
          status: "pending" as const,
        };
      });

      replace(formattedData);
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleAddRow = () => {
    append({
      code: "",
      name: "",
      integrationCode: "",
      status: "pending" as const,
    });
  };

  const onSubmit = async (data: FormValues) => {
    // Validate all absence types before processing
    if (hasInvalidAbsenceTypes()) {
      toast({
        title: tMassive("toast.incompleteFields.title"),
        description: tMassive("toast.incompleteFields.description"),
        variant: "destructive",
      });
      return;
    }

    if (fields.length === 0) {
      toast({
        title: tMassive("toast.noData.title"),
        description: tMassive("toast.noData.description"),
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setUploadProgress(0);
    setIsComplete(false);

    const total = data.absenceTypes.length;
    let processed = 0;
    let hasErrors = false;

    const newData = [...data.absenceTypes];

    for (let i = 0; i < data.absenceTypes.length; i++) {
      const absenceType = data.absenceTypes[i];

      newData[i] = {
        ...newData[i],
        status: "processing" as const,
      };
      replace(newData);

      try {
        const trimmedCode = absenceType.code?.trim() || "";
        const trimmedName = absenceType.name?.trim() || "";

        if (!trimmedCode || !trimmedName) {
          throw new Error(
            trimmedCode
              ? tMassive("validation.nameRequired")
              : tMassive("validation.codeRequired")
          );
        }

        const createData: AbsenceTypeCreateDto = {
          code: trimmedCode,
          name: trimmedName,
        };

        if (absenceType.integrationCode?.trim()) {
          createData.integrationCode = absenceType.integrationCode.trim();
        }

        await createAbsenceType(createData);
        processed++;
        setUploadProgress((processed / total) * 100);
        newData[i] = {
          ...newData[i],
          success: true,
          status: "success" as const,
        };
      } catch (error: any) {
        hasErrors = true;
        newData[i] = {
          ...newData[i],
          success: false,
          status: "error" as const,
          error:
            error.message ||
            error.response?.data?.message ||
            tMassive("toast.createError"),
        };
      }
      replace(newData);
    }

    setProcessing(false);
    const allSuccess = newData.every(
      (absenceType) => absenceType.status === "success"
    );
    setIsComplete(true);

    if (hasErrors) {
      toast({
        title: tMassive("toast.processCompletedWithErrors.title"),
        description: tMassive("toast.processCompletedWithErrors.description"),
        variant: "destructive",
      });
    } else {
      toast({
        title: tMassive("toast.processCompletedSuccess.title"),
        description: tMassive("toast.processCompletedSuccess.description"),
      });
      onSuccess();
    }
  };

  const renderTable = () => {
    if (fields.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-600 font-medium">
            {tMassive("table.noData")}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {tMassive("table.noDataDescription")}
          </p>
        </div>
      );
    }

    return (
      <CHEKIOTable>
        <CHEKIOTableHeader>
          <tr>
            <CHEKIOTableHead>{tMassive("table.headers.code")}</CHEKIOTableHead>
            <CHEKIOTableHead>{tMassive("table.headers.name")}</CHEKIOTableHead>
            <CHEKIOTableHead>
              {tMassive("table.headers.status")}
            </CHEKIOTableHead>
            <CHEKIOTableHead>
              {tMassive("table.headers.actions")}
            </CHEKIOTableHead>
          </tr>
        </CHEKIOTableHeader>
        <CHEKIOTableBody>
          {fields.map((field, index) => {
            const absenceType = watch(`absenceTypes.${index}`);
            const status = absenceType?.status || "pending";
            const isEditable = status === "error" || status === "pending";
            const isDisabled =
              status === "success" || (processing && status !== "error");

            return (
              <CHEKIOTableRow key={field.id} index={index}>
                <CHEKIOTableCell>
                  <SystemInput
                    control={control}
                    label=""
                    attribute={`absenceTypes.${index}.code`}
                    errors={errors}
                    rules={{ required: tMassive("validation.codeRequired") }}
                    value={absenceType?.code || ""}
                    placeholder={tMassive("table.placeholders.code")}
                    disabled={isDisabled}
                  />
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <SystemInput
                    control={control}
                    label=""
                    attribute={`absenceTypes.${index}.name`}
                    errors={errors}
                    rules={{ required: tMassive("validation.nameRequired") }}
                    value={absenceType?.name || ""}
                    placeholder={tMassive("table.placeholders.name")}
                    disabled={isDisabled}
                  />
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  {status === "pending" && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      Pendiente
                    </span>
                  )}
                  {status === "processing" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Procesando
                    </span>
                  )}
                  {status === "success" && (
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3" />
                        {tMassive("table.status.completed")}
                      </span>
                      <span className="text-xs text-green-600 mt-1 max-w-[200px]">
                        Tipo de ausencia creado con éxito
                      </span>
                    </div>
                  )}
                  {status === "error" && (
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        <X className="w-3 h-3" />
                        {tMassive("table.status.error")}
                      </span>
                      {absenceType?.error && (
                        <span className="text-xs text-red-500 mt-1 max-w-[200px]">
                          {absenceType.error}
                        </span>
                      )}
                    </div>
                  )}
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <CHEKIOActionButton
                    variant="delete"
                    onClick={() => remove(index)}
                    disabled={processing || status === "success"}
                    aria-label={tMassive("ariaLabels.deleteAbsenceType")}
                    className="h-auto w-auto px-3 py-1.5 gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar</span>
                  </CHEKIOActionButton>
                </CHEKIOTableCell>
              </CHEKIOTableRow>
            );
          })}
        </CHEKIOTableBody>
      </CHEKIOTable>
    );
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={tMassive("title")}
      size="5xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {processing && (
          <div className="mb-4">
            <CHEKIOProgressBar
              current={Math.round(uploadProgress)}
              total={100}
              text={tMassive("progress", {
                percent: Math.round(uploadProgress),
              })}
            />
          </div>
        )}
        <CHEKIOTabs>
          <CHEKIOTab
            type="button"
            active={activeTab === "1"}
            onClick={() => setActiveTab("1")}
          >
            {tMassive("tabs.excel")}
          </CHEKIOTab>
          <CHEKIOTab
            type="button"
            active={activeTab === "2"}
            onClick={() => setActiveTab("2")}
          >
            {tMassive("tabs.manual")}
          </CHEKIOTab>
        </CHEKIOTabs>

        {activeTab === "1" && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-medium mb-2">
                {tMassive("instructions.excel.title")}
              </h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>{tMassive("instructions.excel.step1")}</li>
                <li>{tMassive("instructions.excel.step2")}</li>
                <li>
                  <strong>Importante:</strong>{" "}
                  {tMassive("instructions.excel.step3")}
                </li>
                <li>{tMassive("instructions.excel.step4")}</li>
                <li>{tMassive("instructions.excel.step5")}</li>
              </ol>
            </div>
            <div className="flex gap-4">
              {!processing && !isComplete && (
                <>
                  <CHEKIOButton
                    type="button"
                    variant="primary"
                    onClick={downloadTemplate}
                  >
                    <Download className="h-4 w-4" />
                    {tMassive("buttons.downloadTemplate")}
                  </CHEKIOButton>
                  <Upload
                    beforeUpload={handleFileUpload}
                    accept=".xlsx,.xls"
                    showUploadList={false}
                  >
                    <CHEKIOButton type="button" variant="primary">
                      <UploadIcon className="h-4 w-4" />
                      {tMassive("buttons.uploadExcel")}
                    </CHEKIOButton>
                  </Upload>
                </>
              )}
            </div>
            <div className="overflow-x-auto">{renderTable()}</div>
          </div>
        )}

        {activeTab === "2" && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-medium mb-2">
                {tMassive("instructions.manual.title")}
              </h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>{tMassive("instructions.manual.step1")}</li>
                <li>{tMassive("instructions.manual.step2")}</li>
                <li>{tMassive("instructions.manual.step3")}</li>
                <li>{tMassive("instructions.manual.step4")}</li>
              </ol>
            </div>
            {!processing && !isComplete && (
              <CHEKIOButton
                type="button"
                variant="primary"
                onClick={handleAddRow}
              >
                <Plus className="h-4 w-4" />
                {tMassive("buttons.addRow")}
              </CHEKIOButton>
            )}
            <div className="overflow-x-auto">{renderTable()}</div>
          </div>
        )}

        <div className="space-y-4">
          {isComplete && (
            <div className="flex gap-4 pt-4 border-t">
              {absenceTypes.some(
                (absenceType: AbsenceTypeFormData) =>
                  absenceType?.status === "success"
              ) && (
                <CHEKIOButton
                  type="button"
                  variant="primary"
                  onClick={downloadSuccessfulAbsenceTypesExcel}
                >
                  <Download className="h-4 w-4" />
                  Descargar Exitosos
                </CHEKIOButton>
              )}
              {absenceTypes.some(
                (absenceType: AbsenceTypeFormData) =>
                  absenceType?.status === "error"
              ) && (
                <CHEKIOButton
                  type="button"
                  variant="secondaryBlue"
                  onClick={downloadErrorAbsenceTypesExcel}
                >
                  <Download className="h-4 w-4" />
                  Descargar Errores
                </CHEKIOButton>
              )}
            </div>
          )}
          <div className="flex justify-end gap-4">
            <CHEKIOButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={processing}
            >
              <X className="h-4 w-4" />
              {isComplete
                ? tMassive("buttons.close")
                : tMassive("buttons.cancel")}
            </CHEKIOButton>
            {!isComplete && (
              <CHEKIOButton
                type="submit"
                variant="primary"
                disabled={
                  processing || hasInvalidAbsenceTypes() || fields.length === 0
                }
                title={
                  hasInvalidAbsenceTypes()
                    ? tMassive("tooltips.incompleteFields")
                    : fields.length === 0
                    ? tMassive("tooltips.noData")
                    : tMassive("tooltips.process")
                }
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {tMassive("buttons.processing")}
                  </>
                ) : hasInvalidAbsenceTypes() ? (
                  tMassive("buttons.incompleteFields")
                ) : fields.length === 0 ? (
                  tMassive("buttons.noData")
                ) : (
                  tMassive("buttons.process")
                )}
              </CHEKIOButton>
            )}
          </div>
        </div>
      </form>
    </CHEKIOModal>
  );
}
