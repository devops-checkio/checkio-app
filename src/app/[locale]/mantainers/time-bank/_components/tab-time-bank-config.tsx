"use client";

import {
  CHEKIOButton,
  CHEKIOLoading,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useGetTimeBankConfig } from "@/service/mantainer.service";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import TimeBankCompanyConfigModal from "./time-bank-company-config-modal";

function TabTimeBankConfig() {
  const { canRead, canCreate, canUpdate, companyId } = useCookieSession();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const { data: config, isLoading, refetch } = useGetTimeBankConfig(companyId ?? null);

  if (!canRead(OrganizationPermissionCode.BANK_MAINTENANCE)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">
          No tienes permisos para ver la configuración
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Configuración del Banco de Horas
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Configura los parámetros generales para el sistema de banco de
              horas
            </p>
          </div>
          {(canCreate(OrganizationPermissionCode.BANK_MAINTENANCE) ||
            canUpdate(OrganizationPermissionCode.BANK_MAINTENANCE)) && (
            <CHEKIOButton
              variant="secondaryBlue"
              onClick={() => setIsConfigModalOpen(true)}
            >
              <Edit className="h-4 w-4" />
              Editar Configuración
            </CHEKIOButton>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <CHEKIOLoading size="lg" variant="modern" text="Cargando configuración..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Horas por Día
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {config?.hoursPerDay ?? 8}h
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Duración Máxima
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {config?.maxDurationMonths ?? 12} meses
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Saldo Negativo
                  </p>
                  <p className="text-lg font-bold">
                    {config?.allowNegativeBalance ? (
                      <span className="text-green-600">Permitido</span>
                    ) : (
                      <span className="text-red-600">No permitido</span>
                    )}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-full ${config?.allowNegativeBalance ? "bg-green-100" : "bg-red-100"}`}
                >
                  {config?.allowNegativeBalance ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Expiración Automática
                  </p>
                  <p className="text-lg font-bold">
                    {config?.autoExpireEnabled ? (
                      <span className="text-green-600">Activada</span>
                    ) : (
                      <span className="text-gray-500">Desactivada</span>
                    )}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-full ${config?.autoExpireEnabled ? "bg-yellow-100" : "bg-gray-100"}`}
                >
                  <AlertTriangle
                    className={`w-6 h-6 ${config?.autoExpireEnabled ? "text-yellow-600" : "text-gray-400"}`}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Días para Expirar
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {config?.autoExpireDays ?? 30} días
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Aprobación para Consumo
                  </p>
                  <p className="text-lg font-bold">
                    {config?.requiresApprovalForConsumption ? (
                      <span className="text-blue-600">Requerida</span>
                    ) : (
                      <span className="text-gray-500">No requerida</span>
                    )}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-full ${config?.requiresApprovalForConsumption ? "bg-blue-100" : "bg-gray-100"}`}
                >
                  <ShieldCheck
                    className={`w-6 h-6 ${config?.requiresApprovalForConsumption ? "text-blue-600" : "text-gray-400"}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      {isConfigModalOpen && (
        <TimeBankCompanyConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          currentConfig={config}
          onSuccess={() => {
            setIsConfigModalOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default TabTimeBankConfig;
