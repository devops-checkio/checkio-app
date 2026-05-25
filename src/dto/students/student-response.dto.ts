import { PaginationFilterDto } from '@/dto/pagination';
import { DocumentType, Gender } from '@/dto/employees/employee.enums';

export interface StudentResponseDto {
  publicId: string;
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
  isActive: boolean;
  password?: string;
  isEncrypted: boolean;
  branchId: string | null;
  country?: string | null;
  lvl1?: string | null;
  lvl2?: string | null;
  lvl3?: string | null;
  companyId: string;
  photo?: string;
  Branch?: { publicId: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface PaginationStudentDto {
  pagination: PaginationFilterDto;
  data: StudentResponseDto[];
}
