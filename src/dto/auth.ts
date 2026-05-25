import { OrganizationPermissionCode } from "./enum/permission-code.enum";

export interface UserResponseDto {
  publicId: string;
  name: string;
  rut: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  employeeId?: string;
}

export interface ServiceDto {
  publicId: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleCreateDto {
  name: string;
}

export interface RoleDto {
  publicId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersmissionDto {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  code: OrganizationPermissionCode;
  service: string;
  roleId: string;
  publicId: string;
}

export interface RolePersmissionDto {
  publicId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  RolePermissions: PersmissionDto[];
}

export interface UpdateRolePersmissionDto {
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
  code: string;
  service: string;
  publicId?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface SSOValidationDto {
  token: string;
  appId: string;
  email: string;
}

export enum RoleType {
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
  CUSTOM = "CUSTOM",
}

export interface SSOReceiveDto {
  sso_token: string;
  app_id: string;
  [key: string]: any; // Para otros parámetros que pueda enviar App1
}

export interface UpdateRolePermissionDto {
  roleId: string;
  RolePermission: UpdateRolePersmissionDto[];
}

export interface ProfileResponseDto {
  role: RoleType;
  user: UserResponseDto;
  RolePermission: PersmissionDto[];
  moduleIntegrationEtlEnabled?: boolean;
  moduleIntegrationApiEnabled?: boolean;
  moduleStudentsEnabled?: boolean;
}
