"use client";

import {
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
import { PaginationFilterDto } from "@/dto/pagination";
import { useGetEmployeeCompanyHistory } from "@/service/mantainer.service";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

interface PersonalCompanyHistoryProps {
  employeeId: string;
}

interface CompanyHistoryItem {
  id: number;
  publicId: string;
  companyName: string;
  companyDocumentNumber: string;
  from: string;
  to?: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

const PersonalCompanyHistory = ({
  employeeId,
}: PersonalCompanyHistoryProps) => {
  const t = useTranslations("mantainers.employees");
  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "desc" as "asc" | "desc",
  });

  const { data: historyData, isLoading: isLoadingHistory } =
    useGetEmployeeCompanyHistory(employeeId, {
      page: pagination.current,
      pageSize: pagination.pageSize,
      sort: pagination.sort,
    });

  useEffect(() => {
    if (historyData?.pagination) {
      setPagination(historyData.pagination);
    }
  }, [historyData]);

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

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: newPageSize,
      current: 1, // Reset to first page when changing page size
    }));
  }, []);


  if (isLoadingHistory) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <CHEKIOLoading size="lg" variant="modern" text={t("detail.companyHistoryLoading")} />
        </div>
      </div>
    );
  }

  if (!historyData?.data || historyData.data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("detail.companyHistoryEmpty")}
          </h3>
          <p className="text-gray-500">
            {t("detail.companyHistoryEmptyDescription")}
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(
    pagination.totalCount / pagination.pageSize
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {t("detail.companyHistoryTable.title")}
        </h3>
        <p className="text-sm text-gray-600">
          {t("detail.companyHistoryTable.description")}
        </p>
      </div>

      <div className="flex flex-col">
        <CHEKIOTable>
          <CHEKIOTableHeader>
            <tr>
              <CHEKIOTableHead>{t("detail.companyHistoryTable.company")}</CHEKIOTableHead>
              <CHEKIOTableHead>{t("detail.companyHistoryTable.document")}</CHEKIOTableHead>
              <CHEKIOTableHead>{t("detail.companyHistoryTable.startDate")}</CHEKIOTableHead>
              <CHEKIOTableHead>{t("detail.companyHistoryTable.endDate")}</CHEKIOTableHead>
              <CHEKIOTableHead>{t("detail.companyHistoryTable.duration")}</CHEKIOTableHead>
              <CHEKIOTableHead>{t("detail.companyHistoryTable.status")}</CHEKIOTableHead>
            </tr>
          </CHEKIOTableHeader>
          <CHEKIOTableBody>
            {historyData.data.map((record: CompanyHistoryItem, index: number) => (
              <CHEKIOTableRow key={record.publicId} index={index}>
                <CHEKIOTableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{record.companyName}</span>
                    {record.isCurrent && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200">
                        {t("detail.companyHistoryTable.current")}
                      </span>
                    )}
                  </div>
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <span className="text-gray-600">
                    {record.companyDocumentNumber || "N/A"}
                  </span>
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <span className="text-gray-700">
                    {DateTime.fromISO(record.from).toFormat("dd/MM/yyyy")}
                  </span>
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <span className="text-gray-700">
                    {record.isCurrent ? (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs border border-blue-200">
                        {t("detail.companyHistoryTable.inProgress")}
                      </span>
                    ) : record.to ? (
                      DateTime.fromISO(record.to).toFormat("dd/MM/yyyy")
                    ) : (
                      "N/A"
                    )}
                  </span>
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <span className="text-gray-600 text-sm">
                    {(() => {
                      const startDate = DateTime.fromISO(record.from);
                      const endDate = record.to
                        ? DateTime.fromISO(record.to)
                        : DateTime.now();
                      const duration = endDate.diff(startDate, [
                        "years",
                        "months",
                        "days",
                      ]);

                      let durationText = "";
                      if (duration.years > 0) {
                        durationText += `${Math.floor(duration.years)} ${t("detail.companyHistoryTable.years")} `;
                      }
                      if (duration.months > 0) {
                        durationText += `${Math.floor(duration.months)} ${t("detail.companyHistoryTable.months")} `;
                      }
                      if (duration.days > 0 && duration.years === 0) {
                        durationText += `${Math.floor(duration.days)} ${t("detail.companyHistoryTable.days")}`;
                      }

                      return durationText.trim() || t("detail.companyHistoryTable.lessThanOneDay");
                    })()}
                  </span>
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <span
                    className={`text-xs px-2 py-1 rounded border ${
                      record.isCurrent
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    {record.isCurrent ? t("detail.companyHistoryTable.active") : t("detail.companyHistoryTable.inactive")}
                  </span>
                </CHEKIOTableCell>
              </CHEKIOTableRow>
            ))}
          </CHEKIOTableBody>
        </CHEKIOTable>

        {/* Paginación manual */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {t("detail.companyHistoryTable.showingResults", {
                  current: historyData.data.length,
                  total: pagination.totalCount,
                })}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {t("detail.companyHistoryTable.recordsPerPage")}
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
                onClick={() =>
                  handlePaginationChange(
                    pagination.current - 1,
                    pagination.pageSize
                  )
                }
                disabled={pagination.current === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                {t("detail.companyHistoryTable.previous")}
              </CHEKIOButton>
              <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                {t("detail.companyHistoryTable.pageOf", {
                  current: pagination.current,
                  total: totalPages,
                })}
              </div>
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={() =>
                  handlePaginationChange(
                    pagination.current + 1,
                    pagination.pageSize
                  )
                }
                disabled={pagination.current >= totalPages}
              >
                {t("detail.companyHistoryTable.next")}
                <ChevronRight className="h-4 w-4" />
              </CHEKIOButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalCompanyHistory;
