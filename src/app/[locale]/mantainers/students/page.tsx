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
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import type { StudentResponseDto } from "@/dto/students/student-response.dto";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteStudent,
  useGetStudents,
} from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Search, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import StudentModalUpsert from "./_components/student-modal-create";
import { StudentsTable } from "./_components/StudentsTable";

enum TabValue {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

enum ItemsPerPage {
  TEN = 10,
  TWENTY = 20,
  FIFTY = 50,
  ONE_HUNDRED = 100,
  TWO_HUNDRED = 200,
}

function StudentsContent() {
  const router = useRouter();
  const t = useTranslations("mantainers.students");
  const { companyId, canCreate, canUpdate, canDelete } = useCookieSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabValue>(TabValue.ACTIVE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] =
    useState<StudentResponseDto | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ItemsPerPage.TEN);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] =
    useState<StudentResponseDto | null>(null);

  const isActive = activeTab === TabValue.ACTIVE;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStudents(
    {
      companyId: companyId ?? "",
      search: search || undefined,
      isActive,
      page: currentPage,
      pageSize,
      sort: "desc",
    },
    { enabled: !!companyId },
  );

  const { mutateAsync: deleteStudentAsync, isPending: isDeleting } =
    useDeleteStudent();

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setActiveTab(TabValue.ACTIVE);
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const handleCreateSuccess = () => {
    toast({
      title: t("toast.createSuccess.title"),
      description: t("toast.createSuccess.description"),
    });
  };

  const handleUpdateSuccess = () => {
    toast({
      title: t("toast.updateSuccess.title"),
      description: t("toast.updateSuccess.description"),
    });
  };

  const handleOpenDeleteModal = (student: StudentResponseDto) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    await deleteStudentAsync(studentToDelete.publicId);
    queryClient.invalidateQueries({ queryKey: ["GetStudents"] });
    toast({
      title: t("toast.deleteSuccess.title"),
      description: t("toast.deleteSuccess.description"),
    });
  };

  const students = data?.data ?? [];
  const paginationData = data?.pagination;

  const canEdit = canUpdate(OrganizationPermissionCode.STUDENT_MAINTENANCE);
  const canRemove = canDelete(OrganizationPermissionCode.STUDENT_MAINTENANCE);

  const showPagination =
    !isLoading &&
    !isError &&
    paginationData &&
    paginationData.totalCount > 0;

  return (
    <>
      <CHEKIOHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[
          t("breadcrumbs.dashboard"),
          t("breadcrumbs.maintainers"),
          t("breadcrumbs.students"),
        ]}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50/50 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="inline-flex w-fit rounded-lg border border-gray-200 bg-white p-1">
              <button
                type="button"
                onClick={() => handleTabChange(TabValue.ACTIVE)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === TabValue.ACTIVE
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("tabs.active")}
              </button>
              <button
                type="button"
                onClick={() => handleTabChange(TabValue.INACTIVE)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === TabValue.INACTIVE
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("tabs.inactive")}
              </button>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 min-w-0 sm:w-auto">
              <div className="relative w-full min-w-0 sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <CHEKIOInput
                  className="pl-9"
                  placeholder={t("search.placeholder")}
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <CHEKIOButton
                type="button"
                variant="secondaryBlue"
                className="w-full shrink-0 sm:w-auto"
                onClick={handleClearFilters}
              >
                {t("buttons.clear")}
              </CHEKIOButton>
            </div>
          </div>

          {canCreate(OrganizationPermissionCode.STUDENT_MAINTENANCE) && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <CHEKIOButton
                variant="secondaryBlue"
                className="flex items-center justify-center gap-1.5"
                onClick={() => router.push("/mantainers/students/bulk-upload")}
              >
                <Upload className="h-4 w-4 shrink-0" />
                <span className="text-sm whitespace-nowrap">
                  {t("buttons.bulkUpload")}
                </span>
              </CHEKIOButton>
              <CHEKIOButton
                variant="primary"
                className="flex items-center justify-center gap-1.5"
                onClick={() => {
                  setEditingStudent(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="text-sm whitespace-nowrap">
                  {t("buttons.add")}
                </span>
              </CHEKIOButton>
            </div>
          )}
        </div>

        <StudentsTable
          students={students}
          isLoading={isLoading}
          error={isError ? (error as Error) : null}
          onRefetch={() => void refetch()}
          canEdit={canEdit}
          canRemove={canRemove}
          onEdit={(student) => {
            setEditingStudent(student);
            setIsModalOpen(true);
          }}
          onDeleteClick={handleOpenDeleteModal}
          isDeleting={isDeleting}
          itemsPerPage={pageSize}
        />

        {showPagination && paginationData && (
          <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="text-sm text-gray-600">
                {t("pagination.showing", {
                  current: students.length,
                  total: paginationData.totalCount,
                })}
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="students-page-size"
                  className="text-sm font-medium text-gray-700 whitespace-nowrap"
                >
                  {t("pagination.recordsPerPage")}
                </label>
                <CHEKIOSelect
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    handlePageSizeChange(parseInt(value, 10));
                  }}
                >
                  <CHEKIOSelectTrigger id="students-page-size" className="w-24">
                    <CHEKIOSelectValue />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    <CHEKIOSelectItem value={ItemsPerPage.TEN.toString()}>
                      {ItemsPerPage.TEN}
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem value={ItemsPerPage.TWENTY.toString()}>
                      {ItemsPerPage.TWENTY}
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem value={ItemsPerPage.FIFTY.toString()}>
                      {ItemsPerPage.FIFTY}
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem
                      value={ItemsPerPage.ONE_HUNDRED.toString()}
                    >
                      {ItemsPerPage.ONE_HUNDRED}
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem
                      value={ItemsPerPage.TWO_HUNDRED.toString()}
                    >
                      {ItemsPerPage.TWO_HUNDRED}
                    </CHEKIOSelectItem>
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                {t("pagination.previous")}
              </CHEKIOButton>
              <div className="px-4 py-2 border border-gray-200 bg-white text-sm text-gray-700 rounded-lg">
                {t("pagination.page", {
                  current: paginationData.current,
                  total: paginationData.totalPages,
                })}
              </div>
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= paginationData.totalPages}
              >
                {t("pagination.next")}
                <ChevronRight className="h-4 w-4" />
              </CHEKIOButton>
            </div>
          </div>
        )}
      </div>

      <StudentModalUpsert
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        editingStudent={editingStudent}
        onSuccess={editingStudent ? handleUpdateSuccess : handleCreateSuccess}
      />

      <ModalDelete
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={confirmDelete}
        title={t("confirmDelete.title")}
        message={t("confirmDelete.description")}
        buttonText={t("confirmDelete.confirm")}
        buttonLoadingText={t("confirmDelete.deleting")}
      />
    </>
  );
}

export default function StudentsPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.STUDENT_MAINTENANCE}
    >
      <StudentsContent />
    </AccessNotGranted>
  );
}
