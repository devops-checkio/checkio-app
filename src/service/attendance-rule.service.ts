"use client";

import {
  AttendanceRuleResponseDto,
  CreateAttendanceRuleDto,
  PaginationAttendanceRuleDto,
} from "@/app/[locale]/mantainers/companies/[companyId]/_components/attendance-rule.dto";
import axiosInstance from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetAttendanceRules(companyId: string) {
  return useQuery<PaginationAttendanceRuleDto>({
    queryKey: ["attendance-rules", companyId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginationAttendanceRuleDto>(
        `/client/companies/${companyId}/attendance-rules`
      );
      return data;
    },
    enabled: !!companyId,
  });
}

export function useCreateAttendanceRule() {
  const queryClient = useQueryClient();

  return useMutation<
    AttendanceRuleResponseDto,
    unknown,
    CreateAttendanceRuleDto
  >({
    mutationFn: async (payload) => {
      const { companyId, ...body } = payload;
      const { data } = await axiosInstance.post<AttendanceRuleResponseDto>(
        `/client/companies/${companyId}/attendance-rules`,
        body
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["attendance-rules", variables.companyId],
      });
    },
  });
}

export function useDeleteAttendanceRule() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, { companyId: string; ruleId: string }>({
    mutationFn: async ({ companyId, ruleId }) => {
      await axiosInstance.delete(
        `/client/companies/${companyId}/attendance-rules/${ruleId}`
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["attendance-rules", variables.companyId],
      });
    },
  });
}
