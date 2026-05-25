"use client";

import {
  CHEKIOActionButton,
  CHEKIOButton,
  CHEKIOModal,
  CHEKIOProgressBar,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
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
import { documentValidators, formatDocumentType } from "@/lib/utils";
import { useCreateCompany } from "@/service/mantainer.service";
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
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  CompanyCreateDto,
  DocumentType,
  DocumentTypeOptions,
} from "./company.dto";

// Options for Transitory Service selector
const TransitoryServiceOptions = [
  { value: "Sí", label: "Sí" },
  { value: "No", label: "No" },
];

// Helper functions for transitory service conversion
const convertTransitoryServiceToExcel = (value: boolean): string => {
  return value ? "Sí" : "No";
};

const convertTransitoryServiceFromExcel = (value: string): boolean => {
  return (
    value === "Sí" ||
    value === "SI" ||
    value === "si" ||
    value === "true" ||
    value === "True"
  );
};

interface CompanyModalMasiveProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CompanyFormData extends CompanyCreateDto {
  error?: string;
  status?: "pending" | "processing" | "success" | "error";
  transitoryServiceDisplay?: string;
}

interface FormValues {
  companies: CompanyFormData[];
}

export default function CompanyModalMasive({
  isOpen,
  onClose,
  onSuccess,
}: CompanyModalMasiveProps) {
  const t = useTranslations("mantainers.companies");
  const tMassive = useTranslations("mantainers.companies.massive");
  const tDetail = useTranslations("mantainers.companies.detail");
  const { mutateAsync: createCompany } = useCreateCompany();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("1");
  const [documentValidationStates, setDocumentValidationStates] = useState<{
    [key: number]: boolean | null;
  }>({});

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
      companies: [] as CompanyFormData[],
    },
  });

  const { fields, append, replace, remove } = useFieldArray({
    control,
    name: "companies",
  });

  // Watch all document types and numbers
  const documentTypes =
    watch("companies")?.map((company) => company.documentType) || [];
  const documentNumbers =
    watch("companies")?.map((company) => company.documentNumber) || [];

  // Effect to validate documents when they change
  useEffect(() => {
    const newValidationStates = { ...documentValidationStates };
    let hasChanges = false;

    fields.forEach((_, index) => {
      const docType = documentTypes[index];
      const docNumber = documentNumbers[index];

      if (docType && docNumber) {
        const validator =
          documentValidators[docType as keyof typeof documentValidators];
        if (validator) {
          const isValid = validator(String(docNumber));
          if (newValidationStates[index] !== isValid) {
            newValidationStates[index] = isValid;
            hasChanges = true;
          }
        }
      } else {
        if (newValidationStates[index] !== null) {
          newValidationStates[index] = null;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setDocumentValidationStates(newValidationStates);
    }
  }, [documentTypes, documentNumbers, fields]);

  // Check if all documents are valid
  const areAllDocumentsValid = () => {
    if (fields.length === 0) return false;

    return fields.every((_, index) => {
      const docType = documentTypes[index];
      const docNumber = documentNumbers[index];

      if (!docType || !docNumber) return false;

      const validator =
        documentValidators[docType as keyof typeof documentValidators];
      if (!validator) return false;

      return validator(String(docNumber));
    });
  };

  // Check if there are any invalid documents
  const hasInvalidDocuments = () => {
    return fields.some((_, index) => {
      const docType = documentTypes[index];
      const docNumber = documentNumbers[index];

      if (!docType || !docNumber) return true; // Missing data is invalid

      const validator =
        documentValidators[docType as keyof typeof documentValidators];
      if (!validator) return true; // Unknown document type is invalid

      return !validator(String(docNumber)); // Invalid document number
    });
  };

  // Effect to format document numbers when they change
  useEffect(() => {
    fields.forEach((_, index) => {
      const docType = documentTypes[index];
      const docNumber = documentNumbers[index];

      if (docType && docNumber) {
        const formatter =
          formatDocumentType[docType as keyof typeof formatDocumentType];
        if (formatter) {
          const formattedValue = formatter(String(docNumber));
          if (formattedValue && formattedValue !== String(docNumber)) {
            setValue(`companies.${index}.documentNumber`, formattedValue);
          }
        }
      }
    });
  }, [documentTypes, documentNumbers, fields, setValue]);

  const handleExcelUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buf = e.target?.result;
      if (!(buf instanceof ArrayBuffer)) {
        return;
      }
      const jsonData = await parseFirstWorksheetToJsonRecords(buf);

      const formattedData = jsonData.map((item: Record<string, unknown>) => {
        const firstStr = (...vals: unknown[]) => {
          for (const v of vals) {
            if (v !== null && v !== undefined && String(v).trim() !== "") {
              return String(v);
            }
          }
          return "";
        };
        const transitoryServiceRaw = firstStr(
          item[tMassive("excel.headers.transitoryService")],
          item["Servicio Transitorio"],
        );
        return {
          documentType: firstStr(
            item[tMassive("excel.headers.documentType")],
            item["Tipo de Documento"],
          ) as DocumentType,
          documentNumber: firstStr(
            item[tMassive("excel.headers.documentNumber")],
            item["Número de Documento"],
          ),
          businessName: firstStr(
            item[tMassive("excel.headers.businessName")],
            item["Razón Social"],
          ),
          tradeName: firstStr(
            item[tMassive("excel.headers.tradeName")],
            item["Nombre Comercial"],
          ),
          address: firstStr(
            item[tMassive("excel.headers.address")],
            item["Dirección"],
          ),
          transitoryService: convertTransitoryServiceFromExcel(
            transitoryServiceRaw,
          ),
          transitoryServiceDisplay: transitoryServiceRaw,
          status: "pending" as const,
        };
      });

      replace(formattedData);
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const downloadTemplate = useCallback(async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(tMassive("excel.templateName"));

      const headers = [
        tMassive("excel.headers.documentType"),
        tMassive("excel.headers.documentNumber"),
        tMassive("excel.headers.businessName"),
        tMassive("excel.headers.tradeName"),
        tMassive("excel.headers.address"),
        tMassive("excel.headers.transitoryService"),
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
        tMassive("excel.example.documentType"),
        tMassive("excel.example.documentNumber"),
        tMassive("excel.example.businessName"),
        tMassive("excel.example.tradeName"),
        tMassive("excel.example.address"),
        tMassive("excel.example.transitoryService"),
      ]);

      worksheet.getColumn(1).width = 20;
      worksheet.getColumn(2).width = 25;
      worksheet.getColumn(3).width = 30;
      worksheet.getColumn(4).width = 25;
      worksheet.getColumn(5).width = 35;
      worksheet.getColumn(6).width = 20;

      for (let row = 2; row <= 1000; row++) {
        const cell = worksheet.getCell(`F${row}`);
        cell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: ['"Sí,No"'],
          showErrorMessage: true,
          errorTitle: tMassive("excel.validation.transitoryService.errorTitle"),
          error: tMassive("excel.validation.transitoryService.error"),
          showInputMessage: true,
          promptTitle: tMassive(
            "excel.validation.transitoryService.promptTitle"
          ),
          prompt: tMassive("excel.validation.transitoryService.prompt"),
        };
      }

      const docTypeOptions = DocumentTypeOptions.map((d) => d.value).join(",");
      for (let row = 2; row <= 1000; row++) {
        const cell = worksheet.getCell(`A${row}`);
        cell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [`"${docTypeOptions}"`],
          showErrorMessage: true,
          errorTitle: tMassive("excel.validation.documentType.errorTitle"),
          error: tMassive("excel.validation.documentType.error"),
          showInputMessage: true,
          promptTitle: tMassive("excel.validation.documentType.promptTitle"),
          prompt: tMassive("excel.validation.documentType.prompt"),
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${tMassive("excel.filename")}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando plantilla:", error);
      toast({
        title: "Error",
        description: "Error al generar la plantilla Excel",
        variant: "destructive",
      });
    }
  }, [tMassive, toast]);

  const handleAddRow = () => {
    append({
      documentType: DocumentType.RUT,
      documentNumber: "",
      businessName: "",
      tradeName: "",
      address: "",
      transitoryService: false,
      transitoryServiceDisplay: "No",
      status: "pending",
    });
  };

  const onSubmit = async (data: FormValues) => {
    // Validate all documents before processing
    if (hasInvalidDocuments()) {
      toast({
        title: tMassive("validation.validationError"),
        description: tMassive("validation.validationErrorDescription"),
        variant: "destructive",
      });
      return;
    }

    if (fields.length === 0) {
      toast({
        title: tMassive("validation.noCompaniesWarning"),
        description: tMassive("validation.noCompaniesWarningDescription"),
        variant: "default",
      });
      return;
    }

    setProcessing(true);
    const total = data.companies.length;
    let processed = 0;
    let hasErrors = false;

    const newData = [...data.companies];

    for (let i = 0; i < data.companies.length; i++) {
      const company = { ...data.companies[i] };
      delete company.transitoryServiceDisplay;
      delete company.status;
      delete company.error;
      newData[i] = { ...newData[i], status: "processing" };
      replace(newData);
      try {
        await createCompany(company);

        processed++;
        setUploadProgress((processed / total) * 100);
        newData[i] = { ...newData[i], status: "success" };
        replace(newData);
      } catch (error: any) {
        hasErrors = true;
        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          tMassive("toast.error.description");
        newData[i] = {
          ...newData[i],
          status: "error",
          error: errorMessage,
        };
        replace(newData);
      }
    }

    setProcessing(false);
    setIsComplete(true);

    if (hasErrors) {
      toast({
        title: tMassive("toast.processCompletedWithErrors.title"),
        description: tMassive("toast.processCompletedWithErrors.description"),
        variant: "default",
      });
    } else {
      toast({
        title: tMassive("toast.processCompletedSuccess.title"),
        description: tMassive("toast.processCompletedSuccess.description"),
        variant: "default",
      });
      onSuccess();
    }
  };

  const downloadSuccessfulCompaniesExcel = useCallback(async () => {
    try {
      const data = getValues();
      const successfulCompanies = data.companies.filter(
        (comp: CompanyFormData) => comp.status === "success"
      );

      if (successfulCompanies.length === 0) {
        toast({
          title: "Sin registros",
          description: "No hay empresas cargadas exitosamente",
          variant: "destructive",
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Empresas Exitosas");

      const headers = [
        tMassive("excel.headers.documentType"),
        tMassive("excel.headers.documentNumber"),
        tMassive("excel.headers.businessName"),
        tMassive("excel.headers.tradeName"),
        tMassive("excel.headers.address"),
        tMassive("excel.headers.transitoryService"),
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

      successfulCompanies.forEach((company: CompanyFormData) => {
        worksheet.addRow([
          company.documentType || "",
          company.documentNumber || "",
          company.businessName || "",
          company.tradeName || "",
          company.address || "",
          convertTransitoryServiceToExcel(company.transitoryService || false),
        ]);
      });

      worksheet.getColumn(1).width = 20;
      worksheet.getColumn(2).width = 25;
      worksheet.getColumn(3).width = 30;
      worksheet.getColumn(4).width = 25;
      worksheet.getColumn(5).width = 35;
      worksheet.getColumn(6).width = 20;

      for (let row = 2; row <= 1000; row++) {
        const cell = worksheet.getCell(`F${row}`);
        cell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: ['"Sí,No"'],
        };
      }

      const docTypeOptions = DocumentTypeOptions.map((d) => d.value).join(",");
      for (let row = 2; row <= 1000; row++) {
        const cell = worksheet.getCell(`A${row}`);
        cell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [`"${docTypeOptions}"`],
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `empresas_exitosas_${DateTime.now().toFormat(
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando Excel de éxitos:", error);
      toast({
        title: "Error",
        description: "Error al generar el archivo Excel de empresas exitosas",
        variant: "destructive",
      });
    }
  }, [getValues, toast, tMassive]);

  const downloadErrorCompaniesExcel = useCallback(async () => {
    try {
      const data = getValues();
      const errorCompanies = data.companies.filter(
        (comp: CompanyFormData) => comp.status === "error"
      );

      if (errorCompanies.length === 0) {
        toast({
          title: "Sin registros",
          description: "No hay empresas con errores",
          variant: "destructive",
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Empresas con Errores");

      const headers = [
        tMassive("excel.headers.documentType"),
        tMassive("excel.headers.documentNumber"),
        tMassive("excel.headers.businessName"),
        tMassive("excel.headers.tradeName"),
        tMassive("excel.headers.address"),
        tMassive("excel.headers.transitoryService"),
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

      errorCompanies.forEach((company: CompanyFormData) => {
        worksheet.addRow([
          company.documentType || "",
          company.documentNumber || "",
          company.businessName || "",
          company.tradeName || "",
          company.address || "",
          convertTransitoryServiceToExcel(company.transitoryService || false),
          company.error || "",
        ]);
      });

      worksheet.getColumn(1).width = 20;
      worksheet.getColumn(2).width = 25;
      worksheet.getColumn(3).width = 30;
      worksheet.getColumn(4).width = 25;
      worksheet.getColumn(5).width = 35;
      worksheet.getColumn(6).width = 20;
      worksheet.getColumn(7).width = 40;

      for (let row = 2; row <= 1000; row++) {
        const cell = worksheet.getCell(`F${row}`);
        cell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: ['"Sí,No"'],
        };
      }

      const docTypeOptions = DocumentTypeOptions.map((d) => d.value).join(",");
      for (let row = 2; row <= 1000; row++) {
        const cell = worksheet.getCell(`A${row}`);
        cell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [`"${docTypeOptions}"`],
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `empresas_errores_${DateTime.now().toFormat(
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando Excel de errores:", error);
      toast({
        title: "Error",
        description:
          "Error al generar el archivo Excel de empresas con errores",
        variant: "destructive",
      });
    }
  }, [getValues, toast, tMassive]);

  const columns = [
    {
      title: tMassive("table.headers.documentType"),
      dataIndex: "documentType",
      key: "documentType",
      render: (_: any, record: any, index: number) => (
        <Controller
          name={`companies.${index}.documentType`}
          control={control}
          rules={{ required: tMassive("validation.fieldRequired") }}
          render={({ field }) => (
            <div>
              <CHEKIOSelect
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  // Reset document number when type changes
                  setValue(`companies.${index}.documentNumber`, "", {
                    shouldValidate: true,
                  });
                  setDocumentValidationStates((prev) => ({
                    ...prev,
                    [index]: null,
                  }));
                }}
              >
                <CHEKIOSelectTrigger
                  className={
                    errors.companies?.[index]?.documentType
                      ? "border-red-500"
                      : ""
                  }
                >
                  <CHEKIOSelectValue
                    placeholder={tMassive("table.placeholders.documentType")}
                  />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  {DocumentTypeOptions.map((option) => (
                    <CHEKIOSelectItem key={option.value} value={option.value}>
                      {option.label}
                    </CHEKIOSelectItem>
                  ))}
                </CHEKIOSelectContent>
              </CHEKIOSelect>
              {errors.companies?.[index]?.documentType && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.companies[index].documentType.message}
                </p>
              )}
            </div>
          )}
        />
      ),
    },
    {
      title: tMassive("table.headers.documentNumber"),
      dataIndex: "documentNumber",
      key: "documentNumber",
      render: (_: any, record: any, index: number) => (
        <Controller
          name={`companies.${index}.documentNumber`}
          control={control}
          rules={{
            required: tMassive("validation.fieldRequired"),
            validate: (value) => {
              const docType = getValues(`companies.${index}.documentType`);
              if (!docType) return true;
              const validator =
                documentValidators[docType as keyof typeof documentValidators];
              return validator && validator(String(value || ""))
                ? true
                : tMassive("validation.invalidDocumentFormat");
            },
          }}
          render={({ field }) => (
            <div>
              <div className="relative">
                <input
                  {...field}
                  className={`w-full p-2 border ${
                    errors.companies?.[index]?.documentNumber
                      ? "border-red-500"
                      : documentValidationStates[index] === true
                      ? "border-green-500"
                      : documentValidationStates[index] === false
                      ? "border-yellow-500"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder={(() => {
                    const docType = getValues(
                      `companies.${index}.documentType`
                    );
                    return docType
                      ? tDetail(`documentExamples.${docType}` as any, {
                          default: tMassive(
                            "table.placeholders.documentNumber"
                          ),
                        })
                      : tMassive("table.placeholders.documentNumber");
                  })()}
                  onChange={(e) => {
                    field.onChange(e);
                    const docType = getValues(
                      `companies.${index}.documentType`
                    );
                    if (docType) {
                      const formatter =
                        formatDocumentType[
                          docType as keyof typeof formatDocumentType
                        ];
                      if (formatter && e.target.value) {
                        const formattedValue = formatter(e.target.value);
                        if (formattedValue !== e.target.value) {
                          setValue(
                            `companies.${index}.documentNumber`,
                            formattedValue,
                            {
                              shouldValidate: false,
                              shouldDirty: true,
                            }
                          );
                        }
                      }
                    }
                  }}
                />
                {documentValidationStates[index] !== null && field.value && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {documentValidationStates[index] ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-yellow-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {errors.companies?.[index]?.documentNumber && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.companies[index].documentNumber.message}
                </p>
              )}
              {getValues(`companies.${index}.documentType`) && (
                <div className="flex items-center justify-between mt-1">
                  {documentValidationStates[index] === false && field.value && (
                    <p className="text-xs text-yellow-600 font-medium">
                      {tDetail("invalidDocument")}
                    </p>
                  )}
                  {documentValidationStates[index] === true && field.value && (
                    <p className="text-xs text-green-600 font-medium">
                      {tDetail("validDocument")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        />
      ),
    },
    {
      title: tMassive("table.headers.businessName"),
      dataIndex: "businessName",
      key: "businessName",
      render: (_: any, record: any, index: number) => (
        <SystemInput
          control={control}
          label=""
          attribute={`companies.${index}.businessName`}
          errors={errors}
          rules={{ required: tMassive("validation.fieldRequired") }}
          placeholder={tMassive("table.placeholders.businessName")}
        />
      ),
    },
    {
      title: tMassive("table.headers.tradeName"),
      dataIndex: "tradeName",
      key: "tradeName",
      render: (_: any, record: any, index: number) => (
        <SystemInput
          control={control}
          label=""
          attribute={`companies.${index}.tradeName`}
          errors={errors}
          rules={{ required: tMassive("validation.fieldRequired") }}
          placeholder={tMassive("table.placeholders.tradeName")}
        />
      ),
    },
    {
      title: tMassive("table.headers.address"),
      dataIndex: "address",
      key: "address",
      render: (_: any, record: any, index: number) => (
        <SystemInput
          control={control}
          label=""
          attribute={`companies.${index}.address`}
          errors={errors}
          rules={{ required: tMassive("validation.fieldRequired") }}
          placeholder={tMassive("table.placeholders.address")}
        />
      ),
    },
    {
      title: tMassive("table.headers.transitoryService"),
      dataIndex: "transitoryService",
      key: "transitoryService",
      render: (_: any, record: any, index: number) => (
        <Controller
          name={`companies.${index}.transitoryServiceDisplay`}
          control={control}
          rules={{ required: tMassive("validation.fieldRequired") }}
          render={({ field }) => (
            <div>
              <CHEKIOSelect
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  // Update the actual boolean value
                  setValue(
                    `companies.${index}.transitoryService`,
                    convertTransitoryServiceFromExcel(value)
                  );
                }}
              >
                <CHEKIOSelectTrigger
                  className={
                    errors.companies?.[index]?.transitoryServiceDisplay
                      ? "border-red-500"
                      : ""
                  }
                >
                  <CHEKIOSelectValue placeholder="Sí" />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  {TransitoryServiceOptions.map((option) => (
                    <CHEKIOSelectItem key={option.value} value={option.value}>
                      {option.label}
                    </CHEKIOSelectItem>
                  ))}
                </CHEKIOSelectContent>
              </CHEKIOSelect>
              {errors.companies?.[index]?.transitoryServiceDisplay && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.companies[index].transitoryServiceDisplay.message}
                </p>
              )}
            </div>
          )}
        />
      ),
    },
    {
      title: tMassive("table.headers.status"),
      dataIndex: "status",
      key: "status",
      render: (_: any, record: any, index: number) => {
        const company = getValues(`companies.${index}`);
        const status = company?.status || "pending";
        const error = company?.error;

        if (status === "processing") {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              <Loader2 className="w-3 h-3 animate-spin" />
              Procesando
            </span>
          );
        }

        if (status === "success") {
          return (
            <div className="flex flex-col">
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                <CheckCircle2 className="w-3 h-3" />
                Exitoso
              </span>
              <span className="text-xs text-green-600 mt-1 max-w-[200px]">
                Empresa cargada con éxito
              </span>
            </div>
          );
        }

        if (status === "error" && error) {
          return (
            <div className="flex flex-col">
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                <X className="w-3 h-3" />
                Error
              </span>
              <span className="text-xs text-red-500 mt-1 max-w-[200px]">
                {error}
              </span>
            </div>
          );
        }

        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Pendiente
          </span>
        );
      },
    },
    {
      title: tMassive("table.headers.actions"),
      key: "actions",
      render: (_: any, record: any, index: number) => (
        <CHEKIOActionButton
          variant="delete"
          onClick={() => remove(index)}
          aria-label={t("ariaLabels.deleteCompany")}
          className="h-auto w-auto px-3 py-1.5 gap-1.5"
        >
          <Trash2 className="h-4 w-4" />
          <span>Eliminar</span>
        </CHEKIOActionButton>
      ),
    },
  ];

  const renderTable = () => (
    <CHEKIOTable>
      <CHEKIOTableHeader>
        <tr>
          {columns.map((col, idx) => (
            <CHEKIOTableHead key={idx}>{col.title}</CHEKIOTableHead>
          ))}
        </tr>
      </CHEKIOTableHeader>
      <CHEKIOTableBody>
        {fields.map((field, index) => (
          <CHEKIOTableRow key={field.id} index={index}>
            {columns.map((col, colIdx) => (
              <CHEKIOTableCell key={colIdx}>
                {col.render
                  ? col.render(
                      (field as any)[col.dataIndex || col.key || ""],
                      field,
                      index
                    )
                  : (field as any)[col.dataIndex || col.key || ""]}
              </CHEKIOTableCell>
            ))}
          </CHEKIOTableRow>
        ))}
      </CHEKIOTableBody>
    </CHEKIOTable>
  );

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={tMassive("title")}
      size="7xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {processing && (
          <div className="mb-4">
            <CHEKIOProgressBar
              current={Math.round(uploadProgress)}
              total={100}
              text={`${tMassive("buttons.processing")}: ${Math.round(
                uploadProgress
              )}%`}
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
                  <strong>{tDetail("important")}</strong> En la columna &quot;
                  {tMassive("excel.headers.transitoryService")}&quot; seleccione
                  &quot;Sí&quot; o &quot;No&quot; desde el menú desplegable
                </li>
                <li>{tMassive("instructions.excel.step3")}</li>
                <li>{tMassive("instructions.excel.step4")}</li>
              </ol>
              <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                <p className="text-sm text-green-700">
                  <strong>💡 Tip:</strong> La plantilla incluye validación de
                  datos para facilitar el llenado. Use los menús desplegables
                  para &quot;{tMassive("excel.headers.documentType")}&quot; y
                  &quot;{tMassive("excel.headers.transitoryService")}&quot;.
                </p>
              </div>
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
                    beforeUpload={handleExcelUpload}
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

        {isComplete && (
          <div className="flex gap-4 pt-4 border-t">
            {getValues().companies.some(
              (comp: CompanyFormData) => comp.status === "success"
            ) && (
              <CHEKIOButton
                type="button"
                variant="primary"
                onClick={downloadSuccessfulCompaniesExcel}
              >
                <Download className="h-4 w-4" />
                Descargar Exitosos
              </CHEKIOButton>
            )}
            {getValues().companies.some(
              (comp: CompanyFormData) => comp.status === "error"
            ) && (
              <CHEKIOButton
                type="button"
                variant="secondaryBlue"
                onClick={downloadErrorCompaniesExcel}
              >
                <Download className="h-4 w-4" />
                Descargar Errores
              </CHEKIOButton>
            )}
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
          <CHEKIOButton type="button" variant="secondary" onClick={onClose}>
            {isComplete
              ? tMassive("buttons.close")
              : tMassive("buttons.cancel")}
          </CHEKIOButton>
          {!isComplete && (
            <CHEKIOButton
              type="button"
              variant="primary"
              onClick={handleSubmit(onSubmit)}
              disabled={
                processing || hasInvalidDocuments() || fields.length === 0
              }
              title={
                hasInvalidDocuments()
                  ? tMassive("validation.validationErrorDescription")
                  : fields.length === 0
                  ? tMassive("validation.noCompaniesWarningDescription")
                  : tMassive("buttons.process")
              }
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tMassive("buttons.processing")}
                </>
              ) : hasInvalidDocuments() ? (
                tMassive("validation.invalidDocumentFormat")
              ) : fields.length === 0 ? (
                tMassive("table.noData")
              ) : (
                tMassive("buttons.process")
              )}
            </CHEKIOButton>
          )}
        </div>
      </form>
    </CHEKIOModal>
  );
}
