"use client";

import { CHEKIOButton, CHEKIOInput, CHEKIOModal } from "@/components";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateIntegration,
  useUpdateIntegration,
} from "@/service/integration.service";
import { ArrowLeft, ArrowRight, Loader2, Upload } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import {
  Controller,
  FieldError,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import {
  AVAILABLE_INTEGRATIONS,
  INTEGRATION_CONFIGS,
  INTEGRATION_DATA_TYPES,
  IntegrationCreateDto,
  IntegrationOption,
  IntegrationResponseDto,
  IntegrationStatus,
} from "./integration.dto";

// Custom file input component
const FileInput = ({
  label,
  name,
  accept,
  required,
  description,
  value,
  onChange,
  error,
  disabled,
  onError,
}: {
  label: string;
  name: string;
  accept?: string;
  required?: boolean;
  description?: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
}) => {
  const [fileName, setFileName] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".pem")) {
      onError?.("Solo se permiten archivos .pem");
      return;
    }

    // Validate file size (max 1MB)
    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      onError?.("El archivo es demasiado grande. Máximo 1MB");
      return;
    }

    setIsConverting(true);
    try {
      // Convert file to base64
      const base64 = await convertFileToBase64(file);
      onChange(base64);
      setFileName(file.name);
    } catch (error) {
      console.error("Error converting file to base64:", error);
      onError?.("Error al procesar el archivo");
    } finally {
      setIsConverting(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/x-pem-file;base64,")
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled || isConverting}
          className="hidden"
          id={`file-${name}`}
        />
        <label
          htmlFor={`file-${name}`}
          className={`flex items-center justify-center w-full h-12 px-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            disabled || isConverting
              ? "border-gray-300 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
          } ${error ? "border-red-500" : ""}`}
        >
          {isConverting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-sm text-gray-600">
                Convirtiendo archivo...
              </span>
            </div>
          ) : value && fileName ? (
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-700">{fileName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Haz clic para seleccionar un archivo
              </span>
            </div>
          )}
        </label>
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

interface IntegrationModalCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingIntegration?: IntegrationResponseDto | null;
}

interface FormData {
  selectedIntegration: string;
  integrationTypes: string[];
  selectedDays: string[];
  selectedTimeSlots: string[];
  metadata?: Record<string, unknown>;
}

export default function IntegrationModalCreate({
  isOpen,
  onClose,
  onSuccess,
  editingIntegration,
}: IntegrationModalCreateProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedIntegration, setSelectedIntegration] =
    useState<IntegrationOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createIntegrationMutation = useCreateIntegration();
  const updateIntegrationMutation = useUpdateIntegration();

  const {
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      selectedIntegration: "",
      integrationTypes: [],
      selectedDays: [],
      selectedTimeSlots: [],
    },
  });

  // Handle editing integration
  React.useEffect(() => {
    if (editingIntegration && isOpen) {
      // Find the integration option that matches the editing integration
      const integrationOption = AVAILABLE_INTEGRATIONS.find(
        (integration) => integration.label === editingIntegration.name
      );

      if (integrationOption) {
        setSelectedIntegration(integrationOption);
        setValue("selectedIntegration", integrationOption.value);
        setValue("integrationTypes", editingIntegration.integrationTypes);

        // Set schedule data if available
        if (editingIntegration.schedule) {
          setValue("selectedDays", editingIntegration.schedule.days);
          setValue("selectedTimeSlots", editingIntegration.schedule.timeSlots);
        }

        // Set the configuration fields based on the integration type
        const config = INTEGRATION_CONFIGS[integrationOption.value];
        if (config) {
          // Map the existing data to the form fields
          config.fields.forEach((field) => {
            // Si el campo está en metadata, setearlo
            if (
              editingIntegration.metadata &&
              editingIntegration.metadata[field.name] !== undefined
            ) {
              setValue(
                `metadata.${field.name}` as `metadata.${string}`,
                editingIntegration.metadata[field.name] as never
              );
            }
          });
        }

        setCurrentStep(1);
      }
    }
  }, [editingIntegration, isOpen, setValue]);

  // Schedule configuration data
  const DAYS_OF_WEEK = [
    { value: "monday", label: "Lunes" },
    { value: "tuesday", label: "Martes" },
    { value: "wednesday", label: "Miércoles" },
    { value: "thursday", label: "Jueves" },
    { value: "friday", label: "Viernes" },
    { value: "saturday", label: "Sábado" },
    { value: "sunday", label: "Domingo" },
  ];

  // Generate time slots with specific hours only
  const TIME_SLOTS = [1, 3, 5, 10, 12, 14, 17, 20, 22].map((hour) => {
    const timeString = `${hour.toString().padStart(2, "0")}:00`;
    return {
      value: timeString,
      label: timeString,
    };
  });

  const steps = [
    {
      title: "Seleccionar Integración",
      description: "Elige la empresa a integrar",
    },
    {
      title: "Configurar Conexión",
      description: "Configura los parámetros de conexión",
    },
    {
      title: "Configurar Horario",
      description: "Define cuándo ejecutar la integración",
    },
  ];

  const handleIntegrationSelect = (integration: IntegrationOption) => {
    setSelectedIntegration(integration);
    setValue("selectedIntegration", integration.value);
    setCurrentStep(1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setSelectedIntegration(null);
    reset();
    onClose();
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const baseMetadata =
        data.metadata && typeof data.metadata === "object"
          ? { ...data.metadata }
          : {};
      if (selectedIntegration?.value) {
        baseMetadata.provider = selectedIntegration.value;
      }

      const integrationData: IntegrationCreateDto = {
        name: selectedIntegration?.label || "",
        description: selectedIntegration?.description || "",
        companyLogo: selectedIntegration?.logo || "",
        status: IntegrationStatus.ACTIVE,
        integrationTypes: data.integrationTypes || [],
        schedule: {
          days: data.selectedDays || [],
          timeSlots: data.selectedTimeSlots || [],
        },
        metadata: baseMetadata,
      };

      if (editingIntegration) {
        // Update existing integration
        await updateIntegrationMutation.mutateAsync({
          publicId: editingIntegration.publicId,
          data: {
            ...integrationData,
          },
        });

        toast({
          title: "Integración actualizada exitosamente",
          description: `La integración con ${selectedIntegration?.label} ha sido actualizada correctamente`,
          variant: "default",
        });
      } else {
        // Create new integration
        await createIntegrationMutation.mutateAsync(integrationData);

        toast({
          title: "Integración creada exitosamente",
          description: `La integración con ${selectedIntegration?.label} ha sido configurada correctamente`,
          variant: "default",
        });
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error creating/updating integration:", error);
      toast({
        title: editingIntegration
          ? "Error al actualizar la integración"
          : "Error al crear la integración",
        description: "Ocurrió un error al configurar la integración",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selecciona la empresa a integrar
              </h3>
              <p className="text-gray-600">
                Elige una de las siguientes opciones para configurar la
                integración
              </p>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto"
              data-tour="integrations-modal-step-select"
            >
              {AVAILABLE_INTEGRATIONS.map((integration) => (
                <div
                  key={integration.value}
                  onClick={() => handleIntegrationSelect(integration)}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border flex-shrink-0 relative">
                      {integration.logo && (
                        <Image
                          src={integration.logo}
                          alt={integration.label}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {integration.label}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {integration.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {integration.supportedDataTypes
                          .slice(0, 3)
                          .map((dataType) => (
                            <span
                              key={dataType}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {INTEGRATION_DATA_TYPES.find(
                                (dt) => dt.value === dataType
                              )?.label || dataType}
                            </span>
                          ))}
                        {integration.supportedDataTypes.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{integration.supportedDataTypes.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <CHEKIOButton variant="primary" size="sm">
                      Integrar
                    </CHEKIOButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 1:
        if (!selectedIntegration) return null;

        const config = INTEGRATION_CONFIGS[selectedIntegration.value];
        const supportedDataTypes = selectedIntegration.supportedDataTypes;

        return (
          <div
            className="space-y-6"
            data-tour="integrations-modal-step-config"
          >
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border relative">
                  {selectedIntegration.logo && (
                    <Image
                      src={selectedIntegration.logo}
                      alt={selectedIntegration.label}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingIntegration ? "Editar" : "Configurar"}{" "}
                  {selectedIntegration.label}
                </h3>
              </div>
              <p className="text-gray-600">
                Completa los siguientes campos para configurar la conexión
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // No permitir submit en este paso, solo navegación
              }}
              onKeyDown={(e) => {
                // Prevenir submit al presionar Enter
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna izquierda - Campos de configuración */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Configuración de Conexión
                    </h4>
                    <p className="text-sm text-gray-600 mb-6">
                      Configura los parámetros necesarios para conectar con{" "}
                      {selectedIntegration.label}
                    </p>

                    <div className="space-y-4">
                      {config?.fields.map((field) => (
                        <div key={field.name}>
                          <Controller
                            name={`metadata.${field.name}`}
                            control={control}
                            rules={{
                              required: field.required
                                ? "Este campo es requerido"
                                : false,
                              ...(field.type === "url" && {
                                pattern: {
                                  value: /^https?:\/\/.+/,
                                  message: "Debe ser una URL válida",
                                },
                              }),
                            }}
                            render={({ field: { onChange, value } }) =>
                              field.type === "file" ? (
                                <FileInput
                                  label={field.label}
                                  name={`metadata.${field.name}`}
                                  accept={field.accept}
                                  required={field.required}
                                  description={field.description}
                                  value={
                                    typeof value === "string" ? value : undefined
                                  }
                                  onChange={onChange}
                                  error={(
                                    errors.metadata as Record<
                                      string,
                                      FieldError
                                    >
                                  )?.[field.name]?.message?.toString()}
                                  disabled={isSubmitting}
                                  onError={(message) =>
                                    toast({
                                      title: "Error de archivo",
                                      description: message,
                                      variant: "destructive",
                                    })
                                  }
                                />
                              ) : (
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    {field.label}
                                    {field.required && (
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
                                    )}
                                  </label>
                                  <CHEKIOInput
                                    type={
                                      field.type === "password"
                                        ? "password"
                                        : field.type === "url"
                                        ? "url"
                                        : field.type === "number"
                                        ? "number"
                                        : "text"
                                    }
                                    placeholder={field.placeholder}
                                    value={
                                      typeof value === "string" ||
                                      typeof value === "number"
                                        ? String(value)
                                        : ""
                                    }
                                    onChange={(e) => onChange(e.target.value)}
                                    disabled={isSubmitting}
                                    className={
                                      (
                                        errors.metadata as Record<
                                          string,
                                          FieldError
                                        >
                                      )?.[field.name]
                                        ? "border-red-500"
                                        : ""
                                    }
                                  />
                                  {(
                                    errors.metadata as Record<
                                      string,
                                      FieldError
                                    >
                                  )?.[field.name] && (
                                    <p className="text-xs text-red-500">
                                      {
                                        (
                                          errors.metadata as Record<
                                            string,
                                            FieldError
                                          >
                                        )?.[field.name]?.message as string
                                      }
                                    </p>
                                  )}
                                  {field.description && (
                                    <p className="text-xs text-gray-500">
                                      {field.description}
                                    </p>
                                  )}
                                </div>
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Columna derecha - Tipos de datos a integrar */}
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Tipos de Datos a Integrar
                    </h4>
                    <p className="text-sm text-gray-600 mb-6">
                      Selecciona qué tipos de datos quieres sincronizar con{" "}
                      {selectedIntegration.label}
                    </p>

                    <Controller
                      name="integrationTypes"
                      control={control}
                      rules={{
                        validate: (value) => {
                          if (!value || value.length === 0) {
                            return "Debe seleccionar al menos un tipo de dato";
                          }
                          return true;
                        },
                      }}
                      render={({ field: { onChange, value } }) => (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {INTEGRATION_DATA_TYPES.filter((dataType) =>
                            supportedDataTypes.includes(dataType.value as any)
                          ).map((dataType) => (
                            <div
                              key={dataType.value}
                              className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-white transition-colors bg-white"
                            >
                              <Checkbox
                                checked={value?.includes(dataType.value)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...(value || []), dataType.value]
                                    : (value || []).filter(
                                        (v) => v !== dataType.value
                                      );
                                  onChange(newValue);
                                }}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <label className="text-sm font-medium text-gray-900 cursor-pointer">
                                  {dataType.label}
                                </label>
                                <p className="text-xs text-gray-600 mt-1">
                                  {dataType.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                    {errors.integrationTypes && (
                      <p className="text-xs text-red-500 mt-2">
                        {errors.integrationTypes.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
                <CHEKIOButton
                  variant="secondaryBlue"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleBack();
                  }}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Atrás
                </CHEKIOButton>
                <CHEKIOButton
                  variant="primary"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentStep(2);
                  }}
                  disabled={isSubmitting}
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </CHEKIOButton>
              </div>
            </form>
          </div>
        );

      case 2:
        return (
          <div
            className="space-y-6"
            data-tour="integrations-modal-step-schedule"
          >
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border relative">
                  {selectedIntegration?.logo && (
                    <Image
                      src={selectedIntegration.logo}
                      alt={selectedIntegration?.label || "Integration"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Configurar Horario de Ejecución
                </h3>
              </div>
              <p className="text-gray-600">
                Define cuándo debe ejecutarse la integración automáticamente
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-8">
                {/* Días de la semana */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Días de la Semana
                  </h4>
                  <p className="text-sm text-gray-600 mb-6">
                    Selecciona los días en los que debe ejecutarse la
                    integración
                  </p>

                  <Controller
                    name="selectedDays"
                    control={control}
                    rules={{
                      validate: (value) => {
                        if (!value || value.length === 0) {
                          return "Debe seleccionar al menos un día";
                        }
                        return true;
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {DAYS_OF_WEEK.map((day) => (
                          <div
                            key={day.value}
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-white transition-colors bg-white"
                          >
                            <Checkbox
                              checked={value?.includes(day.value)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...(value || []), day.value]
                                  : (value || []).filter(
                                      (v) => v !== day.value
                                    );
                                onChange(newValue);
                              }}
                            />
                            <label className="text-sm font-medium text-gray-900 cursor-pointer">
                              {day.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  {errors.selectedDays && (
                    <p className="text-xs text-red-500 mt-2">
                      {errors.selectedDays.message}
                    </p>
                  )}
                </div>

                {/* Horarios */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Horarios de Ejecución
                  </h4>
                  <p className="text-sm text-gray-600 mb-6">
                    Selecciona hasta 2 horarios de ejecución
                  </p>

                  <Controller
                    name="selectedTimeSlots"
                    control={control}
                    rules={{
                      validate: (value) => {
                        if (!value || value.length === 0) {
                          return "Debe seleccionar al menos un horario";
                        }
                        if (value.length > 2) {
                          return "Puede seleccionar máximo 2 horarios";
                        }
                        return true;
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-96 overflow-y-auto">
                        {TIME_SLOTS.map((timeSlot) => (
                          <div
                            key={timeSlot.value}
                            className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-white transition-colors bg-white"
                          >
                            <Checkbox
                              checked={value?.includes(timeSlot.value)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...(value || []), timeSlot.value]
                                  : (value || []).filter(
                                      (v) => v !== timeSlot.value
                                    );
                                onChange(newValue);
                              }}
                              disabled={
                                !value?.includes(timeSlot.value) &&
                                (value || []).length >= 2
                              }
                            />
                            <label className="text-sm font-medium text-gray-900 cursor-pointer">
                              {timeSlot.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  {errors.selectedTimeSlots && (
                    <p className="text-xs text-red-500 mt-2">
                      {errors.selectedTimeSlots.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
                <CHEKIOButton
                  variant="secondaryBlue"
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Atrás
                </CHEKIOButton>
                <CHEKIOButton
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {editingIntegration
                        ? "Actualizando..."
                        : "Configurando..."}
                    </>
                  ) : editingIntegration ? (
                    "Actualizar Integración"
                  ) : (
                    "Configurar Integración"
                  )}
                </CHEKIOButton>
              </div>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingIntegration ? "Editar Integración" : "Nueva Integración"}
      size="5xl"
    >
      <div className="py-4" data-tour="integrations-modal-create">
        {/* Steps indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="ml-3">
                  <p
                    className={`text-sm font-medium ${
                      index <= currentStep ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-4 ${
                      index < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {renderStepContent()}
      </div>
    </CHEKIOModal>
  );
}
