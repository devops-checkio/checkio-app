"use client";

import { useCookieSession } from "@/context/useCookieSession";
import { IntegrationProductModule } from "@/dto/enum/integration-product-module.enum";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import {
  AlertTriangle,
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
  HelpCircle,
  Home,
  Key,
  ListTree,
  MapPin,
  PieChart,
  Plug,
  QrCode,
  Settings,
  Shield,
  Tablet,
  User,
  UserCog,
  UserX,
  Users,
  Webhook,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";

type CommandMenuItem = {
  label: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: OrganizationPermissionCode;
  productModule?: IntegrationProductModule;
};

function passesCommandPermission(
  item: CommandMenuItem,
  canRead: (code: OrganizationPermissionCode) => boolean,
  hasProductModule: (m: IntegrationProductModule) => boolean,
): boolean {
  if (
    item.productModule === IntegrationProductModule.API &&
    !hasProductModule(IntegrationProductModule.API)
  ) {
    return false;
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

export function CommandDialogDemo() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const t = useTranslations("sidebar");
  const { canRead, hasProductModule } = useCookieSession();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigateTo = (url: string) => {
    router.push(url);
    setOpen(false);
  };

  const mantenedoresItems: CommandMenuItem[] = [
    {
      label: t("maintainersItems.companies"),
      description: "Administración de empresas",
      url: "/mantainers/companies",
      icon: Building2,
      permission: OrganizationPermissionCode.COMPANY_MAINTENANCE,
    },
    {
      label: t("maintainersItems.branches"),
      description: "Gestión de sucursales",
      url: "/mantainers/branches",
      icon: MapPin,
      permission: OrganizationPermissionCode.BRANCH_MAINTENANCE,
    },
    {
      label: t("maintainersItems.structures"),
      description: "Gestión de estructuras",
      url: "/mantainers/structures",
      icon: ListTree,
      permission: OrganizationPermissionCode.STRUCTURE_MAINTENANCE,
    },
    {
      label: t("maintainersItems.jobs"),
      description: "Gestión de cargos",
      url: "/mantainers/jobs",
      icon: Briefcase,
      permission: OrganizationPermissionCode.JOB_MAINTENANCE,
    },
    {
      label: t("maintainersItems.employees"),
      description: "Gestión de empleados",
      url: "/mantainers/employees",
      icon: Users,
      permission: OrganizationPermissionCode.EMPLOYEE_MAINTENANCE,
    },
    {
      label: t("maintainersItems.holidays"),
      description: "Gestión de feriados",
      url: "/mantainers/holidays",
      icon: CalendarX2,
      permission: OrganizationPermissionCode.HOLIDAY_MAINTENANCE,
    },
    {
      label: t("maintainersItems.schedules"),
      description: "Gestión de horarios",
      url: "/mantainers/schedules",
      icon: CalendarClock,
      permission: OrganizationPermissionCode.SCHEDULE_MAINTENANCE,
    },
    {
      label: t("maintainersItems.shifts"),
      description: "Gestión de turnos",
      url: "/mantainers/shifts",
      icon: CalendarRange,
      permission: OrganizationPermissionCode.SHIFT_MAINTENANCE,
    },
    {
      label: t("maintainersItems.absenceTypes"),
      description: "Gestión de tipos de ausentismo",
      url: "/mantainers/absence-types",
      icon: UserX,
      permission: OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE,
    },
    {
      label: t("maintainersItems.warningTypes"),
      description: "Gestión de tipos de amonestaciones",
      url: "/mantainers/warning-types",
      icon: AlertTriangle,
      permission: OrganizationPermissionCode.WARNING_TYPE_MAINTENANCE,
    },
    {
      label: t("maintainersItems.devices"),
      description: "Gestión de dispositivos",
      url: "/mantainers/devices",
      icon: Tablet,
      permission: OrganizationPermissionCode.DEVICE_MAINTENANCE,
    },
    {
      label: t("maintainersItems.timeBank"),
      description: "Gestión de banco de horas",
      url: "/mantainers/time-bank",
      icon: Clock,
      permission: OrganizationPermissionCode.BANK_MAINTENANCE,
    },
    {
      label: t("maintainersItems.integrations"),
      description: "Integraciones API",
      url: "/mantainers/integrations",
      icon: Webhook,
      permission: OrganizationPermissionCode.API_TOKEN_MAINTENANCE,
      productModule: IntegrationProductModule.API,
    },
  ].filter((item) => passesCommandPermission(item, canRead, hasProductModule));

  const operacionItems: CommandMenuItem[] = [
    {
      label: t("operationsItems.shiftAssignment"),
      description: "Asignación de turnos",
      url: "/operations/shift",
      icon: CalendarClock,
      permission: OrganizationPermissionCode.SHIFT_MAINTENANCE,
    },
    {
      label: t("operationsItems.scheduleAssignment"),
      description: "Asignación de horarios",
      url: "/operations/schedule",
      icon: Calendar,
      permission: OrganizationPermissionCode.SCHEDULE_MAINTENANCE,
    },
    {
      label: t("operationsItems.studentScheduleAssignment"),
      description: "Asignación de horarios para estudiantes",
      url: "/operations/student-schedule",
      icon: GraduationCap,
      permission:
        OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS,
    },
    {
      label: t("operationsItems.absenceAssignment"),
      description: "Asignación de ausencias",
      url: "/operations/absences",
      icon: UserX,
      permission: OrganizationPermissionCode.TYPE_ABSENCE_MAINTENANCE,
    },
    {
      label: t("operationsItems.teamSchedule"),
      description: "Horario por equipo",
      url: "/operations/team-schedule",
      icon: Users,
      permission: OrganizationPermissionCode.TEAM_SCHEDULE_OPERATIONS,
    },
    {
      label: t("operationsItems.attendanceManagement"),
      description: "Control de asistencia",
      url: "/assistance/management",
      icon: ClipboardCheck,
    },
    {
      label: t("operationsItems.dailyPasses"),
      description: "Pases diarios",
      url: "/operations/daily-passes",
      icon: QrCode,
      permission: OrganizationPermissionCode.DAILY_PASS_OPERATIONS,
    },
    {
      label: t("maintainersItems.assistanceMonthClosing"),
      description: "Cierre de mes de asistencia",
      url: "/mantainers/assistance-month-closing",
      icon: CalendarDays,
      permission:
        OrganizationPermissionCode.ASSISTANCE_CONFIGURATION_MAINTENANCE,
    },
    {
      label: t("maintainersItems.sso"),
      description: "Aplicaciones SSO",
      url: "/mantainers/sso",
      icon: Key,
      permission: OrganizationPermissionCode.SSO_MAINTENANCE,
    },
  ].filter((item) => passesCommandPermission(item, canRead, hasProductModule));

  const solicitudesItems: CommandMenuItem[] = [
    {
      label: t("operationsItems.freedayRequests"),
      description: "Solicitudes de día festivo",
      url: "/operations/requests/freeday",
      icon: CalendarCheck,
      permission: OrganizationPermissionCode.REQUEST_FREEDAY_OPERATIONS,
    },
    {
      label: t("operationsItems.hourlyPermissionRequests"),
      description: "Solicitudes de permiso por horas",
      url: "/operations/requests/hourly-permission",
      icon: Clock3,
      permission:
        OrganizationPermissionCode.REQUEST_HOURLY_PERMISSION_OPERATIONS,
    },
    {
      label: t("operationsItems.overtimeRequests"),
      description: "Solicitudes de horas extras",
      url: "/operations/requests/overtime",
      icon: Clock4,
    },
    {
      label: t("operationsItems.warnings"),
      description: "Gestión de amonestaciones",
      url: "/operations/warnings",
      icon: AlertTriangle,
      permission: OrganizationPermissionCode.WARNING_OPERATIONS,
    },
  ].filter((item) => passesCommandPermission(item, canRead, hasProductModule));

  const controlItems: CommandMenuItem[] = [
    {
      label: t("reports.reports"),
      description: "Generar reportes",
      url: "/reports/manager",
      icon: FileText,
      permission: OrganizationPermissionCode.ATTENDANCE_REPORTS,
    },
    {
      label: t("reports.history"),
      description: "Historial de reportes",
      url: "/reports/history",
      icon: FileText,
      permission: OrganizationPermissionCode.ATTENDANCE_REPORTS,
    },
  ].filter((item) => passesCommandPermission(item, canRead, hasProductModule));

  const securityLegalItems: CommandMenuItem[] = [
    {
      label: t("operationsItems.consentDashboard"),
      description: "Consentimientos",
      url: "/consent/dashboard",
      icon: PieChart,
      permission: OrganizationPermissionCode.CONSENT_HISTORY_OPERATIONS,
    },
    {
      label: t("operationsItems.consentHistory"),
      description: "Historial de consentimientos",
      url: "/consent/history",
      icon: FileSearch,
      permission: OrganizationPermissionCode.CONSENT_HISTORY_OPERATIONS,
    },
    {
      label: t("operationsItems.myConsents"),
      description: "Mis consentimientos",
      url: "/consent",
      icon: Shield,
    },
    {
      label: t("operationsItems.audit"),
      description: "Auditoría del sistema",
      url: "/operations/audit",
      icon: FileSearch,
      permission: OrganizationPermissionCode.AUDIT_OPERATIONS,
    },
    {
      label: t("operationsItems.roles"),
      description: "Gestión de roles",
      url: "/mantainers/roles",
      icon: Shield,
      permission: OrganizationPermissionCode.ROLES_OPERATIONS,
    },
    {
      label: t("operationsItems.users"),
      description: "Gestión de usuarios",
      url: "/mantainers/users",
      icon: UserCog,
      permission: OrganizationPermissionCode.USERS_OPERATIONS,
    },
  ].filter((item) => passesCommandPermission(item, canRead, hasProductModule));

  const renderCommandItems = (items: CommandMenuItem[]) =>
    items.map((item) => {
      const Icon = item.icon;
      return (
        <CommandItem
          key={item.url}
          className="cursor-pointer"
          onSelect={() => navigateTo(item.url)}
        >
          <Icon className="mr-2 h-4 w-4" />
          <span>{item.label}</span>
          <span className="text-muted-foreground ml-2 text-sm">
            {item.description}
          </span>
        </CommandItem>
      );
    });

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle> </DialogTitle>
        <CommandInput placeholder="Escribe un comando o busca..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>

          <CommandGroup heading={t("home")}>
            <CommandItem
              className="cursor-pointer"
              onSelect={() => navigateTo("/")}
            >
              <Home className="mr-2 h-4 w-4" />
              <span>{t("home")}</span>
              <span className="text-muted-foreground ml-2 text-sm">
                Vista principal
              </span>
            </CommandItem>
          </CommandGroup>

          {mantenedoresItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("maintainers")}>
                {renderCommandItems(mantenedoresItems)}
              </CommandGroup>
            </>
          )}

          {operacionItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("operation")}>
                {renderCommandItems(operacionItems)}
              </CommandGroup>
            </>
          )}

          {solicitudesItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("requests")}>
                {renderCommandItems(solicitudesItems)}
              </CommandGroup>
            </>
          )}

          {controlItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("control")}>
                {renderCommandItems(controlItems)}
              </CommandGroup>
            </>
          )}

          {securityLegalItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("securityLegal")}>
                {renderCommandItems(securityLegalItems)}
              </CommandGroup>
            </>
          )}

          {canRead(
            OrganizationPermissionCode.EXTERNAL_INTEGRATION_MAINTENANCE,
          ) &&
            hasProductModule(IntegrationProductModule.ETL) && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t("integrations")}>
                  <CommandItem
                    className="cursor-pointer"
                    onSelect={() => navigateTo("/integrations")}
                  >
                    <Plug className="mr-2 h-4 w-4" />
                    <span>{t("integrations")}</span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      {t("integrationsCommandHint")}
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}

          <CommandSeparator />
          <CommandGroup heading={t("help")}>
            <CommandItem
              className="cursor-pointer"
              onSelect={() => navigateTo("/help")}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>{t("help")}</span>
              <span className="text-muted-foreground ml-2 text-sm">
                Centro de ayuda
              </span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Configuración">
            <CommandItem className="cursor-pointer">
              <User />
              <span>Perfil</span>
              <span className="text-muted-foreground ml-2 text-sm">
                Gestiona tu perfil de usuario
              </span>
            </CommandItem>
            <CommandItem className="cursor-pointer">
              <Settings />
              <span>Ajustes</span>
              <span className="text-muted-foreground ml-2 text-sm">
                Configura la aplicación
              </span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
