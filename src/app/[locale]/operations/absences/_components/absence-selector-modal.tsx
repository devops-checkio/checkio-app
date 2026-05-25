"use client";

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
  CHEKIOTextarea,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { PaginationFilterDto } from "@/dto/pagination";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateAbsence,
  useGetAbsenceTypes,
  useGetBranches,
  useGetEmployees,
  useGetJobs,
} from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { AbsenceTypeResponseDto } from "../../../mantainers/absence-types/_components/absence-type.dto";
import { EmployeeResponseDto } from "../../../mantainers/employees/_components/employee.dto";
import { AbsenceCreateDto } from "./absence.dto";

interface EmployeeProcessingItem {
  id: string;
  employeeId: string;
  employeeName: string;
  documentNumber: string;
  absenceType: string;
  startDate: string;
  endDate: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

interface BatchAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLoadingText?: string;
}

interface AbsenceFormData {
  absenceTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  withoutPay: boolean;
}

const BatchAbsenceModal = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  message,
  buttonText,
  buttonLoadingText,
}: BatchAbsenceModalProps) => {
  const t = useTranslations("operations.absences.batchAssignment");
  const { companyId, canCreate } = useCookieSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<
    EmployeeResponseDto[]
  >([]);
  const [isEmployeeSelectVisible, setIsEmployeeSelectVisible] = useState(true);
  const [processingItems, setProcessingItems] = useState<
    EmployeeProcessingItem[]
  >([]);
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceTypeResponseDto[]>(
    []
  );
  const [withoutPay, setWithoutPay] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "desc" as "asc" | "desc",
  });

  const createAbsence = useCreateAbsence();

  // Form for employee search filters
  const { register, handleSubmit, watch, setValue, control, reset } = useForm({
    defaultValues: {
      search: "",
      documentNumber: "",
      jobId: undefined,
      branchId: undefined,
      organizationId: undefined,
    },
  });

  // Form for absence data
  const {
    control: absenceControl,
    handleSubmit: handleAbsenceSubmit,
    reset: resetAbsence,
    watch: watchAbsence,
    setValue: setAbsenceValue,
    formState: { errors },
  } = useForm<AbsenceFormData>({
    defaultValues: {
      absenceTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
      withoutPay: false,
    },
  });

  // Get data for filters
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

  // Watch form values
  const branchId = watch("branchId");
  const jobId = watch("jobId");
  const documentNumber = watch("documentNumber");
  const search = watch("search");

  // Get employees with filters
  const {
    data: employeesData,
    isLoading: isLoadingEmployees,
    refetch,
  } = useGetEmployees({
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    search: watch("search"),
    companyId: companyId || "",
    status: "active", // Only show active employees
    documentNumber: watch("documentNumber"),
    jobId: watch("jobId"),
    branchId: watch("branchId"),
  });

  const { data: absenceTypesData, isLoading: isLoadingAbsenceTypes } =
    useGetAbsenceTypes({
      page: 1,
      pageSize: 100,
      sort: "asc",
    });

  useEffect(() => {
    if (employeesData?.pagination) {
      setPagination(employeesData.pagination);
    }
  }, [employeesData]);

  useEffect(() => {
    if (absenceTypesData?.data) {
      setAbsenceTypes(absenceTypesData.data);
    }
  }, [absenceTypesData]);

  const absenceTypeIdValue = watchAbsence("absenceTypeId");

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
    }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: newPageSize,
      current: 1,
    }));
  }, []);

  const handleLevelChange = (
    value: string,
    field: "search" | "documentNumber" | "jobId" | "branchId" | "organizationId"
  ) => {
    setValue(field, value);
  };

  const onSubmitSearch = (data: { search: string }) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleClearSearch = () => {
    reset();
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleClose = () => {
    reset();
    resetAbsence();
    setSelectedEmployees([]);
    setProcessingItems([]);
    setIsEmployeeSelectVisible(true);
    setIsPending(false);
    setIsComplete(false);
    setWithoutPay(false);
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
        title: t("toast.selectEmployeeError.title"),
        description: t("toast.selectEmployeeError.description"),
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
        (e) => e.publicId === employeeId
      );
      if (employee) {
        setSelectedEmployees((prev) => [...prev, employee]);
      }
    } else {
      setSelectedEmployees((prev) =>
        prev.filter((e) => e.publicId !== employeeId)
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

  const onSubmit: SubmitHandler<AbsenceFormData> = async (data) => {
    if (selectedEmployees.length === 0) {
      toast({
        title: t("toast.selectEmployeeError.title"),
        description: t("toast.selectEmployeeError.description"),
        variant: "destructive",
      });
      return;
    }

    // Check if absence type is selected
    if (!data.absenceTypeId) {
      toast({
        title: t("toast.selectEmployeeError.title"),
        description: t("form.absenceTypeRequired"),
        variant: "destructive",
      });
      return;
    }

    setIsPending(true);
    setIsComplete(false);

    // Ensure dates are in ISO format
    const formattedData = {
      ...data,
      absenceTypeId: data.absenceTypeId,
      startDate: data.startDate
        ? DateTime.fromISO(String(data.startDate)).toISODate()
        : undefined,
      endDate: data.endDate
        ? DateTime.fromISO(String(data.endDate)).toISODate()
        : undefined,
      withoutPay,
    };

    // Check if required dates exist
    if (!formattedData.startDate || !formattedData.endDate) {
      toast({
        title: t("toast.datesError.title"),
        description: t("toast.datesError.description"),
        variant: "destructive",
      });
      setIsPending(false);
      return;
    }

    // Preparar items para procesamiento
    const initialItems: EmployeeProcessingItem[] = selectedEmployees.map(
      (employee) => ({
        id: `employee-${employee.publicId}`,
        employeeId: employee.publicId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        documentNumber: employee.documentNumber,
        absenceType:
          absenceTypes.find(
            (type) => type.publicId === data.absenceTypeId
          )?.name || "N/A",
        startDate: DateTime.fromISO(String(formattedData.startDate))
          .setLocale("es")
          .toLocaleString({
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        endDate: DateTime.fromISO(String(formattedData.endDate))
          .setLocale("es")
          .toLocaleString({
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        status: "pending",
      })
    );

    setProcessingItems(initialItems);

    let successCount = 0;
    let errorCount = 0;

    // Procesar cada empleado secuencialmente
    for (let i = 0; i < selectedEmployees.length; i++) {
      const employee = selectedEmployees[i];

      // Actualizar el estado a "procesando" para el empleado actual
      setProcessingItems((prev) =>
        prev.map((item, index) =>
          index === i ? { ...item, status: "processing" } : item
        )
      );

      try {
        const absenceData: AbsenceCreateDto = {
          employeeId: employee.publicId,
          absenceTypeId: formattedData.absenceTypeId,
          startDate: formattedData.startDate,
          endDate: formattedData.endDate,
          reason: formattedData.reason || undefined,
          withoutPay: formattedData.withoutPay,
        };

        await createAbsence.mutateAsync(absenceData);

        successCount += 1;

        // Actualizar el estado a éxito
        setProcessingItems((prev) =>
          prev.map((item, index) =>
            index === i ? { ...item, status: "success" } : item
          )
        );
      } catch (error: any) {
        errorCount += 1;

        // Actualizar el estado a error
        setProcessingItems((prev) =>
          prev.map((item, index) =>
            index === i
              ? {
                  ...item,
                  status: "error",
                  error:
                    error?.response?.data?.message ||
                    "Error al crear la ausencia",
                }
              : item
          )
        );
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

    // Invalidar consultas para actualizar los datos
    queryClient.invalidateQueries({
      queryKey: ["GetAbsences"],
    });

    setIsPending(false);
    setIsComplete(true);
    onSuccess();
  };

  const renderSummary = () => {
    if ((!isPending && !isComplete) || processingItems.length === 0) return null;

    const pending = processingItems.filter(
      (item) => item.status === "pending"
    ).length;
    const processing = processingItems.filter(
      (item) => item.status === "processing"
    ).length;
    const success = processingItems.filter(
      (item) => item.status === "success"
    ).length;
    const error = processingItems.filter(
      (item) => item.status === "error"
    ).length;

    return (
      <div className="mt-4 bg-gray-50 p-3 rounded-lg">
        <h4 className="font-medium mb-2">
          {t("progress")}:{" "}
          {Math.round(((success + error) / processingItems.length) * 100)}%
        </h4>
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
            <span className="text-sm">
              {t("pending")}: {pending}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
            <span className="text-sm">
              {t("processing")}: {processing}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-200 rounded-full"></div>
            <span className="text-sm">
              {t("completed")}: {success}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-200 rounded-full"></div>
            <span className="text-sm">
              {t("errors")}: {error}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const modalTitle = title || t("title");
  const modalMessage = message || t("message");
  const submitButtonText = buttonText || t("buttonText");
  const submitButtonLoadingText = buttonLoadingText || t("buttonLoadingText");

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={isPending ? () => {} : handleClose}
      title={modalTitle}
      size="6xl"
    >
      {isEmployeeSelectVisible ? (
        // Paso 1: Selección de empleados con filtros mejorados
        <div className="space-y-6 py-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col gap-4">
              <form
                onSubmit={handleSubmit(onSubmitSearch)}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("filters.search")}
                    </label>
                    <CHEKIOInput
                      type="text"
                      placeholder={t("filters.searchPlaceholder")}
                      value={search || ""}
                      onChange={(e) => setValue("search", e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSubmit(onSubmitSearch)()
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("filters.documentNumber")}
                    </label>
                    <CHEKIOInput
                      type="text"
                      placeholder={t("filters.documentNumberPlaceholder")}
                      value={documentNumber || ""}
                      onChange={(e) =>
                        setValue("documentNumber", e.target.value)
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSubmit(onSubmitSearch)()
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("filters.job")}
                    </label>
                    <CHEKIOSelect
                      value={jobId || "all"}
                      onValueChange={(value: string) =>
                        setValue(
                          "jobId",
                          value === "all" ? undefined : (value as any)
                        )
                      }
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue
                          placeholder={t("filters.jobPlaceholder")}
                        />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        <CHEKIOSelectItem value="all">
                          {t("filters.jobPlaceholder")}
                        </CHEKIOSelectItem>
                        {jobs?.data.map((job: any) => (
                          <CHEKIOSelectItem
                            key={job.publicId}
                            value={job.publicId}
                          >
                            {job.name}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("filters.branch")}
                    </label>
                    <CHEKIOSelect
                      value={branchId || "all"}
                      onValueChange={(value) =>
                        setValue(
                          "branchId",
                          value === "all" ? undefined : (value as any)
                        )
                      }
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue
                          placeholder={t("filters.branchPlaceholder")}
                        />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        <CHEKIOSelectItem value="all">
                          {t("filters.branchPlaceholder")}
                        </CHEKIOSelectItem>
                        {branches?.data.map((branch: any) => (
                          <CHEKIOSelectItem
                            key={branch.publicId}
                            value={branch.publicId}
                          >
                            {branch.name}
                          </CHEKIOSelectItem>
                        ))}
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
                    onClick={handleSubmit(onSubmitSearch)}
                  >
                    <Search className="h-4 w-4" />
                    {t("filters.searchButton")}
                  </CHEKIOButton>
                  <CHEKIOButton
                    variant="refresh"
                    type="button"
                    onClick={handleClearSearch}
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t("filters.clearButton")}
                  </CHEKIOButton>
                </div>
              </form>
              <div className="flex flex-col mt-4">
                {isLoadingEmployees ? (
                  <div className="flex justify-center py-8">
                    <CHEKIOLoading
                      size="lg"
                      variant="modern"
                      text={t("table.loading")}
                    />
                  </div>
                ) : (employeesData?.data || []).length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-600 font-medium">
                      {t("table.noData")}
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
                            {t("table.headers.code")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {t("table.headers.firstName")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {t("table.headers.lastName")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {t("table.headers.documentNumber")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {t("table.headers.email")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {t("table.headers.startDate")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {t("table.headers.endDate")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {t("table.headers.contractType")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {t("table.headers.contractedHours")}
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
                                    (e) => e.publicId === employee.publicId
                                  )}
                                  onChange={(e) =>
                                    handleEmployeeSelection(
                                      employee.publicId,
                                      e.target.checked
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
                                  String(employee.startDate)
                                ).toFormat("dd/MM/yyyy")}
                              </CHEKIOTableCell>
                              <CHEKIOTableCell>
                                {employee.endDate
                                  ? DateTime.fromISO(
                                      String(employee.endDate)
                                    ).toFormat("dd/MM/yyyy")
                                  : "-"}
                              </CHEKIOTableCell>
                              <CHEKIOTableCell>
                                {employee.isIndefiniteTerm
                                  ? t("table.contractType.indefinite")
                                  : t("table.contractType.fixedTerm")}
                              </CHEKIOTableCell>
                              <CHEKIOTableCell>
                                {employee.contractedHours}
                              </CHEKIOTableCell>
                            </CHEKIOTableRow>
                          )
                        )}
                      </CHEKIOTableBody>
                    </CHEKIOTable>

                    {pagination.totalCount > 0 && (
                      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            {t("pagination.showing", {
                              current: employeesData?.data?.length || 0,
                              total: pagination.totalCount,
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
                            {t("pagination.previous")}
                          </CHEKIOButton>
                          <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                            {t("pagination.page", {
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
                            {t("pagination.next")}
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
              {t("buttons.cancel")}
            </CHEKIOButton>
            <CHEKIOButton
              variant="primary"
              onClick={handleContinue}
              disabled={
                selectedEmployees.length === 0 ||
                !canCreate(OrganizationPermissionCode.ASSIGNMENT_ABSENCE_OPERATIONS)
              }
            >
              <CheckCircle2 className="h-4 w-4" />
              {t("buttons.continue")} ({selectedEmployees.length})
            </CHEKIOButton>
          </div>
        </div>
      ) : (
        // Paso 2: Formulario de ausencia
        <div className="space-y-4">
          {isPending && renderSummary()}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {!isComplete && (
              <div className="space-y-6 py-4 col-span-2">
                <form onSubmit={handleAbsenceSubmit(onSubmit)}>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("form.absenceType")} *
                    </label>
                    <CHEKIOSelect
                      value={watchAbsence("absenceTypeId") || ""}
                      onValueChange={(value: string) => {
                        console.log("Selecting absence type, value:", value);
                        setAbsenceValue("absenceTypeId", value);
                        console.log(
                          "After setValue, new value:",
                          watchAbsence("absenceTypeId")
                        );
                      }}
                    >
                      <CHEKIOSelectTrigger
                        className={errors.absenceTypeId ? "border-red-500" : ""}
                      >
                        <CHEKIOSelectValue
                          placeholder={t("form.absenceTypePlaceholder")}
                        />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        {absenceTypes.length > 0 ? (
                          absenceTypes.map((type, index) => (
                            <CHEKIOSelectItem
                              key={type.publicId || `absence-type-${index}`}
                              value={type.publicId}
                            >
                              {type.name}
                            </CHEKIOSelectItem>
                          ))
                        ) : (
                          <CHEKIOSelectItem key="empty-state" value="" disabled>
                            {isLoadingAbsenceTypes
                              ? t("table.loading")
                              : t("table.noData")}
                          </CHEKIOSelectItem>
                        )}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                    {errors.absenceTypeId && (
                      <p className="text-red-500 text-xs">
                        {errors.absenceTypeId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("form.startDate")} *
                    </label>
                    <Controller
                      name="startDate"
                      control={absenceControl}
                      rules={{
                        required: t("form.startDateRequired"),
                      }}
                      render={({ field }) => (
                        <CHEKIOInput
                          type="date"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          className={errors.startDate ? "border-red-500" : ""}
                        />
                      )}
                    />
                    {errors.startDate && (
                      <p className="text-red-500 text-xs">
                        {errors.startDate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("form.endDate")} *
                    </label>
                    <Controller
                      name="endDate"
                      control={absenceControl}
                      rules={{
                        required: t("form.endDateRequired"),
                      }}
                      render={({ field }) => (
                        <CHEKIOInput
                          type="date"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          className={errors.endDate ? "border-red-500" : ""}
                        />
                      )}
                    />
                    {errors.endDate && (
                      <p className="text-red-500 text-xs">
                        {errors.endDate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("form.reason")}
                    </label>
                    <Controller
                      name="reason"
                      control={absenceControl}
                      render={({ field }) => (
                        <CHEKIOTextarea
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder={t("form.reasonPlaceholder")}
                          rows={4}
                        />
                      )}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="withoutPay"
                      checked={withoutPay}
                      onChange={(e) => setWithoutPay(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label
                      htmlFor="withoutPay"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t("form.withoutPay")}
                    </label>
                  </div>
                  </div>

                <div className="flex justify-end gap-4 mt-6">
                  {isComplete ? (
                    <CHEKIOButton
                      type="button"
                      variant="secondary"
                      onClick={handleClose}
                    >
                      <X className="h-4 w-4" />
                      {t("buttons.close")}
                    </CHEKIOButton>
                  ) : (
                    <>
                      <CHEKIOButton
                        type="button"
                        variant="secondary"
                        onClick={handleBackToEmployeeSelect}
                      >
                        {t("buttons.back")}
                      </CHEKIOButton>
                      <CHEKIOButton
                        type="button"
                        variant="secondary"
                        onClick={handleClose}
                        disabled={isPending}
                      >
                        <X className="h-4 w-4" />
                        {t("buttons.cancel")}
                      </CHEKIOButton>
                      <CHEKIOButton
                        type="submit"
                        variant="primary"
                        disabled={
                          isPending ||
                          !canCreate(
                            OrganizationPermissionCode.ASSIGNMENT_ABSENCE_OPERATIONS
                          )
                        }
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {submitButtonLoadingText}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            {submitButtonText}
                          </>
                        )}
                      </CHEKIOButton>
                    </>
                  )}
                </div>
                </form>
              </div>
            )}

            {/* Selected Employees */}
            <div className={isComplete ? "col-span-5" : "col-span-3"}>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 py-2 px-4 border-b flex justify-between items-center">
                  <h3 className="font-medium">
                    {t("selectedEmployees.title")} ({selectedEmployees.length})
                  </h3>
                </div>
                {isPending || isComplete ? (
                  processingItems.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-600 font-medium">
                        {t("selectedEmployees.noProcessing")}
                      </p>
                    </div>
                  ) : (
                    <CHEKIOTable>
                      <CHEKIOTableHeader>
                        <tr>
                          <CHEKIOTableHead>
                            {t("table.headers.employee")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {t("table.headers.documentNumber")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {t("table.headers.absenceType")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {t("table.headers.startDate")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {t("table.headers.endDate")}
                          </CHEKIOTableHead>
                          <CHEKIOTableHead>
                            {t("table.headers.status")}
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
                              {item.absenceType}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>{item.startDate}</CHEKIOTableCell>
                            <CHEKIOTableCell>{item.endDate}</CHEKIOTableCell>
                            <CHEKIOTableCell>
                              {item.status === "pending" && (
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                  {t("table.status.pending")}
                                </span>
                              )}
                              {item.status === "processing" && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  {t("table.status.processing")}
                                </span>
                              )}
                              {item.status === "success" && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {t("table.status.completed")}
                                </span>
                              )}
                              {item.status === "error" && (
                                <div className="flex flex-col">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                    <X className="w-3 h-3" />
                                    {t("table.status.error")}
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
                  )
                ) : selectedEmployees.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-600 font-medium">
                      {t("selectedEmployees.noSelected")}
                    </p>
                  </div>
                ) : (
                  <CHEKIOTable>
                    <CHEKIOTableHeader>
                      <tr>
                        <CHEKIOTableHead>
                          {t("table.headers.employee")}
                        </CHEKIOTableHead>
                        <CHEKIOTableHead>
                          {t("table.headers.documentNumber")}
                        </CHEKIOTableHead>
                      </tr>
                    </CHEKIOTableHeader>
                    <CHEKIOTableBody>
                      {selectedEmployees.map((employee, index) => (
                        <CHEKIOTableRow key={employee.publicId} index={index}>
                          <CHEKIOTableCell>
                            {employee.firstName} {employee.lastName}
                          </CHEKIOTableCell>
                          <CHEKIOTableCell>
                            {employee.documentNumber}
                          </CHEKIOTableCell>
                        </CHEKIOTableRow>
                      ))}
                    </CHEKIOTableBody>
                  </CHEKIOTable>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </CHEKIOModal>
  );
};

export default BatchAbsenceModal;
