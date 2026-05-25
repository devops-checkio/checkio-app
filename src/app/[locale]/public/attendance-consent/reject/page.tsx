"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";

interface AttendanceConsentData {
  action: "reject";
  summary: string;
  employeeName: string;
  requestDate: string;
  consentType: string;
  consentDetails: string;
  recipientName: string;
  rejectionReason?: string;
  employeeId?: string;
  effectiveDate?: string;
  isProcessed?: boolean;
}

function AttendanceConsentRejectContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<AttendanceConsentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProcessedModal, setShowProcessedModal] = useState(false);
  const [rejectionObservation, setRejectionObservation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    const jwt = searchParams.get("token");

    if (!jwt) {
      setError("Token no válido");
      setLoading(false);
      return;
    }

    const fetchAttendanceConsentData = async () => {
      try {
        // Mocks específicos para consentimiento de marcaje
        const mockData: AttendanceConsentData = {
          action: "reject",
          employeeName: "Carlos Rodríguez Méndez",
          requestDate: "18/01/2025",
          consentType: "Marcaje Biométrico",
          consentDetails:
            "Autorización para el uso de sistema de marcaje biométrico mediante huella dactilar y control de asistencia digital",
          recipientName: "Supervisor de Operaciones",
          employeeId: "EMP-2023-005678",
          effectiveDate: "25/01/2025",
          isProcessed: false, // Simular que no está procesada
          summary:
            "Rechazo de consentimiento para marcaje de asistencia por motivos de privacidad",
        };

        // Verificar si la solicitud ya está procesada
        if (mockData.isProcessed) {
          setShowProcessedModal(true);
          setLoading(false);
          return;
        }

        setData(mockData);
      } catch {
        setError("Error al cargar los datos del consentimiento");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceConsentData();
  }, [searchParams]);

  const handleRejectConfirm = async () => {
    if (!rejectionObservation.trim()) {
      alert(
        "Debe ingresar una observación obligatoria para rechazar el consentimiento"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Actualizar el estado local
      setData((prev) =>
        prev
          ? {
              ...prev,
              action: "reject",
              rejectionReason: rejectionObservation,
              summary:
                "Rechazo de consentimiento para marcaje de asistencia: " +
                rejectionObservation,
            }
          : null
      );

      setIsConfirmed(true);
    } catch {
      setError("Error al rechazar el consentimiento");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm font-medium">
            Cargando consentimiento de marcaje...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 text-sm">
            {error || "No se pudieron cargar los datos"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/logos/logo.svg"
                alt="CheckIO Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  Portal Asistencia
                </h1>
                <p className="text-xs text-gray-600">
                  Rechazo de Consentimiento de Marcaje
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">
                Fecha: {new Date().toLocaleDateString("es-ES")}
              </p>
              <p className="text-xs text-gray-600">
                Hora: {new Date().toLocaleTimeString("es-ES")}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left Column - Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {isConfirmed
                    ? "Consentimiento Rechazado"
                    : "Rechazar Consentimiento"}
                </h2>
                <p className="text-xs text-gray-600">
                  Estado del consentimiento de marcaje
                </p>
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Resumen del Consentimiento
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                {data.summary}
              </p>
            </div>

            {/* Consent Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Detalles del Consentimiento
              </h3>

              <div className="grid grid-cols-1 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      Trabajador:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.employeeName}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      ID Empleado:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.employeeId}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      Tipo de Marcaje:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.consentType}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      Fecha de solicitud:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.requestDate}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      Fecha efectiva:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.effectiveDate}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      Detalles del Consentimiento:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.consentDetails}
                    </span>
                  </div>
                </div>

                {isConfirmed && data.rejectionReason && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex justify-between items-center">
                      <span className="text-red-600 font-medium text-xs">
                        Motivo del rechazo:
                      </span>
                      <span className="text-red-700 font-semibold text-xs">
                        {data.rejectionReason}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Rejection Form/Result */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {!isConfirmed ? (
              <>
                {/* Rejection Form */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">
                    Rechazar Consentimiento
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Para rechazar este consentimiento, debe proporcionar una
                    observación obligatoria
                  </p>
                </div>

                {/* Observation Form */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observación <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionObservation}
                    onChange={(e) => setRejectionObservation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={4}
                    placeholder="Ingrese el motivo del rechazo..."
                    required
                  />
                </div>

                {/* Confirm Button */}
                <button
                  onClick={handleRejectConfirm}
                  disabled={!rejectionObservation.trim() || isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Confirmar Rechazo
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Confirmation Result */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">
                    Consentimiento Rechazado
                  </h2>
                  <p className="text-gray-600 text-sm">
                    El consentimiento de marcaje ha sido rechazado exitosamente
                  </p>
                </div>

                {/* Action Message */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 p-4 rounded-lg mb-4">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">
                    Rechazo Registrado
                  </h3>
                  <p className="text-xs leading-relaxed text-red-700">
                    Este rechazo ha sido registrado en nuestro sistema y se ha
                    notificado a las partes correspondientes.
                  </p>
                </div>

                {/* Next Steps */}
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
                  <h3 className="text-sm font-semibold text-orange-800 mb-2">
                    Próximos Pasos
                  </h3>
                  <ul className="text-xs text-orange-700 space-y-1">
                    <li>• Se ha notificado al trabajador sobre el rechazo</li>
                    <li>• Se mantendrá el sistema de marcaje anterior</li>
                    <li>• No se procesarán datos biométricos</li>
                    <li>• Puede contactar a RRHH para más información</li>
                  </ul>
                </div>

                {/* Recipient Info */}
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-800 mb-2">
                    Destinatario
                  </h3>
                  <p className="text-purple-700 text-xs">
                    Estimado/a(s) <strong>{data.recipientName}</strong>,
                  </p>
                  <p className="text-purple-700 text-xs mt-1">
                    Se ha procesado el rechazo del consentimiento de marcaje.
                  </p>
                </div>

                {/* Status Badge */}
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-red-500"></span>
                    Estado: Rechazado
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Company Info */}
            <div>
              <div className="flex items-center mb-3">
                <Image
                  src="/logos/logo.svg"
                  alt="CheckIO Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto mr-2"
                />
                <div>
                  <h3 className="text-sm font-bold">CheckIO</h3>
                  <p className="text-gray-400 text-xs">Portal Asistencia</p>
                </div>
              </div>
              <p className="text-gray-400 text-xs">
                Sistema integral de control de asistencia y marcaje.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Enlaces Rápidos</h4>
              <ul className="space-y-1 text-xs">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Términos y Condiciones
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Política de Privacidad
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Centro de Ayuda
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contacto
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Contacto</h4>
              <div className="space-y-1 text-xs text-gray-400">
                <p>¿Necesitas ayuda?</p>
                <p>
                  <a
                    href="mailto:asistencia@checkio.cl"
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    asistencia@checkio.cl
                  </a>
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  Este es un documento automático generado por el sistema.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-700 mt-6 pt-4 text-center">
            <p className="text-gray-400 text-xs">
              © 2025 CheckIO. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Already Processed Modal */}
      {showProcessedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Solicitud Ya Procesada
            </h3>

            <p className="text-gray-600 text-sm mb-6">
              Esta solicitud de consentimiento ya ha sido procesada
              anteriormente. No se pueden realizar cambios adicionales.
            </p>

            <button
              onClick={() => window.close()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttendanceConsentRejectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-sm font-medium">
              Cargando...
            </p>
          </div>
        </div>
      }
    >
      <AttendanceConsentRejectContent />
    </Suspense>
  );
}

