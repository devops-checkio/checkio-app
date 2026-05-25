"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOLoading,
  CHEKIOModal,
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
import { useToast } from "@/hooks/use-toast";
import { useGetEmployees } from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  IdCard,
  Search,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

interface EmployeePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (employee: {
    publicId: string;
    name: string;
    documentNumber?: string;
  }) => void;
}

export default function EmployeePickerModal({
  open,
  onClose,
  onSelect,
}: EmployeePickerModalProps) {
  const t = useTranslations("operations.warnings.upsert.employeePicker");
  const { companyId } = useCookieSession();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [nameSearch, setNameSearch] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [sort] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<{
    publicId: string;
    name: string;
    documentNumber?: string;
  } | null>(null);

  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 15,
    totalPages: 1,
    totalCount: 0,
    sort: "desc" as "asc" | "desc",
    next: null,
    previous: null,
  });

  const { data, isLoading, refetch, isFetching } = useGetEmployees({
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    search: nameSearch,
    documentNumber,
    companyId: companyId || "",
    status: "active",
  } as any);

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data]);

  useEffect(() => {
    if (!open) return;
    if (!companyId) return;
    refetch().catch((e) => handleError(e, toast));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    companyId,
    pagination.current,
    pagination.pageSize,
    nameSearch,
    documentNumber,
  ]);

  const debouncedName = useDebouncedCallback((value: string) => {
    setNameSearch(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, 400);

  const debouncedDoc = useDebouncedCallback((value: string) => {
    setDocumentNumber(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, 400);

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
      current: 1,
    }));
  }, []);

  const handleSelect = () => {
    if (selected) {
      onSelect(selected);
      setSelected(null);
    }
  };

  const total = data?.pagination?.totalCount || 0;
  const rows = data?.data || [];
  const paginationData = data?.pagination || pagination;

  return (
    <CHEKIOModal isOpen={open} onClose={onClose} title={t("title")} size="5xl">
      <div className="space-y-4">
        {/* Search Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("filters.name")}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <CHEKIOInput
                type="text"
                placeholder={t("filters.namePlaceholder")}
                className="pl-10 rounded-none"
                onChange={(e) => {
                  debouncedName(e.target.value);
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("filters.documentNumber")}
            </label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <CHEKIOInput
                type="text"
                placeholder={t("filters.documentNumberPlaceholder")}
                className="pl-10 rounded-none"
                onChange={(e) => {
                  debouncedDoc(e.target.value);
                }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 p-0">
          {isLoading || (isFetching && rows.length === 0) ? (
            <div className="flex justify-center py-8">
              <CHEKIOLoading size="lg" variant="modern" text={t("loading")} />
            </div>
          ) : (
            <>
              <CHEKIOTable>
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="w-12"></CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.name")}</CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.documentNumber")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.job")}</CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {rows.length === 0 ? (
                    <CHEKIOTableRow index={0}>
                      <CHEKIOTableCell
                        colSpan={4}
                        className="text-center py-10"
                      >
                        <p className="text-gray-600 font-medium">
                          {t("table.noData")}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {t("table.noDataDescription")}
                        </p>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ) : (
                    rows.map((record: any, index: number) => (
                      <CHEKIOTableRow key={record.publicId} index={index}>
                        <CHEKIOTableCell>
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              aria-label={t("table.ariaLabels.selectEmployee")}
                              className="h-4 w-4 cursor-pointer"
                              checked={selected?.publicId === record.publicId}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelected({
                                    publicId: record.publicId,
                                    name: `${record.firstName} ${record.lastName}`,
                                    documentNumber: record.documentNumber,
                                  });
                                } else if (
                                  selected?.publicId === record.publicId
                                ) {
                                  setSelected(null);
                                }
                              }}
                            />
                          </div>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">
                              {record.firstName} {record.lastName}
                            </span>
                          </div>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <div className="flex items-center gap-2">
                            <IdCard className="h-4 w-4 text-gray-600" />
                            <span>{record.documentNumber || "-"}</span>
                          </div>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {record.jobName || "-"}
                        </CHEKIOTableCell>
                      </CHEKIOTableRow>
                    ))
                  )}
                </CHEKIOTableBody>
              </CHEKIOTable>

              {rows.length > 0 && (
                <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      {t("pagination.showing", {
                        current: rows.length,
                        total: paginationData.totalCount,
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        {t("pagination.recordsPerPage")}:
                      </label>
                      <CHEKIOSelect
                        value={pagination.pageSize.toString()}
                        onValueChange={(value: string) => {
                          handlePageSizeChange(parseInt(value, 10));
                        }}
                      >
                        <CHEKIOSelectTrigger className="w-24 rounded-none">
                          <CHEKIOSelectValue />
                        </CHEKIOSelectTrigger>
                        <CHEKIOSelectContent>
                          <CHEKIOSelectItem value="10">10</CHEKIOSelectItem>
                          <CHEKIOSelectItem value="15">15</CHEKIOSelectItem>
                          <CHEKIOSelectItem value="20">20</CHEKIOSelectItem>
                          <CHEKIOSelectItem value="50">50</CHEKIOSelectItem>
                        </CHEKIOSelectContent>
                      </CHEKIOSelect>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CHEKIOButton
                      variant="secondaryBlue"
                      onClick={() =>
                        handlePageChange(paginationData.current - 1)
                      }
                      disabled={paginationData.current === 1}
                      className="rounded-none"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t("pagination.previous")}
                    </CHEKIOButton>
                    <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                      {t("pagination.page", {
                        current: paginationData.current,
                        total: paginationData.totalPages,
                      })}
                    </div>
                    <CHEKIOButton
                      variant="secondaryBlue"
                      onClick={() =>
                        handlePageChange(paginationData.current + 1)
                      }
                      disabled={
                        paginationData.current >= paginationData.totalPages
                      }
                      className="rounded-none"
                    >
                      {t("pagination.next")}
                      <ChevronRight className="h-4 w-4" />
                    </CHEKIOButton>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <CHEKIOButton
            variant="secondary"
            onClick={onClose}
            className="rounded-none"
          >
            {t("buttons.cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            variant="primary"
            onClick={handleSelect}
            disabled={!selected}
            className="rounded-none"
          >
            <Check className="h-4 w-4" />
            {t("buttons.select")}
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
}
