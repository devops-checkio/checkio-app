/**
 * Ensures all next-intl keys used by HomeCustom exist under `common` and `homeCustom`
 * in messages/{es,en,fr,pt}.json. Run: node scripts/validate-home-custom-i18n.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "messages");

const LOCALES = ["es", "en", "fr", "pt"];

const COMMON_KEYS = [
  "welcome",
  "scheduleUpdated",
  "employeeAdded",
  "reportGenerated",
  "attendanceMarked",
  "employeePermissions",
  "viewEmployees",
  "createEmployees",
  "updateEmployees",
  "deleteEmployees",
  "schedulePermissions",
  "viewSchedules",
  "createSchedules",
  "updateSchedules",
  "deleteSchedules",
  "reportPermissions",
  "viewReports",
  "generateReports",
  "exportReports",
  "fromLastMonth",
  "noPermission",
  "overview",
  "availableFeatures",
  "permissions",
  "recentActivity",
  "permissionSummary",
  "granted",
  "denied",
  "access",
];

const HOME_CUSTOM_KEYS = [
  "assignedEmployees",
  "activeSchedules",
  "reportsGenerated",
  "attendanceRate",
  "employeeManagement",
  "manageAssignedEmployees",
  "scheduleManagement",
  "manageSchedulesAndShifts",
  "attendanceTracking",
  "trackEmployeeAttendance",
  "reportsAndAnalytics",
  "generateReportsAndAnalytics",
  "shiftManagement",
  "manageWorkShifts",
  "dailyPasses",
  "manageDailyPasses",
  "subtitle",
  "role",
  "activityDemoScheduleUser",
  "activityDemoScheduleTime",
  "activityDemoEmployeeUser",
  "activityDemoEmployeeTime",
  "activityDemoReportUser",
  "activityDemoReportTime",
  "activityDemoAttendanceUser",
  "activityDemoAttendanceTime",
  "activityDemoMetaSeparator",
];

let failed = false;

for (const locale of LOCALES) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const missing = [];

  for (const k of COMMON_KEYS) {
    if (typeof data.common?.[k] !== "string") {
      missing.push(`common.${k}`);
    }
  }
  for (const k of HOME_CUSTOM_KEYS) {
    if (typeof data.homeCustom?.[k] !== "string") {
      missing.push(`homeCustom.${k}`);
    }
  }

  if (missing.length) {
    console.error(`[${locale}] missing ${missing.length} key(s):\n  ${missing.join("\n  ")}`);
    failed = true;
  } else {
    console.log(`[${locale}] OK (${COMMON_KEYS.length} common + ${HOME_CUSTOM_KEYS.length} homeCustom)`);
  }
}

if (failed) {
  process.exit(1);
}
