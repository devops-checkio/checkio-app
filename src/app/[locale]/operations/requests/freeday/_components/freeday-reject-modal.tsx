"use client";

import SystemInput from "@/components/ui/system-input";
import { useCookieSession } from "@/context/useCookieSession";
import { useToast } from "@/hooks/use-toast";
import { useRejectFreedayRequest } from "@/service/freeday.service";
import {
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Modal } from "antd";
import { DateTime } from "luxon";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { FreedayRequestResponseDto } from "./freeday.dto";

interface FreedayRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  request: FreedayRequestResponseDto;
}

interface RejectFormData {
  rejectedBy: string;
  rejectionReason: string;
}

const FreedayRejectModal = ({
  isOpen,
  onClose,
  onSuccess,
  request,
}: FreedayRejectModalProps) => {
  const { toast } = useToast();
  const { user } = useCookieSession();
  const [isPending, setIsPending] = useState(false);

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectFormData>({
    defaultValues: {
      rejectedBy: user?.publicId || "",
      rejectionReason: "",
    },
  });

  // Reject mutation
  const rejectFreedayRequest = useRejectFreedayRequest();

  const handleClose = () => {
    reset();
    setIsPending(false);
    onClose();
  };

  const onSubmit: SubmitHandler<RejectFormData> = async (data) => {
    setIsPending(true);

    try {
      await rejectFreedayRequest.mutateAsync({
        publicId: request.publicId,
        rejectedBy: data.rejectedBy,
        rejectionReason: data.rejectionReason,
      });

      toast({
        title: "Solicitud rechazada",
        description:
          "La solicitud de día libre ha sido rechazada correctamente",
      });

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Error al rechazar la solicitud",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 text-lg font-semibold text-red-800">
          <div className="p-2 bg-red-100 rounded-lg">
            <CloseCircleOutlined className="text-red-600 text-xl" />
          </div>
          <span>Rechazar Solicitud de Día Libre</span>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      width={600}
      footer={null}
      maskClosable={!isPending}
      closable={!isPending}
      centered
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        {/* Request Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <h4 className="font-medium text-gray-900">Resumen de la Solicitud</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Empleado:</span>
              <p className="text-gray-600">{request.employeeName}</p>
            </div>
            <div>
              <span className="font-medium">Motivo:</span>
              <p className="text-gray-600">{request.reason}</p>
            </div>
            <div>
              <span className="font-medium">Fecha de inicio:</span>
              <p className="text-gray-600">
                {DateTime.fromISO(request.startDate as string)
                  .toUTC()
                  .toFormat("dd/MM/yyyy")}
              </p>
            </div>
            <div>
              <span className="font-medium">Fecha de término:</span>
              <p className="text-gray-600">
                {DateTime.fromISO(request.endDate as string)
                  .toUTC()
                  .toFormat("dd/MM/yyyy")}
              </p>
            </div>
            <div>
              <span className="font-medium">Con goce de sueldo:</span>
              <p className="text-gray-600">
                {request.withSalary ? "Sí" : "No"}
              </p>
            </div>
            <div>
              <span className="font-medium">Solicitado por:</span>
              <p className="text-gray-600">{request.rejectedBy}</p>
            </div>
            {request.observation && (
              <div className="col-span-2">
                <span className="font-medium">Observación:</span>
                <p className="text-gray-600">{request.observation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Rejection Reason */}
        <div>
          <SystemInput
            control={control}
            label="Motivo del Rechazo"
            attribute="rejectionReason"
            errors={errors}
            rules={{
              required: "Por favor ingrese el motivo del rechazo",
            }}
            type="textarea"
            placeholder="Explique el motivo por el cual se rechaza esta solicitud..."
          />
        </div>

        {/* Rejection Warning */}
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <ExclamationCircleOutlined className="text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Confirmar Rechazo</h4>
              <p className="text-sm text-red-700 mt-1">
                ¿Está seguro de que desea rechazar esta solicitud de día libre?
                Esta acción notificará al empleado sobre el rechazo y no se
                puede deshacer.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {isPending ? (
              <>
                <LoadingOutlined spin />
                Rechazando...
              </>
            ) : (
              <>
                <CloseCircleOutlined />
                Rechazar Solicitud
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export { FreedayRejectModal };
