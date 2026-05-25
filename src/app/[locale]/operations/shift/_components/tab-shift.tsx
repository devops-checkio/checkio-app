import ModalDelete from "@/app/[locale]/_components/modal-delete";
import { EmployeeFindFilterDto } from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import OrganizationSelector from "@/app/[locale]/mantainers/employees/_components/organization-selector";
import {
  CHEKIOButton,
  CHEKIOInput,
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
import { useCookieSession } from "@/context/useCookieSession";
import { PaginationFilterDto } from "@/dto/pagination";
import { useToast } from "@/hooks/use-toast";
import { useGetBranches, useGetJobs } from "@/service/mantainer.service";
import { useDeleteShiftAssigment } from "@/service/shift.service";
import { useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  LayoutGrid,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useShift } from "./shift.context";
import ShiftCycleDetailModal, {
  ShiftCycleEmployeeContext,
} from "./shift-cycle-detail-modal";
interface TabShiftProps {
  title: string;
  queryFn: (params: EmployeeFindFilterDto) => UseQueryResult<any, Error>;
}

export const TabShift = ({ title, queryFn }: TabShiftProps) => {
  const { selectedEmployees, setSelectedEmployees, setIsModalShiftBaseOpen } =
    useShift();
  const { toast } = useToast();
  const { companyId } = useCookieSession();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [deletingShiftAssigmentId, setDeletingShiftAssigmentId] = useState<
    string | null
  >(null);
  const [shiftCycleModalId, setShiftCycleModalId] = useState<string | null>(
    null,
  );
  const [shiftCycleContext, setShiftCycleContext] =
    useState<ShiftCycleEmployeeContext | null>(null);
  const { mutate: deleteShiftAssigment } = useDeleteShiftAssigment();
  const queryClient = useQueryClient();

  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "desc" as "asc" | "desc",
  });

  const { register, handleSubmit, watch, setValue, control, reset } = useForm({
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

  const branchId = watch("branchId");
  const jobId = watch("jobId");
  const documentNumber = watch("documentNumber");
  const search = watch("search");
  const subUnit1Id = watch("subUnit1Id");
  const subUnit2Id = watch("subUnit2Id");
  const subUnit3Id = watch("subUnit3Id");
  const subUnit4Id = watch("subUnit4Id");
  const subUnit5Id = watch("subUnit5Id");
  const subUnit6Id = watch("subUnit6Id");
  const subUnit7Id = watch("subUnit7Id");
  const subUnit8Id = watch("subUnit8Id");

  const { data, isLoading, error, refetch } = queryFn({
    companyId: companyId || "",
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    search: search,
    documentNumber: documentNumber,
    jobId: jobId,
    branchId: branchId,
    subUnit1Id: subUnit1Id,
    subUnit2Id: subUnit2Id,
    subUnit3Id: subUnit3Id,
    subUnit4Id: subUnit4Id,
    subUnit5Id: subUnit5Id,
    subUnit6Id: subUnit6Id,
    subUnit7Id: subUnit7Id,
    subUnit8Id: subUnit8Id,
    personType: "EMPLOYEE",
  });

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data]);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [
    search,
    documentNumber,
    jobId,
    branchId,
    subUnit1Id,
    subUnit2Id,
    subUnit3Id,
    subUnit4Id,
    subUnit5Id,
    subUnit6Id,
    subUnit7Id,
    subUnit8Id,
  ]);

  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
      }));
    },
    []
  );

  // Custom row selection function to prevent selecting duplicate employees
  const isRowSelectable = useCallback(
    (row: any) => {
      const employeePublicId = row.original.publicId;
      const isCurrentlySelected = row.getIsSelected();

      // Check if this employee is already selected in the context
      const isAlreadySelectedInContext = selectedEmployees.some(
        (employee: any) => employee.publicId === employeePublicId
      );

      // Allow deselection (if currently selected) or selection (if not in context)
      return isCurrentlySelected || !isAlreadySelectedInContext;
    },
    [selectedEmployees]
  );

  const handleLevelChange = (
    value: string,
    field:
      | "search"
      | "documentNumber"
      | "jobId"
      | "branchId"
      | "subUnit1Id"
      | "subUnit2Id"
      | "subUnit3Id"
      | "subUnit4Id"
      | "subUnit5Id"
      | "subUnit6Id"
      | "subUnit7Id"
      | "subUnit8Id"
  ) => {
    setValue(field, value);
  };

  const onSubmitSearch = (data: any) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleDeleteShiftAssigment = (publicId: string) => {
    deleteShiftAssigment(publicId, {
      onSuccess: async () => {
        toast({
          title: "Éxito",
          description: "Turno eliminado correctamente",
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
      },
      onError: (error) => {
        if (error instanceof AxiosError) {
          toast({
            title: "Error",
            variant: "destructive",
            description: error.response?.data.message,
          });
        }
      },
      onSettled: () => {
        setDeletingShiftAssigmentId(null);
        setIsDeleteModalOpen(false);
      },
    });
  };

  const SHIFT_COLUMNS = [
    {
      header: "Código",
      accessorKey: "code",
    },
    {
      header: "Nombres",
      accessorKey: "firstName",
    },
    {
      header: "Apellidos",
      accessorKey: "lastName",
    },
    {
      header: "Número de Documento",
      accessorKey: "documentNumber",
    },
    {
      header: "Email",
      accessorKey: "personalEmail",
    },
    {
      header: "Cargo",
      accessorKey: "jobId",
      cell: ({ row }: { row: any }) => {
        const job = jobs?.data.find(
          (job: any) => job.publicId === row.getValue("jobId")
        );
        return job ? job.name : "-";
      },
    },
    {
      header: "Sucursal",
      accessorKey: "branchId",
      cell: ({ row }: { row: any }) => {
        const branch = branches?.data.find(
          (branch: any) => branch.publicId === row.getValue("branchId")
        );
        return branch ? branch.name : "-";
      },
    },
    {
      header: "Turno",
      accessorKey: "shiftName",
      cell: ({ row }: { row: any }) => {
        const shiftEmployee = row.original.EmployeeShift;
        return (
          <span className="font-medium">
            {shiftEmployee?.Shift?.name || "-"}
          </span>
        );
      },
    },
    {
      header: "Fecha de Inicio Turno",
      accessorKey: "shiftStartDate",
      cell: ({ row }: { row: any }) => {
        const shiftEmployee = row.original.EmployeeShift;
        if (!shiftEmployee?.startDate) return "-";
        return (
          <span className="font-medium">
            {DateTime.fromISO(shiftEmployee.startDate, {
              zone: "utc",
            }).toFormat("dd/MM/yyyy")}{" "}
          </span>
        );
      },
    },
    {
      header: "Fecha de Término Turno",
      accessorKey: "shiftEndDate",
      cell: ({ row }: { row: any }) => {
        const shiftEmployee = row.original.EmployeeShift;
        const endDate = shiftEmployee?.endDate;
        if (!endDate) {
          return <span className="font-medium">Sin término</span>;
        }
        return (
          <span className="font-medium">
            {DateTime.fromISO(endDate, { zone: "utc" }).toFormat("dd/MM/yyyy")}{" "}
          </span>
        );
      },
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      cell: ({ row }: { row: any }) => {
        const record = row.original;
        return (
          <div className="flex flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setDeletingShiftAssigmentId(record.EmployeeShift?.publicId);
                setIsDeleteModalOpen(true);
              }}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const employeesList = data?.data || [];
  const paginationData = data?.pagination || pagination;

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-red-500">
          <p>Error al cargar los empleados</p>
          <CHEKIOButton
            variant="primary"
            onClick={() => refetch()}
            className="mt-4"
          >
            Reintentar
          </CHEKIOButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <form onSubmit={handleSubmit(onSubmitSearch)}>
          <div
            className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6"
            data-tour="shift-operations-filters"
          >
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <Controller
                name="search"
                control={control}
                render={({ field }) => (
                  <CHEKIOInput
                    {...field}
                    placeholder="Buscar por Nombres o Apellidos"
                  />
                )}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Documento
              </label>
              <Controller
                name="documentNumber"
                control={control}
                render={({ field }) => (
                  <CHEKIOInput
                    {...field}
                    placeholder="Buscar por Número de Documento"
                  />
                )}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo
              </label>
              <Controller
                name="jobId"
                control={control}
                render={({ field }) => (
                  <CHEKIOSelect
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <CHEKIOSelectTrigger>
                      <CHEKIOSelectValue placeholder="Seleccionar Cargo" />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sucursal
              </label>
              <Controller
                name="branchId"
                control={control}
                render={({ field }) => (
                  <CHEKIOSelect
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <CHEKIOSelectTrigger>
                      <CHEKIOSelectValue placeholder="Seleccionar Sucursal" />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
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
            {companyId && (
              <div className="md:col-span-2">
                <OrganizationSelector
                  control={control}
                  name="organizationId"
                  companyId={companyId}
                  layout="horizontal"
                />
              </div>
            )}
          </div>
          <div
            className="flex gap-2 mb-6"
            data-tour="shift-operations-toolbar"
          >
            <CHEKIOButton
              variant="secondaryBlue"
              type="button"
              onClick={() => {
                reset({
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
                });
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
            >
              <X className="h-4 w-4" />
              Limpiar
            </CHEKIOButton>
            <CHEKIOButton variant="search" type="submit">
              <Search className="h-4 w-4" />
              Buscar
            </CHEKIOButton>
            {selectedRowKeys.length > 0 && (
              <CHEKIOButton
                variant="primary"
                onClick={() => setIsModalShiftBaseOpen(true)}
              >
                <Info className="h-4 w-4" />
                Seleccionar Turno
              </CHEKIOButton>
            )}
          </div>
        </form>

        {isLoading ? (
          <>
            <div
              className="overflow-x-auto"
              data-tour="shift-operations-table"
            >
              <CHEKIOTable className="w-full rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>
                      <div className="h-4 w-4 animate-pulse rounded border border-gray-300 bg-gray-100" />
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>Código</CHEKIOTableHead>
                    <CHEKIOTableHead>Nombres</CHEKIOTableHead>
                    <CHEKIOTableHead>Apellidos</CHEKIOTableHead>
                    <CHEKIOTableHead>Número de Documento</CHEKIOTableHead>
                    <CHEKIOTableHead>Email</CHEKIOTableHead>
                    <CHEKIOTableHead>Cargo</CHEKIOTableHead>
                    <CHEKIOTableHead>Sucursal</CHEKIOTableHead>
                    <CHEKIOTableHead>Turno</CHEKIOTableHead>
                    <CHEKIOTableHead>Fecha de Inicio Turno</CHEKIOTableHead>
                    <CHEKIOTableHead>Fecha de Término Turno</CHEKIOTableHead>
                    <CHEKIOTableHead className="text-right">
                      Acciones
                    </CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {Array.from({ length: pagination.pageSize }).map((_, index) => (
                    <CHEKIOTableRow key={index} index={index}>
                      <CHEKIOTableCell>
                        <div className="h-4 w-4 animate-pulse rounded border border-gray-300 bg-gray-100" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>
            <div className="flex flex-col border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between gap-4">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
          </>
        ) : employeesList.length === 0 ? (
          <div
            className="text-center py-10"
            data-tour="shift-operations-table"
          >
            <p className="text-gray-600 font-medium">
              No se encontraron resultados
            </p>
          </div>
        ) : (
          <>
            <div
              className="overflow-x-auto"
              data-tour="shift-operations-table"
            >
              <CHEKIOTable className="w-full rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>
                      <input
                        type="checkbox"
                        checked={
                          selectedRowKeys.length === employeesList.length &&
                          employeesList.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const allKeys = employeesList.map(
                              (emp: any) => emp.publicId
                            );
                            setSelectedRowKeys(allKeys);
                            setSelectedEmployees(employeesList);
                          } else {
                            setSelectedRowKeys([]);
                            setSelectedEmployees([]);
                          }
                        }}
                        className=" border-gray-300"
                      />
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>Código</CHEKIOTableHead>
                    <CHEKIOTableHead>Nombres</CHEKIOTableHead>
                    <CHEKIOTableHead>Apellidos</CHEKIOTableHead>
                    <CHEKIOTableHead>Número de Documento</CHEKIOTableHead>
                    <CHEKIOTableHead>Email</CHEKIOTableHead>
                    <CHEKIOTableHead>Cargo</CHEKIOTableHead>
                    <CHEKIOTableHead>Sucursal</CHEKIOTableHead>
                    <CHEKIOTableHead>Turno</CHEKIOTableHead>
                    <CHEKIOTableHead>Fecha de Inicio Turno</CHEKIOTableHead>
                    <CHEKIOTableHead>Fecha de Término Turno</CHEKIOTableHead>
                    <CHEKIOTableHead className="text-right">
                      Acciones
                    </CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {employeesList.map((employee: any, index: number) => {
                    const job = jobs?.data.find(
                      (j: any) => j.publicId === employee.jobId
                    );
                    const branch = branches?.data.find(
                      (b: any) => b.publicId === employee.branchId
                    );
                    const shiftEmployee = employee.EmployeeShift;
                    const isSelected = selectedRowKeys.includes(
                      employee.publicId
                    );

                    return (
                      <CHEKIOTableRow key={employee.publicId} index={index}>
                        <CHEKIOTableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const newKeys = [
                                  ...selectedRowKeys,
                                  employee.publicId,
                                ];
                                setSelectedRowKeys(newKeys);
                                const uniqueEmployees =
                                  employeesList.filter(
                                    (emp: any) =>
                                      newKeys.includes(emp.publicId) &&
                                      employeesList.findIndex(
                                        (e: any) => e.publicId === emp.publicId
                                      ) ===
                                        employeesList.findIndex(
                                          (e: any) =>
                                            e.publicId === employee.publicId
                                        )
                                  ) || [];
                                setSelectedEmployees(uniqueEmployees);
                              } else {
                                const newKeys = selectedRowKeys.filter(
                                  (key) => key !== employee.publicId
                                );
                                setSelectedRowKeys(newKeys);
                                setSelectedEmployees(
                                  employeesList.filter((emp: any) =>
                                    newKeys.includes(emp.publicId)
                                  )
                                );
                              }
                            }}
                            className="border-gray-300"
                          />
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="font-medium">
                          {employee.code}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="font-medium">
                          {employee.firstName}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="font-medium">
                          {`${employee.lastName} ${
                            employee.secondLastName || ""
                          }`}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="font-medium">
                          {employee.documentNumber}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="text-gray-600">
                          {employee.personalEmail || "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {job ? job.name : "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {branch ? branch.name : "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="font-medium">
                          {shiftEmployee?.Shift?.name || "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="font-medium">
                          {shiftEmployee?.startDate
                            ? DateTime.fromISO(shiftEmployee.startDate, {
                                zone: "utc",
                              }).toFormat("dd/MM/yyyy")
                            : "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="font-medium">
                          {shiftEmployee?.endDate
                            ? DateTime.fromISO(shiftEmployee.endDate, {
                                zone: "utc",
                              }).toFormat("dd/MM/yyyy")
                            : "Sin término"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {shiftEmployee?.Shift?.publicId ? (
                              <CHEKIOButton
                                variant="secondaryBlue"
                                type="button"
                                className="h-8 w-8 shrink-0 p-0"
                                onClick={() => {
                                  setShiftCycleModalId(
                                    shiftEmployee.Shift.publicId,
                                  );
                                  setShiftCycleContext({
                                    dayIndex: shiftEmployee.dayIndex,
                                    weekIndex: shiftEmployee.weekIndex,
                                    startDate: shiftEmployee.startDate,
                                    endDate: shiftEmployee.endDate ?? null,
                                    ruleHoliday: shiftEmployee.ruleHoliday,
                                  });
                                }}
                                title="Ver ciclo"
                                aria-label="Ver detalle del ciclo de turno"
                              >
                                <LayoutGrid className="h-4 w-4" />
                              </CHEKIOButton>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingShiftAssigmentId(
                                  shiftEmployee?.publicId,
                                );
                                setIsDeleteModalOpen(true);
                              }}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                              title="Eliminar turno"
                              aria-label="Eliminar turno"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </CHEKIOTableCell>
                      </CHEKIOTableRow>
                    );
                  })}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>

            <div
              className="flex flex-col border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between gap-4"
              data-tour="shift-operations-pagination"
            >
              <div className="text-sm text-gray-600">
                Mostrando {employeesList.length} de {paginationData.totalCount}{" "}
                resultados
              </div>
              <div className="flex items-center gap-2">
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() =>
                    handlePaginationChange(
                      paginationData.current - 1,
                      paginationData.pageSize
                    )
                  }
                  disabled={paginationData.current === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </CHEKIOButton>
                <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                  Página {paginationData.current} de {paginationData.totalPages}
                </div>
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() =>
                    handlePaginationChange(
                      paginationData.current + 1,
                      paginationData.pageSize
                    )
                  }
                  disabled={paginationData.current >= paginationData.totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </CHEKIOButton>
              </div>
            </div>
          </>
        )}
      </div>
      <ModalDelete
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={() => {
          if (deletingShiftAssigmentId) {
            return handleDeleteShiftAssigment(deletingShiftAssigmentId);
          }
          return Promise.resolve();
        }}
        message="¿Está seguro de que desea eliminar la asignación de turno?"
      />
      <ShiftCycleDetailModal
        isOpen={!!shiftCycleModalId}
        onClose={() => {
          setShiftCycleModalId(null);
          setShiftCycleContext(null);
        }}
        shiftPublicId={shiftCycleModalId}
        employeeContext={shiftCycleContext ?? undefined}
      />
    </>
  );
};
