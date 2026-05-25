"use client";

import {
  CHEKIOButton,
  CHEKIOProgressBar,
  CHEKIOTab,
  CHEKIOTabs,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import type { StudentCreateDto } from "@/dto/students/student-create-update.dto";
import { useToast } from "@/hooks/use-toast";
import { Link } from "@/i18n/navigation";
import {
  documentValidators,
  formatDocumentType,
  cn,
} from "@/lib/utils";
import {
  useBulkCreateStudents,
  useGetBranches,
} from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import ExcelJS from "exceljs";
import { ChevronLeft, Download, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import {
  DocumentType,
  DocumentTypeOptions,
  Gender,
  GenderOptions,
} from "./student.dto";
import {
  StudentsBulkUploadTable,
  type BulkBucket,
  type BulkRow,
} from "./StudentsBulkUploadTable";

interface StudentBulkUploadProps {
  onSuccess: () => void;
}

type BulkStudentResult =
  | { index: number; status: "success"; publicId: string }
  | { index: number; status: "error"; error: string };

const HEADER_KEYS = [
  "code",
  "firstName",
  "lastName",
  "secondLastName",
  "documentType",
  "documentNumber",
  "personalEmail",
  "personalPhone",
  "birthDate",
  "gender",
  "branchCode",
] as const;

const BATCH_SIZE = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function rawCellValue(cellValue: unknown): unknown {
  if (cellValue == null) return null;
  if (typeof cellValue === "object" && cellValue !== null) {
    if ("text" in cellValue && typeof (cellValue as { text: string }).text === "string") {
      return (cellValue as { text: string }).text;
    }
    if ("result" in cellValue) {
      return (cellValue as { result: unknown }).result;
    }
  }
  return cellValue;
}

function formatYyyyMmDdUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatYyyyMmDdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function excelSerialToYyyyMmDd(serial: number): string {
  const utcMs = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(utcMs);
  if (Number.isNaN(d.getTime())) return "";
  return formatYyyyMmDdUtc(d);
}

function cellToString(raw: unknown, key: string): string {
  if (raw == null || raw === "") return "";
  if (raw instanceof Date) {
    if (key === "birthDate") return formatYyyyMmDdLocal(raw);
    return raw.toISOString();
  }
  if (typeof raw === "number" && key === "birthDate") {
    if (raw > 200 && raw < 100000) {
      const fromSerial = excelSerialToYyyyMmDd(raw);
      if (fromSerial) return fromSerial;
    }
    return String(raw);
  }
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "boolean") return raw ? "true" : "false";
  return String(raw).trim();
}

function normalizeDocumentType(raw: string): DocumentType | null {
  const t = raw.trim();
  if (!t) return null;
  const upper = t.toUpperCase().replace(/\./g, "").replace(/\s+/g, "");
  if ((Object.values(DocumentType) as string[]).includes(upper)) {
    return upper as DocumentType;
  }
  const lower = t.trim().toLowerCase();
  for (const opt of DocumentTypeOptions) {
    if (opt.value.toLowerCase() === lower) return opt.value;
    if (opt.label.toLowerCase() === lower) return opt.value;
  }
  return null;
}

function normalizeGender(raw: string): Gender | null {
  const t = raw.trim();
  if (!t) return null;
  const upper = t.toUpperCase();
  if ((Object.values(Gender) as string[]).includes(upper)) {
    return upper as Gender;
  }
  const lower = t.trim().toLowerCase();
  for (const opt of GenderOptions) {
    if (opt.value.toLowerCase() === lower) return opt.value;
    if (opt.label.toLowerCase() === lower) return opt.value;
  }
  if (upper === "M" || lower === "masculino") return Gender.MALE;
  if (upper === "F" || lower === "femenino") return Gender.FEMALE;
  return null;
}

function parseBirthDateForApi(raw: string):
  | { ok: true; value: string }
  | { ok: false } {
  const t = raw.trim();
  if (!t) return { ok: false };
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return { ok: true, value: t };
  const parsed = new Date(t);
  if (!Number.isNaN(parsed.getTime())) {
    return { ok: true, value: formatYyyyMmDdLocal(parsed) };
  }
  const n = Number(t);
  if (!Number.isNaN(n) && n > 200 && n < 100000) {
    const iso = excelSerialToYyyyMmDd(n);
    if (iso) return { ok: true, value: iso };
  }
  return { ok: false };
}

function extractApiError(err: unknown, fallback: string): string {
  const e = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m.join(", ");
  if (typeof m === "string") return m;
  return e?.message ?? fallback;
}

function formatAndValidateDocument(
  docType: DocumentType,
  rawDocNumber: string,
): { formatted: string; valid: boolean } {
  if (!(docType in formatDocumentType) || !(docType in documentValidators)) {
    return { formatted: rawDocNumber.trim(), valid: true };
  }
  const key = docType as keyof typeof formatDocumentType;
  const formatted = formatDocumentType[key](rawDocNumber);
  const valid = documentValidators[key](formatted);
  return { formatted, valid };
}

export default function StudentBulkUpload({ onSuccess }: StudentBulkUploadProps) {
  const t = useTranslations("mantainers.students");
  const { companyId } = useCookieSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<BulkRow[]>([]);
  const [activeTab, setActiveTab] = useState<BulkBucket>("validated");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [processTotal, setProcessTotal] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: branchesData } = useGetBranches(
    { companyId: companyId ?? "", pageSize: 500, page: 1, sort: "asc" },
    { enabled: !!companyId },
  );

  const { mutateAsync: bulkCreateStudents } = useBulkCreateStudents();

  const counts = useMemo(
    () => ({
      validated: rows.filter((r) => r.bucket === "validated").length,
      errors: rows.filter((r) => r.bucket === "errors").length,
      loaded: rows.filter((r) => r.bucket === "loaded").length,
    }),
    [rows],
  );

  const pendingValidatedCount = useMemo(
    () =>
      rows.filter((r) => r.bucket === "validated" && r.status === "pending")
        .length,
    [rows],
  );

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(t("bulkUpload.templateSheetName"));

    sheet.addRow([
      t("bulkUpload.columns.code"),
      t("bulkUpload.columns.firstName"),
      t("bulkUpload.columns.lastName"),
      t("bulkUpload.columns.secondLastName"),
      t("bulkUpload.columns.documentType"),
      t("bulkUpload.columns.documentNumber"),
      t("bulkUpload.columns.personalEmail"),
      t("bulkUpload.columns.personalPhone"),
      t("bulkUpload.columns.birthDate"),
      t("bulkUpload.columns.gender"),
      t("bulkUpload.columns.branchCode"),
    ]);
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD6EAF8" },
      };
    });

    sheet.addRow([
      "MAT-001",
      "Juan",
      "Pérez",
      "García",
      "RUT",
      "12345678-9",
      "juan.perez@example.com",
      "+56912345678",
      "2000-01-15",
      "MALE",
      "SEDE-001",
    ]);

    sheet.columns.forEach((col) => {
      col.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = t("bulkUpload.templateFileName");
    a.click();
    URL.revokeObjectURL(url);
  };

  const validateAndBuildRow = (
    excelRow: number,
    obj: Record<(typeof HEADER_KEYS)[number], string>,
    branches: NonNullable<typeof branchesData>["data"],
  ): BulkRow => {
    const errors: string[] = [];
    const branch = branches.find(
      (b) =>
        b.code?.toLowerCase() === obj.branchCode?.toLowerCase() ||
        b.name?.toLowerCase() === obj.branchCode?.toLowerCase(),
    );
    const branchId = branch?.publicId;
    const branchLabel = branch?.name ?? `${obj.branchCode} ${t("bulkUpload.branchNotFoundSuffix")}`;

    const code = obj.code?.trim() ?? "";
    const firstName = obj.firstName?.trim() ?? "";
    const lastName = obj.lastName?.trim() ?? "";
    const secondLastName = obj.secondLastName?.trim() || undefined;
    const rawDocType = obj.documentType?.trim() ?? "";
    const rawDocNumber = obj.documentNumber?.trim() ?? "";
    const personalEmail = obj.personalEmail?.trim() ?? "";
    const personalPhone = obj.personalPhone?.trim() ?? "";
    const birthRaw = obj.birthDate?.trim() ?? "";
    const rawGender = obj.gender?.trim() ?? "";
    const branchCode = obj.branchCode?.trim() ?? "";

    if (!code) {
      errors.push(
        t("bulkUpload.errors.requiredField", {
          field: t("bulkUpload.columns.code"),
        }),
      );
    }
    if (!firstName) {
      errors.push(
        t("bulkUpload.errors.requiredField", {
          field: t("bulkUpload.columns.firstName"),
        }),
      );
    }
    if (!lastName) {
      errors.push(
        t("bulkUpload.errors.requiredField", {
          field: t("bulkUpload.columns.lastName"),
        }),
      );
    }

    const docType = normalizeDocumentType(rawDocType);
    let documentNumber = rawDocNumber;
    let documentTypeDisplay = rawDocType || "—";

    if (!docType) {
      if (rawDocType) {
        errors.push(
          t("bulkUpload.errors.invalidDocumentType", { value: rawDocType }),
        );
      } else {
        errors.push(
          t("bulkUpload.errors.requiredField", {
            field: t("bulkUpload.columns.documentType"),
          }),
        );
      }
    } else {
      documentTypeDisplay = docType;
      if (!rawDocNumber) {
        errors.push(
          t("bulkUpload.errors.requiredField", {
            field: t("bulkUpload.columns.documentNumber"),
          }),
        );
      } else {
        const { formatted, valid } = formatAndValidateDocument(
          docType,
          rawDocNumber,
        );
        documentNumber = formatted;
        if (!valid) {
          errors.push(
            t("bulkUpload.errors.invalidDocumentNumber", {
              type: docType,
              value: formatted || rawDocNumber,
            }),
          );
        }
      }
    }

    if (!personalEmail) {
      errors.push(
        t("bulkUpload.errors.requiredField", {
          field: t("bulkUpload.columns.personalEmail"),
        }),
      );
    } else if (!EMAIL_RE.test(personalEmail)) {
      errors.push(
        t("bulkUpload.errors.invalidEmail", { value: personalEmail }),
      );
    }

    if (!personalPhone) {
      errors.push(
        t("bulkUpload.errors.requiredField", {
          field: t("bulkUpload.columns.personalPhone"),
        }),
      );
    }

    const gender = normalizeGender(rawGender);
    if (!gender) {
      if (rawGender) {
        errors.push(
          t("bulkUpload.errors.invalidGender", { value: rawGender }),
        );
      } else {
        errors.push(
          t("bulkUpload.errors.requiredField", {
            field: t("bulkUpload.columns.gender"),
          }),
        );
      }
    }

    const birthParsed = parseBirthDateForApi(birthRaw);
    if (!birthParsed.ok) {
      errors.push(
        t("bulkUpload.errors.invalidBirthDate", {
          value: birthRaw || "—",
        }),
      );
    }

    if (!branchCode) {
      errors.push(
        t("bulkUpload.errors.requiredField", {
          field: t("bulkUpload.columns.branchCode"),
        }),
      );
    } else if (!branchId) {
      errors.push(
        t("bulkUpload.errors.branchNotFound", { code: branchCode }),
      );
    }

    const bucket: BulkBucket = errors.length > 0 ? "errors" : "validated";

    return {
      id: crypto.randomUUID(),
      excelRow,
      code,
      firstName,
      lastName,
      secondLastName,
      documentType: documentTypeDisplay,
      documentNumber,
      personalEmail,
      personalPhone,
      birthDate: birthParsed.ok ? birthParsed.value : birthRaw,
      gender: (gender ?? rawGender) || "—",
      branchCode,
      branchId,
      branchLabel,
      bucket,
      status: "pending",
      errors,
    };
  };

  const parseWorkbook = async (file: File) => {
    setFileName(file.name);
    const branches = branchesData?.data ?? [];

    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];

    const parsed: BulkRow[] = [];
    sheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;

      const obj = {} as Record<(typeof HEADER_KEYS)[number], string>;
      HEADER_KEYS.forEach((key, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        obj[key] = cellToString(rawCellValue(cell.value), key);
      });

      const hasData = HEADER_KEYS.some((key) => obj[key].trim() !== "");
      if (!hasData) return;

      parsed.push(validateAndBuildRow(rowIndex, obj, branches));
    });

    setRows(parsed);
    setProcessed(0);
    setProcessTotal(0);
    setActiveTab(parsed.some((r) => r.bucket === "errors") ? "errors" : "validated");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
      toast({
        title: t("toast.error.title"),
        description: t("bulkUpload.dropzone.hint"),
      });
      return;
    }
    try {
      await parseWorkbook(file);
    } catch {
      toast({
        title: t("toast.error.title"),
        description: t("toast.error.description"),
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    await handleFile(file);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const rowToDto = (row: BulkRow): StudentCreateDto | null => {
    const docType = normalizeDocumentType(row.documentType);
    const gender = normalizeGender(row.gender);
    const birthParsed = parseBirthDateForApi(row.birthDate);
    if (!companyId || !row.branchId || !docType || !gender || !birthParsed.ok) {
      return null;
    }
    return {
      companyId,
      code: row.code.trim(),
      firstName: row.firstName.trim(),
      lastName: row.lastName.trim(),
      secondLastName: row.secondLastName?.trim() || undefined,
      documentType: docType,
      documentNumber: row.documentNumber.trim(),
      personalEmail: row.personalEmail.trim(),
      personalPhone: row.personalPhone.trim(),
      birthDate: birthParsed.value,
      gender,
      branchId: row.branchId,
    };
  };

  const processRows = async () => {
    if (!companyId) return;

    const toProcess = rows.filter(
      (r) => r.bucket === "validated" && r.status === "pending",
    );
    if (toProcess.length === 0) return;

    setIsProcessing(true);
    setProcessed(0);
    setProcessTotal(toProcess.length);

    let errorsBucketCount = rows.filter((r) => r.bucket === "errors").length;
    let apiRelatedFailures = 0;
    let successLoaded = 0;

    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
      const chunk = toProcess.slice(i, i + BATCH_SIZE);
      const chunkIds = new Set(chunk.map((c) => c.id));

      setRows((prev) =>
        prev.map((r) =>
          chunkIds.has(r.id) ? { ...r, status: "processing" as const } : r,
        ),
      );

      const dtos: StudentCreateDto[] = [];
      const dtoRowIds: string[] = [];

      for (const row of chunk) {
        const dto = rowToDto(row);
        if (!dto) {
          errorsBucketCount++;
          apiRelatedFailures++;
          setRows((prev) =>
            prev.map((r) =>
              r.id === row.id
                ? {
                    ...r,
                    bucket: "errors",
                    status: "pending",
                    errors: [t("bulkUpload.errors.createFailed")],
                  }
                : r,
            ),
          );
          setProcessed((p) => p + 1);
          continue;
        }
        dtos.push(dto);
        dtoRowIds.push(row.id);
      }

      if (dtos.length > 0) {
        try {
          const results = (await bulkCreateStudents(
            dtos,
          )) as BulkStudentResult[];

          setRows((prev) => {
            const next = [...prev];
            for (let j = 0; j < results.length; j++) {
              const id = dtoRowIds[j];
              const r = results[j];
              const idx = next.findIndex((x) => x.id === id);
              if (idx === -1) continue;

              if (r.status === "success") {
                successLoaded++;
                next[idx] = {
                  ...next[idx],
                  bucket: "loaded",
                  status: "success",
                  errors: [],
                };
              } else {
                errorsBucketCount++;
                apiRelatedFailures++;
                const msg =
                  typeof r.error === "string"
                    ? r.error
                    : t("bulkUpload.errors.createFailed");
                next[idx] = {
                  ...next[idx],
                  bucket: "errors",
                  status: "pending",
                  errors: [t("bulkUpload.errors.apiError", { msg })],
                };
              }
            }
            return next;
          });
        } catch (err: unknown) {
          const msg = extractApiError(err, t("bulkUpload.errors.createFailed"));
          errorsBucketCount += dtoRowIds.length;
          apiRelatedFailures += dtoRowIds.length;
          setRows((prev) =>
            prev.map((r) =>
              dtoRowIds.includes(r.id)
                ? {
                    ...r,
                    bucket: "errors",
                    status: "pending",
                    errors: [t("bulkUpload.errors.apiError", { msg })],
                  }
                : r,
            ),
          );
        }

        setProcessed((p) => p + dtoRowIds.length);
      }
    }

    setIsProcessing(false);
    queryClient.invalidateQueries({ queryKey: ["GetStudents"] });

    if (errorsBucketCount > 0) {
      setActiveTab("errors");
    }
    if (apiRelatedFailures > 0) {
      toast({
        title: t("bulkUpload.toast.partialTitle", {
          success: successLoaded,
          errors: apiRelatedFailures,
        }),
        description: t("bulkUpload.toast.partialDescription"),
      });
    }

    if (errorsBucketCount === 0) {
      onSuccess();
    }
  };

  return (
    <div className="w-full min-h-screen p-3 sm:p-4 lg:p-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 w-full space-y-6">
        <div>
          <Link
            href="/mantainers/students"
            className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 hover:underline mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("bulkUpload.back")}
          </Link>
          <h2 className="text-base font-semibold text-gray-900">
            {t("bulkUpload.title")}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{t("bulkUpload.subtitle")}</p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 justify-end w-full">
          <CHEKIOButton
            variant="secondaryBlue"
            className="flex items-center justify-center gap-1.5"
            onClick={downloadTemplate}
          >
            <Download className="h-4 w-4 shrink-0" />
            <span className="text-sm whitespace-nowrap">
              {t("bulkUpload.downloadTemplate")}
            </span>
          </CHEKIOButton>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
          aria-hidden
        />

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400",
            isProcessing && "pointer-events-none opacity-60",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            const f = e.dataTransfer.files?.[0];
            void handleFile(f);
          }}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-700">
            {t("bulkUpload.dropzone.primary")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {t("bulkUpload.dropzone.hint")}
          </p>
        </div>

        {fileName && (
          <p className="text-sm text-gray-600">
            {t("bulkUpload.fileInfo", { fileName, count: rows.length })}
          </p>
        )}

        {rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <CHEKIOButton
              variant="primary"
              className="flex items-center justify-center gap-1.5"
              onClick={() => void processRows()}
              disabled={
                isProcessing || pendingValidatedCount === 0 || !companyId
              }
            >
              <span className="text-sm whitespace-nowrap">
                {isProcessing
                  ? t("buttons.processingLabel")
                  : t("buttons.process")}
              </span>
            </CHEKIOButton>
          </div>
        )}

        {isProcessing && processTotal > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t("bulkUpload.progressLabel")}</span>
              <span>
                {processed} / {processTotal}
              </span>
            </div>
            <CHEKIOProgressBar current={processed} total={processTotal} />
          </div>
        )}

        {rows.length > 0 && (
          <div className="space-y-4">
            <CHEKIOTabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as BulkBucket)}
              variant="modern"
              className="w-full"
            >
              <CHEKIOTab
                value="validated"
                badge={counts.validated}
                badgeVariant="primary"
                label={t("bulkUpload.tabs.validated")}
              />
              <CHEKIOTab
                value="errors"
                badge={counts.errors}
                badgeVariant="danger"
                label={t("bulkUpload.tabs.errors")}
              />
              <CHEKIOTab
                value="loaded"
                badge={counts.loaded}
                badgeVariant="success"
                label={t("bulkUpload.tabs.loaded")}
              />
            </CHEKIOTabs>

            <StudentsBulkUploadTable
              rows={rows.filter((r) => r.bucket === activeTab)}
              variant={activeTab}
              onRemoveRow={
                activeTab === "loaded" ? undefined : removeRow
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
