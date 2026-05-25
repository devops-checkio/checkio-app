import { PaginationFilterDto, PaginationRequestDto } from "@/dto/pagination";

export enum DeviceType {
  MACHINE = "MACHINE",
  KIOSKO = "KIOSKO",
}

export interface DeviceDto {
  publicId: string;
  organizationRef: string;
  identifier?: string;
  type: DeviceType;
  documentNumberHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceMetadata {
  brand?: string;
  model?: string;
  manufacturer?: string;
  os?: string;
  appVersion?: string;
  uniqueId?: string;
}

export interface DeviceResponseDto extends DeviceDto {
  publicId: string;
  organizationRef: string;
  identifier?: string;
  type: DeviceType;
  documentNumberHash?: string;
  createdAt: Date;
  updatedAt: Date;
  qrCode: string;
  isOnline: boolean;
  metadata?: DeviceMetadata;
  branchId?: string;
  branch?: { publicId: string; name: string };
  claimCode?: string;
}

export interface DeviceCreateDto {
  identifier?: string;
  type: DeviceType;
  documentNumber?: string;
  branchId?: string;
}

export interface DeviceUpdateDto {
  identifier?: string;
  branchId?: string;
  metadata?: object;
}

export interface DeviceTokenDto {
  deviceId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceStatus {
  deviceId: number;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
  deviceStatusId: number;
}

export interface DeviceFindAllDto extends PaginationRequestDto {
  type?: DeviceType;
  sortBy?: DeviceSortBy;
  sortOrder?: "asc" | "desc";
}

export type DeviceSortBy =
  | "identifier"
  | "type"
  | "branchName"
  | "createdAt"
  | "updatedAt"
  | "isOnline";

export interface PaginationDeviceDto {
  pagination: PaginationFilterDto;
  data: DeviceResponseDto[];
}
