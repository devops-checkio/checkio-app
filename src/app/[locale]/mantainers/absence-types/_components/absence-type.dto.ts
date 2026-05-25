import { PaginationFilterDto, PaginationRequestDto } from "@/dto/pagination";

export interface AbsenceTypeResponseDto {
  id: number;
  publicId: string;
  code: string;
  name: string;
  integrationCode?: string;
  isEmployeeRequestable: boolean;
  isTimeBankCompensable: boolean;
}

export interface AbsenceTypeCreateDto {
  code: string;
  name: string;
  integrationCode?: string;
  isEmployeeRequestable?: boolean;
  isTimeBankCompensable?: boolean;
}

export interface AbsenceTypeUpdateDto {
  id: string;
  code?: string;
  name?: string;
  integrationCode?: string;
  isEmployeeRequestable?: boolean;
  isTimeBankCompensable?: boolean;
}

export interface AbsenceTypeFindByIdDto {
  id: string;
}

export interface AbsenceTypeDeleteDto {
  id: string;
}

export interface AbsenceTypeFindFilterDto extends PaginationRequestDto {
  search?: string;
  isEmployeeRequestable?: boolean;
}

export interface PaginationAbsenceTypeDto {
  pagination: PaginationFilterDto;
  data: AbsenceTypeResponseDto[];
}
