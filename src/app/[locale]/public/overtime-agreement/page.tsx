"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";

interface OvertimeAgreementData {
  action: "confirm" | "reject";
  summary: string;
  employeeName: string;
  requestDate: string;
  agreementType: string;
  agreementDetails: string;
  overtimeHours: string;
  recipientName: string;
  rejectionReason?: string;
  employeeId?: string;
  department?: string;
  position?: string;
  effectiveDate?: string;
  hourlyRate?: string;
  maxWeeklyHours?: string;
  agreementDuration?: string;
}

interface OvertimePreviewResponse {
  publicId: string;
  employeeName?: string;
  employeeEmail?: string;
  observation?: string;
  type: string;
  startDate?: string;
  endDate?: string;
  status: string;
  createdAt: string;
  createdByName?: string;
  aditionHoursBeforeMinutes?: number;
  aditionHoursAfterMinutes?: number;
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

function mapPreviewToAgreementData(
  preview: OvertimePreviewResponse,
  action: "confirm" | "reject",
  rejectionReason?: string
): OvertimeAgreementData {
  const typeLabel =
    preview.type === "PER_SCHEDULE" ? "Por horario" : "Por horas";
  const details = preview.observation || typeLabel;
  const overtimeHours =
    preview.aditionHoursBeforeMinutes != null ||
    preview.aditionHoursAfterMinutes != null
      ? "Según acuerdo"
      : "Según acuerdo";

  return {
    action,
    employeeName: preview.employeeName || "Trabajador/a",
    requestDate: formatDate(preview.createdAt),
    agreementType: "Pacto de Horas Extraordinarias",
    agreementDetails: details,
    overtimeHours,
    recipientName: preview.createdByName || "Estimado/a",
    summary:
      action === "confirm"
        ? "Confirmación de pacto de horas extraordinarias."
        : "Rechazo de pacto de horas extraordinarias.",
    rejectionReason,
    effectiveDate: formatDate(preview.startDate || preview.endDate),
    agreementDuration: "Según acuerdo",
    hourlyRate: "Según acuerdo",
    maxWeeklyHours: "Según acuerdo",
  };
}

function OvertimeAgreementContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<OvertimeAgreementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const token = searchParams.get("token");
  const action = (searchParams.get("action") || "confirm") as
    | "confirm"
    | "reject";

  const fetchPreview = useCallback(
    async (jwt: string) => {
      const res = await fetch("/api/proxy/client/overtime-trigger/preview", {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string })?.message || "Error al cargar los datos"
        );
      }
      return res.json() as Promise<OvertimePreviewResponse>;
    },
    []
  );

  const callApprove = useCallback(
    async (jwt: string) => {
      const res = await fetch("/api/proxy/client/overtime-trigger/approve", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string })?.message || "Error al aprobar"
        );
      }
      return res.json();
    },
    []
  );

  const callReject = useCallback(
    async (jwt: string, rejectionReason: string) => {
      const res = await fetch("/api/proxy/client/overtime-trigger/reject", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejectionReason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string })?.message || "Error al rechazar"
        );
      }
      return res.json();
    },
    []
  );

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

        if (action === "confirm") {
          await callApprove(token);
          if (cancelled) return;
          setData(
            mapPreviewToAgreementData(preview, "confirm")
          );
        } else {
          setData(
            mapPreviewToAgreementData(preview, "reject")
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Error al cargar los datos del pacto de horas extraordinarias"
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
  }, [token, action, fetchPreview, callApprove]);

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rejectionReasonInput.trim()) return;
    setRejectSubmitting(true);
    try {
      await callReject(token, rejectionReasonInput.trim());
      setData((prev) =>
        prev
          ? { ...prev, action: "reject", rejectionReason: rejectionReasonInput.trim() }
          : null
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al rechazar el pacto"
      );
    } finally {
      setRejectSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm font-medium">
            Cargando pacto de horas extraordinarias...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col">
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
                  Gestión de Pactos de Horas Extraordinarias
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
                  data.action === "confirm" ? "bg-green-100" : "bg-red-100"
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
                ) : (
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
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {data.action === "confirm"
                    ? "Pacto Aceptado"
                    : data.rejectionReason
                      ? "Pacto Rechazado"
                      : "Rechazar Pacto"}
                </h2>
                <p className="text-xs text-gray-600">
                  {data.action === "reject" && !data.rejectionReason
                    ? "Indique el motivo del rechazo"
                    : "Estado del pacto de horas extraordinarias"}
                </p>
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 rounded-lg mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Resumen del Pacto
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                {data.summary}
              </p>
            </div>

            {/* Agreement Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Detalles del Pacto
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

                {data.employeeId != null && (
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
                )}

                {data.position != null && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium text-xs">
                        Cargo:
                      </span>
                      <span className="text-gray-800 font-semibold text-xs">
                        {data.position}
                      </span>
                    </div>
                  </div>
                )}

                {data.department != null && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium text-xs">
                        Departamento:
                      </span>
                      <span className="text-gray-800 font-semibold text-xs">
                        {data.department}
                      </span>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      Tipo de Pacto:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.agreementType}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      Horas Extraordinarias:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.overtimeHours}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      Tarifa por Hora:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.hourlyRate}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      Máximo Semanal:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.maxWeeklyHours}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-xs">
                      Duración del Pacto:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.agreementDuration}
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
                      Detalles del Pacto:
                    </span>
                    <span className="text-gray-800 font-semibold text-xs">
                      {data.agreementDetails}
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

          {/* Right Column - Confirmation/Rejection or Reject Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {data.action === "reject" && !data.rejectionReason ? (
              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Motivo del rechazo
                </h3>
                <p className="text-sm text-gray-600">
                  Indique el motivo por el cual rechaza este pacto de horas
                  extraordinarias (obligatorio).
                </p>
                <textarea
                  className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Escriba el motivo del rechazo..."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  required
                  disabled={rejectSubmitting}
                />
                <button
                  type="submit"
                  disabled={rejectSubmitting || !rejectionReasonInput.trim()}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg text-sm transition-colors"
                >
                  {rejectSubmitting ? "Enviando..." : "Confirmar rechazo"}
                </button>
              </form>
            ) : (
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
                  ? "¡Pacto Aceptado!"
                  : "Pacto Rechazado"}
              </h2>
              <p className="text-gray-600 text-sm">
                {data.action === "confirm"
                  ? "El pacto de horas extraordinarias ha sido aceptado exitosamente"
                  : "El pacto de horas extraordinarias no ha sido aprobado"}
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
                  ? "Pacto Registrado"
                  : "Rechazo Registrado"}
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  data.action === "confirm" ? "text-green-700" : "text-red-700"
                }`}
              >
                {data.action === "confirm"
                  ? "Este pacto ha sido registrado en nuestro sistema y será efectivo desde la fecha de firma."
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
                    <li>• El pacto será efectivo desde {data.effectiveDate}</li>
                    <li>
                      • Se podrán realizar horas extraordinarias según el
                      acuerdo
                    </li>
                    <li>• Se aplicará la remuneración de {data.hourlyRate}</li>
                    <li>
                      • El pacto tendrá una duración de {data.agreementDuration}
                    </li>
                  </>
                ) : (
                  <>
                    <li>• Se ha notificado al trabajador sobre el rechazo</li>
                    <li>• No se podrán realizar horas extraordinarias</li>
                    <li>• Se mantendrá el horario regular de trabajo</li>
                    <li>• Se priorizará el equilibrio trabajo-vida personal</li>
                    <li>• Puede contactar a RRHH para más información</li>
                  </>
                )}
              </ul>
            </div>

            {/* Recipient Info */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">
                Destinatario
              </h3>
              <p className="text-amber-700 text-xs">
                Estimado/a(s) <strong>{data.recipientName}</strong>,
              </p>
              <p className="text-amber-700 text-xs mt-1">
                {data.action === "confirm"
                  ? "Se ha procesado la aceptación del pacto de horas extraordinarias."
                  : "Se ha procesado el rechazo del pacto de horas extraordinarias."}
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
                Sistema integral de gestión de horas extraordinarias y recursos
                humanos.
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
                    className="text-amber-400 hover:text-amber-300 transition-colors"
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
    </div>
  );
}

export default function OvertimeAgreementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-sm font-medium">
              Cargando...
            </p>
          </div>
        </div>
      }
    >
      <OvertimeAgreementContent />
    </Suspense>
  );
}

