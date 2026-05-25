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
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/utils/error";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { DailyPassCreateDto, PersonSelectOption } from "./daily-pass.dto";
import ModalDailyPassQr from "./modal-daily-pass-qr";

interface DailyPassModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationRef: string;
}

export default function DailyPassModalUpsert({
  isOpen,
  onClose,
  onSuccess,
  organizationRef,
}: DailyPassModalUpsertProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [personOptions, setPersonOptions] = useState<PersonSelectOption[]>([]);

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<DailyPassCreateDto>();

  // Simulated function to fetch persons
  const fetchPersons = async (search: string) => {
    // Replace this with your actual API call
    return [
      { value: "1", label: "John Doe", documentNumber: "12345678" },
      { value: "2", label: "Jane Smith", documentNumber: "87654321" },
    ];
  };

  const handleSearch = async (value: string) => {
    if (value.length > 2) {
      const persons = await fetchPersons(value);
      setPersonOptions(persons);
    }
  };

  const handleCloseQrModal = () => {
    setShowQrModal(false);
    setQrCode(null);
    onClose();
    onSuccess();
  };

  const onSubmit: SubmitHandler<DailyPassCreateDto> = async (data) => {
    setIsLoading(true);
    try {
      // Replace with your actual API call
      const response = await new Promise((resolve) =>
        setTimeout(
          () => resolve({ qrCode: "https://via.placeholder.com/300" }),
          1000
        )
      );
      setQrCode((response as any).qrCode);
      setShowQrModal(true);
      toast({
        title: "Pase diario creado exitosamente",
        description: "Por favor muestre el código QR al usuario",
      });
    } catch (error) {
      handleError(error, toast);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CHEKIOModal
        isOpen={isOpen}
        onClose={onClose}
        title="Generar Pase Diario"
        size="5xl"
      >
        <div className="flex gap-8" data-tour="daily-pass-modal-upsert">
          <div className="flex-1">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                {/* Person Select */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Persona
                  </label>
                  <Controller
                    name="personId"
                    control={control}
                    rules={{ required: "Por favor seleccione una persona" }}
                    render={({ field }) => (
                      <>
                        <CHEKIOSelect
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            reset({
                              ...control._formValues,
                              personId: value,
                            });
                          }}
                        >
                          <CHEKIOSelectTrigger
                            className={
                              errors.personId ? "border-red-500 w-full" : "w-full"
                            }
                          >
                            <CHEKIOSelectValue placeholder="Buscar por nombre o documento" />
                          </CHEKIOSelectTrigger>
                          <CHEKIOSelectContent>
                            {personOptions.map((option) => (
                              <CHEKIOSelectItem key={option.value} value={option.value}>
                                {option.label} - {option.documentNumber}
                              </CHEKIOSelectItem>
                            ))}
                          </CHEKIOSelectContent>
                        </CHEKIOSelect>
                        {errors.personId && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.personId.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>

                {/* Expiration DateTime */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Fecha y Hora de Expiración
                  </label>
                  <Controller
                    name="expiresAt"
                    control={control}
                    rules={{ required: "Por favor seleccione fecha y hora de expiración" }}
                    render={({ field }) => (
                      <>
                        <DatePicker
                          showTime
                          className={`w-full ${
                            errors.expiresAt ? "border-red-500" : "border-gray-300"
                          }`}
                          format="YYYY-MM-DD HH:mm"
                          placeholder="Seleccione fecha y hora"
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(date) => {
                            const dateValue = date ? date.toDate() : null;
                            field.onChange(dateValue);
                            setExpiresAt(dateValue);
                          }}
                          disabledDate={(current) => {
                            return current && current < dayjs().startOf("day");
                          }}
                        />
                        {errors.expiresAt && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.expiresAt.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
              </div>

              <CHEKIOButton
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <span>GENERAR PASE</span>
                )}
              </CHEKIOButton>
            </form>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Información del Pase Diario
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-700 mb-2">
                  ¿Qué es un pase diario?
                </h4>
                <p className="text-sm text-gray-600">
                  Un pase diario es un permiso temporal que permite el acceso a
                  las instalaciones por un período limitado. Características
                  principales:
                </p>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Válido solo por el tiempo especificado
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Un solo uso
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Verificación mediante código QR
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-700 mb-2">Importante</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-yellow-500 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    El pase expira automáticamente después del tiempo
                    establecido
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-yellow-500 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    No se puede reutilizar un pase ya utilizado
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CHEKIOModal>

      <ModalDailyPassQr
        isOpen={showQrModal}
        onClose={handleCloseQrModal}
        qrCode={qrCode || undefined}
        expiresAt={expiresAt || undefined}
      />
    </>
  );
}
