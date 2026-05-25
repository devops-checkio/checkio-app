"use client";

import {
  CHEKIOButton,
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
import { PaginationFilterDto } from "@/dto/pagination";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import {
  EstablishmentAttendanceOperationalStatus,
  EstablishmentAttendanceStudentDto,
} from "../../_components/establishment.dto";

interface EstablishmentAttendanceTableProps {
  students: EstablishmentAttendanceStudentDto[];
  pagination?: PaginationFilterDto;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const statusClassName: Record<EstablishmentAttendanceOperationalStatus, string> = {
  [EstablishmentAttendanceOperationalStatus.ALL]: "bg-gray-100 text-gray-700",
  [EstablishmentAttendanceOperationalStatus.PRESENT]: "bg-emerald-50 text-emerald-700",
  [EstablishmentAttendanceOperationalStatus.INSIDE]: "bg-blue-50 text-blue-700",
  [EstablishmentAttendanceOperationalStatus.EXITED]: "bg-slate-100 text-slate-700",
  [EstablishmentAttendanceOperationalStatus.ABSENT]: "bg-red-50 text-red-700",
  [EstablishmentAttendanceOperationalStatus.NOT_ARRIVED]: "bg-amber-50 text-amber-700",
  [EstablishmentAttendanceOperationalStatus.INCOMPLETE]: "bg-orange-50 text-orange-700",
  [EstablishmentAttendanceOperationalStatus.WITHOUT_SCHEDULE]:
    "bg-cyan-50 text-cyan-700",
};

export default function EstablishmentAttendanceTable({
  students,
  pagination,
  onPageChange,
  onPageSizeChange,
}: EstablishmentAttendanceTableProps) {
  const t = useTranslations("mantainers.establishments.attendance.table");
  const current = pagination?.current ?? 1;
  const pageSize = pagination?.pageSize ?? 10;
  const totalPages = pagination?.totalPages ?? 1;
  const totalCount = pagination?.totalCount ?? students.length;

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50/70 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">{t("title")}</h3>
        <p className="text-xs text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="overflow-x-auto">
        <CHEKIOTable>
          <CHEKIOTableHeader>
            <tr>
              <CHEKIOTableHead>
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("headers.student")}
                </span>
              </CHEKIOTableHead>
              <CHEKIOTableHead>
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {t("headers.date")}
                </span>
              </CHEKIOTableHead>
              <CHEKIOTableHead>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("headers.schedule")}
                </span>
              </CHEKIOTableHead>
              <CHEKIOTableHead>
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {t("headers.checkIn")}
                </span>
              </CHEKIOTableHead>
              <CHEKIOTableHead>
                <span className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  {t("headers.checkOut")}
                </span>
              </CHEKIOTableHead>
              <CHEKIOTableHead>
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {t("headers.status")}
                </span>
              </CHEKIOTableHead>
              <CHEKIOTableHead>{t("headers.minutes")}</CHEKIOTableHead>
              <CHEKIOTableHead>{t("headers.alerts")}</CHEKIOTableHead>
            </tr>
          </CHEKIOTableHeader>
          <CHEKIOTableBody>
            {students.length === 0 ? (
              <CHEKIOTableRow index={0}>
                <CHEKIOTableCell colSpan={8} className="py-10 text-center text-gray-500">
                  {t("empty")}
                </CHEKIOTableCell>
              </CHEKIOTableRow>
            ) : (
              students.map((student, index) => (
                <CHEKIOTableRow key={student.employeeSchedulePublicId} index={index}>
                  <CHEKIOTableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.documentType} {student.documentNumber}
                      </p>
                    </div>
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>{formatDate(student.date)}</CHEKIOTableCell>
                  <CHEKIOTableCell>
                    <div>
                      <p className="font-medium text-gray-800">
                        {student.scheduleName ?? "-"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(student.scheduleStartAt)} -{" "}
                        {formatTime(student.scheduleEndAt)}
                      </p>
                    </div>
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>{formatTime(student.firstCheckInAt)}</CHEKIOTableCell>
                  <CHEKIOTableCell>{formatTime(student.lastCheckOutAt)}</CHEKIOTableCell>
                  <CHEKIOTableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        statusClassName[student.operationalStatus]
                      }`}
                    >
                      {t(`status.${student.operationalStatus}`)}
                    </span>
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>{student.minutesInside} min</CHEKIOTableCell>
                  <CHEKIOTableCell>
                    <div className="flex flex-wrap gap-1">
                      {student.lateMinutes > 0 && (
                        <AlertBadge label={t("alerts.late", { minutes: student.lateMinutes })} />
                      )}
                      {student.earlyDepartureMinutes > 0 && (
                        <AlertBadge
                          label={t("alerts.early", {
                            minutes: student.earlyDepartureMinutes,
                          })}
                        />
                      )}
                      {student.hasMissingCheckout && (
                        <AlertBadge label={t("alerts.missingCheckout")} />
                      )}
                      {student.pendingMarksCount > 0 && (
                        <AlertBadge label={t("alerts.pendingMarks")} />
                      )}
                    </div>
                  </CHEKIOTableCell>
                </CHEKIOTableRow>
              ))
            )}
          </CHEKIOTableBody>
        </CHEKIOTable>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{t("pagination.rowsPerPage")}</span>
          <CHEKIOSelect
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <CHEKIOSelectTrigger className="w-24">
              <CHEKIOSelectValue />
            </CHEKIOSelectTrigger>
            <CHEKIOSelectContent>
              {[10, 20, 50, 100, 200].map((option) => (
                <CHEKIOSelectItem key={option} value={String(option)}>
                  {option}
                </CHEKIOSelectItem>
              ))}
            </CHEKIOSelectContent>
          </CHEKIOSelect>
          <span>{t("pagination.total", { total: totalCount })}</span>
        </div>

        <div className="flex items-center gap-2">
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={() => onPageChange(current - 1)}
            disabled={current <= 1}
            aria-label={t("pagination.previous")}
          >
            <ChevronLeft className="h-4 w-4" />
            {t("pagination.previous")}
          </CHEKIOButton>
          <span className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
            {current} / {totalPages}
          </span>
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={() => onPageChange(current + 1)}
            disabled={current >= totalPages}
            aria-label={t("pagination.next")}
          >
            {t("pagination.next")}
            <ChevronRight className="h-4 w-4" />
          </CHEKIOButton>
        </div>
      </div>
    </section>
  );
}

function AlertBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      {label}
    </span>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  return DateTime.fromISO(value).toFormat("dd/MM/yyyy");
}

function formatTime(value?: string) {
  if (!value) return "-";
  return DateTime.fromISO(value).toFormat("HH:mm");
}
