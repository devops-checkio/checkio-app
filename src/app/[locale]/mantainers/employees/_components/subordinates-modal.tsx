"use client";

import {
  EmployeeManagerResponseDto,
  EmployeeManagerSubordinateDto,
  EmployeeResponseDto,
} from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import OrganizationSelector from "@/app/[locale]/mantainers/employees/_components/organization-selector";
import {
  CHEKIOActionButton,
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOLoading,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { CheckioInputDate } from "@/components/ui/checkio-input-date";
import { useCookieSession } from "@/context/useCookieSession";
import { PaginationFilterDto } from "@/dto/pagination";
import { useToast } from "@/hooks/use-toast";
import {
  useAssignSubordinate,
  useGetBranches,
  useGetEmployeeManagers,
  useGetEmployees,
  useGetJobs,
} from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  SECONDARY_BLUE = "secondaryBlue",
  SEARCH = "search",
  DESTRUCTIVE = "destructive",
}

interface Subordinate {
  subordinateId: string;
  employeeName?: string;
  startDate: string;
  endDate: string | null;
}

interface SubordinatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  onSuccess: () => void;
}

export default function SubordinatesModal({
  isOpen,
  onClose,
  employeeId,
  onSuccess,
}: SubordinatesModalProps) {
  const { toast } = useToast();
  const t = useTranslations("mantainers.employees");
  const { companyId } = useCookieSession();
  const queryClient = useQueryClient();
  const [selectedEmployees, setSelectedEmployees] = useState<
    EmployeeResponseDto[]
  >([]);
  const [subordinates, setSubordinates] = useState<Subordinate[]>([]);
  const [isEmployeeSelectorOpen, setIsEmployeeSelectorOpen] = useState(false);

  // Employee selector modal state
  const [employeeSelectorPagination, setEmployeeSelectorPagination] =
    useState<PaginationFilterDto>({
      current: 1,
      pageSize: 15,
      next: null,
      previous: null,
      totalPages: 1,
      totalCount: 0,
      sort: "desc" as "asc" | "desc",
    });

  // Get current managers to exclude them from subordinate selection
  const { data: managersData } = useGetEmployeeManagers(employeeId, {
    page: 1,
    pageSize: 100,
    sort: "desc",
  });

  const { mutate: assignSubordinate, isPending: isSubmitting } =
    useAssignSubordinate();

  // Get excluded employee IDs (current managers)
  const excludedEmployeeIds = [
    employeeId, // Exclude current employee
    ...(managersData?.data?.map(
      (manager: EmployeeManagerResponseDto) => manager.publicId,
    ) || []), // Exclude current managers
  ];

  // Form for employee search filters
  const {
    control: filterControl,
    watch: watchFilters,
    setValue: setFilterValue,
    reset: resetFilters,
  } = useForm({
    defaultValues: {
      search: "",
      documentNumber: "",
      jobId: undefined,
      branchId: undefined,
      subUnit1Id: undefined,
      subUnit2Id: undefined,
      subUnit3Id: undefined,
      subUnit4Id: undefined,
      subUnit5Id: undefined,
      subUnit6Id: undefined,
      subUnit7Id: undefined,
      subUnit8Id: undefined,
    },
  });

  // Get data for filters
  const { data: jobs } = useGetJobs({
    page: 1,
    pageSize: 200,
    sort: "asc",
  });

  const { data: branches } = useGetBranches({
    page: 1,
    pageSize: 200,
    sort: "asc",
  });

  // Watch filter values
  const searchFilter = watchFilters("search");
  const documentNumberFilter = watchFilters("documentNumber");
  const jobIdFilter = watchFilters("jobId");
  const branchIdFilter = watchFilters("branchId");

  // Watch organization filter values
  const subUnit1Id = watchFilters("subUnit1Id");
  const subUnit2Id = watchFilters("subUnit2Id");
  const subUnit3Id = watchFilters("subUnit3Id");
  const subUnit4Id = watchFilters("subUnit4Id");
  const subUnit5Id = watchFilters("subUnit5Id");
  const subUnit6Id = watchFilters("subUnit6Id");
  const subUnit7Id = watchFilters("subUnit7Id");
  const subUnit8Id = watchFilters("subUnit8Id");

  // Get employees with filters (only when modal is open)
  const { data: employeesData, isLoading: isLoadingEmployees } =
    useGetEmployees({
      page: employeeSelectorPagination.current,
      pageSize: employeeSelectorPagination.pageSize,
      sort: employeeSelectorPagination.sort,
      search: searchFilter,
      companyId: companyId || "",
      status: "active",
      documentNumber: documentNumberFilter,
      jobId: jobIdFilter,
      branchId: branchIdFilter,
      subUnit1Id: subUnit1Id,
      subUnit2Id: subUnit2Id,
      subUnit3Id: subUnit3Id,
      subUnit4Id: subUnit4Id,
      subUnit5Id: subUnit5Id,
      subUnit6Id: subUnit6Id,
      subUnit7Id: subUnit7Id,
      subUnit8Id: subUnit8Id,
    });

  useEffect(() => {
    if (employeesData?.pagination) {
      setEmployeeSelectorPagination(employeesData.pagination);
    }
  }, [employeesData]);

  const handleEmployeeSelectorPageChange = useCallback((newPage: number) => {
    setEmployeeSelectorPagination((prev) => ({
      ...prev,
      current: newPage,
    }));
  }, []);

  const handleEmployeeSelectorPageSizeChange = useCallback(
    (newPageSize: number) => {
      setEmployeeSelectorPagination((prev) => ({
        ...prev,
        pageSize: newPageSize,
        current: 1,
      }));
    },
    [],
  );

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setFilterValue("search", value);
    setEmployeeSelectorPagination((prev) => ({ ...prev, current: 1 }));
  }, 400);

  const debouncedDocumentNumber = useDebouncedCallback((value: string) => {
    setFilterValue("documentNumber", value);
    setEmployeeSelectorPagination((prev) => ({ ...prev, current: 1 }));
  }, 400);

  const handleClearFilters = () => {
    resetFilters();
    setEmployeeSelectorPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleEmployeeSelection = (employeeId: string, selected: boolean) => {
    if (selected) {
      const employee = employeesData?.data.find(
        (e) => e.publicId === employeeId,
      );
      if (employee && !excludedEmployeeIds.includes(employee.publicId)) {
        setSelectedEmployees((prev) => [...prev, employee]);
      }
    } else {
      setSelectedEmployees((prev) =>
        prev.filter((e) => e.publicId !== employeeId),
      );
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const availableEmployees =
        employeesData?.data.filter(
          (e) => !excludedEmployeeIds.includes(e.publicId),
        ) || [];
      setSelectedEmployees(availableEmployees);
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleCloseEmployeeSelector = () => {
    setIsEmployeeSelectorOpen(false);
    setSelectedEmployees([]);
    resetFilters();
  };

  const handleAddSubordinates = () => {
    const today = new Date().toISOString().split("T")[0];
    const newSubordinates = selectedEmployees
      .filter(
        (emp) =>
          !subordinates.some((sub) => sub.subordinateId === emp.publicId),
      )
      .map((emp) => ({
        subordinateId: emp.publicId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        startDate: today,
        endDate: null,
      }));

    setSubordinates([...subordinates, ...newSubordinates]);
    setSelectedEmployees([]);
    setIsEmployeeSelectorOpen(false);
  };

  const handleRemoveSubordinate = (subordinateId: string) => {
    setSubordinates(
      subordinates.filter((sub) => sub.subordinateId !== subordinateId),
    );
  };

  const handleDateChange = (
    subordinateId: string,
    field: "startDate" | "endDate",
    date: string | null,
  ) => {
    setSubordinates(
      subordinates.map((sub) =>
        sub.subordinateId === subordinateId
          ? { ...sub, [field]: date || null }
          : sub,
      ),
    );
  };

  const handleSubmit = () => {
    try {
      const subordinatesArray: EmployeeManagerSubordinateDto[] = [];

      for (const sub of subordinates) {
        if (!sub.startDate) {
          throw new Error("Start date is required");
        }

        // Convert start date to ISO string
        const startDate = DateTime.fromISO(sub.startDate)
          .setZone("utc", { keepLocalTime: true })
          .toISO();

        if (!startDate) {
          throw new Error("Could not format start date");
        }

        // Create subordinate object with required format
        const subordinateObj: EmployeeManagerSubordinateDto = {
          subordinateId: sub.subordinateId,
          startDate: startDate,
          endDate: undefined,
        };

        // Add end date if it exists
        if (sub.endDate) {
          const endDate = DateTime.fromISO(sub.endDate)
            .setZone("utc", { keepLocalTime: true })
            .toISO();

          if (endDate) {
            subordinateObj.endDate = endDate;
          }
        }

        subordinatesArray.push(subordinateObj);
      }

      assignSubordinate(
        {
          id: employeeId,
          employeeManagerSubordinateCreateDto: {
            subordinates: subordinatesArray,
          },
        },
        {
          onSuccess: (response) => {
            // Handle response that may contain warnings
            if (
              response &&
              typeof response === "object" &&
              "warnings" in response
            ) {
              const { success, warnings } = response as {
                success: any[];
                warnings: string[];
              };
              if (success.length > 0) {
                toast({
                  title: "Éxito parcial",
                  description: `${
                    success.length
                  } subordinado(s) agregado(s) correctamente. ${
                    warnings.length > 0
                      ? `Advertencias: ${warnings.join(", ")}`
                      : ""
                  }`,
                  variant: warnings.length > 0 ? "default" : "default",
                });
              }
              if (warnings.length > 0) {
                warnings.forEach((warning) => {
                  toast({
                    title: "Advertencia",
                    description: warning,
                    variant: "default",
                  });
                });
              }
            } else {
              toast({
                title: "Éxito",
                description: "Subordinados agregados correctamente",
              });
            }
            queryClient.invalidateQueries({
              queryKey: ["GetEmployeeSubordinates", employeeId],
            });
            onSuccess();
            onClose();
            // Reset form
            setSubordinates([]);
            setSelectedEmployees([]);
          },
          onError: (error) => {
            console.error("Error saving subordinates:", error);
            if (axios.isAxiosError(error)) {
              const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Ocurrió un error al guardar los subordinados";

              toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
              });
            } else {
              toast({
                title: "Error",
                description:
                  "Ocurrió un error desconocido al guardar los subordinados",
                variant: "destructive",
              });
            }
          },
        },
      );
    } catch (error) {
      console.error("Error preparing subordinates data:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error desconocido al preparar los datos",
        variant: "destructive",
      });
    }
  };

  const employees = employeesData?.data || [];
  const paginationData =
    employeesData?.pagination || employeeSelectorPagination;
  const allSelected =
    selectedEmployees.length > 0 &&
    employees.filter((e) => !excludedEmployeeIds.includes(e.publicId)).length >
      0 &&
    selectedEmployees.length ===
      employees.filter((e) => !excludedEmployeeIds.includes(e.publicId)).length;

  return (
    <>
      <CHEKIOModal
        isOpen={isOpen}
        onClose={onClose}
        title={t("subordinates.title")}
        size="6xl"
      >
        <div className="space-y-6 p-6">
          {/* Información Importante */}
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-blue-700 mb-2">
              Información Importante
            </h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>
                Seleccione uno o más empleados usando el botón
                &quot;Buscar&quot;
              </li>
              <li>
                Haga clic en &quot;Agregar a la Lista&quot; para incluirlos en
                la tabla de subordinados
              </li>
              <li>
                Configure la fecha de inicio para cada subordinado (requerida)
              </li>
              <li>
                La fecha de término es opcional (deje en blanco para relaciones
                indefinidas)
              </li>
              <li>
                No se pueden agregar empleados que ya están asignados con la
                misma fecha de inicio
              </li>
            </ul>
          </div>

          {/* Sección de Búsqueda y Selección */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Empleados
                </label>
                <CHEKIOInput
                  type="text"
                  readOnly
                  className="bg-white"
                  placeholder={
                    selectedEmployees.length > 0
                      ? `${selectedEmployees.length} empleado${
                          selectedEmployees.length !== 1 ? "s" : ""
                        } seleccionado${
                          selectedEmployees.length !== 1 ? "s" : ""
                        }`
                      : "Seleccione empleados para agregar como subordinados"
                  }
                  value={
                    selectedEmployees.length > 0
                      ? selectedEmployees
                          .map((emp) => `${emp.firstName} ${emp.lastName}`)
                          .join(", ")
                      : ""
                  }
                />
              </div>
              <div className="md:col-span-4 flex items-end gap-2">
                <CHEKIOButton
                  variant={ButtonVariant.SEARCH}
                  type="button"
                  onClick={() => setIsEmployeeSelectorOpen(true)}
                  className="flex-1"
                >
                  <Search className="h-4 w-4" />
                  Buscar
                </CHEKIOButton>
                <CHEKIOButton
                  variant={ButtonVariant.PRIMARY}
                  type="button"
                  onClick={handleAddSubordinates}
                  disabled={selectedEmployees.length === 0}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4" />
                  Agregar ({selectedEmployees.length})
                </CHEKIOButton>
              </div>
            </div>
          </div>

          {/* Tabla de Subordinados - Siempre visible */}
          <div className="space-y-4">
            {subordinates.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  {subordinates.length} subordinado(s) listo(s) para agregar
                </p>
              </div>
            )}
            <CHEKIOTable>
              <CHEKIOTableHeader>
                <tr>
                  <CHEKIOTableHead>Nombre del Empleado</CHEKIOTableHead>
                  <CHEKIOTableHead>Fecha Inicio *</CHEKIOTableHead>
                  <CHEKIOTableHead>Fecha Fin (Opcional)</CHEKIOTableHead>
                  <CHEKIOTableHead>Acciones</CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {subordinates.length > 0 ? (
                  subordinates.map((sub, index) => (
                    <CHEKIOTableRow key={sub.subordinateId} index={index}>
                      <CHEKIOTableCell className="font-medium">
                        {sub.employeeName || sub.subordinateId}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <CheckioInputDate
                          value={sub.startDate}
                          onChange={(value) =>
                            handleDateChange(
                              sub.subordinateId,
                              "startDate",
                              value,
                            )
                          }
                          placeholder="dd/mm/aaaa"
                          required
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <CheckioInputDate
                          value={sub.endDate || undefined}
                          onChange={(value) =>
                            handleDateChange(
                              sub.subordinateId,
                              "endDate",
                              value || null,
                            )
                          }
                          placeholder="dd/mm/aaaa"
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <CHEKIOActionButton
                          variant="delete"
                          onClick={() =>
                            handleRemoveSubordinate(sub.subordinateId)
                          }
                          aria-label="Eliminar subordinado"
                          className="h-auto w-auto px-3 py-1.5 gap-1.5"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Eliminar</span>
                        </CHEKIOActionButton>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))
                ) : (
                  <CHEKIOTableRow index={0}>
                    <CHEKIOTableCell colSpan={4} className="text-center py-10">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium mb-2">
                        No hay subordinados agregados
                      </p>
                      <p className="text-sm text-gray-500">
                        Paso 1: Haga clic en &quot;Buscar&quot; para seleccionar
                        empleados
                      </p>
                      <p className="text-sm text-gray-500">
                        Paso 2: Haga clic en &quot;Agregar&quot; para incluirlos
                        en la lista
                      </p>
                    </CHEKIOTableCell>
                  </CHEKIOTableRow>
                )}
              </CHEKIOTableBody>
            </CHEKIOTable>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <CHEKIOButton
              variant={ButtonVariant.SECONDARY}
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </CHEKIOButton>
            <CHEKIOButton
              variant={ButtonVariant.PRIMARY}
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || subordinates.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Guardar</span>
                </>
              )}
            </CHEKIOButton>
          </div>
        </div>
      </CHEKIOModal>

      {/* Employee Selector Modal with Advanced Filters */}
      <CHEKIOModal
        isOpen={isEmployeeSelectorOpen}
        onClose={handleCloseEmployeeSelector}
        title={t("subordinates.selectSubordinates")}
        size="6xl"
      >
        <div className="space-y-6 py-4">
          {/* Filters Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <CHEKIOInput
                    placeholder="Buscar por Nombres o Apellidos"
                    className="pl-10"
                    onChange={(e) => debouncedSearch(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Documento
                </label>
                <CHEKIOInput
                  placeholder="Buscar por Número de Documento"
                  onChange={(e) => debouncedDocumentNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <Controller
                  name="jobId"
                  control={filterControl}
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setEmployeeSelectorPagination((prev) => ({
                          ...prev,
                          current: 1,
                        }));
                      }}
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue placeholder="Seleccionar Cargo" />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        <CHEKIOSelectItem value="undefined">
                          Todos
                        </CHEKIOSelectItem>
                        {jobs?.data.map((job: any) => (
                          <CHEKIOSelectItem
                            key={job.publicId}
                            value={job.publicId}
                          >
                            {job.name}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sucursal
                </label>
                <Controller
                  name="branchId"
                  control={filterControl}
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setEmployeeSelectorPagination((prev) => ({
                          ...prev,
                          current: 1,
                        }));
                      }}
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue placeholder="Seleccionar Sucursal" />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        <CHEKIOSelectItem value="undefined">
                          Todas
                        </CHEKIOSelectItem>
                        {branches?.data.map((branch: any) => (
                          <CHEKIOSelectItem
                            key={branch.publicId}
                            value={branch.publicId}
                          >
                            {branch.name}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>
            </div>
            {companyId && (
              <div className="mt-4">
                <OrganizationSelector
                  control={filterControl}
                  name="organization"
                  companyId={companyId}
                  resetFieldsFn={(fields) => {
                    fields.forEach((field) => {
                      setFilterValue(field as any, undefined);
                    });
                    setEmployeeSelectorPagination((prev) => ({
                      ...prev,
                      current: 1,
                    }));
                  }}
                />
              </div>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <CHEKIOButton
                variant={ButtonVariant.SECONDARY_BLUE}
                type="button"
                onClick={handleClearFilters}
              >
                <X className="h-4 w-4" />
                Limpiar
              </CHEKIOButton>
            </div>
          </div>

          {/* Employees Table */}
          <div className="space-y-4">
            {isLoadingEmployees ? (
              <div className="flex justify-center py-8">
                <CHEKIOLoading
                  size="lg"
                  variant="modern"
                  text="Cargando empleados..."
                />
              </div>
            ) : (
              <>
                <CHEKIOTable>
                  <CHEKIOTableHeader>
                    <tr>
                      <CHEKIOTableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded"
                        />
                      </CHEKIOTableHead>
                      <CHEKIOTableHead>Código</CHEKIOTableHead>
                      <CHEKIOTableHead>Nombres</CHEKIOTableHead>
                      <CHEKIOTableHead>Apellidos</CHEKIOTableHead>
                      <CHEKIOTableHead>Número de Documento</CHEKIOTableHead>
                      <CHEKIOTableHead>Email</CHEKIOTableHead>
                    </tr>
                  </CHEKIOTableHeader>
                  <CHEKIOTableBody>
                    {employees.length === 0 ? (
                      <CHEKIOTableRow index={0}>
                        <CHEKIOTableCell
                          colSpan={6}
                          className="text-center py-10"
                        >
                          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium">
                            No se encontraron empleados
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            No hay empleados registrados para este filtro.
                          </p>
                        </CHEKIOTableCell>
                      </CHEKIOTableRow>
                    ) : (
                      employees
                        .filter(
                          (e) => !excludedEmployeeIds.includes(e.publicId),
                        )
                        .map((employee, index) => {
                          const isSelected = selectedEmployees.some(
                            (e) => e.publicId === employee.publicId,
                          );
                          return (
                            <CHEKIOTableRow
                              key={employee.publicId}
                              index={index}
                            >
                              <CHEKIOTableCell>
                                <div className="flex justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) =>
                                      handleEmployeeSelection(
                                        employee.publicId,
                                        e.target.checked,
                                      )
                                    }
                                    className="rounded"
                                  />
                                </div>
                              </CHEKIOTableCell>
                              <CHEKIOTableCell>
                                {employee.code || "-"}
                              </CHEKIOTableCell>
                              <CHEKIOTableCell>
                                {employee.firstName}
                              </CHEKIOTableCell>
                              <CHEKIOTableCell>
                                {employee.lastName}
                              </CHEKIOTableCell>
                              <CHEKIOTableCell>
                                {employee.documentNumber || "-"}
                              </CHEKIOTableCell>
                              <CHEKIOTableCell>
                                {employee.personalEmail || "-"}
                              </CHEKIOTableCell>
                            </CHEKIOTableRow>
                          );
                        })
                    )}
                  </CHEKIOTableBody>
                </CHEKIOTable>

                {employees.filter(
                  (e) => !excludedEmployeeIds.includes(e.publicId),
                ).length > 0 && (
                  <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">
                        Mostrando{" "}
                        {
                          employees.filter(
                            (e) => !excludedEmployeeIds.includes(e.publicId),
                          ).length
                        }{" "}
                        de {paginationData.totalCount} resultados
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          Registros por página:
                        </label>
                        <CHEKIOSelect
                          value={employeeSelectorPagination.pageSize.toString()}
                          onValueChange={(value) => {
                            handleEmployeeSelectorPageSizeChange(
                              parseInt(value, 10),
                            );
                          }}
                        >
                          <CHEKIOSelectTrigger className="w-24">
                            <CHEKIOSelectValue />
                          </CHEKIOSelectTrigger>
                          <CHEKIOSelectContent>
                            <CHEKIOSelectItem value="10">10</CHEKIOSelectItem>
                            <CHEKIOSelectItem value="15">15</CHEKIOSelectItem>
                            <CHEKIOSelectItem value="20">20</CHEKIOSelectItem>
                            <CHEKIOSelectItem value="50">50</CHEKIOSelectItem>
                          </CHEKIOSelectContent>
                        </CHEKIOSelect>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CHEKIOButton
                        variant={ButtonVariant.SECONDARY_BLUE}
                        onClick={() =>
                          handleEmployeeSelectorPageChange(
                            paginationData.current - 1,
                          )
                        }
                        disabled={paginationData.current === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </CHEKIOButton>
                      <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                        Página {paginationData.current} de{" "}
                        {paginationData.totalPages}
                      </div>
                      <CHEKIOButton
                        variant={ButtonVariant.SECONDARY_BLUE}
                        onClick={() =>
                          handleEmployeeSelectorPageChange(
                            paginationData.current + 1,
                          )
                        }
                        disabled={
                          paginationData.current >= paginationData.totalPages
                        }
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </CHEKIOButton>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <CHEKIOButton
              variant={ButtonVariant.SECONDARY}
              onClick={handleCloseEmployeeSelector}
            >
              <X className="h-4 w-4" />
              Cancelar
            </CHEKIOButton>
            <CHEKIOButton
              variant={ButtonVariant.PRIMARY}
              onClick={handleAddSubordinates}
              disabled={selectedEmployees.length === 0}
            >
              <Check className="h-4 w-4" />
              Seleccionar ({selectedEmployees.length})
            </CHEKIOButton>
          </div>
        </div>
      </CHEKIOModal>
    </>
  );
}
