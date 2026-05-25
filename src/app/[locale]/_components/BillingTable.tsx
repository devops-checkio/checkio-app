"use client";

import {
  CHEKIOButton,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { Card } from "@/components/ui/card";
import { CheckCircle, CreditCard, Download, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function BillingTable() {
  const t = useTranslations("homeAdmin");

  // Datos de facturación con estados de pago
  const billingData = [
    {
      id: "INV-2024-001",
      date: "2024-01-15",
      amount: 2000,
      concept: "Servicios Enero 2024",
      status: "paid",
      dueDate: "2024-01-30",
    },
    {
      id: "INV-2024-002",
      date: "2024-02-15",
      amount: 2050,
      concept: "Servicios Febrero 2024",
      status: "paid",
      dueDate: "2024-02-28",
    },
    {
      id: "INV-2024-003",
      date: "2024-03-15",
      amount: 2150,
      concept: "Servicios Marzo 2024",
      status: "paid",
      dueDate: "2024-03-30",
    },
    {
      id: "INV-2024-004",
      date: "2024-04-15",
      amount: 2250,
      concept: "Servicios Abril 2024",
      status: "pending",
      dueDate: "2024-04-30",
    },
    {
      id: "INV-2024-005",
      date: "2024-05-15",
      amount: 2270,
      concept: "Servicios Mayo 2024",
      status: "overdue",
      dueDate: "2024-05-30",
    },
  ];

  return (
    <Card className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          {t("billingHistory")}
        </h3>
      </div>

      {/* Tabla de facturación */}
      <div className="overflow-x-auto">
        <CHEKIOTable>
          <CHEKIOTableHeader>
            <tr>
              <CHEKIOTableHead>Factura</CHEKIOTableHead>
              <CHEKIOTableHead>Fecha</CHEKIOTableHead>
              <CHEKIOTableHead>Concepto</CHEKIOTableHead>
              <CHEKIOTableHead className="text-right">Monto</CHEKIOTableHead>
              <CHEKIOTableHead className="text-center">Estado</CHEKIOTableHead>
              <CHEKIOTableHead className="text-center">
                Acciones
              </CHEKIOTableHead>
            </tr>
          </CHEKIOTableHeader>
          <CHEKIOTableBody>
            {billingData.map((bill, index) => (
              <CHEKIOTableRow key={index} index={index}>
                <CHEKIOTableCell>
                  <span className="font-mono text-sm text-gray-800">
                    {bill.id}
                  </span>
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <span className="text-sm text-gray-600">
                    {new Date(bill.date).toLocaleDateString("es-ES")}
                  </span>
                </CHEKIOTableCell>
                <CHEKIOTableCell>
                  <span className="text-sm text-gray-800">{bill.concept}</span>
                </CHEKIOTableCell>
                <CHEKIOTableCell className="text-right">
                  <span className="font-semibold text-gray-800">
                    $
                    {bill.amount.toLocaleString("es-CL", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 10,
                    })}
                  </span>
                </CHEKIOTableCell>
                <CHEKIOTableCell className="text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      bill.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : bill.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {bill.status === "paid" ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Pagado
                      </>
                    ) : bill.status === "pending" ? (
                      <>
                        <XCircle className="w-3 h-3" />
                        Pendiente
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Vencido
                      </>
                    )}
                  </span>
                </CHEKIOTableCell>
                <CHEKIOTableCell className="text-center">
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() => alert(`Descargar factura ${bill.id}`)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs"
                  >
                    <Download className="w-3 h-3" />
                    Descargar
                  </CHEKIOButton>
                </CHEKIOTableCell>
              </CHEKIOTableRow>
            ))}
          </CHEKIOTableBody>
        </CHEKIOTable>
      </div>

      {/* Resumen de facturación */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">
              {billingData.filter((b) => b.status === "paid").length}
            </div>
            <div className="text-sm text-gray-600">Facturas Pagadas</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">
              {billingData.filter((b) => b.status === "pending").length}
            </div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">
              {billingData.filter((b) => b.status === "overdue").length}
            </div>
            <div className="text-sm text-gray-600">Vencidas</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
