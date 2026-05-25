"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { useToast } from "@/hooks/use-toast";
import { useGetEmployees, useGetEstablishments } from "@/service/mantainer.service";
import {
  useBulkAssignStudentSchedules,
  useGetSchedules,
} from "@/service/schedule.service";
import { PersonType } from "@/app/[locale]/mantainers/schedules/_components/schedule.dto";
import { cn } from "@/lib/utils";
import ExcelJS from "exceljs";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Table2,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";

type ParsedRow = {
  rowNumber: number;
  date: string;
  apiDate?: string;
  /** Valor del Excel: número de matrícula (mismo campo `code` del estudiante en sistema). */
  matricula: string;
  scheduleCode: string;
  establishmentCode?: string;
  employeeId?: string;
  scheduleId?: string;
  establishmentId?: string;
  error?: string;
};

type PendingConflictResolution = {
  matriculas: string[];
  message: string;
};

type Interval = { start: number; end: number };

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/** Plantilla nueva: matrícula. Se acepta también la columna legacy `codigoEstudiante` al parsear. */
const TEMPLATE_HEADERS = [
  "fecha",
  "numeroMatricula",
  "codigoHorario",
  "codigoEstablecimiento",
] as const;

function normalizeHeaderToken(value: unknown): string {
  return normalizeCell(value).toLowerCase().replace(/\s+/g, "");
}

const STUDENT_ID_HEADER_ALIASES = new Set([
  "numeromatricula",
  "numerodematricula",
  "matricula",
  "nromatricula",
  "codigoestudiante",
  "employeecode",
  "enrollmentnumber",
  "studentcode",
]);

function normalizeCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object" && value !== null) {
    if ("text" in value && typeof (value as { text: string }).text === "string") {
      return (value as { text: string }).text.trim();
    }
  }
  return String(value).trim();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function dateToIsoLocal(date: Date): string {
  // Usar UTC evita corrimientos por zona horaria al leer fechas desde Excel.
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function isoToDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function getTodayIsoLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function excelSerialToDate(serial: number): Date | null {
  const utcMs = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(utcMs);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parseDateCellToDisplayAndIso(raw: unknown): { display: string; iso: string | null } {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const iso = dateToIsoLocal(raw);
    return { display: isoToDisplay(iso), iso };
  }

  if (typeof raw === "number") {
    const parsed = excelSerialToDate(raw);
    if (parsed) {
      const iso = dateToIsoLocal(parsed);
      return { display: isoToDisplay(iso), iso };
    }
  }

  const text = normalizeCell(raw);
  const iso = parseDateToIso(text);
  if (iso) return { display: isoToDisplay(iso), iso };
  return { display: text, iso: null };
}

function parseDateToIso(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  // Acepta formato ISO ya válido
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // Acepta dd/mm/yyyy o dd-mm-yyyy
  const match = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

function getScheduleIntervals(schedule: any): Interval[] {
  if (!schedule?.startTime) return [];
  const raw = String(schedule.startTime);
  const match = raw.match(/(\d{2}):(\d{2})/);
  if (!match) return [];

  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m)) return [];

  const start = h * 60 + m;
  const duration =
    Number(schedule.workHours ?? 0) * 60 + Number(schedule.workMinutes ?? 0);
  if (duration <= 0) return [];

  const end = start + duration;
  if (end <= 1440) return [{ start, end }];

  // Horario cruza medianoche
  return [
    { start, end: 1440 },
    { start: 0, end: end - 1440 },
  ];
}

function intervalsOverlap(a: Interval[], b: Interval[]): boolean {
  return a.some((ai) => b.some((bi) => ai.start < bi.end && bi.start < ai.end));
}

const OVERLAP_ERROR_PREFIX = "Traslape en archivo con horario ";
const ASSIGNED_OVERLAP_TOKEN = "traslape con horario ya asignado";

function removeOverlapErrors(error?: string): string | undefined {
  if (!error) return undefined;
  const kept = error
    .split(";")
    .map((x) => x.trim())
    .filter((x) => x.length > 0 && !x.startsWith(OVERLAP_ERROR_PREFIX));
  return kept.length > 0 ? kept.join("; ") : undefined;
}

function hasAssignedOverlapError(error?: string): boolean {
  if (!error) return false;
  return error.toLowerCase().includes(ASSIGNED_OVERLAP_TOKEN);
}

export default function StudentScheduleBulkUploadModal({ isOpen, onClose }: Props) {
  const locale = useLocale();
  const { companyId, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const primary = templateUser.primary ?? "#2563eb";
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingConflictResolution, setPendingConflictResolution] =
    useState<PendingConflictResolution | null>(null);

  const { data: employeesData } = useGetEmployees(
    {
      page: 1,
      pageSize: 1000,
      sort: "asc",
      companyId: companyId || "",
      personType: "STUDENT",
      status: "active",
    },
    { enabled: !!companyId && isOpen },
  );

  const { data: schedulesData } = useGetSchedules(
    {
      page: 1,
      pageSize: 1000,
      sort: "asc",
      isActive: true,
      personType: PersonType.STUDENT,
    },
    {
      companyIds: companyId ? [companyId] : undefined,
    },
    { enabled: !!companyId && isOpen },
  );

  const { data: establishmentsData } = useGetEstablishments(
    {
      page: 1,
      pageSize: 1000,
      sort: "asc",
      companyId: companyId || "",
    },
    { enabled: !!companyId && isOpen },
  );

  const bulkAssign = useBulkAssignStudentSchedules();

  const validRows = useMemo(() => rows.filter((r) => !r.error), [rows]);
  const invalidRows = useMemo(() => rows.filter((r) => !!r.error), [rows]);

  const revalidateOverlapErrors = (inputRows: ParsedRow[]): ParsedRow[] => {
    const nextRows = inputRows.map((row) => ({
      ...row,
      error: removeOverlapErrors(row.error),
    }));

    const schedulesByPublicId = new Map<string, any>(
      (schedulesData?.data ?? [])
        .filter((s: any) => !!s?.publicId)
        .map((s: any) => [s.publicId, s]),
    );

    const groupMap = new Map<string, ParsedRow[]>();
    for (const row of nextRows) {
      if (row.error || !row.apiDate || !row.employeeId || !row.scheduleId) continue;
      const key = `${row.employeeId}|${row.apiDate}`;
      const bucket = groupMap.get(key) ?? [];
      bucket.push(row);
      groupMap.set(key, bucket);
    }

    for (const rowsGroup of groupMap.values()) {
      for (let i = 0; i < rowsGroup.length; i++) {
        for (let j = i + 1; j < rowsGroup.length; j++) {
          const scheduleA = schedulesByPublicId.get(rowsGroup[i].scheduleId as string);
          const scheduleB = schedulesByPublicId.get(rowsGroup[j].scheduleId as string);
          if (!scheduleA || !scheduleB) continue;

          const intervalsA = getScheduleIntervals(scheduleA);
          const intervalsB = getScheduleIntervals(scheduleB);
          if (intervalsA.length === 0 || intervalsB.length === 0) continue;

          if (intervalsOverlap(intervalsA, intervalsB)) {
            const msgA = `${OVERLAP_ERROR_PREFIX}${rowsGroup[j].scheduleCode}`;
            const msgB = `${OVERLAP_ERROR_PREFIX}${rowsGroup[i].scheduleCode}`;
            rowsGroup[i].error = rowsGroup[i].error ? `${rowsGroup[i].error}; ${msgA}` : msgA;
            rowsGroup[j].error = rowsGroup[j].error ? `${rowsGroup[j].error}; ${msgB}` : msgB;
          }
        }
      }
    }

    return nextRows;
  };

  const removeRow = (rowNumber: number) => {
    setRows((prev) => revalidateOverlapErrors(prev.filter((r) => r.rowNumber !== rowNumber)));
  };

  const labels = useMemo(() => {
    if (locale === "en") {
      return {
        row: "Row",
        date: "Date",
        matricula: "Enrollment number",
        scheduleCode: "Schedule Code",
        status: "Status",
      };
    }
    if (locale === "pt") {
      return {
        row: "Linha",
        date: "Data",
        matricula: "Número de matrícula",
        scheduleCode: "Código do Horário",
        status: "Estado",
      };
    }
    if (locale === "fr") {
      return {
        row: "Ligne",
        date: "Date",
        matricula: "Numéro de matricule",
        scheduleCode: "Code Horaire",
        status: "Statut",
      };
    }
    return {
      row: "Fila",
      date: "Fecha",
      matricula: "Número de matrícula",
      scheduleCode: "Código horario",
      status: "Estado",
    };
  }, [locale]);

  const resetState = () => {
    setRows([]);
    setFileName("");
    setIsProcessing(false);
    setIsDragging(false);
    setPendingConflictResolution(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handlePickedFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      await parseFile(file);
    } catch (error: any) {
      toast({
        title: "Error de archivo",
        description: String(error?.message ?? "Formato inválido."),
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const downloadTemplate = async () => {
    try {
      const headerFill = {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FFD6EAF8" },
      };
      const styleHeaderCells = (ws: ExcelJS.Worksheet, columnCount: number) => {
        for (let col = 1; col <= columnCount; col++) {
          const cell = ws.getRow(1).getCell(col);
          cell.font = { bold: true };
          cell.fill = headerFill;
        }
      };

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Plantilla");
      sheet.addRow([...TEMPLATE_HEADERS]);
      styleHeaderCells(sheet, 4);

      sheet.addRow(["10/05/2026", "ALU-001", "HR-MANANA", "SEDE-CENTRO"]);
      sheet.columns.forEach((col) => (col.width = 24));

      const schedulesSheet = workbook.addWorksheet("Horarios");
      schedulesSheet.addRow(["Codigo", "Nombre"]);
      styleHeaderCells(schedulesSheet, 2);
      (schedulesData?.data ?? []).forEach((schedule: any) => {
        schedulesSheet.addRow([schedule.code ?? "", schedule.name ?? ""]);
      });
      schedulesSheet.columns.forEach((col) => (col.width = 28));

      const establishmentsSheet = workbook.addWorksheet("Establecimientos");
      establishmentsSheet.addRow(["Codigo", "Nombre"]);
      styleHeaderCells(establishmentsSheet, 2);
      (establishmentsData?.data ?? []).forEach((est: any) => {
        establishmentsSheet.addRow([est.code ?? "", est.name ?? ""]);
      });
      establishmentsSheet.columns.forEach((col) => (col.width = 28));

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_carga_masiva_horarios_estudiantes.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo generar la plantilla.",
        variant: "destructive",
      });
    }
  };

  const parseFile = async (file: File) => {
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("Archivo sin hojas");

    const headerTokens = [1, 2, 3, 4].map((i) =>
      normalizeHeaderToken(sheet.getRow(1).getCell(i).value),
    );
    const h0 = headerTokens[0];
    const h1 = headerTokens[1];
    const h2 = headerTokens[2];
    const h3 = headerTokens[3];
    const validH0 = h0 === "fecha" || h0 === "date";
    const validH1 = STUDENT_ID_HEADER_ALIASES.has(h1);
    const validH2 = h2 === "codigohorario" || h2 === "schedulecode";
    const validH3 =
      h3 === "codigoestablecimiento" || h3 === "establishmentcode";
    const validHeaders = validH0 && validH1 && validH2 && validH3;
    if (!validHeaders) {
      throw new Error(
        "Encabezados inválidos. Columna 1: fecha | Columna 2: numeroMatricula (o codigoEstudiante para archivos antiguos) | Columna 3: codigoHorario | Columna 4: codigoEstablecimiento",
      );
    }

    const parsed: ParsedRow[] = [];
    const todayIso = getTodayIsoLocal();
    const employeesByMatricula = new Map<string, string>(
      (employeesData?.data ?? [])
        .filter((employee: any) => !!employee?.code && !!employee?.publicId)
        .map((employee: any) => [
          String(employee.code).trim().toLowerCase(),
          employee.publicId,
        ]),
    );
    const schedulesByCode = new Map<string, string>(
      (schedulesData?.data ?? [])
        .filter((schedule: any) => !!schedule?.code && !!schedule?.publicId)
        .map((schedule: any) => [String(schedule.code).trim().toLowerCase(), schedule.publicId]),
    );
    const establishmentsByCode = new Map<string, string>(
      (establishmentsData?.data ?? [])
        .filter((est: any) => !!est?.code && !!est?.publicId)
        .map((est: any) => [String(est.code).trim().toLowerCase(), est.publicId]),
    );

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rawDate = row.getCell(1).value;
      const parsedDate = parseDateCellToDisplayAndIso(rawDate);
      const date = parsedDate.display;
      const apiDate = parsedDate.iso;
      const matricula = normalizeCell(row.getCell(2).value);
      const scheduleCode = normalizeCell(row.getCell(3).value);
      const establishmentCode = normalizeCell(row.getCell(4).value);
      if (!date && !matricula && !scheduleCode && !establishmentCode) return;

      const employeeId = employeesByMatricula.get(matricula.toLowerCase());
      const scheduleId = schedulesByCode.get(scheduleCode.toLowerCase());
      const establishmentId = establishmentCode
        ? establishmentsByCode.get(establishmentCode.toLowerCase())
        : undefined;

      let error = "";
      if (!date || !matricula || !scheduleCode) {
        error =
          "fecha, número de matrícula y código de horario son obligatorios";
      } else if (!apiDate) {
        error = "date debe venir como DD/MM/YYYY, DD-MM-YYYY o YYYY-MM-DD";
      } else if (apiDate <= todayIso) {
        error = "La fecha debe ser mayor a hoy";
      } else if (!employeeId) {
        error = `No existe estudiante con matrícula: ${matricula}`;
      } else if (!scheduleId) {
        error = `No existe horario con código: ${scheduleCode}`;
      } else if (establishmentCode && !establishmentId) {
        error = `No existe establecimiento con código: ${establishmentCode}`;
      }

      parsed.push({
        rowNumber,
        date,
        apiDate: apiDate || undefined,
        matricula,
        scheduleCode,
        establishmentCode: establishmentCode || undefined,
        employeeId,
        scheduleId,
        establishmentId,
        error: error || undefined,
      });
    });

    // Validar traslapes entre las filas válidas del mismo archivo
    const schedulesByPublicId = new Map<string, any>(
      (schedulesData?.data ?? [])
        .filter((s: any) => !!s?.publicId)
        .map((s: any) => [s.publicId, s]),
    );

    const groupMap = new Map<string, ParsedRow[]>();
    for (const row of parsed) {
      if (row.error || !row.apiDate || !row.employeeId || !row.scheduleId) continue;
      const key = `${row.employeeId}|${row.apiDate}`;
      const bucket = groupMap.get(key) ?? [];
      bucket.push(row);
      groupMap.set(key, bucket);
    }

    for (const rowsGroup of groupMap.values()) {
      for (let i = 0; i < rowsGroup.length; i++) {
        for (let j = i + 1; j < rowsGroup.length; j++) {
          const scheduleA = schedulesByPublicId.get(rowsGroup[i].scheduleId as string);
          const scheduleB = schedulesByPublicId.get(rowsGroup[j].scheduleId as string);
          if (!scheduleA || !scheduleB) continue;

          const intervalsA = getScheduleIntervals(scheduleA);
          const intervalsB = getScheduleIntervals(scheduleB);
          if (intervalsA.length === 0 || intervalsB.length === 0) continue;

          if (intervalsOverlap(intervalsA, intervalsB)) {
            const msgA = `Traslape en archivo con horario ${rowsGroup[j].scheduleCode}`;
            const msgB = `Traslape en archivo con horario ${rowsGroup[i].scheduleCode}`;
            rowsGroup[i].error = rowsGroup[i].error ? `${rowsGroup[i].error}; ${msgA}` : msgA;
            rowsGroup[j].error = rowsGroup[j].error ? `${rowsGroup[j].error}; ${msgB}` : msgB;
          }
        }
      }
    }

    setRows(parsed);
    setFileName(file.name);
    setPendingConflictResolution(null);
  };

  const handleProcess = async () => {
    if (validRows.length === 0) {
      toast({
        title: "Sin datos válidos",
        description: "Carga un archivo con al menos una fila válida.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        rows: validRows.map((r) => ({
          date: (r.apiDate || r.date) as string,
          employeeId: r.employeeId as string,
          scheduleId: r.scheduleId as string,
          ...(r.establishmentId ? { establishmentId: r.establishmentId } : {}),
        })),
        replaceOverlaps: false,
      };

      const dryRun = await bulkAssign.mutateAsync({ ...payload, dryRun: true });
      if (!dryRun?.ok) {
        const backendErrors: Array<{ rowIndex: number; messages: string[] }> =
          dryRun?.errors ?? [];
        if (backendErrors.length > 0) {
          setRows((prev) => {
            const next = [...prev];
            for (const err of backendErrors) {
              // rowIndex viene 0-based desde backend según el orden de rows enviadas
              const validAtIndex = validRows[err.rowIndex];
              if (!validAtIndex) continue;
              const targetIdx = next.findIndex(
                (r) =>
                  r.rowNumber === validAtIndex.rowNumber &&
                  r.matricula === validAtIndex.matricula &&
                  r.scheduleCode === validAtIndex.scheduleCode &&
                  r.date === validAtIndex.date,
              );
              if (targetIdx === -1) continue;
              next[targetIdx] = {
                ...next[targetIdx],
                error: err.messages?.join("; ") || "Validación fallida",
              };
            }
            return next;
          });
        }
        const allMessages = backendErrors.flatMap((err) => err.messages ?? []);
        const allAreAssignedOverlap =
          allMessages.length > 0 &&
          allMessages.every((message) =>
            String(message).toLowerCase().includes("traslape con horario ya asignado"),
          );
        if (allAreAssignedOverlap) {
          const matriculas = Array.from(
            new Set(
              backendErrors
                .map((err) => validRows[err.rowIndex]?.matricula)
                .filter((code): code is string => !!code),
            ),
          );
          setPendingConflictResolution({
            matriculas,
            message:
              matriculas.length > 0
                ? `Hay traslapes con horarios ya asignados para matrículas: ${matriculas.join(", ")}.`
                : "Hay traslapes con horarios ya asignados.",
          });
          toast({
            title: "Conflictos detectados",
            description: "Revisa la alerta para decidir si reemplazar o no cargar.",
            variant: "destructive",
          });
          return;
        }
        const firstError = dryRun?.errors?.[0]?.messages?.[0] ?? "Validación fallida.";
        toast({
          title: "Validación de carga fallida",
          description: firstError,
          variant: "destructive",
        });
        return;
      }

      await bulkAssign.mutateAsync({ ...payload, dryRun: false });
      toast({
        title: "Carga completada",
        description: "Los horarios se cargaron correctamente.",
      });
      handleClose();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "No se pudo procesar la carga masiva.";
      toast({
        title: "Error",
        description: String(msg),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReplace = async () => {
    const replaceableRows = rows.filter((r) => {
      if (!r.apiDate || !r.employeeId || !r.scheduleId) return false;
      if (!r.error) return true;
      return hasAssignedOverlapError(r.error);
    });
    if (replaceableRows.length === 0) return;
    setIsProcessing(true);
    try {
      const payload = {
        rows: replaceableRows.map((r) => ({
          date: (r.apiDate || r.date) as string,
          employeeId: r.employeeId as string,
          scheduleId: r.scheduleId as string,
          ...(r.establishmentId ? { establishmentId: r.establishmentId } : {}),
        })),
        replaceOverlaps: true,
        replaceAllEmployeeSchedulesOnConflict: true,
      };
      await bulkAssign.mutateAsync({ ...payload, dryRun: false });
      toast({
        title: "Carga completada",
        description:
          "Se reemplazaron horarios en conflicto y se cargaron los nuevos horarios.",
      });
      handleClose();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "No se pudo procesar la carga masiva.";
      toast({
        title: "Error",
        description: String(msg),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelByConflicts = () => {
    const affected = pendingConflictResolution?.matriculas ?? [];
    toast({
      title: "Carga cancelada",
      description:
        affected.length > 0
          ? `Arregla los conflictos de: ${affected.join(", ")} y vuelve a intentar.`
          : "Arregla los conflictos y vuelve a intentar.",
      variant: "destructive",
    });
    handleClose();
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Carga masiva de horarios"
      size="5xl"
    >
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-gray-600">
          Importa asignaciones de horarios para estudiantes desde Excel. La plantilla incluye
          referencias de horarios y establecimientos; las fechas deben ser{" "}
          <span className="font-medium text-gray-800">posteriores a hoy</span>.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              step: 1,
              title: "Descarga la plantilla",
              desc: "Excel con columnas fecha, matrícula, horario y establecimiento.",
              icon: Download,
              action: (
                <CHEKIOButton
                  variant="secondaryBlue"
                  className="mt-3 w-full justify-center gap-2 sm:w-auto"
                  onClick={downloadTemplate}
                  disabled={isProcessing}
                >
                  <Download className="h-4 w-4 shrink-0" />
                  Descargar plantilla
                </CHEKIOButton>
              ),
            },
            {
              step: 2,
              title: "Completa los datos",
              desc: "Usa códigos de la hoja Horarios y Establecimientos de la plantilla.",
              icon: Table2,
              action: null,
            },
            {
              step: 3,
              title: "Sube el archivo",
              desc: "Arrastra tu .xlsx aquí abajo o elige el archivo desde tu equipo.",
              icon: Upload,
              action: null,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative overflow-hidden rounded-xl border border-gray-200/90 bg-gradient-to-b from-white to-gray-50/80 p-4 shadow-sm"
            >
              <div
                className="absolute right-0 top-0 h-16 w-16 rounded-bl-[2rem] opacity-[0.12]"
                style={{ backgroundColor: primary }}
                aria-hidden
              />
              <div className="relative flex items-start gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
                  style={{ backgroundColor: primary }}
                >
                  {item.step}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                  </div>
                  <p className="mt-1.5 text-xs leading-snug text-gray-600">{item.desc}</p>
                  {item.action}
                </div>
              </div>
            </div>
          ))}
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0];
            void handlePickedFile(file);
          }}
        />

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!isProcessing) inputRef.current?.click();
            }
          }}
          className={cn(
            "group relative cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200",
            isDragging
              ? "scale-[1.01] border-blue-500 bg-blue-50/80 shadow-md"
              : "border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-50",
            isProcessing && "pointer-events-none opacity-60",
          )}
          style={
            isDragging
              ? { borderColor: primary, backgroundColor: `${primary}14` }
              : undefined
          }
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
            if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
              void handlePickedFile(f);
            } else if (f) {
              toast({
                title: "Formato no válido",
                description: "Usa un archivo .xlsx o .xls",
                variant: "destructive",
              });
            }
          }}
          onClick={() => !isProcessing && inputRef.current?.click()}
        >
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-105"
            style={{ backgroundColor: `${primary}18`, color: primary }}
          >
            <FileSpreadsheet className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium text-gray-800">
            Arrastra tu archivo aquí o haz clic para seleccionar
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Solo Excel · .xlsx, .xls · Máx. recomendado según filas de tu archivo
          </p>
          <CHEKIOButton
            type="button"
            variant="primary"
            className="pointer-events-none mt-5 inline-flex gap-2"
            tabIndex={-1}
            aria-hidden
          >
            <Upload className="h-4 w-4" />
            Elegir archivo
          </CHEKIOButton>
        </div>

        {fileName ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
              <FileSpreadsheet className="h-5 w-5 shrink-0 text-gray-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{fileName}</p>
                <p className="text-xs text-gray-500">
                  {rows.length} fila{rows.length !== 1 ? "s" : ""} leída
                  {rows.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-100 sm:grid-cols-3">
              <div className="px-4 py-3 text-center">
                <p className="text-lg font-semibold tabular-nums text-gray-900">{rows.length}</p>
                <p className="text-xs font-medium text-gray-500">Total</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-lg font-semibold tabular-nums text-emerald-700">
                  {validRows.length}
                </p>
                <p className="text-xs font-medium text-gray-500">Válidas</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-lg font-semibold tabular-nums text-red-600">
                  {invalidRows.length}
                </p>
                <p className="text-xs font-medium text-gray-500">Con error</p>
              </div>
            </div>
          </div>
        ) : null}

        {pendingConflictResolution && (
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/50 p-4 text-sm text-amber-950 shadow-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-semibold">Traslape con horarios ya asignados</p>
              <p className="text-amber-900/90">{pendingConflictResolution.message}</p>
              <p className="text-xs leading-relaxed text-amber-800/85">
                Si reemplazas, se elimina el historial de horarios del día seleccionado para esos
                estudiantes y se cargan solo los del archivo.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <CHEKIOButton
                  variant="primary"
                  onClick={handleConfirmReplace}
                  disabled={isProcessing}
                >
                  Reemplazar y cargar
                </CHEKIOButton>
                <CHEKIOButton
                  variant="secondary"
                  onClick={handleCancelByConflicts}
                  disabled={isProcessing}
                >
                  No cargar
                </CHEKIOButton>
              </div>
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Table2 className="h-4 w-4 text-gray-500" />
              <h4 className="text-sm font-semibold text-gray-900">Vista previa</h4>
            </div>
            <div className="max-h-72 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="whitespace-nowrap">{labels.row}</CHEKIOTableHead>
                    <CHEKIOTableHead>{labels.date}</CHEKIOTableHead>
                    <CHEKIOTableHead>{labels.matricula}</CHEKIOTableHead>
                    <CHEKIOTableHead>{labels.scheduleCode}</CHEKIOTableHead>
                    <CHEKIOTableHead>{labels.status}</CHEKIOTableHead>
                    <CHEKIOTableHead className="text-right">Acción</CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {rows.map((row, index) => (
                    <CHEKIOTableRow key={`${row.rowNumber}-${index}`} index={index}>
                      <CHEKIOTableCell className="tabular-nums">{row.rowNumber}</CHEKIOTableCell>
                      <CHEKIOTableCell>{row.date}</CHEKIOTableCell>
                      <CHEKIOTableCell>{row.matricula}</CHEKIOTableCell>
                      <CHEKIOTableCell>{row.scheduleCode}</CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {row.error ? (
                          <span className="text-xs text-red-600">{row.error}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            OK
                          </span>
                        )}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="text-right">
                        {row.error ? (
                          <button
                            type="button"
                            onClick={() => removeRow(row.rowNumber)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                            title="Quitar fila"
                            aria-label="Quitar fila"
                            disabled={isProcessing}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            {validRows.length > 0
              ? "Listo para enviar al servidor. Revisa filas con error antes de procesar."
              : "Descarga la plantilla, completa el Excel y súbelo para continuar."}
          </p>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <CHEKIOButton variant="secondary" onClick={handleClose} disabled={isProcessing}>
              Cancelar
            </CHEKIOButton>
            <CHEKIOButton
              variant="primary"
              onClick={handleProcess}
              disabled={isProcessing || validRows.length === 0}
              className="min-w-[160px] justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Procesar carga
                </>
              )}
            </CHEKIOButton>
          </div>
        </div>
      </div>
    </CHEKIOModal>
  );
}

