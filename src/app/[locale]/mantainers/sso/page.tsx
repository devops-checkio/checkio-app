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
import { useDeleteAppSSO, useGetAppSSOs } from "@/service/mantainer.service";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import SSOAppModalUpsert from "./_components/sso-app-modal-upsert";
import { AppSSOResponseDto } from "./_components/sso.dto";

function SSOContent() {
  const t = useTranslations("mantainers.sso");
  const { toast } = useToast();
  const { canRead, canCreate, canUpdate, canDelete } = useCookieSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [editingAppSSO, setEditingAppSSO] = useState<AppSSOResponseDto | null>(
    null
  );
  const [selectedAppSSO, setSelectedAppSSO] =
    useState<AppSSOResponseDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAppSSOId, setDeletingAppSSOId] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  const { mutate: deleteAppSSO, isPending: isDeletingAppSSO } =
    useDeleteAppSSO();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: ssoAppsData, isLoading } = useGetAppSSOs({
    page: currentPage,
    pageSize,
  });

  const ssoApps = ssoAppsData?.data || [];
  const pagination = ssoAppsData?.pagination || {
    totalCount: 0,
    pageSize: 10,
    current: 1,
    next: null,
    previous: null,
    totalPages: 1,
    sort: "desc" as "asc" | "desc",
  };
  const totalPages =
    pagination.totalPages ||
    Math.ceil((pagination.totalCount || 0) / (pagination.pageSize || 10));

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const handleDownloadExcel = async () => {
    if (!ssoAppsData?.data) return;

    try {
      setIsGeneratingExcel(true);
      const SSO_COLUMNS_EXCEL: HeaderMapping[] = [
        {
          attribute: "name",
          header: t("excel.headers.name"),
        },
        {
          attribute: "publicId",
          header: t("excel.headers.appId"),
        },
        {
          attribute: "createdAt",
          header: t("excel.headers.createdAt"),
          render: (createdAt: string | Date) => {
            const dateStr =
              typeof createdAt === "string"
                ? createdAt
                : createdAt.toISOString();
            return DateTime.fromISO(dateStr).toFormat("dd/MM/yyyy");
          },
        },
        {
          attribute: "updatedAt",
          header: t("excel.headers.updatedAt"),
          render: (updatedAt: string | Date) => {
            const dateStr =
              typeof updatedAt === "string"
                ? updatedAt
                : updatedAt.toISOString();
            return DateTime.fromISO(dateStr).toFormat("dd/MM/yyyy");
          },
        },
      ];

      await generateExcel(
        ssoAppsData.data,
        SSO_COLUMNS_EXCEL,
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

  useEffect(() => {
    if (refetchTrigger > 0) {
      setCurrentPage(1);
    }
  }, [refetchTrigger]);

  const handleOpenModal = (appSSO?: AppSSOResponseDto) => {
    if (appSSO) {
      setEditingAppSSO(appSSO);
    } else {
      setEditingAppSSO(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAppSSO(null);
  };

  const handleOpenTokenModal = (appSSO: AppSSOResponseDto) => {
    setSelectedAppSSO(appSSO);
    setIsTokenModalOpen(true);
  };

  const handleCloseTokenModal = () => {
    setIsTokenModalOpen(false);
    setSelectedAppSSO(null);
  };

  const handleOpenUsersModal = (appSSO: AppSSOResponseDto) => {
    setSelectedAppSSO(appSSO);
    setIsUsersModalOpen(true);
  };

  const handleCloseUsersModal = () => {
    setIsUsersModalOpen(false);
    setSelectedAppSSO(null);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingAppSSOId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingAppSSOId(null);
  };

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const handleDelete = (id: string) => {
    deleteAppSSO(id, {
      onSuccess: () => {
        toast({
          title: t("delete.success"),
          variant: "default",
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

  const actions = (
    <div className="flex flex-row gap-2">
      {canCreate(OrganizationPermissionCode.SSO_MAINTENANCE) && (
        <CHEKIOButton variant="primary" onClick={() => handleOpenModal()}>
          <PlusCircle className="h-4 w-4" />
          {t("buttons.add")}
        </CHEKIOButton>
      )}
      {canRead(OrganizationPermissionCode.SSO_MAINTENANCE) && (
        <CHEKIOButton
          variant="secondaryBlue"
          onClick={handleDownloadExcel}
          disabled={isGeneratingExcel || !ssoAppsData?.data}
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
        <div className="flex flex-wrap justify-end gap-2 border-b border-gray-200 bg-gray-50/50 px-5 py-3">
          {actions}
        </div>
        {isLoading ? (
          <>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>{t("table.headers.name")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.appId")}</CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.createdAt")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.updatedAt")}
                    </CHEKIOTableHead>
                    {(canUpdate(OrganizationPermissionCode.SSO_MAINTENANCE) ||
                      canDelete(OrganizationPermissionCode.SSO_MAINTENANCE)) && (
                      <CHEKIOTableHead className="text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {Array.from({ length: pageSize }).map((_, index) => (
                    <CHEKIOTableRow key={index} index={index}>
                      <CHEKIOTableCell>
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      {(canUpdate(OrganizationPermissionCode.SSO_MAINTENANCE) ||
                        canDelete(OrganizationPermissionCode.SSO_MAINTENANCE)) && (
                        <CHEKIOTableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                            <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
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
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
          </>
        ) : ssoApps.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600 font-medium">{t("table.noData")}</p>
            <p className="text-sm text-gray-500 mt-2">
              {t("table.noDataDescription")}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>{t("table.headers.name")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.appId")}</CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.createdAt")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.updatedAt")}
                    </CHEKIOTableHead>
                    {(canUpdate(OrganizationPermissionCode.SSO_MAINTENANCE) ||
                      canDelete(OrganizationPermissionCode.SSO_MAINTENANCE)) && (
                      <CHEKIOTableHead className="text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {ssoApps.map((app, index) => (
                    <CHEKIOTableRow key={app.publicId} index={index}>
                      <CHEKIOTableCell className="font-medium text-gray-900">
                        {app.name}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>{app.publicId}</CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {DateTime.fromISO(
                          typeof app.createdAt === "string"
                            ? app.createdAt
                            : app.createdAt.toISOString()
                        ).toFormat("dd/MM/yyyy")}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {DateTime.fromISO(
                          typeof app.updatedAt === "string"
                            ? app.updatedAt
                            : app.updatedAt.toISOString()
                        ).toFormat("dd/MM/yyyy")}
                      </CHEKIOTableCell>
                      {(canUpdate(OrganizationPermissionCode.SSO_MAINTENANCE) ||
                        canDelete(
                          OrganizationPermissionCode.SSO_MAINTENANCE
                        )) && (
                        <CHEKIOTableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate(
                              OrganizationPermissionCode.SSO_MAINTENANCE
                            ) && (
                              <button
                                type="button"
                                onClick={() => handleOpenModal(app)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                title={t("buttons.edit")}
                                aria-label={t("ariaLabels.editApp")}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete(
                              OrganizationPermissionCode.SSO_MAINTENANCE
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDeleteModal(app.publicId)
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                title={t("buttons.delete")}
                                aria-label={t("ariaLabels.deleteApp")}
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

            <div className="flex flex-col border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: ssoApps.length,
                    total: pagination.totalCount,
                  })}
                </div>
                {/* Selector de registros por página */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Registros por página:
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
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("buttons.previous")}
                </CHEKIOButton>
                <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                  {t("pagination.page", {
                    current: currentPage,
                    total: totalPages,
                  })}
                </div>
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  {t("buttons.next")}
                  <ChevronRight className="h-4 w-4" />
                </CHEKIOButton>
              </div>
            </div>
          </>
        )}
      </div>
      {isModalOpen && (
        <SSOAppModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingAppSSO={editingAppSSO}
          onSuccess={() => refetch()}
        />
      )}
      <ModalDelete
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={() => {
          if (deletingAppSSOId) {
            return handleDelete(deletingAppSSOId);
          }
          return Promise.resolve();
        }}
        message={t("delete.confirmMessage")}
      />
    </>
  );
}

export default function SSOPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.SSO_MAINTENANCE}
    >
      <SSOContent />
    </AccessNotGranted>
  );
}
