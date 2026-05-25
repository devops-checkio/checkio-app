"use client";

import {
  CHEKIOButton,
  CHEKIOHeader,
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
import { useToast } from "@/hooks/use-toast";
import {
  useCloseAssistanceMonth,
  useConfirmApproval,
  useGetAssistanceMonthClosingApprovers,
  useGetAssistanceMonthClosingStatus,
  useGetAssistanceMonthReopenHistory,
  useGetCompaniesSelector,
  useGetClosingPinConfigured,
  usePrecloseAssistanceMonth,
  useReopenAssistanceMonth,
  useUpdateClosingPin,
} from "@/service/mantainer.service";
import axios from "axios";
import { DateTime } from "luxon";
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  History,
  LayoutList,
  Lock,
  RefreshCw,
  Unlock,
  UserX,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useCallback, useState } from "react";
import ModalCloseMonth from "./_components/modal-close-month";
import ModalPrecloseMonth from "./_components/modal-preclose-month";
import ModalReopenHistory from "./_components/modal-reopen-history";
import type { AssistanceMonthClosingApproverResponseDto } from "./_components/assistance-month-closing.dto";
import ModalReopenMonth from "./_components/modal-reopen-month";
import ModalConfirmPin from "./_components/modal-confirm-pin";
import ModalClosingPinConfig from "./_components/modal-closing-pin-config";
import ModalUnitsDetail from "./_components/modal-units-detail";

type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

const CURRENT_YEAR = DateTime.now().year;
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i);
const MONTHS: Month[] = Array.from({ length: 12 }, (_, i) => (i + 1) as Month);

function AssistanceMonthClosingContent() {
  const t = useTranslations("mantainers.assistanceMonthClosing");
  const { toast } = useToast();
  const { companyId: sessionCompanyId, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const [companyId, setCompanyId] = useState<string | null>(sessionCompanyId);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState<Month>(DateTime.now().month as Month);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [precloseModalOpen, setPrecloseModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [confirmPinModalOpen, setConfirmPinModalOpen] = useState(false);
  const [pinConfigModalOpen, setPinConfigModalOpen] = useState(false);
  const [unitsDetailModalOpen, setUnitsDetailModalOpen] = useState(false);

  const effectiveCompanyId = companyId ?? sessionCompanyId ?? null;

  const { data: companies } = useGetCompaniesSelector({
    page: 1,
    pageSize: 100,
    sort: "asc",
  });
  const { data: statusData, isLoading: isLoadingStatus, refetch } =
    useGetAssistanceMonthClosingStatus(effectiveCompanyId, year, month);
  const status = statusData?.status ?? "OPEN";
  const isPreclosed = status === "PRECLOSED";
  const { mutate: closeMonth, isPending: isClosing } = useCloseAssistanceMonth(
    effectiveCompanyId,
  );
  const { mutate: precloseMonth, isPending: isPreclosing } =
    usePrecloseAssistanceMonth(effectiveCompanyId);
  const { mutate: reopenMonth, isPending: isReopening } = useReopenAssistanceMonth(
    effectiveCompanyId,
  );
  const { data: approversData } = useGetAssistanceMonthClosingApprovers(
    isPreclosed ? effectiveCompanyId : null,
    year,
    month,
  );
  const { data: reopenHistoryData, isLoading: isLoadingHistory } =
    useGetAssistanceMonthReopenHistory(
      historyModalOpen ? effectiveCompanyId : null,
      year,
      month,
      1,
      50,
    );
  const { mutate: confirmApproval, isPending: isConfirming } =
    useConfirmApproval(effectiveCompanyId);
  const { data: pinConfiguredData } = useGetClosingPinConfigured();
  const { mutate: updateClosingPin, isPending: isUpdatingPin } =
    useUpdateClosingPin();

  const isClosed = status === "CLOSED" || status === "PRECLOSED";
  const currentUserCanConfirm =
    isPreclosed &&
    approversData?.data?.some(
      (a: AssistanceMonthClosingApproverResponseDto) =>
        a.isCurrentUser && !a.approvedAt,
    );
  const pinConfigured = pinConfiguredData?.configured ?? false;
  const monthName = t(`months.${month}`);
  const stats = statusData?.stats ?? null;

  const companyOptions =
    companies?.data?.map((c) => ({
      value: c.publicId,
      label: c.businessName ?? c.publicId,
    })) ?? [];

  const handleCloseConfirm = useCallback(() => {
    if (!effectiveCompanyId) return;
    closeMonth(
      { year, month },
      {
        onSuccess: () => {
          toast({
            title: t("closeModal.success"),
          });
          setCloseModalOpen(false);
          refetch();
        },
        onError: (err: unknown) => {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message ?? t("closeModal.error")
            : t("closeModal.error");
          const countMatch = String(message).match(/(\d+)\s*incomplete/i);
          toast({
            title: t("errors.title"),
            description: countMatch
              ? t("errors.incompleteRecords", { count: countMatch[1] })
              : message,
            variant: "destructive",
          });
        },
      },
    );
  }, [effectiveCompanyId, year, month, closeMonth, toast, t, refetch]);

  const handlePrecloseConfirm = useCallback(() => {
    if (!effectiveCompanyId) return;
    precloseMonth(
      { year, month, approverUserIds: [] },
      {
        onSuccess: () => {
          toast({
            title: t("precloseModal.success"),
          });
          setPrecloseModalOpen(false);
          refetch();
        },
        onError: (err: unknown) => {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message ?? t("precloseModal.error")
            : t("precloseModal.error");
          const countMatch = String(message).match(/(\d+)\s*incomplete/i);
          toast({
            title: t("errors.title"),
            description: countMatch
              ? t("errors.incompleteRecords", { count: countMatch[1] })
              : message,
            variant: "destructive",
          });
        },
      },
    );
  }, [effectiveCompanyId, year, month, precloseMonth, toast, t, refetch]);

  const handleReopenConfirm = useCallback(
    (reason: string) => {
      if (!effectiveCompanyId) return;
      reopenMonth(
        { year, month, reason },
        {
          onSuccess: () => {
            toast({
              title: t("reopenModal.success"),
            });
            setReopenModalOpen(false);
            refetch();
          },
          onError: (err: unknown) => {
            const message = axios.isAxiosError(err)
              ? err.response?.data?.message ?? t("reopenModal.error")
              : t("reopenModal.error");
            toast({
              title: t("errors.title"),
              description: message,
              variant: "destructive",
            });
          },
        },
      );
    },
    [effectiveCompanyId, year, month, reopenMonth, toast, t, refetch],
  );

  const handleConfirmPin = useCallback(
    (pin: string) => {
      if (!effectiveCompanyId) return;
      confirmApproval(
        { year, month, pin },
        {
          onSuccess: () => {
            toast({
              title: t("confirmPinModalSuccess"),
            });
            setConfirmPinModalOpen(false);
            refetch();
          },
          onError: () => {
            toast({
              title: t("errors.title"),
              description: t("confirmPinModalError"),
              variant: "destructive",
            });
          },
        },
      );
    },
    [effectiveCompanyId, year, month, confirmApproval, toast, t, refetch],
  );

  const handleSaveClosingPin = useCallback(
    (currentPin: string | undefined, newPin: string) => {
      updateClosingPin(
        { currentPin, newPin },
        {
          onSuccess: () => {
            toast({
              title: t("closingPinConfig.success"),
            });
            setPinConfigModalOpen(false);
          },
          onError: (err: unknown) => {
            const message = axios.isAxiosError(err)
              ? err.response?.data?.message ?? t("confirmPinModalError")
              : t("confirmPinModalError");
            toast({
              title: t("errors.title"),
              description: message,
              variant: "destructive",
            });
          },
        },
      );
    },
    [updateClosingPin, toast, t],
  );

  return (
    <>
      <CHEKIOHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[
          t("breadcrumbs.dashboard"),
          t("breadcrumbs.maintainers"),
          t("breadcrumbs.assistanceMonthClosing"),
        ]}
        icon={LayoutList}
        actions={
          <div className="flex gap-2">
            <CHEKIOButton
              variant="secondaryBlue"
              onClick={() => setPinConfigModalOpen(true)}
            >
              <Lock className="h-4 w-4" />
              {t("buttons.configurePin")}
            </CHEKIOButton>
            <CHEKIOButton
              variant="refresh"
              onClick={() => refetch()}
              disabled={isLoadingStatus}
            >
              <RefreshCw className="h-4 w-4" />
              {t("buttons.refresh")}
            </CHEKIOButton>
          </div>
        }
      />

      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
        <h3 className="mb-4 text-base font-semibold text-gray-700">
          {t("filters.title")}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("filters.company")}
            </label>
          <CHEKIOSelect
            value={effectiveCompanyId ?? ""}
            onValueChange={(v) => setCompanyId(v || null)}
          >
            <CHEKIOSelectTrigger>
              <CHEKIOSelectValue placeholder={t("filters.companyPlaceholder")} />
            </CHEKIOSelectTrigger>
            <CHEKIOSelectContent>
              {companyOptions.map((opt) => (
                <CHEKIOSelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </CHEKIOSelectItem>
              ))}
            </CHEKIOSelectContent>
          </CHEKIOSelect>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("filters.year")}
          </label>
          <CHEKIOSelect
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <CHEKIOSelectTrigger>
              <CHEKIOSelectValue />
            </CHEKIOSelectTrigger>
            <CHEKIOSelectContent>
              {YEARS.map((y) => (
                <CHEKIOSelectItem key={y} value={String(y)}>
                  {y}
                </CHEKIOSelectItem>
              ))}
            </CHEKIOSelectContent>
          </CHEKIOSelect>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("filters.month")}
          </label>
          <CHEKIOSelect
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v) as Month)}
          >
            <CHEKIOSelectTrigger>
              <CHEKIOSelectValue />
            </CHEKIOSelectTrigger>
            <CHEKIOSelectContent>
              {MONTHS.map((m) => (
                <CHEKIOSelectItem key={m} value={String(m)}>
                  {t(`months.${m}`)}
                </CHEKIOSelectItem>
              ))}
            </CHEKIOSelectContent>
          </CHEKIOSelect>
        </div>
        </div>
      </div>

      {!effectiveCompanyId ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
            <LayoutList className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t("emptyState.title")}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            {t("emptyState.description")}
          </p>
        </div>
      ) : isLoadingStatus ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
          <div className="p-6">
            <div className="mb-6 h-4 w-48 animate-pulse rounded bg-gray-200" />
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="h-12 animate-pulse bg-gray-100" />
              <div className="h-16 animate-pulse bg-white" />
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col border-b border-gray-200 bg-gray-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium ${
                  isPreclosed
                    ? "bg-amber-100 text-amber-800"
                    : isClosed
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                }`}
              >
                {isClosed ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
                {t(`status.${status}`)}
              </span>
              <span className="text-gray-600">
                {monthName} {year}
              </span>
              {statusData?.reopenCount != null && statusData.reopenCount > 0 && (
                <span className="text-sm text-gray-500">
                  ({statusData.reopenCount} {t("reopenHistory.title").toLowerCase()})
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {!isClosed && (
                <>
                  <CHEKIOButton
                    variant="primary"
                    onClick={() => setCloseModalOpen(true)}
                    disabled={isClosing || isPreclosing}
                  >
                    <Lock className="h-4 w-4" />
                    {t("buttons.closeMonth")}
                  </CHEKIOButton>
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() => setPrecloseModalOpen(true)}
                    disabled={isClosing || isPreclosing}
                  >
                    <Lock className="h-4 w-4" />
                    {t("buttons.precloseMonth")}
                  </CHEKIOButton>
                </>
              )}
              {(isClosed || isPreclosed) && (
                <>
                  <CHEKIOButton
                    variant="primary"
                    onClick={() => setReopenModalOpen(true)}
                    disabled={isReopening}
                  >
                    <Unlock className="h-4 w-4" />
                    {t("buttons.reopenMonth")}
                  </CHEKIOButton>
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() => setHistoryModalOpen(true)}
                  >
                    <History className="h-4 w-4" />
                    {t("buttons.viewHistory")}
                  </CHEKIOButton>
                </>
              )}
              {effectiveCompanyId && (
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() => setUnitsDetailModalOpen(true)}
                >
                  <LayoutList className="h-4 w-4" />
                  {t("buttons.viewUnitsDetail")}
                </CHEKIOButton>
              )}
            </div>
          </div>

          {isPreclosed && approversData?.data && approversData.data.length > 0 && (
            <div className="border-t border-gray-200 px-5 py-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  {t("approvers.title")}
                </h3>
                {currentUserCanConfirm && (
                  <CHEKIOButton
                    variant="primary"
                    onClick={() => setConfirmPinModalOpen(true)}
                    disabled={isConfirming}
                  >
                    <Lock className="h-4 w-4" />
                    {t("buttons.confirmWithPin")}
                  </CHEKIOButton>
                )}
              </div>
              <ul className="space-y-1 text-sm text-gray-600">
                {approversData.data.map((a: AssistanceMonthClosingApproverResponseDto) => (
                  <li key={a.userId} className="flex items-center gap-2">
                    <span>{a.userName ?? a.userId}</span>
                    <span
                      className={
                        a.approvedAt
                          ? "text-green-600 font-medium"
                          : "text-amber-600"
                      }
                    >
                      {a.approvedAt
                        ? t("approvers.approved")
                        : t("approvers.pending")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stats && (
            <div className="border-t border-gray-200 px-5 py-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                {t("stats.title")}
              </h3>
              <div className="overflow-x-auto">
                <CHEKIOTable>
                  <CHEKIOTableHeader>
                    <tr>
                      <CHEKIOTableHead>
                        <span className="flex items-center gap-2">
                          <AlertCircle
                            className="h-4 w-4"
                            style={{ color: `${templateUser.primary}99` }}
                          />
                          {t("stats.countIncomplete")}
                        </span>
                      </CHEKIOTableHead>
                      <CHEKIOTableHead>
                        <span className="flex items-center gap-2">
                          <CheckCircle
                            className="h-4 w-4"
                            style={{ color: `${templateUser.primary}99` }}
                          />
                          {t("stats.countCompleted")}
                        </span>
                      </CHEKIOTableHead>
                      <CHEKIOTableHead>
                        <span className="flex items-center gap-2">
                          <UserX
                            className="h-4 w-4"
                            style={{ color: `${templateUser.primary}99` }}
                          />
                          {t("stats.countAbsent")}
                        </span>
                      </CHEKIOTableHead>
                      <CHEKIOTableHead>
                        <span className="flex items-center gap-2">
                          <XCircle
                            className="h-4 w-4"
                            style={{ color: `${templateUser.primary}99` }}
                          />
                          {t("stats.countWithoutSchedule")}
                        </span>
                      </CHEKIOTableHead>
                      <CHEKIOTableHead>
                        <span className="flex items-center gap-2">
                          <Activity
                            className="h-4 w-4"
                            style={{ color: `${templateUser.primary}99` }}
                          />
                          {t("stats.totalExtraSecondsApproved")}
                        </span>
                      </CHEKIOTableHead>
                      <CHEKIOTableHead>
                        <span className="flex items-center gap-2">
                          <Clock
                            className="h-4 w-4"
                            style={{ color: `${templateUser.primary}99` }}
                          />
                          {t("stats.totalDelaySecondsApproved")}
                        </span>
                      </CHEKIOTableHead>
                      <CHEKIOTableHead>
                        <span className="flex items-center gap-2">
                          <Calendar
                            className="h-4 w-4"
                            style={{ color: `${templateUser.primary}99` }}
                          />
                          {t("stats.calculatedAt")}
                        </span>
                      </CHEKIOTableHead>
                    </tr>
                  </CHEKIOTableHeader>
                  <CHEKIOTableBody>
                    <CHEKIOTableRow index={0}>
                      <CHEKIOTableCell className="tabular-nums">
                        {stats.countIncomplete}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="tabular-nums">
                        {stats.countCompleted}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="tabular-nums">
                        {stats.countAbsent}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="tabular-nums">
                        {stats.countWithoutSchedule}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="tabular-nums">
                        {Math.floor(stats.totalExtraSecondsApproved / 60)}{" "}
                        {t("stats.minutes")}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="tabular-nums">
                        {Math.floor(stats.totalDelaySecondsApproved / 60)}{" "}
                        {t("stats.minutes")}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="text-gray-600">
                        {stats.calculatedAt
                          ? DateTime.fromISO(stats.calculatedAt).toLocaleString(
                              DateTime.DATETIME_SHORT,
                            )
                          : "—"}
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  </CHEKIOTableBody>
                </CHEKIOTable>
              </div>
            </div>
          )}
        </div>
      )}

      <ModalCloseMonth
        open={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        onConfirm={handleCloseConfirm}
        isLoading={isClosing}
        year={year}
        month={month}
      />
      <ModalPrecloseMonth
        open={precloseModalOpen}
        onClose={() => setPrecloseModalOpen(false)}
        onConfirm={handlePrecloseConfirm}
        isLoading={isPreclosing}
        year={year}
        month={month}
      />
      <ModalReopenMonth
        open={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        onConfirm={handleReopenConfirm}
        isLoading={isReopening}
        year={year}
        month={month}
      />
      <ModalReopenHistory
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        data={reopenHistoryData?.data}
        isLoading={isLoadingHistory}
        year={year}
        month={month}
      />
      <ModalConfirmPin
        open={confirmPinModalOpen}
        onClose={() => setConfirmPinModalOpen(false)}
        onConfirm={handleConfirmPin}
        isLoading={isConfirming}
        year={year}
        month={month}
      />
      <ModalClosingPinConfig
        open={pinConfigModalOpen}
        onClose={() => setPinConfigModalOpen(false)}
        onSave={handleSaveClosingPin}
        isLoading={isUpdatingPin}
        pinConfigured={pinConfigured}
      />
      <ModalUnitsDetail
        open={unitsDetailModalOpen}
        onClose={() => setUnitsDetailModalOpen(false)}
        companyId={effectiveCompanyId}
        year={year}
        month={month}
      />
    </>
  );
}

export default function AssistanceMonthClosingPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.ASSISTANCE_MANAGMENT_OPERATIONS
      }
    >
      <AssistanceMonthClosingContent />
    </AccessNotGranted>
  );
}
