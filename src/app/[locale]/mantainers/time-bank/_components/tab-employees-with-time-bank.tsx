"use client";

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
import { useGetEmployeesWithTimeBank } from "@/service/mantainer.service";
import { HeaderMapping, downloadExcel } from "@/utils/excel";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Eye,
  Mail,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  EmployeeWithTimeBankFindFilterDto,
  EmployeeWithTimeBankResponseDto,
} from "./time-bank.dto";
import TimeBankConfigModal from "./time-bank-config-modal";

enum TimeBankTypeFilter {
  ALL = "all",
  ECONOMIC_HOURS = "ECONOMIC_HOURS",
  REST_DAYS = "REST_DAYS",
}

const EMPLOYEE_COLUMNS_EXCEL: HeaderMapping[] = [
  {
    attribute: "firstName",
    header: "Nombre",
    render: (v: string) => (v.includes(":") ? "[Datos Encriptados]" : v),
  },
  {
    attribute: "lastName",
    header: "Apellido",
    render: (v: string) => (v.includes(":") ? "[Datos Encriptados]" : v),
  },
  {
    attribute: "documentNumber",
    header: "Documento",
    render: (v: string) => (v.includes(":") ? "[Datos Encriptados]" : v),
  },
  {
    attribute: "personalEmail",
    header: "Email",
    render: (v: string) => (v.includes(":") ? "[Datos Encriptados]" : v),
  },
  {
    attribute: "contractedHours",
    header: "Horas Contratadas",
    render: (v: number) => `${v} horas/semana`,
  },
  {
    attribute: "timeBank.type",
    header: "Tipo de Banco",
    render: (v: string) =>
      v === "ECONOMIC_HOURS" ? "Hora Económica" : "Días de Descanso",
  },
  {
    attribute: "timeBank.availableHours",
    header: "Horas Disponibles",
    render: (v: number) => `${v.toFixed(1)} horas`,
  },
  {
    attribute: "timeBank.usedHours",
    header: "Horas Usadas",
    render: (v: number) => `${v.toFixed(1)} horas`,
  },
  {
    attribute: "timeBank.endDate",
    header: "Fecha de Vencimiento",
    render: (v: string) => DateTime.fromISO(v).toFormat("dd/MM/yyyy"),
  },
];

function TabEmployeesWithTimeBank() {
  const router = useRouter();
  const { companyId, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<TimeBankTypeFilter>(
    TimeBankTypeFilter.ALL,
  );
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const filter: EmployeeWithTimeBankFindFilterDto = {
    companyId: companyId?.toString(),
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(typeFilter !== TimeBankTypeFilter.ALL
      ? { timeBankType: typeFilter as "ECONOMIC_HOURS" | "REST_DAYS" }
      : {}),
  };

  const { data, isLoading } = useGetEmployeesWithTimeBank(filter);

  const employees: EmployeeWithTimeBankResponseDto[] = data?.data ?? [];
  const pagination = data?.pagination ?? {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }, []);

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value as TimeBankTypeFilter);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  const handleViewEmployee = useCallback(
    (employeePublicId: string) => {
      router.push(`/mantainers/time-bank/${employeePublicId}`);
    },
    [router],
  );

  const handleCreateTimeBank = useCallback(
    (employeePublicId: string, employeeName?: string) => {
      setSelectedEmployeeId(employeePublicId);
      setSelectedEmployeeName(employeeName || employeePublicId.slice(-8));
      setIsConfigModalOpen(true);
    },
    [],
  );

  const handleCloseConfigModal = useCallback(() => {
    setIsConfigModalOpen(false);
    setSelectedEmployeeId(null);
    setSelectedEmployeeName("");
  }, []);

  const handleExcelDownload = useCallback(() => {
    if (!employees.length) return;
    downloadExcel(employees, EMPLOYEE_COLUMNS_EXCEL, {
      filename: "empleados-con-banco-horas",
      sheetName: "Empleados con Banco de Horas",
    });
  }, [employees]);

  const getTypeBadge = (type: string) => {
    const isEconomic = type === "ECONOMIC_HOURS";
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          isEconomic ? "bg-indigo-50 text-indigo-700" : "bg-violet-50 text-violet-700"
        }`}
      >
        {isEconomic ? (
          <DollarSign className="h-3 w-3" />
        ) : (
          <CalendarDays className="h-3 w-3" />
        )}
        {isEconomic ? "Hora Económica" : "Días de Descanso"}
      </span>
    );
  };

  const TableHeaderCell = ({
    icon: Icon,
    label,
  }: {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    label: string;
  }) => (
    <CHEKIOTableHead className="min-w-[100px]">
      <span className="flex items-center gap-2">
        <Icon
          className="h-4 w-4"
          style={{ color: `${templateUser.primary}99` }}
        />
        {label}
      </span>
    </CHEKIOTableHead>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50/50 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[200px]">
            <CHEKIOInput
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre o documento..."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="min-w-[160px]">
            <CHEKIOSelect value={typeFilter} onValueChange={handleTypeFilterChange}>
              <CHEKIOSelectTrigger>
                <CHEKIOSelectValue placeholder="Tipo de banco" />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                <CHEKIOSelectItem value={TimeBankTypeFilter.ALL}>
                  Todos los tipos
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={TimeBankTypeFilter.ECONOMIC_HOURS}>
                  Hora Económica
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={TimeBankTypeFilter.REST_DAYS}>
                  Días de Descanso
                </CHEKIOSelectItem>
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          </div>
          <CHEKIOButton variant="search" onClick={handleSearch}>
            <Search className="h-4 w-4" />
            Buscar
          </CHEKIOButton>
          {(search || typeFilter !== TimeBankTypeFilter.ALL) && (
            <CHEKIOButton variant="refresh" onClick={handleClearSearch}>
              <RefreshCw className="h-4 w-4" />
              Limpiar
            </CHEKIOButton>
          )}
        </div>
        <CHEKIOButton
          variant="approve"
          onClick={handleExcelDownload}
          disabled={!employees.length}
        >
          <Download className="h-4 w-4" />
          Excel
        </CHEKIOButton>
      </div>

      {isLoading ? (
        <>
          <div className="overflow-x-auto">
            <CHEKIOTable className="rounded-none border-0 shadow-none">
              <CHEKIOTableHeader>
                <tr>
                  <TableHeaderCell icon={User} label="Empleado" />
                  <TableHeaderCell icon={Clock} label="Horas Contratadas" />
                  <TableHeaderCell icon={DollarSign} label="Banco de Horas" />
                  <TableHeaderCell icon={CalendarDays} label="Vencimiento" />
                  <CHEKIOTableHead className="min-w-[100px] text-right">
                    Acciones
                  </CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {[...Array(pageSize)].map((_, index) => (
                  <CHEKIOTableRow key={index} index={index}>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
                        <div className="space-y-2">
                          <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                          <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
                        </div>
                      </div>
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="space-y-2">
                        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      </div>
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                        <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                      </div>
                    </CHEKIOTableCell>
                  </CHEKIOTableRow>
                ))}
              </CHEKIOTableBody>
            </CHEKIOTable>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
        </>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-24">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
            <User className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            No se encontraron empleados con banco de horas
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
            Los empleados con banco de horas configurado aparecerán aquí.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <CHEKIOTable className="rounded-none border-0 shadow-none">
              <CHEKIOTableHeader>
                <tr>
                  <TableHeaderCell icon={User} label="Empleado" />
                  <TableHeaderCell icon={Clock} label="Horas Contratadas" />
                  <TableHeaderCell icon={DollarSign} label="Banco de Horas" />
                  <TableHeaderCell icon={CalendarDays} label="Vencimiento" />
                  <CHEKIOTableHead className="min-w-[100px] text-right">
                    Acciones
                  </CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {employees.map((emp, index) => {
                  const isEncrypted = emp.firstName?.includes(":");
                  const fullName =
                    !isEncrypted && emp.firstName
                      ? `${emp.firstName} ${emp.lastName ?? ""}`.trim()
                      : null;
                  const tb = (emp as { timeBank?: { type?: string; availableHours?: number; usedHours?: number; endDate?: string } }).timeBank;

                  return (
                    <CHEKIOTableRow key={emp.publicId} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            {isEncrypted ? (
                              <>
                                <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                                  Datos Encriptados
                                </span>
                                <div className="text-xs text-gray-400">
                                  ID: {emp.publicId?.slice(-8)}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-medium text-gray-900">
                                  {fullName}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Mail className="h-3 w-3" />
                                  {emp.personalEmail}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Doc: {emp.documentNumber}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </CHEKIOTableCell>

                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{emp.contractedHours}h</span>
                          <span className="text-gray-500">/sem</span>
                        </div>
                      </CHEKIOTableCell>

                      <CHEKIOTableCell className="px-5 py-3.5">
                        {tb ? (
                          <div className="space-y-1">
                            {getTypeBadge(tb.type ?? "")}
                            <div className="flex gap-3 text-xs">
                              <span className="flex items-center gap-1 text-green-600">
                                <TrendingUp className="h-3 w-3" />
                                {(tb.availableHours ?? 0).toFixed(1)}h disp.
                              </span>
                              <span className="flex items-center gap-1 text-orange-600">
                                <TrendingDown className="h-3 w-3" />
                                {(tb.usedHours ?? 0).toFixed(1)}h usadas
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sin banco</span>
                        )}
                      </CHEKIOTableCell>

                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {tb?.endDate ? (
                          DateTime.fromISO(tb.endDate).toFormat("dd/MM/yyyy")
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </CHEKIOTableCell>

                      <CHEKIOTableCell className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleViewEmployee(emp.publicId)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                            title="Ver detalle"
                            aria-label="Ver detalle del empleado"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleCreateTimeBank(emp.publicId, fullName ?? undefined)
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                            title="Nuevo pacto"
                            aria-label="Crear nuevo pacto de banco de horas"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  );
                })}
              </CHEKIOTableBody>
            </CHEKIOTable>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Mostrando {employees.length} de {pagination.totalCount} resultados
              </div>
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-medium text-gray-700">
                  Registros por página
                </label>
                <CHEKIOSelect
                  value={pageSize.toString()}
                  onValueChange={(v) => handlePageSizeChange(parseInt(v, 10))}
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
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </CHEKIOButton>
              <span className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                Página {pagination.current} de {pagination.totalPages}
              </span>
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pagination.totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </CHEKIOButton>
            </div>
          </div>
        </>
      )}

      {isConfigModalOpen && selectedEmployeeId && (
        <TimeBankConfigModal
          isOpen={isConfigModalOpen}
          onClose={handleCloseConfigModal}
          onSuccess={() => {
            setRefetchTrigger((p) => p + 1);
            handleCloseConfigModal();
          }}
          preselectedEmployeePublicId={selectedEmployeeId}
          preselectedEmployeeName={
            selectedEmployeeName || selectedEmployeeId.slice(-8)
          }
        />
      )}
    </div>
  );
}

export default TabEmployeesWithTimeBank;
