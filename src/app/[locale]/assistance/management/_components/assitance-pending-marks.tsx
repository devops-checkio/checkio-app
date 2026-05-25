import {
  CHEKIOButton,
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
import { useGetAllAssistancesPendingMarks } from "@/service/mantainer.service";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Hash,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import { MarkStatus } from "../../_components/assistance.dto";
import { renderMarkCell } from "../_utils/assistance-table-cells";
import ModalMarcaciones from "./modal-marcaciones";

interface AssistancePendingMarksProps {
  filters?: any;
}

const AssistancePendingMarks = ({ filters }: AssistancePendingMarksProps) => {
  const { getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const [selectedAssistanceId, setSelectedAssistanceId] = useState<
    string | null
  >(null);
  const [isMarcacionesModalOpen, setIsMarcacionesModalOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "asc" as "asc" | "desc",
  });

  // Combinar los filtros del componente padre con la paginación local
  const combinedFilters = {
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    ...filters, // Los filtros del componente padre tienen prioridad
  };

  const { data, isLoading } = useGetAllAssistancesPendingMarks(combinedFilters);

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data]);

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

  const renderPendingMarksCell = (marks: any[]) => {
    const pendingMarks =
      marks?.filter((m: any) => m.status === MarkStatus.WAITING_APPROVAL) || [];

    if (pendingMarks.length === 0) {
      return <div className="text-sm text-gray-400">Sin marcas pendientes</div>;
    }

    return (
      <div className="flex flex-col gap-1 text-sm">
        {pendingMarks.map((mark: any, idx: number) => {
          const time = DateTime.fromISO(mark.timestamp)
            .toUTC()
            .toFormat("HH:mm:ss");
          const typeLabel =
            mark.type === "CHECK_IN"
              ? "Entrada"
              : mark.type === "CHECK_OUT"
                ? "Salida"
                : mark.type;

          return (
            <div
              key={idx}
              className="flex items-center gap-2 px-2 py-1 bg-yellow-50 rounded border border-yellow-200"
            >
              <span className="font-medium text-yellow-800">{typeLabel}:</span>
              <span className="text-yellow-700">{time}</span>
              {mark.isManual && (
                <div title={`Marca manual - ${mark.adjustmentNote}`}>
                  <AlertCircle className="h-3 w-3 text-yellow-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const assistanceData = data?.data || [];
  const paginationData = data?.pagination || pagination;

  const TableHeaderCell = ({
    icon: Icon,
    label,
  }: {
    icon: React.ComponentType<{
      className?: string;
      style?: React.CSSProperties;
    }>;
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
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col">
          {isLoading ? (
            <>
              <div
                className="overflow-x-auto"
                data-tour="assistance-management-tab-table"
              >
                <CHEKIOTable className="rounded-none border-0 shadow-none">
                  <CHEKIOTableHeader>
                    <tr>
                      <TableHeaderCell icon={Calendar} label="Fecha" />
                      <TableHeaderCell icon={Hash} label="N° Documento" />
                      <TableHeaderCell icon={User} label="Nombre" />
                      <TableHeaderCell icon={LogIn} label="Entrada" />
                      <TableHeaderCell icon={LogOut} label="Salida" />
                      <TableHeaderCell
                        icon={AlertCircle}
                        label="Marcas Pendientes"
                      />
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        Acciones
                      </CHEKIOTableHead>
                    </tr>
                  </CHEKIOTableHeader>
                  <CHEKIOTableBody>
                    {[...Array(10)].map((_, index) => (
                      <CHEKIOTableRow key={index} index={index}>
                        {[...Array(7)].map((_, i) => (
                          <CHEKIOTableCell key={i} className="px-5 py-3.5">
                            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                          </CHEKIOTableCell>
                        ))}
                      </CHEKIOTableRow>
                    ))}
                  </CHEKIOTableBody>
                </CHEKIOTable>
              </div>
              <div
                className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between"
                data-tour="assistance-management-tab-pagination"
              >
                <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
                <div className="flex gap-2">
                  <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
                  <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
                  <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
                </div>
              </div>
            </>
          ) : assistanceData.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-24">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
                <AlertCircle className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                No hay asistencias con marcas pendientes de aprobación.
              </h3>
              <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
                No se encontraron asistencias con marcas pendientes para los
                filtros seleccionados.
              </p>
            </div>
          ) : (
            <>
              <div
                className="overflow-x-auto"
                data-tour="assistance-management-tab-table"
              >
                <CHEKIOTable className="rounded-none border-0 shadow-none">
                  <CHEKIOTableHeader>
                    <tr>
                      <TableHeaderCell icon={Calendar} label="Fecha" />
                      <TableHeaderCell icon={Hash} label="N° Documento" />
                      <TableHeaderCell icon={User} label="Nombre" />
                      <TableHeaderCell icon={LogIn} label="Entrada" />
                      <TableHeaderCell icon={LogOut} label="Salida" />
                      <TableHeaderCell
                        icon={AlertCircle}
                        label="Marcas Pendientes"
                      />
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        Acciones
                      </CHEKIOTableHead>
                    </tr>
                  </CHEKIOTableHeader>
                  <CHEKIOTableBody>
                    {assistanceData.map((assistance, index) => {
                      const date = DateTime.fromObject({
                        day: assistance.day,
                        month: assistance.month,
                        year: assistance.year,
                      }).toFormat("dd/MM/yyyy");

                      const startDate = assistance.Schedule?.startDate
                        ? DateTime.fromISO(
                            assistance.Schedule.startDate,
                          ).toUTC()
                        : null;
                      const endDate = assistance.Schedule?.endDate
                        ? DateTime.fromISO(assistance.Schedule.endDate).toUTC()
                        : null;

                      const marks = assistance.Marks ?? [];
                      const markStart =
                        marks.find(
                          (m: any) =>
                            m.type === "CHECK_IN" &&
                            !m.isAditional &&
                            m.isOfficial &&
                            !(m.scheduleBreakPublicId ?? m.scheduleBreakId),
                        ) ?? null;
                      const markEnd = marks.find(
                        (m: any) =>
                          m.type === "CHECK_OUT" &&
                          !m.isAditional &&
                          m.isOfficial &&
                          !(m.scheduleBreakPublicId ?? m.scheduleBreakId),
                      );

                      const scheduledStartTime = startDate
                        ? startDate.toFormat("HH:mm:ss")
                        : "--:--:--";
                      const scheduledEndTime = endDate
                        ? endDate.toFormat("HH:mm:ss")
                        : "--:--:--";

                      return (
                        <CHEKIOTableRow key={assistance.publicId} index={index}>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            {date}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5 font-medium">
                            {assistance.Employee.documentNumber}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5 font-medium">
                            {assistance.Employee.firstName}{" "}
                            {assistance.Employee.lastName}{" "}
                            {assistance.Employee.secondLastName}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            {renderMarkCell(markStart, "CHECK_IN")}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            {renderMarkCell(markEnd, "CHECK_OUT")}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            {renderPendingMarksCell(assistance.Marks)}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAssistanceId(assistance.publicId);
                                setIsMarcacionesModalOpen(true);
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                              title="Ver detalles"
                              aria-label="Ver detalles de marcación"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </CHEKIOTableCell>
                        </CHEKIOTableRow>
                      );
                    })}
                  </CHEKIOTableBody>
                </CHEKIOTable>
              </div>

              <div
                className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between"
                data-tour="assistance-management-tab-pagination"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {assistanceData.length} de{" "}
                    {paginationData.totalCount} resultados
                  </div>
                  {/* Selector de registros por página */}
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
                    onClick={() => handlePageChange(paginationData.current - 1)}
                    disabled={paginationData.current === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </CHEKIOButton>
                  <span className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                    Página {paginationData.current} de{" "}
                    {paginationData.totalPages}
                  </span>
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() => handlePageChange(paginationData.current + 1)}
                    disabled={
                      paginationData.current >= paginationData.totalPages
                    }
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
      {selectedAssistanceId && (
        <ModalMarcaciones
          isOpen={isMarcacionesModalOpen}
          onClose={() => {
            setIsMarcacionesModalOpen(false);
            setSelectedAssistanceId(null);
          }}
          assistanceId={selectedAssistanceId}
        />
      )}
    </>
  );
};

export default AssistancePendingMarks;
