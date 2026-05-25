"use client";

import {
  DocumentType,
  DocumentTypeOptions,
} from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import {
  CHEKIOActionButton,
  CHEKIOButton,
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
import { CheckIOCheckbox } from "@/components/ui/checkio-checkbox";
import { useCookieSession } from "@/context/useCookieSession";
import { PaginationFilterDto } from "@/dto/pagination";
import { useToast } from "@/hooks/use-toast";
import { useGetBranches, useGetJobs } from "@/service/mantainer.service";
import {
  useDeleteReportTemplate,
  useGenerateReport,
  useGetReportTemplates,
} from "@/service/report-template.service";
import { handleError } from "@/utils/error";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  FileText,
  Filter,
  Loader2,
  PlusCircle,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReportTemplateFindFilterDto,
  ReportTemplateResponseDto,
} from "./_components/report-template.dto";

function ReportsContent() {
  const t = useTranslations("reports.manager");
  const { toast } = useToast();
  const router = useRouter();
  const { companyId, canCreate, canRead, canUpdate, canDelete } = useCookieSession();
  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "desc" as "asc" | "desc",
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Filtros para buscar en la tabla
  const [searchName, setSearchName] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Filtros para generar reporte
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [generatingTemplateId, setGeneratingTemplateId] = useState<
    string | null
  >(null);
  const [datePeriod, setDatePeriod] = useState<
    | "today"
    | "yesterday"
    | "last7days"
    | "last30days"
    | "thisMonth"
    | "lastMonth"
    | "custom"
  >("last7days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [documentFilters, setDocumentFilters] = useState<
    Array<{ documentType: DocumentType; documentNumber: string }>
  >([]);
  const [newDocumentType, setNewDocumentType] = useState<DocumentType>(
    DocumentType.RUT
  );
  const [newDocumentNumber, setNewDocumentNumber] = useState<string>("");


  const { mutate: deleteTemplate, isPending: isDeletingTemplate } =
    useDeleteReportTemplate();

  const { mutate: generateReport, isPending: isGeneratingReport } =
    useGenerateReport();

  const { data: jobsData, isLoading: isLoadingJobs } = useGetJobs(
    {
      page: 1,
      pageSize: 1000,
      sort: "asc",
      companyId: companyId || undefined,
    },
    { enabled: isGenerateModalOpen && !!companyId }
  );

  const { data: branchesData, isLoading: isLoadingBranches } = useGetBranches({
    page: 1,
    pageSize: 1000,
    sort: "asc",
    companyId: companyId || undefined,
  });

  const [isJobsDropdownOpen, setIsJobsDropdownOpen] = useState(false);
  const [isBranchesDropdownOpen, setIsBranchesDropdownOpen] = useState(false);
  const jobsDropdownRef = useRef<HTMLDivElement>(null);
  const branchesDropdownRef = useRef<HTMLDivElement>(null);

  const filterParams: ReportTemplateFindFilterDto = {
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
  };

  const { data, isLoading, refetch } = useGetReportTemplates(filterParams);

  useEffect(() => {
    if (refetchTrigger > 0) {
      refetch();
    }
  }, [refetchTrigger, refetch]);

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
      current: 1,
    }));
  }, []);

  const handleOpenBuilder = () => {
    router.push("/reports/manager/create");
  };

  const handleEdit = (id: string) => {
    router.push(`/reports/manager/create?id=${id}`);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingTemplateId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingTemplate) {
      setIsDeleteModalOpen(false);
      setDeletingTemplateId(null);
      setDeleteError(null);
    }
  };

  const handleOpenGenerateModal = (id: string) => {
    setGeneratingTemplateId(id);
    setIsGenerateModalOpen(true);
    // Resetear filtros al abrir
    setDatePeriod("last7days");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedJobs([]);
    setSelectedBranches([]);
    setDocumentFilters([]);
    setNewDocumentType(DocumentType.RUT);
    setNewDocumentNumber("");
  };

  const handleCloseGenerateModal = () => {
    if (!isGeneratingReport) {
      setIsGenerateModalOpen(false);
      setGeneratingTemplateId(null);
    }
  };

  useEffect(() => {
    if (!isGenerateModalOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        jobsDropdownRef.current &&
        !jobsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsJobsDropdownOpen(false);
      }
      if (
        branchesDropdownRef.current &&
        !branchesDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBranchesDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isGenerateModalOpen]);

  const handleGenerateReport = () => {
    if (!generatingTemplateId) return;

    const filters: {
      startDate?: string;
      endDate?: string;
      jobIds?: string[];
      branchIds?: string[];
      documentNumbers?: string[];
      companyId?: number | string;
      days?: Array<{ format: "numeric" | "text"; value: string }>;
      months?: Array<{ format: "numeric" | "text"; value: string }>;
      years?: string[];
    } = {};

    if (datePeriod === "custom") {
      if (customStartDate && customEndDate) {
        filters.startDate = customStartDate;
        filters.endDate = customEndDate;
      }
    } else {
      const now = DateTime.now();
      let startDate: DateTime;
      let endDate: DateTime = now;
      
      switch (datePeriod) {
        case "today":
          startDate = now.startOf("day");
          endDate = now.endOf("day");
          break;
        case "yesterday":
          startDate = now.minus({ days: 1 }).startOf("day");
          endDate = now.minus({ days: 1 }).endOf("day");
          break;
        case "last7days":
          startDate = now.minus({ days: 6 }).startOf("day");
          endDate = now.endOf("day");
          break;
        case "last30days":
          startDate = now.minus({ days: 30 }).startOf("day");
          endDate = now.endOf("day");
          break;
        case "thisMonth":
          startDate = now.startOf("month");
          endDate = now.endOf("day");
          break;
        case "lastMonth":
          startDate = now.minus({ months: 1 }).startOf("month");
          endDate = now.minus({ months: 1 }).endOf("month");
          break;
        default:
          startDate = now.minus({ days: 7 }).startOf("day");
          endDate = now.endOf("day");
      }
      filters.startDate = startDate.toISODate() ?? undefined;
      filters.endDate = endDate.toISODate() ?? undefined;
    }

    if (selectedJobs.length > 0) {
      filters.jobIds = selectedJobs;
    }
    if (selectedBranches.length > 0) {
      filters.branchIds = selectedBranches;
    }

    if (documentFilters.length > 0) {
      filters.documentNumbers = documentFilters.map(
        (doc) => `${doc.documentType}:${doc.documentNumber}`
      );
    }


    generateReport(
      { id: generatingTemplateId, filters: { ...filters, companyId: companyId || undefined } },
      {
      onSuccess: () => {
        handleCloseGenerateModal();
        setIsSuccessModalOpen(true);
        setRefetchTrigger((prev) => prev + 1);
      },
      onError: (error: unknown) => {
        handleError(error, toast);
      },
      }
    );
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const toggleBranchSelection = (branchId: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  const handleSelectAllJobs = () => {
    const allJobIds = jobsData?.data?.map((job) => job.publicId) || [];
    if (selectedJobs.length === allJobIds.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(allJobIds);
    }
  };

  const handleSelectAllBranches = () => {
    const allBranchIds = branchesData?.data?.map((branch) => branch.publicId) || [];
    if (selectedBranches.length === allBranchIds.length) {
      setSelectedBranches([]);
    } else {
      setSelectedBranches(allBranchIds);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteError(null);
    deleteTemplate(id, {
      onSuccess: () => {
        toast({
          title: t("toast.templateDeleted.title"),
          description: t("toast.templateDeleted.description"),
          variant: "default",
        });
        handleCloseDeleteModal();
        setRefetchTrigger((prev) => prev + 1);
      },
      onError: (error: unknown) => {
        const apiError = error as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const errorMessage =
          apiError?.response?.data?.message ||
          apiError?.message ||
          t("toast.deleteError.description");
        setDeleteError(errorMessage);
        handleError(error, toast);
      },
    });
  };

  const getReportType = (template: ReportTemplateResponseDto): string => {
    if (template.reportType === "ASSISTANCE") {
      return t("reportTypes.ASSISTANCE");
    }
    if (template.reportType === "EMPLOYEE_DATA") {
      return t("reportTypes.EMPLOYEE_DATA");
    }
    return t("reportTypes.EMPLOYEE_DATA");
  };

  const filteredTemplates = (data?.data || []).filter((template) => {
    if (searchName.trim()) {
      const nameMatch = template.name
        ?.toLowerCase()
        .includes(searchName.toLowerCase());
      if (!nameMatch) return false;
    }

    if (filterType !== "all") {
      const templateType = getReportType(template);
      if (templateType !== filterType) return false;
    }

    return true;
  });

  const templates = filteredTemplates;

  const toolbarButtons = (
    <div className="flex flex-row gap-2">
      {canCreate(OrganizationPermissionCode.ATTENDANCE_REPORTS) && (
        <CHEKIOButton variant="primary" onClick={handleOpenBuilder}>
          <PlusCircle className="h-4 w-4" />
          {t("buttons.create")}
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
              {canCreate(OrganizationPermissionCode.ATTENDANCE_REPORTS) && (
                <div className="h-9 w-[140px] animate-pulse rounded-lg bg-gray-200" />
              )}
            </div>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>{t("table.headers.name")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.description")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.reportType")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.columns")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.createdAt")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.updatedAt")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.actions")}</CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {[...Array(10)].map((_, index) => (
                    <CHEKIOTableRow key={index} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-6 w-14 animate-pulse rounded-full bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="flex gap-2 justify-center">
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                        </div>
                      </CHEKIOTableCell>
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
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
            {canCreate(OrganizationPermissionCode.ATTENDANCE_REPORTS) && (
              <CHEKIOButton
                variant="primary"
                onClick={handleOpenBuilder}
                className="mt-6 gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                {t("buttons.create")}
              </CHEKIOButton>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3">
              {toolbarButtons}
            </div>
            {/* Filtros para buscar en la tabla */}
            <div className="border-b border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Search className="h-5 w-5 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">
                  {t("filters.search")}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    {t("filters.searchByName")}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <CHEKIOInput
                      type="text"
                      placeholder={t("filters.searchByNamePlaceholder")}
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className="pl-10 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    {t("filters.filterByType")}
                  </label>
                  <CHEKIOSelect
                    value={filterType}
                    onValueChange={(value) =>
                      setFilterType(value as string | "all")
                    }
                  >
                    <CHEKIOSelectTrigger>
                      <CHEKIOSelectValue />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      <CHEKIOSelectItem value="all">
                        {t("filters.allTypes")}
                      </CHEKIOSelectItem>
                      <CHEKIOSelectItem value={t("reportTypes.ASSISTANCE")}>
                        {t("reportTypes.ASSISTANCE")}
                      </CHEKIOSelectItem>
                      <CHEKIOSelectItem value={t("reportTypes.EMPLOYEE_DATA")}>
                        {t("reportTypes.EMPLOYEE_DATA")}
                      </CHEKIOSelectItem>
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
              <CHEKIOTableHeader>
                <tr>
                  <CHEKIOTableHead>{t("table.headers.name")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.description")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.reportType")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.columns")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.createdAt")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.updatedAt")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("table.headers.actions")}</CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {templates.map(
                    (template: ReportTemplateResponseDto, index: number) => {
                      const reportType = getReportType(template);
                      const getTypeColor = (type: string) => {
                        if (type === t("reportTypes.ASSISTANCE")) {
                          return "bg-blue-100 text-blue-800";
                        }
                        return "bg-gray-100 text-gray-800";
                      };

                      return (
                        <CHEKIOTableRow key={template.publicId} index={index}>
                          <CHEKIOTableCell className="font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              {template.name || t("table.noName")}
                            </div>
                          </CHEKIOTableCell>
                          <CHEKIOTableCell>
                            {template.description || t("table.notAvailable")}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                                reportType
                              )}`}
                            >
                              {reportType}
                            </span>
                          </CHEKIOTableCell>
                          <CHEKIOTableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {t("table.columnsCount", { count: template.columns?.length || 0 })}
                            </span>
                          </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {template.createdAt
                            ? DateTime.fromISO(
                                typeof template.createdAt === "string"
                                  ? template.createdAt
                                  : template.createdAt.toISOString()
                              ).toFormat("dd/MM/yyyy HH:mm:ss")
                            : "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {template.updatedAt
                            ? DateTime.fromISO(
                                typeof template.updatedAt === "string"
                                  ? template.updatedAt
                                  : template.updatedAt.toISOString()
                              ).toFormat("dd/MM/yyyy HH:mm:ss")
                            : "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <div className="flex flex-row gap-2 justify-center flex-wrap">
                            {canUpdate(OrganizationPermissionCode.ATTENDANCE_REPORTS) && (
                              <CHEKIOActionButton
                                variant="edit"
                                onClick={() => handleEdit(template.publicId)}
                                title={t("buttons.edit")}
                                className="h-auto w-auto px-3 py-1.5 gap-1.5"
                              >
                                <Edit className="h-4 w-4" />
                                <span>{t("buttons.edit")}</span>
                              </CHEKIOActionButton>
                            )}

                            {canRead(OrganizationPermissionCode.ATTENDANCE_REPORTS) && (
                              <CHEKIOActionButton
                                variant="view"
                                onClick={() =>
                                  handleOpenGenerateModal(template.publicId)
                                }
                                disabled={
                                  isGeneratingReport &&
                                  generatingTemplateId === template.publicId
                                }
                                title={t("buttons.generate")}
                                className="h-auto w-auto px-3 py-1.5 gap-1.5"
                              >
                                <FileText className="h-4 w-4" />
                                <span>{t("buttons.generate")}</span>
                              </CHEKIOActionButton>
                            )}

                            {canDelete(OrganizationPermissionCode.ATTENDANCE_REPORTS) && (
                              <CHEKIOActionButton
                                variant="delete"
                                onClick={() =>
                                  handleOpenDeleteModal(template.publicId)
                                }
                                title={t("buttons.delete")}
                                className="h-auto w-auto px-3 py-1.5 gap-1.5"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>{t("buttons.delete")}</span>
                              </CHEKIOActionButton>
                            )}
                          </div>
                        </CHEKIOTableCell>
                      </CHEKIOTableRow>
                      );
                    }
                  )}
              </CHEKIOTableBody>
            </CHEKIOTable>
            </div>

            {templates.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {t("pagination.showing", {
                      current: templates.length,
                      total: data?.data?.length || 0,
                    })}
                    {(searchName || filterType !== "all") && (
                      <span className="text-gray-500">
                        {" "}
                        {t("pagination.filteredFrom", { total: pagination.totalCount })}
                      </span>
                    )}
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
                    variant="secondaryBlue"
                    onClick={() => handlePageChange(pagination.current - 1)}
                    disabled={pagination.current === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("buttons.previous")}
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
                    {t("buttons.next")}
                    <ChevronRight className="h-4 w-4" />
                  </CHEKIOButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CHEKIOModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title={t("modals.delete.title")}
        size="md"
      >
        <div className="space-y-6">
          <p className="text-gray-700 flex items-center gap-3 text-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
            {t("modals.delete.message")}
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
              disabled={isDeletingTemplate}
            >
              <X className="h-4 w-4" />
              {t("buttons.cancel")}
            </CHEKIOButton>
            <CHEKIOButton
              variant="destructive"
              onClick={() => {
                if (deletingTemplateId) {
                  handleDelete(deletingTemplateId);
                }
              }}
              disabled={isDeletingTemplate}
            >
              {isDeletingTemplate ? (
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

      {/* Modal para filtros de generación de reporte */}
      <CHEKIOModal
        isOpen={isGenerateModalOpen}
        onClose={handleCloseGenerateModal}
        title={t("modals.generate.title")}
        size="lg"
      >
        <div className="space-y-6 max-h-[calc(95vh-200px)] overflow-y-auto pr-2 -mr-2">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <h4 className="text-sm font-semibold text-blue-900">
                {t("modals.generate.configureFilters")}
              </h4>
            </div>
            <p className="text-xs text-blue-700">
              {t("modals.generate.configureFiltersDescription")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Calendar className="h-4 w-4 inline mr-2" />
              {t("modals.generate.datePeriod")}
            </label>
            <div className="space-y-3">
              <CHEKIOSelect
                value={datePeriod}
                onValueChange={(value) =>
                  setDatePeriod(
                    value as
                      | "today"
                      | "yesterday"
                      | "last7days"
                      | "last30days"
                      | "thisMonth"
                      | "lastMonth"
                      | "custom"
                  )
                }
              >
                <CHEKIOSelectTrigger>
                  <CHEKIOSelectValue />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  <CHEKIOSelectItem value="today">{t("modals.generate.today")}</CHEKIOSelectItem>
                  <CHEKIOSelectItem value="yesterday">{t("modals.generate.yesterday")}</CHEKIOSelectItem>
                  <CHEKIOSelectItem value="last7days">
                    {t("modals.generate.last7days")}
                  </CHEKIOSelectItem>
                  <CHEKIOSelectItem value="last30days">
                    {t("modals.generate.last30days")}
                  </CHEKIOSelectItem>
                  <CHEKIOSelectItem value="thisMonth">{t("modals.generate.thisMonth")}</CHEKIOSelectItem>
                  <CHEKIOSelectItem value="lastMonth">
                    {t("modals.generate.lastMonth")}
                  </CHEKIOSelectItem>
                  <CHEKIOSelectItem value="custom">
                    {t("modals.generate.custom")}
                  </CHEKIOSelectItem>
                </CHEKIOSelectContent>
              </CHEKIOSelect>

              {datePeriod === "custom" && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t("modals.generate.startDate")}
                    </label>
                    <CHEKIOInput
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t("modals.generate.endDate")}
                    </label>
                    <CHEKIOInput
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("modals.generate.filterByJobs")}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              {t("modals.generate.filterByJobsDescription")}
            </p>
            <div className="relative" ref={jobsDropdownRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsJobsDropdownOpen(!isJobsDropdownOpen);
                }}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 bg-white text-left rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span className="text-sm text-gray-700">
                  {selectedJobs.length === 0
                    ? t("modals.generate.selectJobs")
                    : t("modals.generate.jobsSelected", { count: selectedJobs.length })}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
              {isJobsDropdownOpen && (
                <div
                  className="absolute z-[100] w-full bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxHeight: "240px" }}
                >
                  <div className="p-2 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAllJobs();
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {selectedJobs.length === jobsData?.data?.length
                        ? t("modals.generate.deselectAllJobs")
                        : t("modals.generate.selectAllJobs")}
                    </button>
                  </div>
                  <div className="p-2">
                    {isLoadingJobs ? (
                      <p className="text-sm text-gray-500 py-2">
                        {t("modals.generate.loadingJobs")}
                      </p>
                    ) : jobsData?.data?.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">
                        {t("modals.generate.noJobsAvailable")}
                      </p>
                    ) : (
                      jobsData?.data?.map((job) => (
                        <label
                          key={job.publicId}
                          className="flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-gray-50"
                        >
                          <CheckIOCheckbox
                            checked={selectedJobs.includes(job.publicId)}
                            onCheckedChange={() => {
                              toggleJobSelection(job.publicId);
                            }}
                          />
                          <span className="text-sm text-gray-700">
                            {job.name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {selectedJobs.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedJobs.map((jobId) => {
                  const job = jobsData?.data?.find((j) => j.publicId === jobId);
                  return job ? (
                    <span
                      key={jobId}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {job.name}
                      <button
                        type="button"
                        onClick={() => toggleJobSelection(jobId)}
                        className="ml-1 hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("modals.generate.filterByBranches")}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              {t("modals.generate.filterByBranchesDescription")}
            </p>
            <div className="relative" ref={branchesDropdownRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBranchesDropdownOpen(!isBranchesDropdownOpen);
                }}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 bg-white text-left rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span className="text-sm text-gray-700">
                  {selectedBranches.length === 0
                    ? t("modals.generate.selectBranches")
                    : t("modals.generate.branchesSelected", { count: selectedBranches.length })}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
              {isBranchesDropdownOpen && (
                <div
                  className="absolute z-[100] w-full bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxHeight: "240px" }}
                >
                  <div className="p-2 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAllBranches();
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {selectedBranches.length === branchesData?.data?.length
                        ? t("modals.generate.deselectAllBranches")
                        : t("modals.generate.selectAllBranches")}
                    </button>
                  </div>
                  <div className="p-2">
                    {isLoadingBranches ? (
                      <p className="text-sm text-gray-500 py-2">
                        {t("modals.generate.loadingBranches")}
                      </p>
                    ) : branchesData?.data?.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">
                        {t("modals.generate.noBranchesAvailable")}
                      </p>
                    ) : (
                      branchesData?.data?.map((branch) => (
                        <label
                          key={branch.publicId}
                          className="flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-gray-50"
                        >
                          <CheckIOCheckbox
                            checked={selectedBranches.includes(branch.publicId)}
                            onCheckedChange={() => {
                              toggleBranchSelection(branch.publicId);
                            }}
                          />
                          <span className="text-sm text-gray-700">
                            {branch.name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {selectedBranches.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedBranches.map((branchId) => {
                  const branch = branchesData?.data?.find(
                    (b) => b.publicId === branchId
                  );
                  return branch ? (
                    <span
                      key={branchId}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {branch.name}
                      <button
                        type="button"
                        onClick={() => toggleBranchSelection(branchId)}
                        className="ml-1 hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("modals.generate.filterByDocument")}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              {t("modals.generate.filterByDocumentDescription")}
            </p>
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <CHEKIOSelect
                  value={newDocumentType}
                  onValueChange={(value) =>
                    setNewDocumentType(value as DocumentType)
                  }
                >
                  <CHEKIOSelectTrigger>
                    <CHEKIOSelectValue />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    {DocumentTypeOptions.map((option) => (
                      <CHEKIOSelectItem key={option.value} value={option.value}>
                        {option.label}
                      </CHEKIOSelectItem>
                    ))}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              </div>
              <div className="flex-1">
                <CHEKIOInput
                  type="text"
                  placeholder={t("modals.generate.documentPlaceholder")}
                  value={newDocumentNumber}
                  onChange={(e) => setNewDocumentNumber(e.target.value)}
                  className="rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newDocumentNumber.trim()) {
                      e.preventDefault();
                      setDocumentFilters([
                        ...documentFilters,
                        {
                          documentType: newDocumentType,
                          documentNumber: newDocumentNumber.trim(),
                        },
                      ]);
                      setNewDocumentNumber("");
                      setNewDocumentType(DocumentType.RUT);
                    }
                  }}
                />
              </div>
              <CHEKIOButton
                type="button"
                variant="primary"
                onClick={() => {
                  if (newDocumentNumber.trim()) {
                    setDocumentFilters([
                      ...documentFilters,
                      {
                        documentType: newDocumentType,
                        documentNumber: newDocumentNumber.trim(),
                      },
                    ]);
                    setNewDocumentNumber("");
                    setNewDocumentType(DocumentType.RUT);
                  }
                }}
                disabled={!newDocumentNumber.trim()}
              >
                {t("buttons.add")}
              </CHEKIOButton>
            </div>
            {documentFilters.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {documentFilters.map((doc, index) => {
                  const docTypeLabel =
                    DocumentTypeOptions.find((opt) => opt.value === doc.documentType)
                      ?.label || doc.documentType;
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      <span className="font-medium mr-1">{docTypeLabel}:</span>
                      {doc.documentNumber}
                      <button
                        type="button"
                        onClick={() => {
                          setDocumentFilters(
                            documentFilters.filter((_, i) => i !== index)
                          );
                        }}
                        className="ml-1 hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <CHEKIOButton
              variant="secondary"
              onClick={handleCloseGenerateModal}
              disabled={isGeneratingReport}
            >
              <X className="h-4 w-4" />
              {t("buttons.cancel")}
            </CHEKIOButton>
            <CHEKIOButton
              variant="primary"
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("buttons.generating")}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  {t("modals.generate.generateReport")}
                </>
              )}
            </CHEKIOButton>
          </div>
        </div>
      </CHEKIOModal>

      {/* Modal de éxito al generar reporte */}
      <CHEKIOModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title=""
        size="md"
      >
        <div className="space-y-6">
          {/* Icono de éxito animado */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-green-500 rounded-full p-6">
                <CheckCircle2 className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

          <div className="text-center space-y-3">
            <h3 className="text-2xl font-bold text-gray-900">
              {t("modals.success.title")}
            </h3>
            <p className="text-gray-600">
              {t("modals.success.message")}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    {t("modals.success.whatsNext")}
                  </p>
                  <p className="text-xs text-blue-700">
                    {t("modals.success.whatsNextDescription")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t">
            <CHEKIOButton
              variant="primary"
              onClick={() => {
                setIsSuccessModalOpen(false);
                router.push("/reports/history");
              }}
              className="w-full"
            >
              <Download className="h-4 w-4" />
              {t("buttons.goToHistory")}
              <ArrowRight className="h-4 w-4" />
            </CHEKIOButton>
            <CHEKIOButton
              variant="secondary"
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full"
            >
              {t("buttons.close")}
            </CHEKIOButton>
          </div>
        </div>
      </CHEKIOModal>
    </>
  );
}

export default function ReportsPage() {
  return <ReportsContent />;
}
