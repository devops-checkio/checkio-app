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
  CHEKIOTab,
  CHEKIOTabs,
} from "@/components";
import { CheckioInputDate } from "@/components/ui/checkio-input-date";
import SystemSelect from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import SystemInput from "@/components/ui/system-input";
import { useCookieSession } from "@/context/useCookieSession";
import { useToast } from "@/hooks/use-toast";
import { cn, documentValidators, formatDocumentType } from "@/lib/utils";
import {
  useCreateEmployee,
  useGetBranches,
  useGetJobs,
  useUpdateEmployee,
  useUploadEmployeePhoto,
} from "@/service/mantainer.service";
import { ErrorMessage } from "@hookform/error-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import countriesGeography from "../../branches/_data/country-geography.json";
import { DocumentTypeOptions, GenderOptions } from "./employee.dto";
import OrganizationSelector from "./organization-selector";

enum ButtonVariant {
  PRIMARY = "primary",
}

enum TabKey {
  PERSONAL = "personal",
  COMPANY = "company",
}

interface EmployeeModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  editingEmployee: any | null;
  onSuccess: () => void;
}

export const employeeSchema = z
  .object({
    firstName: z.string().min(1, "Por favor ingrese los nombres"),
    lastName: z.string().min(1, "Por favor ingrese el apellido paterno"),
    secondLastName: z.string().optional(),
    address: z.string().min(1, "Por favor ingrese la dirección"),
    personalEmail: z
      .string()
      .email("Email inválido")
      .min(1, "Por favor ingrese el email personal"),
    personalPhone: z.string().min(1, "Por favor ingrese el teléfono personal"),
    gender: z.string().min(1, "Por favor seleccione el género"),
    birthDate: z.string().min(1, "Por favor ingrese la fecha de nacimiento"),

    // Company data
    code: z.string().min(1, "Por favor ingrese el código"),
    workEmail: z.string().email("Email inválido").optional(),
    workPhone: z.string().optional(),
    startDate: z.string().min(1, "Por favor ingrese la fecha de ingreso"),
    endDate: z.string().optional(),
    contractedHours: z
      .union([
        z.string().min(1, "Por favor ingrese las horas contratadas"),
        z.number().min(1, "Por favor ingrese las horas contratadas"),
      ])
      .transform((val) => (typeof val === "string" ? Number(val) : val)),
    branchId: z.string().min(1, "Por favor seleccione la sucursal"),
    country: z.string().optional(),
    lvl1: z.string().optional(),
    lvl2: z.string().optional(),
    lvl3: z.string().optional(),
    jobId: z.string().min(1, "Por favor seleccione el cargo"),
    integrationCode: z.string().optional(),
    isIndefiniteTerm: z.boolean(),
    isActive: z.boolean(),

    // Home office
    canCheckInOtherBranch: z.boolean(),
    requiresPassword: z.boolean(),
    canCheckWithoutShift: z.boolean(),
    canCheckAnywhere: z.boolean(),
    canCheckFromAnyBranch: z.boolean(),
    canCheckFromWeb: z.boolean(),

    // Documents
    documentType: z
      .string()
      .min(1, "Por favor seleccione el tipo de documento"),
    documentNumber: z
      .string()
      .min(1, "Por favor ingrese el número de documento")
      .superRefine((val, ctx) => {
        const docType = (ctx.path[0] as any).documentType;
        if (!docType) return;

        const validator =
          documentValidators[docType as keyof typeof documentValidators];
        if (validator && !validator(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Formato de documento inválido",
            path: ["documentNumber"],
          });
        }
      }),
    photo: z.any().optional(),
    organizationId: z.string().optional(),
    subUnit1Id: z.string().optional(),
    subUnit2Id: z.string().optional(),
    subUnit3Id: z.string().optional(),
    subUnit4Id: z.string().optional(),
    subUnit5Id: z.string().optional(),
    subUnit6Id: z.string().optional(),
    subUnit7Id: z.string().optional(),
    subUnit8Id: z.string().optional(),
  })
  .refine(
    (data) => {
      // Si el contrato NO es indefinido, la fecha de término es obligatoria
      if (!data.isIndefiniteTerm) {
        const endDateValue = data.endDate;
        if (
          !endDateValue ||
          (typeof endDateValue === "string" && endDateValue.trim() === "")
        ) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Por favor ingrese la fecha de término del contrato",
      path: ["endDate"],
    },
  );

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeeModalUpsert({
  isOpen,
  onClose,
  editingEmployee,
  onSuccess,
}: EmployeeModalUpsertProps) {
  const { companyId } = useCookieSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations("mantainers.employees");
  const { mutate: createEmployee, isPending: isCreatingEmployee } =
    useCreateEmployee();
  const { mutate: updateEmployee, isPending: isUpdatingEmployee } =
    useUpdateEmployee();
  const { mutateAsync: uploadEmployeePhoto } = useUploadEmployeePhoto();

  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [isDocumentValid, setIsDocumentValid] = useState<boolean | null>(null);

  const { data: jobs } = useGetJobs({
    page: 1,
    pageSize: 1000,
    sort: "asc",
    companyId: companyId!,
  });

  const { data: branches } = useGetBranches({
    page: 1,
    pageSize: 1000,
    sort: "asc",
    companyId: companyId!,
  });

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
    watch,
    setValue,
    trigger,
    getValues,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      isActive: true,
      isIndefiniteTerm: false,
      canCheckInOtherBranch: false,
      requiresPassword: false,
      canCheckWithoutShift: true,
      canCheckAnywhere: false,
      canCheckFromAnyBranch: false,
      canCheckFromWeb: false,
      contractedHours: 45,
      organizationId: undefined,
      country: "",
      lvl1: "",
      lvl2: "",
      lvl3: "",
      subUnit1Id: undefined,
      subUnit2Id: undefined,
      subUnit3Id: undefined,
      subUnit4Id: undefined,
      subUnit5Id: undefined,
      subUnit6Id: undefined,
      subUnit7Id: undefined,
      subUnit8Id: undefined,
    },
  });

  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Watch document type and number fields
  const documentType = watch("documentType");
  const documentNumber = watch("documentNumber");
  const isIndefiniteTerm = watch("isIndefiniteTerm");
  const selectedCountryCode = watch("country");
  const selectedNivel1Code = watch("lvl1");
  const selectedNivel2Code = watch("lvl2");
  const values = watch();
  console.log("Form values:", values);
  console.log("Image preview:", imagePreview);
  console.log("Selected file:", selectedImageFile);

  // No cleanup needed for FileReader data URLs

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

  // Add useEffect for document validation
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

  // Add useEffect for document formatting
  useEffect(() => {
    if (documentType && documentNumber) {
      const formattedValue =
        formatDocumentType[documentType as keyof typeof formatDocumentType]?.(
          documentNumber,
        );
      if (formattedValue && formattedValue !== documentNumber) {
        setValue("documentNumber", formattedValue);
      }
    }
  }, [documentType, documentNumber, setValue]);

  // Force re-render when fileList changes
  useEffect(() => {
    console.log(
      "Image preview changed:",
      imagePreview ? "Has preview" : "No preview",
    );
    console.log("Selected file:", selectedImageFile);
    if (selectedImageFile) {
      console.log("File type:", selectedImageFile.type);
      console.log("File size:", selectedImageFile.size);
    }
  }, [imagePreview, selectedImageFile]);

  useEffect(() => {
    if (editingEmployee) {
      reset({
        ...editingEmployee,
        birthDate: editingEmployee.birthDate || "",
        startDate: editingEmployee.startDate || "",
        endDate: editingEmployee.endDate || "",
      });
      setSelectedDocType(editingEmployee.documentType);
    } else {
      // Reset form and fileList when creating new employee
      reset({
        isActive: true,
        isIndefiniteTerm: false,
        canCheckInOtherBranch: false,
        requiresPassword: false,
        canCheckWithoutShift: false,
        canCheckAnywhere: false,
        canCheckFromAnyBranch: false,
        canCheckFromWeb: false,
        contractedHours: 45,
        birthDate: "",
        startDate: "",
        endDate: "",
        country: "",
        lvl1: "",
        lvl2: "",
        lvl3: "",
      });
      setImagePreview("");
      setSelectedImageFile(null);
    }
    if (editingEmployee?.photo) {
      setImagePreview(editingEmployee.photo);
      setValue("photo", editingEmployee.photo);
    }
  }, [editingEmployee, reset, setValue]);

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

  // Nueva implementación para manejar archivos de imagen
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        toast({
          title: t("toast.photoInvalidFile.title"),
          description: t("toast.photoInvalidFile.description"),
          variant: "destructive",
        });
        return;
      }

      // Validar tamaño (2MB máximo)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: t("toast.photoTooLarge.title"),
          description: t("toast.photoTooLarge.description"),
          variant: "destructive",
        });
        return;
      }

      // Usar FileReader para leer el archivo
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;

        setImagePreview(result);
        setSelectedImageFile(file);
        setValue("photo", file);
      };

      reader.onerror = (e) => {
        console.error("FileReader error:", e);
        toast({
          title: t("toast.photoReadError.title"),
          description: t("toast.photoReadError.description"),
          variant: "destructive",
        });
      };

      reader.readAsDataURL(file);
    },
    [setValue, toast, t],
  );

  const handleRemoveImage = useCallback(() => {
    setImagePreview("");
    setSelectedImageFile(null);
    setValue("photo", null);
  }, [setValue]);

  // Función para generar UUID
  const generateUUID = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback para navegadores que no soportan crypto.randomUUID
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  };

  const onSubmit: SubmitHandler<EmployeeFormData> = async (data) => {
    try {
      let photoKey = null;

      // Si hay una foto nueva subida, procesarla con AWS
      if (selectedImageFile) {
        // Generar UUID único para el nombre del archivo
        const fileExtension = selectedImageFile.name.split(".").pop();
        const uniqueFileName = `${generateUUID()}.${fileExtension}`;

        // 1. Obtener URL prefirmada
        const uploadData = await uploadEmployeePhoto({
          fileName: uniqueFileName,
          contentType: selectedImageFile.type,
        });

        // 2. Subir foto a AWS usando PUT
        const uploadResponse = await fetch(uploadData.uploadUrl, {
          method: "PUT",
          body: selectedImageFile,
          headers: {
            "Content-Type": selectedImageFile.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(
            `Failed to upload photo: ${uploadResponse.statusText}`,
          );
        }

        photoKey = uploadData.key;
      } else if (imagePreview && !imagePreview.startsWith("data:")) {
        photoKey = imagePreview;
      }

      const { organizationId, ...dataWithoutOrgId } = data;
      const employeeData = {
        ...dataWithoutOrgId,
        photo: photoKey,
        endDate: data.endDate || null,
      };

      if (editingEmployee) {
        updateEmployee(
          {
            ...employeeData,
            id: editingEmployee.publicId || editingEmployee.id,
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["GetEmployees"] });
              queryClient.invalidateQueries({
                queryKey: [
                  "GetEmployee",
                  editingEmployee.publicId || editingEmployee.id,
                ],
              });
              toast({
                title: t("toast.updateSuccess.title"),
                description: t("toast.updateSuccess.description"),
              });
              onSuccess();
              onClose();
            },
            onError: (error: any) => {
              if (axios.isAxiosError(error)) {
                toast({
                  title: t("toast.updateError.title"),
                  description: error.response?.data.message,
                });
              }
            },
          },
        );
      } else {
        createEmployee(
          {
            ...employeeData,
            companyId,
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["GetEmployees"] });
              toast({
                title: t("toast.createSuccess.title"),
                description: t("toast.createSuccess.description"),
              });
              onSuccess();
              onClose();
            },
            onError: (error: any) => {
              if (axios.isAxiosError(error)) {
                toast({
                  title: t("toast.createError.title"),
                  description: error.response?.data.message,
                });
              }
            },
          },
        );
      }
    } catch (error) {
      console.error("Error in photo upload process:", error);
      toast({
        title: t("toast.photoError.title"),
        description: t("toast.photoError.description"),
      });
    }
  };

  const getErrorCount = (fields: string[]) => {
    return Object.keys(errors).filter((key) => fields.includes(key)).length;
  };

  const personalErrors = getErrorCount([
    "firstName",
    "lastName",
    "documentType",
    "documentNumber",
    "address",
    "personalEmail",
    "personalPhone",
    "gender",
    "birthDate",
    "secondLastName",
  ]);
  const companyErrors = getErrorCount([
    "code",
    "startDate",
    "endDate",
    "contractedHours",
    "branchId",
    "jobId",
    "workPhone",
    "integrationCode",
  ]);
  const homeofficeErrors = getErrorCount([
    "canCheckInOtherBranch",
    "requiresPassword",
    "canCheckWithoutShift",
    "canCheckAnywhere",
    "canCheckFromAnyBranch",
    "canCheckFromWeb",
  ]);

  const [activeTab, setActiveTab] = useState<TabKey>(TabKey.PERSONAL);

  console.log(errors);
  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingEmployee ? t("upsert.title.edit") : t("upsert.title.add")}
      size="6xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="flex gap-4">
          <div className="w-2/12">
            <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {t("upsert.fields.photo")}
                </h3>

                {/* Área de visualización de la foto */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-white shadow-lg">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imagePreview}
                        alt={t("upsert.fields.photo")}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
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
                    )}
                  </div>

                  {/* Botón de eliminar foto */}
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Input nativo para subir archivos */}
                <div className="w-full max-w-md">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors cursor-pointer bg-white"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                          {imagePreview
                            ? t("upsert.fields.changePhoto")
                            : t("upsert.fields.uploadPhoto")}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Cualquier imagen hasta 2MB
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Información adicional */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    La foto debe ser clara y mostrar el rostro completo
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Tamaño recomendado: 400x400 píxeles
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="w-10/12">
            <CHEKIOTabs>
              <CHEKIOTab
                active={activeTab === TabKey.PERSONAL}
                onClick={() => setActiveTab(TabKey.PERSONAL)}
              >
                <div className="relative flex items-center">
                  Datos Personales
                  {personalErrors > 0 && (
                    <span className="ml-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {personalErrors}
                    </span>
                  )}
                </div>
              </CHEKIOTab>
              <CHEKIOTab
                active={activeTab === TabKey.COMPANY}
                onClick={() => setActiveTab(TabKey.COMPANY)}
              >
                <div className="relative flex items-center">
                  Datos Empresa
                  {companyErrors > 0 && (
                    <span className="ml-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {companyErrors}
                    </span>
                  )}
                </div>
              </CHEKIOTab>
            </CHEKIOTabs>

            {activeTab === TabKey.PERSONAL && (
              <div className="mt-4">
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <SystemInput
                      control={control}
                      label={t("upsert.fields.firstName")}
                      attribute="firstName"
                      errors={errors}
                    />
                    <SystemInput
                      control={control}
                      label={t("upsert.fields.lastName")}
                      attribute="lastName"
                      errors={errors}
                    />
                    <SystemInput
                      control={control}
                      label={t("upsert.fields.motherLastName")}
                      attribute="secondLastName"
                      errors={errors}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Documento
                      </label>
                      <Controller
                        name="documentType"
                        control={control}
                        defaultValue="RUT"
                        render={({ field }) => (
                          <>
                            <CHEKIOSelect
                              value={field.value || "RUT"}
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedDocType(value);

                                // Reset document number when type changes
                                setValue("documentNumber", "", {
                                  shouldValidate: true,
                                });
                                setIsDocumentValid(null);
                              }}
                            >
                              <CHEKIOSelectTrigger
                                className={
                                  errors.documentType ? "border-red-500" : ""
                                }
                              >
                                <CHEKIOSelectValue
                                  placeholder={t(
                                    "upsert.placeholders.documentType",
                                  )}
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
                                  {message == "Required"
                                    ? t("upsert.validation.fieldRequired")
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
                        Número de Documento
                      </label>
                      <Controller
                        name="documentNumber"
                        control={control}
                        rules={{
                          required: t("upsert.validation.fieldRequired"),
                          validate: (value) => {
                            if (!documentType) return true;
                            const validator =
                              documentValidators[
                                documentType as keyof typeof documentValidators
                              ];
                            return validator && validator(value)
                              ? true
                              : t("upsert.validation.documentInvalid");
                          },
                        }}
                        render={({ field }) => (
                          <>
                            <div className="relative">
                              <input
                                {...field}
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
                                                      : "Ingrese número de documento"
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
                                      const formattedValue = formatter(
                                        e.target.value,
                                      );
                                      if (formattedValue !== e.target.value) {
                                        setValue(
                                          "documentNumber",
                                          formattedValue,
                                          {
                                            shouldValidate: false,
                                            shouldDirty: true,
                                          },
                                        );
                                      }

                                      // Validate immediately
                                      const validator =
                                        documentValidators[
                                          documentType as keyof typeof documentValidators
                                        ];
                                      if (validator) {
                                        const isValid =
                                          validator(formattedValue);
                                        setIsDocumentValid(isValid);
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
                            <ErrorMessage
                              errors={errors}
                              name="documentNumber"
                              render={({ message }) => (
                                <p className="text-xs text-red-500">
                                  {message === "Required"
                                    ? t("upsert.validation.fieldRequired")
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
                                {isDocumentValid === false &&
                                  documentNumber && (
                                    <p className="text-xs text-yellow-600 font-medium">
                                      Documento inválido
                                    </p>
                                  )}
                                {isDocumentValid === true && documentNumber && (
                                  <p className="text-xs text-green-600 font-medium">
                                    Documento válido
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
                      label="Dirección"
                      attribute="address"
                      errors={errors}
                    />
                    <SystemInput
                      control={control}
                      label="Email Personal"
                      attribute="personalEmail"
                      errors={errors}
                    />
                    <div className="flex flex-col gap-2">
                      <label className="text-gray-600">
                        Teléfono Personal
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <Controller
                        name="personalPhone"
                        control={control}
                        rules={{
                          required: "Por favor ingrese el teléfono personal",
                        }}
                        render={({ field }) => (
                          <>
                            <span>
                              <CHEKIOInput
                                type="text"
                                id={field.name}
                                className={cn(
                                  "w-full",
                                  errors.personalPhone ? "border-red-500" : "",
                                )}
                                placeholder="Ej: +56 9 1234 5678"
                                value={field.value || ""}
                                onChange={(e) => {
                                  // Solo permitir números, espacios, + y -
                                  const value = e.target.value.replace(
                                    /[^0-9+\-\s]/g,
                                    "",
                                  );
                                  field.onChange(value);
                                }}
                              />
                            </span>
                            {errors.personalPhone && (
                              <ErrorMessage
                                errors={errors}
                                name="personalPhone"
                                render={({ message }) => (
                                  <p className="text-xs text-red-500">
                                    {message === "Required"
                                      ? t("upsert.validation.fieldRequired")
                                      : message}
                                  </p>
                                )}
                              />
                            )}
                          </>
                        )}
                      />
                    </div>
                    <div>
                      <SystemSelect
                        control={control}
                        label="Género"
                        attribute="gender"
                        errors={errors}
                        rules={{
                          required: "Por favor seleccione el género",
                        }}
                        options={[
                          {
                            value: "",
                            label: "Seleccione el género",
                          },
                          ...GenderOptions.map((option) => ({
                            value: option.value,
                            label: option.label,
                          })),
                        ]}
                      />
                    </div>
                    <Controller
                      name="birthDate"
                      control={control}
                      render={({ field }) => (
                        <CheckioInputDate
                          value={field.value}
                          onChange={field.onChange}
                          label="Fecha de Nacimiento"
                          placeholder="dd/mm/aaaa"
                          required={true}
                          error={errors.birthDate?.message as string}
                        />
                      )}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        País
                      </label>
                      <SystemSelect
                        control={control}
                        attribute="country"
                        errors={errors}
                        options={[
                          { value: "", label: "Seleccione un país" },
                          ...countries.map((country: any) => ({
                            value: country.code,
                            label: country.name,
                          })),
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lvl 1
                      </label>
                      <SystemSelect
                        control={control}
                        attribute="lvl1"
                        errors={errors}
                        options={[
                          { value: "", label: "Select lvl 1" },
                          ...nivel1Options.map((level: any) => ({
                            value: level.code,
                            label: level.name,
                          })),
                        ]}
                      />
                    </div>
                    {supportsNivel2 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lvl 2
                        </label>
                        <SystemSelect
                          control={control}
                          attribute="lvl2"
                          errors={errors}
                          options={[
                            { value: "", label: "Select lvl 2" },
                            ...nivel2Options.map((level: any) => ({
                              value: level.code ?? level.name,
                              label: level.name,
                            })),
                          ]}
                        />
                      </div>
                    )}
                    {supportsNivel3 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lvl 3
                        </label>
                        <SystemSelect
                          control={control}
                          attribute="lvl3"
                          errors={errors}
                          options={[
                            { value: "", label: "Select lvl 3" },
                            ...nivel3Options.map((level: any) => ({
                              value: level.code ?? level.name,
                              label: level.name,
                            })),
                          ]}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <h3 className="text-sm font-semibold text-blue-700 mb-2">
                      Información Importante sobre el Correo Personal
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Es obligatorio proporcionar un correo electrónico personal
                      válido para recibir información importante sobre la
                      aplicación. Este correo podrá ser modificado en cualquier
                      momento.
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2">
                      <p className="text-xs font-medium text-gray-700">
                        Servicios de correo recomendados:
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
              </div>
            )}

            {activeTab === TabKey.COMPANY && (
              <div className="mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <SystemInput
                      control={control}
                      label="Código"
                      attribute="code"
                      errors={errors}
                    />
                    <SystemInput
                      control={control}
                      label="Email Laboral"
                      attribute="workEmail"
                      errors={errors}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono Laboral
                      </label>
                      <Controller
                        name="workPhone"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: +56 9 1234 5678"
                            onChange={(e) => {
                              // Solo permitir números, espacios, + y -
                              const value = e.target.value.replace(
                                /[^0-9+\-\s]/g,
                                "",
                              );
                              field.onChange(value);
                            }}
                          />
                        )}
                      />
                      {errors.workPhone && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.workPhone.message}
                        </p>
                      )}
                    </div>
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <CheckioInputDate
                          value={field.value}
                          onChange={field.onChange}
                          label="Fecha de Ingreso"
                          placeholder="dd/mm/aaaa"
                          required={true}
                          error={errors.startDate?.message as string}
                        />
                      )}
                    />
                    <Controller
                      name="endDate"
                      control={control}
                      rules={{
                        validate: (value) => {
                          // Obtener el valor actual de isIndefiniteTerm del formulario
                          const currentIsIndefiniteTerm =
                            getValues("isIndefiniteTerm");
                          // Si el contrato NO es indefinido, la fecha de término es obligatoria
                          if (!currentIsIndefiniteTerm) {
                            // Verificar si el valor está vacío, es null, undefined o es una cadena vacía
                            if (
                              !value ||
                              value === null ||
                              value === undefined ||
                              (typeof value === "string" && value.trim() === "")
                            ) {
                              return "Por favor ingrese la fecha de término del contrato";
                            }
                          }
                          return true;
                        },
                      }}
                      render={({ field, fieldState }) => (
                        <CheckioInputDate
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            // Validate immediately when value changes
                            setTimeout(() => {
                              trigger("endDate");
                            }, 0);
                          }}
                          label="Fecha de Término"
                          placeholder="dd/mm/aaaa"
                          required={!isIndefiniteTerm}
                          error={
                            fieldState.error?.message ||
                            (errors.endDate?.message as string) ||
                            undefined
                          }
                        />
                      )}
                    />
                    <SystemInput
                      control={control}
                      label="Horas Contratadas Semanal"
                      attribute="contractedHours"
                      type="number"
                      errors={errors}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sucursal
                      </label>
                      <SystemSelect
                        control={control}
                        attribute="branchId"
                        errors={errors}
                        rules={{
                          required: "Por favor seleccione una sucursal",
                        }}
                        options={[
                          {
                            value: "",
                            label: "Seleccione una sucursal",
                          },
                          ...(branches?.data.map((b) => ({
                            value: b.publicId,
                            label: b.name,
                          })) || []),
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cargo
                      </label>
                      <SystemSelect
                        control={control}
                        attribute="jobId"
                        errors={errors}
                        rules={{
                          required: "Por favor seleccione un cargo",
                        }}
                        options={[
                          {
                            value: "",
                            label: "Seleccione un cargo",
                          },
                          ...(jobs?.data.map((j) => ({
                            value: j.publicId,
                            label: j.name,
                          })) || []),
                        ]}
                      />
                    </div>
                    <SystemInput
                      control={control}
                      label="Código de Integración"
                      attribute="integrationCode"
                      errors={errors}
                    />
                    {companyId && (
                      <OrganizationSelector
                        control={control}
                        name="organizationId"
                        companyId={companyId}
                        resetFieldsFn={(fields) => {
                          fields.forEach((field) => {
                            setValue(field as any, undefined);
                          });
                        }}
                      />
                    )}
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="isIndefiniteTerm"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // Trigger validation for endDate when switch changes
                              setTimeout(() => {
                                trigger("endDate");
                              }, 0);
                            }}
                          />
                        )}
                      />
                      <label>Plazo Indefinido</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="isActive"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <label>Vigente</label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <CHEKIOButton
            type="submit"
            variant={ButtonVariant.PRIMARY}
            disabled={isCreatingEmployee || isUpdatingEmployee}
            className="w-fit"
          >
            {isCreatingEmployee || isUpdatingEmployee ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {editingEmployee ? "Actualizando..." : "Creando..."}
                </span>
              </>
            ) : (
              <span>{editingEmployee ? "ACTUALIZAR" : "GUARDAR"}</span>
            )}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}
