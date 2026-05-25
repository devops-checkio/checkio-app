"use client";

import { CHEKIOButton, CHEKIOInput, CHEKIOModal } from "@/components";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateWarningType,
  useUpdateWarningType,
} from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  WarningTypeCreateDto,
  WarningTypeResponseDto,
  WarningTypeUpdateDto,
} from "./warning-types.dto";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
}

interface WarningTypeModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  editingWarningType: WarningTypeResponseDto | null;
  onSuccess: () => void;
}

export default function WarningTypeModalUpsert({
  isOpen,
  onClose,
  editingWarningType,
  onSuccess,
}: WarningTypeModalUpsertProps) {
  const { toast } = useToast();
  const t = useTranslations("warningTypes");
  const { mutate: createWarningType, isPending: isCreatingWarningType } =
    useCreateWarningType();
  const { mutate: updateWarningType, isPending: isUpdatingWarningType } =
    useUpdateWarningType();

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<WarningTypeCreateDto | WarningTypeUpdateDto>({
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (editingWarningType) {
      reset({
        name: editingWarningType.name,
      });
    } else {
      reset();
    }
  }, [editingWarningType, reset]);

  const onSubmit: SubmitHandler<WarningTypeCreateDto | WarningTypeUpdateDto> = (
    data,
  ) => {
    if (editingWarningType) {
      updateWarningType(
        {
          publicId: editingWarningType.publicId,
          data: {
            name: data.name,
          },
        } as {
          publicId: string;
          data: WarningTypeUpdateDto;
        },
        {
          onSuccess: () => {
            toast({
              title: t("toast.updateSuccess.title"),
              description: t("toast.updateSuccess.description"),
            });
            onSuccess();
            onClose();
          },
          onError: (error: any) => {
            handleError(error, toast);
          },
          onSettled: () => {
            onClose();
          },
        },
      );
    } else {
      createWarningType(
        {
          name: data.name,
        } as WarningTypeCreateDto,
        {
          onSuccess: () => {
            toast({
              title: t("toast.createSuccess.title"),
              description: t("toast.createSuccess.description"),
            });
            onClose();
            onSuccess();
          },
          onError: (error: any) => {
            handleError(error, toast);
          },
          onSettled: () => {
            onClose();
          },
        },
      );
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingWarningType ? t("modal.titleEdit") : t("modal.titleAdd")}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t("modal.nameLabel")} <span className="text-red-500">*</span>
          </label>
          <Controller
            name="name"
            control={control}
            rules={{
              required: t("modal.nameRequiredMessage"),
            }}
            render={({ field }) => (
              <>
                <CHEKIOInput
                  {...field}
                  value={field.value || ""}
                  placeholder={t("modal.namePlaceholder")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {t("modal.nameHelperText")}
                </div>
              </>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <CHEKIOButton
            type="button"
            variant={ButtonVariant.SECONDARY}
            onClick={onClose}
            disabled={isCreatingWarningType || isUpdatingWarningType}
          >
            <X className="h-4 w-4" />
            {t("modal.cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            type="submit"
            variant={ButtonVariant.PRIMARY}
            disabled={isCreatingWarningType || isUpdatingWarningType}
          >
            {isCreatingWarningType || isUpdatingWarningType ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {editingWarningType
                    ? t("modal.updating")
                    : t("modal.creating")}
                </span>
              </>
            ) : (
              <span>
                {editingWarningType ? t("modal.update") : t("modal.save")}
              </span>
            )}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}
