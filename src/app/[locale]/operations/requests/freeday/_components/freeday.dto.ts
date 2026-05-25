import { PaginationFilterDto, PaginationRequestDto } from "@/dto/pagination";

export interface FreedayRequestResponseDto {
  id: number;
  publicId: string;
  employeeId: number;
  /** PublicId del empleado titular; alineado con `profile.user.employeeId` en sesión */
  employeePublicId?: string;
  employeeName?: string;
  employeeEmail?: string;
  reason?: string;
  absenceTypeId?: string;
  absenceTypeName?: string;
  startDate: string | Date;
  endDate: string | Date;
  observation?: string;
  withSalary: boolean;
  isTimeBankCharge?: boolean;
  status: FreedayRequestStatus;
  requestedBy: string;
  requestedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  approvedAt?: string | Date;
  rejectedAt?: string | Date;
  rejectionReason?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export enum FreedayRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface FreedayRequestCreateDto {
  employeeId: string;
  reason?: string;
  absenceTypeId?: string;
  startDate: string;
  endDate: string;
  observation?: string;
  withSalary: boolean;
  isTimeBankCharge?: boolean;
  timeBankId?: string;
}

export interface FreedayRequestUpdateDto {
  publicId: string;
  reason?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  observation?: string;
  withSalary?: boolean;
}

export interface FreedayRequestApproveDto {
  publicId: string;
  approvedBy: string;
}

export interface FreedayRequestRejectDto {
  publicId: string;
  rejectedBy: string;
  rejectionReason: string;
}

export interface FreedayRequestFindFilterDto extends PaginationRequestDto {
  search?: string;
  employeeId?: string;
  status?: FreedayRequestStatus;
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
  companyId?: string;
  requestedBy?: string;
}

export interface PaginationFreedayRequestDto {
  pagination: PaginationFilterDto;
  data: FreedayRequestResponseDto[];
}

export interface FreedayRequestStatsDto {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  total: number;
}

export enum FreedayOverlapConflictType {
  FREEDAY = "FREEDAY",
  ABSENCE = "ABSENCE",
  HOURLY_PERMISSION = "HOURLY_PERMISSION",
}

export interface FreedayOverlapConflictDto {
  type: FreedayOverlapConflictType;
  startDate: string;
  endDate: string;
  detail?: string;
}

export interface FreedayOverlapCheckResponseDto {
  hasOverlap: boolean;
  conflicts: FreedayOverlapConflictDto[];
}
