/**
 * Mapa de pathname a clave de traducción para el navbar.
 * Usa las mismas claves que el sidebar (sidebar.maintainersItems.employees, etc.)
 * para mostrar el nombre del módulo traducido según el idioma actual.
 */
export const PATH_TO_TRANSLATION_KEY: Record<string, string> = {
  "/": "home",
  "/dashboard": "home",

  // Mantenedores
  "/mantainers/branches": "maintainersItems.branches",
  "/mantainers/companies": "maintainersItems.companies",
  "/mantainers/devices": "maintainersItems.devices",
  "/mantainers/employees": "maintainersItems.employees",
  "/mantainers/students": "maintainersItems.students",
  "/mantainers/establishments": "maintainersItems.establishments",
  "/mantainers/jobs": "maintainersItems.jobs",
  "/mantainers/holidays": "maintainersItems.holidays",
  "/mantainers/schedules": "maintainersItems.schedules",
  "/mantainers/shifts": "maintainersItems.shifts",
  "/mantainers/structures": "maintainersItems.structures",
  "/mantainers/absence-types": "maintainersItems.absenceTypes",
  "/mantainers/daily-pass": "operationsItems.dailyPasses",
  "/mantainers/warning-types": "maintainersItems.warningTypes",
  "/mantainers/roles": "operationsItems.roles",
  "/mantainers/users": "operationsItems.users",
  "/mantainers/time-bank": "maintainersItems.timeBank",
  "/mantainers/assistance-month-closing": "maintainersItems.assistanceMonthClosing",
  "/mantainers/sso": "maintainersItems.sso",
  "/mantainers/integrations": "maintainersItems.integrations",
  "/mantainers/employee-schedule": "maintainersItems.schedules",

  // Operaciones
  "/operations/shift": "operationsItems.shiftAssignment",
  "/operations/schedule": "operationsItems.scheduleAssignment",
  "/operations/student-schedule": "operationsItems.studentScheduleAssignment",
  "/operations/absences": "operationsItems.absenceAssignment",
  "/operations/requests/freeday": "operationsItems.freedayRequests",
  "/operations/requests/hourly-permission": "operationsItems.hourlyPermissionRequests",
  "/operations/requests/overtime": "operationsItems.overtimeRequests",
  "/operations/warnings": "operationsItems.warnings",
  "/operations/daily-passes": "operationsItems.dailyPasses",
  "/operations/audit": "operationsItems.audit",

  // Asistencia
  "/assistance/management": "operationsItems.attendanceManagement",
  "/assistance/web": "operationsItems.attendanceManagement",
  "/assistance/establishments-dashboard":
    "operationsItems.establishmentsAttendanceDashboard",

  // Reportes
  "/reports/manager": "reports.reports",
  "/reports/history": "reports.history",

  // Integraciones y ayuda
  "/integrations": "integrations",
  "/help": "help",
};

/**
 * Obtiene la clave de traducción para el título de la página según el pathname.
 * Para rutas dinámicas (ej: /mantainers/branches/[id]) usa el título base del segmento.
 * Retorna la clave bajo el namespace "sidebar" para usar con useTranslations("sidebar").
 */
export function getPageTitleTranslationKey(pathname: string): string | null {
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "").replace(/\/$/, "") || "/";

  if (PATH_TO_TRANSLATION_KEY[pathWithoutLocale]) {
    return PATH_TO_TRANSLATION_KEY[pathWithoutLocale];
  }

  const segments = pathWithoutLocale.split("/").filter(Boolean);
  for (let i = segments.length; i >= 1; i--) {
    const prefix = "/" + segments.slice(0, i).join("/");
    if (PATH_TO_TRANSLATION_KEY[prefix]) {
      return PATH_TO_TRANSLATION_KEY[prefix];
    }
  }

  return null;
}
