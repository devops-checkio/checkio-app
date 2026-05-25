"use client";

import {
  CHEKIOButton,
  CHEKIOLoading,
  CHEKIOModal,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { useGetAssistanceById } from "@/service/mantainer.service";
import {
  Activity,
  AlertCircle,
  Camera,
  Check,
  Clock,
  MapPin,
  Tag,
  Wifi,
  WifiOff,
} from "lucide-react";
import { DateTime } from "luxon";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AssistanceResponseDto,
  AssistanceScheduleSlotDto,
  AssistanceStatus,
  AttemptMarkDto,
  AttemptMarkStatus,
  MarkDto,
} from "../../_components/assistance.dto";
import {
  formatFaceRecognitionDate,
  formatFaceRecognitionReason,
  getFaceRecognitionConfidenceMeta,
  getFaceRecognitionStatusMeta,
  getFaceRecognitionTechnicalDetails,
} from "../../management/_utils/face-recognition";
import FaceRecognitionBadge from "../../management/_components/face-recognition-badge";
import MarkAuditMap from "../../management/_components/mark-audit-map";

interface ModalMarcacionesStudentProps {
  isOpen: boolean;
  onClose: () => void;
  assistancePublicId: string;
}

// Status badge styling for slots
const SLOT_STATUS_BADGE: Record<
  AssistanceStatus,
  { className: string; label: string }
> = {
  [AssistanceStatus.COMPLETED]: {
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    label: "Completado",
  },
  [AssistanceStatus.INCOMPLETE]: {
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    label: "Incompleto",
  },
  [AssistanceStatus.ABSENT]: {
    className: "bg-red-50 text-red-700 border border-red-200",
    label: "Ausente",
  },
  [AssistanceStatus.WITHOUT_SCHEDULE]: {
    className: "bg-gray-50 text-gray-600 border border-gray-200",
    label: "Sin horario",
  },
};

function formatSeconds(seconds: number): string {
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

export default function ModalMarcacionesStudent({
  isOpen,
  onClose,
  assistancePublicId,
}: ModalMarcacionesStudentProps) {
  const t = useTranslations("assistanceManagementStudent");
  const { getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();

  const {
    data: assistance,
    isLoading,
    isError,
    refetch,
  } = useGetAssistanceById(
    isOpen && assistancePublicId ? assistancePublicId : undefined,
  );

  // Photo modal state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    capturedPhoto: string | null;
    employeePhoto: string | null;
    faceRecognitionStatus: MarkDto["faceRecognitionStatus"];
    faceRecognitionScore: number | null;
    faceRecognitionDistance: number | null;
    faceRecognitionConfidenceLevel: MarkDto["faceRecognitionConfidenceLevel"];
    faceRecognitionReason: string | null;
    faceRecognitionProcessedAt: string | null;
    faceRecognitionPayload: unknown;
    faceRecognitionAccepted: boolean | null;
  } | null>(null);

  // Audit map modal state
  const [isAuditMapModalOpen, setIsAuditMapModalOpen] = useState(false);
  const [selectedMarkForAudit, setSelectedMarkForAudit] =
    useState<MarkDto | null>(null);
  const [isAttemptMapModalOpen, setIsAttemptMapModalOpen] = useState(false);
  const [selectedAttemptForAudit, setSelectedAttemptForAudit] =
    useState<AttemptMarkDto | null>(null);

  const handleOpenPhotoModal = (mark: MarkDto) => {
    setSelectedPhoto({
      capturedPhoto: mark.photoUrl || null,
      employeePhoto: mark.employeePhotoUrl || null,
      faceRecognitionStatus: mark.faceRecognitionStatus,
      faceRecognitionScore: mark.faceRecognitionScore ?? null,
      faceRecognitionDistance: mark.faceRecognitionDistance ?? null,
      faceRecognitionConfidenceLevel: mark.faceRecognitionConfidenceLevel,
      faceRecognitionReason: mark.faceRecognitionReason ?? null,
      faceRecognitionProcessedAt: mark.faceRecognitionProcessedAt ?? null,
      faceRecognitionPayload: mark.faceRecognitionPayload ?? null,
      faceRecognitionAccepted: mark.faceRecognitionAccepted ?? null,
    });
    setIsPhotoModalOpen(true);
  };

  const handleOpenAttemptMapModal = (attempt: AttemptMarkDto) => {
    const parsedAttempt = {
      ...attempt,
      authorizedZones:
        typeof attempt.authorizedZones === "string"
          ? JSON.parse(attempt.authorizedZones)
          : attempt.authorizedZones,
    };
    setSelectedAttemptForAudit(parsedAttempt);
    setIsAttemptMapModalOpen(true);
  };

  const modalTitle = assistance
    ? `${t("modal.headerTitle")} - ${assistance.Employee.firstName} ${assistance.Employee.lastName} ${assistance.Employee.secondLastName ?? ""}`
    : t("modal.title");

  // Attempt marks resolved by slot
  const getSlotAttemptMarks = (
    slot: AssistanceScheduleSlotDto,
    allAttempts: AttemptMarkDto[],
    allMarks: MarkDto[],
  ) => {
    // Find mark IDs that belong to this slot by checking which marks are in slot.Marks
    const slotMarkIds = new Set(
      (slot.Marks || []).map((m: any) => m.publicId).filter(Boolean),
    );
    // Filter attempts whose resolved mark belongs to this slot
    return allAttempts.filter((attempt) => {
      if (!attempt.markId) return false;
      // Look for a mark with this id in slot.Marks
      return (slot.Marks || []).some((m: any) => m.id === attempt.markId);
    });
  };

  // Failed attempt marks (markId is null or unresolved)
  const getFailedAttemptMarks = (
    allAttempts: AttemptMarkDto[],
    slots: AssistanceScheduleSlotDto[],
    allMarks: MarkDto[],
  ) => {
    // Collect all markIds that are assigned to a slot
    const assignedMarkIds = new Set<number>();
    slots.forEach((slot) => {
      (slot.Marks || []).forEach((m: any) => {
        if (m.id) assignedMarkIds.add(m.id);
      });
    });
    return allAttempts.filter(
      (attempt) => !attempt.markId || !assignedMarkIds.has(attempt.markId as number),
    );
  };

  // ──────────────────────────────────────────────
  // PhotoComparisonModal
  // ──────────────────────────────────────────────
  const PhotoComparisonModal = () => {
    if (!selectedPhoto) return null;
    const statusMeta = getFaceRecognitionStatusMeta({
      faceRecognitionStatus: selectedPhoto.faceRecognitionStatus,
      photoUrl: selectedPhoto.capturedPhoto ?? undefined,
    });
    const confidenceMeta = getFaceRecognitionConfidenceMeta(
      selectedPhoto.faceRecognitionConfidenceLevel,
    );
    const score = selectedPhoto.faceRecognitionScore ?? 0;
    const boundedScore = Math.max(0, Math.min(100, score));
    return (
      <CHEKIOModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title="Verificación de Identidad"
        size="7xl"
      >
        <div className="flex flex-col gap-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="rounded-xl bg-gray-50 p-4">
                <h3 className="font-medium text-gray-700 mb-3">
                  Foto de Ficha
                </h3>
                <div className="relative h-64 w-full overflow-hidden rounded-xl bg-gray-100">
                  {selectedPhoto.employeePhoto ? (
                    <Image
                      src={selectedPhoto.employeePhoto}
                      alt="Foto de ficha del empleado"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No hay foto de referencia
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="rounded-xl bg-gray-50 p-4">
                <h3 className="font-medium text-gray-700 mb-3">
                  Foto de Marcación
                </h3>
                <div className="relative h-64 w-full overflow-hidden rounded-xl bg-gray-100">
                  {selectedPhoto.capturedPhoto ? (
                    <Image
                      src={selectedPhoto.capturedPhoto}
                      alt="Foto de marcación"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No hay foto de marcación
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="w-full">
            <div className="rounded-xl border border-gray-200 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center">
                <span className="w-1/3 text-gray-500">Estado:</span>
                <span
                  className={`rounded-lg border px-2 py-1 text-xs font-medium ${statusMeta.badgeClassName}`}
                >
                  {statusMeta.label}
                </span>
              </div>
              {confidenceMeta && (
                <div className="flex items-center">
                  <span className="w-1/3 text-gray-500">Confianza:</span>
                  <span
                    className={`rounded-lg border px-2 py-1 text-xs font-medium ${confidenceMeta.badgeClassName}`}
                  >
                    {confidenceMeta.label}
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <span className="w-1/3 text-gray-500">Score:</span>
                <div className="flex items-center gap-2 w-2/3">
                  <div className="h-2.5 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2.5 rounded-full ${
                        confidenceMeta?.accentClassName ?? "bg-gray-400"
                      }`}
                      style={{ width: `${boundedScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {selectedPhoto.faceRecognitionScore != null
                      ? `${selectedPhoto.faceRecognitionScore.toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CHEKIOModal>
    );
  };

  // ──────────────────────────────────────────────
  // Attempt marks table (shared)
  // ──────────────────────────────────────────────
  const AttemptMarksTable = ({
    attempts,
  }: {
    attempts: AttemptMarkDto[];
  }) => {
    if (attempts.length === 0) return null;
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <CHEKIOTable>
          <CHEKIOTableHeader>
            <tr>
              <CHEKIOTableHead className="min-w-[130px]">
                <span className="flex items-center gap-2">
                  <Clock
                    className="h-4 w-4"
                    style={{ color: `${templateUser.primary}99` }}
                  />
                  Fecha/Hora
                </span>
              </CHEKIOTableHead>
              <CHEKIOTableHead className="min-w-[110px]">
                <span className="flex items-center gap-2">
                  <Activity
                    className="h-4 w-4"
                    style={{ color: `${templateUser.primary}99` }}
                  />
                  Estado
                </span>
              </CHEKIOTableHead>
              <CHEKIOTableHead className="min-w-[110px]">Tiempo</CHEKIOTableHead>
              <CHEKIOTableHead className="min-w-[130px]">
                <span className="flex items-center gap-2">
                  <MapPin
                    className="h-4 w-4"
                    style={{ color: `${templateUser.primary}99` }}
                  />
                  Ubicación
                </span>
              </CHEKIOTableHead>
              <CHEKIOTableHead className="min-w-[110px]">
                Estado de Zona
              </CHEKIOTableHead>
              <CHEKIOTableHead className="min-w-[160px]">Error</CHEKIOTableHead>
            </tr>
          </CHEKIOTableHeader>
          <CHEKIOTableBody>
            {attempts.map((attempt, idx) => {
              const dateTime = DateTime.fromISO(attempt.createdAt)
                .setZone(attempt.timezone)
                .toFormat("dd/MM/yyyy HH:mm:ss");
              const [date, time] = dateTime.split(" ");
              const expiresAt = DateTime.fromISO(attempt.expiresAt);
              const isExpired = expiresAt < DateTime.now();

              return (
                <CHEKIOTableRow key={attempt.publicId ?? idx} index={idx}>
                  <CHEKIOTableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{time}</span>
                      <span className="text-xs text-gray-500">{date}</span>
                    </div>
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>
                    {attempt.status === AttemptMarkStatus.COMPLETED && (
                      <span className="rounded-lg border border-green-200 bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        Completada
                      </span>
                    )}
                    {attempt.status === AttemptMarkStatus.FAILED && (
                      <span className="rounded-lg border border-red-200 bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                        Fallida
                      </span>
                    )}
                    {attempt.status === AttemptMarkStatus.IN_PROGRESS &&
                      (isExpired ? (
                        <span className="rounded-lg border border-red-200 bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                          Expiró tiempo
                        </span>
                      ) : (
                        <span className="rounded-lg border border-yellow-200 bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 animate-pulse">
                          En progreso
                        </span>
                      ))}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>
                    {attempt.status === AttemptMarkStatus.IN_PROGRESS &&
                    !isExpired ? (
                      <span className="text-xs text-gray-500">
                        Exp: {expiresAt.toFormat("HH:mm:ss")}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>
                    {attempt.latitude && attempt.longitude ? (
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => handleOpenAttemptMapModal(attempt)}
                      >
                        {attempt.latitude.toFixed(4)},{" "}
                        {attempt.longitude.toFixed(4)}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Sin coordenadas
                      </span>
                    )}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>
                    {attempt.isWithinAuthorizedZone === true && (
                      <span className="rounded-lg border border-green-200 bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        Dentro
                      </span>
                    )}
                    {attempt.isWithinAuthorizedZone === false && (
                      <span className="rounded-lg border border-red-200 bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                        Fuera
                      </span>
                    )}
                    {attempt.isWithinAuthorizedZone === undefined && (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>
                    <span className="text-xs text-gray-600">
                      {attempt.errorCode ?? "-"}
                    </span>
                  </CHEKIOTableCell>
                </CHEKIOTableRow>
              );
            })}
          </CHEKIOTableBody>
        </CHEKIOTable>
      </div>
    );
  };

  // ──────────────────────────────────────────────
  // Official marks table for a slot
  // ──────────────────────────────────────────────
  const OfficialMarksTable = ({ marks }: { marks: MarkDto[] }) => {
    const officialMarks = marks.filter((m) => m.isOfficial && !m.isAditional);
    if (officialMarks.length === 0) {
      return (
        <p className="text-sm text-gray-400 italic py-2">
          {t("modal.slot.noMarks")}
        </p>
      );
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <CHEKIOTable>
          <CHEKIOTableHeader>
            <tr>
              <CHEKIOTableHead className="min-w-[130px]">
                <span className="flex items-center gap-2">
                  <Clock
                    className="h-4 w-4"
                    style={{ color: `${templateUser.primary}99` }}
                  />
                  Fecha/Hora
                </span>
              </CHEKIOTableHead>
              <CHEKIOTableHead className="min-w-[90px]">
                <span className="flex items-center gap-2">
                  <Tag
                    className="h-4 w-4"
                    style={{ color: `${templateUser.primary}99` }}
                  />
                  Tipo
                </span>
              </CHEKIOTableHead>
              <CHEKIOTableHead className="min-w-[130px]">
                <span className="flex items-center gap-2">
                  <MapPin
                    className="h-4 w-4"
                    style={{ color: `${templateUser.primary}99` }}
                  />
                  Ubicación
                </span>
              </CHEKIOTableHead>
              <CHEKIOTableHead className="min-w-[100px]">Realizada</CHEKIOTableHead>
              <CHEKIOTableHead className="min-w-[90px]">Conexión</CHEKIOTableHead>
              <CHEKIOTableHead className="min-w-[140px]">
                Observación
              </CHEKIOTableHead>
              <CHEKIOTableHead className="min-w-[100px]">Estado</CHEKIOTableHead>
              <CHEKIOTableHead className="min-w-[130px]">
                Verificación facial
              </CHEKIOTableHead>
              <CHEKIOTableHead className="min-w-[80px]">
                <span className="flex items-center gap-2">
                  <Camera
                    className="h-4 w-4"
                    style={{ color: `${templateUser.primary}99` }}
                  />
                  Foto
                </span>
              </CHEKIOTableHead>
            </tr>
          </CHEKIOTableHeader>
          <CHEKIOTableBody>
            {officialMarks.map((mark, idx) => {
              const dateTime = DateTime.fromISO(mark.timestamp).toFormat(
                "dd/MM/yyyy HH:mm:ss",
              );
              const [date, time] = dateTime.split(" ");
              return (
                <CHEKIOTableRow key={mark.publicId ?? idx} index={idx}>
                  <CHEKIOTableCell className="px-5 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-medium">{time}</span>
                      <span className="text-xs text-gray-500">{date}</span>
                    </div>
                  </CHEKIOTableCell>
                  <CHEKIOTableCell className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        mark.type === "CHECK_IN"
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {mark.type === "CHECK_IN" ? "Entrada" : "Salida"}
                    </span>
                  </CHEKIOTableCell>
                  <CHEKIOTableCell className="px-5 py-3.5">
                    {mark.latitude && mark.longitude ? (
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => {
                          setSelectedMarkForAudit(mark);
                          setIsAuditMapModalOpen(true);
                        }}
                      >
                        {mark.latitude.toFixed(4)}, {mark.longitude.toFixed(4)}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Sin coordenadas
                      </span>
                    )}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell className="px-5 py-3.5">
                    <span className="text-sm text-gray-700">
                      {mark.isManual
                        ? "Manual"
                        : mark.isGenerated
                          ? "Automático"
                          : "Dispositivo"}
                    </span>
                  </CHEKIOTableCell>
                  <CHEKIOTableCell className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {mark.isOffline ? (
                        <>
                          <WifiOff className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Offline</span>
                        </>
                      ) : (
                        <>
                          <Wifi className="h-4 w-4 text-green-600" />
                          <span className="text-gray-800">Online</span>
                        </>
                      )}
                    </div>
                  </CHEKIOTableCell>
                  <CHEKIOTableCell className="px-5 py-3.5">
                    <span className="text-sm text-gray-700">
                      {mark.observacion || "Sin observaciones"}
                    </span>
                  </CHEKIOTableCell>
                  <CHEKIOTableCell className="px-5 py-3.5">
                    <div className="flex flex-col gap-1">
                      {mark.modificada && (
                        <span className="rounded-lg border border-red-200 bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                          Modificada
                        </span>
                      )}
                      <span
                        className={`rounded-lg border px-2 py-1 text-xs font-medium ${
                          mark.isOfficial
                            ? "border-green-200 bg-green-100 text-green-800"
                            : "border-red-200 bg-red-100 text-red-800"
                        }`}
                      >
                        {mark.isOfficial ? "Válida" : "Inválida"}
                      </span>
                    </div>
                  </CHEKIOTableCell>
                  <CHEKIOTableCell className="px-5 py-3.5">
                    <div className="flex flex-col gap-2">
                      <FaceRecognitionBadge mark={mark} />
                      <span className="text-xs text-gray-500">
                        {formatFaceRecognitionReason(
                          mark.faceRecognitionReason,
                        ) ?? "Sin detalle"}
                      </span>
                      {(mark.photoUrl ||
                        mark.employeePhotoUrl ||
                        mark.faceRecognitionStatus) && (
                        <CHEKIOButton
                          type="button"
                          variant="secondaryBlue"
                          className="h-auto w-fit px-2 py-1 text-xs"
                          onClick={() => handleOpenPhotoModal(mark)}
                        >
                          Ver detalle
                        </CHEKIOButton>
                      )}
                    </div>
                  </CHEKIOTableCell>
                  <CHEKIOTableCell className="px-5 py-3.5">
                    {mark.photoUrl ? (
                      <div
                        className="relative cursor-pointer h-12 w-12 overflow-hidden rounded-lg"
                        onClick={() => handleOpenPhotoModal(mark)}
                      >
                        <Image
                          src={mark.photoUrl}
                          alt="Foto marcación"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Sin foto</span>
                    )}
                  </CHEKIOTableCell>
                </CHEKIOTableRow>
              );
            })}
          </CHEKIOTableBody>
        </CHEKIOTable>
      </div>
    );
  };

  // ──────────────────────────────────────────────
  // Slot card
  // ──────────────────────────────────────────────
  const SlotCard = ({
    slot,
    index,
    assistance,
  }: {
    slot: AssistanceScheduleSlotDto;
    index: number;
    assistance: AssistanceResponseDto;
  }) => {
    const statusConfig =
      SLOT_STATUS_BADGE[slot.status] ?? SLOT_STATUS_BADGE[AssistanceStatus.INCOMPLETE];
    const startStr = slot.Schedule?.startDate
      ? DateTime.fromISO(slot.Schedule.startDate).toUTC().toFormat("HH:mm:ss")
      : "-";
    const endStr = slot.Schedule?.endDate
      ? DateTime.fromISO(slot.Schedule.endDate).toUTC().toFormat("HH:mm:ss")
      : "-";

    const slotAttempts = getSlotAttemptMarks(
      slot,
      assistance.AttemptMark || [],
      assistance.Marks || [],
    );

    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Card header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-gray-200"
          style={{ backgroundColor: `${templateUser.primary}10` }}
        >
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: templateUser.primary }}
            >
              {t("modal.slot.block")} {index + 1}
            </span>
            <span className="font-medium text-gray-800">
              {slot.Schedule?.name ?? "-"}
            </span>
            <span className="text-sm text-gray-500">
              {startStr} – {endStr} UTC
            </span>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-4 bg-gray-50 border-b border-gray-200">
          {/* Delay */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">
              {t("modal.slot.delay")}
            </span>
            <span
              className={`text-sm font-semibold ${slot.delaySeconds > 0 ? "text-orange-600" : "text-gray-600"}`}
            >
              {slot.delaySeconds > 0
                ? formatSeconds(slot.delaySeconds)
                : t("modal.na")}
            </span>
          </div>
          {/* Early departure */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">
              {t("modal.slot.earlyDeparture")}
            </span>
            <span
              className={`text-sm font-semibold ${slot.earlyDepartureSeconds > 0 ? "text-red-600" : "text-gray-600"}`}
            >
              {slot.earlyDepartureSeconds > 0
                ? formatSeconds(slot.earlyDepartureSeconds)
                : t("modal.na")}
            </span>
          </div>
          {/* Extra time */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">
              {t("modal.slot.extra")}
            </span>
            <span
              className={`text-sm font-semibold ${slot.extraSeconds > 0 ? "text-emerald-600" : "text-gray-600"}`}
            >
              {slot.extraSeconds > 0
                ? formatSeconds(slot.extraSeconds)
                : t("modal.na")}
            </span>
          </div>
          {/* Status */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">
              {t("modal.slot.status")}
            </span>
            <span
              className={`inline-flex self-start items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Official marks */}
        <div className="px-5 py-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            {t("modal.slot.officialMarks")}
          </h4>
          <OfficialMarksTable marks={slot.Marks || []} />
        </div>

        {/* Block attempts */}
        {slotAttempts.length > 0 && (
          <div className="px-5 pb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              {t("modal.slot.attemptsTitle")}
            </h4>
            <AttemptMarksTable attempts={slotAttempts} />
          </div>
        )}
      </div>
    );
  };

  // ──────────────────────────────────────────────
  // Main render
  // ──────────────────────────────────────────────
  return (
    <>
      <CHEKIOModal
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        size="7xl"
      >
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <CHEKIOLoading
              size="lg"
              variant="modern"
              text={t("modal.loading")}
            />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <p className="text-sm font-medium text-red-600">{t("modal.error")}</p>
            <CHEKIOButton
              variant="secondaryBlue"
              onClick={() => refetch()}
            >
              {t("modal.retry")}
            </CHEKIOButton>
          </div>
        )}

        {/* Content */}
        {assistance && (
          <div className="bg-white space-y-6">
            {/* Header: logo + name + document */}
            <div className="flex items-center gap-4 p-4 border-b border-gray-200">
              <Image
                src="/logos/logo.svg"
                alt="CheckIO"
                width={100}
                height={40}
                className="bg-white"
              />
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">
                  {t("modal.headerTitle")}
                </h3>
                <h2 className="text-gray-700 font-medium">
                  {assistance.Employee.firstName} {assistance.Employee.lastName}{" "}
                  {assistance.Employee.secondLastName}
                </h2>
                <p className="text-sm text-gray-500">
                  {assistance.Employee.documentNumber} –{" "}
                  {assistance.Employee.documentType}
                </p>
              </div>
            </div>

            {/* Slot cards or empty state */}
            {!assistance.Slots || assistance.Slots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 mb-4">
                  <Clock className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {t("modal.noSlotsEmpty.title")}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {t("modal.noSlotsEmpty.description")}
                </p>
              </div>
            ) : (
              <div className="space-y-6 px-1">
                {[...assistance.Slots]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((slot, index) => (
                    <SlotCard
                      key={slot.publicId}
                      slot={slot}
                      index={index}
                      assistance={assistance}
                    />
                  ))}
              </div>
            )}

            {/* Global failed attempts section */}
            {assistance.Slots &&
              assistance.Slots.length > 0 &&
              (() => {
                const failedAttempts = getFailedAttemptMarks(
                  assistance.AttemptMark || [],
                  assistance.Slots,
                  assistance.Marks || [],
                );
                if (failedAttempts.length === 0) return null;
                return (
                  <div className="px-1">
                    <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
                      <div className="flex items-center gap-2 px-5 py-3 border-b border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <h4 className="text-sm font-semibold text-red-700">
                          {t("modal.failedAttempts.title")}
                        </h4>
                        <span className="text-xs text-red-500">
                          ({failedAttempts.length})
                        </span>
                      </div>
                      <div className="px-5 py-4">
                        <AttemptMarksTable attempts={failedAttempts} />
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        )}
      </CHEKIOModal>

      {/* Photo comparison modal */}
      <PhotoComparisonModal />

      {/* Audit map modal for marks */}
      {selectedMarkForAudit && (
        <CHEKIOModal
          isOpen={isAuditMapModalOpen}
          onClose={() => {
            setIsAuditMapModalOpen(false);
            setSelectedMarkForAudit(null);
          }}
          title="Mapa de Auditoría de Marcación"
          size="7xl"
        >
          <MarkAuditMap mark={selectedMarkForAudit} />
        </CHEKIOModal>
      )}

      {/* Audit map modal for attempt marks */}
      {selectedAttemptForAudit && (
        <CHEKIOModal
          isOpen={isAttemptMapModalOpen}
          onClose={() => {
            setIsAttemptMapModalOpen(false);
            setSelectedAttemptForAudit(null);
          }}
          title="Mapa de Auditoría de Intento de Marcación"
          size="7xl"
        >
          <MarkAuditMap mark={selectedAttemptForAudit as any} />
        </CHEKIOModal>
      )}
    </>
  );
}
