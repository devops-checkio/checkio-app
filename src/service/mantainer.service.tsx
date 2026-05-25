"use client";

import {
  BranchCreateDto,
  BranchFindAllDto,
  BranchGeolocationCreateDto,
  BranchGeolocationDeleteDto,
  BranchGeolocationResponseDto,
  BranchGeolocationUpdateDto,
  BranchResponseDto,
  BranchUpdateDto,
  PaginationBranchDto,
} from "@/app/[locale]/mantainers/branches/_components/branch.dto";
import {
  CompanyCreateDto,
  CompanyFindFilterDto,
  CompanyResponseDto,
  PaginationCompanyDto,
  UpdateCompanyDto,
} from "@/app/[locale]/mantainers/companies/_components/company.dto";
import {
  AttemptMarkSearchDto,
  EmployeeDeviceResponseDto,
  EmployeeFindFilterDto,
  EmployeeManagerCreateDto,
  EmployeeManagerResponseDto,
  EmployeeManagerSubordinateCreateDto,
  EmployeeResponseDto,
  EmployeeSummaryShiftResponseDto,
  PaginationEmployeeDto,
  PaginationEmployeeWithoutShiftResponseDto,
  TreeItem,
} from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import {
  JobCreateDto,
  JobFindAllDto,
  JobResponseDto,
  JobUpdateDto,
  PaginationJobDto,
} from "@/app/[locale]/mantainers/jobs/_components/job.dto";
import { UserResponseDto } from "@/dto/auth";
import {
  CreateOrganizationalUnitRequestDto,
  CreateSubOrganizationalUnitRequestDto,
  OrganizationalUnitResponseDto,
  PaginationStructureDto,
  StructureCreateDto,
  StructureFindFilterDto,
  StructureResponseDto,
  StructureUpdateDto,
  SubOrganizationalUnitListItemDto,
  SubOrganizationalUnitResponseDto,
  SubOrganizationalUnitsPaginatedResponseDto,
  SubOrganizationalUnitTreeNodeDto,
  SubUnitSortField,
  UpdateOrganizationalUnitRequestDto,
  UpdateSubOrganizationalUnitRequestDto,
} from "@/dto/structure";
import { PaginationUserDto, UserCreateDto, UserUpdateDto } from "@/dto/user";

import {
  AssistanceCompleteManualDto,
  AssistanceBulkCreateDto,
  AssistanceCountDto,
  AssistanceCountFindAllDto,
  AssistanceFindAllDto,
  AssistanceResponseDto,
  CreateAdditionalMarkDto,
  PaginationAssistanceDto,
  RegisterMarkToDoDto,
} from "@/app/[locale]/assistance/_components/assistance.dto";
import {
  DeviceCreateDto,
  DeviceFindAllDto,
  DeviceResponseDto,
  DeviceUpdateDto,
  PaginationDeviceDto,
} from "@/app/[locale]/mantainers/devices/_components/device.dto";
import { EmployeeCompanyHistoryPaginatedResponseDto } from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import {
  HolidayCreateDto,
  HolidayFindAllDto,
  HolidayResponseDto,
  HolidayUpdateDto,
  PaginationHolidayDto,
} from "@/app/[locale]/mantainers/holidays/_components/holidays.dto";
import { OrganizationalUnitDto } from "@/app/[locale]/mantainers/structures/[structureId]/_components/organizationalUnit.dto";
import {
  PaginationWarningTypeDto,
  WarningTypeCreateDto,
  WarningTypeFindAllDto,
  WarningTypeResponseDto,
  WarningTypeUpdateDto,
} from "@/app/[locale]/mantainers/warning-types/_components/warning-types.dto";
import {
  PaginationStudentDto,
  StudentCreateDto,
  StudentFindFilterDto,
  StudentResponseDto,
  StudentUpdateDto,
} from "@/dto/students";
import axiosInstance from "@/utils/axios";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  AbsenceTypeCreateDto,
  AbsenceTypeFindFilterDto,
  AbsenceTypeResponseDto,
  AbsenceTypeUpdateDto,
  PaginationAbsenceTypeDto,
} from "../app/[locale]/mantainers/absence-types/_components/absence-type.dto";
import {
  AppSSOFindFilterDto,
  AppSSOResponseDto,
  CreateAppSSODto,
  SSOPaginatedResponseDto,
  UpdateAppSSODto,
} from "../app/[locale]/mantainers/sso/_components/sso.dto";
import {
  CreateTimeBankDto,
  CreateTimeBankTransactionDto,
  EmployeeTimeBankAccumulatedHoursResponseDto,
  EmployeeWithTimeBankFindFilterDto,
  PaginationEmployeeWithTimeBankDto,
  PaginationTimeBankDto,
  PaginationTimeBankTransactionDto,
  TimeBankFindFilterDto,
  TimeBankResponseDto,
  TimeBankStatsDto,
  TimeBankTransactionFindFilterDto,
  TimeBankTransactionRejectDto,
  TimeBankTransactionResponseDto,
  TimeBankTransactionStatsDto,
  UpdateTimeBankDto,
  UpdateTimeBankTransactionDto,
} from "../app/[locale]/mantainers/time-bank/_components/time-bank.dto";
import {
  AbsenceCreateDto,
  AbsenceFindFilterDto,
  AbsenceResponseDto,
  AbsenceUpdateDto,
  PaginationAbsenceDto,
} from "../app/[locale]/operations/absences/_components/absence.dto";

function addHeaders() {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-client": "web",
  };
}

export function useGetJobs(
  filter: JobFindAllDto,
  options?: { enabled?: boolean },
) {
  return useQuery<PaginationJobDto>({
    queryKey: ["GetJobs", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationJobDto>(
        `/client/mantainer/jobs`,
        {
          params: filter,
        },
      );
      return response.data;
    },
    enabled: options?.enabled !== false,
  });
}

export function useCreateJob() {
  return useMutation<JobResponseDto, any, JobCreateDto>({
    mutationKey: ["CreateJob"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<JobResponseDto>(
        `/client/mantainer/jobs`,
        data,
      );
      return response.data;
    },
  });
}

export function useUpdateJob() {
  return useMutation<JobResponseDto, any, JobUpdateDto>({
    mutationKey: ["UpdateJob"],
    mutationFn: async ({ publicId, ...data }) => {
      const response = await axiosInstance.put<JobResponseDto>(
        `/client/mantainer/jobs/${publicId}`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteJob() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteJob"],
    mutationFn: async (id) => {
      await axiosInstance.delete(`/client/mantainer/jobs/${id}`);
    },
  });
}

export function useGetUsers(params: {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
}) {
  return useQuery<PaginationUserDto>({
    queryKey: ["GetUsers", params],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationUserDto>(
        `/client/mantainer/users`,
        { params },
      );
      return response.data;
    },
  });
}

export function useCreateUser() {
  return useMutation<UserResponseDto, any, UserCreateDto>({
    mutationKey: ["CreateUser"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<UserResponseDto>(
        `/client/mantainer/users`,
        data,
      );
      return response.data;
    },
  });
}

export function useUpdateUser() {
  return useMutation<UserResponseDto, any, UserUpdateDto>({
    mutationKey: ["UpdateUser"],
    mutationFn: async (data) => {
      const response = await axiosInstance.put<UserResponseDto>(
        `/client/mantainer/users/${data.id}`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteUser() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteUser"],
    mutationFn: async (id) => {
      await axiosInstance.delete(`/client/mantainer/users/${id}`);
    },
  });
}

export function useGetAbsenceTypes(filter: AbsenceTypeFindFilterDto) {
  return useQuery<PaginationAbsenceTypeDto>({
    queryKey: ["GetAbsenceTypes", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationAbsenceTypeDto>(
        `/client/mantainer/absence-types`,
        {
          params: filter,
        },
      );
      return response.data;
    },
  });
}

export function useGetAbsenceType(
  publicId: string | null,
  options?: { enabled?: boolean },
) {
  const enabled = (options?.enabled ?? true) && !!publicId;
  return useQuery<AbsenceTypeResponseDto>({
    queryKey: ["GetAbsenceType", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<AbsenceTypeResponseDto>(
        `/client/mantainer/absence-types/${publicId}`,
      );
      return response.data;
    },
    enabled,
    staleTime: 0,
  });
}

export const useCreateAbsenceType = () => {
  return useMutation({
    mutationFn: async (data: AbsenceTypeCreateDto) => {
      const response = await axiosInstance.post(
        `/client/mantainer/absence-types`,
        data,
      );
      return response.data;
    },
  });
};

export const useUpdateAbsenceType = () => {
  return useMutation({
    mutationFn: async ({ id, ...data }: AbsenceTypeUpdateDto) => {
      const response = await axiosInstance.put(
        `/client/mantainer/absence-types/${id}`,
        data,
      );
      return response.data;
    },
  });
};

export const useDeleteAbsenceType = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(
        `/client/mantainer/absence-types/${id}`,
      );
      return response.data;
    },
  });
};

export function useGetBranches(
  filter: BranchFindAllDto,
  options?: { enabled?: boolean },
) {
  return useQuery<PaginationBranchDto>({
    queryKey: [
      "GetBranches",
      filter.page,
      filter.pageSize,
      filter.sort,
      filter.sortBy,
      filter.sortOrder,
      filter.search,
      filter.companyId,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationBranchDto>(
        `/client/mantainer/branches`,
        { params: filter },
      );
      return response.data;
    },
    enabled: options?.enabled !== false,
  });
}

export function useCreateBranch() {
  return useMutation<BranchResponseDto, any, BranchCreateDto>({
    mutationKey: ["CreateBranch"],
    mutationFn: async (data) => {
      const { geolocations, ...rest } = data;
      const response = await axiosInstance.post<BranchResponseDto>(
        `/client/mantainer/branches`,
        {
          ...rest,
          geolocations: geolocations?.map((geolocation) => ({
            name: geolocation.name,
            latitude: geolocation.latitude,
            longitude: geolocation.longitude,
            radius: geolocation.radius,
            type: geolocation.type,
          })),
        },
      );
      return response.data;
    },
  });
}
export function useGetBranchById(id: string) {
  return useQuery<BranchResponseDto>({
    queryKey: ["GetBranchById", id],
    queryFn: async () => {
      const response = await axiosInstance.get<BranchResponseDto>(
        `/client/mantainer/branches/${id}`,
      );
      return response.data;
    },
  });
}

export function useUpdateBranch() {
  return useMutation<BranchResponseDto, any, BranchUpdateDto>({
    mutationKey: ["UpdateBranch"],
    mutationFn: async ({ publicId, ...data }) => {
      const { geolocations, ...rest } = data;
      const response = await axiosInstance.put<BranchResponseDto>(
        `/client/mantainer/branches/${publicId}`,
        {
          ...rest,
          geolocations: geolocations?.map((geolocation) => ({
            name: geolocation.name,
            latitude: geolocation.latitude,
            longitude: geolocation.longitude,
            radius: geolocation.radius,
            type: geolocation.type,
            publicId: geolocation.publicId,
          })),
        },
      );
      return response.data;
    },
  });
}

export function useDeleteBranch() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteBranch"],
    mutationFn: async (id) => {
      await axiosInstance.delete(`/client/mantainer/branches/${id}`);
    },
  });
}

export function useGetStructures(
  params: StructureFindFilterDto,
  options?: { enabled?: boolean },
) {
  return useQuery<PaginationStructureDto>({
    queryKey: ["GetStructures", params],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationStructureDto>(
        `/client/mantainer/structures`,
        { params },
      );
      return response.data;
    },
    enabled: options?.enabled !== false,
  });
}

/** `id` may be company publicId or structure publicId (API resolves both). */
export function useGetOrganizationalUnitsTree(id: string) {
  return useQuery<{
    tree: TreeItem[];
    names: string[];
  }>({
    queryKey: ["GetOrganizationalUnitsTree", id],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/client/mantainer/structures/${id}/organizational-units/tree`,
      );
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateStructure() {
  return useMutation<StructureResponseDto, any, StructureCreateDto>({
    mutationKey: ["CreateStructure"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<StructureResponseDto>(
        `/client/mantainer/structures`,
        data,
      );
      return response.data;
    },
  });
}

export function useUpdateStructure() {
  return useMutation<StructureResponseDto, any, StructureUpdateDto>({
    mutationKey: ["UpdateStructure"],
    mutationFn: async ({ publicId, ...data }) => {
      const response = await axiosInstance.put<StructureResponseDto>(
        `/client/mantainer/structures/${publicId}`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteStructure() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteStructure"],
    mutationFn: async (id) => {
      await axiosInstance.delete(`/client/mantainer/structures/${id}`);
    },
  });
}

export function useGetCompanies(filter: CompanyFindFilterDto) {
  return useQuery<PaginationCompanyDto>({
    queryKey: [
      "GetCompanies",
      filter.page,
      filter.pageSize,
      filter.sort,
      filter.sortBy,
      filter.sortOrder,
      filter.search,
      filter.selector,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationCompanyDto>(
        `/client/companies`,
        { params: filter },
      );
      return response.data;
    },
  });
}

export function useGetCompaniesSelector(
  filter: CompanyFindFilterDto,
  options?: any,
) {
  return useQuery<PaginationCompanyDto>({
    queryKey: [
      "GetCompaniesSelector",
      filter.page,
      filter.pageSize,
      filter.sort,
      filter.sortBy,
      filter.sortOrder,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationCompanyDto>(
        `/client/companies`,
        { params: { ...filter, selector: true } },
      );
      return response.data;
    },
    ...options,
  });
}

export function useGetCompany(id: string) {
  return useQuery<CompanyResponseDto>({
    queryKey: ["GetCompany", id],
    queryFn: async () => {
      const response = await axiosInstance.get<CompanyResponseDto>(
        `/client/companies/${id}`,
      );
      return response.data;
    },
  });
}

export function useCreateCompany() {
  return useMutation<CompanyResponseDto, any, CompanyCreateDto>({
    mutationKey: ["CreateCompany"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<CompanyResponseDto>(
        `/client/companies`,
        data,
      );
      return response.data;
    },
  });
}

export function useUpdateCompany() {
  return useMutation<CompanyResponseDto, any, UpdateCompanyDto>({
    mutationKey: ["UpdateCompany"],
    mutationFn: async ({ publicId, ...data }) => {
      const response = await axiosInstance.put<CompanyResponseDto>(
        `/client/companies/${publicId}`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteCompany() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteCompany"],
    mutationFn: async (id) => {
      await axiosInstance.delete(`/client/companies/${id}`);
    },
  });
}

export function useCreateEmployee() {
  return useMutation<EmployeeResponseDto, any, any>({
    mutationKey: ["CreateEmployee"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<EmployeeResponseDto>(
        `/client/employees`,
        data,
      );
      return response.data;
    },
  });
}

export function useUpdateEmployee() {
  return useMutation<EmployeeResponseDto, any, any>({
    mutationKey: ["UpdateEmployee"],
    mutationFn: async ({ id, ...data }) => {
      const response = await axiosInstance.put<EmployeeResponseDto>(
        `/client/employees/${id}`,
        data,
      );
      return response.data;
    },
  });
}

export function useUpdateEmployeeGeolocations() {
  return useMutation<
    EmployeeResponseDto,
    any,
    { id: string; EmployeeGeolocation: any[] }
  >({
    mutationKey: ["UpdateEmployeeGeolocations"],
    mutationFn: async ({ id, EmployeeGeolocation }) => {
      const response = await axiosInstance.put<EmployeeResponseDto>(
        `/client/employees/${id}/geolocations`,
        { EmployeeGeolocation },
      );
      return response.data;
    },
  });
}

// DTO for uploading employee photo
export interface UploadEmployeePhotoDto {
  fileName: string;
  contentType: string;
  expiresIn?: number;
}

// Response DTO for upload photo (presigned URL)
export interface UploadPhotoResponseDto {
  uploadUrl: string;
  key: string;
  contentType: string;
  expiresAt: string;
}

// Mutation hook to get presigned URL for photo upload
export function useUploadEmployeePhoto() {
  return useMutation<UploadPhotoResponseDto, any, UploadEmployeePhotoDto>({
    mutationKey: ["UploadEmployeePhoto"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<UploadPhotoResponseDto>(
        `/client/employees/upload-photo`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteEmployee() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteEmployee"],
    mutationFn: async (id) => {
      await axiosInstance.delete(`/client/employees/${id}`);
    },
  });
}

export function useGetEmployee(publicId: string) {
  return useQuery<EmployeeResponseDto>({
    queryKey: ["GetEmployee", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<EmployeeResponseDto>(
        `/client/employees/${publicId}`,
      );
      return response.data;
    },
    enabled: !!publicId,
  });
}

export function useGetEmployees(
  filter: EmployeeFindFilterDto,
  options?: Pick<UseQueryOptions<PaginationEmployeeDto>, "enabled">,
) {
  return useQuery<PaginationEmployeeDto>({
    queryKey: ["GetEmployees", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationEmployeeDto>(
        `/client/employees`,
        { params: filter },
      );
      return response.data;
    },
    enabled:
      !!filter.companyId &&
      (options?.enabled !== undefined ? options.enabled : true),
  });
}

export function useGetEmployeesSelector(
  filter: EmployeeFindFilterDto,
  options?: any,
) {
  return useQuery<PaginationEmployeeDto>({
    queryKey: [
      "GetEmployeesSelector",
      filter.page,
      filter.pageSize,
      filter.companyId,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationEmployeeDto>(
        `/client/employees`,
        { params: filter },
      );
      return response.data;
    },
    enabled: !!filter.companyId,
    ...options,
  });
}

export function useGetEmployeesWithShiftActive(filter: EmployeeFindFilterDto) {
  return useQuery<any>({
    queryKey: ["GetEmployeesWithShiftActive", filter],
    queryFn: async () => {
      const response =
        await axiosInstance.get<PaginationEmployeeWithoutShiftResponseDto>(
          `/client/employees/shift/active`,
          { params: filter },
        );
      return response.data;
    },
    enabled: !!filter.companyId,
  });
}

export function useGetEmployeesWithShiftFuture(filter: EmployeeFindFilterDto) {
  return useQuery<any>({
    queryKey: ["GetEmployeesWithShiftFuture", filter],
    queryFn: async () => {
      const response =
        await axiosInstance.get<PaginationEmployeeWithoutShiftResponseDto>(
          `/client/employees/shift/future`,
          { params: filter },
        );
      return response.data;
    },
    enabled: !!filter.companyId,
  });
}

export function useGetEmployeesWithShiftPast(filter: EmployeeFindFilterDto) {
  return useQuery<any>({
    queryKey: ["GetEmployeesWithShiftPast", filter],
    queryFn: async () => {
      const response =
        await axiosInstance.get<PaginationEmployeeWithoutShiftResponseDto>(
          `/client/employees/shift/past`,
          { params: filter },
        );
      return response.data;
    },
    enabled: !!filter.companyId,
  });
}

export function useGetEmployeesShiftWithout(filter: EmployeeFindFilterDto) {
  return useQuery<any>({
    queryKey: ["GetEmployeesShiftWithout", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationEmployeeDto>(
        `/client/employees/shift/without`,
        { params: filter },
      );
      return response.data;
    },
    enabled: !!filter.companyId,
  });
}

export function useGetEmployeesNothingWithout(filter: EmployeeFindFilterDto) {
  return useQuery<any>({
    queryKey: ["GetEmployeesNothingWithout", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationEmployeeDto>(
        `/client/mantainer/shifts/schedules-without`,
        { params: filter },
      );
      return response.data;
    },
  });
}

export function useChangeEmployeeCompany() {
  return useMutation<void, any, { employeeId: string; newCompanyId: string }>({
    mutationKey: ["ChangeEmployeeCompany"],
    mutationFn: async ({ employeeId, newCompanyId }) => {
      await axiosInstance.post(
        `/client/employees/${employeeId}/change-company`,
        {
          newCompanyId,
        },
      );
    },
  });
}

export function useGetEmployeeCompanyHistory(
  employeeId: string,
  pagination?: { page?: number; pageSize?: number; sort?: "asc" | "desc" },
) {
  return useQuery<EmployeeCompanyHistoryPaginatedResponseDto>({
    queryKey: ["GetEmployeeCompanyHistory", employeeId, pagination],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (pagination?.page) params.append("page", pagination.page.toString());
      if (pagination?.pageSize)
        params.append("pageSize", pagination.pageSize.toString());
      if (pagination?.sort) params.append("sort", pagination.sort);

      const response =
        await axiosInstance.get<EmployeeCompanyHistoryPaginatedResponseDto>(
          `/client/employees/${employeeId}/company-history?${params.toString()}`,
        );
      return response.data;
    },
    enabled: !!employeeId,
  });
}

export function useGetCalendar(filter: {
  month: number;
  year: number;
  employeeId: string;
}) {
  return useQuery<any>({
    queryKey: ["GetCalendar", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<any>(
        `/client/mantainer/shifts/calendar/${filter.employeeId}`,
        { params: filter },
      );
      return response.data;
    },
  });
}

export function useGetEmployeesShiftCount(filter: EmployeeFindFilterDto) {
  return useQuery<EmployeeSummaryShiftResponseDto>({
    queryKey: ["GetEmployeesShiftCount", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<EmployeeSummaryShiftResponseDto>(
        `/client/employees/shift/count-summary`,
        { params: filter },
      );
      return response.data;
    },
    enabled: !!filter.companyId,
    refetchInterval: 5000,
  });
}

export function useCreateOrganizationalUnit() {
  return useMutation<
    OrganizationalUnitResponseDto,
    any,
    CreateOrganizationalUnitRequestDto
  >({
    mutationKey: ["CreateOrganizationalUnit"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<OrganizationalUnitResponseDto>(
        `/client/mantainer/organizational-units`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteOrganizationalUnit() {
  return useMutation<void, any, { structureId: string; id: string }>({
    mutationKey: ["DeleteOrganizationalUnit"],
    mutationFn: async ({
      structureId,
      id,
    }: {
      structureId: string;
      id: string;
    }) => {
      await axiosInstance.delete(
        `/client/mantainer/structures/${structureId}/organizational-units/${id}`,
      );
    },
  });
}

export function useGetOrganizationalUnits(structureId: string) {
  return useQuery<OrganizationalUnitDto[]>({
    queryKey: ["GetOrganizationalUnits", structureId],
    queryFn: async () => {
      const response = await axiosInstance.get<OrganizationalUnitDto[]>(
        `/client/mantainer/structures/${structureId}/organizational-units`,
      );
      return response.data;
    },
  });
}

export interface SubOrganizationalUnitsByLevelParams {
  parentId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: SubUnitSortField;
  sortOrder?: "asc" | "desc";
}

export function useGetSubOrganizationalUnitsByLevel(
  structureId: string,
  level: number,
  params: SubOrganizationalUnitsByLevelParams = {},
  options?: { enabled?: boolean },
) {
  const {
    parentId,
    page = 1,
    pageSize = 10,
    search,
    sortBy,
    sortOrder,
  } = params;
  return useQuery<SubOrganizationalUnitsPaginatedResponseDto>({
    queryKey: [
      "GetSubOrganizationalUnitsByLevel",
      structureId,
      level,
      parentId,
      page,
      pageSize,
      search ?? null,
      sortBy ?? null,
      sortOrder ?? null,
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (parentId) searchParams.set("parentId", parentId);
      searchParams.set("page", String(page));
      searchParams.set("pageSize", String(pageSize));
      if (search) searchParams.set("search", search);
      if (sortBy) searchParams.set("sortBy", sortBy);
      if (sortOrder) searchParams.set("sortOrder", sortOrder);
      const url = `/client/mantainer/structures/${structureId}/organizational-units/levels/${level}/sub-units?${searchParams.toString()}`;
      const response =
        await axiosInstance.get<SubOrganizationalUnitsPaginatedResponseDto>(
          url,
        );
      return response.data;
    },
    enabled: options?.enabled !== false && !!structureId && level >= 1,
  });
}

export function useGetOrganizationalUnitsTreeDetailed(
  structureId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<SubOrganizationalUnitTreeNodeDto[]>({
    queryKey: ["GetOrganizationalUnitsTreeDetailed", structureId],
    queryFn: async () => {
      const response = await axiosInstance.get<SubOrganizationalUnitTreeNodeDto[]>(
        `/client/mantainer/structures/${structureId}/organizational-units/tree-detailed`,
      );
      return response.data;
    },
    enabled: options?.enabled !== false && !!structureId,
  });
}

export function useGetValidParentsForLevel(
  structureId: string,
  level: number,
  options?: { enabled?: boolean },
) {
  return useQuery<SubOrganizationalUnitListItemDto[]>({
    queryKey: ["GetValidParentsForLevel", structureId, level],
    queryFn: async () => {
      const response = await axiosInstance.get<
        SubOrganizationalUnitListItemDto[]
      >(
        `/client/mantainer/structures/${structureId}/organizational-units/levels/${level}/valid-parents`,
      );
      return response.data;
    },
    enabled: options?.enabled !== false && !!structureId && level >= 2,
  });
}

export function useCreateSubOrganizationalUnit() {
  return useMutation<
    SubOrganizationalUnitResponseDto,
    any,
    CreateSubOrganizationalUnitRequestDto
  >({
    mutationKey: ["CreateSubOrganizationalUnit"],
    mutationFn: async (data) => {
      const response =
        await axiosInstance.post<SubOrganizationalUnitResponseDto>(
          `/client/mantainer/sub-organizational-units`,
          data,
        );
      return response.data;
    },
  });
}

export function useDeleteSubOrganizationalUnit() {
  return useMutation<void, any, { structureId: string; id: string }>({
    mutationKey: ["DeleteSubOrganizationalUnit"],
    mutationFn: async ({
      structureId,
      id,
    }: {
      structureId: string;
      id: string;
    }) => {
      await axiosInstance.delete(
        `/client/mantainer/structures/${structureId}/sub-organizational-units/${id}`,
      );
    },
  });
}

export function useUpdateOrganizationalUnitName() {
  return useMutation<
    any,
    any,
    { publicId: string; structureId: string; name: string }
  >({
    mutationKey: ["UpdateOrganizationalUnitName"],
    mutationFn: async ({ publicId, structureId, name }) => {
      const response = await axiosInstance.put(
        `/client/mantainer/structures/${structureId}/organizational-units/${publicId}/name`,
        { name },
      );
      return response.data;
    },
  });
}

export function useUpdateSubOrganizationalUnit() {
  const queryClient = useQueryClient();
  return useMutation<
    SubOrganizationalUnitResponseDto,
    unknown,
    {
      structureId: string;
      subUnitPublicId: string;
      body: UpdateSubOrganizationalUnitRequestDto;
    }
  >({
    mutationKey: ["UpdateSubOrganizationalUnit"],
    mutationFn: async ({ structureId, subUnitPublicId, body }) => {
      const response =
        await axiosInstance.put<SubOrganizationalUnitResponseDto>(
          `/client/mantainer/structures/${structureId}/sub-organizational-units/${subUnitPublicId}`,
          body,
        );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey;
          return (
            Array.isArray(key) &&
            key[0] === "GetSubOrganizationalUnitsByLevel" &&
            key[1] === variables.structureId
          );
        },
      });
      queryClient.invalidateQueries({
        queryKey: ["GetValidParentsForLevel", variables.structureId],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetOrganizationalUnits", variables.structureId],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetOrganizationalUnitsTreeDetailed", variables.structureId],
      });
    },
  });
}

export function useUpdateOrganizationalUnit() {
  const queryClient = useQueryClient();
  return useMutation<
    OrganizationalUnitResponseDto,
    unknown,
    {
      structureId: string;
      publicId: string;
      body: UpdateOrganizationalUnitRequestDto;
    }
  >({
    mutationKey: ["UpdateOrganizationalUnit"],
    mutationFn: async ({ structureId, publicId, body }) => {
      const response = await axiosInstance.put<OrganizationalUnitResponseDto>(
        `/client/mantainer/structures/${structureId}/organizational-units/${publicId}`,
        body,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["GetOrganizationalUnits", variables.structureId],
      });
    },
  });
}

export function useUpdateSubOrganizationalUnitName() {
  return useMutation<
    any,
    any,
    { publicId: string; structureId: string; name: string }
  >({
    mutationKey: ["UpdateSubOrganizationalUnitName"],
    mutationFn: async ({ publicId, structureId, name }) => {
      const response = await axiosInstance.put(
        `/client/mantainer/structures/${structureId}/sub-organizational-units/${publicId}/name`,
        { name },
      );
      return response.data;
    },
  });
}

export function useDeleteBranchGeolocation() {
  return useMutation<void, any, BranchGeolocationDeleteDto>({
    mutationKey: ["DeleteBranchGeolocation"],
    mutationFn: async ({ publicId, branchId }) => {
      await axiosInstance.delete(
        `/client/mantainer/branches/${branchId}/geolocations/${publicId}`,
      );
    },
  });
}

export function useCreateBranchGeolocation() {
  return useMutation<
    BranchGeolocationResponseDto,
    any,
    { branchId: string; data: BranchGeolocationCreateDto }
  >({
    mutationKey: ["CreateBranchGeolocation"],
    mutationFn: async ({ branchId, data }) => {
      const response = await axiosInstance.post<BranchGeolocationResponseDto>(
        `/client/mantainer/branches/${branchId}/geolocations`,
        data,
      );
      return response.data;
    },
  });
}

export function useGetBranchGeolocations(branchId: string) {
  return useQuery<BranchGeolocationResponseDto[]>({
    queryKey: ["GetBranchGeolocations", branchId],
    queryFn: async () => {
      const response = await axiosInstance.get<BranchGeolocationResponseDto[]>(
        `/client/mantainer/branches/${branchId}/geolocations`,
      );
      return response.data;
    },
  });
}

export function useGetBranchGeolocation(branchId: string, id: string) {
  return useQuery<BranchGeolocationResponseDto>({
    queryKey: ["GetBranchGeolocation", branchId, id],
    queryFn: async () => {
      const response = await axiosInstance.get<BranchGeolocationResponseDto>(
        `/client/mantainer/branches/${branchId}/geolocations/${id}`,
      );
      return response.data;
    },
  });
}

export function useUpdateBranchGeolocation() {
  return useMutation<
    BranchGeolocationResponseDto,
    any,
    { id: string; branchId: string; data: BranchGeolocationUpdateDto }
  >({
    mutationKey: ["UpdateBranchGeolocation"],
    mutationFn: async ({ id, branchId, data }) => {
      const response = await axiosInstance.put<BranchGeolocationResponseDto>(
        `/client/mantainer/branches/${branchId}/geolocations/${id}`,
        data,
      );
      return response.data;
    },
  });
}

export function useGetHolidays(filter: HolidayFindAllDto) {
  return useQuery<PaginationHolidayDto>({
    queryKey: ["GetHolidays", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationHolidayDto>(
        `/client/mantainer/holidays`,
        { params: filter },
      );
      return response.data;
    },
  });
}

export function useCreateHoliday() {
  return useMutation<HolidayResponseDto, any, HolidayCreateDto>({
    mutationKey: ["CreateHoliday"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<HolidayResponseDto>(
        `/client/mantainer/holidays`,
        data,
      );
      return response.data;
    },
  });
}

export function useGetHoliday(publicId: string) {
  return useQuery<HolidayResponseDto>({
    queryKey: ["GetHoliday", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<HolidayResponseDto>(
        `/client/mantainer/holidays/${publicId}`,
      );
      return response.data;
    },
  });
}

export function useUpdateHoliday() {
  return useMutation<
    HolidayResponseDto,
    any,
    { publicId: string; data: HolidayUpdateDto }
  >({
    mutationKey: ["UpdateHoliday"],
    mutationFn: async ({ publicId, data }) => {
      const response = await axiosInstance.put<HolidayResponseDto>(
        `/client/mantainer/holidays/${publicId}`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteHoliday() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteHoliday"],
    mutationFn: async (publicId) => {
      await axiosInstance.delete(`/client/mantainer/holidays/${publicId}`);
    },
  });
}

export function useGetWarningTypes(filter: WarningTypeFindAllDto) {
  return useQuery<PaginationWarningTypeDto>({
    queryKey: ["GetWarningTypes", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationWarningTypeDto>(
        `/client/mantainer/warnings`,
        { params: filter },
      );
      return response.data;
    },
  });
}

export function useCreateWarningType() {
  return useMutation<WarningTypeResponseDto, any, WarningTypeCreateDto>({
    mutationKey: ["CreateWarningType"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<WarningTypeResponseDto>(
        `/client/mantainer/warnings`,
        data,
      );
      return response.data;
    },
  });
}

export function useGetWarningType(publicId: string) {
  return useQuery<WarningTypeResponseDto>({
    queryKey: ["GetWarningType", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<WarningTypeResponseDto>(
        `/client/mantainer/warnings/${publicId}`,
      );
      return response.data;
    },
  });
}

export function useUpdateWarningType() {
  return useMutation<
    WarningTypeResponseDto,
    any,
    { publicId: string; data: WarningTypeUpdateDto }
  >({
    mutationKey: ["UpdateWarningType"],
    mutationFn: async ({ publicId, data }) => {
      const response = await axiosInstance.put<WarningTypeResponseDto>(
        `/client/mantainer/warnings/${publicId}`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteWarningType() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteWarningType"],
    mutationFn: async (publicId) => {
      await axiosInstance.delete(`/client/mantainer/warnings/${publicId}`);
    },
  });
}

export function useCreateDevice() {
  return useMutation<DeviceResponseDto, any, { data: DeviceCreateDto }>({
    mutationKey: ["CreateDevice"],
    mutationFn: async ({ data }) => {
      const response = await axiosInstance.post<DeviceResponseDto>(
        `/client/devices`,
        data,
      );
      return response.data;
    },
  });
}

export function useGetDevices(filter: DeviceFindAllDto) {
  return useQuery<PaginationDeviceDto>({
    queryKey: ["GetDevices", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationDeviceDto>(
        `/client/devices`,
        { params: filter },
      );
      return response.data;
    },
  });
}

export function useGetDevice(publicId: string) {
  return useQuery<DeviceResponseDto>({
    queryKey: ["GetDevice", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<DeviceResponseDto>(
        `/client/devices/${publicId}`,
      );
      return response.data;
    },
  });
}

export function useUpdateDevice() {
  return useMutation<
    DeviceResponseDto,
    any,
    { publicId: string; data: DeviceUpdateDto }
  >({
    mutationKey: ["UpdateDevice"],
    mutationFn: async ({ publicId, data }) => {
      const response = await axiosInstance.put<DeviceResponseDto>(
        `/client/devices/${publicId}`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteDevice() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteDevice"],
    mutationFn: async (publicId) => {
      await axiosInstance.delete(`/client/devices/${publicId}`);
    },
  });
}

export function useUpdateDeviceStatus() {
  return useMutation<void, any, { publicId: string; isOnline: boolean }>({
    mutationKey: ["UpdateDeviceStatus"],
    mutationFn: async ({ publicId, isOnline }) => {
      await axiosInstance.put(`/client/devices/${publicId}/status`, {
        isOnline,
      });
    },
  });
}

export function useGetDeviceStatus(publicId: string) {
  return useQuery<{ isOnline: boolean }>({
    queryKey: ["GetDeviceStatus", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/client/devices/${publicId}/status`,
      );
      return response.data;
    },
  });
}

export function useGetDeviceQrCode(publicId: string | undefined | null) {
  return useQuery<{ qrCode: string }>({
    queryKey: ["GetDeviceQrCode", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<{ qrCode: string }>(
        `/client/devices/${publicId}/qr-code`,
      );
      return response.data;
    },
    enabled: !!publicId,
  });
}

export function useGetDeviceClaimCode(
  publicId: string | undefined | null,
  enabled: boolean,
) {
  return useQuery<{ claimCode: string }>({
    queryKey: ["GetDeviceClaimCode", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<{ claimCode: string }>(
        `/client/devices/${publicId}/claim-code`,
      );
      return response.data;
    },
    enabled: !!publicId && enabled,
  });
}

export function useGetEmployeeShift() {
  return useMutation<EmployeeDeviceResponseDto, any, AttemptMarkSearchDto>({
    mutationKey: ["GetEmployeeShift"],
    mutationFn: async (params: AttemptMarkSearchDto) => {
      const response = await axiosInstance.get<EmployeeDeviceResponseDto>(
        `/client/employees/my-shift`,
        {
          params,
        },
      );
      return response.data;
    },
  });
}

export function useGetAllAssistancesWithoutSchedule(
  params?: AssistanceFindAllDto,
) {
  return useQuery<PaginationAssistanceDto>({
    queryKey: ["GetAllAssistancesWithoutSchedule", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append("status", "WITHOUT_SCHEDULE");
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await axiosInstance.get(
        `/client/assistances?${queryParams.toString()}`,
      );
      return response.data;
    },
  });
}

export function useGetAllAssistancesIncomplete(params?: AssistanceFindAllDto) {
  return useQuery<PaginationAssistanceDto>({
    queryKey: ["GetAllAssistancesIncomplete", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      queryParams.append("status", "INCOMPLETE");

      const response = await axiosInstance.get(
        `/client/assistances?${queryParams.toString()}`,
      );
      return response.data;
    },
    enabled: !!params?.companyId,
  });
}

export function useGetAssistanceById(publicId?: string) {
  return useQuery<AssistanceResponseDto>({
    queryKey: ["GetAssistance", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<AssistanceResponseDto>(
        `/client/assistances/${publicId}`,
      );
      return response.data;
    },
    enabled: !!publicId,
  });
}

export function useSetAssignedAssistanceScheduleDay() {
  return useMutation({
    mutationFn: async (data: { assistanceId: string; scheduleId: string }) => {
      const response = await axiosInstance.post(
        `/client/assistances/employee-schedule/assigned-day`,
        data,
      );
      return response.data;
    },
  });
}

export function useSetFreeDayFromAssistance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["SetFreeDayFromAssistance"],
    mutationFn: async (data: {
      assistanceId: string;
      confirmationPhrase: string;
    }) => {
      const response = await axiosInstance.post(
        `/client/assistances/${data.assistanceId}/free-day`,
        { confirmationPhrase: data.confirmationPhrase },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            typeof key === "string" &&
            (key.startsWith("GetAllAssistances") ||
              key.startsWith("GetAssistances") ||
              key === "GetAssistanceCount" ||
              key === "GetAssistance")
          );
        },
      });
    },
  });
}

export function useGetAllAssistancesCompleted(params?: AssistanceFindAllDto) {
  return useQuery<PaginationAssistanceDto>({
    queryKey: ["GetAllAssistancesCompleted", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      queryParams.append("status", "COMPLETED");

      const response = await axiosInstance.get(
        `/client/assistances?${queryParams.toString()}`,
      );
      return response.data;
    },
    enabled: !!params?.companyId,
  });
}

export function useGetAllAssistancesAbsent(params?: AssistanceFindAllDto) {
  return useQuery<PaginationAssistanceDto>({
    queryKey: ["GetAllAssistancesAbsent", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      queryParams.append("status", "ABSENT");

      const response = await axiosInstance.get(
        `/client/assistances?${queryParams.toString()}`,
      );
      return response.data;
    },
    enabled: !!params?.companyId,
  });
}

export function useGetAllAssistancesPendingMarks(
  params?: Omit<AssistanceFindAllDto, "status">,
) {
  return useQuery<PaginationAssistanceDto>({
    queryKey: ["GetAllAssistancesPendingMarks", params],
    queryFn: async () => {
      // Obtener asistencias de todos los estados posibles que puedan tener marcas pendientes
      // y filtrar en el frontend
      const baseParams = { ...params };

      // Obtener asistencias COMPLETED, INCOMPLETE y ABSENT (las que más probablemente tengan marcas)
      const statuses = ["COMPLETED", "INCOMPLETE", "ABSENT"];
      const allPromises = statuses.map((status) => {
        const statusParams = {
          ...baseParams,
          status: status as any,
          includeMarks: true,
        };
        const queryParams = new URLSearchParams();
        Object.entries(statusParams).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
        return axiosInstance.get(
          `/client/assistances?${queryParams.toString()}`,
        );
      });

      const responses = await Promise.all(allPromises);

      // Combinar todos los datos
      const allAssistances: any[] = [];

      responses.forEach((response) => {
        if (response.data?.data) {
          allAssistances.push(...response.data.data);
        }
      });

      // Filtrar solo las asistencias que tienen marcas pendientes
      const filteredAssistances = allAssistances.filter((assistance) => {
        return assistance.Marks?.some(
          (mark: any) => mark.status === "WAITING_APPROVAL",
        );
      });

      // Aplicar paginación manual
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedAssistances = filteredAssistances.slice(
        startIndex,
        endIndex,
      );

      // Crear objeto de paginación
      const pagination = {
        current: page,
        pageSize: pageSize,
        totalCount: filteredAssistances.length,
        totalPages: Math.ceil(filteredAssistances.length / pageSize),
        next: endIndex < filteredAssistances.length ? page + 1 : null,
        previous: page > 1 ? page - 1 : null,
        sort: (params?.sort || "desc") as "asc" | "desc",
      };

      return {
        data: paginatedAssistances,
        pagination,
      };
    },
    enabled: !!params?.companyId,
  });
}

export function useGetAssistanceCount(
  params?: AssistanceCountFindAllDto,
  options?: { enabled?: boolean },
) {
  return useQuery<AssistanceCountDto>({
    queryKey: ["GetAssistanceCount", params],
    queryFn: async () => {
      const response = await axiosInstance.get<AssistanceCountDto>(
        `/client/assistances/summary`,
        { params },
      );
      return response.data;
    },
    refetchInterval: 60000,
    enabled: options?.enabled !== false,
  });
}

export function useGetAssistancesPendingExtraApproval(
  params?: Omit<AssistanceFindAllDto, "status" | "extraApproval">,
) {
  return useQuery<PaginationAssistanceDto>({
    queryKey: ["GetAssistancesPendingExtraApproval", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append("status", "COMPLETED");
      queryParams.append("extraApproval", "PENDING");
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const response = await axiosInstance.get(
        `/client/assistances?${queryParams.toString()}`,
      );
      return response.data;
    },
    enabled: !!params?.companyId,
  });
}

export function useGetAssistancesPendingDelayApproval(
  params?: Omit<AssistanceFindAllDto, "status" | "delayApproval">,
) {
  return useQuery<PaginationAssistanceDto>({
    queryKey: ["GetAssistancesPendingDelayApproval", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append("status", "COMPLETED");
      queryParams.append("delayApproval", "PENDING");
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const response = await axiosInstance.get(
        `/client/assistances?${queryParams.toString()}`,
      );
      return response.data;
    },
    enabled: !!params?.companyId,
  });
}

export function useSetAssistanceExtraApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      publicId,
      status,
      approvedSeconds,
    }: {
      publicId: string;
      status: "APPROVED" | "REJECTED";
      approvedSeconds?: number;
    }) => {
      const { data } = await axiosInstance.patch(
        `/client/assistances/${publicId}/extra-approval`,
        { status, ...(approvedSeconds !== undefined && { approvedSeconds }) },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["GetAssistancesPendingExtraApproval"],
      });
      queryClient.invalidateQueries({ queryKey: ["GetAssistanceCount"] });
    },
  });
}

export function useSetAssistanceDelayApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      publicId,
      status,
      approvedSeconds,
    }: {
      publicId: string;
      status: "APPROVED" | "REJECTED";
      approvedSeconds?: number;
    }) => {
      const { data } = await axiosInstance.patch(
        `/client/assistances/${publicId}/delay-approval`,
        { status, ...(approvedSeconds !== undefined && { approvedSeconds }) },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["GetAssistancesPendingDelayApproval"],
      });
      queryClient.invalidateQueries({ queryKey: ["GetAssistanceCount"] });
    },
  });
}

export function useCreateMark() {
  return useMutation<
    any,
    Error,
    {
      mark: RegisterMarkToDoDto;
      assistanceId: string;
      attemptMarkId: string;
    }
  >({
    mutationKey: ["CreateMark"],
    mutationFn: async ({ mark, assistanceId, attemptMarkId }) => {
      const response = await axiosInstance.post(
        `/client/assistances/mark/${assistanceId}/attemptMark/${attemptMarkId}`,
        mark,
      );
      return response.data;
    },
  });
}

export function useAutocomplete() {
  return useMutation<any, any, { assistanceId: string }>({
    mutationKey: ["Autocomplete"],
    mutationFn: async ({ assistanceId }) => {
      const response = await axiosInstance.post(
        `/client/assistances/autocomplete/${assistanceId}`,
        {},
      );
      return response.data;
    },
  });
}

export function useCompleteManualAssistance() {
  return useMutation<
    any,
    any,
    { assistance: AssistanceCompleteManualDto; assistanceId: string }
  >({
    mutationKey: ["CompleteAssistance"],
    mutationFn: async ({ assistance, assistanceId }) => {
      const response = await axiosInstance.post(
        `/client/assistances/complete-manual/${assistanceId}`,
        assistance,
      );
      return response.data;
    },
  });
}

export function useCreateAdditionalMark() {
  return useMutation<
    any,
    any,
    { mark: CreateAdditionalMarkDto; assistanceId: string }
  >({
    mutationKey: ["CreateAdditionalMark"],
    mutationFn: async ({ mark, assistanceId }) => {
      const response = await axiosInstance.post(
        `/client/assistances/mark/additional/${assistanceId}`,
        mark,
      );
      return response.data;
    },
  });
}

export function useCreateBulkAssistances() {
  return useMutation<
    { createdCount: number; skippedCount: number },
    any,
    AssistanceBulkCreateDto
  >({
    mutationKey: ["CreateBulkAssistances"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post(
        `/client/assistances/bulk`,
        data,
      );
      return response.data;
    },
  });
}

export function useAssignManager() {
  return useMutation<
    EmployeeResponseDto,
    any,
    { id: string; employeeManagerCreateDto: EmployeeManagerCreateDto }
  >({
    mutationKey: ["AssignManager"],
    mutationFn: async ({ id, employeeManagerCreateDto }) => {
      const response = await axiosInstance.put<EmployeeResponseDto>(
        `/client/employees/${id}/assign-manager`,
        employeeManagerCreateDto,
      );
      return response.data;
    },
  });
}

export function useDeleteManager() {
  return useMutation<void, any, { id: string; managerId: string }>({
    mutationKey: ["DeleteManager"],
    mutationFn: async ({ id, managerId }) => {
      await axiosInstance.delete(
        `/client/employees/${id}/assign-manager/${managerId}`,
      );
    },
  });
}

export function useDeleteSubordinate() {
  return useMutation<void, any, { id: string; assignmentId: string }>({
    mutationKey: ["DeleteSubordinate"],
    mutationFn: async ({ id, assignmentId }) => {
      await axiosInstance.delete(
        `/client/employees/${id}/assign-subordinate/${assignmentId}`,
      );
    },
  });
}

export function useGetEmployeeManagers(
  employeeId: string,
  filter?: { page?: number; pageSize?: number; sort?: "asc" | "desc" },
) {
  return useQuery({
    queryKey: [
      "GetEmployeeManagers",
      employeeId,
      filter?.page,
      filter?.pageSize,
      filter?.sort,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/client/employees/${employeeId}/assign-manager`,
        { params: filter },
      );
      return response.data;
    },
    enabled: !!employeeId,
  });
}

export function useGetEmployeeSubordinates(
  employeeId: string,
  filter?: { page?: number; pageSize?: number; sort?: "asc" | "desc" },
) {
  return useQuery({
    queryKey: [
      "GetEmployeeSubordinates",
      employeeId,
      filter?.page,
      filter?.pageSize,
      filter?.sort,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/client/employees/${employeeId}/assign-subordinate`,
        { params: filter },
      );
      return response.data;
    },
    enabled: !!employeeId,
  });
}

export function useAssignSubordinate() {
  return useMutation<
    | EmployeeManagerResponseDto[]
    | { success: EmployeeManagerResponseDto[]; warnings: string[] },
    any,
    {
      id: string;
      employeeManagerSubordinateCreateDto: EmployeeManagerSubordinateCreateDto;
    }
  >({
    mutationKey: ["AssignSubordinate"],
    mutationFn: async ({ id, employeeManagerSubordinateCreateDto }) => {
      const response = await axiosInstance.put<
        | EmployeeManagerResponseDto[]
        | { success: EmployeeManagerResponseDto[]; warnings: string[] }
      >(
        `/client/employees/${id}/assign-subordinate`,
        employeeManagerSubordinateCreateDto,
      );
      return response.data;
    },
  });
}

export function useCreateAbsence() {
  return useMutation<AbsenceResponseDto, any, AbsenceCreateDto>({
    mutationKey: ["CreateAbsence"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<AbsenceResponseDto>(
        `/client/absences`,
        data,
      );
      return response.data;
    },
  });
}

export function useUpdateAbsence() {
  return useMutation<AbsenceResponseDto, any, AbsenceUpdateDto>({
    mutationKey: ["UpdateAbsence"],
    mutationFn: async ({ publicId, ...data }) => {
      const response = await axiosInstance.put<AbsenceResponseDto>(
        `/client/absences/${publicId}`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteAbsence() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteAbsence"],
    mutationFn: async (id) => {
      await axiosInstance.delete(`/client/absences/${id}`);
    },
  });
}

export function useGetAbsence(publicId: string) {
  return useQuery<AbsenceResponseDto>({
    queryKey: ["GetAbsence", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<AbsenceResponseDto>(
        `/client/absences/${publicId}`,
      );
      return response.data;
    },
    enabled: !!publicId,
  });
}

type UseGetAbsencesFilter = AbsenceFindFilterDto & { queryEnabled?: boolean };

export function useGetAbsences(filter: UseGetAbsencesFilter) {
  const { queryEnabled = true, ...apiFilter } = filter ?? {};
  return useQuery<PaginationAbsenceDto>({
    queryKey: ["GetAbsences", apiFilter],
    enabled: queryEnabled,
    queryFn: async () => {
      const filteredParams = Object.fromEntries(
        Object.entries(apiFilter).filter(
          ([, value]) => value !== null && value !== "",
        ),
      );
      const response = await axiosInstance.get<PaginationAbsenceDto>(
        `/client/absences`,
        {
          params: filteredParams,
        },
      );
      return response.data;
    },
  });
}

export function useGetAbsenceById() {
  return useMutation<AbsenceResponseDto, any, string>({
    mutationKey: ["GetAbsenceById"],
    mutationFn: async (id) => {
      const response = await axiosInstance.get<AbsenceResponseDto>(
        `/client/absences/${id}`,
      );
      return response.data;
    },
  });
}

export function useDeleteAbsenceById() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteAbsenceById"],
    mutationFn: async (id) => {
      await axiosInstance.delete(`/client/absences/${id}`);
    },
  });
}

// SSO App Services
export function useGetAppSSOs(filter: AppSSOFindFilterDto) {
  return useQuery<SSOPaginatedResponseDto>({
    queryKey: ["GetAppSSOs", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<SSOPaginatedResponseDto>(
        `/client/sso/apps`,
        { params: filter },
      );
      return response.data;
    },
  });
}

export function useCreateAppSSO() {
  return useMutation<AppSSOResponseDto, any, CreateAppSSODto>({
    mutationKey: ["CreateAppSSO"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<AppSSOResponseDto>(
        `/client/sso/apps`,
        data,
      );
      return response.data;
    },
  });
}

export function useUpdateAppSSO() {
  return useMutation<
    AppSSOResponseDto,
    any,
    { id: string; data: UpdateAppSSODto }
  >({
    mutationKey: ["UpdateAppSSO"],
    mutationFn: async ({ id, data }) => {
      const response = await axiosInstance.put<AppSSOResponseDto>(
        `/client/sso/apps/${id}`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteAppSSO() {
  return useMutation<AppSSOResponseDto, any, string>({
    mutationKey: ["DeleteAppSSO"],
    mutationFn: async (id) => {
      const response = await axiosInstance.delete<AppSSOResponseDto>(
        `/client/sso/apps/${id}`,
      );
      return response.data;
    },
  });
}

export function useGetAppSSOById(id: string) {
  return useQuery<AppSSOResponseDto>({
    queryKey: ["GetAppSSOById", id],
    queryFn: async () => {
      const response = await axiosInstance.get<AppSSOResponseDto>(
        `/client/sso/apps/${id}`,
      );
      return response.data;
    },
    enabled: !!id,
  });
}

export function useDeactivateExpiredTokens() {
  return useMutation<{ message: string; count: number }>({
    mutationKey: ["DeactivateExpiredTokens"],
    mutationFn: async () => {
      const response = await axiosInstance.post<{
        message: string;
        count: number;
      }>(`/client/sso/tokens/deactivate-expired`);
      return response.data;
    },
  });
}

// TimeBank Services
export function useGetTimeBanks(filter: TimeBankFindFilterDto) {
  return useQuery<PaginationTimeBankDto>({
    queryKey: ["GetTimeBanks", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationTimeBankDto>(
        `/client/requests/time-bank`,
        { params: filter },
      );
      return response.data;
    },
  });
}

export function useCreateTimeBank() {
  return useMutation<TimeBankResponseDto, any, CreateTimeBankDto>({
    mutationKey: ["CreateTimeBank"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<TimeBankResponseDto>(
        `/client/requests/time-bank`,
        data,
      );
      return response.data;
    },
  });
}

export function useUpdateTimeBank() {
  return useMutation<
    TimeBankResponseDto,
    any,
    { publicId: string; data: UpdateTimeBankDto }
  >({
    mutationKey: ["UpdateTimeBank"],
    mutationFn: async ({ publicId, data }) => {
      const response = await axiosInstance.put<TimeBankResponseDto>(
        `/client/requests/time-bank/${publicId}`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteTimeBank() {
  return useMutation<TimeBankResponseDto, any, string>({
    mutationKey: ["DeleteTimeBank"],
    mutationFn: async (publicId) => {
      const response = await axiosInstance.delete<TimeBankResponseDto>(
        `/client/requests/time-bank/${publicId}`,
      );
      return response.data;
    },
  });
}

export function useGetTimeBankById(publicId: string) {
  return useQuery<TimeBankResponseDto>({
    queryKey: ["GetTimeBankById", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<TimeBankResponseDto>(
        `/client/requests/time-bank/${publicId}`,
      );
      return response.data;
    },
    enabled: !!publicId,
  });
}

export function useGetTimeBankByEmployeeId(employeeId: string) {
  return useQuery<TimeBankResponseDto | null>({
    queryKey: ["GetTimeBankByEmployeeId", employeeId],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationTimeBankDto>(
        `/client/requests/time-bank`,
        { params: { employeeId, pageSize: 1, page: 1 } },
      );
      return response.data?.data?.[0] ?? null;
    },
    enabled: !!employeeId,
  });
}

export function useGetTimeBankAccumulatedHours(employeeId: string) {
  return useQuery<EmployeeTimeBankAccumulatedHoursResponseDto>({
    queryKey: ["GetTimeBankAccumulatedHours", employeeId],
    queryFn: async () => {
      const response =
        await axiosInstance.get<EmployeeTimeBankAccumulatedHoursResponseDto>(
          `/client/requests/time-bank/employee/${employeeId}/accumulated-hours`,
        );
      return response.data;
    },
    enabled: !!employeeId,
  });
}

export function useGetTimeBankStats(companyId?: string) {
  return useQuery<TimeBankStatsDto>({
    queryKey: ["GetTimeBankStats", companyId],
    queryFn: async () => {
      const response = await axiosInstance.get<TimeBankStatsDto>(
        `/client/requests/time-bank/stats`,
        { params: companyId ? { companyId } : {} },
      );
      return response.data;
    },
  });
}

// TimeBankTransaction Services
export function useGetTimeBankTransactions(
  filter: TimeBankTransactionFindFilterDto,
  options?: { enabled?: boolean },
) {
  return useQuery<PaginationTimeBankTransactionDto>({
    queryKey: ["GetTimeBankTransactions", filter],
    queryFn: async () => {
      const response =
        await axiosInstance.get<PaginationTimeBankTransactionDto>(
          `/client/requests/time-bank-transaction`,
          { params: filter },
        );
      return response.data;
    },
    enabled: options?.enabled !== false,
  });
}

export function useCreateTimeBankTransaction() {
  return useMutation<
    TimeBankTransactionResponseDto,
    any,
    CreateTimeBankTransactionDto
  >({
    mutationKey: ["CreateTimeBankTransaction"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<TimeBankTransactionResponseDto>(
        `/client/requests/time-bank-transaction`,
        data,
      );
      return response.data;
    },
  });
}

export function useUpdateTimeBankTransaction() {
  return useMutation<
    TimeBankTransactionResponseDto,
    any,
    { publicId: string; data: UpdateTimeBankTransactionDto }
  >({
    mutationKey: ["UpdateTimeBankTransaction"],
    mutationFn: async ({ publicId, data }) => {
      const response = await axiosInstance.put<TimeBankTransactionResponseDto>(
        `/client/requests/time-bank-transaction/${publicId}`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteTimeBankTransaction() {
  return useMutation<TimeBankTransactionResponseDto, any, string>({
    mutationKey: ["DeleteTimeBankTransaction"],
    mutationFn: async (publicId) => {
      const response =
        await axiosInstance.delete<TimeBankTransactionResponseDto>(
          `/client/requests/time-bank-transaction/${publicId}`,
        );
      return response.data;
    },
  });
}

export function useGetTimeBankTransactionById(publicId: string) {
  return useQuery<TimeBankTransactionResponseDto>({
    queryKey: ["GetTimeBankTransactionById", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<TimeBankTransactionResponseDto>(
        `/client/requests/time-bank-transaction/${publicId}`,
      );
      return response.data;
    },
    enabled: !!publicId,
  });
}

export function useApproveTimeBankTransaction() {
  return useMutation<TimeBankTransactionResponseDto, any, string>({
    mutationKey: ["ApproveTimeBankTransaction"],
    mutationFn: async (publicId) => {
      const response = await axiosInstance.post<TimeBankTransactionResponseDto>(
        `/client/requests/time-bank-transaction/${publicId}/approve`,
      );
      return response.data;
    },
  });
}

export function useRejectTimeBankTransaction() {
  return useMutation<
    TimeBankTransactionResponseDto,
    any,
    { publicId: string; data: TimeBankTransactionRejectDto }
  >({
    mutationKey: ["RejectTimeBankTransaction"],
    mutationFn: async ({ publicId, data }) => {
      const response = await axiosInstance.post<TimeBankTransactionResponseDto>(
        `/client/requests/time-bank-transaction/${publicId}/reject`,
        data,
      );
      return response.data;
    },
  });
}

export function useGetTimeBankTransactionStats(companyId?: string) {
  return useQuery<TimeBankTransactionStatsDto>({
    queryKey: ["GetTimeBankTransactionStats", companyId],
    queryFn: async () => {
      const response = await axiosInstance.get<TimeBankTransactionStatsDto>(
        `/client/requests/time-bank-transaction/stats`,
        { params: companyId ? { companyId } : {} },
      );
      return response.data;
    },
  });
}

// Employee with TimeBank services
export function useGetEmployeesWithTimeBank(
  filter: EmployeeWithTimeBankFindFilterDto,
) {
  return useQuery<PaginationEmployeeWithTimeBankDto>({
    queryKey: ["EmployeesWithTimeBank", filter],
    queryFn: async () => {
      const response =
        await axiosInstance.get<PaginationEmployeeWithTimeBankDto>(
          `/client/requests/employees-with-time-bank`,
          { params: filter },
        );
      return response.data;
    },
  });
}

export function useGetEmployeesWithoutTimeBank(
  filter: EmployeeWithTimeBankFindFilterDto,
) {
  return useQuery<PaginationEmployeeWithTimeBankDto>({
    queryKey: ["EmployeesWithoutTimeBank", filter],
    queryFn: async () => {
      const response =
        await axiosInstance.get<PaginationEmployeeWithTimeBankDto>(
          `/client/requests/employees-without-time-bank`,
          { params: filter },
        );
      return response.data;
    },
  });
}

export function useGetWarningTypesSelector(
  filter: { page?: number; pageSize?: number; sort?: "asc" | "desc" },
  options?: any,
) {
  return useQuery<any>({
    queryKey: [
      "GetWarningTypesSelector",
      filter.page,
      filter.pageSize,
      filter.sort,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get(`/client/mantainer/warnings`, {
        params: filter,
      });
      return response.data;
    },
    ...options,
  });
}

// Company Notifications Services
export function useGetCompanyNotificationsByPublicId(companyPublicId: string) {
  return useQuery<any[]>({
    queryKey: ["GetCompanyNotifications", companyPublicId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/client/company-notifications/company/public/${companyPublicId}`,
      );
      return response.data;
    },
    enabled: !!companyPublicId,
  });
}

export function useCreateCompanyNotification() {
  return useMutation<any, any, any>({
    mutationKey: ["CreateCompanyNotification"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post(
        `/client/company-notifications`,
        data,
      );
      return response.data;
    },
  });
}

export function useUpdateCompanyNotification() {
  return useMutation<any, any, { publicId: string; data: any }>({
    mutationKey: ["UpdateCompanyNotification"],
    mutationFn: async ({ publicId, data }) => {
      const response = await axiosInstance.put(
        `/client/company-notifications/${publicId}`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteCompanyNotification() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteCompanyNotification"],
    mutationFn: async (publicId) => {
      await axiosInstance.delete(`/client/company-notifications/${publicId}`);
    },
  });
}

// Assistance Month Closing
export function useGetAssistanceMonthClosingStatus(
  companyId: string | null,
  year: number,
  month: number,
) {
  return useQuery({
    queryKey: ["AssistanceMonthClosingStatus", companyId, year, month],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/client/companies/${companyId}/assistance-month-closing`,
        { params: { year, month } },
      );
      return response.data;
    },
    enabled: !!companyId && year >= 2000 && month >= 1 && month <= 12,
  });
}

export function useGetAssistanceMonthClosingList(
  companyId: string | null,
  year: number,
  month: number,
) {
  return useQuery({
    queryKey: ["AssistanceMonthClosingList", companyId, year, month],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/client/companies/${companyId}/assistance-month-closing/list`,
        { params: { year, month } },
      );
      return response.data;
    },
    enabled: !!companyId && year >= 2000 && month >= 1 && month <= 12,
  });
}

export function useCloseAssistanceMonth(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["CloseAssistanceMonth"],
    mutationFn: async (body: { year: number; month: number }) => {
      const response = await axiosInstance.post(
        `/client/companies/${companyId}/assistance-month-closing/close`,
        body,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      if (companyId) {
        queryClient.invalidateQueries({
          queryKey: [
            "AssistanceMonthClosingStatus",
            companyId,
            variables.year,
            variables.month,
          ],
        });
      }
    },
  });
}

export function usePrecloseAssistanceMonth(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["PrecloseAssistanceMonth"],
    mutationFn: async (body: {
      year: number;
      month: number;
      approverUserIds?: number[];
    }) => {
      const response = await axiosInstance.post(
        `/client/companies/${companyId}/assistance-month-closing/preclose`,
        body,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      if (companyId) {
        queryClient.invalidateQueries({
          queryKey: [
            "AssistanceMonthClosingStatus",
            companyId,
            variables.year,
            variables.month,
          ],
        });
        queryClient.invalidateQueries({
          queryKey: [
            "AssistanceMonthClosingApprovers",
            companyId,
            variables.year,
            variables.month,
          ],
        });
      }
    },
  });
}

export function useGetAssistanceMonthClosingApprovers(
  companyId: string | null,
  year: number,
  month: number,
) {
  return useQuery({
    queryKey: ["AssistanceMonthClosingApprovers", companyId, year, month],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/client/companies/${companyId}/assistance-month-closing/approvers`,
        { params: { year, month } },
      );
      return response.data;
    },
    enabled: !!companyId && year >= 2000 && month >= 1 && month <= 12,
  });
}

export function useConfirmApproval(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["ConfirmApproval"],
    mutationFn: async (body: { year: number; month: number; pin: string }) => {
      const response = await axiosInstance.post(
        `/client/companies/${companyId}/assistance-month-closing/confirm-approval`,
        { pin: body.pin },
        { params: { year: body.year, month: body.month } },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      if (companyId) {
        queryClient.invalidateQueries({
          queryKey: [
            "AssistanceMonthClosingStatus",
            companyId,
            variables.year,
            variables.month,
          ],
        });
        queryClient.invalidateQueries({
          queryKey: [
            "AssistanceMonthClosingApprovers",
            companyId,
            variables.year,
            variables.month,
          ],
        });
      }
    },
  });
}

export function useGetClosingPinConfigured() {
  return useQuery({
    queryKey: ["ClosingPinConfigured"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        "/client/users/me/closing-pin/configured",
      );
      return response.data;
    },
  });
}

export function useUpdateClosingPin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["UpdateClosingPin"],
    mutationFn: async (body: { currentPin?: string; newPin: string }) => {
      await axiosInstance.patch("/client/users/me/closing-pin", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ClosingPinConfigured"] });
    },
  });
}

export function useReopenAssistanceMonth(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["ReopenAssistanceMonth"],
    mutationFn: async (body: {
      year: number;
      month: number;
      reason: string;
    }) => {
      const response = await axiosInstance.post(
        `/client/companies/${companyId}/assistance-month-closing/reopen`,
        body,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      if (companyId) {
        queryClient.invalidateQueries({
          queryKey: [
            "AssistanceMonthClosingStatus",
            companyId,
            variables.year,
            variables.month,
          ],
        });
        queryClient.invalidateQueries({
          queryKey: [
            "AssistanceMonthReopenHistory",
            companyId,
            variables.year,
            variables.month,
          ],
        });
      }
    },
  });
}

// TimeBankConfig types
export interface TimeBankConfigDto {
  id: string;
  publicId: string;
  companyId: string;
  hoursPerDay: number;
  maxDurationMonths: number;
  allowNegativeBalance: boolean;
  autoExpireEnabled: boolean;
  autoExpireDays: number;
  requiresApprovalForConsumption: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeBankConfigUpdateDto {
  hoursPerDay: number;
  maxDurationMonths: number;
  allowNegativeBalance: boolean;
  autoExpireEnabled: boolean;
  autoExpireDays: number;
  requiresApprovalForConsumption: boolean;
}

export function useGetTimeBankConfig(companyId: string | null) {
  return useQuery<TimeBankConfigDto>({
    queryKey: ["GetTimeBankConfig", companyId],
    queryFn: async () => {
      const response = await axiosInstance.get<TimeBankConfigDto>(
        `/client/requests/time-banks/config`,
        { params: { companyId } },
      );
      return response.data;
    },
    enabled: !!companyId,
  });
}

export function useUpsertTimeBankConfig() {
  return useMutation<
    TimeBankConfigDto,
    any,
    { companyId: string; data: TimeBankConfigUpdateDto }
  >({
    mutationKey: ["UpsertTimeBankConfig"],
    mutationFn: async ({ companyId, data }) => {
      const response = await axiosInstance.post<TimeBankConfigDto>(
        `/client/requests/time-banks/config`,
        data,
        { params: { companyId } },
      );
      return response.data;
    },
  });
}

export function useGetAssistanceMonthReopenHistory(
  companyId: string | null,
  year: number,
  month: number,
  page: number,
  pageSize: number,
) {
  return useQuery({
    queryKey: [
      "AssistanceMonthReopenHistory",
      companyId,
      year,
      month,
      page,
      pageSize,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/client/companies/${companyId}/assistance-month-closing/reopen-history`,
        { params: { year, month, page, pageSize } },
      );
      return response.data;
    },
    enabled:
      !!companyId &&
      year >= 2000 &&
      month >= 1 &&
      month <= 12 &&
      page >= 1 &&
      pageSize >= 1,
  });
}

// ─── Students ────────────────────────────────────────────────────────────────

export function useGetStudents(
  filter: StudentFindFilterDto,
  options?: Pick<UseQueryOptions<PaginationStudentDto>, "enabled">,
) {
  return useQuery<PaginationStudentDto>({
    queryKey: ["GetStudents", filter],
    queryFn: async () => {
      const params: Record<string, unknown> = { ...filter };
      if (filter.isActive !== undefined) {
        params.isActive = filter.isActive ? "true" : "false";
      }
      const response = await axiosInstance.get<PaginationStudentDto>(
        `/client/students`,
        { params },
      );
      return response.data;
    },
    enabled:
      !!filter.companyId &&
      (options?.enabled !== undefined ? options.enabled : true),
  });
}

export function useGetStudent(publicId: string) {
  return useQuery<StudentResponseDto>({
    queryKey: ["GetStudent", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<StudentResponseDto>(
        `/client/students/${publicId}`,
      );
      return response.data;
    },
    enabled: !!publicId,
  });
}

export function useCreateStudent() {
  return useMutation<StudentResponseDto, any, StudentCreateDto>({
    mutationKey: ["CreateStudent"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<StudentResponseDto>(
        `/client/students`,
        data,
      );
      return response.data;
    },
  });
}

export function useUpdateStudent() {
  return useMutation<StudentResponseDto, any, { id: string } & StudentUpdateDto>({
    mutationKey: ["UpdateStudent"],
    mutationFn: async ({ id, ...data }) => {
      const response = await axiosInstance.put<StudentResponseDto>(
        `/client/students/${id}`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteStudent() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteStudent"],
    mutationFn: async (id) => {
      await axiosInstance.delete(`/client/students/${id}`);
    },
  });
}

export function useBulkCreateStudents() {
  return useMutation<any, any, StudentCreateDto[]>({
    mutationKey: ["BulkCreateStudents"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post(`/client/students/bulk-upload`, data);
      return response.data;
    },
  });
}

// ─── Establishments ──────────────────────────────────────────────────────────

import {
  EstablishmentAttendanceDashboardDto,
  EstablishmentAttendanceFindDto,
  EstablishmentCreateDto,
  EstablishmentFindAllDto,
  EstablishmentResponseDto,
  EstablishmentUpdateDto,
  GlobalEstablishmentAttendanceDashboardDto,
  GlobalEstablishmentAttendanceFindDto,
  PaginationEstablishmentDto,
} from "@/app/[locale]/mantainers/establishments/_components/establishment.dto";

export function useGetEstablishments(
  filter: EstablishmentFindAllDto,
  options?: { enabled?: boolean },
) {
  return useQuery<PaginationEstablishmentDto>({
    queryKey: ["GetEstablishments", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationEstablishmentDto>(
        `/client/mantainer/establishments`,
        { params: filter },
      );
      return response.data;
    },
    enabled: options?.enabled !== false,
  });
}

export function useGetEstablishmentById(publicId: string, options?: { enabled?: boolean }) {
  return useQuery<EstablishmentResponseDto>({
    queryKey: ["GetEstablishment", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<EstablishmentResponseDto>(
        `/client/mantainer/establishments/${publicId}`,
      );
      return response.data;
    },
    enabled: (options?.enabled !== false) && !!publicId,
  });
}

export function useGetEstablishmentAttendanceDashboard(
  publicId: string,
  filter: EstablishmentAttendanceFindDto,
  options?: { enabled?: boolean },
) {
  return useQuery<EstablishmentAttendanceDashboardDto>({
    queryKey: ["GetEstablishmentAttendanceDashboard", publicId, filter],
    queryFn: async () => {
      const response = await axiosInstance.get<EstablishmentAttendanceDashboardDto>(
        `/client/mantainer/establishments/${publicId}/attendance-dashboard`,
        { params: filter },
      );
      return response.data;
    },
    enabled: options?.enabled !== false && !!publicId && !!filter.companyId,
    refetchInterval: 60000,
  });
}

export function useGetGlobalEstablishmentAttendanceDashboard(
  filter: GlobalEstablishmentAttendanceFindDto,
  options?: { enabled?: boolean },
) {
  return useQuery<GlobalEstablishmentAttendanceDashboardDto>({
    queryKey: ["GetGlobalEstablishmentAttendanceDashboard", filter],
    queryFn: async () => {
      const response =
        await axiosInstance.get<GlobalEstablishmentAttendanceDashboardDto>(
          `/client/mantainer/establishments/attendance-dashboard/global`,
          { params: filter },
        );
      return response.data;
    },
    enabled: options?.enabled !== false && !!filter.companyId,
    refetchInterval: 60000,
  });
}

export function useCreateEstablishment() {
  return useMutation<EstablishmentResponseDto, any, EstablishmentCreateDto>({
    mutationKey: ["CreateEstablishment"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<EstablishmentResponseDto>(
        `/client/mantainer/establishments`,
        data,
      );
      return response.data;
    },
  });
}

export function useUpdateEstablishment() {
  return useMutation<EstablishmentResponseDto, any, EstablishmentUpdateDto & { publicId: string }>({
    mutationKey: ["UpdateEstablishment"],
    mutationFn: async ({ publicId, ...data }) => {
      const response = await axiosInstance.put<EstablishmentResponseDto>(
        `/client/mantainer/establishments/${publicId}`,
        data,
      );
      return response.data;
    },
  });
}

export function useDeleteEstablishment() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteEstablishment"],
    mutationFn: async (publicId) => {
      await axiosInstance.delete(`/client/mantainer/establishments/${publicId}`);
    },
  });
}
