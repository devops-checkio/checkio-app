/**
 * Employee DTOs - centralized barrel export
 * Use @/dto/employees for imports
 */

// Enums & options (runtime values)
export {
  DocumentType,
  DocumentTypeOptions,
  Gender,
  GenderOptions,
  ManagerType,
} from "./employee.enums";

// Types (interfaces)
export type { EmployeeFindFilterDto } from "./employee-filter.dto";
export type {
  EmployeeCreateDto,
  EmployeeUpdateDto,
} from "./employee-create-update.dto";
export type {
  EmployeeGeolocationCreateDto,
  EmployeeLegalMetadataDto,
} from "./employee-geolocation.dto";
export type {
  EmployeeDto,
  EmployeeResponseDto,
  PaginationEmployeeDto,
} from "./employee-response.dto";
export type {
  EmployeeManagerCreateDto,
  EmployeeManagerFindFilterDto,
  EmployeeManagerResponseDto,
  EmployeeManagerSubordinateCreateDto,
  EmployeeManagerSubordinateDto,
  PaginationEmployeeManagerDto,
} from "./employee-manager.dto";
export type {
  AttemptMarkSearchDto,
  EmployeeDeviceResponseDto,
  GeolocationZoneDto,
  PossibleMarkToDoDto,
} from "./employee-device.dto";
export type {
  EmployeeChangeCompanyDto,
  EmployeeCompanyHistoryDto,
  EmployeeCompanyHistoryPaginatedResponseDto,
} from "./employee-company-history.dto";
export type {
  EmployeeShiftDto,
  EmployeeWithoutShiftDto,
  PaginationEmployeeWithoutShiftResponseDto,
  ShiftDto,
} from "./employee-shift.dto";
export type { EmployeeSummaryShiftResponseDto } from "./employee-summary-shift.dto";
export type { TreeItem } from "./employee-tree.dto";
