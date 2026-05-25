export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface UserResponse {
  id: string;
  name: string;
  rut: string;
  createdAt: Date;
  updatedAt: Date;
  password?: string;
}

export interface Service {
  id: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleCreate {
  name: string;
}

export interface RoleFindById {
  roleId: string;
}

export interface RoleDeleteById {
  roleId: string;
}

export interface Role {
  id: string;
  publicId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  code: string;
  service: string;
  roleId?: string;
  id: string;
}

export interface RolePermission {
  id: string;
  name: string;
  filterByBoss?: boolean;
  createdAt: Date;
  updatedAt: Date;
  RolePermission: Permission[];
}

export interface RolePermissionUpdate {
  roleId: string;
  code: string;
  service: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface UpdateRolePermission {
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
  code: string;
  service: string;
  id?: string;
}

export interface Login {
  rut: string;
  password: string;
}

export interface UpdateRolePermissions {
  publicId: string;
  name: string;
  filterByBoss?: boolean;
  RolePermission: UpdateRolePermission[];
}

export interface ProfileResponse {
  user: UserResponse;
  RolePermissions: Permission[];
}

export interface PaginationUser {
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  data: UserResponse[];
}

export interface PermissionTemplateDto {
  code: string;
  name: string;
  description: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface ServiceTemplateDto {
  code: string;
  name: string;
  permissions: PermissionTemplateDto[];
}
