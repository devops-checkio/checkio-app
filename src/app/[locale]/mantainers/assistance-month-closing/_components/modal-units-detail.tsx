"use client";

import {
  CHEKIOLoading,
  CHEKIOModal,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { useGetAssistanceMonthClosingList } from "@/service/mantainer.service";
import { useTranslations } from "next-intl";
import type { AssistanceMonthClosingResponseDto } from "./assistance-month-closing.dto";

interface ModalUnitsDetailProps {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  year: number;
  month: number;
}

export default function ModalUnitsDetail({
  open,
  onClose,
  companyId,
  year,
  month,
}: ModalUnitsDetailProps) {
  const t = useTranslations("mantainers.assistanceMonthClosing");
  const { data: listData, isLoading } = useGetAssistanceMonthClosingList(
    open ? companyId : null,
    year,
    month,
  );
  const items = listData?.data ?? [];

  return (
    <CHEKIOModal
      isOpen={open}
      onClose={onClose}
      title={t("unitsDetail.title")}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t("unitsDetail.description", {
            month: t(`months.${month}`),
            year,
          })}
        </p>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <CHEKIOLoading size="lg" variant="modern" text="" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            {t("unitsDetail.noData")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <CHEKIOTable>
              <CHEKIOTableHeader>
                <tr>
                  <CHEKIOTableHead>{t("unitsDetail.scope")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("unitsDetail.status")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("stats.countIncomplete")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("stats.countCompleted")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("stats.countAbsent")}</CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {t("stats.countWithoutSchedule")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {t("stats.totalExtraSecondsApproved")}
                  </CHEKIOTableHead>
                  <CHEKIOTableHead>
                    {t("stats.totalDelaySecondsApproved")}
                  </CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {items.map((row: AssistanceMonthClosingResponseDto, index: number) => (
                  <CHEKIOTableRow key={row.id} index={index}>
                    <CHEKIOTableCell>
                      {row.scopeType === "ORGANIZATIONAL_UNIT" && row.organizationalUnitName
                        ? row.organizationalUnitName
                        : t("unitsDetail.companyScope")}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          row.status === "CLOSED"
                            ? "bg-red-100 text-red-800"
                            : row.status === "PRECLOSED"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {t(`status.${row.status}`)}
                      </span>
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="tabular-nums">
                      {row.stats?.countIncomplete ?? "—"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="tabular-nums">
                      {row.stats?.countCompleted ?? "—"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="tabular-nums">
                      {row.stats?.countAbsent ?? "—"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="tabular-nums">
                      {row.stats?.countWithoutSchedule ?? "—"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="tabular-nums">
                      {row.stats != null
                        ? `${Math.floor(row.stats.totalExtraSecondsApproved / 60)} ${t("stats.minutes")}`
                        : "—"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="tabular-nums">
                      {row.stats != null
                        ? `${Math.floor(row.stats.totalDelaySecondsApproved / 60)} ${t("stats.minutes")}`
                        : "—"}
                    </CHEKIOTableCell>
                  </CHEKIOTableRow>
                ))}
              </CHEKIOTableBody>
            </CHEKIOTable>
          </div>
        )}
      </div>
    </CHEKIOModal>
  );
}
