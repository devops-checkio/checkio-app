"use client";

import {
  CHEKIOButton,
  CHEKIOTab,
  CHEKIOTabs,
} from "@/components";
import { Badge } from "@/components/ui/badge";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useOperationsShiftTour } from "@/hooks/useOperationsShiftTour";
import { useGetEmployeesShiftCount } from "@/service/mantainer.service";
import { HelpCircle, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import AccessNotGranted from "../../_components/acces-not-granted";
import ShiftModalInfo from "./_components/shift-modal-info";
import ShiftSelectorModal from "./_components/shift-selector-modal";
import { useShift } from "./_components/shift.context";
import { TabShiftActive } from "./_components/tab-shift-active";
import { TabShiftEmployeeWithout } from "./_components/tab-shift-employee-without";
import { TabShiftFuture } from "./_components/tab-shift-future";
import { TabShiftPast } from "./_components/tab-shift-past";

function ShiftContent() {
  const t = useTranslations("operations.shift");
  const { companyId, canCreate } = useCookieSession();
  const {
    activeTab,
    setActiveTab,
    isModalShiftBaseOpen,
    setIsModalShiftBaseOpen,
  } = useShift();
  const { startTour } = useOperationsShiftTour();
  const [isModalInfoOpen, setIsModalInfoOpen] = useState(false);
  const { data } = useGetEmployeesShiftCount({
    companyId: companyId ?? undefined,
    personType: "EMPLOYEE",
  });

  const tabNumber =
    data?.withOutShiftCount && data?.withOutShiftCount > 0 ? "2" : "1";

  if (!companyId) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-600">
          Seleccione una empresa en el menú superior para ver la asignación de
          turnos.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-4">
          <div
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            data-tour="shift-operations-tabs"
          >
            <div className="flex-1">
              <CHEKIOTabs>
            {(data?.withOutShiftCount || 0) > 0 && (
              <CHEKIOTab
                active={activeTab === "1"}
                onClick={() => setActiveTab("1")}
                className={
                  (data?.withOutShiftCount || 0) > 0
                    ? "bg-yellow-50 animate-pulse"
                    : ""
                }
              >
                Empleados sin Turno
                {(data?.withOutShiftCount || 0) > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300"
                  >
                    {data?.withOutShiftCount || 0}
                  </Badge>
                )}
              </CHEKIOTab>
            )}
            <CHEKIOTab
              active={activeTab === tabNumber}
              onClick={() => setActiveTab(tabNumber)}
            >
              Empleados con Turno
              {(data?.withShiftCount || 0) > 0 && (
                <Badge
                  variant="outline"
                  className="ml-2 bg-green-100 text-green-800 border-green-300"
                >
                  {data?.withShiftCount || 0}
                </Badge>
              )}
            </CHEKIOTab>
            <CHEKIOTab
              active={activeTab === "3"}
              onClick={() => setActiveTab("3")}
            >
              Empleados con Turno Futuro
              {(data?.withShiftFutureCount || 0) > 0 && (
                <Badge
                  variant="outline"
                  className="ml-2 bg-blue-100 text-blue-800 border-blue-300"
                >
                  {data?.withShiftFutureCount || 0}
                </Badge>
              )}
            </CHEKIOTab>
            <CHEKIOTab
              active={activeTab === "4"}
              onClick={() => setActiveTab("4")}
            >
              Empleados con Turno Pasado
              {(data?.withShiftPastCount || 0) > 0 && (
                <Badge
                  variant="outline"
                  className="ml-2 bg-green-100 text-green-800 border-green-300"
                >
                  {data?.withShiftPastCount || 0}
                </Badge>
              )}
            </CHEKIOTab>
          </CHEKIOTabs>
            </div>
            <div className="flex flex-row gap-2 shrink-0">
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={startTour}
                aria-label={t("tour.startButton")}
              >
                <HelpCircle className="h-4 w-4" />
                {t("tour.startButton")}
              </CHEKIOButton>
              {canCreate(
                OrganizationPermissionCode.ASIGMENT_SHIFT_OPERATIONS
              ) && (
                <CHEKIOButton
                  variant="primary"
                  onClick={() => setIsModalInfoOpen(true)}
                  data-tour="shift-operations-info-btn"
                >
                  <Info className="h-4 w-4" />
                  Información del Sistema
                </CHEKIOButton>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        data-tour="shift-operations-tab-content"
      >
        <div className="py-4">
        {activeTab === "1" && (data?.withOutShiftCount || 0) > 0 && (
          <TabShiftEmployeeWithout />
        )}
        {activeTab === tabNumber && <TabShiftActive />}
        {activeTab === "3" && <TabShiftFuture />}
        {activeTab === "4" && <TabShiftPast />}
        </div>
      </div>

      <ShiftModalInfo
        isOpen={isModalInfoOpen}
        onClose={() => setIsModalInfoOpen(false)}
      />
      {isModalShiftBaseOpen && (
        <ShiftSelectorModal
          isOpen={isModalShiftBaseOpen}
          onClose={() => setIsModalShiftBaseOpen(false)}
        />
      )}
    </>
  );
}

export default function ShiftPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.ASIGMENT_SHIFT_OPERATIONS
      }
    >
      <ShiftContent />
    </AccessNotGranted>
  );
}
