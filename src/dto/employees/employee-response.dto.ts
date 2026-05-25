import { PaginationFilterDto } from "@/dto/pagination";
import { DocumentType, Gender } from "./employee.enums";

/** Internal employee representation (legacy) */
export interface EmployeeDto {
  id: number;
  publicId: string;
  code: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  address: string;
  personalEmail: string;
  personalPhone: string;
  workEmail: string;
  workPhone: string;
  documentType: DocumentType;
  documentNumber: string;
  integrationCode?: string;
  birthDate: string;
  startDate: Date;
  endDate?: Date;
  isIndefiniteTerm: boolean;
  canCheckInOtherBranch: boolean;
  requiresPassword: boolean;
  password?: string;
  canCheckWithoutShift: boolean;
  canCheckAnywhere: boolean;
  canCheckFromAnyBranch: boolean;
  canCheckFromWeb: boolean;
  isActive: boolean;
  contractedHours: number;
  homeOfficeLat?: number;
  homeOfficeLong?: number;
  homeOfficeRangeMeters?: number;
  gender: Gender;
  isEncrypted: boolean;
  subUnit1Id?: number;
  subUnit2Id?: number;
  subUnit3Id?: number;
  subUnit4Id?: number;
  subUnit5Id?: number;
  subUnit6Id?: number;
  subUnit7Id?: number;
  subUnit8Id?: number;
  companyId: number;
  userId: number;
  branchId: number;
  jobId: number;
  createdAt: Date;
  updatedAt: Date;
}

/** API response for employee - aligned with API */
export interface EmployeeResponseDto {
  publicId: string;
  code: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  address: string;
  personalEmail: string;
  personalPhone: string;
  workEmail: string;
  workPhone: string;
  documentType: DocumentType;
  documentNumber: string;
  integrationCode?: string;
  birthDate: string;
  startDate: Date;
  endDate?: Date;
  isIndefiniteTerm: boolean;
  canCheckInOtherBranch: boolean;
  requiresPassword: boolean;
  canCheckWithoutShift: boolean;
  canCheckAnywhere: boolean;
  canCheckFromAnyBranch: boolean;
  canCheckFromWeb: boolean;
  isActive: boolean;
  contractedHours: number;
  homeOfficeLat?: number;
  homeOfficeLong?: number;
  homeOfficeRangeMeters?: number;
  gender: Gender;
  isEncrypted: boolean;
  subUnit1Id?: string;
  subUnit2Id?: string;
  subUnit3Id?: string;
  subUnit4Id?: string;
  subUnit5Id?: string;
  subUnit6Id?: string;
  subUnit7Id?: string;
  subUnit8Id?: string;
  companyId: string;
  personType?: "EMPLOYEE" | "STUDENT";
  organizationId?: string;
  userId: number;
  branchId: string | null;
  country?: string | null;
  lvl1?: string | null;
  lvl2?: string | null;
  lvl3?: string | null;
  jobId: string | null;
  photo?: string;
  createdAt: string;
  updatedAt: string;
  fingerprintCount?: number;
}

/** Paginated employee list response */
export interface PaginationEmployeeDto {
  pagination: PaginationFilterDto;
  data: EmployeeResponseDto[];
}
