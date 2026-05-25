import { PaginationFilterDto } from "@/dto/pagination";

export interface JobResponseDto {
  publicId: string;
  code: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  companies: string[];
}

export interface JobCreateDto {
  code: string;
  name: string;
  description: string;
  companies?: string[];
}

export interface JobUpdateDto {
  publicId: string;
  code?: string;
  name?: string;
  description?: string;
  companies: string[];
}

export interface JobFindFilterDto {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  sortBy?: JobSortBy;
  sortOrder?: "asc" | "desc";
}

export interface PaginationJobDto {
  pagination: PaginationFilterDto;
  data: JobResponseDto[];
}

export interface JobFindAllDto {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  sortBy?: JobSortBy;
  sortOrder?: "asc" | "desc";
  companyId?: string;
  companies?: string[];
}

export type JobSortBy = "code" | "name" | "description" | "createdAt";
