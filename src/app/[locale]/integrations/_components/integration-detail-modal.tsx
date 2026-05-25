"use client";

import { CHEKIOButton, CHEKIOModal } from "@/components";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import {
  IntegrationResponseDto,
  IntegrationStatus,
} from "./integration.dto";

const METADATA_SECRET_KEY_HINTS = [
  "password",
  "secret",
  "apikey",
  "token",
  "privatekey",
  "pass",
];

function isSecretMetadataKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower === "apikey" ||
    METADATA_SECRET_KEY_HINTS.some((hint) => lower.includes(hint))
  );
}

function formatMetadataForDisplay(
  meta: Record<string, unknown> | null
): { key: string; value: string }[] {
  if (!meta || Object.keys(meta).length === 0) {
    return [];
  }
  return Object.entries(meta).map(([key, raw]) => {
    if (isSecretMetadataKey(key)) {
      const hasValue =
        raw !== null &&
        raw !== undefined &&
        String(raw).trim() !== "";
      return {
        key,
        value: hasValue ? "••••••••" : "—",
      };
    }
    if (raw !== null && typeof raw === "object") {
      return { key, value: JSON.stringify(raw, null, 2) };
    }
    return { key, value: raw === null || raw === undefined ? "—" : String(raw) };
  });
}

interface IntegrationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: IntegrationResponseDto | null;
}

export default function IntegrationDetailModal({
  isOpen,
  onClose,
  integration,
}: IntegrationDetailModalProps) {
  const t = useTranslations("integrations");

  if (!integration) {
    return null;
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return DateTime.fromISO(iso).toFormat("dd/MM/yyyy HH:mm");
  };

  const statusLabel = (() => {
    switch (integration.status) {
      case IntegrationStatus.ACTIVE:
        return t("detailSheet.status.active");
      case IntegrationStatus.INACTIVE:
        return t("detailSheet.status.inactive");
      case IntegrationStatus.ERROR:
        return t("detailSheet.status.error");
      case IntegrationStatus.PENDING:
        return t("detailSheet.status.pending");
      default:
        return t("detailSheet.status.unknown");
    }
  })();

  const metaRows = formatMetadataForDisplay(integration.metadata);

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t("detailSheet.title")} — ${integration.name}`}
      size="3xl"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("detailSheet.fields.status")}
            </p>
            <p className="font-semibold text-gray-900">{statusLabel}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("detailSheet.fields.publicId")}
            </p>
            <p className="font-mono text-xs break-all text-gray-800">
              {integration.publicId}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("detailSheet.fields.description")}
            </p>
            <p className="text-gray-800">
              {integration.description?.trim()
                ? integration.description
                : "—"}
            </p>
          </div>
        </div>

        {integration.status === IntegrationStatus.ERROR &&
          integration.lastFailureMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
              <p className="font-semibold text-red-800 mb-1">
                {t("detailSheet.lastFailureMessage")}
              </p>
              <p className="text-red-900 whitespace-pre-wrap break-words">
                {integration.lastFailureMessage}
              </p>
            </div>
          )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs border-t border-gray-100 pt-4">
          <div>
            <p className="text-gray-500 font-medium mb-0.5">
              {t("detailSheet.fields.lastSuccess")}
            </p>
            <p className="text-gray-900 font-semibold">
              {formatDate(integration.lastSuccessfulExecution)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-0.5">
              {t("detailSheet.fields.nextRun")}
            </p>
            <p className="text-gray-900 font-semibold">
              {formatDate(integration.nextExecution)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-0.5">
              {t("detailSheet.fields.lastFailure")}
            </p>
            <p className="text-gray-900 font-semibold text-red-700">
              {formatDate(integration.lastFailure)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {t("detailSheet.fields.integrationTypes")}
          </p>
          <div className="flex flex-wrap gap-1">
            {integration.integrationTypes.length === 0 ? (
              <span className="text-sm text-gray-500">—</span>
            ) : (
              integration.integrationTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-xs text-gray-800"
                >
                  {type}
                </span>
              ))
            )}
          </div>
        </div>

        {integration.schedule &&
          (integration.schedule.days?.length > 0 ||
            integration.schedule.timeSlots?.length > 0) && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                {t("detailSheet.fields.schedule")}
              </p>
              <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(integration.schedule, null, 2)}
              </pre>
            </div>
          )}

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {t("detailSheet.fields.metadata")}
          </p>
          {metaRows.length === 0 ? (
            <p className="text-sm text-gray-500">—</p>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {metaRows.map((row) => (
                <div
                  key={row.key}
                  className="px-3 py-2 grid grid-cols-1 md:grid-cols-3 gap-1 text-xs"
                >
                  <span className="font-medium text-gray-600">{row.key}</span>
                  <span className="md:col-span-2 font-mono break-all text-gray-900">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <CHEKIOButton variant="secondaryBlue" type="button" onClick={onClose}>
            {t("detailSheet.close")}
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
}
