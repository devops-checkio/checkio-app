import { PaginationFilterDto, PaginationRequestDto } from "@/dto/pagination";
import { ManagerType } from "./employee.enums";

export interface EmployeeManagerResponseDto {
  startDate: Date;
  endDate: Date;
  type: ManagerType;
  publicId: string;
  managerId?: string; // publicId of the manager employee (for editing)
  isActive: boolean;
  managerName: string;
  documentNumber?: string;
}

export interface PaginationEmployeeManagerDto {
  pagination: PaginationFilterDto;
  data: EmployeeManagerResponseDto[];
}

export interface EmployeeManagerFindFilterDto extends PaginationRequestDto {
  // Inherits all pagination properties from PaginationRequestDto
}

export interface EmployeeManagerCreateDto {
  startDate?: string | null;
  endDate?: string | null;
  type: ManagerType;
  managerId: string;
}

export interface EmployeeManagerSubordinateDto {
  subordinateId: string;
  startDate: string;
  endDate?: string;
}

export interface EmployeeManagerSubordinateCreateDto {
  subordinates: EmployeeManagerSubordinateDto[];
}
