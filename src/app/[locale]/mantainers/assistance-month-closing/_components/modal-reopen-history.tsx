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
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import type { AssistanceMonthReopenAuditResponseDto } from "./assistance-month-closing.dto";

interface ModalReopenHistoryProps {
  open: boolean;
  onClose: () => void;
  data: AssistanceMonthReopenAuditResponseDto[] | undefined;
  isLoading: boolean;
  year: number;
  month: number;
}

export default function ModalReopenHistory({
  open,
  onClose,
  data,
  isLoading,
  year,
  month,
}: ModalReopenHistoryProps) {
  const t = useTranslations("mantainers.assistanceMonthClosing");
  const monthName = t(`months.${month}`);
  const list = data ?? [];

  return (
    <CHEKIOModal
      isOpen={open}
      onClose={onClose}
      title={t("reopenHistory.title")}
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <CHEKIOLoading size="lg" variant="modern" text="" />
        </div>
      ) : list.length === 0 ? (
        <p className="text-center py-6 text-gray-600">
          {t("reopenHistory.noData")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <CHEKIOTable>
            <CHEKIOTableHeader>
              <tr>
                <CHEKIOTableHead>
                  {t("reopenHistory.table.reopenedAt")}
                </CHEKIOTableHead>
                <CHEKIOTableHead>
                  {t("reopenHistory.table.reason")}
                </CHEKIOTableHead>
              </tr>
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {list.map((item, index) => (
                <CHEKIOTableRow key={item.id} index={index}>
                  <CHEKIOTableCell>
                    {DateTime.fromISO(item.reopenedAt).toFormat(
                      "dd/MM/yyyy HH:mm",
                    )}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>{item.reason}</CHEKIOTableCell>
                </CHEKIOTableRow>
              ))}
            </CHEKIOTableBody>
          </CHEKIOTable>
        </div>
      )}
    </CHEKIOModal>
  );
}
