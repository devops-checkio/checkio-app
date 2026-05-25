import { DocumentType, Gender } from "./employee.enums";

export interface GeolocationZoneDto {
  id: string;
  name: string;
  label?: string; // Descriptive label combining branch name, zone name, and mark type
  branchName?: string; // Branch name (only for BRANCH type zones)
  allowedMarkType?: "CHECK_IN" | "CHECK_OUT" | "MIXED"; // Allowed mark type for this zone
  latitude: number;
  longitude: number;
  radius: number;
  type: "BRANCH" | "EMPLOYEE_HOME_OFFICE" | "EMPLOYEE_GEOLOCATION";
  branchGeolocationType?: "CHECK_IN" | "CHECK_OUT" | "MIXED";
}

export interface PossibleMarkToDoDto {
  scheduleId: string;
  automaticMark: boolean;
  withDiscount: boolean;
  scheduleBreakId?: string;
  isAditional: boolean;
  time: string;
  title?: string;
  type: "CHECK_IN" | "CHECK_OUT";
}

export interface AttemptMarkSearchDto {
  latitude: number;
  longitude: number;
  ipAddress: string;
  /** Optional reference date/time (ISO 8601) for possible marks. Only used when NEXT_PUBLIC_USE_TIME_SHIFT is true. */
  referenceDateTime?: string;
}

export interface EmployeeDeviceResponseDto {
  uploadUrl?: string;
  assistanceId: string;
  publicId: string;
  lastName: string;
  firstName: string;
  secondLastName: string;
  documentNumber: string;
  documentType: DocumentType;
  gender: Gender;
  contractedHours: number;
  attemptMarkId: string;
  possibleMarkToDo: PossibleMarkToDoDto[];
  authorizedZones?: GeolocationZoneDto[];
  isWithinAuthorizedZone?: boolean;
  nearestZone?: GeolocationZoneDto;
  distanceToNearestZone?: number;
  distanceToEdge?: number;
  isWithinWithMargin?: boolean;
}
