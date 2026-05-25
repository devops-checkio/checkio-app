"use client";

import {
  CHEKIOButton,
  CHEKIOLoading,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
  CHEKIOTab,
} from "@/components";
import SystemMultiSelect from "@/components/ui/multi-select";
import SystemInput from "@/components/ui/system-input";
import { useToast } from "@/hooks/use-toast";
import { useBranchDetailTour } from "@/hooks/useBranchDetailTour";
import { useRouter } from "@/i18n/navigation";
import { TIME_ZONE_OPTIONS } from "@/lib/options/time-zone";
import {
  useGetBranchById,
  useGetBranchGeolocations,
  useGetCompanies,
  useUpdateBranch,
} from "@/service/mantainer.service";
import { Card } from "antd";
import axios from "axios";
import { ChevronLeft, HelpCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { use, useEffect, useState } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  useFieldArray,
  UseFieldArrayReturn,
  useForm,
} from "react-hook-form";
import {
  BranchCreateDto,
  BranchGeolocationResponseDto,
  BranchUpdateDto,
} from "../_components/branch.dto";
import MapEditor from "../_components/map-editor";
import countriesGeography from "../_data/country-geography.json";

const COUNTRY_CODE_ALIASES: Record<string, string> = {
  CL: "CHL",
  PE: "PER",
  AR: "ARG",
  CO: "COL",
  BR: "BRA",
};

const normalizeCountryCode = (code?: string) => {
  const normalized = String(code ?? "")
    .trim()
    .toUpperCase();
  return COUNTRY_CODE_ALIASES[normalized] ?? normalized;
};

// Read-only field component
function ReadOnlyField({
  label,
  value,
  description,
  example,
  tDetail,
}: {
  label: string;
  value: string | number | boolean | undefined;
  description?: string;
  example?: string;
  tDetail?: any;
}) {
  const displayValue =
    value === undefined || value === null
      ? tDetail?.("notConfigured") || "No configurado"
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
  const tDetail = useTranslations("mantainers.branches.detail");
  const formValues = watch();

  if (!canUpdate) {
    return (
      <div className="space-y-6">
        <Card title={tDetail("attendanceParams.parameters.title")}>
          <div className="w-full">
            <div className="flex items-start gap-3 p-3 rounded-lg w-full">
              <div className="flex items-center h-5">
                <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
                  {formValues.useBranchSettings && (
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
                  {tDetail("attendanceParams.useBranchSettings")}
                </div>
                <p className="text-gray-500 text-sm">
                  {tDetail("attendanceParams.useBranchSettingsDescription")}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card title={tDetail("attendanceParams.tolerances.title")}>
          <div className="grid grid-cols-2 gap-4">
            <ReadOnlyField
              label={tDetail("attendanceParams.tolerances.lateArrival.label")}
              value={formValues.lateArrivalTolerance}
              description={tDetail(
                "attendanceParams.tolerances.lateArrival.description",
              )}
              example={tDetail(
                "attendanceParams.tolerances.lateArrival.example",
              )}
              tDetail={tDetail}
            />
            <ReadOnlyField
              label={tDetail("attendanceParams.tolerances.lunchBreak.label")}
              value={formValues.lunchBreakTolerance}
              description={tDetail(
                "attendanceParams.tolerances.lunchBreak.description",
              )}
              example={tDetail(
                "attendanceParams.tolerances.lunchBreak.example",
              )}
              tDetail={tDetail}
            />
          </div>
        </Card>

        <Card title={tDetail("attendanceParams.schedules.title")}>
          <div className="grid grid-cols-2 gap-4">
            <ReadOnlyField
              label={tDetail("attendanceParams.schedules.beforeSchedule.label")}
              value={formValues.minutesBeforeSchedule}
              description={tDetail(
                "attendanceParams.schedules.beforeSchedule.description",
              )}
              example={tDetail(
                "attendanceParams.schedules.beforeSchedule.example",
              )}
              tDetail={tDetail}
            />
            <ReadOnlyField
              label={tDetail("attendanceParams.schedules.afterSchedule.label")}
              value={formValues.minutesAfterSchedule}
              description={tDetail(
                "attendanceParams.schedules.afterSchedule.description",
              )}
              example={tDetail(
                "attendanceParams.schedules.afterSchedule.example",
              )}
              tDetail={tDetail}
            />
          </div>
        </Card>

        <Card title={tDetail("attendanceParams.automatic.title")}>
          <div className="grid grid-cols-2 gap-4">
            <ReadOnlyField
              label={tDetail(
                "attendanceParams.automatic.automaticCheckIn.label",
              )}
              value={formValues.automaticCheckInMinutes}
              description={tDetail(
                "attendanceParams.automatic.automaticCheckIn.description",
              )}
              example={tDetail(
                "attendanceParams.automatic.automaticCheckIn.example",
              )}
              tDetail={tDetail}
            />
            <ReadOnlyField
              label={tDetail(
                "attendanceParams.automatic.closeWithoutShift.label",
              )}
              value={formValues.minutesCloseRecordWithoutShift}
              description={tDetail(
                "attendanceParams.automatic.closeWithoutShift.description",
              )}
              example={tDetail(
                "attendanceParams.automatic.closeWithoutShift.example",
              )}
              tDetail={tDetail}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div data-tour="branch-detail-tab-params">
        <Card title={tDetail("attendanceParams.parameters.title")}>
          <div className="w-full">
            <Controller
              name="useBranchSettings"
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
                      htmlFor="useBranchSettings"
                      className="font-medium text-gray-900"
                    >
                      {tDetail("attendanceParams.useBranchSettings")}
                    </label>
                    <p className="text-gray-500 text-sm">
                      {tDetail("attendanceParams.useBranchSettingsDescription")}
                    </p>
                  </div>
                </div>
              )}
            />
          </div>
        </Card>
      </div>
      <div data-tour="branch-detail-tab-tolerances">
        <Card title={tDetail("attendanceParams.tolerances.title")}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <SystemInput
                control={control}
                label={tDetail("attendanceParams.tolerances.lateArrival.label")}
                attribute="lateArrivalTolerance"
                type="number"
                errors={errors}
              />
              <div className="text-gray-500 text-sm mt-1">
                {tDetail("attendanceParams.tolerances.lateArrival.description")}
                <div className="text-xs text-gray-400">
                  {tDetail("attendanceParams.tolerances.lateArrival.example")}
                </div>
              </div>
              <div className="bg-gray-100 p-4 mt-2 rounded-md text-sm border-l-4 border-blue-500">
                <span className="font-medium">
                  {tDetail(
                    "attendanceParams.tolerances.lateArrival.important",
                  )}{" "}
                </span>
                {tDetail("attendanceParams.tolerances.lateArrival.note")}
              </div>
            </div>

            <div>
              <SystemInput
                control={control}
                label={tDetail("attendanceParams.tolerances.lunchBreak.label")}
                attribute="lunchBreakTolerance"
                type="number"
                errors={errors}
              />
              <div className="text-gray-500 text-sm mt-1">
                {tDetail("attendanceParams.tolerances.lunchBreak.description")}
                <div className="text-xs text-gray-400">
                  {tDetail("attendanceParams.tolerances.lunchBreak.example")}
                </div>
              </div>
              <div className="bg-gray-100 p-4 mt-2 rounded-md text-sm border-l-4 border-blue-500">
                <span className="font-medium">
                  {tDetail(
                    "attendanceParams.tolerances.lunchBreak.important",
                  )}{" "}
                </span>
                {tDetail("attendanceParams.tolerances.lunchBreak.note")}
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div data-tour="branch-detail-tab-schedules">
        <Card title={tDetail("attendanceParams.schedules.title")}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <SystemInput
                control={control}
                label={tDetail(
                  "attendanceParams.schedules.beforeSchedule.label",
                )}
                attribute="minutesBeforeSchedule"
                type="number"
                errors={errors}
              />
              <div className="text-gray-500 text-sm mt-1">
                {tDetail(
                  "attendanceParams.schedules.beforeSchedule.description",
                )}
                <div className="text-xs text-gray-400">
                  {tDetail("attendanceParams.schedules.beforeSchedule.example")}
                </div>
              </div>
              <div className="bg-gray-100 p-4 mt-2 rounded-md text-sm border-l-4 border-blue-500">
                <span className="font-medium">
                  {tDetail(
                    "attendanceParams.schedules.beforeSchedule.note",
                  )}{" "}
                </span>
                {tDetail("attendanceParams.schedules.beforeSchedule.text")}
              </div>
            </div>

            <div>
              <SystemInput
                control={control}
                label={tDetail(
                  "attendanceParams.schedules.afterSchedule.label",
                )}
                attribute="minutesAfterSchedule"
                type="number"
                errors={errors}
              />
              <div className="text-gray-500 text-sm mt-1">
                {tDetail(
                  "attendanceParams.schedules.afterSchedule.description",
                )}
                <div className="text-xs text-gray-400">
                  {tDetail("attendanceParams.schedules.afterSchedule.example")}
                </div>
              </div>
              <div className="bg-gray-100 p-4 mt-2 rounded-md text-sm border-l-4 border-blue-500">
                <span className="font-medium">
                  {tDetail(
                    "attendanceParams.schedules.afterSchedule.note",
                  )}{" "}
                </span>
                {tDetail("attendanceParams.schedules.afterSchedule.text")}
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div data-tour="branch-detail-tab-automatic">
        <Card title={tDetail("attendanceParams.automatic.title")}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <SystemInput
                control={control}
                label={tDetail(
                  "attendanceParams.automatic.automaticCheckIn.label",
                )}
                attribute="automaticCheckInMinutes"
                type="number"
                errors={errors}
              />
              <div className="text-gray-500 text-sm mt-1">
                {tDetail(
                  "attendanceParams.automatic.automaticCheckIn.description",
                )}
                <div className="text-xs text-gray-400">
                  {tDetail(
                    "attendanceParams.automatic.automaticCheckIn.example",
                  )}
                </div>
              </div>
              <div className="bg-gray-100 p-4 mt-2 rounded-md text-sm border-l-4 border-blue-500">
                <span className="font-medium">
                  {tDetail(
                    "attendanceParams.automatic.automaticCheckIn.warning",
                  )}{" "}
                </span>
                {tDetail("attendanceParams.automatic.automaticCheckIn.note")}
              </div>
            </div>

            <div>
              <SystemInput
                control={control}
                label={tDetail(
                  "attendanceParams.automatic.closeWithoutShift.label",
                )}
                attribute="minutesCloseRecordWithoutShift"
                type="number"
                errors={errors}
              />
              <div className="text-gray-500 text-sm mt-1">
                {tDetail(
                  "attendanceParams.automatic.closeWithoutShift.description",
                )}
                <div className="text-xs text-gray-400">
                  {tDetail(
                    "attendanceParams.automatic.closeWithoutShift.example",
                  )}
                </div>
              </div>
              <div className="bg-gray-100 p-4 mt-2 rounded-md text-sm border-l-4 border-blue-500">
                <span className="font-medium">
                  {tDetail(
                    "attendanceParams.automatic.closeWithoutShift.warning",
                  )}{" "}
                </span>
                {tDetail("attendanceParams.automatic.closeWithoutShift.note")}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function BranchInformation({
  control,
  setValue,
  errors,
  handleSelectAll,
  companyOptions,
  watch,
  canUpdate,
}: any) {
  const tDetail = useTranslations("mantainers.branches.detail");
  const formValues = watch();

  const countries = countriesGeography.countries ?? [];
  const selectedCountryCode = normalizeCountryCode(watch("country") ?? "");
  const selectedCountry = countries.find(
    (country) => country.code === selectedCountryCode,
  );
  const supportsLevel2 = (selectedCountry?.levels ?? []).includes("level2");
  const supportsLevel3 = (selectedCountry?.levels ?? []).includes("level3");
  const level1Options = selectedCountry?.level1 ?? [];
  const selectedLevel1Code = watch("region") ?? "";
  const selectedLevel1 = level1Options.find(
    (level1) => level1.code === selectedLevel1Code,
  );
  const level2Options = supportsLevel2 ? (selectedLevel1?.level2 ?? []) : [];
  const [selectedLevel2Code, setSelectedLevel2Code] = useState("");
  const selectedLevel2 = level2Options.find(
    (level2: any) => level2.code === selectedLevel2Code,
  );
  const level3Options = supportsLevel3
    ? ((selectedLevel2 as any)?.level3 ?? [])
    : [];

  useEffect(() => {
    setSelectedLevel2Code("");
  }, [selectedCountryCode, selectedLevel1Code]);

  if (!canUpdate) {
    return (
      <div className="space-y-6" data-tour="branch-detail-tab-basic-info">
        <Card title={tDetail("basicInfo.title")} className="bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <ReadOnlyField
              label={tDetail("basicInfo.code")}
              value={formValues.code}
              description={tDetail("basicInfo.codeDescription")}
              tDetail={tDetail}
            />
            <ReadOnlyField
              label={tDetail("basicInfo.name")}
              value={formValues.name}
              description={tDetail("basicInfo.nameDescription")}
              tDetail={tDetail}
            />
            <ReadOnlyField
              label={tDetail("basicInfo.phone")}
              value={formValues.phone}
              description={tDetail("basicInfo.phoneDescription")}
              tDetail={tDetail}
            />
            <div className="col-span-2">
              <ReadOnlyField
                label={tDetail("basicInfo.address")}
                value={formValues.address}
                description={tDetail("basicInfo.addressDescription")}
                tDetail={tDetail}
              />
            </div>
            <ReadOnlyField
              label={tDetail("basicInfo.timezone")}
              value={
                TIME_ZONE_OPTIONS.find(
                  (opt) => opt.value === formValues.timezone,
                )?.label || formValues.timezone
              }
              description={tDetail("basicInfo.timezoneDescription")}
              tDetail={tDetail}
            />
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
                    {tDetail("basicInfo.isActive")}
                  </div>
                  <p className="text-gray-500 text-sm">
                    {tDetail("basicInfo.isActiveDescription")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-tour="branch-detail-tab-basic-info">
      <Card title={tDetail("basicInfo.title")} className="bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          <SystemInput
            control={control}
            label={tDetail("basicInfo.code")}
            attribute="code"
            errors={errors}
            rules={{ required: tDetail("basicInfo.validation.codeRequired") }}
          />
          <SystemInput
            control={control}
            label={tDetail("basicInfo.name")}
            attribute="name"
            errors={errors}
            rules={{ required: tDetail("basicInfo.validation.nameRequired") }}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tDetail("basicInfo.phone")}
            </label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  value={field.value ?? ""}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={tDetail("basicInfo.phonePlaceholder")}
                  onChange={(e) => {
                    // Solo permitir números, espacios, + y -
                    const value = e.target.value.replace(/[^0-9+\-\s]/g, "");
                    field.onChange(value);
                  }}
                />
              )}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>
          <div className="col-span-2">
            <SystemInput
              control={control}
              label={tDetail("basicInfo.address")}
              attribute="address"
              errors={errors}
              rules={{
                required: tDetail("basicInfo.validation.addressRequired"),
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Pais
            </label>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <CHEKIOSelect
                  value={normalizeCountryCode(field.value || "")}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue("region", "");
                    setValue("commune", "");
                    setSelectedLevel2Code("");
                  }}
                >
                  <CHEKIOSelectTrigger className="w-full">
                    <CHEKIOSelectValue placeholder="Selecciona un país" />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    {countries.map((country) => (
                      <CHEKIOSelectItem key={country.code} value={country.code}>
                        {country.name}
                      </CHEKIOSelectItem>
                    ))}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              )}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nivel 1
            </label>
            <Controller
              name="region"
              control={control}
              render={({ field }) => (
                <CHEKIOSelect
                  value={field.value || ""}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue("commune", "");
                    setSelectedLevel2Code("");
                  }}
                >
                  <CHEKIOSelectTrigger className="w-full">
                    <CHEKIOSelectValue
                      placeholder={
                        selectedCountryCode
                          ? "Selecciona nivel 1"
                          : "Primero selecciona un país"
                      }
                    />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    {level1Options.map((level1) => (
                      <CHEKIOSelectItem key={level1.code} value={level1.code}>
                        {level1.name}
                      </CHEKIOSelectItem>
                    ))}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              )}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nivel 2
            </label>
            {supportsLevel3 ? (
              <CHEKIOSelect
                value={selectedLevel2Code || ""}
                onValueChange={(value) => {
                  setSelectedLevel2Code(value);
                  setValue("commune", "");
                }}
                disabled={
                  !selectedCountryCode || !supportsLevel2 || !selectedLevel1Code
                }
              >
                <CHEKIOSelectTrigger className="w-full">
                  <CHEKIOSelectValue
                    placeholder={
                      supportsLevel2
                        ? selectedLevel1Code
                          ? "Selecciona nivel 2"
                          : "Primero selecciona nivel 1"
                        : "Este país no usa segundo nivel"
                    }
                  />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  {level2Options.map((level2: any, index: number) => (
                    <CHEKIOSelectItem
                      key={`${level2.code}-${level2.name}-${index}`}
                      value={level2.code}
                    >
                      {level2.name}
                    </CHEKIOSelectItem>
                  ))}
                </CHEKIOSelectContent>
              </CHEKIOSelect>
            ) : (
              <Controller
                name="commune"
                control={control}
                render={({ field }) => (
                  <CHEKIOSelect
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={
                      !selectedCountryCode ||
                      !supportsLevel2 ||
                      !selectedLevel1Code
                    }
                  >
                    <CHEKIOSelectTrigger className="w-full">
                      <CHEKIOSelectValue
                        placeholder={
                          supportsLevel2
                            ? selectedLevel1Code
                              ? "Selecciona nivel 2"
                              : "Primero selecciona nivel 1"
                            : "Este país no usa segundo nivel"
                        }
                      />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      {level2Options.map((commune: any) => (
                        <CHEKIOSelectItem
                          key={commune.name}
                          value={commune.name}
                        >
                          {commune.name}
                        </CHEKIOSelectItem>
                      ))}
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                )}
              />
            )}
          </div>

          {supportsLevel3 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Nivel 3
              </label>
              <Controller
                name="commune"
                control={control}
                render={({ field }) => (
                  <CHEKIOSelect
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={!selectedLevel2Code}
                  >
                    <CHEKIOSelectTrigger className="w-full">
                      <CHEKIOSelectValue
                        placeholder={
                          selectedLevel2Code
                            ? "Selecciona nivel 3"
                            : "Primero selecciona nivel 2"
                        }
                      />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      {level3Options.map((level3: any) => (
                        <CHEKIOSelectItem key={level3.code} value={level3.name}>
                          {level3.name}
                        </CHEKIOSelectItem>
                      ))}
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                )}
              />
            </div>
          )}

          <SystemMultiSelect
            control={control}
            label={tDetail("basicInfo.companies")}
            attribute="companies"
            options={companyOptions || []}
            errors={errors}
            rules={{
              required: tDetail("basicInfo.validation.companiesRequired"),
            }}
            placeholder={tDetail("basicInfo.companiesPlaceholder")}
            showSelectAll={true}
            onSelectAll={handleSelectAll}
            searchable={true}
            showClear={true}
            maxItems={3}
            showError={true}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {tDetail("basicInfo.timezone")}
            </label>
            <Controller
              name="timezone"
              control={control}
              rules={{
                required: tDetail("basicInfo.validation.timezoneRequired"),
              }}
              render={({ field }) => (
                <>
                  <CHEKIOSelect
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <CHEKIOSelectTrigger
                      className={
                        errors.timezone ? "border-red-500 w-full" : "w-full"
                      }
                    >
                      <CHEKIOSelectValue
                        placeholder={tDetail("basicInfo.timezonePlaceholder")}
                      />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      {TIME_ZONE_OPTIONS.map((option) => (
                        <CHEKIOSelectItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </CHEKIOSelectItem>
                      ))}
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                  {errors.timezone && (
                    <p className="text-red-500 text-xs">
                      {errors.timezone.message}
                    </p>
                  )}
                </>
              )}
            />
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
                      checked={field.value ?? true}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="isActive"
                      className="font-medium text-gray-900"
                    >
                      {tDetail("basicInfo.isActive")}
                    </label>
                    <p className="text-gray-500 text-sm">
                      {tDetail("basicInfo.isActiveDescription")}
                    </p>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function GeolocationSection({
  branchId,
  geolocations,
  geolocationArray,
  control,
  errors,
}: {
  branchId: string;
  geolocations: BranchGeolocationResponseDto[];
  geolocationArray: UseFieldArrayReturn<
    BranchCreateDto | BranchUpdateDto,
    "geolocations",
    "publicId"
  >;
  control: Control<any>;
  errors: FieldErrors<any>;
}) {
  const tDetail = useTranslations("mantainers.branches.detail");
  return (
    <>
      <div className="space-y-6">
        <div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          data-tour="branch-detail-tab-geolocation"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {tDetail("geolocation.title")}
          </h3>
          <MapEditor
            isUpdate={true}
            control={control}
            errors={errors}
            geolocationArray={geolocationArray}
          />
        </div>
      </div>
    </>
  );
}

type Params = { branchId: string };

export default function BranchDetails({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  const t = useTranslations("mantainers.branches");
  const tDetail = useTranslations("mantainers.branches.detail");
  const { toast } = useToast();
  const router = useRouter();
  const resolvedParams =
    typeof (params as Promise<Params>).then === "function"
      ? use(params as Promise<Params>)
      : (params as Params);
  const branchId = resolvedParams.branchId;
  const { data: branch, isLoading } = useGetBranchById(branchId);
  const { mutate: updateBranch, isPending: isUpdating } = useUpdateBranch();
  const { data: geolocations } = useGetBranchGeolocations(branchId);
  const { data: companies } = useGetCompanies({
    selector: true,
  });

  const companyOptions = companies?.data.map((company) => ({
    value: company.publicId,
    label: company.businessName,
  }));

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<any>({
    defaultValues: {
      code: "",
      name: "",
      address: "",
      country: "",
      region: "",
      commune: "",
      phone: "",
      timezone: "",
      isActive: true,
      companies: [],
      useBranchSettings: false,
      geolocations: geolocations || [],
    },
  });

  const geolocationArray = useFieldArray<
    BranchCreateDto | BranchUpdateDto,
    "geolocations",
    "publicId"
  >({
    control,
    name: "geolocations",
  });

  const [activeTab, setActiveTab] = useState<string>("0");
  const { startTour } = useBranchDetailTour(activeTab);

  const handleSelectAll = () => {
    const allValues = companyOptions?.map((option) => option.value) || [];
    setValue("companies", allValues);
  };

  useEffect(() => {
    if (branch && !isLoading) {
      reset({
        name: branch.name,
        code: branch.code,
        address: branch.address,
        country: normalizeCountryCode(branch.country ?? ""),
        region: branch.region ?? "",
        commune: branch.commune ?? "",
        phone: branch.phone ?? "",
        timezone: branch.timezone ?? "",
        isActive: branch.isActive ?? true,
        companies: branch.companies,
        useBranchSettings: branch.useBranchSettings || false,
        geolocations: geolocations || [],
        lateArrivalTolerance: branch.settings.lateArrivalTolerance,
        lunchBreakTolerance: branch.settings.lunchBreakTolerance,
        minutesBeforeSchedule: branch.settings.minutesBeforeSchedule,
        minutesAfterSchedule: branch.settings.minutesAfterSchedule,
        automaticCheckInMinutes: branch.settings.automaticCheckInMinutes,
        minutesCloseRecordWithoutShift:
          branch.settings.minutesCloseRecordWithoutShift,
      });
    }
  }, [branch, reset, isLoading, geolocations]);

  const onSubmit = (data: BranchUpdateDto) => {
    updateBranch(
      { ...data, publicId: resolvedParams.branchId },
      {
        onSuccess: () => {
          toast({
            title: tDetail("toast.updateSuccess"),
            description: tDetail("toast.updateSuccessDescription"),
          });
          router.push("/mantainers/branches");
        },
        onError: (error: any) => {
          if (axios.isAxiosError(error)) {
            toast({
              title: tDetail("toast.updateError"),
              description: error.response?.data.message,
            });
          } else {
            toast({
              title: tDetail("toast.updateError"),
              description: tDetail("toast.updateErrorDescription"),
            });
          }
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CHEKIOLoading size="lg" variant="modern" text={tDetail("loading")} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card bordered={false}>
            <div className="flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 mb-4">
                <div className="flex items-center gap-3">
                  <CHEKIOButton
                    type="button"
                    variant="secondaryBlue"
                    className="h-9 w-9 p-0 rounded-lg flex items-center justify-center"
                    onClick={() => router.push("/mantainers/branches")}
                    aria-label="Volver al listado de sucursales"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </CHEKIOButton>
                  <div className="flex">
                    <CHEKIOTab
                      type="button"
                      active={activeTab === "0"}
                      onClick={() => setActiveTab("0")}
                      className={`justify-start border-b-2 mr-4 px-4 py-2 ${
                        activeTab === "0"
                          ? "border-b-blue-600 text-blue-600 bg-blue-50"
                          : "border-b-transparent text-gray-500 hover:text-gray-700 hover:border-b-gray-300"
                      }`}
                    >
                      {tDetail("tabs.basicInfo")}
                    </CHEKIOTab>
                    <CHEKIOTab
                      type="button"
                      active={activeTab === "1"}
                      onClick={() => setActiveTab("1")}
                      className={`justify-start border-b-2 mr-4 px-4 py-2 ${
                        activeTab === "1"
                          ? "border-b-blue-600 text-blue-600 bg-blue-50"
                          : "border-b-transparent text-gray-500 hover:text-gray-700 hover:border-b-gray-300"
                      }`}
                    >
                      {tDetail("tabs.geolocation")}
                    </CHEKIOTab>
                    <CHEKIOTab
                      type="button"
                      active={activeTab === "2"}
                      onClick={() => setActiveTab("2")}
                      className={`justify-start border-b-2 px-4 py-2 ${
                        activeTab === "2"
                          ? "border-b-blue-600 text-blue-600 bg-blue-50"
                          : "border-b-transparent text-gray-500 hover:text-gray-700 hover:border-b-gray-300"
                      }`}
                    >
                      {tDetail("tabs.attendanceParams")}
                    </CHEKIOTab>
                  </div>
                </div>
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() => startTour()}
                  className="mb-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  {t("detailTour.startButton")}
                </CHEKIOButton>
              </div>

              <div className="flex-1">
                {activeTab === "0" && (
                  <BranchInformation
                    control={control}
                    setValue={setValue}
                    errors={errors}
                    handleSelectAll={handleSelectAll}
                    companyOptions={companyOptions || []}
                    watch={watch}
                    canUpdate={true}
                  />
                )}
                {activeTab === "1" && (
                  <GeolocationSection
                    branchId={branchId}
                    geolocations={geolocations || []}
                    geolocationArray={geolocationArray}
                    control={control}
                    errors={errors}
                  />
                )}
                {activeTab === "2" && (
                  <AttendanceParameters
                    control={control}
                    errors={errors}
                    watch={watch}
                    canUpdate={true}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <CHEKIOButton
                type="submit"
                variant="primary"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{tDetail("buttons.updating")}</span>
                  </>
                ) : (
                  tDetail("buttons.update")
                )}
              </CHEKIOButton>
            </div>
          </Card>
        </form>
      </div>
    </>
  );
}
