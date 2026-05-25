"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import ShiftCycleDetailModal from "@/app/[locale]/operations/shift/_components/shift-cycle-detail-modal";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useToast } from "@/hooks/use-toast";
import { useShiftsTour } from "@/hooks/useShiftsTour";
import { useDeleteShift, useGetShifts } from "@/service/shift.service";
import { handleError } from "@/utils/error";
import { HeaderMapping, generateExcel } from "@/utils/excel";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Hash,
  HelpCircle,
  LayoutGrid,
  Loader2,
  Pencil,
  PlusCircle,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  RotationType,
  ShiftResponseDto,
  ShiftSortBy,
} from "./_components/shifth.dto";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY_BLUE = "secondaryBlue",
  DESTRUCTIVE = "destructive",
  SECONDARY = "secondary",
  SEARCH = "search",
  REFRESH = "refresh",
}

// Tipo para el formulario de filtros
type SearchFiltersForm = {
  name: string;
  type: RotationType | undefined;
  days: number | undefined;
  weeks: number | undefined;
};

function ShiftsContent() {
  const t = useTranslations("mantainers.shifts");
  const { startTour } = useShiftsTour();
  const { toast } = useToast();
  const router = useRouter();
  const { mutate: deleteShift, isPending: isDeletingShift } = useDeleteShift();
  const {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    getTemplateUser,
    companyId,
  } = useCookieSession();
  const templateUser = getTemplateUser();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingShiftId, setDeletingShiftId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [sortBy, setSortBy] = useState<ShiftSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [shiftCycleModalId, setShiftCycleModalId] = useState<string | null>(
    null,
  );

  // React Hook Form para filtros
  const { control, reset, watch } = useForm<SearchFiltersForm>({
    defaultValues: {
      name: "",
      type: undefined,
      days: undefined,
      weeks: undefined,
    },
  });

  // Obtener valores actuales del formulario para la consulta
  const formValues = watch();

  // Estado para los parámetros de búsqueda que se aplican solo al presionar buscar
  const [searchParams, setSearchParams] = useState({
    name: undefined as string | undefined,
    type: undefined as RotationType | undefined,
    days: undefined as number | undefined,
    weeks: undefined as number | undefined,
  });

  const { data, isLoading, refetch } = useGetShifts({
    page,
    pageSize,
    sort: "desc",
    sortBy,
    sortOrder,
    name: searchParams.name,
    type: searchParams.type,
    day: searchParams.days,
    week: searchParams.weeks,
    companyId: companyId || undefined,
  });

  const showShiftActionsColumn =
    canRead(OrganizationPermissionCode.SHIFT_MAINTENANCE) ||
    canUpdate(OrganizationPermissionCode.SHIFT_MAINTENANCE) ||
    canDelete(OrganizationPermissionCode.SHIFT_MAINTENANCE);

  const handleOpenModal = (shift?: ShiftResponseDto) => {
    router.push(`/mantainers/shifts/editor/${shift?.publicId}`);
  };

  const handleCreateShift = () => {
    router.push(`/mantainers/shifts/editor`);
  };

  const handleOpenDeleteModal = (publicId: string) => {
    setDeletingShiftId(publicId);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingShift) {
      setIsDeleteModalOpen(false);
      setDeletingShiftId(null);
      setDeleteError(null);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteError(null);
    deleteShift(id, {
      onSuccess: () => {
        toast({
          title: t("toast.deleteSuccess.title"),
          variant: "default",
        });
        handleCloseDeleteModal();
        refetch();
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          t("toast.deleteError.description");
        setDeleteError(errorMessage);
        handleError(error, toast);
      },
    });
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const handleSort = useCallback(
    (column: ShiftSortBy) => {
      if (sortBy === column) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(column);
        setSortOrder("asc");
      }
      setPage(1);
    },
    [sortBy],
  );

  const handleDownloadExcel = async () => {
    if (!filteredShifts.length) return;

    try {
      setIsGeneratingExcel(true);
      await generateExcel(
        filteredShifts,
        SHIFT_COLUMNS_EXCEL,
        t("excel.filename"),
        t("excel.sheetName"),
      );
      toast({
        title: t("toast.excelSuccess.title"),
        variant: "default",
      });
    } catch (error) {
      console.error("Error downloading excel:", error);
      toast({
        title: t("toast.excelError.title"),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const handleSearch = () => {
    // Actualizar los parámetros de búsqueda con los valores actuales del formulario
    setSearchParams({
      name: formValues.name || undefined,
      type: formValues.type,
      days: formValues.days,
      weeks: formValues.weeks,
    });
    setPage(1);
  };

  const handleResetSearch = () => {
    reset();
    // Limpiar los parámetros de búsqueda
    setSearchParams({
      name: undefined,
      type: undefined,
      days: undefined,
      weeks: undefined,
    });
    setPage(1);
  };

  const shifts = data?.data || [];
  const filteredShifts = useMemo(() => {
    if (!companyId) return shifts;
    return shifts.filter((shift) => {
      // Si backend ya filtró por companyId pero no envía el arreglo companies,
      // no descartamos el registro para evitar dejar la tabla vacía.
      if (!Array.isArray(shift.companies)) return true;
      return shift.companies.includes(companyId);
    });
  }, [shifts, companyId]);
  const pagination = data?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const SHIFT_COLUMNS_EXCEL: HeaderMapping[] = [
    {
      attribute: "name",
      header: t("excel.headers.name"),
    },
    {
      attribute: "type",
      header: t("excel.headers.type"),
      render: (type: string) => {
        return type === RotationType.WEEKLY
          ? t("table.type.weekly")
          : t("table.type.daily");
      },
    },
    {
      attribute: "days",
      header: t("excel.headers.days"),
    },
    {
      attribute: "weeks",
      header: t("excel.headers.weeks"),
    },
    {
      attribute: "createdAt",
      header: t("excel.headers.createdAt"),
      render: (createdAt: string) =>
        DateTime.fromISO(createdAt).toFormat("dd/MM/yyyy"),
    },
    {
      attribute: "updatedAt",
      header: t("excel.headers.updatedAt"),
      render: (updatedAt: string) =>
        DateTime.fromISO(updatedAt).toFormat("dd/MM/yyyy"),
    },
  ];

  const SortableHead = ({
    column,
    label,
    icon: Icon,
    className,
  }: {
    column: ShiftSortBy;
    label: string;
    icon: React.ComponentType<{
      className?: string;
      style?: React.CSSProperties;
    }>;
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

  const canShowTour = isLoading || filteredShifts.length > 0;

  const toolbarButtons = (
    <div className="flex items-center gap-2">
      {canCreate(OrganizationPermissionCode.SHIFT_MAINTENANCE) && (
        <CHEKIOButton
          variant={ButtonVariant.PRIMARY}
          onClick={handleCreateShift}
        >
          <PlusCircle className="h-4 w-4" />
          {t("buttons.add")}
        </CHEKIOButton>
      )}
      {canRead(OrganizationPermissionCode.SHIFT_MAINTENANCE) && (
        <CHEKIOButton
          variant="approve"
          onClick={handleDownloadExcel}
          disabled={isGeneratingExcel || !filteredShifts.length}
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

  return (
    <>
      <CHEKIOHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[
          t("breadcrumbs.dashboard"),
          t("breadcrumbs.maintainers"),
          t("breadcrumbs.shifts"),
        ]}
        actions={
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={() => startTour()}
            disabled={!canShowTour}
            title={!canShowTour ? t("table.noDataDescription") : undefined}
          >
            <HelpCircle className="h-4 w-4" />
            {t("tour.startButton")}
          </CHEKIOButton>
        }
      />
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Filtros y toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50/50 p-4 md:flex-row md:items-end md:justify-between">
          <div
            className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-12 md:items-end"
            data-tour="shifts-filters"
          >
            <div className="sm:col-span-2 md:col-span-3">
              <label
                htmlFor="filter-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t("search.fields.name")}
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <CHEKIOInput
                    id="filter-name"
                    placeholder={t("search.placeholders.name")}
                    value={field.value}
                    onChange={field.onChange}
                    className="w-full"
                  />
                )}
              />
            </div>
            <div className="sm:col-span-1 md:col-span-2">
              <label
                htmlFor="filter-type"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t("search.fields.type")}
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <CHEKIOSelect
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <CHEKIOSelectTrigger className="w-full">
                      <CHEKIOSelectValue
                        placeholder={t("search.placeholders.type")}
                      />
                    </CHEKIOSelectTrigger>
                    <CHEKIOSelectContent>
                      <CHEKIOSelectItem value={RotationType.WEEKLY}>
                        {t("search.options.weekly")}
                      </CHEKIOSelectItem>
                      <CHEKIOSelectItem value={RotationType.DAILY}>
                        {t("search.options.daily")}
                      </CHEKIOSelectItem>
                    </CHEKIOSelectContent>
                  </CHEKIOSelect>
                )}
              />
            </div>
            <div className="sm:col-span-1 md:col-span-2">
              <label
                htmlFor="filter-days"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t("search.fields.days")}
              </label>
              <Controller
                name="days"
                control={control}
                render={({ field }) => (
                  <CHEKIOInput
                    id="filter-days"
                    type="number"
                    placeholder={t("search.placeholders.days")}
                    value={field.value?.toString() || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseInt(value) : undefined);
                    }}
                    className="w-full"
                  />
                )}
              />
            </div>
            <div className="sm:col-span-1 md:col-span-2">
              <label
                htmlFor="filter-weeks"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t("search.fields.weeks")}
              </label>
              <Controller
                name="weeks"
                control={control}
                render={({ field }) => (
                  <CHEKIOInput
                    id="filter-weeks"
                    type="number"
                    placeholder={t("search.placeholders.weeks")}
                    value={field.value?.toString() || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseInt(value) : undefined);
                    }}
                    className="w-full"
                  />
                )}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2 md:col-span-3">
              <CHEKIOButton
                variant={ButtonVariant.REFRESH}
                onClick={handleResetSearch}
              >
                <X className="h-4 w-4" />
                {t("buttons.clear")}
              </CHEKIOButton>
              <CHEKIOButton
                variant={ButtonVariant.SEARCH}
                onClick={handleSearch}
              >
                <Search className="h-4 w-4" />
                {t("buttons.search")}
              </CHEKIOButton>
            </div>
          </div>
          <div
            className="flex shrink-0 items-center gap-2"
            data-tour="shifts-toolbar"
          >
            {toolbarButtons}
          </div>
        </div>
        {isLoading ? (
          <div className="animate-content-fade-in">
            <div className="overflow-x-auto" data-tour="shifts-table">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[180px]">
                      {t("table.headers.name")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      {t("table.headers.type")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[80px]">
                      {t("table.headers.days")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[80px]">
                      {t("table.headers.weeks")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      {t("table.headers.createdAt")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      {t("table.headers.updatedAt")}
                    </CHEKIOTableHead>
                    {showShiftActionsColumn && (
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
                        <Skeleton className="h-4 w-36 rounded" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-4 w-20 rounded" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-4 w-8 rounded" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-4 w-8 rounded" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-4 w-20 rounded" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-4 w-20 rounded" />
                      </CHEKIOTableCell>
                      {showShiftActionsColumn && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                          </div>
                        </CHEKIOTableCell>
                      )}
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
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
          </div>
        ) : filteredShifts.length === 0 ? (
          <div className="animate-content-fade-in flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <RotateCcw className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
            {canCreate(OrganizationPermissionCode.SHIFT_MAINTENANCE) && (
              <CHEKIOButton
                variant={ButtonVariant.PRIMARY}
                onClick={handleCreateShift}
                className="mt-6 gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                {t("buttons.add")}
              </CHEKIOButton>
            )}
          </div>
        ) : (
          <div className="animate-content-fade-in">
            <div className="overflow-x-auto" data-tour="shifts-table">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <SortableHead
                      column="name"
                      label={t("table.headers.name")}
                      icon={Hash}
                      className="min-w-[180px]"
                    />
                    <SortableHead
                      column="type"
                      label={t("table.headers.type")}
                      icon={RotateCcw}
                      className="min-w-[120px]"
                    />
                    <SortableHead
                      column="days"
                      label={t("table.headers.days")}
                      icon={Hash}
                      className="min-w-[80px]"
                    />
                    <SortableHead
                      column="weeks"
                      label={t("table.headers.weeks")}
                      icon={Hash}
                      className="min-w-[80px]"
                    />
                    <SortableHead
                      column="createdAt"
                      label={t("table.headers.createdAt")}
                      icon={Calendar}
                      className="min-w-[120px]"
                    />
                    <SortableHead
                      column="updatedAt"
                      label={t("table.headers.updatedAt")}
                      icon={Calendar}
                      className="min-w-[120px]"
                    />
                    {showShiftActionsColumn && (
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {filteredShifts.map(
                    (shift: ShiftResponseDto, index: number) => (
                      <CHEKIOTableRow key={shift.publicId} index={index}>
                        <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                          {shift.name}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {shift.type === RotationType.WEEKLY
                            ? t("table.type.weekly")
                            : t("table.type.daily")}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {shift.days}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {shift.weeks}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {DateTime.fromISO(
                            typeof shift.createdAt === "string"
                              ? shift.createdAt
                              : shift.createdAt.toISOString(),
                          ).toFormat("dd/MM/yyyy")}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {DateTime.fromISO(
                            typeof shift.updatedAt === "string"
                              ? shift.updatedAt
                              : shift.updatedAt.toISOString(),
                          ).toFormat("dd/MM/yyyy")}
                        </CHEKIOTableCell>
                        {showShiftActionsColumn && (
                          <CHEKIOTableCell className="px-5 py-3.5 text-right">
                            <div className="flex justify-end gap-1">
                              {canRead(
                                OrganizationPermissionCode.SHIFT_MAINTENANCE,
                              ) && (
                                <CHEKIOButton
                                  type="button"
                                  variant={ButtonVariant.SECONDARY_BLUE}
                                  className="h-8 w-8 shrink-0 p-0"
                                  onClick={() =>
                                    setShiftCycleModalId(shift.publicId)
                                  }
                                  title={t("buttons.viewCycle")}
                                  aria-label={t("ariaLabels.viewShiftCycle")}
                                >
                                  <LayoutGrid className="h-4 w-4" />
                                </CHEKIOButton>
                              )}
                              {canUpdate(
                                OrganizationPermissionCode.SHIFT_MAINTENANCE,
                              ) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenModal(shift)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                  title={t("buttons.edit")}
                                  aria-label={t("ariaLabels.editShift")}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              {canDelete(
                                OrganizationPermissionCode.SHIFT_MAINTENANCE,
                              ) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenDeleteModal(shift.publicId)
                                  }
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                  title={t("buttons.delete")}
                                  aria-label={t("ariaLabels.deleteShift")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </CHEKIOTableCell>
                        )}
                      </CHEKIOTableRow>
                    ),
                  )}
                </CHEKIOTableBody>
              </CHEKIOTable>

              {filteredShifts.length > 0 && (
                <div
                  className="flex flex-col border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between gap-4"
                  data-tour="shifts-pagination"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      {t("pagination.showing", {
                        current: filteredShifts.length,
                        total: pagination.totalCount,
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="whitespace-nowrap text-sm font-medium text-gray-700">
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
                      variant={ButtonVariant.SECONDARY_BLUE}
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t("pagination.previous")}
                    </CHEKIOButton>
                    <div className="rounded border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
                      {t("pagination.page", {
                        current: pagination.current,
                        total: pagination.totalPages,
                      })}
                    </div>
                    <CHEKIOButton
                      variant={ButtonVariant.SECONDARY_BLUE}
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= pagination.totalPages}
                    >
                      {t("pagination.next")}
                      <ChevronRight className="h-4 w-4" />
                    </CHEKIOButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {canDelete(OrganizationPermissionCode.SHIFT_MAINTENANCE) && (
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
                disabled={isDeletingShift}
              >
                <X className="h-4 w-4" />
                {t("buttons.cancel")}
              </CHEKIOButton>
              <CHEKIOButton
                variant={ButtonVariant.DESTRUCTIVE}
                onClick={() => {
                  if (deletingShiftId) {
                    handleDelete(deletingShiftId);
                  }
                }}
                disabled={isDeletingShift}
              >
                {isDeletingShift ? (
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

      <ShiftCycleDetailModal
        isOpen={!!shiftCycleModalId}
        onClose={() => setShiftCycleModalId(null)}
        shiftPublicId={shiftCycleModalId}
      />
    </>
  );
}

export default function ShiftsPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.SHIFT_MAINTENANCE}
    >
      <ShiftsContent />
    </AccessNotGranted>
  );
}
