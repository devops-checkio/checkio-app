"use client";
import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOModal,
} from "@/components";
import { Controller, useForm } from "react-hook-form";
import { CustomAlert } from "./custom-alert";
import { Loader2 } from "lucide-react";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
}

type OrganizationalUnitFormInputs = {
  name: string;
  code?: string;
};

interface SubUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OrganizationalUnitFormInputs) => Promise<void>;
  isLoading: boolean;
  alert: {
    type: "success" | "error";
    message: string;
    description: string;
  } | null;
  onAlertClose: () => void;
}

export function SubUnitModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  alert,
  onAlertClose,
}: SubUnitModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationalUnitFormInputs>({
    defaultValues: {
      name: "",
      code: "",
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear Subunidad"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {alert && (
          <CustomAlert
            type={alert.type}
            message={alert.message}
            description={alert.description}
            onClose={onAlertClose}
          />
        )}
        <div className="grid w-full items-center gap-1.5">
          <label
            htmlFor="modal-name"
            className="text-sm font-medium text-gray-700 block"
          >
            Nombre Subunidad
          </label>
          <Controller
            name="name"
            control={control}
            rules={{ required: "Nombre Subunidad es un campo requerido" }}
            render={({ field }) => (
              <>
                <CHEKIOInput
                  {...field}
                  id="modal-name"
                  placeholder="Ej: Subunidad"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <label
            htmlFor="modal-code"
            className="text-sm font-medium text-gray-700 block"
          >
            Código
          </label>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <CHEKIOInput
                {...field}
                id="modal-code"
                placeholder="Ej: SUB-001"
              />
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <CHEKIOButton
            type="button"
            variant={ButtonVariant.SECONDARY}
            onClick={handleClose}
          >
            Cancelar
          </CHEKIOButton>
          <CHEKIOButton
            type="submit"
            variant={ButtonVariant.PRIMARY}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creando</span>
              </>
            ) : (
              "Crear"
            )}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}
