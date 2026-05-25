import { PaginationFilterDto, PaginationRequestDto } from "@/dto/pagination";

export enum BreakType {
  BREAK = "BREAK",
  LUNCH = "LUNCH",
}

export enum MealBreakFilter {
  ALL = "all",
  WITH_MEAL = "with_meal",
  WITHOUT_MEAL = "without_meal",
}

export enum PersonType {
  EMPLOYEE = "EMPLOYEE",
  STUDENT = "STUDENT",
}

export interface ScheduleBreakDto {
  publicId?: string;
  type: BreakType;
  day: number;
  description?: string;
  scheduleId?: number;
  startTime: string | Date;
  endTime: string | Date;
  deductible: boolean;
  createdAt?: string;
  updatedAt?: string;
  error?: string;
}

export interface ScheduleBreakCreateDto {
  publicId?: string;
  type: BreakType;
  day: number;
  description?: string;
  startTime: string | Date;
  endTime: string | Date;
  deductible: boolean;
  createdAt?: string;
  updatedAt?: string;
  error?: string;
}

export interface ScheduleDto {
  id?: number;
  publicId?: string;
  code: string;
  name: string;
  startDate: Date;
  workHours: number;
  workMinutes: number;
  integrationCode?: string;
  ScheduleBreaks: ScheduleBreakDto[];
}

export interface ScheduleCreateDto {
  publicId?: string;
  code: string;
  name: string;
  startTime: string | Date;
  workHours: number;
  workMinutes: number;
  discountMinutes: number;
  integrationCode?: string;
  personType?: PersonType;
  ScheduleBreaks: ScheduleBreakCreateDto[];

  companies: string[];
}

export interface ScheduleDeleteDto {
  id: number;
}

export interface ScheduleGetDto {
  id?: number;
  code?: string;
  name?: string;
}

export interface ScheduleFindAllDto extends PaginationRequestDto {
  code?: string;
  name?: string;
  hasMealBreak?: MealBreakFilter;
  createdAt?: string;
  isActive?: boolean;
  personType?: PersonType;
}

export interface ScheduleFindAllBodyDto {
  publicIds?: string[];
  includeBreaks?: boolean;
  companyIds?: string[];
  personType?: PersonType;
  isActive?: boolean;
}

export interface ScheduleBreakResponseDto {
  publicId?: string;
  type: BreakType;
  day: number;
  description?: string;
  scheduleId: number;
  startTime: string;
  endTime: string;
  deductible: boolean;
}

export interface ScheduleResponseDto {
  publicId: string;
  code: string;
  name: string;
  personType: PersonType;
  startTime: string;
  workHours: number;
  workMinutes: number;
  integrationCode?: string;
  discountMinutes: number;
  isActive: boolean;
  ScheduleBreaks: ScheduleBreakResponseDto[];
  companies: string[];
}

export interface ScheduleCountsResponseDto {
  activeCount: number;
  inactiveCount: number;
}

export interface PaginationScheduleDto {
  pagination: PaginationFilterDto;
  data: ScheduleResponseDto[];
}

export interface ScheduleBreakUpdateDto {
  publicId?: string;
  type: BreakType;
  day: number;
  description?: string;
  startTime: string | Date;
  endTime: string | Date;
  deductible: boolean;
  createdAt?: string;
  updatedAt?: string;
  error?: string;
}

export interface ScheduleUpdateDto {
  publicId?: string;
  code: string;
  name: string;
  startTime: string | Date;
  workHours: number;
  workMinutes: number;
  discountMinutes: number;
  integrationCode?: string;
  personType?: PersonType;
  isActive?: boolean;
  ScheduleBreaks: ScheduleBreakUpdateDto[];
  companies: string[];
}
