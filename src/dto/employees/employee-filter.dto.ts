import { PaginationRequestDto } from "@/dto/pagination";

/** Filter for employee list - aligned with API */
export interface EmployeeFindFilterDto extends PaginationRequestDto {
  search?: string;
  subUnit1Id?: string;
  subUnit2Id?: string;
  subUnit3Id?: string;
  subUnit4Id?: string;
  subUnit5Id?: string;
  subUnit6Id?: string;
  subUnit7Id?: string;
  subUnit8Id?: string;
  jobId?: string;
  branchId?: string;
  companyId?: string;
  status?: "active" | "expiring" | "recent_dismissals" | "inactive";
  documentNumber?: string;
  personType?: "EMPLOYEE" | "STUDENT";
}
