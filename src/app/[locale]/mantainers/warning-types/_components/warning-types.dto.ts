import { PaginationFilterDto } from "@/dto/pagination";

export interface WarningTypeResponseDto {
  publicId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WarningTypeCreateDto {
  name: string;
}

export interface WarningTypeUpdateDto {
  name: string;
}

export interface WarningTypeFindAllDto {
  name?: string;
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
}

export interface PaginationWarningTypeDto {
  pagination: PaginationFilterDto;
  data: WarningTypeResponseDto[];
}
