import { PaginationFilterDto, PaginationRequestDto } from "@/dto/pagination";

export interface DailyPassEmployeeResponseDto {
  publicId: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  personalEmail: string;
  photo?: string;
  startDate: string;
  endDate: string;
  contractedHours: number;
  jobName?: string;
  branchName?: string;
}

export interface DailyPassResponseDto {
  id?: number;
  publicId: string;
  employeeId: string;
  employeeName?: string;
  employeeEmail?: string;
  startDate: string | Date;
  endDate: string | Date;
  qrCode?: string;
  qrExpiresAt?: string | Date;
  status: DailyPassStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy?: string;
  reason?: string;
  employee?: DailyPassEmployeeResponseDto;
  organizationLogo?: string;
}

export enum DailyPassStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  DEACTIVATED = "DEACTIVATED",
}

export interface DailyPassCreateDto {
  employeeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface DailyPassUpdateDto {
  publicId: string;
  startDate?: string | Date;
  endDate?: string | Date;
  status?: DailyPassStatus;
  reason?: string;
}

export interface DailyPassRenewDto {
  publicId: string;
  additionalDays: number;
}

export interface DailyPassFindFilterDto extends PaginationRequestDto {
  search?: string;
  documentNumber?: string;
  jobId?: string;
  branchId?: string;
  organizationId?: string;
  status?: DailyPassStatus;
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
  employeeId?: string;
  companyId?: string;
}

export interface PaginationDailyPassDto {
  pagination: PaginationFilterDto;
  data: DailyPassResponseDto[];
}

export interface DailyPassProcessingItem {
  id: string;
  employeeId: string;
  employeeName: string;
  documentNumber: string;
  startDate: string;
  endDate: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}
