"use client";

import { DocumentTypeOptions } from "@/app/[locale]/mantainers/companies/_components/company.dto";
import {
  CHEKIOInput,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { CheckioInputDate } from "@/components/ui/checkio-input-date";
import { documentValidators, formatDocumentType } from "@/lib/utils";
import { ErrorMessage } from "@hookform/error-message";
import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useParams } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";
import countriesGeography from "../../../branches/_data/country-geography.json";
import { GenderOptions } from "../../_components/employee.dto";

// Helper function to convert locale to DatePicker locale
const getDatePickerLocale = (locale: string): "es" | "en" | "fr" | "pt" => {
  switch (locale) {
    case "en":
      return "en";
    case "fr":
      return "fr";
    case "pt":
      return "pt";
    case "es":
    default:
      return "es";
  }
};

interface PersonalDataProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  documentType: string;
  setSelectedDocType: (value: string) => void;
  employee?: {
    photo?: string;
    firstName?: string;
    lastName?: string;
  };
  imagePreview: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
}

const PersonalData = ({
  control,
  errors,
  setValue,
  documentType,
  setSelectedDocType,
  employee,
  imagePreview,
  onFileSelect,
  onRemoveImage,
}: PersonalDataProps) => {
  const params = useParams();
  const t = useTranslations("mantainers.employees");
  const currentLocale = getDatePickerLocale(params.locale as string);
  const [isDocumentValid, setIsDocumentValid] = useState<boolean | null>(null);

  // Set RUT as default document type if not provided
  useEffect(() => {
    if (!documentType) {
      setValue("documentType", "RUT");
      setSelectedDocType("RUT");
    }
  }, [documentType, setValue, setSelectedDocType]);

  // Watch document number to apply formatting
  const documentNumber = useWatch({
    control,
    name: "documentNumber",
  });
  const selectedCountryCode = useWatch({
    control,
    name: "country",
  });
  const selectedNivel1Code = useWatch({
    control,
    name: "lvl1",
  });
  const selectedNivel2Code = useWatch({
    control,
    name: "lvl2",
  });
  const countries = useMemo(() => countriesGeography.countries ?? [], []);
  const selectedCountry = useMemo(
    () =>
      countries.find((country: any) => country.code === selectedCountryCode),
    [countries, selectedCountryCode],
  );
  const supportsNivel2 = (selectedCountry?.levels ?? []).includes("level2");
  const supportsNivel3 = (selectedCountry?.levels ?? []).includes("level3");
  const nivel1Options = selectedCountry?.level1 ?? [];
  const selectedNivel1 = nivel1Options.find(
    (level1: any) => level1.code === selectedNivel1Code,
  );
  const nivel2Options = supportsNivel2 ? (selectedNivel1?.level2 ?? []) : [];
  const selectedNivel2 = nivel2Options.find(
    (level2: any) => level2.code === selectedNivel2Code,
  );
  const nivel3Options = supportsNivel3
    ? ((selectedNivel2 as any)?.level3 ?? [])
    : [];

  // Validate document number whenever it changes
  useEffect(() => {
    if (documentType && documentNumber) {
      const validator =
        documentValidators[documentType as keyof typeof documentValidators];
      if (validator) {
        const isValid = validator(documentNumber);
        setIsDocumentValid(isValid);
        setValue("documentNumberValid", isValid, { shouldValidate: false });
      }
    } else {
      setIsDocumentValid(null);
    }
  }, [documentType, documentNumber, setValue]);

  useEffect(() => {
    if (!selectedCountryCode) {
      setValue("lvl1", "");
      setValue("lvl2", "");
      setValue("lvl3", "");
    }
  }, [selectedCountryCode, setValue]);

  useEffect(() => {
    setValue("lvl2", "");
    setValue("lvl3", "");
  }, [selectedNivel1Code, setValue]);

  useEffect(() => {
    setValue("lvl3", "");
  }, [selectedNivel2Code, setValue]);

  // Apply document number formatting when documentType or documentNumber changes
  useEffect(() => {
    if (documentType && documentNumber) {
      const formatter =
        formatDocumentType[documentType as keyof typeof formatDocumentType];
      if (formatter) {
        const formattedValue = formatter(documentNumber);
        if (formattedValue !== documentNumber) {
          setValue("documentNumber", formattedValue, { shouldValidate: true });
        }
      }
    }
  }, [documentType, documentNumber, setValue]);

  const resolveRemovePhotoLabel = () => {
    const label = t("upsert.fields.removePhoto");
    return label === "mantainers.employees.upsert.fields.removePhoto"
      ? "Quitar foto"
      : label;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex gap-6 items-start">
        <div className="flex-shrink-0">
          <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-white shadow-lg relative">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt={t("ariaLabels.photoOf", {
                  name:
                    `${employee?.firstName || ""} ${employee?.lastName || ""}`.trim() ||
                    "employee",
                })}
                fill
                className="object-cover"
                sizes="128px"
              />
            ) : null}
            <div
              className={`w-full h-full flex items-center justify-center bg-gray-100 ${
                imagePreview ? "hidden" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 w-full max-w-xs">
            <input
              type="file"
              id="employee-photo-upload"
              accept="image/*"
              onChange={onFileSelect}
              className="hidden"
            />
            <label
              htmlFor="employee-photo-upload"
              className="block w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors cursor-pointer bg-white text-center text-sm text-gray-700"
            >
              {imagePreview
                ? t("upsert.fields.changePhoto")
                : t("upsert.fields.uploadPhoto")}
            </label>
            {imagePreview && (
              <button
                type="button"
                onClick={onRemoveImage}
                className="mt-2 w-full text-xs text-red-600 hover:text-red-700"
              >
                {resolveRemovePhotoLabel()}
              </button>
            )}
          </div>
        </div>

        {/* Formulario al lado */}
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("upsert.fields.firstName")}
              </label>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <>
                    <CHEKIOInput
                      {...field}
                      className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.firstName.message as string}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("upsert.fields.lastName")}
              </label>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <>
                    <CHEKIOInput
                      {...field}
                      className={errors.lastName ? "border-red-500" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.lastName.message as string}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("upsert.fields.motherLastName")}
              </label>
              <Controller
                name="secondLastName"
                control={control}
                render={({ field }) => (
                  <>
                    <CHEKIOInput
                      {...field}
                      className={errors.secondLastName ? "border-red-500" : ""}
                    />
                    {errors.secondLastName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.secondLastName.message as string}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("upsert.fields.documentType")}
              </label>
              <Controller
                name="documentType"
                control={control}
                defaultValue="RUT"
                render={({ field }) => (
                  <>
                    <CHEKIOSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedDocType(value);

                        // Reset document number and validation when type changes
                        setValue("documentNumber", "", {
                          shouldValidate: true,
                        });
                        setIsDocumentValid(null);
                      }}
                    >
                      <CHEKIOSelectTrigger
                        className={errors.documentType ? "border-red-500" : ""}
                      >
                        <CHEKIOSelectValue
                          placeholder={t("detail.selectDocumentType")}
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
                        <p className="text-xs text-red-500">
                          {message === "Required"
                            ? t("detail.validation.fieldRequired")
                            : message}
                        </p>
                      )}
                    />
                  </>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("upsert.fields.documentNumber")}
              </label>
              <Controller
                name="documentNumber"
                control={control}
                rules={{
                  required: t("detail.validation.fieldRequired"),
                  validate: (value) => {
                    if (!documentType) return true;
                    const validator =
                      documentValidators[
                        documentType as keyof typeof documentValidators
                      ];
                    return validator && validator(value)
                      ? true
                      : t("detail.validation.documentInvalid");
                  },
                }}
                render={({ field }) => (
                  <>
                    <div className="relative">
                      <CHEKIOInput
                        {...field}
                        className={`${
                          errors.documentNumber
                            ? "border-red-500"
                            : isDocumentValid === true
                              ? "border-green-500"
                              : isDocumentValid === false
                                ? "border-yellow-500"
                                : ""
                        }`}
                        placeholder={
                          documentType === "RUT"
                            ? "Ej: 12.345.678-9"
                            : documentType === "DNI"
                              ? "Ej: 12345678"
                              : documentType === "CPF"
                                ? "Ej: 123.456.789-10"
                                : documentType === "CC"
                                  ? "Ej: 1.234.567.890"
                                  : documentType === "CI"
                                    ? "Ej: 1.234.567"
                                    : documentType === "DPI"
                                      ? "Ej: 1234 56789 0123"
                                      : documentType === "DUI"
                                        ? "Ej: 12345678-9"
                                        : documentType === "CIP"
                                          ? "Ej: 1-234-5678"
                                          : documentType === "CEDULA"
                                            ? "Ej: 123-456789-0"
                                            : documentType === "CURP"
                                              ? "Ej: ABCD123456EFGHIJ12"
                                              : t(
                                                  "detail.documentNumberPlaceholder",
                                                )
                        }
                        onChange={(e) => {
                          field.onChange(e);

                          // Apply formatting based on document type
                          if (documentType) {
                            const formatter =
                              formatDocumentType[
                                documentType as keyof typeof formatDocumentType
                              ];
                            if (formatter && e.target.value) {
                              const formattedValue = formatter(e.target.value);
                              if (formattedValue !== e.target.value) {
                                setValue("documentNumber", formattedValue, {
                                  shouldValidate: false,
                                  shouldDirty: true,
                                });
                              }

                              // Validate immediately
                              const validator =
                                documentValidators[
                                  documentType as keyof typeof documentValidators
                                ];
                              if (validator) {
                                const isValid = validator(formattedValue);
                                setIsDocumentValid(isValid);
                                setValue("documentNumberValid", isValid, {
                                  shouldValidate: false,
                                });
                              }
                            } else {
                              setIsDocumentValid(null);
                            }
                          }
                        }}
                      />
                      {isDocumentValid !== null && documentNumber && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          {isDocumentValid ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <ErrorMessage
                      errors={errors}
                      name="documentNumber"
                      render={({ message }) => (
                        <p className="text-xs text-red-500">
                          {message === "Required"
                            ? t("detail.validation.fieldRequired")
                            : message}
                        </p>
                      )}
                    />
                    {documentType && (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          {documentType === "RUT"
                            ? "Formato: 12.345.678-9"
                            : documentType === "DNI"
                              ? "Formato: 12345678"
                              : documentType === "CPF"
                                ? "Formato: 123.456.789-10"
                                : documentType === "CC"
                                  ? "Formato: 1.234.567.890"
                                  : documentType === "CI"
                                    ? "Formato: 1.234.567"
                                    : documentType === "DPI"
                                      ? "Formato: 1234 56789 0123"
                                      : documentType === "DUI"
                                        ? "Formato: 12345678-9"
                                        : documentType === "CIP"
                                          ? "Formato: 1-234-5678"
                                          : documentType === "CEDULA"
                                            ? "Formato: 123-456789-0"
                                            : documentType === "CURP"
                                              ? "Formato: ABCD123456EFGHIJ12"
                                              : ""}
                        </p>
                        {isDocumentValid === false && documentNumber && (
                          <p className="text-xs text-yellow-600 font-medium">
                            {t("detail.documentInvalidLabel")}
                          </p>
                        )}
                        {isDocumentValid === true && documentNumber && (
                          <p className="text-xs text-green-600 font-medium">
                            {t("detail.documentValid")}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("upsert.fields.address")}
              </label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <>
                    <CHEKIOInput
                      {...field}
                      className={errors.address ? "border-red-500" : ""}
                    />
                    {errors.address && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.address.message as string}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("upsert.fields.personalEmail")}
              </label>
              <Controller
                name="personalEmail"
                control={control}
                render={({ field }) => (
                  <>
                    <CHEKIOInput
                      {...field}
                      type="email"
                      className={errors.personalEmail ? "border-red-500" : ""}
                    />
                    {errors.personalEmail && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.personalEmail.message as string}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("upsert.fields.personalPhone")}
              </label>
              <Controller
                name="personalPhone"
                control={control}
                render={({ field }) => (
                  <>
                    <CHEKIOInput
                      {...field}
                      type="text"
                      placeholder={t("detail.phonePlaceholder")}
                      className={errors.personalPhone ? "border-red-500" : ""}
                      onChange={(e) => {
                        // Solo permitir números, espacios, + y -
                        const value = e.target.value.replace(
                          /[^0-9+\-\s]/g,
                          "",
                        );
                        field.onChange(value);
                      }}
                    />
                    {errors.personalPhone && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.personalPhone?.message as string}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("upsert.fields.gender")}
              </label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <>
                    <CHEKIOSelect
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <CHEKIOSelectTrigger
                        className={errors.gender ? "border-red-500" : ""}
                      >
                        <CHEKIOSelectValue
                          placeholder={t("detail.selectGender")}
                        />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        {GenderOptions.map((option) => (
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
                      name="gender"
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
                {t("upsert.fields.birthDate")}
              </label>
              <Controller
                name="birthDate"
                control={control}
                render={({ field }) => (
                  <>
                    <CheckioInputDate
                      value={field.value}
                      onChange={field.onChange}
                      label=""
                      placeholder={t("detail.datePlaceholder")}
                      locale={currentLocale}
                      error={errors.birthDate?.message as string}
                    />
                    {errors.birthDate && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.birthDate.message as string}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                País
              </label>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <CHEKIOSelect
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <CHEKIOSelectTrigger>
                      <CHEKIOSelectValue placeholder="Seleccione un país" />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      {countries.map((country: any) => (
                        <CHEKIOSelectItem
                          key={country.code}
                          value={country.code}
                        >
                          {country.name}
                        </CHEKIOSelectItem>
                      ))}
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel 1
              </label>
              <Controller
                name="lvl1"
                control={control}
                render={({ field }) => (
                  <CHEKIOSelect
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <CHEKIOSelectTrigger>
                      <CHEKIOSelectValue placeholder="Seleccione nivel 1" />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      {nivel1Options.map((level: any) => (
                        <CHEKIOSelectItem key={level.code} value={level.code}>
                          {level.name}
                        </CHEKIOSelectItem>
                      ))}
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                )}
              />
            </div>
            {supportsNivel2 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel 2
                </label>
                <Controller
                  name="lvl2"
                  control={control}
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue placeholder="Seleccione nivel 2" />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        {nivel2Options.map((level: any, index: number) => (
                          <CHEKIOSelectItem
                            key={`${level.code ?? level.name}-${index}`}
                            value={level.code ?? level.name}
                          >
                            {level.name}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>
            )}
            {supportsNivel3 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel 3
                </label>
                <Controller
                  name="lvl3"
                  control={control}
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue placeholder="Seleccione nivel 3" />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        {nivel3Options.map((level: any, index: number) => (
                          <CHEKIOSelectItem
                            key={`${level.code ?? level.name}-${index}`}
                            value={level.code ?? level.name}
                          >
                            {level.name}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
        <h3 className="text-sm font-semibold text-blue-700 mb-2">
          {t("detail.personalEmailInfo.title")}
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          {t("detail.personalEmailInfo.description")}
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2">
          <p className="text-xs font-medium text-gray-700">
            {t("detail.personalEmailInfo.recommendedServices")}
          </p>
          <div className="flex gap-3">
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path
                  fill="#EA4335"
                  d="M24 5.457v13.086c0 .808-.65 1.457-1.457 1.457h-1.668V9.6l-8.875 6.454L3.125 9.6v10.4H1.457A1.46 1.46 0 0 1 0 18.543V5.457A1.46 1.46 0 0 1 1.457 4h.511c.256 0 .504.098.686.275l9.346 6.937 9.346-6.937a.97.97 0 0 1 .686-.275h.511c.807 0 1.457.649 1.457 1.457z"
                />
              </svg>
              <span className="text-xs font-medium">Gmail</span>
            </a>
            <a
              href="https://outlook.live.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path
                  fill="#0078D4"
                  d="M21.179 4.712H2.821A2.825 2.825 0 0 0 0 7.536v8.929a2.825 2.825 0 0 0 2.821 2.823h18.358A2.825 2.825 0 0 0 24 16.464V7.536a2.825 2.825 0 0 0-2.821-2.824zM2.9 6.357h18.2a1.18 1.18 0 0 1 1.179 1.179v.929l-9.379 5.893a1.644 1.644 0 0 1-1.8 0L1.714 8.464v-.929A1.18 1.18 0 0 1 2.9 6.357zm18.2 11.286H2.9a1.18 1.18 0 0 1-1.179-1.179V10.25l8.571 5.357a3.305 3.305 0 0 0 3.414 0l8.571-5.357v6.214a1.18 1.18 0 0 1-1.179 1.179z"
                />
              </svg>
              <span className="text-xs font-medium">Outlook</span>
            </a>
            <a
              href="https://mail.yahoo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path
                  fill="#6001D2"
                  d="M19.828 7.242a1.5 1.5 0 1 0-2.828-1l-4.83 8.7-4.828-8.7a1.5 1.5 0 1 0-2.828 1l6.142 11.075a1.5 1.5 0 0 0 2.628 0l6.544-11.075Z"
                />
              </svg>
              <span className="text-xs font-medium">Yahoo</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalData;
