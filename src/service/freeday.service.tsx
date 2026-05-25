"use client";

import {
  FreedayOverlapCheckResponseDto,
  FreedayRequestApproveDto,
  FreedayRequestCreateDto,
  FreedayRequestFindFilterDto,
  FreedayRequestRejectDto,
  FreedayRequestResponseDto,
  FreedayRequestStatsDto,
  FreedayRequestUpdateDto,
  PaginationFreedayRequestDto,
} from "@/app/[locale]/operations/requests/freeday/_components/freeday.dto";
import axiosInstance from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query hooks
export const useGetFreedayRequests = (params?: FreedayRequestFindFilterDto) => {
  return useQuery({
    queryKey: ["freeday-requests", params],
    enabled: Boolean(params?.companyId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationFreedayRequestDto>(
        "/client/requests/freeday",
        { params }
      );
      return data;
    },
  });
};

export const useGetFreedayRequestById = (id: string) => {
  return useQuery({
    queryKey: ["freeday-request", id],
    queryFn: async () => {
      const { data } = await axiosInstance.get<FreedayRequestResponseDto>(
        `/client/requests/freeday/${id}`
      );
      return data;
    },
    enabled: !!id,
  });
};

export const useGetFreedayRequestStats = (companyId?: string) => {
  return useQuery({
    queryKey: ["freeday-request-stats", companyId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<FreedayRequestStatsDto>(
        "/client/requests/freeday/stats",
        {
          params: { companyId },
        }
      );
      return data;
    },
    enabled: !!companyId,
  });
};

export const useGetPendingFreedayRequests = (
  params?: FreedayRequestFindFilterDto
) => {
  return useQuery({
    queryKey: ["freeday-requests", "pending", params],
    enabled: Boolean(params?.companyId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationFreedayRequestDto>(
        "/client/requests/freeday",
        {
          params: { ...params, status: "PENDING" },
        }
      );
      return data;
    },
  });
};

export const useGetApprovedFreedayRequests = (
  params?: FreedayRequestFindFilterDto
) => {
  return useQuery({
    queryKey: ["freeday-requests", "approved", params],
    enabled: Boolean(params?.companyId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationFreedayRequestDto>(
        "/client/requests/freeday",
        {
          params: { ...params, status: "APPROVED" },
        }
      );
      return data;
    },
  });
};

export const useGetRejectedFreedayRequests = (
  params?: FreedayRequestFindFilterDto
) => {
  return useQuery({
    queryKey: ["freeday-requests", "rejected", params],
    enabled: Boolean(params?.companyId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationFreedayRequestDto>(
        "/client/requests/freeday",
        {
          params: { ...params, status: "REJECTED" },
        }
      );
      return data;
    },
  });
};

export const useCheckFreedayOverlap = (
  employeeId: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
  enabled = true,
  excludePublicId?: string
) => {
  return useQuery({
    queryKey: [
      "freeday-overlap-check",
      employeeId,
      startDate,
      endDate,
      excludePublicId,
    ],
    queryFn: async () => {
      const { data } = await axiosInstance.get<FreedayOverlapCheckResponseDto>(
        "/client/requests/freeday/check-overlap",
        {
          params: {
            employeeId,
            startDate,
            endDate,
            ...(excludePublicId ? { excludePublicId } : {}),
          },
        }
      );
      return data;
    },
    enabled:
      enabled &&
      Boolean(employeeId && startDate && endDate),
    staleTime: 30_000,
  });
};

// Mutation hooks
export const useCreateFreedayRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FreedayRequestCreateDto) => {
      const { data: responseData } = await axiosInstance.post(
        "/client/requests/freeday",
        data
      );
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freeday-requests"] });
      queryClient.invalidateQueries({ queryKey: ["freeday-request-stats"] });
    },
  });
};

export const useUpdateFreedayRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FreedayRequestUpdateDto) => {
      const { data: responseData } = await axiosInstance.put(
        `/client/requests/freeday/${data.publicId}`,
        data
      );
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freeday-requests"] });
      queryClient.invalidateQueries({ queryKey: ["freeday-request-stats"] });
    },
  });
};

export const useApproveFreedayRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FreedayRequestApproveDto) => {
      const { data: responseData } = await axiosInstance.post(
        `/client/requests/freeday/${data.publicId}/approve`
      );
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freeday-requests"] });
      queryClient.invalidateQueries({ queryKey: ["freeday-request-stats"] });
      queryClient.invalidateQueries({ queryKey: ["GetTimeBanks"] });
      queryClient.invalidateQueries({ queryKey: ["GetTimeBank"] });
      queryClient.invalidateQueries({ queryKey: ["GetTimeBankHistory"] });
      queryClient.invalidateQueries({ queryKey: ["GetTimeBankAgreements"] });
      queryClient.invalidateQueries({ queryKey: ["GetTimeBankTransactions"] });
      queryClient.invalidateQueries({
        queryKey: ["GetTimeBankTransactionStats"],
      });
      queryClient.invalidateQueries({ queryKey: ["GetTimeBankKpi"] });
      queryClient.invalidateQueries({
        queryKey: ["GetEmployeesWithTimeBank"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetEmployeesWithoutTimeBank"],
      });
    },
  });
};

export const useRejectFreedayRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rejectionReason,
      publicId,
    }: FreedayRequestRejectDto) => {
      const { data: responseData } = await axiosInstance.post(
        `/client/requests/freeday/${publicId}/reject`,
        {
          rejectionReason,
        }
      );
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freeday-requests"] });
      queryClient.invalidateQueries({ queryKey: ["freeday-request-stats"] });
    },
  });
};

export const useDeleteFreedayRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: responseData } = await axiosInstance.delete(
        `/client/requests/freeday/${id}`
      );
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freeday-requests"] });
      queryClient.invalidateQueries({ queryKey: ["freeday-request-stats"] });
    },
  });
};
