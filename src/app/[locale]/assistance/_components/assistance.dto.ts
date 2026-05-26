import { GeolocationZoneDto } from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import { PaginationFilterDto } from "@/dto/pagination";

export enum AssistanceStatus {
  INCOMPLETE = "INCOMPLETE",
  COMPLETED = "COMPLETED",
  ABSENT = "ABSENT",
  WITHOUT_SCHEDULE = "WITHOUT_SCHEDULE",
}

export type AssistanceCountDto = {
  absentCount: number;
  completedCount: number;
  incompleteCount: number;
  withoutScheduleCount: number;
  markPendingCount: number;
  markRejectedCount: number;
  extraPendingApprovalCount?: number;
  delayPendingApprovalCount?: number;
};

export type AssistanceSecondsApprovalUpdateDto = {
  status: "APPROVED" | "REJECTED";
  approvedSeconds?: number;
};
export type RegisterMarkToDoDto = {
  scheduleId: string;

  withDiscount: boolean;

  scheduleBreakId?: string;

  isAditional: boolean;

  time: string;

  type: "CHECK_IN" | "CHECK_OUT";

  isOffline?: boolean;

  authorizedZones?: GeolocationZoneDto[];

  isWithinAuthorizedZone?: boolean;

  isWithinWithMargin?: boolean;

  latitude?: number;

  longitude?: number;
};
export type AssistanceCountFindAllDto = {
  companyId: string;
  /** Formato YYYY-MM (ej. "2025-02"). Si se envía, tiene prioridad sobre startDate/endDate */
  month?: string;
  /** Fecha inicio en formato ISO YYYY-MM-DD */
  startDate?: string;
  /** Fecha fin en formato ISO YYYY-MM-DD */
  endDate?: string;
  /** Día único en formato ISO YYYY-MM-DD */
  date?: string;
  year?: number;
  /** Filtrar por sucursal (publicId) */
  branchId?: string;
  /** Filtrar por cargo (publicId) */
  jobId?: string;
  /** Filtrar por tipo de persona */
  personType?: "EMPLOYEE" | "STUDENT";
  /** Filtrar por establecimiento (publicId) */
  establishmentId?: string;
  documentNumber?: string;
  search?: string;
};

export function buildAssistanceSummaryParams(
  companyId: string,
  filter: Record<string, unknown>,
  extras?: Partial<AssistanceCountFindAllDto>,
): AssistanceCountFindAllDto {
  const base: AssistanceCountFindAllDto = {
    companyId,
    personType: filter.personType as AssistanceCountFindAllDto["personType"],
    branchId: filter.branchId as string | undefined,
    jobId: filter.jobId as string | undefined,
    search: filter.search as string | undefined,
    documentNumber: filter.documentNumber as string | undefined,
    establishmentId: filter.establishmentId as string | undefined,
    ...extras,
  };

  if (filter.month) {
    return { ...base, month: filter.month as string };
  }
  if (filter.date) {
    return { ...base, date: filter.date as string };
  }
  if (filter.year) {
    return {
      ...base,
      year: filter.year as number,
      startDate: `${filter.year}-01-01`,
      endDate: `${filter.year}-12-31`,
    };
  }

  const defaultStart = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toLocaleDateString("en-CA");
  const defaultEnd = new Date().toLocaleDateString("en-CA");

  return {
    ...base,
    startDate:
      (filter.startDate as string | undefined) ??
      (filter.dateRangeStart as string | undefined) ??
      defaultStart,
    endDate:
      (filter.endDate as string | undefined) ??
      (filter.dateRangeEnd as string | undefined) ??
      defaultEnd,
  };
}

export type AssistanceFindAllDto = {
  employeeId?: number;
  companyId?: string;
  scheduleId?: number;
  _timestamp?: any;
  status?: AssistanceStatus;

  includeMarks?: boolean;
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  documentNumber?: string;
  branchId?: string;
  jobId?: string;
  search?: string;
  personType?: "EMPLOYEE" | "STUDENT";
  date?: string;
  month?: string;
  year?: string;
  startDate?: string;
  endDate?: string;
  extraApproval?: "PENDING";
  delayApproval?: "PENDING";
  /** Filtrar por establecimiento (publicId) */
  establishmentId?: string;
};

export type EmployeeAssistanceResponseDto = {
  publicId: string;

  firstName: string;

  lastName: string;
  secondLastName: string;

  documentNumber: string;

  documentType: string;
  personType?: "EMPLOYEE" | "STUDENT";
  Establishment?: { publicId: string; name: string };
};

export enum FaceRecognitionStatus {
  PENDING = "PENDING",
  MATCH = "MATCH",
  NO_MATCH = "NO_MATCH",
  SKIPPED = "SKIPPED",
  ERROR = "ERROR",
}

export enum FaceRecognitionConfidenceLevel {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  VERY_LOW = "very_low",
}

export type MarkDto = {
  status: MarkStatus;
  publicId?: string;

  type: "CHECK_IN" | "CHECK_OUT";

  timestamp: string;

  hash: string;

  scheduleBreakPublicId?: string | null;

  isOfficial: boolean;
  isAditional: boolean;
  isManual: boolean;
  isGenerated?: boolean;
  isOffline?: boolean;
  isManuallyTyped: boolean;

  adjustmentNote?: string;

  authorizedZones?: GeolocationZoneDto[];

  isWithinAuthorizedZone?: boolean;

  isWithinWithMargin?: boolean;

  latitude?: number;

  longitude?: number;

  photoUrl?: string;
  employeePhotoUrl?: string;
  scheduleId?: string;
  observacion?: string | null;
  modificada?: boolean;
  faceRecognitionStatus?: FaceRecognitionStatus;
  faceRecognitionAccepted?: boolean | null;
  faceRecognitionReason?: string | null;
  faceRecognitionScore?: number | null;
  faceRecognitionDistance?: number | null;
  faceRecognitionConfidenceLevel?:
    | FaceRecognitionConfidenceLevel
    | string
    | null;
  faceRecognitionProcessedAt?: string | null;
  faceRecognitionPayload?: unknown;
};

export enum AttemptMarkStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum MarkStatus {
  WAITING_APPROVAL = "WAITING_APPROVAL",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export type AttemptMarkDto = {
  publicId: string;

  assistanceId: number;

  timezone: string;

  createdAt: string;

  updatedAt: string;

  expiresAt: string;

  errorCode: string | null;

  latitude: number;

  longitude: number;

  ipAddress: string;

  markId?: number;

  status: AttemptMarkStatus;

  // Campos adicionales para auditoría de geolocalización
  authorizedZones?: string | GeolocationZoneDto[];

  isWithinAuthorizedZone?: boolean;

  isWithinWithMargin?: boolean;

  key?: string;
};

export type AttemptMarkSearchDto = {
  ipAddress: string;
  latitude: string;
  longitude: string;
};

export type AssistanceScheduleSlotDto = {
  publicId: string;
  sortOrder: number;
  expectedMarks: number;
  delaySeconds: number;
  extraSeconds: number;
  earlyDepartureSeconds: number;
  status: AssistanceStatus;
  Schedule?: {
    publicId: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  Marks: MarkDto[];
};

export type AssistanceResponseDto = {
  publicId: string;

  day: number;

  month: number;

  year: number;

  status: AssistanceStatus;

  delaySeconds?: number;
  extraSeconds?: number;
  earlyDepartureSeconds?: number;
  extraSecondsApprovalStatus?: string | null;
  delaySecondsApprovalStatus?: string | null;
  approvedExtraSeconds?: number | null;
  approvedDelaySeconds?: number | null;
  hasTimeBank?: boolean;

  Marks: MarkDto[];

  AttemptMark: AttemptMarkDto[];

  Employee: EmployeeAssistanceResponseDto;
  Shift: {
    publicId: string;

    name: string;

    start: string;

    end: string;
  };
  Schedule: {
    publicId: string;
    startDate: string;
    name: string;
    endDate: string;
  };
  resume: {
    atrasoEntrada: number;
    atrasoSalida: number;
    excesoColacion: number;
    marcacionCompleta: boolean;
    totalHorasTrabajadas: number;
    horasExtras: number;
  };
  subjectType?: "EMPLOYEE" | "STUDENT";
  Slots?: AssistanceScheduleSlotDto[];
};

export type PaginationAssistanceDto = {
  pagination: PaginationFilterDto;

  data: AssistanceResponseDto[];
};

export type AssistanceBreakCompleteDto = {
  startTime: string;
  endTime: string;
  publicId: string;
};

export type AssistanceCompleteManualDto = {
  startTime: string;
  endTime: string;
  breaks: AssistanceBreakCompleteDto[];
  adjustmentNote?: string;
};

export type CreateAdditionalMarkDto = {
  type: "CHECK_IN" | "CHECK_OUT";
  time: string;
  adjustmentNote?: string;
  scheduleId?: string;
};

export type AssistanceBulkCreateDto = {
  employeePublicIds: string[];
  dates: string[];
};
