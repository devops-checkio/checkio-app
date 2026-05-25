"use client";

import { CHEKIOProgressBar, CHEKIOTab, CHEKIOTabs } from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateEmployee,
  useGetBranches,
  useGetJobs,
  useUpdateEmployee,
} from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import ExcelJS from "exceljs";
import { AlertCircle } from "lucide-react";
import { DateTime } from "luxon";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { parseFirstWorksheetToJsonRecords } from "@/utils/parseXlsxFirstSheet";
import { z } from "zod";
import EmployeeBulkUploadTable from "./employee-bulk-upload-table";
import { employeeSchema } from "./employee-modal-create";
import { DocumentTypeOptions } from "./employee.dto";

interface EmployeeBulkUploadProps {
  onSuccess: () => void;
}

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormDataWithStatus extends Partial<EmployeeFormData> {
  id?: string;
  documentNumber: string; // Required for update mode
  error?: string;
  success?: boolean;
  status?: "pending" | "processing" | "success" | "error";
}

interface FormValues {
  employees: EmployeeFormDataWithStatus[];
  companyId: string;
}

const CREATE_MODE_HEADER_KEYS = [
  "firstName",
  "lastName",
  "secondLastName",
  "documentType",
  "documentNumber",
  "address",
  "personalEmail",
  "personalPhone",
  "gender",
  "birthDate",
  "code",
  "workEmail",
  "workPhone",
  "startDate",
  "endDate",
  "isIndefiniteTerm",
  "contractedHours",
  "branchId",
  "jobId",
  "integrationCode",
  "canCheckInOtherBranch",
  "canCheckAnywhere",
  "canCheckFromAnyBranch",
  "canCheckFromWeb",
];

export const UPDATE_FIELDS = {
  personal: [
    { key: "firstName", label: "Nombres", required: false },
    { key: "lastName", label: "Apellido Paterno", required: false },
    { key: "secondLastName", label: "Apellido Materno", required: false },
    { key: "address", label: "Dirección", required: false },
    { key: "personalEmail", label: "Email Personal", required: false },
    { key: "personalPhone", label: "Teléfono Personal", required: false },
    { key: "gender", label: "Género", required: false },
    { key: "birthDate", label: "Fecha de Nacimiento", required: false },
    { key: "documentType", label: "Tipo de Documento", required: false },
    { key: "documentNumber", label: "Número de Documento", required: false },
  ],
  company: [
    { key: "code", label: "Código", required: false },
    { key: "workEmail", label: "Email Laboral", required: false },
    { key: "workPhone", label: "Teléfono Laboral", required: false },
    { key: "startDate", label: "Fecha de Ingreso", required: false },
    { key: "endDate", label: "Fecha de Término", required: false },
    { key: "isIndefiniteTerm", label: "Contrato Indefinido", required: false },
    { key: "contractedHours", label: "Horas Contratadas", required: false },
    { key: "branchId", label: "Sucursal", required: false },
    { key: "jobId", label: "Cargo", required: false },
    { key: "integrationCode", label: "Código de Integración", required: false },
  ],
  homeOffice: [
    {
      key: "canCheckInOtherBranch",
      label: "Puede Marcar en Otra Sucursal",
      required: false,
    },
    {
      key: "canCheckAnywhere",
      label: "Puede Marcar en Cualquier Lugar",
      required: false,
    },
    {
      key: "canCheckFromAnyBranch",
      label: "Puede Marcar desde Cualquier Sucursal",
      required: false,
    },
    {
      key: "canCheckFromWeb",
      label: "Puede Marcar desde Web",
      required: false,
    },
  ],
  legal: [
    { key: "legalMetadata.article22", label: "Artículo 22", required: false },
    { key: "legalMetadata.article27", label: "Artículo 27", required: false },
    {
      key: "legalMetadata.flexibilityHours",
      label: "Flexibilidad Horaria",
      required: false,
    },
  ],
};

export default function EmployeeBulkUpload({
  onSuccess,
}: EmployeeBulkUploadProps) {
  const { companyId } = useCookieSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: createEmployee } = useCreateEmployee();
  const { mutateAsync: updateEmployee } = useUpdateEmployee();
  const locale = useLocale();
  const t = useTranslations("common");
  const tEmp = useTranslations("mantainers.employees");
  const tGender = useTranslations("mantainers.employees.gender");

  const getCreateModeHeaders = useCallback(
    () =>
      CREATE_MODE_HEADER_KEYS.map((k) =>
        tEmp(`bulkUpload.fields.${k}` as any),
      ),
    [tEmp],
  );

  const { data: jobs } = useGetJobs({
    page: 1,
    pageSize: 1000,
    sort: "asc",
    companyId: companyId!,
  });

  const { data: branches } = useGetBranches({
    page: 1,
    pageSize: 1000,
    sort: "asc",
    companyId: companyId!,
  });

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [activeMode, setActiveMode] = useState<"create" | "update">("create");
  const [selectedUpdateFields, setSelectedUpdateFields] = useState<string[]>(
    [],
  );

  const {
    control,
    formState: { errors },
    setValue,
    handleSubmit,
    reset,
    getValues,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      employees: [] as EmployeeFormDataWithStatus[],
      companyId: companyId || "",
    },
  });

  const { fields, append, replace, remove } = useFieldArray({
    control,
    name: "employees",
  });

  const employees = watch("employees");
  const [activeTab, setActiveTab] = useState<"excel" | "manual">("excel");

  // Helper function to parse Excel date
  const parseExcelDate = useCallback((value: any): string => {
    console.log("[parseExcelDate] Input value:", value, "Type:", typeof value);

    // Handle null, undefined, or empty string
    if (value === null || value === undefined || value === "") {
      console.log(
        "[parseExcelDate] Value is null/undefined/empty, returning empty string",
      );
      return "";
    }

    // If it's a Date object (XLSX with cellDates: true converts to Date)
    if (value instanceof Date) {
      console.log("[parseExcelDate] Value is Date object:", value);
      if (!isNaN(value.getTime())) {
        const isoDate = DateTime.fromJSDate(value).toISODate();
        console.log("[parseExcelDate] Converted Date to ISO:", isoDate);
        return isoDate || "";
      }
      console.log("[parseExcelDate] Date is invalid");
      return "";
    }

    // If it's a number (Excel serial date number)
    if (typeof value === "number") {
      console.log("[parseExcelDate] Value is number (Excel serial):", value);
      // Excel serial date: days since 1900-01-01
      // Excel epoch is actually 1899-12-30 (Excel incorrectly treats 1900 as leap year)
      // Convert to JavaScript date
      const excelEpoch = new Date(1899, 11, 30);
      const jsDate = new Date(excelEpoch.getTime() + (value - 1) * 86400000);
      console.log(
        "[parseExcelDate] Converted Excel serial to JS Date:",
        jsDate,
      );

      if (!isNaN(jsDate.getTime())) {
        const isoDate = DateTime.fromJSDate(jsDate).toISODate();
        console.log("[parseExcelDate] Converted Excel serial to ISO:", isoDate);
        return isoDate || "";
      }
      console.log(
        "[parseExcelDate] Excel serial conversion resulted in invalid date",
      );
      return "";
    }

    // If it's a string, try to parse it
    if (typeof value === "string") {
      const trimmedValue = value.trim();
      console.log("[parseExcelDate] Value is string, trimmed:", trimmedValue);
      if (!trimmedValue) {
        console.log("[parseExcelDate] Trimmed value is empty");
        return "";
      }

      // Try to parse common date formats - prioritize dd/MM/yyyy format first
      // First check if it matches the pattern dd/MM/yyyy or similar
      const datePattern = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/;
      const match = trimmedValue.match(datePattern);
      console.log("[parseExcelDate] Regex match result:", match);

      if (match) {
        const [, day, month, year] = match;
        const fullYear = year.length === 2 ? `20${year}` : year;
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(fullYear, 10);

        console.log(
          "[parseExcelDate] Parsed components - Day:",
          dayNum,
          "Month:",
          monthNum,
          "Year:",
          yearNum,
        );

        // Validate date values
        if (
          dayNum >= 1 &&
          dayNum <= 31 &&
          monthNum >= 1 &&
          monthNum <= 12 &&
          yearNum >= 1900 &&
          yearNum <= 2100
        ) {
          try {
            const date = new Date(yearNum, monthNum - 1, dayNum);
            console.log("[parseExcelDate] Created Date object:", date);
            if (
              !isNaN(date.getTime()) &&
              date.getDate() === dayNum &&
              date.getMonth() === monthNum - 1
            ) {
              const isoDate = DateTime.fromJSDate(date).toISODate();
              console.log(
                "[parseExcelDate] Successfully converted from regex to ISO:",
                isoDate,
              );
              return isoDate || "";
            } else {
              console.log(
                "[parseExcelDate] Date validation failed - date.getDate():",
                date.getDate(),
                "dayNum:",
                dayNum,
                "date.getMonth():",
                date.getMonth(),
                "monthNum-1:",
                monthNum - 1,
              );
            }
          } catch (e) {
            console.log("[parseExcelDate] Error creating Date object:", e);
            // Continue to format-based parsing
          }
        } else {
          console.log("[parseExcelDate] Date components validation failed");
        }
      }

      // Try format-based parsing
      const formats = [
        "dd/MM/yyyy",
        "d/M/yyyy",
        "dd/M/yyyy",
        "d/MM/yyyy",
        "dd-MM-yyyy",
        "d-M-yyyy",
        "dd-M-yyyy",
        "d-MM-yyyy",
        "yyyy-MM-dd",
        "yyyy/MM/dd",
        "MM/dd/yyyy",
        "dd.MM.yyyy",
        "d.M.yyyy",
      ];

      for (const format of formats) {
        try {
          const parsed = DateTime.fromFormat(trimmedValue, format);
          console.log(
            "[parseExcelDate] Trying format:",
            format,
            "Parsed:",
            parsed,
            "Valid:",
            parsed.isValid,
          );
          if (parsed.isValid) {
            const isoDate = parsed.toISODate();
            console.log(
              "[parseExcelDate] Successfully converted with format",
              format,
              "to ISO:",
              isoDate,
            );
            return isoDate || "";
          }
        } catch (e) {
          console.log(
            "[parseExcelDate] Error parsing with format",
            format,
            ":",
            e,
          );
          // Continue to next format
        }
      }

      // Try ISO format
      try {
        const isoParsed = DateTime.fromISO(trimmedValue);
        console.log(
          "[parseExcelDate] ISO parse result:",
          isoParsed,
          "Valid:",
          isoParsed.isValid,
        );
        if (isoParsed.isValid) {
          const isoDate = isoParsed.toISODate();
          console.log(
            "[parseExcelDate] Successfully converted ISO to ISO date:",
            isoDate,
          );
          return isoDate || "";
        }
      } catch (e) {
        console.log("[parseExcelDate] Error parsing ISO:", e);
        // Continue
      }

      // Try parsing as a number (if it's a string representation of Excel serial date)
      const numValue = parseFloat(trimmedValue);
      console.log(
        "[parseExcelDate] Trying as number:",
        numValue,
        "isNaN:",
        isNaN(numValue),
      );
      if (!isNaN(numValue) && numValue > 0 && numValue < 100000) {
        const excelEpoch = new Date(1899, 11, 30);
        const jsDate = new Date(
          excelEpoch.getTime() + (numValue - 1) * 86400000,
        );
        console.log(
          "[parseExcelDate] Converted string number to Date:",
          jsDate,
        );
        if (!isNaN(jsDate.getTime())) {
          const isoDate = DateTime.fromJSDate(jsDate).toISODate();
          console.log(
            "[parseExcelDate] Successfully converted from string number to ISO:",
            isoDate,
          );
          return isoDate || "";
        }
      }

      // Return empty if can't parse
      console.warn(
        "[parseExcelDate] Could not parse date, returning empty string. Original value:",
        value,
        "Trimmed:",
        trimmedValue,
      );
      return "";
    }

    return "";
  }, []);

  // Helper function to get column value from Excel
  const getColumnValue = useCallback((item: any, variants: string[]) => {
    for (const variant of variants) {
      if (
        item[variant] !== undefined &&
        item[variant] !== null &&
        item[variant] !== ""
      ) {
        return String(item[variant]);
      }
    }
    return "";
  }, []);

  const normalizeName = useCallback((value: string) => {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }, []);

  // Helper function to get date value from Excel
  const getDateValue = useCallback(
    (item: any, variants: string[]) => {
      console.log("[getDateValue] Looking for date in variants:", variants);
      console.log("[getDateValue] Item keys:", Object.keys(item));
      for (const variant of variants) {
        const value = item[variant];
        console.log(
          "[getDateValue] Checking variant:",
          variant,
          "Value:",
          value,
          "Type:",
          typeof value,
        );
        if (value !== undefined && value !== null && value !== "") {
          console.log(
            "[getDateValue] Found value for variant",
            variant,
            ":",
            value,
          );
          const parsed = parseExcelDate(value);
          console.log("[getDateValue] Parsed result:", parsed);
          return parsed;
        }
      }
      console.log(
        "[getDateValue] No value found for any variant, returning empty string",
      );
      return "";
    },
    [parseExcelDate],
  );

  // Helper function to get branch publicId by name
  const getBranchIdByName = useCallback(
    (name: string): string | undefined => {
      if (!name || !branches?.data) return undefined;
      const normalizedSearch = normalizeName(name);
      const branch = branches.data.find((b: any) => {
        const candidateName = b.name ? normalizeName(b.name) : "";
        return candidateName === normalizedSearch;
      });
      return branch?.publicId;
    },
    [branches?.data, normalizeName],
  );

  // Helper function to get job publicId by name
  const getJobIdByName = useCallback(
    (name: string): string | undefined => {
      if (!name || !jobs?.data) return undefined;
      const normalizedSearch = normalizeName(name);
      const job = jobs.data.find((j: any) => {
        const candidateName = j.name ? normalizeName(j.name) : "";
        return candidateName === normalizedSearch;
      });
      return job?.publicId;
    },
    [jobs?.data, normalizeName],
  );

  // Helper function to parse yes/no values to boolean
  const parseYesNo = useCallback(
    (value: string): boolean => {
      if (!value) return false;
      const trimmedValue = value.trim().toLowerCase();
      const yesValue = t("yes").toLowerCase();
      const noValue = t("no").toLowerCase();

      // Check translated values
      if (trimmedValue === yesValue) return true;
      if (trimmedValue === noValue) return false;

      // Maintain backward compatibility with TRUE/FALSE
      if (trimmedValue === "true" || trimmedValue === "TRUE") return true;
      if (trimmedValue === "false" || trimmedValue === "FALSE") return false;

      // Default to false if value doesn't match
      return false;
    },
    [t],
  );

  // Helper function to parse gender values to API format (MALE, FEMALE, OTHER)
  const parseGender = useCallback(
    (value: string): string => {
      if (!value) return "";
      const trimmedValue = value.trim().toLowerCase();
      const maleValue = tGender("male").toLowerCase();
      const femaleValue = tGender("female").toLowerCase();
      const otherValue = tGender("other").toLowerCase();

      // Check translated values
      if (trimmedValue === maleValue) return "MALE";
      if (trimmedValue === femaleValue) return "FEMALE";
      if (trimmedValue === otherValue) return "OTHER";

      // Maintain backward compatibility with MALE/FEMALE/OTHER
      if (trimmedValue === "male" || trimmedValue === "MALE") return "MALE";
      if (trimmedValue === "female" || trimmedValue === "FEMALE")
        return "FEMALE";
      if (trimmedValue === "other" || trimmedValue === "OTHER") return "OTHER";

      // Default to empty string if value doesn't match
      return "";
    },
    [tGender],
  );

  // Validate employee for creation mode
  const validateEmployeeCreate = useCallback(
    (employee: EmployeeFormDataWithStatus): string | null => {
      try {
        employeeSchema.parse(employee);
        return null;
      } catch (error: any) {
        if (error.errors && error.errors.length > 0) {
          const firstError = error.errors[0];
          // Improve error message to include field name
          const fieldName = firstError.path?.join(".") || "campo";
          const message = firstError.message || "Required";

          let friendlyFieldName: string;
          try {
            friendlyFieldName = tEmp(`bulkUpload.fields.${fieldName}` as any);
          } catch {
            friendlyFieldName = fieldName;
          }

          // If message is just "Required", make it more descriptive
          if (
            message.toLowerCase().includes("required") ||
            message === "Required"
          ) {
            return tEmp("bulkUpload.validation.fieldRequiredWithName", {
              field: friendlyFieldName,
            });
          }

          return `${friendlyFieldName}: ${message}`;
        }
        return tEmp("bulkUpload.validation.invalidData");
      }
    },
    [tEmp],
  );

  // Validate employee for update mode
  const validateEmployeeUpdate = useCallback(
    (
      employee: EmployeeFormDataWithStatus,
      selectedFields: string[],
    ): string | null => {
      if (!employee.documentNumber?.trim()) {
        return tEmp("bulkUpload.validation.documentNumberRequiredForUpdate");
      }

      // Validate only selected fields
      for (const field of selectedFields) {
        const value = (employee as any)[field];
        // Basic validation - can be expanded
        if (
          field === "personalEmail" &&
          value &&
          !z.string().email().safeParse(value).success
        ) {
          return tEmp("bulkUpload.validation.invalidPersonalEmail");
        }
        if (
          field === "workEmail" &&
          value &&
          !z.string().email().safeParse(value).success
        ) {
          return tEmp("bulkUpload.validation.invalidWorkEmail");
        }
      }

      return null;
    },
    [tEmp],
  );

  const downloadCreateTemplate = useCallback(async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(tEmp("bulkUpload.excel.sheetName"));

      const headers = getCreateModeHeaders();

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

      // Add example row aligned with headers
      worksheet.addRow([
        "Juan",
        "Pérez",
        "García",
        "RUT",
        "12.345.678-9",
        "Calle Ejemplo 123",
        "juan.perez@email.com",
        "+56 9 1234 5678",
        tGender("male"),
        "01/01/1990",
        "EMP001",
        "juan.perez@empresa.com",
        "+56 9 8765 4321",
        "01/01/2024",
        "",
        t("yes"),
        "45",
        branches?.data?.[0]?.name || "",
        jobs?.data?.[0]?.name || "",
        "",
        t("no"),
        t("no"),
        t("no"),
        t("no"),
      ]);

      const genderOptions = `${tGender("male")},${tGender("female")},${tGender(
        "other",
      )}`;
      for (let row = 2; row <= 1000; row++) {
        const cell = worksheet.getCell(`I${row}`);
        cell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [`"${genderOptions}"`],
          showErrorMessage: true,
          errorTitle: tEmp("bulkUpload.excel.invalidValue"),
          error: tEmp("bulkUpload.excel.selectGender"),
          showInputMessage: true,
          promptTitle: tEmp("bulkUpload.excel.selectGenderTitle"),
          prompt: tEmp("bulkUpload.excel.selectGenderPrompt"),
        };
      }

      const docTypeOptions = DocumentTypeOptions.map((d) => d.value).join(",");
      for (let row = 2; row <= 1000; row++) {
        const cell = worksheet.getCell(`D${row}`);
        cell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [`"${docTypeOptions}"`],
        };
      }

      if (branches?.data && branches.data.length > 0) {
        const branchOptions = branches.data.map((b: any) => b.name).join(",");
        for (let row = 2; row <= 1000; row++) {
          const cell = worksheet.getCell(`R${row}`);
          cell.dataValidation = {
            type: "list",
            allowBlank: false,
            formulae: [`"${branchOptions}"`],
            showErrorMessage: true,
            errorTitle: tEmp("bulkUpload.excel.invalidValue"),
            error: tEmp("bulkUpload.excel.selectBranch"),
            showInputMessage: true,
            promptTitle: tEmp("bulkUpload.excel.selectBranchTitle"),
            prompt: tEmp("bulkUpload.excel.selectBranchPrompt"),
          };
        }
      }

      if (jobs?.data && jobs.data.length > 0) {
        const jobOptions = jobs.data.map((j: any) => j.name).join(",");
        for (let row = 2; row <= 1000; row++) {
          const cell = worksheet.getCell(`S${row}`);
          cell.dataValidation = {
            type: "list",
            allowBlank: false,
            formulae: [`"${jobOptions}"`],
            showErrorMessage: true,
            errorTitle: tEmp("bulkUpload.excel.invalidValue"),
            error: tEmp("bulkUpload.excel.selectJob"),
            showInputMessage: true,
            promptTitle: tEmp("bulkUpload.excel.selectJobTitle"),
            prompt: tEmp("bulkUpload.excel.selectJobPrompt"),
          };
        }
      }

      const yesNoOptions = `${t("yes")},${t("no")}`;
      const booleanColumns = [
        { column: "P", field: "isIndefiniteTerm" },
        { column: "U", field: "canCheckInOtherBranch" },
        { column: "V", field: "canCheckAnywhere" },
        { column: "W", field: "canCheckFromAnyBranch" },
        { column: "X", field: "canCheckFromWeb" },
      ];

      booleanColumns.forEach(({ column }) => {
        for (let row = 2; row <= 1000; row++) {
          const cell = worksheet.getCell(`${column}${row}`);
          cell.dataValidation = {
            type: "list",
            allowBlank: false,
            formulae: [`"${yesNoOptions}"`],
            showErrorMessage: true,
            errorTitle: tEmp("bulkUpload.excel.invalidValue"),
            error: tEmp("bulkUpload.excel.pleaseSelectYesOrNo", {
              yes: t("yes"),
              no: t("no"),
            }),
            showInputMessage: true,
            promptTitle: tEmp("bulkUpload.excel.selectValue"),
            prompt: tEmp("bulkUpload.excel.selectYesOrNo", {
              yes: t("yes"),
              no: t("no"),
            }),
          };
        }
      });

      const refSheet = workbook.addWorksheet(
        tEmp("bulkUpload.excel.referencesSheetName")
      );
      refSheet.addRow([
        tEmp("bulkUpload.excel.refSheet.field"),
        tEmp("bulkUpload.excel.refSheet.value"),
        tEmp("bulkUpload.excel.refSheet.description"),
      ]);

      refSheet.addRow([
        tEmp("bulkUpload.excel.refSheet.gender"),
        tGender("male"),
        "Masculino / Male / Masculino / Masculin",
      ]);
      refSheet.addRow([
        tEmp("bulkUpload.excel.refSheet.gender"),
        tGender("female"),
        "Femenino / Female / Feminino / Féminin",
      ]);
      refSheet.addRow([
        tEmp("bulkUpload.excel.refSheet.gender"),
        tGender("other"),
        "Otro / Other / Outro / Autre",
      ]);

      DocumentTypeOptions.forEach((doc) => {
        refSheet.addRow([
          tEmp("bulkUpload.excel.refSheet.documentType"),
          doc.value,
          doc.label,
        ]);
      });

      if (
        branches?.data &&
        Array.isArray(branches.data) &&
        branches.data.length > 0
      ) {
        refSheet.addRow([]);
        refSheet.addRow([
          tEmp("bulkUpload.excel.refSheet.branch"),
          "Nombre",
          tEmp("bulkUpload.excel.refSheet.description"),
        ]);
        branches.data.forEach((branch: any) => {
          if (branch?.name) {
            refSheet.addRow([
              tEmp("bulkUpload.excel.refSheet.branch"),
              branch.name,
              branch.name,
            ]);
          }
        });
      }

      if (jobs?.data && Array.isArray(jobs.data) && jobs.data.length > 0) {
        refSheet.addRow([]);
        refSheet.addRow([
          tEmp("bulkUpload.excel.refSheet.job"),
          "Nombre",
          tEmp("bulkUpload.excel.refSheet.description"),
        ]);
        jobs.data.forEach((job: any) => {
          if (job?.name) {
            refSheet.addRow([
              tEmp("bulkUpload.excel.refSheet.job"),
              job.name,
              job.name,
            ]);
          }
        });
      }

      refSheet.addRow([]);
      refSheet.addRow([
        tEmp("bulkUpload.excel.refSheet.booleanValues"),
        tEmp("bulkUpload.excel.refSheet.value"),
        tEmp("bulkUpload.excel.refSheet.description"),
      ]);
      refSheet.addRow([
        tEmp("bulkUpload.excel.refSheet.booleanValues"),
        t("yes"),
        tEmp("bulkUpload.excel.refSheet.trueDesc"),
      ]);
      refSheet.addRow([
        tEmp("bulkUpload.excel.refSheet.booleanValues"),
        t("no"),
        tEmp("bulkUpload.excel.refSheet.falseDesc"),
      ]);

      worksheet.columns.forEach((col) => {
        col.width = 20;
      });

      refSheet.columns.forEach((col) => {
        col.width = 30;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = tEmp("bulkUpload.excel.templateCreateFileName");
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando plantilla:", error);
      toast({
        title: tEmp("bulkUpload.toast.error"),
        description: tEmp("bulkUpload.toast.templateError"),
        variant: "destructive",
      });
    }
  }, [toast, branches, jobs, t, tGender, tEmp, getCreateModeHeaders]);

  // Download template for update mode
  const downloadUpdateTemplate = useCallback(async () => {
    if (selectedUpdateFields.length === 0) {
      toast({
        title: tEmp("bulkUpload.toast.error"),
        description: tEmp("bulkUpload.toast.selectAtLeastOneField"),
        variant: "destructive",
      });
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(
        tEmp("bulkUpload.excel.updateSheetName"),
      );

      const headers = [
        tEmp("bulkUpload.fields.documentNumber"),
        ...selectedUpdateFields.map((field) =>
          tEmp(`bulkUpload.fields.${field}` as any),
        ),
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

      worksheet.addRow(["12.345.678-9", ...selectedUpdateFields.map(() => "")]);

      // Helper function to convert column number to Excel column letter (1 -> A, 27 -> AA, etc.)
      const getColumnLetter = (colNum: number): string => {
        let result = "";
        while (colNum > 0) {
          colNum--;
          result = String.fromCharCode(65 + (colNum % 26)) + result;
          colNum = Math.floor(colNum / 26);
        }
        return result;
      };

      // Add data validation for gender if gender is selected
      const genderFieldIndex = selectedUpdateFields.findIndex(
        (f) => f === "gender",
      );
      if (genderFieldIndex !== -1) {
        const columnIndex = genderFieldIndex + 2; // +2 because column 1 is document number
        const columnLetter = getColumnLetter(columnIndex);
        const genderOptions = `${tGender("male")},${tGender(
          "female",
        )},${tGender("other")}`;
          for (let row = 2; row <= 1000; row++) {
          const cell = worksheet.getCell(`${columnLetter}${row}`);
          cell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`"${genderOptions}"`],
            showErrorMessage: true,
            errorTitle: tEmp("bulkUpload.excel.invalidValue"),
            error: tEmp("bulkUpload.excel.selectGender"),
            showInputMessage: true,
            promptTitle: tEmp("bulkUpload.excel.selectGenderTitle"),
            prompt: tEmp("bulkUpload.excel.selectGenderPrompt"),
          };
        }
      }

      // Add data validation for branch (Sucursal) if branchId is selected
      const branchFieldIndex = selectedUpdateFields.findIndex(
        (f) => f === "branchId",
      );
      if (
        branchFieldIndex !== -1 &&
        branches?.data &&
        branches.data.length > 0
      ) {
        // Column index: 1 (Número de Documento) + branchFieldIndex + 1
        const columnIndex = branchFieldIndex + 2; // +2 because column 1 is document number
        const columnLetter = getColumnLetter(columnIndex);
        const branchOptions = branches.data.map((b: any) => b.name).join(",");
        for (let row = 2; row <= 1000; row++) {
          const cell = worksheet.getCell(`${columnLetter}${row}`);
          cell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`"${branchOptions}"`],
            showErrorMessage: true,
            errorTitle: tEmp("bulkUpload.excel.invalidValue"),
            error: tEmp("bulkUpload.excel.selectBranch"),
            showInputMessage: true,
            promptTitle: tEmp("bulkUpload.excel.selectBranchTitle"),
            prompt: tEmp("bulkUpload.excel.selectBranchPrompt"),
          };
        }
      }

      // Add data validation for job (Cargo) if jobId is selected
      const jobFieldIndex = selectedUpdateFields.findIndex(
        (f) => f === "jobId",
      );
      if (jobFieldIndex !== -1 && jobs?.data && jobs.data.length > 0) {
        // Column index: 1 (Número de Documento) + jobFieldIndex + 1
        const columnIndex = jobFieldIndex + 2; // +2 because column 1 is document number
        const columnLetter = getColumnLetter(columnIndex);
        const jobOptions = jobs.data.map((j: any) => j.name).join(",");
        for (let row = 2; row <= 1000; row++) {
          const cell = worksheet.getCell(`${columnLetter}${row}`);
          cell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`"${jobOptions}"`],
            showErrorMessage: true,
            errorTitle: tEmp("bulkUpload.excel.invalidValue"),
            error: tEmp("bulkUpload.excel.selectJob"),
            showInputMessage: true,
            promptTitle: tEmp("bulkUpload.excel.selectJobTitle"),
            prompt: tEmp("bulkUpload.excel.selectJobPrompt"),
          };
        }
      }

      // Add data validation for boolean fields if selected
      const booleanFields = [
        "isIndefiniteTerm",
        "canCheckInOtherBranch",
        "canCheckAnywhere",
        "canCheckFromAnyBranch",
        "canCheckFromWeb",
      ];
      const yesNoOptions = `${t("yes")},${t("no")}`;

      booleanFields.forEach((field) => {
        const fieldIndex = selectedUpdateFields.findIndex((f) => f === field);
        if (fieldIndex !== -1) {
          const columnIndex = fieldIndex + 2; // +2 because column 1 is document number
          const columnLetter = getColumnLetter(columnIndex);
          for (let row = 2; row <= 1000; row++) {
            const cell = worksheet.getCell(`${columnLetter}${row}`);
            cell.dataValidation = {
              type: "list",
              allowBlank: true,
              formulae: [`"${yesNoOptions}"`],
              showErrorMessage: true,
              errorTitle: tEmp("bulkUpload.excel.invalidValue"),
              error: tEmp("bulkUpload.excel.pleaseSelectYesOrNo", {
                yes: t("yes"),
                no: t("no"),
              }),
              showInputMessage: true,
              promptTitle: tEmp("bulkUpload.excel.selectValue"),
              prompt: tEmp("bulkUpload.excel.selectYesOrNo", {
                yes: t("yes"),
                no: t("no"),
              }),
            };
          }
        }
      });

      worksheet.columns.forEach((col) => {
        col.width = 25;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = tEmp("bulkUpload.excel.templateUpdateFileName");
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando plantilla:", error);
      toast({
        title: tEmp("bulkUpload.toast.error"),
        description: tEmp("bulkUpload.toast.templateError"),
        variant: "destructive",
      });
    }
  }, [selectedUpdateFields, toast, branches, jobs, t, tGender, tEmp]);

  // Handle Excel upload for creation
  const handleExcelUploadCreate = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buf = e.target?.result;
          if (!(buf instanceof ArrayBuffer)) {
            return;
          }
          const jsonData = await parseFirstWorksheetToJsonRecords(buf);

          const formattedData = jsonData.map((item: Record<string, unknown>) => {
            const formatted: EmployeeFormDataWithStatus = {
              firstName: getColumnValue(item, [
                "Nombres",
                "nombres",
                "firstName",
              ]),
              lastName: getColumnValue(item, [
                "Apellido Paterno",
                "apellido paterno",
                "lastName",
              ]),
              secondLastName: getColumnValue(item, [
                "Apellido Materno",
                "apellido materno",
                "secondLastName",
              ]),
              documentType: getColumnValue(item, [
                "Tipo de Documento",
                "tipo de documento",
                "documentType",
              ]),
              documentNumber: getColumnValue(item, [
                "Número de Documento",
                "número de documento",
                "documentNumber",
              ]),
              address: getColumnValue(item, [
                "Dirección",
                "dirección",
                "address",
              ]),
              personalEmail: getColumnValue(item, [
                "Email Personal",
                "email personal",
                "personalEmail",
              ]),
              personalPhone: getColumnValue(item, [
                "Teléfono Personal",
                "teléfono personal",
                "personalPhone",
              ]),
              gender: parseGender(
                getColumnValue(item, ["Género", "género", "gender"]),
              ),
              birthDate: getDateValue(item, [
                "Fecha de Nacimiento",
                "fecha de nacimiento",
                "birthDate",
              ]),
              code: getColumnValue(item, ["Código", "código", "code"]),
              workEmail:
                getColumnValue(item, [
                  "Email Laboral",
                  "email laboral",
                  "workEmail",
                ]) || undefined,
              workPhone:
                getColumnValue(item, [
                  "Teléfono Laboral",
                  "teléfono laboral",
                  "workPhone",
                ]) || undefined,
              startDate: getDateValue(item, [
                "Fecha de Ingreso",
                "fecha de ingreso",
                "startDate",
              ]),
              endDate:
                getDateValue(item, [
                  "Fecha de Término",
                  "fecha de término",
                  "endDate",
                ]) || undefined,
              contractedHours: getColumnValue(item, [
                "Horas Contratadas",
                "horas contratadas",
                "contractedHours",
              ])
                ? Number(
                    getColumnValue(item, [
                      "Horas Contratadas",
                      "horas contratadas",
                      "contractedHours",
                    ]),
                  )
                : 45,
              branchId: (() => {
                const branchName = getColumnValue(item, [
                  "Sucursal",
                  "sucursal",
                  "branchId",
                ]);
                return branchName ? getBranchIdByName(branchName) || "" : "";
              })(),
              jobId: (() => {
                const jobName = getColumnValue(item, [
                  "Cargo",
                  "cargo",
                  "jobId",
                ]);
                return jobName ? getJobIdByName(jobName) || "" : "";
              })(),
              integrationCode:
                getColumnValue(item, [
                  "Código de Integración",
                  "código de integración",
                  "integrationCode",
                ]) || undefined,
              isIndefiniteTerm: parseYesNo(
                getColumnValue(item, [
                  "Contrato Indefinido",
                  "contrato indefinido",
                  "isIndefiniteTerm",
                ]),
              ),
              canCheckInOtherBranch: parseYesNo(
                getColumnValue(item, [
                  "Puede Marcar en Otra Sucursal",
                  "puede marcar en otra sucursal",
                  "canCheckInOtherBranch",
                ]),
              ),
              requiresPassword: true,
              canCheckWithoutShift: true,
              canCheckAnywhere: parseYesNo(
                getColumnValue(item, [
                  "Puede Marcar en Cualquier Lugar",
                  "puede marcar en cualquier lugar",
                  "canCheckAnywhere",
                ]),
              ),
              canCheckFromAnyBranch: parseYesNo(
                getColumnValue(item, [
                  "Puede Marcar desde Cualquier Sucursal",
                  "puede marcar desde cualquier sucursal",
                  "canCheckFromAnyBranch",
                ]),
              ),
              canCheckFromWeb: parseYesNo(
                getColumnValue(item, [
                  "Puede Marcar desde Web",
                  "puede marcar desde web",
                  "canCheckFromWeb",
                ]),
              ),
              isActive: true, // Default value, not requested from user
              status: "pending",
            };

            return formatted;
          });

          replace(formattedData);
          toast({
            title: tEmp("bulkUpload.toast.excelLoaded"),
            description: tEmp("bulkUpload.toast.employeesLoaded", {
              count: formattedData.length,
            }),
          });
        } catch (error) {
          console.error("Error procesando Excel:", error);
          toast({
            title: tEmp("bulkUpload.toast.error"),
            description: tEmp("bulkUpload.toast.excelProcessError"),
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(file);
      return false;
    },
    [
      getColumnValue,
      getDateValue,
      getBranchIdByName,
      getJobIdByName,
      parseYesNo,
      parseGender,
      replace,
      toast,
      tEmp,
    ],
  );

  // Handle Excel upload for update
  const handleExcelUploadUpdate = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buf = e.target?.result;
          if (!(buf instanceof ArrayBuffer)) {
            return;
          }
          const jsonData = await parseFirstWorksheetToJsonRecords(buf);

          const formattedData = jsonData.map((item: Record<string, unknown>) => {
            const formatted: EmployeeFormDataWithStatus = {
              documentNumber: getColumnValue(item, [
                "Número de Documento",
                "número de documento",
                "documentNumber",
              ]),
              status: "pending",
            };

            // Add selected fields
            selectedUpdateFields.forEach((field) => {
              const fieldLabel = tEmp(`bulkUpload.fields.${field}` as any);

              // Check if this field is a date field
              const dateFields = ["birthDate", "startDate", "endDate"];
              // Check if this field is a boolean field
              const booleanFields = [
                "isIndefiniteTerm",
                "canCheckInOtherBranch",
                "canCheckAnywhere",
                "canCheckFromAnyBranch",
                "canCheckFromWeb",
              ];

              let value: string | boolean | undefined;

              if (dateFields.includes(field)) {
                value = getDateValue(item, [fieldLabel, field]);
              } else if (field === "branchId") {
                // Map branch name to publicId
                const branchName = getColumnValue(item, [fieldLabel, field]);
                value = branchName
                  ? getBranchIdByName(branchName) || undefined
                  : undefined;
              } else if (field === "jobId") {
                // Map job name to publicId
                const jobName = getColumnValue(item, [fieldLabel, field]);
                value = jobName
                  ? getJobIdByName(jobName) || undefined
                  : undefined;
              } else if (field === "gender") {
                // Parse gender translated values to API format
                const rawValue = getColumnValue(item, [fieldLabel, field]);
                value = parseGender(rawValue);
              } else if (booleanFields.includes(field)) {
                // Parse yes/no values to boolean
                const rawValue = getColumnValue(item, [fieldLabel, field]);
                value = parseYesNo(rawValue);
              } else {
                value = getColumnValue(item, [fieldLabel, field]);
              }

              if (value !== undefined && value !== null && value !== "") {
                (formatted as any)[field] = value;
              }
            });

            return formatted;
          });

          replace(formattedData);
          toast({
            title: tEmp("bulkUpload.toast.excelLoaded"),
            description: tEmp("bulkUpload.toast.recordsLoaded", {
              count: formattedData.length,
            }),
          });
        } catch (error) {
          console.error("Error procesando Excel:", error);
          toast({
            title: tEmp("bulkUpload.toast.error"),
            description: tEmp("bulkUpload.toast.excelProcessError"),
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(file);
      return false;
    },
    [
      getColumnValue,
      getDateValue,
      getBranchIdByName,
      getJobIdByName,
      parseYesNo,
      parseGender,
      replace,
      selectedUpdateFields,
      toast,
      tEmp,
    ],
  );

  // Process employees for creation
  const handleProcessCreate = useCallback(async () => {
    const data = getValues();

    if (data.employees.length === 0) {
      toast({
        title: tEmp("bulkUpload.toast.error"),
        description: tEmp("bulkUpload.toast.noEmployeesToProcess"),
        variant: "destructive",
      });
      return;
    }

    // Validate all employees
    const validationErrors: string[] = [];

    const documentNumberMap = new Map<string, number>();
    const personalEmailMap = new Map<string, number>();

    data.employees.forEach((employee, index) => {
      const doc = employee.documentNumber?.trim();
      if (doc) {
        const key = doc.toLowerCase();
        if (documentNumberMap.has(key)) {
          const firstIndex = documentNumberMap.get(key)!;
          validationErrors.push(
            `${tEmp("bulkUpload.validation.rowPrefix")} ${
              index + 1
            }: ${tEmp("bulkUpload.validation.duplicateDocumentNumber", {
              value: doc,
              firstRow: firstIndex + 1,
            })}`,
          );
        } else {
          documentNumberMap.set(key, index);
        }
      }

      const email = employee.personalEmail?.trim();
      if (email) {
        const key = email.toLowerCase();
        if (personalEmailMap.has(key)) {
          const firstIndex = personalEmailMap.get(key)!;
          validationErrors.push(
            `${tEmp("bulkUpload.validation.rowPrefix")} ${
              index + 1
            }: ${tEmp("bulkUpload.validation.duplicatePersonalEmail", {
              value: email,
              firstRow: firstIndex + 1,
            })}`,
          );
        } else {
          personalEmailMap.set(key, index);
        }
      }
    });
    data.employees.forEach((employee, index) => {
      const error = validateEmployeeCreate(employee as EmployeeFormData);
      if (error) {
        validationErrors.push(
          `${tEmp("bulkUpload.validation.rowPrefix")} ${index + 1}: ${error}`,
        );
      }
    });

    if (validationErrors.length > 0) {
      // Show all errors, not just first 5
      const errorMessage =
        validationErrors.length === 1
          ? validationErrors[0]
          : validationErrors.slice(0, 10).join("\n") +
            (validationErrors.length > 10
              ? `\n${tEmp("bulkUpload.toast.andMoreErrors", {
                  count: validationErrors.length - 10,
                })}`
              : "");

      toast({
        title: tEmp("bulkUpload.toast.validationErrors"),
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Show for 10 seconds to allow reading
      });
      return;
    }

    setProcessing(true);
    setUploadProgress(0);
    setIsComplete(false);

    const total = data.employees.length;
    let processed = 0;
    let hasErrors = false;

    const newData = [...data.employees];

    for (let i = 0; i < data.employees.length; i++) {
      const employee = data.employees[i];

      newData[i] = {
        ...newData[i],
        status: "processing",
      };
      replace(newData);

      try {
        // Exclude status, error, success, and id from API call
        const { status, error, success, id, ...employeeData } =
          employee as EmployeeFormDataWithStatus;
        await createEmployee({
          ...(employeeData as EmployeeFormData),
          requiresPassword: true,
          companyId: companyId || "",
          endDate: employeeData.endDate || null,
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
          error:
            error.response?.data?.message ||
            tEmp("bulkUpload.toast.createError"),
        };
      }

      replace(newData);
    }

    setProcessing(false);
    const allSuccess = newData.every((emp) => emp.status === "success");
    setIsComplete(true);

    if (hasErrors) {
      toast({
        title: tEmp("bulkUpload.toast.processCompletedWithErrors.title"),
        description: tEmp("bulkUpload.toast.someNotCreated"),
        variant: "destructive",
      });
    } else {
      toast({
        title: tEmp("bulkUpload.toast.processCompletedSuccess.title"),
        description: tEmp("bulkUpload.toast.allCreated"),
      });
      queryClient.invalidateQueries({ queryKey: ["GetEmployees"] });
      onSuccess();
    }
  }, [
    getValues,
    validateEmployeeCreate,
    createEmployee,
    companyId,
    replace,
    toast,
    queryClient,
    onSuccess,
    tEmp,
  ]);

  // Process employees for update
  const handleProcessUpdate = useCallback(async () => {
    const data = getValues();

    if (data.employees.length === 0) {
      toast({
        title: tEmp("bulkUpload.toast.error"),
        description: tEmp("bulkUpload.toast.noEmployeesToProcess"),
        variant: "destructive",
      });
      return;
    }

    if (selectedUpdateFields.length === 0) {
      toast({
        title: tEmp("bulkUpload.toast.error"),
        description: tEmp("bulkUpload.toast.selectAtLeastOneField"),
        variant: "destructive",
      });
      return;
    }

    // Validate all employees
    const validationErrors: string[] = [];
    data.employees.forEach((employee, index) => {
      const error = validateEmployeeUpdate(employee, selectedUpdateFields);
      if (error) {
        validationErrors.push(
          `${tEmp("bulkUpload.validation.rowPrefix")} ${index + 1}: ${error}`,
        );
      }
    });

    if (validationErrors.length > 0) {
      // Show all errors, not just first 5
      const errorMessage =
        validationErrors.length === 1
          ? validationErrors[0]
          : validationErrors.slice(0, 10).join("\n") +
            (validationErrors.length > 10
              ? `\n${tEmp("bulkUpload.toast.andMoreErrors", {
                  count: validationErrors.length - 10,
                })}`
              : "");

      toast({
        title: tEmp("bulkUpload.toast.validationErrors"),
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Show for 10 seconds to allow reading
      });
      return;
    }

    setProcessing(true);
    setUploadProgress(0);
    setIsComplete(false);

    const total = data.employees.length;
    let processed = 0;
    let hasErrors = false;

    const newData = [...data.employees];

    for (let i = 0; i < data.employees.length; i++) {
      const employee = data.employees[i];

      newData[i] = {
        ...newData[i],
        status: "processing",
      };
      replace(newData);

      try {
        // Use documentNumber as id - backend will validate if employee exists
        const updateData: any = { id: employee.documentNumber };

        // Always include documentNumber if present (it's always in the form for update mode)
        if (employee.documentNumber && employee.documentNumber.trim() !== "") {
          updateData.documentNumber = employee.documentNumber;
        }

        selectedUpdateFields.forEach((field) => {
          // Exclude status, error, success fields from API call
          if (field === "status" || field === "error" || field === "success") {
            return;
          }
          const value = (employee as any)[field];
          if (value !== undefined && value !== null && value !== "") {
            updateData[field] = value;
          }
        });

        await updateEmployee(updateData);

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
          error:
            error.response?.data?.message || tEmp("bulkUpload.toast.updateError"),
        };
      }

      replace(newData);
    }

    setProcessing(false);
    const allSuccess = newData.every((emp) => emp.status === "success");
    setIsComplete(true);

    if (hasErrors) {
      toast({
        title: tEmp("bulkUpload.toast.processCompletedWithErrors.title"),
        description: tEmp("bulkUpload.toast.someNotUpdated"),
        variant: "destructive",
      });
    } else {
      toast({
        title: tEmp("bulkUpload.toast.processCompletedSuccess.title"),
        description: tEmp("bulkUpload.toast.allUpdated"),
      });
      queryClient.invalidateQueries({ queryKey: ["GetEmployees"] });
      onSuccess();
    }
  }, [
    getValues,
    selectedUpdateFields,
    validateEmployeeUpdate,
    updateEmployee,
    companyId,
    replace,
    toast,
    queryClient,
    onSuccess,
    tEmp,
  ]);

  // Retry failed employees
  const handleRetryFailed = useCallback(async () => {
    const allEmployees = watch("employees");
    const failedIndices = allEmployees
      .map((emp, index) => (emp.status === "error" ? index : -1))
      .filter((index) => index !== -1);

    if (failedIndices.length === 0) {
      toast({
        title: tEmp("bulkUpload.toast.noFailedRecords"),
        description: tEmp("bulkUpload.toast.noFailedRecordsDescription"),
      });
      return;
    }

    if (activeMode === "create") {
      // Retry creation
      setProcessing(true);
      setUploadProgress(0);
      setIsComplete(false);

      const newData = [...allEmployees];
      let processed = 0;
      let hasErrors = false;
      const total = failedIndices.length;

      for (const index of failedIndices) {
        const employee = allEmployees[index];

        newData[index] = {
          ...newData[index],
          status: "processing",
          error: undefined,
        };
        replace(newData);

        try {
          // Exclude status, error, success, and id from API call
          const { status, error, success, id, ...employeeData } =
            employee as EmployeeFormDataWithStatus;
          await createEmployee({
            ...(employeeData as EmployeeFormData),
            requiresPassword: true,
            companyId: companyId || "",
            endDate: employeeData.endDate || null,
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
            error:
              error.response?.data?.message || "Error al crear el empleado",
          };
        }

        replace(newData);
      }

      setProcessing(false);
      setIsComplete(true);

      if (hasErrors) {
        toast({
          title: tEmp("bulkUpload.toast.retryWithErrors.title"),
          description: tEmp("bulkUpload.toast.retryWithErrors.description"),
          variant: "destructive",
        });
      } else {
        toast({
          title: tEmp("bulkUpload.toast.retrySuccess.title"),
          description: tEmp("bulkUpload.toast.retrySuccess.description"),
        });
        queryClient.invalidateQueries({ queryKey: ["GetEmployees"] });
        const allSuccess = newData.every((emp) => emp.status === "success");
        if (allSuccess) {
          onSuccess();
        }
      }
    } else {
      // Retry update
      if (selectedUpdateFields.length === 0) {
        toast({
          title: tEmp("bulkUpload.toast.error"),
          description: tEmp("bulkUpload.toast.selectAtLeastOneField"),
          variant: "destructive",
        });
        return;
      }

      setProcessing(true);
      setUploadProgress(0);
      setIsComplete(false);

      const newData = [...allEmployees];
      let processed = 0;
      let hasErrors = false;
      const total = failedIndices.length;

      for (const index of failedIndices) {
        const employee = allEmployees[index];

        newData[index] = {
          ...newData[index],
          status: "processing",
          error: undefined,
        };
        replace(newData);

        try {
          // Use documentNumber as id - backend will validate if employee exists
          const updateData: any = { id: employee.documentNumber };

          // Always include documentNumber if present (it's always in the form for update mode)
          if (
            employee.documentNumber &&
            employee.documentNumber.trim() !== ""
          ) {
            updateData.documentNumber = employee.documentNumber;
          }

          selectedUpdateFields.forEach((field) => {
            // Exclude status, error, success fields from API call
            if (
              field === "status" ||
              field === "error" ||
              field === "success"
            ) {
              return;
            }
            const value = (employee as any)[field];
            if (value !== undefined && value !== null && value !== "") {
              updateData[field] = value;
            }
          });

          await updateEmployee(updateData);

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
            error:
              error.response?.data?.message ||
              tEmp("bulkUpload.toast.updateError"),
          };
        }

        replace(newData);
      }

      setProcessing(false);
      setIsComplete(true);

      if (hasErrors) {
        toast({
          title: tEmp("bulkUpload.toast.retryWithErrors.title"),
          description: tEmp("bulkUpload.toast.retryWithErrors.description"),
          variant: "destructive",
        });
      } else {
        toast({
          title: tEmp("bulkUpload.toast.retrySuccess.title"),
          description: tEmp("bulkUpload.toast.retrySuccess.description"),
        });
        queryClient.invalidateQueries({ queryKey: ["GetEmployees"] });
        const allSuccess = newData.every((emp) => emp.status === "success");
        if (allSuccess) {
          onSuccess();
        }
      }
    }
  }, [
    watch,
    activeMode,
    createEmployee,
    updateEmployee,
    selectedUpdateFields,
    companyId,
    replace,
    toast,
    queryClient,
    onSuccess,
    tEmp,
  ]);

  const formatBooleanToYesNo = useCallback(
    (value: boolean | undefined | null): string => {
      if (value === true) return t("yes");
      return t("no");
    },
    [t],
  );

  const formatGender = useCallback(
    (value: string | undefined | null): string => {
      if (!value) return "";
      if (value === "MALE") return tGender("male");
      if (value === "FEMALE") return tGender("female");
      if (value === "OTHER") return tGender("other");
      return value;
    },
    [tGender],
  );

  const getBranchNameById = useCallback(
    (branchId: string | undefined | null): string => {
      if (!branchId || !branches?.data) return "";
      const branch = branches.data.find((b: any) => b.publicId === branchId);
      return branch?.name || "";
    },
    [branches?.data],
  );

  const getJobNameById = useCallback(
    (jobId: string | undefined | null): string => {
      if (!jobId || !jobs?.data) return "";
      const job = jobs.data.find((j: any) => j.publicId === jobId);
      return job?.name || "";
    },
    [jobs?.data],
  );

  const addReferenceSheet = useCallback(
    (workbook: ExcelJS.Workbook) => {
      const refSheet = workbook.addWorksheet(
        tEmp("bulkUpload.excel.referencesSheetName"),
      );
      refSheet.addRow([
        tEmp("bulkUpload.excel.refSheet.field"),
        tEmp("bulkUpload.excel.refSheet.value"),
        tEmp("bulkUpload.excel.refSheet.description"),
      ]);

      refSheet.addRow([
        tEmp("bulkUpload.excel.refSheet.gender"),
        tGender("male"),
        "Masculino / Male / Masculino / Masculin",
      ]);
      refSheet.addRow([
        tEmp("bulkUpload.excel.refSheet.gender"),
        tGender("female"),
        "Femenino / Female / Feminino / Féminin",
      ]);
      refSheet.addRow([
        tEmp("bulkUpload.excel.refSheet.gender"),
        tGender("other"),
        "Otro / Other / Outro / Autre",
      ]);

      DocumentTypeOptions.forEach((doc) => {
        refSheet.addRow([
          tEmp("bulkUpload.excel.refSheet.documentType"),
          doc.value,
          doc.label,
        ]);
      });

      if (
        branches?.data &&
        Array.isArray(branches.data) &&
        branches.data.length > 0
      ) {
        refSheet.addRow([]);
        refSheet.addRow([
          tEmp("bulkUpload.excel.refSheet.branch"),
          "Nombre",
          tEmp("bulkUpload.excel.refSheet.description"),
        ]);
        branches.data.forEach((branch: any) => {
          if (branch?.name) {
            refSheet.addRow([
              tEmp("bulkUpload.excel.refSheet.branch"),
              branch.name,
              branch.name,
            ]);
          }
        });
      }

      if (jobs?.data && Array.isArray(jobs.data) && jobs.data.length > 0) {
        refSheet.addRow([]);
        refSheet.addRow([
          tEmp("bulkUpload.excel.refSheet.job"),
          "Nombre",
          tEmp("bulkUpload.excel.refSheet.description"),
        ]);
        jobs.data.forEach((job: any) => {
          if (job?.name) {
            refSheet.addRow([
              tEmp("bulkUpload.excel.refSheet.job"),
              job.name,
              job.name,
            ]);
          }
        });
      }

      refSheet.addRow([]);
      refSheet.addRow([
        tEmp("bulkUpload.excel.refSheet.booleanValues"),
        tEmp("bulkUpload.excel.refSheet.value"),
        tEmp("bulkUpload.excel.refSheet.description"),
      ]);
      refSheet.addRow([
        tEmp("bulkUpload.excel.refSheet.booleanValues"),
        t("yes"),
        tEmp("bulkUpload.excel.refSheet.trueDesc"),
      ]);
      refSheet.addRow([
        tEmp("bulkUpload.excel.refSheet.booleanValues"),
        t("no"),
        tEmp("bulkUpload.excel.refSheet.falseDesc"),
      ]);

      refSheet.columns.forEach((col) => {
        col.width = 30;
      });
    },
    [branches, jobs, t, tGender, tEmp],
  );

  const getColumnLetter = (colNum: number): string => {
    let result = "";
    while (colNum > 0) {
      colNum--;
      result = String.fromCharCode(65 + (colNum % 26)) + result;
      colNum = Math.floor(colNum / 26);
    }
    return result;
  };

  const addValidationsCreateMode = useCallback(
    (worksheet: ExcelJS.Worksheet, hasErrorColumn: boolean = false) => {
      const startRow = hasErrorColumn ? 4 : 2;

      const genderOptions = `${tGender("male")},${tGender("female")},${tGender(
        "other",
      )}`;
      for (let row = startRow; row <= 1000; row++) {
        const cell = worksheet.getCell(`I${row}`);
        cell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [`"${genderOptions}"`],
          showErrorMessage: true,
          errorTitle: tEmp("bulkUpload.excel.invalidValue"),
          error: tEmp("bulkUpload.excel.selectGender"),
          showInputMessage: true,
          promptTitle: tEmp("bulkUpload.excel.selectGenderTitle"),
          prompt: tEmp("bulkUpload.excel.selectGenderPrompt"),
        };
      }

      const docTypeOptions = DocumentTypeOptions.map((d) => d.value).join(",");
      for (let row = startRow; row <= 1000; row++) {
        const cell = worksheet.getCell(`D${row}`);
        cell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [`"${docTypeOptions}"`],
        };
      }

      if (branches?.data && branches.data.length > 0) {
        const branchOptions = branches.data.map((b: any) => b.name).join(",");
        for (let row = startRow; row <= 1000; row++) {
          const cell = worksheet.getCell(`Q${row}`);
          cell.dataValidation = {
            type: "list",
            allowBlank: false,
            formulae: [`"${branchOptions}"`],
            showErrorMessage: true,
            errorTitle: tEmp("bulkUpload.excel.invalidValue"),
            error: tEmp("bulkUpload.excel.selectBranch"),
            showInputMessage: true,
            promptTitle: tEmp("bulkUpload.excel.selectBranchTitle"),
            prompt: tEmp("bulkUpload.excel.selectBranchPrompt"),
          };
        }
      }

      if (jobs?.data && jobs.data.length > 0) {
        const jobOptions = jobs.data.map((j: any) => j.name).join(",");
        for (let row = startRow; row <= 1000; row++) {
          const cell = worksheet.getCell(`R${row}`);
          cell.dataValidation = {
            type: "list",
            allowBlank: false,
            formulae: [`"${jobOptions}"`],
            showErrorMessage: true,
            errorTitle: tEmp("bulkUpload.excel.invalidValue"),
            error: tEmp("bulkUpload.excel.selectJob"),
            showInputMessage: true,
            promptTitle: tEmp("bulkUpload.excel.selectJobTitle"),
            prompt: tEmp("bulkUpload.excel.selectJobPrompt"),
          };
        }
      }

      const yesNoOptions = `${t("yes")},${t("no")}`;
      const booleanColumns = [
        { column: "T", field: "isIndefiniteTerm" },
        { column: "U", field: "canCheckInOtherBranch" },
        { column: "V", field: "canCheckAnywhere" },
        { column: "W", field: "canCheckFromAnyBranch" },
        { column: "X", field: "canCheckFromWeb" },
      ];

      booleanColumns.forEach(({ column }) => {
        for (let row = startRow; row <= 1000; row++) {
          const cell = worksheet.getCell(`${column}${row}`);
          cell.dataValidation = {
            type: "list",
            allowBlank: false,
            formulae: [`"${yesNoOptions}"`],
            showErrorMessage: true,
            errorTitle: tEmp("bulkUpload.excel.invalidValue"),
            error: tEmp("bulkUpload.excel.pleaseSelectYesOrNo", {
              yes: t("yes"),
              no: t("no"),
            }),
            showInputMessage: true,
            promptTitle: tEmp("bulkUpload.excel.selectValue"),
            prompt: tEmp("bulkUpload.excel.selectYesOrNo", {
              yes: t("yes"),
              no: t("no"),
            }),
          };
        }
      });
    },
    [branches, jobs, t, tGender, tEmp],
  );

  const addValidationsUpdateMode = useCallback(
    (
      worksheet: ExcelJS.Worksheet,
      selectedFields: string[],
      hasErrorColumn: boolean = false,
    ) => {
      const startRow = hasErrorColumn ? 4 : 2;

      const genderFieldIndex = selectedFields.findIndex((f) => f === "gender");
      if (genderFieldIndex !== -1) {
        const columnIndex = genderFieldIndex + 2;
        const columnLetter = getColumnLetter(columnIndex);
        const genderOptions = `${tGender("male")},${tGender(
          "female",
        )},${tGender("other")}`;
        for (let row = startRow; row <= 1000; row++) {
          const cell = worksheet.getCell(`${columnLetter}${row}`);
          cell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`"${genderOptions}"`],
            showErrorMessage: true,
            errorTitle: tEmp("bulkUpload.excel.invalidValue"),
            error: tEmp("bulkUpload.excel.selectGender"),
            showInputMessage: true,
            promptTitle: tEmp("bulkUpload.excel.selectGenderTitle"),
            prompt: tEmp("bulkUpload.excel.selectGenderPrompt"),
          };
        }
      }

      // Branch validation
      const branchFieldIndex = selectedFields.findIndex(
        (f) => f === "branchId",
      );
      if (
        branchFieldIndex !== -1 &&
        branches?.data &&
        branches.data.length > 0
      ) {
        const columnIndex = branchFieldIndex + 2;
        const columnLetter = getColumnLetter(columnIndex);
        const branchOptions = branches.data.map((b: any) => b.name).join(",");
        for (let row = startRow; row <= 1000; row++) {
          const cell = worksheet.getCell(`${columnLetter}${row}`);
          cell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`"${branchOptions}"`],
            showErrorMessage: true,
            errorTitle: tEmp("bulkUpload.excel.invalidValue"),
            error: tEmp("bulkUpload.excel.selectBranch"),
            showInputMessage: true,
            promptTitle: tEmp("bulkUpload.excel.selectBranchTitle"),
            prompt: tEmp("bulkUpload.excel.selectBranchPrompt"),
          };
        }
      }

      const jobFieldIndex = selectedFields.findIndex((f) => f === "jobId");
      if (jobFieldIndex !== -1 && jobs?.data && jobs.data.length > 0) {
        const columnIndex = jobFieldIndex + 2;
        const columnLetter = getColumnLetter(columnIndex);
        const jobOptions = jobs.data.map((j: any) => j.name).join(",");
        for (let row = startRow; row <= 1000; row++) {
          const cell = worksheet.getCell(`${columnLetter}${row}`);
          cell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`"${jobOptions}"`],
            showErrorMessage: true,
            errorTitle: tEmp("bulkUpload.excel.invalidValue"),
            error: tEmp("bulkUpload.excel.selectJob"),
            showInputMessage: true,
            promptTitle: tEmp("bulkUpload.excel.selectJobTitle"),
            prompt: tEmp("bulkUpload.excel.selectJobPrompt"),
          };
        }
      }

      const booleanFields = [
        "isIndefiniteTerm",
        "canCheckInOtherBranch",
        "canCheckAnywhere",
        "canCheckFromAnyBranch",
        "canCheckFromWeb",
      ];
      const yesNoOptions = `${t("yes")},${t("no")}`;

      booleanFields.forEach((field) => {
        const fieldIndex = selectedFields.findIndex((f) => f === field);
        if (fieldIndex !== -1) {
          const columnIndex = fieldIndex + 2;
          const columnLetter = getColumnLetter(columnIndex);
          for (let row = startRow; row <= 1000; row++) {
            const cell = worksheet.getCell(`${columnLetter}${row}`);
            cell.dataValidation = {
              type: "list",
              allowBlank: true,
              formulae: [`"${yesNoOptions}"`],
              showErrorMessage: true,
              errorTitle: tEmp("bulkUpload.excel.invalidValue"),
              error: tEmp("bulkUpload.excel.pleaseSelectYesOrNo", {
                yes: t("yes"),
                no: t("no"),
              }),
              showInputMessage: true,
              promptTitle: tEmp("bulkUpload.excel.selectValue"),
              prompt: tEmp("bulkUpload.excel.selectYesOrNo", {
                yes: t("yes"),
                no: t("no"),
              }),
            };
          }
        }
      });
    },
    [branches, jobs, t, tGender, tEmp],
  );

  const downloadSuccessfulEmployeesExcel = useCallback(async () => {
    try {
      const data = getValues();
      const successfulEmployees = data.employees.filter(
        (emp: any) => emp?.status === "success",
      );

      if (successfulEmployees.length === 0) {
        toast({
          title: tEmp("bulkUpload.toast.noRecords"),
          description: tEmp("bulkUpload.toast.noSuccessRecords"),
          variant: "destructive",
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(
        tEmp("bulkUpload.excel.successSheetName"),
      );

      const headers =
        activeMode === "create"
          ? getCreateModeHeaders()
          : [
              tEmp("bulkUpload.fields.documentNumber"),
              ...selectedUpdateFields.map((field) =>
                tEmp(`bulkUpload.fields.${field}` as any),
              ),
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

      successfulEmployees.forEach((employee: any) => {
        if (activeMode === "create") {
          worksheet.addRow([
            employee.firstName || "",
            employee.lastName || "",
            employee.secondLastName || "",
            employee.documentType || "",
            employee.documentNumber || "",
            employee.address || "",
            employee.personalEmail || "",
            employee.personalPhone || "",
            formatGender(employee.gender),
            employee.birthDate || "",
            employee.code || "",
            employee.workEmail || "",
            employee.workPhone || "",
            employee.startDate || "",
            employee.endDate || "",
            formatBooleanToYesNo(employee.isIndefiniteTerm),
            employee.contractedHours || "",
            getBranchNameById(employee.branchId),
            getJobNameById(employee.jobId),
            employee.integrationCode || "",
            formatBooleanToYesNo(employee.canCheckInOtherBranch),
            formatBooleanToYesNo(employee.canCheckAnywhere),
            formatBooleanToYesNo(employee.canCheckFromAnyBranch),
            formatBooleanToYesNo(employee.canCheckFromWeb),
          ]);
        } else {
          const row: any[] = [employee.documentNumber || ""];
          selectedUpdateFields.forEach((field) => {
            const value = (employee as any)[field];
            if (field === "branchId") {
              row.push(getBranchNameById(value));
            } else if (field === "jobId") {
              row.push(getJobNameById(value));
            } else if (field === "gender") {
              row.push(formatGender(value));
            } else if (
              field === "isIndefiniteTerm" ||
              field.startsWith("can")
            ) {
              row.push(formatBooleanToYesNo(value));
            } else {
              row.push(value || "");
            }
          });
          worksheet.addRow(row);
        }
      });

      worksheet.columns.forEach((col) => {
        col.width = 20;
      });

      if (activeMode === "create") {
        addValidationsCreateMode(worksheet, false);
      } else {
        addValidationsUpdateMode(worksheet, selectedUpdateFields, false);
      }

      addReferenceSheet(workbook);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = tEmp("bulkUpload.excel.successFileName", {
        date: DateTime.now().toFormat("yyyyMMdd_HHmmss"),
      });
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando Excel de éxitos:", error);
      toast({
        title: tEmp("bulkUpload.toast.error"),
        description: tEmp("bulkUpload.toast.successExcelError"),
        variant: "destructive",
      });
    }
  }, [
    getValues,
    activeMode,
    selectedUpdateFields,
    formatBooleanToYesNo,
    formatGender,
    getBranchNameById,
    getJobNameById,
    addValidationsCreateMode,
    addValidationsUpdateMode,
    addReferenceSheet,
    toast,
    tEmp,
    getCreateModeHeaders,
  ]);

  const downloadErrorEmployeesExcel = useCallback(async () => {
    try {
      const data = getValues();
      const errorEmployees = data.employees.filter(
        (emp: any) => emp?.status === "error",
      );

      if (errorEmployees.length === 0) {
        toast({
          title: tEmp("bulkUpload.toast.noRecords"),
          description: tEmp("bulkUpload.toast.noErrorRecords"),
          variant: "destructive",
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(
        tEmp("bulkUpload.excel.errorsSheetName"),
      );

      const headers =
        activeMode === "create"
          ? [...getCreateModeHeaders(), tEmp("bulkUpload.table.columnError")]
          : [
              tEmp("bulkUpload.fields.documentNumber"),
              ...selectedUpdateFields.map((field) =>
                tEmp(`bulkUpload.fields.${field}` as any),
              ),
              tEmp("bulkUpload.table.columnError"),
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

        if (cell.value === tEmp("bulkUpload.table.columnError")) {
          cell.note = tEmp("bulkUpload.excel.errorColumnNote");
        }
      });

      errorEmployees.forEach((employee: any) => {
        if (activeMode === "create") {
          worksheet.addRow([
            employee.firstName || "",
            employee.lastName || "",
            employee.secondLastName || "",
            employee.documentType || "",
            employee.documentNumber || "",
            employee.address || "",
            employee.personalEmail || "",
            employee.personalPhone || "",
            formatGender(employee.gender),
            employee.birthDate || "",
            employee.code || "",
            employee.workEmail || "",
            employee.workPhone || "",
            employee.startDate || "",
            employee.endDate || "",
            formatBooleanToYesNo(employee.isIndefiniteTerm),
            employee.contractedHours || "",
            getBranchNameById(employee.branchId),
            getJobNameById(employee.jobId),
            employee.integrationCode || "",
            formatBooleanToYesNo(employee.canCheckInOtherBranch),
            formatBooleanToYesNo(employee.canCheckAnywhere),
            formatBooleanToYesNo(employee.canCheckFromAnyBranch),
            formatBooleanToYesNo(employee.canCheckFromWeb),
            employee.error || "",
          ]);
        } else {
          const row: any[] = [employee.documentNumber || ""];
          selectedUpdateFields.forEach((field) => {
            const value = (employee as any)[field];
            if (field === "branchId") {
              row.push(getBranchNameById(value));
            } else if (field === "jobId") {
              row.push(getJobNameById(value));
            } else if (field === "gender") {
              row.push(formatGender(value));
            } else if (
              field === "isIndefiniteTerm" ||
              field.startsWith("can")
            ) {
              row.push(formatBooleanToYesNo(value));
            } else {
              row.push(value || "");
            }
          });
          row.push(employee.error || "");
          worksheet.addRow(row);
        }
      });

      worksheet.columns.forEach((col) => {
        col.width = 20;
      });

      if (activeMode === "create") {
        addValidationsCreateMode(worksheet, false);
      } else {
        addValidationsUpdateMode(worksheet, selectedUpdateFields, false);
      }

      addReferenceSheet(workbook);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = tEmp("bulkUpload.excel.errorsFileName", {
        date: DateTime.now().toFormat("yyyyMMdd_HHmmss"),
      });
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando Excel de errores:", error);
      toast({
        title: tEmp("bulkUpload.toast.error"),
        description: tEmp("bulkUpload.toast.errorExcelError"),
        variant: "destructive",
      });
    }
  }, [
    getValues,
    activeMode,
    selectedUpdateFields,
    formatBooleanToYesNo,
    formatGender,
    getBranchNameById,
    getJobNameById,
    addValidationsCreateMode,
    addValidationsUpdateMode,
    addReferenceSheet,
    toast,
    tEmp,
    getCreateModeHeaders,
  ]);

  const handleAddRow = useCallback(() => {
    if (activeMode === "create") {
      append({
        firstName: "",
        lastName: "",
        secondLastName: "",
        address: "",
        personalEmail: "",
        personalPhone: "",
        gender: "",
        birthDate: "",
        documentType: "RUT",
        documentNumber: "",
        code: "",
        workEmail: "",
        workPhone: "",
        startDate: "",
        endDate: "",
        contractedHours: 45,
        branchId: "",
        jobId: "",
        integrationCode: "",
        isIndefiniteTerm: false,
        canCheckInOtherBranch: false,
        requiresPassword: true,
        canCheckWithoutShift: true,
        canCheckAnywhere: false,
        canCheckFromAnyBranch: false,
        canCheckFromWeb: false,
        isActive: true,
        status: "pending",
      } as EmployeeFormDataWithStatus);
    } else {
      append({
        documentNumber: "",
        status: "pending",
      } as EmployeeFormDataWithStatus);
    }
  }, [activeMode, append]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <p className="text-gray-700 flex items-center gap-3 text-lg">
          <AlertCircle className="text-blue-500 h-5 w-5" />
          {tEmp("bulkUpload.intro")}
        </p>
      </div>

      <CHEKIOTabs>
        <CHEKIOTab
          type="button"
          active={activeMode === "create"}
          onClick={() => {
            setActiveMode("create");
            reset({ employees: [], companyId: companyId || "" });
            setIsComplete(false);
          }}
        >
          {tEmp("bulkUpload.tabs.create")}
        </CHEKIOTab>
        <CHEKIOTab
          type="button"
          active={activeMode === "update"}
          onClick={() => {
            setActiveMode("update");
            reset({ employees: [], companyId: companyId || "" });
            setIsComplete(false);
          }}
        >
          {tEmp("bulkUpload.tabs.update")}
        </CHEKIOTab>
      </CHEKIOTabs>

      {processing && (
        <div className="mb-4 mt-4">
          <CHEKIOProgressBar
            current={Math.round(uploadProgress)}
            total={100}
            text={tEmp("bulkUpload.processingLabel", {
              percent: Math.round(uploadProgress),
            })}
          />
        </div>
      )}

      <EmployeeBulkUploadTable
        mode={activeMode}
        control={control}
        errors={errors}
        watch={watch}
        setValue={setValue}
        getValues={getValues}
        reset={reset}
        processing={processing}
        isComplete={isComplete}
        selectedUpdateFields={selectedUpdateFields}
        setSelectedUpdateFields={setSelectedUpdateFields}
        jobs={jobs?.data || []}
        branches={branches?.data || []}
        companyId={companyId || ""}
        fields={fields}
        append={append}
        replace={replace}
        remove={remove}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadTemplate={
          activeMode === "create"
            ? downloadCreateTemplate
            : downloadUpdateTemplate
        }
        onExcelUpload={
          activeMode === "create"
            ? handleExcelUploadCreate
            : handleExcelUploadUpdate
        }
        onProcess={
          activeMode === "create" ? handleProcessCreate : handleProcessUpdate
        }
        onRetryFailed={handleRetryFailed}
        onAddRow={handleAddRow}
        onClose={onSuccess}
        onDownloadSuccessfulExcel={downloadSuccessfulEmployeesExcel}
        onDownloadErrorExcel={downloadErrorEmployeesExcel}
      />
    </div>
  );
}
