"use client";

import TimeBankConfigModal from "@/app/[locale]/mantainers/time-bank/_components/time-bank-config-modal";
import {
  CHEKIOActionButton,
  CHEKIOButton,
  CHEKIOLoading,
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
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useGetTimeBanks } from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { DateTime } from "luxon";
import { useCallback, useState } from "react";
import { TimeBankStatus, TimeBankType } from "../../_components/time-bank.dto";
import TimeBankAgreementDetailModal from "./time-bank-agreement-detail-modal";

interface TimeBankAgreementsProps {
  employeeId: string;
  employeeName?: string;
  onDebitCredit: (agreement: any) => void;
}

enum TimeBankStatusLabel {
  ACTIVE = "Activo",
  EXPIRED = "Expirado",
  PENDING = "Pendiente",
}

const getStatusFromPeriod = (
  startDate: string | undefined,
  endDate: string | undefined,
): TimeBankStatus => {
  const now = DateTime.now().startOf("day");
  const start = startDate
    ? DateTime.fromISO(startDate).startOf("day")
    : null;
  const end = endDate ? DateTime.fromISO(endDate).startOf("day") : null;
  if (!start?.isValid || !end?.isValid) return TimeBankStatus.EXPIRED;
  if (now < start) return TimeBankStatus.PENDING;
  return now <= end ? TimeBankStatus.ACTIVE : TimeBankStatus.EXPIRED;
};

const getStatusBadge = (status: TimeBankStatus | string) => {
  if (status === TimeBankStatus.ACTIVE) {
    return (
      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
        {TimeBankStatusLabel.ACTIVE}
      </span>
    );
  }
  if (status === TimeBankStatus.PENDING) {
    return (
      <span className="inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
        {TimeBankStatusLabel.PENDING}
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
      {TimeBankStatusLabel.EXPIRED}
    </span>
  );
};

const getTypeBadge = (type: TimeBankType | string) => {
  const isEconomic =
    type === TimeBankType.ECONOMIC_HOURS || type === "ECONOMIC_HOURS";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
        isEconomic
          ? "bg-blue-100 text-blue-800"
          : "bg-purple-100 text-purple-800"
      }`}
    >
      {isEconomic ? "Hora Económica" : "Días de Descanso"}
    </span>
  );
};

export default function TimeBankAgreements({
  employeeId,
  employeeName,
  onDebitCredit,
}: TimeBankAgreementsProps) {
  const queryClient = useQueryClient();
  const { canCreate } = useCookieSession();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailAgreement, setDetailAgreement] = useState<any>(null);

  const {
    data: agreementsData,
    isLoading,
    error,
  } = useGetTimeBanks({
    employeeId,
    page,
    pageSize,
    sort: "desc",
  });

  const agreements = agreementsData?.data ?? [];
  const pagination = agreementsData?.pagination ?? {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["GetTimeBanks"] });
    setIsCreateModalOpen(false);
  }, [queryClient]);

  // Contar activos para los cards de resumen (sobre la página actual)
  const activeAgreements = agreements.filter(
    (a: any) =>
      getStatusFromPeriod(a.startDate, a.endDate) === TimeBankStatus.ACTIVE,
  );
  const totalAvailableHours = activeAgreements.reduce(
    (sum: number, a: any) => sum + (a.availableHours ?? 0),
    0,
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <CHEKIOLoading size="lg" variant="modern" text="Cargando pactos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        <p>Error al cargar los pactos de horas</p>
        <p className="text-sm">{(error as any).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <FileText className="h-5 w-5" />
              Pactos de Horas
            </h3>
            <p className="text-sm text-gray-500">
              Todos los acuerdos y pactos de banco de horas del empleado
            </p>
          </div>
          {canCreate(OrganizationPermissionCode.BANK_MAINTENANCE) && (
            <CHEKIOButton
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Nuevo Pacto
            </CHEKIOButton>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {pagination.totalCount}
            </div>
            <div className="text-sm text-gray-600">Total de Pactos</div>
          </div>
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {activeAgreements.length}
            </div>
            <div className="text-sm text-gray-600">Pactos Activos</div>
          </div>
          <div className="rounded-lg bg-orange-50 p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {totalAvailableHours.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Horas Disponibles</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900">Lista de Pactos</h4>
          <p className="text-sm text-gray-500">
            Gestiona los pactos de horas y realiza operaciones de débito y
            crédito
          </p>
        </div>
        <div className="p-4">
          {agreements.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-medium text-gray-600">
                No hay pactos de horas registrados para este empleado.
              </p>
            </div>
          ) : (
            <>
              <CHEKIOTable>
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>ID Pacto</CHEKIOTableHead>
                    <CHEKIOTableHead>Tipo</CHEKIOTableHead>
                    <CHEKIOTableHead>Período</CHEKIOTableHead>
                    <CHEKIOTableHead>Horas Totales</CHEKIOTableHead>
                    <CHEKIOTableHead>Disponibles</CHEKIOTableHead>
                    <CHEKIOTableHead>Utilizadas</CHEKIOTableHead>
                    <CHEKIOTableHead>Estado</CHEKIOTableHead>
                    <CHEKIOTableHead>Acciones</CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {agreements.map((agreement: any, index: number) => {
                    // El campo puede venir como `type` o `timeBankType` según el endpoint
                    const bankType =
                      agreement.type ?? agreement.timeBankType ?? "";
                    const totalHours =
                      (agreement.availableHours ?? 0) +
                      (agreement.usedHours ?? 0);
                    const status = getStatusFromPeriod(
                      agreement.startDate,
                      agreement.endDate,
                    );

                    return (
                      <CHEKIOTableRow
                        key={agreement.publicId ?? index}
                        index={index}
                      >
                        <CHEKIOTableCell>
                          <span className="font-mono text-sm text-gray-600">
                            {agreement.publicId?.slice(-8) ?? "—"}
                          </span>
                        </CHEKIOTableCell>

                        <CHEKIOTableCell>
                          {getTypeBadge(bankType)}
                        </CHEKIOTableCell>

                        <CHEKIOTableCell>
                          <div className="text-sm">
                            <div>
                              {agreement.startDate
                                ? DateTime.fromISO(agreement.startDate)
                                    .toUTC()
                                    .toFormat("dd/MM/yyyy")
                                : "—"}
                            </div>
                            <div className="text-gray-400">hasta</div>
                            <div>
                              {agreement.endDate
                                ? DateTime.fromISO(agreement.endDate)
                                    .toUTC()
                                    .toFormat("dd/MM/yyyy")
                                : "—"}
                            </div>
                          </div>
                        </CHEKIOTableCell>

                        <CHEKIOTableCell>
                          <div className="text-center">
                            <div className="font-medium text-blue-600">
                              {totalHours.toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500">horas</div>
                          </div>
                        </CHEKIOTableCell>

                        <CHEKIOTableCell>
                          <div className="text-center">
                            <div className="font-medium text-green-600">
                              {(agreement.availableHours ?? 0).toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500">horas</div>
                          </div>
                        </CHEKIOTableCell>

                        <CHEKIOTableCell>
                          <div className="text-center">
                            <div className="font-medium text-orange-600">
                              {(agreement.usedHours ?? 0).toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500">horas</div>
                          </div>
                        </CHEKIOTableCell>

                        <CHEKIOTableCell>
                          {getStatusBadge(status)}
                        </CHEKIOTableCell>

                        <CHEKIOTableCell>
                          <div className="flex flex-row items-center justify-center gap-2">
                            <CHEKIOActionButton
                              variant="edit"
                              onClick={() => onDebitCredit(agreement)}
                              title="Debitar / Creditar horas"
                              aria-label="Debitar o creditar horas en este pacto"
                            >
                              <TrendingUp className="h-4 w-4" />
                            </CHEKIOActionButton>
                            <CHEKIOActionButton
                              variant="view"
                              onClick={() => setDetailAgreement(agreement)}
                              title="Ver detalle del pacto"
                              aria-label="Ver detalle del pacto"
                            >
                              <Eye className="h-4 w-4" />
                            </CHEKIOActionButton>
                          </div>
                        </CHEKIOTableCell>
                      </CHEKIOTableRow>
                    );
                  })}
                </CHEKIOTableBody>
              </CHEKIOTable>

              {/* Pagination */}
              <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {agreements.length} de {pagination.totalCount}{" "}
                    resultados
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="whitespace-nowrap text-sm font-medium text-gray-700">
                      Registros por página:
                    </label>
                    <CHEKIOSelect
                      value={pageSize.toString()}
                      onValueChange={(v) =>
                        handlePageSizeChange(parseInt(v, 10))
                      }
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
                  <div className="border bg-white px-4 py-2 text-sm text-gray-700">
                    Página {pagination.current} de {pagination.totalPages}
                  </div>
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
        </div>
      </div>

      {/* Help Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Clock className="h-5 w-5" />
          ¿Cómo funciona?
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium text-gray-900">Tipos de Pactos</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span>
                  <strong>Hora Económica:</strong> Acumulación para compensación
                  económica
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <span>
                  <strong>Días de Descanso:</strong> Acumulación para días libres
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-medium text-gray-900">Operaciones</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>
                  <strong>Creditar:</strong> Agregar horas al banco
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-orange-600" />
                <span>
                  <strong>Debitar:</strong> Consumir horas del banco
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TimeBankConfigModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        preselectedEmployeePublicId={employeeId}
        preselectedEmployeeName={employeeName}
      />

      {detailAgreement && (
        <TimeBankAgreementDetailModal
          isOpen={!!detailAgreement}
          onClose={() => setDetailAgreement(null)}
          agreement={detailAgreement}
        />
      )}
    </div>
  );
}
