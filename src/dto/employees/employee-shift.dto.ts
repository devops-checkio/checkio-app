import { PaginationFilterDto } from "@/dto/pagination";

export interface ShiftDto {
  publicId: string;
  name: string;
  type: string;
  days: number;
  weeks: number;
  createdAt: string;
  updatedAt: string;
  nomenclature: string;
  integrationCode: string | null;
}

export interface EmployeeShiftDto {
  publicId: string;
  employeeId: number;
  shiftId: number;
  dayIndex: number;
  weekIndex: number;
  startDate: string;
  endDate: string;
  requestShiftType: string;
  createdAt: string;
  updatedAt: string;
  ruleHoliday: string;
  Shift: ShiftDto;
}

export interface EmployeeWithoutShiftDto {
  code: string;
  firstName: string;
  lastName: string;
  secondLastName: string;
  address: string;
  personalEmail: string;
  personalPhone: string;
  workEmail: string;
  workPhone: string;
  documentType: string;
  documentNumber: string;
  documentNumberHash: string;
  integrationCode: string;
  birthDate: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  isIndefiniteTerm: boolean;
  canCheckInOtherBranch: boolean;
  requiresPassword: boolean;
  canCheckWithoutShift: boolean;
  canCheckAnywhere: boolean;
  canCheckFromWeb: boolean;
  canCheckFromAnyBranch: boolean;
  isActive: boolean;
  contractedHours: number;
  homeOfficeLat: number | null;
  homeOfficeLong: number | null;
  homeOfficeRangeMeters: number | null;
  gender: string;
  isEncrypted: boolean;
  publicId: string;
  companyId: number;
  userId: number;
  branchId: string;
  jobId: string;
  photo: string | null;
  EmployeeShift: EmployeeShiftDto;
}

export interface PaginationEmployeeWithoutShiftResponseDto {
  pagination: PaginationFilterDto;
  data: EmployeeWithoutShiftDto[];
}
