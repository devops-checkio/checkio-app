import {
  EmployeeFindFilterDto,
  EmployeeResponseDto,
} from "@/app/[locale]/mantainers/employees/_components/employee.dto";
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
import {
  useGetBranches,
  useGetEmployeesShiftWithout,
  useGetJobs,
} from "@/service/mantainer.service";
import { ChevronLeft, ChevronRight, Info, Search, X } from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FilterFormValues, useShift } from "./shift.context";

export const TabShiftEmployeeWithout = () => {
  const { companyId } = useCookieSession();
  const { setIsModalShiftBaseOpen, setSelectedEmployees, setIsFistAssignment } =
    useShift();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { control, handleSubmit, watch, reset, setValue } =
    useForm<FilterFormValues>({
      defaultValues: {
        search: "",
        documentNumber: "",
        jobId: undefined,
        branchId: undefined,
      },
    });

  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const [filter, setFilter] = useState<EmployeeFindFilterDto>({
    companyId: companyId!,
    page: 1,
    pageSize: 10,
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
    personType: "EMPLOYEE",
  });

  const { data: jobs } = useGetJobs({
    page: 1,
    pageSize: 100,
    sort: "asc",
  });

  const { data: branches } = useGetBranches({
    page: 1,
    pageSize: 100,
    sort: "asc",
  });

  const { data: employees, isLoading: isLoadingEmployees } =
    useGetEmployeesShiftWithout(filter);

  const search = watch("search");
  const branchId = watch("branchId");
  const jobId = watch("jobId");
  const documentNumber = watch("documentNumber");

  const handleSubmitFilter = (data: FilterFormValues) => {
    const newFilter = { ...filter, ...data, page: 1 };
    setFilter(newFilter);
  };

  const handlePageChange = (newPage: number) => {
    setFilter({ ...filter, page: newPage });
  };

  const employeesList = employees?.data || [];
  const pagination = employees?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(handleSubmitFilter)}>
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
                      <CHEKIOSelectItem key={job.publicId} value={job.publicId}>
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
              });
              setFilter({
                companyId: companyId!,
                page: 1,
                pageSize: 10,
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
                personType: "EMPLOYEE",
              });
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
              onClick={() => {
                setIsFistAssignment(true);
                setIsModalShiftBaseOpen(true);
              }}
            >
              <Info className="h-4 w-4" />
              Seleccionar Turno
            </CHEKIOButton>
          )}
        </div>
      </form>

      {isLoadingEmployees ? (
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
                  <CHEKIOTableHead>N° Documento</CHEKIOTableHead>
                  <CHEKIOTableHead>Nombre</CHEKIOTableHead>
                  <CHEKIOTableHead>Email</CHEKIOTableHead>
                  <CHEKIOTableHead>Teléfono</CHEKIOTableHead>
                  <CHEKIOTableHead>Horas Contratadas</CHEKIOTableHead>
                  <CHEKIOTableHead>Fecha Contratación</CHEKIOTableHead>
                  <CHEKIOTableHead>Cargo</CHEKIOTableHead>
                  <CHEKIOTableHead>Sucursal</CHEKIOTableHead>
                  <CHEKIOTableHead>Última Modificación</CHEKIOTableHead>
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
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
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
        <div className="text-center py-10" data-tour="shift-operations-table">
          <p className="text-gray-600 font-medium">
            No se encontraron empleados sin turno
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
                      className="rounded border-gray-300"
                    />
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>Código</CHEKIOTableHead>
                  <CHEKIOTableHead>N° Documento</CHEKIOTableHead>
                  <CHEKIOTableHead>Nombre</CHEKIOTableHead>
                  <CHEKIOTableHead>Email</CHEKIOTableHead>
                  <CHEKIOTableHead>Teléfono</CHEKIOTableHead>
                  <CHEKIOTableHead>Horas Contratadas</CHEKIOTableHead>
                  <CHEKIOTableHead>Fecha Contratación</CHEKIOTableHead>
                  <CHEKIOTableHead>Cargo</CHEKIOTableHead>
                  <CHEKIOTableHead>Sucursal</CHEKIOTableHead>
                  <CHEKIOTableHead>Última Modificación</CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {employeesList.map(
                  (employee: EmployeeResponseDto, index: number) => {
                    const job = jobs?.data.find(
                      (j: any) => j.publicId === employee.jobId
                    );
                    const branch = branches?.data.find(
                      (b: any) => b.publicId === employee.branchId
                    );
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
                                setSelectedEmployees([
                                  ...(employees?.data || []).filter(
                                    (emp: any) => newKeys.includes(emp.publicId)
                                  ),
                                ]);
                              } else {
                                const newKeys = selectedRowKeys.filter(
                                  (key) => key !== employee.publicId
                                );
                                setSelectedRowKeys(newKeys);
                                setSelectedEmployees(
                                  (employees?.data || []).filter((emp: any) =>
                                    newKeys.includes(emp.publicId)
                                  )
                                );
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="font-medium">
                          {employee.code}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="font-medium">
                          {employee.documentNumber}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="font-medium">
                          {`${employee.firstName} ${employee.lastName} ${
                            employee.secondLastName || ""
                          }`}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="text-gray-600">
                          {employee.workEmail || "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="text-gray-600">
                          {employee.workPhone || "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="font-medium">
                          {employee.contractedHours || "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="text-gray-500 text-sm">
                          {employee.startDate
                            ? DateTime.fromISO(
                                typeof employee.startDate === "string"
                                  ? employee.startDate
                                  : employee.startDate.toISOString()
                              ).toFormat("dd/MM/yyyy")
                            : "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {job ? job.name : "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {branch ? branch.name : "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="text-gray-500 text-sm">
                          {employee.updatedAt
                            ? DateTime.fromISO(
                                typeof employee.updatedAt === "string"
                                  ? employee.updatedAt
                                  : new Date(employee.updatedAt).toISOString()
                              ).toFormat("dd/MM/yyyy")
                            : "-"}
                        </CHEKIOTableCell>
                      </CHEKIOTableRow>
                    );
                  }
                )}
              </CHEKIOTableBody>
            </CHEKIOTable>
          </div>

          <div
            className="flex flex-col border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between gap-4"
            data-tour="shift-operations-pagination"
          >
            <div className="text-sm text-gray-600">
              Mostrando {employeesList.length} de {pagination.totalCount}{" "}
              resultados
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
                Página {pagination.current} de {pagination.totalPages}
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
        </>
      )}
    </div>
  );
};
