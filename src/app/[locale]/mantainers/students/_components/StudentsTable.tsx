"use client";

import {
  CHEKIOButton,
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
import { useCookieSession } from "@/context/useCookieSession";
import type { StudentResponseDto } from "@/dto/students/student-response.dto";
import { Badge, Building2, Hash, Mail, Pencil, Trash2, UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface StudentsTableProps {
  students: StudentResponseDto[];
  isLoading: boolean;
  error: Error | null;
  onRefetch: () => void;
  canEdit: boolean;
  canRemove: boolean;
  onEdit: (student: StudentResponseDto) => void;
  onDeleteClick: (student: StudentResponseDto) => void;
  isDeleting: boolean;
  itemsPerPage?: number;
}

export function StudentsTable({
  students,
  isLoading,
  error,
  onRefetch,
  canEdit,
  canRemove,
  onEdit,
  onDeleteClick,
  isDeleting,
  itemsPerPage = 10,
}: StudentsTableProps) {
  const t = useTranslations("mantainers.students");
  const { getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();

  if (error) {
    return (
      <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-red-600 text-xs">
            {t("loadError.message")}
            {error.message ? `: ${error.message}` : ""}
          </span>
          <CHEKIOButton
            variant="secondaryBlue"
            size="sm"
            onClick={onRefetch}
            className="flex items-center gap-1.5 px-2 py-1.5 h-auto w-auto min-w-fit"
          >
            <span className="text-xs whitespace-nowrap">
              {t("loadError.retry")}
            </span>
          </CHEKIOButton>
        </div>
      </div>
    );
  }

  const showActions = canEdit || canRemove;
  const colCount = showActions ? 6 : 5;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full">
        <div className="w-full overflow-x-auto">
          <CHEKIOTable className="rounded-none border-0 shadow-none w-full">
            <CHEKIOTableHeader>
              <tr>
                <CHEKIOTableHead className="min-w-[110px]">
                  <span className="flex items-center gap-2">
                    <Hash className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                    {t("table.headers.code")}
                  </span>
                </CHEKIOTableHead>
                <CHEKIOTableHead className="min-w-[180px]">
                  <span className="flex items-center gap-2">
                    <UserRound className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                    {t("table.headers.name")}
                  </span>
                </CHEKIOTableHead>
                <CHEKIOTableHead className="min-w-[150px]">
                  <span className="flex items-center gap-2">
                    <Badge className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                    {t("table.headers.document")}
                  </span>
                </CHEKIOTableHead>
                <CHEKIOTableHead className="min-w-[220px]">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                    {t("table.headers.email")}
                  </span>
                </CHEKIOTableHead>
                <CHEKIOTableHead className="min-w-[160px]">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" style={{ color: `${templateUser.primary}99` }} />
                    {t("table.headers.branch")}
                  </span>
                </CHEKIOTableHead>
                {showActions && (
                  <CHEKIOTableHead className="min-w-[100px] text-right">
                    {t("table.headers.actions")}
                  </CHEKIOTableHead>
                )}
              </tr>
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {isLoading ? (
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <CHEKIOTableRow key={`loading-${index}`} index={index}>
                    {Array.from({ length: colCount }).map((_, cellIndex) => {
                      const isActionsColumn =
                        showActions && cellIndex === colCount - 1;
                      return (
                        <CHEKIOTableCell
                          key={cellIndex}
                          className={
                            isActionsColumn
                              ? "px-5 py-3.5 text-right"
                              : "px-5 py-3.5"
                          }
                        >
                          {isActionsColumn ? (
                            <div className="ml-auto h-8 w-20 max-w-full animate-pulse rounded-lg bg-gray-200" />
                          ) : (
                            <div className="h-4 w-full min-w-0 max-w-full animate-pulse rounded bg-gray-200" />
                          )}
                        </CHEKIOTableCell>
                      );
                    })}
                  </CHEKIOTableRow>
                ))
              ) : students.length === 0 ? (
                <CHEKIOTableRow index={0}>
                  <CHEKIOTableCell
                    colSpan={colCount}
                    className="px-6 py-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
                        <Users className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {t("table.noData")}
                      </h3>
                      <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
                        {t("subtitle")}
                      </p>
                    </div>
                  </CHEKIOTableCell>
                </CHEKIOTableRow>
              ) : (
                students.map((student, index) => (
                  <CHEKIOTableRow
                    key={student.publicId}
                    index={index}
                  >
                    <CHEKIOTableCell className="px-5 py-3.5 font-mono text-sm text-gray-600 tabular-nums">
                      {student.code}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                      {student.secondLastName
                        ? ` ${student.secondLastName}`
                        : ""}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600 tabular-nums">
                      {student.documentType} {student.documentNumber}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                      {student.personalEmail || "-"}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                      {student.Branch?.name ?? "-"}
                    </CHEKIOTableCell>
                    {showActions && (
                      <CHEKIOTableCell
                        onClick={(e) => e.stopPropagation()}
                        className="px-5 py-3.5 text-right"
                      >
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(student);
                                  }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                                  title={t("buttons.edit")}
                                  aria-label={t("buttons.edit")}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t("buttons.edit")}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {canRemove && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteClick(student);
                                  }}
                                  disabled={isDeleting}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                                  title={t("buttons.delete")}
                                  aria-label={t("buttons.delete")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t("buttons.delete")}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </CHEKIOTableCell>
                    )}
                  </CHEKIOTableRow>
                ))
              )}
            </CHEKIOTableBody>
          </CHEKIOTable>
        </div>
      </div>
    </TooltipProvider>
  );
}
