import { PaginationFilterDto, PaginationRequestDto } from "@/dto/pagination";

// App SSO DTOs
export interface AppSSOResponseDto {
  id: number;
  publicId: string;
  name: string;
  secretToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppSSODto {
  name: string;
}

export interface UpdateAppSSODto {
  name?: string;
}

// SSO Login DTOs
export interface SSOLoginDto {
  token: string;
  appSSOId: string;
}

export interface SSOLoginResponseDto {
  theme: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    logo: string;
  };
}

// Pagination DTOs
export interface PaginationSSODto extends PaginationRequestDto {
  search?: string;
}

export interface SSOPaginatedResponseDto {
  pagination: PaginationFilterDto;
  data: AppSSOResponseDto[];
}

// Filter DTOs
export interface AppSSOFindFilterDto extends PaginationRequestDto {
  search?: string;
}

export interface SSOTokenFindFilterDto extends PaginationRequestDto {
  appSSOPublicId?: string;
  userPublicId?: string;
  isActive?: boolean;
}
