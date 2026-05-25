"use client";
import { CHEKIOButton, CHEKIOInput } from "@/components";
import ButtonSelector from "@/components/ui/button-selector";
import { CreateSubOrganizationalUnitRequestDto } from "@/dto/structure";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateSubOrganizationalUnit,
  useDeleteOrganizationalUnit,
} from "@/service/mantainer.service";
import { handleError } from "@/utils/error";

import { useQueryClient } from "@tanstack/react-query";
import { Cascader } from "antd";
import { Loader2 } from "lucide-react";
import { Key } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

enum ButtonVariant {
  PRIMARY = "primary",
  DELETE = "delete",
}

function buildTree(
  data: any,
  parentId: string | null,
  topLevel: number,
  level = 1
) {
  let tree = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].subRelationId == parentId) {
      if (level === topLevel) {
        data[i].items = [];
      } else {
        let children = buildTree(data, data[i].publicId, topLevel, level + 1);
        if (children.length > 0) {
          data[i].items =
            children.map((x: any) => {
              return {
                code: x.publicId || x.code || x.name,
                name: x.name,
                items: x.items || [],
              };
            }) || [];
        }
      }

      tree.push(data[i]);
    }
  }
  return tree.map((x) => {
    return {
      code: x.publicId || x.code || x.name,
      name: x.name,
      items: x.items,
    };
  });
}

type FormSubOrganizationalBusinessSectionParams = {
  organizationalUnitId: string;
  level: number;
  selectedRowKeys: Key[];
  GetOrganizationalUnits: any[];
  items: any[];
  isLoading: boolean;
  count: number;
  structureId: string;
};

export function FormSubOrganizationalBusinessSection({
  organizationalUnitId,
  level,
  selectedRowKeys,
  GetOrganizationalUnits,
  items,
  isLoading,
  count,
  structureId,
}: FormSubOrganizationalBusinessSectionParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: createSubUnit, isPending: isLoadingCreation } =
    useCreateSubOrganizationalUnit();
  const { mutate: deleteUnit, isPending: isLoadingDelete } =
    useDeleteOrganizationalUnit();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateSubOrganizationalUnitRequestDto>({
    defaultValues: {
      name: "",
      code: "",
      subRelationId: undefined,
    },
  });

  const onSubmit: SubmitHandler<CreateSubOrganizationalUnitRequestDto> = (
    data
  ) => {
    const subRelationId =
      Array.isArray(data.subRelationId) && data.subRelationId.length > 0
        ? data.subRelationId[data.subRelationId.length - 1]
        : null;

    createSubUnit(
      {
        name: data.name,
        code: data.code,
        subRelationId,
        organizationalUnitId: organizationalUnitId,
      },
      {
        onSuccess: async (res: any) => {
          toast({
            title: "Sub Unidad creada",
            description: "Sub Unidad creada exitosamente",
          });
          await queryClient.invalidateQueries({
            queryKey: ["GetOrganizationalUnits", structureId],
          });
        },
        onError: (error: any) => {
          handleError(error, toast);
        },
        onSettled: () => {
          reset();
        },
      }
    );
  };

  const deleteSubOrganization = (id: string) => {
    deleteUnit(
      {
        id,
        structureId,
      },
      {
        onSuccess: async (res: any) => {
          toast({
            title: "Sub Unidad eliminada",
            description: "Sub Unidad eliminada correctamente",
          });
          await queryClient.invalidateQueries({
            queryKey: ["GetOrganizationalUnits", structureId],
          });
        },
        onError: (error: any) => {
          handleError(error, toast);
        },
        onSettled: () => {
          reset();
        },
      }
    );
  };

  const options = buildTree(
    GetOrganizationalUnits.flatMap((x) => x.SubOrganizationalUnit),
    null,
    level
  );

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Code Field */}
            <div className="space-y-2">
              <label
                htmlFor="code"
                className="text-sm font-medium text-gray-700 block"
              >
                Código
              </label>
              <Controller
                name="code"
                control={control}
                rules={{ required: "Código es un campo requerido" }}
                render={({ field }) => (
                  <>
                    <CHEKIOInput
                      {...field}
                      id="code"
                      placeholder="Ej: JD001"
                      className={errors.code ? "border-red-500" : ""}
                    />
                    {errors.code && (
                      <p className="text-sm text-red-500">
                        {errors.code.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-700 block"
              >
                Nombre Sub Unidad
              </label>
              <Controller
                name="name"
                control={control}
                rules={{ required: "Nombre Sub Unidad es un campo requerido" }}
                render={({ field }) => (
                  <>
                    <CHEKIOInput
                      {...field}
                      id="name"
                      placeholder="Ej: Jedi"
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

            {/* Submit Button */}
            <div className="grid content-end">
              <CHEKIOButton
                type="submit"
                variant={ButtonVariant.PRIMARY}
                disabled={isLoadingCreation}
                className="w-full"
              >
                {isLoadingCreation ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creando...</span>
                  </>
                ) : (
                  "Crear"
                )}
              </CHEKIOButton>
            </div>

            {/* Delete Button */}
            <div className="grid content-end">
              {count === 0 && (
                <CHEKIOButton
                  disabled={isLoadingDelete}
                  variant="destructive"
                  type="button"
                  onClick={() => deleteSubOrganization(organizationalUnitId)}
                  className="w-full"
                >
                  {isLoadingDelete ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    "Eliminar Unidad"
                  )}
                </CHEKIOButton>
              )}
            </div>

            {/* Actions Button */}
            <div className="grid content-end">
              <ButtonSelector
                disabled={!isLoading && selectedRowKeys.length === 0}
                type={isLoading ? "button" : "dropdown"}
                items={items}
                className="w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Procesando" : "Acciones"}
              </ButtonSelector>
            </div>
          </div>

          {/* Superior Unit Field */}
          {level > 0 && (
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Unidad Superior
              </label>
              <Controller
                name="subRelationId"
                control={control}
                rules={{ required: "Debe seleccionar una unidad superior" }}
                render={({ field }) => (
                  <>
                    {/* Note: Cascader from Ant Design is used here as there's no CHEKIO equivalent for cascading selects */}
                    <Cascader
                      {...field}
                      fieldNames={{
                        label: "name",
                        value: "code",
                        children: "items",
                      }}
                      options={options}
                      placeholder="Seleccione unidad superior"
                      className={`w-full transition-all duration-200 ${
                        errors.subRelationId
                          ? "border-red-500"
                          : "border-gray-300 hover:border-blue-400 focus:border-blue-500"
                      }`}
                      value={Array.isArray(field.value) ? field.value : []}
                      onChange={(value: string[]) => {
                        field.onChange(value);
                      }}
                    />
                    {errors.subRelationId && (
                      <p className="text-sm text-red-500">
                        {errors.subRelationId.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
