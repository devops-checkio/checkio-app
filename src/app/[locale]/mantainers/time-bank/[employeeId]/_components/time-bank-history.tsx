"use client";

import {
  CHEKIOButton,
  CHEKIOLoading,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { useGetTimeBankTransactions } from "@/service/mantainer.service";
import {
  TimeBankTransactionType,
} from "../../_components/time-bank.dto";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  History,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

enum TransactionTypeFilter {
  ALL = "all",
  CREDIT = "CREDIT",
  DEBIT = "DEBIT",
  ADJUSTMENT = "ADJUSTMENT",
  EXPIRATION = "EXPIRATION",
}

interface HistoryEntry {
  date: string;
  type: string;
  hours: number;
  balance: number;
  description: string;
  reference: string;
  userName: string;
}

interface TimeBankHistoryProps {
  /** publicId del empleado – usado para paginación real contra la API (todos los pactos) */
  employeeId: string;
  /** Historial pre-calculado desde page.tsx (con balance corriente) */
  precomputedHistory?: HistoryEntry[];
  isLoading: boolean;
}

export default function TimeBankHistory({
  employeeId,
  precomputedHistory = [],
  isLoading: externalLoading,
}: TimeBankHistoryProps) {
  const t = useTranslations("mantainers.timeBank");

  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>(
    TransactionTypeFilter.ALL,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Mapear TransactionTypeFilter (UI) a TimeBankTransactionType (API)
  const mapFilterToApiType = (
    filter: TransactionTypeFilter,
  ): TimeBankTransactionType | undefined => {
    if (filter === TransactionTypeFilter.ALL) return undefined;
    if (filter === TransactionTypeFilter.CREDIT) return TimeBankTransactionType.ADD;
    if (filter === TransactionTypeFilter.DEBIT) return TimeBankTransactionType.SUBTRACT;
    if (filter === TransactionTypeFilter.ADJUSTMENT) return TimeBankTransactionType.ADJUSTMENT;
    // EXPIRATION no existe en la API; no filtrar por tipo
    return undefined;
  };

  // Paginación real contra el API usando employeeId (todos los pactos combinados)
  const { data: pagedData, isLoading: pageLoading } =
    useGetTimeBankTransactions(
      {
        employeeId,
        page,
        pageSize,
        type: mapFilterToApiType(typeFilter),
      },
      { enabled: !!employeeId && page > 1 },
    );

  // Para la primera página usamos el historial pre-calculado (con balance corriente)
  // Para páginas siguientes usamos la respuesta paginada
  const isLoading = externalLoading || (page > 1 && pageLoading);

  const pagination = pagedData?.pagination ?? {
    current: 1,
    totalPages: Math.ceil(precomputedHistory.length / pageSize) || 1,
    totalCount: precomputedHistory.length,
    pageSize,
  };

  // Para página 1: filtrar y paginar localmente sobre precomputedHistory
  const displayedHistory: HistoryEntry[] = useMemo(() => {
    if (page > 1 && pagedData?.data) {
      return pagedData.data.map((tx: any) => {
        const isCredit = tx.type === "ADD" || tx.type === "CREDIT";
        const isDebit = tx.type === "SUBTRACT" || tx.type === "DEBIT";
        return {
          date: tx.createdAt,
          type: isCredit ? "CREDIT" : isDebit ? "DEBIT" : tx.type,
          hours: Math.abs(tx.amount ?? 0),
          balance: 0, // sin balance corriente en páginas adicionales
          description: tx.description || tx.integrationCode || "Transacción",
          reference: tx.integrationCode ?? "",
          userName: tx.requestedByName || tx.requestedBy || "Sistema",
        };
      });
    }

    const filtered =
      typeFilter === TransactionTypeFilter.ALL
        ? precomputedHistory
        : precomputedHistory.filter((h) => h.type === typeFilter);

    return filtered.slice(0, pageSize);
  }, [page, pagedData, typeFilter, precomputedHistory, pageSize]);

  const handleTypeFilterChange = useCallback((val: string) => {
    setTypeFilter(val as TransactionTypeFilter);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  // Summary cards (sobre el historial completo pre-calculado)
  const summary = useMemo(
    () => ({
      totalCredits: precomputedHistory
        .filter((h) => h.type === "CREDIT")
        .reduce((s, h) => s + h.hours, 0),
      totalDebits: precomputedHistory
        .filter((h) => h.type === "DEBIT")
        .reduce((s, h) => s + h.hours, 0),
      totalAdjustments: precomputedHistory
        .filter((h) => h.type === "ADJUSTMENT")
        .reduce((s, h) => s + h.hours, 0),
      totalExpirations: precomputedHistory
        .filter((h) => h.type === "EXPIRATION")
        .reduce((s, h) => s + h.hours, 0),
    }),
    [precomputedHistory],
  );

  const getTransactionTypeBadge = (type: string) => {
    const config: Record<string, { label: string; color: string }> = {
      CREDIT: {
        label: t("history.types.credit"),
        color: "bg-green-100 text-green-800",
      },
      DEBIT: {
        label: t("history.types.debit"),
        color: "bg-orange-100 text-orange-800",
      },
      ADJUSTMENT: {
        label: t("history.types.adjustment"),
        color: "bg-blue-100 text-blue-800",
      },
      EXPIRATION: {
        label: t("history.types.expiration"),
        color: "bg-red-100 text-red-800",
      },
    };
    const item = config[type] ?? config.ADJUSTMENT;
    return (
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${item.color}`}
      >
        {item.label}
      </span>
    );
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "CREDIT":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "DEBIT":
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      case "ADJUSTMENT":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "EXPIRATION":
        return <Calendar className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-gray-700">
              {t("history.summary.totalCredits")}
            </span>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            +{summary.totalCredits.toFixed(1)}
          </div>
          <p className="text-xs text-gray-600">
            {t("history.summary.hoursAdded")}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-gray-700">
              {t("history.summary.totalDebits")}
            </span>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-600">
            -{summary.totalDebits.toFixed(1)}
          </div>
          <p className="text-xs text-gray-600">
            {t("history.summary.hoursConsumed")}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-gray-700">
              {t("history.summary.adjustments")}
            </span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {summary.totalAdjustments.toFixed(1)}
          </div>
          <p className="text-xs text-gray-600">
            {t("history.summary.hoursAdjusted")}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-gray-700">
              {t("history.summary.expirations")}
            </span>
            <Calendar className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">
            -{summary.totalExpirations.toFixed(1)}
          </div>
          <p className="text-xs text-gray-600">
            {t("history.summary.hoursExpired")}
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <History className="h-5 w-5" />
              {t("history.title")}
            </h3>
            <p className="text-sm text-gray-500">{t("history.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <CHEKIOSelect
              value={typeFilter}
              onValueChange={handleTypeFilterChange}
            >
              <CHEKIOSelectTrigger className="w-[180px]">
                <CHEKIOSelectValue
                  placeholder={t("history.filter.placeholder")}
                />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                <CHEKIOSelectItem value={TransactionTypeFilter.ALL}>
                  {t("history.filter.all")}
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={TransactionTypeFilter.CREDIT}>
                  {t("history.filter.creditsOnly")}
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={TransactionTypeFilter.DEBIT}>
                  {t("history.filter.debitsOnly")}
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={TransactionTypeFilter.ADJUSTMENT}>
                  {t("history.filter.adjustmentsOnly")}
                </CHEKIOSelectItem>
                <CHEKIOSelectItem value={TransactionTypeFilter.EXPIRATION}>
                  {t("history.filter.expirationsOnly")}
                </CHEKIOSelectItem>
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <CHEKIOLoading
                size="lg"
                variant="modern"
                text={t("history.table.loading")}
              />
            </div>
          ) : displayedHistory.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-medium text-gray-600">
                {t("history.table.noData")}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {t("history.table.noDataDescription")}
              </p>
            </div>
          ) : (
            <>
              <CHEKIOTable>
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>
                      {t("history.table.headers.date")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("history.table.headers.type")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("history.table.headers.hours")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("history.table.headers.balance")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("history.table.headers.reference")}
                    </CHEKIOTableHead>
                    <CHEKIOTableHead>
                      {t("history.table.headers.user")}
                    </CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {displayedHistory.map((row, index) => (
                    <CHEKIOTableRow
                      key={`${row.date}-${index}`}
                      index={index}
                    >
                      <CHEKIOTableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {DateTime.fromISO(row.date).toFormat("dd/MM/yyyy")}
                          </div>
                          <div className="text-gray-500">
                            {DateTime.fromISO(row.date).toFormat("HH:mm")}
                          </div>
                        </div>
                      </CHEKIOTableCell>

                      <CHEKIOTableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(row.type)}
                          {getTransactionTypeBadge(row.type)}
                        </div>
                      </CHEKIOTableCell>

                      <CHEKIOTableCell>
                        <div
                          className={`text-center font-medium ${
                            row.type === "CREDIT"
                              ? "text-green-600"
                              : row.type === "DEBIT"
                                ? "text-orange-600"
                                : "text-blue-600"
                          }`}
                        >
                          {row.type === "CREDIT"
                            ? "+"
                            : row.type === "DEBIT"
                              ? "−"
                              : ""}
                          {row.hours.toFixed(1)}{" "}
                          {t("history.table.hoursUnit")}
                        </div>
                      </CHEKIOTableCell>

                      <CHEKIOTableCell>
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            {row.balance.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t("history.table.hoursUnit")}
                          </div>
                        </div>
                      </CHEKIOTableCell>

                      <CHEKIOTableCell>
                        <div className="max-w-xs">
                          <div className="font-medium text-gray-900">
                            {row.description}
                          </div>
                          {row.reference && (
                            <div className="text-sm text-gray-500">
                              {t("history.table.reference")}: {row.reference}
                            </div>
                          )}
                        </div>
                      </CHEKIOTableCell>

                      <CHEKIOTableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {row.userName || t("table.systemUser")}
                          </span>
                        </div>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>

              {/* Pagination */}
              <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {pagination.totalCount} transacciones en total
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="whitespace-nowrap text-sm font-medium text-gray-700">
                      Por página:
                    </label>
                    <CHEKIOSelect
                      value={pageSize.toString()}
                      onValueChange={(v) =>
                        handlePageSizeChange(parseInt(v, 10))
                      }
                    >
                      <CHEKIOSelectTrigger className="w-24">
                        <CHEKIOSelectValue />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        <CHEKIOSelectItem value="10">10</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="20">20</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="50">50</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="100">100</CHEKIOSelectItem>
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </CHEKIOButton>
                  <div className="border bg-white px-4 py-2 text-sm text-gray-700">
                    Página {pagination.current} de {pagination.totalPages}
                  </div>
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </CHEKIOButton>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <History className="h-5 w-5" />
          {t("history.help.title")}
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-3 font-medium text-gray-900">
              {t("history.help.manualOps")}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {t("history.types.credit")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("history.help.creditDescription")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {t("history.types.debit")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("history.help.debitDescription")}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-medium text-gray-900">
              {t("history.help.autoOps")}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {t("history.types.expiration")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("history.help.expirationDescription")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {t("history.help.system")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("history.help.systemDescription")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
