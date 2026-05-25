"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOModal,
  CHEKIOProgressBar,
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
import SystemDatePicker from "@/components/ui/system-date-picker";
import SystemInput from "@/components/ui/system-input";
import { useCookieSession } from "@/context/useCookieSession";
import { useToast } from "@/hooks/use-toast";
import { useGetEmployees } from "@/service/mantainer.service";
import {
  useCreateOvertimeRequest,
  useGetPresignedUploadUrl,
} from "@/service/overtime-request.service";
import { getApiErrorMessage } from "@/utils/api-error-message";
import { parseFirstWorksheetToJsonRecords } from "@/utils/parseXlsxFirstSheet";
import ExcelJS from "exceljs";
import {
  CheckCircle2,
  Download,
  FileText,
  Hash,
  Info,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  buildOvertimeApiDates,
  isScheduleEndAfterStart,
  normalizeDateOnlyString,
  normalizeTimeString,
} from "./overtime-request-datetime";
import {
  OvertimeRequestCreateDto,
  OvertimeRequestType,
} from "./overtime-request.dto";

const EMPLOYEE_SELECT_NONE = "__none__";

type OvertimeRowValidationCode =
  | "dates"
  | "times"
  | "range"
  | "applicationDate"
  | "minutes";

function getOvertimeRowValidation(
  request: OvertimeRequestFormData,
  requestType: OvertimeRequestType,
): OvertimeRowValidationCode | null {
  if (requestType === OvertimeRequestType.PER_SCHEDULE) {
    if (!request.startDate?.trim() || !request.endDate?.trim()) {
      return "dates";
    }
    if (!request.startTime?.trim() || !request.endTime?.trim()) {
      return "times";
    }
    const { startDate, endDate } = buildOvertimeApiDates("PER_SCHEDULE", {
      startDate: normalizeDateOnlyString(request.startDate),
      endDate: normalizeDateOnlyString(request.endDate),
      startTime: request.startTime,
      endTime: request.endTime,
    });
    if (!startDate || !endDate || !isScheduleEndAfterStart(startDate, endDate)) {
      return "range";
    }
  } else {
    if (!normalizeDateOnlyString(request.startDate)) {
      return "applicationDate";
    }
    const before = request.aditionHoursBeforeMinutes ?? 0;
    const after = request.aditionHoursAfterMinutes ?? 0;
    if (before <= 0 && after <= 0) {
      return "minutes";
    }
  }
  return null;
}

function rowValidationMessage(
  code: OvertimeRowValidationCode,
  tModal: (key: string) => string,
): string {
  switch (code) {
    case "dates":
      return tModal("validation.errors.dateRequired.description");
    case "times":
      return tModal("validation.errors.timeRequired.description");
    case "range":
      return tModal("validation.errors.invalidRange.description");
    case "applicationDate":
      return tModal("validation.errors.applicationDateRequired.description");
    case "minutes":
      return tModal("validation.errors.hoursRequired.description");
    default:
      return "";
  }
}

function normalizeDocumentNumber(docNumber: string): string {
  if (!docNumber) return "";
  return docNumber
    .trim()
    .replace(/\./g, "")
    .replace(/\s/g, "")
    .replace(/-/g, "")
    .toUpperCase();
}

enum ChekioButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  SECONDARY_BLUE = "secondaryBlue",
  APPROVE = "approve",
}

interface OvertimeRequestModalMasiveProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OvertimeRequestFormData {
  documentNumber: string;
  type: OvertimeRequestType;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  aditionHoursBeforeMinutes?: number;
  aditionHoursAfterMinutes?: number;
  observation?: string;
  documentFile?: File;
  employeeId?: string;
  error?: string;
  success?: boolean;
  status?: "pending" | "processing" | "success" | "error";
}

interface FormValues {
  globalType: OvertimeRequestType;
  requests: OvertimeRequestFormData[];
}

export function OvertimeRequestModalMasive({
  isOpen,
  onClose,
  onSuccess,
}: OvertimeRequestModalMasiveProps) {
  const t = useTranslations("operations.requests.overtime.massive");
  const tModal = useTranslations("operations.requests.overtime.modal");
  const { toast } = useToast();
  const { companyId, getTemplateUser } = useCookieSession();
  const templatePrimary = getTemplateUser().primary;
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const { data: employeesData } = useGetEmployees({
    page: 1,
    pageSize: 10000,
    sort: "asc",
    companyId: companyId || "",
    status: "active",
  });

  const employeesSorted = useMemo(() => {
    const list = employeesData?.data ?? [];
    return [...list].sort((a: any, b: any) => {
      const na = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim();
      const nb = `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim();
      return na.localeCompare(nb, "es");
    });
  }, [employeesData?.data]);

  const findEmployeeByRequest = useCallback(
    (request: OvertimeRequestFormData) => {
      if (request.employeeId) {
        return employeesData?.data?.find(
          (emp: { publicId: string }) => emp.publicId === request.employeeId
        );
      }
      const normalizedDocNumber = normalizeDocumentNumber(
        String(request.documentNumber ?? "")
      );
      if (!normalizedDocNumber) return undefined;
      return employeesData?.data?.find((emp: any) => {
        if (!emp.documentNumber) return false;
        const normalizedEmpDoc = normalizeDocumentNumber(emp.documentNumber);
        return (
          normalizedEmpDoc === normalizedDocNumber ||
          emp.documentNumber === request.documentNumber ||
          normalizedEmpDoc === request.documentNumber ||
          emp.documentNumber === normalizedDocNumber
        );
      });
    },
    [employeesData?.data]
  );

  const createOvertimeRequest = useCreateOvertimeRequest();
  const { mutateAsync: getPresignedUploadUrl } = useGetPresignedUploadUrl();

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<FormValues>({
    defaultValues: {
      globalType: OvertimeRequestType.PER_SCHEDULE,
      requests: [],
    },
  });

  const globalType = watch("globalType");

  const { fields, append, replace, remove } = useFieldArray({
    control,
    name: "requests",
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
      setUploadProgress(0);
      setProcessing(false);
      setIsComplete(false);
    }
  }, [isOpen, reset]);

  const requests = watch("requests");

  const downloadSuccessfulRequestsExcel = useCallback(async () => {
    try {
      const data = getValues();
      const successfulRequests = data.requests.filter(
        (req: OvertimeRequestFormData) => req?.status === "success"
      );

      if (successfulRequests.length === 0) {
        toast({
          title: "Sin registros",
          description: "No hay solicitudes creadas exitosamente",
          variant: "destructive",
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Solicitudes Exitosas");

      const headers = [
        "Número de Documento",
        "Tipo",
        "Fecha Inicio",
        "Hora Inicio",
        "Fecha Fin",
        "Hora Fin",
        "Minutos Adicionales Antes",
        "Minutos Adicionales Después",
        "Observación",
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

      successfulRequests.forEach((request: OvertimeRequestFormData) => {
        worksheet.addRow([
          request.documentNumber || "",
          request.type || "",
          request.startDate || "",
          request.startTime || "",
          request.endDate || "",
          request.endTime || "",
          request.aditionHoursBeforeMinutes || "",
          request.aditionHoursAfterMinutes || "",
          request.observation || "",
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
      link.download = `solicitudes_horas_extras_exitosas_${DateTime.now().toFormat(
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando Excel de éxitos:", error);
      toast({
        title: "Error",
        description:
          "Error al generar el archivo Excel de solicitudes exitosas",
        variant: "destructive",
      });
    }
  }, [getValues, toast]);

  const downloadErrorRequestsExcel = useCallback(async () => {
    try {
      const data = getValues();
      const errorRequests = data.requests.filter(
        (req: OvertimeRequestFormData) => req?.status === "error"
      );

      if (errorRequests.length === 0) {
        toast({
          title: "Sin registros",
          description: "No hay solicitudes con errores",
          variant: "destructive",
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Solicitudes con Errores");

      const headers = [
        "Número de Documento",
        "Tipo",
        "Fecha Inicio",
        "Hora Inicio",
        "Fecha Fin",
        "Hora Fin",
        "Minutos Adicionales Antes",
        "Minutos Adicionales Después",
        "Observación",
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

      errorRequests.forEach((request: OvertimeRequestFormData) => {
        worksheet.addRow([
          request.documentNumber || "",
          request.type || "",
          request.startDate || "",
          request.startTime || "",
          request.endDate || "",
          request.endTime || "",
          request.aditionHoursBeforeMinutes || "",
          request.aditionHoursAfterMinutes || "",
          request.observation || "",
          request.error || "",
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
      link.download = `solicitudes_horas_extras_errores_${DateTime.now().toFormat(
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando Excel de errores:", error);
      toast({
        title: "Error",
        description:
          "Error al generar el archivo Excel de solicitudes con errores",
        variant: "destructive",
      });
    }
  }, [getValues, toast]);

  const handleRetryFailed = async () => {
    const allRequests = watch("requests");
    const failedIndices = allRequests
      .map((req, index) => (req.status === "error" ? index : -1))
      .filter((index) => index !== -1);

    if (failedIndices.length === 0) {
      toast({
        title: "No hay registros fallidos",
        description: "Todos los registros han sido procesados exitosamente",
      });
      return;
    }

    setProcessing(true);
    setUploadProgress(0);
    setIsComplete(false);

    const newData = [...allRequests];
    let processed = 0;
    let hasErrors = false;
    const total = failedIndices.length;

    for (const index of failedIndices) {
      const request = allRequests[index];

      newData[index] = {
        ...newData[index],
        status: "processing" as const,
        error: undefined,
      };
      replace(newData);

      try {
        const normalizedDocNumber = normalizeDocumentNumber(
          String(request.documentNumber ?? "")
        );

        const employee = findEmployeeByRequest(request);

        if (!employee) {
          hasErrors = true;
          const similarEmployees =
            employeesData?.data
              ?.filter((emp: any) => {
                if (!emp.documentNumber) return false;
                const normalizedEmpDoc = normalizeDocumentNumber(
                  emp.documentNumber
                );
                return (
                  normalizedDocNumber.length >= 6 &&
                  normalizedEmpDoc.substring(0, 6) ===
                    normalizedDocNumber.substring(0, 6)
                );
              })
              .slice(0, 3)
              .map((emp: any) => emp.documentNumber) || [];

          const errorMessage =
            similarEmployees.length > 0
              ? `Empleado con RUT ${
                  request.documentNumber
                } no encontrado. ¿Quiso decir: ${similarEmployees.join(", ")}?`
              : `Empleado con RUT ${request.documentNumber} no encontrado.`;

          newData[index] = {
            ...newData[index],
            success: false,
            status: "error" as const,
            error: errorMessage,
          };
          replace(newData);
          continue;
        }

        const requestType = request.type || globalType;

        const rowValidation = getOvertimeRowValidation(request, requestType);
        if (rowValidation) {
          hasErrors = true;
          newData[index] = {
            ...newData[index],
            success: false,
            status: "error" as const,
            error: rowValidationMessage(rowValidation, tModal),
          };
          replace(newData);
          continue;
        }

        let documentKey: string | undefined;

        if (request.documentFile) {
          documentKey = generateDocumentKey(request.documentFile.name);
          try {
            const { url: presignedUrl } = await getPresignedUploadUrl(
              documentKey
            );
            await uploadFileToS3(request.documentFile, presignedUrl);
          } catch (uploadError: any) {
            hasErrors = true;
            newData[index] = {
              ...newData[index],
              success: false,
              status: "error" as const,
              error: "Error al subir documento",
            };
            replace(newData);
            continue;
          }
        }

        const apiDates = buildOvertimeApiDates(
          requestType === OvertimeRequestType.PER_SCHEDULE
            ? "PER_SCHEDULE"
            : "PER_HOURS",
          {
            startDate: request.startDate,
            endDate: request.endDate,
            startTime: request.startTime,
            endTime: request.endTime,
          },
        );

        const formattedData: OvertimeRequestCreateDto = {
          employeeAssignedId: employee.publicId,
          type: requestType,
          observation: request.observation,
          startDate: apiDates.startDate,
          endDate: apiDates.endDate,
          aditionHoursBeforeMinutes: request.aditionHoursBeforeMinutes,
          aditionHoursAfterMinutes: request.aditionHoursAfterMinutes,
          documentUrl: documentKey,
        };

        await createOvertimeRequest.mutateAsync(formattedData);

        processed++;
        setUploadProgress((processed / total) * 100);
        newData[index] = {
          ...newData[index],
          success: true,
          status: "success" as const,
        };
      } catch (error: unknown) {
        hasErrors = true;
        newData[index] = {
          ...newData[index],
          success: false,
          status: "error" as const,
          error: getApiErrorMessage(
            error,
            t("toast.withErrors.unknownError"),
          ),
        };
      }

      replace(newData);
    }

    setProcessing(false);
    setIsComplete(true);

    if (hasErrors) {
      toast({
        title: t("toast.withErrors.retryTitle"),
        description: t("toast.withErrors.retryDescription"),
        variant: "destructive",
      });
    } else {
      const allSuccess = newData.every((req) => req.status === "success");
      if (allSuccess) {
        toast({
          title: "Proceso completado exitosamente",
          description: "Todas las solicitudes han sido creadas",
        });
        onSuccess();
        handleClose();
      } else {
        toast({
          title: "Reintento exitoso",
          description: "Todos los registros fallidos han sido procesados",
        });
      }
    }
  };

  const downloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Plantilla");

      const headers = [
        "Número de Documento",
        "Tipo",
        "Fecha Inicio",
        "Hora Inicio",
        "Fecha Fin",
        "Hora Fin",
        "Minutos Adicionales Antes",
        "Minutos Adicionales Después",
        "Observación",
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
        "12345678",
        t("types.perSchedule"),
        "2024-01-01",
        "08:00",
        "2024-01-01",
        "18:00",
        "",
        "",
        "Observación ejemplo",
      ]);

      worksheet.columns.forEach((col) => {
        col.width = 25;
      });

      const typeOptions = `${t("types.perSchedule")},${t("types.perHours")}`;
      for (let row = 2; row <= 1000; row++) {
        const cell = worksheet.getCell(`B${row}`);
        cell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [`"${typeOptions}"`],
          showErrorMessage: true,
          errorStyle: "error",
          error: `Por favor seleccione ${t("types.perSchedule")} o ${t(
            "types.perHours"
          )}`,
          showInputMessage: true,
          prompt: `Seleccione ${t("types.perSchedule")} o ${t(
            "types.perHours"
          )}`,
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "plantilla_horas_extras.xlsx";
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
  };

  const handleExcelUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buf = e.target?.result;
      if (!(buf instanceof ArrayBuffer)) {
        return;
      }
      const jsonData = await parseFirstWorksheetToJsonRecords(buf);

      const cellToDateOrScalar = (
        v: unknown,
      ): string | number | null | undefined => {
        if (v === null || v === undefined) return v ?? undefined;
        if (v instanceof Date) {
          const d = DateTime.fromJSDate(v);
          return d.isValid ? d.toFormat("yyyy-MM-dd") : undefined;
        }
        if (typeof v === "number" || typeof v === "string") return v;
        return String(v);
      };

      const formattedData = jsonData.map((item: Record<string, unknown>) => {
        const rawDocNumber =
          item["Número de Documento"] ||
          item["Numero de Documento"] ||
          item["Número de documento"] ||
          item["numero de documento"] ||
          "";
        const rawType =
          item["Tipo"] ||
          item["tipo"] ||
          item["Type"] ||
          item["type"] ||
          globalType;
        const rawBeforeMinutes =
          item["Minutos Adicionales Antes"] ||
          item["Minutos adicionales antes"] ||
          item["Minutos Antes"] ||
          item["minutos antes"];
        const rawAfterMinutes =
          item["Minutos Adicionales Después"] ||
          item["Minutos adicionales después"] ||
          item["Minutos Después"] ||
          item["minutos después"];

        const parsedBeforeMinutes = rawBeforeMinutes
          ? parseInt(String(rawBeforeMinutes), 10)
          : undefined;
        const parsedAfterMinutes = rawAfterMinutes
          ? parseInt(String(rawAfterMinutes), 10)
          : undefined;

        let itemType = globalType;
        const normalizedRawType = String(rawType).trim();
        if (
          normalizedRawType === OvertimeRequestType.PER_HOURS ||
          normalizedRawType === t("types.perHours")
        ) {
          itemType = OvertimeRequestType.PER_HOURS;
        } else if (
          normalizedRawType === OvertimeRequestType.PER_SCHEDULE ||
          normalizedRawType === t("types.perSchedule")
        ) {
          itemType = OvertimeRequestType.PER_SCHEDULE;
        }

        const rawStart =
          item["Fecha Inicio"] ??
          item["Fecha inicio"] ??
          item["fecha inicio"];
        const rawEnd =
          item["Fecha Fin"] ?? item["Fecha fin"] ?? item["fecha fin"];
        const rawStartTime =
          item["Hora Inicio"] ??
          item["Hora inicio"] ??
          item["hora inicio"] ??
          item["Start Time"];
        const rawEndTime =
          item["Hora Fin"] ??
          item["Hora fin"] ??
          item["hora fin"] ??
          item["End Time"];

        return {
          documentNumber: String(rawDocNumber ?? "").trim(),
          type: itemType,
          startDate:
            normalizeDateOnlyString(cellToDateOrScalar(rawStart)) ?? undefined,
          endDate: normalizeDateOnlyString(cellToDateOrScalar(rawEnd)) ?? undefined,
          startTime:
            normalizeTimeString(
              cellToDateOrScalar(rawStartTime) as string | number | null | undefined,
            ) ??
            (rawStartTime != null && String(rawStartTime).trim() !== ""
              ? String(rawStartTime).trim()
              : undefined),
          endTime:
            normalizeTimeString(
              cellToDateOrScalar(rawEndTime) as string | number | null | undefined,
            ) ??
            (rawEndTime != null && String(rawEndTime).trim() !== ""
              ? String(rawEndTime).trim()
              : undefined),
          aditionHoursBeforeMinutes: parsedBeforeMinutes,
          aditionHoursAfterMinutes: parsedAfterMinutes,
          observation: String(
            item["Observación"] ??
              item["Observacion"] ??
              item["observación"] ??
              item["observacion"] ??
              "",
          ),
          status: "pending" as const,
        };
      });

      const enriched = formattedData.map((row) => {
        const doc = String(row.documentNumber ?? "").trim();
        if (!doc) {
          return { ...row, employeeId: undefined };
        }
        const emp = employeesData?.data?.find((e: any) => {
          if (!e.documentNumber) return false;
          const nd = normalizeDocumentNumber(doc);
          const ned = normalizeDocumentNumber(e.documentNumber);
          return (
            (nd && ned && nd === ned) ||
            e.documentNumber === doc ||
            e.documentNumber === row.documentNumber
          );
        });
        return {
          ...row,
          documentNumber: doc,
          employeeId: emp?.publicId,
        };
      });

      replace(enriched);
      toast({
        title: t("excel.uploadSuccess.title"),
        description: t("excel.uploadSuccess.description", {
          count: enriched.length,
        }),
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddRow = () => {
    append({
      documentNumber: "",
      employeeId: undefined,
      type: globalType,
      startDate: undefined,
      endDate: undefined,
      startTime: undefined,
      endTime: undefined,
      aditionHoursBeforeMinutes: undefined,
      aditionHoursAfterMinutes: undefined,
      observation: "",
      status: "pending" as const,
    });
  };

  const generateDocumentKey = (fileName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = fileName.split(".").pop() || "pdf";
    return `overtime-requests/documents/${timestamp}-${random}.${extension}`;
  };

  const uploadFileToS3 = async (
    file: File,
    presignedUrl: string
  ): Promise<void> => {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Error al subir el archivo: ${response.statusText}`);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (fields.length === 0) {
      toast({
        title: t("validation.noRequests.title"),
        description: t("validation.noRequests.description"),
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setUploadProgress(0);
    setIsComplete(false);

    const total = data.requests.length;
    let processed = 0;
    let hasErrors = false;

    const newData = [...data.requests];

    for (let i = 0; i < data.requests.length; i++) {
      const request = data.requests[i];

      newData[i] = {
        ...newData[i],
        status: "processing" as const,
      };
      replace(newData);

      try {
        const normalizedDocNumber = normalizeDocumentNumber(
          String(request.documentNumber ?? "")
        );

        const employee = findEmployeeByRequest(request);

        if (!employee) {
          hasErrors = true;
          const similarEmployees =
            employeesData?.data
              ?.filter((emp: any) => {
                if (!emp.documentNumber) return false;
                const normalizedEmpDoc = normalizeDocumentNumber(
                  emp.documentNumber
                );
                return (
                  normalizedDocNumber.length >= 6 &&
                  normalizedEmpDoc.substring(0, 6) ===
                    normalizedDocNumber.substring(0, 6)
                );
              })
              .slice(0, 3)
              .map((emp: any) => emp.documentNumber) || [];

          const errorMessage =
            similarEmployees.length > 0
              ? `Empleado con RUT ${
                  request.documentNumber
                } no encontrado. ¿Quiso decir: ${similarEmployees.join(", ")}?`
              : `Empleado con RUT ${request.documentNumber} no encontrado.`;

          newData[i] = {
            ...newData[i],
            success: false,
            status: "error" as const,
            error: errorMessage,
          };
          replace(newData);
          continue;
        }

        const requestType = request.type || globalType;

        const rowValidationSubmit = getOvertimeRowValidation(
          request,
          requestType,
        );
        if (rowValidationSubmit) {
          hasErrors = true;
          newData[i] = {
            ...newData[i],
            success: false,
            status: "error" as const,
            error: rowValidationMessage(rowValidationSubmit, tModal),
          };
          replace(newData);
          continue;
        }

        let documentKey: string | undefined;

        if (request.documentFile) {
          documentKey = generateDocumentKey(request.documentFile.name);
          try {
            const { url: presignedUrl } = await getPresignedUploadUrl(
              documentKey
            );
            await uploadFileToS3(request.documentFile, presignedUrl);
          } catch (uploadError: any) {
            hasErrors = true;
            newData[i] = {
              ...newData[i],
              success: false,
              status: "error" as const,
              error: "Error al subir documento",
            };
            replace(newData);
            continue;
          }
        }

        const apiDatesSubmit = buildOvertimeApiDates(
          requestType === OvertimeRequestType.PER_SCHEDULE
            ? "PER_SCHEDULE"
            : "PER_HOURS",
          {
            startDate: request.startDate,
            endDate: request.endDate,
            startTime: request.startTime,
            endTime: request.endTime,
          },
        );

        const formattedData: OvertimeRequestCreateDto = {
          employeeAssignedId: employee.publicId,
          type: requestType,
          observation: request.observation,
          startDate: apiDatesSubmit.startDate,
          endDate: apiDatesSubmit.endDate,
          aditionHoursBeforeMinutes: request.aditionHoursBeforeMinutes,
          aditionHoursAfterMinutes: request.aditionHoursAfterMinutes,
          documentUrl: documentKey,
        };

        await createOvertimeRequest.mutateAsync(formattedData);

        processed++;
        setUploadProgress((processed / total) * 100);
        newData[i] = {
          ...newData[i],
          success: true,
          status: "success" as const,
        };
      } catch (error: unknown) {
        hasErrors = true;
        newData[i] = {
          ...newData[i],
          success: false,
          status: "error" as const,
          error: getApiErrorMessage(
            error,
            t("toast.withErrors.unknownError"),
          ),
        };
      }

      replace(newData);
    }

    setProcessing(false);
    setIsComplete(true);

    const successCount = newData.filter(
      (req) => req.status === "success"
    ).length;
    const errorCount = newData.filter((req) => req.status === "error").length;

    if (hasErrors) {
      const firstFailed = newData.find((req) => req.status === "error");
      const firstErrorMsg = firstFailed?.error;
      const summary = t("toast.withErrors.descriptionSummary", {
        successCount,
        errorCount,
      });

      if (successCount === 0 && errorCount === 1 && firstErrorMsg) {
        toast({
          title: t("toast.withErrors.titleNoneCreated"),
          description: firstErrorMsg,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("toast.withErrors.title"),
          description:
            firstErrorMsg && errorCount > 0
              ? t("toast.withErrors.descriptionFirstError", {
                  summary,
                  detail: firstErrorMsg,
                })
              : summary,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Proceso completado exitosamente",
        description: `Se crearon ${successCount} solicitud${
          successCount !== 1 ? "es" : ""
        } de horas extras correctamente.`,
      });
      onSuccess();
      handleClose();
    }
  };

  const handleClose = () => {
    reset();
    setUploadProgress(0);
    setProcessing(false);
    onClose();
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("title")}
      size="7xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
        {!companyId && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t("companyRequired.hint")}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50/50 px-4 py-3">
            <Info
              className="h-5 w-5 flex-shrink-0"
              style={{ color: `${templatePrimary}99` }}
              aria-hidden
            />
            <h4 className="text-sm font-semibold text-gray-900">
              {t("instructions.title")}
            </h4>
          </div>
          <div className="px-4 py-4">
            <ul className="list-inside list-disc space-y-1.5 text-sm text-gray-600">
              <li>{t("instructions.step1")}</li>
              <li>{t("instructions.step2")}</li>
              <li>{t("instructions.step3")}</li>
              <li>{t("instructions.step4")}</li>
              <li>{t("instructions.step5")}</li>
            </ul>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-12 md:items-end">
            <div className="space-y-1.5 md:col-span-8">
              <label
                htmlFor="massive-global-type"
                className="text-sm font-medium text-gray-700"
              >
                {t("globalType.label")}
              </label>
              <Controller
                name="globalType"
                control={control}
                render={({ field }) => (
                  <CHEKIOSelect
                    value={field.value}
                    onValueChange={(value) => {
                      if (fields.length > 0) {
                        replace([]);
                        toast({
                          title: t("typeChanged.title"),
                          description: t("typeChanged.description"),
                          variant: "default",
                        });
                      }
                      field.onChange(value);
                    }}
                    disabled={processing}
                  >
                    <CHEKIOSelectTrigger
                      id="massive-global-type"
                      className="w-full md:max-w-xl"
                    >
                      <CHEKIOSelectValue />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      <CHEKIOSelectItem value={OvertimeRequestType.PER_SCHEDULE}>
                        {t("types.perSchedule")}
                      </CHEKIOSelectItem>
                      <CHEKIOSelectItem value={OvertimeRequestType.PER_HOURS}>
                        {t("types.perHours")}
                      </CHEKIOSelectItem>
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                )}
              />
              {fields.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">{t("globalType.info")}</p>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!processing && !isComplete && (
              <>
                <CHEKIOButton
                  type="button"
                  variant={ChekioButtonVariant.SECONDARY_BLUE}
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  {t("buttons.downloadTemplate")}
                </CHEKIOButton>
                <CHEKIOButton
                  type="button"
                  variant={ChekioButtonVariant.SECONDARY_BLUE}
                  onClick={() => {
                    document.getElementById("excel-upload-massive")?.click();
                  }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Upload className="h-4 w-4" />
                  {t("buttons.uploadExcel")}
                </CHEKIOButton>
                <input
                  id="excel-upload-massive"
                  type="file"
                  accept=".xlsx,.xls"
                  className="sr-only"
                  aria-label={t("buttons.uploadExcel")}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleExcelUpload(file);
                      e.target.value = "";
                    }
                  }}
                />
                <CHEKIOButton
                  type="button"
                  variant={ChekioButtonVariant.PRIMARY}
                  onClick={handleAddRow}
                  disabled={!companyId}
                  className="inline-flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  {t("buttons.addRow")}
                </CHEKIOButton>
              </>
            )}
          </div>
        </div>

        {processing && (
          <div className="mb-2">
            <CHEKIOProgressBar
              current={Math.round(uploadProgress)}
              total={100}
              text={t("progress.label", {
                percent: Math.round(uploadProgress),
              })}
            />
          </div>
        )}

        {fields.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <CHEKIOTable className="rounded-none border-0 shadow-none">
              <CHEKIOTableHeader>
                <tr>
                  <CHEKIOTableHead className="min-w-[220px]">
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                      <Users
                        className="h-4 w-4"
                        style={{ color: `${templatePrimary}99` }}
                        aria-hidden
                      />
                      {t("table.headers.employee")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead className="min-w-[140px]">
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                      <Hash
                        className="h-4 w-4"
                        style={{ color: `${templatePrimary}99` }}
                        aria-hidden
                      />
                      {t("table.headers.documentNumber")}
                    </span>
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {globalType === OvertimeRequestType.PER_SCHEDULE
                      ? t("table.headers.startDate")
                      : t("table.headers.applicationDate")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {globalType === OvertimeRequestType.PER_SCHEDULE
                      ? t("table.headers.startTime")
                      : "—"}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {globalType === OvertimeRequestType.PER_SCHEDULE
                      ? t("table.headers.endDate")
                      : "—"}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {globalType === OvertimeRequestType.PER_SCHEDULE
                      ? t("table.headers.endTime")
                      : "—"}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {t("table.headers.beforeMinutes")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {t("table.headers.afterMinutes")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {t("table.headers.observation")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {t("table.headers.document")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.status")}</CHEKIOTableHead>
                  <CHEKIOTableHead className="text-right">
                    {t("table.headers.actions")}
                  </CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {fields.map((field, index) => {
                  const request = watch(`requests.${index}`);
                  const documentFile = request?.documentFile;
                  const status = request?.status || "pending";
                  const isDisabled =
                    status === "success" || (processing && status !== "error");
                  const requestType = request?.type || globalType;
                  const hasBeforeMinutes =
                    request?.aditionHoursBeforeMinutes !== undefined &&
                    request?.aditionHoursBeforeMinutes !== null;
                  const hasAfterMinutes =
                    request?.aditionHoursAfterMinutes !== undefined &&
                    request?.aditionHoursAfterMinutes !== null;
                  const hasEmployeePick = Boolean(request?.employeeId);

                  return (
                    <CHEKIOTableRow key={field.id} index={index}>
                      <CHEKIOTableCell className="min-w-[220px] px-3 py-3 align-top">
                        <Controller
                          name={`requests.${index}.employeeId`}
                          control={control}
                          render={({ field: empField }) => (
                            <CHEKIOSelect
                              value={
                                empField.value ?? EMPLOYEE_SELECT_NONE
                              }
                              onValueChange={(v) => {
                                if (v === EMPLOYEE_SELECT_NONE) {
                                  empField.onChange(undefined);
                                  setValue(
                                    `requests.${index}.documentNumber`,
                                    ""
                                  );
                                  return;
                                }
                                empField.onChange(v);
                                const emp = employeesSorted.find(
                                  (e: { publicId: string }) =>
                                    e.publicId === v
                                );
                                if (emp?.documentNumber) {
                                  setValue(
                                    `requests.${index}.documentNumber`,
                                    emp.documentNumber
                                  );
                                }
                              }}
                              disabled={isDisabled || !companyId}
                            >
                              <CHEKIOSelectTrigger className="w-full max-w-[280px]">
                                <CHEKIOSelectValue
                                  placeholder={t("employee.placeholder")}
                                />
                              </CHEKIOSelectTrigger>
                              <CHEKIOSelectContent>
                                <CHEKIOSelectItem
                                  value={EMPLOYEE_SELECT_NONE}
                                >
                                  {t("employee.placeholder")}
                                </CHEKIOSelectItem>
                                {employeesSorted.map((emp: any) => (
                                  <CHEKIOSelectItem
                                    key={emp.publicId}
                                    value={emp.publicId}
                                  >
                                    {`${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim()}{" "}
                                    · {emp.documentNumber}
                                  </CHEKIOSelectItem>
                                ))}
                              </CHEKIOSelectContent>
                            </CHEKIOSelect>
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="min-w-[120px] px-3 py-3 align-top">
                        {hasEmployeePick ? (
                          <span className="text-sm tabular-nums text-gray-800">
                            {request?.documentNumber ?? "—"}
                          </span>
                        ) : (
                          <SystemInput
                            label=""
                            control={control}
                            attribute={`requests.${index}.documentNumber`}
                            errors={errors}
                            disabled={isDisabled}
                          />
                        )}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <SystemDatePicker
                          label=""
                          control={control}
                          attribute={`requests.${index}.startDate`}
                          errors={errors}
                          disabled={isDisabled}
                          placeholder={tModal("placeholders.startDate")}
                          className="min-w-[130px]"
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {requestType === OvertimeRequestType.PER_SCHEDULE ? (
                          <Controller
                            name={`requests.${index}.startTime`}
                            control={control}
                            render={({ field }) => (
                              <CHEKIOInput
                                type="time"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={isDisabled}
                                className="w-full min-w-[108px]"
                                aria-label={t("table.headers.startTime")}
                              />
                            )}
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {requestType === OvertimeRequestType.PER_SCHEDULE ? (
                          <SystemDatePicker
                            label=""
                            control={control}
                            attribute={`requests.${index}.endDate`}
                            errors={errors}
                            disabled={isDisabled}
                            placeholder={tModal("placeholders.endDate")}
                            className="min-w-[130px]"
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {requestType === OvertimeRequestType.PER_SCHEDULE ? (
                          <Controller
                            name={`requests.${index}.endTime`}
                            control={control}
                            render={({ field }) => (
                              <CHEKIOInput
                                type="time"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={isDisabled}
                                className="w-full min-w-[108px]"
                                aria-label={t("table.headers.endTime")}
                              />
                            )}
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {requestType === OvertimeRequestType.PER_HOURS ||
                        hasBeforeMinutes ? (
                          <div className="w-full min-w-[100px]">
                            <SystemInput
                              label=""
                              control={control}
                              attribute={`requests.${index}.aditionHoursBeforeMinutes`}
                              type="number"
                              errors={errors}
                              disabled={isDisabled}
                            />
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {requestType === OvertimeRequestType.PER_HOURS ||
                        hasAfterMinutes ? (
                          <div className="w-full min-w-[100px]">
                            <SystemInput
                              label=""
                              control={control}
                              attribute={`requests.${index}.aditionHoursAfterMinutes`}
                              type="number"
                              errors={errors}
                              disabled={isDisabled}
                            />
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <SystemInput
                          label=""
                          control={control}
                          attribute={`requests.${index}.observation`}
                          errors={errors}
                          disabled={isDisabled}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="w-full">
                          <label
                            htmlFor={`document-upload-${index}`}
                            className="cursor-pointer"
                          >
                            <div className="border-2 border-dashed border-gray-300 p-2 bg-gray-50 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                              {documentFile ? (
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-gray-900 truncate">
                                        {documentFile.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {(
                                          documentFile.size /
                                          1024 /
                                          1024
                                        ).toFixed(2)}{" "}
                                        MB
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setValue(
                                        `requests.${index}.documentFile`,
                                        undefined
                                      );
                                      const input = document.getElementById(
                                        `document-upload-${index}`
                                      ) as HTMLInputElement;
                                      if (input) {
                                        input.value = "";
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                                    disabled={processing}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <Upload className="h-4 w-4 text-gray-400" />
                                  <span className="text-xs text-gray-600">
                                    {t("document.upload") || "Subir PDF"}
                                  </span>
                                </div>
                              )}
                            </div>
                            <input
                              id={`document-upload-${index}`}
                              type="file"
                              accept=".pdf,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.type !== "application/pdf") {
                                    toast({
                                      title:
                                        t(
                                          "validation.errors.invalidFileType.title"
                                        ) || "Tipo de archivo inválido",
                                      description:
                                        t(
                                          "validation.errors.invalidFileType.description"
                                        ) || "Solo se permiten archivos PDF.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  setValue(
                                    `requests.${index}.documentFile`,
                                    file
                                  );
                                }
                              }}
                              disabled={isDisabled}
                            />
                          </label>
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-3 py-3 align-top">
                        {status === "pending" && (
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                            {t("table.status.pending")}
                          </span>
                        )}
                        {status === "processing" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {t("table.status.processing")}
                          </span>
                        )}
                        {status === "success" && (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              {t("table.status.success")}
                            </span>
                            <span className="max-w-[200px] text-xs text-emerald-700">
                              {t("table.status.successHint")}
                            </span>
                          </div>
                        )}
                        {status === "error" && (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                              <X className="h-3 w-3" />
                              {t("table.status.error")}
                            </span>
                            {request?.error && (
                              <span className="max-w-[220px] text-xs text-red-600">
                                {request.error}
                              </span>
                            )}
                          </div>
                        )}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-3 py-3 text-right align-top">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={processing || status === "success"}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                          title={t("table.actions.delete")}
                          aria-label={t("table.actions.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  );
                })}
              </CHEKIOTableBody>
            </CHEKIOTable>
          </div>
        )}

        <div className="space-y-4">
          {isComplete && (
            <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-4">
              {requests.some(
                (req: OvertimeRequestFormData) => req?.status === "success"
              ) && (
                <CHEKIOButton
                  type="button"
                  variant={ChekioButtonVariant.APPROVE}
                  onClick={downloadSuccessfulRequestsExcel}
                  className="inline-flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  {t("exports.downloadSuccess")}
                </CHEKIOButton>
              )}
              {requests.some(
                (req: OvertimeRequestFormData) => req?.status === "error"
              ) && (
                <CHEKIOButton
                  type="button"
                  variant={ChekioButtonVariant.SECONDARY_BLUE}
                  onClick={downloadErrorRequestsExcel}
                  className="inline-flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  {t("exports.downloadErrors")}
                </CHEKIOButton>
              )}
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4">
            <CHEKIOButton
              type="button"
              variant={ChekioButtonVariant.SECONDARY}
              onClick={handleClose}
              disabled={processing}
              className="inline-flex items-center gap-1.5"
            >
              <X className="h-4 w-4" />
              {isComplete ? t("buttons.close") : t("buttons.cancel")}
            </CHEKIOButton>
            {isComplete &&
              requests.some(
                (req: OvertimeRequestFormData) => req?.status === "error"
              ) && (
                <CHEKIOButton
                  type="button"
                  variant={ChekioButtonVariant.PRIMARY}
                  onClick={handleRetryFailed}
                  disabled={processing}
                  className="inline-flex items-center gap-1.5"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("buttons.processing")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {t("buttons.retryFailed")}
                    </>
                  )}
                </CHEKIOButton>
              )}
            {!isComplete && (
              <CHEKIOButton
                type="submit"
                variant={ChekioButtonVariant.PRIMARY}
                disabled={processing || !companyId}
                className="inline-flex items-center gap-1.5"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("buttons.processing")}
                  </>
                ) : (
                  t("buttons.create")
                )}
              </CHEKIOButton>
            )}
          </div>
        </div>
      </form>
    </CHEKIOModal>
  );
}
