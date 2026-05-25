"use client";

import { CHEKIOModal } from "@/components";
import { AlertTriangle, Check } from "lucide-react";

interface ShiftModalInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShiftModalInfo({
  isOpen,
  onClose,
}: ShiftModalInfoProps) {
  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Turnos"
      size="lg"
    >
      <div className="space-y-6 py-4">
        {/* Sección de Información */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Acerca de la Gestión de Turnos
          </h3>
          <div className="space-y-4">
            {/* Qué son los turnos */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-700 mb-2">
                ¿Cómo funciona la gestión de turnos?
              </h4>
              <p className="text-sm text-gray-600">
                El sistema de gestión de turnos permite organizar los horarios
                de trabajo en tres categorías principales:
              </p>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Turnos Vigentes: Horarios actuales activos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Turnos Futuros: Programación de próximos horarios
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  Turnos Pasados: Horarios ya completados
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  Sin Asignar: Empleados pendientes de asignación
                </li>
              </ul>
            </div>

            {/* Beneficios */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-700 mb-2">Beneficios</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  Control eficiente de horarios y rotaciones
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  Planificación anticipada de turnos
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  Gestión de personal optimizada
                </li>
              </ul>
            </div>

            {/* Alertas y Notificaciones */}
            <div className="p-4 bg-amber-50 rounded-lg">
              <h4 className="font-medium text-amber-700 mb-2">
                Sistema de Alertas
              </h4>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-1" />
                <p className="text-sm text-gray-600">
                  El sistema notificará automáticamente cuando existan empleados
                  sin turnos asignados o cuando haya conflictos en los horarios
                  programados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CHEKIOModal>
  );
}
