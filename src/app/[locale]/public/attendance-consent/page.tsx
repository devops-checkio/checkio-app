"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";

interface AttendanceConsentPreview {
  employeeName: string;
  requestDate: string;
  consentType: string;
  consentDetails: string;
  recipientName: string;
  employeeId: string;
  effectiveDate: string;
  isProcessed: boolean;
  summary: string;
  markType?: string;
  markDate?: string;
  markTime?: string;
  markDateTimeFormatted?: string;
  adjustmentNote?: string;
}

interface AttendanceConsentData extends AttendanceConsentPreview {
  action?: "confirm" | "reject";
  rejectionReason?: string;
}

function formatDate(value: string | undefined): string {
  if (!value) return "-";
  try {
    const d = new Date(value);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function AttendanceConsentContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<AttendanceConsentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showRejectionConfirmation, setShowRejectionConfirmation] =
    useState(false);
  const [showProcessedModal, setShowProcessedModal] = useState(false);
  const [rejectionObservation, setRejectionObservation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAction, setCurrentAction] = useState<
    "confirm" | "reject" | null
  >(null);

  const token = searchParams.get("token");

  const fetchPreview = useCallback(async (jwt: string) => {
    const res = await fetch("/api/proxy/client/assistance-trigger/preview", {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        (err as { message?: string })?.message ||
          "Token no válido o expirado"
      );
    }
    return res.json() as Promise<AttendanceConsentPreview>;
  }, []);

  useEffect(() => {
    if (!token) {
      setError("Token no válido");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const preview = await fetchPreview(token);
        if (cancelled) return;

        if (preview.isProcessed) {
          setShowProcessedModal(true);
          setData({ ...preview });
        } else {
          setData({ ...preview });
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "Error al cargar los datos del consentimiento"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token, fetchPreview]);

  const handleConfirm = async () => {
    if (!token) return;
    setIsSubmitting(true);
    setCurrentAction("confirm");

    try {
      const response = await fetch(
        "/api/proxy/client/assistance-trigger/approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string })?.message ||
            "Error al confirmar el consentimiento"
        );
      }

      setData((prev) =>
        prev
          ? {
              ...prev,
              action: "confirm",
              summary:
                "Confirmación de consentimiento para marcaje de asistencia biométrico",
            }
          : null
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al confirmar el consentimiento"
      );
    } finally {
      setIsSubmitting(false);
      setCurrentAction(null);
    }
  };

  const handleRejectObservation = () => {
    if (!rejectionObservation.trim()) {
      alert(
        "Debe ingresar una observación obligatoria para rechazar el consentimiento"
      );
      return;
    }

    // Cerrar modal de observación y abrir modal de confirmación
    setShowRejectionModal(false);
    setShowRejectionConfirmation(true);
  };

  const handleRejectConfirm = async () => {
    if (!token) return;
    setIsSubmitting(true);
    setCurrentAction("reject");

    try {
      const response = await fetch(
        "/api/proxy/client/assistance-trigger/reject",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rejectionReason: rejectionObservation }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string })?.message ||
            "Error al rechazar el consentimiento"
        );
      }

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

      setShowRejectionConfirmation(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al rechazar el consentimiento"
      );
    } finally {
      setIsSubmitting(false);
      setCurrentAction(null);
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
                  Gestión de Consentimientos de Marcaje
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
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  data.action === "confirm"
                    ? "bg-green-100"
                    : data.action === "reject"
                      ? "bg-red-100"
                      : "bg-purple-100"
                }`}
              >
                {data.action === "confirm" ? (
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : data.action === "reject" ? (
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
                ) : (
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {data.action === "confirm"
                    ? "Consentimiento Aceptado"
                    : data.action === "reject"
                      ? "Consentimiento Rechazado"
                      : "Consentimiento de Marcaje"}
                </h2>
                <p className="text-xs text-gray-600">
                  {data.action !== undefined
                    ? "Estado del consentimiento de marcaje"
                    : "Confirme o rechace la modificación de marcación"}
                </p>
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-4 rounded-lg mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Resumen del Consentimiento
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                {data.summary}
              </p>
            </div>

            {/* Información de la Marca */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Información de la Marca
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium text-xs">
                    Tipo de Marcaje:
                  </span>
                  <span className="text-gray-800 font-semibold text-xs">
                    {data.markType ?? data.consentType}
                  </span>
                </div>
                {(data.markDate ?? data.markDateTimeFormatted) && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      Fecha:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.markDate ??
                        (data.markDateTimeFormatted
                          ? data.markDateTimeFormatted.split(" ")[0]
                          : formatDate(data.effectiveDate))}
                    </span>
                  </div>
                )}
                {(data.markTime ?? data.markDateTimeFormatted) && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      Hora:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.markTime ??
                        (data.markDateTimeFormatted
                          ? data.markDateTimeFormatted.split(" ")[1]
                          : "-")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-600 font-medium text-xs shrink-0">
                    Observación:
                  </span>
                  <span className="text-gray-800 font-semibold text-xs text-right">
                    {data.adjustmentNote ?? data.summary}
                  </span>
                </div>
              </div>
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
                      {data.markType ?? data.consentType}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      Fecha de solicitud:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {formatDate(data.requestDate)}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      Fecha y hora de la marca:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.markDateTimeFormatted ??
                        formatDate(data.effectiveDate)}
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

                {data.action === "reject" && data.rejectionReason && (
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

          {/* Right Column - Confirmation/Rejection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Action Buttons - Only show if not already processed and no action taken yet */}
            {!data.isProcessed && data.action === undefined && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Acciones Disponibles
                </h3>
                <div className="flex space-x-3">
                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    {isSubmitting && currentAction === "confirm" ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Confirmar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowRejectionModal(true)}
                    disabled={isSubmitting}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    {isSubmitting && currentAction === "reject" ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
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
                        Rechazar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {(data.action === "confirm" || data.action === "reject") && (
            <>
            <div className="text-center mb-6">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  data.action === "confirm" ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {data.action === "confirm" ? (
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
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
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {data.action === "confirm"
                  ? "¡Consentimiento Aceptado!"
                  : "Consentimiento Rechazado"}
              </h2>
              <p className="text-gray-600 text-sm">
                {data.action === "confirm"
                  ? "El consentimiento de marcaje ha sido aceptado exitosamente"
                  : "El consentimiento de marcaje no ha sido aprobado"}
              </p>
            </div>

            {/* Action Message */}
            <div
              className={`border p-4 rounded-lg mb-4 ${
                data.action === "confirm"
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                  : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
              }`}
            >
              <h3
                className={`text-sm font-semibold mb-2 ${
                  data.action === "confirm" ? "text-green-800" : "text-red-800"
                }`}
              >
                {data.action === "confirm"
                  ? "Consentimiento Registrado"
                  : "Rechazo Registrado"}
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  data.action === "confirm" ? "text-green-700" : "text-red-700"
                }`}
              >
                {data.action === "confirm"
                  ? "Este consentimiento ha sido registrado en nuestro sistema y será efectivo inmediatamente."
                  : "Este rechazo ha sido registrado en nuestro sistema y se ha notificado a las partes correspondientes."}
              </p>
            </div>

            {/* Next Steps */}
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
              <h3 className="text-sm font-semibold text-orange-800 mb-2">
                Próximos Pasos
              </h3>
              <ul className="text-xs text-orange-700 space-y-1">
                {data.action === "confirm" ? (
                  <>
                    <li>
                      • Se ha notificado al trabajador sobre la aceptación
                    </li>
                    <li>
                      • El sistema de marcaje estará disponible desde{" "}
                      {formatDate(data.effectiveDate)}
                    </li>
                    <li>• Se activará el control biométrico de asistencia</li>
                    <li>• Se registrará la huella dactilar en el sistema</li>
                  </>
                ) : (
                  <>
                    <li>• Se ha notificado al trabajador sobre el rechazo</li>
                    <li>• Se mantendrá el sistema de marcaje anterior</li>
                    <li>• No se procesarán datos biométricos</li>
                    <li>• Puede contactar a RRHH para más información</li>
                  </>
                )}
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
                {data.action === "confirm"
                  ? "Se ha procesado la aceptación del consentimiento de marcaje."
                  : "Se ha procesado el rechazo del consentimiento de marcaje."}
              </p>
            </div>

            {/* Status Badge */}
            <div className="mt-4 text-center">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  data.action === "confirm"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    data.action === "confirm" ? "bg-green-500" : "bg-red-500"
                  }`}
                ></span>
                {data.action === "confirm"
                  ? "Estado: Aceptado"
                  : "Estado: Rechazado"}
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

      {/* Rejection Observation Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-red-600"
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
              <h3 className="text-lg font-bold text-gray-800">
                Rechazar Consentimiento
              </h3>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              Para rechazar este consentimiento, debe proporcionar una
              observación obligatoria que explique el motivo del rechazo.
            </p>

            <div className="mb-4">
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

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectObservation}
                disabled={!rejectionObservation.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Confirmation Modal */}
      {showRejectionConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-red-600"
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
              <h3 className="text-lg font-bold text-gray-800">
                Confirmar Rechazo
              </h3>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 text-sm mb-3">
                ¿Está seguro que desea rechazar este consentimiento?
              </p>

              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-red-800 mb-2">
                  Observación ingresada:
                </h4>
                <p className="text-red-700 text-sm">{rejectionObservation}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRejectionConfirmation(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  "Confirmar Rechazo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default function AttendanceConsentPage() {
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
      <AttendanceConsentContent />
    </Suspense>
  );
}

