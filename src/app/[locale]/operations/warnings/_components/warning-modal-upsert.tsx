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
import { CheckioInputDate } from "@/components/ui/checkio-input-date";
import SystemInput from "@/components/ui/system-input";
import { useCookieSession } from "@/context/useCookieSession";
import { useToast } from "@/hooks/use-toast";
import {
  useGetCompaniesSelector,
  useGetEmployeesSelector,
  useGetWarningTypesSelector,
} from "@/service/mantainer.service";
import {
  useCreateWarning,
  useGetPresignedUploadUrl,
  useUpdateWarning,
} from "@/service/warning.service";
import { handleError } from "@/utils/error";
import axios from "axios";
import {
  Loader2,
  Maximize2,
  Upload as UploadIcon,
  User,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import EmployeePickerModal from "./employee-picker-modal";
import {
  UpdateWarningDto,
  WarningCreateDto,
  WarningResponseDto,
} from "./warning.dto";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
}

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

interface WarningModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  editingWarning: WarningResponseDto | null;
  onSuccess?: () => void;
  mode?: "create" | "edit" | "view";
}

export default function WarningModalUpsert({
  isOpen,
  onClose,
  editingWarning,
  onSuccess,
  mode = editingWarning ? "edit" : "create",
}: WarningModalUpsertProps) {
  const t = useTranslations("operations.warnings");
  const tUpsert = useTranslations("operations.warnings.upsert");
  const { toast } = useToast();
  const { companyId } = useCookieSession();
  const params = useParams();
  const currentLocale = getDatePickerLocale(params.locale as string);
  const { mutate: createWarning, isPending: isCreatingWarning } =
    useCreateWarning();
  const { mutate: updateWarning, isPending: isUpdatingWarning } =
    useUpdateWarning();
  const { mutateAsync: getPresignedUploadUrl } = useGetPresignedUploadUrl();

  const { data: companiesData } = useGetCompaniesSelector(
    { page: 1, pageSize: 1000, selector: true },
    { enabled: isOpen }
  );

  const { data: warningTypesData } = useGetWarningTypesSelector(
    { page: 1, pageSize: 1000 },
    { enabled: isOpen }
  );

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [employeeSummary, setEmployeeSummary] = useState<string>("");
  const [employeeDocument, setEmployeeDocument] = useState<string>("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [existingDocumentUrl, setExistingDocumentUrl] = useState<string | null>(
    null
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPending, setIsPending] = useState(false);
  const pdfPreviewUrlRef = useRef<string | null>(null);
  const isReadOnly = mode === "view";

  const { data: employeesData } = useGetEmployeesSelector(
    {
      page: 1,
      pageSize: 1000,
      companyId: selectedCompanyId || "",
    },
    { enabled: !!selectedCompanyId && isOpen }
  );

  const {
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WarningCreateDto | UpdateWarningDto>({
    defaultValues: {
      employeePublicId: "",
      companyPublicId: "",
      warningTypePublicId: "",
      startDate: undefined,
      endDate: undefined,
      observation: "",
      documentUrl: undefined,
      reportedBy: "",
    },
  });

  useEffect(() => {
    if (!editingWarning && companyId) {
      setSelectedCompanyId(companyId);
      setValue("companyPublicId", companyId);
    }

    if (editingWarning) {
      reset({
        employeePublicId: editingWarning.employeePublicId,
        companyPublicId: editingWarning.companyPublicId,
        warningTypePublicId: editingWarning.warningTypePublicId,
        startDate: editingWarning.startDate
          ? new Date(editingWarning.startDate).toISOString().split("T")[0]
          : undefined,
        endDate: editingWarning.endDate
          ? new Date(editingWarning.endDate).toISOString().split("T")[0]
          : undefined,
        observation: editingWarning.observation || "",
        documentUrl: editingWarning.documentUrl,
        reportedBy: editingWarning.reportedBy || "",
      });
      setSelectedCompanyId(editingWarning.companyPublicId);

      // Set employee summary from the employee object in the response
      if (editingWarning.employee) {
        setEmployeeSummary(
          `${editingWarning.employee.firstName} ${editingWarning.employee.lastName}`
        );
        setEmployeeDocument(editingWarning.employee.documentNumber || "");
      } else {
        // Fallback to catalog if employee object is not available
        const employee = employeesData?.data?.find(
          (e: any) => e.publicId === editingWarning.employeePublicId
        );
        if (employee) {
          setEmployeeSummary(`${employee.firstName} ${employee.lastName}`);
          setEmployeeDocument(employee.documentNumber || "");
        }
      }

      // Set existing document URL (already comes as presigned URL from backend)
      if (editingWarning.documentUrl) {
        setExistingDocumentUrl(editingWarning.documentUrl);
      } else {
        setExistingDocumentUrl(null);
      }
    } else {
      reset({
        employeePublicId: "",
        companyPublicId: companyId || "",
        warningTypePublicId: "",
        startDate: undefined,
        endDate: undefined,
        observation: "",
        documentUrl: undefined,
        reportedBy: "",
      });
      setSelectedCompanyId(companyId ?? null);
      setEmployeeSummary("");
      setEmployeeDocument("");
      setDocumentFile(null);
      setExistingDocumentUrl(null);
      // Clean up PDF preview URL if exists
      if (pdfPreviewUrlRef.current) {
        URL.revokeObjectURL(pdfPreviewUrlRef.current);
        pdfPreviewUrlRef.current = null;
        setPdfPreviewUrl(null);
      }
    }
  }, [
    editingWarning,
    reset,
    companyId,
    setValue,
    employeesData,
    toast,
    tUpsert,
  ]);

  // Sync ref with state
  useEffect(() => {
    pdfPreviewUrlRef.current = pdfPreviewUrl;
  }, [pdfPreviewUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrlRef.current) {
        URL.revokeObjectURL(pdfPreviewUrlRef.current);
      }
    };
  }, []);

  const generateDocumentKey = (fileName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = fileName.split(".").pop() || "pdf";
    return `warnings/documents/${timestamp}-${random}.${extension}`;
  };

  const uploadFileToS3 = async (
    file: File,
    presignedUrl: string
  ): Promise<void> => {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Error al subir el archivo: ${response.statusText}`);
    }
  };

  const handleClose = () => {
    reset();
    setIsPending(false);
    setDocumentFile(null);
    setExistingDocumentUrl(null);
    setIsFullscreen(false);
    if (pdfPreviewUrlRef.current) {
      URL.revokeObjectURL(pdfPreviewUrlRef.current);
      pdfPreviewUrlRef.current = null;
      setPdfPreviewUrl(null);
    }
    onClose();
  };

  const onSubmit: SubmitHandler<WarningCreateDto | UpdateWarningDto> = async (
    data
  ) => {
    setIsPending(true);

    try {
      let documentKey: string | undefined;

      // Upload document if provided
      if (documentFile) {
        documentKey = generateDocumentKey(documentFile.name);
        try {
          const { url: presignedUrl } = await getPresignedUploadUrl(
            documentKey
          );
          await uploadFileToS3(documentFile, presignedUrl);
        } catch (uploadError: any) {
          toast({
            title: tUpsert("toast.uploadError.title") || "Error",
            description:
              uploadError?.message ||
              tUpsert("toast.uploadError.description") ||
              "Error al subir el documento",
            variant: "destructive",
          });
          setIsPending(false);
          return;
        }
      }

      const formattedData: any = {
        ...data,
        startDate: data.startDate
          ? DateTime.fromISO(data.startDate as string)
              .toUTC()
              .toISO()
          : undefined,
        endDate: data.endDate
          ? DateTime.fromISO(data.endDate as string)
              .toUTC()
              .toISO()
          : undefined,
        documentUrl: documentKey || data.documentUrl,
      };

      if (editingWarning) {
        updateWarning(
          {
            ...formattedData,
            publicId: editingWarning.publicId,
          } as UpdateWarningDto,
          {
            onSuccess: () => {
              toast({
                title: tUpsert("toast.updateSuccess.title"),
                description: tUpsert("toast.updateSuccess.description"),
                variant: "default",
              });
              onSuccess?.();
              handleClose();
            },
            onError: (error: any) => {
              const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                tUpsert("toast.updateError.description");
              handleError(error, toast);
              toast({
                title: tUpsert("toast.updateError.title"),
                description: errorMessage,
                variant: "destructive",
              });
              setIsPending(false);
            },
          }
        );
      } else {
        createWarning(formattedData as WarningCreateDto, {
          onSuccess: () => {
            toast({
              title: tUpsert("toast.createSuccess.title"),
              description: tUpsert("toast.createSuccess.description"),
              variant: "default",
            });
            onSuccess?.();
            handleClose();
          },
          onError: (error: any) => {
            const errorMessage =
              error?.response?.data?.message ||
              error?.message ||
              tUpsert("toast.createError.description");
            handleError(error, toast);
            toast({
              title: tUpsert("toast.createError.title"),
              description: errorMessage,
              variant: "destructive",
            });
            setIsPending(false);
          },
        });
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        toast({
          title:
            tUpsert("toast.createError.title") ||
            tUpsert("toast.updateError.title") ||
            "Error",
          description:
            error.response?.data.message ||
            tUpsert("toast.createError.description") ||
            tUpsert("toast.updateError.description") ||
            "Error al procesar la solicitud",
          variant: "destructive",
        });
      }
      setIsPending(false);
    }
  };

  const companyOptions =
    companiesData?.data.map((company: any) => ({
      value: company.publicId,
      label: company.businessName,
    })) || [];

  const warningTypeOptions =
    warningTypesData?.data.map((warningType: any) => ({
      value: warningType.publicId,
      label: warningType.name,
    })) || [];

  return (
    <>
      <CHEKIOModal
        isOpen={isOpen}
        onClose={handleClose}
        title={
          mode === "view"
            ? tUpsert("title.view") || "Ver Amonestación"
            : editingWarning
            ? tUpsert("title.edit")
            : tUpsert("title.add")
        }
        size="7xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUMNA 1: FORMULARIO */}
            <div className="space-y-6">
              {/* Company Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tUpsert("fields.company")}
                </label>
                <Controller
                  name="companyPublicId"
                  control={control}
                  rules={{
                    required: tUpsert("validation.companyRequired"),
                  }}
                  render={({ field }) => (
                    <>
                      <CHEKIOSelect
                        value={field.value || selectedCompanyId || undefined}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedCompanyId(value);
                          setValue("employeePublicId", "");
                          setEmployeeSummary("");
                          setEmployeeDocument("");
                        }}
                      >
                        <CHEKIOSelectTrigger
                          className={
                            errors.companyPublicId
                              ? "border-red-500 w-full"
                              : "w-full"
                          }
                          disabled={!!companyId}
                        >
                          <CHEKIOSelectValue
                            placeholder={tUpsert("placeholders.company")}
                          />
                        </CHEKIOSelectTrigger>
                        <CHEKIOSelectContent>
                          {companyOptions.map(
                            (option: { value: string; label: string }) => (
                              <CHEKIOSelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </CHEKIOSelectItem>
                            )
                          )}
                        </CHEKIOSelectContent>
                      </CHEKIOSelect>
                      {errors.companyPublicId && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.companyPublicId.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              {/* Employee Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tUpsert("fields.employee")} *
                </label>
                <Controller
                  name="employeePublicId"
                  control={control}
                  rules={{
                    required: tUpsert("validation.employeeRequired"),
                  }}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <div className="flex gap-3 items-center">
                        {!isReadOnly && (
                          <CHEKIOButton
                            type="button"
                            variant={ButtonVariant.SECONDARY}
                            disabled={!selectedCompanyId}
                            onClick={() => setEmployeePickerOpen(true)}
                          >
                            <User className="h-4 w-4" />
                            {tUpsert("buttons.selectEmployee")}
                          </CHEKIOButton>
                        )}
                        {employeeSummary && (
                          <div className="flex items-center gap-2 text-base text-gray-800 font-medium">
                            <User className="h-4 w-4 text-blue-600" />
                            <span>{employeeSummary}</span>
                            {employeeDocument && (
                              <span className="ml-2 text-sm text-gray-500">
                                ({employeeDocument})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {errors.employeePublicId && (
                        <p className="text-xs text-red-500">
                          {errors.employeePublicId.message}
                        </p>
                      )}
                      {!selectedCompanyId && (
                        <p className="text-xs text-gray-500">
                          {tUpsert("messages.selectCompanyFirst")}
                        </p>
                      )}
                      <EmployeePickerModal
                        open={employeePickerOpen}
                        onClose={() => setEmployeePickerOpen(false)}
                        onSelect={(emp) => {
                          field.onChange(emp.publicId);
                          setEmployeeSummary(emp.name);
                          setEmployeeDocument(emp.documentNumber || "");
                          setEmployeePickerOpen(false);
                        }}
                      />
                    </div>
                  )}
                />
              </div>

              {/* Warning Type Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tUpsert("fields.warningType")} *
                </label>
                <Controller
                  name="warningTypePublicId"
                  control={control}
                  rules={{
                    required: tUpsert("validation.warningTypeRequired"),
                  }}
                  render={({ field }) => (
                    <>
                      <CHEKIOSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isReadOnly}
                      >
                        <CHEKIOSelectTrigger
                          className={
                            errors.warningTypePublicId
                              ? "border-red-500 w-full"
                              : "w-full"
                          }
                          disabled={isReadOnly}
                        >
                          <CHEKIOSelectValue
                            placeholder={tUpsert("placeholders.warningType")}
                          />
                        </CHEKIOSelectTrigger>
                        <CHEKIOSelectContent>
                          {warningTypeOptions.map(
                            (option: { value: string; label: string }) => (
                              <CHEKIOSelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </CHEKIOSelectItem>
                            )
                          )}
                        </CHEKIOSelectContent>
                      </CHEKIOSelect>
                      {errors.warningTypePublicId && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.warningTypePublicId.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              {/* Start Date */}
              <div>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => {
                    const value = field.value
                      ? typeof field.value === "string"
                        ? field.value
                        : (field.value as any) instanceof Date
                        ? (field.value as Date).toISOString().split("T")[0]
                        : undefined
                      : undefined;
                    return (
                      <CheckioInputDate
                        value={value}
                        onChange={field.onChange}
                        label={tUpsert("fields.startDate") || "Fecha de inicio"}
                        placeholder="dd/mm/aaaa"
                        locale={currentLocale}
                        error={errors.startDate?.message as string}
                        disabled={isReadOnly}
                      />
                    );
                  }}
                />
              </div>

              {/* End Date */}
              <div>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => {
                    const value = field.value
                      ? typeof field.value === "string"
                        ? field.value
                        : (field.value as any) instanceof Date
                        ? (field.value as Date).toISOString().split("T")[0]
                        : undefined
                      : undefined;
                    return (
                      <CheckioInputDate
                        value={value}
                        onChange={field.onChange}
                        label={tUpsert("fields.endDate") || "Fecha de fin"}
                        placeholder="dd/mm/aaaa"
                        locale={currentLocale}
                        error={errors.endDate?.message as string}
                        disabled={isReadOnly}
                      />
                    );
                  }}
                />
              </div>

              {/* Observation */}
              <div>
                <SystemInput
                  control={control}
                  label={tUpsert("fields.observation") || "Observación"}
                  attribute="observation"
                  errors={errors}
                  placeholder={
                    tUpsert("placeholders.observation") ||
                    "Ingrese observaciones"
                  }
                  disabled={isReadOnly}
                />
              </div>

              {/* Reported By */}
              <div>
                <SystemInput
                  control={control}
                  label={tUpsert("fields.reportedBy") || "Reportado por"}
                  attribute="reportedBy"
                  errors={errors}
                  placeholder={
                    tUpsert("placeholders.reportedBy") ||
                    "Nombre de quien reporta"
                  }
                  disabled={isReadOnly}
                />
              </div>

              {/* Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tUpsert("fields.document") || "Documento"}
                </label>
                <div className="border-2 border-dashed border-gray-300 p-6 bg-gray-50 rounded-lg">
                  <div className="flex flex-col items-center gap-4">
                    {!isReadOnly && (
                      <label
                        htmlFor="document-upload"
                        className="cursor-pointer"
                      >
                        <CHEKIOButton
                          type="button"
                          variant="secondaryBlue"
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById("document-upload")?.click();
                          }}
                        >
                          <UploadIcon className="h-4 w-4 mr-2" />
                          {tUpsert("buttons.selectDocument") ||
                            "Seleccionar documento"}
                        </CHEKIOButton>
                        <input
                          id="document-upload"
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type !== "application/pdf") {
                                toast({
                                  title:
                                    tUpsert(
                                      "validation.errors.invalidFileType.title"
                                    ) || "Tipo de archivo inválido",
                                  description:
                                    tUpsert(
                                      "validation.errors.invalidFileType.description"
                                    ) || "Solo se permiten archivos PDF",
                                  variant: "destructive",
                                });
                                return;
                              }
                              // Clean up previous preview URL if exists
                              if (pdfPreviewUrlRef.current) {
                                URL.revokeObjectURL(pdfPreviewUrlRef.current);
                              }
                              setDocumentFile(file);
                              setExistingDocumentUrl(null);
                              const url = URL.createObjectURL(file);
                              pdfPreviewUrlRef.current = url;
                              setPdfPreviewUrl(url);
                            }
                          }}
                        />
                      </label>
                    )}
                    {documentFile && (
                      <div className="w-full">
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded">
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-5 w-5 text-red-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {documentFile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(documentFile.size / 1024 / 1024).toFixed(2)}{" "}
                                MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDocumentFile(null);
                              if (pdfPreviewUrlRef.current) {
                                URL.revokeObjectURL(pdfPreviewUrlRef.current);
                                pdfPreviewUrlRef.current = null;
                                setPdfPreviewUrl(null);
                              }
                              const input = document.getElementById(
                                "document-upload"
                              ) as HTMLInputElement;
                              if (input) {
                                input.value = "";
                              }
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    {!documentFile && existingDocumentUrl && (
                      <div className="w-full">
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded">
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-5 w-5 text-blue-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Documento existente
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setExistingDocumentUrl(null);
                              const input = document.getElementById(
                                "document-upload"
                              ) as HTMLInputElement;
                              if (input) {
                                input.value = "";
                              }
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMNA 2: VISUALIZADOR DE PDF */}
            <div
              className="flex flex-col gap-4"
              style={{
                maxHeight: "calc(100vh - 250px)",
                overflow: "hidden",
              }}
            >
              {/* Visualizador de PDF */}
              <div
                className={`border border-gray-300 overflow-hidden bg-gray-50 ${
                  isFullscreen ? "fixed inset-0 z-50 m-0 border-0" : "relative"
                }`}
              >
                <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {tUpsert("preview.title") || "Vista previa"}
                  </h4>
                  <div className="flex items-center gap-2">
                    {(pdfPreviewUrl && documentFile) || existingDocumentUrl ? (
                      <>
                        {/* Botón de pantalla completa */}
                        <button
                          type="button"
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                          title={
                            isFullscreen
                              ? tUpsert("preview.exitFullscreen") ||
                                "Salir de pantalla completa"
                              : tUpsert("preview.fullscreen") ||
                                "Pantalla completa"
                          }
                        >
                          <Maximize2 className="h-4 w-4" />
                        </button>
                        {/* Botón de cerrar */}
                        <button
                          type="button"
                          onClick={() => {
                            if (pdfPreviewUrlRef.current) {
                              URL.revokeObjectURL(pdfPreviewUrlRef.current);
                              pdfPreviewUrlRef.current = null;
                              setPdfPreviewUrl(null);
                            }
                            if (existingDocumentUrl) {
                              setExistingDocumentUrl(null);
                            }
                            setIsFullscreen(false);
                            const input = document.getElementById(
                              "document-upload"
                            ) as HTMLInputElement;
                            if (input) {
                              input.value = "";
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title={tUpsert("preview.close") || "Cerrar"}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
                <div
                  className="relative bg-gray-100 overflow-hidden flex-1"
                  style={{
                    height: isFullscreen
                      ? "calc(100vh - 60px)"
                      : "calc(100vh - 200px)",
                    minHeight: isFullscreen ? "calc(100vh - 60px)" : "600px",
                  }}
                >
                  {(pdfPreviewUrl && documentFile) || existingDocumentUrl ? (
                    <embed
                      key={
                        pdfPreviewUrl && documentFile
                          ? pdfPreviewUrl
                          : existingDocumentUrl || ""
                      }
                      src={
                        pdfPreviewUrl && documentFile
                          ? pdfPreviewUrl
                          : existingDocumentUrl || ""
                      }
                      type="application/pdf"
                      className="w-full h-full border-0"
                      style={{
                        height: "100%",
                        width: "100%",
                      }}
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <UploadIcon className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-sm font-medium">
                        {tUpsert("preview.noDocument") ||
                          "No hay documento seleccionado"}
                      </p>
                      <p className="text-xs mt-2">
                        {tUpsert("preview.uploadHint") ||
                          "Suba un documento PDF para ver la vista previa"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <CHEKIOButton
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isPending || isCreatingWarning || isUpdatingWarning}
              >
                <X className="h-4 w-4" />
                {tUpsert("buttons.cancel") || "Cancelar"}
              </CHEKIOButton>
              <CHEKIOButton
                type="submit"
                variant={ButtonVariant.PRIMARY}
                disabled={isPending || isCreatingWarning || isUpdatingWarning}
              >
                {isPending || isCreatingWarning || isUpdatingWarning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {editingWarning
                        ? tUpsert("buttons.updating") || "Actualizando..."
                        : tUpsert("buttons.saving") || "Guardando..."}
                    </span>
                  </>
                ) : (
                  <span>
                    {editingWarning
                      ? tUpsert("buttons.update") || "Actualizar"
                      : tUpsert("buttons.save") || "Guardar"}
                  </span>
                )}
              </CHEKIOButton>
            </div>
          )}
          {isReadOnly && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <CHEKIOButton
                type="button"
                variant="secondary"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
                {tUpsert("buttons.close") || "Cerrar"}
              </CHEKIOButton>
            </div>
          )}
        </form>
      </CHEKIOModal>
    </>
  );
}
