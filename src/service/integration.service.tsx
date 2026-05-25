"use client";

import {
  ApiTokenCreateResponseDto,
  ApiTokenFindFilterDto,
  ApiTokenResponseDto,
  CreateApiTokenDto,
  PaginationApiTokenDto,
  UpdateApiTokenDto,
} from "@/app/[locale]/mantainers/integrations/_components/api-token.dto";
import {
  IntegrationCreateDto,
  IntegrationResponseDto,
  IntegrationTestConnectionResponseDto,
  PaginationIntegrationDto,
  type UpdateIntegrationDto,
} from "@/app/[locale]/integrations/_components/integration.dto";
import axiosInstance from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function addHeaders() {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-client": "web",
  };
}

export function useGetApiTokens(
  filter: ApiTokenFindFilterDto,
  options?: { enabled?: boolean }
) {
  return useQuery<PaginationApiTokenDto>({
    queryKey: ["GetApiTokens", filter],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationApiTokenDto>(
        `/client/integration/api-tokens`,
        {
          params: filter,
          headers: addHeaders(),
        }
      );
      return response.data;
    },
    enabled: options?.enabled !== false,
  });
}

export function useCreateApiToken() {
  const queryClient = useQueryClient();

  return useMutation<ApiTokenCreateResponseDto, Error, CreateApiTokenDto>({
    mutationKey: ["CreateApiToken"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<ApiTokenCreateResponseDto>(
        `/client/integration/api-tokens`,
        data,
        {
          headers: addHeaders(),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetApiTokens"] });
    },
  });
}

export function useUpdateApiToken() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiTokenResponseDto,
    Error,
    { id: string; data: UpdateApiTokenDto }
  >({
    mutationKey: ["UpdateApiToken"],
    mutationFn: async ({ id, data }) => {
      const response = await axiosInstance.put<ApiTokenResponseDto>(
        `/client/integration/api-tokens/${id}`,
        data,
        {
          headers: addHeaders(),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetApiTokens"] });
    },
  });
}

export function useDeleteApiToken() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationKey: ["DeleteApiToken"],
    mutationFn: async (id) => {
      await axiosInstance.delete(`/client/integration/api-tokens/${id}`, {
        headers: addHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetApiTokens"] });
    },
  });
}

export function useRegenerateApiToken() {
  const queryClient = useQueryClient();

  return useMutation<ApiTokenCreateResponseDto, Error, string>({
    mutationKey: ["RegenerateApiToken"],
    mutationFn: async (id) => {
      const response = await axiosInstance.post<ApiTokenCreateResponseDto>(
        `/client/integration/api-tokens/${id}/regenerate`,
        {},
        {
          headers: addHeaders(),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetApiTokens"] });
    },
  });
}

export function useGetApiTokenModules() {
  return useQuery<string[]>({
    queryKey: ["GetApiTokenModules"],
    queryFn: async () => {
      const response = await axiosInstance.get<string[]>(
        `/client/integration/api-tokens/modules`,
        {
          headers: addHeaders(),
        }
      );
      return response.data;
    },
  });
}

export function useGetApiTokenActions() {
  return useQuery<string[]>({
    queryKey: ["GetApiTokenActions"],
    queryFn: async () => {
      const response = await axiosInstance.get<string[]>(
        `/client/integration/api-tokens/actions`,
        {
          headers: addHeaders(),
        }
      );
      return response.data;
    },
  });
}

export function useGetApiTokenById(id: string, options?: { enabled?: boolean }) {
  return useQuery<ApiTokenResponseDto>({
    queryKey: ["GetApiTokenById", id],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiTokenResponseDto>(
        `/client/integration/api-tokens/${id}`,
        {
          headers: addHeaders(),
        }
      );
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

export function useGetIntegrations(options?: { enabled?: boolean }) {
  return useQuery<PaginationIntegrationDto>({
    queryKey: ["GetIntegrations"],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginationIntegrationDto>(
        `/client/integration`,
        {
          headers: addHeaders(),
        }
      );
      return response.data;
    },
    enabled: options?.enabled !== false,
  });
}

export function useCreateIntegration() {
  const queryClient = useQueryClient();

  return useMutation<IntegrationResponseDto, Error, IntegrationCreateDto>({
    mutationKey: ["CreateIntegration"],
    mutationFn: async (data) => {
      const response = await axiosInstance.post<IntegrationResponseDto>(
        `/client/integration`,
        data,
        {
          headers: addHeaders(),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetIntegrations"] });
    },
  });
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient();

  return useMutation<
    IntegrationResponseDto,
    Error,
    { publicId: string; data: UpdateIntegrationDto }
  >({
    mutationKey: ["UpdateIntegration"],
    mutationFn: async ({ publicId, data }) => {
      const response = await axiosInstance.put<IntegrationResponseDto>(
        `/client/integration/${publicId}`,
        data,
        {
          headers: addHeaders(),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetIntegrations"] });
    },
  });
}

export function useActivateIntegration() {
  const queryClient = useQueryClient();

  return useMutation<IntegrationResponseDto, Error, string>({
    mutationKey: ["ActivateIntegration"],
    mutationFn: async (integrationId) => {
      const response = await axiosInstance.post<IntegrationResponseDto>(
        `/client/integration/${integrationId}/activate`,
        {},
        {
          headers: addHeaders(),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetIntegrations"] });
    },
  });
}

export function useDeactivateIntegration() {
  const queryClient = useQueryClient();

  return useMutation<IntegrationResponseDto, Error, string>({
    mutationKey: ["DeactivateIntegration"],
    mutationFn: async (integrationId) => {
      const response = await axiosInstance.post<IntegrationResponseDto>(
        `/client/integration/${integrationId}/deactivate`,
        {},
        {
          headers: addHeaders(),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetIntegrations"] });
    },
  });
}

export function useDeleteIntegration() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationKey: ["DeleteIntegration"],
    mutationFn: async (integrationId) => {
      await axiosInstance.delete(`/client/integration/${integrationId}`, {
        headers: addHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetIntegrations"] });
    },
  });
}

export function useTestConnection() {
  const queryClient = useQueryClient();

  return useMutation<IntegrationTestConnectionResponseDto, Error, string>({
    mutationKey: ["TestConnection"],
    mutationFn: async (integrationId) => {
      const response = await axiosInstance.post<IntegrationTestConnectionResponseDto>(
        `/client/integration/${integrationId}/test-connection`,
        {},
        {
          headers: addHeaders(),
        }
      );
      const body = response.data;
      if (!body.success) {
        throw new Error(body.message || "Connection test failed");
      }
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GetIntegrations"] });
    },
  });
}
