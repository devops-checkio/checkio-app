"use client";

import { CompanyOption } from "@/app/[locale]/mantainers/companies/_components/company.dto";
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
import SystemMultiSelect from "@/components/ui/multi-select";
import SystemInput from "@/components/ui/system-input";
import { useToast } from "@/hooks/use-toast";
import { useCreateJob } from "@/service/mantainer.service";
import { generateExcel } from "@/utils/excel";
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
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { JobCreateDto } from "./job.dto";

interface JobModalMasiveProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyOptions: CompanyOption[];
}

interface JobFormData extends JobCreateDto {
  error?: string;
  success?: boolean;
  status?: "pending" | "processing" | "success" | "error";
}

export default function JobModalMasive({
  isOpen,
  onClose,
  onSuccess,
  companyOptions,
}: JobModalMasiveProps) {
  const t = useTranslations("mantainers.jobs");
  const tMassive = useTranslations("mantainers.jobs.massive");
  const { toast } = useToast();
  const { mutateAsync: createJob } = useCreateJob();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [companyError, setCompanyError] = useState<string>("");

  const {
    control,
    formState: { errors },
    setValue,
    handleSubmit,
    reset,
    getValues,
    watch,
  } = useForm({
    defaultValues: {
      jobs: [] as JobFormData[],
    },
  });

  const { fields, append, replace, remove } = useFieldArray({
    control,
    name: "jobs",
  });

  const [activeTab, setActiveTab] = useState<string>("1");

  const handleExcelUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buf = e.target?.result;
      if (!(buf instanceof ArrayBuffer)) {
        return;
      }
      const jsonData = await parseFirstWorksheetToJsonRecords(buf);

      const firstStr = (...vals: unknown[]) => {
        for (const v of vals) {
          if (v !== null && v !== undefined && String(v).trim() !== "") {
            return String(v);
          }
        }
        return "";
      };
      const formattedData = jsonData.map((item: Record<string, unknown>) => ({
        code: firstStr(
          item.Código,
          item.Code,
          item.code,
          item[t("excel.headers.code")],
        ),
        name: firstStr(
          item.Nombre,
          item.Name,
          item.name,
          item[t("excel.headers.name")],
        ),
        description: firstStr(
          item.Descripción,
          item.Description,
          item.description,
          item[t("excel.headers.description")],
        ),
        companies: selectedCompanies,
        status: "pending" as const,
      }));

      replace(formattedData);
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        [t("excel.headers.code")]: "CARGO-001",
        [t("excel.headers.name")]: "Ejemplo Cargo",
        [t("excel.headers.description")]: "Descripción del cargo",
      },
    ];

    const headers = [
      { attribute: t("excel.headers.code"), header: t("excel.headers.code") },
      { attribute: t("excel.headers.name"), header: t("excel.headers.name") },
      {
        attribute: t("excel.headers.description"),
        header: t("excel.headers.description"),
      },
    ];

    generateExcel(templateData, headers, "plantilla_cargos");
  };

  const handleAddRow = () => {
    append({
      code: "",
      name: "",
      description: "",
      companies: selectedCompanies,
      status: "pending" as const,
    });
  };

  const onSubmit = async (data: { jobs: JobFormData[] }) => {
    if (selectedCompanies.length === 0) {
      setCompanyError(t("upsert.validation.companiesRequired"));
      return;
    }
    setCompanyError("");

    setProcessing(true);
    setUploadProgress(0);
    setIsComplete(false);

    const total = data.jobs.length;
    let processed = 0;
    let hasErrors = false;

    const newData = [...data.jobs];

    for (let i = 0; i < data.jobs.length; i++) {
      const job = data.jobs[i];

      newData[i] = {
        ...newData[i],
        status: "processing" as const,
      };
      replace(newData);

      try {
        await createJob({
          code: job.code,
          name: job.name,
          description: job.description,
          companies: selectedCompanies,
        });

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
          error: error.response?.data?.message || t("toast.error.description"),
        };
      }

      replace(newData);
    }

    setProcessing(false);
    const allSuccess = newData.every((job) => job.status === "success");
    setIsComplete(true);

    if (hasErrors) {
      toast({
        title: t("toast.processCompletedWithErrors.title"),
        description: t("toast.processCompletedWithErrors.description"),
        variant: "destructive",
      });
    } else {
      toast({
        title: t("toast.processCompletedSuccess.title"),
        description: t("toast.processCompletedSuccess.description"),
      });
      onSuccess();
      onClose();
    }
  };

  const renderTable = () => {
    if (fields.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-600 font-medium">
            {t("table.noDataMassive")}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {t("table.noDataMassiveDescription")}
          </p>
        </div>
      );
    }

    return (
      <CHEKIOTable>
        <CHEKIOTableHeader>
          <tr>
            <CHEKIOTableHead>{t("table.headers.code")}</CHEKIOTableHead>
            <CHEKIOTableHead>{t("table.headers.name")}</CHEKIOTableHead>
            <CHEKIOTableHead>{t("table.headers.description")}</CHEKIOTableHead>
            <CHEKIOTableHead>{t("table.headers.status")}</CHEKIOTableHead>
            <CHEKIOTableHead>{t("table.headers.actions")}</CHEKIOTableHead>
          </tr>
        </CHEKIOTableHeader>
        <CHEKIOTableBody>
          {fields.map((field, index) => {
            const job = getValues(`jobs.${index}`);
            const status = job?.status || "pending";
            const isEditable = status === "error" || status === "pending";
            const isDisabled =
              status === "success" || (processing && status !== "error");

            return (
              <CHEKIOTableRow key={field.id} index={index}>
                <CHEKIOTableCell>
                  <SystemInput
                    control={control}
                    label=""
                    attribute={`jobs.${index}.code`}
                    errors={errors}
                    rules={{ required: tMassive("validation.codeRequired") }}
                    value={job?.code || ""}
                    placeholder={t("upsert.placeholders.code")}
                    disabled={isDisabled}
                  />
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <SystemInput
                    control={control}
                    label=""
                    attribute={`jobs.${index}.name`}
                    errors={errors}
                    rules={{ required: tMassive("validation.nameRequired") }}
                    value={job?.name || ""}
                    placeholder={t("upsert.placeholders.name")}
                    disabled={isDisabled}
                  />
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <SystemInput
                    control={control}
                    label=""
                    attribute={`jobs.${index}.description`}
                    errors={errors}
                    rules={{
                      required: tMassive("validation.descriptionRequired"),
                    }}
                    value={job?.description || ""}
                    placeholder={t("upsert.placeholders.description")}
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
                        Cargo creado con éxito
                      </span>
                    </div>
                  )}
                  {status === "error" && (
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        <X className="w-3 h-3" />
                        {tMassive("table.status.error")}
                      </span>
                      {job?.error && (
                        <span className="text-xs text-red-500 mt-1 max-w-[200px]">
                          {job.error}
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
                    aria-label={tMassive("ariaLabels.deleteJob")}
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

  const handleSelectAll = () => {
    const allValues = companyOptions.map((option) => option.value);
    setSelectedCompanies(allValues);
  };

  useEffect(() => {
    if (selectedCompanies.length > 0) {
      setCompanyError("");
    }
  }, [selectedCompanies]);

  const jobs = watch("jobs");

  const downloadSuccessfulJobsExcel = useCallback(async () => {
    try {
      const data = getValues();
      const successfulJobs = data.jobs.filter(
        (job: JobFormData) => job?.status === "success"
      );

      if (successfulJobs.length === 0) {
        toast({
          title: "Sin registros",
          description: "No hay cargos cargados exitosamente",
          variant: "destructive",
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Cargos Exitosos");

      const headers = [
        t("excel.headers.code"),
        t("excel.headers.name"),
        t("excel.headers.description"),
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

      successfulJobs.forEach((job: JobFormData) => {
        worksheet.addRow([
          job.code || "",
          job.name || "",
          job.description || "",
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
      link.download = `cargos_exitosos_${DateTime.now().toFormat(
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando Excel de éxitos:", error);
      toast({
        title: "Error",
        description: "Error al generar el archivo Excel de cargos exitosos",
        variant: "destructive",
      });
    }
  }, [getValues, toast, t]);

  const downloadErrorJobsExcel = useCallback(async () => {
    try {
      const data = getValues();
      const errorJobs = data.jobs.filter(
        (job: JobFormData) => job?.status === "error"
      );

      if (errorJobs.length === 0) {
        toast({
          title: "Sin registros",
          description: "No hay cargos con errores",
          variant: "destructive",
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Cargos con Errores");

      const headers = [
        t("excel.headers.code"),
        t("excel.headers.name"),
        t("excel.headers.description"),
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

      errorJobs.forEach((job: JobFormData) => {
        worksheet.addRow([
          job.code || "",
          job.name || "",
          job.description || "",
          job.error || "",
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
      link.download = `cargos_errores_${DateTime.now().toFormat(
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando Excel de errores:", error);
      toast({
        title: "Error",
        description: "Error al generar el archivo Excel de cargos con errores",
        variant: "destructive",
      });
    }
  }, [getValues, toast, t]);

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={tMassive("title")}
      size="5xl"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        data-tour="jobs-modal-masive"
      >
        <div className="mb-4">
          <SystemMultiSelect
            control={control}
            label="Empresas"
            attribute="companies"
            options={companyOptions}
            errors={errors}
            rules={{ required: "Por favor seleccione al menos una empresa" }}
            placeholder="Seleccione las empresas"
            showSelectAll={true}
            onSelectAll={handleSelectAll}
            searchable={true}
            showClear={true}
            maxItems={3}
            showError={true}
            disabled={isComplete}
            onChange={(values) => {
              setSelectedCompanies(values);
              setCompanyError("");
            }}
          />
        </div>

        {processing && (
          <div className="mb-4">
            <CHEKIOProgressBar
              current={Math.round(uploadProgress)}
              total={100}
              text={`Procesando: ${Math.round(uploadProgress)}%`}
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
                <li>{tMassive("instructions.excel.step3")}</li>
                <li>{tMassive("instructions.excel.step4")}</li>
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
                    {t("buttons.downloadTemplate")}
                  </CHEKIOButton>
                  <Upload
                    beforeUpload={handleExcelUpload}
                    accept=".xlsx,.xls"
                    showUploadList={false}
                  >
                    <CHEKIOButton type="button" variant="primary">
                      <UploadIcon className="h-4 w-4" />
                      {t("buttons.uploadExcel")}
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
                {t("buttons.addRow")}
              </CHEKIOButton>
            )}
            <div className="overflow-x-auto">{renderTable()}</div>
          </div>
        )}

        <div className="space-y-4">
          {isComplete && (
            <div className="flex gap-4 pt-4 border-t">
              {jobs.some((job: JobFormData) => job?.status === "success") && (
                <CHEKIOButton
                  type="button"
                  variant="primary"
                  onClick={downloadSuccessfulJobsExcel}
                >
                  <Download className="h-4 w-4" />
                  Descargar Exitosos
                </CHEKIOButton>
              )}
              {jobs.some((job: JobFormData) => job?.status === "error") && (
                <CHEKIOButton
                  type="button"
                  variant="secondaryBlue"
                  onClick={downloadErrorJobsExcel}
                >
                  <Download className="h-4 w-4" />
                  Descargar Errores
                </CHEKIOButton>
              )}
            </div>
          )}
          <div className="flex justify-end gap-4 mt-6">
            <CHEKIOButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={processing}
            >
              <X className="h-4 w-4" />
              {isComplete ? t("buttons.close") : t("buttons.cancel")}
            </CHEKIOButton>
            {!isComplete && (
              <CHEKIOButton
                type="submit"
                variant="primary"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("buttons.processing")}
                  </>
                ) : (
                  t("buttons.process")
                )}
              </CHEKIOButton>
            )}
          </div>
        </div>
      </form>
    </CHEKIOModal>
  );
}
