"use client";

import {
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import axiosInstance from "@/utils/axios";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface AttendanceSectionProps {
  employeeId: string;
}

interface AssistanceRecord {
  publicId: string;
  date: string;
  status: string;
  checkInAt?: string;
  checkOutAt?: string;
  Branch?: { name: string };
}

const statusLabel: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: "Completo", className: "text-green-700 bg-green-100" },
  INCOMPLETE: { label: "Incompleto", className: "text-yellow-700 bg-yellow-100" },
  ABSENT: { label: "Ausente", className: "text-red-700 bg-red-100" },
};

export default function AttendanceSection({ employeeId }: AttendanceSectionProps) {
  const { companyId } = useCookieSession();
  const [records, setRecords] = useState<AssistanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!companyId || !employeeId) return;

    setIsLoading(true);
    axiosInstance
      .get(`/client/assistances`, {
        params: {
          companyId,
          search: employeeId,
          page,
          pageSize,
          sort: "desc",
          includeMarks: false,
        },
      })
      .then((res) => {
        setRecords(res.data?.data ?? []);
        setTotalPages(res.data?.pagination?.totalPages ?? 1);
      })
      .catch(() => setRecords([]))
      .finally(() => setIsLoading(false));
  }, [employeeId, companyId, page]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Asistencia</h3>

      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <CHEKIOTable>
          <CHEKIOTableHeader>
            <CHEKIOTableRow>
              <CHEKIOTableHead>Fecha</CHEKIOTableHead>
              <CHEKIOTableHead>Ingreso</CHEKIOTableHead>
              <CHEKIOTableHead>Salida</CHEKIOTableHead>
              <CHEKIOTableHead>Sede</CHEKIOTableHead>
              <CHEKIOTableHead>Estado</CHEKIOTableHead>
            </CHEKIOTableRow>
          </CHEKIOTableHeader>
          <CHEKIOTableBody>
            {isLoading ? (
              <CHEKIOTableRow>
                <CHEKIOTableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                </CHEKIOTableCell>
              </CHEKIOTableRow>
            ) : records.length === 0 ? (
              <CHEKIOTableRow>
                <CHEKIOTableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Sin registros de asistencia
                </CHEKIOTableCell>
              </CHEKIOTableRow>
            ) : (
              records.map((r) => {
                const statusInfo = statusLabel[r.status] ?? {
                  label: r.status,
                  className: "text-gray-700 bg-gray-100",
                };
                return (
                  <CHEKIOTableRow key={r.publicId}>
                    <CHEKIOTableCell>
                      {DateTime.fromISO(r.date).toFormat("dd/MM/yyyy")}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {r.checkInAt
                        ? DateTime.fromISO(r.checkInAt).toFormat("HH:mm")
                        : "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {r.checkOutAt
                        ? DateTime.fromISO(r.checkOutAt).toFormat("HH:mm")
                        : "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {r.Branch?.name ?? "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </CHEKIOTableCell>
                  </CHEKIOTableRow>
                );
              })
            )}
          </CHEKIOTableBody>
        </CHEKIOTable>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
