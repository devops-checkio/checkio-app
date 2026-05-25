import {
  EmployeeDeviceResponseDto,
  PossibleMarkToDoDto,
} from "@/app/[locale]/mantainers/employees/_components/employee.dto";

export enum MarkingStage {
  PHOTO_CAPTURE = "PHOTO_CAPTURE",
  PHOTO_REVIEW = "PHOTO_REVIEW",
  MARKS_SEARCH = "MARKS_SEARCH",
  MARK_SAVE = "MARK_SAVE",
}

export interface LocationData {
  latitude: number;
  longitude: number;
  location: string;
  ipAddress: string;
}

export interface PhotoCaptureData {
  image: string;
  timestamp: string;
}

export interface MarkingContext {
  photoData: PhotoCaptureData | null;
  locationData: LocationData | null;
  employeeShift: EmployeeDeviceResponseDto | null;
  selectedMark: PossibleMarkToDoDto | null;
  requiresPhoto: boolean;
}

