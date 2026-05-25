import { PaginationFilterDto } from "@/dto/pagination";

// Enums
export enum ApiTokenStatus {
  ACTIVE = "ACTIVE",
  REVOKED = "REVOKED",
}

export enum ApiTokenModule {
  EMPRESAS = "empresas",
  SUCURSALES = "sucursales",
  EMPLEADOS = "empleados",
  CARGOS = "cargos",
  ESTRUCTURAS = "estructuras",
  AUSENCIAS = "ausencias",
  BANCO = "banco",
  ASISTENCIAS = "asistencias",
  DISPOSITIVOS = "dispositivos",
}

export enum ApiTokenAction {
  VER = "ver",
  CREAR = "crear",
  EDITAR = "editar",
  ELIMINAR = "eliminar",
}

// DTOs
export interface ApiTokenPermissionDto {
  module: string;
  action: string;
}

export interface ApiTokenPermissionResponseDto {
  id: number;
  module: string;
  action: string;
}

export interface ApiTokenResponseDto {
  publicId: string;
  name: string;
  description?: string | null;
  status: ApiTokenStatus;
  expiresAt?: Date | null;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: number;
    publicId: string;
    name: string;
  };
  permissions: ApiTokenPermissionResponseDto[];
}

export interface ApiTokenCreateResponseDto extends ApiTokenResponseDto {
  token: string; // Only shown once
}

export interface CreateApiTokenDto {
  name: string;
  description?: string;
  expiresAt?: string;
  permissions: ApiTokenPermissionDto[];
}

export interface UpdateApiTokenDto {
  name?: string;
  description?: string;
  expiresAt?: string | null;
  permissions?: ApiTokenPermissionDto[];
}

export interface ApiTokenFindFilterDto {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  search?: string;
  status?: ApiTokenStatus;
}

export interface PaginationApiTokenDto {
  data: ApiTokenResponseDto[];
  pagination: PaginationFilterDto;
}
