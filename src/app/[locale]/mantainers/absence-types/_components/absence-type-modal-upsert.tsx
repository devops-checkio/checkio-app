"use client";

import {
  CHEKIOButton,
  CHEKIOLoading,
  CHEKIOModal,
} from "@/components";
import SystemInput from "@/components/ui/system-input";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateAbsenceType,
  useGetAbsenceType,
  useUpdateAbsenceType,
} from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import axios from "axios";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  AbsenceTypeCreateDto,
  AbsenceTypeUpdateDto,
} from "./absence-type.dto";

interface AbsenceTypeModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  /** Public id to edit; null = create */
  editingAbsenceTypeId: string | null;
  onSuccess: () => void;
}

export default function AbsenceTypeModalUpsert({
  isOpen,
  onClose,
  editingAbsenceTypeId,
  onSuccess,
}: AbsenceTypeModalUpsertProps) {
  const tUpsert = useTranslations("mantainers.absenceTypes.upsert");
  const { toast } = useToast();
  const isEditMode = !!editingAbsenceTypeId;

  const {
    data: fetchedAbsenceType,
    isLoading: isLoadingDetail,
    isError,
    error,
  } = useGetAbsenceType(editingAbsenceTypeId, {
    enabled: isOpen && isEditMode,
  });

  const { mutate: createAbsenceType, isPending: isCreatingAbsenceType } =
    useCreateAbsenceType();
  const { mutate: updateAbsenceType, isPending: isUpdatingAbsenceType } =
    useUpdateAbsenceType();

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AbsenceTypeCreateDto | AbsenceTypeUpdateDto>();

  useEffect(() => {
    if (!isOpen) return;
    if (!editingAbsenceTypeId) {
      reset({
        code: "",
        name: "",
        integrationCode: "",
        isEmployeeRequestable: false,
        isTimeBankCompensable: false,
      });
    }
  }, [isOpen, editingAbsenceTypeId, reset]);

  useEffect(() => {
    if (!isOpen || !editingAbsenceTypeId || !fetchedAbsenceType) return;
    reset({
      code: fetchedAbsenceType.code,
      name: fetchedAbsenceType.name,
      integrationCode: fetchedAbsenceType.integrationCode ?? "",
      isEmployeeRequestable:
        fetchedAbsenceType.isEmployeeRequestable ?? false,
      isTimeBankCompensable:
        fetchedAbsenceType.isTimeBankCompensable ?? false,
    });
  }, [isOpen, editingAbsenceTypeId, fetchedAbsenceType, reset]);

  useEffect(() => {
    if (!isOpen || !editingAbsenceTypeId || !isError) return;
    handleError(error, toast);
    onClose();
  }, [
    isOpen,
    editingAbsenceTypeId,
    isError,
    error,
    toast,
    onClose,
  ]);

  const detailLoading =
    isEditMode && !isError && (isLoadingDetail || !fetchedAbsenceType);

  const onSubmit: SubmitHandler<AbsenceTypeCreateDto | AbsenceTypeUpdateDto> = (
    data,
  ) => {
    if (editingAbsenceTypeId) {
      updateAbsenceType(
        { ...data, id: editingAbsenceTypeId } as AbsenceTypeUpdateDto,
        {
          onSuccess: () => {
            toast({
              title: tUpsert("toast.updateSuccess"),
              description: tUpsert("toast.updateSuccessDescription"),
            });
            onSuccess();
            onClose();
          },
          onError: (err: unknown) => {
            handleError(err, toast);
          },
        },
      );
    } else {
      createAbsenceType(data as AbsenceTypeCreateDto, {
        onSuccess: () => {
          toast({
            title: tUpsert("toast.createSuccess"),
            description: tUpsert("toast.createSuccessDescription"),
          });
          onClose();
          onSuccess();
        },
        onError: (err: unknown) => {
          if (axios.isAxiosError(err)) {
            toast({
              title: tUpsert("toast.createError"),
              description: err.response?.data.message,
              variant: "destructive",
            });
          } else {
            toast({
              title: tUpsert("toast.createError"),
              description: tUpsert("toast.createError"),
              variant: "destructive",
            });
          }
        },
      });
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditMode ? tUpsert("title.edit") : tUpsert("title.add")
      }
      size="2xl"
    >
      {detailLoading ? (
        <div className="flex justify-center py-14">
          <CHEKIOLoading
            size="lg"
            variant="modern"
            text={tUpsert("loadingDetail")}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <SystemInput
              control={control}
              label={tUpsert("fields.code")}
              attribute="code"
              errors={errors}
              rules={{
                required: tUpsert("validation.codeRequired"),
              }}
            />
            <SystemInput
              control={control}
              label={tUpsert("fields.name")}
              attribute="name"
              errors={errors}
              rules={{
                required: tUpsert("validation.nameRequired"),
              }}
            />
            <SystemInput
              control={control}
              label={tUpsert("fields.integrationCode")}
              attribute="integrationCode"
              errors={errors}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {tUpsert("fields.configTitle")}
            </h3>

            <div className="flex items-start gap-3">
              <Controller
                name="isEmployeeRequestable"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="isEmployeeRequestable"
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  />
                )}
              />
              <div>
                <label
                  htmlFor="isEmployeeRequestable"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {tUpsert("fields.isEmployeeRequestable")}
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  {tUpsert("fields.isEmployeeRequestableDescription")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Controller
                name="isTimeBankCompensable"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="isTimeBankCompensable"
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  />
                )}
              />
              <div>
                <label
                  htmlFor="isTimeBankCompensable"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {tUpsert("fields.isTimeBankCompensable")}
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  {tUpsert("fields.isTimeBankCompensableDescription")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-blue-700 mb-2">
              {tUpsert("info.title")}
            </h3>
            <p className="text-sm text-gray-600">
              {tUpsert("info.description")}
            </p>
          </div>
          <div className="flex justify-end gap-4">
            <CHEKIOButton type="button" variant="secondary" onClick={onClose}>
              <X className="h-4 w-4" />
              {tUpsert("buttons.cancel")}
            </CHEKIOButton>
            <CHEKIOButton
              type="submit"
              variant="primary"
              disabled={isCreatingAbsenceType || isUpdatingAbsenceType}
            >
              {isCreatingAbsenceType || isUpdatingAbsenceType ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {isEditMode
                      ? tUpsert("buttons.updating")
                      : tUpsert("buttons.saving")}
                  </span>
                </>
              ) : (
                <span>
                  {isEditMode
                    ? tUpsert("buttons.update")
                    : tUpsert("buttons.save")}
                </span>
              )}
            </CHEKIOButton>
          </div>
        </form>
      )}
    </CHEKIOModal>
  );
}
