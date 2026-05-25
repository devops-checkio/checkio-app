import { PaginationFilterDto } from "@/dto/pagination";

export interface EmployeeChangeCompanyDto {
  newCompanyId: string;
}

export interface EmployeeCompanyHistoryDto {
  id: number;
  publicId: string;
  companyName: string;
  companyDocumentNumber: string;
  from: string;
  to?: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCompanyHistoryPaginatedResponseDto {
  pagination: PaginationFilterDto;
  data: EmployeeCompanyHistoryDto[];
}
