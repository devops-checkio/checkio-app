"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import LoadingCheckIO from "@/app/[locale]/_components/loading";
import { Gender } from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import {
  CHEKIOButton,
  CHEKIOHeader,
  CHEKIOInput,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import {
  useOperationsShiftAssignmentTour,
} from "@/hooks/useOperationsShiftAssignmentTour";
import { useToast } from "@/hooks/use-toast";
import { useGetHolidays } from "@/service/mantainer.service";
import {
  useCreateShiftForAssistances,
  useGetSchedulesByShiftId,
  useGetShift,
  useGetShifts,
} from "@/service/shift.service";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeftRight,
  CalendarClock,
  Check,
  Clock,
  HelpCircle,
  Loader2,
  Search,
  UserCog,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  RotationType,
  RuleHolidayType,
  ShiftAssigmentDto,
  ShiftEmployeeAssigmentDto,
} from "../../../mantainers/shifts/_components/shifth.dto";
import AssignmentTimer from "../_components/assignment-timer";
import EmployeeShiftSelectorModal from "../_components/employee-shift-selector-modal";
import SelectorDaySchedule from "../_components/selector-day-schedule";
import EmployeeComparisonModal from "../_components/shift-comparison-modal";
import { useShift } from "../_components/shift.context";

function AssignmentContent() {
  const t = useTranslations("operations.shift");
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { startTour } = useOperationsShiftAssignmentTour();
  const { canCreate, canUpdate, companyId } = useCookieSession();
  const {
    selectedEmployees,
    selectedShift,
    reset,
    requestShiftType,
    isFistAssignment,
  } = useShift();
  const { mutate: createShiftForAssistances, isPending } =
    useCreateShiftForAssistances();

  // State for employee selection and shift management
  const [selectedEmployeeIndexes, setSelectedEmployeeIndexes] = useState<
    number[]
  >([0]);
  const [searchParams, setSearchParams] = useState({
    name: "",
    type: selectedShift?.type,
    page: 1,
    pageSize: 10,
    sort: "desc" as "desc" | "asc",
    companyId: undefined as string | undefined,
  });
  const [employeeShifts, setEmployeeShifts] = useState<{ [key: string]: any }>(
    {}
  );
  const [loadingEmployeeShifts, setLoadingEmployeeShifts] = useState<{
    [key: string]: boolean;
  }>({});
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedEmployeeForShiftChange, setSelectedEmployeeForShiftChange] =
    useState<number | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  useEffect(() => {
    if (!selectedEmployees?.length || !selectedShift) {
      router.push("/operations/shift");
    }
  }, [selectedEmployees, selectedShift, router]);

  const methods = useForm<any>({
    defaultValues: {
      shiftId: selectedShift?.publicId,
      rotationType: selectedShift?.type,
      startDate: null,
      startDateWeek: null,
      dayIndex: null,
      forceUpdate: 0,
      employees: selectedEmployees.map((employee) => ({
        employeeId: employee.publicId,
        employee,
        shiftId: selectedShift?.publicId,
        dayIndex: 0,
        weekIndex: 0,
        isConfigured: false,
        ruleHoliday: RuleHolidayType.NONE,
      })),
    },
  });

  const { watch, setValue, getValues } = methods;

  const rotationType = watch("rotationType");
  const startDate = watch("startDate");
  const startDateWeek = watch("startDateWeek");
  const name = watch("name");
  const employees = watch("employees");

  // Update search params when form values change
  useEffect(() => {
    setSearchParams({
      name: name || "",
      type: rotationType,
      page: 1,
      pageSize: 10,
      sort: "desc",
      companyId: companyId ?? undefined,
    });
  }, [name, rotationType, companyId]);

  const { data: shifts, isLoading: isLoadingShifts } =
    useGetShifts(searchParams);
  const { data: principalShift, isLoading: isLoadingPrincipalShift } =
    useGetShift(selectedShift?.publicId);
  const { data: scheduleDetails, isLoading: isLoadingScheduleDetails } =
    useGetSchedulesByShiftId(selectedShift?.publicId);

  // Get schedules for individual employee shifts
  const getEmployeeShiftSchedules = (employeeIndex: number) => {
    const employeeShiftData = getEmployeeShiftData(employeeIndex);
    const shiftId = employeeShiftData?.publicId;

    // For now, return the default schedule details
    // We'll handle individual shift schedules differently
    return scheduleDetails || [];
  };
  const { data: holidays, isLoading: isLoadingHolidays } = useGetHolidays({
    page: 1,
    pageSize: 100,
    sort: "asc",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [startTime] = useState(() => new Date());

  useEffect(() => {
    if (!selectedShift?.publicId) return;

    methods.control._defaultValues.shiftId = selectedShift.publicId;

    if (!getValues("shiftId")) {
      setValue("shiftId", selectedShift.publicId);
    }

    const rows = getValues("employees");
    if (rows?.length) {
      const next = rows.map((row: any) =>
        row.shiftId
          ? row
          : { ...row, shiftId: selectedShift.publicId }
      );
      if (next.some((row: any, i: number) => row.shiftId !== rows[i].shiftId)) {
        setValue("employees", next);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShift]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleClearSearch = () => {
    setValue("name", "");
  };

  const handleSearchChange = (value: string) => {
    setValue("name", value);
  };

  // Filter employees locally based on search term
  const filteredEmployees = selectedEmployees.filter((employee) => {
    if (!name) return true;
    const searchTerm = name.toLowerCase();
    return (
      employee.firstName.toLowerCase().includes(searchTerm) ||
      employee.lastName.toLowerCase().includes(searchTerm) ||
      employee.documentNumber.toLowerCase().includes(searchTerm)
    );
  });

  const handleEmployeeSelect = (index: number) => {
    if (selectedEmployeeIndexes.includes(index)) {
      // Remove from selection if already selected
      setSelectedEmployeeIndexes(
        selectedEmployeeIndexes.filter((i) => i !== index)
      );
    } else {
      // Replace selection (only 1 employee at a time)
      setSelectedEmployeeIndexes([index]);
    }
  };

  const handleShiftSelect = (shift: any) => {
    setValue("shiftId", shift.publicId);
    setValue("rotationType", shift.type);

    // Update all employees with new shift
    const updatedEmployees = getValues("employees").map((employee: any) => ({
      ...employee,
      shiftId: shift.publicId,
      isConfigured: false, // Reset configuration status
    }));
    setValue("employees", updatedEmployees);
  };

  const markEmployeeAsConfigured = (employeeIndex: number) => {
    const updatedEmployees = [...getValues("employees")];
    updatedEmployees[employeeIndex] = {
      ...updatedEmployees[employeeIndex],
      isConfigured: true,
    };
    setValue("employees", updatedEmployees);
  };

  if (!selectedEmployees?.length || !selectedShift) {
    return (
      <div className="p-4">
        <h2>Redirigiendo...</h2>
        <p>No hay datos seleccionados.</p>
      </div>
    );
  }

  const onSubmit = async (data: any) => {
    console.log("Form submitted", data);
    try {
      if (!data.employees?.length) {
        throw new Error("No hay empleados seleccionados");
      }

      setIsLoading(true);
      await handleShiftAssignment(data);
    } catch (error) {
      console.error("Error submitting shift assignment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShiftAssignment = async (data: any) => {
    const rootShiftId = (
      getValues("shiftId") ||
      selectedShift?.publicId ||
      ""
    )
      .toString()
      .trim();

    const employeesPayload: ShiftAssigmentDto[] = data.employees.map(
      (row: any) => {
      const employeeId = (
        row.employeeId ||
        row.employee?.publicId ||
        ""
      )
        .toString()
        .trim();
      const shiftId = (
        row.shiftId ||
        row.shift?.publicId ||
        rootShiftId
      )
        .toString()
        .trim();

      return {
        employeeId,
        shiftId,
        dayIndex: row.dayIndex ?? 0,
        weekIndex: row.weekIndex ?? 0,
        ruleHoliday: row.ruleHoliday || RuleHolidayType.NONE,
      };
    },
    );

    const invalid = employeesPayload.find((e) => !e.employeeId || !e.shiftId);
    if (invalid) {
      toast({
        title: "No se pudo enviar la asignación",
        variant: "destructive",
        description:
          "Falta el identificador del empleado o del turno. Seleccione de nuevo el turno en el paso anterior y vuelva a intentar.",
      });
      return;
    }

    const payload: ShiftEmployeeAssigmentDto = {
      startDate: startDate
        .setZone("utc", {
          keepLocalTime: true,
        })
        .toISO()!,
      requestShiftType,
      employees: employeesPayload,
    };

    createShiftForAssistances(payload, {
      onSuccess: async () => {
        toast({
          title: "Turno creado correctamente para los empleados seleccionados",
        });
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["GetEmployeesWithShiftActive"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["GetEmployeesWithShiftPast"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["GetEmployeesWithShiftFuture"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["GetEmployeesShiftCount"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["GetEmployeesShiftWithout"],
          }),
        ]);
        reset();
        router.push("/operations/shift");
      },
      onError: (error) => {
        toast({
          title: "Error al crear el turno",
          variant: "destructive",
          description: error.message,
        });
      },
    });
  };

  if (
    showLoading ||
    [
      isLoadingShifts,
      isLoadingPrincipalShift,
      isLoadingScheduleDetails,
      isLoadingHolidays,
    ].some((loading) => loading)
  ) {
    return <LoadingCheckIO />;
  }

  // Shift table columns for the header selector
  const shiftColumns = [
    {
      header: "Nombre",
      accessorKey: "name",
      cell: (info: any) => (
        <span className="font-medium">{info.getValue()}</span>
      ),
    },
    {
      header: "Tipo",
      accessorKey: "type",
      cell: ({ row }: { row: any }) => {
        const type = row.getValue("type");
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              type === RotationType.WEEKLY
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {type === RotationType.WEEKLY
              ? "Rotativo Semanal"
              : "Rotativo por Días"}
          </span>
        );
      },
    },
    {
      header: "Días",
      accessorKey: "days",
      cell: (info: any) => (
        <span className="font-medium">{info.getValue()}</span>
      ),
    },
    {
      header: "Semanas",
      accessorKey: "weeks",
      cell: (info: any) => (
        <span className="font-medium">{info.getValue()}</span>
      ),
    },
    {
      header: "Nomenclatura",
      accessorKey: "nomenclature",
      cell: (info: any) => (
        <span className="text-gray-600 text-sm">{info.getValue()}</span>
      ),
    },
    {
      id: "actions",
      header: "Seleccionar",
      cell: ({ row }: { row: any }) => {
        const record = row.original;
        const isSelected = getValues("shiftId") === record.publicId;

        return (
          <div className="flex items-center justify-center">
            <button
              className={`p-2 rounded-lg transition-colors ${
                isSelected
                  ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              type="button"
              onClick={() => handleShiftSelect(record)}
            >
              {isSelected ? (
                <Check className="text-lg" />
              ) : (
                <span className="text-sm font-medium">Seleccionar</span>
              )}
            </button>
          </div>
        );
      },
    },
  ];

  // Function to handle individual employee shift change
  const handleEmployeeShiftChange = async (
    employeeIndex: number,
    shift: any
  ) => {
    const employee = selectedEmployees[employeeIndex];
    const employeeId = employee.publicId;

    // Set loading state for this employee
    setLoadingEmployeeShifts((prev) => ({ ...prev, [employeeId]: true }));

    try {
      // Store the shift data for this employee (using the shift object directly)
      setEmployeeShifts((prev) => ({ ...prev, [employeeId]: shift }));

      // Update form values
      const updatedEmployees = [...getValues("employees")];
      updatedEmployees[employeeIndex] = {
        ...updatedEmployees[employeeIndex],
        shiftId: shift.publicId,
        isConfigured: false, // Reset configuration when shift changes
      };
      setValue("employees", updatedEmployees);

      // Force re-render by updating the key
      setValue("forceUpdate", Date.now());
    } catch (error) {
      console.error("Error updating employee shift:", error);
      toast({
        title: "Error al actualizar el turno",
        variant: "destructive",
        description:
          "No se pudo actualizar la información del turno seleccionado.",
      });
    } finally {
      // Clear loading state
      setLoadingEmployeeShifts((prev) => ({ ...prev, [employeeId]: false }));
    }
  };

  // Function to handle holiday rule change
  const handleHolidayRuleChange = (
    employeeIndex: number,
    value: RuleHolidayType
  ) => {
    const updatedEmployees = [...getValues("employees")];
    updatedEmployees[employeeIndex] = {
      ...updatedEmployees[employeeIndex],
      ruleHoliday: value,
    };
    setValue("employees", updatedEmployees);
  };

  // Function to get employee's specific shift data
  const getEmployeeShiftData = (employeeIndex: number) => {
    const employee = getValues(`employees.${employeeIndex}`);
    const employeeShiftId = employee.shiftId;
    const employeeId = selectedEmployees[employeeIndex]?.publicId;

    // If employee has a specific shift, use it; otherwise use the default shift
    if (employeeShiftId && employeeShiftId !== selectedShift?.publicId) {
      // Check if we have cached data for this employee's shift
      if (employeeShifts[employeeId]) {
        return employeeShifts[employeeId];
      }
      // Fallback to finding in the shifts list
      const shiftFromList = shifts?.data.find(
        (s) => s.publicId === employeeShiftId
      );
      if (shiftFromList) {
        return shiftFromList;
      }
    }

    return selectedShift;
  };

  // Function to check if employee has a custom shift
  const hasCustomShift = (employeeIndex: number) => {
    const employee = getValues(`employees.${employeeIndex}`);
    return employee.shiftId && employee.shiftId !== selectedShift?.publicId;
  };

  const handleOpenShiftModal = (employeeIndex: number) => {
    setSelectedEmployeeForShiftChange(employeeIndex);
    setIsShiftModalOpen(true);
  };

  const handleShiftModalClose = () => {
    setIsShiftModalOpen(false);
    setSelectedEmployeeForShiftChange(null);
  };

  const handleShiftModalConfirm = async (shift: any) => {
    if (selectedEmployeeForShiftChange !== null) {
      await handleEmployeeShiftChange(selectedEmployeeForShiftChange, shift);
    }
  };

  const handleOpenComparisonModal = () => {
    setIsComparisonModalOpen(true);
  };

  const handleComparisonModalClose = () => {
    setIsComparisonModalOpen(false);
  };

  return (
    <FormProvider {...methods}>
      <CHEKIOHeader
        title="Asignación de Turnos"
        subtitle="Configure la fecha de inicio y los horarios por empleado"
        breadcrumbs={["Operaciones", "Turnos", "Asignación"]}
        icon={CalendarClock}
        onBack={() => router.push("/operations/shift")}
        actions={
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={startTour}
            aria-label={t("assignmentTour.startButton")}
          >
            <HelpCircle className="h-4 w-4" />
            {t("assignmentTour.startButton")}
          </CHEKIOButton>
        }
      />
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="w-full h-full animate-in fade-in duration-500 mb-10"
      >
        <div className="flex h-[calc(100vh-200px)] gap-4">
          {/* Sidebar - Employee Selection */}
          <div
            className="w-80 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            data-tour="shift-assignment-sidebar"
          >
            <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Empleados Seleccionados
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <CHEKIOInput
                  placeholder="Buscar empleado..."
                  value={name}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
                {name && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredEmployees.map((employee, index) => {
                const originalIndex = selectedEmployees.findIndex(
                  (emp) => emp.publicId === employee.publicId
                );
                const isSelected =
                  selectedEmployeeIndexes.includes(originalIndex);
                const isConfigured = getValues(
                  `employees.${originalIndex}.isConfigured`
                );
                const hasCustom = hasCustomShift(originalIndex);
                const isLoadingShift = loadingEmployeeShifts[employee.publicId];

                return (
                  <div
                    key={employee.publicId}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => handleEmployeeSelect(originalIndex)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          employee.gender === Gender.FEMALE
                            ? "bg-pink-100"
                            : "bg-blue-100"
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            employee.gender === Gender.FEMALE
                              ? "text-pink-600"
                              : "text-blue-600"
                          }`}
                        >
                          {employee.firstName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {employee.firstName} {employee.lastName}
                          </h4>
                          {hasCustom && (
                            <span title="Turno personalizado">
                              <ArrowLeftRight className="h-3 w-3 text-orange-600" />
                            </span>
                          )}
                          {isLoadingShift && (
                            <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {employee.documentNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConfigured ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="h-3 w-3" />
                            <span className="text-xs">Completado</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">Pendiente</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header Configuration */}
            <div
              className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              data-tour="shift-assignment-header-config"
            >
              <div className="p-5">
                <div className="grid grid-cols-3 gap-4">
                  {/* Date Picker */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Fecha de Inicio
                    </label>
                    <Controller
                      control={methods.control}
                      name="startDate"
                      render={({ field }) => {
                        const dateValue =
                          field.value && DateTime.isDateTime(field.value)
                            ? field.value.toFormat("yyyy-MM-dd")
                            : "";

                        return (
                          <CHEKIOInput
                            type="date"
                            value={dateValue}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              if (!inputValue) {
                                field.onChange(null);
                                setValue("startDate", null);
                                setValue("startDateWeek", null);
                                return;
                              }

                              const luxonDate = DateTime.fromISO(inputValue, {
                                zone: "utc",
                              });

                              if (!luxonDate.isValid) {
                                return;
                              }

                              const startDateWeek =
                                rotationType === RotationType.WEEKLY &&
                                luxonDate
                                  ? luxonDate.startOf("week")
                                  : luxonDate;

                              field.onChange(luxonDate);
                              setValue("startDate", luxonDate);
                              setValue("startDateWeek", startDateWeek);

                              if (rotationType === RotationType.WEEKLY) {
                                setValue(
                                  "employees",
                                  getValues("employees").map(
                                    (employee: any) => ({
                                      ...employee,
                                      dayIndex: luxonDate?.weekday
                                        ? luxonDate?.weekday - 1
                                        : 0,
                                    })
                                  )
                                );
                              }
                            }}
                            min={
                              isFistAssignment
                                ? undefined
                                : DateTime.now().toFormat("yyyy-MM-dd")
                            }
                            className="w-full"
                          />
                        );
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Turno Seleccionado
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm font-medium">
                          {selectedShift?.name || "No seleccionado"}
                        </span>
                      </div>
                      {startDate && (
                        <CHEKIOButton
                          type="button"
                          variant="secondaryBlue"
                          onClick={handleOpenComparisonModal}
                          className="h-auto px-3 py-1.5 gap-2"
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                          Comparar
                        </CHEKIOButton>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {startDate == null ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] rounded-xl border border-gray-200 bg-white p-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 mb-4">
                    <CalendarClock className="h-10 w-10 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                    Configuración Requerida
                  </h2>
                  <p className="text-sm text-gray-500 text-center max-w-md">
                    Por favor configure la fecha de inicio antes de continuar
                    con la asignación de turnos.
                  </p>
                </div>
              ) : selectedEmployeeIndexes.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] rounded-xl border border-gray-200 bg-white p-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 mb-4">
                    <UserCog className="h-10 w-10 text-gray-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                    Seleccione un Empleado
                  </h2>
                  <p className="text-sm text-gray-500 text-center max-w-md">
                    Seleccione uno o dos empleados del panel izquierdo para
                    configurar sus horarios.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedEmployeeIndexes.map(
                    (employeeIndex, displayIndex) => {
                      const employee = selectedEmployees[employeeIndex];
                      return (
                        <div
                          key={employee.publicId}
                          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                          data-tour="shift-assignment-employee-config"
                        >
                          {/* Employee Header */}
                          <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div
                                  className={`h-12 w-12 rounded-full ${
                                    employee.gender === Gender.FEMALE
                                      ? "bg-pink-100"
                                      : "bg-blue-100"
                                  } flex items-center justify-center`}
                                >
                                  <span
                                    className={`text-lg font-medium ${
                                      employee.gender === Gender.FEMALE
                                        ? "text-pink-600"
                                        : "text-blue-600"
                                    }`}
                                  >
                                    {employee.firstName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {employee.firstName} {employee.lastName}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {employee.documentNumber}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {canUpdate(OrganizationPermissionCode.SHIFT_MAINTENANCE) &&
                                  !getValues(
                                    `employees.${employeeIndex}.isConfigured`
                                  ) && (
                                    <CHEKIOButton
                                      variant="secondaryBlue"
                                      onClick={() =>
                                        markEmployeeAsConfigured(employeeIndex)
                                      }
                                      className="h-auto px-3 py-1.5 gap-2"
                                    >
                                      <Check className="h-4 w-4" />
                                      Marcar como Completado
                                    </CHEKIOButton>
                                  )}
                              </div>
                            </div>

                            {/* Employee Configuration Row */}
                            <div className="grid grid-cols-2 gap-4">
                              {/* Shift Selector */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                  Turno para {employee.firstName}
                                </label>
                                <div className="relative">
                                  <CHEKIOButton
                                    type="button"
                                    variant="secondaryBlue"
                                    onClick={() =>
                                      handleOpenShiftModal(employeeIndex)
                                    }
                                    disabled={
                                      loadingEmployeeShifts[employee.publicId]
                                    }
                                    className="w-full justify-between h-auto px-3 py-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {getEmployeeShiftData(employeeIndex)
                                          ?.name ||
                                          selectedShift?.name ||
                                          "Seleccionar turno"}
                                      </span>
                                      {hasCustomShift(employeeIndex) && (
                                        <ArrowLeftRight className="h-3 w-3 text-orange-600" />
                                      )}
                                    </div>
                                    {loadingEmployeeShifts[
                                      employee.publicId
                                    ] ? (
                                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                                    ) : (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 9l-7 7-7-7"
                                        />
                                      </svg>
                                    )}
                                  </CHEKIOButton>
                                </div>
                              </div>

                              {/* Holiday Rule Selector */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                  Regla de Feriados
                                </label>
                                <Controller
                                  control={methods.control}
                                  name={`employees.${employeeIndex}.ruleHoliday`}
                                  render={({ field }) => (
                                    <CHEKIOSelect
                                      value={field.value}
                                      onValueChange={(value) => {
                                        field.onChange(value);
                                        handleHolidayRuleChange(
                                          employeeIndex,
                                          value as RuleHolidayType
                                        );
                                      }}
                                    >
                                      <CHEKIOSelectTrigger>
                                        <CHEKIOSelectValue placeholder="Seleccione regla de feriados" />
                                      </CHEKIOSelectTrigger>
                                      <CHEKIOSelectContent>
                                        <CHEKIOSelectItem
                                          value={RuleHolidayType.NONE}
                                        >
                                          No Aplica
                                        </CHEKIOSelectItem>
                                        <CHEKIOSelectItem
                                          value={
                                            RuleHolidayType.ONLY_NORMAL_DAYS
                                          }
                                        >
                                          Solo Días Normales
                                        </CHEKIOSelectItem>
                                        <CHEKIOSelectItem
                                          value={
                                            RuleHolidayType.ONLY_UNWAIVABLE_DAYS
                                          }
                                        >
                                          Solo Días Irrenunciables
                                        </CHEKIOSelectItem>
                                        <CHEKIOSelectItem
                                          value={RuleHolidayType.BOTH}
                                        >
                                          Ambos
                                        </CHEKIOSelectItem>
                                      </CHEKIOSelectContent>
                                    </CHEKIOSelect>
                                  )}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Schedule Configuration */}
                          <div className="p-5 overflow-x-auto">
                            <div className="min-w-[800px]">
                              <Controller
                                control={methods.control}
                                name={`employees.${employeeIndex}.selectedDay`}
                                render={({ field }) => {
                                  const employeeShiftData =
                                    getEmployeeShiftData(employeeIndex);
                                  const shiftId = employeeShiftData?.publicId;
                                  const forceUpdate = watch("forceUpdate");

                                  // Use the employee's specific shift configuration
                                  const employeeRotationType =
                                    employeeShiftData?.type || rotationType;
                                  const employeeSchedules =
                                    employeeShiftData?.schedules ||
                                    principalShift?.schedules ||
                                    [];

                                  return (
                                    <SelectorDaySchedule
                                      key={`schedule-${employee.publicId}-${
                                        shiftId || selectedShift?.publicId
                                      }-${forceUpdate || 0}`}
                                      setValue={setValue}
                                      getValues={getValues}
                                      startDate={startDate}
                                      startDateWeek={startDateWeek}
                                      rotationType={employeeRotationType}
                                      schedules={employeeSchedules}
                                      scheduleDetails={scheduleDetails || []}
                                      holidays={holidays?.data || []}
                                      employeeIndex={employeeIndex}
                                    />
                                  );
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div
          className="fixed bottom-0 right-0 p-4 border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] w-full"
          data-tour="shift-assignment-bottom-bar"
        >
          <div className="w-[80%] ml-auto">
            <div className="flex flex-col gap-2">
              {/* Stats and controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Timer Component */}
                  <AssignmentTimer startTime={startTime} />

                  {/* Employee Status Summary */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      Empleados configurados:{" "}
                      {employees.filter((emp: any) => emp.isConfigured).length}{" "}
                      / {employees.length}
                    </span>
                  </div>
                </div>

                {/* Save button */}
                <CHEKIOButton
                  type="submit"
                  variant="primary"
                  data-tour="shift-assignment-submit-btn"
                  disabled={
                    isPending ||
                    methods.formState.isSubmitting ||
                    startDate == null ||
                    selectedEmployeeIndexes.length === 0 ||
                    employees.filter((emp: any) => emp.isConfigured).length !==
                      employees.length ||
                    !canCreate(OrganizationPermissionCode.ASIGMENT_SHIFT_OPERATIONS)
                  }
                  className="min-w-[150px]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                      Guardando...
                    </>
                  ) : (
                    "Guardar Asignación"
                  )}
                </CHEKIOButton>
              </div>
            </div>
          </div>
        </div>
      </form>
      {isLoading && <LoadingCheckIO />}

      {/* Employee Shift Selector Modal */}
      {selectedEmployeeForShiftChange !== null && (
        <EmployeeShiftSelectorModal
          isOpen={isShiftModalOpen}
          onClose={handleShiftModalClose}
          onShiftSelect={handleShiftModalConfirm}
          employeeName={
            selectedEmployees[selectedEmployeeForShiftChange]?.firstName || ""
          }
          currentShiftId={getValues(
            `employees.${selectedEmployeeForShiftChange}.shiftId`
          )}
        />
      )}

      {/* Employee Comparison Modal */}
      <EmployeeComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={handleComparisonModalClose}
        employees={selectedEmployees}
        employeeConfigurations={employees}
        onEmployeeSelect={(employeeIndex) => {
          // This function is called when user clicks "Configurar Empleado" in the modal
          // We don't need to modify the main view selection here
          // The modal manages its own selection independently
        }}
        getEmployeeShiftData={getEmployeeShiftData}
        hasCustomShift={hasCustomShift}
        startDate={startDate}
        startDateWeek={startDateWeek}
        rotationType={rotationType}
        schedules={principalShift?.schedules || []}
        scheduleDetails={scheduleDetails || []}
        holidays={holidays?.data || []}
        setFormValue={setValue}
        getFormValues={getValues}
      />
    </FormProvider>
  );
}

export default function AssignmentPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.ASIGMENT_SHIFT_OPERATIONS
      }
    >
      <AssignmentContent />
    </AccessNotGranted>
  );
}
