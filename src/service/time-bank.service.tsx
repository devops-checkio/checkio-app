"use client";

/**
 * @deprecated Use mantainer.service instead. This service uses the legacy
 * mantainer endpoints (/client/mantainer/time-banks). All time bank functionality
 * has been migrated to RequestController (/client/requests/time-bank) via
 * mantainer.service.tsx
 */

import {
  CreateTimeBankDto,
  PaginationEmployeeTimeBankSummaryDto,
  PaginationTimeBankDto,
  TimeBankConfigDto,
  TimeBankConfigUpdateDto,
  TimeBankFindFilterDto,
  TimeBankKpiDto,
  TimeBankResponseDto,
  UpdateTimeBankDto,
} from "@/app/[locale]/mantainers/time-bank/_components/time-bank.dto";
import axiosInstance from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Time Bank CRUD operations
export function useGetTimeBanks(filter: TimeBankFindFilterDto) {
  return useQuery<PaginationTimeBankDto>({
    queryKey: ["GetTimeBanks", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationTimeBankDto>(
        `/client/mantainer/time-banks`,
        {
          params: filter,
        }
      );
      return response.data;
    },
  });
}

export function useCreateTimeBank() {
  const queryClient = useQueryClient();

  return useMutation<TimeBankResponseDto, any, CreateTimeBankDto>({
    mutationKey: ["CreateTimeBank"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<TimeBankResponseDto>(
        `/client/mantainer/time-banks`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetTimeBanks"] });
      queryClient.invalidateQueries({ queryKey: ["GetEmployeesWithTimeBank"] });
      queryClient.invalidateQueries({
        queryKey: ["GetEmployeesWithoutTimeBank"],
      });
      queryClient.invalidateQueries({ queryKey: ["GetTimeBankKpi"] });
    },
  });
}

export function useUpdateTimeBank() {
  const queryClient = useQueryClient();

  return useMutation<
    TimeBankResponseDto,
    any,
    { publicId: string } & UpdateTimeBankDto
  >({
    mutationKey: ["UpdateTimeBank"],
    mutationFn: async ({ publicId, ...data }) => {
      const response = await axiosInstance.put<TimeBankResponseDto>(
        `/client/mantainer/time-banks/${publicId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetTimeBanks"] });
      queryClient.invalidateQueries({ queryKey: ["GetEmployeesWithTimeBank"] });
      queryClient.invalidateQueries({
        queryKey: ["GetEmployeesWithoutTimeBank"],
      });
      queryClient.invalidateQueries({ queryKey: ["GetTimeBankKpi"] });
    },
  });
}

export function useDeleteTimeBank() {
  const queryClient = useQueryClient();

  return useMutation<void, any, string>({
    mutationKey: ["DeleteTimeBank"],
    mutationFn: async (publicId) => {
      await axiosInstance.delete(`/client/mantainer/time-banks/${publicId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetTimeBanks"] });
      queryClient.invalidateQueries({ queryKey: ["GetEmployeesWithTimeBank"] });
      queryClient.invalidateQueries({
        queryKey: ["GetEmployeesWithoutTimeBank"],
      });
      queryClient.invalidateQueries({ queryKey: ["GetTimeBankKpi"] });
    },
  });
}

// Get time bank by employee ID
export function useGetTimeBank(employeeId: string) {
  return useQuery<TimeBankResponseDto>({
    queryKey: ["GetTimeBank", employeeId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<TimeBankResponseDto>(
          `/client/mantainer/time-banks/${employeeId}`
        );
        return response.data;
      } catch (error) {
        // Fallback to mock data for development
        console.log("Using mock data for time bank");
        return MOCK_TIME_BANK_DATA.employeesWithTimeBank[0] as any;
      }
    },
    enabled: !!employeeId,
  });
}

// Get time bank agreements by employee ID
export function useGetTimeBankAgreements(employeeId: string) {
  return useQuery<PaginationTimeBankDto>({
    queryKey: ["GetTimeBankAgreements", employeeId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<PaginationTimeBankDto>(
          `/client/mantainer/time-banks/${employeeId}/agreements`
        );
        return response.data;
      } catch (error) {
        // Fallback to mock data for development
        console.log("Using mock data for time bank agreements");
        return {
          pagination: {
            current: 1,
            pageSize: 10,
            next: null,
            previous: null,
            totalPages: 1,
            totalCount: MOCK_TIME_BANK_DATA.employeesWithTimeBank.length,
            sort: "desc" as "asc" | "desc",
          },
          data: MOCK_TIME_BANK_DATA.employeesWithTimeBank as any,
        } as PaginationTimeBankDto;
      }
    },
    enabled: !!employeeId,
  });
}

// Get time bank history by employee ID
export function useGetTimeBankHistory(employeeId: string) {
  return useQuery<any>({
    queryKey: ["GetTimeBankHistory", employeeId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<any>(
          `/client/mantainer/time-banks/${employeeId}/history`
        );
        return response.data;
      } catch (error) {
        // Fallback to mock data for development
        console.log("Using mock data for time bank history");
        return {
          pagination: {
            current: 1,
            pageSize: 10,
            next: null,
            previous: null,
            totalPages: 1,
            totalCount: 15,
            sort: "desc" as "asc" | "desc",
          },
          data: [
            {
              id: "1",
              date: "2024-01-15T10:30:00Z",
              type: "CREDIT",
              hours: 8.0,
              balance: 8.0,
              description: "Horas extras trabajadas - Proyecto A",
              reference: "PROJ-001",
              userName: "Admin Sistema",
            },
            {
              id: "2",
              date: "2024-01-20T14:15:00Z",
              type: "DEBIT",
              hours: 4.0,
              balance: 4.0,
              description: "Día de descanso tomado",
              reference: "DESC-001",
              userName: "Admin Sistema",
            },
            {
              id: "3",
              date: "2024-01-25T09:00:00Z",
              type: "CREDIT",
              hours: 12.0,
              balance: 16.0,
              description: "Compensación por trabajo en fin de semana",
              reference: "COMP-001",
              userName: "Admin Sistema",
            },
            {
              id: "4",
              date: "2024-02-01T16:45:00Z",
              type: "DEBIT",
              hours: 8.0,
              balance: 8.0,
              description: "Día de descanso tomado",
              reference: "DESC-002",
              userName: "Admin Sistema",
            },
            {
              id: "5",
              date: "2024-02-10T11:20:00Z",
              type: "ADJUSTMENT",
              hours: 2.0,
              balance: 10.0,
              description: "Ajuste por error en registro anterior",
              reference: "AJUST-001",
              userName: "Admin Sistema",
            },
          ],
        };
      }
    },
    enabled: !!employeeId,
  });
}

// Debit/Credit time bank operation
export function useDebitCreditTimeBank() {
  const queryClient = useQueryClient();

  return useMutation<any, any, any>({
    mutationFn: async (data: {
      timeBankId: string;
      operationType: "CREDIT" | "DEBIT";
      hours: number;
      description: string;
      reference?: string;
      effectiveDate: string;
    }) => {
      try {
        const response = await axiosInstance.post<any>(
          `/client/mantainer/time-banks/${data.timeBankId}/operations`,
          data
        );
        return response.data;
      } catch (error) {
        // Mock successful response for development
        console.log("Mock debit/credit operation successful");
        return { success: true, message: "Operación realizada exitosamente" };
      }
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["GetTimeBank"] });
      queryClient.invalidateQueries({ queryKey: ["GetTimeBankAgreements"] });
      queryClient.invalidateQueries({ queryKey: ["GetTimeBankHistory"] });
    },
  });
}

// Employees with/without time bank
export function useGetEmployeesWithTimeBank(filter: TimeBankFindFilterDto) {
  return useQuery<PaginationTimeBankDto>({
    queryKey: ["GetEmployeesWithTimeBank", filter],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<PaginationTimeBankDto>(
          `/client/mantainer/time-banks/employees-with-time-bank`,
          {
            params: { ...filter, hasTimeBank: true },
          }
        );
        return response.data;
      } catch (error) {
        // Fallback to mock data for development
        console.log("Using mock data for employees with time bank");
        return {
          pagination: {
            current: 1,
            pageSize: 10,
            next: null,
            previous: null,
            totalPages: 1,
            totalCount: MOCK_TIME_BANK_DATA.employeesWithTimeBank.length,
            sort: "desc" as "asc" | "desc",
          },
          data: MOCK_TIME_BANK_DATA.employeesWithTimeBank as any,
        } as PaginationTimeBankDto;
      }
    },
  });
}

export function useGetEmployeesWithoutTimeBank(filter: TimeBankFindFilterDto) {
  return useQuery<PaginationEmployeeTimeBankSummaryDto>({
    queryKey: ["GetEmployeesWithoutTimeBank", filter],
    queryFn: async () => {
      try {
        const response =
          await axiosInstance.get<PaginationEmployeeTimeBankSummaryDto>(
            `/client/mantainer/time-banks/employees-without-time-bank`,
            {
              params: { ...filter, hasTimeBank: false },
            }
          );
        return response.data;
      } catch (error) {
        // Fallback to mock data for development
        console.log("Using mock data for employees without time bank");
        return {
          pagination: {
            current: 1,
            pageSize: 10,
            next: null,
            previous: null,
            totalPages: 1,
            totalCount: MOCK_TIME_BANK_DATA.employeesWithoutTimeBank.length,
            sort: "desc" as "asc" | "desc",
          },
          data: MOCK_TIME_BANK_DATA.employeesWithoutTimeBank,
        };
      }
    },
  });
}

// Time Bank KPI
export function useGetTimeBankKpi(companyId: string) {
  return useQuery<TimeBankKpiDto>({
    queryKey: ["GetTimeBankKpi", companyId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<TimeBankKpiDto>(
          `/client/mantainer/time-banks/kpi`,
          {
            params: { companyId },
          }
        );
        return response.data;
      } catch (error) {
        // Fallback to mock data for development
        console.log("Using mock data for time bank KPI");
        return MOCK_TIME_BANK_DATA.kpiData;
      }
    },
    enabled: !!companyId,
  });
}

// Time Bank Configuration
export function useGetTimeBankConfig(companyId: string) {
  return useQuery<TimeBankConfigDto>({
    queryKey: ["GetTimeBankConfig", companyId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<TimeBankConfigDto>(
          `/client/mantainer/time-banks/config`,
          {
            params: { companyId },
          }
        );
        return response.data;
      } catch (error) {
        // Fallback to mock data for development
        console.log("Using mock data for time bank config");
        return MOCK_TIME_BANK_DATA.configData;
      }
    },
    enabled: !!companyId,
  });
}

export function useCreateTimeBankConfig() {
  const queryClient = useQueryClient();

  return useMutation<TimeBankConfigDto, any, TimeBankConfigUpdateDto>({
    mutationKey: ["CreateTimeBankConfig"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<TimeBankConfigDto>(
        `/client/mantainer/time-banks/config`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetTimeBankConfig"] });
    },
  });
}

export function useUpdateTimeBankConfig() {
  const queryClient = useQueryClient();

  return useMutation<TimeBankConfigDto, any, TimeBankConfigUpdateDto>({
    mutationKey: ["UpdateTimeBankConfig"],
    mutationFn: async ({ publicId, ...data }) => {
      const response = await axiosInstance.put<TimeBankConfigDto>(
        `/client/mantainer/time-banks/config/${publicId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetTimeBankConfig"] });
    },
  });
}

// Mock data for development
export const MOCK_TIME_BANK_DATA = {
  employeesWithTimeBank: [
    {
      id: "1",
      publicId: "tb-001",
      employeeId: "emp-001",
      employee: {
        id: "emp-001",
        publicId: "emp-001",
        code: "EMP001",
        firstName: "Juan Carlos",
        lastName: "Pérez González",
        secondLastName: "González",
        address: "Calle Principal 123",
        personalEmail: "juan.perez@company.com",
        personalPhone: "+56912345678",
        workEmail: "juan.perez@work.com",
        workPhone: "+56912345679",
        documentNumber: "12345678",
        documentType: "DNI" as any,
        integrationCode: "INT001",
        birthDate: "1990-05-15",
        startDate: new Date("2023-01-15"),
        endDate: null,
        isIndefiniteTerm: true,
        canCheckInOtherBranch: true,
        requiresPassword: true,
        canCheckWithoutShift: false,
        canCheckAnywhere: false,
        canCheckFromAnyBranch: true,
        canCheckFromWeb: true,
        hasEmailConsent: true,
        isActive: true,
        contractedHours: 45,
        homeOfficeLat: null,
        homeOfficeLong: null,
        homeOfficeRangeMeters: null,
        gender: "MALE" as any,
        isEncrypted: false,
        subUnit1Id: "1",
        subUnit2Id: null,
        subUnit3Id: null,
        subUnit4Id: null,
        subUnit5Id: null,
        subUnit6Id: null,
        subUnit7Id: null,
        subUnit8Id: null,
        email: "juan.perez@company.com",
        phone: "+56912345678",
        active: true,
        areaId: "area-001",
        sectionId: "section-001",
        companyId: "comp-001",
        userId: 1,
        branchId: "branch-001",
        jobId: "job-001",
        createdAt: "2023-01-15",
        updatedAt: "2023-01-15",
      },
      timeBankType: "ECONOMIC_HOURS" as any,
      hoursPerDay: undefined,
      totalHours: 45.5,
      availableHours: 32.0,
      usedHours: 13.5,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      status: "ACTIVE" as any,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      companyId: "comp-001",
    },
    {
      id: "2",
      publicId: "tb-002",
      employeeId: "emp-002",
      employee: {
        id: "emp-002",
        publicId: "emp-002",
        code: "EMP002",
        firstName: "María Elena",
        lastName: "García Rodríguez",
        secondLastName: "Rodríguez",
        address: "Avenida Central 456",
        personalEmail: "maria.garcia@company.com",
        personalPhone: "+56987654321",
        workEmail: "maria.garcia@work.com",
        workPhone: "+56987654322",
        documentNumber: "87654321",
        documentType: "DNI" as any,
        integrationCode: "INT002",
        birthDate: "1988-12-20",
        startDate: new Date("2023-02-20"),
        endDate: null,
        isIndefiniteTerm: true,
        canCheckInOtherBranch: true,
        requiresPassword: true,
        canCheckWithoutShift: false,
        canCheckAnywhere: false,
        canCheckFromAnyBranch: true,
        canCheckFromWeb: true,
        hasEmailConsent: true,
        isActive: true,
        contractedHours: 40,
        homeOfficeLat: null,
        homeOfficeLong: null,
        homeOfficeRangeMeters: null,
        gender: "FEMALE" as any,
        isEncrypted: false,
        subUnit1Id: "1",
        subUnit2Id: null,
        subUnit3Id: null,
        subUnit4Id: null,
        subUnit5Id: null,
        subUnit6Id: null,
        subUnit7Id: null,
        subUnit8Id: null,
        email: "maria.garcia@company.com",
        phone: "+56987654321",
        active: true,
        areaId: "area-002",
        sectionId: "section-002",
        companyId: "comp-001",
        userId: 2,
        branchId: "branch-001",
        jobId: "job-002",
        createdAt: "2023-02-20",
        updatedAt: "2023-02-20",
      },
      timeBankType: "REST_DAYS" as any,
      hoursPerDay: 8,
      totalHours: 28.0,
      availableHours: 28.0,
      usedHours: 0.0,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      status: "ACTIVE" as any,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      companyId: "comp-001",
    },
    {
      id: "3",
      publicId: "tb-003",
      employeeId: "emp-003",
      employee: {
        id: "emp-003",
        publicId: "emp-003",
        code: "EMP003",
        firstName: "Carlos Alberto",
        lastName: "López Martínez",
        secondLastName: "Martínez",
        address: "Plaza Mayor 789",
        personalEmail: "carlos.lopez@company.com",
        personalPhone: "+56911223344",
        workEmail: "carlos.lopez@work.com",
        workPhone: "+56911223345",
        documentNumber: "11223344",
        documentType: "DNI" as any,
        integrationCode: "INT003",
        birthDate: "1992-08-10",
        startDate: new Date("2023-03-10"),
        endDate: null,
        isIndefiniteTerm: true,
        canCheckInOtherBranch: true,
        requiresPassword: true,
        canCheckWithoutShift: false,
        canCheckAnywhere: false,
        canCheckFromAnyBranch: true,
        canCheckFromWeb: true,
        hasEmailConsent: true,
        isActive: true,
        contractedHours: 44,
        homeOfficeLat: null,
        homeOfficeLong: null,
        homeOfficeRangeMeters: null,
        gender: "MALE" as any,
        isEncrypted: false,
        subUnit1Id: "1",
        subUnit2Id: null,
        subUnit3Id: null,
        subUnit4Id: null,
        subUnit5Id: null,
        subUnit6Id: null,
        subUnit7Id: null,
        subUnit8Id: null,
        email: "carlos.lopez@company.com",
        phone: "+56911223344",
        active: true,
        areaId: "area-001",
        sectionId: "section-001",
        companyId: "comp-001",
        userId: 3,
        branchId: "branch-002",
        jobId: "job-003",
        createdAt: "2023-03-10",
        updatedAt: "2023-03-10",
      },
      timeBankType: "ECONOMIC_HOURS" as any,
      hoursPerDay: undefined,
      totalHours: 67.5,
      availableHours: 15.5,
      usedHours: 52.0,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      status: "ACTIVE" as any,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      companyId: "comp-001",
    },
    {
      id: "4",
      publicId: "tb-004",
      employeeId: "emp-004",
      employee: {
        id: "emp-004",
        publicId: "emp-004",
        code: "EMP004",
        firstName: "Ana Patricia",
        lastName: "Rodríguez Silva",
        secondLastName: "Silva",
        address: "Calle Nueva 321",
        personalEmail: "ana.rodriguez@company.com",
        personalPhone: "+56944332211",
        workEmail: "ana.rodriguez@work.com",
        workPhone: "+56944332212",
        documentNumber: "44332211",
        documentType: "DNI" as any,
        integrationCode: "INT004",
        birthDate: "1985-03-05",
        startDate: new Date("2023-04-05"),
        endDate: null,
        isIndefiniteTerm: true,
        canCheckInOtherBranch: true,
        requiresPassword: true,
        canCheckWithoutShift: false,
        canCheckAnywhere: false,
        canCheckFromAnyBranch: true,
        canCheckFromWeb: true,
        hasEmailConsent: true,
        isActive: true,
        contractedHours: 42,
        homeOfficeLat: null,
        homeOfficeLong: null,
        homeOfficeRangeMeters: null,
        gender: "FEMALE" as any,
        isEncrypted: false,
        subUnit1Id: "1",
        subUnit2Id: null,
        subUnit3Id: null,
        subUnit4Id: null,
        subUnit5Id: null,
        subUnit6Id: null,
        subUnit7Id: null,
        subUnit8Id: null,
        email: "ana.rodriguez@company.com",
        phone: "+56944332211",
        active: true,
        areaId: "area-002",
        sectionId: "section-002",
        companyId: "comp-001",
        userId: 4,
        branchId: "branch-002",
        jobId: "job-004",
        createdAt: "2023-04-05",
        updatedAt: "2023-04-05",
      },
      timeBankType: "REST_DAYS" as any,
      hoursPerDay: 7.5,
      totalHours: 0.0,
      availableHours: 0.0,
      usedHours: 0.0,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      status: "EXPIRED" as any,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      companyId: "comp-001",
    },
    {
      id: "5",
      publicId: "tb-005",
      employeeId: "emp-005",
      employee: {
        id: "emp-005",
        publicId: "emp-005",
        code: "EMP005",
        firstName: "Roberto Daniel",
        lastName: "Fernández Castro",
        secondLastName: "Castro",
        address: "Avenida Norte 654",
        personalEmail: "roberto.fernandez@company.com",
        personalPhone: "+56955667788",
        workEmail: "roberto.fernandez@work.com",
        workPhone: "+56955667789",
        documentNumber: "55667788",
        documentType: "DNI" as any,
        integrationCode: "INT005",
        birthDate: "1987-11-12",
        startDate: new Date("2023-05-12"),
        endDate: null,
        isIndefiniteTerm: true,
        canCheckInOtherBranch: true,
        requiresPassword: true,
        canCheckWithoutShift: false,
        canCheckAnywhere: false,
        canCheckFromAnyBranch: true,
        canCheckFromWeb: true,
        hasEmailConsent: true,
        isActive: true,
        contractedHours: 48,
        homeOfficeLat: null,
        homeOfficeLong: null,
        homeOfficeRangeMeters: null,
        gender: "MALE" as any,
        isEncrypted: false,
        subUnit1Id: "1",
        subUnit2Id: null,
        subUnit3Id: null,
        subUnit4Id: null,
        subUnit5Id: null,
        subUnit6Id: null,
        subUnit7Id: null,
        subUnit8Id: null,
        email: "roberto.fernandez@company.com",
        phone: "+56955667788",
        active: true,
        areaId: "area-001",
        sectionId: "section-001",
        companyId: "comp-001",
        userId: 5,
        branchId: "branch-001",
        jobId: "job-005",
        createdAt: "2023-05-12",
        updatedAt: "2023-05-12",
      },
      timeBankType: "ECONOMIC_HOURS" as any,
      hoursPerDay: undefined,
      totalHours: 89.0,
      availableHours: 89.0,
      usedHours: 0.0,
      startDate: "2023-06-01",
      endDate: "2023-12-31",
      status: "EXPIRED" as any,
      createdAt: "2023-06-01",
      updatedAt: "2023-06-01",
      companyId: "comp-001",
    },
  ],
  employeesWithoutTimeBank: [
    {
      employeeId: "emp-009",
      employeeName: "Diego Alejandro",
      documentNumber: "22334455",
      documentType: "DNI" as any,
      hasTimeBank: false,
    },
    {
      employeeId: "emp-010",
      employeeName: "Sofia Isabel",
      documentNumber: "33445566",
      documentType: "DNI" as any,
      hasTimeBank: false,
    },
    {
      employeeId: "emp-011",
      employeeName: "Andrés Felipe",
      documentNumber: "44556677",
      documentType: "DNI" as any,
      hasTimeBank: false,
    },
    {
      employeeId: "emp-012",
      employeeName: "Valentina Camila",
      documentNumber: "55667788",
      documentType: "DNI" as any,
      hasTimeBank: false,
    },
    {
      employeeId: "emp-013",
      employeeName: "Jorge Luis",
      documentNumber: "66778899",
      documentType: "DNI" as any,
      hasTimeBank: false,
    },
    {
      employeeId: "emp-014",
      employeeName: "Daniela Alejandra",
      documentNumber: "77889900",
      documentType: "DNI" as any,
      hasTimeBank: false,
    },
    {
      employeeId: "emp-015",
      employeeName: "Ricardo José",
      documentNumber: "88990011",
      documentType: "DNI" as any,
      hasTimeBank: false,
    },
    {
      employeeId: "emp-016",
      employeeName: "Natalia Andrea",
      documentNumber: "99001122",
      documentType: "DNI" as any,
      hasTimeBank: false,
    },
    {
      employeeId: "emp-017",
      employeeName: "Fernando Antonio",
      documentNumber: "00112233",
      documentType: "DNI" as any,
      hasTimeBank: false,
    },
    {
      employeeId: "emp-018",
      employeeName: "Gabriela María",
      documentNumber: "11223344",
      documentType: "DNI" as any,
      hasTimeBank: false,
    },
    {
      employeeId: "emp-019",
      employeeName: "Alejandro José",
      documentNumber: "22334455",
      documentType: "DNI" as any,
      hasTimeBank: false,
    },
    {
      employeeId: "emp-020",
      employeeName: "Mariana Patricia",
      documentNumber: "33445566",
      documentType: "DNI" as any,
      hasTimeBank: false,
    },
  ],
  kpiData: {
    totalEmployeesWithTimeBank: 156,
    totalEmployeesWithoutTimeBank: 42,
    totalAccumulatedHours: 2847.5,
    averageHoursPerEmployee: 18.25,
    totalUsedHours: 1245.3,
    totalAvailableHours: 1602.2,
    activeTimeBanks: 142,
    expiredTimeBanks: 14,
  },
  configData: {
    id: "config-001",
    publicId: "config-001",
    companyId: "comp-001",
    hoursPerDay: 8,
    maxDurationMonths: 12,
    allowNegativeBalance: false,
    autoExpireEnabled: true,
    autoExpireDays: 30,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
};
