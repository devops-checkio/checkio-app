import {
  EmployeeGeolocationCreateDto,
  EmployeeLegalMetadataDto,
} from "./employee-geolocation.dto";
import { DocumentType, Gender } from "./employee.enums";

/** Aligned with API CreateEmployeeDto */
export interface EmployeeCreateDto {
  companyId: string;
  code: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  address: string;
  personalEmail: string;
  personalPhone: string;
  branchId: string;
  country?: string;
  lvl1?: string;
  lvl2?: string;
  lvl3?: string;
  workEmail?: string;
  workPhone?: string;
  jobId: string;
  documentType: DocumentType;
  documentNumber: string;
  birthDate: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  isIndefiniteTerm: boolean;
  contractedHours: number;
  gender: Gender;
  integrationCode?: string;
  photo?: string;
  canCheckInOtherBranch: boolean;
  requiresPassword: boolean;
  canCheckWithoutShift: boolean;
  canCheckAnywhere: boolean;
  canCheckFromAnyBranch: boolean;
  canCheckFromWeb: boolean;
  subUnit1Id?: string;
  subUnit2Id?: string;
  subUnit3Id?: string;
  subUnit4Id?: string;
  subUnit5Id?: string;
  subUnit6Id?: string;
  subUnit7Id?: string;
  subUnit8Id?: string;
}

/** Aligned with API UpdateEmployeeDto */
export interface EmployeeUpdateDto {
  code?: string;
  firstName?: string;
  lastName?: string;
  secondLastName?: string;
  address?: string;
  personalEmail?: string;
  personalPhone?: string;
  branchId?: string;
  country?: string;
  lvl1?: string;
  lvl2?: string;
  lvl3?: string;
  workEmail?: string;
  workPhone?: string;
  jobId?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  birthDate?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isIndefiniteTerm?: boolean;
  contractedHours?: number;
  gender?: Gender;
  integrationCode?: string;
  photo?: string;
  canCheckInOtherBranch?: boolean;
  requiresPassword?: boolean;
  canCheckWithoutShift?: boolean;
  canCheckAnywhere?: boolean;
  canCheckFromAnyBranch?: boolean;
  canCheckFromWeb?: boolean;
  subUnit1Id?: string;
  subUnit2Id?: string;
  subUnit3Id?: string;
  subUnit4Id?: string;
  subUnit5Id?: string;
  subUnit6Id?: string;
  subUnit7Id?: string;
  subUnit8Id?: string;
  legalMetadata?: EmployeeLegalMetadataDto;
  EmployeeGeolocation?: EmployeeGeolocationCreateDto[];
}
