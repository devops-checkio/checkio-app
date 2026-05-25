import { useMutation, useQuery } from "@tanstack/react-query";

export interface PassRequestDto {
  employeeId: string;
  passType: "entry" | "exit" | "visit";
  authorizedBy: string;
  validUntil?: string;
  reason: string;
}

export interface PassResponseDto {
  id: string;
  employeeId: string;
  employee: {
    firstName: string;
    lastName: string;
  };
  passType: "entry" | "exit" | "visit";
  authorizedBy: string;
  validUntil?: string;
  reason: string;
  createdAt: string;
  status: "active" | "expired" | "used";
}

// Mock data for simulation
const mockPasses: PassResponseDto[] = [
  {
    id: "1",
    employeeId: "emp1",
    employee: {
      firstName: "John",
      lastName: "Doe",
    },
    passType: "entry",
    authorizedBy: "Admin",
    validUntil: "2024-12-31",
    reason: "Regular access",
    createdAt: "2024-03-20",
    status: "active",
  },
];

export const useGetPasses = (params?: { status?: string }) => {
  return useQuery({
    queryKey: ["passes", params],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Filter by status if provided
      const filteredPasses = params?.status
        ? mockPasses.filter((pass) => pass.status === params.status)
        : mockPasses;

      return { data: filteredPasses };
    },
  });
};

export const useCreatePass = () => {
  return useMutation({
    mutationFn: async (passData: PassRequestDto) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newPass: PassResponseDto = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: passData.employeeId,
        employee: {
          firstName: "New",
          lastName: "Employee",
        },
        passType: passData.passType,
        authorizedBy: passData.authorizedBy,
        validUntil: passData.validUntil,
        reason: passData.reason,
        createdAt: new Date().toISOString(),
        status: "active",
      };

      mockPasses.push(newPass);
      return { data: newPass };
    },
  });
};

export const useUpdatePassStatus = () => {
  return useMutation({
    mutationFn: async ({
      passId,
      status,
    }: {
      passId: string;
      status: "active" | "expired" | "used";
    }) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const passIndex = mockPasses.findIndex((pass) => pass.id === passId);
      if (passIndex !== -1) {
        mockPasses[passIndex].status = status;
        return { data: mockPasses[passIndex] };
      }

      throw new Error("Pass not found");
    },
  });
};
