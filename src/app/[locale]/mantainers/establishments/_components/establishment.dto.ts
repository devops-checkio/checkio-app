import { PaginationFilterDto } from "@/dto/pagination";

export enum EstablishmentGeolocationType {
  MIXED = "MIXED",
  CHECK_IN = "CHECK_IN",
  CHECK_OUT = "CHECK_OUT",
}

export interface EstablishmentGeolocationDto {
  publicId: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  type?: EstablishmentGeolocationType;
}

export interface EstablishmentGeolocationCreateDto {
  publicId?: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  type?: EstablishmentGeolocationType;
}

export interface EstablishmentGeolocationUpdateDto
  extends EstablishmentGeolocationCreateDto {
  publicId: string;
}

export interface EstablishmentResponseDto {
  publicId: string;
  code: string;
  name: string;
  address: string;
  phone?: string;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  companies: string[];
  geolocations?: EstablishmentGeolocationDto[];
}

export interface EstablishmentCreateDto {
  code: string;
  name: string;
  address: string;
  phone?: string;
  timezone: string;
  isActive?: boolean;
  companies?: string[];
  geolocations?: EstablishmentGeolocationCreateDto[];
}

export interface EstablishmentUpdateDto {
  code?: string;
  name?: string;
  address?: string;
  phone?: string;
  timezone?: string;
  isActive?: boolean;
  companies?: string[];
  geolocations?: EstablishmentGeolocationUpdateDto[];
}

export type EstablishmentSortBy =
  | "createdAt"
  | "updatedAt"
  | "code"
  | "name"
  | "address";

export interface EstablishmentFindAllDto {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  sortBy?: EstablishmentSortBy;
  sortOrder?: "asc" | "desc";
  search?: string;
  companyId?: string;
}

export interface PaginationEstablishmentDto {
  data: EstablishmentResponseDto[];
  pagination: PaginationFilterDto;
}

export enum EstablishmentAttendanceMode {
  DAY = "DAY",
  PERIOD = "PERIOD",
}

export enum EstablishmentAttendanceOperationalStatus {
  ALL = "ALL",
  PRESENT = "PRESENT",
  INSIDE = "INSIDE",
  EXITED = "EXITED",
  ABSENT = "ABSENT",
  NOT_ARRIVED = "NOT_ARRIVED",
  INCOMPLETE = "INCOMPLETE",
  WITHOUT_SCHEDULE = "WITHOUT_SCHEDULE",
}

export enum EstablishmentAttendanceMarkType {
  CHECK_IN = "CHECK_IN",
  CHECK_OUT = "CHECK_OUT",
}

export enum EstablishmentAttendanceMarkStatus {
  WAITING_APPROVAL = "WAITING_APPROVAL",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export enum EstablishmentAttendanceAssistanceStatus {
  INCOMPLETE = "INCOMPLETE",
  COMPLETED = "COMPLETED",
  ABSENT = "ABSENT",
  WITHOUT_SCHEDULE = "WITHOUT_SCHEDULE",
}

export interface EstablishmentAttendanceFindDto {
  companyId: string;
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  mode?: EstablishmentAttendanceMode;
  date?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: EstablishmentAttendanceOperationalStatus;
}

export interface EstablishmentAttendanceSummaryDto {
  expectedCount: number;
  presentCount: number;
  absentCount: number;
  incompleteCount: number;
  withoutScheduleCount: number;
  insideCount: number;
  exitedCount: number;
  notArrivedCount: number;
  lateCount: number;
  earlyDepartureCount: number;
  missingCheckoutCount: number;
  presencePercentage: number;
  absenteeismPercentage: number;
  totalMinutesInside: number;
  averageMinutesInside: number;
}

export interface EstablishmentAttendanceStudentDto {
  publicId: string;
  establishmentPublicId?: string;
  employeeSchedulePublicId: string;
  assistancePublicId?: string;
  date: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  documentNumber?: string;
  documentType?: string;
  scheduleName?: string;
  scheduleStartAt?: string;
  scheduleEndAt?: string;
  firstCheckInAt?: string;
  lastCheckOutAt?: string;
  lastMarkType?: EstablishmentAttendanceMarkType;
  assistanceStatus?: EstablishmentAttendanceAssistanceStatus;
  operationalStatus: EstablishmentAttendanceOperationalStatus;
  isPresent: boolean;
  isInside: boolean;
  hasExited: boolean;
  hasMissingCheckout: boolean;
  minutesInside: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  marksCount: number;
  pendingMarksCount: number;
  rejectedMarksCount: number;
  manualMarksCount: number;
  additionalMarksCount: number;
}

export interface EstablishmentAttendanceStatusBreakdownDto {
  status: EstablishmentAttendanceOperationalStatus;
  label: string;
  count: number;
}

export interface EstablishmentAttendanceTrendDto {
  date: string;
  expectedCount: number;
  presentCount: number;
  absentCount: number;
  absenteeismPercentage: number;
}

export interface EstablishmentAttendanceHistogramBucketDto {
  label: string;
  checkInCount: number;
  checkOutCount: number;
}

export interface EstablishmentAttendanceDistributionBucketDto {
  label: string;
  minMinutes: number;
  maxMinutes?: number;
  count: number;
}

export interface EstablishmentAttendanceHeatmapCellDto {
  weekday: number;
  weekdayLabel: string;
  hour: number;
  value: number;
}

export interface EstablishmentAttendanceTimelineEventDto {
  publicId?: string;
  employeePublicId: string;
  employeeName: string;
  timestamp: string;
  type: EstablishmentAttendanceMarkType;
  status: EstablishmentAttendanceMarkStatus;
  isManual: boolean;
  isAditional: boolean;
}

export interface EstablishmentAttendanceInsightDto {
  type: string;
  title: string;
  description: string;
  value: number;
  employeePublicId?: string;
}

export interface EstablishmentAttendanceChartsDto {
  statusBreakdown: EstablishmentAttendanceStatusBreakdownDto[];
  absenteeismTrend: EstablishmentAttendanceTrendDto[];
  markingHistogram: EstablishmentAttendanceHistogramBucketDto[];
  minutesInsideDistribution: EstablishmentAttendanceDistributionBucketDto[];
  weekdayHourHeatmap: EstablishmentAttendanceHeatmapCellDto[];
  timeline: EstablishmentAttendanceTimelineEventDto[];
}

export interface EstablishmentAttendanceMetadataDto {
  establishmentId: string;
  companyId: string;
  mode: EstablishmentAttendanceMode;
  date?: string;
  startDate: string;
  endDate: string;
  timezone: string;
  lastUpdatedAt: string;
  isToday: boolean;
  autoRefreshSeconds: number;
}

export interface EstablishmentAttendanceDashboardDto {
  summary: EstablishmentAttendanceSummaryDto;
  students: EstablishmentAttendanceStudentDto[];
  pagination: PaginationFilterDto;
  charts: EstablishmentAttendanceChartsDto;
  insights: EstablishmentAttendanceInsightDto[];
  metadata: EstablishmentAttendanceMetadataDto;
}

export enum GlobalEstablishmentAttendanceRiskLevel {
  OK = "OK",
  ATTENTION = "ATTENTION",
  CRITICAL = "CRITICAL",
}

export enum GlobalEstablishmentAttendanceSortBy {
  RISK = "risk",
  ABSENTEEISM = "absenteeism",
  PRESENCE = "presence",
  NAME = "name",
  CODE = "code",
}

export interface GlobalEstablishmentAttendanceFindDto {
  companyId: string;
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  mode?: EstablishmentAttendanceMode;
  date?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: EstablishmentAttendanceOperationalStatus;
  riskLevel?: GlobalEstablishmentAttendanceRiskLevel;
  sortBy?: GlobalEstablishmentAttendanceSortBy;
}

export interface GlobalEstablishmentAttendanceSummaryDto extends EstablishmentAttendanceSummaryDto {
  criticalCentersCount: number;
  attentionCentersCount: number;
  centersWithActivityCount: number;
}

export interface GlobalEstablishmentAttendanceCenterDto {
  establishmentId: string;
  code: string;
  name: string;
  address: string;
  timezone: string;
  summary: EstablishmentAttendanceSummaryDto;
  riskLevel: GlobalEstablishmentAttendanceRiskLevel;
  lastMarkAt?: string;
}

export interface GlobalEstablishmentPresenceByCenterDto {
  establishmentId: string;
  code: string;
  name: string;
  presencePercentage: number;
}

export interface GlobalEstablishmentAbsenteeismByCenterDto {
  establishmentId: string;
  name: string;
  absenteeismPercentage: number;
  absentCount: number;
}

export interface GlobalEstablishmentAttendanceChartsDto {
  presenceByEstablishment: GlobalEstablishmentPresenceByCenterDto[];
  absenteeismByEstablishment: GlobalEstablishmentAbsenteeismByCenterDto[];
  markingHistogram: EstablishmentAttendanceHistogramBucketDto[];
  weekdayHourHeatmap: EstablishmentAttendanceHeatmapCellDto[];
  absenteeismTrend: EstablishmentAttendanceTrendDto[];
}

export interface GlobalEstablishmentAttendanceMetadataDto {
  companyId: string;
  mode: EstablishmentAttendanceMode;
  date?: string;
  startDate: string;
  endDate: string;
  timezone: string;
  lastUpdatedAt: string;
  totalEstablishments: number;
  autoRefreshSeconds: number;
}

export interface GlobalEstablishmentAttendanceDashboardDto {
  summary: GlobalEstablishmentAttendanceSummaryDto;
  establishments: GlobalEstablishmentAttendanceCenterDto[];
  ranking: GlobalEstablishmentAttendanceCenterDto[];
  charts: GlobalEstablishmentAttendanceChartsDto;
  metadata: GlobalEstablishmentAttendanceMetadataDto;
  pagination: PaginationFilterDto;
}
