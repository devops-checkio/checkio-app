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
import SystemMultiSelect from "@/components/ui/multi-select";
import SystemAddressInput from "@/components/ui/system-address-input";
import SystemInput from "@/components/ui/system-input";
import { useToast } from "@/hooks/use-toast";
import { TIME_ZONE_OPTIONS } from "@/lib/options/time-zone";
import { useCreateBranch, useUpdateBranch } from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { CompanyOption } from "../../companies/_components/company.dto";
import countriesGeography from "../_data/country-geography.json";
import {
  BranchCreateDto,
  BranchGeolocationType,
  BranchResponseDto,
  BranchUpdateDto,
} from "./branch.dto";
import MapEditor from "./map-editor";

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

interface BranchModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  editingBranch: BranchResponseDto | null;
  onSuccess: () => void;
  companyOptions: CompanyOption[];
}

export default function BranchModalUpsert({
  isOpen,
  onClose,
  editingBranch,
  companyOptions,
  onSuccess,
}: BranchModalUpsertProps) {
  const tDetail = useTranslations("mantainers.branches.detail");
  const { toast } = useToast();
  const { mutate: createBranch, isPending: isCreatingBranch } =
    useCreateBranch();
  const { mutate: updateBranch, isPending: isUpdatingBranch } =
    useUpdateBranch();

  const [addressCoordinates, setAddressCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<BranchCreateDto | BranchUpdateDto>();

  const countries = countriesGeography.countries ?? [];
  const selectedCountryCode = normalizeCountryCode(
    useWatch({ control, name: "country" }) ?? "",
  );
  const selectedCountry =
    countries.find((country) => country.code === selectedCountryCode);
  const supportsLevel2 = (selectedCountry?.levels ?? []).includes("level2");
  const supportsLevel3 = (selectedCountry?.levels ?? []).includes("level3");
  const level1Options = selectedCountry?.level1 ?? [];
  const selectedLevel1Code = useWatch({ control, name: "region" }) ?? "";
  const selectedLevel1 = level1Options.find(
    (level1) => level1.code === selectedLevel1Code,
  );
  const level2Options = supportsLevel2 ? selectedLevel1?.level2 ?? [] : [];
  const [selectedLevel2Code, setSelectedLevel2Code] = useState("");
  const selectedLevel2 = level2Options.find(
    (level2: any) => level2.code === selectedLevel2Code,
  );
  const level3Options = supportsLevel3 ? (selectedLevel2 as any)?.level3 ?? [] : [];

  const geolocationArray = useFieldArray<
    BranchCreateDto | BranchUpdateDto,
    "geolocations",
    "publicId"
  >({
    control,
    name: "geolocations",
  });

  useEffect(() => {
    if (editingBranch) {
      reset({
        code: editingBranch.code,
        name: editingBranch.name,
        address: editingBranch.address,
        country: normalizeCountryCode(editingBranch.country || ""),
        region: editingBranch.region || "",
        commune: editingBranch.commune || "",
        phone: editingBranch.phone,
        companies: editingBranch.companies,
        timezone: editingBranch.timezone,
        isActive: editingBranch.isActive ?? true,
      });
    } else {
      reset({
        country: "",
        region: "",
        commune: "",
        isActive: true,
      });
    }
  }, [editingBranch, reset]);

  useEffect(() => {
    setSelectedLevel2Code("");
  }, [selectedCountryCode, selectedLevel1Code]);

  const onSubmit: SubmitHandler<BranchCreateDto | BranchUpdateDto> = (data) => {
    if (editingBranch) {
      updateBranch(
        { ...data, publicId: editingBranch.publicId } as BranchUpdateDto,
        {
          onSuccess: () => {
            toast({
              title: tDetail("toast.updateSuccess"),
              description: tDetail("toast.updateSuccessDescription"),
            });
            onSuccess();
          },
          onError: (error: any) => {
            handleError(error, toast);
          },
        }
      );
    } else {
      createBranch(data as BranchCreateDto, {
        onSuccess: () => {
          toast({
            title: tDetail("toast.createSuccess"),
            description: tDetail("toast.createSuccessDescription"),
          });
          onSuccess();
        },
        onError: (error: any) => {
          handleError(error, toast);
        },
      });
    }
  };

  const handleSelectAll = () => {
    const allValues = companyOptions.map((option) => option.value);
    setValue("companies", allValues);
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBranch ? tDetail("buttons.edit") : tDetail("buttons.add")}
      size="5xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-3 gap-4">
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
          <SystemAddressInput
            control={control}
            label={tDetail("basicInfo.address")}
            attribute="address"
            errors={errors}
            rules={{
              required: tDetail("basicInfo.validation.addressRequired"),
            }}
            placeholder={tDetail("basicInfo.addressPlaceholder")}
            onPlaceSelected={(place, coordinates) => {
              const addOrUpdatePoint = (lat: number, lng: number) => {
                setAddressCoordinates({ lat, lng });
                const name =
                  (place?.name as string) ||
                  (place?.formatted_address as string) ||
                  "Ubicación seleccionada";

                if (geolocationArray.fields.length > 0) {
                  geolocationArray.update(0, {
                    ...(geolocationArray.fields[0] as any),
                    name,
                    latitude: lat,
                    longitude: lng,
                  } as any);
                } else {
                  geolocationArray.append({
                    name,
                    latitude: lat,
                    longitude: lng,
                    radius: 100,
                    type: BranchGeolocationType.MIXED,
                    publicId: uuidv4(),
                  } as any);
                }
              };

              if (coordinates) {
                addOrUpdatePoint(coordinates.lat, coordinates.lng);
                return;
              }

              try {
                const geocoder = new google.maps.Geocoder();
                const address =
                  (place?.formatted_address as string) ||
                  (place as any)?.description ||
                  "";
                if (!address) return;
                geocoder.geocode({ address }, (results, status) => {
                  if (
                    status === "OK" &&
                    results &&
                    results[0]?.geometry?.location
                  ) {
                    const loc = results[0].geometry.location;
                    addOrUpdatePoint(loc.lat(), loc.lng());
                  }
                });
              } catch {}
            }}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Pais</label>
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
            <label className="text-sm font-medium text-gray-700">Nivel 1</label>
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
            <label className="text-sm font-medium text-gray-700">Nivel 2</label>
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
                      {level2Options.map((commune: any) => (
                        <CHEKIOSelectItem key={commune.name} value={commune.name}>
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
              <label className="text-sm font-medium text-gray-700">Nivel 3</label>
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
            options={companyOptions}
            errors={errors}
            rules={{ required: tDetail("basicInfo.validation.companiesRequired") }}
            showSelectAll={true}
            onSelectAll={handleSelectAll}
            placeholder={tDetail("basicInfo.companiesPlaceholder")}
            showError={true}
            searchable={true}
            showClear={true}
            maxItems={3}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {tDetail("basicInfo.timezone")}
            </label>
            <Controller
              name="timezone"
              control={control}
              rules={{ required: tDetail("basicInfo.validation.timezoneRequired") }}
              render={({ field }) => (
                <>
                  <CHEKIOSelect
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <CHEKIOSelectTrigger
                      className={
                        errors.timezone ? "border-red-500 w-full" : "w-full"
                      }
                    >
                      <CHEKIOSelectValue placeholder={tDetail("basicInfo.timezonePlaceholder")} />
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
                    <label htmlFor="isActive" className="font-medium text-gray-900">
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

        <MapEditor
          geolocationArray={geolocationArray}
          control={control}
          errors={errors}
          centerLocation={addressCoordinates}
          showSearchBox={!!editingBranch}
        />

        <CHEKIOButton
          type="submit"
          variant="primary"
          disabled={isCreatingBranch || isUpdatingBranch}
          className="w-full"
        >
          {isCreatingBranch || isUpdatingBranch ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {editingBranch
                  ? tDetail("buttons.updating")
                  : tDetail("buttons.creating")}
              </span>
            </>
          ) : (
            <span>
              {editingBranch ? tDetail("buttons.update") : tDetail("buttons.save")}
            </span>
          )}
        </CHEKIOButton>
      </form>
    </CHEKIOModal>
  );
}
