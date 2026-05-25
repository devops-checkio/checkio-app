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
  CHEKIOTab,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
  CHEKIOTabs,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { PaginationFilterDto } from "@/dto/pagination";
import { useSchedulesTour } from "@/hooks/useSchedulesTour";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteSchedule,
  useGetScheduleCounts,
  useGetSchedules,
  useUpdateSchedule,
} from "@/service/schedule.service";
import { handleError } from "@/utils/error";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit,
  Eye,
  Hash,
  HelpCircle,
  Loader2,
  PlusCircle,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import SchedulePreviewModal from "./_components/schedule-preview-modal";
import {
  BreakType,
  MealBreakFilter,
  PersonType,
  ScheduleBreakResponseDto,
  ScheduleResponseDto,
  ScheduleUpdateDto,
} from "./_components/schedule.dto";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY_BLUE = "secondaryBlue",
  DESTRUCTIVE = "destructive",
  SECONDARY = "secondary",
  SEARCH = "search",
  REFRESH = "refresh",
}

enum TabScheduleStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

// Tipo para el formulario de filtros
type SearchFiltersForm = {
  name: string;
  code: string;
  hasMealBreak: "all" | "true" | "false";
  personType: "all" | "EMPLOYEE" | "STUDENT";
  createdAt: string | null;
};

function SchedulesContent() {
  const t = useTranslations("mantainers.schedules");
  const { toast } = useToast();
  const router = useRouter();
  const { companyId, canRead, canCreate, canUpdate, canDelete, getTemplateUser } =
    useCookieSession();
  const templateUser = getTemplateUser();
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewScheduleId, setPreviewScheduleId] = useState<string | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabScheduleStatus>(
    TabScheduleStatus.ACTIVE,
  );

  // React Hook Form para filtros
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<SearchFiltersForm>({
    defaultValues: {
      name: "",
      code: "",
      hasMealBreak: "all",
      personType: "all",
      createdAt: null,
    },
  });

  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "asc" as "asc" | "desc",
  });

  // Estado para los parámetros de búsqueda que se aplican solo al presionar buscar
  const [searchParams, setSearchParams] = useState({
    name: undefined as string | undefined,
    code: undefined as string | undefined,
    hasMealBreak: undefined as MealBreakFilter | undefined,
    personType: undefined as PersonType | undefined,
    createdAt: undefined as string | undefined,
  });

  const isActiveFilter = activeTab === TabScheduleStatus.ACTIVE ? true : false;

  const { data, isLoading, refetch } = useGetSchedules(
    {
      page: pagination.current,
      pageSize: pagination.pageSize,
      sort: pagination.sort,
      name: searchParams.name,
      code: searchParams.code,
      hasMealBreak: searchParams.hasMealBreak,
      personType: searchParams.personType,
      createdAt: searchParams.createdAt,
      isActive: isActiveFilter,
    },
    {
      includeBreaks: true,
      companyIds: companyId ? [companyId] : undefined,
    },
    { enabled: !!companyId }
  );

  const { data: countsData } = useGetScheduleCounts(companyId ?? undefined, {
    enabled: !!companyId,
  });

  const queryClient = useQueryClient();
  const { mutate: deleteSchedule, isPending: isDeletingSchedule } =
    useDeleteSchedule();
  const { mutate: updateSchedule } = useUpdateSchedule();
  const [togglingScheduleId, setTogglingScheduleId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data]);

  const handleOpenPreviewModal = (schedule: ScheduleResponseDto) => {
    setPreviewScheduleId(schedule.publicId);
    setIsPreviewModalOpen(true);
  };

  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setPreviewScheduleId(null);
  };

  const handleOpenEditPage = (schedule: ScheduleResponseDto) => {
    router.push(`/mantainers/schedules/${schedule.publicId}`);
  };

  const handleOpenCreatePage = () => {
    router.push("/mantainers/schedules/new");
  };

  const handleOpenDeleteModal = (publicId: string) => {
    setDeletingScheduleId(publicId);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingSchedule) {
      setIsDeleteModalOpen(false);
      setDeletingScheduleId(null);
      setDeleteError(null);
    }
  };

  const handleDelete = (publicId: string) => {
    setDeleteError(null);
    deleteSchedule(publicId, {
      onSuccess: () => {
        toast({
          title: t("delete.success.title"),
          description: t("delete.success.description"),
          variant: "default",
        });
        handleCloseDeleteModal();
        refetch();
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          t("delete.error.description");
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
      current: 1, // Reset to first page when changing page size
    }));
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabScheduleStatus);
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  }, []);

  const buildUpdatePayload = useCallback(
    (schedule: ScheduleResponseDto, isActive: boolean): ScheduleUpdateDto => ({
      publicId: schedule.publicId,
      code: schedule.code,
      name: schedule.name,
      personType: schedule.personType,
      startTime: schedule.startTime,
      workHours: schedule.workHours,
      workMinutes: schedule.workMinutes,
      discountMinutes: schedule.discountMinutes,
      integrationCode: schedule.integrationCode,
      isActive,
      companies: schedule.companies,
      ScheduleBreaks: schedule.ScheduleBreaks.map((b) => ({
        publicId: b.publicId ?? "",
        type: b.type,
        day: b.day,
        description: b.description,
        startTime: b.startTime,
        endTime: b.endTime,
        deductible: b.deductible,
      })),
    }),
    [],
  );

  const handleToggleActive = useCallback(
    (schedule: ScheduleResponseDto) => {
      setTogglingScheduleId(schedule.publicId);
      const payload = buildUpdatePayload(schedule, !schedule.isActive);
      updateSchedule(payload, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["GetScheduleCounts"] });
          refetch();
          toast({
            title: schedule.isActive
              ? t("buttons.deactivateSuccess")
              : t("buttons.activateSuccess"),
            variant: "default",
          });
        },
        onError: (error: unknown) => {
          handleError(error, toast);
        },
        onSettled: () => {
          setTogglingScheduleId(null);
        },
      });
    },
    [buildUpdatePayload, updateSchedule, queryClient, refetch, toast, t],
  );

  const schedules = data?.data || [];
  const paginationData = data?.pagination || pagination;

  const { startTour } = useSchedulesTour();
  const canShowTour = isLoading || schedules.length > 0;

  const handleSearch = () => {
    const formValues = getValues();

    // Actualizar los parámetros de búsqueda con los valores actuales del formulario
    const hasMealBreakValue =
      formValues.hasMealBreak === "all"
        ? undefined
        : formValues.hasMealBreak === "true"
          ? MealBreakFilter.WITH_MEAL
          : formValues.hasMealBreak === "false"
            ? MealBreakFilter.WITHOUT_MEAL
            : undefined;

    setSearchParams({
      name: formValues.name || undefined,
      code: formValues.code || undefined,
      hasMealBreak: hasMealBreakValue,
      personType:
        formValues.personType === "all"
          ? undefined
          : (formValues.personType as PersonType),
      createdAt: formValues.createdAt || undefined,
    });
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  const handleResetSearch = () => {
    reset({
      name: "",
      code: "",
      hasMealBreak: "all",
      personType: "all",
      createdAt: null,
    });
    // Limpiar los parámetros de búsqueda
    setSearchParams({
      name: undefined,
      code: undefined,
      hasMealBreak: undefined,
      personType: undefined,
      createdAt: undefined,
    });
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  // Remove automatic search - user must press search button

  const getBreakTime = (schedule: ScheduleResponseDto) => {
    const breakTimes = schedule.ScheduleBreaks.filter(
      (breakItem: ScheduleBreakResponseDto) =>
        breakItem.type === BreakType.LUNCH,
    );

    if (breakTimes.length > 0) {
      const totalDuration = breakTimes.reduce(
        (
          acc: { hours: number; minutes: number },
          breakItem: ScheduleBreakResponseDto,
        ) => {
          const startTime = DateTime.fromISO(breakItem.startTime);
          const endTime = DateTime.fromISO(breakItem.endTime);
          const duration = endTime.diff(startTime, ["hours", "minutes"]);
          return {
            hours: acc.hours + duration.hours,
            minutes: acc.minutes + duration.minutes,
          };
        },
        { hours: 0, minutes: 0 },
      );

      const normalizedHours =
        totalDuration.hours + Math.floor(totalDuration.minutes / 60);
      const normalizedMinutes = totalDuration.minutes % 60;

      return {
        hasBreak: true,
        time: `${normalizedHours
          .toString()
          .padStart(2, "0")}:${normalizedMinutes.toString().padStart(2, "0")}`,
      };
    }
    return { hasBreak: false, time: "00:00" };
  };

  const SCHEDULE_COLUMNS_EXCEL: HeaderMapping[] = [
    {
      attribute: "code",
      header: t("excel.headers.code"),
    },
    {
      attribute: "name",
      header: t("excel.headers.name"),
    },
    {
      attribute: "startTime",
      header: t("excel.headers.startTime"),
      render: (startTime: string) =>
        DateTime.fromISO(startTime).toUTC().toFormat("HH:mm"),
    },
    {
      attribute: "endTime",
      header: t("excel.headers.endTime"),
      render: (_: any, record: any) => {
        const start = DateTime.fromISO(record.startTime).toUTC();
        const hours = record.workHours || 0;
        const minutes = record.workMinutes || 0;
        const end = start.plus({ hours, minutes });
        return end.toFormat("HH:mm");
      },
    },
    {
      attribute: "days",
      header: t("excel.headers.days"),
      render: (_: any, record: any) => {
        const start = DateTime.fromISO(record.startTime);
        const hours = record.workHours || 0;
        const minutes = record.workMinutes || 0;
        const end = start.plus({ hours, minutes });

        if (end < start) {
          const diffInDays = end.diff(start, "days").days;
          return t("excel.days.multiple", { count: diffInDays });
        }
        return t("excel.days.single");
      },
    },
    {
      attribute: "workHours",
      header: t("excel.headers.workHours"),
      render: (_: any, record: any) => {
        return `${record.workHours || 0}h ${record.workMinutes || 0}m`;
      },
    },
    {
      attribute: "hasMealBreak",
      header: t("excel.headers.mealBreak"),
      render: (_: any, record: ScheduleResponseDto) => {
        const breakTime = getBreakTime(record);
        return breakTime.hasBreak
          ? t("excel.mealBreak.with", { time: breakTime.time })
          : t("excel.mealBreak.without");
      },
    },
    {
      attribute: "createdAt",
      header: t("excel.headers.createdAt"),
      render: (createdAt: string) =>
        DateTime.fromISO(createdAt).toFormat("dd/MM/yyyy HH:mm"),
    },
    {
      attribute: "updatedAt",
      header: t("excel.headers.updatedAt"),
      render: (updatedAt: string) =>
        DateTime.fromISO(updatedAt).toFormat("dd/MM/yyyy HH:mm"),
    },
  ];

  const toolbarButtons = (
    <div className="flex items-center gap-2">
      {canCreate(OrganizationPermissionCode.SCHEDULE_MAINTENANCE) && (
        <CHEKIOButton
          variant={ButtonVariant.PRIMARY}
          onClick={handleOpenCreatePage}
        >
          <PlusCircle className="h-4 w-4" />
          {t("buttons.add")}
        </CHEKIOButton>
      )}
      {canRead(OrganizationPermissionCode.SCHEDULE_MAINTENANCE) && (
        <CHEKIOButton
          variant="approve"
          onClick={() =>
            generateExcel(
              data?.data || [],
              SCHEDULE_COLUMNS_EXCEL,
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
      <CHEKIOHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[
          t("breadcrumbs.dashboard"),
          t("breadcrumbs.maintainers"),
          t("breadcrumbs.schedules"),
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
      <div className="mb-6" data-tour="schedules-tabs">
        <CHEKIOTabs value={activeTab} onValueChange={handleTabChange}>
          <CHEKIOTab
            value={TabScheduleStatus.ACTIVE}
            label={
              countsData
                ? t("tabs.activeWithCount", {
                    count: countsData.activeCount,
                  })
                : t("tabs.active")
            }
          />
          <CHEKIOTab
            value={TabScheduleStatus.INACTIVE}
            label={
              countsData
                ? t("tabs.inactiveWithCount", {
                    count: countsData.inactiveCount,
                  })
                : t("tabs.inactive")
            }
          />
        </CHEKIOTabs>
      </div>

      {/* Search Filters */}
      <div
        className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        data-tour="schedules-filters"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("filters.code")}
            </label>
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <CHEKIOInput
                  {...field}
                  value={field.value || ""}
                  placeholder={t("filters.codePlaceholder")}
                />
              )}
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("filters.name")}
            </label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <CHEKIOInput
                  {...field}
                  value={field.value || ""}
                  placeholder={t("filters.namePlaceholder")}
                />
              )}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("filters.mealBreak")}
            </label>
            <Controller
              name="hasMealBreak"
              control={control}
              render={({ field }) => (
                <CHEKIOSelect
                  value={field.value || "all"}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                >
                  <CHEKIOSelectTrigger>
                    <CHEKIOSelectValue
                      placeholder={t("filters.mealBreakOptions.all")}
                    />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    <CHEKIOSelectItem value="all">
                      {t("filters.mealBreakOptions.all")}
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem value="true">
                      {t("filters.mealBreakOptions.with")}
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem value="false">
                      {t("filters.mealBreakOptions.without")}
                    </CHEKIOSelectItem>
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              )}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de horario
            </label>
            <Controller
              name="personType"
              control={control}
              render={({ field }) => (
                <CHEKIOSelect
                  value={field.value || "all"}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                >
                  <CHEKIOSelectTrigger>
                    <CHEKIOSelectValue placeholder="Todos" />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    <CHEKIOSelectItem value="all">Todos</CHEKIOSelectItem>
                    <CHEKIOSelectItem value="EMPLOYEE">
                      Trabajador
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem value="STUDENT">
                      Estudiante
                    </CHEKIOSelectItem>
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              )}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("filters.createdAt")}
            </label>
            <Controller
              name="createdAt"
              control={control}
              render={({ field }) => (
                <CHEKIOInput
                  type="date"
                  value={
                    field.value
                      ? DateTime.fromISO(field.value).isValid
                        ? DateTime.fromISO(field.value).toFormat("yyyy-MM-dd")
                        : ""
                      : ""
                  }
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    if (dateValue) {
                      const dateTime = DateTime.fromISO(dateValue);
                      field.onChange(
                        dateTime.isValid ? dateTime.toISO() : null,
                      );
                    } else {
                      field.onChange(null);
                    }
                  }}
                />
              )}
            />
          </div>
          <div className="md:col-span-12 flex justify-end items-end gap-2">
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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {!companyId ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <Clock className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.selectCompany")}
            </p>
          </div>
        ) : isLoading ? (
          <>
            <div
              className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3"
              data-tour="schedules-toolbar"
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-[120px] animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-[150px] animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
            <div className="overflow-x-auto" data-tour="schedules-table">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Hash className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.code")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.name")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      Tipo
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.startTime")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.endTime")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.days")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.workHours")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      <span className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        COLACIÓN
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px] text-right">
                      {t("table.headers.actions")}
                    </CHEKIOTableHead>
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
                        <div className="h-4 w-14 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-14 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
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

            <div
              className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between"
              data-tour="schedules-pagination"
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
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <Clock className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
            {canCreate(OrganizationPermissionCode.SCHEDULE_MAINTENANCE) && (
              <CHEKIOButton
                variant={ButtonVariant.PRIMARY}
                onClick={handleOpenCreatePage}
                className="mt-6 gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                {t("buttons.add")}
              </CHEKIOButton>
            )}
          </div>
        ) : (
          <>
            <div
              className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3"
              data-tour="schedules-toolbar"
            >
              {toolbarButtons}
            </div>
            <div className="overflow-x-auto" data-tour="schedules-table">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Hash className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.code")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.name")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      Tipo
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.startTime")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.endTime")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.days")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.workHours")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      <span className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        COLACIÓN
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      Estado
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px] text-right">
                      {t("table.headers.actions")}
                    </CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {schedules.map(
                  (schedule: ScheduleResponseDto, index: number) => {
                    const start = DateTime.fromISO(schedule.startTime).toUTC();
                    const hours = schedule.workHours || 0;
                    const minutes = schedule.workMinutes || 0;
                    const end = start.plus({ hours, minutes });
                    const breakTime = getBreakTime(schedule);

                    return (
                      <CHEKIOTableRow key={schedule.publicId} index={index}>
                        <CHEKIOTableCell className="px-5 py-3.5 font-mono text-sm font-medium text-gray-900">
                          {schedule.code}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                          {schedule.name}
                        </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-700">
                      {schedule.personType === PersonType.STUDENT
                        ? "Estudiante"
                        : "Trabajador"}
                    </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {start.toFormat("HH:mm")}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {end.toFormat("HH:mm")}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {end < start
                            ? t("table.days.multiple", {
                                count: end.diff(start, "days").days,
                              })
                            : t("table.days.single")}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {`${hours.toString().padStart(2, "0")}:${minutes
                            .toString()
                            .padStart(2, "0")}`}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {breakTime.hasBreak ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium text-green-700">
                                  {t("table.mealBreak.with")}
                                </span>
                                <span className="text-sm text-gray-600">
                                  ({breakTime.time})
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <X className="h-4 w-4 text-red-500" />
                                <span className="text-sm font-medium text-red-700">
                                  {t("table.mealBreak.without")}
                                </span>
                              </div>
                            )}
                          </div>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              schedule.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {schedule.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate(
                              OrganizationPermissionCode.SCHEDULE_MAINTENANCE,
                            ) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPage(schedule)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                  title={t("buttons.edit")}
                                  aria-label={t("ariaLabels.editSchedule")}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(schedule)}
                                  disabled={
                                    togglingScheduleId === schedule.publicId
                                  }
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-50"
                                  title={
                                    schedule.isActive
                                      ? t("buttons.deactivate")
                                      : t("buttons.activate")
                                  }
                                  aria-label={
                                    schedule.isActive
                                      ? t("ariaLabels.deactivateSchedule")
                                      : t("ariaLabels.activateSchedule")
                                  }
                                >
                                  {togglingScheduleId === schedule.publicId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : schedule.isActive ? (
                                    <PowerOff className="h-4 w-4" />
                                  ) : (
                                    <Power className="h-4 w-4" />
                                  )}
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenPreviewModal(schedule)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                              title={t("buttons.view")}
                              aria-label={t("ariaLabels.viewSchedule")}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {canDelete(
                              OrganizationPermissionCode.SCHEDULE_MAINTENANCE,
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDeleteModal(schedule.publicId)
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                title={t("buttons.delete")}
                                aria-label={t("ariaLabels.deleteSchedule")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </CHEKIOTableCell>
                      </CHEKIOTableRow>
                    );
                  },
                )}
              </CHEKIOTableBody>
            </CHEKIOTable>
            </div>

            <div
              className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between"
              data-tour="schedules-pagination"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: schedules.length,
                    total: paginationData.totalCount,
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
                  onClick={() => handlePageChange(paginationData.current - 1)}
                  disabled={paginationData.current === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("pagination.previous")}
                </CHEKIOButton>
                <span className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                  {t("pagination.page", {
                    current: paginationData.current,
                    total: paginationData.totalPages,
                  })}
                </span>
                <CHEKIOButton
                  variant={ButtonVariant.SECONDARY_BLUE}
                  onClick={() => handlePageChange(paginationData.current + 1)}
                  disabled={paginationData.current >= paginationData.totalPages}
                >
                  {t("pagination.next")}
                  <ChevronRight className="h-4 w-4" />
                </CHEKIOButton>
              </div>
            </div>
          </>
        )}
      </div>
      {isPreviewModalOpen && (
        <SchedulePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={handleClosePreviewModal}
          publicId={previewScheduleId}
        />
      )}
      {canDelete(OrganizationPermissionCode.SCHEDULE_MAINTENANCE) && (
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
                disabled={isDeletingSchedule}
              >
                <X className="h-4 w-4" />
                {t("buttons.cancel")}
              </CHEKIOButton>
              <CHEKIOButton
                variant={ButtonVariant.DESTRUCTIVE}
                onClick={() => {
                  if (deletingScheduleId) {
                    handleDelete(deletingScheduleId);
                  }
                }}
                disabled={isDeletingSchedule}
              >
                {isDeletingSchedule ? (
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

export default function SchedulesPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.SCHEDULE_MAINTENANCE
      }
    >
      <SchedulesContent />
    </AccessNotGranted>
  );
}
