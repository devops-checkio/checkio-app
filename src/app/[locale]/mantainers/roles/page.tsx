"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import ModalDelete from "@/app/[locale]/_components/modal-delete";
import {
  CHEKIOActionButton,
  CHEKIOButton,
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
import SystemInput from "@/components/ui/system-input";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { Role } from "@/dto/security";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateRole,
  useDeleteRole,
  useGetRoles,
} from "@/service/security.service";
import { handleError } from "@/utils/error";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  PlusCircle,
  Shield,
  Trash2,
} from "lucide-react";
import { DateTime } from "luxon";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

function RolesContent() {
  const t = useTranslations("mantainers.roles");
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const { canRead, canCreate, canUpdate, canDelete } = useCookieSession();
  const { data: allRoles, isLoading, refetch } = useGetRoles();
  const { mutateAsync: createRole, isPending: isCreating } = useCreateRole();
  const { mutateAsync: deleteRole } = useDeleteRole();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<Role>();

  // Use the proper permission code for roles
  const ROLE_PERMISSION = OrganizationPermissionCode.ROLES_OPERATIONS;

  // Client-side pagination
  const paginatedRoles = useMemo(() => {
    if (!allRoles) return [];
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allRoles.slice(startIndex, endIndex);
  }, [allRoles, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (!allRoles) return 1;
    return Math.ceil(allRoles.length / pageSize);
  }, [allRoles, pageSize]);

  const totalCount = allRoles?.length || 0;

  const handleCreate = () => {
    reset();
    setIsModalVisible(true);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingRoleId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingRoleId(null);
  };

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const onSubmit: SubmitHandler<Role> = async (data) => {
    try {
      await createRole(data);
      toast({
        title: t("create.success"),
        variant: "default",
      });
      setIsModalVisible(false);
      reset();
      refetch();
      setCurrentPage(1); // Reset to first page after creating
    } catch (error) {
      handleError(error, toast);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    reset();
  };

  const handleDelete = async (roleId: string) => {
    try {
      await deleteRole(roleId);
      toast({
        title: t("delete.success"),
        variant: "default",
      });
      handleCloseDeleteModal();
      refetch();
    } catch (error) {
      handleError(error, toast);
    }
  };

  const toolbarButtons = (
    <div className="flex flex-row gap-2">
      {canCreate(ROLE_PERMISSION) && (
        <CHEKIOButton variant="primary" onClick={handleCreate}>
          <PlusCircle className="h-4 w-4" />
          {t("buttons.add")}
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
              {canCreate(ROLE_PERMISSION) && (
                <div className="h-9 w-[120px] animate-pulse rounded-lg bg-gray-200" />
              )}
            </div>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>{t("table.headers.name")}</CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.createdAt")}
                    </CHEKIOTableHead>
                    {(canUpdate(ROLE_PERMISSION) ||
                      canDelete(ROLE_PERMISSION)) && (
                      <CHEKIOTableHead>
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {[...Array(10)].map((_, index) => (
                    <CHEKIOTableRow key={index} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      {(canUpdate(ROLE_PERMISSION) ||
                        canDelete(ROLE_PERMISSION)) && (
                        <CHEKIOTableCell className="px-5 py-3.5">
                          <div className="flex gap-2 justify-center">
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
        ) : !allRoles || allRoles.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <Shield className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
            {canCreate(ROLE_PERMISSION) && (
              <CHEKIOButton
                variant="primary"
                onClick={handleCreate}
                className="mt-6 gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                {t("buttons.add")}
              </CHEKIOButton>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3">
              {toolbarButtons}
            </div>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>{t("table.headers.name")}</CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("table.headers.createdAt")}
                    </CHEKIOTableHead>
                    {(canUpdate(ROLE_PERMISSION) ||
                      canDelete(ROLE_PERMISSION)) && (
                      <CHEKIOTableHead>
                        {t("table.headers.actions")}
                      </CHEKIOTableHead>
                    )}
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {paginatedRoles.map((role, index) => (
                    <CHEKIOTableRow key={role.publicId} index={index}>
                      <CHEKIOTableCell className="font-medium text-gray-900">
                        {role.name}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {DateTime.fromISO(
                          typeof role.createdAt === "string"
                            ? role.createdAt
                            : role.createdAt.toISOString(),
                        ).toFormat("dd/MM/yyyy")}
                      </CHEKIOTableCell>
                      {(canUpdate(ROLE_PERMISSION) ||
                        canDelete(ROLE_PERMISSION)) && (
                        <CHEKIOTableCell>
                          <div className="flex flex-row gap-2 justify-center">
                            {canUpdate(ROLE_PERMISSION) && (
                              <CHEKIOActionButton
                                variant="edit"
                                onClick={() =>
                                  router.push(
                                    `/${locale}/mantainers/roles/${encodeURIComponent(role.publicId)}`,
                                  )
                                }
                                aria-label={t("ariaLabels.editRole")}
                                className="h-auto w-auto px-3 py-1.5 gap-1.5"
                              >
                                <Edit className="h-4 w-4" />
                                <span>{t("buttons.edit")}</span>
                              </CHEKIOActionButton>
                            )}
                            {canDelete(ROLE_PERMISSION) && (
                              <CHEKIOActionButton
                                variant="delete"
                                onClick={() =>
                                  handleOpenDeleteModal(role.publicId)
                                }
                                aria-label={t("ariaLabels.deleteRole")}
                                className="h-auto w-auto px-3 py-1.5 gap-1.5"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>{t("buttons.delete")}</span>
                              </CHEKIOActionButton>
                            )}
                          </div>
                        </CHEKIOTableCell>
                      )}
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>

            {totalCount > 0 && (
              <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {t("pagination.showing", {
                      current: paginatedRoles.length,
                      total: totalCount,
                    })}
                  </div>
                  {/* Selector de registros por página */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      {t("pagination.recordsPerPage")}:
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
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("buttons.previous")}
                  </CHEKIOButton>
                  <span className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                    {t("pagination.page", {
                      current: currentPage,
                      total: totalPages,
                    })}
                  </span>
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
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
        isOpen={isModalVisible}
        onClose={handleCancel}
        title={t("modal.createTitle")}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <SystemInput
              label={t("modal.nameLabel")}
              className="w-full"
              control={control}
              attribute="name"
              errors={errors}
              rules={{
                required: t("modal.nameRequired"),
                minLength: {
                  value: 2,
                  message: t("modal.nameMinLength"),
                },
              }}
            />
          </div>

          <CHEKIOButton
            type="submit"
            variant="primary"
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("modal.saving")}</span>
              </>
            ) : (
              <span>{t("buttons.save")}</span>
            )}
          </CHEKIOButton>
        </form>
      </CHEKIOModal>
      <ModalDelete
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={() => {
          if (deletingRoleId) {
            return handleDelete(deletingRoleId);
          }
          return Promise.resolve();
        }}
        message={t("delete.confirmMessage")}
      />
    </>
  );
}

export default function RolesPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.ROLES_OPERATIONS}
    >
      <RolesContent />
    </AccessNotGranted>
  );
}
