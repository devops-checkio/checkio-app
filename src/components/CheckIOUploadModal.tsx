"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
  CHEKIOTab,
  CHEKIOTabs,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import {
  parseExcelFile,
  type FieldDefinition,
  type ValidationError,
} from "@/utils/excelParser";
import {
  generateExcelTemplate,
  type TemplateField,
} from "@/utils/excelTemplateGenerator";
import {
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ITEMS_PER_PAGE = 10;

export interface CheckIOUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entityName: string;
  fields: TemplateField[];
  fieldDefinitions: FieldDefinition[];
  onUpload: (data: Record<string, unknown>[]) => Promise<void>;
  extraContent?: React.ReactNode;
}

type RowStatus = "pending" | "processing" | "success" | "error";

interface RowState {
  id: number;
  data: Record<string, unknown>;
  status: RowStatus;
  error?: string;
}

type TabType = "valid" | "invalid" | "processed";

export function CheckIOUploadModal({
  isOpen,
  onClose,
  title,
  entityName,
  fields,
  fieldDefinitions,
  onUpload,
  extraContent,
}: CheckIOUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<{
    data: Record<string, unknown>[];
    errors: ValidationError[];
    isValid: boolean;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [rowsState, setRowsState] = useState<RowState[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("valid");
  const [currentPage, setCurrentPage] = useState(1);

  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      return "Tipo de archivo no válido. Se aceptan: xlsx, xls, csv.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `El archivo es demasiado grande. Máximo: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)} MB`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      const err = validateFile(selectedFile);
      if (err) {
        setUploadError(err);
        setParseResult(null);
        setFile(null);
        setRowsState([]);
        return;
      }
      setFile(selectedFile);
      setUploadError(null);
      try {
        const result = await parseExcelFile(selectedFile, fieldDefinitions);
        const formatErrors = result.errors.filter(
          (e) =>
            e.row === 0 ||
            (e.row === 1 && e.field === "Headers") ||
            e.field === "Archivo",
        );
        if (formatErrors.length > 0) {
          setUploadError(
            `Formato incorrecto. ${formatErrors.map((e) => e.message).join("; ")}`,
          );
          setParseResult(null);
          setFile(null);
          setRowsState([]);
          return;
        }
        setParseResult(result);
        setRowsState(
          result.data.map((data, index) => ({
            id: index + 2,
            data,
            status: "pending" as RowStatus,
          })),
        );
      } catch (e) {
        setUploadError(
          e instanceof Error ? e.message : "Error al procesar el archivo",
        );
        setParseResult(null);
        setFile(null);
        setRowsState([]);
      }
    },
    [fieldDefinitions, validateFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFileSelect(files[0]);
    },
    [handleFileSelect],
  );
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) handleFileSelect(files[0]);
    },
    [handleFileSelect],
  );

  const handleDownloadTemplate = useCallback(async () => {
    try {
      await generateExcelTemplate(fields, entityName);
    } catch (e) {
      setUploadError(
        e instanceof Error ? e.message : "Error al generar la plantilla",
      );
    }
  }, [fields, entityName]);

  const validRows = useMemo(
    () => rowsState.filter((r) => r.status === "pending"),
    [rowsState],
  );
  const invalidRows = useMemo(() => {
    if (!parseResult) return [];
    const byRow = new Map<number, ValidationError[]>();
    parseResult.errors.forEach((e) => {
      if (!byRow.has(e.row)) byRow.set(e.row, []);
      byRow.get(e.row)!.push(e);
    });
    return parseResult.data
      .map((data, index) => ({
        id: index + 2,
        data,
        errors: byRow.get(index + 2) ?? [],
      }))
      .filter((r) => r.errors.length > 0);
  }, [parseResult]);
  const processedRows = useMemo(
    () =>
      rowsState.filter(
        (r) => r.status === "success" || r.status === "error",
      ),
    [rowsState],
  );
  const hasErrors = rowsState.some((r) => r.status === "error");
  const failedRows = useMemo(
    () => rowsState.filter((r) => r.status === "error"),
    [rowsState],
  );

  const handleProcess = useCallback(async () => {
    if (validRows.length === 0) return;
    setProcessing(true);
    setIsComplete(false);
    for (const row of validRows) {
      setRowsState((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, status: "processing" as RowStatus } : r,
        ),
      );
      try {
        await onUpload([row.data]);
        setRowsState((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, status: "success" as RowStatus } : r,
          ),
        );
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Error al procesar el registro";
        setRowsState((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? { ...r, status: "error" as RowStatus, error: msg }
              : r,
          ),
        );
      }
    }
    setProcessing(false);
    setIsComplete(true);
    setActiveTab("processed");
  }, [validRows, onUpload]);

  const handleRetryFailed = useCallback(async () => {
    if (failedRows.length === 0) return;
    setProcessing(true);
    setIsComplete(false);
    for (const row of failedRows) {
      setRowsState((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, status: "processing" as RowStatus } : r,
        ),
      );
      try {
        await onUpload([row.data]);
        setRowsState((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, status: "success" as RowStatus } : r,
          ),
        );
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Error al procesar el registro";
        setRowsState((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? { ...r, status: "error" as RowStatus, error: msg }
              : r,
          ),
        );
      }
    }
    setProcessing(false);
    setIsComplete(true);
    setActiveTab("processed");
  }, [failedRows, onUpload]);

  const handleClose = useCallback(() => {
    setFile(null);
    setParseResult(null);
    setUploadError(null);
    setRowsState([]);
    setProcessing(false);
    setIsComplete(false);
    setActiveTab("valid");
    setCurrentPage(1);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setParseResult(null);
      setRowsState([]);
      setUploadError(null);
      setProcessing(false);
      setIsComplete(false);
      setActiveTab("valid");
      setCurrentPage(1);
    }
  }, [isOpen]);

  const displayRows =
    activeTab === "valid"
      ? validRows
      : activeTab === "invalid"
        ? invalidRows
        : processedRows;
  const totalPages = Math.max(
    1,
    Math.ceil(displayRows.length / ITEMS_PER_PAGE),
  );
  const paginatedRows = displayRows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (!isOpen) return null;

  return (
    <CHEKIOModal isOpen={isOpen} onClose={handleClose} title={title} size="6xl">
      <div className="space-y-4">
        {extraContent != null ? (
          <div className="pb-2 border-b border-gray-200">{extraContent}</div>
        ) : null}

        <div className="flex justify-end">
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Descargar plantilla
          </CHEKIOButton>
        </div>

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
          id="checkio-upload-file-input"
          disabled={processing}
        />
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
          } ${processing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() =>
            !processing &&
            document.getElementById("checkio-upload-file-input")?.click()
          }
        >
          <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            Arrastra un archivo aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Formatos: xlsx, xls, csv. Máx. 10 MB
          </p>
        </div>

        {uploadError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {uploadError}
          </div>
        )}

        {file && parseResult && (
          <>
            <CHEKIOTabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as TabType);
                setCurrentPage(1);
              }}
            >
              <CHEKIOTab value="valid">
                Válidas ({validRows.length})
              </CHEKIOTab>
              <CHEKIOTab value="invalid">
                Inválidas ({invalidRows.length})
              </CHEKIOTab>
              <CHEKIOTab value="processed">
                Procesadas ({processedRows.length})
              </CHEKIOTab>
            </CHEKIOTabs>

            <CHEKIOTable>
              <CHEKIOTableHeader>
                <tr>
                  {fieldDefinitions.map((f) => (
                    <CHEKIOTableHead key={f.key}>{f.label}</CHEKIOTableHead>
                  ))}
                  {activeTab === "processed" && (
                    <CHEKIOTableHead>Estado</CHEKIOTableHead>
                  )}
                  {activeTab === "invalid" && (
                    <CHEKIOTableHead>Errores</CHEKIOTableHead>
                  )}
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {paginatedRows.length === 0 ? (
                  <CHEKIOTableRow index={0}>
                    <CHEKIOTableCell
                      colSpan={
                        fieldDefinitions.length +
                        (activeTab === "processed" ? 1 : 0) +
                        (activeTab === "invalid" ? 1 : 0)
                      }
                      className="text-center text-gray-500 py-6"
                    >
                      No hay filas
                    </CHEKIOTableCell>
                  </CHEKIOTableRow>
                ) : (
                  paginatedRows.map((row, idx) => {
                    const rowData =
                      "data" in row
                        ? (row as RowState | { data: Record<string, unknown> })
                            .data
                        : {};
                    return (
                      <CHEKIOTableRow key={"id" in row ? row.id : idx} index={idx}>
                        {fieldDefinitions.map((f) => (
                          <CHEKIOTableCell key={f.key}>
                            {String(rowData[f.key] ?? "-")}
                          </CHEKIOTableCell>
                        ))}
                        {activeTab === "processed" && "status" in row && (
                          <CHEKIOTableCell>
                            {(row as RowState).status === "success" ? (
                              <span className="flex items-center gap-1 text-green-700">
                                <CheckCircle2 className="h-4 w-4" />
                                Éxito
                              </span>
                            ) : (row as RowState).status === "error" ? (
                              <span
                                className="flex items-center gap-1 text-red-700"
                                title={(row as RowState).error}
                              >
                                <XCircle className="h-4 w-4" />
                                Error
                              </span>
                            ) : (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </CHEKIOTableCell>
                        )}
                        {activeTab === "invalid" && "errors" in row && (
                          <CHEKIOTableCell>
                            <span className="text-red-600 text-xs">
                              {(row as { errors: ValidationError[] }).errors
                                .map((e) => e.message)
                                .join("; ")}
                            </span>
                          </CHEKIOTableCell>
                        )}
                      </CHEKIOTableRow>
                    );
                  })
                )}
              </CHEKIOTableBody>
            </CHEKIOTable>

            {displayRows.length > ITEMS_PER_PAGE && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <CHEKIOButton
                    variant="secondaryBlue"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    Anterior
                  </CHEKIOButton>
                  <CHEKIOButton
                    variant="secondaryBlue"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage >= totalPages}
                  >
                    Siguiente
                  </CHEKIOButton>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={handleClose}
                disabled={processing}
              >
                {isComplete ? "Cerrar" : "Cancelar"}
              </CHEKIOButton>
              {isComplete && hasErrors && (
                <CHEKIOButton
                  variant="primary"
                  onClick={handleRetryFailed}
                  disabled={processing}
                  className="flex items-center gap-2"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Reintentar fallidos
                </CHEKIOButton>
              )}
              {!isComplete && validRows.length > 0 && (
                <CHEKIOButton
                  variant="primary"
                  onClick={handleProcess}
                  disabled={processing}
                  className="flex items-center gap-2"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Procesar
                </CHEKIOButton>
              )}
            </div>
          </>
        )}
      </div>
    </CHEKIOModal>
  );
}
