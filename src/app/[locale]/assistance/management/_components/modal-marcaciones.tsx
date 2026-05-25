"use client";

import { CustomTab } from "@/app/[locale]/_components/custom-tab";
import {
  AlertConfirmModal,
  CHEKIOActionButton,
  CHEKIOButton,
  CHEKIOInput,
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
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useToast } from "@/hooks/use-toast";
import {
  useGetAssistanceById,
  useSetFreeDayFromAssistance,
} from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  Camera,
  Check,
  Clock,
  Clock as ClockIcon,
  FileCheck as DocumentCheckIcon,
  FileText,
  Loader2,
  MapPin,
  PlusCircle,
  Sun,
  Tag,
  Wifi,
  WifiOff,
} from "lucide-react";
import { DateTime } from "luxon";
import Image from "next/image";
import { useState } from "react";
import {
  AttemptMarkDto,
  AttemptMarkStatus,
  MarkDto,
  MarkStatus,
} from "../../_components/assistance.dto";
import {
  formatFaceRecognitionDate,
  formatFaceRecognitionReason,
  getFaceRecognitionConfidenceMeta,
  getFaceRecognitionStatusMeta,
  getFaceRecognitionTechnicalDetails,
} from "../_utils/face-recognition";
import AssistanceMarkTag from "./assistance-mark-tag";
import AttemptMarkCountdown from "./attempt-mark-countdown";
import FaceRecognitionBadge from "./face-recognition-badge";
import { isAssistanceDayEditable } from "../_utils/assistance-date-lock";
import {
  FreeDayConfirmationPhrase,
  getAxiosErrorMessage,
  isFreeDayConfirmationValid,
} from "./free-day-confirmation";
import MarkAuditMap from "./mark-audit-map";
import ModalAddAdditionalMark from "./modal-add-additional-mark";
import ModalAutocompleteAssistance from "./modal-autocomplete-assitance";
import ModalCompleteAssistance from "./modal-complete-assitance";
import ModalIndividualAssignmentSchedule from "./modal-individual-assignment-schedule";

interface ModalMarcacionesProps {
  isOpen: boolean;
  onClose: () => void;
  assistanceId: string;
}

const ModalMarcaciones = ({
  isOpen,
  onClose,
  assistanceId,
}: ModalMarcacionesProps) => {
  const queryClient = useQueryClient();
  const {
    data: assistance,
    isLoading: isAssistanceLoading,
    isError: isAssistanceError,
    refetch: refetchAssistance,
  } = useGetAssistanceById(isOpen && assistanceId ? assistanceId : undefined);

  const { getTemplateUser, canUpdate } = useCookieSession();
  const templateUser = getTemplateUser();
  const canEditAssistance = canUpdate(
    OrganizationPermissionCode.ASSISTANCE_MANAGMENT_OPERATIONS,
  );
  const canEditAssistanceByDate = assistance
    ? isAssistanceDayEditable(assistance)
    : false;
  const [activeTab, setActiveTab] = useState("1");
  const [isModalAutocompleteOpen, setIsModalAutocompleteOpen] = useState(false);
  const [isModalCompleteOpen, setIsModalCompleteOpen] = useState(false);
  const [isModalScheduleAssignmentOpen, setIsModalScheduleAssignmentOpen] =
    useState(false);
  const [isModalAddAdditionalMarkOpen, setIsModalAddAdditionalMarkOpen] =
    useState(false);
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
  const [isAuditMapModalOpen, setIsAuditMapModalOpen] = useState(false);
  const [selectedMarkForAudit, setSelectedMarkForAudit] =
    useState<MarkDto | null>(null);
  const [isAttemptMapModalOpen, setIsAttemptMapModalOpen] = useState(false);
  const [selectedAttemptForAudit, setSelectedAttemptForAudit] =
    useState<AttemptMarkDto | null>(null);
  const [isModalFreeDayOpen, setIsModalFreeDayOpen] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState("");

  const { toast } = useToast();
  const dateLockToast = () => {
    toast({
      title: "Acción no permitida",
      description: "Solo puedes editar marcaciones de días anteriores a hoy.",
      variant: "destructive",
    });
  };
  const { mutateAsync: setFreeDayFromAssistance, isPending: isFreeDayPending } =
    useSetFreeDayFromAssistance();

  const handleOpenAttemptMapModal = (attempt: AttemptMarkDto) => {
    // Parse authorizedZones si es string
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

  const PhotoComparisonModal = () => {
    if (!selectedPhoto) return null;

    const statusMeta = getFaceRecognitionStatusMeta({
      faceRecognitionStatus: selectedPhoto.faceRecognitionStatus,
      photoUrl: selectedPhoto.capturedPhoto ?? undefined,
    });
    const confidenceMeta = getFaceRecognitionConfidenceMeta(
      selectedPhoto.faceRecognitionConfidenceLevel,
    );
    const processedAt = formatFaceRecognitionDate(
      selectedPhoto.faceRecognitionProcessedAt,
    );
    const formattedReason = formatFaceRecognitionReason(
      selectedPhoto.faceRecognitionReason,
    );
    const technicalDetails = getFaceRecognitionTechnicalDetails({
      faceRecognitionPayload: selectedPhoto.faceRecognitionPayload,
      faceRecognitionAccepted: selectedPhoto.faceRecognitionAccepted,
      faceRecognitionDistance: selectedPhoto.faceRecognitionDistance,
      faceRecognitionScore: selectedPhoto.faceRecognitionScore,
    });
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
          {/* Photo Comparison Section - Side by side */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="rounded-xl bg-gray-50 p-4">
                <h3 className="font-medium text-gray-700 mb-3">
                  Foto de Ficha
                </h3>
                <div className="relative h-64 w-full overflow-hidden rounded-xl bg-gray-100">
                  {selectedPhoto?.employeePhoto ? (
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
                  {selectedPhoto?.capturedPhoto ? (
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

          {/* Verification Details Section - Full width */}
          <div className="w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Detalles de Verificación
            </h3>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                <h4 className="mb-2 font-medium text-slate-700">
                  Estado de Verificación
                </h4>
                <div className="mb-3 flex items-center">
                  <div className="w-1/3 text-gray-500">Estado:</div>
                  <div className="w-2/3">
                    <span
                      className={`rounded-lg border px-2 py-1 text-xs font-medium ${statusMeta.badgeClassName}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                </div>
                <div className="mb-3 flex items-center">
                  <div className="w-1/3 text-gray-500">Confianza:</div>
                  <div className="w-2/3">
                    {confidenceMeta ? (
                      <span
                        className={`rounded-lg border px-2 py-1 text-xs font-medium ${confidenceMeta.badgeClassName}`}
                      >
                        {confidenceMeta.label}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">
                        No disponible
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-1/3 text-gray-500">Score:</div>
                  <div className="w-2/3">
                    <div className="flex items-center gap-2">
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

              <div className="rounded-xl bg-green-50 p-4">
                <h4 className="mb-2 font-medium text-green-700">
                  Resumen de Auditoría
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-2/5 text-gray-500">Motivo:</div>
                    <div className="w-3/5 font-medium">
                      {formattedReason ?? "No disponible"}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2/5 text-gray-500">Fecha proceso:</div>
                    <div className="w-3/5 font-medium">
                      {processedAt ?? "Pendiente"}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2/5 text-gray-500">Distancia:</div>
                    <div className="w-3/5 font-medium">
                      {selectedPhoto.faceRecognitionDistance != null
                        ? selectedPhoto.faceRecognitionDistance.toFixed(4)
                        : "N/A"}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2/5 text-gray-500">Resultado:</div>
                    <div className="w-3/5 font-medium">
                      {selectedPhoto.faceRecognitionAccepted == null
                        ? "No disponible"
                        : selectedPhoto.faceRecognitionAccepted
                          ? "Aceptada"
                          : "Rechazada"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-100 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        La auditoría usa el contrato oficial de reconocimiento
                        facial persistido en la marca.
                      </p>
                    </div>
                  </div>

                  {technicalDetails.length > 0 && (
                    <div className="grid gap-3 md:grid-cols-2">
                      {technicalDetails.map((detail) => (
                        <div
                          key={detail.label}
                          className="rounded-xl border border-gray-200 bg-white p-3"
                        >
                          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            {detail.label}
                          </div>
                          <div className="mt-1 text-sm font-medium text-gray-800">
                            {detail.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedPhoto.faceRecognitionPayload != null && (
                    <details className="rounded-xl border border-gray-200 bg-white p-3">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700">
                        Ver detalle técnico completo
                      </summary>
                      <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
                        {JSON.stringify(
                          selectedPhoto.faceRecognitionPayload,
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CHEKIOModal>
    );
  };

  const ATTEMPT_MARKS_COLUMNS = [
    {
      header: "Fecha/Hora",
      icon: Clock,
      accessorFn: (row: AttemptMarkDto) => {
        return DateTime.fromISO(row.createdAt)
          .setZone(row.timezone)
          .toFormat("dd/MM/yyyy HH:mm:ss");
      },
      cell: ({ getValue }: any) => {
        const dateTime = getValue();
        if (!dateTime) return <span>-</span>;
        const [date, time] = dateTime.split(" ");
        return (
          <div className="flex flex-col">
            <span className="font-medium">{time}</span>
            <span className="text-xs text-gray-500">{date}</span>
          </div>
        );
      },
    },
    {
      header: "Estado",
      icon: Activity,
      accessorKey: "status",
      cell: ({ row }: any) => {
        const status = row.original.status;

        switch (status) {
          case AttemptMarkStatus.COMPLETED:
            return (
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-600" />
                <span className="rounded-lg border border-green-200 bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  Completada
                </span>
              </div>
            );
          case AttemptMarkStatus.FAILED:
            return (
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="rounded-lg border border-red-200 bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                  Fallida
                </span>
              </div>
            );
          case AttemptMarkStatus.IN_PROGRESS:
            const expiresAt = DateTime.fromISO(row.original.expiresAt);
            if (expiresAt < DateTime.now()) {
              return (
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="rounded-lg border border-red-200 bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                    Expiró tiempo
                  </span>
                </div>
              );
            }
            return (
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-yellow-600 animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="rounded-lg border border-yellow-200 bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                  Iniciada
                </span>
              </div>
            );
          default:
            return <span>{status}</span>;
        }
      },
    },
    {
      header: "Zona Horaria",
      icon: Clock,
      accessorKey: "timezone",
      cell: ({ row }: { row: any }) => {
        const timezone = row.original.timezone;

        return (
          <div className="flex items-center">
            <span className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
              {timezone || "UTC"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Tiempo Transcurrido",
      icon: ClockIcon,
      cell: ({ row }: any) => {
        const createdAt = DateTime.fromISO(row.original.createdAt);
        const updatedAt = row.original.updatedAt
          ? DateTime.fromISO(row.original.updatedAt)
          : null;
        const expiresAt = DateTime.fromISO(row.original.expiresAt);
        const status = row.original.status;

        // Calcular el tiempo transcurrido
        let elapsedTime;
        let timeLeft;
        let totalDuration;

        if (status === AttemptMarkStatus.COMPLETED && updatedAt) {
          // Si está completada, mostrar tiempo entre creación y última actualización
          elapsedTime = updatedAt
            .diff(createdAt, ["minutes", "seconds"])
            .toObject();
          totalDuration = expiresAt.diff(createdAt, "seconds").seconds;
        } else if (
          status === AttemptMarkStatus.FAILED ||
          (status === AttemptMarkStatus.IN_PROGRESS &&
            expiresAt < DateTime.now())
        ) {
          // Si falló o expiró, mostrar tiempo entre creación y expiración
          elapsedTime = expiresAt
            .diff(createdAt, ["minutes", "seconds"])
            .toObject();
          totalDuration = expiresAt.diff(createdAt, "seconds").seconds;
        } else if (status === AttemptMarkStatus.IN_PROGRESS) {
          // Si está en progreso, mostrar tiempo transcurrido hasta ahora
          elapsedTime = DateTime.now()
            .diff(createdAt, ["minutes", "seconds"])
            .toObject();
          timeLeft = expiresAt
            .diff(DateTime.now(), ["minutes", "seconds"])
            .toObject();
          totalDuration = expiresAt.diff(createdAt, "seconds").seconds;
        }

        // Formatear el tiempo transcurrido
        const formattedTime = elapsedTime
          ? `${Math.floor(elapsedTime.minutes || 0)}m ${Math.floor(
              elapsedTime.seconds || 0,
            )}s`
          : "N/A";

        // Formatear el tiempo restante
        const formattedTimeLeft = timeLeft
          ? `${Math.floor(timeLeft.minutes || 0)}m ${Math.floor(
              timeLeft.seconds || 0,
            )}s restantes`
          : "";

        // Calcular el porcentaje de tiempo transcurrido para la barra de progreso
        const elapsedSeconds = elapsedTime
          ? (elapsedTime.minutes || 0) * 60 + (elapsedTime.seconds || 0)
          : 0;
        const progressPercentage = totalDuration
          ? Math.min(100, (elapsedSeconds / totalDuration) * 100)
          : 0;

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">{formattedTime}</span>
            </div>

            {/* Componente de cuenta regresiva en tiempo real para IN_PROGRESS */}
            {status === AttemptMarkStatus.IN_PROGRESS && (
              <AttemptMarkCountdown
                expiresAt={row.original.expiresAt}
                status={status}
                createdAt={row.original.createdAt}
              />
            )}

            {status === AttemptMarkStatus.COMPLETED && (
              <div className="text-xs text-green-500">Completado a tiempo</div>
            )}

            {status === AttemptMarkStatus.FAILED && (
              <div className="text-xs text-red-500">Intento fallido</div>
            )}
          </div>
        );
      },
    },
    {
      header: "Ubicación",
      icon: MapPin,
      cell: ({ row }: any) => {
        // Determinar la zona específica donde se hizo el intento de marca
        const attempt = row.original;

        // Parse authorizedZones si es string
        let zones;
        try {
          zones =
            typeof attempt.authorizedZones === "string"
              ? JSON.parse(attempt.authorizedZones)
              : attempt.authorizedZones;
        } catch (e) {
          zones = [];
        }

        // Función para calcular distancia entre dos puntos (fórmula Haversine simplificada)
        const getDistance = (
          lat1: number,
          lon1: number,
          lat2: number,
          lon2: number,
        ) => {
          const R = 6371e3; // Radio de la Tierra en metros
          const φ1 = (lat1 * Math.PI) / 180;
          const φ2 = (lat2 * Math.PI) / 180;
          const Δφ = ((lat2 - lat1) * Math.PI) / 180;
          const Δλ = ((lon2 - lon1) * Math.PI) / 180;

          const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          return R * c; // Distancia en metros
        };

        // Encontrar la zona más cercana donde se hizo el intento
        let closestZone = null;
        let minDistance = Infinity;

        if (
          attempt.latitude &&
          attempt.longitude &&
          zones &&
          zones.length > 0
        ) {
          for (const zone of zones) {
            const distance = getDistance(
              attempt.latitude,
              attempt.longitude,
              zone.latitude,
              zone.longitude,
            );
            if (distance <= zone.radius && distance < minDistance) {
              minDistance = distance;
              closestZone = zone;
            }
          }

          // Si no hay zona dentro del radio, tomar la más cercana
          if (!closestZone) {
            for (const zone of zones) {
              const distance = getDistance(
                attempt.latitude,
                attempt.longitude,
                zone.latitude,
                zone.longitude,
              );
              if (distance < minDistance) {
                minDistance = distance;
                closestZone = zone;
              }
            }
          }
        }

        // Determinar icono y texto según el tipo de zona
        let icon = null;
        let locationText = "Ubicación no definida";
        let locationSubtext = "";

        if (closestZone) {
          if (closestZone.type === "EMPLOYEE_HOME_OFFICE") {
            icon = (
              <svg
                className="w-4 h-4 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            );
            locationText = "Home Office";
          } else if (closestZone.type === "BRANCH") {
            icon = (
              <svg
                className="w-4 h-4 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                  clipRule="evenodd"
                />
              </svg>
            );
            locationText = closestZone.branchName || "Sucursal";
            locationSubtext = closestZone.name;
          } else if (closestZone.type === "EMPLOYEE_GEOLOCATION") {
            icon = (
              <svg
                className="w-4 h-4 text-orange-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
            );
            locationText = "Marcación en terreno";
            locationSubtext = closestZone.name;
          }
        }

        return (
          <div className="flex items-start gap-2">
            <div className="mt-0.5">{icon}</div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-800">{locationText}</span>
              {locationSubtext && (
                <span className="text-sm text-gray-500">{locationSubtext}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Estado de Zona",
      icon: MapPin,
      cell: ({ row }: any) => {
        const { isWithinAuthorizedZone, isWithinWithMargin, authorizedZones } =
          row.original;

        // Parse authorizedZones si es string
        let zones;
        try {
          zones =
            typeof authorizedZones === "string"
              ? JSON.parse(authorizedZones)
              : authorizedZones;
        } catch (e) {
          zones = [];
        }

        // Si no hay zonas configuradas
        if (!zones || zones.length === 0) {
          return (
            <div className="flex flex-col gap-1">
              <span className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                Sin zonas configuradas
              </span>
            </div>
          );
        }

        // Determinar estado
        let statusBadge;
        if (isWithinAuthorizedZone) {
          statusBadge = (
            <span className="rounded-lg border border-green-200 bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              ✓ Dentro de zona
            </span>
          );
        } else if (isWithinWithMargin) {
          statusBadge = (
            <span className="rounded-lg border border-yellow-200 bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
              ⚠ Dentro con margen
            </span>
          );
        } else {
          statusBadge = (
            <span className="rounded-lg border border-red-200 bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
              ✗ Fuera de zona
            </span>
          );
        }

        return (
          <div className="flex flex-col gap-1">
            {statusBadge}
            <span className="text-xs text-gray-500">
              {zones.length} zona(s) configurada(s)
            </span>
          </div>
        );
      },
    },
    {
      header: "Error",
      icon: AlertCircle,
      accessorKey: "errorCode",
      cell: ({ getValue }: any) => {
        const errorCode = getValue();
        return errorCode ? (
          <span className="rounded-lg border border-red-200 bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
            {errorCode}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
  ];

  const marksList = assistance?.Marks ?? [];
  const attemptMarksList = assistance?.AttemptMark ?? [];

  let marksToShow = marksList;

  if (activeTab === "1") {
    marksToShow = marksList.filter(
      (mark: MarkDto) => mark.isOfficial && !mark.isAditional,
    );
  } else if (activeTab === "2") {
    marksToShow = marksList.filter(
      (mark: MarkDto) => !mark.isOfficial && !mark.isAditional,
    );
  } else if (activeTab === "3") {
    marksToShow = marksList.filter(
      (mark: MarkDto) => mark.status === MarkStatus.REJECTED,
    );
  } else if (activeTab === "4") {
    marksToShow = marksList.filter((mark: MarkDto) => mark.isAditional);
  }

  marksToShow = [...marksToShow].sort((a: MarkDto, b: MarkDto) => {
    const timeA = DateTime.fromISO(a.timestamp).toUTC();
    const timeB = DateTime.fromISO(b.timestamp).toUTC();

    if (timeA < timeB) return -1;
    if (timeA > timeB) return 1;
    return 0;
  });

  const countMarks = {
    official: marksList.filter(
      (mark: MarkDto) => mark.isOfficial && !mark.isAditional,
    ).length,
    notOfficial: marksList.filter(
      (mark: MarkDto) => !mark.isOfficial && !mark.isAditional,
    ).length,
    rejected: marksList.filter(
      (mark: MarkDto) => mark.status === MarkStatus.REJECTED,
    ).length,
    waitingApproval: marksList.filter(
      (mark: MarkDto) => mark.status === MarkStatus.WAITING_APPROVAL,
    ).length,
    accepted: marksList.filter(
      (mark: MarkDto) => mark.status === MarkStatus.ACCEPTED,
    ).length,
    attempts: attemptMarksList.length,
    additional: marksList.filter((mark: MarkDto) => mark.isAditional).length,
  };

  function getTranslatedMarkEntry(mark: MarkDto) {
    if (mark.isManuallyTyped) {
      return "Digitada";
    } else if (mark.isGenerated) {
      return "Automático";
    }
    return "Manual";
  }

  const modalTitle = assistance
    ? `Registro de Marcaciones - ${assistance.Employee.firstName} ${assistance.Employee.lastName} ${assistance.Employee.secondLastName ?? ""}`
    : "Registro de Marcaciones";

  const TableHeaderCell = ({
    icon: Icon,
    label,
  }: {
    icon: React.ComponentType<{
      className?: string;
      style?: React.CSSProperties;
    }>;
    label: string;
  }) => (
    <CHEKIOTableHead className="min-w-[100px]">
      <span
        className="flex items-center gap-2"
        style={{ color: templateUser.primary }}
      >
        <Icon
          className="h-4 w-4"
          style={{ color: `${templateUser.primary}99` }}
        />
        {label}
      </span>
    </CHEKIOTableHead>
  );

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="7xl"
    >
      {isAssistanceLoading && (
        <div className="flex justify-center py-16">
          <CHEKIOLoading
            size="lg"
            variant="modern"
            text="Cargando asistencia..."
          />
        </div>
      )}
      {isAssistanceError && (
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <p className="text-sm font-medium text-red-600">
            No se pudo cargar la asistencia. Intenta de nuevo.
          </p>
          <CHEKIOButton variant="secondaryBlue" onClick={() => refetchAssistance()}>
            Reintentar
          </CHEKIOButton>
        </div>
      )}
      {assistance && (
      <div className="bg-white">
        {/* Header con Logo y Acciones */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Image
              src={"/logos/logo.svg"}
              alt="CheckIO"
              width={100}
              height={40}
              className="bg-white"
            />
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">
                Registro de Marcaciones
              </h3>
              <h2 className="text-gray-500 text-sm">
                {assistance.Employee.firstName} {assistance.Employee.lastName}{" "}
                {assistance.Employee.secondLastName}
              </h2>
              <p className="text-sm text-gray-500">
                {assistance.Employee.documentNumber} -{" "}
                {assistance.Employee.documentType}
              </p>
            </div>
          </div>
          {canEditAssistance && (
            <div className="flex gap-2">
              {assistance.Schedule?.publicId && (
                <CHEKIOButton
                  variant="primary"
                  disabled={!canEditAssistanceByDate}
                  onClick={() => {
                    if (!canEditAssistanceByDate) {
                      dateLockToast();
                      return;
                    }
                    setIsModalAutocompleteOpen(true);
                  }}
                >
                  <Clock className="h-4 w-4" />
                  Autocompletar Automático
                </CHEKIOButton>
              )}

              <CHEKIOButton
                variant="primary"
                disabled={!canEditAssistanceByDate}
                onClick={() => {
                  if (!canEditAssistanceByDate) {
                    dateLockToast();
                    return;
                  }
                  setIsModalCompleteOpen(true);
                }}
              >
                <Clock className="h-4 w-4" />
                Autocompletar Manual
              </CHEKIOButton>
              <CHEKIOButton
                variant="primary"
                disabled={!canEditAssistanceByDate}
                onClick={() => {
                  if (!canEditAssistanceByDate) {
                    dateLockToast();
                    return;
                  }
                  setIsModalAddAdditionalMarkOpen(true);
                }}
              >
                <PlusCircle className="h-4 w-4" />
                Agregar Marca Adicional
              </CHEKIOButton>
              <CHEKIOButton
                variant="primary"
                disabled={!canEditAssistanceByDate}
                onClick={() => {
                  if (!canEditAssistanceByDate) {
                    dateLockToast();
                    return;
                  }
                  setIsModalScheduleAssignmentOpen(true);
                }}
              >
                <PlusCircle className="h-4 w-4" />
                Actualizar Horario
              </CHEKIOButton>
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={() => {
                  if (!canEditAssistanceByDate) {
                    dateLockToast();
                    return;
                  }
                  setIsModalFreeDayOpen(true);
                  setConfirmationPhrase("");
                }}
                disabled={!canEditAssistanceByDate}
              >
                <Sun className="h-4 w-4" />
                Dar día libre
              </CHEKIOButton>
            </div>
          )}
        </div>
        {/* Información del Turno y Resumen */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              Turno Asignado
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Entrada:</span>
                <p className="font-medium">
                  {assistance.Schedule?.startDate
                    ? `${DateTime.fromISO(assistance.Schedule.startDate)
                        .toUTC()
                        .toFormat("dd/MM/yyyy HH:mm:ss")}`
                    : "--:--:--"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Salida:</span>
                <p className="font-medium">
                  {assistance.Schedule?.endDate
                    ? `${DateTime.fromISO(assistance.Schedule.endDate)
                        .toUTC()
                        .toFormat("dd/MM/yyyy HH:mm:ss")}`
                    : "--:--:--"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              Resumen del Día
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Horas Trabajadas:</span>
                <p className="font-medium">{1}h</p>
              </div>
              <div>
                <span className="text-gray-500">Horas Extras:</span>
                <p className="font-medium text-purple-600">
                  {1 > 0 ? `+${1}h` : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              Información del Horario Asignado
            </h4>
            <div className="flex flex-col gap-2">
              {/* Nombre del horario asignado */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-semibold text-blue-700">
                  {assistance.Schedule?.name || "Sin horario asignado"}
                </span>
              </div>
              {/* Estado de marcación */}
              <div className="flex items-center gap-2">
                <DocumentCheckIcon className="w-4 h-4 text-blue-500" />
                <span className="text-sm">
                  {assistance.resume?.marcacionCompleta
                    ? "Marcación Completa"
                    : "Marcación Incompleta"}
                </span>
              </div>
              {/* Atraso en entrada */}
              {assistance.resume?.atrasoEntrada > 0 && (
                <span className="text-sm text-yellow-600">
                  {assistance.resume.atrasoEntrada} min. atraso en entrada
                </span>
              )}
              {/* Atraso en salida */}
              {assistance.resume?.atrasoSalida > 0 && (
                <span className="text-sm text-yellow-600">
                  {assistance.resume.atrasoSalida} min. atraso en salida
                </span>
              )}
              {/* Exceso de colación */}
              {assistance.resume?.excesoColacion > 0 && (
                <span className="text-sm text-yellow-600">
                  {assistance.resume.excesoColacion} min. exceso colación
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6 px-2 mb-1">
          <CustomTab
            label="Marcas Oficiales"
            active={activeTab === "1"}
            onClick={() => setActiveTab("1")}
            count={countMarks.official}
            color="#52c41a"
          />
          <CustomTab
            label="Marcas No Oficiales"
            active={activeTab === "2"}
            onClick={() => setActiveTab("2")}
            count={countMarks.notOfficial}
            color="#f5222d"
          />
          <CustomTab
            label="Rechazadas por Empleado"
            active={activeTab === "3"}
            onClick={() => setActiveTab("3")}
            count={countMarks.rejected}
            color="#f5222d"
          />
          <CustomTab
            label="Marcaciones Adicionales"
            active={activeTab === "4"}
            onClick={() => setActiveTab("4")}
            count={countMarks.additional}
            color="#1890ff"
          />
          <CustomTab
            label="Intentos de Marcaje"
            active={activeTab === "5"}
            onClick={() => setActiveTab("5")}
            count={countMarks.attempts}
            color="#f5222d"
          />
        </div>

        {/* Tabla de Marcaciones con Acciones */}
        {activeTab !== "5" && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {marksToShow && marksToShow.length > 0 ? (
              <div className="overflow-x-auto">
                <CHEKIOTable className="rounded-none border-0 shadow-none">
                  <CHEKIOTableHeader>
                    <tr>
                      <TableHeaderCell icon={Clock} label="Fecha/Hora" />
                      <TableHeaderCell icon={Tag} label="Tipo" />
                      <TableHeaderCell icon={MapPin} label="Ubicación" />
                      <TableHeaderCell icon={Activity} label="Realizada" />
                      <TableHeaderCell icon={Wifi} label="Conexión" />
                      <TableHeaderCell icon={FileText} label="Observación" />
                      <TableHeaderCell icon={Activity} label="Estado" />
                      <TableHeaderCell
                        icon={DocumentCheckIcon}
                        label="Verificación facial"
                      />
                      <TableHeaderCell icon={Camera} label="Foto" />
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        Acciones
                      </CHEKIOTableHead>
                    </tr>
                  </CHEKIOTableHeader>
                  <CHEKIOTableBody>
                    {marksToShow.map((mark: any, index: number) => {
                      const date = DateTime.fromISO(mark.timestamp)
                        .toUTC()
                        .toFormat("dd/MM/yyyy");
                      const time = DateTime.fromISO(mark.timestamp)
                        .toUTC()
                        .toFormat("HH:mm:ss");

                      return (
                        <CHEKIOTableRow key={mark.id || index} index={index}>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            <div className="flex flex-col">
                              <span
                                className={
                                  mark.modificada
                                    ? "text-red-500 font-medium"
                                    : "font-medium"
                                }
                              >
                                {time}
                              </span>
                              <span className="text-xs text-gray-500">
                                {date}
                              </span>
                            </div>
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            <AssistanceMarkTag
                              type={mark.type}
                              scheduleId={mark.scheduleId}
                              scheduleBreakId={mark.scheduleBreakPublicId}
                              isAditional={mark.isAditional}
                            />
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            {(() => {
                              // Determinar la zona específica donde se hizo la marca
                              const zones = mark.authorizedZones || [];

                              // Función para calcular distancia
                              const getDistance = (
                                lat1: number,
                                lon1: number,
                                lat2: number,
                                lon2: number,
                              ) => {
                                const R = 6371e3;
                                const φ1 = (lat1 * Math.PI) / 180;
                                const φ2 = (lat2 * Math.PI) / 180;
                                const Δφ = ((lat2 - lat1) * Math.PI) / 180;
                                const Δλ = ((lon2 - lon1) * Math.PI) / 180;
                                const a =
                                  Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                                  Math.cos(φ1) *
                                    Math.cos(φ2) *
                                    Math.sin(Δλ / 2) *
                                    Math.sin(Δλ / 2);
                                const c =
                                  2 *
                                  Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                return R * c;
                              };

                              // Encontrar zona más cercana
                              let closestZone = null;
                              let minDistance = Infinity;

                              if (
                                mark.latitude &&
                                mark.longitude &&
                                zones.length > 0
                              ) {
                                for (const zone of zones) {
                                  const distance = getDistance(
                                    mark.latitude,
                                    mark.longitude,
                                    zone.latitude,
                                    zone.longitude,
                                  );
                                  if (
                                    distance <= zone.radius &&
                                    distance < minDistance
                                  ) {
                                    minDistance = distance;
                                    closestZone = zone;
                                  }
                                }

                                if (!closestZone) {
                                  for (const zone of zones) {
                                    const distance = getDistance(
                                      mark.latitude,
                                      mark.longitude,
                                      zone.latitude,
                                      zone.longitude,
                                    );
                                    if (distance < minDistance) {
                                      minDistance = distance;
                                      closestZone = zone;
                                    }
                                  }
                                }
                              }

                              // Determinar icono y texto
                              let icon = null;
                              let locationText = "Ubicación no definida";
                              let locationSubtext = "";

                              if (closestZone) {
                                if (
                                  closestZone.type === "EMPLOYEE_HOME_OFFICE"
                                ) {
                                  icon = (
                                    <svg
                                      className="w-4 h-4 text-green-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                    </svg>
                                  );
                                  locationText = "Home Office";
                                } else if (closestZone.type === "BRANCH") {
                                  icon = (
                                    <svg
                                      className="w-4 h-4 text-blue-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  );
                                  locationText =
                                    closestZone.branchName || "Sucursal";
                                  locationSubtext = closestZone.name;
                                } else if (
                                  closestZone.type === "EMPLOYEE_GEOLOCATION"
                                ) {
                                  icon = (
                                    <svg
                                      className="w-4 h-4 text-orange-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  );
                                  locationText = "Marcación en terreno";
                                  locationSubtext = closestZone.name;
                                }
                              }

                              return (
                                <div className="flex items-start gap-2">
                                  <div className="mt-0.5">{icon}</div>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-800">
                                      {locationText}
                                    </span>
                                    {locationSubtext && (
                                      <span className="text-sm text-gray-500">
                                        {locationSubtext}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {getTranslatedMarkEntry(mark)}
                              </span>
                            </div>
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            <div
                              className="flex items-center gap-1.5"
                              title={mark.isOffline ? "Offline" : "Online"}
                            >
                              {mark.isOffline ? (
                                <>
                                  <WifiOff className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium text-gray-600">
                                    Offline
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Wifi className="h-4 w-4 text-green-600" />
                                  <span className="font-medium text-gray-800">
                                    Online
                                  </span>
                                </>
                              )}
                            </div>
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-700">
                                {mark.observacion || "Sin observaciones"}
                              </span>
                            </div>
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-2">
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
                              <div className="flex items-center gap-3">
                                <div
                                  className="relative cursor-pointer"
                                  onClick={() => handleOpenPhotoModal(mark)}
                                >
                                  <Image
                                    src={mark.photoUrl}
                                    alt="Employee photo"
                                    width={100}
                                    height={100}
                                    className="rounded-xl hover:opacity-80 transition-opacity"
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Sin foto</span>
                            )}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            <div className="flex gap-2">
                              {mark.latitude && mark.longitude && (
                                <CHEKIOActionButton
                                  variant="view"
                                  onClick={() => {
                                    setSelectedMarkForAudit(mark);
                                    setIsAuditMapModalOpen(true);
                                  }}
                                  title="Ver Mapa de Auditoría"
                                  className="h-auto w-auto px-3 py-1.5 gap-1.5"
                                >
                                  <MapPin className="h-4 w-4" />
                                  <span>Mapa</span>
                                </CHEKIOActionButton>
                              )}
                            </div>
                          </CHEKIOTableCell>
                        </CHEKIOTableRow>
                      );
                    })}
                  </CHEKIOTableBody>
                </CHEKIOTable>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-24">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
                  <Clock className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No hay marcaciones registradas
                </h3>
                <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
                  No se encontraron marcaciones para mostrar en esta pestaña.
                </p>
              </div>
            )}
          </div>
        )}
        {activeTab === "5" && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {assistance.AttemptMark && assistance.AttemptMark.length > 0 ? (
              <div className="overflow-x-auto">
                <CHEKIOTable className="rounded-none border-0 shadow-none">
                  <CHEKIOTableHeader>
                    <tr>
                      {ATTEMPT_MARKS_COLUMNS.map((column, index) => {
                        const Icon = (column as { icon?: typeof Clock }).icon;
                        return (
                          <CHEKIOTableHead
                            key={index}
                            className="min-w-[100px]"
                          >
                            <span
                              className="flex items-center gap-2"
                              style={{ color: templateUser.primary }}
                            >
                              {Icon && (
                                <Icon
                                  className="h-4 w-4"
                                  style={{
                                    color: `${templateUser.primary}99`,
                                  }}
                                />
                              )}
                              {column.header}
                            </span>
                          </CHEKIOTableHead>
                        );
                      })}
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        Acciones
                      </CHEKIOTableHead>
                    </tr>
                  </CHEKIOTableHeader>
                  <CHEKIOTableBody>
                    {assistance.AttemptMark.map(
                      (attempt: any, index: number) => (
                        <CHEKIOTableRow
                          key={attempt.publicId || index}
                          index={index}
                        >
                          {ATTEMPT_MARKS_COLUMNS.map((column, colIndex) => {
                            // Calcular el valor según la columna
                            const getValue = () => {
                              if (column.accessorFn) {
                                return column.accessorFn(attempt);
                              }
                              if ((column as any).accessorKey) {
                                return attempt[(column as any).accessorKey];
                              }
                              return null;
                            };

                            return (
                              <CHEKIOTableCell
                                key={colIndex}
                                className="px-5 py-3.5"
                              >
                                {column.cell
                                  ? column.cell({
                                      row: { original: attempt },
                                      getValue,
                                    } as any)
                                  : getValue()}
                              </CHEKIOTableCell>
                            );
                          })}
                          <CHEKIOTableCell className="px-5 py-3.5">
                            {attempt.latitude && attempt.longitude ? (
                              <CHEKIOActionButton
                                variant="view"
                                onClick={() =>
                                  handleOpenAttemptMapModal(attempt)
                                }
                                title="Ver Mapa de Auditoría"
                                className="h-auto w-auto px-3 py-1.5 gap-1.5"
                              >
                                <MapPin className="h-4 w-4" />
                                <span>Mapa</span>
                              </CHEKIOActionButton>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </CHEKIOTableCell>
                        </CHEKIOTableRow>
                      ),
                    )}
                  </CHEKIOTableBody>
                </CHEKIOTable>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-24">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
                  <Clock className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No hay intentos de marcaje registrados
                </h3>
                <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
                  No se encontraron intentos de marcación para mostrar.
                </p>
              </div>
            )}
          </div>
        )}
        {/* Photo comparison modal */}
        <PhotoComparisonModal />
      </div>
      )}
      {/* Audit Map Modal */}
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
      {/* Attempt Mark Audit Map Modal */}
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
      {assistance && (
        <>
          <ModalAutocompleteAssistance
            isOpen={isModalAutocompleteOpen}
            onClose={() => setIsModalAutocompleteOpen(false)}
            assistanceIds={[assistanceId]}
          />
          {isModalCompleteOpen && (
            <ModalCompleteAssistance
              isOpen={isModalCompleteOpen}
              onClose={() => setIsModalCompleteOpen(false)}
              assistance={assistance}
              cleanSelectedRows={() => {}}
            />
          )}
          <ModalIndividualAssignmentSchedule
            isOpen={isModalScheduleAssignmentOpen}
            onClose={() => setIsModalScheduleAssignmentOpen(false)}
            assistance={assistance}
            onSuccess={() => {
              void queryClient.invalidateQueries({
                queryKey: ["GetAssistance", assistanceId],
              });
            }}
          />
          <ModalAddAdditionalMark
            isOpen={isModalAddAdditionalMarkOpen}
            onClose={() => setIsModalAddAdditionalMarkOpen(false)}
            assistance={assistance}
            onSuccess={() => {
              void queryClient.invalidateQueries({
                queryKey: ["GetAssistance", assistanceId],
              });
            }}
          />
        </>
      )}
      <AlertConfirmModal
        open={isModalFreeDayOpen}
        onOpenChange={(open) => {
          setIsModalFreeDayOpen(open);
          if (!open) setConfirmationPhrase("");
        }}
        title="Dar día libre"
        variant="destructive"
        maxWidth="lg"
      >
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-800 mb-2">
                  Acción destructiva - Consecuencias
                </p>
                <p className="text-sm text-red-700 mb-2">
                  Al confirmar, se realizarán las siguientes acciones de forma
                  irreversible:
                </p>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1 mb-2">
                  <li>
                    Se eliminará permanentemente el registro de asistencia del
                    día
                  </li>
                  <li>
                    Se eliminarán todas las marcaciones asociadas (entrada,
                    salida, colaciones)
                  </li>
                  <li>Se registrará el día como día libre para el empleado</li>
                </ul>
                <p className="text-sm font-medium text-red-800">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Para confirmar, escriba exactamente:{" "}
              <span className="font-mono font-semibold text-gray-900">
                {FreeDayConfirmationPhrase.CONFIRM}
              </span>
            </label>
            <CHEKIOInput
              type="text"
              value={confirmationPhrase}
              onChange={(e) => setConfirmationPhrase(e.target.value)}
              placeholder={FreeDayConfirmationPhrase.CONFIRM}
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-4 pt-2">
            <CHEKIOButton
              variant="secondary"
              onClick={() => {
                setIsModalFreeDayOpen(false);
                setConfirmationPhrase("");
              }}
              disabled={isFreeDayPending}
            >
              Cancelar
            </CHEKIOButton>
            <CHEKIOButton
              variant="destructive"
              onClick={async () => {
                if (!canEditAssistanceByDate) {
                  dateLockToast();
                  setIsModalFreeDayOpen(false);
                  setConfirmationPhrase("");
                  return;
                }
                if (!isFreeDayConfirmationValid(confirmationPhrase)) {
                  toast({
                    title: "Frase de confirmación incorrecta",
                    description: `Debe escribir exactamente "${FreeDayConfirmationPhrase.CONFIRM}"`,
                    variant: "destructive",
                  });
                  return;
                }
                try {
                  await setFreeDayFromAssistance({
                    assistanceId,
                    confirmationPhrase: confirmationPhrase.trim(),
                  });
                  toast({
                    title: "Día libre asignado",
                    description:
                      "La asistencia ha sido eliminada y el día libre ha sido registrado correctamente",
                  });
                  setIsModalFreeDayOpen(false);
                  setConfirmationPhrase("");
                  onClose();
                } catch (error: unknown) {
                  toast({
                    title: "Error al asignar día libre",
                    description: getAxiosErrorMessage(error),
                    variant: "destructive",
                  });
                }
              }}
              disabled={
                isFreeDayPending ||
                !canEditAssistanceByDate ||
                !isFreeDayConfirmationValid(confirmationPhrase)
              }
            >
              {isFreeDayPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                "Confirmar y dar día libre"
              )}
            </CHEKIOButton>
          </div>
        </div>
      </AlertConfirmModal>
    </CHEKIOModal>
  );
};

export default ModalMarcaciones;
