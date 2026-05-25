"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
  CHEKIOButton,
  CHEKIOLoading,
  CHEKIOModal,
  CHEKIOHeader,
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
import { useCompaniesTour } from "@/hooks/useCompaniesTour";
import { useToast } from "@/hooks/use-toast";
import { useDeleteCompany, useGetCompanies } from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { HeaderMapping, generateExcel } from "@/utils/excel";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CalendarPlus,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Code,
  Download,
  FileText,
  Hash,
  HelpCircle,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Store,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import CompanyModalMasive from "./_components/company-modal-masive";
import CompanyModalUpsert from "./_components/company-modal-upsert";
import {
  CompanyFindFilterDto,
  CompanyResponseDto,
  CompanySortBy,
} from "./_components/company.dto";

function CompaniesContent() {
  const router = useRouter();
  const t = useTranslations("mantainers.companies");
  const { startTour } = useCompaniesTour();
  const { canRead, canCreate, canUpdate, canDelete, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] =
    useState<CompanyResponseDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(
    null
  );
  const [isModalMasiveOpen, setIsModalMasiveOpen] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [sortBy, setSortBy] = useState<CompanySortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { mutate: deleteCompany, isPending: isDeletingCompany } =
    useDeleteCompany();

  const {
    data: companiesData,
    isLoading,
    refetch: refetchCompanies,
  } = useGetCompanies({
    page,
    pageSize,
    sort: "desc",
    sortBy,
    sortOrder,
  } as CompanyFindFilterDto);

  const handleSort = useCallback((column: CompanySortBy) => {
    if (sortBy === column) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  }, [sortBy]);

  useEffect(() => {
    if (refetchTrigger > 0) {
      refetchCompanies();
    }
  }, [refetchTrigger, refetchCompanies]);

  const handleOpenModal = (company?: CompanyResponseDto) => {
    if (company) {
      setEditingCompany(company);
    } else {
      setEditingCompany(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingCompanyId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingCompany) {
      setIsDeleteModalOpen(false);
      setDeletingCompanyId(null);
      setDeleteError(null);
    }
  };

  const handleOpenModalMasive = () => {
    setIsModalMasiveOpen(true);
  };

  const handleCloseModalMasive = () => {
    setIsModalMasiveOpen(false);
  };

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const handleDelete = (id: string) => {
    setDeleteError(null);
    deleteCompany(id, {
      onSuccess: () => {
        toast({
          title: t("delete.success"),
          variant: "default",
        });
        handleCloseDeleteModal();
        refetch();
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message || error?.message || t("delete.error");
        setDeleteError(errorMessage);
        handleError(error, toast);
      },
    });
  };

  const handleDownloadExcel = async () => {
    if (!companiesData?.data) return;

    try {
      setIsGeneratingExcel(true);
      await generateExcel(
        companiesData.data,
        COMPANY_COLUMNS_EXCEL,
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

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const SortableHead = ({
    column,
    label,
    icon: Icon,
  }: {
    column: CompanySortBy;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
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
          <Icon className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
          {label}
          {isActive ? (
            sortOrder === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
          )}
        </button>
      </CHEKIOTableHead>
    );
  };

  const companies = companiesData?.data || [];
  const pagination = companiesData?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const COMPANY_COLUMNS_EXCEL: HeaderMapping[] = [
    {
      attribute: "documentType",
      header: t("excel.headers.documentType"),
    },
    {
      attribute: "documentNumber",
      header: t("excel.headers.documentNumber"),
    },
    {
      attribute: "businessName",
      header: t("excel.headers.businessName"),
    },
    {
      attribute: "tradeName",
      header: t("excel.headers.tradeName"),
    },
    {
      attribute: "address",
      header: t("excel.headers.address"),
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
  ];

  const toolbarButtons = (
    <div className="flex flex-row gap-2">
      {canCreate(OrganizationPermissionCode.COMPANY_MAINTENANCE) && (
        <>
          <CHEKIOButton variant="primary" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" />
            {t("buttons.add")}
          </CHEKIOButton>
          <CHEKIOButton variant="primary" onClick={() => handleOpenModalMasive()}>
            <Upload className="h-4 w-4" />
            {t("buttons.addMassive")}
          </CHEKIOButton>
        </>
      )}
      {canRead(OrganizationPermissionCode.COMPANY_MAINTENANCE) && (
        <CHEKIOButton
          variant="approve"
          onClick={handleDownloadExcel}
          disabled={isGeneratingExcel || !companiesData?.data}
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

  const canShowTour = isLoading || companies.length > 0;

  return (
    <>
      <CHEKIOHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[
          t("breadcrumbs.dashboard"),
          t("breadcrumbs.maintainers"),
          t("breadcrumbs.companies"),
        ]}
        actions={
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={() => startTour()}
            disabled={!canShowTour}
            title={
              !canShowTour
                ? t("table.noDataDescription")
                : undefined
            }
          >
            <HelpCircle className="h-4 w-4" />
            {t("tour.startButton")}
          </CHEKIOButton>
        }
      />
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <>
            <div
              className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3"
              data-tour="companies-toolbar"
            >
              <div className="flex flex-row gap-2">
                <div className="h-9 w-[100px] animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-[140px] animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-[150px] animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
            <div
              className="overflow-x-auto"
              data-tour="companies-table"
            >
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.documentType")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Hash className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.documentNumber")}
                        <ArrowUpDown className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.businessName")}
                        <ArrowUpDown className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Store className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.tradeName")}
                        <ArrowUpDown className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.address")}
                        <ArrowUpDown className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Code className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.integrationCode")}
                        <ArrowUpDown className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <CalendarPlus className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.createdAt")}
                        <ArrowUpDown className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.isActive")}
                      </span>
                    </CHEKIOTableHead>
                    {(canUpdate(OrganizationPermissionCode.COMPANY_MAINTENANCE) ||
                      canDelete(
                        OrganizationPermissionCode.COMPANY_MAINTENANCE
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
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                      </CHEKIOTableCell>
                      {(canUpdate(OrganizationPermissionCode.COMPANY_MAINTENANCE) ||
                        canDelete(
                          OrganizationPermissionCode.COMPANY_MAINTENANCE
                        )) && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate(
                              OrganizationPermissionCode.COMPANY_MAINTENANCE
                            ) && (
                              <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                            )}
                            {canDelete(
                              OrganizationPermissionCode.COMPANY_MAINTENANCE
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

            <div
              className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between"
              data-tour="companies-pagination"
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
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <Building2 className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
            {canCreate(OrganizationPermissionCode.COMPANY_MAINTENANCE) && (
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
            <div
              className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3"
              data-tour="companies-toolbar"
            >
              {toolbarButtons}
            </div>
            <div
              className="overflow-x-auto"
              data-tour="companies-table"
            >
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.documentType")}
                      </span>
                    </CHEKIOTableHead>
                    <SortableHead
                      column="documentNumber"
                      label={t("table.headers.documentNumber")}
                      icon={Hash}
                    />
                    <SortableHead
                      column="businessName"
                      label={t("table.headers.businessName")}
                      icon={Building2}
                    />
                    <SortableHead
                      column="tradeName"
                      label={t("table.headers.tradeName")}
                      icon={Store}
                    />
                    <SortableHead
                      column="address"
                      label={t("table.headers.address")}
                      icon={MapPin}
                    />
                    <SortableHead
                      column="integrationCode"
                      label={t("table.headers.integrationCode")}
                      icon={Code}
                    />
                    <SortableHead
                      column="createdAt"
                      label={t("table.headers.createdAt")}
                      icon={CalendarPlus}
                    />
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.isActive")}
                      </span>
                    </CHEKIOTableHead>
                    {(canUpdate(OrganizationPermissionCode.COMPANY_MAINTENANCE) ||
                      canDelete(
                        OrganizationPermissionCode.COMPANY_MAINTENANCE
                      )) && (
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {companies.map((company: CompanyResponseDto, index: number) => (
                    <CHEKIOTableRow key={company.publicId} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {company.documentType}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 font-mono text-sm text-gray-600">
                        {company.documentNumber}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                        {company.businessName}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {company.tradeName || "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {company.address || "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {company.integrationCode || "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {DateTime.fromISO(
                          typeof company.createdAt === "string"
                            ? company.createdAt
                            : company.createdAt.toISOString()
                        ).toFormat("dd/MM/yyyy")}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                            company.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {company.isActive ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {company.isActive
                            ? t("table.status.yes")
                            : t("table.status.no")}
                        </span>
                      </CHEKIOTableCell>
                      {(canUpdate(OrganizationPermissionCode.COMPANY_MAINTENANCE) ||
                        canDelete(
                          OrganizationPermissionCode.COMPANY_MAINTENANCE
                        )) && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate(
                              OrganizationPermissionCode.COMPANY_MAINTENANCE
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/mantainers/companies/${company.publicId}`
                                  )
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                title={t("buttons.edit")}
                                aria-label={t("ariaLabels.editCompany")}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete(
                              OrganizationPermissionCode.COMPANY_MAINTENANCE
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDeleteModal(company.publicId)
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                title={t("buttons.delete")}
                                aria-label={t("ariaLabels.deleteCompany")}
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

            <div
              className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between"
              data-tour="companies-pagination"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: companies.length,
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
        <CompanyModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingCompany={editingCompany}
          onSuccess={() => refetch()}
        />
      )}
      {canDelete(OrganizationPermissionCode.COMPANY_MAINTENANCE) && (
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
                variant="secondary"
                onClick={handleCloseDeleteModal}
                disabled={isDeletingCompany}
              >
                <X className="h-4 w-4" />
                {t("buttons.cancel")}
              </CHEKIOButton>
              <CHEKIOButton
                variant="destructive"
                onClick={() => {
                  if (deletingCompanyId) {
                    handleDelete(deletingCompanyId);
                  }
                }}
                disabled={isDeletingCompany}
              >
                {isDeletingCompany ? (
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

      {isModalMasiveOpen && (
        <CompanyModalMasive
          isOpen={isModalMasiveOpen}
          onClose={handleCloseModalMasive}
          onSuccess={() => refetch()}
        />
      )}
    </>
  );
}

export default function CompaniesPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.COMPANY_MAINTENANCE
      }
    >
      <CompaniesContent />
    </AccessNotGranted>
  );
}
