"use client";

import {
  OvertimeRequestApproveDto,
  OvertimeRequestCreateDto,
  OvertimeRequestFindFilterDto,
  OvertimeRequestRejectDto,
  OvertimeRequestResponseDto,
  OvertimeRequestStatsDto,
  OvertimeRequestUpdateDto,
  PaginationOvertimeRequestDto,
} from "@/app/[locale]/operations/requests/overtime/_components/overtime-request.dto";
import axiosInstance from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query hooks
export const useGetOvertimeRequests = (
  params?: OvertimeRequestFindFilterDto,
) => {
  return useQuery({
    queryKey: ["overtime-requests", params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationOvertimeRequestDto>(
        "/client/requests/overtime",
        { params },
      );
      return data;
    },
  });
};

export const useGetOvertimeRequestById = (id: string) => {
  return useQuery({
    queryKey: ["overtime-request", id],
    queryFn: async () => {
      const { data } = await axiosInstance.get<OvertimeRequestResponseDto>(
        `/client/requests/overtime/${id}`,
      );
      return data;
    },
    enabled: !!id,
  });
};

export const useGetOvertimeRequestStats = (
  params?: OvertimeRequestFindFilterDto,
) => {
  return useQuery({
    queryKey: ["overtime-request-stats", params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<OvertimeRequestStatsDto>(
        "/client/requests/overtime/stats",
        { params },
      );
      return data;
    },
  });
};

export const useGetPendingOvertimeRequests = (
  params?: OvertimeRequestFindFilterDto,
) => {
  return useQuery({
    queryKey: ["overtime-requests", "pending", params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationOvertimeRequestDto>(
        "/client/requests/overtime",
        {
          params: { ...params, status: "PENDING" },
        },
      );
      return data;
    },
  });
};

export const useGetApprovedOvertimeRequests = (
  params?: OvertimeRequestFindFilterDto,
) => {
  return useQuery({
    queryKey: ["overtime-requests", "approved", params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationOvertimeRequestDto>(
        "/client/requests/overtime",
        {
          params: { ...params, status: "APPROVED" },
        },
      );
      return data;
    },
  });
};

export const useGetRejectedOvertimeRequests = (
  params?: OvertimeRequestFindFilterDto,
) => {
  return useQuery({
    queryKey: ["overtime-requests", "rejected", params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationOvertimeRequestDto>(
        "/client/requests/overtime",
        {
          params: { ...params, status: "REJECTED" },
        },
      );
      return data;
    },
  });
};

// Mutation hooks
export const useCreateOvertimeRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OvertimeRequestCreateDto) => {
      const { data: responseData } = await axiosInstance.post(
        "/client/requests/overtime",
        data,
      );
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-requests"] });
      queryClient.invalidateQueries({ queryKey: ["overtime-request-stats"] });
    },
  });
};

export const useUpdateOvertimeRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OvertimeRequestUpdateDto) => {
      const { data: responseData } = await axiosInstance.put(
        `/client/requests/overtime/${data.publicId}`,
        data,
      );
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-requests"] });
      queryClient.invalidateQueries({ queryKey: ["overtime-request-stats"] });
    },
  });
};

export const useApproveOvertimeRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OvertimeRequestApproveDto) => {
      const { data: responseData } = await axiosInstance.post(
        `/client/requests/overtime/${data.publicId}/approve`,
      );
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-requests"] });
      queryClient.invalidateQueries({ queryKey: ["overtime-request-stats"] });
    },
  });
};

export const useRejectOvertimeRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      publicId,
      ...rejectData
    }: OvertimeRequestRejectDto & { publicId: string }) => {
      const { data: responseData } = await axiosInstance.post(
        `/client/requests/overtime/${publicId}/reject`,
        rejectData,
      );
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-requests"] });
      queryClient.invalidateQueries({ queryKey: ["overtime-request-stats"] });
    },
  });
};

export const useGetPresignedUploadUrl = () => {
  return useMutation<{ url: string }, Error, string>({
    mutationKey: ["GetPresignedUploadUrl"],
    mutationFn: async (key) => {
      const response = await axiosInstance.get<{ url: string }>(
        "/client/requests/get-url-presigned",
        {
          params: { key },
        },
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
        "/client/requests/get-url-presigned",
        {
          params: { key },
        },
      );
      return response.data;
    },
  });
};
