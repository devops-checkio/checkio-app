import { ScheduleResponseDto } from "@/app/[locale]/mantainers/schedules/_components/schedule.dto";
import {
  EmployeeShiftDeleteResponseDto,
  PaginationShiftDto,
  ShiftCreateDto,
  ShiftEmployeeAssigmentDto,
  ShiftFindAllDto,
  ShiftResponseDto,
  ShiftUpdateDto,
} from "@/app/[locale]/mantainers/shifts/_components/shifth.dto";
import axiosInstance from "@/utils/axios";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useCreateShift() {
  return useMutation<ShiftResponseDto, any, ShiftCreateDto>({
    mutationKey: ["CreateShift"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<ShiftResponseDto>(
        `/client/mantainer/shifts`,
        data
      );
      return response.data;
    },
  });
}

export function useGetShifts(filter: ShiftFindAllDto) {
  return useQuery<PaginationShiftDto>({
    queryKey: [
      "GetShifts",
      filter.page,
      filter.pageSize,
      filter.sort,
      filter.sortBy,
      filter.sortOrder,
      filter.type,
      filter.name,
      filter.day,
      filter.week,
      filter.personType,
      filter.companyId,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationShiftDto>(
        `/client/mantainer/shifts`,
        {
          params: filter,
        }
      );
      return response.data;
    },
  });
}

export function useGetShift(publicId: string | string[] | undefined) {
  return useQuery<ShiftResponseDto>({
    queryKey: ["GetShift", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<ShiftResponseDto>(
        `/client/mantainer/shifts/${publicId}`
      );
      return response.data;
    },
    enabled: !!publicId,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useUpdateShift() {
  return useMutation<ShiftResponseDto, any, ShiftUpdateDto>({
    mutationKey: ["UpdateShift"],
    mutationFn: async (data: ShiftUpdateDto) => {
      const response = await axiosInstance.put<ShiftResponseDto>(
        `/client/mantainer/shifts/${data.publicId}`,
        data
      );
      return response.data;
    },
  });
}

export function useDeleteShift() {
  return useMutation({
    mutationKey: ["DeleteShift"],
    mutationFn: async (publicId: string) => {
      const response = await axiosInstance.delete<ShiftResponseDto>(
        `/client/mantainer/shifts/${publicId}`
      );
      return response.data;
    },
  });
}

export function useGetSchedulesByShiftId(publicId: string | undefined) {
  return useQuery<ScheduleResponseDto[]>({
    queryKey: ["GetSchedulesByShiftId", publicId],
    queryFn: async () => {
      const response = await axiosInstance.get<ScheduleResponseDto[]>(
        `/client/mantainer/shifts/${publicId}/schedules`
      );
      return response.data;
    },
    enabled: !!publicId,
  });
}

export function useCreateShiftForAssistances() {
  return useMutation<ShiftResponseDto, any, ShiftEmployeeAssigmentDto>({
    mutationKey: ["CreateShiftForAssistances"],
    mutationFn: async (data: ShiftEmployeeAssigmentDto) => {
      const response = await axiosInstance.post<ShiftResponseDto>(
        `/client/mantainer/shifts/assigment-shifts`,
        data
      );
      return response.data;
    },
  });
}

export function useDeleteShiftAssigment() {
  return useMutation({
    mutationKey: ["DeleteShiftAssigment"],
    mutationFn: async (publicId: string) => {
      const response =
        await axiosInstance.delete<EmployeeShiftDeleteResponseDto>(
          `/client/mantainer/shifts/assigment-shifts/${publicId}`
        );
      return response.data;
    },
  });
}
