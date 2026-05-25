import { PaginationFilterDto, PaginationRequestDto } from "@/dto/pagination";

export interface OvertimeRequestResponseDto {
  id: number;
  publicId: string;
  employeeAssignedId: number;
  employeeName?: string;
  employeeEmail?: string;
  observation?: string;
  type: OvertimeRequestType;
  startDate?: string | Date;
  endDate?: string | Date;
  aditionHoursBeforeMinutes?: number;
  aditionHoursAfterMinutes?: number;
  status: OvertimeRequestStatus;
  authorizedBy?: string;
  authorizedByName?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  approvedAt?: string | Date;
  rejectedAt?: string | Date;
  rejectionReason?: string;
  documentUrl?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdByName?: string;
}

export enum OvertimeRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum OvertimeRequestType {
  PER_SCHEDULE = "PER_SCHEDULE",
  PER_HOURS = "PER_HOURS",
}

/**
 * `startDate` / `endDate` se envían como ISO 8601 UTC. Pueden incluir hora (p. ej. ventana
 * PER_SCHEDULE) o inicio de día para PER_HOURS según construye el cliente.
 */
export interface OvertimeRequestCreateDto {
  employeeAssignedId: string;
  type: OvertimeRequestType;
  observation?: string;
  startDate?: string;
  endDate?: string;
  aditionHoursBeforeMinutes?: number;
  aditionHoursAfterMinutes?: number;
  documentUrl?: string;
}

export interface OvertimeRequestUpdateDto {
  publicId: string;
  type?: OvertimeRequestType;
  observation?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  aditionHoursBeforeMinutes?: number;
  aditionHoursAfterMinutes?: number;
  documentUrl?: string;
}

export interface OvertimeRequestApproveDto {
  publicId: string;
  authorizedBy: string;
}

export interface OvertimeRequestRejectDto {
  rejectedBy: string;
  rejectionReason: string;
}

export interface OvertimeRequestFindFilterDto extends PaginationRequestDto {
  search?: string;
  employeeId?: string;
  status?: OvertimeRequestStatus;
  type?: OvertimeRequestType;
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
  companyId?: string;
  createdBy?: string;
}

export interface PaginationOvertimeRequestDto {
  pagination: PaginationFilterDto;
  data: OvertimeRequestResponseDto[];
}

export interface OvertimeRequestStatsDto {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

