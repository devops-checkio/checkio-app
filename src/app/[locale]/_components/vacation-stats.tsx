"use client";

import { Card } from "@/components/ui/card";
import { CalendarDays, TrendingDown } from "lucide-react";
import {
  Area,
  AreaChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { mes: "Ene", dias: 15, promedio: 12 },
  { mes: "Feb", dias: 13, promedio: 12 },
  { mes: "Mar", dias: 12, promedio: 12 },
  { mes: "Abr", dias: 12, promedio: 12 },
  { mes: "May", dias: 10, promedio: 12 },
  { mes: "Jun", dias: 10, promedio: 12 },
  { mes: "Jul", dias: 8, promedio: 12 },
];

export function VacationStats() {
  const diasActuales = data[data.length - 1].dias;
  const diasIniciales = data[0].dias;
  const diferencia = diasActuales - diasIniciales;

  return (
    <Card className="col-span-4">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-green-500" />
              Días de Vacaciones Disponibles
            </h3>
            <p className="text-sm text-muted-foreground">
              Evolución durante el año
            </p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950 p-2 rounded-lg">
            <TrendingDown className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {Math.abs(diferencia)} días utilizados
            </span>
          </div>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorDias" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="mes"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}d`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="dias"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorDias)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="promedio"
                stroke="#888888"
                strokeDasharray="5 5"
                strokeWidth={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
