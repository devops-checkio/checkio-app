"use client";

import {
  CHEKIOActionButton,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export type BulkBucket = "validated" | "errors" | "loaded";

export type BulkRowStatus = "pending" | "processing" | "success";

export interface BulkRow {
  id: string;
  excelRow: number;
  code: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  documentType: string;
  documentNumber: string;
  personalEmail: string;
  personalPhone: string;
  birthDate: string;
  gender: string;
  branchCode: string;
  branchId?: string;
  branchLabel: string;
  bucket: BulkBucket;
  status: BulkRowStatus;
  errors: string[];
}

export type BulkTableVariant = "validated" | "errors" | "loaded";

interface StudentsBulkUploadTableProps {
  rows: BulkRow[];
  variant: BulkTableVariant;
  onRemoveRow?: (id: string) => void;
}

const actionButtonClass =
  "flex items-center gap-1.5 px-2 py-1.5 h-auto w-auto min-w-fit";

export function StudentsBulkUploadTable({
  rows,
  variant,
  onRemoveRow,
}: StudentsBulkUploadTableProps) {
  const t = useTranslations("mantainers.students");

  const showRemove = Boolean(onRemoveRow) && variant !== "loaded";
  const colCount = 8 + (showRemove ? 1 : 0);

  const emptyMessage =
    variant === "validated"
      ? t("bulkUpload.tabs.empty.validated")
      : variant === "errors"
        ? t("bulkUpload.tabs.empty.errors")
        : t("bulkUpload.tabs.empty.loaded");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full">
        <div className="w-full overflow-x-auto">
          <CHEKIOTable className="rounded-none border-0 shadow-none w-full">
            <CHEKIOTableHeader>
              <tr>
                <CHEKIOTableHead className="w-auto text-xs whitespace-nowrap">
                  {t("bulkUpload.rowNumber")}
                </CHEKIOTableHead>
                <CHEKIOTableHead className="w-auto text-xs">
                  {t("bulkUpload.columns.code")}
                </CHEKIOTableHead>
                <CHEKIOTableHead className="w-auto text-xs">
                  {t("bulkUpload.preview.fullName")}
                </CHEKIOTableHead>
                <CHEKIOTableHead className="w-auto text-xs">
                  {t("bulkUpload.columns.documentType")}
                </CHEKIOTableHead>
                <CHEKIOTableHead className="w-auto text-xs">
                  {t("bulkUpload.columns.documentNumber")}
                </CHEKIOTableHead>
                <CHEKIOTableHead className="w-auto text-xs">
                  {t("bulkUpload.preview.email")}
                </CHEKIOTableHead>
                <CHEKIOTableHead className="w-auto text-xs">
                  {t("bulkUpload.preview.branch")}
                </CHEKIOTableHead>
                {variant === "errors" ? (
                  <CHEKIOTableHead className="min-w-[180px] text-xs">
                    {t("bulkUpload.preview.errorColumn")}
                  </CHEKIOTableHead>
                ) : (
                  <CHEKIOTableHead className="w-auto text-xs">
                    {t("bulkUpload.preview.status")}
                  </CHEKIOTableHead>
                )}
                {showRemove && (
                  <CHEKIOTableHead className="min-w-[100px] text-xs">
                    {t("table.headers.actions")}
                  </CHEKIOTableHead>
                )}
              </tr>
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {rows.length === 0 ? (
                <CHEKIOTableRow index={0}>
                  <CHEKIOTableCell
                    colSpan={colCount}
                    className="text-center text-gray-500 py-8 text-xs"
                  >
                    {emptyMessage}
                  </CHEKIOTableCell>
                </CHEKIOTableRow>
              ) : (
                rows.map((row, index) => {
                  const fullName = [
                    row.firstName,
                    row.lastName,
                    row.secondLastName,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <CHEKIOTableRow key={row.id} index={index}>
                      <CHEKIOTableCell className="text-xs tabular-nums text-gray-600">
                        {row.excelRow}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="text-xs tabular-nums">
                        {row.code}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="text-xs">
                        {fullName}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="text-xs tabular-nums">
                        {row.documentType}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="text-xs tabular-nums">
                        {row.documentNumber}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="text-xs">
                        {row.personalEmail}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="text-xs">
                        {row.branchLabel}
                      </CHEKIOTableCell>
                      {variant === "errors" ? (
                        <CHEKIOTableCell className="text-xs align-top">
                          <ul className="list-disc pl-4 space-y-0.5 text-red-600">
                            {row.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </CHEKIOTableCell>
                      ) : variant === "loaded" ? (
                        <CHEKIOTableCell className="text-xs">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            {t("bulkUpload.badge.loaded")}
                          </span>
                        </CHEKIOTableCell>
                      ) : (
                        <CHEKIOTableCell className="text-xs">
                          {row.status === "processing" ? (
                            <span className="text-blue-600">
                              {t("bulkUpload.badge.processing")}
                            </span>
                          ) : (
                            <span className="text-gray-500">
                              {t("bulkUpload.badge.pending")}
                            </span>
                          )}
                        </CHEKIOTableCell>
                      )}
                      {showRemove && onRemoveRow && (
                        <CHEKIOTableCell
                          className="min-w-[100px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <CHEKIOActionButton
                                variant="delete"
                                size="sm"
                                type="button"
                                onClick={() => onRemoveRow(row.id)}
                                className={actionButtonClass}
                              >
                                <Trash2 className="h-3 w-3 flex-shrink-0" />
                              </CHEKIOActionButton>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("bulkUpload.actions.removeRow")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </CHEKIOTableCell>
                      )}
                    </CHEKIOTableRow>
                  );
                })
              )}
            </CHEKIOTableBody>
          </CHEKIOTable>
        </div>
      </div>
    </TooltipProvider>
  );
}
