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
import SystemMultiSelect from "@/components/ui/multi-select";
import SystemInput from "@/components/ui/system-input";
import { useToast } from "@/hooks/use-toast";
import { TIME_ZONE_OPTIONS } from "@/lib/options/time-zone";
import { useCreateBranch } from "@/service/mantainer.service";
import { parseFirstWorksheetToJsonRecords } from "@/utils/parseXlsxFirstSheet";
import { Upload } from "antd";
import ExcelJS from "exceljs";
import {
  AlertCircle,
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
import { CompanyOption } from "../../companies/_components/company.dto";

interface BranchModalMasiveProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyOptions: CompanyOption[];
}

interface BranchFormData {
  id?: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  companies: string[];
  timezone: string;
  error?: string;
  success?: boolean;
  status?: "pending" | "processing" | "success" | "error";
}

interface FormValues {
  branches: BranchFormData[];
  companies: string[];
}

export default function BranchModalMasive({
  isOpen,
  onClose,
  onSuccess,
  companyOptions,
}: BranchModalMasiveProps) {
  const tMassive = useTranslations("mantainers.branches.massive");
  const { mutateAsync: createBranch } = useCreateBranch();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();
  const {
    control,
    formState: { errors },
    setValue,
    handleSubmit,
    reset,
    getValues,
    watch,
    trigger,
    setError,
    clearErrors,
  } = useForm<FormValues>({
    defaultValues: {
      branches: [] as BranchFormData[],
      companies: [],
    },
  });

  const selectedCompanies = watch("companies");

  useEffect(() => {
    if (selectedCompanies.length > 0 && validationError?.includes("empresa")) {
      setValidationError(null);
    }
  }, [selectedCompanies, validationError]);

  const { fields, append, replace, remove } = useFieldArray({
    control,
    name: "branches",
  });

  const handleExcelUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buf = e.target?.result;
      if (!(buf instanceof ArrayBuffer)) {
        return;
      }
      const jsonData = await parseFirstWorksheetToJsonRecords(buf);

      console.log("Datos del Excel:", jsonData); // Debug
      console.log("Primer item del Excel:", jsonData[0]); // Debug - ver todas las propiedades
      console.log(
        "Propiedades del primer item:",
        Object.keys((jsonData[0] as any) || {})
      ); // Debug - ver nombres de columnas

      // Mostrar información detallada sobre el archivo
      if (jsonData.length > 0) {
        const firstItem = jsonData[0] as any;
        console.log("=== ANÁLISIS DEL ARCHIVO EXCEL ===");
        console.log("Número de filas:", jsonData.length);
        console.log("Columnas encontradas:", Object.keys(firstItem));
        console.log("Valores de la primera fila:", firstItem);
        console.log("=== FIN ANÁLISIS ===");
      }

      // Función helper para obtener valor de columna con múltiples variantes
      const getColumnValue = (item: any, variants: string[]) => {
        for (const variant of variants) {
          if (
            item[variant] !== undefined &&
            item[variant] !== null &&
            item[variant] !== ""
          ) {
            return item[variant];
          }
        }
        return "";
      };

      const formattedData = jsonData.map((item: Record<string, unknown>) => {
        // Obtener valores con múltiples variantes de nombres de columnas
        const code = getColumnValue(item, [
          "Código",
          "CODIGO",
          "codigo",
          "Code",
          "code",
        ]);
        const name = getColumnValue(item, [
          "Nombre",
          "NOMBRE",
          "nombre",
          "Name",
          "name",
        ]);
        const address = getColumnValue(item, [
          "Dirección",
          "DIRECCION",
          "direccion",
          "Address",
          "address",
        ]);
        const phone = getColumnValue(item, [
          "Teléfono",
          "TELEFONO",
          "telefono",
          "Phone",
          "phone",
        ]);
        const timezoneValue = getColumnValue(item, [
          "Zona Horaria",
          "ZONA HORARIA",
          "zona horaria",
          "Zona_Horaria",
          "ZONA_HORARIA",
          "zona_horaria",
          "Timezone",
          "timezone",
        ]);

        console.log("Valores extraídos:", {
          code,
          name,
          address,
          phone,
          timezoneValue,
        }); // Debug

        const validTimezone = TIME_ZONE_OPTIONS.some(
          (option) => option.value === timezoneValue
        )
          ? timezoneValue
          : "";

        console.log("Zona horaria válida:", validTimezone); // Debug

        return {
          code: code,
          name: name,
          address: address,
          phone: phone,
          companies: selectedCompanies,
          timezone: validTimezone,
          status: "pending" as const,
        };
      });

      console.log("Datos formateados:", formattedData); // Debug

      // Verificar si hay zonas horarias inválidas
      const invalidTimezones = jsonData.filter((item: Record<string, unknown>) => {
        const timezoneValue = getColumnValue(item, [
          "Zona Horaria",
          "ZONA HORARIA",
          "zona horaria",
          "Zona_Horaria",
          "ZONA_HORARIA",
          "zona_horaria",
          "Timezone",
          "timezone",
        ]);
        return (
          timezoneValue &&
          !TIME_ZONE_OPTIONS.some((option) => option.value === timezoneValue)
        );
      });

      if (invalidTimezones.length > 0) {
        toast({
          title: tMassive("excel.warnings.title"),
          description: tMassive("excel.warnings.invalidTimezones", {
            count: invalidTimezones.length,
          }),
          variant: "destructive",
        });
      }

      // Verificar si el archivo tiene el formato esperado
      if (jsonData.length > 0) {
        const firstItem = jsonData[0] as any;
        const hasRequiredColumns =
          Object.keys(firstItem).some(
            (key) =>
              key.toLowerCase().includes("código") ||
              key.toLowerCase().includes("codigo")
          ) &&
          Object.keys(firstItem).some((key) =>
            key.toLowerCase().includes("nombre")
          ) &&
          Object.keys(firstItem).some(
            (key) =>
              key.toLowerCase().includes("dirección") ||
              key.toLowerCase().includes("direccion")
          );

        if (!hasRequiredColumns) {
          toast({
            title: tMassive("excel.errors.formatError.title"),
            description: tMassive("excel.errors.formatError.description"),
            variant: "destructive",
          });
          return;
        }
      }

      // Primero reemplazar los datos
      replace(formattedData);

      // Luego asegurar que los valores se establezcan correctamente en el formulario
      setTimeout(() => {
        formattedData.forEach((item, index) => {
          if (item.timezone) {
            setValue(`branches.${index}.timezone`, item.timezone);
            console.log(`Estableciendo timezone[${index}]:`, item.timezone); // Debug
          }
        });

        // Forzar la actualización del formulario
        const currentValues = getValues();
        console.log("Valores actuales del formulario:", currentValues); // Debug
      }, 100);
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const downloadTemplate = async () => {
    try {
      // Crear workbook y worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(
        tMassive("excel.template.sheetName")
      );

      // Definir los headers
      const headers = [
        tMassive("excel.template.headers.code"),
        tMassive("excel.template.headers.name"),
        tMassive("excel.template.headers.address"),
        tMassive("excel.template.headers.phone"),
        tMassive("excel.template.headers.timezone"),
      ];

      // Agregar headers
      const headerRow = worksheet.addRow(headers);

      // Estilo para los headers
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4F81BD" }, // Azul
        };
        cell.font = {
          bold: true,
          color: { argb: "FFFFFFFF" }, // Texto blanco
        };
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };
      });

      // Agregar fila de ejemplo
      const exampleRow = worksheet.addRow([
        tMassive("excel.template.example.code"),
        tMassive("excel.template.example.name"),
        tMassive("excel.template.example.address"),
        tMassive("excel.template.example.phone"),
        tMassive("excel.template.example.timezone"),
      ]);

      // Obtener las opciones de zona horaria
      const timezoneOptions = TIME_ZONE_OPTIONS.map((option) => option.value);

      // Configurar validación de datos para la columna "Zona Horaria" (columna E, índice 4)
      const timezoneColumn = worksheet.getColumn(5); // Columna E

      // Agregar validación de lista desplegable para todas las filas
      timezoneColumn.eachCell((cell, rowNumber) => {
        if (rowNumber > 1) {
          // Aplicar a todas las filas excepto el header
          cell.dataValidation = {
            type: "list",
            allowBlank: false,
            formulae: [`"${timezoneOptions.join(",")}"`],
            showErrorMessage: true,
            errorTitle: tMassive("excel.template.validation.errorTitle"),
            error: tMassive("excel.template.validation.error"),
            showInputMessage: true,
            promptTitle: tMassive("excel.template.validation.promptTitle"),
            prompt: tMassive("excel.template.validation.prompt"),
          };
        }
      });

      // Configurar validación para filas adicionales (hasta 1000 filas)
      for (let row = 3; row <= 1000; row++) {
        const cell = worksheet.getCell(`E${row}`);
        cell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [`"${timezoneOptions.join(",")}"`],
          showErrorMessage: true,
          errorTitle: tMassive("excel.template.validation.errorTitle"),
          error: tMassive("excel.template.validation.error"),
          showInputMessage: true,
          promptTitle: tMassive("excel.template.validation.promptTitle"),
          prompt: tMassive("excel.template.validation.prompt"),
        };
      }

      // Crear hoja de referencia con las zonas horarias
      const referenceWorksheet = workbook.addWorksheet(
        tMassive("excel.template.referenceSheet")
      );

      // Headers para la hoja de referencia
      const referenceHeaders = [
        tMassive("excel.template.referenceHeaders.value"),
        tMassive("excel.template.referenceHeaders.description"),
      ];
      const referenceHeaderRow = referenceWorksheet.addRow(referenceHeaders);

      // Estilo para los headers de referencia
      referenceHeaderRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4F81BD" },
        };
        cell.font = {
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };
      });

      // Agregar datos de referencia
      TIME_ZONE_OPTIONS.forEach((option) => {
        referenceWorksheet.addRow([option.value, option.label]);
      });

      // Ajustar ancho de columnas
      worksheet.columns.forEach((column) => {
        column.width = 20;
      });

      referenceWorksheet.columns.forEach((column) => {
        column.width = 30;
      });

      // Generar y descargar el archivo
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
        title: tMassive("excel.errors.generateError.title"),
        description: tMassive("excel.errors.generateError.description"),
        variant: "destructive",
      });
    }
  };

  const handleAddRow = () => {
    append({
      code: "",
      name: "",
      address: "",
      phone: "",
      timezone: "",
      companies: selectedCompanies,
      status: "pending",
    });
  };

  const validateBranch = (branch: BranchFormData): string | null => {
    if (!branch.code?.trim()) {
      return tMassive("validation.codeRequired");
    }
    if (!branch.name?.trim()) {
      return tMassive("validation.nameRequired");
    }
    if (!branch.address?.trim()) {
      return tMassive("validation.addressRequired");
    }
    if (!branch.timezone?.trim()) {
      return tMassive("validation.timezoneRequired");
    }
    // Validar que la zona horaria existe en las opciones disponibles
    const validTimezone = TIME_ZONE_OPTIONS.some(
      (option) => option.value === branch.timezone
    );
    if (!validTimezone) {
      return tMassive("validation.timezoneInvalid");
    }
    return null;
  };

  const [activeTab, setActiveTab] = useState<string>("1");

  const onSubmit = async (data: FormValues) => {
    setValidationError(null);
    if (data.companies.length === 0) {
      setValidationError(tMassive("toast.companiesRequired.description"));
      return;
    }

    // Validar todas las sucursales antes de procesar
    const validationErrors: string[] = [];
    data.branches.forEach((branch, index) => {
      const error = validateBranch(branch);
      if (error) {
        validationErrors.push(
          `${tMassive("toast.validationErrors.rowPrefix")} ${
            index + 1
          }: ${error}`
        );
      }
    });

    if (validationErrors.length > 0) {
      toast({
        title: tMassive("toast.validationErrors.title"),
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    const total = data.branches.length;
    let processed = 0;
    let hasErrors = false;

    const newData = [...data.branches];

    for (let i = 0; i < data.branches.length; i++) {
      const branch = data.branches[i];

      // Actualizar estado a procesando
      newData[i] = {
        ...newData[i],
        status: "processing",
      };
      replace(newData);

      try {
        await createBranch({
          code: branch.code,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          timezone: branch.timezone,
          companies: data.companies,
        });

        processed++;
        setUploadProgress((processed / total) * 100);
        newData[i] = {
          ...newData[i],
          success: true,
          status: "success",
        };
      } catch (error: any) {
        hasErrors = true;
        newData[i] = {
          ...newData[i],
          success: false,
          status: "error",
          error: error.response?.data?.message || tMassive("toast.createError"),
        };
      }

      replace(newData);
    }

    setProcessing(false);

    // Verificar si todos los registros están exitosos
    const allSuccess = newData.every((branch) => branch.status === "success");
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

  const handleRetryFailed = async () => {
    const allBranches = watch("branches");
    const failedIndices = allBranches
      .map((branch, index) => (branch.status === "error" ? index : -1))
      .filter((index) => index !== -1);

    if (failedIndices.length === 0) {
      toast({
        title: tMassive("toast.noFailedBranches.title"),
        description: tMassive("toast.noFailedBranches.description"),
      });
      return;
    }

    // Validar que las empresas estén seleccionadas
    const currentCompanies = watch("companies");
    if (currentCompanies.length === 0) {
      toast({
        title: tMassive("toast.companiesRequired.title"),
        description: tMassive("toast.companiesRequired.description"),
        variant: "destructive",
      });
      return;
    }

    // Validar los registros fallidos antes de procesar
    const validationErrors: string[] = [];
    failedIndices.forEach((index) => {
      const branch = allBranches[index];
      const error = validateBranch(branch);
      if (error) {
        validationErrors.push(
          `${tMassive("toast.validationErrors.rowPrefix")} ${
            index + 1
          }: ${error}`
        );
      }
    });

    if (validationErrors.length > 0) {
      toast({
        title: tMassive("toast.validationErrors.title"),
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setUploadProgress(0);
    setIsComplete(false);

    const newData = [...allBranches];
    let processed = 0;
    let hasErrors = false;
    const total = failedIndices.length;

    for (const index of failedIndices) {
      const branch = allBranches[index];

      // Resetear estado a procesando
      newData[index] = {
        ...newData[index],
        status: "processing",
        error: undefined,
      };
      replace(newData);

      try {
        await createBranch({
          code: branch.code,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          timezone: branch.timezone,
          companies: currentCompanies,
        });

        processed++;
        setUploadProgress((processed / total) * 100);
        newData[index] = {
          ...newData[index],
          success: true,
          status: "success",
        };
      } catch (error: any) {
        hasErrors = true;
        newData[index] = {
          ...newData[index],
          success: false,
          status: "error",
          error: error.response?.data?.message || tMassive("toast.createError"),
        };
      }

      replace(newData);
    }

    setProcessing(false);

    // Verificar si todos los registros están exitosos
    const allSuccess = newData.every((branch) => branch.status === "success");
    setIsComplete(true);

    if (hasErrors) {
      toast({
        title: tMassive("toast.retryCompletedWithErrors.title"),
        description: tMassive("toast.retryCompletedWithErrors.description"),
        variant: "destructive",
      });
    } else {
      if (allSuccess) {
        toast({
          title: tMassive("toast.processCompletedSuccess.title"),
          description: tMassive("toast.processCompletedSuccess.description"),
        });
        onSuccess();
      } else {
        toast({
          title: tMassive("toast.retryCompletedSuccess.title"),
          description: tMassive("toast.retryCompletedSuccess.description"),
        });
      }
    }
  };

  const downloadSuccessfulBranchesExcel = useCallback(async () => {
    try {
      const data = getValues();
      const successfulBranches = data.branches.filter(
        (branch: BranchFormData) => branch.status === "success"
      );

      if (successfulBranches.length === 0) {
        toast({
          title: "Sin registros",
          description: "No hay sucursales cargadas exitosamente",
          variant: "destructive",
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sucursales Exitosas");

      const headers = [
        tMassive("excel.template.headers.code"),
        tMassive("excel.template.headers.name"),
        tMassive("excel.template.headers.address"),
        tMassive("excel.template.headers.phone"),
        tMassive("excel.template.headers.timezone"),
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

      successfulBranches.forEach((branch: BranchFormData) => {
        worksheet.addRow([
          branch.code || "",
          branch.name || "",
          branch.address || "",
          branch.phone || "",
          branch.timezone || "",
        ]);
      });

      const timezoneOptions = TIME_ZONE_OPTIONS.map((option) => option.value);
      for (let row = 2; row <= 1000; row++) {
        const cell = worksheet.getCell(`E${row}`);
        cell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [`"${timezoneOptions.join(",")}"`],
          showErrorMessage: true,
          errorTitle: tMassive("excel.template.validation.timezone.errorTitle"),
          error: tMassive("excel.template.validation.timezone.error"),
          showInputMessage: true,
          promptTitle: tMassive(
            "excel.template.validation.timezone.promptTitle"
          ),
          prompt: tMassive("excel.template.validation.timezone.prompt"),
        };
      }

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
      link.download = `sucursales_exitosas_${DateTime.now().toFormat(
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando Excel de éxitos:", error);
      toast({
        title: "Error",
        description: "Error al generar el archivo Excel de sucursales exitosas",
        variant: "destructive",
      });
    }
  }, [getValues, toast, tMassive]);

  const downloadErrorBranchesExcel = useCallback(async () => {
    try {
      const data = getValues();
      const errorBranches = data.branches.filter(
        (branch: BranchFormData) => branch.status === "error"
      );

      if (errorBranches.length === 0) {
        toast({
          title: "Sin registros",
          description: "No hay sucursales con errores",
          variant: "destructive",
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sucursales con Errores");

      const headers = [
        tMassive("excel.template.headers.code"),
        tMassive("excel.template.headers.name"),
        tMassive("excel.template.headers.address"),
        tMassive("excel.template.headers.phone"),
        tMassive("excel.template.headers.timezone"),
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

      errorBranches.forEach((branch: BranchFormData) => {
        worksheet.addRow([
          branch.code || "",
          branch.name || "",
          branch.address || "",
          branch.phone || "",
          branch.timezone || "",
          branch.error || "",
        ]);
      });

      const timezoneOptions = TIME_ZONE_OPTIONS.map((option) => option.value);
      for (let row = 2; row <= 1000; row++) {
        const cell = worksheet.getCell(`E${row}`);
        cell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [`"${timezoneOptions.join(",")}"`],
          showErrorMessage: true,
          errorTitle: tMassive("excel.template.validation.timezone.errorTitle"),
          error: tMassive("excel.template.validation.timezone.error"),
          showInputMessage: true,
          promptTitle: tMassive(
            "excel.template.validation.timezone.promptTitle"
          ),
          prompt: tMassive("excel.template.validation.timezone.prompt"),
        };
      }

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
      link.download = `sucursales_errores_${DateTime.now().toFormat(
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando Excel de errores:", error);
      toast({
        title: "Error",
        description:
          "Error al generar el archivo Excel de sucursales con errores",
        variant: "destructive",
      });
    }
  }, [getValues, toast, tMassive]);

  const handleSelectAll = () => {
    const allValues = companyOptions.map((option) => option.value);
    setValue("companies", allValues);
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
              {tMassive("table.headers.address")}
            </CHEKIOTableHead>
            <CHEKIOTableHead>{tMassive("table.headers.phone")}</CHEKIOTableHead>
            <CHEKIOTableHead>
              {tMassive("table.headers.timezone")}
            </CHEKIOTableHead>
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
            const branch = watch(`branches.${index}`);
            const status = branch?.status || "pending";
            const currentValue = getValues(`branches.${index}.timezone`);
            const fieldValue = watch(`branches.${index}.timezone`);
            const finalValue =
              fieldValue || currentValue || branch?.timezone || "";

            const isEditable = status === "error" || status === "pending";
            const isDisabled =
              status === "success" || (processing && status !== "error");

            return (
              <CHEKIOTableRow key={field.id} index={index}>
                <CHEKIOTableCell>
                  <SystemInput
                    control={control}
                    label=""
                    attribute={`branches.${index}.code`}
                    errors={errors}
                    rules={{
                      required: tMassive("validation.codeRequired"),
                    }}
                    value={branch?.code || ""}
                    placeholder={tMassive("table.placeholders.code")}
                    disabled={isDisabled}
                    showError={true}
                  />
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <SystemInput
                    control={control}
                    label=""
                    attribute={`branches.${index}.name`}
                    errors={errors}
                    rules={{
                      required: tMassive("validation.nameRequired"),
                    }}
                    value={branch?.name || ""}
                    placeholder={tMassive("table.placeholders.name")}
                    disabled={isDisabled}
                    showError={true}
                  />
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <SystemInput
                    control={control}
                    label=""
                    attribute={`branches.${index}.address`}
                    errors={errors}
                    rules={{
                      required: tMassive("validation.addressRequired"),
                    }}
                    value={branch?.address || ""}
                    placeholder={tMassive("table.placeholders.address")}
                    disabled={isDisabled}
                    showError={true}
                  />
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <Controller
                    name={`branches.${index}.phone`}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder={tMassive("table.placeholders.phone")}
                        disabled={isDisabled}
                        onChange={(e) => {
                          const value = e.target.value.replace(
                            /[^0-9+\-\s]/g,
                            ""
                          );
                          field.onChange(value);
                        }}
                      />
                    )}
                  />
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <Controller
                    name={`branches.${index}.timezone`}
                    control={control}
                    rules={{
                      required: tMassive("validation.timezoneRequired"),
                    }}
                    render={({ field }) => (
                      <div>
                        <CHEKIOSelect
                          value={finalValue}
                          onValueChange={(value) => {
                            field.onChange(value);
                            setValue(`branches.${index}.timezone`, value);
                          }}
                          disabled={isDisabled}
                        >
                          <CHEKIOSelectTrigger
                            className={`w-full ${
                              errors.branches?.[index]?.timezone
                                ? "border-red-500"
                                : ""
                            }`}
                          >
                            <CHEKIOSelectValue
                              placeholder={tMassive(
                                "table.placeholders.timezone"
                              )}
                            />
                          </CHEKIOSelectTrigger>
                          <CHEKIOSelectContent>
                            {TIME_ZONE_OPTIONS.map((option) => (
                              <CHEKIOSelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </CHEKIOSelectItem>
                            ))}
                          </CHEKIOSelectContent>
                        </CHEKIOSelect>
                        {errors.branches?.[index]?.timezone && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.branches[index].timezone.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  {status === "pending" && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {tMassive("table.status.pending")}
                    </span>
                  )}
                  {status === "processing" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {tMassive("table.status.processing")}
                    </span>
                  )}
                  {status === "success" && (
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3" />
                        {tMassive("table.status.completed")}
                      </span>
                      <span className="text-xs text-green-600 mt-1 max-w-[200px]">
                        Sucursal cargada con éxito
                      </span>
                    </div>
                  )}
                  {status === "error" && (
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        <X className="w-3 h-3" />
                        {tMassive("table.status.error")}
                      </span>
                      {branch?.error && (
                        <span className="text-xs text-red-500 mt-1">
                          {branch.error}
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
                    aria-label={tMassive("ariaLabels.deleteBranch")}
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
      size="7xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
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
        <p className="text-gray-700 flex items-center gap-3 text-lg">
          <AlertCircle className="text-blue-500 h-5 w-5" />
          {tMassive("description")}
        </p>
        <div className="mb-4">
          <SystemMultiSelect
            control={control}
            label={tMassive("validation.companiesLabel")}
            attribute="companies"
            options={companyOptions}
            errors={errors}
            rules={{ required: tMassive("validation.companiesRequired") }}
            placeholder={tMassive("validation.companiesPlaceholder")}
            showSelectAll={true}
            onSelectAll={handleSelectAll}
            searchable={true}
            showClear={true}
            maxItems={3}
            disabled={processing}
            showError={true}
          />
        </div>

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
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium mb-2 text-green-800">
                {tMassive("instructions.excel.title")}
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                <li>{tMassive("instructions.excel.step1")}</li>
                <li>{tMassive("instructions.excel.step2")}</li>
                <li>
                  <strong>Importante:</strong>{" "}
                  {tMassive("instructions.excel.step3")}
                </li>
                <li>{tMassive("instructions.excel.step4")}</li>
                <li>{tMassive("instructions.excel.step5")}</li>
                <li>{tMassive("instructions.excel.step6")}</li>
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
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium mb-2 text-green-800">
                {tMassive("instructions.manual.title")}
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
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

        {validationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 mb-1">
                Error de validación
              </h4>
              <p className="text-sm text-red-700">{validationError}</p>
            </div>
            <button
              onClick={() => setValidationError(null)}
              className="text-red-600 hover:text-red-800 flex-shrink-0"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {isComplete && (
          <div className="flex gap-4 pt-4 border-t">
            {fields.some((field) => field.status === "success") && (
              <CHEKIOButton
                type="button"
                variant="primary"
                onClick={downloadSuccessfulBranchesExcel}
              >
                <Download className="h-4 w-4" />
                Descargar Exitosos
              </CHEKIOButton>
            )}
            {fields.some((field) => field.status === "error") && (
              <CHEKIOButton
                type="button"
                variant="secondaryBlue"
                onClick={downloadErrorBranchesExcel}
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
          {isComplete &&
            watch("branches").some((branch) => branch?.status === "error") && (
              <CHEKIOButton
                type="button"
                variant="primary"
                onClick={handleRetryFailed}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {tMassive("buttons.processing")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {tMassive("buttons.retry")}
                  </>
                )}
              </CHEKIOButton>
            )}
          {!isComplete && (
            <CHEKIOButton
              type="button"
              variant="primary"
              disabled={processing}
              onClick={async () => {
                setValidationError(null);
                clearErrors();
                const allBranches = getValues("branches");
                const companies = getValues("companies");

                if (companies.length === 0) {
                  setValidationError(
                    tMassive("toast.companiesRequired.description")
                  );
                  return;
                }

                if (allBranches.length === 0) {
                  setValidationError("No hay sucursales para procesar");
                  return;
                }

                let hasErrors = false;
                allBranches.forEach((branch, index) => {
                  if (!branch.code?.trim()) {
                    setError(`branches.${index}.code`, {
                      type: "manual",
                      message: tMassive("validation.codeRequired"),
                    });
                    hasErrors = true;
                  }
                  if (!branch.name?.trim()) {
                    setError(`branches.${index}.name`, {
                      type: "manual",
                      message: tMassive("validation.nameRequired"),
                    });
                    hasErrors = true;
                  }
                  if (!branch.address?.trim()) {
                    setError(`branches.${index}.address`, {
                      type: "manual",
                      message: tMassive("validation.addressRequired"),
                    });
                    hasErrors = true;
                  }
                  if (!branch.timezone?.trim()) {
                    setError(`branches.${index}.timezone`, {
                      type: "manual",
                      message: tMassive("validation.timezoneRequired"),
                    });
                    hasErrors = true;
                  } else {
                    const validTimezone = TIME_ZONE_OPTIONS.some(
                      (option) => option.value === branch.timezone
                    );
                    if (!validTimezone) {
                      setError(`branches.${index}.timezone`, {
                        type: "manual",
                        message: tMassive("validation.timezoneInvalid"),
                      });
                      hasErrors = true;
                    }
                  }
                });

                if (hasErrors) {
                  await trigger();
                  return;
                }

                const formData = getValues();
                onSubmit(formData);
              }}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tMassive("buttons.processing")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {tMassive("buttons.process")}
                </>
              )}
            </CHEKIOButton>
          )}
        </div>
      </form>
    </CHEKIOModal>
  );
}
