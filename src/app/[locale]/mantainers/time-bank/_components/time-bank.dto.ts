import { PaginationFilterDto } from "@/dto/pagination";

// Time Bank Type Enum (from backend)
export enum TimeBankType {
  ECONOMIC_HOURS = "ECONOMIC_HOURS", // Compensación por hora económica
  REST_DAYS = "REST_DAYS", // Compensación por días de descanso
}

// Time Bank Transaction Type Enum (from backend)
export enum TimeBankTransactionType {
  ADD = "ADD",
  SUBTRACT = "SUBTRACT",
  ADJUSTMENT = "ADJUSTMENT",
}

// Time Bank Transaction Status Enum (from backend)
export enum TimeBankTransactionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// Time Bank Status Enum (derived from dates)
export enum TimeBankStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
}

// Time Bank Type Options for UI
export const TimeBankTypeOptions = [
  {
    value: TimeBankType.ECONOMIC_HOURS,
    label: "Compensación por Hora Económica",
    description: "Acumulación de horas extras para compensación económica",
  },
  {
    value: TimeBankType.REST_DAYS,
    label: "Compensación por Días de Descanso",
    description: "Acumulación de horas para días de descanso",
  },
];

// Time Bank Transaction Type Options for UI
export const TimeBankTransactionTypeOptions = [
  {
    value: TimeBankTransactionType.ADD,
    label: "Agregar Horas",
    description: "Agregar horas al banco de tiempo",
  },
  {
    value: TimeBankTransactionType.SUBTRACT,
    label: "Descontar Horas",
    description: "Descontar horas del banco de tiempo",
  },
  {
    value: TimeBankTransactionType.ADJUSTMENT,
    label: "Ajuste",
    description: "Ajuste manual de horas",
  },
];

// Time Bank Transaction Status Options for UI
export const TimeBankTransactionStatusOptions = [
  {
    value: TimeBankTransactionStatus.PENDING,
    label: "Pendiente",
    color: "orange",
  },
  {
    value: TimeBankTransactionStatus.APPROVED,
    label: "Aprobada",
    color: "green",
  },
  {
    value: TimeBankTransactionStatus.REJECTED,
    label: "Rechazada",
    color: "red",
  },
];

// Time Bank Configuration
export interface TimeBankConfig {
  hoursPerDay: number; // Horas equivalentes a un día de descanso
  maxDurationMonths: number;
  allowNegativeBalance: boolean;
  autoExpireEnabled: boolean;
  autoExpireDays: number;
}

// Time Bank Create DTO (matches backend API)
export interface CreateTimeBankDto {
  employeeId: string;
  type: TimeBankType;
  hoursPerDay: number;
  startDate: string;
  endDate: string;
  availableHours: number;
  integrationCode?: string;
}

// Time Bank Update DTO (matches backend API)
export interface UpdateTimeBankDto {
  startDate?: string;
  endDate?: string;
  type?: TimeBankType;
  hoursPerDay?: number;
  availableHours?: number;
  usedHours?: number;
  integrationCode?: string;
}

// Time Bank Response DTO (matches backend API)
export interface TimeBankResponseDto {
  id: number;
  publicId: string;
  startDate: string;
  endDate: string;
  type: TimeBankType;
  hoursPerDay: number;
  availableHours: number;
  usedHours: number;
  integrationCode?: string;
  employeeId: number;
  employeePublicId?: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  employeeName?: string;
  employeeEmail?: string;
}

// Time Bank Transaction Create DTO (matches backend API)
export interface CreateTimeBankTransactionDto {
  timeBankId: string;
  type: TimeBankTransactionType;
  amount: number;
  integrationCode?: string;
}

// Time Bank Transaction Update DTO (matches backend API)
export interface UpdateTimeBankTransactionDto {
  type?: TimeBankTransactionType;
  amount?: number;
  integrationCode?: string;
}

// Time Bank Transaction Reject DTO (matches backend API)
export interface TimeBankTransactionRejectDto {
  rejectedBy: string;
  rejectionReason: string;
}

// Time Bank Transaction Response DTO (matches backend API)
export interface TimeBankTransactionResponseDto {
  id: number;
  publicId: string;
  timeBankId: number;
  type: TimeBankTransactionType;
  amount: number;
  status: TimeBankTransactionStatus;
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  integrationCode?: string;
  createdAt: string;
  updatedAt: string;
  requestedByName?: string;
  approvedByName?: string;
  rejectedByName?: string;
}

// Time Bank KPI DTO
export interface TimeBankKpiDto {
  totalEmployeesWithTimeBank: number;
  totalEmployeesWithoutTimeBank: number;
  totalAccumulatedHours: number;
  averageHoursPerEmployee: number;
  totalUsedHours: number;
  totalAvailableHours: number;
  activeTimeBanks: number;
  expiredTimeBanks: number;
}

// Time Bank Config DTO
export interface TimeBankConfigDto {
  id: string;
  publicId: string;
  companyId: string;
  hoursPerDay: number;
  maxDurationMonths: number;
  allowNegativeBalance: boolean;
  autoExpireEnabled: boolean;
  autoExpireDays: number;
  createdAt: string;
  updatedAt: string;
}

// Time Bank Config Update DTO
export interface TimeBankConfigUpdateDto {
  publicId: string;
  hoursPerDay: number;
  maxDurationMonths: number;
  allowNegativeBalance: boolean;
  autoExpireEnabled: boolean;
  autoExpireDays: number;
}

// Employee Time Bank Summary DTO
export interface EmployeeTimeBankSummaryDto {
  employeeId: string;
  employeeName: string;
  documentNumber: string;
  documentType: string;
  hasTimeBank: boolean;
}

// Pagination DTOs (matches backend API)
export interface PaginationTimeBankDto {
  pagination: PaginationFilterDto;
  data: TimeBankResponseDto[];
}

export interface PaginationTimeBankTransactionDto {
  pagination: PaginationFilterDto;
  data: TimeBankTransactionResponseDto[];
}

export interface PaginationEmployeeTimeBankSummaryDto {
  pagination: PaginationFilterDto;
  data: EmployeeTimeBankSummaryDto[];
}

// Stats DTOs (matches backend API - TimeBankStatsDto)
export interface TimeBankStatsDto {
  total: number;
  active: number;
  expired: number;
  pending: number;
  approved: number;
}

export interface TimeBankTransactionStatsDto {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

// Filter DTOs (matches backend API)
export interface TimeBankFindFilterDto {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  companyId?: string;
  employeeId?: string;
  type?: TimeBankType;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: string; // active, expired, all
}

// Time Bank Transaction Filter DTO (matches backend API)
export interface TimeBankTransactionFindFilterDto {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  companyId?: string;
  timeBankId?: string;
  employeeId?: string;
  type?: TimeBankTransactionType;
  status?: TimeBankTransactionStatus;
  requestedBy?: string;
  search?: string;
}

// Accumulated hours per pacto for an employee
export interface TimeBankAccumulatedHoursItemDto {
  publicId: string;
  type: TimeBankType;
  availableHours: number;
  usedHours: number;
  startDate: string;
  endDate: string;
}

export interface EmployeeTimeBankAccumulatedHoursResponseDto {
  employeePublicId: string;
  data: TimeBankAccumulatedHoursItemDto[];
}

// Employee with TimeBank DTOs (matches backend API)
export interface EmployeeWithTimeBankResponseDto {
  id: number;
  publicId: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  personalEmail: string;
  startDate: string;
  endDate?: string;
  isIndefiniteTerm: boolean;
  contractedHours: number;
  timeBank?: TimeBankResponseDto;
}

export interface EmployeeWithTimeBankFindFilterDto {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  companyId?: string;
  search?: string;
  status?: string; // active, expired, all
}

export interface PaginationEmployeeWithTimeBankDto {
  pagination: PaginationFilterDto;
  data: EmployeeWithTimeBankResponseDto[];
}

// Default values
export const DEFAULT_TIME_BANK_CONFIG: TimeBankConfig = {
  hoursPerDay: 8,
  maxDurationMonths: 12,
  allowNegativeBalance: false,
  autoExpireEnabled: true,
  autoExpireDays: 30,
};
