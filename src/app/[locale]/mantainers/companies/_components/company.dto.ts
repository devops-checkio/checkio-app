import { PaginationFilterDto } from "@/dto/pagination";

export enum DocumentType {
  DNI = "DNI", // Argentina, Peru, Ecuador
  RUT = "RUT", // Chile, Uruguay
  CURP = "CURP", // Mexico
  CPF = "CPF", // Brasil
  CC = "CC", // Colombia
  CI = "CI", // Bolivia, Paraguay
  DPI = "DPI", // Guatemala
  DUI = "DUI", // El Salvador
  CIP = "CIP", // Panama
  CEDULA = "CEDULA", // Venezuela, Nicaragua, Costa Rica, Honduras, Dominican Republic
  CNPJ = "CNPJ", // Brasil
}

export const DocumentTypeOptions = [
  { value: DocumentType.DNI, label: "Documento Nacional de Identidad" },
  { value: DocumentType.RUT, label: "Rol Único Tributario" },
  { value: DocumentType.CURP, label: "Clave Única de Registro de Población" },
  { value: DocumentType.CPF, label: "Cadastro de Pessoas Físicas (CPF)" },
  {
    value: DocumentType.CNPJ,
    label: "Cadastro Nacional de Pessoa Jurídica (CNPJ)",
  },
  { value: DocumentType.CC, label: "Cédula de Ciudadanía" },
  { value: DocumentType.CI, label: "Cédula de Identidad" },
  { value: DocumentType.DPI, label: "Documento Personal de Identificación" },
  { value: DocumentType.DUI, label: "Documento Único de Identidad" },
  { value: DocumentType.CIP, label: "Cédula de Identidad Personal" },
  { value: DocumentType.CEDULA, label: "Cédula de Identidad" },
];

export enum TypeOvertimeSettings {
  BY_PERIOD = "BY_PERIOD",
  BY_DAYS = "BY_DAYS",
}

/** IANA zones for company schedule / business-day validation (extend as needed). */
export enum CompanyScheduleIanaTimezone {
  AMERICA_SANTIAGO = "America/Santiago",
  AMERICA_LIMA = "America/Lima",
  AMERICA_BOGOTA = "America/Bogota",
  AMERICA_MEXICO_CITY = "America/Mexico_City",
  AMERICA_SAO_PAULO = "America/Sao_Paulo",
  AMERICA_BUENOS_AIRES = "America/Buenos_Aires",
  AMERICA_MONTEVIDEO = "America/Montevideo",
  AMERICA_CARACAS = "America/Caracas",
  AMERICA_LA_PAZ = "America/La_Paz",
  AMERICA_GUAYAQUIL = "America/Guayaquil",
  AMERICA_PANAMA = "America/Panama",
  AMERICA_COSTA_RICA = "America/Costa_Rica",
  AMERICA_GUATEMALA = "America/Guatemala",
  AMERICA_EL_SALVADOR = "America/El_Salvador",
  AMERICA_ASUNCION = "America/Asuncion",
  AMERICA_SANTO_DOMINGO = "America/Santo_Domingo",
  UTC = "UTC",
}

export const COMPANY_SCHEDULE_IANA_TIMEZONE_VALUES = Object.values(
  CompanyScheduleIanaTimezone,
) as string[];

export interface CompanySettingsResponseDto {
  publicId: string;
  createdAt: Date;
  updatedAt: Date;
  companyId: string;
  enableSignatureOnCheckIn: boolean;
  showMobileConsultMenu: boolean;
  enablePhotoOnCheckIn: boolean;
  enableLateArrivalEmailToManager: boolean;
  enableLateBreakStartEmailToManager: boolean;
  enableLateBreakEndEmailToManager: boolean;
  enableLateExitEmailToManager: boolean;
  enableWeeklyEmailToEmployee: boolean;
  enableWeeklyEmailToAdmin: boolean;
  enableDailyEmailToAdmin: boolean;
  enableWelcomeEmail: boolean;
  enableAdminStatusEmailOnCheckIn: boolean;
  lateArrivalTolerance: number;
  enableAdditionalMarks: boolean;
  lunchBreakTolerance?: number;
  minutesBeforeSchedule: number;
  automaticCheckInMinutes: number;
  minutesAfterSchedule: number;
  minutesCloseRecordWithoutShift: number;
  antecipatedOvertime: boolean;
  breakOvertime: boolean;
  typeOvertimeSettings: TypeOvertimeSettings;
  isActive: boolean;
  integrationCode: string;
  fallbackScheduleWindowHours: number;
  timezone?: string;
}

export interface CompanyResponseDto {
  publicId: string;
  documentType: DocumentType;
  documentNumber: string;
  businessName: string;
  tradeName: string;
  address: string;
  adminName: string;
  adminDocumentType: DocumentType;
  adminDocumentNumber: string;
  adminEmail: string;
  isActive: boolean;
  integrationCode?: string;
  createdAt: Date;
  updatedAt: Date;
  transitoryService: boolean;
  CompanySettings: CompanySettingsResponseDto;
}

export interface CompanyCreateDto {
  transitoryService: boolean;
  documentType: DocumentType;
  documentNumber: string;
  businessName: string;
  tradeName: string;
  address: string;
  isActive?: boolean;
  integrationCode?: string;
}

export interface UpdateCompanyDto extends CompanyCreateDto {
  publicId: string;
  enableSignatureOnCheckIn?: boolean;
  showMobileConsultMenu?: boolean;
  enablePhotoOnCheckIn?: boolean;
  enableLateArrivalEmailToManager?: boolean;
  enableLateBreakStartEmailToManager?: boolean;
  enableLateBreakEndEmailToManager?: boolean;
  enableLateExitEmailToManager?: boolean;
  enableWeeklyEmailToEmployee?: boolean;
  enableWeeklyEmailToAdmin?: boolean;
  enableDailyEmailToAdmin?: boolean;
  enableWelcomeEmail?: boolean;
  enableAdminStatusEmailOnCheckIn?: boolean;
  lateArrivalTolerance?: number;
  lunchBreakTolerance?: number;
  minutesBeforeSchedule?: number;
  automaticCheckInMinutes?: number;
  minutesAfterSchedule?: number;
  minutesCloseRecordWithoutShift?: number;
  enableAdditionalMarks?: boolean;
  antecipatedOvertime?: boolean;
  breakOvertime?: boolean;
  typeOvertimeSettings?: TypeOvertimeSettings;
  fallbackScheduleWindowHours?: number;
  timezone?: string;
}
export type CompanySortBy =
  | "createdAt"
  | "updatedAt"
  | "businessName"
  | "documentNumber"
  | "tradeName"
  | "address"
  | "integrationCode";

export interface CompanyFindFilterDto {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  sortBy?: CompanySortBy;
  sortOrder?: "asc" | "desc";
  search?: string;
  selector?: boolean;
}

export interface PaginationCompanyDto {
  pagination: PaginationFilterDto;
  data: CompanyResponseDto[];
}

export interface CompanyFindAllDto {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
}

export interface CompanyOption {
  value: string;
  label: string;
}
