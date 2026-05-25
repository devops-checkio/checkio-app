"use client";

import { EmployeeResponseDto } from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import OrganizationSelector from "@/app/[locale]/mantainers/employees/_components/organization-selector";
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
import { CheckioInputDate } from "@/components/ui/checkio-input-date";
import SystemCheckbox from "@/components/ui/system-checkbox";
import SystemInput from "@/components/ui/system-input";
import { useCookieSession } from "@/context/useCookieSession";
import { PaginationFilterDto } from "@/dto/pagination";
import { useToast } from "@/hooks/use-toast";
import { useCreateHourlyPermission } from "@/service/hourly-permission.service";
import {
  useGetBranches,
  useGetEmployees,
  useGetJobs,
  useGetTimeBanks,
} from "@/service/mantainer.service";
import {
  TimeBankType,
} from "@/app/[locale]/mantainers/time-bank/_components/time-bank.dto";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  HourlyPermissionCreateDto,
  HourlyPermissionResponseDto,
  HourlyPermissionType,
} from "./hourly-permission.dto";

const getDatePickerLocale = (locale: string): "es" | "en" | "fr" | "pt" => {
  switch (locale) {
    case "en":
      return "en";
    case "fr":
      return "fr";
    case "pt":
      return "pt";
    case "es":
    default:
      return "es";
  }
};

interface EmployeeProcessingItem {
  id: string;
  employeeId: string;
  employeeName: string;
  documentNumber: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

interface HourlyPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  request?: HourlyPermissionResponseDto;
  mode?: "create" | "view" | "edit";
}

interface HourlyPermissionFormData {
  reason: string;
  date: string | Date;
  startTime: string | Date;
  endTime: string | Date;
  type: HourlyPermissionType;
  observation?: string;
  withSalary?: boolean;
  isTimeBankCharge: boolean;
}

const HourlyPermissionModal = ({
  isOpen,
  onClose,
  onSuccess,
  request,
  mode = "create",
}: HourlyPermissionModalProps) => {
  const t = useTranslations("operations.requests.hourlyPermission.modal");
  const tBatch = useTranslations("operations.absences.batchAssignment");
  const { toast } = useToast();
  const { companyId } = useCookieSession();
  const params = useParams();
  const currentLocale = getDatePickerLocale(params.locale as string);
  const createHourlyPermission = useCreateHourlyPermission();

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

  const {
    register,
    handleSubmit: handleSearchSubmit,
    watch,
    setValue,
    control,
    reset: resetSearch,
  } = useForm<{
    search: string;
    documentNumber: string;
    jobId?: string;
    branchId?: string;
    organizationId?: string;
  }>({
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
  } = useForm<HourlyPermissionFormData>({
    defaultValues: {
      reason: "",
      date: "",
      startTime: "",
      endTime: "",
      type: HourlyPermissionType.ENTRY,
      observation: "",
      withSalary: false,
      isTimeBankCharge: false,
    },
  });

  const selectedType = watchRequest("type");
  const startTime = watchRequest("startTime");
  const endTime = watchRequest("endTime");
  const isTimeBankCharge = watchRequest("isTimeBankCharge");

  // Fetch active REST_DAYS time bank for first selected employee (for balance display)
  const firstSelectedEmployeeId = selectedEmployees[0]?.publicId;
  const { data: employeeTimeBanks } = useGetTimeBanks({
    page: 1,
    pageSize: 10,
    sort: "desc",
    employeeId: firstSelectedEmployeeId,
    type: TimeBankType.REST_DAYS,
    status: "active",
  });
  const activeRestDaysBank = employeeTimeBanks?.data?.find(
    (tb) => tb.type === TimeBankType.REST_DAYS,
  );

  useEffect(() => {
    if (selectedType === HourlyPermissionType.ENTRY) {
      setRequestValue("endTime", "");
    } else if (selectedType === HourlyPermissionType.EXIT) {
      setRequestValue("startTime", "");
    }
  }, [selectedType, setRequestValue]);

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
        resetRequest({
          reason: request.reason,
          date: request.date,
          startTime: request.startTime,
          endTime: request.endTime,
          type: request.type,
          observation: request.observation || "",
          withSalary: request.withSalary ?? false,
          isTimeBankCharge: false,
        });
      } else {
        setIsEmployeeSelectVisible(true);
        resetRequest({
          reason: "",
          date: "",
          startTime: "",
          endTime: "",
          type: HourlyPermissionType.ENTRY,
          observation: "",
          withSalary: false,
          isTimeBankCharge: false,
        });
      }
    }
  }, [isOpen, request, mode, resetRequest]);

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

  const buildFormattedPayload = (
    data: HourlyPermissionFormData,
    employeeId: string,
    timeBankCharge?: boolean,
  ): HourlyPermissionCreateDto | null => {
    const rawDate =
      typeof data.date === "string"
        ? data.date
        : data.date instanceof Date
          ? data.date.toISOString().split("T")[0]
          : "";
    if (!rawDate) return null;

    const selectedDate = DateTime.fromISO(rawDate, { zone: "UTC" }).startOf(
      "day",
    );
    if (!selectedDate.isValid) return null;

    const today = DateTime.utc().startOf("day");
    if (selectedDate < today) return null;

    const dateOnlyIso = selectedDate.toISODate();
    if (!dateOnlyIso) return null;

    const dateIso = selectedDate
      .set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
      .toUTC()
      .toISO();
    if (!dateIso) return null;

    const formattedData: HourlyPermissionCreateDto = {
      employeeId,
      reason: data.reason ?? "",
      date: dateIso,
      type: data.type,
      withSalary: data.withSalary ?? false,
      isTimeBankCharge: timeBankCharge ?? data.isTimeBankCharge ?? false,
    };

    if (data.observation?.trim()) {
      formattedData.observation = data.observation.trim();
    }

    if (
      data.type === HourlyPermissionType.ENTRY ||
      data.type === HourlyPermissionType.BOTH
    ) {
      if (!data.startTime) return null;
      const startDate = new Date(data.startTime as Date);
      const startHours = startDate.getHours();
      const startMinutes = startDate.getMinutes();
      const startDateTime = DateTime.fromISO(
        `${dateOnlyIso}T${String(startHours).padStart(2, "0")}:${String(
          startMinutes,
        ).padStart(2, "0")}`,
        { zone: "UTC" },
      );
      const startTimeIso = startDateTime.toISO();
      if (!startTimeIso) return null;
      formattedData.startTime = startTimeIso;
    }

    if (
      data.type === HourlyPermissionType.EXIT ||
      data.type === HourlyPermissionType.BOTH
    ) {
      if (!data.endTime) return null;
      const endDate = new Date(data.endTime as Date);
      const endHours = endDate.getHours();
      const endMinutes = endDate.getMinutes();
      const endDateTime = DateTime.fromISO(
        `${dateOnlyIso}T${String(endHours).padStart(2, "0")}:${String(
          endMinutes,
        ).padStart(2, "0")}`,
        { zone: "UTC" },
      );
      const endTimeIso = endDateTime.toISO();
      if (!endTimeIso) return null;
      formattedData.endTime = endTimeIso;
    }

    if (
      data.type === HourlyPermissionType.BOTH &&
      data.startTime &&
      data.endTime
    ) {
      const start = new Date(data.startTime).getTime();
      const end = new Date(data.endTime).getTime();
      if (end <= start) return null;
    }

    return formattedData;
  };

  const onSubmit: SubmitHandler<HourlyPermissionFormData> = async (data) => {
    if (mode === "view") return;

    if (mode === "create" && selectedEmployees.length === 0) {
      toast({
        title: tBatch("toast.selectEmployeeError.title"),
        description: tBatch("toast.selectEmployeeError.description"),
        variant: "destructive",
      });
      return;
    }

    if (!data.reason?.trim() || !data.date || !data.type) {
      toast({
        title: t("validation.errors.requiredFields.title"),
        description: t("validation.errors.requiredFields.description"),
        variant: "destructive",
      });
      return;
    }

    const selectedDate = data.date
      ? DateTime.fromJSDate(new Date(data.date))
      : null;
    if (!selectedDate) {
      toast({
        title: t("validation.errors.invalidDate.title"),
        description: t("validation.errors.invalidDate.description"),
        variant: "destructive",
      });
      return;
    }
    const today = DateTime.now().startOf("day");
    if (selectedDate < today) {
      toast({
        title: t("validation.errors.pastDate.title"),
        description: t("validation.errors.pastDate.description"),
        variant: "destructive",
      });
      return;
    }

    if (
      (data.type === HourlyPermissionType.ENTRY ||
        data.type === HourlyPermissionType.BOTH) &&
      !data.startTime
    ) {
      toast({
        title: t("validation.errors.startTimeRequired.title"),
        description: t("validation.errors.startTimeRequired.description"),
        variant: "destructive",
      });
      return;
    }
    if (
      (data.type === HourlyPermissionType.EXIT ||
        data.type === HourlyPermissionType.BOTH) &&
      !data.endTime
    ) {
      toast({
        title: t("validation.errors.endTimeRequired.title"),
        description: t("validation.errors.endTimeRequired.description"),
        variant: "destructive",
      });
      return;
    }
    if (
      data.type === HourlyPermissionType.BOTH &&
      data.startTime &&
      data.endTime
    ) {
      const start = new Date(data.startTime).getTime();
      const end = new Date(data.endTime).getTime();
      if (end <= start) {
        toast({
          title: t("validation.errors.invalidTimeRange.title"),
          description: t("validation.errors.invalidTimeRange.description"),
          variant: "destructive",
        });
        return;
      }
    }

    setIsPending(true);

    if (mode === "create") {
      setProcessingItems(
        selectedEmployees.map((employee) => ({
          id: `employee-${employee.publicId}`,
          employeeId: employee.publicId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          documentNumber: employee.documentNumber,
          status: "pending",
        })),
      );

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < selectedEmployees.length; i++) {
        const employee = selectedEmployees[i];

        setProcessingItems((prev) =>
          prev.map((item, index) =>
            index === i ? { ...item, status: "processing" } : item,
          ),
        );

        const payload = buildFormattedPayload(data, employee.publicId, data.isTimeBankCharge);
        if (!payload) {
          setProcessingItems((prev) =>
            prev.map((item, index) =>
              index === i
                ? {
                    ...item,
                    status: "error",
                    error: t("validation.errors.invalidDate.description"),
                  }
                : item,
            ),
          );
          errorCount++;
          continue;
        }

        try {
          await createHourlyPermission.mutateAsync(payload);
          setProcessingItems((prev) =>
            prev.map((item, index) =>
              index === i ? { ...item, status: "success" } : item,
            ),
          );
          successCount++;
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          setProcessingItems((prev) =>
            prev.map((item, index) =>
              index === i
                ? {
                    ...item,
                    status: "error",
                    error:
                      err?.response?.data?.message ||
                      t("toast.createError.description"),
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
        toast({
          title: t("toast.createError.title"),
          description: t("toast.createError.description", {
            successCount,
            errorCount,
          }),
          variant: "destructive",
        });
      }

      setIsPending(false);
      onSuccess?.();
      handleClose();
    }
  };

  const renderSummary = () => {
    if (!isPending || processingItems.length === 0) return null;
    const pending = processingItems.filter(
      (i) => i.status === "pending",
    ).length;
    const processing = processingItems.filter(
      (i) => i.status === "processing",
    ).length;
    const success = processingItems.filter(
      (i) => i.status === "success",
    ).length;
    const error = processingItems.filter((i) => i.status === "error").length;
    return (
      <div className="mt-4 bg-gray-50 p-3 rounded-lg">
        <h4 className="font-medium mb-2">
          {tBatch("progress")}:{" "}
          {Math.round(((success + error) / processingItems.length) * 100)}%
        </h4>
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded-full" />
            <span className="text-sm">
              {tBatch("pending")}: {pending}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-200 rounded-full" />
            <span className="text-sm">
              {tBatch("processing")}: {processing}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-200 rounded-full" />
            <span className="text-sm">
              {tBatch("completed")}: {success}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-200 rounded-full" />
            <span className="text-sm">
              {tBatch("errors")}: {error}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const getTitle = () => {
    switch (mode) {
      case "create":
        return t("title.create");
      case "view":
        return t("title.view");
      case "edit":
        return t("title.edit");
      default:
        return t("title.default");
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case "create":
        return t("buttons.create");
      case "edit":
        return t("buttons.update");
      default:
        return t("buttons.save");
    }
  };

  const isReadOnly = mode === "view";

  const getTypeLabel = (type: HourlyPermissionType) => {
    switch (type) {
      case HourlyPermissionType.ENTRY:
        return t("types.entry");
      case HourlyPermissionType.EXIT:
        return t("types.exit");
      case HourlyPermissionType.BOTH:
        return t("types.both");
      default:
        return type;
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      size={mode === "create" && isEmployeeSelectVisible ? "7xl" : "2xl"}
    >
      {mode === "create" && isEmployeeSelectVisible ? (
        <div className="space-y-6 py-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col gap-4">
              <form
                onSubmit={handleSearchSubmit(onSubmitSearch)}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {tBatch("filters.search")}
                    </label>
                    <CHEKIOInput
                      type="text"
                      placeholder={tBatch("filters.searchPlaceholder")}
                      value={search || ""}
                      onChange={(e) => setValue("search", e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        handleSearchSubmit(onSubmitSearch)()
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {tBatch("filters.documentNumber")}
                    </label>
                    <CHEKIOInput
                      type="text"
                      placeholder={tBatch("filters.documentNumberPlaceholder")}
                      value={documentNumber || ""}
                      onChange={(e) =>
                        setValue("documentNumber", e.target.value)
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        handleSearchSubmit(onSubmitSearch)()
                      }
                    />
                  </div>
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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
                    <div className="space-y-2">
                      <OrganizationSelector
                        control={control}
                        name="organizationId"
                        companyId={companyId}
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <CHEKIOButton
                    variant="search"
                    type="submit"
                    onClick={handleSearchSubmit(onSubmitSearch)}
                  >
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
              <div className="flex flex-col mt-4">
                {isLoadingEmployees ? (
                  <div className="flex justify-center py-8">
                    <CHEKIOLoading
                      size="lg"
                      variant="modern"
                      text={tBatch("table.loading")}
                    />
                  </div>
                ) : (employeesData?.data || []).length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-600 font-medium">
                      {tBatch("table.noData")}
                    </p>
                  </div>
                ) : (
                  <>
                    <CHEKIOTable>
                      <CHEKIOTableHeader>
                        <tr>
                          <CHEKIOTableHead className="w-12">
                            <input
                              type="checkbox"
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
                            {tBatch("table.headers.code")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {tBatch("table.headers.firstName")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {tBatch("table.headers.lastName")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {tBatch("table.headers.documentNumber")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {tBatch("table.headers.email")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {tBatch("table.headers.startDate")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {tBatch("table.headers.endDate")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {tBatch("table.headers.contractType")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {tBatch("table.headers.contractedHours")}
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
                              <CHEKIOTableCell>{employee.code}</CHEKIOTableCell>
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
                    {pagination.totalCount > 0 && (
                      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            {tBatch("pagination.showing", {
                              current: employeesData?.data?.length || 0,
                              total: pagination.totalCount,
                            })}
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
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
                          <div className="px-4 py-2 border bg-white text-sm text-gray-700">
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
          <div className="flex justify-end gap-4 mt-4">
            <CHEKIOButton variant="secondary" onClick={handleClose}>
              <X className="h-4 w-4" />
              {tBatch("buttons.cancel")}
            </CHEKIOButton>
            <CHEKIOButton
              variant="primary"
              onClick={handleContinue}
              disabled={selectedEmployees.length === 0}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mode === "view" && request ? (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("fields.employee")}
                </label>
                <p className="text-gray-600">{request.employeeName}</p>
              </div>
            ) : mode === "create" ? (
              <div className="md:col-span-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">
                    {tBatch("selectedEmployees.title")} (
                    {selectedEmployees.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedEmployees.map((employee) => (
                      <div
                        key={employee.publicId}
                        className="text-sm text-gray-600"
                      >
                        {employee.firstName} {employee.lastName} -{" "}
                        {employee.documentNumber}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="md:col-span-2">
              <SystemInput
                control={requestControl}
                label={t("fields.reason")}
                attribute="reason"
                errors={errors}
                rules={{
                  required: t("validation.reasonRequired"),
                }}
                placeholder={t("placeholders.reason")}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <Controller
                name="date"
                control={requestControl}
                rules={{
                  required: t("validation.dateRequired"),
                  validate: (value) => {
                    if (!value) return true;
                    const d = DateTime.fromJSDate(new Date(value));
                    if (d < DateTime.now().startOf("day")) {
                      return t("validation.pastDateNotAllowed");
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <CheckioInputDate
                    value={
                      field.value
                        ? typeof field.value === "string"
                          ? field.value
                          : field.value.toISOString().split("T")[0]
                        : undefined
                    }
                    onChange={field.onChange}
                    label={t("fields.date")}
                    placeholder={t("placeholders.date")}
                    locale={currentLocale}
                    error={errors.date?.message as string}
                    disabled={isReadOnly}
                  />
                )}
              />
            </div>

            <div>
              {isReadOnly && request ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("fields.type")}
                  </label>
                  <p className="text-gray-600">{getTypeLabel(request.type)}</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("fields.type")}
                  </label>
                  <Controller
                    name="type"
                    control={requestControl}
                    rules={{
                      required: t("validation.typeRequired"),
                    }}
                    render={({ field }) => (
                      <>
                        <CHEKIOSelect
                          value={field.value}
                          onValueChange={field.onChange}
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
                              value={HourlyPermissionType.ENTRY}
                            >
                              {t("types.entry")}
                            </CHEKIOSelectItem>
                            <CHEKIOSelectItem value={HourlyPermissionType.EXIT}>
                              {t("types.exit")}
                            </CHEKIOSelectItem>
                            <CHEKIOSelectItem value={HourlyPermissionType.BOTH}>
                              {t("types.both")}
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
              )}
            </div>

            {(selectedType === HourlyPermissionType.ENTRY ||
              selectedType === HourlyPermissionType.BOTH) && (
              <div>
                <Controller
                  name="startTime"
                  control={requestControl}
                  rules={{
                    required:
                      selectedType === HourlyPermissionType.ENTRY ||
                      selectedType === HourlyPermissionType.BOTH
                        ? t("validation.startTimeRequired")
                        : false,
                  }}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {selectedType === HourlyPermissionType.ENTRY
                          ? t("fields.startTimeEntry")
                          : t("fields.startTime")}
                      </label>
                      <CHEKIOInput
                        type="time"
                        value={
                          field.value
                            ? typeof field.value === "string"
                              ? field.value.split("T")[1]?.substring(0, 5) ||
                                field.value
                              : (field.value as Date)
                                  .toTimeString()
                                  .substring(0, 5)
                            : ""
                        }
                        onChange={(e) => {
                          const timeValue = e.target.value;
                          if (timeValue) {
                            const [hours, minutes] = timeValue.split(":");
                            const date = field.value
                              ? new Date(field.value as Date)
                              : new Date();
                            date.setHours(
                              parseInt(hours, 10),
                              parseInt(minutes, 10),
                              0,
                              0,
                            );
                            field.onChange(date);
                          }
                        }}
                        disabled={isReadOnly}
                      />
                      {errors.startTime && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.startTime.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            )}

            {(selectedType === HourlyPermissionType.EXIT ||
              selectedType === HourlyPermissionType.BOTH) && (
              <div>
                <Controller
                  name="endTime"
                  control={requestControl}
                  rules={{
                    required:
                      selectedType === HourlyPermissionType.EXIT ||
                      selectedType === HourlyPermissionType.BOTH
                        ? t("validation.endTimeRequired")
                        : false,
                    validate: (value) => {
                      if (
                        !value ||
                        !startTime ||
                        selectedType === HourlyPermissionType.EXIT
                      )
                        return true;
                      const endVal = new Date(value as Date).getTime();
                      const startVal = new Date(startTime as Date).getTime();
                      if (endVal <= startVal) {
                        return t("validation.endTimeAfterStartTime");
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {selectedType === HourlyPermissionType.EXIT
                          ? t("fields.endTimeExit")
                          : t("fields.endTime")}
                      </label>
                      <CHEKIOInput
                        type="time"
                        value={
                          field.value
                            ? typeof field.value === "string"
                              ? field.value.split("T")[1]?.substring(0, 5) ||
                                field.value
                              : (field.value as Date)
                                  .toTimeString()
                                  .substring(0, 5)
                            : ""
                        }
                        onChange={(e) => {
                          const timeValue = e.target.value;
                          if (timeValue) {
                            const [hours, minutes] = timeValue.split(":");
                            const date = field.value
                              ? new Date(field.value as Date)
                              : new Date();
                            date.setHours(
                              parseInt(hours, 10),
                              parseInt(minutes, 10),
                              0,
                              0,
                            );
                            field.onChange(date);
                          }
                        }}
                        disabled={isReadOnly}
                      />
                      {errors.endTime && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.endTime.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <SystemInput
                control={requestControl}
                label={t("fields.observation")}
                attribute="observation"
                errors={errors}
                type="textarea"
                placeholder={t("placeholders.observation")}
                disabled={isReadOnly}
              />
            </div>

            {!isReadOnly && (
              <div className="md:col-span-2">
                <SystemCheckbox
                  control={requestControl}
                  label={t("fields.withSalary")}
                  attribute="withSalary"
                  errors={errors}
                  disabled={isReadOnly}
                />
              </div>
            )}

            {isReadOnly && request && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("fields.withSalary")}
                </label>
                <p className="text-gray-600">
                  {request.withSalary
                    ? t("fields.withSalaryYes")
                    : t("fields.withSalaryNo")}
                </p>
              </div>
            )}

            {/* Time Bank Charge Toggle */}
            {!isReadOnly && mode === "create" && (
              <div className="md:col-span-2">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-blue-100 rounded-md">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <label
                          htmlFor="isTimeBankChargeHourly"
                          className="text-sm font-semibold text-blue-900 cursor-pointer"
                        >
                          Descontar del Banco de Horas
                        </label>
                        <p className="text-xs text-blue-700 mt-0.5">
                          Las horas del permiso se descontarán del banco de días de descanso del empleado
                        </p>
                      </div>
                    </div>
                    <Controller
                      name="isTimeBankCharge"
                      control={requestControl}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          id="isTimeBankChargeHourly"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                      )}
                    />
                  </div>

                  {isTimeBankCharge && selectedEmployees.length === 1 && (
                    <div className="border-t border-blue-200 pt-3">
                      {activeRestDaysBank ? (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-800 font-medium">
                            Saldo disponible ({selectedEmployees[0].firstName}):
                          </span>
                          <span
                            className={`font-bold ${activeRestDaysBank.availableHours >= 0 ? "text-green-700" : "text-red-600"}`}
                          >
                            {activeRestDaysBank.availableHours.toFixed(1)} hrs
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                          ⚠ El empleado no tiene un banco de días de descanso activo
                        </p>
                      )}
                    </div>
                  )}

                  {isTimeBankCharge && selectedEmployees.length > 1 && (
                    <div className="border-t border-blue-200 pt-3">
                      <p className="text-xs text-blue-700">
                        El sistema validará el saldo disponible para cada uno de los {selectedEmployees.length} empleados al procesar el permiso.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Show time bank badge in view mode */}
            {isReadOnly && (request as any)?.isTimeBankCharge && (
              <div className="md:col-span-2">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-blue-800 font-medium">
                    Este permiso tiene cargo al banco de horas
                  </span>
                </div>
              </div>
            )}
          </div>

          {isPending && processingItems.length > 0 && (
            <div className="mt-6">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 py-2 px-4 border-b">
                  <h3 className="font-medium">
                    {tBatch("selectedEmployees.title")} (
                    {processingItems.length})
                  </h3>
                </div>
                <CHEKIOTable>
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
                        <CHEKIOTableCell>{item.documentNumber}</CHEKIOTableCell>
                        <CHEKIOTableCell>
                          {item.status === "pending" && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {tBatch("table.status.pending")}
                            </span>
                          )}
                          {item.status === "processing" && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {tBatch("table.status.processing")}
                            </span>
                          )}
                          {item.status === "success" && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3" />
                              {tBatch("table.status.completed")}
                            </span>
                          )}
                          {item.status === "error" && (
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
            </div>
          )}

          {mode === "view" && request && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-gray-900">
                Información de la Solicitud
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Solicitado por:</span>
                  <p className="text-gray-600">{request.requestedBy}</p>
                </div>
                <div>
                  <span className="font-medium">Fecha de solicitud:</span>
                  <p className="text-gray-600">
                    {DateTime.fromISO(request.createdAt as string).toFormat(
                      "dd/MM/yyyy HH:mm",
                    )}
                  </p>
                </div>
                {request.approvedByName && (
                  <div>
                    <span className="font-medium">Aprobado por:</span>
                    <p className="text-gray-600">{request.approvedByName}</p>
                  </div>
                )}
                {request.approvedAt && (
                  <div>
                    <span className="font-medium">Fecha de aprobación:</span>
                    <p className="text-gray-600">
                      {DateTime.fromISO(request.approvedAt as string).toFormat(
                        "dd/MM/yyyy HH:mm",
                      )}
                    </p>
                  </div>
                )}
                {request.rejectedByName && (
                  <div>
                    <span className="font-medium">Rechazado por:</span>
                    <p className="text-gray-600">{request.rejectedByName}</p>
                  </div>
                )}
                {request.rejectedAt && (
                  <div>
                    <span className="font-medium">Fecha de rechazo:</span>
                    <p className="text-gray-600">
                      {DateTime.fromISO(request.rejectedAt as string).toFormat(
                        "dd/MM/yyyy HH:mm",
                      )}
                    </p>
                  </div>
                )}
                {request.rejectionReason && (
                  <div className="col-span-2">
                    <span className="font-medium">Motivo de rechazo:</span>
                    <p className="text-gray-600">{request.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
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
              <X className="h-4 w-4 mr-2" />
              {mode === "view" ? t("buttons.close") : t("buttons.cancel")}
            </CHEKIOButton>
            {mode !== "view" && (
              <CHEKIOButton
                type="submit"
                variant="primary"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("buttons.processing")}
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    {getButtonText()}
                  </>
                )}
              </CHEKIOButton>
            )}
          </div>
        </form>
      )}
    </CHEKIOModal>
  );
};

export { HourlyPermissionModal };

