"use client";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useCookieSession } from "@/context/useCookieSession";
import { IntegrationProductModule } from "@/dto/enum/integration-product-module.enum";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useGetProfile } from "@/service/auths.service";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CalendarX2,
  ClipboardCheck,
  Clock,
  Clock3,
  Clock4,
  FileSearch,
  FileText,
  GraduationCap,
  Home,
  Hospital,
  Key,
  ListTree,
  Lock,
  Mail,
  MapPin,
  PieChart,
  Plug,
  QrCode,
  Settings,
  Shield,
  Tablet,
  UserCog,
  Users,
  UserX,
  Webhook,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useEffect } from "react";

type NavDropdownSourceItem = {
  label: string;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  permission?: OrganizationPermissionCode;
  /** Si se define, basta con lectura de cualquiera de estos códigos (p. ej. gestión asistencia). */
  anyOfPermissions?: OrganizationPermissionCode[];
  productModule?: IntegrationProductModule;
};

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
};

function filterNavDropdownItem(
  item: NavDropdownSourceItem,
  canRead: (code: OrganizationPermissionCode) => boolean,
): boolean {
  if (item.anyOfPermissions?.length) {
    return item.anyOfPermissions.some((code) => canRead(code));
  }
  if (!item.permission) return true;
  if (
    item.permission === OrganizationPermissionCode.TEAM_SCHEDULE_OPERATIONS
  ) {
    return (
      canRead(OrganizationPermissionCode.TEAM_SCHEDULE_OPERATIONS) ||
      canRead(OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS)
    );
  }
  return canRead(item.permission);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const t = useTranslations("sidebar");
  const { addProfile, isAuthenticated, canRead, hasProductModule, hasStudentsModule } =
    useCookieSession();
  const { data: profile, isLoading: isLoadingProfile } = useGetProfile();

  const mantenedoresDropdownItems = [
    {
      label: t("maintainersItems.companies"),
      onClick: () => router.push("/mantainers/companies"),
      icon: Building2,
      permission: OrganizationPermissionCode.COMPANY_MAINTENANCE,
    },
    {
      label: t("maintainersItems.branches"),
      onClick: () => router.push("/mantainers/branches"),
      icon: MapPin,
      permission: OrganizationPermissionCode.BRANCH_MAINTENANCE,
    },
    {
      label: t("maintainersItems.structures"),
      onClick: () => router.push("/mantainers/structures"),
      icon: ListTree,
      permission: OrganizationPermissionCode.STRUCTURE_MAINTENANCE,
    },
    {
      label: t("maintainersItems.jobs"),
      onClick: () => router.push("/mantainers/jobs"),
      icon: Briefcase,
      permission: OrganizationPermissionCode.JOB_MAINTENANCE,
    },
    {
      label: t("maintainersItems.employees"),
      onClick: () => router.push("/mantainers/employees"),
      icon: Users,
      permission: OrganizationPermissionCode.EMPLOYEE_MAINTENANCE,
    },
    ...(hasStudentsModule()
      ? [
          {
            label: t("maintainersItems.students"),
            onClick: () => router.push("/mantainers/students"),
            icon: GraduationCap,
            permission: OrganizationPermissionCode.STUDENT_MAINTENANCE,
          },
          {
            label: t("maintainersItems.establishments"),
            onClick: () => router.push("/mantainers/establishments"),
            icon: Hospital,
            permission: OrganizationPermissionCode.ESTABLISHMENT_MAINTENANCE,
          },
        ]
      : []),
    {
      label: t("maintainersItems.holidays"),
      onClick: () => router.push("/mantainers/holidays"),
      icon: CalendarX2,
      permission: OrganizationPermissionCode.HOLIDAY_MAINTENANCE,
    },
    {
      label: t("maintainersItems.schedules"),
      onClick: () => router.push("/mantainers/schedules"),
      icon: CalendarClock,
      permission: OrganizationPermissionCode.SCHEDULE_MAINTENANCE,
    },
    {
      label: t("maintainersItems.shifts"),
      onClick: () => router.push("/mantainers/shifts"),
      icon: CalendarRange,
      permission: OrganizationPermissionCode.SHIFT_MAINTENANCE,
    },
    {
      label: t("maintainersItems.absenceTypes"),
      onClick: () => router.push("/mantainers/absence-types"),
      icon: UserX,
      permission: OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE,
    },
    {
      label: t("maintainersItems.warningTypes"),
      onClick: () => router.push("/mantainers/warning-types"),
      icon: AlertTriangle,
      permission: OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE,
    },
    {
      label: t("maintainersItems.devices"),
      onClick: () => router.push("/mantainers/devices"),
      icon: Tablet,
      permission: OrganizationPermissionCode.DEVICE_MAINTENANCE,
    },
    {
      label: t("maintainersItems.timeBank"),
      onClick: () => router.push("/mantainers/time-bank"),
      icon: Clock,
      permission: OrganizationPermissionCode.BANK_MAINTENANCE,
    },
    {
      label: t("maintainersItems.integrations"),
      onClick: () => router.push("/mantainers/integrations"),
      icon: Webhook,
      permission: OrganizationPermissionCode.API_TOKEN_MAINTENANCE,
      productModule: IntegrationProductModule.API,
    },
  ].filter((item) => {
    if (!canRead(item.permission!)) return false;
    if (
      "productModule" in item &&
      item.productModule === IntegrationProductModule.API &&
      !hasProductModule(IntegrationProductModule.API)
    ) {
      return false;
    }
    return true;
  });

  const hasMantenedoresPermissions = mantenedoresDropdownItems.length > 0;

  const operacionDropdownItems = [
    {
      label: t("operationsItems.shiftAssignment"),
      onClick: () => router.push("/operations/shift"),
      icon: CalendarClock,
      permission: OrganizationPermissionCode.ASIGMENT_SHIFT_OPERATIONS,
    },
    {
      label: t("operationsItems.scheduleAssignment"),
      onClick: () => router.push("/operations/schedule"),
      icon: Calendar,
      permission: OrganizationPermissionCode.ASIGMENT_SCHEDULE_OPERATIONS,
    },
    {
      label: t("operationsItems.studentScheduleAssignment"),
      onClick: () => router.push("/operations/student-schedule"),
      icon: GraduationCap,
      permission:
        OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS,
    },
    {
      label: t("operationsItems.absenceAssignment"),
      onClick: () => router.push("/operations/absences"),
      icon: UserX,
      permission: OrganizationPermissionCode.ASSIGNMENT_ABSENCE_OPERATIONS,
    },
    {
      label: t("operationsItems.teamSchedule"),
      onClick: () => router.push("/operations/team-schedule"),
      icon: Users,
      permission: OrganizationPermissionCode.TEAM_SCHEDULE_OPERATIONS,
    },
    {
      label: t("operationsItems.attendanceManagement"),
      onClick: () => router.push("/assistance/management"),
      icon: ClipboardCheck,
      anyOfPermissions: [
        OrganizationPermissionCode.ASSISTANCE_MANAGMENT_OPERATIONS,
        OrganizationPermissionCode.ASSISTANCE_MANAGMERT_INCOMPLETE_OPERATIONS,
        OrganizationPermissionCode.ASSISTANCE_MANAGMERT_COMPLETED_OPERATIONS,
        OrganizationPermissionCode.ASSISTANCE_MANAGMERT_ABSENT_OPERATIONS,
        OrganizationPermissionCode.ASSISTANCE_MANAGMERT_WITHOUT_SCHEDULE_OPERATIONS,
      ],
    },
    ...(hasStudentsModule()
      ? [
          {
            label: t("operationsItems.establishmentsAttendanceDashboard"),
            onClick: () => router.push("/assistance/establishments-dashboard"),
            icon: BarChart3,
            permission: OrganizationPermissionCode.ESTABLISHMENT_MAINTENANCE,
          },
          {
            label: t("operationsItems.studentsAttendanceManagement"),
            onClick: () => router.push("/assistance/management-student"),
            icon: BookOpen,
            anyOfPermissions: [
              OrganizationPermissionCode.ASSISTANCE_STUDENT_MANAGMENT_OPERATIONS,
              OrganizationPermissionCode.ASSISTANCE_STUDENT_MANAGMENT_INCOMPLETE_OPERATIONS,
              OrganizationPermissionCode.ASSISTANCE_STUDENT_MANAGMENT_ABSENT_OPERATIONS,
              OrganizationPermissionCode.ASSISTANCE_STUDENT_MANAGMENT_COMPLETED_OPERATIONS,
            ],
          },
        ]
      : []),
    {
      label: t("operationsItems.dailyPasses"),
      onClick: () => router.push("/operations/daily-passes"),
      icon: QrCode,
      permission: OrganizationPermissionCode.DAILY_PASS_OPERATIONS,
    },
    {
      label: t("maintainersItems.assistanceMonthClosing"),
      onClick: () => router.push("/mantainers/assistance-month-closing"),
      icon: CalendarDays,
      permission:
        OrganizationPermissionCode.ASSISTANCE_MANAGMENT_OPERATIONS,
    },
    {
      label: t("maintainersItems.sso"),
      onClick: () => router.push("/mantainers/sso"),
      icon: Key,
      permission: OrganizationPermissionCode.SSO_MAINTENANCE,
    },
  ].filter((item) => filterNavDropdownItem(item, canRead));

  const solicitudesDropdownItems = [
    {
      label: t("operationsItems.freedayRequests"),
      onClick: () => router.push("/operations/requests/freeday"),
      icon: CalendarCheck,
      permission: OrganizationPermissionCode.REQUEST_FREEDAY_OPERATIONS,
    },
    {
      label: t("operationsItems.hourlyPermissionRequests"),
      onClick: () => router.push("/operations/requests/hourly-permission"),
      icon: Clock3,
      permission:
        OrganizationPermissionCode.REQUEST_HOURLY_PERMISSION_OPERATIONS,
    },
    {
      label: t("operationsItems.overtimeRequests"),
      onClick: () => router.push("/operations/requests/overtime"),
      icon: Clock4,
      permission: OrganizationPermissionCode.REQUEST_OVERTIME_OPERATIONS,
    },
    {
      label: t("operationsItems.warnings"),
      onClick: () => router.push("/operations/warnings"),
      icon: AlertTriangle,
      permission: OrganizationPermissionCode.WARNING_OPERATIONS,
    },
  ].filter((item) => filterNavDropdownItem(item, canRead));

  const controlDropdownItems = [
    {
      label: t("reports.reports"),
      onClick: () => router.push("/reports/manager"),
      icon: FileText,
      permission: OrganizationPermissionCode.ATTENDANCE_REPORTS,
    },
    {
      label: t("reports.history"),
      onClick: () => router.push("/reports/history"),
      icon: FileText,
      permission: OrganizationPermissionCode.ATTENDANCE_REPORTS,
    },
  ].filter((item) => !item.permission || canRead(item.permission));

  const securityLegalDropdownItems = [
    {
      label: t("operationsItems.consentDashboard"),
      onClick: () => router.push("/consent/dashboard"),
      icon: PieChart,
      permission: OrganizationPermissionCode.CONSENT_HISTORY_OPERATIONS,
    },
    {
      label: t("operationsItems.consentHistory"),
      onClick: () => router.push("/consent/history"),
      icon: FileSearch,
      permission: OrganizationPermissionCode.CONSENT_HISTORY_OPERATIONS,
    },
    {
      label: t("operationsItems.myConsents"),
      onClick: () => router.push("/consent"),
      icon: Shield,
    },
    {
      label: t("operationsItems.audit"),
      onClick: () => router.push("/operations/audit"),
      icon: FileSearch,
      permission: OrganizationPermissionCode.AUDIT_OPERATIONS,
    },
    {
      label: t("operationsItems.roles"),
      onClick: () => router.push("/mantainers/roles"),
      icon: Shield,
      permission: OrganizationPermissionCode.ROLES_OPERATIONS,
    },
    {
      label: t("operationsItems.users"),
      onClick: () => router.push("/mantainers/users"),
      icon: UserCog,
      permission: OrganizationPermissionCode.USERS_OPERATIONS,
    },
  ].filter((item) => filterNavDropdownItem(item, canRead));

  const navMainWithDropdowns = [
    {
      title: t("home"),
      url: "/",
      icon: Home,
      isActive: true,
    },
    ...(hasMantenedoresPermissions
      ? [
          {
            title: t("maintainers"),
            url: "mantainers",
            icon: Settings,
            dropdownItems: mantenedoresDropdownItems,
          },
        ]
      : []),
    ...(operacionDropdownItems.length > 0
      ? [
          {
            title: t("operation"),
            url: "operations",
            icon: Clock,
            dropdownItems: operacionDropdownItems,
          },
        ]
      : []),
    ...(solicitudesDropdownItems.length > 0
      ? [
          {
            title: t("requests"),
            url: "requests",
            icon: Mail,
            dropdownItems: solicitudesDropdownItems,
          },
        ]
      : []),
    ...(controlDropdownItems.length > 0
      ? [
          {
            title: t("control"),
            url: "reports",
            icon: BarChart3,
            dropdownItems: controlDropdownItems,
          },
        ]
      : []),
    ...(securityLegalDropdownItems.length > 0
      ? [
          {
            title: t("securityLegal"),
            url: "security",
            icon: Lock,
            dropdownItems: securityLegalDropdownItems,
          },
        ]
      : []),
    ...(canRead(OrganizationPermissionCode.EXTERNAL_INTEGRATION_MAINTENANCE) &&
    hasProductModule(IntegrationProductModule.ETL)
      ? [
          {
            title: t("integrations"),
            url: "/integrations",
            onClick: () => router.push("/integrations"),
            icon: Plug,
            permission:
              OrganizationPermissionCode.EXTERNAL_INTEGRATION_MAINTENANCE,
          },
        ]
      : []),
  ];

  useEffect(() => {
    if (profile && isAuthenticated) {
      addProfile(profile);
    }
  }, [profile, addProfile, isAuthenticated]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-center py-4 group-data-[collapsible=icon]:py-3">
          <Image
            src="/logos/logo.svg"
            alt="CheckIO"
            width={32}
            height={32}
            className="transition-all duration-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.3)] group-data-[collapsible=icon]:hidden"
          />
          <Image
            src="/logos/ic_launcher_play.png"
            alt="CheckIO"
            width={36}
            height={36}
            className="hidden w-9 h-9 group-data-[collapsible=icon]:block object-contain transition-all duration-300 rounded-lg shrink-0"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithDropdowns as any[]} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
