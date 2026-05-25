"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { PaginationFilterDto } from "@/dto/pagination";
import { StructureResponseDto } from "@/dto/structure";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteStructure,
  useGetCompaniesSelector,
  useGetStructures,
} from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import StructureModalUpsert from "./_components/structure-modal-upsert";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY_BLUE = "secondaryBlue",
}

function StructureContent() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("mantainers.structures");
  const { canRead, canCreate, canUpdate, canDelete, getTemplateUser, companyId } =
    useCookieSession();
  const templateUser = getTemplateUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] =
    useState<StructureResponseDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingStructureId, setDeletingStructureId] = useState<string | null>(
    null
  );
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      search: "",
    },
  });
  const { data: companies, isLoading: isLoadingCompanies } =
    useGetCompaniesSelector({
      page: 1,
      pageSize: 100,
      sort: "asc",
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

  const { data, isLoading, refetch } = useGetStructures(
    {
      page: pagination.current,
      pageSize: pagination.pageSize,
      sort: pagination.sort,
      search: watch("search"),
      companyId: companyId ?? undefined,
    },
    { enabled: !!companyId },
  );
  const { mutate: deleteStructure, isPending: isDeletingStructure } =
    useDeleteStructure();

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data]);

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

  const handleOpenModal = (structure?: StructureResponseDto) => {
    if (structure) {
      setEditingStructure(structure);
    } else {
      setEditingStructure(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStructure(null);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingStructureId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingStructureId(null);
  };

  const handleDelete = (id: string) => {
    deleteStructure(id, {
      onSuccess: () => {
        toast({
          title: t("delete.success"),
          variant: "default",
        });
        refetch();
        handleCloseDeleteModal();
      },
      onError: (error: any) => {
        handleError(error, toast);
      },
      onSettled: () => {
        handleCloseDeleteModal();
      },
    });
  };

  const companyOptions =
    companies?.data.map((company) => ({
      value: company.publicId,
      label: company.businessName,
    })) || [];

  const STRUCTURE_COLUMNS_EXCEL: HeaderMapping[] = [
    {
      attribute: "name",
      header: t("excel.headers.name"),
    },
    {
      attribute: "companies",
      header: t("excel.headers.companies"),
      render: (companies: string[]) => {
        const companyNames = companies
          .map((companyId: string) => {
            const company = companyOptions.find(
              (option) => option.value === companyId
            );
            return company?.label || "-";
          })
          .filter((name: string) => name !== "-");
        return companyNames.length > 0 ? companyNames.join(", ") : "-";
      },
    },
  ];


  const toolbarButtons = (
    <div className="flex items-center gap-2">
      <form
        onSubmit={handleSubmit(onSubmitSearch)}
        className="flex items-center gap-2"
      >
        <CHEKIOInput
          type="search"
          placeholder={t("filters.searchPlaceholder")}
          {...register("search")}
          className="w-64"
        />
        <CHEKIOButton variant="search" type="submit">
          <Search className="h-4 w-4" />
          {t("buttons.search")}
        </CHEKIOButton>
      </form>
      {canCreate(OrganizationPermissionCode.STRUCTURE_MAINTENANCE) && (
        <CHEKIOButton variant={ButtonVariant.PRIMARY} onClick={() => handleOpenModal()}>
          <PlusCircle className="h-4 w-4" />
          {t("buttons.add")}
        </CHEKIOButton>
      )}
      {canRead(OrganizationPermissionCode.STRUCTURE_MAINTENANCE) && (
        <CHEKIOButton
          variant="approve"
          onClick={() =>
            generateExcel(
              data?.data || [],
              STRUCTURE_COLUMNS_EXCEL,
              t("excel.filename"),
              t("excel.sheetName"),
            )
          }
          disabled={!data?.data?.length}
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
        {!companyId ? (
          <div className="animate-content-fade-in flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50">
              <Building2 className="h-10 w-10 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.selectCompanyTitle")}
            </h3>
            <p className="mt-1 max-w-md text-center text-sm text-gray-500">
              {t("table.selectCompanyDescription")}
            </p>
          </div>
        ) : isLoading ? (
          <div className="animate-content-fade-in">
            <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-64 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-md" />
                <Skeleton className="h-10 w-36 rounded-md" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[180px]">
                      {t("table.headers.name")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[200px]">
                      {t("table.headers.companies")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px] text-right">
                      {t("table.headers.actions")}
                    </CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <CHEKIOTableRow key={index} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-4 w-40 rounded" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          <Skeleton className="h-6 w-24 rounded-full" />
                          <Skeleton className="h-6 w-28 rounded-full" />
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>
            <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-40 rounded" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-10 w-24 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-lg" />
                <Skeleton className="h-10 w-20 rounded-md" />
              </div>
            </div>
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="animate-content-fade-in flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <Layers className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
            {canCreate(OrganizationPermissionCode.STRUCTURE_MAINTENANCE) && (
              <CHEKIOButton
                variant={ButtonVariant.PRIMARY}
                onClick={() => handleOpenModal()}
                className="mt-6 gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                {t("buttons.add")}
              </CHEKIOButton>
            )}
          </div>
        ) : (
          <div className="animate-content-fade-in">
            <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3">
              {toolbarButtons}
            </div>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[180px]">
                      <span className="flex items-center gap-2">
                        <Layers className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.name")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[200px]">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.companies")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px] text-right">
                      {t("table.headers.actions")}
                    </CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {data.data.map((structure, index) => (
                    <CHEKIOTableRow key={structure.publicId} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                        {structure.name}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {structure.companies.map((publicId: string) => {
                            const company = companies?.data.find(
                              (company: { publicId: string; businessName: string }) =>
                                company.publicId === publicId,
                            );
                            return (
                              <span
                                key={publicId}
                                className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                              >
                                {company?.businessName || "-"}
                              </span>
                            );
                          })}
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          {canUpdate(
                            OrganizationPermissionCode.STRUCTURE_MAINTENANCE,
                          ) && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenModal(structure)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                title={t("buttons.edit")}
                                aria-label={t("ariaLabels.editStructure")}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/mantainers/structures/${structure.publicId}`,
                                  )
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                                title={t("buttons.manageStructure")}
                                aria-label={t("ariaLabels.manageStructure")}
                              >
                                <Layers className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {canDelete(
                            OrganizationPermissionCode.STRUCTURE_MAINTENANCE,
                          ) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenDeleteModal(structure.publicId)
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                              title={t("buttons.delete")}
                              aria-label={t("ariaLabels.deleteStructure")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>

            <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: data.data.length,
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
                  variant={ButtonVariant.SECONDARY_BLUE}
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
                  variant={ButtonVariant.SECONDARY_BLUE}
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current >= pagination.totalPages}
                >
                  {t("pagination.next")}
                  <ChevronRight className="h-4 w-4" />
                </CHEKIOButton>
              </div>
            </div>
          </div>
        )}
      </div>
      {isModalOpen && (
        <StructureModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingStructure={editingStructure}
          onSuccess={() => refetch()}
          companyOptions={companyOptions}
          initialCompanyPublicId={companyId}
        />
      )}
      <ModalDelete
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={() => {
          if (deletingStructureId) {
            return handleDelete(deletingStructureId);
          }
          return Promise.resolve();
        }}
        message={t("delete.message")}
      />
    </>
  );
}

export default function StructurePage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.STRUCTURE_MAINTENANCE
      }
    >
      <StructureContent />
    </AccessNotGranted>
  );
}
