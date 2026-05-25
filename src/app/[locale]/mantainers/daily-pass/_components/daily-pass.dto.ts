import { PaginationFilterDto, PaginationRequestDto } from "@/dto/pagination";

export interface DailyPassDto {
  publicId: string;
  organizationRef: string;
  personId: string;
  personName: string;
  personDocumentNumber: string;
  status: DailyPassStatus;
  qrCode: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum DailyPassStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  USED = "USED",
}

export interface DailyPassCreateDto {
  personId: string;
  expiresAt?: Date;
}

export interface DailyPassUpdateDto {
  status?: DailyPassStatus;
  expiresAt?: Date;
}

export interface PersonSelectOption {
  value: string;
  label: string;
  documentNumber: string;
}

export interface DailyPassFindAllDto extends PaginationRequestDto {
  status?: DailyPassStatus;
}

export interface PaginationDailyPassDto {
  pagination: PaginationFilterDto;
  data: DailyPassDto[];
}
