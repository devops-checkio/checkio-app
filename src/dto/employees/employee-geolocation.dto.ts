import { DocumentType, Gender } from "./employee.enums";

/** Geolocation for employee - aligned with API EmployeeGeolocationCreateDto */
export interface EmployeeGeolocationCreateDto {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  publicId?: string;
}

/** Legal metadata for employee update - aligned with API */
export interface EmployeeLegalMetadataDto {
  article22?: boolean;
  article27?: boolean;
  flexibilityHours?: boolean;
}
