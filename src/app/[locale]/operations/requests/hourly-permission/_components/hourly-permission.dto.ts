import { PaginationFilterDto, PaginationRequestDto } from "@/dto/pagination";

export interface HourlyPermissionResponseDto {
  id: number;
  publicId: string;
  employeeId: number;
  employeeName?: string;
  employeeEmail?: string;
  reason: string;
  date: string | Date;
  startTime: string | Date;
  endTime: string | Date;
  withSalary: boolean;
  type: HourlyPermissionType;
  observation?: string;
  status: HourlyPermissionStatus;
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

export enum HourlyPermissionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum HourlyPermissionType {
  ENTRY = "ENTRY",
  EXIT = "EXIT",
  BOTH = "BOTH",
}

export interface HourlyPermissionCreateDto {
  employeeId: string;
  reason: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: HourlyPermissionType;
  observation?: string;
  withSalary?: boolean;
  isTimeBankCharge?: boolean;
}

export interface HourlyPermissionUpdateDto {
  publicId: string;
  reason?: string;
  date?: string | Date;
  startTime?: string | Date;
  endTime?: string | Date;
  type?: HourlyPermissionType;
  observation?: string;
  withSalary?: boolean;
}

export interface HourlyPermissionApproveDto {
  publicId: string;
  approvedBy: string;
}

export interface HourlyPermissionRejectDto {
  rejectedBy: string;
  rejectionReason: string;
}

export interface HourlyPermissionFindFilterDto extends PaginationRequestDto {
  search?: string;
  employeeId?: string;
  status?: HourlyPermissionStatus;
  date?: string;
  fromDate?: string;
  toDate?: string;
  companyId?: string;
  requestedBy?: string;
}

export interface PaginationHourlyPermissionDto {
  pagination: PaginationFilterDto;
  data: HourlyPermissionResponseDto[];
}

export interface HourlyPermissionStatsDto {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}
