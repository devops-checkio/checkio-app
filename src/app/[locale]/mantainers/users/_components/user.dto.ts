import { PaginationFilterDto, PaginationRequestDto } from "@/dto/pagination";

export interface UserResponseDto {
  id: number;
  publicId: string;
  companyId: number;
  name: string;
  email: string;
  username: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  integrationCode?: string;
  roleId: number;
}

export interface CreateUserDto {
  name: string;
  email: string;
  username: string;
  password: string;
  integrationCode?: string;
  roleId: string;
  companyId: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  username?: string;
  password?: string;
  isActive?: boolean;
  integrationCode?: string;
  roleId?: string;
  companyId?: string;
}

export interface UserFindFilterDto extends PaginationRequestDto {
  search?: string;
  email?: string;
  roleId?: string;
}

export interface PaginationUserDto {
  pagination: PaginationFilterDto;
  data: UserResponseDto[];
}
