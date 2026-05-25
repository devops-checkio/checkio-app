import {
  AbsenceCreateDto,
  AbsenceFindFilterDto,
  AbsenceResponseDto,
  AbsenceTypeResponseDto,
  AbsenceUpdateDto,
} from "@/app/[locale]/operations/absences/_components/absence.dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Mock data
const mockAbsences: AbsenceResponseDto[] = [
  {
    publicId: "1",
    employeeId: "1",
    absenceTypeId: "1",
    employee: {
      publicId: "1",
      firstName: "Juan",
      lastName: "Pérez",
      documentNumber: "12345678",
      jobId: "1",
      branchId: "1",
    },
    absenceType: {
      publicId: "1",
      name: "Vacaciones",
    },
    startDate: "2024-03-01",
    endDate: "2024-03-05",
    reason: "Vacaciones familiares",
    createdAt: "2024-02-25T10:00:00Z",
    updatedAt: "2024-02-25T10:00:00Z",
    withoutPay: false,
  },
  {
    publicId: "2",
    employeeId: "2",
    absenceTypeId: "2",
    employee: {
      publicId: "2",
      firstName: "María",
      lastName: "González",
      documentNumber: "87654321",
      jobId: "2",
      branchId: "1",
    },
    absenceType: {
      publicId: "2",
      name: "Enfermedad",
    },
    startDate: "2024-03-02",
    endDate: "2024-03-03",
    reason: "Gripe",
    createdAt: "2024-02-26T11:00:00Z",
    updatedAt: "2024-02-26T11:00:00Z",
    withoutPay: false,
  },
];

const mockAbsenceTypes: AbsenceTypeResponseDto[] = [
  {
    publicId: "1",
    name: "Vacaciones",
  },
  {
    publicId: "2",
    name: "Enfermedad",
  },
  {
    publicId: "3",
    name: "Permiso",
  },
];

export const useGetAbsences = (filter: AbsenceFindFilterDto) => {
  return useQuery({
    queryKey: ["absences", filter],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      let filteredAbsences = [...mockAbsences];

      if (filter.employeeId) {
        filteredAbsences = filteredAbsences.filter(
          (absence) => absence.employee?.publicId === filter.employeeId
        );
      }

      return {
        data: filteredAbsences,
        pagination: {
          total: filteredAbsences.length,
          page: 1,
          pageSize: 10,
        },
      };
    },
  });
};

export const useCreateAbsence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (absence: AbsenceCreateDto) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newAbsence: AbsenceResponseDto = {
        publicId: Math.random().toString(36).substr(2, 9),
        employeeId: absence.employeeId,
        absenceTypeId: absence.absenceTypeId,
        employee: {
          publicId: absence.employeeId,
          firstName: "Mock",
          lastName: "Employee",
          documentNumber: "12345678",
          jobId: "1",
          branchId: "1",
        },
        absenceType: mockAbsenceTypes.find(
          (type) => type.publicId === absence.absenceTypeId
        )!,
        startDate: absence.startDate,
        endDate: absence.endDate,
        reason: absence.reason,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        withoutPay: false,
      };

      mockAbsences.push(newAbsence);
      return newAbsence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences"] });
    },
  });
};

export const useUpdateAbsence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (absence: AbsenceUpdateDto) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const index = mockAbsences.findIndex(
        (a) => a.publicId === absence.publicId
      );
      if (index !== -1) {
        mockAbsences[index] = {
          ...mockAbsences[index],
          ...absence,
          updatedAt: new Date().toISOString(),
        };
        return mockAbsences[index];
      }
      throw new Error("Absence not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences"] });
    },
  });
};

export const useDeleteAbsence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (publicId: string) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const index = mockAbsences.findIndex((a) => a.publicId === publicId);
      if (index !== -1) {
        mockAbsences.splice(index, 1);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences"] });
    },
  });
};
