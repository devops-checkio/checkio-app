"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
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
  useCreateCompanyOvertimeSettings,
  useUpdateCompanyOvertimeSettings,
} from "@/service/company-overtime-settings.service";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  CompanyOvertimeSettingsResponseDto,
  CreateCompanyOvertimeSettingsDto,
  DayOfWeek,
  DayOfWeekOptions,
  TypeOvertimeSettings,
  UpdateCompanyOvertimeSettingsDto,
} from "./company-overtime-settings.dto";

interface OvertimeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSetting: CompanyOvertimeSettingsResponseDto | null;
  companyId: string;
  typeOvertimeSettings: "BY_PERIOD" | "BY_DAYS";
}

export default function OvertimeSettingsModal({
  isOpen,
  onClose,
  editingSetting,
  companyId,
  typeOvertimeSettings,
}: OvertimeSettingsModalProps) {
  const t = useTranslations("mantainers.companies.overtimeSettings.modal");
  const tToast = useTranslations("mantainers.companies.overtimeSettings.toast");
  const tDays = useTranslations("mantainers.companies.overtimeSettings.daysOfWeek");
  const { toast } = useToast();
  const { mutate: createSetting, isPending: isCreating } =
    useCreateCompanyOvertimeSettings();
  const { mutate: updateSetting, isPending: isUpdating } =
    useUpdateCompanyOvertimeSettings();

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
    watch,
    trigger,
  } = useForm<
    CreateCompanyOvertimeSettingsDto | UpdateCompanyOvertimeSettingsDto
  >({
    defaultValues: {
      dayOfWeek: DayOfWeek.MONDAY,
      type: typeOvertimeSettings as TypeOvertimeSettings,
      periodStartTime: "",
      periodEndTime: "",
      percentage: 0,
    },
  });

  useEffect(() => {
    if (editingSetting) {
      const startTime = editingSetting.periodStartTime
        ? new Date(editingSetting.periodStartTime).toTimeString().slice(0, 5)
        : "";
      const endTime = editingSetting.periodEndTime
        ? new Date(editingSetting.periodEndTime).toTimeString().slice(0, 5)
        : "";

      reset({
        dayOfWeek: editingSetting.dayOfWeek,
        type: editingSetting.type,
        periodStartTime: startTime,
        periodEndTime: endTime,
        percentage: editingSetting.percentage,
      });
    } else {
      reset({
        dayOfWeek: DayOfWeek.MONDAY,
        type: typeOvertimeSettings as TypeOvertimeSettings,
        periodStartTime: "",
        periodEndTime: "",
        percentage: 0,
      });
    }
  }, [editingSetting, reset, typeOvertimeSettings]);

  const formType = watch("type");
  const isPeriodType = formType === TypeOvertimeSettings.BY_PERIOD;

  const onSubmit = async (
    data: CreateCompanyOvertimeSettingsDto | UpdateCompanyOvertimeSettingsDto
  ) => {
    // Formatear los datos antes de enviarlos (startDate y endDate son automáticos, no se envían)
    // Filtrar explícitamente startDate y endDate si existen
    const { startDate, endDate, ...dataWithoutDates } = data as any;

    // Construir el objeto base sin startDate y endDate
    // Solo incluir campos que están definidos y no son undefined
    const baseData: any = {
      dayOfWeek: dataWithoutDates.dayOfWeek,
      type: dataWithoutDates.type,
      percentage: dataWithoutDates.percentage,
    };

    // Las horas se envían como strings HH:mm solo si es tipo BY_PERIOD y están definidas
    if (isPeriodType) {
      if (dataWithoutDates.periodStartTime) {
        baseData.periodStartTime = dataWithoutDates.periodStartTime;
      }
      if (dataWithoutDates.periodEndTime) {
        baseData.periodEndTime = dataWithoutDates.periodEndTime;
      }
    }

    if (editingSetting) {
      updateSetting(
        {
          companyId,
          data: {
            publicId: editingSetting.publicId,
            ...baseData,
          } as UpdateCompanyOvertimeSettingsDto,
        },
        {
          onSuccess: () => {
            toast({
              title: tToast("updateSuccess"),
              description: tToast("updateSuccessDescription"),
            });
            reset();
            onClose();
          },
          onError: (error: any) => {
            toast({
              title: tToast("error"),
              description:
                error.response?.data?.message || tToast("updateError"),
            });
          },
        }
      );
    } else {
      createSetting(
        {
          companyId,
          ...baseData,
        } as CreateCompanyOvertimeSettingsDto,
        {
          onSuccess: () => {
            toast({
              title: tToast("createSuccess"),
              description: tToast("createSuccessDescription"),
            });
            reset();
            onClose();
          },
          onError: (error: any) => {
            toast({
              title: tToast("error"),
              description:
                error.response?.data?.message || tToast("createError"),
            });
          },
        }
      );
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSetting ? t("editTitle") : t("addTitle")}
      size="xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="space-y-4"
        noValidate
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("dayOfWeek")}
          </label>
          <Controller
            name="dayOfWeek"
            control={control}
            rules={{ required: t("dayOfWeekRequired") }}
            render={({ field }) => (
              <>
                <CHEKIOSelect
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <CHEKIOSelectTrigger
                    className={
                      errors.dayOfWeek ? "border-red-500 w-full" : "w-full"
                    }
                  >
                    <CHEKIOSelectValue
                      placeholder={t("dayOfWeekPlaceholder")}
                    />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    {DayOfWeekOptions.map((option) => (
                      <CHEKIOSelectItem key={option.value} value={option.value}>
                        {tDays(option.value as any)}
                      </CHEKIOSelectItem>
                    ))}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
                {errors.dayOfWeek && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.dayOfWeek.message}
                  </p>
                )}
              </>
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("configurationType")}
          </label>
          <Controller
            name="type"
            control={control}
            rules={{ required: t("configurationTypeRequired") }}
            render={({ field }) => (
              <>
                <CHEKIOSelect
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <CHEKIOSelectTrigger
                    className={errors.type ? "border-red-500 w-full" : "w-full"}
                  >
                    <CHEKIOSelectValue
                      placeholder={t("configurationTypePlaceholder")}
                    />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    <CHEKIOSelectItem value={TypeOvertimeSettings.BY_PERIOD}>
                      {t("byPeriod")}
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem value={TypeOvertimeSettings.BY_DAYS}>
                      {t("byDays")}
                    </CHEKIOSelectItem>
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
                {errors.type && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.type.message}
                  </p>
                )}
              </>
            )}
          />
        </div>

        {isPeriodType && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("startTime")}
              </label>
              <Controller
                name="periodStartTime"
                control={control}
                rules={{
                  required: t("startTimeRequired"),
                  validate: (value) => {
                    const endTime = watch("periodEndTime");
                    if (value && endTime && value >= endTime) {
                      return t("startTimeValidation");
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <>
                    <CHEKIOInput
                      type="time"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e);
                        // Trigger validation on periodEndTime when start time changes
                        const endTimeValue = watch("periodEndTime");
                        if (endTimeValue) {
                          trigger("periodEndTime");
                        }
                      }}
                      className={
                        errors.periodStartTime
                          ? "border-red-500 w-full"
                          : "w-full"
                      }
                    />
                    {errors.periodStartTime && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.periodStartTime.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("endTime")}
              </label>
              <Controller
                name="periodEndTime"
                control={control}
                rules={{
                  required: t("endTimeRequired"),
                  validate: (value) => {
                    const startTime = watch("periodStartTime");
                    if (value && startTime && value <= startTime) {
                      return t("endTimeValidation");
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <>
                    <CHEKIOInput
                      type="time"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e);
                        // Trigger validation on periodStartTime when end time changes
                        const startTimeValue = watch("periodStartTime");
                        if (startTimeValue) {
                          trigger("periodStartTime");
                        }
                      }}
                      className={
                        errors.periodEndTime
                          ? "border-red-500 w-full"
                          : "w-full"
                      }
                    />
                    {errors.periodEndTime && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.periodEndTime.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          </>
        )}

        <div>
          <SystemInput
            control={control}
            label={t("percentage")}
            attribute="percentage"
            type="number"
            errors={errors}
            rules={{
              required: t("percentageRequired"),
              min: {
                value: 0,
                message: t("percentageMin"),
              },
              max: {
                value: 300,
                message: t("percentageMax"),
              },
            }}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <CHEKIOButton
            type="button"
            variant="secondaryBlue"
            onClick={onClose}
            className="flex-1"
          >
            {t("cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            type="button"
            variant="primary"
            disabled={isCreating || isUpdating}
            className="flex-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(onSubmit)();
            }}
          >
            {isCreating || isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{editingSetting ? t("updating") : t("creating")}</span>
              </>
            ) : editingSetting ? (
              t("update")
            ) : (
              t("create")
            )}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}
