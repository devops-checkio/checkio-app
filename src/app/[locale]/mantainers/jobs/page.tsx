"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import ModalDelete from "@/app/[locale]/_components/modal-delete";
import {
  CHEKIOButton,
  CHEKIOHeader,
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
import { useJobsTour } from "@/hooks/useJobsTour";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteJob,
  useGetCompaniesSelector,
  useGetJobs,
} from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  Building2,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Hash,
  HelpCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import JobModalMasive from "./_components/job-modal-masive";
import JobModalUpsert from "./_components/job-modal-upsert";
import { JobResponseDto, JobSortBy } from "./_components/job.dto";

function JobsContent() {
  const t = useTranslations("mantainers.jobs");
  const { startTour } = useJobsTour();
  const { toast } = useToast();
  const { companyId, canCreate, canUpdate, canDelete, canRead, getTemplateUser } =
    useCookieSession();
  const templateUser = getTemplateUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobResponseDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [isModalMasiveOpen, setIsModalMasiveOpen] = useState(false);
  const [searchParams, setSearchParams] = useState<{
    search?: string;
  }>({});

  const { register, handleSubmit } = useForm({
    defaultValues: {
      search: "",
    },
  });

  const { data: companiesData, isLoading: isLoadingCompanies } =
    useGetCompaniesSelector({
      page: 1,
      pageSize: 100,
      sort: "asc",
    });

  const { mutate: deleteJob, isPending: isDeletingJob } = useDeleteJob();

  const handleOpenModal = (job?: JobResponseDto) => {
    if (job) {
      setEditingJob(job);
    } else {
      setEditingJob(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleOpenDeleteModal = (publicId: string) => {
    setDeletingJobId(publicId);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingJobId(null);
  };

  const handleOpenModalMasive = () => {
    setIsModalMasiveOpen(true);
  };

  const handleCloseModalMasive = () => {
    setIsModalMasiveOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteJob(id, {
      onSuccess: () => {
        toast({
          title: t("delete.success"),
          variant: "default",
        });
        refetch();
      },
      onError: (error: any) => {
        handleError(error, toast);
      },
      onSettled: () => {
        handleCloseDeleteModal();
      },
    });
  };

  const handleRefetch = () => {
    refetch();
  };

  const onSubmitSearch = (data: { search: string }) => {
    setSearchParams({
      search: data.search || undefined,
    });
    setPage(1);
  };

  const JOB_COLUMNS_EXCEL: HeaderMapping[] = [
    {
      attribute: "code",
      header: t("excel.headers.code"),
    },
    {
      attribute: "name",
      header: t("excel.headers.name"),
    },
    {
      attribute: "description",
      header: t("excel.headers.description"),
    },
    {
      attribute: "companies",
      header: t("excel.headers.companies"),
      render: (companies: string[]) => {
        const companyNames = companies
          .map((companyId: string) => {
            const company = companiesData?.data.find(
              (company: any) => company.publicId === companyId,
            );
            return company?.businessName || "-";
          })
          .filter((name: string) => name !== "-");
        return companyNames.length > 0 ? companyNames.join(", ") : "-";
      },
    },
    {
      attribute: "createdAt",
      header: t("excel.headers.createdAt"),
      render: (createdAt: string) =>
        DateTime.fromISO(createdAt).toFormat("dd/MM/yyyy"),
    },
  ];

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<JobSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const {
    data: jobsData,
    isLoading,
    refetch,
  } = useGetJobs(
    {
      page,
      pageSize,
      sortBy,
      sortOrder,
      companyId: companyId ?? undefined,
      ...searchParams,
    },
    { enabled: !!companyId }
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const handleSort = useCallback(
    (column: JobSortBy) => {
      if (sortBy === column) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(column);
        setSortOrder("asc");
      }
      setPage(1);
    },
    [sortBy]
  );

  const jobs = jobsData?.data || [];
  const canShowTour = isLoading || jobs.length > 0;
  const pagination = jobsData?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const companyOptions =
    companiesData?.data.map((company) => ({
      value: company.publicId,
      label: company.businessName,
      key: company.publicId,
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
        {canCreate(OrganizationPermissionCode.JOB_MAINTENANCE) && (
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
        {canRead(OrganizationPermissionCode.JOB_MAINTENANCE) && (
          <CHEKIOButton
            variant="approve"
            onClick={() =>
              generateExcel(
                jobs,
                JOB_COLUMNS_EXCEL,
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
    className,
  }: {
    column: JobSortBy;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    className?: string;
  }) => {
    const isActive = sortBy === column;
    return (
      <CHEKIOTableHead
        className={`${className ?? "min-w-[120px]"} cursor-pointer select-none`}
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
          t("breadcrumbs.jobs"),
        ]}
        actions={
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={startTour}
            disabled={!canShowTour}
            title={!canShowTour ? t("table.noDataDescription") : undefined}
          >
            <HelpCircle className="h-4 w-4" />
            {t("tour.startButton")}
          </CHEKIOButton>
        }
      />
      <div className="space-y-6">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {isLoading ? (
          <div className="animate-content-fade-in">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 px-5 py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-[220px] rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-32 rounded-md" />
                <Skeleton className="h-10 w-36 rounded-md" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[100px]">
                      {t("table.headers.code")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[160px]">
                      {t("table.headers.name")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[180px]">
                      {t("table.headers.description")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[160px]">
                      {t("table.headers.companies")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      {t("table.headers.createdAt")}
                    </CHEKIOTableHead>
                    {(canUpdate(OrganizationPermissionCode.JOB_MAINTENANCE) ||
                      canDelete(OrganizationPermissionCode.JOB_MAINTENANCE) ||
                      canRead(OrganizationPermissionCode.JOB_MAINTENANCE)) && (
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <CHEKIOTableRow key={index} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-4 w-16 rounded font-mono" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-4 w-32 rounded" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-4 w-48 rounded" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          <Skeleton className="h-6 w-20 rounded-md" />
                          <Skeleton className="h-6 w-24 rounded-md" />
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-4 w-20 rounded" />
                      </CHEKIOTableCell>
                      {(canUpdate(OrganizationPermissionCode.JOB_MAINTENANCE) ||
                        canDelete(OrganizationPermissionCode.JOB_MAINTENANCE) ||
                        canRead(OrganizationPermissionCode.JOB_MAINTENANCE)) && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
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
        ) : jobs.length === 0 ? (
          <div className="animate-content-fade-in flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <Briefcase className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
            {canCreate(OrganizationPermissionCode.JOB_MAINTENANCE) && (
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
          <div className="animate-content-fade-in">
            <div
              className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 px-5 py-3"
              data-tour="jobs-toolbar"
            >
              {toolbarContent}
            </div>
            <div className="overflow-x-auto" data-tour="jobs-table">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <SortableHead
                      column="code"
                      label={t("table.headers.code")}
                      icon={Hash}
                      className="min-w-[100px]"
                    />
                    <SortableHead
                      column="name"
                      label={t("table.headers.name")}
                      icon={Briefcase}
                      className="min-w-[160px]"
                    />
                    <SortableHead
                      column="description"
                      label={t("table.headers.description")}
                      icon={FileText}
                      className="min-w-[180px]"
                    />
                    <CHEKIOTableHead className="min-w-[160px]">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.companies")}
                      </span>
                    </CHEKIOTableHead>
                    <SortableHead
                      column="createdAt"
                      label={t("table.headers.createdAt")}
                      icon={CalendarPlus}
                    />
                    {(canUpdate(OrganizationPermissionCode.JOB_MAINTENANCE) ||
                      canDelete(OrganizationPermissionCode.JOB_MAINTENANCE) ||
                      canRead(OrganizationPermissionCode.JOB_MAINTENANCE)) && (
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {jobs.map((job, index) => (
                    <CHEKIOTableRow key={job.publicId} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5 font-mono text-sm text-gray-600">
                        {job.code}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                        {job.name}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {job.description || "-"}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {job.companies.map((publicId: string) => {
                            const company = companiesData?.data.find(
                              (company: any) => company.publicId === publicId,
                            );
                            return (
                              <span
                                key={publicId}
                                className="inline-flex items-center rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                              >
                                {company?.businessName || "-"}
                              </span>
                            );
                          })}
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {DateTime.fromISO(
                          typeof job.createdAt === "string"
                            ? job.createdAt
                            : job.createdAt.toISOString(),
                        ).toFormat("dd/MM/yyyy")}
                      </CHEKIOTableCell>
                      {(canUpdate(OrganizationPermissionCode.JOB_MAINTENANCE) ||
                        canDelete(
                          OrganizationPermissionCode.JOB_MAINTENANCE,
                        )) && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate(
                              OrganizationPermissionCode.JOB_MAINTENANCE,
                            ) && (
                              <button
                                type="button"
                                onClick={() => handleOpenModal(job)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                title={t("buttons.edit")}
                                aria-label={t("ariaLabels.editJob")}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete(
                              OrganizationPermissionCode.JOB_MAINTENANCE,
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDeleteModal(job.publicId)
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                title={t("buttons.delete")}
                                aria-label={t("ariaLabels.deleteJob")}
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
              data-tour="jobs-pagination"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: jobs.length,
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
          </div>
        )}
        </div>

        {isModalOpen && (
        <JobModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingJob={editingJob}
          onSuccess={handleRefetch}
          companyOptions={companyOptions}
        />
      )}
      {isDeleteModalOpen && (
        <ModalDelete
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onDelete={() => {
            if (deletingJobId) {
              return handleDelete(deletingJobId);
            }
            return Promise.resolve();
          }}
          message={t("delete.message")}
        />
      )}
      {isModalMasiveOpen && (
        <JobModalMasive
          isOpen={isModalMasiveOpen}
          onClose={handleCloseModalMasive}
          onSuccess={handleRefetch}
          companyOptions={companyOptions}
        />
      )}
      </div>
    </>
  );
}

export default function JobsPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.JOB_MAINTENANCE}
    >
      <JobsContent />
    </AccessNotGranted>
  );
}
