"use client";

import { Card } from "@/components/ui/card";
import {
  Activity,
  CheckCircle,
  DollarSign,
  HardDrive,
  Users,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function SaasMetrics() {
  const t = useTranslations("homeAdmin");

  // Métricas principales del sistema SaaS
  const systemMetrics = [
    {
      title: t("monthlyCost"),
      value: "$2,450",
      subtitle: t("fromLastMonth"),
      icon: DollarSign,
      iconColor: "text-red-600",
      iconBg: "bg-red-50",
    },
    {
      title: t("costPerEmployee"),
      value: "$1.96",
      subtitle: t("fromLastMonth"),
      icon: Users,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
    },
    {
      title: t("storageUsed"),
      value: "2.4 TB",
      subtitle: t("fromLastMonth"),
      icon: HardDrive,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-50",
    },
    {
      title: t("apiCalls"),
      value: "1.2M",
      subtitle: t("fromLastMonth"),
      icon: Zap,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
    },
    {
      title: t("systemUptime"),
      value: "99.9%",
      subtitle: t("fromLastMonth"),
      icon: CheckCircle,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      title: t("supportTickets"),
      value: "3",
      subtitle: t("fromLastMonth"),
      icon: Activity,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {systemMetrics.map((metric, index) => (
        <Card
          key={index}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 ${metric.iconBg} rounded-lg`}>
              <metric.icon className={`w-5 h-5 ${metric.iconColor}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{metric.title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-semibold">{metric.value}</p>
                <p className="text-xs text-gray-500">{metric.subtitle}</p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
