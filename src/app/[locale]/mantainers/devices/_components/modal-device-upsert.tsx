"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import SystemInput from "@/components/ui/system-input";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateDevice,
  useGetBranches,
  useUpdateDevice,
} from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  DeviceCreateDto,
  DeviceResponseDto,
  DeviceType,
  DeviceUpdateDto,
} from "./device.dto";
interface DeviceModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  editingDevice: DeviceResponseDto | null;
  onSuccess: () => void;
  onDeviceCreated?: (response: DeviceResponseDto) => void;
}

const NO_BRANCH_VALUE = "none";

type DeviceFormValues = {
  identifier?: string;
  type?: DeviceType;
  branchId?: string;
};

export default function DeviceModalUpsert({
  isOpen,
  onClose,
  editingDevice,
  onSuccess,
  onDeviceCreated,
}: DeviceModalUpsertProps) {
  const t = useTranslations("mantainers.devices");
  const { toast } = useToast();
  const { mutate: createDevice, isPending: isCreatingDevice } =
    useCreateDevice();
  const { mutate: updateDevice, isPending: isUpdatingDevice } =
    useUpdateDevice();
  const { data: branchesData } = useGetBranches({
    page: 1,
    pageSize: 500,
  });

  const {
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<DeviceFormValues>({
    defaultValues: {
      identifier: "",
      type: DeviceType.MACHINE,
      branchId: NO_BRANCH_VALUE,
    },
  });

  useEffect(() => {
    if (editingDevice) {
      reset({
        identifier: editingDevice.identifier ?? "",
        type: editingDevice.type,
        branchId: editingDevice.branchId ?? NO_BRANCH_VALUE,
      });
    } else {
      reset({
        identifier: "",
        type: DeviceType.MACHINE,
        branchId: NO_BRANCH_VALUE,
      });
    }
  }, [editingDevice, reset, isOpen]);

  const selectedType = watch("type");

  const onSubmit: SubmitHandler<DeviceFormValues> = (data) => {
    if (selectedType === DeviceType.KIOSKO) {
      if (!data.branchId || data.branchId === NO_BRANCH_VALUE) {
        toast({
          title: t("upsert.validation.branchRequired"),
          description: t("upsert.validation.branchRequiredDescription"),
          variant: "destructive",
        });
        return;
      }
    }
    if (editingDevice) {
      const updatePayload: DeviceUpdateDto = {
        branchId:
          data.branchId === NO_BRANCH_VALUE ? "" : data.branchId || undefined,
      };
      updateDevice(
        { publicId: editingDevice.publicId, data: updatePayload },
        {
          onSuccess: () => {
            toast({
              title: t("toast.updateSuccess"),
              description: t("toast.updateSuccessDescription"),
            });
            onSuccess();
            onClose();
          },
          onError: (error) => {
            handleError(error, toast);
          },
        }
      );
    } else {
      const createPayload: DeviceCreateDto = {
        identifier: data.identifier || undefined,
        type: data.type ?? DeviceType.MACHINE,
        branchId:
          data.branchId && data.branchId !== NO_BRANCH_VALUE
            ? data.branchId
            : undefined,
      };
      createDevice(
        { data: createPayload },
        {
          onSuccess: (response) => {
            toast({
              title: t("toast.createSuccess"),
              description:
                response.type === DeviceType.KIOSKO
                  ? t("toast.createSuccessDescriptionKiosko")
                  : t("toast.createSuccessDescription"),
            });
            onClose();
            if (onDeviceCreated) {
              setTimeout(() => {
                onDeviceCreated(response);
              }, 150);
            }
          },
          onError: (error) => {
            handleError(error, toast);
          },
        }
      );
    }
  };

  return (
    <>
      <CHEKIOModal
        isOpen={isOpen}
        onClose={onClose}
        title={editingDevice ? t("upsert.title.edit") : t("upsert.title.add")}
        size="4xl"
      >
        <div className="flex gap-8">
          <div className="flex-1">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-green-700 mb-2">
                        {t("upsert.info.title")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t("upsert.info.description")}
                      </p>
                    </div>
                  </div>
                </div>

                <SystemInput
                  control={control}
                  label={t("upsert.fields.identifier")}
                  attribute="identifier"
                  errors={errors}
                  className="mb-4"
                  disabled={!!editingDevice}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {t("upsert.fields.type")}
                  </label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <CHEKIOSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!!editingDevice}
                      >
                        <CHEKIOSelectTrigger className="w-full">
                          <CHEKIOSelectValue
                            placeholder={t("upsert.placeholders.selectType")}
                          />
                        </CHEKIOSelectTrigger>
                        <CHEKIOSelectContent>
                          <CHEKIOSelectItem value={DeviceType.MACHINE}>
                            {t("upsert.types.MACHINE")}
                          </CHEKIOSelectItem>
                          <CHEKIOSelectItem value={DeviceType.KIOSKO}>
                            {t("upsert.types.KIOSKO")}
                          </CHEKIOSelectItem>
                        </CHEKIOSelectContent>
                      </CHEKIOSelect>
                    )}
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <label className="text-sm font-medium text-gray-700">
                    {t("upsert.fields.branch")}
                    {selectedType === DeviceType.KIOSKO && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <Controller
                    name="branchId"
                    control={control}
                    render={({ field }) => (
                      <CHEKIOSelect
                        value={field.value || NO_BRANCH_VALUE}
                        onValueChange={field.onChange}
                      >
                        <CHEKIOSelectTrigger className="w-full">
                          <CHEKIOSelectValue
                            placeholder={t("upsert.placeholders.selectBranch")}
                          />
                        </CHEKIOSelectTrigger>
                        <CHEKIOSelectContent>
                          <CHEKIOSelectItem value={NO_BRANCH_VALUE}>
                            {t("upsert.placeholders.noBranch")}
                          </CHEKIOSelectItem>
                          {branchesData?.data
                            ?.filter((b) => b.publicId && b.publicId.trim() !== "")
                            .map((branch) => (
                              <CHEKIOSelectItem
                                key={branch.publicId}
                                value={branch.publicId}
                              >
                                {branch.name}
                              </CHEKIOSelectItem>
                            ))}
                        </CHEKIOSelectContent>
                      </CHEKIOSelect>
                    )}
                  />
                </div>
              </div>

              <CHEKIOButton
                type="submit"
                variant="primary"
                disabled={isCreatingDevice || isUpdatingDevice}
                className="w-full"
              >
                {isCreatingDevice || isUpdatingDevice ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {editingDevice
                        ? t("upsert.buttons.updating")
                        : t("upsert.buttons.creating")}
                    </span>
                  </>
                ) : (
                  <span>
                    {editingDevice
                      ? t("upsert.buttons.update")
                      : t("upsert.buttons.save")}
                  </span>
                )}
              </CHEKIOButton>
            </form>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {t("upsert.about.title")}
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-700 mb-2">
                  {t("upsert.about.markingPoint.title")}
                </h4>
                <p className="text-sm text-gray-600">
                  {t("upsert.about.markingPoint.description")}
                </p>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {t("upsert.about.markingPoint.item1")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {t("upsert.about.markingPoint.item2")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {t("upsert.about.markingPoint.item3")}
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-700 mb-2">
                  {t("upsert.about.benefits.title")}
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    {t("upsert.about.benefits.item1")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    {t("upsert.about.benefits.item2")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    {t("upsert.about.benefits.item3")}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CHEKIOModal>
    </>
  );
}
