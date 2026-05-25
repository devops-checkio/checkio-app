"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import ModalDelete from "@/app/[locale]/_components/modal-delete";
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
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteAbsenceType,
  useGetAbsenceTypes,
  useGetCompaniesSelector,
} from "@/service/mantainer.service";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import axios from "axios";
import {
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Code,
  Download,
  Hash,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import AbsenceTypeModalMasive from "./_components/absence-type-modal-masive";
import AbsenceTypeModalUpsert from "./_components/absence-type-modal-upsert";
import {
  AbsenceTypeFindFilterDto,
  AbsenceTypeResponseDto,
} from "./_components/absence-type.dto";

function AbsenceTypesContent() {
  const t = useTranslations("mantainers.absenceTypes");
  const { toast } = useToast();
  const { canRead, canCreate, canUpdate, canDelete, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMasiveModalOpen, setIsMasiveModalOpen] = useState(false);
  const [editingAbsenceTypeId, setEditingAbsenceTypeId] = useState<
    string | null
  >(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAbsenceTypeId, setDeletingAbsenceTypeId] = useState<
    string | null
  >(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: companiesData } = useGetCompaniesSelector({
    page: 1,
    pageSize: 100,
    sort: "asc",
  });

  const { mutate: deleteAbsenceType, isPending: isDeletingAbsenceType } =
    useDeleteAbsenceType();

  const {
    data: absenceTypesData,
    isLoading,
    refetch: refetchAbsenceTypes,
  } = useGetAbsenceTypes({
    page,
    pageSize,
    sort: "desc",
  } as AbsenceTypeFindFilterDto);

  useEffect(() => {
    if (refetchTrigger > 0) {
      refetchAbsenceTypes();
    }
  }, [refetchTrigger, refetchAbsenceTypes]);

  const handleOpenModal = (absenceType?: AbsenceTypeResponseDto) => {
    setEditingAbsenceTypeId(absenceType?.publicId ?? null);
    setIsModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingAbsenceTypeId(null);
  }, []);

  const handleOpenMasiveModal = () => {
    setIsMasiveModalOpen(true);
  };

  const handleCloseMasiveModal = () => {
    setIsMasiveModalOpen(false);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingAbsenceTypeId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingAbsenceTypeId(null);
  };

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const handleDownloadExcel = async () => {
    if (!absenceTypesData?.data) return;

    try {
      await generateExcel(
        absenceTypesData.data,
        ABSENCE_TYPE_COLUMNS_EXCEL,
        t("excel.filename"),
        t("excel.sheetName")
      );
      toast({
        title: t("excel.success"),
        variant: "default",
      });
    } catch (error) {
      console.error("Error downloading excel:", error);
      toast({
        title: t("excel.error"),
        variant: "destructive",
      });
    }
  };

  const absenceTypes = absenceTypesData?.data || [];
  const pagination = absenceTypesData?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const handleDelete = (id: string) => {
    deleteAbsenceType(id, {
      onSuccess: () => {
        toast({
          title: t("delete.title"),
          description: t("delete.description"),
        });
        handleCloseDeleteModal();
        refetch();
      },
      onError: (error: any) => {
        if (axios.isAxiosError(error)) {
          toast({
            title: t("errors.title"),
            description: error.response?.data.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: t("errors.title"),
            description: t("delete.error"),
            variant: "destructive",
          });
        }
      },
    });
  };

  const ABSENCE_TYPE_COLUMNS_EXCEL: HeaderMapping[] = [
    {
      attribute: "code",
      header: t("excel.headers.code"),
    },
    {
      attribute: "name",
      header: t("excel.headers.name"),
    },
    {
      attribute: "integrationCode",
      header: t("excel.headers.integrationCode"),
    },
    {
      attribute: "createdAt",
      header: t("excel.headers.createdAt"),
      render: (createdAt: string) =>
        DateTime.fromISO(createdAt).toFormat("dd/MM/yyyy"),
    },
    {
      attribute: "companies",
      header: t("excel.headers.companies"),
      render: (companies: string[]) => {
        if (!companies || !companiesData?.data) return "-";
        const companyNames = companies
          .map((companyId: string) => {
            const company = companiesData.data.find(
              (company: any) => company.publicId === companyId
            );
            return company?.businessName || "-";
          })
          .filter((name: string) => name !== "-");
        return companyNames.length > 0 ? companyNames.join(", ") : "-";
      },
    },
  ];

  const toolbarButtons = (
    <div className="flex items-center gap-2">
      {canCreate(OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE) && (
        <>
          <CHEKIOButton variant="primary" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" />
            {t("buttons.add")}
          </CHEKIOButton>
          <CHEKIOButton variant="primary" onClick={handleOpenMasiveModal}>
            <Upload className="h-4 w-4" />
            {t("buttons.massive")}
          </CHEKIOButton>
        </>
      )}
      {canRead(OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE) && (
        <CHEKIOButton
          variant="approve"
          onClick={handleDownloadExcel}
          disabled={!absenceTypesData?.data}
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
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Hash className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.code")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[180px]">
                      <span className="flex items-center gap-2">
                        <CalendarX className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.name")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      <span className="flex items-center gap-2">
                        <Code className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.integrationCode")}
                      </span>
                    </CHEKIOTableHead>
                    {(canUpdate(
                      OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE
                    ) ||
                      canDelete(
                        OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE
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
                        <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      {(canUpdate(
                        OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE
                      ) ||
                        canDelete(
                          OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE
                        )) && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate(
                              OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE
                            ) && (
                              <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                            )}
                            {canDelete(
                              OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE
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
        ) : absenceTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <CalendarX className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
            {canCreate(OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE) && (
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
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Hash className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.code")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[180px]">
                      <span className="flex items-center gap-2">
                        <CalendarX className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.name")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      <span className="flex items-center gap-2">
                        <Code className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.integrationCode")}
                      </span>
                    </CHEKIOTableHead>
                    {(canUpdate(
                      OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE
                    ) ||
                      canDelete(
                        OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE
                      )) && (
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {absenceTypes.map(
                    (absenceType: AbsenceTypeResponseDto, index: number) => (
                      <CHEKIOTableRow key={absenceType.publicId} index={index}>
                        <CHEKIOTableCell className="px-5 py-3.5 font-mono text-sm text-gray-600">
                          {absenceType.code}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                          {absenceType.name}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {absenceType.integrationCode || "-"}
                        </CHEKIOTableCell>
                        {(canUpdate(
                          OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE
                        ) ||
                          canDelete(
                            OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE
                          )) && (
                          <CHEKIOTableCell className="px-5 py-3.5 text-right">
                            <div className="flex justify-end gap-1">
                              {canUpdate(
                                OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE
                              ) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenModal(absenceType)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                  title={t("buttons.edit")}
                                  aria-label={t("ariaLabels.editAbsenceType")}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              {canDelete(
                                OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE
                              ) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenDeleteModal(absenceType.publicId)
                                  }
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                  title={t("buttons.delete")}
                                  aria-label={t("ariaLabels.deleteAbsenceType")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </CHEKIOTableCell>
                        )}
                      </CHEKIOTableRow>
                    )
                  )}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>

            <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: absenceTypes.length,
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
      {isModalOpen && (
        <AbsenceTypeModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingAbsenceTypeId={editingAbsenceTypeId}
          onSuccess={() => refetch()}
        />
      )}
      {isMasiveModalOpen && (
        <AbsenceTypeModalMasive
          isOpen={isMasiveModalOpen}
          onClose={handleCloseMasiveModal}
          onSuccess={() => refetch()}
        />
      )}
      <ModalDelete
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={() => {
          if (deletingAbsenceTypeId) {
            return handleDelete(deletingAbsenceTypeId);
          }
          return Promise.resolve();
        }}
        message={t("delete.confirmMessage")}
      />
    </>
  );
}

export default function AbsenceTypesPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE
      }
    >
      <AbsenceTypesContent />
    </AccessNotGranted>
  );
}
