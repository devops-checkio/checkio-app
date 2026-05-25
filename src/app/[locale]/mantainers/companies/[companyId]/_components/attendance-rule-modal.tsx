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
import { useCreateAttendanceRule } from "@/service/attendance-rule.service";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import {
  CreateAttendanceRuleDto,
  MarkModeOptions,
  MarkTypeOptions,
  RuleLevel,
} from "./attendance-rule.dto";

interface AttendanceRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

interface FormValues {
  markType: CreateAttendanceRuleDto["markType"];
  mode: CreateAttendanceRuleDto["mode"];
  level: RuleLevel;
}

export default function AttendanceRuleModal({
  isOpen,
  onClose,
  companyId,
}: AttendanceRuleModalProps) {
  const t = useTranslations("mantainers.companies.attendanceRules.modal");
  const tToast = useTranslations("mantainers.companies.attendanceRules.toast");
  const { toast } = useToast();
  const { mutate: createRule, isPending: isCreating } =
    useCreateAttendanceRule();

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      markType: "CHECK_IN" as CreateAttendanceRuleDto["markType"],
      mode: "GEOFENCE" as CreateAttendanceRuleDto["mode"],
      level: RuleLevel.COMPANY,
    },
  });

  const onSubmit = (data: FormValues) => {
    createRule(
      {
        companyId,
        markType: data.markType,
        mode: data.mode,
        level: RuleLevel.COMPANY,
      },
      {
        onSuccess: () => {
          toast({
            title: tToast("createSuccess"),
            description: tToast("createSuccessDescription"),
          });
          reset();
          onClose();
        },
        onError: (error: unknown) => {
          const message =
            error && typeof error === "object" && "response" in error
              ? (error as { response?: { data?: { message?: string } } })
                  .response?.data?.message
              : tToast("createError");
          toast({
            title: tToast("createError"),
            description: message ?? tToast("createErrorDescription"),
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
    >
      <p className="text-sm text-gray-600 mb-4">{t("description")}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSubmit(onSubmit)(e);
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t("markType")}
          </label>
          <Controller
            control={control}
            name="markType"
            rules={{ required: true }}
            render={({ field }) => (
              <CHEKIOSelect
                value={field.value}
                onValueChange={field.onChange}
              >
                <CHEKIOSelectTrigger>
                  <CHEKIOSelectValue placeholder={t("markTypePlaceholder")} />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  {MarkTypeOptions.map((opt) => (
                    <CHEKIOSelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </CHEKIOSelectItem>
                  ))}
                </CHEKIOSelectContent>
              </CHEKIOSelect>
            )}
          />
          {errors.markType && (
            <p className="text-sm text-red-600">{t("markTypeRequired")}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t("mode")}
          </label>
          <Controller
            control={control}
            name="mode"
            rules={{ required: true }}
            render={({ field }) => (
              <CHEKIOSelect
                value={field.value}
                onValueChange={field.onChange}
              >
                <CHEKIOSelectTrigger>
                  <CHEKIOSelectValue placeholder={t("modePlaceholder")} />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  {MarkModeOptions.map((opt) => (
                    <CHEKIOSelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </CHEKIOSelectItem>
                  ))}
                </CHEKIOSelectContent>
              </CHEKIOSelect>
            )}
          />
          {errors.mode && (
            <p className="text-sm text-red-600">{t("modeRequired")}</p>
          )}
        </div>

        <p className="text-sm text-gray-500">{t("levelFixed")}</p>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <CHEKIOButton
            type="button"
            variant="secondaryBlue"
            onClick={onClose}
            disabled={isCreating}
          >
            {t("cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            type="button"
            variant="primary"
            disabled={isCreating}
            onClick={handleSubmit(onSubmit)}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("creating")}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {t("create")}
              </>
            )}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}
