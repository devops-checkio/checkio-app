import { DateTime } from "luxon";

import {
  FaceRecognitionConfidenceLevel,
  FaceRecognitionStatus,
  MarkDto,
} from "../../_components/assistance.dto";

export type FaceRecognitionDisplayStatus =
  | FaceRecognitionStatus
  | "UNAVAILABLE";

type FaceRecognitionMeta = {
  badgeClassName: string;
  description: string;
  label: string;
};

type FaceRecognitionConfidenceMeta = {
  accentClassName: string;
  badgeClassName: string;
  label: string;
};

const STATUS_META: Record<FaceRecognitionDisplayStatus, FaceRecognitionMeta> = {
  MATCH: {
    label: "Coincide",
    description: "La verificacion facial encontro coincidencia con la foto de ficha.",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  NO_MATCH: {
    label: "No coincide",
    description: "La comparacion facial no logro validar la identidad de la marca.",
    badgeClassName: "border-red-200 bg-red-50 text-red-700",
  },
  SKIPPED: {
    label: "Omitida",
    description: "La verificacion no se ejecuto por una condicion operativa.",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
  },
  ERROR: {
    label: "Error",
    description: "La verificacion fallo y requiere revision operativa.",
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
  },
  PENDING: {
    label: "Pendiente",
    description: "La verificacion facial aun no finaliza.",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
  },
  UNAVAILABLE: {
    label: "Sin foto",
    description: "No existe foto de marcacion disponible para auditar.",
    badgeClassName: "border-gray-200 bg-gray-50 text-gray-600",
  },
};

const CONFIDENCE_META: Record<string, FaceRecognitionConfidenceMeta> = {
  [FaceRecognitionConfidenceLevel.HIGH]: {
    label: "Alta",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    accentClassName: "bg-emerald-500",
  },
  [FaceRecognitionConfidenceLevel.MEDIUM]: {
    label: "Media",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    accentClassName: "bg-amber-500",
  },
  [FaceRecognitionConfidenceLevel.LOW]: {
    label: "Baja",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
    accentClassName: "bg-orange-500",
  },
  [FaceRecognitionConfidenceLevel.VERY_LOW]: {
    label: "Muy baja",
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
    accentClassName: "bg-rose-500",
  },
};

const REASON_LABELS: Record<string, string> = {
  strong_match: "Coincidencia clara",
  borderline_match: "Coincidencia cercana al umbral",
  near_threshold_reject: "Rechazo cercano al umbral",
  distance_above_threshold: "Distancia facial sobre el umbral",
  MISSING_PHOTO: "Falta foto de referencia o de marcacion",
  NO_CONSENT: "No existe consentimiento para validar con foto",
  S3_DOWNLOAD_FAILED: "No fue posible descargar las fotos desde S3",
  PYTHON_API_ERROR: "La API de reconocimiento facial respondio con error",
  FACE_RECOGNITION_REQUEST_FAILED: "No se pudo completar la solicitud de reconocimiento facial",
  FACE_RECOGNITION_RESPONSE_INVALID: "La respuesta del servicio facial fue invalida",
  SKIPPED: "Proceso omitido",
};

export const getFaceRecognitionDisplayStatus = (
  mark: Pick<MarkDto, "faceRecognitionStatus" | "photoUrl">,
): FaceRecognitionDisplayStatus => {
  if (mark.faceRecognitionStatus) {
    return mark.faceRecognitionStatus;
  }

  if (!mark.photoUrl) {
    return "UNAVAILABLE";
  }

  return FaceRecognitionStatus.PENDING;
};

export const getFaceRecognitionStatusMeta = (
  mark: Pick<MarkDto, "faceRecognitionStatus" | "photoUrl">,
): FaceRecognitionMeta => {
  const status = getFaceRecognitionDisplayStatus(mark);
  return STATUS_META[status];
};

export const getFaceRecognitionConfidenceMeta = (
  level?: string | null,
): FaceRecognitionConfidenceMeta | null => {
  if (!level) {
    return null;
  }

  return CONFIDENCE_META[level] ?? null;
};

export const formatFaceRecognitionReason = (
  reason?: string | null,
): string | null => {
  if (!reason) {
    return null;
  }

  return REASON_LABELS[reason] ?? reason.replaceAll("_", " ");
};

export const formatFaceRecognitionDate = (
  value?: string | null,
): string | null => {
  if (!value) {
    return null;
  }

  const parsed = DateTime.fromISO(value);
  if (!parsed.isValid) {
    return value;
  }

  return parsed.toUTC().toFormat("dd/MM/yyyy HH:mm:ss");
};

const getPayloadObject = (payload: unknown): Record<string, unknown> | null => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  return payload as Record<string, unknown>;
};

export const getFaceRecognitionTechnicalDetails = (
  mark: Pick<
    MarkDto,
    | "faceRecognitionPayload"
    | "faceRecognitionAccepted"
    | "faceRecognitionDistance"
    | "faceRecognitionScore"
  >,
): Array<{ label: string; value: string }> => {
  const payload = getPayloadObject(mark.faceRecognitionPayload);
  const results = getPayloadObject(payload?.results);
  const metadata = getPayloadObject(payload?.metadata);
  const image1 = getPayloadObject(metadata?.image1);
  const image2 = getPayloadObject(metadata?.image2);
  const details: Array<{ label: string; value: string }> = [];

  if (typeof mark.faceRecognitionAccepted === "boolean") {
    details.push({
      label: "Decision automatica",
      value: mark.faceRecognitionAccepted ? "Aceptada" : "Rechazada",
    });
  }

  if (typeof mark.faceRecognitionScore === "number") {
    details.push({
      label: "Score comparativo",
      value: `${mark.faceRecognitionScore.toFixed(1)}%`,
    });
  }

  if (typeof mark.faceRecognitionDistance === "number") {
    details.push({
      label: "Distancia facial",
      value: mark.faceRecognitionDistance.toFixed(4),
    });
  }

  if (typeof results?.threshold_used === "number") {
    details.push({
      label: "Umbral usado",
      value: Number(results.threshold_used).toFixed(2),
    });
  }

  if (typeof image1?.ok === "boolean") {
    details.push({
      label: "Foto de ficha",
      value: image1.ok ? "Analizada correctamente" : "Con observaciones",
    });
  }

  if (typeof image2?.ok === "boolean") {
    details.push({
      label: "Foto de marcacion",
      value: image2.ok ? "Analizada correctamente" : "Con observaciones",
    });
  }

  return details;
};
