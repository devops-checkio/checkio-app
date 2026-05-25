import { PaginationFilterDto } from "@/dto/pagination";

export interface WarningEmployeeDto {
  publicId: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
}

export interface WarningResponseDto {
  publicId: string;
  employeePublicId: string;
  companyPublicId: string;
  warningTypePublicId: string;
  startDate?: string | Date;
  endDate?: string | Date;
  observation?: string;
  documentUrl?: string;
  reportedBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  employee: WarningEmployeeDto;
}

export interface WarningCreateDto {
  employeePublicId: string;
  companyPublicId: string;
  warningTypePublicId: string;
  startDate?: string;
  endDate?: string;
  observation?: string;
  documentUrl?: string;
  reportedBy?: string;
}

export interface UpdateWarningDto extends WarningCreateDto {
  publicId: string;
}

export interface WarningFindFilterDto {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  search?: string;
  employeePublicId?: string;
  companyPublicId?: string;
  warningTypePublicId?: string;
}

export interface PaginationWarningDto {
  pagination: PaginationFilterDto;
  data: WarningResponseDto[];
}
