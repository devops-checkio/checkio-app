"use client";

import OrganizationSelector from "@/app/[locale]/mantainers/employees/_components/organization-selector";
import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOLoading,
  CHEKIOModal,
  CHEKIOProgressBar,
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
import SystemInput from "@/components/ui/system-input";
import { useCookieSession } from "@/context/useCookieSession";
import { PaginationFilterDto } from "@/dto/pagination";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateTimeBank,
  useGetBranches,
  useGetEmployees,
  useGetJobs,
} from "@/service/mantainer.service";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { EmployeeResponseDto } from "../../employees/_components/employee.dto";
import { CreateTimeBankDto, TimeBankTypeOptions } from "./time-bank.dto";

interface EmployeeProcessingItem {
  id: string;
  employeeId: string;
  employeeName: string;
  documentNumber: string;
  timeBankType: string;
  startDate: string;
  endDate: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

interface BatchTimeBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLoadingText?: string;
}

interface TimeBankFormData {
  type: string;
  hoursPerDay: number;
  startDate: string;
  endDate: string;
  availableHours: number;
  integrationCode?: string;
}

const BatchTimeBankModal = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Creación Masiva de Bancos de Horas",
  message = "Complete los datos del banco de horas para asignar a los empleados seleccionados:",
  buttonText = "Crear Bancos",
  buttonLoadingText = "Creando...",
}: BatchTimeBankModalProps) => {
  const { companyId } = useCookieSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<
    EmployeeResponseDto[]
  >([]);
  const [isEmployeeSelectVisible, setIsEmployeeSelectVisible] = useState(true);
  const [processingItems, setProcessingItems] = useState<
    EmployeeProcessingItem[]
  >([]);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "desc" as "asc" | "desc",
  });

  const createTimeBank = useCreateTimeBank();

  // Form for employee search filters
  const { register, handleSubmit, watch, setValue, control, reset } = useForm({
    defaultValues: {
      search: "",
      documentNumber: "",
      jobId: undefined,
      branchId: undefined,
      organizationId: undefined,
    },
  });

  // Form for time bank data
  const {
    control: timeBankControl,
    handleSubmit: handleTimeBankSubmit,
    reset: resetTimeBank,
    watch: watchTimeBank,
    setValue: setTimeBankValue,
    register: registerTimeBank,
    formState: { errors },
  } = useForm<TimeBankFormData>({
    defaultValues: {
      type: "",
      hoursPerDay: 8,
      startDate: "",
      endDate: "",
      availableHours: 0,
      integrationCode: "",
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

  // Watch form values
  const branchId = watch("branchId");
  const jobId = watch("jobId");
  const documentNumber = watch("documentNumber");
  const search = watch("search");

  // Get employees with filters
  const {
    data: employeesData,
    isLoading: isLoadingEmployees,
    refetch,
  } = useGetEmployees({
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    search: watch("search"),
    companyId: companyId || "",
    status: "active", // Only show active employees
    documentNumber: watch("documentNumber"),
    jobId: watch("jobId"),
    branchId: watch("branchId"),
  });

  useEffect(() => {
    if (employeesData?.pagination) {
      setPagination(employeesData.pagination);
    }
  }, [employeesData]);

  const handleLevelChange = (
    value: string | undefined,
    field: "search" | "documentNumber" | "jobId" | "branchId" | "organizationId"
  ) => {
    setValue(field, value);
  };

  const onSubmitSearch = (data: { search: string }) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleClearSearch = () => {
    reset();
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleClose = () => {
    reset();
    resetTimeBank();
    setSelectedEmployees([]);
    setProcessingItems([]);
    setIsEmployeeSelectVisible(true);
    setIsPending(false);
    setPagination({
      current: 1,
      pageSize: 10,
      next: null,
      previous: null,
      totalPages: 1,
      totalCount: 0,
      sort: "desc" as "asc" | "desc",
    });
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
      const employee = employeesData?.data.find(
        (e) => e.publicId === employeeId
      );
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
      setSelectedEmployees(employeesData?.data || []);
    } else {
      setSelectedEmployees([]);
    }
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      current: newPage,
    }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: newPageSize,
      current: 1, // Reset to first page when changing page size
    }));
  }, []);

  const onSubmit: SubmitHandler<TimeBankFormData> = async (data) => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un empleado",
        variant: "destructive",
      });
      return;
    }

    setIsPending(true);

    // Ensure dates are in ISO format
    const formattedData = {
      ...data,
      startDate: data.startDate
        ? DateTime.fromISO(data.startDate).toISODate()
        : undefined,
      endDate: data.endDate
        ? DateTime.fromISO(data.endDate).toISODate()
        : undefined,
    };

    // Check if required dates exist
    if (!formattedData.startDate || !formattedData.endDate) {
      toast({
        title: "Error",
        description: "Por favor ingrese fechas de inicio y fin válidas",
        variant: "destructive",
      });
      setIsPending(false);
      return;
    }

    // Preparar items para procesamiento
    setProcessingItems(
      selectedEmployees.map((employee) => ({
        id: `employee-${employee.publicId}`,
        employeeId: employee.publicId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        documentNumber: employee.documentNumber,
        timeBankType:
          TimeBankTypeOptions.find((type) => type.value === data.type)?.label ||
          "N/A",
        startDate: DateTime.fromISO(String(formattedData.startDate))
          .setLocale("es")
          .toLocaleString({
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        endDate: DateTime.fromISO(String(formattedData.endDate))
          .setLocale("es")
          .toLocaleString({
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        status: "pending",
      }))
    );

    // Procesar cada empleado secuencialmente
    for (let i = 0; i < selectedEmployees.length; i++) {
      const employee = selectedEmployees[i];

      // Actualizar el estado a "procesando" para el empleado actual
      setProcessingItems((prev) =>
        prev.map((item, index) =>
          index === i ? { ...item, status: "processing" } : item
        )
      );

      try {
        const timeBankData: CreateTimeBankDto = {
          employeeId: employee.publicId,
          type: formattedData.type as any,
          hoursPerDay: formattedData.hoursPerDay,
          startDate: formattedData.startDate,
          endDate: formattedData.endDate,
          availableHours: formattedData.availableHours,
          integrationCode: formattedData.integrationCode,
        };

        await createTimeBank.mutateAsync(timeBankData);

        // Actualizar el estado a éxito
        setProcessingItems((prev) =>
          prev.map((item, index) =>
            index === i ? { ...item, status: "success" } : item
          )
        );
      } catch (error: any) {
        // Actualizar el estado a error
        setProcessingItems((prev) =>
          prev.map((item, index) =>
            index === i
              ? {
                  ...item,
                  status: "error",
                  error:
                    error?.response?.data?.message ||
                    "Error al crear el banco de horas",
                }
              : item
          )
        );
      }
    }

    const successCount = processingItems.filter(
      (item) => item.status === "success"
    ).length;
    const errorCount = processingItems.filter(
      (item) => item.status === "error"
    ).length;

    if (errorCount === 0) {
      toast({
        title: "Bancos de horas creados",
        description:
          "Los bancos de horas han sido creados correctamente para todos los empleados",
      });
    } else {
      toast({
        title: "Proceso completado con errores",
        description: `${successCount} bancos creados correctamente, ${errorCount} con errores`,
        variant: "destructive",
      });
    }

    // Invalidar consultas para actualizar los datos
    queryClient.invalidateQueries({
      queryKey: ["GetTimeBanks"],
    });

    setIsPending(false);
    onSuccess();
  };

  const renderSummary = () => {
    if (!isPending || processingItems.length === 0) return null;

    const pending = processingItems.filter(
      (item) => item.status === "pending"
    ).length;
    const processing = processingItems.filter(
      (item) => item.status === "processing"
    ).length;
    const success = processingItems.filter(
      (item) => item.status === "success"
    ).length;
    const error = processingItems.filter(
      (item) => item.status === "error"
    ).length;
    const total = processingItems.length;
    const completed = success + error;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
      <div className="mb-4">
        <CHEKIOProgressBar
          current={completed}
          total={total}
          text={`Progreso: ${progress}% (${success} completados, ${error} errores)`}
        />
        <div className="mt-2 flex gap-4 text-sm text-gray-600">
          <span>Pendientes: {pending}</span>
          <span>Procesando: {processing}</span>
          <span>Completados: {success}</span>
          <span>Errores: {error}</span>
        </div>
      </div>
    );
  };

  const timeBankTypeOptions = TimeBankTypeOptions.map((type) => ({
    value: type.value,
    label: type.label,
  }));

  const employees = employeesData?.data || [];

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={isPending ? () => {} : handleClose}
      title={title}
      size="7xl"
    >
      {isEmployeeSelectVisible ? (
        // Paso 1: Selección de empleados con filtros mejorados
        <div className="space-y-6 py-4">
          <div className="bg-white p-6">
            <div className="flex flex-col gap-4">
              <form
                onSubmit={handleSubmit(onSubmitSearch)}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Buscar por Nombres o Apellidos
                    </label>
                    <CHEKIOInput
                      type="text"
                      placeholder="Buscar por Nombres o Apellidos"
                      value={search}
                      onChange={(e) =>
                        handleLevelChange(e.target.value, "search")
                      }
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Número de Documento
                    </label>
                    <CHEKIOInput
                      type="text"
                      placeholder="Buscar por Número de Documento"
                      value={documentNumber}
                      onChange={(e) =>
                        handleLevelChange(e.target.value, "documentNumber")
                      }
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Cargo
                    </label>
                    <CHEKIOSelect
                      value={jobId ?? "all"}
                      onValueChange={(value) =>
                        handleLevelChange(value === "all" ? undefined : value, "jobId")
                      }
                    >
                      <CHEKIOSelectTrigger className="w-full">
                        <CHEKIOSelectValue placeholder="Seleccionar Cargo" />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        <CHEKIOSelectItem value="all">
                          Seleccionar Cargo
                        </CHEKIOSelectItem>
                        {jobs?.data?.map((job: { publicId: string; name: string }) => (
                          <CHEKIOSelectItem key={job.publicId} value={job.publicId}>
                            {job.name}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Sucursal
                    </label>
                    <CHEKIOSelect
                      value={branchId ?? "all"}
                      onValueChange={(value) =>
                        handleLevelChange(value === "all" ? undefined : value, "branchId")
                      }
                    >
                      <CHEKIOSelectTrigger className="w-full">
                        <CHEKIOSelectValue placeholder="Seleccionar Sucursal" />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        <CHEKIOSelectItem value="all">
                          Seleccionar Sucursal
                        </CHEKIOSelectItem>
                        {branches?.data?.map((branch: { publicId: string; name: string }) => (
                          <CHEKIOSelectItem key={branch.publicId} value={branch.publicId}>
                            {branch.name}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  </div>
                  {companyId && (
                    <div className="md:col-span-12">
                      <OrganizationSelector
                        control={control}
                        name="organizationId"
                        companyId={companyId}
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <CHEKIOButton variant="search" type="submit">
                    <Search className="h-4 w-4" />
                    Buscar
                  </CHEKIOButton>
                  <CHEKIOButton
                    variant="refresh"
                    type="button"
                    onClick={handleClearSearch}
                  >
                    Limpiar
                  </CHEKIOButton>
                </div>
              </form>
              <div className="flex flex-col">
                {isLoadingEmployees ? (
                  <div className="flex justify-center py-8">
                    <CHEKIOLoading
                      size="lg"
                      variant="modern"
                      text="Cargando empleados..."
                    />
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-600 font-medium">
                      No se encontraron resultados
                    </p>
                  </div>
                ) : (
                  <>
                    <CHEKIOTable>
                      <CHEKIOTableHeader>
                        <tr>
                          <CHEKIOTableHead>
                            <input
                              type="checkbox"
                              checked={
                                selectedEmployees.length > 0 &&
                                selectedEmployees.length === employees.length
                              }
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="rounded"
                            />
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>Código</CHEKIOTableHead>
                          <CHEKIOTableHead>Nombres</CHEKIOTableHead>
                          <CHEKIOTableHead>Apellidos</CHEKIOTableHead>
                          <CHEKIOTableHead>Número de Documento</CHEKIOTableHead>
                          <CHEKIOTableHead>Email</CHEKIOTableHead>
                          <CHEKIOTableHead>Fecha de Inicio</CHEKIOTableHead>
                          <CHEKIOTableHead>Fecha de Término</CHEKIOTableHead>
                          <CHEKIOTableHead>Tipo de Contrato</CHEKIOTableHead>
                          <CHEKIOTableHead>Horas Contratadas</CHEKIOTableHead>
                        </tr>
                      </CHEKIOTableHeader>
                      <CHEKIOTableBody>
                        {employees.map((employee, index) => (
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
                            <CHEKIOTableCell>{employee.firstName}</CHEKIOTableCell>
                            <CHEKIOTableCell>{employee.lastName}</CHEKIOTableCell>
                            <CHEKIOTableCell>
                              {employee.documentNumber}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              {employee.personalEmail}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              {employee.startDate
                                ? (employee.startDate instanceof Date
                                    ? DateTime.fromJSDate(employee.startDate)
                                    : DateTime.fromISO(String(employee.startDate))
                                  ).toFormat("dd/MM/yyyy")
                                : "-"}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              {employee.endDate
                                ? (employee.endDate instanceof Date
                                    ? DateTime.fromJSDate(employee.endDate)
                                    : DateTime.fromISO(String(employee.endDate))
                                  ).toFormat("dd/MM/yyyy")
                                : "-"}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              {employee.isIndefiniteTerm
                                ? "Indefinido"
                                : "Plazo Fijo"}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              {employee.contractedHours}
                            </CHEKIOTableCell>
                          </CHEKIOTableRow>
                        ))}
                      </CHEKIOTableBody>
                    </CHEKIOTable>

                    {employees.length > 0 && (
                      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            Mostrando {employees.length} de{" "}
                            {pagination.totalCount} resultados
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                              Registros por página:
                            </label>
                            <CHEKIOSelect
                              value={pagination.pageSize.toString()}
                              onValueChange={(value) => {
                                handlePageSizeChange(parseInt(value, 10));
                              }}
                            >
                              <CHEKIOSelectTrigger className="w-24">
                                <CHEKIOSelectValue />
                              </CHEKIOSelectTrigger>
                              <CHEKIOSelectContent>
                                <CHEKIOSelectItem value="10">10</CHEKIOSelectItem>
                                <CHEKIOSelectItem value="20">20</CHEKIOSelectItem>
                                <CHEKIOSelectItem value="50">50</CHEKIOSelectItem>
                                <CHEKIOSelectItem value="100">100</CHEKIOSelectItem>
                                <CHEKIOSelectItem value="200">200</CHEKIOSelectItem>
                              </CHEKIOSelectContent>
                            </CHEKIOSelect>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CHEKIOButton
                            variant="secondaryBlue"
                            onClick={() => handlePageChange(pagination.current - 1)}
                            disabled={pagination.current === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </CHEKIOButton>
                          <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                            Página {pagination.current} de{" "}
                            {pagination.totalPages}
                          </div>
                          <CHEKIOButton
                            variant="secondaryBlue"
                            onClick={() => handlePageChange(pagination.current + 1)}
                            disabled={pagination.current >= pagination.totalPages}
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
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <CHEKIOButton variant="secondary" type="button" onClick={handleClose}>
              <X className="h-4 w-4" />
              Cancelar
            </CHEKIOButton>
            <CHEKIOButton
              variant="primary"
              type="button"
              onClick={handleContinue}
              disabled={selectedEmployees.length === 0}
            >
              <UserPlus className="h-4 w-4" />
              Continuar ({selectedEmployees.length} empleados)
            </CHEKIOButton>
          </div>
        </div>
      ) : (
        // Paso 2: Formulario de banco de horas
        <div className="space-y-4">
          {isPending && renderSummary()}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="space-y-6 py-4 md:col-span-5">
              <form onSubmit={handleTimeBankSubmit(onSubmit)}>
                {/* Hidden fields for form validation */}
                <input
                  type="hidden"
                  {...registerTimeBank("startDate", {
                    required: "Por favor ingrese la fecha de inicio",
                  })}
                />
                <input
                  type="hidden"
                  {...registerTimeBank("endDate", {
                    required: "Por favor ingrese la fecha de fin",
                  })}
                />
                <div className="bg-gray-50 p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Tipo de Banco *
                    </label>
                    <Controller
                      name="type"
                      control={timeBankControl}
                      rules={{
                        required: "Por favor seleccione un tipo de banco",
                      }}
                      render={({ field }) => (
                        <CHEKIOSelect
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <CHEKIOSelectTrigger
                            className={
                              errors.type ? "border-red-500 w-full" : "w-full"
                            }
                          >
                            <CHEKIOSelectValue placeholder="Seleccione un tipo de banco" />
                          </CHEKIOSelectTrigger>
                          <CHEKIOSelectContent>
                            {timeBankTypeOptions.map((option) => (
                              <CHEKIOSelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </CHEKIOSelectItem>
                            ))}
                          </CHEKIOSelectContent>
                        </CHEKIOSelect>
                      )}
                    />
                    {errors.type && (
                      <p className="text-red-500 text-xs">
                        {errors.type.message}
                      </p>
                    )}
                  </div>

                  <SystemInput
                    control={timeBankControl}
                    label="Horas por Día"
                    attribute="hoursPerDay"
                    type="number"
                    errors={errors}
                    rules={{
                      required: "Por favor ingrese las horas por día",
                      min: { value: 0.5, message: "Mínimo 0.5 horas" },
                      max: { value: 24, message: "Máximo 24 horas" },
                    }}
                  />

                  <CheckioInputDate
                    value={watchTimeBank("startDate")}
                    onChange={(value) =>
                      setTimeBankValue("startDate", value || "")
                    }
                    label="Fecha de Inicio"
                    required
                    error={errors.startDate?.message}
                  />

                  <CheckioInputDate
                    value={watchTimeBank("endDate")}
                    onChange={(value) =>
                      setTimeBankValue("endDate", value || "")
                    }
                    label="Fecha de Fin"
                    required
                    error={errors.endDate?.message}
                  />

                  <SystemInput
                    control={timeBankControl}
                    label="Horas Disponibles"
                    attribute="availableHours"
                    type="number"
                    errors={errors}
                    rules={{
                      required: "Por favor ingrese las horas disponibles",
                      min: { value: 0, message: "Mínimo 0 horas" },
                    }}
                  />

                  <SystemInput
                    control={timeBankControl}
                    label="Código de Integración"
                    attribute="integrationCode"
                    errors={errors}
                    placeholder="Opcional"
                  />
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <CHEKIOButton
                    type="button"
                    variant="secondary"
                    onClick={handleBackToEmployeeSelect}
                  >
                    Volver
                  </CHEKIOButton>
                  <CHEKIOButton
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </CHEKIOButton>
                  <CHEKIOButton
                    type="submit"
                    variant="primary"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {buttonLoadingText}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {buttonText}
                      </>
                    )}
                  </CHEKIOButton>
                </div>
              </form>
            </div>

            {/* Selected Employees */}
            <div className="md:col-span-7">
              <div className="border overflow-hidden">
                <div className="bg-gray-50 py-2 px-4 border-b flex justify-between items-center">
                  <h3 className="font-medium">
                    Empleados seleccionados ({selectedEmployees.length})
                  </h3>
                </div>
                {isPending ? (
                  processingItems.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-600 font-medium">
                        No hay empleados procesando.
                      </p>
                    </div>
                  ) : (
                    <CHEKIOTable>
                      <CHEKIOTableHeader>
                        <tr>
                          <CHEKIOTableHead>Empleado</CHEKIOTableHead>
                          <CHEKIOTableHead>Documento</CHEKIOTableHead>
                          <CHEKIOTableHead>Tipo de Banco</CHEKIOTableHead>
                          <CHEKIOTableHead>Fecha Inicio</CHEKIOTableHead>
                          <CHEKIOTableHead>Fecha Fin</CHEKIOTableHead>
                          <CHEKIOTableHead>Estado</CHEKIOTableHead>
                        </tr>
                      </CHEKIOTableHeader>
                      <CHEKIOTableBody>
                        {processingItems.map((item, index) => (
                          <CHEKIOTableRow key={item.id} index={index}>
                            <CHEKIOTableCell className="font-medium">
                              {item.employeeName}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              {item.documentNumber}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>{item.timeBankType}</CHEKIOTableCell>
                            <CHEKIOTableCell>{item.startDate}</CHEKIOTableCell>
                            <CHEKIOTableCell>{item.endDate}</CHEKIOTableCell>
                            <CHEKIOTableCell>
                              {item.status === "pending" && (
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                  Pendiente
                                </span>
                              )}
                              {item.status === "processing" && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Procesando
                                </span>
                              )}
                              {item.status === "success" && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Completado
                                </span>
                              )}
                              {item.status === "error" && (
                                <div className="flex flex-col">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                    <X className="w-3 h-3" />
                                    Error
                                  </span>
                                  {item.error && (
                                    <span className="text-xs text-red-500 mt-1">
                                      {item.error}
                                    </span>
                                  )}
                                </div>
                              )}
                            </CHEKIOTableCell>
                          </CHEKIOTableRow>
                        ))}
                      </CHEKIOTableBody>
                    </CHEKIOTable>
                  )
                ) : selectedEmployees.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-600 font-medium">
                      No hay empleados seleccionados.
                    </p>
                  </div>
                ) : (
                  <CHEKIOTable>
                    <CHEKIOTableHeader>
                      <tr>
                        <CHEKIOTableHead>Nombre</CHEKIOTableHead>
                        <CHEKIOTableHead>Documento</CHEKIOTableHead>
                      </tr>
                    </CHEKIOTableHeader>
                    <CHEKIOTableBody>
                      {selectedEmployees.map((employee, index) => (
                        <CHEKIOTableRow key={employee.publicId} index={index}>
                          <CHEKIOTableCell>
                            {employee.firstName} {employee.lastName}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell>
                            {employee.documentNumber}
                          </CHEKIOTableCell>
                        </CHEKIOTableRow>
                      ))}
                    </CHEKIOTableBody>
                  </CHEKIOTable>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </CHEKIOModal>
  );
};

export default BatchTimeBankModal;
