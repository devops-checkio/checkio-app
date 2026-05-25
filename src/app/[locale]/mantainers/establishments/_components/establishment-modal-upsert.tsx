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
import {
  useCreateEstablishment,
  useUpdateEstablishment,
} from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { CompanyOption } from "../../companies/_components/company.dto";
import EstablishmentGeolocationMapEditor from "./establishment-geolocation-map-editor";
import {
  EstablishmentCreateDto,
  EstablishmentGeolocationType,
  EstablishmentResponseDto,
  EstablishmentUpdateDto,
} from "./establishment.dto";

interface EstablishmentModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  editingEstablishment: EstablishmentResponseDto | null;
  onSuccess: () => void;
  companyOptions: CompanyOption[];
}

export default function EstablishmentModalUpsert({
  isOpen,
  onClose,
  editingEstablishment,
  companyOptions,
  onSuccess,
}: EstablishmentModalUpsertProps) {
  const t = useTranslations("mantainers.establishments.detail");
  const { toast } = useToast();
  const { mutate: createEstablishment, isPending: isCreating } =
    useCreateEstablishment();
  const { mutate: updateEstablishment, isPending: isUpdating } =
    useUpdateEstablishment();

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
  } = useForm<EstablishmentCreateDto | EstablishmentUpdateDto>();

  const geolocationArray = useFieldArray<
    EstablishmentCreateDto | EstablishmentUpdateDto,
    "geolocations",
    "publicId"
  >({
    control,
    name: "geolocations",
  });

  useEffect(() => {
    if (editingEstablishment) {
      reset({
        code: editingEstablishment.code,
        name: editingEstablishment.name,
        address: editingEstablishment.address,
        phone: editingEstablishment.phone,
        companies: editingEstablishment.companies,
        timezone: editingEstablishment.timezone,
        isActive: editingEstablishment.isActive ?? true,
        geolocations: (editingEstablishment.geolocations ?? []).map((g) => ({
          publicId: g.publicId,
          name: g.name,
          latitude: g.latitude,
          longitude: g.longitude,
          radius: g.radius,
          type: g.type,
        })),
      });
    } else {
      reset({ isActive: true, geolocations: [] });
    }
  }, [editingEstablishment, reset]);

  const onSubmit: SubmitHandler<
    EstablishmentCreateDto | EstablishmentUpdateDto
  > = (data) => {
    if (editingEstablishment) {
      updateEstablishment(
        {
          ...(data as EstablishmentUpdateDto),
          publicId: editingEstablishment.publicId,
        },
        {
          onSuccess: () => {
            toast({
              title: t("toast.updateSuccess"),
              description: t("toast.updateSuccessDescription"),
            });
            onSuccess();
            onClose();
          },
          onError: (error: any) => handleError(error, toast),
        },
      );
    } else {
      createEstablishment(data as EstablishmentCreateDto, {
        onSuccess: () => {
          toast({
            title: t("toast.createSuccess"),
            description: t("toast.createSuccessDescription"),
          });
          onSuccess();
          onClose();
        },
        onError: (error: any) => handleError(error, toast),
      });
    }
  };

  const handleSelectAll = () => {
    setValue(
      "companies",
      companyOptions.map((o) => o.value),
    );
  };

  const isPending = isCreating || isUpdating;

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingEstablishment ? t("buttons.edit") : t("buttons.add")
      }
      size="5xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        {/* Basic info */}
        <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-3 gap-4">
          <SystemInput
            control={control}
            label={t("basicInfo.code")}
            attribute="code"
            errors={errors}
            rules={{ required: t("basicInfo.validation.codeRequired") }}
          />
          <SystemInput
            control={control}
            label={t("basicInfo.name")}
            attribute="name"
            errors={errors}
            rules={{ required: t("basicInfo.validation.nameRequired") }}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("basicInfo.phone")}
            </label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t("basicInfo.phonePlaceholder")}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9+\-\s]/g, "");
                    field.onChange(value);
                  }}
                />
              )}
            />
          </div>

          <SystemAddressInput
            control={control}
            label={t("basicInfo.address")}
            attribute="address"
            errors={errors}
            rules={{ required: t("basicInfo.validation.addressRequired") }}
            placeholder={t("basicInfo.addressPlaceholder")}
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
                    type: EstablishmentGeolocationType.MIXED,
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

          <SystemMultiSelect
            control={control}
            label={t("basicInfo.companies")}
            attribute="companies"
            options={companyOptions}
            errors={errors}
            rules={{ required: t("basicInfo.validation.companiesRequired") }}
            showSelectAll={true}
            onSelectAll={handleSelectAll}
            placeholder={t("basicInfo.companiesPlaceholder")}
            showError={true}
            searchable={true}
            showClear={true}
            maxItems={3}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("basicInfo.timezone")}
            </label>
            <Controller
              name="timezone"
              control={control}
              rules={{ required: t("basicInfo.validation.timezoneRequired") }}
              render={({ field }) => (
                <>
                  <CHEKIOSelect
                    value={field.value as string}
                    onValueChange={field.onChange}
                  >
                    <CHEKIOSelectTrigger
                      className={errors.timezone ? "border-red-500 w-full" : "w-full"}
                    >
                      <CHEKIOSelectValue
                        placeholder={t("basicInfo.timezonePlaceholder")}
                      />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      {TIME_ZONE_OPTIONS.map((option) => (
                        <CHEKIOSelectItem key={option.value} value={option.value}>
                          {option.label}
                        </CHEKIOSelectItem>
                      ))}
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                  {errors.timezone && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.timezone.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>
        </div>

        {/* Geolocations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              {t("geolocations.title")}
            </h3>
            <CHEKIOButton
              variant="secondaryBlue"
              type="button"
              onClick={() =>
                geolocationArray.append({
                  name: "",
                  latitude: addressCoordinates?.lat ?? 0,
                  longitude: addressCoordinates?.lng ?? 0,
                  radius: 100,
                  type: EstablishmentGeolocationType.MIXED,
                  publicId: uuidv4(),
                } as any)
              }
            >
              {t("geolocations.add")}
            </CHEKIOButton>
          </div>

          {geolocationArray.fields.length > 0 && (
            <EstablishmentGeolocationMapEditor
              control={control as any}
              errors={errors}
              geolocationArray={geolocationArray as any}
              centerLocation={addressCoordinates}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <CHEKIOButton
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            {t("buttons.cancel")}
          </CHEKIOButton>
          <CHEKIOButton variant="primary" type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {editingEstablishment ? t("buttons.update") : t("buttons.create")}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}
