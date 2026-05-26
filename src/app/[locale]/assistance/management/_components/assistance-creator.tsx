"use client";

import CarDatePicker from "@/components/ui/datePicker";
import SystemSelect from "@/components/ui/select";
import SystemInput from "@/components/ui/system-input";
import { useCookieSession } from "@/context/useCookieSession";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateBulkAssistances,
  useGetBranches,
  useGetEmployees,
  useGetJobs,
} from "@/service/mantainer.service";
import {
  CHEKIOButton,
  CHEKIOModal,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Collapse,
} from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import {
  Filter,
  Loader2,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { EmployeeResponseDto } from "../../../mantainers/employees/_components/employee.dto";
import OrganizationSelector from "../../../mantainers/employees/_components/organization-selector";

interface AssistanceCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLoadingText?: string;
}

interface AssistanceFormData {
  dateType: "single" | "range" | "multiple";
  singleDate: string | Date;
  startDate: string | Date;
  endDate: string | Date;
  multipleDates: (string | Date)[];
}

interface EmployeeFilters {
  search: string;
  documentNumber: string;
  personType: "EMPLOYEE" | "STUDENT" | undefined;
  jobId: string | undefined;
  branchId: string | undefined;
  organizationId: string | undefined;
}

const getPersonTypeLabel = (personType?: "EMPLOYEE" | "STUDENT") => {
  if (personType === "STUDENT") return "Estudiante";
  return "Empleado";
};

const isEmployeeActiveForAssistance = (employee: EmployeeResponseDto) => {
  if (!employee.isActive) return false;
  if (!employee.endDate) return true;
  const end = new Date(employee.endDate);
  const today = new Date();
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return end >= today;
};

const shouldIncludeInDefaultList = (employee: EmployeeResponseDto) =>
  isEmployeeActiveForAssistance(employee);

const AssistanceCreatorModal = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Crear Registro de Asistencia",
  message = "Seleccione los empleados y las fechas para crear el registro de asistencia:",
  buttonText = "Crear Registro",
  buttonLoadingText = "Creando...",
}: AssistanceCreatorModalProps) => {
  const { companyId } = useCookieSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<
    EmployeeResponseDto[]
  >([]);
  const [isEmployeeSelectVisible, setIsEmployeeSelectVisible] = useState(true);
  const [employees, setEmployees] = useState<EmployeeResponseDto[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<
    EmployeeResponseDto[]
  >([]);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [selectedDates, setSelectedDates] = useState<(string | Date)[]>([]);
  const { mutateAsync: createBulkAssistances } = useCreateBulkAssistances();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssistanceFormData>({
    defaultValues: {
      dateType: "single",
      singleDate: "",
      startDate: "",
      endDate: "",
      multipleDates: [],
    },
  });

  const {
    control: filterControl,
    watch: watchFilters,
    setValue: setFilterValue,
    reset: resetFilters,
  } = useForm<EmployeeFilters>({
    defaultValues: {
      search: "",
      documentNumber: "",
      personType: undefined,
      jobId: undefined,
      branchId: undefined,
      organizationId: undefined,
    },
  });

  // Watch filter values
  const searchFilter = watchFilters("search");
  const documentNumberFilter = watchFilters("documentNumber");
  const personTypeFilter = watchFilters("personType");
  const jobIdFilter = watchFilters("jobId");
  const branchIdFilter = watchFilters("branchId");

  // Watch form values
  const dateType = watch("dateType");
  const singleDate = watch("singleDate");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const multipleDates = watch("multipleDates");

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

  const { data: employeesData, isLoading: isLoadingEmployees } =
    useGetEmployees({
      page: 1,
      pageSize: 1000, // Increased to get more employees
      sort: "asc",
      companyId: companyId!,
      search: searchFilter,
      documentNumber: documentNumberFilter,
      personType: personTypeFilter,
      jobId: jobIdFilter,
      branchId: branchIdFilter,
    });

  useEffect(() => {
    if (employeesData?.data) {
      const baseEmployees =
        personTypeFilter === undefined
          ? employeesData.data.filter(shouldIncludeInDefaultList)
          : employeesData.data;
      setEmployees(baseEmployees);
      setFilteredEmployees(baseEmployees);
    }
  }, [employeesData, personTypeFilter]);

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (searchFilter) count++;
    if (documentNumberFilter) count++;
    if (personTypeFilter) count++;
    if (jobIdFilter) count++;
    if (branchIdFilter) count++;
    setActiveFiltersCount(count);
  }, [searchFilter, documentNumberFilter, personTypeFilter, jobIdFilter, branchIdFilter]);

  // Generate dates based on selected type
  useEffect(() => {
    const generateDates = () => {
      let dates: (string | Date)[] = [];

      if (dateType === "single" && singleDate) {
        dates = [singleDate];
      } else if (dateType === "range" && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const current = new Date(start);

        while (current <= end) {
          dates.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      } else if (dateType === "multiple") {
        dates = multipleDates || [];
      }

      setSelectedDates(dates);
    };

    generateDates();
  }, [dateType, singleDate, startDate, endDate, multipleDates]);

  const handleClose = () => {
    reset();
    resetFilters();
    setSelectedEmployees([]);
    setSelectedDates([]);
    setIsEmployeeSelectVisible(true);
    setIsPending(false);
    setIsFiltersExpanded(false);
    onClose();
  };

  const handleContinue = () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Por favor seleccione al menos un empleado",
        variant: "destructive",
      });
      return;
    }
    setIsEmployeeSelectVisible(false);
  };

  const handleBackToEmployeeSelect = () => {
    setIsEmployeeSelectVisible(true);
  };

  const handleEmployeeSelection = (employeeId: string, selected: boolean) => {
    if (selected) {
      const employee = employees.find((e) => e.publicId === employeeId);
      if (employee) {
        setSelectedEmployees((prev) => [...prev, employee]);
      }
    } else {
      setSelectedEmployees((prev) =>
        prev.filter((e) => e.publicId !== employeeId)
      );
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedEmployees(employees);
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleFilterChange = (field: keyof EmployeeFilters, value: any) => {
    setFilterValue(field, value);
  };

  const handleClearFilters = () => {
    resetFilters();
  };

  const handleAddDate = () => {
    const today = new Date();
    const newDate = today.toISOString().split("T")[0];
    setValue("multipleDates", [...(multipleDates || []), newDate]);
  };

  const handleRemoveDate = (index: number) => {
    const updatedDates = [...(multipleDates || [])];
    updatedDates.splice(index, 1);
    setValue("multipleDates", updatedDates);
  };


  const onSubmit = async (_data: AssistanceFormData) => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un empleado",
        variant: "destructive",
      });
      return;
    }

    if (selectedDates.length === 0) {
      toast({
        title: "Error",
        description: "Por favor seleccione al menos una fecha",
        variant: "destructive",
      });
      return;
    }

    setIsPending(true);

    try {
      const payload = {
        employeePublicIds: selectedEmployees.map((employee) => employee.publicId),
        dates: selectedDates.map((date) =>
          new Date(date).toLocaleDateString("en-CA")
        ),
      };

      const result = await createBulkAssistances(payload);
      const totalRequested =
        selectedEmployees.length * selectedDates.length;

      toast({
        title: "Registros creados",
        description: `Se crearon ${result.createdCount} de ${totalRequested} registros (${result.skippedCount} ya existían).`,
      });

      // Invalidar consultas para actualizar los datos
      queryClient.invalidateQueries({
        queryKey: ["GetAllAssistancesIncomplete"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetAllAssistancesWithoutSchedule"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetAllAssistancesCompleted"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetAllAssistancesAbsent"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetAssistanceCount"],
      });

      setIsPending(false);
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.message || "Error al crear los registros de asistencia",
        variant: "destructive",
      });
      setIsPending(false);
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={isPending ? () => {} : handleClose}
      title={title}
      size={isEmployeeSelectVisible ? "7xl" : "4xl"}
    >
      {isEmployeeSelectVisible ? (
        // Paso 1: Selección de empleados con filtros avanzados
        <div className="space-y-6 py-4">
          {/* Filtros avanzados */}
          <div className="bg-gray-50 rounded-none p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-800">
                  Filtros de Búsqueda
                </h3>
                {activeFiltersCount > 0 && (
                  <Badge count={activeFiltersCount} color="blue" />
                )}
              </div>
              <div className="flex gap-2">
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                  className="rounded-none"
                >
                  {isFiltersExpanded ? "Ocultar" : "Mostrar"} Filtros
                </CHEKIOButton>
                {activeFiltersCount > 0 && (
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={handleClearFilters}
                    className="rounded-none"
                  >
                    <X className="h-4 w-4" />
                    Limpiar
                  </CHEKIOButton>
                )}
              </div>
            </div>

            <Collapse
              activeKey={isFiltersExpanded ? ["filters"] : []}
              onChange={(keys) => setIsFiltersExpanded(keys.length > 0)}
              ghost
            >
              <Collapse.Panel
                key="filters"
                showArrow={false}
                header={null}
                className="border-0"
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <SystemInput
                    attribute="search"
                    label="Buscar"
                    control={filterControl}
                    value={searchFilter}
                    placeholder="Buscar por Nombres o Apellidos"
                    onChange={(value) => handleFilterChange("search", value)}
                    errors={{}}
                  />
                  <SystemInput
                    attribute="documentNumber"
                    label="Número de Documento"
                    control={filterControl}
                    value={documentNumberFilter}
                    placeholder="Buscar por Número de Documento"
                    onChange={(value) =>
                      handleFilterChange("documentNumber", value)
                    }
                    errors={{}}
                  />
                  <SystemSelect
                    attribute="personType"
                    label="Tipo de Persona"
                    control={filterControl}
                    value={personTypeFilter}
                    placeholder="Todos"
                    onChange={(value) =>
                      handleFilterChange("personType", value)
                    }
                    options={[
                      { value: "EMPLOYEE", label: "Empleado" },
                      { value: "STUDENT", label: "Estudiante" },
                    ]}
                    showClear={personTypeFilter !== undefined}
                    onClear={() => setFilterValue("personType", undefined)}
                  />
                  <SystemSelect
                    attribute="jobId"
                    label="Cargo"
                    control={filterControl}
                    value={jobIdFilter}
                    placeholder="Seleccionar Cargo"
                    onChange={(value) => handleFilterChange("jobId", value)}
                    options={
                      jobs?.data.map((job: any) => ({
                        value: job.publicId,
                        label: job.name,
                      })) || []
                    }
                    showClear={jobIdFilter !== undefined}
                    onClear={() => setFilterValue("jobId", undefined)}
                  />
                  <SystemSelect
                    attribute="branchId"
                    label="Sucursal"
                    control={filterControl}
                    value={branchIdFilter}
                    placeholder="Seleccionar Sucursal"
                    onChange={(value) => handleFilterChange("branchId", value)}
                    options={
                      branches?.data.map((branch: any) => ({
                        value: branch.publicId,
                        label: branch.name,
                      })) || []
                    }
                    showClear={branchIdFilter !== undefined}
                    onClear={() => setFilterValue("branchId", undefined)}
                  />
                </div>

                {companyId && (
                  <div className="mt-4">
                    <OrganizationSelector
                      control={filterControl}
                      name="organizationId"
                      companyId={companyId}
                    />
                  </div>
                )}
              </Collapse.Panel>
            </Collapse>
          </div>

          {/* Información de resultados */}
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-none">
            <div className="flex items-center gap-4">
              <span className="text-sm text-blue-700">
                <strong>{employees.length}</strong> empleados encontrados
              </span>
              <span className="text-sm text-blue-700">
                <strong>{selectedEmployees.length}</strong> empleados
                seleccionados
              </span>
            </div>
            <div className="flex gap-2">
              <CHEKIOButton
                variant="primary"
                onClick={() => setSelectedEmployees(employees)}
                disabled={employees.length === 0}
                className="rounded-none"
              >
                Seleccionar Todos
              </CHEKIOButton>
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={() => setSelectedEmployees([])}
                disabled={selectedEmployees.length === 0}
                className="rounded-none"
              >
                Deseleccionar Todos
              </CHEKIOButton>
            </div>
          </div>

          {/* Tabla de empleados */}
          {isLoadingEmployees ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="border rounded-none overflow-hidden max-h-[400px] overflow-y-auto">
              <CHEKIOTable>
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedEmployees.length > 0 &&
                          selectedEmployees.length === employees.length &&
                          employees.length > 0
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded"
                      />
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>Código</CHEKIOTableHead>
                    <CHEKIOTableHead>Documento</CHEKIOTableHead>
                    <CHEKIOTableHead>Nombre</CHEKIOTableHead>
                    <CHEKIOTableHead>Tipo</CHEKIOTableHead>
                    <CHEKIOTableHead>Email</CHEKIOTableHead>
                    <CHEKIOTableHead>Cargo</CHEKIOTableHead>
                    <CHEKIOTableHead>Sucursal</CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {employees.length === 0 ? (
                    <CHEKIOTableRow index={0}>
                      <CHEKIOTableCell
                        colSpan={8}
                        className="text-center py-10"
                      >
                        <p className="text-gray-600 font-medium">
                          No se encontraron empleados
                        </p>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ) : (
                    employees.map((employee, index) => (
                      <CHEKIOTableRow key={employee.publicId} index={index}>
                        <CHEKIOTableCell>
                          <input
                            type="checkbox"
                            checked={selectedEmployees.some(
                              (e) => e.publicId === employee.publicId
                            )}
                            onChange={(e) =>
                              handleEmployeeSelection(
                                employee.publicId,
                                e.target.checked
                              )
                            }
                            className="rounded"
                          />
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>{employee.code}</CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {employee.documentNumber}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {employee.firstName} {employee.lastName}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              employee.personType === "STUDENT"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {getPersonTypeLabel(employee.personType)}
                          </span>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>{employee.workEmail || employee.personalEmail || "-"}</CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {employee.jobId
                            ? jobs?.data.find((j: any) => j.publicId === employee.jobId)?.name || "-"
                            : "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {employee.branchId
                            ? branches?.data.find((b: any) => b.publicId === employee.branchId)?.name || "-"
                            : "-"}
                        </CHEKIOTableCell>
                      </CHEKIOTableRow>
                    ))
                  )}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-4 mt-4">
            <CHEKIOButton variant="secondaryBlue" onClick={handleClose} className="rounded-none">
              <X className="h-4 w-4" />
              Cancelar
            </CHEKIOButton>
            <CHEKIOButton
              variant="primary"
              onClick={handleContinue}
              disabled={selectedEmployees.length === 0}
              className="rounded-none"
            >
              Continuar ({selectedEmployees.length} empleados)
            </CHEKIOButton>
          </div>
        </div>
      ) : (
        // Paso 2: Formulario de fecha
        <div className="space-y-6 py-4">
          <div className="bg-gray-50 p-4 rounded-none">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Configuración del Registro
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Tipo de selección de fecha */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700">
                  Tipo de Selección de Fecha
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="single"
                      checked={dateType === "single"}
                      onChange={(e) =>
                        setValue(
                          "dateType",
                          e.target.value as "single" | "range" | "multiple"
                        )
                      }
                      className="text-blue-600"
                    />
                    <span>Fecha Única</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="range"
                      checked={dateType === "range"}
                      onChange={(e) =>
                        setValue(
                          "dateType",
                          e.target.value as "single" | "range" | "multiple"
                        )
                      }
                      className="text-blue-600"
                    />
                    <span>Rango de Fechas</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="multiple"
                      checked={dateType === "multiple"}
                      onChange={(e) =>
                        setValue(
                          "dateType",
                          e.target.value as "single" | "range" | "multiple"
                        )
                      }
                      className="text-blue-600"
                    />
                    <span>Fechas Múltiples</span>
                  </label>
                </div>
              </div>

              {/* Fecha única */}
              {dateType === "single" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Fecha del Registro
                  </label>
                  <Controller
                    name="singleDate"
                    control={control}
                    rules={{
                      required:
                        dateType === "single"
                          ? "Por favor seleccione una fecha"
                          : false,
                    }}
                    render={({ field }) => (
                      <CarDatePicker
                        control={control}
                        label=""
                        atribute="singleDate"
                        errors={errors}
                        rules={{
                          required:
                            dateType === "single"
                              ? "Por favor seleccione una fecha"
                              : false,
                        }}
                      />
                    )}
                  />
                  {errors.singleDate && (
                    <p className="text-red-500 text-xs">
                      {errors.singleDate.message}
                    </p>
                  )}
                </div>
              )}

              {/* Rango de fechas */}
              {dateType === "range" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Fecha de Inicio
                    </label>
                    <Controller
                      name="startDate"
                      control={control}
                      rules={{
                        required:
                          dateType === "range"
                            ? "Por favor seleccione la fecha de inicio"
                            : false,
                      }}
                      render={({ field }) => (
                        <CarDatePicker
                          control={control}
                          label=""
                          atribute="startDate"
                          errors={errors}
                          rules={{
                            required:
                              dateType === "range"
                                ? "Por favor seleccione la fecha de inicio"
                                : false,
                          }}
                        />
                      )}
                    />
                    {errors.startDate && (
                      <p className="text-red-500 text-xs">
                        {errors.startDate.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Fecha de Fin
                    </label>
                    <Controller
                      name="endDate"
                      control={control}
                      rules={{
                        required:
                          dateType === "range"
                            ? "Por favor seleccione la fecha de fin"
                            : false,
                      }}
                      render={({ field }) => (
                        <CarDatePicker
                          control={control}
                          label=""
                          atribute="endDate"
                          errors={errors}
                          rules={{
                            required:
                              dateType === "range"
                                ? "Por favor seleccione la fecha de fin"
                                : false,
                          }}
                        />
                      )}
                    />
                    {errors.endDate && (
                      <p className="text-red-500 text-xs">
                        {errors.endDate.message}
                      </p>
                    )}
                    {startDate &&
                      endDate &&
                      new Date(endDate) < new Date(startDate) && (
                        <p className="text-red-500 text-xs">
                          La fecha de fin debe ser posterior a la fecha de
                          inicio
                        </p>
                      )}
                  </div>
                </div>
              )}

              {/* Fechas múltiples */}
              {dateType === "multiple" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Fechas del Registro
                    </label>
                    <button
                      type="button"
                      onClick={handleAddDate}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-none hover:bg-blue-200 transition-colors"
                    >
                      Agregar Fecha
                    </button>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(multipleDates || []).map((date, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-2 rounded-none border"
                      >
                        <Controller
                          name={`multipleDates.${index}`}
                          control={control}
                          rules={{
                            required: "Por favor seleccione una fecha",
                          }}
                          render={({ field }) => (
                            <CarDatePicker
                              control={control}
                              label=""
                              atribute={`multipleDates.${index}`}
                              errors={errors}
                              rules={{
                                required: "Por favor seleccione una fecha",
                              }}
                            />
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDate(index)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <CloseCircleOutlined />
                        </button>
                      </div>
                    ))}
                  </div>

                  {errors.multipleDates && (
                    <p className="text-red-500 text-xs">
                      {errors.multipleDates.message}
                    </p>
                  )}
                </div>
              )}

              {/* Resumen de fechas seleccionadas */}
              {selectedDates.length > 0 && (
                <div className="bg-green-50 p-4 rounded-none">
                  <h4 className="font-medium text-green-700 mb-2">
                    Fechas Seleccionadas ({selectedDates.length})
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedDates.map((date, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-2 rounded-none border"
                      >
                        <span className="text-sm">
                          {new Date(date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen de empleados seleccionados */}
              <div className="bg-blue-50 p-4 rounded-none">
                <h4 className="font-medium text-blue-700 mb-2">
                  Empleados Seleccionados ({selectedEmployees.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedEmployees.map((employee) => (
                    <div
                      key={employee.publicId}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <div>
                        <span className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {employee.documentNumber}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({getPersonTypeLabel(employee.personType)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleEmployeeSelection(employee.publicId, false)
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <CloseCircleOutlined />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen total */}
              {selectedDates.length > 0 && selectedEmployees.length > 0 && (
                <div className="bg-purple-50 p-4 rounded-none">
                  <h4 className="font-medium text-purple-700 mb-2">
                    Resumen Total
                  </h4>
                  <div className="text-sm text-purple-600">
                    <p>
                      Se crearán{" "}
                      <strong>
                        {selectedEmployees.length * selectedDates.length}
                      </strong>{" "}
                      registros de asistencia
                    </p>
                    <p>
                      • {selectedEmployees.length} empleados ×{" "}
                      {selectedDates.length} fechas
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={handleBackToEmployeeSelect}
                  className="rounded-none"
                >
                  Volver
                </CHEKIOButton>
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={handleClose}
                  disabled={isPending}
                  className="rounded-none"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </CHEKIOButton>
                <CHEKIOButton
                  variant="primary"
                  type="submit"
                  disabled={isPending || selectedDates.length === 0}
                  className="rounded-none"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {buttonLoadingText}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      {buttonText}
                    </>
                  )}
                </CHEKIOButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </CHEKIOModal>
  );
};

export default AssistanceCreatorModal;
