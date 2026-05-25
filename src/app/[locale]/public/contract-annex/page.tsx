"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { CHEKIOButton, CHEKIOLoading } from "@/components";
import { CheckCircle2, XCircle, FileText, Calendar, User, Hash } from "lucide-react";

interface ContractAnnexData {
  action: "confirm" | "reject";
  summary: string;
  employeeName: string;
  requestDate: string;
  contractType: string;
  annexDetails: string;
  recipientName: string;
  rejectionReason?: string;
  contractNumber?: string;
  effectiveDate?: string;
  employeeId?: string;
  isProcessed?: boolean;
}

enum ContractAction {
  CONFIRM = "confirm",
  REJECT = "reject",
}

function ContractAnnexContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ContractAnnexData | null>(null);
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

  useEffect(() => {
    const jwt = searchParams.get("token");
    // No usar action del query param para permitir que el usuario elija
    // const action = searchParams.get("action") || ContractAction.CONFIRM;

    // if (!jwt) {
    //   setError("Token no válido");
    //   setLoading(false);
    //   return;
    // }

    const fetchContractAnnexData = async () => {
      try {
        // const response = await fetch("/api/confirmation", {
        //   headers: {
        //     Authorization: `Bearer ${jwt}`,
        //   },
        // });

        // if (!response.ok) {
        //   throw new Error("Error en la respuesta de la API");
        // }

        // Mocks específicos para anexo de contrato - inicialmente sin acción definida
        const mockData: ContractAnnexData = {
          action: "confirm" as "confirm" | "reject", // Valor por defecto, pero isProcessed: false permite elegir
          employeeName: "María González Silva",
          requestDate: "15/01/2025",
          contractType: "Contrato Indefinido",
          annexDetails:
            "Modificación de jornada laboral de 44 a 40 horas semanales y cambio de horario de trabajo",
          recipientName: "Gerente de Recursos Humanos",
          contractNumber: "CT-2024-001234",
          effectiveDate: "01/02/2025",
          employeeId: "EMP-2024-001234",
          isProcessed: false, // Simular que no está procesada para permitir elegir
          summary:
            "Anexo de contrato de trabajo solicitado para modificación de jornada laboral",
          rejectionReason: undefined,
        };

        // Verificar si la solicitud ya está procesada
        if (mockData.isProcessed) {
          setShowProcessedModal(true);
          setLoading(false);
          return;
        }

        setData(mockData);
      } catch {
        setError("Error al cargar los datos del anexo de contrato");
      } finally {
        setLoading(false);
      }
    };

    fetchContractAnnexData();
  }, [searchParams]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setCurrentAction("confirm");

    try {
      // Llamada directa a la API para confirmación
      const jwt = searchParams.get("token");
      const response = await fetch("/api/confirmation/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          action: "confirm",
          employeeId: data?.employeeId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Error al confirmar el anexo");
      }

      // Actualizar el estado local
      setData((prev) =>
        prev
          ? {
              ...prev,
              action: "confirm",
              isProcessed: true,
              summary:
                "Confirmación de anexo de contrato de trabajo solicitado para modificación de jornada laboral",
            }
          : null
      );
    } catch {
      setError("Error al confirmar el anexo");
    } finally {
      setIsSubmitting(false);
      setCurrentAction(null);
    }
  };

  const handleRejectObservation = () => {
    if (!rejectionObservation.trim()) {
      alert(
        "Debe ingresar una observación obligatoria para rechazar el anexo"
      );
      return;
    }

    // Cerrar modal de observación y abrir modal de confirmación
    setShowRejectionModal(false);
    setShowRejectionConfirmation(true);
  };

  const handleRejectConfirm = async () => {
    setIsSubmitting(true);
    setCurrentAction("reject");

    try {
      // Llamada a la API para rechazo
      const jwt = searchParams.get("token");
      const response = await fetch("/api/confirmation/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          action: "reject",
          employeeId: data?.employeeId,
          rejectionReason: rejectionObservation,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Error al rechazar el anexo");
      }

      // Actualizar el estado local
      setData((prev) =>
        prev
          ? {
              ...prev,
              action: "reject",
              isProcessed: true,
              rejectionReason: rejectionObservation,
              summary:
                "Rechazo de anexo de contrato de trabajo: " +
                rejectionObservation,
            }
          : null
      );

      setShowRejectionConfirmation(false);
    } catch {
      setError("Error al rechazar el anexo");
    } finally {
      setIsSubmitting(false);
      setCurrentAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <CHEKIOLoading
          size="lg"
          variant="modern"
          text="Cargando anexo de contrato..."
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full text-center border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 text-sm">
            {error || "No se pudieron cargar los datos"}
          </p>
        </div>
      </div>
    );
  }

  const isConfirm = data.action === ContractAction.CONFIRM && data.isProcessed;
  const isReject = data.action === ContractAction.REJECT && data.isProcessed;
  const isPending = !data.isProcessed;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
                  Gestión de Anexos de Contrato
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
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Contract Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  isConfirm
                    ? "bg-green-100"
                    : isReject
                    ? "bg-red-100"
                    : "bg-yellow-100"
                }`}
              >
                {isConfirm ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : isReject ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <FileText className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isConfirm
                    ? "Anexo Aceptado"
                    : isReject
                    ? "Anexo Rechazado"
                    : "Anexo Pendiente"}
                </h2>
                <p className="text-sm text-gray-600">
                  Estado del anexo de contrato
                </p>
              </div>
            </div>

            {/* Summary Section */}
            <div
              className={`border-l-4 p-4 rounded-r-lg mb-6 ${
                isConfirm
                  ? "bg-blue-50 border-blue-500"
                  : isReject
                  ? "bg-red-50 border-red-500"
                  : "bg-yellow-50 border-yellow-500"
              }`}
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Resumen del Anexo
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {data.summary}
              </p>
            </div>

            {/* Contract Details */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Detalles del Contrato
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 block mb-1">
                        Trabajador
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {data.employeeName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 block mb-1">
                        N° Contrato
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {data.contractNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 block mb-1">
                        Tipo de Contrato
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {data.contractType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 block mb-1">
                        Fecha de Solicitud
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {data.requestDate}
                      </span>
                    </div>
                  </div>
                </div>

                {data.effectiveDate && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-xs text-gray-500 block mb-1">
                          Fecha Efectiva
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {data.effectiveDate}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 md:col-span-2">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 block mb-1">
                        Detalles del Anexo
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {data.annexDetails}
                      </span>
                    </div>
                  </div>
                </div>

                {isReject && data.rejectionReason && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 md:col-span-2">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-xs text-red-600 font-medium block mb-1">
                          Motivo del Rechazo
                        </span>
                        <span className="text-sm font-medium text-red-800">
                          {data.rejectionReason}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Status and Next Steps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Action Buttons - Only show if not already processed */}
            {!data.isProcessed && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Acciones Disponibles
                </h3>
                <div className="flex space-x-3">
                  <CHEKIOButton
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    variant="primary"
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white"
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
                  </CHEKIOButton>
                  <CHEKIOButton
                    onClick={() => setShowRejectionModal(true)}
                    disabled={isSubmitting}
                    variant="destructive"
                    className="flex-1"
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
                  </CHEKIOButton>
                </div>
              </div>
            )}

            {!isPending && (
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isConfirm ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {isConfirm ? (
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-600" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isConfirm ? "¡Anexo Aceptado!" : "Anexo Rechazado"}
                </h2>
                <p className="text-sm text-gray-600">
                  {isConfirm
                    ? "El anexo de contrato ha sido aceptado exitosamente"
                    : "El anexo de contrato no ha sido aprobado"}
                </p>
              </div>
            )}

            {/* Status Message */}
            {!isPending && (
              <div
                className={`border p-4 rounded-lg mb-6 ${
                  isConfirm
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h3
                  className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                    isConfirm ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {isConfirm ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {isConfirm ? "Anexo Registrado" : "Rechazo Registrado"}
                </h3>
                <p
                  className={`text-sm leading-relaxed ${
                    isConfirm ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {isConfirm
                    ? "Este anexo ha sido registrado en nuestro sistema y será efectivo desde la fecha de firma."
                    : "Este rechazo ha sido registrado en nuestro sistema y se ha notificado a las partes correspondientes."}
                </p>
              </div>
            )}

            {/* Next Steps */}
            {!isPending && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Próximos Pasos
                </h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  {isConfirm ? (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Se ha notificado al trabajador sobre la aceptación</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>El anexo será efectivo desde {data.effectiveDate}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Se actualizarán las condiciones laborales</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Se modificará la jornada de trabajo</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Se ha notificado al trabajador sobre el rechazo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>El contrato mantendrá sus condiciones originales</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Se mantendrá la jornada actual de trabajo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Puede contactar a RRHH para más información</span>
                    </li>
                  </>
                  )}
                </ul>
              </div>
            )}

            {/* Recipient Info */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Destinatario
              </h3>
              <p className="text-sm text-gray-700">
                Estimado/a(s) <strong className="text-gray-900">{data.recipientName}</strong>,
              </p>
              <p className="text-sm text-gray-700 mt-2">
                {isConfirm
                  ? "Se ha procesado la aceptación del anexo de contrato."
                  : "Se ha procesado el rechazo del anexo de contrato."}
              </p>
            </div>

            {/* Status Badge */}
            {!isPending && (
              <div className="mt-6 text-center">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    isConfirm
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      isConfirm ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  {isConfirm ? "Estado: Aceptado" : "Estado: Rechazado"}
                </span>
              </div>
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
                Sistema integral de gestión de contratos y recursos humanos.
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
                    className="text-blue-400 hover:text-blue-300 transition-colors"
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
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                Rechazar Anexo
              </h3>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              Para rechazar este anexo, debe proporcionar una observación
              obligatoria que explique el motivo del rechazo.
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
              <CHEKIOButton
                onClick={() => setShowRejectionModal(false)}
                variant="secondaryBlue"
                className="flex-1"
              >
                Cancelar
              </CHEKIOButton>
              <CHEKIOButton
                onClick={handleRejectObservation}
                disabled={!rejectionObservation.trim()}
                variant="destructive"
                className="flex-1"
              >
                Continuar
              </CHEKIOButton>
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
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                Confirmar Rechazo
              </h3>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 text-sm mb-3">
                ¿Está seguro que desea rechazar este anexo?
              </p>

              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-red-800 mb-2">
                  Observación ingresada:
                </h4>
                <p className="text-red-700 text-sm">{rejectionObservation}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <CHEKIOButton
                onClick={() => setShowRejectionConfirmation(false)}
                variant="secondaryBlue"
                className="flex-1"
              >
                Cancelar
              </CHEKIOButton>
              <CHEKIOButton
                onClick={handleRejectConfirm}
                disabled={isSubmitting}
                variant="destructive"
                className="flex-1"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  "Confirmar Rechazo"
                )}
              </CHEKIOButton>
            </div>
          </div>
        </div>
      )}

      {/* Already Processed Modal */}
      {showProcessedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-yellow-600" />
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Solicitud Ya Procesada
            </h3>

            <p className="text-gray-600 text-sm mb-6">
              Esta solicitud de anexo ya ha sido procesada anteriormente. No se
              pueden realizar cambios adicionales.
            </p>

            <CHEKIOButton
              onClick={() => window.close()}
              variant="primary"
            >
              Cerrar Ventana
            </CHEKIOButton>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContractAnnexPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <CHEKIOLoading size="lg" variant="modern" text="Cargando..." />
        </div>
      }
    >
      <ContractAnnexContent />
    </Suspense>
  );
}

