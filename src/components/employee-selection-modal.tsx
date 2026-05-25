"use client";

import { EmployeeResponseDto } from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import OrganizationSelector from "@/app/[locale]/mantainers/employees/_components/organization-selector";
import { CheckIOButton } from "@/components/template/checkIO-button";
import SystemSelect from "@/components/ui/select";
import SystemInput from "@/components/ui/system-input";
import { DataTable } from "@/components/ui/table-generic";
import { useCookieSession } from "@/context/useCookieSession";
import { PaginationFilterDto } from "@/dto/pagination";
import {
  useGetBranches,
  useGetEmployees,
  useGetJobs,
} from "@/service/mantainer.service";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ColumnDef } from "@tanstack/react-table";
import { Modal } from "antd";
import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface EmployeeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (employees: EmployeeResponseDto[]) => void;
  title?: string;
  message?: string;
  buttonText?: string;
  excludeEmployeeIds?: string[];
  multiSelect?: boolean;
}

interface SearchFormData {
  search: string;
  documentNumber: string;
  jobId?: string;
  branchId?: string;
  organizationId?: string;
}

const EmployeeSelectionModal = ({
  isOpen,
  onClose,
  onSelect,
  title = "Seleccionar Empleados",
  message = "Seleccione uno o más empleados:",
  buttonText = "Seleccionar",
  excludeEmployeeIds = [],
  multiSelect = true,
}: EmployeeSelectionModalProps) => {
  const { companyId } = useCookieSession();
  const [selectedEmployees, setSelectedEmployees] = useState<
    EmployeeResponseDto[]
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

  // Form for employee search filters
  const { register, handleSubmit, watch, setValue, control, reset } =
    useForm<SearchFormData>({
      defaultValues: {
        search: "",
        documentNumber: "",
        jobId: undefined,
        branchId: undefined,
        organizationId: undefined,
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
  const { data: employeesData, isLoading: isLoadingEmployees } =
    useGetEmployees({
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

  const handleLevelChange = (
    value: string,
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
    setSelectedEmployees([]);
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

  const handleEmployeeSelection = (employeeId: string, selected: boolean) => {
    if (selected) {
      const employee = employeesData?.data.find(
        (e) => e.publicId === employeeId
      );
      if (employee) {
        if (multiSelect) {
          setSelectedEmployees((prev) => [...prev, employee]);
        } else {
          setSelectedEmployees([employee]);
        }
      }
    } else {
      setSelectedEmployees((prev) =>
        prev.filter((e) => e.publicId !== employeeId)
      );
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (!multiSelect) return;

    if (selected) {
      const availableEmployees = (employeesData?.data || []).filter(
        (emp) => !excludeEmployeeIds.includes(emp.publicId)
      );
      setSelectedEmployees(availableEmployees);
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleConfirmSelection = () => {
    onSelect(selectedEmployees);
    handleClose();
  };

  // Filter employees to exclude specified IDs
  const filteredEmployees = (employeesData?.data || []).filter(
    (emp) => !excludeEmployeeIds.includes(emp.publicId)
  );

  // DataTable columns for employees
  const EMPLOYEE_COLUMNS: ColumnDef<EmployeeResponseDto>[] = [
    {
      id: "selection",
      header: () => {
        if (multiSelect) {
          return (
            <input
              type="checkbox"
              checked={
                selectedEmployees.length > 0 &&
                selectedEmployees.length === filteredEmployees.length &&
                filteredEmployees.length > 0
              }
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded"
            />
          );
        } else {
          return <span className="text-sm font-medium">Seleccionar</span>;
        }
      },
      cell: ({ row }) => {
        if (multiSelect) {
          return (
            <input
              type="checkbox"
              checked={selectedEmployees.some(
                (e) => e.publicId === row.original.publicId
              )}
              onChange={(e) =>
                handleEmployeeSelection(row.original.publicId, e.target.checked)
              }
              className="rounded"
            />
          );
        } else {
          return (
            <input
              type="radio"
              name="employee-selection"
              checked={selectedEmployees.some(
                (e) => e.publicId === row.original.publicId
              )}
              onChange={(e) =>
                handleEmployeeSelection(row.original.publicId, e.target.checked)
              }
              className="rounded"
            />
          );
        }
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "code",
      header: "Código",
    },
    {
      accessorKey: "firstName",
      header: "Nombres",
    },
    {
      accessorKey: "lastName",
      header: "Apellidos",
    },
    {
      accessorKey: "documentNumber",
      header: "Número de Documento",
    },
    {
      accessorKey: "personalEmail",
      header: "Email",
    },
    {
      accessorKey: "startDate",
      header: "Fecha de Inicio",
      cell: ({ row }) => {
        return DateTime.fromISO(row.getValue("startDate")).toFormat(
          "dd/MM/yyyy"
        );
      },
    },
    {
      accessorKey: "endDate",
      header: "Fecha de Término",
      cell: ({ row }) => {
        const endDate = row.getValue("endDate");
        return endDate
          ? DateTime.fromISO(endDate as string).toFormat("dd/MM/yyyy")
          : "-";
      },
    },
    {
      accessorKey: "isIndefiniteTerm",
      header: "Tipo de Contrato",
      cell: ({ row }) => {
        return row.getValue("isIndefiniteTerm") ? "Indefinido" : "Plazo Fijo";
      },
    },
    {
      accessorKey: "contractedHours",
      header: "Horas Contratadas",
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 text-lg font-semibold text-blue-800">
          <div className="p-2 bg-blue-100 rounded-lg">
            <SearchOutlined className="text-blue-600 text-xl" />
          </div>
          <span>{title}</span>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      width={1500}
      footer={null}
      maskClosable={false}
      closable={true}
      centered
    >
      <div className="space-y-6 py-4">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">{message}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col gap-4">
            <form
              onSubmit={handleSubmit(onSubmitSearch)}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-4 gap-4">
                <SystemInput
                  attribute="search"
                  label="Buscar"
                  control={control}
                  value={search}
                  placeholder="Buscar por Nombres o Apellidos"
                  onChange={(value) => handleLevelChange(value, "search")}
                  errors={{}}
                />
                <SystemInput
                  attribute="documentNumber"
                  label="Número de Documento"
                  control={control}
                  value={documentNumber}
                  placeholder="Buscar por Número de Documento"
                  onChange={(value) =>
                    handleLevelChange(value, "documentNumber")
                  }
                  errors={{}}
                />
                <SystemSelect
                  attribute="jobId"
                  label="Cargo"
                  control={control}
                  value={jobId}
                  placeholder="Seleccionar Cargo"
                  onChange={(value) => handleLevelChange(value, "jobId")}
                  options={jobs?.data.map((job: any) => ({
                    value: job.publicId,
                    label: job.name,
                  }))}
                  showClear={jobId !== undefined}
                  onClear={() => setValue("jobId", undefined)}
                />
                <SystemSelect
                  attribute="branchId"
                  label="Sucursal"
                  control={control}
                  value={branchId}
                  placeholder="Seleccionar Sucursal"
                  onChange={(value) => handleLevelChange(value, "branchId")}
                  options={branches?.data.map((branch: any) => ({
                    value: branch.publicId,
                    label: branch.name,
                  }))}
                  showClear={branchId !== undefined}
                  onClear={() => setValue("branchId", undefined)}
                />
                {companyId && (
                  <OrganizationSelector
                    control={control}
                    name="organizationId"
                    companyId={companyId}
                  />
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <CheckIOButton
                  color="default"
                  type="submit"
                  icon={<SearchOutlined />}
                  label="Buscar"
                />
                <CheckIOButton
                  color="info"
                  type="button"
                  onClick={handleClearSearch}
                  label="Limpiar"
                />
              </div>
            </form>
            <div className="flex flex-col">
              <DataTable
                columns={EMPLOYEE_COLUMNS}
                data={filteredEmployees}
                isLoading={isLoadingEmployees}
                enableRowSelection={false}
                noResultsMessage="No hay empleados disponibles."
                filterPlaceholder="Filtrar..."
                serverPagination={{
                  totalCount: pagination.totalCount,
                  currentPage: pagination.current,
                  pageSize: pagination.pageSize,
                  onPageChange: handlePaginationChange,
                }}
                queryKey={["employees", "selection"]}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 flex items-center gap-2"
          >
            <CloseCircleOutlined />
            Cancelar
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={selectedEmployees.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleOutlined />
            {buttonText} ({selectedEmployees.length})
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EmployeeSelectionModal;
