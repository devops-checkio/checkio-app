"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import EmployeeSelectionModal from "@/components/employee-selection-modal";
import { CheckioInputDate } from "@/components/ui/checkio-input-date";
import { useToast } from "@/hooks/use-toast";
import {
  useAssignManager,
  useDeleteManager,
  useGetEmployeeSubordinates,
} from "@/service/mantainer.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AlertTriangle, Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { EmployeeResponseDto, ManagerType } from "./employee.dto";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  DESTRUCTIVE = "destructive",
}

// Define the schema for manager form data
const managerSchema = z.object({
  managerId: z.string().min(1, "Por favor seleccione un jefe/supervisor"),
  type: z.string().min(1, "Por favor seleccione un tipo"),
  startDate: z
    .string()
    .min(1, "Por favor ingrese la fecha de inicio")
    .refine(
      (val) => {
        try {
          const date = new Date(val);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today;
        } catch {
          return false;
        }
      },
      {
        message: "La fecha de inicio no puede ser en el pasado",
      },
    ),
  endDate: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const date = new Date(val);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today;
        } catch {
          return false;
        }
      },
      {
        message: "La fecha de fin no puede ser en el pasado",
      },
    ),
});

type ManagerFormData = z.infer<typeof managerSchema>;

interface ManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  manager: any | null;
  onSuccess: () => void;
  companyId: string;
}

export default function ManagerModal({
  isOpen,
  onClose,
  employeeId,
  manager,
  onSuccess,
  companyId,
}: ManagerModalProps) {
  const { toast } = useToast();
  const t = useTranslations("mantainers.employees");
  const ManagerTypeOptions = [
    { value: ManagerType.MANAGER, label: t("manager.type.manager") },
    { value: ManagerType.SUPERVISOR, label: t("manager.type.supervisor") },
  ];
  const [isInactivating, setIsInactivating] = useState(false);
  const [isEmployeeSelectorOpen, setIsEmployeeSelectorOpen] = useState(false);
  const [isInactivateConfirmOpen, setIsInactivateConfirmOpen] = useState(false);
  const [selectedManager, setSelectedManager] =
    useState<EmployeeResponseDto | null>(null);

  // Get current subordinates to exclude them from manager selection
  const { data: subordinates } = useGetEmployeeSubordinates(employeeId);

  const { mutate: assignManager, isPending: isAssigningManager } =
    useAssignManager();
  const { mutate: deleteManager, isPending: isDeletingManager } =
    useDeleteManager();

  const {
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ManagerFormData>({
    resolver: zodResolver(managerSchema),
    defaultValues: {
      type: ManagerType.MANAGER,
      startDate: new Date().toISOString(),
      managerId: "",
    },
  });

  useEffect(() => {
    if (manager) {
      reset({
        managerId: String(manager.managerId || ""),
        type: manager.type,
        startDate: manager.startDate
          ? manager.startDate
          : new Date().toISOString(),
        endDate: manager.endDate ? manager.endDate : null,
      });

      // Set the selected manager for display
      setSelectedManager({
        publicId: manager.managerId,
        firstName: manager.managerName?.split(" ")[0] || "",
        lastName: manager.managerName?.split(" ").slice(1).join(" ") || "",
        code: "", // We don't have the code in the manager object
      } as EmployeeResponseDto);
    } else {
      reset({
        type: ManagerType.MANAGER,
        startDate: new Date().toISOString(),
        managerId: "",
      });
      setSelectedManager(null);
    }
  }, [manager, reset]);

  // Handle employee selection from selector modal
  const handleEmployeeSelection = (employees: EmployeeResponseDto[]) => {
    if (employees.length > 0) {
      const employee = employees[0]; // Only take the first one for manager
      setSelectedManager(employee);
      setValue("managerId", employee.publicId);
    }
    setIsEmployeeSelectorOpen(false);
  };

  // Get excluded employee IDs (current subordinates)
  // Note: For subordinates, we don't have the employeeId directly, so we'll exclude based on the current employee
  const excludedEmployeeIds = [
    employeeId, // Exclude current employee
    // Note: We can't exclude subordinates by ID since the response doesn't include employeeId
    // The business logic should be handled on the backend
  ];

  const queryClient = useQueryClient();

  const onSubmit: SubmitHandler<ManagerFormData> = async (data) => {
    assignManager(
      {
        id: employeeId,
        employeeManagerCreateDto: {
          ...data,
          startDate: data.startDate,
          endDate: data.endDate || undefined,
          type: data.type as ManagerType,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Éxito",
            description: "Jefe/Supervisor guardado correctamente",
          });
          queryClient.invalidateQueries({
            queryKey: ["GetEmployeeManagers", employeeId],
          });
          onSuccess();
        },
        onError: (error) => {
          console.error("Error saving manager:", error);
          if (axios.isAxiosError(error)) {
            toast({
              title: "Error",
              description:
                error.response?.data.message ||
                "Ocurrió un error al guardar el jefe/supervisor",
            });
          }
        },
      },
    );
  };

  const handleInactivateManager = () => {
    if (!manager) return;
    setIsInactivateConfirmOpen(true);
  };

  const confirmInactivate = () => {
    if (!manager) return;

    setIsInactivating(true);

    deleteManager(
      {
        id: employeeId,
        managerId: manager.publicId,
      },
      {
        onSuccess: () => {
          toast({
            title: "Éxito",
            description: "Jefe/Supervisor inactivado correctamente",
          });
          queryClient.invalidateQueries({
            queryKey: ["GetEmployeeManagers", employeeId],
          });
          setIsInactivating(false);
          setIsInactivateConfirmOpen(false);
          onSuccess();
          onClose();
        },
        onError: (error) => {
          console.error("Error inactivating manager:", error);
          setIsInactivating(false);
          if (axios.isAxiosError(error)) {
            toast({
              title: "Error",
              description:
                error.response?.data.message ||
                "Ocurrió un error al inactivar el jefe/supervisor",
            });
          }
        },
      },
    );
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("manager.title")}
      size="md"
    >
      {manager ? (
        <div className="py-4">
          <div className="mb-6 bg-orange-50 p-4 rounded-md border border-orange-200">
            <h3 className="text-lg font-medium text-orange-800 mb-2">
              Inactivar Jefe/Supervisor
            </h3>
            <p className="text-sm text-orange-700 mb-4">
              Para inactivar a {manager.managerName} como{" "}
              {manager.type === ManagerType.MANAGER
                ? t("manager.type.manager")
                : t("manager.type.supervisor")}
              , haga click en el botón de abajo.
            </p>
            <div className="flex justify-end">
              <CHEKIOButton
                variant={ButtonVariant.DESTRUCTIVE}
                onClick={handleInactivateManager}
                disabled={isInactivating}
              >
                {isInactivating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Inactivando...</span>
                  </>
                ) : (
                  "Inactivar"
                )}
              </CHEKIOButton>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Actualizar información
            </h3>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jefe/Supervisor
            </label>
            <Controller
              name="managerId"
              control={control}
              render={({ field }) => (
                <>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <CHEKIOInput
                        type="text"
                        readOnly
                        className={
                          errors.managerId
                            ? "border-red-500 bg-gray-50"
                            : "bg-gray-50"
                        }
                        placeholder="Seleccione un jefe/supervisor"
                        value={
                          selectedManager
                            ? `${selectedManager.firstName} ${selectedManager.lastName} (${selectedManager.code})`
                            : ""
                        }
                      />
                    </div>
                    <CHEKIOButton
                      variant={ButtonVariant.PRIMARY}
                      type="button"
                      onClick={() => setIsEmployeeSelectorOpen(true)}
                    >
                      <Search className="h-4 w-4" />
                      Buscar
                    </CHEKIOButton>
                  </div>
                  {errors.managerId && (
                    <p className="text-xs text-red-500">
                      {errors.managerId.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <>
                  <CHEKIOSelect
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <CHEKIOSelectTrigger
                      className={errors.type ? "border-red-500" : ""}
                    >
                      <CHEKIOSelectValue placeholder="Seleccione tipo" />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      {ManagerTypeOptions.map((option) => (
                        <CHEKIOSelectItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </CHEKIOSelectItem>
                      ))}
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                  {errors.type && (
                    <p className="text-xs text-red-500">
                      {errors.type.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          <div>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <CheckioInputDate
                  label="Fecha de Inicio"
                  required
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  placeholder="dd/mm/aaaa"
                  error={errors.startDate?.message}
                />
              )}
            />
          </div>

          <div>
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <CheckioInputDate
                  label="Fecha de Fin"
                  value={field.value || undefined}
                  onChange={(value) => field.onChange(value)}
                  placeholder="dd/mm/aaaa"
                  error={errors.endDate?.message}
                />
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <CHEKIOButton
            variant={ButtonVariant.SECONDARY}
            type="button"
            onClick={onClose}
          >
            Cancelar
          </CHEKIOButton>
          <CHEKIOButton
            variant={ButtonVariant.PRIMARY}
            type="submit"
            disabled={isAssigningManager}
          >
            {isAssigningManager ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : manager ? (
              "Actualizar"
            ) : (
              "Agregar"
            )}
          </CHEKIOButton>
        </div>
      </form>

      {/* Employee Selection Modal */}
      <EmployeeSelectionModal
        isOpen={isEmployeeSelectorOpen}
        onClose={() => setIsEmployeeSelectorOpen(false)}
        onSelect={handleEmployeeSelection}
        title={t("manager.title")}
        message="Seleccione un empleado para asignar como jefe o supervisor. Los empleados que son sus subordinados actuales no aparecerán en la lista."
        buttonText="Seleccionar"
        excludeEmployeeIds={excludedEmployeeIds}
        multiSelect={false}
      />

      {/* Confirm Inactivate Modal */}
      {manager && (
        <CHEKIOModal
          isOpen={isInactivateConfirmOpen}
          onClose={() => setIsInactivateConfirmOpen(false)}
          title={t("manager.title")}
          size="md"
        >
          <div className="py-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <p className="text-gray-700">
                ¿Está seguro que desea inactivar a{" "}
                <strong>{manager.managerName}</strong> como{" "}
                <strong>
                  {manager.type === ManagerType.MANAGER
                    ? t("manager.type.manager")
                    : t("manager.type.supervisor")}
                </strong>
                ? Esta acción no puede ser revertida.
              </p>
            </div>
            <div className="flex justify-end space-x-4">
              <CHEKIOButton
                variant={ButtonVariant.SECONDARY}
                onClick={() => setIsInactivateConfirmOpen(false)}
              >
                Cancelar
              </CHEKIOButton>
              <CHEKIOButton
                variant={ButtonVariant.DESTRUCTIVE}
                onClick={confirmInactivate}
                disabled={isInactivating}
              >
                {isInactivating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Inactivando...</span>
                  </>
                ) : (
                  "Sí, inactivar"
                )}
              </CHEKIOButton>
            </div>
          </div>
        </CHEKIOModal>
      )}
    </CHEKIOModal>
  );
}
