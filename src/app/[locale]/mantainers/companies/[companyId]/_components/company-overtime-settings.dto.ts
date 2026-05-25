export enum DayOfWeek {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
  HOLIDAYS = "HOLIDAYS",
}

export enum TypeOvertimeSettings {
  BY_PERIOD = "BY_PERIOD",
  BY_DAYS = "BY_DAYS",
}

export interface CompanyOvertimeSettingsResponseDto {
  id: number;
  publicId: string;
  companyId: number;
  dayOfWeek: DayOfWeek;
  type: TypeOvertimeSettings;
  periodStartTime: Date | null;
  periodEndTime: Date | null;
  startDate: Date;
  endDate: Date | null;
  percentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompanyOvertimeSettingsDto {
  companyId: string;
  dayOfWeek: DayOfWeek;
  type: TypeOvertimeSettings;
  periodStartTime?: string; // ISO time string (HH:mm)
  periodEndTime?: string; // ISO time string (HH:mm)
  percentage: number;
}

export interface UpdateCompanyOvertimeSettingsDto {
  publicId: string;
  dayOfWeek?: DayOfWeek;
  type?: TypeOvertimeSettings;
  periodStartTime?: string | null; // ISO time string (HH:mm)
  periodEndTime?: string | null; // ISO time string (HH:mm)
  percentage?: number;
}

export interface PaginationCompanyOvertimeSettingsDto {
  pagination: {
    current: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    sort: "asc" | "desc";
  };
  data: CompanyOvertimeSettingsResponseDto[];
}

export const DayOfWeekOptions = [
  { value: DayOfWeek.MONDAY, label: "Lunes" },
  { value: DayOfWeek.TUESDAY, label: "Martes" },
  { value: DayOfWeek.WEDNESDAY, label: "Miércoles" },
  { value: DayOfWeek.THURSDAY, label: "Jueves" },
  { value: DayOfWeek.FRIDAY, label: "Viernes" },
  { value: DayOfWeek.SATURDAY, label: "Sábado" },
  { value: DayOfWeek.SUNDAY, label: "Domingo" },
  { value: DayOfWeek.HOLIDAYS, label: "Feriados" },
];

