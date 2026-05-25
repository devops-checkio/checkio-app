"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
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
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteUser,
  useGetRoles,
  useGetUsers,
} from "@/service/auths.service";
import { handleError } from "@/utils/error";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import {
  AlertCircle,
  AtSign,
  Calendar,
  CalendarPlus,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import UserModalUpsert from "./_components/user-modal-upsert";
import {
  CreateUserDto,
  UpdateUserDto,
  UserFindFilterDto,
  UserResponseDto,
} from "./_components/user.dto";

function UsersContent() {
  const t = useTranslations("mantainers.users");
  const { toast } = useToast();
  const { canRead, canCreate, canUpdate, canDelete, getTemplateUser } =
    useCookieSession();
  const templateUser = getTemplateUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponseDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  const { data: roles } = useGetRoles();
  const { mutate: deleteUser, isPending: isDeletingUser } = useDeleteUser();

  const {
    data: usersData,
    isLoading,
    refetch: refetchUsers,
  } = useGetUsers({
    page,
    pageSize,
    email: searchEmail || undefined,
    roleId: selectedRoleId || undefined,
  } as UserFindFilterDto);

  const exportPageSize = Math.max(usersData?.pagination?.totalCount ?? 0, pageSize);
  const { data: usersExportData } = useGetUsers({
    page: 1,
    pageSize: exportPageSize || 10,
    email: searchEmail || undefined,
    roleId: selectedRoleId || undefined,
  } as UserFindFilterDto);

  useEffect(() => {
    if (refetchTrigger > 0) {
      refetchUsers();
    }
  }, [refetchTrigger, refetchUsers]);

  const {
    reset,
  } = useForm<CreateUserDto | UpdateUserDto>();

  const handleOpenModal = (user?: UserResponseDto) => {
    if (user) {
      setEditingUser(user);
      reset({
        name: user.name,
        email: user.email,
        username: user.username,
        roleId: user.roleId.toString(),
      });
    } else {
      setEditingUser(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const handleOpenDeleteModal = (publicId: string) => {
    setDeletingUserId(publicId);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingUser) {
      setIsDeleteModalOpen(false);
      setDeletingUserId(null);
      setDeleteError(null);
    }
  };

  const handleDelete = (publicId: string) => {
    setDeleteError(null);
    deleteUser(publicId, {
      onSuccess: () => {
        toast({
          title: t("delete.success"),
          variant: "default",
        });
        refetch();
        handleCloseDeleteModal();
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        const errorMessage =
          err?.response?.data?.message || err?.message || t("delete.error");
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
    setPage(1);
  }, []);

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const handleClearSearch = () => {
    setSearchEmail("");
    setSelectedRoleId("");
    setPage(1);
    refetch();
  };

  const users = usersData?.data || [];
  const pagination = usersData?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const getRoleName = (roleId: number) => {
    const role = roles?.find((r: { id?: number; publicId?: string }) => r.id === roleId || r.publicId === String(roleId));
    return role?.name || t("table.noRole");
  };

  const USER_COLUMNS_EXCEL: HeaderMapping[] = [
    { attribute: "name", header: t("table.headers.name") },
    { attribute: "email", header: t("table.headers.email") },
    { attribute: "username", header: t("table.headers.username") },
    {
      attribute: "roleId",
      header: t("table.headers.role"),
      render: (value: number) => getRoleName(value),
    },
    {
      attribute: "isActive",
      header: t("table.headers.isActive"),
      render: (value: boolean) =>
        value ? t("table.status.yes") : t("table.status.no"),
    },
    {
      attribute: "createdAt",
      header: t("table.headers.createdAt"),
      render: (value: string | Date) => {
        const dateStr = typeof value === "string" ? value : value.toISOString();
        return DateTime.fromISO(dateStr).toFormat("dd/MM/yyyy");
      },
    },
    {
      attribute: "updatedAt",
      header: t("table.headers.updatedAt"),
      render: (value: string | Date) => {
        const dateStr = typeof value === "string" ? value : value.toISOString();
        return DateTime.fromISO(dateStr).toFormat("dd/MM/yyyy");
      },
    },
  ];

  const handleDownloadExcel = async () => {
    try {
      setIsGeneratingExcel(true);
      await generateExcel(
        usersExportData?.data || users,
        USER_COLUMNS_EXCEL,
        t("excel.filename"),
        t("excel.sheetName"),
      );
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const toolbarFilters = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-[200px]">
        <CHEKIOInput
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          placeholder={t("search.placeholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
      </div>
      <div className="min-w-[220px]">
        <CHEKIOSelect
          value={selectedRoleId || "all"}
          onValueChange={(value) => {
            setSelectedRoleId(value === "all" ? "" : value);
          }}
        >
          <CHEKIOSelectTrigger>
            <CHEKIOSelectValue placeholder="Todos los roles" />
          </CHEKIOSelectTrigger>
          <CHEKIOSelectContent>
            <CHEKIOSelectItem value="all">Todos los roles</CHEKIOSelectItem>
            {roles?.map((role: { publicId: string; name: string }) => (
              <CHEKIOSelectItem key={role.publicId} value={role.publicId}>
                {role.name}
              </CHEKIOSelectItem>
            ))}
          </CHEKIOSelectContent>
        </CHEKIOSelect>
      </div>
      <CHEKIOButton variant="search" onClick={handleSearch}>
        {t("buttons.search")}
      </CHEKIOButton>
      <CHEKIOButton variant="refresh" onClick={handleClearSearch}>
        <RefreshCw className="h-4 w-4" />
        {t("buttons.clear")}
      </CHEKIOButton>
    </div>
  );

  const toolbarActions = (
    <div className="flex items-center gap-2">
      {canCreate(OrganizationPermissionCode.USERS_OPERATIONS) && (
        <CHEKIOButton variant="primary" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4" />
          {t("buttons.add")}
        </CHEKIOButton>
      )}
      {canRead(OrganizationPermissionCode.USERS_OPERATIONS) && (
        <CHEKIOButton
          variant="approve"
          onClick={handleDownloadExcel}
          disabled={isGeneratingExcel}
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
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Toolbar with search and actions */}
        <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50/50 px-5 py-4 md:flex-row md:items-center md:justify-between">
          {toolbarFilters}
          {toolbarActions}
        </div>

        {isLoading ? (
          <>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <User
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.name")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      <span className="flex items-center gap-2">
                        <Mail
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.email")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <AtSign
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.username")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Shield
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.role")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <CheckCircle
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.isActive")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <CalendarPlus
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.createdAt")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Calendar
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.updatedAt")}
                      </span>
                    </CHEKIOTableHead>
                    {(canUpdate(OrganizationPermissionCode.USERS_OPERATIONS) ||
                      canDelete(OrganizationPermissionCode.USERS_OPERATIONS)) && (
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {[...Array(pageSize)].map((_, index) => (
                    <CHEKIOTableRow key={index} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-6 w-14 animate-pulse rounded-full bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      {(canUpdate(OrganizationPermissionCode.USERS_OPERATIONS) ||
                        canDelete(
                          OrganizationPermissionCode.USERS_OPERATIONS
                        )) && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                            <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
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
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <User className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
            {canCreate(OrganizationPermissionCode.USERS_OPERATIONS) && (
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
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <User
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.name")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[140px]">
                      <span className="flex items-center gap-2">
                        <Mail
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.email")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <AtSign
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.username")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Shield
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.role")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <CheckCircle
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.isActive")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <CalendarPlus
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.createdAt")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Calendar
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.updatedAt")}
                      </span>
                    </CHEKIOTableHead>
                    {(canUpdate(OrganizationPermissionCode.USERS_OPERATIONS) ||
                      canDelete(OrganizationPermissionCode.USERS_OPERATIONS)) && (
                      <CHEKIOTableHead className="min-w-[100px] text-right">
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {users.map((user: UserResponseDto, index: number) => (
                    <CHEKIOTableRow key={user.publicId} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                        {user.name}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {user.email}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {user.username}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          {getRoleName(user.roleId)}
                        </span>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {user.isActive ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {user.isActive
                            ? t("table.status.yes")
                            : t("table.status.no")}
                        </span>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {DateTime.fromISO(
                          typeof user.createdAt === "string"
                            ? user.createdAt
                            : user.createdAt.toISOString()
                        ).toFormat("dd/MM/yyyy")}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                        {DateTime.fromISO(
                          typeof user.updatedAt === "string"
                            ? user.updatedAt
                            : user.updatedAt.toISOString()
                        ).toFormat("dd/MM/yyyy")}
                      </CHEKIOTableCell>
                      {(canUpdate(OrganizationPermissionCode.USERS_OPERATIONS) ||
                        canDelete(
                          OrganizationPermissionCode.USERS_OPERATIONS
                        )) && (
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate(
                              OrganizationPermissionCode.USERS_OPERATIONS
                            ) && (
                              <button
                                type="button"
                                onClick={() => handleOpenModal(user)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                title={t("buttons.edit")}
                                aria-label={t("ariaLabels.editUser")}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete(
                              OrganizationPermissionCode.USERS_OPERATIONS
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDeleteModal(user.publicId)
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                title={t("buttons.delete")}
                                aria-label={t("ariaLabels.deleteUser")}
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
                    current: users.length,
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
          </>
        )}
      </div>

      {isModalOpen && (
        <UserModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingUser={editingUser}
          onSuccess={() => refetch()}
        />
      )}

      {canDelete(OrganizationPermissionCode.USERS_OPERATIONS) && (
        <CHEKIOModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          title={t("delete.title")}
          size="md"
        >
          <div className="space-y-6">
            <p className="flex items-center gap-3 text-lg text-gray-700">
              <AlertCircle className="h-5 w-5 text-red-500" />
              {t("delete.message")}
            </p>

            {deleteError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-700">{deleteError}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <CHEKIOButton
                variant="secondary"
                onClick={handleCloseDeleteModal}
                disabled={isDeletingUser}
              >
                <X className="h-4 w-4" />
                {t("buttons.cancel")}
              </CHEKIOButton>
              <CHEKIOButton
                variant="destructive"
                onClick={() => {
                  if (deletingUserId) {
                    handleDelete(deletingUserId);
                  }
                }}
                disabled={isDeletingUser}
              >
                {isDeletingUser ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("delete.deleting")}
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

export default function UsersPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.USERS_OPERATIONS}
    >
      <UsersContent />
    </AccessNotGranted>
  );
}
