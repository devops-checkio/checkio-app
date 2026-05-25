"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import { IntegrationProductModule } from "@/dto/enum/integration-product-module.enum";
import ModalDelete from "@/app/[locale]/_components/modal-delete";
import {
  CHEKIOButton,
  CHEKIOInput,
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
  useDeleteApiToken,
  useGetApiTokens,
  useRegenerateApiToken,
} from "@/service/integration.service";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ApiTokenResponseDto,
  ApiTokenStatus,
} from "./_components/api-token.dto";
import ApiTokenDisplayModal from "./_components/api-token-display-modal";
import ApiTokenModalUpsert from "./_components/api-token-modal-upsert";

function IntegrationsContent() {
  const t = useTranslations("mantainers.integrations");
  const { toast } = useToast();
  const { canUpdate, canDelete, canCreate, canRead } = useCookieSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTokenDisplayModalOpen, setIsTokenDisplayModalOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [editingToken, setEditingToken] = useState<ApiTokenResponseDto | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTokenId, setDeletingTokenId] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      search: "",
      status: undefined as ApiTokenStatus | undefined,
    },
  });
  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "desc" as "asc" | "desc",
  });

  const { data, isLoading, refetch } = useGetApiTokens({
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    search: watch("search"),
    status: watch("status"),
  });

  const { mutate: deleteApiToken, isPending: isDeletingToken } =
    useDeleteApiToken();
  const { mutate: regenerateApiToken, isPending: isRegeneratingToken } =
    useRegenerateApiToken();

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data]);

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

  const onSubmitSearch = (data: { search: string; status?: ApiTokenStatus }) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleClearSearch = () => {
    setValue("search", "");
    setValue("status", undefined);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleOpenModal = (token?: ApiTokenResponseDto) => {
    if (token) {
      setEditingToken(token);
    } else {
      setEditingToken(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingToken(null);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingTokenId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingTokenId(null);
  };

  const handleDelete = (id: string) => {
    deleteApiToken(id, {
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

  const handleRegenerate = (id: string) => {
    regenerateApiToken(id, {
      onSuccess: (response) => {
        toast({
          title: t("regenerate.successTitle"),
          description: t("regenerate.successDescription"),
        });
        setGeneratedToken(response.token);
        setIsTokenDisplayModalOpen(true);
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
            description: t("regenerate.error"),
            variant: "destructive",
          });
        }
      },
    });
  };

  const handleModalSuccess = (token?: string) => {
    if (token) {
      setGeneratedToken(token);
      setIsTokenDisplayModalOpen(true);
    }
    refetch();
  };

  const API_TOKEN_COLUMNS_EXCEL: HeaderMapping[] = [
    {
      attribute: "name",
      header: t("excel.headers.name"),
    },
    {
      attribute: "status",
      header: t("excel.headers.status"),
      render: (status: ApiTokenStatus) =>
        status === ApiTokenStatus.ACTIVE
          ? t("status.active")
          : t("status.revoked"),
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
      attribute: "lastUsedAt",
      header: t("excel.headers.lastUsedAt"),
      render: (lastUsedAt: string | Date | null) => {
        if (!lastUsedAt) return "-";
        const dateStr =
          typeof lastUsedAt === "string"
            ? lastUsedAt
            : lastUsedAt.toISOString();
        return DateTime.fromISO(dateStr).toFormat("dd/MM/yyyy");
      },
    },
  ];

  const tokens = data?.data || [];

  const actions = (
    <div className="flex flex-row gap-2">
      {canCreate(OrganizationPermissionCode.API_TOKEN_MAINTENANCE) && (
        <CHEKIOButton variant="primary" onClick={() => handleOpenModal()}>
          <PlusCircle className="h-4 w-4" />
          {t("buttons.add")}
        </CHEKIOButton>
      )}
      {canRead(OrganizationPermissionCode.API_TOKEN_MAINTENANCE) && (
        <CHEKIOButton
          variant="secondaryBlue"
          onClick={() =>
            generateExcel(
              data?.data || [],
              API_TOKEN_COLUMNS_EXCEL,
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
        <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/50 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <form
            onSubmit={handleSubmit(onSubmitSearch)}
            className="flex flex-wrap items-center gap-2"
          >
            <div className="flex w-[300px] max-w-full">
              <CHEKIOInput
                type="search"
                placeholder={t("search.placeholder")}
                {...register("search")}
                className="flex-1"
              />
              <CHEKIOButton variant="search" type="submit" className="ml-2">
                <Search className="h-4 w-4" />
                {t("buttons.search")}
              </CHEKIOButton>
            </div>
            <CHEKIOSelect
              value={watch("status") || "all"}
              onValueChange={(value) => {
                setValue(
                  "status",
                  value === "all" ? undefined : (value as ApiTokenStatus)
                );
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
            >
              <CHEKIOSelectTrigger className="w-[200px]">
                <CHEKIOSelectValue placeholder={t("filters.status")} />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                <CHEKIOSelectItem value="all">
                  {t("filters.allStatuses")}
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={ApiTokenStatus.ACTIVE}>
                  {t("status.active")}
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={ApiTokenStatus.REVOKED}>
                  {t("status.revoked")}
                </CHEKIOSelectItem>
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          </form>
          {actions}
        </div>

        {isLoading ? (
          <>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>{t("table.headers.name")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.status")}</CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.createdAt")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.lastUsedAt")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.createdBy")}
                    </CHEKIOTableHead>
                    {(canUpdate(OrganizationPermissionCode.API_TOKEN_MAINTENANCE) ||
                      canDelete(
                        OrganizationPermissionCode.API_TOKEN_MAINTENANCE
                      )) && (
                      <CHEKIOTableHead className="text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {Array.from({ length: pagination.pageSize }).map((_, index) => (
                    <CHEKIOTableRow key={index} index={index}>
                      <CHEKIOTableCell>
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      {(canUpdate(OrganizationPermissionCode.API_TOKEN_MAINTENANCE) ||
                        canDelete(
                          OrganizationPermissionCode.API_TOKEN_MAINTENANCE
                        )) && (
                        <CHEKIOTableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
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
        ) : (
          <>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>{t("table.headers.name")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.status")}</CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.createdAt")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.lastUsedAt")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.createdBy")}
                    </CHEKIOTableHead>
                    {(canUpdate(OrganizationPermissionCode.API_TOKEN_MAINTENANCE) ||
                      canDelete(
                        OrganizationPermissionCode.API_TOKEN_MAINTENANCE
                      )) && (
                      <CHEKIOTableHead className="text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {tokens.length === 0 ? (
                    <CHEKIOTableRow index={0}>
                      <CHEKIOTableCell
                        colSpan={
                          5 +
                          (canUpdate(
                            OrganizationPermissionCode.API_TOKEN_MAINTENANCE
                          ) ||
                          canDelete(OrganizationPermissionCode.API_TOKEN_MAINTENANCE)
                            ? 1
                            : 0)
                        }
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
                    tokens.map((token: ApiTokenResponseDto, index: number) => (
                      <CHEKIOTableRow key={token.publicId} index={index}>
                        <CHEKIOTableCell className="font-medium text-gray-900">
                          {token.name}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              token.status === ApiTokenStatus.ACTIVE
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {token.status === ApiTokenStatus.ACTIVE
                              ? t("status.active")
                              : t("status.revoked")}
                          </span>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {DateTime.fromISO(
                            typeof token.createdAt === "string"
                              ? token.createdAt
                              : token.createdAt.toISOString()
                          ).toFormat("dd/MM/yyyy")}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {token.lastUsedAt
                            ? DateTime.fromISO(
                                typeof token.lastUsedAt === "string"
                                  ? token.lastUsedAt
                                  : token.lastUsedAt.toISOString()
                              ).toFormat("dd/MM/yyyy")
                            : "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>{token.createdBy.name}</CHEKIOTableCell>
                        {(canUpdate(
                          OrganizationPermissionCode.API_TOKEN_MAINTENANCE
                        ) ||
                          canDelete(
                            OrganizationPermissionCode.API_TOKEN_MAINTENANCE
                          )) && (
                          <CHEKIOTableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {canUpdate(
                                OrganizationPermissionCode.API_TOKEN_MAINTENANCE
                              ) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenModal(token)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                    title={t("buttons.edit")}
                                    aria-label={t("ariaLabels.editToken")}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRegenerate(token.publicId)}
                                    disabled={isRegeneratingToken}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                                    title={t("buttons.regenerate")}
                                    aria-label={t("ariaLabels.regenerateToken")}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {canDelete(
                                OrganizationPermissionCode.API_TOKEN_MAINTENANCE
                              ) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenDeleteModal(token.publicId)
                                  }
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                  title={t("buttons.delete")}
                                  aria-label={t("ariaLabels.deleteToken")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </CHEKIOTableCell>
                        )}
                      </CHEKIOTableRow>
                    ))
                  )}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>

            {tokens.length > 0 && (
              <div className="flex flex-col border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {t("pagination.showing", {
                      current: tokens.length,
                      total: pagination.totalCount,
                    })}
                  </div>
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
                    onClick={() => handlePageChange(pagination.current - 1)}
                    disabled={pagination.current === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("buttons.previous")}
                  </CHEKIOButton>
                  <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                    {t("pagination.page", {
                      current: pagination.current,
                      total: pagination.totalPages,
                    })}
                  </div>
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() => handlePageChange(pagination.current + 1)}
                    disabled={pagination.current >= pagination.totalPages}
                  >
                    {t("buttons.next")}
                    <ChevronRight className="h-4 w-4" />
                  </CHEKIOButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <ApiTokenModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingToken={editingToken}
          onSuccess={handleModalSuccess}
        />
      )}

      {isTokenDisplayModalOpen && generatedToken && (
        <ApiTokenDisplayModal
          isOpen={isTokenDisplayModalOpen}
          onClose={() => {
            setIsTokenDisplayModalOpen(false);
            setGeneratedToken(null);
          }}
          token={generatedToken}
        />
      )}

      <ModalDelete
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={() => {
          if (deletingTokenId) {
            return handleDelete(deletingTokenId);
          }
          return Promise.resolve();
        }}
        message={t("delete.confirmMessage")}
      />
    </>
  );
}

export default function IntegrationsPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.API_TOKEN_MAINTENANCE}
      requireProductModule={IntegrationProductModule.API}
    >
      <IntegrationsContent />
    </AccessNotGranted>
  );
}
