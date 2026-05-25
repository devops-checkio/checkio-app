"use client";

import {
  DailyPassCreateDto,
  DailyPassFindFilterDto,
  DailyPassRenewDto,
  DailyPassResponseDto,
  DailyPassUpdateDto,
  PaginationDailyPassDto,
} from "@/app/[locale]/operations/daily-passes/_components/daily-pass.dto";
import axiosInstance from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query hooks
export const useGetDailyPasses = (filters?: DailyPassFindFilterDto) => {
  return useQuery<PaginationDailyPassDto>({
    queryKey: ["GetDailyPasses", filters],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationDailyPassDto>(
        `/client/daily-passes`,
        { params: filters }
      );
      return response.data;
    },
  });
};

export const useGetActiveDailyPasses = (filters?: DailyPassFindFilterDto) => {
  return useQuery<PaginationDailyPassDto>({
    queryKey: ["GetActiveDailyPasses", filters],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationDailyPassDto>(
        `/client/daily-passes/active`,
        { params: filters }
      );
      return response.data;
    },
  });
};

export const useGetExpiredDailyPasses = (filters?: DailyPassFindFilterDto) => {
  return useQuery<PaginationDailyPassDto>({
    queryKey: ["GetExpiredDailyPasses", filters],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationDailyPassDto>(
        `/client/daily-passes/expired`,
        { params: filters }
      );
      return response.data;
    },
  });
};

export const useGetDailyPassById = (id: string) => {
  return useQuery<DailyPassResponseDto>({
    queryKey: ["GetDailyPassById", id],
    queryFn: async () => {
      const response = await axiosInstance.get<DailyPassResponseDto>(
        `/client/daily-passes/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
};

// Mutation hooks
export const useCreateDailyPass = () => {
  const queryClient = useQueryClient();

  return useMutation<DailyPassResponseDto, any, DailyPassCreateDto>({
    mutationKey: ["CreateDailyPass"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<DailyPassResponseDto>(
        `/client/daily-passes`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetDailyPasses"] });
      queryClient.invalidateQueries({ queryKey: ["GetActiveDailyPasses"] });
      queryClient.invalidateQueries({ queryKey: ["GetExpiredDailyPasses"] });
    },
  });
};

export const useUpdateDailyPass = () => {
  const queryClient = useQueryClient();

  return useMutation<DailyPassResponseDto, any, DailyPassUpdateDto>({
    mutationKey: ["UpdateDailyPass"],
    mutationFn: async ({ publicId, ...data }) => {
      const response = await axiosInstance.put<DailyPassResponseDto>(
        `/client/daily-passes/${publicId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetDailyPasses"] });
      queryClient.invalidateQueries({ queryKey: ["GetActiveDailyPasses"] });
      queryClient.invalidateQueries({ queryKey: ["GetExpiredDailyPasses"] });
    },
  });
};

export const useDeactivateDailyPass = () => {
  const queryClient = useQueryClient();

  return useMutation<DailyPassResponseDto, any, string>({
    mutationKey: ["DeactivateDailyPass"],
    mutationFn: async (passId) => {
      const response = await axiosInstance.post<DailyPassResponseDto>(
        `/client/daily-passes/${passId}/deactivate`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetDailyPasses"] });
      queryClient.invalidateQueries({ queryKey: ["GetActiveDailyPasses"] });
      queryClient.invalidateQueries({ queryKey: ["GetExpiredDailyPasses"] });
    },
  });
};

export const useRenewDailyPass = () => {
  const queryClient = useQueryClient();

  return useMutation<DailyPassResponseDto, any, DailyPassRenewDto>({
    mutationKey: ["RenewDailyPass"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<DailyPassResponseDto>(
        `/client/daily-passes/${data.publicId}/renew`,
        { additionalDays: data.additionalDays }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetDailyPasses"] });
      queryClient.invalidateQueries({ queryKey: ["GetActiveDailyPasses"] });
      queryClient.invalidateQueries({ queryKey: ["GetExpiredDailyPasses"] });
    },
  });
};

export const useDeleteDailyPass = () => {
  const queryClient = useQueryClient();

  return useMutation<void, any, string>({
    mutationKey: ["DeleteDailyPass"],
    mutationFn: async (passId) => {
      await axiosInstance.delete(`/client/daily-passes/${passId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetDailyPasses"] });
      queryClient.invalidateQueries({ queryKey: ["GetActiveDailyPasses"] });
      queryClient.invalidateQueries({ queryKey: ["GetExpiredDailyPasses"] });
    },
  });
};

export const useRegenerateQrCode = () => {
  const queryClient = useQueryClient();

  return useMutation<DailyPassResponseDto, any, string>({
    mutationKey: ["RegenerateQrCode"],
    mutationFn: async (publicId) => {
      const response = await axiosInstance.post<DailyPassResponseDto>(
        `/client/daily-passes/${publicId}/regenerate-qr`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetDailyPasses"] });
      queryClient.invalidateQueries({ queryKey: ["GetActiveDailyPasses"] });
      queryClient.invalidateQueries({ queryKey: ["GetExpiredDailyPasses"] });
    },
  });
};
