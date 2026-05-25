"use client";

import {
  CHEKIOButton,
  CHEKIOHeader,
  CHEKIOTab,
  CHEKIOTabs,
} from "@/components";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntegrationsTour } from "@/hooks/useIntegrationsTour";
import { useGetIntegrations } from "@/service/integration.service";
import { HelpCircle, PlusCircle } from "lucide-react";
import { useCookieSession } from "@/context/useCookieSession";
import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import { IntegrationProductModule } from "@/dto/enum/integration-product-module.enum";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import IntegrationCard from "./_components/integration-card";
import IntegrationModalCreate from "./_components/integration-modal-create";
import {
  IntegrationListTab,
  IntegrationResponseDto,
  IntegrationStatus,
} from "./_components/integration.dto";

const ETL_INTEGRATIONS_ACCESS =
  OrganizationPermissionCode.EXTERNAL_INTEGRATION_MAINTENANCE;

function IntegrationsContent() {
  const t = useTranslations("integrations");
  const { startTour } = useIntegrationsTour();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] =
    useState<IntegrationResponseDto | null>(null);
  const [activeTab, setActiveTab] = useState<IntegrationListTab>(
    IntegrationListTab.ALL
  );

  const {
    data: integrationsData,
    isLoading,
    error,
    refetch,
  } = useGetIntegrations();
  const integrations = integrationsData?.data ?? [];

  const tabCounts = useMemo(() => {
    return {
      [IntegrationListTab.ALL]: integrations.length,
      [IntegrationListTab.ACTIVE]: integrations.filter(
        (i) => i.status === IntegrationStatus.ACTIVE
      ).length,
      [IntegrationListTab.INACTIVE]: integrations.filter(
        (i) => i.status === IntegrationStatus.INACTIVE
      ).length,
      [IntegrationListTab.PENDING]: integrations.filter(
        (i) => i.status === IntegrationStatus.PENDING
      ).length,
      [IntegrationListTab.ERROR]: integrations.filter(
        (i) => i.status === IntegrationStatus.ERROR
      ).length,
    };
  }, [integrations]);

  const filteredIntegrations = useMemo(() => {
    if (activeTab === IntegrationListTab.ALL) {
      return integrations;
    }
    return integrations.filter(
      (i) => (i.status as string) === (activeTab as string)
    );
  }, [integrations, activeTab]);

  const handleOpenModal = () => {
    setEditingIntegration(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingIntegration(null);
  };

  const handleEditIntegration = (integration: IntegrationResponseDto) => {
    setEditingIntegration(integration);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    refetch();
  };

  const tabs: { key: IntegrationListTab; label: string }[] = [
    { key: IntegrationListTab.ALL, label: t("tabs.all", { count: tabCounts.ALL }) },
    {
      key: IntegrationListTab.ACTIVE,
      label: t("tabs.active", { count: tabCounts.ACTIVE }),
    },
    {
      key: IntegrationListTab.INACTIVE,
      label: t("tabs.inactive", { count: tabCounts.INACTIVE }),
    },
    {
      key: IntegrationListTab.PENDING,
      label: t("tabs.pending", { count: tabCounts.PENDING }),
    },
    {
      key: IntegrationListTab.ERROR,
      label: t("tabs.error", { count: tabCounts.ERROR }),
    },
  ];

  const { canCreate } = useCookieSession();

  const addButton = canCreate(ETL_INTEGRATIONS_ACCESS) ? (
    <CHEKIOButton variant="primary" onClick={handleOpenModal}>
      <PlusCircle className="h-4 w-4" />
      {t("actions.newIntegration")}
    </CHEKIOButton>
  ) : null;

  const canShowTour =
    isLoading || integrations.length > 0 || !error;

  return (
    <>
      <CHEKIOHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[t("breadcrumbs.dashboard"), t("breadcrumbs.integrations")]}
        actions={
          <div className="flex items-center gap-2">
            {addButton && (
              <span data-tour="integrations-toolbar">{addButton}</span>
            )}
            <CHEKIOButton
              variant="secondaryBlue"
              onClick={() => startTour()}
              disabled={!canShowTour}
              title={
                !canShowTour ? t("tour.steps.empty.description") : undefined
              }
            >
              <HelpCircle className="h-4 w-4" />
              {t("tour.startButton")}
            </CHEKIOButton>
          </div>
        }
      />
      <div className="bg-white border border-gray-200 p-6">
        {isLoading ? (
          <div className="animate-content-fade-in space-y-6">
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-36 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="w-full bg-white border border-gray-200 border-l-4 border-l-gray-200 p-5"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-14 h-14 rounded shrink-0" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <Skeleton className="h-5 w-32 rounded" />
                          <Skeleton className="h-4 w-full max-w-[200px] rounded" />
                          <Skeleton className="h-4 w-36 rounded" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16 rounded" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-6">
                      <Skeleton className="h-9 w-32 rounded" />
                      <Skeleton className="h-9 w-24 rounded" />
                      <Skeleton className="h-9 w-28 rounded" />
                      <Skeleton className="h-9 w-20 rounded" />
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-24 rounded" />
                          <Skeleton className="h-4 w-28 rounded" />
                        </div>
                        <div className="w-px h-8 bg-gray-200" />
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-28 rounded" />
                          <Skeleton className="h-4 w-28 rounded" />
                        </div>
                        <div className="w-px h-8 bg-gray-200" />
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-20 rounded" />
                          <Skeleton className="h-4 w-28 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="animate-content-fade-in flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("errors.loadTitle")}
              </h3>
              <p className="text-gray-500">{t("errors.loadDescription")}</p>
            </div>
          </div>
        ) : (
          <div className="animate-content-fade-in">
            <CHEKIOTabs className="mb-6" data-tour="integrations-tabs">
              {tabs.map((tab) => (
                <CHEKIOTab
                  key={tab.key}
                  type="button"
                  active={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </CHEKIOTab>
              ))}
            </CHEKIOTabs>

            {filteredIntegrations.length === 0 ? (
              <div
                className="text-center py-12"
                data-tour="integrations-empty"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t(`empty.${activeTab}.title`)}
                </h3>
                <p className="text-gray-500">
                  {t(`empty.${activeTab}.description`)}
                </p>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                data-tour="integrations-cards"
              >
                {filteredIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.publicId}
                    integration={integration}
                    onRefresh={refetch}
                    onEdit={handleEditIntegration}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <IntegrationModalCreate
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          editingIntegration={editingIntegration}
        />
      )}
    </>
  );
}

export default function IntegrationsPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={ETL_INTEGRATIONS_ACCESS}
      requireProductModule={IntegrationProductModule.ETL}
    >
      <IntegrationsContent />
    </AccessNotGranted>
  );
}
