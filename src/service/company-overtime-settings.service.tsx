"use client";

import {
  CompanyOvertimeSettingsResponseDto,
  CreateCompanyOvertimeSettingsDto,
  PaginationCompanyOvertimeSettingsDto,
  UpdateCompanyOvertimeSettingsDto,
} from "@/app/[locale]/mantainers/companies/[companyId]/_components/company-overtime-settings.dto";
import axiosInstance from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetCompanyOvertimeSettings(companyId: string) {
  return useQuery<PaginationCompanyOvertimeSettingsDto>({
    queryKey: ["company-overtime-settings", companyId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationCompanyOvertimeSettingsDto>(
        `/client/companies/${companyId}/overtime-settings`
      );
      return data;
    },
    enabled: !!companyId,
  });
}

export function useCreateCompanyOvertimeSettings() {
  const queryClient = useQueryClient();

  return useMutation<
    CompanyOvertimeSettingsResponseDto,
    any,
    CreateCompanyOvertimeSettingsDto
  >({
    mutationFn: async (data) => {
      const { companyId, ...body } = data;
      const { data: responseData } = await axiosInstance.post<CompanyOvertimeSettingsResponseDto>(
        `/client/companies/${companyId}/overtime-settings`,
        body
      );
      return responseData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["company-overtime-settings", variables.companyId],
      });
    },
  });
}

export function useUpdateCompanyOvertimeSettings() {
  const queryClient = useQueryClient();

  return useMutation<
    CompanyOvertimeSettingsResponseDto,
    any,
    { companyId: string; data: UpdateCompanyOvertimeSettingsDto }
  >({
    mutationFn: async ({ companyId, data }) => {
      const { publicId, ...body } = data;
      const { data: responseData } = await axiosInstance.put<CompanyOvertimeSettingsResponseDto>(
        `/client/companies/${companyId}/overtime-settings/${publicId}`,
        body
      );
      return responseData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["company-overtime-settings", variables.companyId],
      });
    },
  });
}

export function useDeleteCompanyOvertimeSettings() {
  const queryClient = useQueryClient();

  return useMutation<void, any, { companyId: string; publicId: string }>({
    mutationFn: async ({ companyId, publicId }) => {
      await axiosInstance.delete(
        `/client/companies/${companyId}/overtime-settings/${publicId}`
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["company-overtime-settings", variables.companyId],
      });
    },
  });
}

