"use client";

import {
  CHEKIOButton,
  CHEKIOLoading,
  CHEKIOStatCard,
  CHEKIOTab,
  CHEKIOTabs,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import {
  useGetTimeBankAccumulatedHours,
  useGetTimeBankByEmployeeId,
  useGetTimeBankTransactions,
} from "@/service/mantainer.service";
import { TimeBankTransactionType } from "@/app/[locale]/mantainers/time-bank/_components/time-bank.dto";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  History,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import TimeBankConfigModal from "../_components/time-bank-config-modal";
import DebitCreditModal from "./_components/debit-credit-modal";
import EmployeeProfile from "./_components/employee-profile";
import TimeBankAgreements from "./_components/time-bank-agreements";
import TimeBankHistory from "./_components/time-bank-history";

enum TabValue {
  PROFILE = "profile",
  AGREEMENTS = "agreements",
  HISTORY = "history",
}

export default function EmployeeTimeBankDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { canRead, canCreate, canUpdate } = useCookieSession();
  const t = useTranslations("mantainers.timeBank");

  const [activeTab, setActiveTab] = useState<TabValue>(TabValue.PROFILE);
  const [isDebitCreditModalOpen, setIsDebitCreditModalOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const employeeId = params.employeeId as string;

  const {
    data: timeBank,
    isLoading,
    error,
    refetch,
  } = useGetTimeBankByEmployeeId(employeeId);

  // Horas acumuladas por pacto — para KPI cards correctos
  const { data: accumulatedData } = useGetTimeBankAccumulatedHours(employeeId);

  // Historial combinado de TODOS los pactos del empleado
  const { data: transactionsData, isLoading: historyLoading } =
    useGetTimeBankTransactions(
      { employeeId, pageSize: 200 },
      { enabled: !!employeeId },
    );

  // KPI: sumar solo pactos activos (today entre startDate y endDate)
  const kpi = useMemo(() => {
    const now = DateTime.now().startOf("day");
    const activePactos = (accumulatedData?.data ?? []).filter((p) => {
      const start = DateTime.fromISO(p.startDate.toString()).startOf("day");
      const end = DateTime.fromISO(p.endDate.toString()).startOf("day");
      return now >= start && now <= end;
    });
    const availableHours = activePactos.reduce(
      (s, p) => s + (p.availableHours ?? 0),
      0,
    );
    const usedHours = activePactos.reduce((s, p) => s + (p.usedHours ?? 0), 0);
    // Tipo: si todos los activos son del mismo tipo, mostrar ese; si no, "Mixto"
    const types = [...new Set(activePactos.map((p) => p.type))];
    const bankType =
      types.length === 1 ? types[0] : (timeBank?.type ?? "ECONOMIC_HOURS");
    return {
      availableHours,
      usedHours,
      total: availableHours + usedHours,
      bankType,
    };
  }, [accumulatedData?.data, timeBank?.type]);

  // Calcular balance corriente acumulativo sobre todos los pactos
  const history = useMemo(() => {
    if (!transactionsData?.data?.length) return [];

    const sorted = [...transactionsData.data].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    let runningBalance = 0;
    const withBalance = sorted.map((tx) => {
      const isCredit = tx.type === TimeBankTransactionType.ADD;
      const isDebit = tx.type === TimeBankTransactionType.SUBTRACT;

      const amount = Math.abs(tx.amount ?? 0);
      if (isCredit) runningBalance += amount;
      else if (isDebit) runningBalance -= amount;
      else runningBalance += tx.amount ?? 0; // ADJUSTMENT / EXPIRATION: signo del propio amount

      return {
        date: tx.createdAt,
        type: isCredit ? "CREDIT" : isDebit ? "DEBIT" : tx.type,
        hours: amount,
        balance: runningBalance,
        description: tx.integrationCode ?? "Transacción",
        reference: tx.integrationCode ?? "",
        userName: tx.requestedByName ?? tx.requestedBy ?? "Sistema",
      };
    });

    return withBalance.reverse(); // más reciente primero
  }, [transactionsData?.data]);

  if (!canRead(OrganizationPermissionCode.BANK_MAINTENANCE)) {
    return (
      <div className="mx-auto p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="text-center">
            <p className="text-lg font-medium text-red-600">Acceso Denegado</p>
            <p className="mt-2 text-red-500">
              No tienes permisos para ver la información del banco de horas.
            </p>
            <CHEKIOButton
              variant="secondaryBlue"
              onClick={() => router.back()}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("buttons.cancel")}
            </CHEKIOButton>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto p-6">
        <CHEKIOLoading size="lg" variant="modern" text={t("table.loading")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="text-center">
            <p className="text-lg font-medium text-red-600">
              Error al cargar la información
            </p>
            <p className="mt-2 text-red-500">
              {error.message ||
                "No se pudo cargar la información del banco de horas del empleado."}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <CHEKIOButton
                variant="secondary"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </CHEKIOButton>
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
                {t("buttons.cancel")}
              </CHEKIOButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empleado sin banco: ofrecer creación
  if (!timeBank) {
    return (
      <>
        <div className="mx-auto p-6">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
            <div className="text-center">
              <Clock className="mx-auto mb-3 h-12 w-12 text-yellow-400" />
              <p className="text-lg font-medium text-yellow-700">
                Sin banco de horas
              </p>
              <p className="mt-2 text-sm text-yellow-600">
                Este empleado no tiene un banco de horas registrado.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                {canCreate(OrganizationPermissionCode.BANK_MAINTENANCE) && (
                  <CHEKIOButton
                    variant="primary"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Crear Banco de Horas
                  </CHEKIOButton>
                )}
                <CHEKIOButton
                  variant="secondaryBlue"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </CHEKIOButton>
              </div>
            </div>
          </div>
        </div>

        <TimeBankConfigModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            refetch();
          }}
          preselectedEmployeePublicId={employeeId}
        />
      </>
    );
  }

  const employeeDisplayName =
    timeBank.employeeName || `Empleado ${timeBank.employeeId}`;

  // totalHours ahora viene de kpi (suma de pactos activos)

  const handleDebitCredit = (agreement: any) => {
    setSelectedAgreement(agreement);
    setIsDebitCreditModalOpen(true);
  };

  const handleModalClose = () => {
    setIsDebitCreditModalOpen(false);
    setSelectedAgreement(null);
  };

  return (
    <>
      <div className="mx-auto space-y-6 p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CHEKIOStatCard
            title="Total Acumulado"
            value={`${kpi.total.toFixed(1)} hrs`}
            variant="blue"
            icon={Clock}
            subtitle="pactos activos"
          />
          <CHEKIOStatCard
            title="Disponibles"
            value={`${kpi.availableHours.toFixed(1)} hrs`}
            variant="green"
            icon={TrendingUp}
            subtitle="horas disponibles"
          />
          <CHEKIOStatCard
            title="Utilizadas"
            value={`${kpi.usedHours.toFixed(1)} hrs`}
            variant="orange"
            icon={TrendingDown}
            subtitle="horas utilizadas"
          />
          <CHEKIOStatCard
            title={
              timeBank.hoursPerDay
                ? `Tipo de Banco (${timeBank.hoursPerDay} hrs/día)`
                : "Tipo de Banco"
            }
            value={
              kpi.bankType === "ECONOMIC_HOURS"
                ? "Hora Económica"
                : "Días de Descanso"
            }
            variant="blue"
            icon={kpi.bankType === "ECONOMIC_HOURS" ? DollarSign : Calendar}
          />
        </div>

        {/* Tabs */}
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <CHEKIOTabs>
            <CHEKIOTab
              active={activeTab === TabValue.PROFILE}
              onClick={() => setActiveTab(TabValue.PROFILE)}
            >
              <User className="h-4 w-4" />
              Perfil
            </CHEKIOTab>
            <CHEKIOTab
              active={activeTab === TabValue.AGREEMENTS}
              onClick={() => setActiveTab(TabValue.AGREEMENTS)}
            >
              <FileText className="h-4 w-4" />
              Pactos
            </CHEKIOTab>
            <CHEKIOTab
              active={activeTab === TabValue.HISTORY}
              onClick={() => setActiveTab(TabValue.HISTORY)}
            >
              <History className="h-4 w-4" />
              Historial
            </CHEKIOTab>
          </CHEKIOTabs>

          <div className="mt-6 space-y-6">
            {activeTab === TabValue.PROFILE && (
              <EmployeeProfile
                employee={{
                  id: timeBank.employeeId,
                  name: timeBank.employeeName,
                  email: timeBank.employeeEmail,
                }}
                timeBank={timeBank}
                onDebitCredit={
                  canUpdate(OrganizationPermissionCode.BANK_MAINTENANCE)
                    ? handleDebitCredit
                    : undefined
                }
                onViewHistory={() => setActiveTab(TabValue.HISTORY)}
              />
            )}

            {activeTab === TabValue.AGREEMENTS && (
              <TimeBankAgreements
                employeeId={employeeId}
                employeeName={timeBank?.employeeName}
                onDebitCredit={handleDebitCredit}
              />
            )}

            {activeTab === TabValue.HISTORY && (
              <TimeBankHistory
                employeeId={employeeId}
                precomputedHistory={history}
                isLoading={historyLoading}
              />
            )}
          </div>
        </div>
      </div>

      {selectedAgreement && (
        <DebitCreditModal
          isOpen={isDebitCreditModalOpen}
          onClose={handleModalClose}
          agreement={selectedAgreement}
          employee={{
            id: timeBank.employeeId,
            name: timeBank.employeeName,
            email: timeBank.employeeEmail,
          }}
        />
      )}
    </>
  );
}
