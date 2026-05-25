"use client";

import axiosInstance from "@/utils/axios";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";

interface ConsentsSectionProps {
  employeeId: string;
}

interface ConsentRecord {
  purposeCode: string;
  decision: "ACCEPTED" | "DECLINED" | "PENDING";
  acceptedAt?: string;
  version?: string;
}

export default function ConsentsSection({ employeeId }: ConsentsSectionProps) {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return;

    setIsLoading(true);
    axiosInstance
      .get(`/client/consents/employee/${employeeId}`)
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setConsents(data);
        } else if (data?.consents) {
          setConsents(data.consents);
        } else {
          setConsents([]);
        }
      })
      .catch(() => setConsents([]))
      .finally(() => setIsLoading(false));
  }, [employeeId]);

  const getStatusIcon = (decision: string) => {
    if (decision === "ACCEPTED") {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    } else if (decision === "DECLINED") {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusLabel = (decision: string) => {
    if (decision === "ACCEPTED") return "Aceptado";
    if (decision === "DECLINED") return "Rechazado";
    return "Pendiente";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        Cargando consentimientos...
      </div>
    );
  }

  if (consents.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        Sin registros de consentimientos
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Consentimientos</h3>
      <div className="space-y-3">
        {consents.map((consent) => (
          <div
            key={consent.purposeCode}
            className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white"
          >
            {getStatusIcon(consent.decision)}
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">
                {consent.purposeCode}
              </p>
              {consent.acceptedAt && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {DateTime.fromISO(consent.acceptedAt).toFormat(
                    "dd/MM/yyyy HH:mm",
                  )}
                </p>
              )}
            </div>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                consent.decision === "ACCEPTED"
                  ? "bg-green-100 text-green-700"
                  : consent.decision === "DECLINED"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {getStatusLabel(consent.decision)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
