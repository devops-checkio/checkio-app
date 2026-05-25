"use client";

import {
  AuditLogFindFilterDto,
  AuditLogResponseDto,
  PaginationAuditLogDto,
} from "@/app/[locale]/operations/audit/_components/audit.dto";
import axiosInstance from "@/utils/axios";
import { useQuery } from "@tanstack/react-query";

// Query hooks
export const useGetAuditLogs = (params?: AuditLogFindFilterDto) => {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationAuditLogDto>(
        "/client/auth/audit-logs",
        { params }
      );
      return data;
    },
  });
};

export const useGetAuditLogById = (id: string) => {
  return useQuery({
    queryKey: ["audit-log", id],
    queryFn: async () => {
      const { data } = await axiosInstance.get<AuditLogResponseDto>(
        `/client/auth/audit-logs/${id}`
      );
      return data;
    },
    enabled: !!id,
  });
};

export const useGetAuditLogStats = (
  params?: Partial<AuditLogFindFilterDto>
) => {
  return useQuery({
    queryKey: ["audit-log-stats", params],
    queryFn: async () => {
      const statsParams = {
        page: 1,
        pageSize: 1,
        ...params,
      };

      const { data } = await axiosInstance.get<PaginationAuditLogDto>(
        "/client/auth/audit-logs",
        { params: statsParams }
      );

      return {
        totalCount: data.pagination.totalCount,
        totalPages: data.pagination.totalPages,
      };
    },
  });
};
