"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
  CHEKIOButton,
  CHEKIOModal,
  CHEKIOStatCard,
  CHEKIOTab,
  CHEKIOTabs,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteTimeBank,
  useGetEmployeesWithoutTimeBank,
  useGetTimeBankStats,
} from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Clock,
  Loader2,
  PlusCircle,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import TabActiveTimeBanks from "./_components/tab-active-time-banks";
import TabEmployeesWithTimeBank from "./_components/tab-employees-with-time-bank";
import TabEmployeesWithoutTimeBank from "./_components/tab-employees-without-time-bank";
import TabExpiredTimeBanks from "./_components/tab-expired-time-banks";
import TabTimeBankConfig from "./_components/tab-time-bank-config";
import BatchTimeBankModal from "./_components/time-bank-selector-modal";
import TimeBankUpdateModal from "./_components/time-bank-update-modal";
import { TimeBankResponseDto } from "./_components/time-bank.dto";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY_BLUE = "secondaryBlue",
  DESTRUCTIVE = "destructive",
  SECONDARY = "secondary",
  SEARCH = "search",
  REFRESH = "refresh",
}

enum TabValue {
  ACTIVE = "active",
  EXPIRED = "expired",
  WITH_BANK = "withBank",
  WITHOUT_BANK = "withoutBank",
  CONFIG = "config",
}

type TimeBankStatsKey = "total" | "active" | "pending" | "expired";

const TIME_BANK_KPI_CARDS: Array<{
  key: TimeBankStatsKey;
  titleKey: string;
  variant: "blue" | "green" | "orange" | "red";
  icon: LucideIcon;
}> = [
  { key: "total", titleKey: "kpi.total", variant: "blue", icon: Clock },
  { key: "active", titleKey: "kpi.active", variant: "green", icon: TrendingUp },
  { key: "pending", titleKey: "kpi.pending", variant: "orange", icon: Clock },
  { key: "expired", titleKey: "kpi.expired", variant: "red", icon: TrendingDown },
];

function TimeBankContent() {
  const t = useTranslations("mantainers.timeBank");
  const router = useRouter();
  const { toast } = useToast();
  const { canCreate, canUpdate, canDelete, companyId, isProfileEmployee, profile } =
    useCookieSession();
  const isEmployeeProfile = isProfileEmployee();
  const sessionEmployeePublicId = profile?.user?.employeeId;
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingTimeBank, setEditingTimeBank] =
    useState<TimeBankResponseDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTimeBankId, setDeletingTimeBankId] = useState<string | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<TabValue>(TabValue.ACTIVE);

  const { data: statsData, isLoading: isLoadingStats } = useGetTimeBankStats(
    companyId || undefined,
  );

  const { data: employeesWithoutBank } = useGetEmployeesWithoutTimeBank({
    page: 1,
    pageSize: 1,
    companyId: companyId || undefined,
  });
  const statsWithoutBank = employeesWithoutBank?.pagination?.totalCount ?? 0;

  const { mutate: deleteTimeBank, isPending: isDeletingTimeBank } =
    useDeleteTimeBank();

  const handleOpenModal = (timeBank?: TimeBankResponseDto) => {
    if (timeBank) {
      setEditingTimeBank(timeBank);
    } else {
      setEditingTimeBank(null);
    }
  };

  const handleViewDetail = (timeBank: TimeBankResponseDto) => {
    const employeePublicId =
      timeBank.employeePublicId || (timeBank as any).employeePublicId;
    if (employeePublicId) {
      router.push(`/mantainers/time-bank/${employeePublicId}`);
    }
  };

  const handleOpenBatchModal = () => {
    setIsBatchModalOpen(true);
  };

  const handleCloseBatchModal = () => {
    setIsBatchModalOpen(false);
  };

  const handleOpenDeleteModal = (id: string) => {
    setDeletingTimeBankId(id);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingTimeBank) {
      setIsDeleteModalOpen(false);
      setDeletingTimeBankId(null);
      setDeleteError(null);
    }
  };

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  const handleDelete = (id: string) => {
    setDeleteError(null);
    deleteTimeBank(id, {
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

  const actions = (
    <div className="flex flex-row gap-2">
      {!isEmployeeProfile && canCreate(OrganizationPermissionCode.BANK_MAINTENANCE) && (
        <CHEKIOButton
          variant={ButtonVariant.PRIMARY}
          onClick={handleOpenBatchModal}
        >
          <PlusCircle className="h-4 w-4" />
          {t("buttons.batchCreate")}
        </CHEKIOButton>
      )}
      {!isEmployeeProfile && canUpdate(OrganizationPermissionCode.BANK_MAINTENANCE) && (
        <CHEKIOButton
          variant={ButtonVariant.SECONDARY_BLUE}
          onClick={() => setActiveTab(TabValue.CONFIG)}
        >
          <Settings className="h-4 w-4" />
          {t("buttons.configure")}
        </CHEKIOButton>
      )}
    </div>
  );

  return (
    <>

      {/* KPI Cards */}
      <div
        style={{
          animation: "dashboard-panel-in 0.45s ease-out 0.08s both",
        }}
      >
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIME_BANK_KPI_CARDS.map((card, index) => {
            const cardDelayMs = 120 + index * 60;
            return (
              <div
                key={card.key}
                style={{
                  animation: "dashboard-card-in 0.5s ease-out both",
                  animationDelay: `${cardDelayMs}ms`,
                }}
              >
                <CHEKIOStatCard
                  title={t(card.titleKey)}
                  value={statsData?.[card.key] ?? 0}
                  variant={card.variant}
                  icon={card.icon}
                  isLoading={isLoadingStats}
                  countUpDelayMs={cardDelayMs}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50/50 px-5 py-3">
          {actions}
        </div>

        <div className="border-b border-gray-200 px-5 pt-4">
          <CHEKIOTabs>
            <CHEKIOTab
              active={activeTab === TabValue.ACTIVE}
              onClick={() => setActiveTab(TabValue.ACTIVE)}
            >
              {t("tabs.active")} ({statsData?.active || 0})
            </CHEKIOTab>
            <CHEKIOTab
              active={activeTab === TabValue.EXPIRED}
              onClick={() => setActiveTab(TabValue.EXPIRED)}
            >
              {t("tabs.expired")} ({statsData?.expired || 0})
            </CHEKIOTab>
            {!isEmployeeProfile && (
              <CHEKIOTab
                active={activeTab === TabValue.WITH_BANK}
                onClick={() => setActiveTab(TabValue.WITH_BANK)}
              >
                {t("tabs.withBank")} ({statsData?.total || 0})
              </CHEKIOTab>
            )}
            {!isEmployeeProfile && (
              <CHEKIOTab
                active={activeTab === TabValue.WITHOUT_BANK}
                onClick={() => setActiveTab(TabValue.WITHOUT_BANK)}
              >
                {t("tabs.withoutBank")} ({statsWithoutBank})
              </CHEKIOTab>
            )}
            {!isEmployeeProfile &&
              canUpdate(OrganizationPermissionCode.BANK_MAINTENANCE) && (
              <CHEKIOTab
                active={activeTab === TabValue.CONFIG}
                onClick={() => setActiveTab(TabValue.CONFIG)}
              >
                {t("tabs.config")}
              </CHEKIOTab>
            )}
          </CHEKIOTabs>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === TabValue.ACTIVE && (
            <TabActiveTimeBanks
              onEdit={handleOpenModal}
              onDelete={handleOpenDeleteModal}
              onViewDetail={handleViewDetail}
              refetchTrigger={refetchTrigger}
              canUpdate={canUpdate(OrganizationPermissionCode.BANK_MAINTENANCE)}
              canDelete={canDelete(OrganizationPermissionCode.BANK_MAINTENANCE)}
              forcedEmployeeId={sessionEmployeePublicId}
            />
          )}

          {activeTab === TabValue.EXPIRED && (
            <TabExpiredTimeBanks
              onEdit={handleOpenModal}
              onDelete={handleOpenDeleteModal}
              onViewDetail={handleViewDetail}
              refetchTrigger={refetchTrigger}
              canUpdate={canUpdate(OrganizationPermissionCode.BANK_MAINTENANCE)}
              canDelete={canDelete(OrganizationPermissionCode.BANK_MAINTENANCE)}
              forcedEmployeeId={sessionEmployeePublicId}
            />
          )}

          {!isEmployeeProfile && activeTab === TabValue.WITH_BANK && (
            <TabEmployeesWithTimeBank />
          )}

          {!isEmployeeProfile && activeTab === TabValue.WITHOUT_BANK && (
            <TabEmployeesWithoutTimeBank />
          )}

          {!isEmployeeProfile && activeTab === TabValue.CONFIG && <TabTimeBankConfig />}
        </div>
      </div>

      {isBatchModalOpen && (
        <BatchTimeBankModal
          isOpen={isBatchModalOpen}
          onClose={handleCloseBatchModal}
          onSuccess={() => refetch()}
        />
      )}

      {editingTimeBank && canUpdate(OrganizationPermissionCode.BANK_MAINTENANCE) && (
        <TimeBankUpdateModal
          isOpen={!!editingTimeBank}
          onClose={() => setEditingTimeBank(null)}
          onSuccess={() => {
            refetch();
            setEditingTimeBank(null);
          }}
          timeBank={editingTimeBank}
        />
      )}

      {canDelete(OrganizationPermissionCode.BANK_MAINTENANCE) && (
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
                disabled={isDeletingTimeBank}
              >
                <X className="h-4 w-4" />
                {t("buttons.cancel")}
              </CHEKIOButton>
              <CHEKIOButton
                variant={ButtonVariant.DESTRUCTIVE}
                onClick={() => {
                  if (deletingTimeBankId) {
                    handleDelete(deletingTimeBankId);
                  }
                }}
                disabled={isDeletingTimeBank}
              >
                {isDeletingTimeBank ? (
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

export default function TimeBankPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.BANK_MAINTENANCE}
    >
      <TimeBankContent />
    </AccessNotGranted>
  );
}
