"use client";

import { CHEKIOButton, CHEKIOLoading, CHEKIOModal } from "@/components";
import { useGetTimeBankTransactions } from "@/service/mantainer.service";
import {
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { DateTime } from "luxon";
import { TimeBankType } from "../../_components/time-bank.dto";

interface TimeBankAgreementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreement: any;
}

export default function TimeBankAgreementDetailModal({
  isOpen,
  onClose,
  agreement,
}: TimeBankAgreementDetailModalProps) {
  const { data: transactionsData, isLoading } = useGetTimeBankTransactions(
    { timeBankId: agreement?.publicId ?? "", pageSize: 20 },
    { enabled: isOpen && !!agreement?.publicId },
  );

  const transactions = transactionsData?.data ?? [];
  const bankType = agreement?.type ?? agreement?.timeBankType ?? "";
  const isEconomic =
    bankType === TimeBankType.ECONOMIC_HOURS || bankType === "ECONOMIC_HOURS";
  const totalHours =
    (agreement?.availableHours ?? 0) + (agreement?.usedHours ?? 0);

  const getTypeBadge = (type: string) => {
    const isCredit = type === "ADD" || type === "CREDIT";
    const isDebit = type === "SUBTRACT" || type === "DEBIT";
    if (isCredit)
      return (
        <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
          Crédito
        </span>
      );
    if (isDebit)
      return (
        <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
          Débito
        </span>
      );
    return (
      <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
        {type}
      </span>
    );
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Pacto"
      size="lg"
    >
      <div className="space-y-5">
        {/* Resumen del pacto */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {totalHours.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Totales</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {(agreement?.availableHours ?? 0).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">
                {(agreement?.usedHours ?? 0).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Utilizadas</div>
            </div>
            <div className="text-center">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isEconomic
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {isEconomic ? "Hora Económica" : "Días de Descanso"}
              </span>
              <div className="mt-1 text-xs text-gray-500">Tipo</div>
            </div>
          </div>

          {agreement?.startDate && agreement?.endDate && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              Vigencia:{" "}
              {DateTime.fromISO(agreement.startDate).toFormat("dd/MM/yyyy")} –{" "}
              {DateTime.fromISO(agreement.endDate).toFormat("dd/MM/yyyy")}
            </div>
          )}
        </div>

        {/* Últimas transacciones */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Clock className="h-4 w-4" />
            Últimas transacciones de este pacto
          </h4>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <CHEKIOLoading size="md" variant="modern" text="Cargando..." />
            </div>
          ) : transactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              No hay transacciones registradas para este pacto.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {transactions.map((tx: any, idx: number) => {
                const isCredit = tx.type === "ADD" || tx.type === "CREDIT";
                const isDebit =
                  tx.type === "SUBTRACT" || tx.type === "DEBIT";
                const amount = Math.abs(tx.amount ?? 0);

                return (
                  <div
                    key={tx.publicId ?? idx}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {isCredit ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : isDebit ? (
                        <TrendingDown className="h-4 w-4 text-orange-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-600" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {tx.description ||
                            tx.integrationCode ||
                            "Sin descripción"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {DateTime.fromISO(tx.createdAt).toFormat(
                            "dd/MM/yyyy HH:mm",
                          )}{" "}
                          · {tx.requestedByName || tx.requestedBy || "Sistema"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getTypeBadge(tx.type)}
                      <span
                        className={`font-semibold ${
                          isCredit
                            ? "text-green-600"
                            : isDebit
                              ? "text-orange-600"
                              : "text-blue-600"
                        }`}
                      >
                        {isCredit ? "+" : isDebit ? "−" : ""}
                        {amount.toFixed(1)} hrs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t pt-3">
          <CHEKIOButton variant="secondaryBlue" onClick={onClose}>
            Cerrar
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
}
