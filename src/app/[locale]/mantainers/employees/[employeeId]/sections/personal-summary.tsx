"use client";

import {
  CHEKIOButton,
  CHEKIOProgressBar,
  CHEKIOTab,
  CHEKIOTabs,
} from "@/components";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  LineChart,
  PieChart,
  Target,
  Timer,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import { DateTime } from "luxon";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AttendanceStats {
  onTimePercentage: number;
  latePercentage: number;
  earlyDeparturePercentage: number;
  absencePercentage: number;
  hoursWorked: number;
  overtimeHours: number;
  expectedHours: number;
  monthlyAttendance: {
    month: string;
    onTime: number;
    late: number;
    absent: number;
    earlyDeparture: number;
  }[];
  attendanceTrend: {
    date: string;
    hours: number;
    status: string;
  }[];
  weekdayDistribution: {
    name: string;
    value: number;
    fill: string;
  }[];
  hourlyDistribution: {
    hour: string;
    count: number;
  }[];
  recentAttendances: {
    date: string;
    checkIn: string;
    checkOut: string;
    status: string;
  }[];
}

interface EmployeeInfo {
  id: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  photo?: string;
  code: string;
  branch?: {
    name: string;
  };
  job?: {
    name: string;
  };
}

enum AttendanceStatus {
  ON_TIME = "on-time",
  LATE = "late",
  EARLY_DEPARTURE = "early-departure",
  ABSENT = "absent",
  WEEKEND = "weekend",
}

enum ChartTab {
  MONTHLY = "monthly",
  DAILY = "daily",
  WEEKDAY = "weekday",
  COMPLIANCE = "compliance",
}

const PersonalSummary = ({
  attendanceStats,
  employee,
}: {
  attendanceStats: AttendanceStats;
  employee: EmployeeInfo;
}) => {
  const t = useTranslations("mantainers.employees");
  const [activeChartTab, setActiveChartTab] = useState<ChartTab>(
    ChartTab.MONTHLY
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case AttendanceStatus.ON_TIME:
        return "bg-green-100 text-green-800 border-green-300";
      case AttendanceStatus.LATE:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case AttendanceStatus.EARLY_DEPARTURE:
        return "bg-orange-100 text-orange-800 border-orange-300";
      case AttendanceStatus.ABSENT:
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case AttendanceStatus.ON_TIME:
        return t("detail.summary.statusOnTime");
      case AttendanceStatus.LATE:
        return t("detail.summary.statusLate");
      case AttendanceStatus.EARLY_DEPARTURE:
        return t("detail.summary.statusEarlyDeparture");
      case AttendanceStatus.ABSENT:
        return t("detail.summary.statusAbsent");
      default:
        return t("detail.summary.statusNa");
    }
  };

  const scheduleCompliance =
    100 -
    (attendanceStats.latePercentage + attendanceStats.earlyDeparturePercentage);

  const hoursProgress = Math.round(
    (attendanceStats.hoursWorked / attendanceStats.expectedHours) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header con información del empleado */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Información del empleado */}
          <div className="flex items-center gap-4">
            {employee.photo ? (
              <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 relative">
                <Image
                  src={employee.photo}
                  alt={`${employee.firstName} ${employee.lastName}`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-blue-100 flex items-center justify-center border-2 border-gray-200">
                <User className="h-10 w-10 text-blue-600" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {employee.firstName} {employee.lastName}
                {employee.secondLastName && ` ${employee.secondLastName}`}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t("detail.summary.code")} <span className="font-medium">{employee.code}</span>
              </p>
              {employee.job && (
                <p className="text-sm text-blue-600 font-medium mt-1">
                  {employee.job.name}
                </p>
              )}
              {employee.branch && (
                <p className="text-xs text-gray-500 mt-1">
                  {employee.branch.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: A Tiempo */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Puntualidad
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {attendanceStats.onTimePercentage}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>Buen desempeño</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI: Llegadas Tarde */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Llegadas Tarde
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {attendanceStats.latePercentage}%
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">{t("detail.summary.requiresAttention")}</div>
            </div>
          </div>
        </div>

        {/* KPI: Ausencias */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Ausencias</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {attendanceStats.absencePercentage}%
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">Del total de días</div>
            </div>
          </div>
        </div>

        {/* KPI: Horas Trabajadas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Timer className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Horas Trabajadas
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {attendanceStats.hoursWorked}
                  </p>
                </div>
              </div>
              <div className="text-xs text-green-600">
                {attendanceStats.overtimeHours > 0
                  ? `+${attendanceStats.overtimeHours} horas extra`
                  : "Sin horas extra"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Segunda fila: Métricas detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cumplimiento de Horario */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Cumplimiento de Horario
              </h3>
              <p className="text-xs text-gray-500">Mes actual</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {scheduleCompliance.toFixed(0)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Basado en puntualidad y cumplimiento de jornada completa
              </p>
            </div>
            <CHEKIOProgressBar
              current={scheduleCompliance}
              total={100}
              text={`${scheduleCompliance.toFixed(0)}% de cumplimiento`}
            />
          </div>
        </div>

        {/* Progreso de Horas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Progreso de Horas
              </h3>
              <p className="text-xs text-gray-500">
                Meta: {attendanceStats.expectedHours} hrs
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Progreso</span>
              <span className="text-sm font-bold text-gray-900">
                {hoursProgress}%
              </span>
            </div>
            <CHEKIOProgressBar
              current={attendanceStats.hoursWorked}
              total={attendanceStats.expectedHours}
              text={`${attendanceStats.hoursWorked} de ${attendanceStats.expectedHours} horas`}
            />
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500">Horas Actuales</p>
                <p className="text-lg font-bold text-gray-900">
                  {attendanceStats.hoursWorked} hrs
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Horas Extra</p>
                <p
                  className={`text-lg font-bold ${
                    attendanceStats.overtimeHours > 0
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {attendanceStats.overtimeHours > 0
                    ? `+${attendanceStats.overtimeHours}`
                    : "0"}{" "}
                  hrs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Últimas Asistencias */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">
                Últimas Asistencias
              </h3>
            </div>
            <CHEKIOButton
              variant="secondaryBlue"
              className="text-xs px-3 py-1 h-auto"
            >
              Ver todas
              <ArrowRight className="h-3 w-3 ml-1" />
            </CHEKIOButton>
          </div>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
            {attendanceStats.recentAttendances.map((attendance, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      attendance.status === AttendanceStatus.ON_TIME
                        ? "bg-green-500"
                        : attendance.status === AttendanceStatus.LATE
                        ? "bg-yellow-500"
                        : attendance.status === AttendanceStatus.EARLY_DEPARTURE
                        ? "bg-orange-500"
                        : "bg-red-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {DateTime.fromISO(attendance.date).toLocaleString(
                        DateTime.DATE_FULL
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getStatusLabel(attendance.status)}
                    </p>
                  </div>
                </div>
                <div>
                  {attendance.checkIn ? (
                    <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200 font-medium">
                      {attendance.checkIn} - {attendance.checkOut}
                    </span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
                      Ausente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráficos detallados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Análisis Detallado de Asistencia
          </h2>
          <p className="text-sm text-gray-600">
            Visualización completa de los patrones de asistencia y cumplimiento
          </p>
        </div>

        <CHEKIOTabs className="mb-6">
          <CHEKIOTab
            active={activeChartTab === ChartTab.MONTHLY}
            onClick={() => setActiveChartTab(ChartTab.MONTHLY)}
            icon={<BarChart3 className="h-4 w-4" />}
          >
            Asistencia Mensual
          </CHEKIOTab>
          <CHEKIOTab
            active={activeChartTab === ChartTab.DAILY}
            onClick={() => setActiveChartTab(ChartTab.DAILY)}
            icon={<LineChart className="h-4 w-4" />}
          >
            Tendencia Diaria
          </CHEKIOTab>
          <CHEKIOTab
            active={activeChartTab === ChartTab.WEEKDAY}
            onClick={() => setActiveChartTab(ChartTab.WEEKDAY)}
            icon={<PieChart className="h-4 w-4" />}
          >
            Distribución por Día
          </CHEKIOTab>
          <CHEKIOTab
            active={activeChartTab === ChartTab.COMPLIANCE}
            onClick={() => setActiveChartTab(ChartTab.COMPLIANCE)}
            icon={<Activity className="h-4 w-4" />}
          >
            Cumplimiento
          </CHEKIOTab>
        </CHEKIOTabs>

        {/* Gráfico: Asistencia Mensual */}
        {activeChartTab === ChartTab.MONTHLY && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Distribución Mensual de Asistencias
              </h3>
              <p className="text-sm text-gray-600">
                Comparación de asistencias a tiempo, llegadas tarde, ausencias y
                salidas anticipadas durante los últimos 6 meses
              </p>
            </div>
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={attendanceStats.monthlyAttendance}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      border: "1px solid #e5e7eb",
                    }}
                    formatter={(value: any, name: string) => {
                      const labels: Record<string, string> = {
                        onTime: "A Tiempo",
                        late: "Llegadas Tarde",
                        absent: "Ausencias",
                        earlyDeparture: "Salidas Anticipadas",
                      };
                      return [`${value} días`, labels[name] || name];
                    }}
                  />
                  <Legend
                    formatter={(value: string) => {
                      const labels: Record<string, string> = {
                        onTime: "A Tiempo",
                        late: "Llegadas Tarde",
                        absent: "Ausencias",
                        earlyDeparture: "Salidas Anticipadas",
                      };
                      return labels[value] || value;
                    }}
                  />
                  <Bar
                    dataKey="onTime"
                    name="onTime"
                    stackId="a"
                    fill="#3f8600"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="late"
                    name="late"
                    stackId="a"
                    fill="#faad14"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="absent"
                    name="absent"
                    stackId="a"
                    fill="#cf1322"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="earlyDeparture"
                    name="earlyDeparture"
                    stackId="a"
                    fill="#fa8c16"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Interpretación:</strong> Este gráfico muestra la
                distribución de tipos de asistencia por mes. Las barras verdes
                representan asistencias a tiempo, las amarillas llegadas tarde,
                las rojas ausencias y las naranjas salidas anticipadas.
              </p>
            </div>
          </div>
        )}

        {/* Gráfico: Tendencia Diaria */}
        {activeChartTab === ChartTab.DAILY && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Tendencia de Horas Trabajadas
              </h3>
              <p className="text-sm text-gray-600">
                Evolución diaria de las horas trabajadas durante las últimas 2
                semanas
              </p>
            </div>
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                  data={attendanceStats.attendanceTrend}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                    label={{
                      value: "Horas",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle", fontSize: "12px" },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      border: "1px solid #e5e7eb",
                    }}
                    formatter={(value: any) => [
                      `${value} horas`,
                      "Horas Trabajadas",
                    ]}
                    labelFormatter={(label: string) => `Fecha: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    name="Horas Trabajadas"
                    stroke="#2563eb"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    dot={{ r: 4, fill: "#2563eb" }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Interpretación:</strong> La línea azul muestra las horas
                trabajadas por día. Los puntos más altos indican días con más
                horas trabajadas, mientras que los puntos en cero pueden indicar
                ausencias o días libres.
              </p>
            </div>
          </div>
        )}

        {/* Gráfico: Distribución por Día */}
        {activeChartTab === ChartTab.WEEKDAY && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Análisis por Día de la Semana
              </h3>
              <p className="text-sm text-gray-600">
                Puntualidad y distribución de horarios de entrada por día de la
                semana
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gráfico de Puntualidad */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Puntualidad por Día (%)
                </h4>
                <div style={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={attendanceStats.weekdayDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {attendanceStats.weekdayDistribution.map(
                          (entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          )
                        )}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          border: "1px solid #e5e7eb",
                        }}
                        formatter={(value: any) => [`${value}%`, "Puntualidad"]}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Porcentaje de puntualidad por día de la semana
                </p>
              </div>

              {/* Gráfico de Horarios de Entrada */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Distribución de Horarios de Entrada
                </h4>
                <div style={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={attendanceStats.hourlyDistribution}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="hour"
                        stroke="#6b7280"
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: "12px" }}
                        label={{
                          value: "Frecuencia",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fontSize: "12px" },
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          border: "1px solid #e5e7eb",
                        }}
                        formatter={(value: any) => [
                          `${value} marcas`,
                          "Frecuencia",
                        ]}
                      />
                      <Bar
                        dataKey="count"
                        name="Frecuencia de Marcaje"
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                      >
                        {attendanceStats.hourlyDistribution.map(
                          (entry, index) => {
                            const maxCount = Math.max(
                              ...attendanceStats.hourlyDistribution.map(
                                (e) => e.count
                              )
                            );
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.count === maxCount
                                    ? "#3f8600"
                                    : "#2563eb"
                                }
                              />
                            );
                          }
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Frecuencia de marcas de entrada por horario
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Interpretación:</strong> El gráfico circular muestra la
                puntualidad promedio por día de la semana. El gráfico de barras
                muestra los horarios más frecuentes de entrada, donde las barras
                verdes indican el horario más común.
              </p>
            </div>
          </div>
        )}

        {/* Gráfico: Cumplimiento */}
        {activeChartTab === ChartTab.COMPLIANCE && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Análisis de Cumplimiento
              </h3>
              <p className="text-sm text-gray-600">
                Evolución del cumplimiento de horas trabajadas a lo largo del
                tiempo
              </p>
            </div>
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={attendanceStats.attendanceTrend}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#2563eb"
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                    label={{
                      value: "Horas",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle", fontSize: "12px" },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      border: "1px solid #e5e7eb",
                    }}
                    formatter={(value: any) => [
                      `${value} horas`,
                      "Horas Trabajadas",
                    ]}
                    labelFormatter={(label: string) => `Fecha: ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    name="Horas Trabajadas"
                    stroke="#2563eb"
                    fillOpacity={1}
                    fill="url(#colorHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Leyenda de Estados
              </h4>
              <div className="flex flex-wrap gap-4 justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-600"></div>
                  <span className="text-sm text-gray-700">A Tiempo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-700">Llegada Tarde</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-gray-700">
                    Salida Anticipada
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-600"></div>
                  <span className="text-sm text-gray-700">Ausente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                  <span className="text-sm text-gray-700">
                    Fin de Semana/Feriado
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Interpretación:</strong> Este gráfico de área muestra la
                evolución de las horas trabajadas. El área sombreada representa
                el volumen de horas, permitiendo identificar tendencias y
                patrones de cumplimiento a lo largo del tiempo.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalSummary;
