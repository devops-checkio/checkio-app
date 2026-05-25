export enum MarkType {
  CHECK_IN = "CHECK_IN",
  CHECK_OUT = "CHECK_OUT",
}

export enum MarkMode {
  GLOBAL = "GLOBAL",
  GEOFENCE = "GEOFENCE",
}

export enum RuleLevel {
  COMPANY = "COMPANY",
  EMPLOYEE = "EMPLOYEE",
}

export interface AttendanceRuleResponseDto {
  id: string;
  markType: MarkType;
  mode: MarkMode;
  level: RuleLevel;
  companyId: string;
  employeeId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendanceRuleDto {
  companyId: string;
  markType: MarkType;
  mode: MarkMode;
  level: RuleLevel;
  employeeId?: number | null;
}

export interface PaginationAttendanceRuleDto {
  data: AttendanceRuleResponseDto[];
}

export const MarkTypeOptions = [
  { value: MarkType.CHECK_IN, label: "Entrada" },
  { value: MarkType.CHECK_OUT, label: "Salida" },
];

export const MarkModeOptions = [
  { value: MarkMode.GLOBAL, label: "Global" },
  { value: MarkMode.GEOFENCE, label: "Marca en Georeferencia Autorizada" },
];

export const RuleLevelOptions = [
  { value: RuleLevel.COMPANY, label: "Empresa" },
  { value: RuleLevel.EMPLOYEE, label: "Empleado" },
];

export function getMarkTypeLabel(value: MarkType): string {
  return MarkTypeOptions.find((o) => o.value === value)?.label ?? value;
}

export function getMarkModeLabel(value: MarkMode): string {
  return MarkModeOptions.find((o) => o.value === value)?.label ?? value;
}

export function getRuleLevelLabel(value: RuleLevel): string {
  return RuleLevelOptions.find((o) => o.value === value)?.label ?? value;
}
