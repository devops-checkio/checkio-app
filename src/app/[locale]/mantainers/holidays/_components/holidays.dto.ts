import { PaginationFilterDto } from "@/dto/pagination";

export interface HolidayDto {
  publicId?: string;
  name: string;
  isWaivable: boolean;
  date: Date;
}

export interface HolidayCreateDto {
  name: string;
  isWaivable: boolean;
  date: string | Date;

  BranchHoliday: string[];
}

export interface HolidayUpdateDto {
  publicId: string;
  name: string;
  isWaivable: boolean;
  date: string | Date;

  BranchHoliday: string[];
}

export interface HolidayResponseDto {
  publicId: string;
  name: string;
  isWaivable: boolean;
  date: string | Date;
  BranchHoliday: string[];
}

export interface HolidayFindAllDto {
  page: number;
  pageSize: number;
  sort: "desc" | "asc";
  name?: string;
  date?: Date;
}

export interface PaginationHolidayDto {
  pagination: PaginationFilterDto;
  data: HolidayResponseDto[];
}

export interface HolidayDeleteDto {
  publicId: string;
}

export interface HolidayFindOneDto {
  publicId: string;
}

export interface HolidayApiResponse {
  status: string;
  data: HolidayApiData[];
}

export interface HolidayApiData {
  date: string;
  title: string;
  type: string;
  inalienable: boolean;
  extra: string;
}

export interface HolidayAssignmentItem {
  id: string;
  date: string;
  title: string;
  type: string;
  inalienable: boolean;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}
