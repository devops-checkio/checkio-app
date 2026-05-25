"use client";

import {
  PaginationWarningDto,
  UpdateWarningDto,
  WarningCreateDto,
  WarningFindFilterDto,
  WarningResponseDto,
} from "@/app/[locale]/operations/warnings/_components/warning.dto";
import axiosInstance from "@/utils/axios";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useGetWarnings(filter: WarningFindFilterDto) {
  return useQuery<PaginationWarningDto>({
    queryKey: [
      "GetWarnings",
      filter.page,
      filter.pageSize,
      filter.sort,
      filter.search,
      filter.employeePublicId,
      filter.companyPublicId,
      filter.warningTypePublicId,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationWarningDto>(
        `/client/warnings`,
        { params: filter }
      );
      return response.data;
    },
  });
}

export function useGetWarning(id: string) {
  return useQuery<WarningResponseDto>({
    queryKey: ["GetWarning", id],
    queryFn: async () => {
      const response = await axiosInstance.get<WarningResponseDto>(
        `/client/warnings/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateWarning() {
  return useMutation<WarningResponseDto, any, WarningCreateDto>({
    mutationKey: ["CreateWarning"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<WarningResponseDto>(
        `/client/warnings`,
        data
      );
      return response.data;
    },
  });
}

export function useUpdateWarning() {
  return useMutation<WarningResponseDto, any, UpdateWarningDto>({
    mutationKey: ["UpdateWarning"],
    mutationFn: async ({ publicId, ...data }) => {
      const response = await axiosInstance.put<WarningResponseDto>(
        `/client/warnings/${publicId}`,
        data
      );
      return response.data;
    },
  });
}

export function useDeleteWarning() {
  return useMutation<void, any, string>({
    mutationKey: ["DeleteWarning"],
    mutationFn: async (id) => {
      await axiosInstance.delete(`/client/warnings/${id}`);
    },
  });
}

export const useGetPresignedUploadUrl = () => {
  return useMutation<{ url: string }, Error, string>({
    mutationKey: ["GetPresignedUploadUrl"],
    mutationFn: async (key) => {
      const response = await axiosInstance.get<{ url: string }>(
        "/backoffice/system/get-url-presigned",
        {
          params: { key },
        }
      );
      return response.data;
    },
  });
};

export const useGetPresignedViewUrl = () => {
  return useMutation<{ url: string }, Error, string>({
    mutationKey: ["GetPresignedViewUrl"],
    mutationFn: async (key) => {
      const response = await axiosInstance.get<{ url: string }>(
        "/backoffice/system/get-url-presigned",
        {
          params: { key },
        }
      );
      return response.data;
    },
  });
};
