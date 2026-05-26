"use client";

import { CHEKIOButton } from "@/components";
import { CheckIOButton } from "@/components/template/checkIO-button";
import { useToast } from "@/hooks/use-toast";
import {
  CloseCircleOutlined,
  CloseOutlined,
  LoadingOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Drawer, Select } from "antd";
import { QrCode } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import DailyPassQrModal from "./daily-pass-qr-modal";
import { DailyPassResponseDto, DailyPassStatus } from "./daily-pass.dto";

interface DailyPassActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pass: DailyPassResponseDto;
  onDeactivate: (passId: string) => Promise<void>;
  onRenew: (passId: string, additionalDays: number) => Promise<void>;
}

interface RenewFormData {
  additionalDays: number;
}

const DailyPassActionsModal = ({
  isOpen,
  onClose,
  pass,
  onDeactivate,
  onRenew,
}: DailyPassActionsModalProps) => {
  const { toast } = useToast();
  const t = useTranslations("dailyPasses");
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RenewFormData>({
    defaultValues: {
      additionalDays: 7,
    },
  });

  const handleClose = () => {
    reset();
    setIsDeactivating(false);
    setIsRenewing(false);
    onClose();
  };

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await onDeactivate(pass.publicId);
      toast({
        title: "Pase desactivado",
        description: "El pase ha sido desactivado exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo desactivar el pase.",
        variant: "destructive",
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleRenew = async (data: RenewFormData) => {
    setIsRenewing(true);
    try {
      await onRenew(pass.publicId, data.additionalDays);
      toast({
        title: "Pase renovado",
        description: `El pase ha sido renovado por ${data.additionalDays} días adicionales.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo renovar el pase.",
        variant: "destructive",
      });
    } finally {
      setIsRenewing(false);
    }
  };

  const getStatusColor = (status: DailyPassStatus) => {
    switch (status) {
      case DailyPassStatus.ACTIVE:
        return "text-green-600 bg-green-50";
      case DailyPassStatus.EXPIRED:
        return "text-red-600 bg-red-50";
      case DailyPassStatus.DEACTIVATED:
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusText = (status: DailyPassStatus) => {
    switch (status) {
      case DailyPassStatus.ACTIVE:
        return "Activo";
      case DailyPassStatus.EXPIRED:
        return "Vencido";
      case DailyPassStatus.DEACTIVATED:
        return "Desactivado";
      default:
        return "Desconocido";
    }
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <span className="text-blue-600 text-lg font-semibold">🔑</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">
            Gestionar Pase de Acceso
          </span>
        </div>
      }
      placement="right"
      open={isOpen}
      onClose={handleClose}
      width={600}
      closeIcon={<CloseOutlined />}
      maskClosable={!isDeactivating && !isRenewing}
      closable={!isDeactivating && !isRenewing}
      className="daily-pass-drawer"
    >
      <div className="space-y-6">
        {/* Employee Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {pass.employeeName?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {pass.employeeName || "Empleado"}
              </h3>
              <p className="text-sm text-gray-600">
                {pass.employeeEmail || "Sin email"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Inicio:</span>
              <p className="font-medium text-gray-900">
                {DateTime.fromISO(pass.startDate as string)
                  .toUTC()
                  .toFormat("dd/MM/yyyy")}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Fin:</span>
              <p className="font-medium text-gray-900">
                {DateTime.fromISO(pass.endDate as string)
                  .toUTC()
                  .toFormat("dd/MM/yyyy")}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <span className="text-gray-500 text-sm">Estado:</span>
              <span
                className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  pass.status,
                )}`}
              >
                {getStatusText(pass.status)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-500 text-sm">Creado por:</span>
              <p className="text-sm font-medium text-gray-900">
                {pass.createdBy || "Sistema"}
              </p>
            </div>
          </div>
        </div>

        {/* Reason Card */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Motivo del Pase</h4>
          <p className="text-sm text-gray-700 bg-white p-3 rounded border">
            {pass.reason || "Sin motivo especificado"}
          </p>
        </div>

        {pass.status !== DailyPassStatus.DEACTIVATED && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-2 font-medium text-blue-900">
              {t("qrModal.title")}
            </h4>
            <p className="mb-3 text-sm text-blue-800">{t("qrModal.scanHint")}</p>
            <CHEKIOButton variant="primary" onClick={() => setIsQrModalOpen(true)}>
              <QrCode className="h-4 w-4" />
              {t("qrCode")}
            </CHEKIOButton>
          </div>
        )}

        {/* Actions Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">
            Acciones Disponibles
          </h4>

          {/* Deactivate Action */}
          {pass.status === DailyPassStatus.ACTIVE && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h5 className="font-medium text-red-900 mb-2">Desactivar Pase</h5>
              <p className="text-sm text-red-700 mb-3">
                El empleado ya no podrá acceder con los códigos QR generados.
              </p>
              <CheckIOButton
                color="alert"
                icon={<CloseCircleOutlined />}
                label={isDeactivating ? "Desactivando..." : "Desactivar Pase"}
                onClick={handleDeactivate}
                disabled={isDeactivating}
              />
            </div>
          )}

          {/* Renew Action */}
          {(pass.status === DailyPassStatus.ACTIVE ||
            pass.status === DailyPassStatus.EXPIRED ||
            pass.status === DailyPassStatus.DEACTIVATED) && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h5 className="font-medium text-green-900 mb-2">Renovar Pase</h5>
              <p className="text-sm text-green-700 mb-3">
                {pass.status === DailyPassStatus.DEACTIVATED
                  ? "Este pase está desactivado. Al renovarlo volverá a estar activo y se enviará un nuevo código QR al empleado."
                  : "Extienda la validez del pase por días adicionales."}
              </p>

              <form onSubmit={handleSubmit(handleRenew)} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Días adicionales
                  </label>
                  <Controller
                    name="additionalDays"
                    control={control}
                    rules={{
                      required: "Por favor seleccione la cantidad de días",
                      min: { value: 1, message: "Mínimo 1 día" },
                      max: { value: 30, message: "Máximo 30 días" },
                    }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        style={{ width: "100%" }}
                        placeholder="Seleccione días adicionales"
                        className={
                          errors.additionalDays ? "border-red-500" : ""
                        }
                        options={[
                          { value: 1, label: "1 día" },
                          { value: 3, label: "3 días" },
                          { value: 7, label: "1 semana" },
                          { value: 14, label: "2 semanas" },
                          { value: 30, label: "1 mes" },
                        ]}
                      />
                    )}
                  />
                  {errors.additionalDays && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.additionalDays.message}
                    </p>
                  )}
                </div>

                <CheckIOButton
                  color="info"
                  type="submit"
                  icon={
                    isRenewing ? <LoadingOutlined spin /> : <ReloadOutlined />
                  }
                  label={isRenewing ? "Renovando..." : "Renovar Pase"}
                  disabled={isRenewing}
                />
              </form>
            </div>
          )}

        </div>

        {/* System Info */}
        <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 space-y-1">
          <p>
            • Creado:{" "}
            {DateTime.fromISO(pass.createdAt as string).toFormat(
              "dd/MM/yyyy HH:mm",
            )}
          </p>
          <p>
            • Actualizado:{" "}
            {DateTime.fromISO(pass.updatedAt as string).toFormat(
              "dd/MM/yyyy HH:mm",
            )}
          </p>
          <p>• ID: {pass.publicId}</p>
        </div>
      </div>

      <DailyPassQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        passPublicId={pass.publicId}
        employeeName={pass.employeeName}
        initialQrCode={pass.qrCode}
        initialQrExpiresAt={pass.qrExpiresAt}
        status={pass.status}
      />
    </Drawer>
  );
};

export default DailyPassActionsModal;
