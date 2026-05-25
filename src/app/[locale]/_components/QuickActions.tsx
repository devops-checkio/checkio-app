"use client";

import { CHEKIOButton } from "@/components";
import { BarChart3, ClipboardCheck, Settings, Users } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

const ACTION_STYLES = [
  { bg: "#3b82f6", buttonBg: "#2563eb" }, // blue - Asistencia
  { bg: "#06b6d4", buttonBg: "#0891b2" }, // cyan - Empleados
  { bg: "#10b981", buttonBg: "#059669" }, // green - Horarios
  { bg: "#f59e0b", buttonBg: "#d97706" }, // orange - Configuración
  { bg: "#8b5cf6", buttonBg: "#7c3aed" }, // violet - Reportes
] as const;

export default function QuickActions() {
  const router = useRouter();
  const t = useTranslations("homeAdmin");
  const tCommon = useTranslations("common");

  const quickActions = [
    {
      title: t("attendanceManagement"),
      description: t("attendanceManagementDescription"),
      icon: ClipboardCheck,
      href: "/assistance/management",
    },
    {
      title: t("employeeManagement"),
      description: t("employeeManagementDescription"),
      icon: Users,
      href: "/mantainers/employees",
    },
    {
      title: t("scheduleManagement"),
      description: t("scheduleManagementDescription"),
      icon: BarChart3,
      href: "/operations/schedule",
    },
    {
      title: t("systemSettings"),
      description: t("systemSettingsDescription"),
      icon: Settings,
      href: "/mantainers/roles",
    },
    {
      title: t("attendanceReports"),
      description: t("attendanceReportsDescription"),
      icon: BarChart3,
      href: "/reports/manager",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          {t("quickActions")}
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {quickActions.map((action, index) => {
          const style = ACTION_STYLES[index];
          const cardDelayMs = 80 + index * 90;
          return (
            <div
              key={index}
              className="relative overflow-hidden rounded-lg p-6 shadow-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg active:scale-[0.99] cursor-pointer"
              style={{
                backgroundColor: style.bg,
                animation: "dashboard-card-in 0.5s ease-out both",
                animationDelay: `${cardDelayMs}ms`,
              }}
              onClick={() => router.push(action.href)}
            >
              <div
                className="absolute right-4 top-4 opacity-40"
                style={{ color: "rgba(255,255,255,0.15)" }}
              >
                <action.icon className="h-16 w-16" strokeWidth={0.5} />
              </div>
              <div className="relative flex flex-col gap-4">
                <p className="text-base font-semibold text-white">
                  {action.title}
                </p>
                <p className="text-sm text-white/95">{action.description}</p>
                <CHEKIOButton
                  className="w-full justify-center gap-1.5 border-0 text-white hover:opacity-90"
                  style={{ backgroundColor: style.buttonBg }}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(action.href);
                  }}
                >
                  {tCommon("access")}
                  <ChevronRight className="h-4 w-4" />
                </CHEKIOButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
