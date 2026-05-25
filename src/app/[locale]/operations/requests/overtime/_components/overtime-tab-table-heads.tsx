"use client";

import { CHEKIOTableHead } from "@/components";
import {
  Activity,
  CalendarClock,
  CalendarPlus,
  Clock,
  Layers,
  MessageSquare,
  Timer,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const headerSpanClass =
  "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider";

function OvertimeHeadCell({
  icon: Icon,
  label,
  templatePrimary,
}: {
  icon: LucideIcon;
  label: string;
  templatePrimary: string;
}) {
  return (
    <CHEKIOTableHead>
      <span className={headerSpanClass}>
        <Icon
          className="h-4 w-4"
          style={{ color: `${templatePrimary}99` }}
          aria-hidden
        />
        {label}
      </span>
    </CHEKIOTableHead>
  );
}

function OvertimeHeadActions({ label }: { label: string }) {
  return (
    <CHEKIOTableHead className="min-w-[120px] text-right text-xs font-semibold uppercase tracking-wider">
      {label}
    </CHEKIOTableHead>
  );
}

export function PendingOvertimeTableHeadRow({
  t,
  templatePrimary,
  showActionsColumn,
}: {
  t: (key: string) => string;
  templatePrimary: string;
  showActionsColumn: boolean;
}) {
  return (
    <tr>
      <OvertimeHeadCell
        icon={Users}
        label={t("table.headers.employee")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Layers}
        label={t("table.headers.type")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={CalendarPlus}
        label={t("table.headers.startDate")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={CalendarClock}
        label={t("table.headers.endDate")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Timer}
        label={t("table.headers.beforeMinutes")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Timer}
        label={t("table.headers.afterMinutes")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Clock}
        label={t("table.headers.createdAt")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Activity}
        label={t("table.headers.status")}
        templatePrimary={templatePrimary}
      />
      {showActionsColumn && (
        <OvertimeHeadActions label={t("table.headers.actions")} />
      )}
    </tr>
  );
}

export function ApprovedOvertimeTableHeadRow({
  t,
  templatePrimary,
}: {
  t: (key: string) => string;
  templatePrimary: string;
}) {
  return (
    <tr>
      <OvertimeHeadCell
        icon={Users}
        label={t("table.headers.employee")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Layers}
        label={t("table.headers.type")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={CalendarPlus}
        label={t("table.headers.startDate")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={CalendarClock}
        label={t("table.headers.endDate")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Timer}
        label={t("table.headers.beforeMinutes")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Timer}
        label={t("table.headers.afterMinutes")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={UserCheck}
        label={t("table.headers.authorizedBy")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Clock}
        label={t("table.headers.createdAt")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Activity}
        label={t("table.headers.status")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadActions label={t("table.headers.actions")} />
    </tr>
  );
}

export function RejectedOvertimeTableHeadRow({
  t,
  templatePrimary,
}: {
  t: (key: string) => string;
  templatePrimary: string;
}) {
  return (
    <tr>
      <OvertimeHeadCell
        icon={Users}
        label={t("table.headers.employee")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Layers}
        label={t("table.headers.type")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={CalendarPlus}
        label={t("table.headers.startDate")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={CalendarClock}
        label={t("table.headers.endDate")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Timer}
        label={t("table.headers.beforeMinutes")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Timer}
        label={t("table.headers.afterMinutes")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={UserX}
        label={t("table.headers.rejectedBy")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={MessageSquare}
        label={t("table.headers.rejectionReason")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Clock}
        label={t("table.headers.createdAt")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadCell
        icon={Activity}
        label={t("table.headers.status")}
        templatePrimary={templatePrimary}
      />
      <OvertimeHeadActions label={t("table.headers.actions")} />
    </tr>
  );
}
