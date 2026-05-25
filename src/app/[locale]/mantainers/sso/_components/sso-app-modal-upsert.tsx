"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
} from "@/components";
import SystemInput from "@/components/ui/system-input";
import { useToast } from "@/hooks/use-toast";
import { useCreateAppSSO, useUpdateAppSSO } from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { Check, Copy, Loader2 } from "lucide-react";
import axios from "axios";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { AppSSOResponseDto, CreateAppSSODto, UpdateAppSSODto } from "./sso.dto";

interface SSOAppModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  editingAppSSO: AppSSOResponseDto | null;
  onSuccess: () => void;
}

export default function SSOAppModalUpsert({
  isOpen,
  onClose,
  editingAppSSO,
  onSuccess,
}: SSOAppModalUpsertProps) {
  const { toast } = useToast();
  const [createdApp, setCreatedApp] = useState<AppSSOResponseDto | null>(null);
  const [copied, setCopied] = useState(false);

  const { mutate: createAppSSO, isPending: isCreatingAppSSO } =
    useCreateAppSSO();
  const { mutate: updateAppSSO, isPending: isUpdatingAppSSO } =
    useUpdateAppSSO();

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateAppSSODto | UpdateAppSSODto>();

  const handleCopyToken = async () => {
    if (createdApp?.secretToken) {
      try {
        await navigator.clipboard.writeText(createdApp.secretToken);
        setCopied(true);
        toast({
          title: "Token copiado al portapapeles",
          variant: "default",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast({
          title: "Error al copiar el token",
          variant: "destructive",
        });
      }
    }
  };

  const handleClose = () => {
    setCreatedApp(null);
    setCopied(false);
    reset();
    onClose();
  };

  const onSubmit: SubmitHandler<CreateAppSSODto | UpdateAppSSODto> = (data) => {
    if (editingAppSSO) {
      updateAppSSO(
        { id: editingAppSSO.publicId, data } as {
          id: string;
          data: UpdateAppSSODto;
        },
        {
          onSuccess: () => {
            toast({
              title: "Aplicación SSO actualizada exitosamente",
              description:
                "La aplicación SSO ha sido actualizada correctamente",
            });
            onSuccess();
            handleClose();
          },
          onError: (error: any) => {
            handleError(error, toast);
          },
        }
      );
    } else {
      createAppSSO(data as CreateAppSSODto, {
        onSuccess: (response: AppSSOResponseDto) => {
          setCreatedApp(response);
          toast({
            title: "Aplicación SSO creada exitosamente",
            description: "La aplicación SSO ha sido creada correctamente",
          });
          onSuccess();
        },
        onError: (error: any) => {
          if (axios.isAxiosError(error)) {
            toast({
              title: "Error",
              description: error.response?.data.message,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: "Error al crear la aplicación SSO",
              variant: "destructive",
            });
          }
        },
      });
    }
  };

  // Show success state with token when app is created
  if (createdApp) {
    return (
      <CHEKIOModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Aplicación SSO Creada Exitosamente"
        size="xl"
      >
        <div className="space-y-6 py-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              {createdApp.name}
            </h3>
            <p className="text-green-700 mb-4">
              La aplicación SSO ha sido creada correctamente. Guarda el token
              secreto de forma segura.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Token Secreto
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white p-3 rounded border border-gray-300 font-mono text-sm break-all">
                {createdApp.secretToken}
              </div>
              <CHEKIOButton
                variant="primary"
                onClick={handleCopyToken}
                className="flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </CHEKIOButton>
            </div>
            <p className="text-xs text-gray-500">
              ⚠️ Este token es sensible. Guárdalo en un lugar seguro y no lo
              compartas.
            </p>
          </div>

          <div className="flex gap-3">
            <CHEKIOButton
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
            >
              Cerrar
            </CHEKIOButton>
            <CHEKIOButton
              variant="primary"
              onClick={() => {
                setCreatedApp(null);
                reset();
              }}
              className="flex-1"
            >
              Crear Otra
            </CHEKIOButton>
          </div>
        </div>
      </CHEKIOModal>
    );
  }

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingAppSSO ? "Editar Aplicación SSO" : "Agregar Aplicación SSO"}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <SystemInput
            control={control}
            label="Nombre de la Aplicación"
            attribute="name"
            errors={errors}
            rules={{
              required: "Por favor ingrese el nombre de la aplicación SSO",
            }}
          />
        </div>
        <CHEKIOButton
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isCreatingAppSSO || isUpdatingAppSSO}
        >
          {isCreatingAppSSO || isUpdatingAppSSO ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {editingAppSSO ? "Actualizando..." : "Creando..."}
              </span>
            </>
          ) : (
            <span>{editingAppSSO ? "ACTUALIZAR" : "GUARDAR"}</span>
          )}
        </CHEKIOButton>
      </form>
    </CHEKIOModal>
  );
}
