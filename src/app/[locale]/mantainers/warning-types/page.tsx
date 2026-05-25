"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
  CHEKIOButton,
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
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteWarningType,
  useGetWarningTypes,
} from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Hash,
  Loader2,
  Pencil,
  PlusCircle,
  Trash2,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import WarningTypeModalUpsert from "./_components/warning-types-modal-upsert";
import {
  WarningTypeFindAllDto,
  WarningTypeResponseDto,
} from "./_components/warning-types.dto";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY_BLUE = "secondaryBlue",
  DESTRUCTIVE = "destructive",
  SECONDARY = "secondary",
}

function WarningTypesContent() {
  const { toast } = useToast();
  const { canRead, canCreate, canUpdate, canDelete, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const t = useTranslations("warningTypes");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarningType, setEditingWarningType] =
    useState<WarningTypeResponseDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingWarningTypeId, setDeletingWarningTypeId] = useState<
    string | null
  >(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  const { mutate: deleteWarningType, isPending: isDeletingWarningType } =
    useDeleteWarningType();

  const {
    data: warningTypesData,
    isLoading,
    refetch: refetchWarningTypes,
  } = useGetWarningTypes({
    page,
    pageSize,
    sort: "desc",
  } as WarningTypeFindAllDto);

  useEffect(() => {
    if (refetchTrigger > 0) {
      refetchWarningTypes();
    }
  }, [refetchTrigger, refetchWarningTypes]);

  const handleOpenModal = (warningType?: WarningTypeResponseDto) => {
    if (warningType) {
      setEditingWarningType(warningType);
    } else {
      setEditingWarningType(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWarningType(null);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingWarningTypeId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingWarningType) {
      setIsDeleteModalOpen(false);
      setDeletingWarningTypeId(null);
      setDeleteError(null);
    }
  };

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const handleDelete = (id: string) => {
    setDeleteError(null);
    deleteWarningType(id, {
      onSuccess: () => {
        toast({
          title: t("delete.success"),
          description: t("delete.success"),
          variant: "default",
        });
        handleCloseDeleteModal();
        refetch();
      },
      onError: (error: unknown) => {
        const errorMessage =
          (error as { response?: { data?: { message?: string }; message?: string } })?.response?.data?.message ||
          (error as { message?: string })?.message ||
          t("delete.error");
        setDeleteError(errorMessage);
        handleError(error, toast);
      },
    });
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleDownloadExcel = async () => {
    if (!warningTypesData?.data) return;

    try {
      setIsGeneratingExcel(true);
      const WARNING_TYPE_COLUMNS_EXCEL: HeaderMapping[] = [
        {
          attribute: "name",
          header: t("excel.headers.name"),
        },
        {
          attribute: "createdAt",
          header: t("excel.headers.createdAt"),
          render: (createdAt: string) =>
            DateTime.fromISO(createdAt).toFormat("dd/MM/yyyy"),
        },
        {
          attribute: "updatedAt",
          header: t("excel.headers.updatedAt"),
          render: (updatedAt: string) =>
            DateTime.fromISO(updatedAt).toFormat("dd/MM/yyyy"),
        },
      ];

      await generateExcel(
        warningTypesData.data,
        WARNING_TYPE_COLUMNS_EXCEL,
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
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const warningTypes = warningTypesData?.data || [];
  const pagination = warningTypesData?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const toolbarButtons = (
    <div className="flex items-center gap-2">
      {canCreate(OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE) && (
        <CHEKIOButton
          variant={ButtonVariant.PRIMARY}
          onClick={() => handleOpenModal()}
        >
          <PlusCircle className="h-4 w-4" />
          {t("addWarningType")}
        </CHEKIOButton>
      )}
      {canRead(OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE) && (
        <CHEKIOButton
          variant="approve"
          onClick={handleDownloadExcel}
          disabled={isGeneratingExcel || !warningTypesData?.data?.length}
        >
          {isGeneratingExcel ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("buttons.generating")}
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {t("buttons.downloadExcel")}
            </>
          )}
        </CHEKIOButton>
      )}
    </div>
  );

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3">
          {toolbarButtons}
        </div>

        {isLoading ? (
          <>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[180px]">
                      <span className="flex items-center gap-2">
                        <Hash className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.name")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.createdAt")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.updatedAt")}
                      </span>
                    </CHEKIOTableHead>
                    {(canUpdate(
                      OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE
                    ) ||
                      canDelete(
                        OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE
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
                        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      {(canUpdate(
                        OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE
                      ) ||
                        canDelete(
                          OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE
                        )) && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate(
                              OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE
                            ) && (
                              <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                            )}
                            {canDelete(
                              OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE
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

            <div className="flex flex-col border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between gap-4">
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
        ) : warningTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <AlertTriangle className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
            {canCreate(OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE) && (
              <CHEKIOButton
                variant={ButtonVariant.PRIMARY}
                onClick={() => handleOpenModal()}
                className="mt-6 gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                {t("addWarningType")}
              </CHEKIOButton>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[180px]">
                      <span className="flex items-center gap-2">
                        <Hash className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.name")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.createdAt")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.updatedAt")}
                      </span>
                    </CHEKIOTableHead>
                    {(canUpdate(
                      OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE
                    ) ||
                      canDelete(
                        OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE
                      )) && (
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {warningTypes.map(
                    (warningType: WarningTypeResponseDto, index: number) => (
                      <CHEKIOTableRow key={warningType.publicId} index={index}>
                        <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                          {warningType.name}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {DateTime.fromISO(
                            typeof warningType.createdAt === "string"
                              ? warningType.createdAt
                              : (warningType.createdAt as Date).toISOString()
                          ).toFormat("dd/MM/yyyy HH:mm")}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {DateTime.fromISO(
                            typeof warningType.updatedAt === "string"
                              ? warningType.updatedAt
                              : (warningType.updatedAt as Date).toISOString()
                          ).toFormat("dd/MM/yyyy HH:mm")}
                        </CHEKIOTableCell>
                        {(canUpdate(
                          OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE
                        ) ||
                          canDelete(
                            OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE
                          )) && (
                          <CHEKIOTableCell className="px-5 py-3.5 text-right">
                            <div className="flex justify-end gap-1">
                              {canUpdate(
                                OrganizationPermissionCode
                                  .WARNING_TYPE_MAINTENANCE
                              ) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenModal(warningType)
                                  }
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                  title={t("buttons.edit")}
                                  aria-label={t("ariaLabels.editWarningType")}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              {canDelete(
                                OrganizationPermissionCode
                                  .WARNING_TYPE_MAINTENANCE
                              ) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenDeleteModal(warningType.publicId)
                                  }
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                  title={t("buttons.delete")}
                                  aria-label={t(
                                    "ariaLabels.deleteWarningType"
                                  )}
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

              {warningTypes.length > 0 && (
                <div className="flex flex-col border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      {t("pagination.showing", {
                        current: warningTypes.length,
                        total: pagination.totalCount,
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="whitespace-nowrap text-sm font-medium text-gray-700">
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
                      variant={ButtonVariant.SECONDARY_BLUE}
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t("pagination.previous")}
                    </CHEKIOButton>
                    <div className="rounded border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
                      {t("pagination.page", {
                        current: pagination.current,
                        total: pagination.totalPages,
                      })}
                    </div>
                    <CHEKIOButton
                      variant={ButtonVariant.SECONDARY_BLUE}
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= pagination.totalPages}
                    >
                      {t("pagination.next")}
                      <ChevronRight className="h-4 w-4" />
                    </CHEKIOButton>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <WarningTypeModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingWarningType={editingWarningType}
          onSuccess={() => refetch()}
        />
      )}

      {canDelete(OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE) && (
        <CHEKIOModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          title={t("delete.confirmTitle")}
          size="md"
        >
          <div className="space-y-6">
            <p className="flex items-center gap-3 text-lg text-gray-700">
              <AlertCircle className="h-5 w-5 text-red-500" />
              {t("delete.message")}
            </p>

            {deleteError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-700">{deleteError}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <CHEKIOButton
                variant={ButtonVariant.SECONDARY}
                onClick={handleCloseDeleteModal}
                disabled={isDeletingWarningType}
              >
                <X className="h-4 w-4" />
                {t("buttons.cancel")}
              </CHEKIOButton>
              <CHEKIOButton
                variant={ButtonVariant.DESTRUCTIVE}
                onClick={() => {
                  if (deletingWarningTypeId) {
                    handleDelete(deletingWarningTypeId);
                  }
                }}
                disabled={isDeletingWarningType}
              >
                {isDeletingWarningType ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("buttons.deleting")}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {t("buttons.delete")}
                  </>
                )}
              </CHEKIOButton>
            </div>
          </div>
        </CHEKIOModal>
      )}
    </>
  );
}

export default function WarningTypesPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE
      }
    >
      <WarningTypesContent />
    </AccessNotGranted>
  );
}
