"use client";

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
import {
  AssistanceResponseDto,
  AssistanceStatus,
} from "@/app/[locale]/assistance/_components/assistance.dto";
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Hash,
  Layers,
  User,
} from "lucide-react";
import { DateTime } from "luxon";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ModalMarcacionesStudent from "./modal-marcaciones-student";

interface StudentTableProps {
  data?: { data: AssistanceResponseDto[]; pagination: PaginationFilterDto };
  isLoading: boolean;
  filters?: any;
}

const STATUS_BADGE_CLASSES: Record<AssistanceStatus, string> = {
  [AssistanceStatus.COMPLETED]: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  [AssistanceStatus.INCOMPLETE]: "bg-amber-50 text-amber-700 border border-amber-100",
  [AssistanceStatus.ABSENT]: "bg-red-50 text-red-700 border border-red-100",
  [AssistanceStatus.WITHOUT_SCHEDULE]: "bg-gray-50 text-gray-600 border border-gray-200",
};

const STATUS_LABELS: Record<AssistanceStatus, string> = {
  [AssistanceStatus.COMPLETED]: "Completada",
  [AssistanceStatus.INCOMPLETE]: "Incompleta",
  [AssistanceStatus.ABSENT]: "Ausente",
  [AssistanceStatus.WITHOUT_SCHEDULE]: "Sin horario",
};

export function StudentTable({ data, isLoading, filters }: StudentTableProps) {
  const t = useTranslations("assistanceManagementStudent");
  const { getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data?.pagination]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, current: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize: newPageSize, current: 1 }));
  }, []);

  const paginationData = data?.pagination || pagination;
  const assistanceData = data?.data || [];

  const TableHead = ({
    icon: Icon,
    label,
    className,
  }: {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    label: string;
    className?: string;
  }) => (
    <CHEKIOTableHead className={className || "min-w-[120px]"}>
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
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <p className="text-sm text-gray-500">{t("table.loading")}</p>
            </div>
          </div>
        ) : assistanceData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 mb-4">
              <User className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <CHEKIOTable>
                <CHEKIOTableHeader>
                  <tr>
                    <TableHead icon={User} label={t("table.name")} />
                    <TableHead icon={Hash} label={t("table.document")} />
                    <TableHead icon={Calendar} label={t("table.date")} />
                    <TableHead icon={Building2} label={t("table.establishment")} />
                    <TableHead icon={Layers} label={t("table.blocks")} />
                    <CHEKIOTableHead className="min-w-[120px]">
                      {t("table.status")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[80px]">
                      {t("table.actions")}
                    </CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {assistanceData.map((assistance, index) => {
                    const dateStr = DateTime.fromObject({
                      year: assistance.year,
                      month: assistance.month,
                      day: assistance.day,
                    }).toFormat("dd/MM/yyyy");

                    const fullName = [
                      assistance.Employee?.firstName,
                      assistance.Employee?.lastName,
                      assistance.Employee?.secondLastName,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    const establishment =
                      assistance.Employee?.Establishment?.name ?? "-";
                    const blockCount = assistance.Slots?.length ?? 1;
                    const statusLabel =
                      STATUS_LABELS[assistance.status] ?? assistance.status;
                    const statusClass =
                      STATUS_BADGE_CLASSES[assistance.status] ??
                      "bg-gray-50 text-gray-600 border border-gray-200";

                    return (
                      <CHEKIOTableRow key={assistance.publicId} index={index}>
                        <CHEKIOTableCell>
                          <span className="font-medium text-gray-900">
                            {fullName || "-"}
                          </span>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <span className="tabular-nums text-gray-600">
                            {assistance.Employee?.documentNumber ?? "-"}
                          </span>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <span className="tabular-nums">{dateStr}</span>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <span className="text-gray-700">{establishment}</span>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <span className="tabular-nums font-medium">
                            {blockCount}
                          </span>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <CHEKIOButton
                            variant="secondaryBlue"
                            onClick={() => {
                              setSelectedAssistanceId(assistance.publicId);
                              setIsModalOpen(true);
                            }}
                            title={t("table.viewMarks")}
                          >
                            <Eye className="h-4 w-4" />
                          </CHEKIOButton>
                        </CHEKIOTableCell>
                      </CHEKIOTableRow>
                    );
                  })}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>

            {/* Pagination */}
            <div className="mt-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50 border-t border-gray-200 px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Mostrando {assistanceData.length} de{" "}
                  {paginationData.totalCount} estudiantes
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    {t("pagination.recordsPerPage")}:
                  </label>
                  <CHEKIOSelect
                    value={pagination.pageSize.toString()}
                    onValueChange={(value) =>
                      handlePageSizeChange(parseInt(value, 10))
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
                  onClick={() => handlePageChange(paginationData.current - 1)}
                  disabled={paginationData.current === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("pagination.previous")}
                </CHEKIOButton>
                <div className="px-4 py-2 border bg-white text-sm text-gray-700 rounded-lg border-gray-200">
                  Página {paginationData.current} de {paginationData.totalPages}
                </div>
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() => handlePageChange(paginationData.current + 1)}
                  disabled={
                    paginationData.current >= paginationData.totalPages
                  }
                >
                  {t("pagination.next")}
                  <ChevronRight className="h-4 w-4" />
                </CHEKIOButton>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedAssistanceId && (
        <ModalMarcacionesStudent
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAssistanceId(null);
          }}
          assistancePublicId={selectedAssistanceId}
        />
      )}
    </>
  );
}
