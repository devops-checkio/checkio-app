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
import { useGetAllAssistancesCompleted } from "@/service/mantainer.service";
import {
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Hash,
  LogIn,
  LogOut,
  Timer,
  User,
} from "lucide-react";
import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import {
  calculateDelays,
  calculateOvertime,
  renderDelays,
  renderOvertime,
} from "../_utils/assistance-delays-overtime";
import {
  renderBreaksCell,
  renderMarkCell,
} from "../_utils/assistance-table-cells";
import ModalMarcaciones from "./modal-marcaciones";

interface AssistanceCompletedProps {
  filters?: any;
}

const AssistanceCompleted = ({ filters }: AssistanceCompletedProps) => {
  const { getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );
  const [shouldClearSelection, setShouldClearSelection] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "asc" as "asc" | "desc",
  });
  const [selectedAssistanceId, setSelectedAssistanceId] = useState<
    string | null
  >(null);
  const [isMarcacionesModalOpen, setIsMarcacionesModalOpen] = useState(false);
  const handleOpenModal = useCallback((employeeId: number) => {
    setSelectedEmployeeId(employeeId);
    setIsModalOpen(true);
  }, []);

  // Combinar los filtros del componente padre con la paginación local
  const combinedFilters = {
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    ...filters, // Los filtros del componente padre tienen prioridad
  };

  const { data, isLoading } = useGetAllAssistancesCompleted(combinedFilters);

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
                      <TableHeaderCell icon={Clock} label="Horario" />
                      <TableHeaderCell icon={User} label="Nombre" />
                      <TableHeaderCell icon={LogIn} label="Entrada" />
                      <TableHeaderCell icon={Clock} label="Colaciones" />
                      <TableHeaderCell icon={LogOut} label="Salida" />
                      <TableHeaderCell icon={Clock} label="Adicionales" />
                      <TableHeaderCell icon={Timer} label="Atrasos" />
                      <TableHeaderCell
                        icon={Camera}
                        label="Verificación Fotos"
                      />
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        Acciones
                      </CHEKIOTableHead>
                    </tr>
                  </CHEKIOTableHeader>
                  <CHEKIOTableBody>
                    {[...Array(10)].map((_, index) => (
                      <CHEKIOTableRow key={index} index={index}>
                        {[...Array(11)].map((_, i) => (
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
                <Clock className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                No hay resultados.
              </h3>
              <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
                No se encontraron asistencias completadas para los filtros
                seleccionados.
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
                      <TableHeaderCell icon={Clock} label="Horario" />
                      <TableHeaderCell icon={User} label="Nombre" />
                      <TableHeaderCell icon={LogIn} label="Entrada" />
                      <TableHeaderCell icon={Clock} label="Colaciones" />
                      <TableHeaderCell icon={LogOut} label="Salida" />
                      <TableHeaderCell icon={Clock} label="Adicionales" />
                      <TableHeaderCell icon={Timer} label="Atrasos" />
                      <TableHeaderCell
                        icon={Camera}
                        label="Verificación Fotos"
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

                      const startDate = DateTime.fromISO(
                        assistance.Schedule.startDate,
                      ).toUTC();
                      const endDate = DateTime.fromISO(
                        assistance.Schedule.endDate,
                      ).toUTC();

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
                      const colacionMarks = marks
                        .filter(
                          (m: any) =>
                            !!(m.scheduleBreakPublicId ?? m.scheduleBreakId),
                        )
                        .sort(
                          (a, b) =>
                            new Date(a.timestamp).getTime() -
                            new Date(b.timestamp).getTime(),
                        );

                      const scheduledStartTime = startDate
                        ? startDate.toFormat("HH:mm:ss")
                        : "--:--:--";
                      const scheduledEndTime = endDate
                        ? endDate.toFormat("HH:mm:ss")
                        : "--:--:--";

                      const photoData =
                        (assistance as any).photoVerification || {};
                      const totalPhotos = photoData.totalPhotos || 0;
                      const validPhotos = photoData.validPhotos || 0;
                      const invalidPhotos = photoData.invalidPhotos || 0;
                      const potentiallyHacked =
                        photoData.potentiallyHacked || false;

                      return (
                        <CHEKIOTableRow key={assistance.publicId} index={index}>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            {date}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5 font-medium text-xs">
                            {assistance.Employee.documentNumber}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-gray-900">
                                {assistance.Schedule.name}
                              </span>
                              <span className="text-xs text-gray-500 mt-1">
                                <span className="px-2 py-0.5 rounded bg-gray-100">
                                  {scheduledStartTime} - {scheduledEndTime}
                                </span>
                              </span>
                            </div>
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5 font-medium text-xs">
                            {assistance.Employee.firstName}{" "}
                            {assistance.Employee.lastName}{" "}
                            {assistance.Employee.secondLastName}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            {renderMarkCell(markStart, "CHECK_IN")}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            {renderBreaksCell(colacionMarks)}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            {renderMarkCell(markEnd, "CHECK_OUT")}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            {renderOvertime(
                              calculateOvertime(markEnd, endDate),
                            )}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            {renderDelays(
                              calculateDelays(
                                markStart,
                                startDate,
                                markEnd,
                                endDate,
                              ),
                            )}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell className="px-5 py-3.5">
                            {totalPhotos === 0 ? (
                              <div className="flex flex-col gap-1 text-sm">
                                <span className="text-gray-400">Sin datos</span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1 text-sm">
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">
                                    Válidas:
                                  </span>
                                  <span className="font-medium text-green-600">
                                    {validPhotos}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">
                                    Inválidas:
                                  </span>
                                  <span className="font-medium text-red-600">
                                    {invalidPhotos}
                                  </span>
                                </div>
                                {potentiallyHacked && (
                                  <div className="mt-1">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Posible alteración
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
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

export default AssistanceCompleted;
