/**
 * Loads and merges messages for a given locale.
 * Centralizes main JSON load, operations.absences from dedicated folder (fallback dailyPasses), and batch-assignment merge.
 */
export async function loadMessages(
  locale: string
): Promise<Record<string, unknown>> {
  const messages = (
    await import(`../../messages/${locale}.json`)
  ).default as Record<string, unknown>;

  // Merge warning-types module messages from dedicated folder
  try {
    const warningTypesMessages = (
      await import(`../../messages/warning-types/${locale}.json`)
    ).default;
    messages.warningTypes = warningTypesMessages;
  } catch {
    // If warning-types file is missing for this locale, leave messages unchanged
  }

  // Merge forgot-password module messages from dedicated folder
  try {
    const forgotPasswordMessages = (
      await import(`../../messages/forgot-password/${locale}.json`)
    ).default;
    (messages as Record<string, unknown>).forgotPassword = forgotPasswordMessages;
  } catch {
    // If forgot-password file is missing for this locale, leave messages unchanged
  }

  // Merge daily-passes module messages from dedicated folder
  try {
    const dailyPassesMessages = (
      await import(`../../messages/daily-passes/${locale}.json`)
    ).default;
    (messages as Record<string, unknown>).dailyPasses = dailyPassesMessages;
  } catch {
    // If daily-passes file is missing for this locale, leave messages unchanged
  }

  // Merge integrations module messages from dedicated folder (route /integrations)
  try {
    const integrationsPageMessages = (
      await import(`../../messages/integrations/${locale}.json`)
    ).default;
    (messages as Record<string, unknown>).integrations = integrationsPageMessages;
  } catch {
    // If integrations file is missing for this locale, leave messages unchanged
  }

  // Merge help module messages from dedicated folder (route /help)
  try {
    const helpModuleMessages = (
      await import(`../../messages/help/${locale}.json`)
    ).default as Record<string, unknown>;
    (messages as Record<string, unknown>).help = helpModuleMessages.help;
  } catch {
    // If help file is missing for this locale, leave messages unchanged
  }

  // Ensure mantainers exists, then merge users module
  if (!messages.mantainers) (messages as Record<string, unknown>).mantainers = {};
  const mantainers = messages.mantainers as Record<string, unknown>;
  try {
    const mantainersUsersMessages = (
      await import(`../../messages/mantainers/users/${locale}.json`)
    ).default;
    mantainers.users = mantainersUsersMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.companies messages from dedicated folder
  try {
    const companiesMessages = (
      await import(`../../messages/mantainers/companies/${locale}.json`)
    ).default;
    mantainers.companies = companiesMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.branches messages from dedicated folder
  try {
    const branchesMessages = (
      await import(`../../messages/mantainers/branches/${locale}.json`)
    ).default;
    mantainers.branches = branchesMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.assistanceMonthClosing messages from dedicated folder
  try {
    const assistanceMonthClosingMessages = (
      await import(
        `../../messages/mantainers/assistance-month-closing/${locale}.json`
      )
    ).default;
    mantainers.assistanceMonthClosing = assistanceMonthClosingMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.schedules messages from dedicated folder
  try {
    const schedulesMessages = (
      await import(`../../messages/mantainers/schedules/${locale}.json`)
    ).default;
    mantainers.schedules = schedulesMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.structures messages from dedicated folder
  try {
    const structuresMessages = (
      await import(`../../messages/mantainers/structures/${locale}.json`)
    ).default;
    mantainers.structures = structuresMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.dailyPass messages from dedicated folder
  try {
    const dailyPassMessages = (
      await import(`../../messages/mantainers/daily-pass/${locale}.json`)
    ).default;
    mantainers.dailyPass = dailyPassMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.holidays messages from dedicated folder
  try {
    const holidaysMessages = (
      await import(`../../messages/mantainers/holidays/${locale}.json`)
    ).default;
    mantainers.holidays = holidaysMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.employees messages from dedicated folder
  try {
    const employeesMessages = (
      await import(`../../messages/mantainers/employees/${locale}.json`)
    ).default;
    mantainers.employees = employeesMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.absenceTypes messages from dedicated folder
  try {
    const absenceTypesMessages = (
      await import(`../../messages/mantainers/absence-types/${locale}.json`)
    ).default;
    mantainers.absenceTypes = absenceTypesMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.jobs messages from dedicated folder
  try {
    const jobsMessages = (
      await import(`../../messages/mantainers/jobs/${locale}.json`)
    ).default;
    mantainers.jobs = jobsMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.shifts messages from dedicated folder
  try {
    const shiftsMessages = (
      await import(`../../messages/mantainers/shifts/${locale}.json`)
    ).default;
    mantainers.shifts = shiftsMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.integrations messages from dedicated folder
  try {
    const integrationsMessages = (
      await import(`../../messages/mantainers/integrations/${locale}.json`)
    ).default;
    mantainers.integrations = integrationsMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.devices messages from dedicated folder
  try {
    const devicesMessages = (
      await import(`../../messages/mantainers/devices/${locale}.json`)
    ).default;
    mantainers.devices = devicesMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.sso messages from dedicated folder
  try {
    const ssoMessages = (
      await import(`../../messages/mantainers/sso/${locale}.json`)
    ).default;
    mantainers.sso = ssoMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.timeBank messages from dedicated folder
  try {
    const timeBankMessages = (
      await import(`../../messages/mantainers/time-bank/${locale}.json`)
    ).default;
    mantainers.timeBank = timeBankMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.roles messages from dedicated folder
  try {
    const rolesMessages = (
      await import(`../../messages/mantainers/roles/${locale}.json`)
    ).default;
    mantainers.roles = rolesMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.students messages from dedicated folder
  try {
    const studentsMessages = (
      await import(`../../messages/mantainers/students/${locale}.json`)
    ).default;
    mantainers.students = studentsMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge mantainers.establishments messages from dedicated folder
  try {
    const establishmentsMessages = (
      await import(`../../messages/mantainers/establishments/${locale}.json`)
    ).default;
    (mantainers as any).establishments = establishmentsMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Ensure operations exists, then load absences module from dedicated folder
  if (!messages.operations) messages.operations = {};
  const operations = messages.operations as Record<string, unknown>;
  try {
    const absencesMessages = (
      await import(`../../messages/operations/absences/${locale}.json`)
    ).default;
    operations.absences = absencesMessages;
  } catch {
    // If absences module file is missing, fall back to dailyPasses.absences (e.g. es.json)
    if (!operations.absences && (messages.dailyPasses as Record<string, unknown>)?.absences) {
      operations.absences = {
        ...((messages.dailyPasses as Record<string, unknown>).absences as Record<string, unknown>),
      };
    }
    if (!operations.absences) operations.absences = {};
  }

  // Merge batch-assignment modal messages from dedicated folder
  try {
    const batchAssignmentMessages = (
      await import(
        `../../messages/operations/absences/batch-assignment/${locale}.json`
      )
    ).default;
    (operations.absences as Record<string, unknown>).batchAssignment =
      batchAssignmentMessages;
  } catch {
    // If batch-assignment file is missing for this locale, leave messages unchanged
  }

  // Merge operations.warnings from dedicated folder
  try {
    const warningsMessages = (
      await import(`../../messages/operations/warnings/${locale}.json`)
    ).default;
    operations.warnings = warningsMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Ensure operations.requests exists and merge request modules
  if (!operations.requests) operations.requests = {};
  const requests = operations.requests as Record<string, unknown>;
  try {
    const freedayMessages = (
      await import(`../../messages/operations/requests/freeday/${locale}.json`)
    ).default;
    requests.freeday = freedayMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }
  try {
    const hourlyPermissionMessages = (
      await import(
        `../../messages/operations/requests/hourly-permission/${locale}.json`
      )
    ).default;
    requests.hourlyPermission = hourlyPermissionMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }
  try {
    const overtimeMessages = (
      await import(`../../messages/operations/requests/overtime/${locale}.json`)
    ).default;
    requests.overtime = overtimeMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }
  // Merge operations.schedule from dedicated folder
  try {
    const scheduleMessages = (
      await import(`../../messages/operations/schedule/${locale}.json`)
    ).default;
    operations.schedule = scheduleMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge operations.studentSchedule from dedicated folder
  try {
    const studentScheduleMessages = (
      await import(`../../messages/operations/student-schedule/${locale}.json`)
    ).default;
    operations.studentSchedule = studentScheduleMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge operations.shift from dedicated folder
  try {
    const shiftMessages = (
      await import(`../../messages/operations/shift/${locale}.json`)
    ).default;
    operations.shift = shiftMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge operations.teamSchedule from dedicated folder
  try {
    const teamScheduleMessages = (
      await import(`../../messages/operations/team-schedule/${locale}.json`)
    ).default;
    operations.teamSchedule = teamScheduleMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Ensure reports exists, then merge reports modules
  if (!messages.reports) messages.reports = {};
  const reports = messages.reports as Record<string, unknown>;
  
  // Merge reports.history from dedicated folder
  try {
    const reportsHistoryMessages = (
      await import(`../../messages/reports/history/${locale}.json`)
    ).default;
    reports.history = reportsHistoryMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge reports.manager from dedicated folder
  try {
    const reportsManagerMessages = (
      await import(`../../messages/reports/manager/${locale}.json`)
    ).default;
    reports.manager = reportsManagerMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge audit module messages from dedicated folder (namespace: audit)
  try {
    const auditMessages = (
      await import(`../../messages/operations/audit/${locale}.json`)
    ).default;
    (messages as Record<string, unknown>).audit = auditMessages;
  } catch {
    // If audit file is missing for this locale, leave messages unchanged
  }

  // Merge assistance-management module messages from dedicated folder
  try {
    const assistanceManagementMessages = (
      await import(`../../messages/assistance-management/${locale}.json`)
    ).default;
    (messages as Record<string, unknown>).assistanceManagement =
      assistanceManagementMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge assistance-management-student module messages from dedicated folder
  try {
    const assistanceManagementStudentMessages = (
      await import(`../../messages/assistance-management-student/${locale}.json`)
    ).default;
    (messages as Record<string, unknown>).assistanceManagementStudent =
      assistanceManagementStudentMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Global establishments staffing dashboard (/assistance/establishments-dashboard)
  try {
    const assistanceEstablishmentsDashboardMessages = (
      await import(
        `../../messages/assistance/establishments-dashboard/${locale}.json`
      )
    ).default;
    (messages as Record<string, unknown>).assistanceEstablishmentsDashboard =
      assistanceEstablishmentsDashboardMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge sso (root) module messages from dedicated folder
  try {
    const ssoMessages = (
      await import(`../../messages/sso/${locale}.json`)
    ).default;
    (messages as Record<string, unknown>).sso = ssoMessages;
  } catch {
    // If file is missing for this locale, leave messages unchanged
  }

  // Merge consent module messages from dedicated folder
  try {
    const consentMessages = (
      await import(`../../messages/consent/${locale}.json`)
    ).default as Record<string, unknown>;
    (messages as Record<string, unknown>).consent = consentMessages;

    // Merge consent.document (privacy document) from dedicated folder
    try {
      const consentDocumentMessages = (
        await import(`../../messages/consent/document/${locale}.json`)
      ).default;
      consentMessages.document = consentDocumentMessages;
    } catch {
      // If consent document file is missing for this locale, leave consent unchanged
    }

    // Ensures key exists if JSON cache (e.g. Turbopack) serves an older consent module.
    const consentReviewOnlyByLocale: Record<string, string> = {
      es: "Ya completaste el registro de consentimientos. Aquí puedes revisar la política y el estado de cada finalidad opcional.",
      en: "You have already completed your consent registration. You can review the policy and the status of each optional purpose below.",
      pt: "Você já concluiu o registro de consentimentos. Aqui pode revisar a política e o estado de cada finalidade opcional.",
      fr: "Vous avez déjà enregistré vos consentements. Vous pouvez consulter la politique et l'état de chaque finalité facultative ci-dessous.",
    };
    if (typeof consentMessages.reviewOnlyInfo !== "string") {
      consentMessages.reviewOnlyInfo =
        consentReviewOnlyByLocale[locale] ?? consentReviewOnlyByLocale.es;
    }
  } catch {
    // If consent file is missing for this locale, leave messages unchanged
  }

  return messages;
}
