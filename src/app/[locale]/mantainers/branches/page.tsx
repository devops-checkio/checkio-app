"use client";

import ModalDelete from "@/app/[locale]/_components/modal-delete";
import {
  CHEKIOButton,
  CHEKIOHeader,
  CHEKIOInput,
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
import { PaginationFilterDto } from "@/dto/pagination";
import { useToast } from "@/hooks/use-toast";
import { useBranchesTour } from "@/hooks/useBranchesTour";
import {
  useDeleteBranch,
  useGetBranches,
  useGetCompanies,
} from "@/service/mantainer.service";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import axios from "axios";
import {
  Building2,
  CalendarPlus,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Code,
  Download,
  Hash,
  HelpCircle,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  XCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
} from "lucide-react";
import { DateTime } from "luxon";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import AccessNotGranted from "../../_components/acces-not-granted";
import BranchModalMasive from "./_components/branch-modal-masive";
import BranchModalUpsert from "./_components/branch-modal-upsert";
import { BranchResponseDto, BranchFindAllDto, BranchSortBy } from "./_components/branch.dto";

function BranchesContent() {
  const t = useTranslations("mantainers.branches");
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { companyId, canUpdate, canDelete, canCreate, canRead, getTemplateUser } =
    useCookieSession();
  const templateUser = getTemplateUser();
  const [editingBranch, setEditingBranch] = useState<BranchResponseDto | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);
  const [isModalMasiveOpen, setIsModalMasiveOpen] = useState(false);
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      search: "",
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
  const [sortBy, setSortBy] = useState<BranchSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { data: companies, isLoading: isLoadingCompanies } = useGetCompanies({
    page: 1,
    pageSize: 100,
    sort: "asc",
    selector: true,
  });
  const { data, isLoading, refetch } = useGetBranches({
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    sortBy,
    sortOrder,
    search: watch("search"),
    companyId: companyId!,
  } as BranchFindAllDto);
  const { mutate: deleteBranch, isPending: isDeletingBranch } =
    useDeleteBranch();

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data]);

  const handleSort = useCallback((column: BranchSortBy) => {
    if (sortBy === column) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  }, [sortBy]);

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
      current: 1, // Reset to first page when changing page size
    }));
  }, []);

  const onSubmitSearch = (data: { search: string }) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleOpenModal = (branch?: BranchResponseDto) => {
    if (branch) {
      setEditingBranch(branch);
    } else {
      setEditingBranch(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingBranchId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingBranchId(null);
  };

  const handleOpenModalMasive = () => {
    setIsModalMasiveOpen(true);
  };

  const handleCloseModalMasive = () => {
    setIsModalMasiveOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteBranch(id, {
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

  const BRANCH_COLUMNS_EXCEL: HeaderMapping[] = [
    {
      attribute: "code",
      header: t("excel.headers.code"),
    },
    {
      attribute: "name",
      header: t("excel.headers.name"),
    },
    {
      attribute: "address",
      header: t("excel.headers.address"),
    },
    {
      attribute: "phone",
      header: t("excel.headers.phone"),
    },
    {
      attribute: "isActive",
      header: t("excel.headers.isActive"),
      render: (isActive: boolean) =>
        isActive ? t("table.status.yes") : t("table.status.no"),
    },
    {
      attribute: "createdAt",
      header: t("excel.headers.createdAt"),
      render: (createdAt: string) =>
        DateTime.fromISO(createdAt).toFormat("dd/MM/yyyy"),
    },
  ];

  const branches = data?.data || [];

  const { startTour } = useBranchesTour();
  const canShowTour = isLoading || branches.length > 0;

  const companyOptions =
    companies?.data.map((company) => ({
      value: company.publicId,
      label: company.businessName,
    })) || [];

  const toolbarContent = (
    <>
      <form
        onSubmit={handleSubmit(onSubmitSearch)}
        className="flex items-center gap-2"
      >
        <CHEKIOInput
          type="search"
          placeholder={t("search.placeholder")}
          {...register("search")}
          className="w-[220px]"
        />
        <CHEKIOButton variant="search" type="submit">
          <Search className="h-4 w-4" />
          {t("buttons.search")}
        </CHEKIOButton>
      </form>
      <div className="flex items-center gap-2">
        {canCreate(OrganizationPermissionCode.BRANCH_MAINTENANCE) && (
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
        {canRead(OrganizationPermissionCode.BRANCH_MAINTENANCE) && (
          <CHEKIOButton
            variant="approve"
            onClick={() =>
              generateExcel(
                data?.data || [],
                BRANCH_COLUMNS_EXCEL,
                t("excel.filename"),
                t("excel.sheetName"),
              )
            }
          >
            <Download className="h-4 w-4" />
            {t("buttons.downloadExcel")}
          </CHEKIOButton>
        )}
      </div>
    </>
  );

  const SortableHead = ({
    column,
    label,
    icon: Icon,
  }: {
    column: BranchSortBy;
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

  return (
    <>
      <CHEKIOHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[
          t("breadcrumbs.dashboard"),
          t("breadcrumbs.maintainers"),
          t("breadcrumbs.branches"),
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
              className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 px-5 py-3"
              data-tour="branches-toolbar"
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-[220px] animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-[100px] animate-pulse rounded-lg bg-gray-200" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-[120px] animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-[140px] animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-[150px] animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
            <div className="overflow-x-auto" data-tour="branches-table">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <SortableHead
                      column="code"
                      label={t("table.headers.code")}
                      icon={Hash}
                    />
                    <SortableHead
                      column="name"
                      label={t("table.headers.name")}
                      icon={Building2}
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
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.isActive")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <CalendarPlus className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.createdAt")}
                      </span>
                    </CHEKIOTableHead>
                    {(canUpdate(OrganizationPermissionCode.BRANCH_MAINTENANCE) ||
                      canDelete(
                        OrganizationPermissionCode.BRANCH_MAINTENANCE,
                      )) && (
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
                        <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      {(canUpdate(
                        OrganizationPermissionCode.BRANCH_MAINTENANCE,
                      ) ||
                        canDelete(
                          OrganizationPermissionCode.BRANCH_MAINTENANCE,
                        )) && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate(
                              OrganizationPermissionCode.BRANCH_MAINTENANCE,
                            ) && (
                              <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                            )}
                            {canDelete(
                              OrganizationPermissionCode.BRANCH_MAINTENANCE,
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
              data-tour="branches-pagination"
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
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <MapPin className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
            {canCreate(OrganizationPermissionCode.BRANCH_MAINTENANCE) && (
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
              className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 px-5 py-3"
              data-tour="branches-toolbar"
            >
              {toolbarContent}
            </div>
            <div className="overflow-x-auto" data-tour="branches-table">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <SortableHead
                      column="code"
                      label={t("table.headers.code")}
                      icon={Hash}
                    />
                    <SortableHead
                      column="name"
                      label={t("table.headers.name")}
                      icon={Building2}
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
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.isActive")}
                      </span>
                    </CHEKIOTableHead>
                    <SortableHead
                      column="createdAt"
                      label={t("table.headers.createdAt")}
                      icon={CalendarPlus}
                    />
                    {(canUpdate(OrganizationPermissionCode.BRANCH_MAINTENANCE) ||
                      canDelete(
                        OrganizationPermissionCode.BRANCH_MAINTENANCE,
                      )) && (
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {branches.map((branch: BranchResponseDto, index: number) => (
                    <CHEKIOTableRow key={branch.publicId} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5 font-mono text-sm text-gray-600">
                        {branch.code}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                        {branch.name}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {branch.address || "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {branch.settings?.integrationCode ?? "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                            branch.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {branch.isActive ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {branch.isActive
                            ? t("table.status.yes")
                            : t("table.status.no")}
                        </span>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {DateTime.fromISO(
                          typeof branch.createdAt === "string"
                            ? branch.createdAt
                            : branch.createdAt.toISOString(),
                        ).toFormat("dd/MM/yyyy")}
                      </CHEKIOTableCell>
                      {(canUpdate(
                        OrganizationPermissionCode.BRANCH_MAINTENANCE,
                      ) ||
                        canDelete(
                          OrganizationPermissionCode.BRANCH_MAINTENANCE,
                        )) && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate(
                              OrganizationPermissionCode.BRANCH_MAINTENANCE,
                            ) && (
                              <Link
                                href={`/mantainers/branches/${branch.publicId}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                title={t("buttons.edit")}
                                aria-label={t("ariaLabels.editBranch")}
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            )}
                            {canDelete(
                              OrganizationPermissionCode.BRANCH_MAINTENANCE,
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDeleteModal(branch.publicId)
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                title={t("buttons.delete")}
                                aria-label={t("ariaLabels.deleteBranch")}
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
              data-tour="branches-pagination"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: branches.length,
                    total: pagination.totalCount,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
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
                  disabled={pagination.current === 1}
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
        <BranchModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingBranch={editingBranch}
          onSuccess={() => {
            refetch();
            handleCloseModal();
          }}
          companyOptions={companyOptions}
        />
      )}
      <ModalDelete
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={() => {
          if (deletingBranchId) {
            return handleDelete(deletingBranchId);
          }
          return Promise.resolve();
        }}
        message={t("delete.confirmMessage")}
      />

      {isModalMasiveOpen && (
        <BranchModalMasive
          isOpen={isModalMasiveOpen}
          onClose={handleCloseModalMasive}
          onSuccess={() => refetch()}
          companyOptions={companyOptions}
        />
      )}
    </>
  );
}

export default function BranchesPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.BRANCH_MAINTENANCE}
    >
      <BranchesContent />
    </AccessNotGranted>
  );
}
