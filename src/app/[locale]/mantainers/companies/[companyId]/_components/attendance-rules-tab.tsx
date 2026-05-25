"use client";

import {
  CHEKIOActionButton,
  CHEKIOButton,
  CHEKIOLoading,
  CHEKIOModal,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import {
  useDeleteAttendanceRule,
  useGetAttendanceRules,
} from "@/service/attendance-rule.service";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import {
  AttendanceRuleResponseDto,
  getMarkModeLabel,
  getMarkTypeLabel,
} from "./attendance-rule.dto";
import AttendanceRuleModal from "./attendance-rule-modal";

function getDeleteErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: unknown } }).response?.data;
    if (data && typeof data === "object") {
      const rec = data as { message?: string; error?: string };
      if (typeof rec.message === "string" && rec.message.trim()) {
        return rec.message;
      }
      if (typeof rec.error === "string" && rec.error.trim()) {
        return rec.error;
      }
    }
  }
  return fallback;
}

interface AttendanceRulesTabProps {
  companyId: string;
  canUpdate: boolean;
}

export default function AttendanceRulesTab({
  companyId,
  canUpdate,
}: AttendanceRulesTabProps) {
  const t = useTranslations("mantainers.companies.attendanceRules");
  const tModal = useTranslations("mantainers.companies.attendanceRules.deleteModal");
  const tToast = useTranslations("mantainers.companies.attendanceRules.toast");
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] =
    useState<AttendanceRuleResponseDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useGetAttendanceRules(companyId);
  const { mutate: deleteRule, isPending: isDeleting } =
    useDeleteAttendanceRule();

  const rules = data?.data ?? [];

  const handleOpenCreate = useCallback(() => setIsCreateModalOpen(true), []);
  const handleCloseCreate = useCallback(() => setIsCreateModalOpen(false), []);

  const handleDeleteClick = useCallback((rule: AttendanceRuleResponseDto) => {
    setRuleToDelete(rule);
    setDeleteError(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setRuleToDelete(null);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!ruleToDelete) return;
    setDeleteError(null);
    deleteRule(
      { companyId, ruleId: ruleToDelete.id },
      {
        onSuccess: () => {
          toast({
            title: tToast("deleteSuccess"),
            description: tToast("deleteSuccessDescription"),
          });
          handleCloseDeleteModal();
        },
        onError: (error: unknown) => {
          const message = getDeleteErrorMessage(error, t("deleteError"));
          setDeleteError(message);
        },
      }
    );
  }, [companyId, ruleToDelete, deleteRule, handleCloseDeleteModal, t, tToast, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <CHEKIOLoading size="lg" variant="modern" text={t("loading")} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{t("errorLoading")}</p>
        <CHEKIOButton
          type="button"
          variant="secondaryBlue"
          onClick={() => refetch()}
          className="mt-2"
        >
          {t("retry")}
        </CHEKIOButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{t("description")}</p>

      <div
        className="space-y-3"
        data-tour="company-detail-tab-rules-explanation"
      >
        <h3 className="text-sm font-semibold text-gray-800">
          {t("explanationTitle")}
        </h3>
        <div className="space-y-3">
          <div className="bg-gray-100 p-4 rounded-md text-sm border-l-4 border-blue-500">
            <p className="font-medium text-gray-800 mb-1">
              {t("explanation.geofenceEntryTitle")}
            </p>
            <p className="text-gray-700">{t("explanation.geofenceEntry")}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-md text-sm border-l-4 border-blue-500">
            <p className="font-medium text-gray-800 mb-1">
              {t("explanation.globalExitTitle")}
            </p>
            <p className="text-gray-700">{t("explanation.globalExit")}</p>
          </div>
        </div>
      </div>

      {canUpdate && (
        <div
          className="flex justify-end"
          data-tour="company-detail-tab-rules-new"
        >
          <CHEKIOButton
            type="button"
            variant="primary"
            onClick={handleOpenCreate}
          >
            <Plus className="h-4 w-4" />
            {t("newRule")}
          </CHEKIOButton>
        </div>
      )}

      {rules.length === 0 ? (
        <div
          className="rounded-lg border border-gray-200 bg-gray-50 py-10 text-center"
          data-tour="company-detail-tab-rules-table"
        >
          <p className="text-gray-600 font-medium">{t("empty")}</p>
        </div>
      ) : (
        <div data-tour="company-detail-tab-rules-table">
        <CHEKIOTable>
          <CHEKIOTableHeader>
            <tr>
              <CHEKIOTableHead>{t("table.markType")}</CHEKIOTableHead>
              <CHEKIOTableHead>{t("table.mode")}</CHEKIOTableHead>
              {canUpdate && (
                <CHEKIOTableHead>{t("table.actions")}</CHEKIOTableHead>
              )}
            </tr>
          </CHEKIOTableHeader>
          <CHEKIOTableBody>
            {rules.map((rule, index) => (
              <CHEKIOTableRow key={rule.id} index={index}>
                <CHEKIOTableCell>
                  {getMarkTypeLabel(rule.markType)}
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  {getMarkModeLabel(rule.mode)}
                </CHEKIOTableCell>
                {canUpdate && (
                  <CHEKIOTableCell>
                    <CHEKIOActionButton
                      type="button"
                      variant="delete"
                      onClick={() => handleDeleteClick(rule)}
                      className="!h-8 !w-auto min-w-0 px-2 gap-1.5"
                    >
                      <Trash2 className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs whitespace-nowrap">
                        {t("table.delete")}
                      </span>
                    </CHEKIOActionButton>
                  </CHEKIOTableCell>
                )}
              </CHEKIOTableRow>
            ))}
          </CHEKIOTableBody>
        </CHEKIOTable>
        </div>
      )}

      <AttendanceRuleModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreate}
        companyId={companyId}
      />

      <CHEKIOModal
        isOpen={!!ruleToDelete}
        onClose={handleCloseDeleteModal}
        title={tModal("title")}
        size="md"
      >
        {ruleToDelete && (
          <div className="space-y-5">
            <div className="flex gap-4 rounded-xl border border-red-100 bg-red-50/60 p-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100"
                aria-hidden
              >
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  {tModal("description", {
                    markType: getMarkTypeLabel(ruleToDelete.markType),
                    mode: getMarkModeLabel(ruleToDelete.mode),
                  })}
                </p>
                <p className="text-sm text-gray-600">{tModal("subtitle")}</p>
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800">
                  <span className="font-medium text-gray-500">
                    {tModal("summaryLabel")}
                  </span>{" "}
                  {getMarkTypeLabel(ruleToDelete.markType)} ·{" "}
                  {getMarkModeLabel(ruleToDelete.mode)}
                </div>
              </div>
            </div>
            {deleteError ? (
              <div
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                role="alert"
              >
                {deleteError}
              </div>
            ) : null}
            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end sm:gap-3">
              <CHEKIOButton
                type="button"
                variant="secondaryBlue"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
              >
                {tModal("cancel")}
              </CHEKIOButton>
              <CHEKIOButton
                type="button"
                variant="reject"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                aria-busy={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {tModal("deleting")}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" aria-hidden />
                    {tModal("confirm")}
                  </>
                )}
              </CHEKIOButton>
            </div>
          </div>
        )}
      </CHEKIOModal>
    </div>
  );
}
