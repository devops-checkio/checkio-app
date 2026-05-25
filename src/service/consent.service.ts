"use client";

import axiosInstance from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ConsentPurposeDto {
  code: string;
  nameKey: string;
  isRequired: boolean;
  legalBasis: string;
  content: { es: string; en: string; pt: string; fr: string };
}

export interface ActivePolicyDto {
  version: string;
  effectiveDate: string;
  preamble?: { es: string; en: string; pt: string; fr: string } | null;
  purposes: ConsentPurposeDto[];
  policyId: string;
}

export interface ConsentStatusDto {
  hasPhotoConsent: boolean;
  hasBiometryConsent: boolean;
  hasGeolocationConsent: boolean;
  hasEmailConsent: boolean;
  hasAllRequiredConsents: boolean;
  pendingPurposes: string[];
}

export function hasPendingConsent(status?: ConsentStatusDto | null) {
  if (!status) {
    return false;
  }

  return (
    !status.hasAllRequiredConsents ||
    (status.pendingPurposes?.length ?? 0) > 0
  );
}

export interface AcceptPurposeItemDto {
  purposeCode: string;
  acceptedContent: { es: string; en: string; pt: string; fr: string };
}

export interface AcceptConsentRequestDto {
  purposes: AcceptPurposeItemDto[];
  ipAddress?: string;
  deviceInfo?: string;
  method: "WEB" | "MOBILE" | "SIGNATURE";
}

export enum ConsentResponseDecision {
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
}

export interface RespondPurposeItemDto {
  purposeCode: string;
  response: ConsentResponseDecision;
  acceptedContent?: { es: string; en: string; pt: string; fr: string };
}

export interface RespondConsentRequestDto {
  purposes: RespondPurposeItemDto[];
  ipAddress?: string;
  deviceInfo?: string;
  method: "WEB" | "MOBILE" | "SIGNATURE";
}

export interface ConsentDashboardResponseDto {
  totalEmployees: number;
  compliantCount: number;
  pendingCount: number;
  revokedCount: number;
  activePolicyVersion: string;
}

export interface EmployeeConsentStatusDto {
  employeePublicId: string;
  firstName: string;
  lastName: string;
  code: string;
  documentNumber?: string;
  pendingPurposes?: string[];
  revokedPurposes?: string[];
}

export interface ConsentEmployeesFilterDto {
  companyId?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedEmployeeConsentResponseDto {
  data: EmployeeConsentStatusDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const consentKeys = {
  all: ["consent"] as const,
  policy: () => [...consentKeys.all, "policy"] as const,
  check: () => [...consentKeys.all, "check"] as const,
  dashboard: (companyId?: string) =>
    [...consentKeys.all, "dashboard", companyId] as const,
  employeesPending: (filters: ConsentEmployeesFilterDto) =>
    [...consentKeys.all, "employees", "pending", filters] as const,
  employeesRevoked: (filters: ConsentEmployeesFilterDto) =>
    [...consentKeys.all, "employees", "revoked", filters] as const,
};

export function useConsentDashboard(companyId?: string) {
  return useQuery<ConsentDashboardResponseDto>({
    queryKey: consentKeys.dashboard(companyId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (companyId) params.set("companyId", companyId);
      const response = await axiosInstance.get<ConsentDashboardResponseDto>(
        `/client/consent/dashboard?${params.toString()}`,
      );
      return response.data;
    },
    enabled: Boolean(companyId),
  });
}

export function useConsentEmployeesPending(filters: ConsentEmployeesFilterDto) {
  return useQuery<PaginatedEmployeeConsentResponseDto>({
    queryKey: consentKeys.employeesPending(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.companyId) params.set("companyId", filters.companyId);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.search) params.set("search", filters.search);
      const response =
        await axiosInstance.get<PaginatedEmployeeConsentResponseDto>(
          `/client/consent/employees/pending?${params.toString()}`,
        );
      return response.data;
    },
    enabled: Boolean(filters.companyId),
  });
}

export function useConsentEmployeesRevoked(filters: ConsentEmployeesFilterDto) {
  return useQuery<PaginatedEmployeeConsentResponseDto>({
    queryKey: consentKeys.employeesRevoked(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.companyId) params.set("companyId", filters.companyId);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.search) params.set("search", filters.search);
      const response =
        await axiosInstance.get<PaginatedEmployeeConsentResponseDto>(
          `/client/consent/employees/revoked?${params.toString()}`,
        );
      return response.data;
    },
    enabled: Boolean(filters.companyId),
  });
}

export function useGetActivePolicy(enabled = true) {
  return useQuery<ActivePolicyDto>({
    queryKey: consentKeys.policy(),
    queryFn: async () => {
      const response = await axiosInstance.get<ActivePolicyDto>(
        "/client/consent/policies/active",
      );
      return response.data;
    },
    enabled,
  });
}

export function useCheckConsent(purposeCode?: string, enabled = true) {
  return useQuery<ConsentStatusDto>({
    queryKey: [...consentKeys.check(), purposeCode],
    queryFn: async () => {
      const params = purposeCode ? { purposeCode } : {};
      const response = await axiosInstance.get<ConsentStatusDto>(
        "/client/consent/check",
        { params },
      );
      return response.data;
    },
    enabled,
  });
}

export function useAcceptConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["consent", "accept"],
    mutationFn: async (dto: AcceptConsentRequestDto) => {
      const response = await axiosInstance.post("/client/consent/accept", dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consentKeys.all });
    },
  });
}

export function useRespondConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["consent", "respond"],
    mutationFn: async (dto: RespondConsentRequestDto) => {
      const response = await axiosInstance.post("/client/consent/respond", dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consentKeys.all });
    },
  });
}

export { consentKeys };

export interface ConsentHistoryFilterDto {
  companyId?: string;
  documentNumber?: string;
  employeePublicId?: string;
  employeeId?: number;
  purposeId?: number;
  purposeCode?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ConsentHistoryItemDto {
  id: number;
  publicId?: string;
  employeePublicId: string | null;
  employeeCode: string | null;
  purposeId: number;
  policyVersionId: number;
  status: string;
  acceptedAt: string;
  method: string;
  ipAddress?: string;
  deviceInfo?: string;
  revokedAt?: string;
  revokedBy?: string;
  acceptedContent?: Record<string, string>;
  integrityHash?: string;
  Purpose?: { code: string };
  Policy?: { version: string };
  Employee?: { firstName?: string; lastName?: string; documentNumber?: string };
}

export interface ConsentHistoryResponseDto {
  data: ConsentHistoryItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useGetConsentHistory(
  filters: ConsentHistoryFilterDto,
  enabled = true,
) {
  return useQuery<ConsentHistoryResponseDto>({
    queryKey: [...consentKeys.all, "history", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.companyId) params.set("companyId", filters.companyId);
      if (filters.documentNumber)
        params.set("documentNumber", filters.documentNumber);
      if (filters.employeePublicId)
        params.set("employeePublicId", filters.employeePublicId);
      if (filters.employeeId)
        params.set("employeeId", String(filters.employeeId));
      if (filters.purposeId) params.set("purposeId", String(filters.purposeId));
      if (filters.purposeCode) params.set("purposeCode", filters.purposeCode);
      if (filters.status) params.set("status", filters.status);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      const response = await axiosInstance.get<ConsentHistoryResponseDto>(
        `/client/consent/history?${params.toString()}`,
      );
      return response.data;
    },
    enabled,
  });
}
