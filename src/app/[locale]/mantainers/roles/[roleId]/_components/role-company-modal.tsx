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
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

interface RoleCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (companyId: string, access: "allow" | "deny") => Promise<void>;
  editingCompany: string | null;
  companies?: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  companyAccess: Array<{
    companyId: string;
    access: "allow" | "deny";
  }>;
  isLoading?: boolean;
}

interface FormValues {
  companyId: string;
  access: "allow" | "deny";
}

export function RoleCompanyModal({
  isOpen,
  onClose,
  onSubmit,
  editingCompany,
  companies = [],
  companyAccess,
  isLoading = false,
}: RoleCompanyModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      companyId: "",
      access: "allow",
    },
  });

  useEffect(() => {
    if (editingCompany) {
      const currentAccess = companyAccess.find(
        (ca) => ca.companyId === editingCompany
      );
      reset({
        companyId: editingCompany,
        access: currentAccess?.access || "allow",
      });
    } else {
      reset({
        companyId: "",
        access: "allow",
      });
    }
  }, [editingCompany, companyAccess, reset, isOpen]);

  const { toast } = useToast();

  const onFormSubmit = async (data: FormValues) => {
    try {
      await onSubmit(data.companyId, data.access);
      toast({
        title: editingCompany
          ? "Restricción actualizada exitosamente"
          : "Restricción agregada exitosamente",
        variant: "default",
      });
      onClose();
      reset();
    } catch (error) {
      toast({
        title: "Error al guardar la restricción",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const availableCompanies = companies.filter(
    (company) =>
      !companyAccess.some((ca) => ca.companyId === company.id) ||
      company.id === editingCompany
  );

  const companyOptions = availableCompanies.map((company) => ({
    value: company.id,
    label: `${company.name} (${company.code})`,
  }));

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingCompany ? "Editar Restricción" : "Agregar Restricción"}
      size="xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Empresa *
          </label>
          <Controller
            name="companyId"
            control={control}
            rules={{
              required: "Por favor seleccione una empresa",
              validate: (value) => {
                if (!value) return "Por favor seleccione una empresa";
                return true;
              },
            }}
            render={({ field }) => (
              <>
                <CHEKIOSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!!editingCompany || isLoading}
                >
                  <CHEKIOSelectTrigger
                    className={
                      errors.companyId ? "border-red-500 w-full" : "w-full"
                    }
                  >
                    <CHEKIOSelectValue placeholder="Seleccione una empresa" />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    {companyOptions.map((option) => (
                      <CHEKIOSelectItem key={option.value} value={option.value}>
                        {option.label}
                      </CHEKIOSelectItem>
                    ))}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              </>
            )}
          />
          {errors.companyId && (
            <p className="text-red-500 text-xs mt-1">
              {errors.companyId.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Tipo de Acceso *
          </label>
          <Controller
            name="access"
            control={control}
            rules={{
              required: "Por favor seleccione un tipo de acceso",
              validate: (value) => {
                if (!value) return "Por favor seleccione un tipo de acceso";
                return true;
              },
            }}
            render={({ field }) => (
              <div
                className={`flex gap-4 ${
                  errors.access ? "border border-red-500 p-2 rounded" : ""
                }`}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="allow"
                    checked={field.value === "allow"}
                    onChange={() => field.onChange("allow")}
                    disabled={isLoading}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Permitido</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="deny"
                    checked={field.value === "deny"}
                    onChange={() => field.onChange("deny")}
                    disabled={isLoading}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Denegado</span>
                </label>
              </div>
            )}
          />
          {errors.access && (
            <p className="text-red-500 text-xs mt-1">{errors.access.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <CHEKIOButton
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading || isSubmitting}
          >
            Cancelar
          </CHEKIOButton>
          <CHEKIOButton
            type="submit"
            variant="primary"
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting || isLoading
              ? "Guardando..."
              : editingCompany
              ? "Actualizar"
              : "Agregar"}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}
