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
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { PaginationFilterDto } from "@/dto/pagination";
import { useToast } from "@/hooks/use-toast";
import {
  useAutocomplete,
  useGetAllAssistancesAbsent,
} from "@/service/mantainer.service";
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
  Plus,
  PlusCircle,
  Sun,
  Timer,
  User,
  UserPlus,
} from "lucide-react";
import { DateTime } from "luxon";
import React, { useCallback, useEffect, useState } from "react";
import { isAssistanceDayEditable } from "../_utils/assistance-date-lock";
import {
  delaysFromResume,
  renderDelays,
} from "../_utils/assistance-delays-overtime";
import {
  renderAdditionalMarks,
  renderBreaksCell,
  renderMarkCell,
} from "../_utils/assistance-table-cells";
import AssistanceCreatorModal from "./assistance-creator";
import ModalAutocompleteAssistance from "./modal-autocomplete-assitance";
import { ModalBulkFreeDay } from "./modal-bulk-free-day";
import ModalCompleteAssistance from "./modal-complete-assitance";
import ModalMarcaciones from "./modal-marcaciones";
import ModalMassAssignmentSchedule from "./modal-mass-assignment-schedule";

interface AssistanceAbsentProps {
  filters?: any;
  companyId?: string;
}

const AssistanceAbsent = ({ filters, companyId }: AssistanceAbsentProps) => {
  const { toast } = useToast();
  const { canCreate, canUpdate, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const canCreateAssistance = canCreate(
    OrganizationPermissionCode.ASSISTANCE_MANAGMENT_OPERATIONS,
  );
  const canEditAssistance = canUpdate(
    OrganizationPermissionCode.ASSISTANCE_MANAGMENT_OPERATIONS,
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isModalAutocompleteOpen, setIsModalAutocompleteOpen] = useState(false);
  const [isModalCompleteOpen, setIsModalCompleteOpen] = useState(false);
  const [isModalMassAssignmentOpen, setIsModalMassAssignmentOpen] =
    useState(false);
  const [isBulkFreeDayOpen, setIsBulkFreeDayOpen] = useState(false);
  const [isModalCreatorOpen, setIsModalCreatorOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "desc" as "asc" | "desc",
  });
  const [selectedAssistanceId, setSelectedAssistanceId] = useState<
    string | null
  >(null);
  const [isMarcacionesModalOpen, setIsMarcacionesModalOpen] = useState(false);

  const clearSelection = () => {
    setSelectedRowKeys([]);
  };

  const { mutateAsync: autocomplete, isPending: isAutocompletePending } =
    useAutocomplete();

  const { data, isLoading } = useGetAllAssistancesAbsent({
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    companyId,
    ...filters,
  });

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

  const handleRowSelection = (publicId: string, isSelected: boolean) => {
    setSelectedRowKeys((prev) => {
      if (isSelected) {
        return [...prev, publicId];
      } else {
        return prev.filter((id) => id !== publicId);
      }
    });
  };

  const assistanceData = (data?.data || []).filter((assistance) => {
    const marks = assistance.Marks ?? [];
    const hasOfficialMarks = marks.some(
      (mark: { isOfficial?: boolean; isAditional?: boolean }) =>
        mark.isOfficial === true && mark.isAditional === false,
    );
    return !hasOfficialMarks;
  });
  const selectedAssistances = assistanceData.filter((a) =>
    selectedRowKeys.includes(a.publicId),
  );
  const editableSelectedAssistances = selectedAssistances.filter((a) =>
    isAssistanceDayEditable(a),
  );
  const editableSelectedRowKeys = editableSelectedAssistances.map(
    (a) => a.publicId,
  );
  const firstEditableAssistance = editableSelectedAssistances[0] ?? null;
  const paginationData = data?.pagination || pagination;

  const TableHeaderCell = ({
    icon: Icon,
    label,
    className,
  }: {
    icon: React.ComponentType<{
      className?: string;
      style?: React.CSSProperties;
    }>;
    label: string;
    className?: string;
  }) => (
    <CHEKIOTableHead className={className || "min-w-[100px]"}>
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
        <div
          className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3"
          data-tour="assistance-management-tab-toolbar"
        >
          <div className="flex gap-3">
            {canCreateAssistance && (
              <CHEKIOButton
                variant="primary"
                onClick={() => setIsModalCreatorOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                Crear Asistencias
              </CHEKIOButton>
            )}
            {selectedRowKeys.length > 0 && (
              <>
                <CHEKIOButton
                  variant="primary"
                  onClick={() => setIsModalAutocompleteOpen(true)}
                  disabled={editableSelectedRowKeys.length === 0}
                >
                  <Clock className="h-4 w-4" />
                  Autocompletar Automático
                </CHEKIOButton>
                <CHEKIOButton
                  variant="primary"
                  onClick={() => setIsModalCompleteOpen(true)}
                  disabled={editableSelectedRowKeys.length === 0}
                >
                  <Clock className="h-4 w-4" />
                  Autocompletar Manual
                </CHEKIOButton>
                <CHEKIOButton
                  variant="primary"
                  onClick={() => setIsModalMassAssignmentOpen(true)}
                  disabled={editableSelectedRowKeys.length === 0}
                >
                  <PlusCircle className="h-4 w-4" />
                  Asignar Horarios
                </CHEKIOButton>
                {canEditAssistance && (
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() => setIsBulkFreeDayOpen(true)}
                    disabled={editableSelectedRowKeys.length === 0}
                  >
                    <Sun className="h-4 w-4" />
                    Dar día libre
                  </CHEKIOButton>
                )}
              </>
            )}
          </div>
        </div>
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
                      <CHEKIOTableHead className="w-12 min-w-[48px]" />
                      <TableHeaderCell icon={Calendar} label="Fecha" />
                      <TableHeaderCell icon={Hash} label="N° Documento" />
                      <TableHeaderCell icon={User} label="Nombre" />
                      <TableHeaderCell icon={Clock} label="Horario" />
                      <TableHeaderCell icon={LogIn} label="Entrada" />
                      <TableHeaderCell icon={Clock} label="Colaciones" />
                      <TableHeaderCell icon={LogOut} label="Salida" />
                      <TableHeaderCell icon={Plus} label="Adicionales" />
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
                    {[...Array(pagination.pageSize)].map((_, index) => (
                      <CHEKIOTableRow key={index} index={index}>
                        <CHEKIOTableCell className="px-5 py-3.5">
                          <div className="h-4 w-4 animate-pulse rounded border-gray-200 bg-gray-200" />
                        </CHEKIOTableCell>
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
                <UserPlus className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                No hay resultados.
              </h3>
              <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
                No se encontraron asistencias ausentes para los filtros
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
                      <CHEKIOTableHead className="w-12 min-w-[48px]">
                        <input
                          type="checkbox"
                          checked={
                            selectedRowKeys.length === assistanceData.length &&
                            assistanceData.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRowKeys(
                                assistanceData.map((item) => item.publicId),
                              );
                            } else {
                              setSelectedRowKeys([]);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </CHEKIOTableHead>
                      <TableHeaderCell icon={Calendar} label="Fecha" />
                      <TableHeaderCell icon={Hash} label="N° Documento" />
                      <TableHeaderCell icon={User} label="Nombre" />
                      <TableHeaderCell icon={Clock} label="Horario" />
                      <TableHeaderCell icon={LogIn} label="Entrada" />
                      <TableHeaderCell
                        icon={Clock}
                        label="Colaciones"
                        className="min-w-[100px]"
                      />
                      <TableHeaderCell icon={LogOut} label="Salida" />
                      <TableHeaderCell icon={Plus} label="Adicionales" />
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

                      const isSelected = selectedRowKeys.includes(
                        assistance.publicId,
                      );

                      return (
                        <React.Fragment key={assistance.publicId}>
                          <CHEKIOTableRow index={index}>
                            <CHEKIOTableCell className="px-5 py-3.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) =>
                                  handleRowSelection(
                                    assistance.publicId,
                                    e.target.checked,
                                  )
                                }
                                className="rounded border-gray-300 text-xs"
                              />
                            </CHEKIOTableCell>
                            <CHEKIOTableCell className="px-5 py-3.5">
                              {date}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell className="px-5 py-3.5 font-medium text-xs">
                              {assistance.Employee.documentNumber}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell className="px-5 py-3.5 font-medium text-xs">
                              {assistance.Employee.firstName}{" "}
                              {assistance.Employee.lastName}{" "}
                              {assistance.Employee.secondLastName}
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
                            <CHEKIOTableCell className="px-5 py-3.5">
                              {renderMarkCell(markStart, "CHECK_IN")}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell className="px-5 py-3.5">
                              {renderBreaksCell(colacionMarks, {
                                textSize: "xs",
                              })}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell className="px-5 py-3.5">
                              {renderMarkCell(markEnd, "CHECK_OUT")}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell className="px-5 py-3.5">
                              {renderAdditionalMarks(assistance.Marks)}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell className="px-5 py-3.5">
                              {renderDelays(
                                delaysFromResume(assistance.resume),
                              )}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell className="px-5 py-3.5">
                              {totalPhotos === 0 ? (
                                <div className="flex flex-col gap-1 text-xs">
                                  <span className="text-gray-400">
                                    Sin datos
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1 text-xs">
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
                        </React.Fragment>
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
                      onValueChange={(value: string) => {
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
      <AssistanceCreatorModal
        isOpen={isModalCreatorOpen}
        onClose={() => setIsModalCreatorOpen(false)}
        onSuccess={() => {
          toast({
            title: "Éxito",
            description: "Registros de asistencia creados correctamente",
          });
        }}
      />
      <ModalAutocompleteAssistance
        isOpen={isModalAutocompleteOpen}
        onClose={() => setIsModalAutocompleteOpen(false)}
        assistanceIds={editableSelectedRowKeys}
        cleanSelectedRows={() => clearSelection()}
      />
      {isModalCompleteOpen && firstEditableAssistance && (
        <ModalCompleteAssistance
          isOpen={isModalCompleteOpen}
          onClose={() => setIsModalCompleteOpen(false)}
          assistance={firstEditableAssistance}
          cleanSelectedRows={() => clearSelection()}
        />
      )}
      {isModalMassAssignmentOpen && (
        <ModalMassAssignmentSchedule
          isOpen={isModalMassAssignmentOpen}
          onClose={() => setIsModalMassAssignmentOpen(false)}
          assistances={
            data?.data.filter((x) =>
              editableSelectedRowKeys.includes(x.publicId),
            ) || []
          }
          cleanSelectedDays={() => clearSelection()}
        />
      )}
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
      <ModalBulkFreeDay
        open={isBulkFreeDayOpen}
        onOpenChange={setIsBulkFreeDayOpen}
        assistancePublicIds={editableSelectedRowKeys}
        onCompleted={() => clearSelection()}
      />
    </>
  );
};

export default AssistanceAbsent;
