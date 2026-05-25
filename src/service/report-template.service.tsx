"use client";

import {
  CreateReportTemplateDto,
  PaginationReportTemplateDto,
  ReportTemplateFindFilterDto,
  ReportTemplateResponseDto,
  UpdateReportTemplateDto,
} from "@/app/[locale]/reports/manager/_components/report-template.dto";
import axiosInstance from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetReportTemplates(filter: ReportTemplateFindFilterDto) {
  return useQuery<PaginationReportTemplateDto>({
    queryKey: [
      "GetReportTemplates",
      filter.page,
      filter.pageSize,
      filter.sort,
      filter.search,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationReportTemplateDto>(
        `/client/report-templates`,
        { params: filter }
      );
      return response.data;
    },
  });
}

export function useGetReportTemplate(id: string) {
  return useQuery<ReportTemplateResponseDto>({
    queryKey: ["GetReportTemplate", id],
    queryFn: async () => {
      const response = await axiosInstance.get<ReportTemplateResponseDto>(
        `/client/report-templates/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateReportTemplate() {
  const queryClient = useQueryClient();
  return useMutation<ReportTemplateResponseDto, unknown, CreateReportTemplateDto>({
    mutationKey: ["CreateReportTemplate"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<ReportTemplateResponseDto>(
        `/client/report-templates`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetReportTemplates"] });
    },
  });
}

export function useUpdateReportTemplate() {
  const queryClient = useQueryClient();
  return useMutation<
    ReportTemplateResponseDto,
    unknown,
    { id: string; data: UpdateReportTemplateDto }
  >({
    mutationKey: ["UpdateReportTemplate"],
    mutationFn: async ({ id, data }) => {
      const response = await axiosInstance.put<ReportTemplateResponseDto>(
        `/client/report-templates/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["GetReportTemplates"] });
      queryClient.invalidateQueries({
        queryKey: ["GetReportTemplate", variables.id],
      });
    },
  });
}

export function useDeleteReportTemplate() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationKey: ["DeleteReportTemplate"],
    mutationFn: async (id) => {
      await axiosInstance.delete(`/client/report-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetReportTemplates"] });
    },
  });
}

interface GenerateReportResponse {
  reportGenerationProcessId: string;
  message: string;
  status: string;
}

interface GenerateReportFilters {
  startDate?: string;
  endDate?: string;
  jobIds?: string[];
  branchIds?: string[];
  documentNumbers?: string[];
  companyId?: number | string;
  days?: Array<{ format: "numeric" | "text"; value: string }>;
  months?: Array<{ format: "numeric" | "text"; value: string }>;
  years?: string[];
}

export function useGenerateReport() {
  return useMutation<
    GenerateReportResponse,
    unknown,
    { id: string; filters?: GenerateReportFilters }
  >({
    mutationKey: ["GenerateReport"],
    mutationFn: async ({ id, filters }) => {
      const response = await axiosInstance.post<GenerateReportResponse>(
        `/client/report-templates/${id}/generate-report`,
        filters || {}
      );
      return response.data;
    },
  });
}

export function useGetReportsHistory(filter: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["GetReportsHistory", filter],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/client/report-templates/history`,
        {
          params: filter,
        }
      );
      return response.data;
    },
    refetchInterval: (query) => {
      // Always poll if there are any reports with PROCESSING, PENDING, or SCHEDULED status
      // Also poll for recent reports (within last 30 minutes) to catch status changes
      const data = query.state.data as any;
      if (data?.data && Array.isArray(data.data)) {
        const hasActiveReports = data.data.some(
          (report: any) =>
            report.status === "PROCESSING" ||
            report.status === "PENDING" ||
            report.status === "SCHEDULED"
        );
        
        if (hasActiveReports) {
          return 5000; // Continue polling for active reports
        }
        
        // Check for recent reports (within last 2 hours) that might have just changed status
        // Also check for PROCESSING reports that might be stuck (older than 2 hours)
        const now = new Date().getTime();
        const twoHoursAgo = now - 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        
        const hasRecentReports = data.data.some((report: any) => {
          if (!report.createdAt) return false;
          try {
            const reportDate = new Date(report.createdAt).getTime();
            // Check for recent reports OR stuck PROCESSING reports
            const isStuckProcessing = 
              report.status === "PROCESSING" && 
              reportDate < twoHoursAgo;
            return reportDate > twoHoursAgo || isStuckProcessing;
          } catch {
            return false;
          }
        });
        
        // Continue polling for recent reports or stuck PROCESSING reports to catch status changes
        return hasRecentReports ? 5000 : false;
      }
      // If no data yet, keep polling
      return 5000;
    },
    refetchIntervalInBackground: true,
  });
}
