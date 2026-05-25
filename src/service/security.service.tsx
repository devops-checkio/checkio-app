import {
  Role,
  RolePermission,
  ServiceTemplateDto,
  UpdateRolePermissions,
} from "@/dto/security";
import axiosInstance from "@/utils/axios";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetServices = () => {
  return useQuery<ServiceTemplateDto[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/client/auth/services`, {
        headers: {
          "x-client": "web",
        },
      });
      return data;
    },
  });
};

export const useGetRoles = () => {
  return useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/client/auth/roles`, {
        headers: {
          "x-client": "web",
        },
      });
      return data;
    },
  });
};

export const useGetRoleById = (roleId: string) => {
  return useQuery<RolePermission>({
    queryKey: ["role", roleId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/client/auth/roles/${roleId}`, {
        headers: {
          "x-client": "web",
        },
      });
      return data;
    },
    enabled: !!roleId,
  });
};

export const useCreateRole = () => {
  return useMutation<Role, Error, Role>({
    mutationFn: async (role: Role) => {
      const { data } = await axiosInstance.post(`/client/auth/roles`, role, {
        headers: {
          "x-client": "web",
        },
      });
      return data;
    },
  });
};

export const useUpdateRolePermissions = () => {
  return useMutation<Role, Error, UpdateRolePermissions>({
    mutationFn: async (permissions: UpdateRolePermissions) => {
      const { data } = await axiosInstance.put(
        `/client/auth/roles`,
        permissions,
        {
          headers: {
            "x-client": "web",
          },
        }
      );
      return data;
    },
  });
};

export const useDeleteRole = () => {
  return useMutation<void, Error, string>({
    mutationFn: async (roleId: string) => {
      const { data } = await axiosInstance.delete(
        `/client/auth/roles/${roleId}`,
        {
          headers: {
            "x-client": "web",
          },
        }
      );
      return data;
    },
  });
};
