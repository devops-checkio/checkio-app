"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
} from "@/components";
import SystemMultiSelect from "@/components/ui/multi-select";
import SystemInput from "@/components/ui/system-input";
import {
  StructureCreateDto,
  StructureResponseDto,
  StructureUpdateDto,
} from "@/dto/structure";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateStructure,
  useUpdateStructure,
} from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { CompanyOption } from "../../companies/_components/company.dto";

interface StructureModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  editingStructure: StructureResponseDto | null;
  onSuccess: () => void;
  companyOptions: CompanyOption[];
  /** Al crear: preselecciona la empresa activa en sesión */
  initialCompanyPublicId?: string | null;
}

export default function SectionModalUpsert({
  isOpen,
  onClose,
  editingStructure,
  onSuccess,
  companyOptions,
  initialCompanyPublicId,
}: StructureModalUpsertProps) {
  const { toast } = useToast();
  const { mutate: createStructure, isPending: isCreatingStructure } =
    useCreateStructure();
  const { mutate: updateStructure, isPending: isUpdatingStructure } =
    useUpdateStructure();

  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<StructureCreateDto | StructureUpdateDto>();

  useEffect(() => {
    if (editingStructure) {
      reset({
        name: editingStructure.name,
        companies: editingStructure.companies,
      });
    } else {
      reset({
        name: "",
        companies: initialCompanyPublicId ? [initialCompanyPublicId] : [],
      });
    }
  }, [editingStructure, reset, initialCompanyPublicId]);

  const onSubmit: SubmitHandler<StructureCreateDto | StructureUpdateDto> = (
    data
  ) => {
    if (editingStructure) {
      updateStructure(
        { ...data, publicId: editingStructure.publicId } as StructureUpdateDto,
        {
          onSuccess: () => {
            toast({
              title: "Estructura actualizada exitosamente",
              variant: "default",
            });
            onSuccess();
            onClose();
          },
          onError: (error: any) => {
            handleError(error, toast);
          },
        }
      );
    } else {
      createStructure(data as StructureCreateDto, {
        onSuccess: () => {
          toast({
            title: "Estructura creada exitosamente",
            variant: "default",
          });
          onSuccess();
        },
        onError: (error: any) => {
          handleError(error, toast);
        },
        onSettled: () => {
          onClose();
        },
      });
    }
  };

  const handleSelectAll = () => {
    const allValues = companyOptions.map((option) => option.value);
    setValue("companies", allValues);
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingStructure ? "Editar Estructura" : "Agregar Estructura"}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <SystemInput
          control={control}
          label="Nombre"
          attribute="name"
          errors={errors}
          rules={{ required: "Por favor ingrese el nombre de la estructura" }}
        />
        <SystemMultiSelect
          control={control}
          label="Empresas"
          attribute="companies"
          options={companyOptions}
          errors={errors}
          rules={{ required: "Por favor seleccione al menos una empresa" }}
          placeholder="Seleccione las empresas"
          showSelectAll={true}
          onSelectAll={handleSelectAll}
          searchable={true}
          showClear={true}
          maxItems={3}
          showError={true}
        />
        <CHEKIOButton
          type="submit"
          variant="primary"
          disabled={isCreatingStructure || isUpdatingStructure}
          className="w-full"
        >
          {isCreatingStructure || isUpdatingStructure ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{editingStructure ? "Actualizando..." : "Creando..."}</span>
            </>
          ) : editingStructure ? (
            "ACTUALIZAR"
          ) : (
            "GUARDAR"
          )}
        </CHEKIOButton>
      </form>
    </CHEKIOModal>
  );
}
