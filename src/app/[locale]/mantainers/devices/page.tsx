"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import ModalDelete from "@/app/[locale]/_components/modal-delete";
import {
  CHEKIOButton,
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
import {
  useDeleteDevice,
  useGetDevices,
} from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CalendarPlus,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hash,
  Layers,
  Monitor,
  Pencil,
  Plus,
  QrCode,
  Smartphone,
  Tablet,
  Trash2,
  XCircle,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  DeviceFindAllDto,
  DeviceResponseDto,
  DeviceSortBy,
  DeviceType,
} from "./_components/device.dto";
import ModalDeviceQr from "./_components/modal-device-qr";
import DeviceModalUpsert from "./_components/modal-device-upsert";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY_BLUE = "secondaryBlue",
}

function getDeviceOsIcon(os?: string): React.ReactNode {
  const osLower = (os || "").toLowerCase();
  if (osLower.includes("android")) {
    return (
      <svg
        className="h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="#3DDC84"
        aria-hidden
      >
        <path d="M17.523 2.047a.5.5 0 0 0-.472.044l-.5.29a.5.5 0 0 0-.223.67.5.5 0 0 0 .67.223l.5-.29a.5.5 0 0 0 .236-.894zM6.477 2.047a.5.5 0 0 1 .472.044l.5.29a.5.5 0 0 1 .223.67.5.5 0 0 1-.67.223l-.5-.29a.5.5 0 0 1-.236-.894zM12 5.136a7 7 0 0 0-6.996 6.864H1a.5.5 0 0 0 0 1h2.004a7 7 0 0 0 13.992 0H23a.5.5 0 0 0 0-1h-2.004A7 7 0 0 0 12 5.136zM8.5 15a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zm7 0a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z" />
      </svg>
    );
  }
  if (osLower.includes("ios") || osLower.includes("iphone")) {
    return (
      <svg
        className="h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="#555"
        aria-hidden
      >
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    );
  }
  return <Smartphone className="h-5 w-5 shrink-0 text-gray-400" />;
}

function DevicesContent() {
  const t = useTranslations("mantainers.devices");
  const { toast } = useToast();
  const { canCreate, canUpdate, canDelete, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceResponseDto | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceResponseDto | null>(
    null,
  );
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [claimCodeFromCreate, setClaimCodeFromCreate] = useState<
    string | null
  >(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<DeviceSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { mutate: deleteDevice, isPending: isDeletingDevice } =
    useDeleteDevice();

  const {
    data: devicesData,
    isLoading,
    refetch: refetchDevices,
  } = useGetDevices({
    page,
    pageSize,
    sort: "desc",
    sortBy,
    sortOrder,
  } as DeviceFindAllDto);

  useEffect(() => {
    if (refetchTrigger > 0) {
      refetchDevices();
    }
  }, [refetchTrigger, refetchDevices]);

  const handleOpenModal = (device?: DeviceResponseDto) => {
    if (device) {
      setEditingDevice(device);
    } else {
      setEditingDevice(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDevice(null);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingDeviceId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingDevice) {
      setIsDeleteModalOpen(false);
      setDeletingDeviceId(null);
    }
  };

  const handleOpenQrModal = (device: DeviceResponseDto) => {
    setSelectedDevice(device);
    setQrCode(null);
    setClaimCodeFromCreate(null);
    setQrModalOpen(true);
  };

  const handleCloseQrModal = () => {
    setQrModalOpen(false);
    setSelectedDevice(null);
    setQrCode(null);
    setClaimCodeFromCreate(null);
  };

  const handleOpenQrModalFromCreate = (response: DeviceResponseDto) => {
    setSelectedDevice(response);
    setQrCode(response.qrCode ?? null);
    setClaimCodeFromCreate(response.claimCode ?? null);
    setQrModalOpen(true);
  };

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const handleDelete = (id: string) => {
    deleteDevice(id, {
      onSuccess: () => {
        toast({
          title: t("delete.toastTitle"),
          description: t("delete.toastDescription"),
        });
        handleCloseDeleteModal();
        refetch();
      },
      onError: (error) => {
        handleError(error, toast);
      },
    });
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleSort = useCallback(
    (column: DeviceSortBy) => {
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

  const devices = devicesData?.data || [];
  const pagination = devicesData?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const addDeviceButton = canCreate(
    OrganizationPermissionCode.DEVICE_MAINTENANCE
  ) ? (
    <CHEKIOButton
      variant={ButtonVariant.PRIMARY}
      onClick={() => handleOpenModal()}
      className="gap-2"
    >
      <Plus className="h-4 w-4" />
      {t("buttons.add")}
    </CHEKIOButton>
  ) : null;

  const SortableHead = ({
    column,
    label,
    icon: Icon,
    className,
  }: {
    column: DeviceSortBy;
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
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="animate-content-fade-in">
            <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3">
              <Skeleton className="h-10 w-28 rounded-md" />
            </div>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[140px]">
                      {t("table.headers.identifier")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.type")}</CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[160px]">
                      {t("table.headers.device")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      {t("table.headers.branch")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.createdAt")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{t("table.headers.updatedAt")}</CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      {t("table.headers.status")}
                    </CHEKIOTableHead>
                    {(canUpdate(OrganizationPermissionCode.DEVICE_MAINTENANCE) ||
                      canDelete(OrganizationPermissionCode.DEVICE_MAINTENANCE)) && (
                      <CHEKIOTableHead className="min-w-[120px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <CHEKIOTableRow key={index} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-4 w-24 rounded" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-6 w-20 rounded-md" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-5 w-5 shrink-0 rounded" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24 rounded" />
                            <Skeleton className="h-3 w-16 rounded" />
                          </div>
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-4 w-20 rounded" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-4 w-20 rounded" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-4 w-24 rounded" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </CHEKIOTableCell>
                      {(canUpdate(OrganizationPermissionCode.DEVICE_MAINTENANCE) ||
                        canDelete(OrganizationPermissionCode.DEVICE_MAINTENANCE)) && (
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
        ) : devices.length === 0 ? (
          <div className="animate-content-fade-in flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <Smartphone className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
            {addDeviceButton && (
              <CHEKIOButton
                variant={ButtonVariant.PRIMARY}
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
            <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3">
              {addDeviceButton}
            </div>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <SortableHead
                      column="identifier"
                      label={t("table.headers.identifier")}
                      icon={Hash}
                      className="min-w-[140px]"
                    />
                    <SortableHead
                      column="type"
                      label={t("table.headers.type")}
                      icon={Layers}
                    />
                    <CHEKIOTableHead className="min-w-[160px]">
                      <span className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                        {t("table.headers.device")}
                      </span>
                    </CHEKIOTableHead>
                    <SortableHead
                      column="branchName"
                      label={t("table.headers.branch")}
                      icon={Building2}
                    />
                    <SortableHead
                      column="createdAt"
                      label={t("table.headers.createdAt")}
                      icon={CalendarPlus}
                    />
                    <SortableHead
                      column="updatedAt"
                      label={t("table.headers.updatedAt")}
                      icon={Clock}
                    />
                    <SortableHead
                      column="isOnline"
                      label={t("table.headers.status")}
                      icon={Activity}
                    />
                    {(canUpdate(OrganizationPermissionCode.DEVICE_MAINTENANCE) ||
                      canDelete(OrganizationPermissionCode.DEVICE_MAINTENANCE)) && (
                      <CHEKIOTableHead className="min-w-[120px] text-right">
                        <span className="flex items-center justify-end gap-2">
                          {t("table.headers.actions")}
                        </span>
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {devices.map((device: DeviceResponseDto) => (
                    <CHEKIOTableRow key={device.publicId} index={1}>
                      <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                        <span
                          className="block max-w-[140px] truncate font-mono text-sm"
                          title={device.identifier || undefined}
                        >
                          {device.identifier || "-"}
                        </span>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                            device.type === DeviceType.MACHINE
                              ? "border-indigo-100 bg-indigo-50 text-indigo-700"
                              : "border-violet-100 bg-violet-50 text-violet-700"
                          }`}
                        >
                          {device.type === DeviceType.MACHINE ? (
                            <Monitor className="h-3.5 w-3.5" />
                          ) : (
                            <Tablet className="h-3.5 w-3.5" />
                          )}
                          {device.type === DeviceType.MACHINE
                            ? t("upsert.types.MACHINE")
                            : device.type === DeviceType.KIOSKO
                              ? t("upsert.types.KIOSKO")
                              : device.type}
                        </span>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {getDeviceOsIcon(device.metadata?.os)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {device.metadata?.model || "-"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {device.metadata?.brand || "-"}
                            </p>
                          </div>
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-gray-600">
                        <span className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
                          {device.branch?.name || "-"}
                        </span>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {DateTime.fromISO(
                          typeof device.createdAt === "string"
                            ? device.createdAt
                            : device.createdAt.toISOString()
                        ).toFormat("dd/MM/yyyy")}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {DateTime.fromISO(
                          typeof device.updatedAt === "string"
                            ? device.updatedAt
                            : device.updatedAt.toISOString()
                        ).toFormat("dd/MM/yyyy HH:mm")}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                            device.isOnline
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {device.isOnline ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {device.isOnline
                            ? t("status.operational")
                            : t("status.notOperational")}
                        </span>
                      </CHEKIOTableCell>
                    {(canUpdate(OrganizationPermissionCode.DEVICE_MAINTENANCE) ||
                      canDelete(OrganizationPermissionCode.DEVICE_MAINTENANCE)) && (
                      <CHEKIOTableCell className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          {canUpdate(OrganizationPermissionCode.DEVICE_MAINTENANCE) && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenModal(device)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                title={t("buttons.edit")}
                                aria-label={t("buttons.edit")}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenQrModal(device)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                                title={
                                  device.type === DeviceType.KIOSKO
                                    ? t("buttons.claimCode")
                                    : t("buttons.qr")
                                }
                                aria-label={
                                  device.type === DeviceType.KIOSKO
                                    ? t("buttons.claimCode")
                                    : t("buttons.qr")
                                }
                              >
                                <QrCode className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {canDelete(OrganizationPermissionCode.DEVICE_MAINTENANCE) && (
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(device.publicId)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                              title={t("buttons.delete")}
                              aria-label={t("buttons.delete")}
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

            <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {t("pagination.showing", {
                    current: devices.length,
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
                  variant={ButtonVariant.SECONDARY_BLUE}
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
                  variant={ButtonVariant.SECONDARY_BLUE}
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
        <DeviceModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingDevice={editingDevice}
          onSuccess={() => refetch()}
          onDeviceCreated={(qrCodeValue) => {
            handleCloseModal();
            handleOpenQrModalFromCreate(qrCodeValue);
          }}
        />
      )}

      <ModalDelete
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={() => {
          if (deletingDeviceId) {
            return handleDelete(deletingDeviceId);
          }
          return Promise.resolve();
        }}
        message={t("delete.confirmMessage")}
      />

      {qrModalOpen && selectedDevice && (
        <ModalDeviceQr
          isOpen={qrModalOpen}
          onClose={handleCloseQrModal}
          selectedDevice={selectedDevice}
          qrCode={qrCode || undefined}
          claimCodeFromCreate={claimCodeFromCreate || undefined}
        />
      )}
    </>
  );
}

export default function DevicesPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.DEVICE_MAINTENANCE}
    >
      <DevicesContent />
    </AccessNotGranted>
  );
}
