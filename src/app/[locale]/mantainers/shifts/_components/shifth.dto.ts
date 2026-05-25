import { RequestShiftType } from "@/app/[locale]/operations/shift/_components/shift.context";
import { PaginationFilterDto } from "@/dto/pagination";
import { ScheduleResponseDto } from "../../schedules/_components/schedule.dto";

export interface PaginationRequestDto {
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface ScheduleShiftUpsertDto {
  publicId?: string;
  day: string;
  dayIndex: number;
  weekIndex: number;
  scheduleId: string;
  shiftId?: number | string | null;
}

export interface ScheduleShiftResponseDto {
  publicId: string;
  day: string;
  dayIndex: number;
  weekIndex: number;
  scheduleId: string;
  shiftId?: number | string | null;
  startTime: string;
}

export interface ShiftDto {
  id?: number;
  publicId: string;
  name: string;
  nomenclature: string;
  type: RotationType;
  days: number;
  weeks: number;
  schedules?: ScheduleShiftUpsertDto[];
}

export interface ShiftCreateDto {
  name: string;
  nomenclature: string;
  type: RotationType;
  days: number;
  weeks: number;
  schedules: ScheduleShiftUpsertDto[];
  companies: string[];
  selectedSchedules?: ScheduleResponseDto[];
}

export interface ShiftUpdateDto {
  publicId: string;
  name: string;
  nomenclature: string;
  type: RotationType;
  days: number;
  weeks: number;
  schedules: ScheduleShiftUpsertDto[];
}

export interface ShiftDeleteDto {
  publicId: string;
}

export interface ShiftResponseDto {
  id: number;
  publicId: string;
  name: string;
  nomenclature: string;
  type: RotationType;
  days: number;
  weeks: number;
  schedules: ScheduleShiftResponseDto[];
  createdAt: Date;
  updatedAt: Date;
  companies: string[];
}

export interface ShiftFindAllDto extends PaginationRequestDto {
  name?: string;
  type?: RotationType;
  day?: number;
  week?: number;
  personType?: "EMPLOYEE" | "STUDENT";
  companyId?: string;
  sortBy?: ShiftSortBy;
  sortOrder?: "asc" | "desc";
}

export interface PaginationShiftDto {
  pagination: PaginationFilterDto;
  data: ShiftResponseDto[];
}

export interface ShiftFindOneDto {
  publicId: string;
}

export enum RotationType {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
}

export type ShiftSortBy =
  | "name"
  | "type"
  | "days"
  | "weeks"
  | "createdAt"
  | "updatedAt";

export const RuleHolidayType = {
  ONLY_NORMAL_DAYS: "ONLY_NORMAL_DAYS",
  ONLY_UNWAIVABLE_DAYS: "ONLY_UNWAIVABLE_DAYS",
  BOTH: "BOTH",
  NONE: "NONE",
} as const;

export type RuleHolidayType =
  (typeof RuleHolidayType)[keyof typeof RuleHolidayType];

export type ShiftAssigmentDto = {
  employeeId: string;
  shiftId: string;
  dayIndex: number;
  weekIndex: number;
  ruleHoliday?: RuleHolidayType;
};

export type ShiftEmployeeAssigmentDto = {
  startDate: string;
  requestShiftType: RequestShiftType;
  employees: ShiftAssigmentDto[];
};

export type EmployeeShiftDeleteResponseDto = {
  publicId: string;
};
