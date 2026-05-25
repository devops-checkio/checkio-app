"use client";

import { CHEKIOButton, CHEKIOLoading } from "@/components";
import {
  GlobalEstablishmentAttendanceCenterDto,
  GlobalEstablishmentAttendanceRiskLevel,
} from "@/app/[locale]/mantainers/establishments/_components/establishment.dto";
import { DateTime } from "luxon";
import { ExternalLink, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

function riskBadgeClass(risk: GlobalEstablishmentAttendanceRiskLevel) {
  switch (risk) {
    case GlobalEstablishmentAttendanceRiskLevel.CRITICAL:
      return "bg-red-100 text-red-800 ring-red-200";
    case GlobalEstablishmentAttendanceRiskLevel.ATTENTION:
      return "bg-amber-100 text-amber-900 ring-amber-200";
    default:
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
  }
}

interface GlobalEstablishmentCardsProps {
  centers?: GlobalEstablishmentAttendanceCenterDto[];
  isLoading?: boolean;
}

export default function GlobalEstablishmentCards({
  centers,
  isLoading,
}: GlobalEstablishmentCardsProps) {
  const t = useTranslations("assistanceEstablishmentsDashboard");
  const router = useRouter();
  const locale = useLocale();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <CHEKIOLoading />
          </div>
        ))}
      </div>
    );
  }

  if (!centers?.length) {
    return (
      <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
        {t("cards.empty")}
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {centers.map((c) => (
        <article
          key={c.establishmentId}
          className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900">{c.name}</h3>
              <p className="text-xs text-gray-500">{c.code}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${riskBadgeClass(c.riskLevel)}`}
            >
              {t(`risk.${c.riskLevel}`)}
            </span>
          </div>
          <p className="mt-2 flex items-start gap-1 text-xs text-gray-600">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="line-clamp-2">{c.address}</span>
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs text-gray-500">% {t("ranking.presencePct")}</dt>
              <dd className="font-semibold text-gray-900">
                {c.summary.presencePercentage}%
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">{t("ranking.absent")}</dt>
              <dd className="font-semibold text-gray-900">
                {c.summary.absentCount + c.summary.notArrivedCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">{t("ranking.inside")}</dt>
              <dd className="font-semibold text-gray-900">{c.summary.insideCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">{t("ranking.exited")}</dt>
              <dd className="font-semibold text-gray-900">{c.summary.exitedCount}</dd>
            </div>
          </dl>
          {c.lastMarkAt && (
            <p className="mt-3 text-xs text-gray-500">
              {t("cards.lastEvent")}:{" "}
              {DateTime.fromISO(c.lastMarkAt).toFormat("yyyy-MM-dd HH:mm")}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <CHEKIOButton
              variant="secondaryBlue"
              size="sm"
              onClick={() =>
                router.push(
                  `/${locale}/mantainers/establishments/${c.establishmentId}`,
                )
              }
            >
              <ExternalLink className="mr-1 h-3.5 w-3.5" />
              {t("cards.viewDetail")}
            </CHEKIOButton>
          </div>
        </article>
      ))}
    </div>
  );
}
