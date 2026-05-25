"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
  CHEKIOButton,
  CHEKIOHeader,
  CHEKIOInput,
  CHEKIOLoading,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
  CHEKIOTab,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
  CHEKIOTabs,
} from "@/components";
import SystemInput from "@/components/ui/system-input";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useToast } from "@/hooks/use-toast";
import { useCompanyDetailTour } from "@/hooks/useCompanyDetailTour";
import { documentValidators, formatDocumentType } from "@/lib/utils";
import {
  useDeleteCompanyOvertimeSettings,
  useGetCompanyOvertimeSettings,
} from "@/service/company-overtime-settings.service";
import { useGetCompany, useUpdateCompany } from "@/service/mantainer.service";
import { ErrorMessage } from "@hookform/error-message";
import axios from "axios";
import {
  AlertCircle,
  Edit,
  HelpCircle,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  COMPANY_SCHEDULE_IANA_TIMEZONE_VALUES,
  CompanyScheduleIanaTimezone,
  DocumentTypeOptions,
  TypeOvertimeSettings,
  UpdateCompanyDto,
} from "../_components/company.dto";
import AttendanceRulesTab from "./_components/attendance-rules-tab";
import CompanyNotifications from "./_components/company-notifications";
import { CompanyOvertimeSettingsResponseDto } from "./_components/company-overtime-settings.dto";
import OvertimeSettingsModal from "./_components/overtime-settings-modal";

function SectionCard({
  title,
  children,
  className = "",
  dataTour,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  dataTour?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
      data-tour={dataTour}
    >
      <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// Read-only field component
function ReadOnlyField({
  label,
  value,
  description,
  example,
}: {
  label: string;
  value: string | number | boolean | undefined;
  description?: string;
  example?: string;
}) {
  const tDetail = useTranslations("mantainers.companies.detail");
  const displayValue =
    value === undefined || value === null
      ? tDetail("notConfigured")
      : String(value);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="p-3 bg-gray-100 border border-gray-300 rounded-md text-gray-900">
        {displayValue}
      </div>
      {description && (
        <div className="text-gray-500 text-sm mt-1">
          {description}
          {example && <div className="text-xs text-gray-400">{example}</div>}
        </div>
      )}
    </div>
  );
}

function AttendanceParameters({ control, errors, watch, canUpdate }: any) {
  const t = useTranslations("mantainers.companies");
  const tDetail = useTranslations("mantainers.companies.detail");
  const formValues = watch();
  const timezoneOptions = useMemo(() => {
    const current = formValues?.timezone as string | undefined;
    const base = [...COMPANY_SCHEDULE_IANA_TIMEZONE_VALUES];
    if (current && !base.includes(current)) {
      base.push(current);
    }
    return base;
  }, [formValues?.timezone]);

  if (!canUpdate) {
    return (
      <div className="space-y-6">
        <SectionCard
          title={t("toleranceConfiguration")}
          dataTour="company-detail-tab-tolerances"
        >
          <div className="grid grid-cols-2 gap-4">
            <ReadOnlyField
              label={t("lateArrivalTolerance")}
              value={formValues.lateArrivalTolerance}
              description={t("lateArrivalToleranceDescription")}
              example={t("lateArrivalToleranceExample")}
            />
            <ReadOnlyField
              label={t("lunchBreakTolerance")}
              value={formValues.lunchBreakTolerance}
              description={t("lunchBreakToleranceDescription")}
              example={t("lunchBreakToleranceExample")}
            />
          </div>
        </SectionCard>

        <SectionCard
          title={t("scheduleConfiguration")}
          dataTour="company-detail-tab-schedule-config"
        >
          <div className="grid grid-cols-2 gap-4">
            <ReadOnlyField
              label={t("minutesBeforeSchedule")}
              value={formValues.minutesBeforeSchedule}
              description={t("minutesBeforeScheduleDescription")}
              example={t("minutesBeforeScheduleExample")}
            />
            <ReadOnlyField
              label={t("minutesAfterSchedule")}
              value={formValues.minutesAfterSchedule}
              description={t("minutesAfterScheduleDescription")}
              example={t("minutesAfterScheduleExample")}
            />
          </div>
        </SectionCard>

        <SectionCard
          title={t("automaticConfigurations")}
          dataTour="company-detail-tab-automatic-config"
        >
          <div className="grid grid-cols-2 gap-4">
            <ReadOnlyField
              label={t("automaticCheckInMinutes")}
              value={formValues.automaticCheckInMinutes}
              description={t("automaticCheckInMinutesDescription")}
              example={t("automaticCheckInMinutesExample")}
            />
            <ReadOnlyField
              label={t("minutesCloseRecordWithoutShift")}
              value={formValues.minutesCloseRecordWithoutShift}
              description={t("minutesCloseRecordWithoutShiftDescription")}
              example={t("minutesCloseRecordWithoutShiftExample")}
            />
            <ReadOnlyField
              label={t("fallbackScheduleWindowHours")}
              value={formValues.fallbackScheduleWindowHours}
              description={t("fallbackScheduleWindowHoursDescription")}
              example={t("fallbackScheduleWindowHoursExample")}
            />
            <ReadOnlyField
              label={t("companyTimezone")}
              value={formValues.timezone}
              description={t("companyTimezoneDescription")}
              example={t("companyTimezoneExample")}
            />
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("toleranceConfiguration")}
        dataTour="company-detail-tab-tolerances"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SystemInput
              control={control}
              label={t("lateArrivalTolerance")}
              attribute="lateArrivalTolerance"
              type="text"
              errors={errors}
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^0-9]/g, "");
              }}
            />
            <div className="text-gray-500 text-sm mt-1">
              {t("lateArrivalToleranceDescription")}
              <div className="text-xs text-gray-400">
                {t("lateArrivalToleranceExample")}
              </div>
            </div>
            <div className="bg-gray-100 p-4 mt-2 rounded-md text-sm border-l-4 border-blue-500">
              <span className="font-medium">{tDetail("important")}</span>{" "}
              {t("lateArrivalToleranceImportant")}
            </div>
          </div>

          <div>
            <SystemInput
              control={control}
              label={t("lunchBreakTolerance")}
              attribute="lunchBreakTolerance"
              type="text"
              errors={errors}
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^0-9]/g, "");
              }}
            />
            <div className="text-gray-500 text-sm mt-1">
              {t("lunchBreakToleranceDescription")}
              <div className="text-xs text-gray-400">
                {t("lunchBreakToleranceExample")}
              </div>
            </div>
            <div className="bg-gray-100 p-4 mt-2 rounded-md text-sm border-l-4 border-blue-500">
              <span className="font-medium">{tDetail("important")}</span>{" "}
              {t("lunchBreakToleranceImportant")}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={t("scheduleConfiguration")}
        dataTour="company-detail-tab-schedule-config"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SystemInput
              control={control}
              label={t("minutesBeforeSchedule")}
              attribute="minutesBeforeSchedule"
              type="text"
              errors={errors}
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^0-9]/g, "");
              }}
            />
            <div className="text-gray-500 text-sm mt-1">
              {t("minutesBeforeScheduleDescription")}
              <div className="text-xs text-gray-400">
                {t("minutesBeforeScheduleExample")}
              </div>
            </div>
            <div className="bg-gray-100 p-4 mt-2 rounded-md text-sm border-l-4 border-blue-500">
              <span className="font-medium">Nota:</span>{" "}
              {t("minutesBeforeScheduleNote")}
            </div>
          </div>

          <div>
            <SystemInput
              control={control}
              label={t("minutesAfterSchedule")}
              attribute="minutesAfterSchedule"
              type="text"
              errors={errors}
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^0-9]/g, "");
              }}
            />
            <div className="text-gray-500 text-sm mt-1">
              {t("minutesAfterScheduleDescription")}
              <div className="text-xs text-gray-400">
                {t("minutesAfterScheduleExample")}
              </div>
            </div>
            <div className="bg-gray-100 p-4 mt-2 rounded-md text-sm border-l-4 border-blue-500">
              <span className="font-medium">Nota:</span>{" "}
              {t("minutesAfterScheduleNote")}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={t("automaticConfigurations")}
        dataTour="company-detail-tab-automatic-config"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SystemInput
              control={control}
              label={t("automaticCheckInMinutes")}
              attribute="automaticCheckInMinutes"
              type="text"
              errors={errors}
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^0-9]/g, "");
              }}
            />
            <div className="text-gray-500 text-sm mt-1">
              {t("automaticCheckInMinutesDescription")}
              <div className="text-xs text-gray-400">
                {t("automaticCheckInMinutesExample")}
              </div>
            </div>
            <div className="bg-gray-100 p-4 mt-2 rounded-md text-sm border-l-4 border-blue-500">
              <span className="font-medium">Advertencia:</span>{" "}
              {t("automaticCheckInMinutesWarning")}
            </div>
          </div>

          <div>
            <SystemInput
              control={control}
              label={t("minutesCloseRecordWithoutShift")}
              attribute="minutesCloseRecordWithoutShift"
              type="text"
              errors={errors}
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^0-9]/g, "");
              }}
            />
            <div className="text-gray-500 text-sm mt-1">
              {t("minutesCloseRecordWithoutShiftDescription")}
              <div className="text-xs text-gray-400">
                {t("minutesCloseRecordWithoutShiftExample")}
              </div>
            </div>
            <div className="bg-gray-100 p-4 mt-2 rounded-md text-sm border-l-4 border-blue-500">
              <span className="font-medium">Advertencia:</span>{" "}
              {t("minutesCloseRecordWithoutShiftWarning")}
            </div>
          </div>
          <div>
            <SystemInput
              control={control}
              label={t("fallbackScheduleWindowHours")}
              attribute="fallbackScheduleWindowHours"
              type="text"
              errors={errors}
            />
            <div className="text-gray-500 text-sm mt-1">
              {t("fallbackScheduleWindowHoursDescription")}
              <div className="text-xs text-gray-400">
                {t("fallbackScheduleWindowHoursExample")}
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="company-timezone-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("companyTimezone")}
            </label>
            <Controller
              name="timezone"
              control={control}
              rules={{ required: t("companyTimezoneRequired") }}
              render={({ field }) => (
                <CHEKIOSelect
                  value={
                    field.value || CompanyScheduleIanaTimezone.AMERICA_SANTIAGO
                  }
                  onValueChange={field.onChange}
                >
                  <CHEKIOSelectTrigger
                    id="company-timezone-select"
                    className="w-full max-w-xl"
                    aria-label={t("companyTimezone")}
                  >
                    <CHEKIOSelectValue
                      placeholder={t("companyTimezonePlaceholder")}
                    />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    {timezoneOptions.map((zone) => (
                      <CHEKIOSelectItem key={zone} value={zone}>
                        {zone}
                      </CHEKIOSelectItem>
                    ))}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              )}
            />
            <ErrorMessage
              errors={errors}
              name="timezone"
              render={({ message }) => (
                <p className="text-xs text-red-500 mt-1">{message}</p>
              )}
            />
            <div className="text-gray-500 text-sm mt-1">
              {t("companyTimezoneDescription")}
              <div className="text-xs text-gray-400">
                {t("companyTimezoneExample")}
              </div>
            </div>
          </div>
          <div className="md:col-span-2 bg-gray-100 p-4 mt-2 rounded-md text-sm border-l-4 border-blue-500">
            <span className="font-medium">Nota:</span>{" "}
            {t("fallbackScheduleWindowHoursNote")}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function OvertimeParameters({
  control,
  errors,
  watch,
  canUpdate,
  companyId,
  setValue,
}: any) {
  const t = useTranslations("mantainers.companies");
  const tOvertimeSettings = useTranslations(
    "mantainers.companies.overtimeSettings.page",
  );
  const tToast = useTranslations(
    "mantainers.companies.overtimeSettings.page.toast",
  );
  const tDays = useTranslations(
    "mantainers.companies.overtimeSettings.daysOfWeek",
  );
  const { toast } = useToast();
  const formValues = watch();
  const typeOvertimeSettings =
    watch("typeOvertimeSettings") || TypeOvertimeSettings.BY_PERIOD;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] =
    useState<CompanyOvertimeSettingsResponseDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingSettingId, setDeletingSettingId] = useState<string | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: overtimeSettingsData, isLoading: isLoadingSettings } =
    useGetCompanyOvertimeSettings(companyId);

  const { mutate: deleteSetting, isPending: isDeletingSetting } =
    useDeleteCompanyOvertimeSettings();

  const overtimeFields = [
    {
      label: t("antecipatedOvertime"),
      attribute: "antecipatedOvertime",
      description: t("antecipatedOvertimeDescription"),
    },
    {
      label: t("breakOvertime"),
      attribute: "breakOvertime",
      description: t("breakOvertimeDescription"),
    },
  ];

  const renderCheckboxField = (
    label: string,
    attribute: string,
    description: string,
  ) => (
    <div
      key={attribute}
      className="flex items-start gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors w-full"
    >
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          {...control.register(attribute)}
          id={attribute}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
      </div>
      <div className="flex-1">
        <label htmlFor={attribute} className="font-medium text-gray-900">
          {label}
        </label>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
    </div>
  );

  const renderReadOnlyCheckboxField = (
    label: string,
    attribute: string,
    description: string,
  ) => (
    <div
      key={attribute}
      className="flex items-start gap-3 p-3 rounded-lg w-full"
    >
      <div className="flex items-center h-5">
        <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
          {formValues[attribute] && (
            <svg
              className="w-3 h-3 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900">{label}</div>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
    </div>
  );

  const handleOpenModal = useCallback(
    (setting?: CompanyOvertimeSettingsResponseDto) => {
      setEditingSetting(setting || null);
      setIsModalOpen(true);
    },
    [],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingSetting(null);
  }, []);

  const handleOpenDeleteModal = useCallback((publicId: string) => {
    setDeletingSettingId(publicId);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setDeletingSettingId(null);
    setDeleteError(null);
  }, []);

  const handleDelete = useCallback(() => {
    if (!deletingSettingId) return;

    // Buscar la configuración para determinar el mensaje
    const allSettings = overtimeSettingsData?.data || [];
    const setting = allSettings.find((s) => s.publicId === deletingSettingId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = setting ? new Date(setting.startDate) : null;
    if (startDate) {
      startDate.setHours(0, 0, 0, 0);
    }

    const isCreatedToday =
      setting && startDate && startDate.getTime() === today.getTime();

    setDeleteError(null);
    deleteSetting(
      { companyId, publicId: deletingSettingId },
      {
        onSuccess: () => {
          toast({
            title: isCreatedToday
              ? tToast("deleteSuccess")
              : tToast("finishSuccess"),
            description: isCreatedToday
              ? tToast("deleteSuccessDescription")
              : tToast("finishSuccessDescription"),
          });
          handleCloseDeleteModal();
        },
        onError: (error: any) => {
          const errorMessage =
            error.response?.data?.message ||
            (isCreatedToday ? tToast("deleteError") : tToast("finishError"));
          setDeleteError(errorMessage);
          toast({
            title: tToast("error"),
            description: errorMessage,
          });
        },
      },
    );
  }, [
    companyId,
    deleteSetting,
    toast,
    overtimeSettingsData,
    deletingSettingId,
    handleCloseDeleteModal,
  ]);

  const formatTime = (date: Date | string | null) => {
    if (!date) return "-";
    // Extract time directly from the ISO string without timezone conversion
    if (typeof date === "string") {
      // Extract time directly from ISO string format (e.g., "2025-01-01T20:00:00Z" -> "20:00")
      // This avoids any timezone conversion
      const timeMatch = date.match(/T(\d{2}):(\d{2})/);
      if (timeMatch) {
        return `${timeMatch[1]}:${timeMatch[2]}`;
      }
    }
    // Fallback: if it's already a Date object, convert to ISO string first
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const isoString = dateObj.toISOString();
    const timeMatch = isoString.match(/T(\d{2}):(\d{2})/);
    if (timeMatch) {
      return `${timeMatch[1]}:${timeMatch[2]}`;
    }
    // Last resort fallback
    return "-";
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-ES");
  };

  const getDayLabel = (dayOfWeek: string) => {
    return tDays(dayOfWeek as any) || dayOfWeek;
  };

  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");

  const allOvertimeSettings = overtimeSettingsData?.data || [];

  // Filtrar por tipo de configuración seleccionado
  const filteredByType = allOvertimeSettings.filter(
    (setting) => setting.type === typeOvertimeSettings,
  );

  // Filtrar por vigencia
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeSettings = filteredByType.filter((setting) => {
    const startDate = new Date(setting.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = setting.endDate ? new Date(setting.endDate) : null;
    if (endDate) {
      endDate.setHours(0, 0, 0, 0);
    }

    // Está vigente si startDate <= hoy y (endDate es null o endDate >= hoy)
    return startDate <= today && (!endDate || endDate >= today);
  });

  const inactiveSettings = filteredByType.filter((setting) => {
    const startDate = new Date(setting.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = setting.endDate ? new Date(setting.endDate) : null;
    if (endDate) {
      endDate.setHours(0, 0, 0, 0);
    }

    // No está vigente si startDate > hoy o (endDate no es null y endDate < hoy)
    return startDate > today || (endDate !== null && endDate < today);
  });

  const overtimeSettings =
    activeTab === "active" ? activeSettings : inactiveSettings;

  if (!canUpdate) {
    return (
      <div className="space-y-8">
        <SectionCard title={t("overtimeConfiguration")}>
          <div className="divide-y divide-gray-200">
            {overtimeFields.map((field) =>
              renderReadOnlyCheckboxField(
                field.label,
                field.attribute,
                field.description,
              ),
            )}
          </div>
        </SectionCard>
        <SectionCard title={tOvertimeSettings("configurationType")}>
          <div className="p-3 bg-gray-100 border border-gray-300 rounded-md text-gray-900">
            {typeOvertimeSettings === TypeOvertimeSettings.BY_PERIOD
              ? tOvertimeSettings("byPeriod")
              : tOvertimeSettings("byDays")}
          </div>
        </SectionCard>
        {overtimeSettings.length > 0 && (
          <SectionCard title={tOvertimeSettings("configurations")}>
            <div data-tour="company-detail-tab-overtime-table">
              <CHEKIOTable>
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>
                      {tOvertimeSettings("table.day")}
                    </CHEKIOTableHead>
                    {typeOvertimeSettings ===
                      TypeOvertimeSettings.BY_PERIOD && (
                      <>
                        <CHEKIOTableHead>
                          {tOvertimeSettings("table.startTime")}
                        </CHEKIOTableHead>
                        <CHEKIOTableHead>
                          {tOvertimeSettings("table.endTime")}
                        </CHEKIOTableHead>
                      </>
                    )}
                    <CHEKIOTableHead>
                      {tOvertimeSettings("table.from")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {tOvertimeSettings("table.until")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {tOvertimeSettings("table.percentage")}
                    </CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {overtimeSettings.map((setting, index) => (
                    <CHEKIOTableRow key={setting.publicId} index={index}>
                      <CHEKIOTableCell>
                        {getDayLabel(setting.dayOfWeek)}
                      </CHEKIOTableCell>
                      {typeOvertimeSettings ===
                        TypeOvertimeSettings.BY_PERIOD && (
                        <>
                          <CHEKIOTableCell>
                            {formatTime(setting.periodStartTime)}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell>
                            {formatTime(setting.periodEndTime)}
                          </CHEKIOTableCell>
                        </>
                      )}
                      <CHEKIOTableCell>
                        {formatDate(setting.startDate)}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {formatDate(setting.endDate)}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>{setting.percentage}%</CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>
          </SectionCard>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionCard title={t("overtimeConfiguration")}>
        <div className="divide-y divide-gray-200">
          {overtimeFields.map((field) =>
            renderCheckboxField(
              field.label,
              field.attribute,
              field.description,
            ),
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={tOvertimeSettings("configurationType")}
        data-tour="company-detail-tab-overtime-type"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {tOvertimeSettings("configurationTypeLabel")}
          </label>
          <Controller
            name="typeOvertimeSettings"
            control={control}
            render={({ field }) => (
              <CHEKIOSelect
                value={field.value || TypeOvertimeSettings.BY_PERIOD}
                onValueChange={(value) => {
                  field.onChange(value);
                  setValue("typeOvertimeSettings", value);
                }}
              >
                <CHEKIOSelectTrigger className="w-full">
                  <CHEKIOSelectValue
                    placeholder={tOvertimeSettings(
                      "configurationTypePlaceholder",
                    )}
                  />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  <CHEKIOSelectItem value={TypeOvertimeSettings.BY_PERIOD}>
                    {tOvertimeSettings("byPeriod")}
                  </CHEKIOSelectItem>
                  <CHEKIOSelectItem value={TypeOvertimeSettings.BY_DAYS}>
                    {tOvertimeSettings("byDays")}
                  </CHEKIOSelectItem>
                </CHEKIOSelectContent>
              </CHEKIOSelect>
            )}
          />
        </div>
      </SectionCard>

      <SectionCard title={tOvertimeSettings("configurations")}>
        <div className="mb-4 flex justify-between items-center">
          <div
            className="flex border-b border-gray-200"
            data-tour="company-detail-tab-overtime-subtabs"
          >
            <CHEKIOTab
              active={activeTab === "active"}
              onClick={() => setActiveTab("active")}
              className={`justify-start border-b-2 mr-4 px-4 py-2 ${
                activeTab === "active"
                  ? "border-b-blue-600 text-blue-600 bg-blue-50"
                  : "border-b-transparent text-gray-500 hover:text-gray-700 hover:border-b-gray-300"
              }`}
            >
              {tOvertimeSettings("active")} ({activeSettings.length})
            </CHEKIOTab>
            <CHEKIOTab
              active={activeTab === "inactive"}
              onClick={() => setActiveTab("inactive")}
              className={`justify-start border-b-2 px-4 py-2 ${
                activeTab === "inactive"
                  ? "border-b-blue-600 text-blue-600 bg-blue-50"
                  : "border-b-transparent text-gray-500 hover:text-gray-700 hover:border-b-gray-300"
              }`}
            >
              {tOvertimeSettings("inactive")} ({inactiveSettings.length})
            </CHEKIOTab>
          </div>
          <span data-tour="company-detail-tab-overtime-add">
            <CHEKIOButton
              type="button"
              variant="primary"
              onClick={() => handleOpenModal()}
            >
              <Plus className="h-4 w-4" />
              {tOvertimeSettings("addConfiguration")}
            </CHEKIOButton>
          </span>
        </div>

        {isLoadingSettings ? (
          <div className="flex justify-center py-8">
            <CHEKIOLoading
              size="lg"
              variant="modern"
              text={tOvertimeSettings("loading")}
            />
          </div>
        ) : overtimeSettings.length === 0 ? (
          <div
            className="text-center py-10"
            data-tour="company-detail-tab-overtime-table"
          >
            <p className="text-gray-600 font-medium">
              {activeTab === "active"
                ? tOvertimeSettings("noActiveConfigurations")
                : tOvertimeSettings("noInactiveConfigurations")}
            </p>
          </div>
        ) : (
          <div data-tour="company-detail-tab-overtime-table">
            <CHEKIOTable>
              <CHEKIOTableHeader>
                <tr>
                  <CHEKIOTableHead>
                    {tOvertimeSettings("table.day")}
                  </CHEKIOTableHead>
                  {typeOvertimeSettings === TypeOvertimeSettings.BY_PERIOD && (
                    <>
                      <CHEKIOTableHead>
                        {tOvertimeSettings("table.startTime")}
                      </CHEKIOTableHead>
                      <CHEKIOTableHead>
                        {tOvertimeSettings("table.endTime")}
                      </CHEKIOTableHead>
                    </>
                  )}
                  <CHEKIOTableHead>
                    {tOvertimeSettings("table.from")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {tOvertimeSettings("table.until")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {tOvertimeSettings("table.percentage")}
                  </CHEKIOTableHead>
                  {activeTab === "active" && (
                    <CHEKIOTableHead>
                      {tOvertimeSettings("table.actions")}
                    </CHEKIOTableHead>
                  )}
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {overtimeSettings.map((setting, index) => (
                  <CHEKIOTableRow key={setting.publicId} index={index}>
                    <CHEKIOTableCell>
                      {getDayLabel(setting.dayOfWeek)}
                    </CHEKIOTableCell>
                    {typeOvertimeSettings ===
                      TypeOvertimeSettings.BY_PERIOD && (
                      <>
                        <CHEKIOTableCell>
                          {formatTime(setting.periodStartTime)}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {formatTime(setting.periodEndTime)}
                        </CHEKIOTableCell>
                      </>
                    )}
                    <CHEKIOTableCell>
                      {formatDate(setting.startDate)}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {formatDate(setting.endDate)}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>{setting.percentage}%</CHEKIOTableCell>
                    {activeTab === "active" && (
                      <CHEKIOTableCell>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(setting)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                            title={tOvertimeSettings("edit")}
                            aria-label={tOvertimeSettings("edit")}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenDeleteModal(setting.publicId)
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                            title={tOvertimeSettings("delete")}
                            aria-label={tOvertimeSettings("delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </CHEKIOTableCell>
                    )}
                  </CHEKIOTableRow>
                ))}
              </CHEKIOTableBody>
            </CHEKIOTable>
          </div>
        )}
      </SectionCard>

      <OvertimeSettingsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingSetting={editingSetting}
        companyId={companyId}
        typeOvertimeSettings={typeOvertimeSettings}
      />

      <CHEKIOModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title={tOvertimeSettings("deleteModal.title")}
        size="md"
      >
        <div className="space-y-6">
          {(() => {
            const allSettings = overtimeSettingsData?.data || [];
            const setting = allSettings.find(
              (s) => s.publicId === deletingSettingId,
            );
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = setting ? new Date(setting.startDate) : null;
            if (startDate) {
              startDate.setHours(0, 0, 0, 0);
            }
            const isCreatedToday =
              setting && startDate && startDate.getTime() === today.getTime();
            const message = isCreatedToday
              ? tOvertimeSettings("deleteModal.deleteMessage")
              : tOvertimeSettings("deleteModal.finishMessage");

            return (
              <>
                <p className="text-gray-700 flex items-center gap-3 text-lg">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  {message}
                </p>

                {deleteError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <p className="text-red-700 text-sm">{deleteError}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <CHEKIOButton
                    type="button"
                    variant="secondary"
                    onClick={handleCloseDeleteModal}
                    disabled={isDeletingSetting}
                  >
                    <X className="h-4 w-4" />
                    {tOvertimeSettings("deleteModal.cancel")}
                  </CHEKIOButton>
                  <CHEKIOButton
                    type="button"
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete();
                    }}
                    disabled={isDeletingSetting}
                  >
                    {isDeletingSetting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isCreatedToday
                          ? tOvertimeSettings("deleteModal.deleting")
                          : tOvertimeSettings("deleteModal.finishing")}
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        {isCreatedToday
                          ? tOvertimeSettings("deleteModal.delete")
                          : tOvertimeSettings("deleteModal.finish")}
                      </>
                    )}
                  </CHEKIOButton>
                </div>
              </>
            );
          })()}
        </div>
      </CHEKIOModal>
    </div>
  );
}

function SystemParameters({ control, errors, watch, canUpdate }: any) {
  const t = useTranslations("mantainers.companies");
  const formValues = watch();

  const attendanceFields = [
    {
      label: t("enableSignatureOnCheckIn"),
      attribute: "enableSignatureOnCheckIn",
      description: t("enableSignatureOnCheckInDescription"),
    },
    {
      label: t("enablePhotoOnCheckIn"),
      attribute: "enablePhotoOnCheckIn",
      description: t("enablePhotoOnCheckInDescription"),
    },
    {
      label: t("showMobileConsultMenu"),
      attribute: "showMobileConsultMenu",
      description: t("showMobileConsultMenuDescription"),
    },
    {
      label: t("enableAdditionalMarks"),
      attribute: "enableAdditionalMarks",
      description: t("enableAdditionalMarksDescription"),
    },
  ];

  const notificationFields = {
    supervisorNotifications: [
      {
        label: t("enableLateArrivalEmailToManager"),
        attribute: "enableLateArrivalEmailToManager",
        description: t("enableLateArrivalEmailToManagerDescription"),
      },
      {
        label: t("enableLateBreakStartEmailToManager"),
        attribute: "enableLateBreakStartEmailToManager",
        description: t("enableLateBreakStartEmailToManagerDescription"),
      },
      {
        label: t("enableLateBreakEndEmailToManager"),
        attribute: "enableLateBreakEndEmailToManager",
        description: t("enableLateBreakEndEmailToManagerDescription"),
      },
      {
        label: t("enableLateExitEmailToManager"),
        attribute: "enableLateExitEmailToManager",
        description: t("enableLateExitEmailToManagerDescription"),
      },
    ],
    systemNotifications: [
      {
        label: t("enableWeeklyEmailToEmployee"),
        attribute: "enableWeeklyEmailToEmployee",
        description: t("enableWeeklyEmailToEmployeeDescription"),
      },
      {
        label: t("enableWeeklyEmailToAdmin"),
        attribute: "enableWeeklyEmailToAdmin",
        description: t("enableWeeklyEmailToAdminDescription"),
      },
      {
        label: t("enableDailyEmailToAdmin"),
        attribute: "enableDailyEmailToAdmin",
        description: t("enableDailyEmailToAdminDescription"),
      },
      {
        label: t("enableWelcomeEmail"),
        attribute: "enableWelcomeEmail",
        description: t("enableWelcomeEmailDescription"),
      },
      {
        label: t("enableAdminStatusEmailOnCheckIn"),
        attribute: "enableAdminStatusEmailOnCheckIn",
        description: t("enableAdminStatusEmailOnCheckInDescription"),
      },
    ],
  };

  const renderCheckboxField = (
    label: string,
    attribute: string,
    description: string,
  ) => (
    <div
      key={attribute}
      className="flex items-start gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors w-full"
    >
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          {...control.register(attribute)}
          id={attribute}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
      </div>
      <div className="flex-1">
        <label htmlFor={attribute} className="font-medium text-gray-900">
          {label}
        </label>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
    </div>
  );

  const renderReadOnlyCheckboxField = (
    label: string,
    attribute: string,
    description: string,
  ) => (
    <div
      key={attribute}
      className="flex items-start gap-3 p-3 rounded-lg w-full"
    >
      <div className="flex items-center h-5">
        <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
          {formValues[attribute] && (
            <svg
              className="w-3 h-3 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900">{label}</div>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
    </div>
  );

  if (!canUpdate) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <SectionCard
          title={t("markingConfiguration")}
          dataTour="company-detail-tab-marking-config"
        >
          <div className="divide-y divide-gray-200">
            {attendanceFields.map((field) =>
              renderReadOnlyCheckboxField(
                field.label,
                field.attribute,
                field.description,
              ),
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={t("supervisorNotifications")}
          dataTour="company-detail-tab-supervisor-notif"
        >
          <div className="divide-y divide-gray-200">
            {notificationFields.supervisorNotifications.map((field) =>
              renderReadOnlyCheckboxField(
                field.label,
                field.attribute,
                field.description,
              ),
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={t("systemNotifications")}
          dataTour="company-detail-tab-system-notif"
        >
          <div className="divide-y divide-gray-200">
            {notificationFields.systemNotifications.map((field) =>
              renderReadOnlyCheckboxField(
                field.label,
                field.attribute,
                field.description,
              ),
            )}
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <SectionCard
        title={t("markingConfiguration")}
        dataTour="company-detail-tab-marking-config"
      >
        <div className="divide-y divide-gray-200">
          {attendanceFields.map((field) =>
            renderCheckboxField(
              field.label,
              field.attribute,
              field.description,
            ),
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={t("supervisorNotifications")}
        dataTour="company-detail-tab-supervisor-notif"
      >
        <div className="divide-y divide-gray-200">
          {notificationFields.supervisorNotifications.map((field) =>
            renderCheckboxField(
              field.label,
              field.attribute,
              field.description,
            ),
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={t("systemNotifications")}
        dataTour="company-detail-tab-system-notif"
      >
        <div className="divide-y divide-gray-200">
          {notificationFields.systemNotifications.map((field) =>
            renderCheckboxField(
              field.label,
              field.attribute,
              field.description,
            ),
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function CompanyInformation({
  control,
  errors,
  watch,
  setValue,
  canUpdate,
}: any) {
  const t = useTranslations("mantainers.companies");
  const tDetail = useTranslations("mantainers.companies.detail");
  const [isDocumentValid, setIsDocumentValid] = useState<boolean | null>(null);
  const formValues = watch();

  const documentType = watch("documentType");
  const documentNumber = watch("documentNumber");

  // Validate document when type or number changes
  useEffect(() => {
    if (documentType && documentNumber) {
      const validator =
        documentValidators[documentType as keyof typeof documentValidators];
      if (validator) {
        const isValid = validator(documentNumber);
        setIsDocumentValid(isValid);
      }
    } else {
      setIsDocumentValid(null);
    }
  }, [documentType, documentNumber]);

  // Format document when documentType changes (only if document doesn't have formatting)
  // Note: Real-time formatting is handled in the input's onChange handler
  useEffect(() => {
    if (documentType && documentNumber && !/[.\-\s]/.test(documentNumber)) {
      const formattedValue =
        formatDocumentType[documentType as keyof typeof formatDocumentType]?.(
          documentNumber,
        );
      if (formattedValue && formattedValue !== documentNumber) {
        setValue("documentNumber", formattedValue, {
          shouldValidate: false,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentType]); // Only when documentType changes

  if (!canUpdate) {
    return (
      <div className="space-y-6">
        <SectionCard
          title={t("basicInformation")}
          dataTour="company-detail-tab-basic-info"
        >
          <div className="grid grid-cols-2 gap-4">
            <ReadOnlyField
              label={t("businessName")}
              value={formValues.businessName}
              description={t("businessNameDescription")}
              example={t("businessNameExample")}
            />
            <ReadOnlyField
              label={t("tradeName")}
              value={formValues.tradeName}
              description={t("tradeNameDescription")}
              example={t("tradeNameExample")}
            />
            <div className="col-span-2">
              <ReadOnlyField
                label={t("address")}
                value={formValues.address}
                description={t("addressDescription")}
                example={t("addressExample")}
              />
            </div>
            <div className="w-full">
              <div className="flex items-start gap-3 p-3 rounded-lg w-full">
                <div className="flex items-center h-5">
                  <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
                    {formValues.isActive && (
                      <svg
                        className="w-3 h-3 text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {t("isActive")}
                  </div>
                  <p className="text-gray-500 text-sm">
                    {t("isActiveDescription")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
        <SectionCard
          title={t("systemConfiguration")}
          dataTour="company-detail-tab-system-config"
        >
          <div className="grid grid-cols-2 gap-4">
            <ReadOnlyField
              label={t("documentType")}
              value={
                DocumentTypeOptions.find(
                  (opt) => opt.value === formValues.documentType,
                )?.label || formValues.documentType
              }
              description={t("documentTypeDescription")}
            />
            <ReadOnlyField
              label={t("documentNumber")}
              value={formValues.documentNumber}
              description={t("documentNumberDescription")}
              example={t("documentNumberExample")}
            />
            <ReadOnlyField
              label={t("integrationCode")}
              value={formValues.integrationCode}
              description={t("integrationCodeDescription")}
              example={t("integrationCodeExample")}
            />
            <div className="w-full">
              <div className="flex items-start gap-3 p-3 rounded-lg w-full">
                <div className="flex items-center h-5">
                  <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
                    {formValues.transitoryService && (
                      <svg
                        className="w-3 h-3 text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {t("transitoryService")}
                  </div>
                  <p className="text-gray-500 text-sm">
                    {t("transitoryServiceDescription")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("basicInformation")}
        dataTour="company-detail-tab-basic-info"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SystemInput
              control={control}
              label={t("businessName")}
              attribute="businessName"
              errors={errors}
              rules={{ required: t("businessNameRequired") }}
            />
            <div className="text-gray-500 text-sm mt-1">
              {t("businessNameDescription")}
              <div className="text-xs text-gray-400">
                {t("businessNameExample")}
              </div>
            </div>
          </div>

          <div>
            <SystemInput
              control={control}
              label={t("tradeName")}
              attribute="tradeName"
              errors={errors}
              rules={{ required: t("tradeNameRequired") }}
            />
            <div className="text-gray-500 text-sm mt-1">
              {t("tradeNameDescription")}
              <div className="text-xs text-gray-400">
                {t("tradeNameExample")}
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <SystemInput
              control={control}
              label={t("address")}
              attribute="address"
              errors={errors}
              rules={{ required: t("addressRequired") }}
            />
            <div className="text-gray-500 text-sm mt-1">
              {t("addressDescription")}
              <div className="text-xs text-gray-400">{t("addressExample")}</div>
            </div>
          </div>
          <div className="w-full">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <div className="flex items-start gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors w-full">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="isActive"
                      className="font-medium text-gray-900"
                    >
                      {t("isActive")}
                    </label>
                    <p className="text-gray-500 text-sm">
                      {t("isActiveDescription")}
                    </p>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </SectionCard>
      <SectionCard
        title={t("systemConfiguration")}
        dataTour="company-detail-tab-system-config"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("documentType")}
            </label>
            <Controller
              name="documentType"
              control={control}
              render={({ field }) => (
                <>
                  <CHEKIOSelect
                    value={field.value}
                    onValueChange={(value) => {
                      // Only update if value is not empty and different from current
                      if (value && value !== field.value) {
                        field.onChange(value);
                        setValue("documentNumber", "", {
                          shouldValidate: false,
                        });
                        setIsDocumentValid(null);
                      }
                    }}
                  >
                    <CHEKIOSelectTrigger
                      className={
                        errors.documentType ? "border-red-500 w-full" : "w-full"
                      }
                    >
                      <CHEKIOSelectValue
                        placeholder={tDetail("documentTypePlaceholder")}
                      />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      {DocumentTypeOptions.map((option) => (
                        <CHEKIOSelectItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </CHEKIOSelectItem>
                      ))}
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                  <ErrorMessage
                    errors={errors}
                    name="documentType"
                    render={({ message }) => (
                      <p className="text-xs text-red-500">{message}</p>
                    )}
                  />
                </>
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("documentNumber")}
            </label>
            <Controller
              name="documentNumber"
              control={control}
              rules={{
                required: t("documentNumberRequired"),
                validate: (value) => {
                  if (!documentType || !value) return true;
                  const validator =
                    documentValidators[
                      documentType as keyof typeof documentValidators
                    ];
                  return validator && validator(value)
                    ? true
                    : tDetail("invalidDocumentFormat");
                },
              }}
              render={({ field }) => (
                <>
                  <div className="relative">
                    <CHEKIOInput
                      {...field}
                      value={field.value || ""}
                      className={`w-full ${
                        errors.documentNumber
                          ? "border-red-500"
                          : isDocumentValid === true
                            ? "border-green-500"
                            : isDocumentValid === false
                              ? "border-yellow-500"
                              : ""
                      }`}
                      placeholder={
                        documentType
                          ? tDetail(`documentExamples.${documentType}` as any)
                          : tDetail("enterDocumentNumber")
                      }
                      onChange={(e) => {
                        field.onChange(e);

                        if (documentType && e.target.value) {
                          const formatter =
                            formatDocumentType[
                              documentType as keyof typeof formatDocumentType
                            ];
                          if (formatter) {
                            const formattedValue = formatter(e.target.value);
                            if (formattedValue !== e.target.value) {
                              setValue("documentNumber", formattedValue, {
                                shouldValidate: false,
                                shouldDirty: true,
                              });
                            }

                            const validator =
                              documentValidators[
                                documentType as keyof typeof documentValidators
                              ];
                            if (validator) {
                              const isValid = validator(formattedValue);
                              setIsDocumentValid(isValid);
                            }
                          }
                        } else {
                          setIsDocumentValid(null);
                        }
                      }}
                    />
                    {isDocumentValid !== null && documentNumber && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        {isDocumentValid ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-green-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-yellow-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.documentNumber && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.documentNumber.message}
                    </p>
                  )}
                  {documentType && (
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {documentType
                          ? tDetail(`documentFormats.${documentType}` as any)
                          : ""}
                      </p>
                      {isDocumentValid === false && documentNumber && (
                        <p className="text-xs text-yellow-600 font-medium">
                          {tDetail("invalidDocument")}
                        </p>
                      )}
                      {isDocumentValid === true && documentNumber && (
                        <p className="text-xs text-green-600 font-medium">
                          {tDetail("validDocument")}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="text-gray-500 text-sm mt-1">
                    {t("documentNumberDescription")}
                    <div className="text-xs text-gray-400">
                      {t("documentNumberExample")}
                    </div>
                  </div>
                </>
              )}
            />
          </div>

          <div>
            <SystemInput
              control={control}
              label={t("integrationCode")}
              attribute="integrationCode"
              errors={errors}
            />
            <div className="text-gray-500 text-sm mt-1">
              {t("integrationCodeDescription")}
              <div className="text-xs text-gray-400">
                {t("integrationCodeExample")}
              </div>
            </div>
          </div>
          <div className="w-full">
            <Controller
              name="transitoryService"
              control={control}
              render={({ field }) => (
                <div className="flex items-start gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors w-full">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={field.value || false}
                      onChange={field.onChange}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="transitoryService"
                      className="font-medium text-gray-900"
                    >
                      {t("transitoryService")}
                    </label>
                    <p className="text-gray-500 text-sm">
                      {t("transitoryServiceDescription")}
                    </p>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

type Params = Promise<{ companyId: string }>;

function parseOptionalCompanyInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

const CompanyDetails = ({ params }: { params: Params }) => {
  const t = useTranslations("mantainers.companies");
  const router = useRouter();
  const urlParams = useParams();
  const locale = (urlParams?.locale as string) ?? "es";
  const { canUpdate } = useCookieSession();
  const { toast } = useToast();
  const resolvedParams = use(params);
  const companyId = resolvedParams.companyId;
  const { data: company, isLoading } = useGetCompany(companyId);
  const { mutate: updateCompany, isPending: isUpdating } = useUpdateCompany();
  const [activeTab, setActiveTab] = useState<string>("0");
  const { startTour } = useCompanyDetailTour(activeTab);

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<UpdateCompanyDto>({
    defaultValues: {
      documentType: undefined,
      documentNumber: "",
      businessName: "",
      tradeName: "",
      address: "",
      isActive: true,
      transitoryService: false,
      integrationCode: "",
      enableSignatureOnCheckIn: false,
      showMobileConsultMenu: false,
      enablePhotoOnCheckIn: false,
      enableLateArrivalEmailToManager: false,
      enableLateBreakStartEmailToManager: false,
      enableLateBreakEndEmailToManager: false,
      enableLateExitEmailToManager: false,
      enableWeeklyEmailToEmployee: false,
      enableWeeklyEmailToAdmin: false,
      enableDailyEmailToAdmin: false,
      enableWelcomeEmail: false,
      enableAdminStatusEmailOnCheckIn: false,
      lateArrivalTolerance: undefined,
      lunchBreakTolerance: undefined,
      minutesBeforeSchedule: undefined,
      automaticCheckInMinutes: undefined,
      minutesAfterSchedule: undefined,
      minutesCloseRecordWithoutShift: undefined,
      antecipatedOvertime: false,
      enableAdditionalMarks: false,
      breakOvertime: false,
      typeOvertimeSettings: TypeOvertimeSettings.BY_PERIOD,
      fallbackScheduleWindowHours: 7,
      timezone: CompanyScheduleIanaTimezone.AMERICA_SANTIAGO,
    },
  });

  useEffect(() => {
    if (company) {
      const resetData = {
        documentType: company.documentType,
        documentNumber: company.documentNumber || "",
        businessName: company.businessName,
        tradeName: company.tradeName,
        address: company.address,
        isActive: company.isActive ?? true,
        transitoryService: company.transitoryService,
        integrationCode: company.integrationCode,
        enableSignatureOnCheckIn:
          company.CompanySettings?.enableSignatureOnCheckIn,
        showMobileConsultMenu: company.CompanySettings?.showMobileConsultMenu,
        enablePhotoOnCheckIn: company.CompanySettings?.enablePhotoOnCheckIn,
        enableLateArrivalEmailToManager:
          company.CompanySettings?.enableLateArrivalEmailToManager,
        enableLateBreakStartEmailToManager:
          company.CompanySettings?.enableLateBreakStartEmailToManager,
        enableLateBreakEndEmailToManager:
          company.CompanySettings?.enableLateBreakEndEmailToManager,
        enableLateExitEmailToManager:
          company.CompanySettings?.enableLateExitEmailToManager,
        enableWeeklyEmailToEmployee:
          company.CompanySettings?.enableWeeklyEmailToEmployee,
        enableWeeklyEmailToAdmin:
          company.CompanySettings?.enableWeeklyEmailToAdmin,
        enableDailyEmailToAdmin:
          company.CompanySettings?.enableDailyEmailToAdmin,
        enableWelcomeEmail: company.CompanySettings?.enableWelcomeEmail,
        enableAdminStatusEmailOnCheckIn:
          company.CompanySettings?.enableAdminStatusEmailOnCheckIn,
        lateArrivalTolerance: company.CompanySettings?.lateArrivalTolerance,
        lunchBreakTolerance: company.CompanySettings?.lunchBreakTolerance,
        minutesBeforeSchedule: company.CompanySettings?.minutesBeforeSchedule,
        automaticCheckInMinutes:
          company.CompanySettings?.automaticCheckInMinutes,
        minutesAfterSchedule: company.CompanySettings?.minutesAfterSchedule,
        minutesCloseRecordWithoutShift:
          company.CompanySettings?.minutesCloseRecordWithoutShift,
        antecipatedOvertime: company.CompanySettings?.antecipatedOvertime,
        breakOvertime: company.CompanySettings?.breakOvertime,
        enableAdditionalMarks: company.CompanySettings?.enableAdditionalMarks,
        fallbackScheduleWindowHours:
          company.CompanySettings?.fallbackScheduleWindowHours || 7,
        typeOvertimeSettings:
          company.CompanySettings?.typeOvertimeSettings ||
          TypeOvertimeSettings.BY_PERIOD,
        timezone:
          company.CompanySettings?.timezone ??
          CompanyScheduleIanaTimezone.AMERICA_SANTIAGO,
      };

      reset(resetData);
    }
  }, [company, reset]);

  const onSubmit = (data: UpdateCompanyDto) => {
    updateCompany(
      {
        ...data,
        publicId: companyId,
        lateArrivalTolerance: parseOptionalCompanyInt(
          data.lateArrivalTolerance,
        ),
        lunchBreakTolerance: parseOptionalCompanyInt(data.lunchBreakTolerance),
        minutesBeforeSchedule: parseOptionalCompanyInt(
          data.minutesBeforeSchedule,
        ),
        automaticCheckInMinutes: parseOptionalCompanyInt(
          data.automaticCheckInMinutes,
        ),
        minutesAfterSchedule: parseOptionalCompanyInt(
          data.minutesAfterSchedule,
        ),
        minutesCloseRecordWithoutShift: parseOptionalCompanyInt(
          data.minutesCloseRecordWithoutShift,
        ),
        fallbackScheduleWindowHours: parseOptionalCompanyInt(
          data.fallbackScheduleWindowHours,
        ),
      },
      {
        onSuccess: () => {
          toast({
            title: t("updateSuccess"),
            description: t("updateSuccessDescription"),
          });
        },
        onError: (error: any) => {
          if (axios.isAxiosError(error)) {
            toast({
              title: t("updateError"),
              description: error.response?.data.message,
            });
          } else {
            toast({
              title: t("updateError"),
              description: t("updateErrorDescription"),
            });
          }
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const hasUpdatePermission = canUpdate(
    OrganizationPermissionCode.COMPANY_MAINTENANCE,
  );

  const companyName =
    company?.businessName || company?.tradeName || t("breadcrumbs.companies");

  return (
    <>
      <CHEKIOHeader
        title={companyName}
        breadcrumbs={[
          t("breadcrumbs.dashboard"),
          t("breadcrumbs.maintainers"),
          t("breadcrumbs.companies"),
          companyName,
        ]}
        onBack={() => router.push(`/${locale}/mantainers/companies`)}
        backStyle="secondaryBlue"
        backAriaLabel={t("detail.backAriaLabel")}
        actions={
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={startTour}
            className="flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            {t("detailTour.startButton")}
          </CHEKIOButton>
        }
      />
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex-1 min-w-0 overflow-x-auto -mx-1">
                <CHEKIOTabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  variant="underline"
                >
                  <CHEKIOTab value="0">{t("basicInformation")}</CHEKIOTab>
                  <CHEKIOTab value="1">{t("attendanceParameters")}</CHEKIOTab>
                  <CHEKIOTab value="2">{t("systemParameters")}</CHEKIOTab>
                  <CHEKIOTab value="3">{t("overtimeParameters")}</CHEKIOTab>
                  <CHEKIOTab value="4">{t("notifications")}</CHEKIOTab>
                  <CHEKIOTab value="5">{t("attendanceRulesTab")}</CHEKIOTab>
                </CHEKIOTabs>
              </div>
            </div>

            <div className="flex-1">
              {["0", "1", "2", "3"].includes(activeTab) && (
                <form onSubmit={handleSubmit(onSubmit)}>
                  {activeTab === "0" && (
                    <CompanyInformation
                      control={control}
                      errors={errors}
                      watch={watch}
                      setValue={setValue}
                      canUpdate={hasUpdatePermission}
                    />
                  )}
                  {activeTab === "1" && (
                    <AttendanceParameters
                      control={control}
                      errors={errors}
                      watch={watch}
                      canUpdate={hasUpdatePermission}
                    />
                  )}
                  {activeTab === "2" && (
                    <SystemParameters
                      control={control}
                      errors={errors}
                      watch={watch}
                      canUpdate={hasUpdatePermission}
                    />
                  )}
                  {activeTab === "3" && (
                    <OvertimeParameters
                      control={control}
                      errors={errors}
                      watch={watch}
                      canUpdate={hasUpdatePermission}
                      companyId={companyId}
                      setValue={setValue}
                    />
                  )}

                  {hasUpdatePermission && (
                    <div className="flex justify-end mt-4">
                      <CHEKIOButton
                        type="submit"
                        variant="primary"
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{t("updating")}</span>
                          </>
                        ) : (
                          t("update")
                        )}
                      </CHEKIOButton>
                    </div>
                  )}
                </form>
              )}
              {activeTab === "4" && (
                <CompanyNotifications
                  companyId={companyId}
                  company={company}
                  canUpdate={hasUpdatePermission}
                />
              )}
              {activeTab === "5" && (
                <AttendanceRulesTab
                  companyId={companyId}
                  canUpdate={hasUpdatePermission}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default function CompanyDetailsPage({ params }: { params: Params }) {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.COMPANY_MAINTENANCE
      }
    >
      <CompanyDetails params={params} />
    </AccessNotGranted>
  );
}
