import {
  PaginationScheduleDto,
  ScheduleCountsResponseDto,
  ScheduleCreateDto,
  ScheduleFindAllBodyDto,
  ScheduleFindAllDto,
  ScheduleResponseDto,
  ScheduleUpdateDto,
} from "@/app/[locale]/mantainers/schedules/_components/schedule.dto";
import axiosInstance from "@/utils/axios";
import { useMutation, useQuery } from "@tanstack/react-query";

function addHeaders() {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-client": "web",
  };
}

export function useCreateSchedule() {
  return useMutation<ScheduleResponseDto, any, ScheduleCreateDto>({
    mutationKey: ["CreateSchedule"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<ScheduleResponseDto>(
        `/client/mantainer/schedules`,
        data,
        { headers: addHeaders(), withCredentials: true }
      );
      return response.data;
    },
  });
}

export function useGetSchedules(
  filter: ScheduleFindAllDto,
  body?: ScheduleFindAllBodyDto,
  options?: { enabled?: boolean }
) {
  return useQuery<PaginationScheduleDto>({
    queryKey: [
      "GetSchedules",
      filter.page,
      filter.pageSize,
      filter.sort,
      filter.code,
      filter.name,
      filter.hasMealBreak,
      filter.createdAt,
      filter.isActive,
      filter.personType,
      body?.publicIds,
      body?.companyIds,
    ],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        queryParams.set(key, String(value));
      });

      const response = await axiosInstance.post<PaginationScheduleDto>(
        `/client/mantainer/schedules/find-all`,
        {
          publicIds: body?.publicIds?.filter((id) => id !== undefined),
          includeBreaks: body?.includeBreaks,
          companyIds: body?.companyIds?.filter((id) => id !== undefined),
          personType: filter.personType,
          isActive: filter.isActive,
        },
        {
          params: queryParams,
          headers: {
            ...addHeaders(),
            withCredentials: true,
          },
        }
      );
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useGetScheduleCounts(
  companyId?: string,
  options?: { enabled?: boolean }
) {
  return useQuery<ScheduleCountsResponseDto>({
    queryKey: ["GetScheduleCounts", companyId],
    queryFn: async () => {
      const response = await axiosInstance.get<ScheduleCountsResponseDto>(
        `/client/mantainer/schedules/counts`,
        {
          params: companyId ? { companyId } : undefined,
          headers: {
            ...addHeaders(),
            withCredentials: true,
          },
        }
      );
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useGetSchedule(publicId: string | null) {
  return useQuery<ScheduleResponseDto>({
    queryKey: ["GetSchedule", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<ScheduleResponseDto>(
        `/client/mantainer/schedules/${publicId}`,
        {
          headers: {
            ...addHeaders(),
            withCredentials: true,
          },
        }
      );
      return response.data;
    },
    enabled: !!publicId,
  });
}

export function useUpdateSchedule() {
  return useMutation<ScheduleResponseDto, any, ScheduleUpdateDto>({
    mutationKey: ["UpdateSchedule"],
    mutationFn: async (data: ScheduleUpdateDto) => {
      const response = await axiosInstance.put<ScheduleResponseDto>(
        `/client/mantainer/schedules/${data.publicId}`,
        data,
        {
          headers: {
            ...addHeaders(),
            withCredentials: true,
          },
        }
      );
      return response.data;
    },
  });
}

export function useDeleteSchedule() {
  return useMutation({
    mutationKey: ["DeleteSchedule"],
    mutationFn: async (publicId: string) => {
      const response = await axiosInstance.delete<ScheduleResponseDto>(
        `/client/mantainer/schedules/${publicId}`,
        {
          headers: {
            ...addHeaders(),
            withCredentials: true,
          },
        }
      );
      return response.data;
    },
  });
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function useSetFreeScheduleDay() {
  return useMutation<any, any, { date: Date; employeeId: string }>({
    mutationKey: ["SetFreeScheduleDay"],
    mutationFn: async (data: { date: Date; employeeId: string }) => {
      const response = await axiosInstance.post(
        `/client/mantainer/shifts/schedule/free`,
        { date: toDateString(data.date), employeeId: data.employeeId },
        {
          headers: {
            ...addHeaders(),
            withCredentials: true,
          },
        }
      );
      return response.data;
    },
  });
}

export function useSetAssignedScheduleDay() {
  return useMutation<
    any,
    any,
    { date: Date; employeeId: string; scheduleId: string; establishmentId?: string }
  >({
    mutationKey: ["SetAssignedScheduleDay"],
    mutationFn: async (data: {
      date: Date;
      employeeId: string;
      scheduleId: string;
      establishmentId?: string;
    }) => {
      const response = await axiosInstance.post(
        `/client/mantainer/shifts/schedule/assigned`,
        {
          date: toDateString(data.date),
          employeeId: data.employeeId,
          scheduleId: data.scheduleId,
          ...(data.establishmentId && { establishmentId: data.establishmentId }),
        },
        {
          headers: {
            ...addHeaders(),
            withCredentials: true,
          },
        }
      );
      return response.data;
    },
  });
}

export function useDeleteEmployeeSchedule() {
  return useMutation<
    any,
    any,
    { employeeId: string; date: Date; scheduleId?: string }
  >({
    mutationKey: ["DeleteEmployeeSchedule"],
    mutationFn: async ({
      employeeId,
      date,
      scheduleId,
    }: {
      employeeId: string;
      date: Date;
      scheduleId?: string;
    }) => {
      const response = await axiosInstance.delete(
        `/client/mantainer/shifts/schedule/${employeeId}`,
        {
          headers: {
            ...addHeaders(),
            withCredentials: true,
          },
          params: {
            date: toDateString(date),
            ...(scheduleId ? { scheduleId } : {}),
          },
        }
      );
      return response.data;
    },
  });
}

export interface BulkStudentScheduleRowInput {
  date: Date | string;
  employeeId: string;
  scheduleId: string;
  establishmentId?: string;
}

export interface BulkStudentScheduleAssignInput {
  rows: BulkStudentScheduleRowInput[];
  replaceOverlaps?: boolean;
  dryRun?: boolean;
  replaceAllEmployeeSchedulesOnConflict?: boolean;
}

export function useBulkAssignStudentSchedules() {
  return useMutation<any, any, BulkStudentScheduleAssignInput>({
    mutationKey: ["BulkAssignStudentSchedules"],
    mutationFn: async (data: BulkStudentScheduleAssignInput) => {
      const response = await axiosInstance.post(
        `/client/mantainer/shifts/schedule/assigned-bulk-students`,
        {
          rows: data.rows.map((row) => ({
            ...row,
            date:
              row.date instanceof Date ? toDateString(row.date) : row.date,
          })),
          replaceOverlaps: !!data.replaceOverlaps,
          dryRun: !!data.dryRun,
          replaceAllEmployeeSchedulesOnConflict: !!data.replaceAllEmployeeSchedulesOnConflict,
        },
        {
          headers: {
            ...addHeaders(),
            withCredentials: true,
          },
        }
      );
      return response.data;
    },
  });
}
