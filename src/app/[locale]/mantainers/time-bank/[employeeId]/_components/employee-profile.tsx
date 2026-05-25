"use client";

import {
  Calendar,
  CalendarDays,
  Clock,
  Mail,
  MapPin,
  Phone,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { DateTime } from "luxon";
import { TimeBankStatus, TimeBankType } from "../../_components/time-bank.dto";

interface EmployeeProfileProps {
  employee: any;
  timeBank: any;
  onDebitCredit?: (timeBank: any) => void;
  onViewHistory?: () => void;
}

const getStatusBadge = (status: TimeBankStatus | string) => {
  const isActive = status === TimeBankStatus.ACTIVE;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
        isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {isActive ? "Activo" : "Expirado"}
    </span>
  );
};

const getTypeBadge = (type: TimeBankType | string) => {
  const isEconomic =
    type === TimeBankType.ECONOMIC_HOURS || type === "ECONOMIC_HOURS";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
        isEconomic
          ? "bg-blue-100 text-blue-800"
          : "bg-purple-100 text-purple-800"
      }`}
    >
      {isEconomic ? "Hora Económica" : "Días de Descanso"}
    </span>
  );
};

export default function EmployeeProfile({
  employee,
  timeBank,
}: EmployeeProfileProps) {
  const totalHours =
    (timeBank.availableHours ?? 0) + (timeBank.usedHours ?? 0);
  const bankType =
    timeBank.type ?? timeBank.timeBankType ?? TimeBankType.REST_DAYS;
  const status =
    timeBank.status ??
    (timeBank.endDate && new Date(timeBank.endDate) < new Date()
      ? TimeBankStatus.EXPIRED
      : TimeBankStatus.ACTIVE);

  const formatPeriodDate = (iso: string | undefined) =>
    iso ? DateTime.fromISO(iso).toFormat("dd/MM/yyyy") : "—";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Información del Empleado */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-gray-900">
          Información del Empleado
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          Datos personales y laborales del empleado
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {employee.code != null && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Código
              </label>
              <p className="text-sm text-gray-900">{employee.code}</p>
            </div>
          )}
          {employee.documentNumber != null && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Documento
              </label>
              <p className="text-sm text-gray-900">{employee.documentNumber}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-600">Nombre</label>
            <p className="text-sm text-gray-900">
              {employee.firstName && employee.lastName
                ? `${employee.firstName} ${employee.lastName}`
                : (employee.name ?? "—")}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-900">
                {employee.personalEmail ??
                  employee.workEmail ??
                  "—"}
              </p>
            </div>
          </div>
          {employee.personalPhone && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Teléfono Personal
              </label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900">{employee.personalPhone}</p>
              </div>
            </div>
          )}
          {employee.workPhone && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Teléfono Laboral
              </label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900">{employee.workPhone}</p>
              </div>
            </div>
          )}
          {employee.address && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-600">
                Dirección
              </label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900">{employee.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información del Banco de Horas */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-gray-900">
          Información del Banco de Horas
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          Detalles del banco de horas y configuración actual
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-600">Estado</label>
            <div className="mt-1">{getStatusBadge(status)}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              Tipo de Banco
            </label>
            <div className="mt-1">{getTypeBadge(bankType)}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              Horas Totales
            </label>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <p className="text-lg font-semibold text-blue-600">
                {totalHours.toFixed(1)} hrs
              </p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              Horas Disponibles
            </label>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-lg font-semibold text-green-600">
                {(timeBank.availableHours ?? 0).toFixed(1)} hrs
              </p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              Horas Utilizadas
            </label>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <p className="text-lg font-semibold text-orange-600">
                {(timeBank.usedHours ?? 0).toFixed(1)} hrs
              </p>
            </div>
          </div>
          {timeBank.hoursPerDay && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Horas por Día
              </label>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-purple-600" />
                <p className="text-lg font-semibold text-purple-600">
                  {timeBank.hoursPerDay} hrs/día
                </p>
              </div>
            </div>
          )}
          {timeBank.startDate && timeBank.endDate && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-600">
                Período de Vigencia
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900">
                  {formatPeriodDate(timeBank.startDate)} –{" "}
                  {formatPeriodDate(timeBank.endDate)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
