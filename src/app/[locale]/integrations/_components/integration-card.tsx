/* eslint-disable @next/next/no-img-element */
"use client";

import { CHEKIOButton, CHEKIOModal } from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useToast } from "@/hooks/use-toast";
import {
  useActivateIntegration,
  useDeactivateIntegration,
  useDeleteIntegration,
  useTestConnection,
} from "@/service/integration.service";
import { Edit, Eye, Power, RefreshCw, Trash2 } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  IntegrationResponseDto,
  IntegrationStatus,
} from "./integration.dto";
import IntegrationDetailModal from "./integration-detail-modal";

interface IntegrationCardProps {
  integration: IntegrationResponseDto;
  onRefresh: () => void;
  onEdit?: (integration: IntegrationResponseDto) => void;
}

export default function IntegrationCard({
  integration,
  onRefresh,
  onEdit,
}: IntegrationCardProps) {
  const t = useTranslations("integrations");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { canRead, canCreate, canUpdate, canDelete } = useCookieSession();

  const etlCode = OrganizationPermissionCode.EXTERNAL_INTEGRATION_MAINTENANCE;

  const canReadModule = () => canRead(etlCode);
  const canCreateModule = () => canCreate(etlCode);
  const canUpdateModule = () => canUpdate(etlCode);
  const canDeleteModule = () => canDelete(etlCode);

  const activateIntegrationMutation = useActivateIntegration();
  const deactivateIntegrationMutation = useDeactivateIntegration();
  const deleteIntegrationMutation = useDeleteIntegration();
  const testConnectionMutation = useTestConnection();

  const getStatusBorderColor = () => {
    switch (integration.status) {
      case IntegrationStatus.ACTIVE:
        return "border-l-4 border-l-green-500";
      case IntegrationStatus.ERROR:
        return "border-l-4 border-l-red-500";
      case IntegrationStatus.INACTIVE:
        return "border-l-4 border-l-gray-400";
      default:
        return "border-l-4 border-l-gray-300";
    }
  };

  const getStatusText = () => {
    switch (integration.status) {
      case IntegrationStatus.ACTIVE:
        return t("card.status.active");
      case IntegrationStatus.ERROR:
        return t("card.status.error");
      case IntegrationStatus.INACTIVE:
        return t("card.status.inactive");
      case IntegrationStatus.PENDING:
        return t("card.status.pending");
      default:
        return t("card.status.unknown");
    }
  };

  const getStatusColor = () => {
    switch (integration.status) {
      case IntegrationStatus.ACTIVE:
        return "text-green-600";
      case IntegrationStatus.ERROR:
        return "text-red-600";
      case IntegrationStatus.INACTIVE:
        return "text-gray-500";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t("card.na");
    return DateTime.fromISO(dateString).toFormat("dd/MM/yyyy HH:mm");
  };

  const handleManualSync = async () => {
    setIsLoading(true);
    try {
      const result = await testConnectionMutation.mutateAsync(
        integration.publicId
      );

      toast({
        title: t("card.toasts.testSuccessTitle"),
        description: result.message,
        variant: "default",
      });

      onRefresh();
    } catch (error) {
      const description =
        error instanceof Error ? error.message : t("card.toasts.genericError");
      toast({
        title: t("card.toasts.testErrorTitle"),
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteIntegrationMutation.mutateAsync(integration.publicId);

      toast({
        title: t("card.toasts.deleteSuccessTitle"),
        description: t("card.toasts.deleteSuccessDescription", {
          name: integration.name,
        }),
        variant: "default",
      });

      setDeleteOpen(false);
      onRefresh();
    } catch {
      toast({
        title: t("card.toasts.deleteErrorTitle"),
        description: t("card.toasts.deleteErrorDescription"),
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async () => {
    try {
      if (integration.status === IntegrationStatus.ACTIVE) {
        await deactivateIntegrationMutation.mutateAsync(integration.publicId);
        toast({
          title: t("card.toasts.deactivateTitle"),
          description: t("card.toasts.deactivateDescription", {
            name: integration.name,
          }),
          variant: "default",
        });
      } else {
        await activateIntegrationMutation.mutateAsync(integration.publicId);
        toast({
          title: t("card.toasts.activateTitle"),
          description: t("card.toasts.activateDescription", {
            name: integration.name,
          }),
          variant: "default",
        });
      }

      onRefresh();
    } catch {
      toast({
        title: t("card.toasts.toggleErrorTitle"),
        description: t("card.toasts.toggleErrorDescription"),
        variant: "destructive",
      });
    }
  };

  const failureHint =
    integration.status === IntegrationStatus.ERROR &&
    integration.lastFailureMessage ? (
      <p
        className="text-xs text-red-600 mt-2 line-clamp-2"
        title={integration.lastFailureMessage}
      >
        {integration.lastFailureMessage}
      </p>
    ) : null;

  return (
    <>
      <div
        className={`w-full bg-white border border-gray-200 transition-all duration-200 hover:shadow-lg ${getStatusBorderColor()}`}
      >
        <div className="p-5">
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 overflow-hidden bg-gray-50 border-2 border-gray-100 flex-shrink-0">
                  <img
                    src={
                      integration.companyLogo ||
                      "https://via.placeholder.com/56x56/6b7280/ffffff?text=?"
                    }
                    alt={integration.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "https://via.placeholder.com/56x56/6b7280/ffffff?text=?";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {integration.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    {integration.description}
                  </p>
                  {failureHint}
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 shrink-0 ${
                  integration.status === IntegrationStatus.ACTIVE
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : integration.status === IntegrationStatus.ERROR
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : integration.status === IntegrationStatus.INACTIVE
                        ? "bg-gray-100 text-gray-800 border border-gray-200"
                        : "bg-amber-50 text-amber-900 border border-amber-200"
                }`}
              >
                {getStatusText()}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-6">
              {canUpdateModule() && (
                <CHEKIOButton
                  variant="refresh"
                  onClick={handleManualSync}
                  disabled={isLoading}
                  size="sm"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  {t("card.actions.testConnection")}
                </CHEKIOButton>
              )}

              <CHEKIOButton
                variant={
                  integration.status === IntegrationStatus.ACTIVE
                    ? "primary"
                    : "secondaryBlue"
                }
                onClick={handleToggleStatus}
                size="sm"
                disabled={!canUpdateModule()}
              >
                <Power className="h-4 w-4" />
                {integration.status === IntegrationStatus.ACTIVE
                  ? t("card.actions.deactivate")
                  : t("card.actions.activate")}
              </CHEKIOButton>

              {canReadModule() && (
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() => setDetailOpen(true)}
                  size="sm"
                >
                  <Eye className="h-4 w-4" />
                  {t("card.actions.viewDetails")}
                </CHEKIOButton>
              )}

              {canUpdateModule() && (
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() => onEdit?.(integration)}
                  size="sm"
                >
                  <Edit className="h-4 w-4" />
                  {t("card.actions.edit")}
                </CHEKIOButton>
              )}

              {canDeleteModule() && (
                <CHEKIOButton
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("card.actions.delete")}
                </CHEKIOButton>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      {t("card.metrics.lastSuccess")}
                    </p>
                    <p className={`text-xs font-semibold ${getStatusColor()}`}>
                      {integration.lastSuccessfulExecution
                        ? formatDate(integration.lastSuccessfulExecution)
                        : t("card.na")}
                    </p>
                  </div>

                  <div className="w-px h-8 bg-gray-200 hidden sm:block" />

                  <div className="text-center">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      {t("card.metrics.nextRun")}
                    </p>
                    <p className={`text-xs font-semibold ${getStatusColor()}`}>
                      {integration.nextExecution
                        ? formatDate(integration.nextExecution)
                        : t("card.na")}
                    </p>
                  </div>

                  <div className="w-px h-8 bg-gray-200 hidden sm:block" />

                  <div className="text-center">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      {t("card.metrics.lastFailure")}
                    </p>
                    <p
                      className={`text-xs font-semibold ${
                        integration.lastFailure
                          ? "text-red-600"
                          : "text-gray-400"
                      }`}
                    >
                      {integration.lastFailure
                        ? formatDate(integration.lastFailure)
                        : t("card.na")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <IntegrationDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        integration={integration}
      />

      <CHEKIOModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t("card.deleteModal.title")}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            {t("card.deleteModal.message", { name: integration.name })}
          </p>
          <div className="flex justify-end gap-2">
            <CHEKIOButton
              variant="secondaryBlue"
              type="button"
              onClick={() => setDeleteOpen(false)}
            >
              {t("card.deleteModal.cancel")}
            </CHEKIOButton>
            <CHEKIOButton
              variant="destructive"
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleteIntegrationMutation.isPending}
            >
              {t("card.deleteModal.confirm")}
            </CHEKIOButton>
          </div>
        </div>
      </CHEKIOModal>
    </>
  );
}
