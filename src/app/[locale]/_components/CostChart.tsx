"use client";

import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function CostChart() {
  const t = useTranslations("homeAdmin");

  // Datos para el gráfico de costos mensuales
  const costData = [
    { month: "Ene", integraciones: 800, aplicacion: 1200, total: 2000 },
    { month: "Feb", integraciones: 750, aplicacion: 1300, total: 2050 },
    { month: "Mar", integraciones: 900, aplicacion: 1250, total: 2150 },
    { month: "Abr", integraciones: 850, aplicacion: 1400, total: 2250 },
    { month: "May", integraciones: 920, aplicacion: 1350, total: 2270 },
    { month: "Jun", integraciones: 880, aplicacion: 1450, total: 2330 },
  ];

  return (
    <Card className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          {t("costBreakdown")}
        </h3>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={costData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`,
                name === "integraciones" ? t("integrations") : t("application"),
              ]}
              labelFormatter={(label) => `Mes: ${label}`}
            />
            <Bar
              dataKey="integraciones"
              stackId="a"
              fill="#3b82f6"
              radius={[0, 0, 4, 4]}
              name="integraciones"
            />
            <Bar
              dataKey="aplicacion"
              stackId="a"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="aplicacion"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda y resumen */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">{t("integrations")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">{t("application")}</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Promedio mensual: $
            {Math.round(
              costData.reduce((sum, item) => sum + item.total, 0) /
                costData.length
            ).toLocaleString()}
          </div>
        </div>
      </div>
    </Card>
  );
}
