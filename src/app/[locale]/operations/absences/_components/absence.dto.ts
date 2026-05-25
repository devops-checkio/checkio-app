import { PaginationFilterDto, PaginationRequestDto } from "@/dto/pagination";

export enum AbsenceSource {
  MANUAL = "MANUAL",
  FREEDAY_APPROVAL = "FREEDAY_APPROVAL",
  INTEGRATION = "INTEGRATION",
}

export function isAbsenceActionLocked(
  source: AbsenceSource | string | undefined
): boolean {
  return source != null && source !== AbsenceSource.MANUAL;
}

export interface AbsenceEmployeeResponseDto {
  publicId: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  jobId: string;
  branchId: string;
}

export interface AbsenceTypeResponseDto {
  publicId: string;
  name: string;
}

export interface AbsenceResponseDto {
  id?: number;
  publicId: string;
  employeeId: string | number;
  employeeName?: string;
  absenceTypeId: string | number;
  absenceTypeName?: string;
  startDate: string | Date;
  endDate: string | Date;
  reason?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  withoutPay: boolean;
  source?: AbsenceSource | string;
  freedayRequestPublicId?: string;
  employee?: AbsenceEmployeeResponseDto;
  absenceType?: AbsenceTypeResponseDto;
}

export interface AbsenceCreateDto {
  employeeId: string;
  absenceTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  withoutPay: boolean;
}

export interface AbsenceUpdateDto {
  publicId: string;
  employeeId?: string | number;
  absenceTypeId?: string | number;
  startDate?: string | Date;
  endDate?: string | Date;
  reason?: string;
  withoutPay?: boolean;
}

export interface AbsenceFindFilterDto extends PaginationRequestDto {
  search?: string;
  documentNumber?: string;
  jobId?: string;
  branchId?: string;
  organizationId?: string;
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
  employeeId?: string;
  absenceTypeId?: string;
  withoutPay?: boolean;
  companyId?: string;
}

export interface PaginationAbsenceDto {
  pagination: PaginationFilterDto;
  data: AbsenceResponseDto[];
}
