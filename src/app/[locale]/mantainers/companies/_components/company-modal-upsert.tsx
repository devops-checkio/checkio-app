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
import { documentValidators, formatDocumentType } from "@/lib/utils";
import {
  useCreateCompany,
  useUpdateCompany,
} from "@/service/mantainer.service";
import { Building2, Loader2 } from "lucide-react";
import axios from "axios";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  CompanyCreateDto,
  CompanyResponseDto,
  DocumentTypeOptions,
  UpdateCompanyDto,
} from "./company.dto";

interface CompanyModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  editingCompany: CompanyResponseDto | null;
  onSuccess: () => void;
}

export default function CompanyModalUpsert({
  isOpen,
  onClose,
  editingCompany,
  onSuccess,
}: CompanyModalUpsertProps) {
  const t = useTranslations("mantainers.companies");
  const tUpsert = useTranslations("mantainers.companies.upsert");
  const tDetail = useTranslations("mantainers.companies.detail");
  const { toast } = useToast();
  const { mutate: createCompany, isPending: isCreatingCompany } =
    useCreateCompany();
  const { mutate: updateCompany, isPending: isUpdatingCompany } =
    useUpdateCompany();
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [isDocumentValid, setIsDocumentValid] = useState<boolean | null>(null);

  const {
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompanyCreateDto | UpdateCompanyDto>({
    defaultValues: {
      documentType: undefined,
      documentNumber: "",
      businessName: "",
      tradeName: "",
      address: "",
      transitoryService: false,
    },
  });

  const documentType = watch("documentType");
  const documentNumber = watch("documentNumber");

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
  }, [documentType, documentNumber, setValue]);

  useEffect(() => {
    if (documentType && documentNumber) {
      const formattedValue =
        formatDocumentType[documentType as keyof typeof formatDocumentType]?.(
          documentNumber
        );
      if (formattedValue && formattedValue !== documentNumber) {
        setValue("documentNumber", formattedValue);
      }
    }
  }, [documentType, documentNumber, setValue]);

  useEffect(() => {
    if (editingCompany) {
      reset({
        documentType: editingCompany.documentType,
        documentNumber: editingCompany.documentNumber,
        businessName: editingCompany.businessName,
        tradeName: editingCompany.tradeName,
        address: editingCompany.address,
      });
      setSelectedDocType(editingCompany.documentType);
    } else {
      reset();
      setSelectedDocType(null);
    }
  }, [editingCompany, reset]);

  const onSubmit: SubmitHandler<CompanyCreateDto | UpdateCompanyDto> = (
    data
  ) => {
    console.log(data);
    if (editingCompany) {
      updateCompany(
        { ...data, publicId: editingCompany.publicId } as UpdateCompanyDto,
        {
          onSuccess: () => {
            toast({
              title: tUpsert("toast.updateSuccess.title"),
              description: tUpsert("toast.updateSuccess.description"),
            });
            onSuccess();
            onClose();
          },
          onError: (error: any) => {
            if (axios.isAxiosError(error)) {
              toast({
                title: tUpsert("toast.updateError.title"),
                description: error.response?.data.message || tUpsert("toast.updateError.description"),
              });
            } else {
              toast({
                title: tUpsert("toast.updateError.title"),
                description: tUpsert("toast.updateError.description"),
              });
            }
          },
          onSettled: () => {
            onClose();
          },
        }
      );
    } else {
        createCompany(data as CompanyCreateDto, {
          onSuccess: () => {
            toast({
              title: tUpsert("toast.createSuccess.title"),
              description: tUpsert("toast.createSuccess.description"),
            });
            onSuccess();
          },
          onError: (error: any) => {
            if (axios.isAxiosError(error)) {
              toast({
                title: tUpsert("toast.createError.title"),
                description: error.response?.data.message || tUpsert("toast.createError.description"),
              });
            } else {
              toast({
                title: tUpsert("toast.createError.title"),
                description: tUpsert("toast.createError.description"),
              });
            }
          },
        onSettled: () => {
          onClose();
        },
      });
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCompany ? tUpsert("title.edit") : tUpsert("title.add")}
      size="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tUpsert("fields.documentType")}
                </label>
                <Controller
                  name="documentType"
                  control={control}
                  rules={{
                    required: tUpsert("validation.documentTypeRequired"),
                  }}
                  render={({ field }) => (
                    <>
                      <CHEKIOSelect
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedDocType(value);
                          setValue("documentNumber", "", {
                            shouldValidate: false,
                          });
                          setIsDocumentValid(null);
                        }}
                      >
                        <CHEKIOSelectTrigger
                          className={
                            errors.documentType
                              ? "border-red-500 w-full"
                              : "w-full"
                          }
                        >
                          <CHEKIOSelectValue placeholder={tUpsert("placeholders.documentType")} />
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
                      {errors.documentType && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.documentType.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tUpsert("fields.documentNumber")}
                </label>
                <Controller
                  name="documentNumber"
                  control={control}
                  rules={{
                    required: tUpsert("validation.documentNumberRequired"),
                    validate: (value) => {
                      if (!documentType || !value) return true;
                      const validator =
                        documentValidators[
                          documentType as keyof typeof documentValidators
                        ];
                      return validator && validator(value)
                        ? true
                        : tUpsert("validation.invalidDocumentFormat");
                    },
                  }}
                  render={({ field }) => (
                    <>
                      <div className="relative">
                        <input
                          {...field}
                          value={field.value || ""}
                          className={`w-full p-2 border ${
                            errors.documentNumber
                              ? "border-red-500"
                              : isDocumentValid === true
                              ? "border-green-500"
                              : isDocumentValid === false
                              ? "border-yellow-500"
                              : "border-gray-300"
                          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder={
                            documentType
                              ? tDetail(`documentExamples.${documentType}` as any, { default: tUpsert("placeholders.documentNumber") })
                              : tUpsert("placeholders.documentNumber")
                          }
                          onChange={(e) => {
                            field.onChange(e);

                            if (documentType && e.target.value) {
                              const formatter =
                                formatDocumentType[
                                  documentType as keyof typeof formatDocumentType
                                ];
                              if (formatter) {
                                const formattedValue = formatter(
                                  e.target.value
                                );
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
                            {tDetail(`documentFormats.${documentType}` as any, { default: "" })}
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
                    </>
                  )}
                />
              </div>
              <SystemInput
                control={control}
                label={tUpsert("fields.businessName")}
                attribute="businessName"
                errors={errors}
                rules={{ required: tUpsert("validation.businessNameRequired") }}
              />
              <SystemInput
                control={control}
                label={tUpsert("fields.tradeName")}
                attribute="tradeName"
                errors={errors}
                rules={{ required: tUpsert("validation.tradeNameRequired") }}
              />
              <SystemInput
                control={control}
                label={tUpsert("fields.address")}
                attribute="address"
                errors={errors}
                rules={{ required: tUpsert("validation.addressRequired") }}
              />
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
                          {tUpsert("transitoryService.label")}
                        </label>
                        <p className="text-gray-500 text-sm">
                          {tUpsert("transitoryService.description")}
                        </p>
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
        <CHEKIOButton
          type="submit"
          variant="primary"
          disabled={isCreatingCompany || isUpdatingCompany}
          className="w-full"
        >
          {isCreatingCompany || isUpdatingCompany ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{editingCompany ? tUpsert("buttons.updating") : tUpsert("buttons.saving")}</span>
            </>
          ) : (
            <span>{editingCompany ? tUpsert("buttons.update") : tUpsert("buttons.save")}</span>
          )}
        </CHEKIOButton>
      </form>
    </CHEKIOModal>
  );
}
