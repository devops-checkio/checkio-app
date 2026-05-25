"use client";

import { CHEKIOButton } from "@/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function HomeCustom() {
  const router = useRouter();
  const t = useTranslations("common");
  const tCustom = useTranslations("homeCustom");
  const { profile, canRead, canCreate, canUpdate, canDelete } =
    useCookieSession();

  // Get user permissions to show relevant features
  const hasEmployeeAccess = canRead(
    OrganizationPermissionCode.EMPLOYEE_MAINTENANCE
  );
  const hasScheduleAccess = canRead(
    OrganizationPermissionCode.SCHEDULE_MAINTENANCE
  );
  const hasReportAccess = canRead(
    OrganizationPermissionCode.ATTENDANCE_REPORTS
  );
  const hasAbsenceAssignmentAccess = canRead(
    OrganizationPermissionCode.ASSIGNMENT_ABSENCE_OPERATIONS
  );
  const hasDailyPassAccess = canRead(
    OrganizationPermissionCode.DAILY_PASS_OPERATIONS
  );
  const hasShiftAccess = canRead(
    OrganizationPermissionCode.ASIGMENT_SHIFT_OPERATIONS
  );
  const hasAttendanceOverviewAccess =
    hasAbsenceAssignmentAccess || hasDailyPassAccess;

  const customStats = [
    {
      title: tCustom("assignedEmployees"),
      value: "156",
      change: "+8%",
      changeType: "positive" as const,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      permission: hasEmployeeAccess,
    },
    {
      title: tCustom("activeSchedules"),
      value: "24",
      change: "+2",
      changeType: "positive" as const,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100",
      permission: hasScheduleAccess,
    },
    {
      title: tCustom("reportsGenerated"),
      value: "89",
      change: "+12%",
      changeType: "positive" as const,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      permission: hasReportAccess,
    },
    {
      title: tCustom("attendanceRate"),
      value: "94%",
      change: "+3%",
      changeType: "positive" as const,
      icon: CheckCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      permission: hasAttendanceOverviewAccess,
    },
  ];

  const availableFeatures = [
    {
      title: tCustom("employeeManagement"),
      description: tCustom("manageAssignedEmployees"),
      icon: Users,
      href: "/mantainers/employees",
      color: "bg-blue-500 hover:bg-blue-600",
      permission: hasEmployeeAccess,
    },
    {
      title: tCustom("scheduleManagement"),
      description: tCustom("manageSchedulesAndShifts"),
      icon: Calendar,
      href: "/operations/schedule",
      color: "bg-green-500 hover:bg-green-600",
      permission: hasScheduleAccess,
    },
    {
      title: tCustom("attendanceTracking"),
      description: tCustom("trackEmployeeAttendance"),
      icon: Clock,
      href: "/operations/absences",
      color: "bg-purple-500 hover:bg-purple-600",
      permission: hasAbsenceAssignmentAccess,
    },
    {
      title: tCustom("reportsAndAnalytics"),
      description: tCustom("generateReportsAndAnalytics"),
      icon: BarChart3,
      href: "/reports/manager",
      color: "bg-orange-500 hover:bg-orange-600",
      permission: hasReportAccess,
    },
    {
      title: tCustom("shiftManagement"),
      description: tCustom("manageWorkShifts"),
      icon: Zap,
      href: "/operations/shift",
      color: "bg-indigo-500 hover:bg-indigo-600",
      permission: hasShiftAccess,
    },
    {
      title: tCustom("dailyPasses"),
      description: tCustom("manageDailyPasses"),
      icon: CheckCircle,
      href: "/operations/daily-passes",
      color: "bg-teal-500 hover:bg-teal-600",
      permission: hasDailyPassAccess,
    },
  ];

  const recentActivities = [
    {
      action: t("scheduleUpdated"),
      user: tCustom("activityDemoScheduleUser"),
      time: tCustom("activityDemoScheduleTime"),
      type: "schedule",
      permission: hasScheduleAccess,
    },
    {
      action: t("employeeAdded"),
      user: tCustom("activityDemoEmployeeUser"),
      time: tCustom("activityDemoEmployeeTime"),
      type: "employee",
      permission: hasEmployeeAccess,
    },
    {
      action: t("reportGenerated"),
      user: tCustom("activityDemoReportUser"),
      time: tCustom("activityDemoReportTime"),
      type: "report",
      permission: hasReportAccess,
    },
    {
      action: t("attendanceMarked"),
      user: tCustom("activityDemoAttendanceUser"),
      time: tCustom("activityDemoAttendanceTime"),
      type: "attendance",
      permission: hasAttendanceOverviewAccess,
    },
  ];

  const permissionGroups = [
    {
      title: t("employeePermissions"),
      permissions: [
        { name: t("viewEmployees"), granted: hasEmployeeAccess },
        {
          name: t("createEmployees"),
          granted: canCreate(OrganizationPermissionCode.EMPLOYEE_MAINTENANCE),
        },
        {
          name: t("updateEmployees"),
          granted: canUpdate(OrganizationPermissionCode.EMPLOYEE_MAINTENANCE),
        },
        {
          name: t("deleteEmployees"),
          granted: canDelete(OrganizationPermissionCode.EMPLOYEE_MAINTENANCE),
        },
      ],
    },
    {
      title: t("schedulePermissions"),
      permissions: [
        { name: t("viewSchedules"), granted: hasScheduleAccess },
        {
          name: t("createSchedules"),
          granted: canCreate(OrganizationPermissionCode.SCHEDULE_MAINTENANCE),
        },
        {
          name: t("updateSchedules"),
          granted: canUpdate(OrganizationPermissionCode.SCHEDULE_MAINTENANCE),
        },
        {
          name: t("deleteSchedules"),
          granted: canDelete(OrganizationPermissionCode.SCHEDULE_MAINTENANCE),
        },
      ],
    },
    {
      title: t("reportPermissions"),
      permissions: [
        { name: t("viewReports"), granted: hasReportAccess },
        {
          name: t("generateReports"),
          granted: canCreate(OrganizationPermissionCode.ATTENDANCE_REPORTS),
        },
        {
          name: t("exportReports"),
          granted: canUpdate(OrganizationPermissionCode.ATTENDANCE_REPORTS),
        },
      ],
    },
  ];

  return (
    <div className="hidden flex-col md:flex">
      <div className="flex-1 space-y-4 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {t("welcome")}, {profile?.user.name}
            </h2>
            <p className="text-muted-foreground">{tCustom("subtitle")}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3 py-2 bg-purple-50 rounded-lg">
              <Shield className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">
                {tCustom("role")}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {customStats.map((stat, index) => (
            <Card
              key={index}
              className={`hover:shadow-lg transition-shadow ${
                !stat.permission ? "opacity-50" : ""
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div
                  className={`h-8 w-8 rounded-full ${stat.bgColor} flex items-center justify-center`}
                >
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change} {t("fromLastMonth")}
                </div>
                {!stat.permission && (
                  <div className="text-xs text-red-500 mt-1">
                    {t("noPermission")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
            <TabsTrigger value="features">{t("availableFeatures")}</TabsTrigger>
            <TabsTrigger value="permissions">{t("permissions")}</TabsTrigger>
            <TabsTrigger value="activity">{t("recentActivity")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Available Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    {t("availableFeatures")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availableFeatures
                    .filter((feature) => feature.permission)
                    .map((feature, index) => (
                      <CHEKIOButton
                        key={index}
                        variant="secondary"
                        className="w-full justify-start h-auto p-4"
                        onClick={() => router.push(feature.href)}
                      >
                        <div className="flex items-center gap-3">
                          <feature.icon className="h-5 w-5" />
                          <div className="text-left">
                            <div className="font-medium">{feature.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {feature.description}
                            </div>
                          </div>
                        </div>
                      </CHEKIOButton>
                    ))}
                </CardContent>
              </Card>

              {/* Permission Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t("permissionSummary")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {permissionGroups.map((group, index) => (
                    <div key={index} className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        {group.title}
                      </h4>
                      <div className="space-y-1">
                        {group.permissions.map((permission, permIndex) => (
                          <div
                            key={permIndex}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-600">
                              {permission.name}
                            </span>
                            <div
                              className={`flex items-center gap-1 ${
                                permission.granted
                                  ? "text-green-600"
                                  : "text-red-500"
                              }`}
                            >
                              {permission.granted ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <div className="h-3 w-3 rounded-full border-2 border-red-500" />
                              )}
                              <span className="text-xs">
                                {permission.granted
                                  ? t("granted")
                                  : t("denied")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className={`hover:shadow-lg transition-shadow cursor-pointer ${
                    !feature.permission ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <feature.icon className="h-5 w-5" />
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {feature.description}
                    </p>
                    <CHEKIOButton
                      variant="primary"
                      className={`w-full ${feature.color} text-white`}
                      onClick={() =>
                        feature.permission && router.push(feature.href)
                      }
                      disabled={!feature.permission}
                    >
                      {feature.permission ? t("access") : t("noPermission")}
                    </CHEKIOButton>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {permissionGroups.map((group, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {group.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {group.permissions.map((permission, permIndex) => (
                        <div
                          key={permIndex}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm font-medium">
                            {permission.name}
                          </span>
                          <div
                            className={`flex items-center gap-1 ${
                              permission.granted
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            {permission.granted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-red-500" />
                            )}
                            <span className="text-xs font-medium">
                              {permission.granted ? t("granted") : t("denied")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t("recentActivity")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities
                    .filter((activity) => activity.permission)
                    .map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {activity.action}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activity.user}
                            {tCustom("activityDemoMetaSeparator")}
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
