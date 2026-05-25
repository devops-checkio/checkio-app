"use client";

import { EmployeeResponseDto } from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import OrganizationSelector from "@/app/[locale]/mantainers/employees/_components/organization-selector";
import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOLoading,
  CHEKIOModal,
  CHEKIOProgressBar,
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
import SystemDatePicker from "@/components/ui/system-date-picker";
import SystemInput from "@/components/ui/system-input";
import { useCookieSession } from "@/context/useCookieSession";
import { PaginationFilterDto } from "@/dto/pagination";
import { useToast } from "@/hooks/use-toast";
import {
  useGetBranches,
  useGetEmployees,
  useGetJobs,
} from "@/service/mantainer.service";
import {
  useCreateOvertimeRequest,
  useGetPresignedUploadUrl,
} from "@/service/overtime-request.service";
import { getApiErrorMessage } from "@/utils/api-error-message";
import {
  Building2,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Hash,
  Info,
  Loader2,
  Mail,
  Maximize2,
  RotateCcw,
  Search,
  Upload as UploadIcon,
  User,
  Users,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  combineLocalDateAndTimeToUtcIso,
  isScheduleEndAfterStart,
  perHoursApplicationStartUtcIso,
  splitIsoToLocalDateAndTime,
} from "./overtime-request-datetime";
import {
  OvertimeRequestCreateDto,
  OvertimeRequestResponseDto,
  OvertimeRequestType,
} from "./overtime-request.dto";

enum ProcessingItemStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCESS = "success",
  ERROR = "error",
}

interface EmployeeProcessingItem {
  id: string;
  employeeId: string;
  employeeName: string;
  documentNumber: string;
  status: ProcessingItemStatus;
  error?: string;
}

interface OvertimeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  request?: OvertimeRequestResponseDto;
  mode?: "create" | "view" | "edit";
}

interface OvertimeRequestFormData {
  type: OvertimeRequestType;
  observation?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  /** HH:mm — PER_SCHEDULE inicio / fin */
  startTime?: string;
  endTime?: string;
  aditionHoursBeforeMinutes?: number;
  aditionHoursAfterMinutes?: number;
  documentUrl?: string;
}

interface OvertimeSearchFormData {
  search: string;
  documentNumber: string;
  jobId?: string;
  branchId?: string;
  organizationId?: string;
}

const OvertimeRequestModal = ({
  isOpen,
  onClose,
  onSuccess,
  request,
  mode = "create",
}: OvertimeRequestModalProps) => {
  const t = useTranslations("operations.requests.overtime.modal");
  const tBatch = useTranslations("operations.absences.batchAssignment");
  const { toast } = useToast();
  const { companyId, getTemplateUser } = useCookieSession();
  const templatePrimary = getTemplateUser().primary;
  const createOvertimeRequest = useCreateOvertimeRequest();
  const { mutateAsync: getPresignedUploadUrl } = useGetPresignedUploadUrl();

  const [isEmployeeSelectVisible, setIsEmployeeSelectVisible] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState<
    EmployeeResponseDto[]
  >([]);
  const [processingItems, setProcessingItems] = useState<
    EmployeeProcessingItem[]
  >([]);
  const [isPending, setIsPending] = useState(false);
  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "desc" as "asc" | "desc",
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [presignedViewUrl, setPresignedViewUrl] = useState<string | null>(null);
  const [isLoadingPresignedUrl, setIsLoadingPresignedUrl] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const {
    handleSubmit: handleSearchSubmit,
    watch,
    setValue,
    control,
    reset: resetSearch,
  } = useForm<OvertimeSearchFormData>({
    defaultValues: {
      search: "",
      documentNumber: "",
      jobId: undefined,
      branchId: undefined,
      organizationId: undefined,
    },
  });

  const {
    control: requestControl,
    handleSubmit: handleRequestSubmit,
    reset: resetRequest,
    formState: { errors },
    setValue: setRequestValue,
    watch: watchRequest,
  } = useForm<OvertimeRequestFormData>({
    defaultValues: {
      type: OvertimeRequestType.PER_SCHEDULE,
      observation: "",
      startDate: undefined,
      endDate: undefined,
      startTime: "",
      endTime: "",
      aditionHoursBeforeMinutes: undefined,
      aditionHoursAfterMinutes: undefined,
      documentUrl: undefined,
    },
  });

  const selectedType = watchRequest("type");

  const { data: jobs } = useGetJobs({
    page: 1,
    pageSize: 200,
    sort: "asc",
  });

  const { data: branches } = useGetBranches({
    page: 1,
    pageSize: 200,
    sort: "asc",
  });

  const branchId = watch("branchId");
  const jobId = watch("jobId");
  const documentNumber = watch("documentNumber");
  const search = watch("search");

  const { data: employeesData, isLoading: isLoadingEmployees } =
    useGetEmployees({
      page: pagination.current,
      pageSize: pagination.pageSize,
      sort: pagination.sort,
      search: watch("search"),
      companyId: companyId || "",
      status: "active",
      documentNumber: watch("documentNumber"),
      jobId: watch("jobId"),
      branchId: watch("branchId"),
    });

  useEffect(() => {
    if (employeesData?.pagination) {
      setPagination(employeesData.pagination);
    }
  }, [employeesData]);

  useEffect(() => {
    if (isOpen) {
      if (request && (mode === "view" || mode === "edit")) {
        setIsEmployeeSelectVisible(false);
        const startParts = request.startDate
          ? splitIsoToLocalDateAndTime(request.startDate)
          : { date: "", time: "00:00" };
        const endParts = request.endDate
          ? splitIsoToLocalDateAndTime(request.endDate)
          : { date: "", time: "00:00" };
        resetRequest({
          type: request.type,
          observation: request.observation || "",
          startDate: startParts.date || undefined,
          endDate:
            request.type === OvertimeRequestType.PER_SCHEDULE
              ? endParts.date || undefined
              : undefined,
          startTime:
            request.type === OvertimeRequestType.PER_SCHEDULE
              ? startParts.time
              : "",
          endTime:
            request.type === OvertimeRequestType.PER_SCHEDULE
              ? endParts.time
              : "",
          aditionHoursBeforeMinutes: request.aditionHoursBeforeMinutes,
          aditionHoursAfterMinutes: request.aditionHoursAfterMinutes,
          documentUrl: request.documentUrl,
        });
      } else {
        setIsEmployeeSelectVisible(true);
        resetRequest({
          type: OvertimeRequestType.PER_SCHEDULE,
          observation: "",
          startDate: undefined,
          endDate: undefined,
          startTime: "",
          endTime: "",
          aditionHoursBeforeMinutes: undefined,
          aditionHoursAfterMinutes: undefined,
          documentUrl: undefined,
        });
      }
    }
  }, [isOpen, request, mode, resetRequest]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, current: page }));
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

  const handleClearSearch = () => {
    resetSearch();
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleClose = () => {
    if (isPending) return;
    resetSearch();
    resetRequest();
    setSelectedEmployees([]);
    setProcessingItems([]);
    setIsEmployeeSelectVisible(true);
    setIsPending(false);
    setPagination({
      current: 1,
      pageSize: 10,
      next: null,
      previous: null,
      totalPages: 1,
      totalCount: 0,
      sort: "desc" as "asc" | "desc",
    });
    setDocumentFile(null);
    setPresignedViewUrl(null);
    setIsLoadingPresignedUrl(false);
    setIsFullscreen(false);
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    onClose();
  };

  const handleContinue = () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: tBatch("toast.selectEmployeeError.title"),
        description: tBatch("toast.selectEmployeeError.description"),
        variant: "destructive",
      });
      return;
    }
    setIsEmployeeSelectVisible(false);
  };

  const handleBackToEmployeeSelect = () => {
    setIsEmployeeSelectVisible(true);
  };

  const handleEmployeeSelection = (employeeId: string, selected: boolean) => {
    if (selected) {
      const employee = employeesData?.data.find(
        (e) => e.publicId === employeeId,
      );
      if (employee) {
        setSelectedEmployees((prev) => [...prev, employee]);
      }
    } else {
      setSelectedEmployees((prev) =>
        prev.filter((e) => e.publicId !== employeeId),
      );
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedEmployees(employeesData?.data || []);
    } else {
      setSelectedEmployees([]);
    }
  };

  const generateDocumentKey = (fileName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = fileName.split(".").pop() || "pdf";
    return `overtime-requests/documents/${timestamp}-${random}.${extension}`;
  };

  const uploadFileToS3 = async (
    file: File,
    presignedUrl: string,
  ): Promise<void> => {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });
    if (!response.ok) {
      throw new Error(`Error al subir el archivo: ${response.statusText}`);
    }
  };

  const onSubmit: SubmitHandler<OvertimeRequestFormData> = async (data) => {
    if (mode === "view") return;

    if (mode === "create" && selectedEmployees.length === 0) {
      toast({
        title: tBatch("toast.selectEmployeeError.title"),
        description: tBatch("toast.selectEmployeeError.description"),
        variant: "destructive",
      });
      return;
    }

    if (data.type === OvertimeRequestType.PER_SCHEDULE) {
      if (!data.startDate || !data.endDate) {
        toast({
          title: t("validation.errors.dateRequired.title"),
          description: t("validation.errors.dateRequired.description"),
          variant: "destructive",
        });
        return;
      }
      if (!data.startTime?.trim() || !data.endTime?.trim()) {
        toast({
          title: t("validation.errors.timeRequired.title"),
          description: t("validation.errors.timeRequired.description"),
          variant: "destructive",
        });
        return;
      }
      const startIso = combineLocalDateAndTimeToUtcIso(
        data.startDate as string,
        data.startTime,
      );
      const endIso = combineLocalDateAndTimeToUtcIso(
        data.endDate as string,
        data.endTime,
      );
      if (!startIso || !endIso || !isScheduleEndAfterStart(startIso, endIso)) {
        toast({
          title: t("validation.errors.invalidRange.title"),
          description: t("validation.errors.invalidRange.description"),
          variant: "destructive",
        });
        return;
      }
    } else if (data.type === OvertimeRequestType.PER_HOURS) {
      if (!data.startDate) {
        toast({
          title: t("validation.errors.applicationDateRequired.title"),
          description: t(
            "validation.errors.applicationDateRequired.description",
          ),
          variant: "destructive",
        });
        return;
      }
      const before = data.aditionHoursBeforeMinutes ?? 0;
      const after = data.aditionHoursAfterMinutes ?? 0;
      if (before <= 0 && after <= 0) {
        toast({
          title: t("validation.errors.hoursRequired.title"),
          description: t("validation.errors.hoursRequired.description"),
          variant: "destructive",
        });
        return;
      }
    }

    setIsPending(true);

    let documentKey: string | undefined;

    if (documentFile) {
      documentKey = generateDocumentKey(documentFile.name);
      try {
        const { url: presignedUrl } = await getPresignedUploadUrl(documentKey);
        await uploadFileToS3(documentFile, presignedUrl);
      } catch (uploadError: unknown) {
        const err = uploadError as { message?: string };
        toast({
          title: t("toast.uploadError.title"),
          description:
            (err?.message as string) || t("toast.uploadError.description"),
          variant: "destructive",
        });
        setIsPending(false);
        return;
      }
    }

    if (mode === "create") {
      setProcessingItems(
        selectedEmployees.map((employee) => ({
          id: `employee-${employee.publicId}`,
          employeeId: employee.publicId,
          employeeName: [
            employee.firstName,
            employee.lastName,
            employee.secondLastName,
          ]
            .filter(Boolean)
            .join(" "),
          documentNumber: employee.documentNumber,
          status: ProcessingItemStatus.PENDING,
        })),
      );

      let successCount = 0;
      let errorCount = 0;
      let firstErrorDetail: string | undefined;

      for (let i = 0; i < selectedEmployees.length; i++) {
        const employee = selectedEmployees[i];

        setProcessingItems((prev) =>
          prev.map((item, index) =>
            index === i
              ? { ...item, status: ProcessingItemStatus.PROCESSING }
              : item,
          ),
        );

        let startDatePayload: string | undefined;
        let endDatePayload: string | undefined;
        if (data.type === OvertimeRequestType.PER_SCHEDULE) {
          startDatePayload = combineLocalDateAndTimeToUtcIso(
            data.startDate as string,
            data.startTime,
          );
          endDatePayload = combineLocalDateAndTimeToUtcIso(
            data.endDate as string,
            data.endTime,
          );
        } else {
          startDatePayload = perHoursApplicationStartUtcIso(
            data.startDate as string,
          );
          endDatePayload = undefined;
        }

        const payload: OvertimeRequestCreateDto = {
          employeeAssignedId: employee.publicId,
          type: data.type,
          observation: data.observation,
          startDate: startDatePayload,
          endDate: endDatePayload,
          aditionHoursBeforeMinutes: data.aditionHoursBeforeMinutes,
          aditionHoursAfterMinutes: data.aditionHoursAfterMinutes,
          documentUrl: documentKey || data.documentUrl,
        };

        try {
          await createOvertimeRequest.mutateAsync(payload);
          setProcessingItems((prev) =>
            prev.map((item, index) =>
              index === i
                ? { ...item, status: ProcessingItemStatus.SUCCESS }
                : item,
            ),
          );
          successCount++;
        } catch (error: unknown) {
          const msg = getApiErrorMessage(error, t("toast.createError.unknown"));
          if (firstErrorDetail === undefined) {
            firstErrorDetail = msg;
          }
          setProcessingItems((prev) =>
            prev.map((item, index) =>
              index === i
                ? {
                    ...item,
                    status: ProcessingItemStatus.ERROR,
                    error: msg,
                  }
                : item,
            ),
          );
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast({
          title: t("toast.createSuccess.title"),
          description: t("toast.createSuccess.description"),
        });
      } else {
        const summary = t("toast.createError.description", {
          successCount,
          errorCount,
        });
        if (
          errorCount === 1 &&
          successCount === 0 &&
          firstErrorDetail !== undefined
        ) {
          toast({
            title: t("toast.createError.titleNoneCreated"),
            description: firstErrorDetail,
            variant: "destructive",
          });
        } else {
          toast({
            title: t("toast.createError.title"),
            description:
              firstErrorDetail !== undefined
                ? t("toast.createError.descriptionWithDetail", {
                    summary,
                    detail: firstErrorDetail,
                  })
                : summary,
            variant: "destructive",
          });
        }
      }

      setIsPending(false);
      onSuccess?.();
      handleClose();
    }
  };

  const renderSummary = () => {
    if (!isPending || processingItems.length === 0) return null;
    const pending = processingItems.filter(
      (i) => i.status === ProcessingItemStatus.PENDING,
    ).length;
    const processing = processingItems.filter(
      (i) => i.status === ProcessingItemStatus.PROCESSING,
    ).length;
    const success = processingItems.filter(
      (i) => i.status === ProcessingItemStatus.SUCCESS,
    ).length;
    const errorCount = processingItems.filter(
      (i) => i.status === ProcessingItemStatus.ERROR,
    ).length;
    const done = success + errorCount;
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm">
        <CHEKIOProgressBar
          current={done}
          total={processingItems.length}
          text={t("progress.label")}
        />
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
          <span>
            {tBatch("pending")}: {pending}
          </span>
          <span>
            {tBatch("processing")}: {processing}
          </span>
          <span>
            {tBatch("completed")}: {success}
          </span>
          <span>
            {tBatch("errors")}: {errorCount}
          </span>
        </div>
      </div>
    );
  };

  const isReadOnly = mode === "view";

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        mode === "create"
          ? t("title.create")
          : mode === "view"
            ? t("title.view")
            : t("title.edit")
      }
      size="7xl"
    >
      {mode === "create" && isEmployeeSelectVisible ? (
        <div className="space-y-4 py-2">
          {!companyId && (
            <div
              className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              role="status"
            >
              <Info className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
              <p>{t("companyRequired.hint")}</p>
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Users
                    className="h-5 w-5"
                    style={{ color: `${templatePrimary}99` }}
                    aria-hidden
                  />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {t("employeeSelection.title")}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {t("employeeSelection.description")}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 md:p-6">
              <form
                onSubmit={handleSearchSubmit(onSubmitSearch)}
                className="grid grid-cols-1 gap-4 md:grid-cols-12"
              >
                <div className="space-y-2 md:col-span-3">
                  <label className="text-sm font-medium text-gray-700">
                    {tBatch("filters.search")}
                  </label>
                  <CHEKIOInput
                    type="text"
                    placeholder={tBatch("filters.searchPlaceholder")}
                    value={search || ""}
                    onChange={(e) => setValue("search", e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSearchSubmit(onSubmitSearch)()
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <label className="text-sm font-medium text-gray-700">
                    {tBatch("filters.documentNumber")}
                  </label>
                  <CHEKIOInput
                    type="text"
                    placeholder={tBatch("filters.documentNumberPlaceholder")}
                    value={documentNumber || ""}
                    onChange={(e) => setValue("documentNumber", e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSearchSubmit(onSubmitSearch)()
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    {tBatch("filters.job")}
                  </label>
                  <CHEKIOSelect
                    value={jobId || "all"}
                    onValueChange={(value: string) =>
                      setValue(
                        "jobId",
                        value === "all" ? undefined : (value as string),
                      )
                    }
                  >
                    <CHEKIOSelectTrigger>
                      <CHEKIOSelectValue
                        placeholder={tBatch("filters.jobPlaceholder")}
                      />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      <CHEKIOSelectItem value="all">
                        {tBatch("filters.jobPlaceholder")}
                      </CHEKIOSelectItem>
                      {jobs?.data?.map(
                        (job: { publicId: string; name: string }) => (
                          <CHEKIOSelectItem
                            key={job.publicId}
                            value={job.publicId}
                          >
                            {job.name}
                          </CHEKIOSelectItem>
                        ),
                      )}
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    {tBatch("filters.branch")}
                  </label>
                  <CHEKIOSelect
                    value={branchId || "all"}
                    onValueChange={(value: string) =>
                      setValue(
                        "branchId",
                        value === "all" ? undefined : (value as string),
                      )
                    }
                  >
                    <CHEKIOSelectTrigger>
                      <CHEKIOSelectValue
                        placeholder={tBatch("filters.branchPlaceholder")}
                      />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      <CHEKIOSelectItem value="all">
                        {tBatch("filters.branchPlaceholder")}
                      </CHEKIOSelectItem>
                      {branches?.data?.map(
                        (branch: { publicId: string; name: string }) => (
                          <CHEKIOSelectItem
                            key={branch.publicId}
                            value={branch.publicId}
                          >
                            {branch.name}
                          </CHEKIOSelectItem>
                        ),
                      )}
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                </div>
                {companyId && (
                  <div className="space-y-2 md:col-span-2">
                    <OrganizationSelector
                      control={control}
                      name="organizationId"
                      companyId={companyId}
                    />
                  </div>
                )}
                <div className="flex flex-wrap justify-end gap-2 md:col-span-12">
                  <CHEKIOButton variant="search" type="submit">
                    <Search className="h-4 w-4" />
                    {tBatch("filters.searchButton")}
                  </CHEKIOButton>
                  <CHEKIOButton
                    variant="refresh"
                    type="button"
                    onClick={handleClearSearch}
                  >
                    <RotateCcw className="h-4 w-4" />
                    {tBatch("filters.clearButton")}
                  </CHEKIOButton>
                </div>
              </form>
              <div className="mt-4 flex flex-col">
                {isLoadingEmployees ? (
                  <div className="flex justify-center py-8">
                    <CHEKIOLoading
                      size="lg"
                      variant="modern"
                      text={tBatch("table.loading")}
                    />
                  </div>
                ) : (employeesData?.data || []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center">
                    <Users className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                    <p className="font-medium text-gray-600">
                      {tBatch("table.noData")}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <CHEKIOTable className="rounded-none border-0 shadow-none">
                        <CHEKIOTableHeader>
                          <tr>
                            <CHEKIOTableHead className="w-12">
                              <input
                                type="checkbox"
                                aria-label={t(
                                  "employeeSelection.selectAllAria",
                                )}
                                checked={
                                  selectedEmployees.length > 0 &&
                                  selectedEmployees.length ===
                                    (employeesData?.data?.length || 0)
                                }
                                onChange={(e) =>
                                  handleSelectAll(e.target.checked)
                                }
                                className="rounded"
                              />
                            </CHEKIOTableHead>
                            <CHEKIOTableHead>
                              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                                <Hash
                                  className="h-4 w-4 shrink-0"
                                  style={{ color: `${templatePrimary}99` }}
                                />
                                {tBatch("table.headers.code")}
                              </span>
                            </CHEKIOTableHead>
                            <CHEKIOTableHead>
                              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                                <User
                                  className="h-4 w-4 shrink-0"
                                  style={{ color: `${templatePrimary}99` }}
                                />
                                {tBatch("table.headers.firstName")}
                              </span>
                            </CHEKIOTableHead>
                            <CHEKIOTableHead>
                              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                                <User
                                  className="h-4 w-4 shrink-0"
                                  style={{ color: `${templatePrimary}99` }}
                                />
                                {tBatch("table.headers.lastName")}
                              </span>
                            </CHEKIOTableHead>
                            <CHEKIOTableHead>
                              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                                <Hash
                                  className="h-4 w-4 shrink-0"
                                  style={{ color: `${templatePrimary}99` }}
                                />
                                {tBatch("table.headers.documentNumber")}
                              </span>
                            </CHEKIOTableHead>
                            <CHEKIOTableHead>
                              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                                <Mail
                                  className="h-4 w-4 shrink-0"
                                  style={{ color: `${templatePrimary}99` }}
                                />
                                {tBatch("table.headers.email")}
                              </span>
                            </CHEKIOTableHead>
                            <CHEKIOTableHead>
                              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                                <CalendarPlus
                                  className="h-4 w-4 shrink-0"
                                  style={{ color: `${templatePrimary}99` }}
                                />
                                {tBatch("table.headers.startDate")}
                              </span>
                            </CHEKIOTableHead>
                            <CHEKIOTableHead>
                              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                                <CalendarPlus
                                  className="h-4 w-4 shrink-0"
                                  style={{ color: `${templatePrimary}99` }}
                                />
                                {tBatch("table.headers.endDate")}
                              </span>
                            </CHEKIOTableHead>
                            <CHEKIOTableHead>
                              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                                <Building2
                                  className="h-4 w-4 shrink-0"
                                  style={{ color: `${templatePrimary}99` }}
                                />
                                {tBatch("table.headers.contractType")}
                              </span>
                            </CHEKIOTableHead>
                            <CHEKIOTableHead>
                              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                                <Hash
                                  className="h-4 w-4 shrink-0"
                                  style={{ color: `${templatePrimary}99` }}
                                />
                                {tBatch("table.headers.contractedHours")}
                              </span>
                            </CHEKIOTableHead>
                          </tr>
                        </CHEKIOTableHeader>
                        <CHEKIOTableBody>
                          {(employeesData?.data || []).map(
                            (employee: EmployeeResponseDto, index: number) => (
                              <CHEKIOTableRow
                                key={employee.publicId}
                                index={index}
                              >
                                <CHEKIOTableCell>
                                  <input
                                    type="checkbox"
                                    aria-label={t(
                                      "employeeSelection.selectRowAria",
                                    )}
                                    checked={selectedEmployees.some(
                                      (e) => e.publicId === employee.publicId,
                                    )}
                                    onChange={(e) =>
                                      handleEmployeeSelection(
                                        employee.publicId,
                                        e.target.checked,
                                      )
                                    }
                                    className="rounded"
                                  />
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {employee.code}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {employee.firstName}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {employee.lastName}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {employee.documentNumber}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {employee.personalEmail}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {DateTime.fromISO(
                                    String(employee.startDate),
                                  ).toFormat("dd/MM/yyyy")}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {employee.endDate
                                    ? DateTime.fromISO(
                                        String(employee.endDate),
                                      ).toFormat("dd/MM/yyyy")
                                    : "-"}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {employee.isIndefiniteTerm
                                    ? tBatch("table.contractType.indefinite")
                                    : tBatch("table.contractType.fixedTerm")}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {employee.contractedHours}
                                </CHEKIOTableCell>
                              </CHEKIOTableRow>
                            ),
                          )}
                        </CHEKIOTableBody>
                      </CHEKIOTable>
                    </div>
                    {pagination.totalCount > 0 && (
                      <div className="mt-6 flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            {tBatch("pagination.showing", {
                              current: employeesData?.data?.length || 0,
                              total: pagination.totalCount,
                            })}
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="whitespace-nowrap text-sm font-medium text-gray-700">
                              {tBatch("pagination.recordsPerPage")}:
                            </label>
                            <CHEKIOSelect
                              value={pagination.pageSize.toString()}
                              onValueChange={(value) =>
                                handlePageSizeChange(parseInt(value, 10))
                              }
                            >
                              <CHEKIOSelectTrigger className="w-24">
                                <CHEKIOSelectValue />
                              </CHEKIOSelectTrigger>
                              <CHEKIOSelectContent>
                                <CHEKIOSelectItem value="10">
                                  10
                                </CHEKIOSelectItem>
                                <CHEKIOSelectItem value="20">
                                  20
                                </CHEKIOSelectItem>
                                <CHEKIOSelectItem value="50">
                                  50
                                </CHEKIOSelectItem>
                                <CHEKIOSelectItem value="100">
                                  100
                                </CHEKIOSelectItem>
                                <CHEKIOSelectItem value="200">
                                  200
                                </CHEKIOSelectItem>
                              </CHEKIOSelectContent>
                            </CHEKIOSelect>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CHEKIOButton
                            variant="secondaryBlue"
                            onClick={() =>
                              handlePageChange(pagination.current - 1)
                            }
                            disabled={pagination.current === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            {tBatch("pagination.previous")}
                          </CHEKIOButton>
                          <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
                            {tBatch("pagination.page", {
                              current: pagination.current,
                              total: pagination.totalPages,
                            })}
                          </div>
                          <CHEKIOButton
                            variant="secondaryBlue"
                            onClick={() =>
                              handlePageChange(pagination.current + 1)
                            }
                            disabled={
                              pagination.current >= pagination.totalPages
                            }
                          >
                            {tBatch("pagination.next")}
                            <ChevronRight className="h-4 w-4" />
                          </CHEKIOButton>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4">
            <CHEKIOButton variant="secondary" onClick={handleClose}>
              <X className="h-4 w-4" />
              {tBatch("buttons.cancel")}
            </CHEKIOButton>
            <CHEKIOButton
              variant="primary"
              onClick={handleContinue}
              disabled={selectedEmployees.length === 0 || !companyId}
            >
              <CheckCircle2 className="h-4 w-4" />
              {tBatch("buttons.continue")} ({selectedEmployees.length})
            </CHEKIOButton>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleRequestSubmit(onSubmit)}
          className="space-y-6 py-4"
        >
          {isPending && renderSummary()}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              {mode === "view" && request ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("fields.employee")}
                  </label>
                  <p className="text-gray-600">{request.employeeName}</p>
                </div>
              ) : mode === "create" ? (
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Users
                      className="h-4 w-4"
                      style={{ color: `${templatePrimary}99` }}
                      aria-hidden
                    />
                    {tBatch("selectedEmployees.title")} (
                    {selectedEmployees.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedEmployees.map((employee) => (
                      <div
                        key={employee.publicId}
                        className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 text-sm text-gray-700"
                      >
                        {employee.firstName} {employee.lastName} —{" "}
                        {employee.documentNumber}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("fields.type")}
                </label>
                <Controller
                  name="type"
                  control={requestControl}
                  rules={{ required: t("validation.typeRequired") }}
                  render={({ field }) => (
                    <>
                      <CHEKIOSelect
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          if (val === OvertimeRequestType.PER_SCHEDULE) {
                            setRequestValue(
                              "aditionHoursBeforeMinutes",
                              undefined,
                            );
                            setRequestValue(
                              "aditionHoursAfterMinutes",
                              undefined,
                            );
                          } else {
                            setRequestValue("startDate", undefined);
                            setRequestValue("endDate", undefined);
                            setRequestValue("startTime", "");
                            setRequestValue("endTime", "");
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        <CHEKIOSelectTrigger
                          className={
                            errors.type ? "border-red-500 w-full" : "w-full"
                          }
                        >
                          <CHEKIOSelectValue
                            placeholder={t("placeholders.type")}
                          />
                        </CHEKIOSelectTrigger>
                        <CHEKIOSelectContent>
                          <CHEKIOSelectItem
                            value={OvertimeRequestType.PER_SCHEDULE}
                          >
                            {t("types.perSchedule")}
                          </CHEKIOSelectItem>
                          <CHEKIOSelectItem
                            value={OvertimeRequestType.PER_HOURS}
                          >
                            {t("types.perHours")}
                          </CHEKIOSelectItem>
                        </CHEKIOSelectContent>
                      </CHEKIOSelect>
                      {errors.type && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.type.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              {selectedType === OvertimeRequestType.PER_SCHEDULE && (
                <>
                  <div>
                    <SystemDatePicker
                      label={t("fields.startDate")}
                      attribute="startDate"
                      control={requestControl}
                      errors={errors}
                      rules={{
                        required: t("validation.startDateRequired"),
                      }}
                      disabled={isReadOnly}
                      placeholder={t("placeholders.startDate")}
                    />
                  </div>
                  <div>
                    <Controller
                      name="startTime"
                      control={requestControl}
                      rules={{
                        required:
                          selectedType === OvertimeRequestType.PER_SCHEDULE
                            ? t("validation.startTimeRequired")
                            : false,
                      }}
                      render={({ field }) => (
                        <div className="space-y-1.5">
                          <label
                            htmlFor="overtime-start-time"
                            className="block text-sm font-medium text-gray-700"
                          >
                            {t("fields.startTime")}
                          </label>
                          <CHEKIOInput
                            id="overtime-start-time"
                            type="time"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            disabled={isReadOnly}
                            className={
                              errors.startTime
                                ? "border-red-500 w-full"
                                : "w-full"
                            }
                            aria-invalid={!!errors.startTime}
                          />
                          {errors.startTime && (
                            <p className="text-xs text-red-500">
                              {errors.startTime.message as string}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                  <div>
                    <SystemDatePicker
                      label={t("fields.endDate")}
                      attribute="endDate"
                      control={requestControl}
                      errors={errors}
                      rules={{
                        required: t("validation.endDateRequired"),
                      }}
                      disabled={isReadOnly}
                      placeholder={t("placeholders.endDate")}
                    />
                  </div>
                  <div>
                    <Controller
                      name="endTime"
                      control={requestControl}
                      rules={{
                        required:
                          selectedType === OvertimeRequestType.PER_SCHEDULE
                            ? t("validation.endTimeRequired")
                            : false,
                      }}
                      render={({ field }) => (
                        <div className="space-y-1.5">
                          <label
                            htmlFor="overtime-end-time"
                            className="block text-sm font-medium text-gray-700"
                          >
                            {t("fields.endTime")}
                          </label>
                          <CHEKIOInput
                            id="overtime-end-time"
                            type="time"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            disabled={isReadOnly}
                            className={
                              errors.endTime
                                ? "border-red-500 w-full"
                                : "w-full"
                            }
                            aria-invalid={!!errors.endTime}
                          />
                          {errors.endTime && (
                            <p className="text-xs text-red-500">
                              {errors.endTime.message as string}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </>
              )}

              {selectedType === OvertimeRequestType.PER_HOURS && (
                <>
                  <div>
                    <SystemDatePicker
                      label={t("fields.applicationDate")}
                      attribute="startDate"
                      control={requestControl}
                      errors={errors}
                      rules={{
                        required: t("validation.applicationDateRequired"),
                      }}
                      disabled={isReadOnly}
                      placeholder={t("placeholders.applicationDate")}
                    />
                  </div>
                  <div>
                    <SystemInput
                      control={requestControl}
                      label={t("fields.aditionHoursBeforeMinutes")}
                      attribute="aditionHoursBeforeMinutes"
                      type="number"
                      errors={errors}
                      placeholder={t("placeholders.aditionHoursBeforeMinutes")}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <SystemInput
                      control={requestControl}
                      label={t("fields.aditionHoursAfterMinutes")}
                      attribute="aditionHoursAfterMinutes"
                      type="number"
                      errors={errors}
                      placeholder={t("placeholders.aditionHoursAfterMinutes")}
                      disabled={isReadOnly}
                    />
                  </div>
                </>
              )}

              <div>
                <SystemInput
                  control={requestControl}
                  label={t("fields.observation")}
                  attribute="observation"
                  errors={errors}
                  placeholder={t("placeholders.observation")}
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("fields.document")}
                </label>
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 p-6">
                  <div className="flex flex-col items-center gap-4">
                    <label htmlFor="document-upload" className="cursor-pointer">
                      <CHEKIOButton
                        type="button"
                        variant="secondaryBlue"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("document-upload")?.click();
                        }}
                        disabled={isReadOnly}
                      >
                        <UploadIcon className="h-4 w-4 mr-2" />
                        {t("buttons.selectDocument")}
                      </CHEKIOButton>
                      <input
                        id="document-upload"
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.type !== "application/pdf") {
                              toast({
                                title: t(
                                  "validation.errors.invalidFileType.title",
                                ),
                                description: t(
                                  "validation.errors.invalidFileType.description",
                                ),
                                variant: "destructive",
                              });
                              return;
                            }
                            setDocumentFile(file);
                            setPresignedViewUrl(null);
                            const url = URL.createObjectURL(file);
                            setPdfPreviewUrl(url);
                          }
                        }}
                        disabled={isReadOnly}
                      />
                    </label>
                    {documentFile && (
                      <div className="w-full">
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded">
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-5 w-5 text-red-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {documentFile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(documentFile.size / 1024 / 1024).toFixed(2)}{" "}
                                MB
                              </p>
                            </div>
                          </div>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                setDocumentFile(null);
                                if (pdfPreviewUrl) {
                                  URL.revokeObjectURL(pdfPreviewUrl);
                                  setPdfPreviewUrl(null);
                                }
                                const input = document.getElementById(
                                  "document-upload",
                                ) as HTMLInputElement;
                                if (input) input.value = "";
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {!documentFile && request?.documentUrl && (
                      <div className="w-full">
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded">
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-5 w-5 text-blue-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {t("preview.existingDocument")}
                              </p>
                            </div>
                          </div>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                setPresignedViewUrl(null);
                                const input = document.getElementById(
                                  "document-upload",
                                ) as HTMLInputElement;
                                if (input) input.value = "";
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isPending && processingItems.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                  <div className="border-b border-gray-200 bg-gray-50/50 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {tBatch("selectedEmployees.title")} (
                      {processingItems.length})
                    </h3>
                  </div>
                  <CHEKIOTable className="rounded-none border-0 shadow-none">
                    <CHEKIOTableHeader>
                      <tr>
                        <CHEKIOTableHead>
                          {tBatch("table.headers.employee")}
                        </CHEKIOTableHead>
                        <CHEKIOTableHead>
                          {tBatch("table.headers.documentNumber")}
                        </CHEKIOTableHead>
                        <CHEKIOTableHead>
                          {tBatch("table.headers.status")}
                        </CHEKIOTableHead>
                      </tr>
                    </CHEKIOTableHeader>
                    <CHEKIOTableBody>
                      {processingItems.map((item, index) => (
                        <CHEKIOTableRow key={item.id} index={index}>
                          <CHEKIOTableCell className="font-medium">
                            {item.employeeName}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell>
                            {item.documentNumber}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell>
                            {item.status === ProcessingItemStatus.PENDING && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                {tBatch("table.status.pending")}
                              </span>
                            )}
                            {item.status ===
                              ProcessingItemStatus.PROCESSING && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {tBatch("table.status.processing")}
                              </span>
                            )}
                            {item.status === ProcessingItemStatus.SUCCESS && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                <CheckCircle2 className="w-3 h-3" />
                                {tBatch("table.status.completed")}
                              </span>
                            )}
                            {item.status === ProcessingItemStatus.ERROR && (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                  <X className="w-3 h-3" />
                                  {tBatch("table.status.error")}
                                </span>
                                {item.error && (
                                  <span className="text-xs text-red-500 mt-1">
                                    {item.error}
                                  </span>
                                )}
                              </div>
                            )}
                          </CHEKIOTableCell>
                        </CHEKIOTableRow>
                      ))}
                    </CHEKIOTableBody>
                  </CHEKIOTable>
                </div>
              )}
            </div>

            <div
              className="flex flex-col gap-4"
              style={{ maxHeight: "calc(100vh - 250px)", overflow: "hidden" }}
            >
              <div
                className={`overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm ${
                  isFullscreen ? "fixed inset-0 z-50 m-0 border-0" : "relative"
                }`}
              >
                <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {t("preview.title")}
                  </h4>
                  <div className="flex items-center gap-2">
                    {(pdfPreviewUrl && documentFile) ||
                    (request?.documentUrl &&
                      (presignedViewUrl ||
                        request.documentUrl.startsWith("http"))) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                          title={
                            isFullscreen
                              ? t("preview.exitFullscreen")
                              : t("preview.fullscreen")
                          }
                        >
                          <Maximize2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (pdfPreviewUrl) {
                              URL.revokeObjectURL(pdfPreviewUrl);
                              setPdfPreviewUrl(null);
                            }
                            if (request?.documentUrl) {
                              setPresignedViewUrl(null);
                            }
                            setIsFullscreen(false);
                            const input = document.getElementById(
                              "document-upload",
                            ) as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title={t("preview.close")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
                <div
                  className="relative bg-gray-100 overflow-hidden flex-1"
                  style={{
                    height: isFullscreen
                      ? "calc(100vh - 60px)"
                      : "calc(100vh - 200px)",
                    minHeight: isFullscreen ? "calc(100vh - 60px)" : "600px",
                  }}
                >
                  {isLoadingPresignedUrl &&
                  request?.documentUrl &&
                  !request?.documentUrl?.startsWith("http") ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : (pdfPreviewUrl && documentFile) ||
                    request?.documentUrl ? (
                    <embed
                      src={
                        pdfPreviewUrl && documentFile
                          ? pdfPreviewUrl
                          : presignedViewUrl || request?.documentUrl || ""
                      }
                      type="application/pdf"
                      className="w-full h-full border-0"
                      style={{ height: "100%", width: "100%" }}
                      title={t("preview.embedTitle")}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <UploadIcon className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-sm font-medium">
                        {t("preview.noDocument")}
                      </p>
                      <p className="text-xs mt-2">{t("preview.uploadHint")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4">
              {mode === "create" && (
                <CHEKIOButton
                  type="button"
                  variant="secondary"
                  onClick={handleBackToEmployeeSelect}
                  disabled={isPending}
                >
                  {tBatch("buttons.back")}
                </CHEKIOButton>
              )}
              <CHEKIOButton
                type="button"
                variant="secondaryBlue"
                onClick={handleClose}
                disabled={isPending}
              >
                <X className="h-4 w-4" />
                {t("buttons.cancel")}
              </CHEKIOButton>
              <CHEKIOButton
                type="submit"
                variant="primary"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === "create"
                      ? t("buttons.creating")
                      : t("buttons.updating")}
                  </>
                ) : mode === "create" ? (
                  t("buttons.create")
                ) : (
                  t("buttons.update")
                )}
              </CHEKIOButton>
            </div>
          )}
        </form>
      )}
    </CHEKIOModal>
  );
};

export { OvertimeRequestModal };
