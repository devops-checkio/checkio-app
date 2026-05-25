import { DocumentType, Gender } from "@/dto/employees/employee.enums";

/** Aligned with API CreateStudentDto */
export interface StudentCreateDto {
  companyId: string;
  code: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  documentType: DocumentType;
  documentNumber: string;
  personalEmail: string;
  personalPhone: string;
  birthDate: string;
  gender: Gender;
  branchId: string;
  country?: string;
  lvl1?: string;
  lvl2?: string;
  lvl3?: string;
}

/** Aligned with API UpdateStudentDto */
export interface StudentUpdateDto {
  code?: string;
  firstName?: string;
  lastName?: string;
  secondLastName?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  personalEmail?: string;
  personalPhone?: string;
  birthDate?: string;
  gender?: Gender;
  branchId?: string;
  country?: string;
  lvl1?: string;
  lvl2?: string;
  lvl3?: string;
  isActive?: boolean;
}
