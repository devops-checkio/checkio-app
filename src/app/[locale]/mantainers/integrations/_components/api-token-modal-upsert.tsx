"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
  CHEKIOInput,
} from "@/components";
import SystemInput from "@/components/ui/system-input";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateApiToken,
  useUpdateApiToken,
} from "@/service/integration.service";
import { handleError } from "@/utils/error";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Controller,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import {
  ApiTokenPermissionDto,
  ApiTokenResponseDto,
  CreateApiTokenDto,
  UpdateApiTokenDto,
} from "./api-token.dto";
import ApiTokenPermissionsSelector from "./api-token-permissions-selector";

interface ApiTokenModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  editingToken: ApiTokenResponseDto | null;
  onSuccess: (token?: string) => void;
}

export default function ApiTokenModalUpsert({
  isOpen,
  onClose,
  editingToken,
  onSuccess,
}: ApiTokenModalUpsertProps) {
  const t = useTranslations("mantainers.integrations.modal");
  const { toast } = useToast();
  const { mutate: createApiToken, isPending: isCreating } =
    useCreateApiToken();
  const { mutate: updateApiToken, isPending: isUpdating } =
    useUpdateApiToken();

  const {
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateApiTokenDto | UpdateApiTokenDto>({
    defaultValues: {
      permissions: [],
    },
  });

  const permissions = watch("permissions") || [];

  useEffect(() => {
    if (editingToken) {
      const expiresAtDate = editingToken.expiresAt
        ? new Date(editingToken.expiresAt)
        : null;
      reset({
        name: editingToken.name,
        description: editingToken.description || "",
        expiresAt: expiresAtDate
          ? expiresAtDate.toISOString()
          : undefined,
        permissions: editingToken.permissions.map((p) => ({
          module: p.module,
          action: p.action,
        })),
      });
    } else {
      reset({
        name: "",
        description: "",
        expiresAt: undefined,
        permissions: [],
      });
    }
  }, [editingToken, reset]);

  const onSubmit: SubmitHandler<
    CreateApiTokenDto | UpdateApiTokenDto
  > = (data) => {
    if (editingToken) {
      updateApiToken(
        {
          id: editingToken.publicId,
          data: data as UpdateApiTokenDto,
        },
        {
          onSuccess: () => {
            toast({
              title: t("edit.successTitle"),
              description: t("edit.successDescription"),
            });
            onSuccess();
            onClose();
          },
          onError: (error: any) => {
            handleError(error, toast);
          },
        }
      );
    } else {
      createApiToken(data as CreateApiTokenDto, {
        onSuccess: (response) => {
          toast({
            title: t("create.successTitle"),
            description: t("create.successDescription"),
          });
          onSuccess(response.token);
          onClose();
        },
        onError: (error: any) => {
          handleError(error, toast);
        },
      });
    }
  };

  const handlePermissionsChange = (newPermissions: ApiTokenPermissionDto[]) => {
    setValue("permissions", newPermissions, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingToken ? t("edit.title") : t("create.title")}
      size="5xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        {/* Basic info card */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50">
          <div className="border-b border-gray-200 bg-white px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("create.basicInfo")}
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            <SystemInput
              control={control}
              label={t("create.name")}
              attribute="name"
              errors={errors}
              rules={{ required: "El nombre del token es requerido" }}
            />

            <SystemInput
              control={control}
              label={t("create.description")}
              attribute="description"
              errors={errors}
            />

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                {t("create.expiresAt")}
              </label>
              <Controller
                name="expiresAt"
                control={control}
                render={({ field }) => (
                  <CHEKIOInput
                    type="date"
                    value={
                      field.value
                        ? typeof field.value === "string"
                          ? field.value.split("T")[0]
                          : new Date(field.value).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        const date = new Date(value);
                        date.setHours(23, 59, 59, 999);
                        field.onChange(date.toISOString());
                      } else {
                        field.onChange(undefined);
                      }
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className="rounded-lg"
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Permissions card */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50">
          <ApiTokenPermissionsSelector
            permissions={permissions}
            onChange={handlePermissionsChange}
            errors={errors}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <CHEKIOButton
            type="button"
            variant="secondaryBlue"
            onClick={onClose}
            disabled={isCreating || isUpdating}
          >
            {t("create.cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            type="submit"
            variant="primary"
            disabled={isCreating || isUpdating}
            className="min-w-[140px]"
          >
            {isCreating || isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {editingToken
                    ? t("edit.processing")
                    : t("create.processing")}
                </span>
              </>
            ) : (
              <span>
                {editingToken ? t("edit.save") : t("create.save")}
              </span>
            )}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}
