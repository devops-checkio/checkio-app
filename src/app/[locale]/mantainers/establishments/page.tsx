"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
  CHEKIOButton,
  CHEKIOHeader,
  CHEKIOInput,
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
import { useEstablishmentsTour } from "@/hooks/useEstablishmentsTour";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteEstablishment,
  useGetCompanies,
  useGetEstablishments,
} from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Code,
  Download,
  Eye,
  Hash,
  HelpCircle,
  Hospital,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { ComponentType, CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import EstablishmentModalMasive from "./_components/establishment-modal-masive";
import EstablishmentModalUpsert from "./_components/establishment-modal-upsert";
import {
  EstablishmentFindAllDto,
  EstablishmentResponseDto,
  EstablishmentSortBy,
} from "./_components/establishment.dto";

function EstablishmentsContent() {
  const t = useTranslations("mantainers.establishments");
  const router = useRouter();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { companyId, canUpdate, canDelete, canCreate, getTemplateUser } =
    useCookieSession();
  const templateUser = getTemplateUser();
  const [editingEstablishment, setEditingEstablishment] =
    useState<EstablishmentResponseDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isModalMasiveOpen, setIsModalMasiveOpen] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const { register, handleSubmit, watch } = useForm({
    defaultValues: { search: "" },
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
  const [sortBy, setSortBy] = useState<EstablishmentSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: companies, isLoading: isLoadingCompanies } = useGetCompanies({
    page: 1,
    pageSize: 100,
    sort: "asc",
    selector: true,
  });

  const { data, isLoading, refetch } = useGetEstablishments({
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    sortBy,
    sortOrder,
    search: watch("search"),
    companyId: companyId!,
  } as EstablishmentFindAllDto);

  const { mutate: deleteEstablishment, isPending: isDeletingEstablishment } =
    useDeleteEstablishment();

  const { startTour } = useEstablishmentsTour();

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data]);

  const handleSort = useCallback(
    (column: EstablishmentSortBy) => {
      if (sortBy === column) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(column);
        setSortOrder("asc");
      }
      setPagination((prev) => ({ ...prev, current: 1 }));
    },
    [sortBy],
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, current: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: newPageSize,
      current: 1,
    }));
  }, []);

  const onSubmitSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleOpenModal = (establishment?: EstablishmentResponseDto) => {
    setEditingEstablishment(establishment ?? null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEstablishment(null);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingEstablishment) {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      setDeleteError(null);
    }
  };

  const handleOpenModalMasive = () => {
    setIsModalMasiveOpen(true);
  };

  const handleCloseModalMasive = () => {
    setIsModalMasiveOpen(false);
  };

  const handleDelete = (id: string) => {
    setDeleteError(null);
    deleteEstablishment(id, {
      onSuccess: () => {
        toast({
          title: t("delete.success"),
          variant: "default",
        });
        handleCloseDeleteModal();
        refetch();
      },
      onError: (error: unknown) => {
        const errorMessage =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          (error as Error)?.message ||
          t("delete.error");
        setDeleteError(errorMessage);
        handleError(error, toast);
      },
    });
  };

  const companyOptions =
    companies?.data?.map((company: { publicId: string; tradeName?: string; businessName?: string }) => ({
      value: company.publicId,
      label: company.tradeName || company.businessName || company.publicId,
    })) ?? [];

  const handleDownloadExcel = async () => {
    if (!data?.data?.length) return;
    const headers: HeaderMapping[] = [
      { attribute: "code", header: t("table.headers.code") },
      { attribute: "name", header: t("table.headers.name") },
      { attribute: "address", header: t("table.headers.address") },
      { attribute: "phone", header: t("table.headers.phone") },
      { attribute: "timezone", header: t("table.headers.timezone") },
      { attribute: "isActive", header: t("table.headers.isActive") },
    ];
    try {
      setIsGeneratingExcel(true);
      await generateExcel(
        data.data,
        headers,
        t("excel.filename"),
        t("excel.sheetName"),
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

  const SortableHead = ({
    column,
    label,
    icon: Icon,
  }: {
    column: EstablishmentSortBy;
    label: string;
    icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  }) => {
    const isActive = sortBy === column;
    return (
      <CHEKIOTableHead
        className="min-w-[120px] cursor-pointer select-none"
        aria-sort={
          isActive
            ? sortOrder === "asc"
              ? "ascending"
              : "descending"
            : undefined
        }
      >
        <button
          type="button"
          onClick={() => handleSort(column)}
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          title={`Ordenar por ${label}`}
        >
          <Icon
            className="h-4 w-4"
            style={{ color: `${templateUser.primary}99` }}
          />
          {label}
          {isActive ? (
            sortOrder === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )
          ) : (
            <ArrowUpDown
              className="h-4 w-4"
              style={{ color: `${templateUser.primary}99` }}
            />
          )}
        </button>
      </CHEKIOTableHead>
    );
  };

  const establishments = data?.data ?? [];
  const canShowTour =
    isLoading || isLoadingCompanies || establishments.length > 0;

  const showActionsColumn = true;

  const toolbarButtons = (
    <div className="flex flex-row flex-wrap items-center justify-end gap-2">
      {canCreate(OrganizationPermissionCode.ESTABLISHMENT_MAINTENANCE) && (
        <>
          <CHEKIOButton
            variant="primary"
            onClick={() => handleOpenModal()}
            data-tour="establishments-add"
          >
            <Plus className="h-4 w-4" />
            {t("buttons.add")}
          </CHEKIOButton>
          <CHEKIOButton
            variant="primary"
            onClick={handleOpenModalMasive}
            data-tour="establishments-masive"
          >
            <Upload className="h-4 w-4" />
            {t("buttons.addMassive")}
          </CHEKIOButton>
        </>
      )}
      <CHEKIOButton
        variant="approve"
        onClick={handleDownloadExcel}
        disabled={isGeneratingExcel || !data?.data?.length}
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
    </div>
  );

  return (
    <>
      <CHEKIOHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[
          t("breadcrumbs.dashboard"),
          t("breadcrumbs.maintainers"),
          t("breadcrumbs.establishments"),
        ]}
        actions={
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={() => startTour()}
            disabled={!canShowTour}
            title={!canShowTour ? t("table.noDataDescription") : undefined}
            data-tour="establishments-help"
          >
            <HelpCircle className="h-4 w-4" />
            {t("tour.startButton")}
          </CHEKIOButton>
        }
      />
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading || isLoadingCompanies ? (
          <>
            <div
              className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              data-tour="establishments-toolbar"
            >
              <div className="h-9 w-full max-w-md animate-pulse rounded-lg bg-gray-200" />
              <div className="flex flex-row flex-wrap justify-end gap-2">
                <div className="h-9 w-[100px] animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-[140px] animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-[150px] animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
            <div className="overflow-x-auto" data-tour="establishments-table">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Code
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.code")}
                        <ArrowUpDown
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Hospital
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.name")}
                        <ArrowUpDown
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <MapPin
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.address")}
                        <ArrowUpDown
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Building2
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.companies")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Hash
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.isActive")}
                      </span>
                    </CHEKIOTableHead>
                    {showActionsColumn && (
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {[...Array(pagination.pageSize)].map((_, index) => (
                    <CHEKIOTableRow key={index} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                      </CHEKIOTableCell>
                      {showActionsColumn && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
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
            <div
              className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between"
              data-tour="establishments-pagination"
            >
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
        ) : (
          <>
            <div
              className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              data-tour="establishments-toolbar"
            >
              <form
                onSubmit={handleSubmit(onSubmitSearch)}
                className="flex flex-wrap items-center gap-2"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <CHEKIOInput
                    {...register("search")}
                    placeholder={t("search.placeholder")}
                    className="w-64 pl-9"
                  />
                </div>
                <CHEKIOButton variant="primary" type="submit">
                  {t("search.button")}
                </CHEKIOButton>
              </form>
              {toolbarButtons}
            </div>
            <div className="overflow-x-auto" data-tour="establishments-table">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <SortableHead
                      column="code"
                      label={t("table.headers.code")}
                      icon={Code}
                    />
                    <SortableHead
                      column="name"
                      label={t("table.headers.name")}
                      icon={Hospital}
                    />
                    <SortableHead
                      column="address"
                      label={t("table.headers.address")}
                      icon={MapPin}
                    />
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Building2
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.companies")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Hash
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.isActive")}
                      </span>
                    </CHEKIOTableHead>
                    {showActionsColumn && (
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {establishments.length === 0 ? (
                    <CHEKIOTableRow index={0}>
                      <CHEKIOTableCell
                        colSpan={showActionsColumn ? 6 : 5}
                        className="px-6 py-16 text-center"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
                            <Hospital className="h-10 w-10 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {watch("search")?.trim()
                              ? t("table.noResultsFiltered")
                              : t("table.noData")}
                          </h3>
                          <p className="mt-1 max-w-md text-center text-sm text-gray-500">
                            {watch("search")?.trim()
                              ? t("table.noResultsFilteredHint")
                              : t("table.noDataDescription")}
                          </p>
                        </div>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ) : (
                    establishments.map((establishment, index) => (
                    <CHEKIOTableRow
                      key={establishment.publicId}
                      index={index}
                    >
                      <CHEKIOTableCell className="px-5 py-3.5 font-mono text-sm text-gray-600">
                        {establishment.code}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                        {establishment.name}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {establishment.address}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        <span className="text-xs text-gray-500">
                          {Array.isArray(establishment.companies)
                            ? establishment.companies.length
                            : 0}{" "}
                          {t("table.companiesCount")}
                        </span>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                            establishment.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {establishment.isActive ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {establishment.isActive
                            ? t("table.status.yes")
                            : t("table.status.no")}
                        </span>
                      </CHEKIOTableCell>
                      {showActionsColumn && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/mantainers/establishments/${establishment.publicId}`,
                                )
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sky-600 transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30"
                              title={t("table.ariaLabels.viewAttendance")}
                              aria-label={t("table.ariaLabels.viewAttendance")}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {canUpdate(
                              OrganizationPermissionCode
                                .ESTABLISHMENT_MAINTENANCE,
                            ) && (
                              <button
                                type="button"
                                onClick={() => handleOpenModal(establishment)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                title={t("table.ariaLabels.edit")}
                                aria-label={t("table.ariaLabels.edit")}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete(
                              OrganizationPermissionCode
                                .ESTABLISHMENT_MAINTENANCE,
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDeleteModal(establishment.publicId)
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                title={t("table.ariaLabels.delete")}
                                aria-label={t("table.ariaLabels.delete")}
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
            <div
              className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between"
              data-tour="establishments-pagination"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: establishments.length,
                    total: pagination.totalCount,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <label className="whitespace-nowrap text-sm font-medium text-gray-700">
                    {t("pagination.recordsPerPage")}
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
                  disabled={pagination.current <= 1}
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
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current >= pagination.totalPages}
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
        <EstablishmentModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingEstablishment={editingEstablishment}
          onSuccess={() => refetch()}
          companyOptions={companyOptions}
        />
      )}
      {isModalMasiveOpen && (
        <EstablishmentModalMasive
          isOpen={isModalMasiveOpen}
          onClose={handleCloseModalMasive}
          onSuccess={() => refetch()}
          companyOptions={companyOptions}
        />
      )}
      {canDelete(OrganizationPermissionCode.ESTABLISHMENT_MAINTENANCE) && (
        <CHEKIOModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          title={t("delete.title")}
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
                variant="secondary"
                onClick={handleCloseDeleteModal}
                disabled={isDeletingEstablishment}
              >
                <X className="h-4 w-4" />
                {t("buttons.cancel")}
              </CHEKIOButton>
              <CHEKIOButton
                variant="destructive"
                onClick={() => {
                  if (deletingId) {
                    handleDelete(deletingId);
                  }
                }}
                disabled={isDeletingEstablishment}
              >
                {isDeletingEstablishment ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("delete.deleting")}
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

export default function EstablishmentsPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.ESTABLISHMENT_MAINTENANCE
      }
    >
      <EstablishmentsContent />
    </AccessNotGranted>
  );
}
