"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import ModalDelete from "@/app/[locale]/_components/modal-delete";
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
import { useToast } from "@/hooks/use-toast";
import { useDeleteHoliday, useGetHolidays } from "@/service/mantainer.service";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import axios from "axios";
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Download,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import HolidayModalUpsert from "./_components/holiday-modal-upsert";
import { HolidayResponseDto } from "./_components/holidays.dto";
import ModalMassHolidays from "./_components/modal-mass-holidays";

function HolidaysContent() {
  const t = useTranslations("mantainers.holidays");
  const { toast } = useToast();
  const { canRead, canCreate, canUpdate, canDelete, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMassImportModalOpen, setIsMassImportModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] =
    useState<HolidayResponseDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingHolidayId, setDeletingHolidayId] = useState<string | null>(
    null
  );
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const { mutate: deleteHoliday, isPending: isDeletingHoliday } =
    useDeleteHoliday();

  const handleOpenModal = (holiday?: HolidayResponseDto) => {
    if (holiday) {
      setEditingHoliday(holiday);
    } else {
      setEditingHoliday(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHoliday(null);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingHolidayId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingHolidayId(null);
  };

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const handleDelete = (id: string) => {
    deleteHoliday(id, {
      onSuccess: () => {
        toast({
          title: t("delete.success.title"),
          description: t("delete.success.description"),
        });
        handleCloseDeleteModal();
        refetch();
      },
      onError: (error: any) => {
        if (axios.isAxiosError(error)) {
          toast({
            title: t("delete.error.title"),
            description: error.response?.data.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: t("delete.error.title"),
            description: t("delete.error.description"),
            variant: "destructive",
          });
        }
      },
    });
  };

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: holidaysData, isLoading, refetch: refetchHolidays } =
    useGetHolidays({
      page,
      pageSize,
      sort: "desc",
    });

  useEffect(() => {
    if (refetchTrigger > 0) {
      refetchHolidays();
    }
  }, [refetchTrigger, refetchHolidays]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const holidays = holidaysData?.data || [];
  const pagination = holidaysData?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const HOLIDAY_COLUMNS_EXCEL: HeaderMapping[] = [
    {
      attribute: "name",
      header: t("excel.headers.name"),
    },
    {
      attribute: "date",
      header: t("excel.headers.date"),
      render: (date: string | Date) => {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return DateTime.fromJSDate(dateObj).toFormat("dd/MM/yyyy");
      },
    },
    {
      attribute: "isWaivable",
      header: t("excel.headers.isWaivable"),
      render: (isWaivable: boolean) => (isWaivable ? t("yes") : t("no")),
    },
  ];

  const toolbarButtons = (
    <div className="flex items-center gap-2">
      {canCreate(OrganizationPermissionCode.HOLIDAY_MAINTENANCE) && (
        <>
          <CHEKIOButton variant="primary" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" />
            {t("buttons.add")}
          </CHEKIOButton>
          <CHEKIOButton
            variant="primary"
            onClick={() => setIsMassImportModalOpen(true)}
          >
            <CloudUpload className="h-4 w-4" />
            {t("buttons.import")}
          </CHEKIOButton>
        </>
      )}
      {canRead(OrganizationPermissionCode.HOLIDAY_MAINTENANCE) && (
        <CHEKIOButton
          variant="approve"
          onClick={() =>
            generateExcel(
              holidays,
              HOLIDAY_COLUMNS_EXCEL,
              t("excel.filename"),
              t("excel.sheetName")
            )
          }
        >
          <Download className="h-4 w-4" />
          {t("buttons.downloadExcel")}
        </CHEKIOButton>
      )}
    </div>
  );

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <>
            <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-[100px] animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-[120px] animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-[150px] animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[180px]">
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.name")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <CalendarPlus className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.date")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      {t("table.headers.isWaivable")}
                    </CHEKIOTableHead>
                    {(canUpdate(OrganizationPermissionCode.HOLIDAY_MAINTENANCE) ||
                      canDelete(
                        OrganizationPermissionCode.HOLIDAY_MAINTENANCE
                      )) && (
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {[...Array(pageSize)].map((_, index) => (
                    <CHEKIOTableRow key={index} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                      </CHEKIOTableCell>
                      {(canUpdate(
                        OrganizationPermissionCode.HOLIDAY_MAINTENANCE
                      ) ||
                        canDelete(
                          OrganizationPermissionCode.HOLIDAY_MAINTENANCE
                        )) && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate(
                              OrganizationPermissionCode.HOLIDAY_MAINTENANCE
                            ) && (
                              <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                            )}
                            {canDelete(
                              OrganizationPermissionCode.HOLIDAY_MAINTENANCE
                            ) && (
                              <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                            )}
                          </div>
                        </CHEKIOTableCell>
                      )}
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>

            <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
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
        ) : holidays.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <CalendarDays className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
            {canCreate(OrganizationPermissionCode.HOLIDAY_MAINTENANCE) && (
              <CHEKIOButton
                variant="primary"
                onClick={() => handleOpenModal()}
                className="mt-6 gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("buttons.add")}
              </CHEKIOButton>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3">
              {toolbarButtons}
            </div>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[180px]">
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.name")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <CalendarPlus className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.date")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      {t("table.headers.isWaivable")}
                    </CHEKIOTableHead>
                    {(canUpdate(OrganizationPermissionCode.HOLIDAY_MAINTENANCE) ||
                      canDelete(
                        OrganizationPermissionCode.HOLIDAY_MAINTENANCE
                      )) && (
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {holidays.map((holiday, index) => (
                    <CHEKIOTableRow key={holiday.publicId} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                        {holiday.name}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {DateTime.fromISO(
                          typeof holiday.date === "string"
                            ? holiday.date
                            : holiday.date.toISOString()
                        )
                          .toUTC()
                          .toFormat("dd/MM/yyyy")}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                            holiday.isWaivable
                              ? "bg-amber-50 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {holiday.isWaivable ? t("yes") : t("no")}
                        </span>
                      </CHEKIOTableCell>
                      {(canUpdate(
                        OrganizationPermissionCode.HOLIDAY_MAINTENANCE
                      ) ||
                        canDelete(
                          OrganizationPermissionCode.HOLIDAY_MAINTENANCE
                        )) && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate(
                              OrganizationPermissionCode.HOLIDAY_MAINTENANCE
                            ) && (
                              <button
                                type="button"
                                onClick={() => handleOpenModal(holiday)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                title={t("buttons.edit")}
                                aria-label={t("ariaLabels.editHoliday")}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete(
                              OrganizationPermissionCode.HOLIDAY_MAINTENANCE
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDeleteModal(holiday.publicId)
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                title={t("buttons.delete")}
                                aria-label={t("ariaLabels.deleteHoliday")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </CHEKIOTableCell>
                      )}
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>

            <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: holidays.length,
                    total: pagination.totalCount,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    {t("pagination.recordsPerPage")}
                  </label>
                  <CHEKIOSelect
                    value={pageSize.toString()}
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
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("pagination.previous")}
                </CHEKIOButton>
                <span className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                  {t("pagination.page", {
                    current: pagination.current,
                    total: pagination.totalPages,
                  })}
                </span>
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  {t("pagination.next")}
                  <ChevronRight className="h-4 w-4" />
                </CHEKIOButton>
              </div>
            </div>
          </>
        )}
      </div>
      <ModalDelete
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={() => {
          if (deletingHolidayId) {
            return handleDelete(deletingHolidayId);
          }
          return Promise.resolve();
        }}
        message={t("delete.message")}
      />
      {isModalOpen && (
        <HolidayModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingHoliday={editingHoliday}
          onSuccess={refetch}
        />
      )}
      <ModalMassHolidays
        isOpen={isMassImportModalOpen}
        onClose={() => setIsMassImportModalOpen(false)}
        onSuccess={refetch}
      />
    </>
  );
}

export default function HolidaysPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.HOLIDAY_MAINTENANCE
      }
    >
      <HolidaysContent />
    </AccessNotGranted>
  );
}
