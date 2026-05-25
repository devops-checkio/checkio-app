"use client";

import { Card } from "@/components/ui/card";
import { Clock, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { name: "Lun", horas: 8, meta: 8 },
  { name: "Mar", horas: 8.5, meta: 8 },
  { name: "Mie", horas: 7.5, meta: 8 },
  { name: "Jue", horas: 8, meta: 8 },
  { name: "Vie", horas: 7, meta: 8 },
  { name: "Sab", horas: 4, meta: 4 },
  { name: "Dom", horas: 0, meta: 0 },
];

export function AttendanceStats() {
  const totalHoras = data.reduce((acc, curr) => acc + curr.horas, 0);
  const metaTotal = data.reduce((acc, curr) => acc + curr.meta, 0);
  const porcentajeCumplimiento = ((totalHoras / metaTotal) * 100).toFixed(1);

  return (
    <Card className="col-span-4">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Horas Trabajadas por Día
            </h3>
            <p className="text-sm text-muted-foreground">
              Registro de la última semana
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 p-2 rounded-lg">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {porcentajeCumplimiento}% del objetivo
            </span>
          </div>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="name"
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
                tickFormatter={(value) => `${value}h`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar
                dataKey="horas"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-blue-500 dark:fill-blue-400"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
