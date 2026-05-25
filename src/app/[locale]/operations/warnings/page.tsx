"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
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
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { PaginationFilterDto } from "@/dto/pagination";
import { useToast } from "@/hooks/use-toast";
import {
  useGetCompaniesSelector,
  useGetWarningTypes,
} from "@/service/mantainer.service";
import { useDeleteWarning, useGetWarnings } from "@/service/warning.service";
import { handleError } from "@/utils/error";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Pencil,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import WarningModalUpsert from "./_components/warning-modal-upsert";
import { WarningResponseDto } from "./_components/warning.dto";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY_BLUE = "secondaryBlue",
  DESTRUCTIVE = "destructive",
  SECONDARY = "secondary",
  SEARCH = "search",
  REFRESH = "refresh",
}

type SearchFiltersForm = {
  search: string;
  employeePublicId: string;
  warningTypePublicId: string;
};

function WarningsContent() {
  const t = useTranslations("operations.warnings");
  const { canRead, canCreate, canUpdate, canDelete, companyId } =
    useCookieSession();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingWarning, setViewingWarning] =
    useState<WarningResponseDto | null>(null);
  const [editingWarning, setEditingWarning] =
    useState<WarningResponseDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingWarningId, setDeletingWarningId] = useState<string | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "desc" as "asc" | "desc",
  });

  const { control, reset, watch } = useForm<SearchFiltersForm>({
    defaultValues: {
      search: "",
      employeePublicId: "",
      warningTypePublicId: "",
    },
  });

  const formValues = watch();

  const [searchParams, setSearchParams] = useState({
    search: undefined as string | undefined,
    employeePublicId: undefined as string | undefined,
    warningTypePublicId: undefined as string | undefined,
  });

  const {
    data,
    isLoading,
    refetch: refetchWarnings,
  } = useGetWarnings({
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    companyPublicId: companyId || undefined,
    search: searchParams.search,
    employeePublicId: searchParams.employeePublicId,
    warningTypePublicId: searchParams.warningTypePublicId,
  });

  const { data: companiesCatalog } = useGetCompaniesSelector({
    selector: true,
    page: 1,
    pageSize: 1000,
  });

  const { data: warningTypesCatalog } = useGetWarningTypes({
    page: 1,
    pageSize: 1000,
  });

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data]);

  useEffect(() => {
    refetchWarnings();
  }, [refetchTrigger, refetchWarnings]);

  const warningTypeById = new Map<string, string>();
  warningTypesCatalog?.data.forEach((w: any) =>
    warningTypeById.set(w.publicId, w.name)
  );

  const handleOpenModal = (warning?: WarningResponseDto) => {
    if (warning) {
      setEditingWarning(warning);
      setViewingWarning(null);
    } else {
      setEditingWarning(null);
      setViewingWarning(null);
    }
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (warning: WarningResponseDto) => {
    setViewingWarning(warning);
    setEditingWarning(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWarning(null);
    setViewingWarning(null);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingWarningId(id);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingWarning) {
      setIsDeleteModalOpen(false);
      setDeletingWarningId(null);
      setDeleteError(null);
    }
  };

  const handleRefetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  const { mutate: deleteWarning, isPending: isDeletingWarning } =
    useDeleteWarning();

  const handleDelete = (id: string) => {
    setDeleteError(null);
    deleteWarning(id, {
      onSuccess: () => {
        toast({
          title: t("toast.deleteSuccess.title"),
          variant: "default",
        });
        handleCloseDeleteModal();
        handleRefetch();
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          t("toast.deleteError.description");
        setDeleteError(errorMessage);
        handleError(error, toast);
      },
    });
  };

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

  const handleSearch = () => {
    setSearchParams({
      search: formValues.search || undefined,
      employeePublicId: formValues.employeePublicId || undefined,
      warningTypePublicId: formValues.warningTypePublicId || undefined,
    });
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  const handleResetSearch = () => {
    reset();
    setSearchParams({
      search: undefined,
      employeePublicId: undefined,
      warningTypePublicId: undefined,
    });
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  const handleDownloadExcel = async () => {
    if (!data?.data) return;

    try {
      await generateExcel(
        data.data,
        WARNING_COLUMNS_EXCEL,
        t("excel.filename"),
        t("excel.sheetName")
      );
      toast({
        title: t("toast.excelSuccess.title"),
        variant: "default",
      });
    } catch (error) {
      console.error("Error downloading excel:", error);
      toast({
        title: t("toast.excelError.title"),
        variant: "destructive",
      });
    }
  };

  const warnings = data?.data || [];
  const paginationData = data?.pagination || pagination;

  const WARNING_COLUMNS_EXCEL: HeaderMapping[] = [
    {
      attribute: "employee",
      header: t("excel.headers.employeeName"),
      render: (employee: WarningResponseDto["employee"]) =>
        employee ? `${employee.firstName} ${employee.lastName}` : "",
    },
    {
      attribute: "employee",
      header: t("excel.headers.documentNumber"),
      render: (employee: WarningResponseDto["employee"]) =>
        employee?.documentNumber || "",
    },
    {
      attribute: "warningTypePublicId",
      header: t("excel.headers.warningType"),
      render: (id: string, record?: WarningResponseDto) =>
        warningTypeById.get(id) || id || "",
    },
    {
      attribute: "createdAt",
      header: t("excel.headers.createdAt"),
      render: (createdAt: string | Date) =>
        DateTime.fromISO(
          typeof createdAt === "string" ? createdAt : createdAt.toISOString()
        ).toFormat("dd/MM/yyyy HH:mm"),
    },
  ];

  const actions = (
    <div className="flex flex-row gap-2">
      {canCreate(OrganizationPermissionCode.WARNING_OPERATIONS) && (
        <CHEKIOButton
          variant={ButtonVariant.PRIMARY}
          onClick={() => handleOpenModal()}
        >
          <PlusCircle className="h-4 w-4" />
          {t("buttons.add")}
        </CHEKIOButton>
      )}
      {canRead(OrganizationPermissionCode.WARNING_OPERATIONS) && (
        <CHEKIOButton
          variant={ButtonVariant.SECONDARY_BLUE}
          onClick={handleDownloadExcel}
          disabled={!data?.data || warnings.length === 0}
        >
          <Download className="h-4 w-4" />
          {t("buttons.downloadExcel")}
        </CHEKIOButton>
      )}
    </div>
  );

  return (
    <>

      {/* Search Filters */}
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("filters.search")}
            </label>
            <Controller
              name="search"
              control={control}
              render={({ field }) => (
                <CHEKIOInput
                  {...field}
                  value={field.value || ""}
                  placeholder={t("filters.searchPlaceholder")}
                />
              )}
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("filters.warningType")}
            </label>
            <Controller
              name="warningTypePublicId"
              control={control}
              render={({ field }) => (
                <CHEKIOSelect
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <CHEKIOSelectTrigger>
                    <CHEKIOSelectValue
                      placeholder={t("filters.warningTypePlaceholder")}
                    />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    {warningTypesCatalog?.data.map((type: any) => (
                      <CHEKIOSelectItem
                        key={type.publicId}
                        value={type.publicId}
                      >
                        {type.name}
                      </CHEKIOSelectItem>
                    ))}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              )}
            />
          </div>
          <div className="md:col-span-2 flex items-end gap-2">
            <CHEKIOButton
              variant={ButtonVariant.REFRESH}
              onClick={handleResetSearch}
            >
              <RefreshCw className="h-4 w-4" />
              {t("buttons.clear")}
            </CHEKIOButton>
            <CHEKIOButton variant={ButtonVariant.SEARCH} onClick={handleSearch}>
              <Search className="h-4 w-4" />
              {t("buttons.search")}
            </CHEKIOButton>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3">
          {actions}
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <CHEKIOLoading
              size="lg"
              variant="modern"
              text={t("table.loading")}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <CHEKIOTable className="w-full rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>
                      {t("table.headers.employeeName")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.documentNumber")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.warningType")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.createdAt")}
                    </CHEKIOTableHead>
                    {(canRead(OrganizationPermissionCode.WARNING_OPERATIONS) ||
                      canUpdate(OrganizationPermissionCode.WARNING_OPERATIONS) ||
                      canDelete(
                        OrganizationPermissionCode.WARNING_OPERATIONS
                      )) && (
                      <CHEKIOTableHead className="text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {warnings.length === 0 ? (
                    <CHEKIOTableRow index={0}>
                      <CHEKIOTableCell
                        colSpan={
                          4 +
                          (canRead(
                            OrganizationPermissionCode.WARNING_OPERATIONS
                          ) ||
                          canUpdate(
                            OrganizationPermissionCode.WARNING_OPERATIONS
                          ) ||
                          canDelete(OrganizationPermissionCode.WARNING_OPERATIONS)
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
                    warnings.map((warning: WarningResponseDto, index: number) => (
                      <CHEKIOTableRow key={warning.publicId} index={index}>
                        <CHEKIOTableCell className="font-medium text-gray-900">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              {warning.employee
                                ? `${warning.employee.firstName} ${warning.employee.lastName}`
                                : t("table.notAvailable")}
                            </div>
                          </div>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {warning.employee?.documentNumber ||
                            t("table.notAvailable")}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {warningTypeById.get(warning.warningTypePublicId) ||
                            warning.warningTypePublicId ||
                            t("table.notAvailable")}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {DateTime.fromISO(
                            typeof warning.createdAt === "string"
                              ? warning.createdAt
                              : warning.createdAt.toISOString()
                          ).toFormat("dd/MM/yyyy HH:mm")}
                        </CHEKIOTableCell>
                        {(canRead(
                          OrganizationPermissionCode.WARNING_OPERATIONS
                        ) ||
                          canUpdate(
                            OrganizationPermissionCode.WARNING_OPERATIONS
                          ) ||
                          canDelete(
                            OrganizationPermissionCode.WARNING_OPERATIONS
                          )) && (
                          <CHEKIOTableCell>
                            <div className="flex items-center justify-end gap-2">
                              {canRead(
                                OrganizationPermissionCode.WARNING_OPERATIONS
                              ) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenViewModal(warning)}
                                  aria-label={t("ariaLabels.viewWarning") || "Ver amonestacion"}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              {canUpdate(
                                OrganizationPermissionCode.WARNING_OPERATIONS
                              ) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenModal(warning)}
                                  aria-label={t("ariaLabels.editWarning")}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              {canDelete(
                                OrganizationPermissionCode.WARNING_OPERATIONS
                              ) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenDeleteModal(warning.publicId)
                                  }
                                  aria-label={t("ariaLabels.deleteWarning")}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
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

            {warnings.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {t("pagination.showing", {
                      current: warnings.length,
                      total: paginationData.totalCount,
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      {t("pagination.recordsPerPage")}:
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
                    variant={ButtonVariant.SECONDARY_BLUE}
                    onClick={() => handlePageChange(paginationData.current - 1)}
                    disabled={paginationData.current === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("buttons.previous")}
                  </CHEKIOButton>
                  <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                    {t("pagination.page", {
                      current: paginationData.current,
                      total: paginationData.totalPages,
                    })}
                  </div>
                  <CHEKIOButton
                    variant={ButtonVariant.SECONDARY_BLUE}
                    onClick={() => handlePageChange(paginationData.current + 1)}
                    disabled={
                      paginationData.current >= paginationData.totalPages
                    }
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
        <WarningModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingWarning={viewingWarning || editingWarning}
          onSuccess={() => handleRefetch()}
          mode={viewingWarning ? "view" : editingWarning ? "edit" : "create"}
        />
      )}

      {canDelete(OrganizationPermissionCode.WARNING_OPERATIONS) && (
        <CHEKIOModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          title={t("delete.title")}
          size="md"
        >
          <div className="space-y-6">
            <p className="text-gray-700 flex items-center gap-3 text-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              {t("delete.message")}
            </p>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-red-700 text-sm">{deleteError}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <CHEKIOButton
                variant={ButtonVariant.SECONDARY}
                onClick={handleCloseDeleteModal}
                disabled={isDeletingWarning}
              >
                <X className="h-4 w-4" />
                {t("buttons.cancel")}
              </CHEKIOButton>
              <CHEKIOButton
                variant={ButtonVariant.DESTRUCTIVE}
                onClick={() => {
                  if (deletingWarningId) {
                    handleDelete(deletingWarningId);
                  }
                }}
                disabled={isDeletingWarning}
              >
                {isDeletingWarning ? (
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

export default function WarningsPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.WARNING_OPERATIONS}
    >
      <WarningsContent />
    </AccessNotGranted>
  );
}
