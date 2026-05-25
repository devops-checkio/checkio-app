"use client";

import {
  HourlyPermissionApproveDto,
  HourlyPermissionCreateDto,
  HourlyPermissionFindFilterDto,
  HourlyPermissionRejectDto,
  HourlyPermissionResponseDto,
  HourlyPermissionStatsDto,
  HourlyPermissionUpdateDto,
  PaginationHourlyPermissionDto,
} from "@/app/[locale]/operations/requests/hourly-permission/_components/hourly-permission.dto";
import axiosInstance from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query hooks
export const useGetHourlyPermissions = (
  params?: HourlyPermissionFindFilterDto
) => {
  return useQuery({
    queryKey: ["hourly-permissions", params],
    enabled: Boolean(params?.companyId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationHourlyPermissionDto>(
        "/client/requests/hourly-permission",
        { params }
      );
      return data;
    },
  });
};

export const useGetHourlyPermissionById = (id: string) => {
  return useQuery({
    queryKey: ["hourly-permission", id],
    queryFn: async () => {
      const { data } = await axiosInstance.get<HourlyPermissionResponseDto>(
        `/client/requests/hourly-permission/${id}`
      );
      return data;
    },
    enabled: !!id,
  });
};

export const useGetHourlyPermissionStats = (companyId?: string) => {
  return useQuery({
    queryKey: ["hourly-permission-stats", companyId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<HourlyPermissionStatsDto>(
        "/client/requests/hourly-permission/stats",
        {
          params: { companyId },
        }
      );
      return data;
    },
    enabled: !!companyId,
  });
};

export const useGetPendingHourlyPermissions = (
  params?: HourlyPermissionFindFilterDto
) => {
  return useQuery({
    queryKey: ["hourly-permissions", "pending", params],
    enabled: Boolean(params?.companyId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationHourlyPermissionDto>(
        "/client/requests/hourly-permission",
        {
          params: { ...params, status: "PENDING" },
        }
      );
      return data;
    },
  });
};

export const useGetApprovedHourlyPermissions = (
  params?: HourlyPermissionFindFilterDto
) => {
  return useQuery({
    queryKey: ["hourly-permissions", "approved", params],
    enabled: Boolean(params?.companyId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationHourlyPermissionDto>(
        "/client/requests/hourly-permission",
        {
          params: { ...params, status: "APPROVED" },
        }
      );
      return data;
    },
  });
};

export const useGetRejectedHourlyPermissions = (
  params?: HourlyPermissionFindFilterDto
) => {
  return useQuery({
    queryKey: ["hourly-permissions", "rejected", params],
    enabled: Boolean(params?.companyId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationHourlyPermissionDto>(
        "/client/requests/hourly-permission",
        {
          params: { ...params, status: "REJECTED" },
        }
      );
      return data;
    },
  });
};

// Mutation hooks
export const useCreateHourlyPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HourlyPermissionCreateDto) => {
      const { data: responseData } = await axiosInstance.post(
        "/client/requests/hourly-permission",
        data
      );
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hourly-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["hourly-permission-stats"] });
    },
  });
};

export const useUpdateHourlyPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HourlyPermissionUpdateDto) => {
      const { data: responseData } = await axiosInstance.put(
        `/client/requests/hourly-permission/${data.publicId}`,
        data
      );
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hourly-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["hourly-permission-stats"] });
    },
  });
};

export const useApproveHourlyPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HourlyPermissionApproveDto) => {
      const { data: responseData } = await axiosInstance.post(
        `/client/requests/hourly-permission/${data.publicId}/approve`
      );
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hourly-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["hourly-permission-stats"] });
    },
  });
};

export const useRejectHourlyPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      publicId,
      ...rejectData
    }: HourlyPermissionRejectDto & { publicId: string }) => {
      const { data: responseData } = await axiosInstance.post(
        `/client/requests/hourly-permission/${publicId}/reject`,
        rejectData
      );
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hourly-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["hourly-permission-stats"] });
    },
  });
};

export const useDeleteHourlyPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: responseData } = await axiosInstance.delete(
        `/client/requests/hourly-permission/${id}`
      );
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hourly-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["hourly-permission-stats"] });
    },
  });
};
