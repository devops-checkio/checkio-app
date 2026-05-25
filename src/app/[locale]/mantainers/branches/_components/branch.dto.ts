import { PaginationFilterDto } from "@/dto/pagination";

export interface BranchSettingsDto {
  id?: number;
  publicId?: string;
  branchId?: number;
  lateArrivalTolerance?: number;
  lunchBreakTolerance?: number;
  minutesBeforeSchedule?: number;
  automaticCheckInMinutes?: number;
  minutesAfterSchedule?: number;
  minutesCloseRecordWithoutShift?: number;
  integrationCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BranchResponseDto {
  publicId: string;
  code: string;
  name: string;
  address: string;
  country?: string;
  region?: string;
  commune?: string;
  phone?: string;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  companies: string[];
  useBranchSettings: boolean;
  settings: BranchSettingsDto;
}

export interface BranchCreateDto {
  code: string;
  name: string;
  address: string;
  country?: string;
  region?: string;
  commune?: string;
  phone?: string;
  timezone: string;
  isActive?: boolean;
  companies?: string[];
  geolocations?: BranchGeolocationCreateDto[];
}

export interface BranchUpdateDto {
  code?: string;
  name?: string;
  address?: string;
  country?: string;
  region?: string;
  commune?: string;
  phone?: string;
  timezone?: string;
  isActive?: boolean;
  companies?: string[];
  publicId: string;
  useBranchSettings?: boolean;
  lateArrivalTolerance?: number;
  lunchBreakTolerance?: number;
  minutesBeforeSchedule?: number;
  automaticCheckInMinutes?: number;
  minutesAfterSchedule?: number;
  minutesCloseRecordWithoutShift?: number;
  geolocations?: BranchGeolocationUpdateDto[];
}

export type BranchSortBy =
  | "createdAt"
  | "updatedAt"
  | "code"
  | "name"
  | "address"
  | "integrationCode";

export interface BranchFindAllDto {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  sortBy?: BranchSortBy;
  sortOrder?: "asc" | "desc";
  search?: string;
  companyId?: string;
}

export interface PaginationBranchDto {
  data: BranchResponseDto[];
  pagination: PaginationFilterDto;
}

export enum BranchGeolocationType {
  MIXED = "MIXED",
  CHECK_IN = "CHECK_IN",
  CHECK_OUT = "CHECK_OUT",
}

export interface BranchGeolocationDeleteDto {
  publicId: string;
  branchId: string;
}

export interface BranchGeolocationDto {
  publicId: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  type?: BranchGeolocationType;
}

export interface BranchGeolocationCreateDto {
  publicId?: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  type?: BranchGeolocationType;
}

export interface BranchGeolocationUpdateDto extends BranchGeolocationCreateDto {
  publicId: string;
}

export interface BranchGeolocationResponseDto extends BranchGeolocationDto {
  publicId: string;
}
