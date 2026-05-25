"use client";

import {
  CHEKIOButton,
  CHEKIOLoading,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import {
  GlobalEstablishmentAttendanceCenterDto,
  GlobalEstablishmentAttendanceRiskLevel,
} from "@/app/[locale]/mantainers/establishments/_components/establishment.dto";
import { ExternalLink } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

function riskBadgeClass(risk: GlobalEstablishmentAttendanceRiskLevel) {
  switch (risk) {
    case GlobalEstablishmentAttendanceRiskLevel.CRITICAL:
      return "bg-red-100 text-red-800";
    case GlobalEstablishmentAttendanceRiskLevel.ATTENTION:
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-emerald-100 text-emerald-900";
  }
}

interface GlobalEstablishmentRankingTableProps {
  ranking?: GlobalEstablishmentAttendanceCenterDto[];
  isLoading?: boolean;
}

export default function GlobalEstablishmentRankingTable({
  ranking,
  isLoading,
}: GlobalEstablishmentRankingTableProps) {
  const t = useTranslations("assistanceEstablishmentsDashboard");
  const router = useRouter();
  const locale = useLocale();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8">
        <CHEKIOLoading />
      </div>
    );
  }

  const rows = ranking ?? [];

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <CHEKIOTable>
        <CHEKIOTableHeader>
          <CHEKIOTableRow className="bg-gray-50">
            <CHEKIOTableHead className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("ranking.establishment")}
            </CHEKIOTableHead>
            <CHEKIOTableHead className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("ranking.expected")}
            </CHEKIOTableHead>
            <CHEKIOTableHead className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("ranking.present")}
            </CHEKIOTableHead>
            <CHEKIOTableHead className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("ranking.absent")}
            </CHEKIOTableHead>
            <CHEKIOTableHead className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("ranking.presencePct")}
            </CHEKIOTableHead>
            <CHEKIOTableHead className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("ranking.inside")}
            </CHEKIOTableHead>
            <CHEKIOTableHead className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("ranking.exited")}
            </CHEKIOTableHead>
            <CHEKIOTableHead className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("ranking.late")}
            </CHEKIOTableHead>
            <CHEKIOTableHead className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("ranking.earlyExit")}
            </CHEKIOTableHead>
            <CHEKIOTableHead className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("ranking.noCheckout")}
            </CHEKIOTableHead>
            <CHEKIOTableHead className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("ranking.risk")}
            </CHEKIOTableHead>
            <CHEKIOTableHead className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {t("ranking.actions")}
            </CHEKIOTableHead>
          </CHEKIOTableRow>
        </CHEKIOTableHeader>
        <CHEKIOTableBody>
          {rows.length === 0 ? (
            <CHEKIOTableRow>
              <CHEKIOTableCell colSpan={12} className="py-8 text-center text-gray-500">
                {t("cards.empty")}
              </CHEKIOTableCell>
            </CHEKIOTableRow>
          ) : (
            rows.map((c) => (
              <CHEKIOTableRow key={c.establishmentId} className="hover:bg-gray-50/80">
                <CHEKIOTableCell>
                  <div>
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.code}</div>
                  </div>
                </CHEKIOTableCell>
                <CHEKIOTableCell>{c.summary.expectedCount}</CHEKIOTableCell>
                <CHEKIOTableCell>{c.summary.presentCount}</CHEKIOTableCell>
                <CHEKIOTableCell>
                  {c.summary.absentCount + c.summary.notArrivedCount}
                </CHEKIOTableCell>
                <CHEKIOTableCell>{c.summary.presencePercentage}%</CHEKIOTableCell>
                <CHEKIOTableCell>{c.summary.insideCount}</CHEKIOTableCell>
                <CHEKIOTableCell>{c.summary.exitedCount}</CHEKIOTableCell>
                <CHEKIOTableCell>{c.summary.lateCount}</CHEKIOTableCell>
                <CHEKIOTableCell>{c.summary.earlyDepartureCount}</CHEKIOTableCell>
                <CHEKIOTableCell>{c.summary.missingCheckoutCount}</CHEKIOTableCell>
                <CHEKIOTableCell>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${riskBadgeClass(c.riskLevel)}`}
                  >
                    {t(`risk.${c.riskLevel}`)}
                  </span>
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <CHEKIOButton
                    variant="secondary"
                    size="sm"
                    aria-label={t("cards.viewDetail")}
                    onClick={() =>
                      router.push(
                        `/${locale}/mantainers/establishments/${c.establishmentId}`,
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                  </CHEKIOButton>
                </CHEKIOTableCell>
              </CHEKIOTableRow>
            ))
          )}
        </CHEKIOTableBody>
      </CHEKIOTable>
    </div>
  );
}
