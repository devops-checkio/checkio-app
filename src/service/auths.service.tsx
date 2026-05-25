"use client";

import {
  AccessControlConfigResponseDto,
  AccessControlConfigUpdateDto,
} from "@/app/[locale]/mantainers/roles/[roleId]/_components/types";
import {
  CreateUserDto,
  PaginationUserDto,
  UpdateUserDto,
  UserFindFilterDto,
  UserResponseDto,
} from "@/app/[locale]/mantainers/users/_components/user.dto";
import {
  LoginDto,
  ProfileResponseDto,
  RoleCreateDto,
  RoleDto,
  RolePersmissionDto,
  ServiceDto,
  SSOValidationDto,
  UpdateRolePermissionDto,
} from "@/dto/auth";
import {
  SetPasswordDto,
  SetPasswordResponseDto,
  UpdateProfileDto,
  UpdateProfileResponseDto,
} from "@/dto/profile-update";
import axiosInstance from "@/utils/axios";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useAuth() {
  return useMutation<any, any, LoginDto>({
    mutationKey: ["Auth"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<string>(
        "/client/auth/login",
        data
      );
      return response.data;
    },
  });
}

export function useGetProfile() {
  return useQuery<ProfileResponseDto, any>({
    queryKey: ["GetProfile"],
    queryFn: async () => {
      const response = await axiosInstance.get<ProfileResponseDto>(
        "/client/auth/profile"
      );
      return response.data;
    },
  });
}

export function useCreateRole() {
  return useMutation<RoleDto, any, RoleCreateDto>({
    mutationKey: ["CreateRole"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<RoleDto>(
        "/client/auth/roles",
        data
      );
      return response.data;
    },
  });
}

export function useGetRoles() {
  return useQuery<RoleDto[], any>({
    queryKey: ["GetRoles"],
    queryFn: async () => {
      const response = await axiosInstance.get<RoleDto[]>("/client/auth/roles");
      return response.data;
    },
  });
}

export function useUpdateRolePermissions() {
  return useMutation<RolePersmissionDto, any, UpdateRolePermissionDto>({
    mutationKey: ["UpdateRolePermissions"],
    mutationFn: async (data) => {
      const response = await axiosInstance.put<RolePersmissionDto>(
        "/client/auth/roles/permissions",
        data
      );
      return response.data;
    },
  });
}

export function useGetServices() {
  return useQuery<ServiceDto[], any>({
    queryKey: ["GetServices"],
    queryFn: async () => {
      const response = await axiosInstance.get<ServiceDto[]>(
        "/client/auth/service"
      );
      return response.data;
    },
  });
}

export function useCreateUser() {
  return useMutation<UserResponseDto, any, CreateUserDto>({
    mutationKey: ["CreateUser"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<UserResponseDto>(
        "/client/auth/users",
        data
      );
      return response.data;
    },
  });
}

export function useGetUsers(filter: UserFindFilterDto) {
  return useQuery<PaginationUserDto>({
    queryKey: ["GetUsers", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationUserDto>(
        "/client/auth/users",
        {
          params: filter,
        }
      );
      return response.data;
    },
  });
}

export function useGetUserById(userId: string) {
  return useQuery<UserResponseDto, any>({
    queryKey: ["GetUserById", userId],
    queryFn: async () => {
      const response = await axiosInstance.get<UserResponseDto>(
        `/client/auth/users/${userId}`
      );
      return response.data;
    },
  });
}

export function useUpdateUser() {
  return useMutation<
    UserResponseDto,
    any,
    { userId: string; data: UpdateUserDto }
  >({
    mutationKey: ["UpdateUser"],
    mutationFn: async ({ userId, data }) => {
      const response = await axiosInstance.put<UserResponseDto>(
        `/client/auth/users/${userId}`,
        data
      );
      return response.data;
    },
  });
}

export function useDeleteUser() {
  return useMutation<UserResponseDto, any, string>({
    mutationKey: ["DeleteUser"],
    mutationFn: async (userId) => {
      const response = await axiosInstance.delete<UserResponseDto>(
        `/client/auth/users/${userId}`
      );
      return response.data;
    },
  });
}

export function useGetLogo() {
  return useQuery<{ logo: string }>({
    queryKey: ["GetLogo"],
    queryFn: async () => {
      const response = await axiosInstance.get<{ logo: string }>(
        "/client/auth/logo"
      );
      return response.data;
    },
    initialData: {
      logo: "/logos/logo.svg",
    },
  });
}

export function useSetAccessControlConfig() {
  return useMutation<
    any,
    any,
    { roleId: string; data: AccessControlConfigUpdateDto }
  >({
    mutationKey: ["SetAccessControlConfig"],
    mutationFn: async ({ roleId, data }) => {
      const response = await axiosInstance.post<any>(
        `/client/auth/roles/${roleId}/access-control-configs`,
        data
      );
      return response.data;
    },
  });
}

export function useGetAccessControlConfig(roleId: string) {
  return useQuery<AccessControlConfigResponseDto>({
    queryKey: ["GetAccessControlConfig", roleId],
    queryFn: async () => {
      const response = await axiosInstance.get<any>(
        `/client/auth/roles/${roleId}/access-control-configs`
      );
      return response.data;
    },
    enabled: !!roleId,
  });
}

export function useLoginSSOToken() {
  return useMutation<any, any, SSOValidationDto>({
    mutationKey: ["ValidateSSOToken"],
    mutationFn: async (data) => {
      const params = new URLSearchParams({
        token: data.token,
        appId: data.appId,
        ...(data.email ? { email: data.email } : {}),
      }).toString();

      const response = await axiosInstance.post<any>(
        `/client/auth/sso/login?${params}`
      );
      return response.data;
    },
  });
}

export function useUpdateProfile() {
  return useMutation<UpdateProfileResponseDto, any, UpdateProfileDto>({
    mutationKey: ["UpdateProfile"],
    mutationFn: async (data) => {
      const response = await axiosInstance.put<UpdateProfileResponseDto>(
        "/client/auth/profile",
        data
      );
      return response.data;
    },
  });
}

export function useSetPassword() {
  return useMutation<SetPasswordResponseDto, any, SetPasswordDto>({
    mutationKey: ["SetPassword"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<SetPasswordResponseDto>(
        "/client/auth/set-password",
        data
      );
      return response.data;
    },
  });
}
