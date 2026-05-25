"use client";

import { CustomTab } from "@/app/[locale]/_components/custom-tab";
import OrganizationSelector from "@/app/[locale]/mantainers/employees/_components/organization-selector";
import { FilterFormValues } from "@/app/[locale]/operations/shift/_components/shift.context";
import {
  CHEKIOButton,
  CHEKIOHeader,
  CHEKIOInput,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import InConstruction from "@/components/ui/inConstruction";
import { useCookieSession } from "@/context/useCookieSession";
import { useAssistanceManagementDetailTour } from "@/hooks/useAssistanceManagementDetailTour";
import { splitEmployeeSearchQuery } from "@/lib/employee-search-query";
import {
  useGetAssistanceCount,
  useGetBranches,
  useGetJobs,
} from "@/service/mantainer.service";
import { HelpCircle, RefreshCw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { MarkDto } from "../_components/assistance.dto";
import AssistanceAbsent from "./_components/assitance-absent";
import AssistanceCompleted from "./_components/assitance-completed";
import AssistanceIncomplete from "./_components/assitance-incomplete";
import AssistancePendingMarks from "./_components/assitance-pending-marks";
import AssistanceWithoutSchedule from "./_components/assitance-with-schedule";
import TabPendingDelayApproval from "./_components/tab-pending-delay-approval";
import TabPendingExtraApproval from "./_components/tab-pending-extra-approval";

// Enums para valores predefinidos
enum DateFilterType {
  DAY = "day",
  MONTH = "month",
  YEAR = "year",
  RANGE = "range",
}

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY_BLUE = "secondaryBlue",
  SEARCH = "search",
  REFRESH = "refresh",
}

type AssistanceManagementFilterFormValues = FilterFormValues & {
  personType?: "EMPLOYEE" | "STUDENT";
  organizationId?: string;
};

function buildAssistanceManagementDefaultFormValues(): AssistanceManagementFilterFormValues {
  return {
    dateFilterType: "range",
    dateRangeStart: new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toLocaleDateString("en-CA"),
    dateRangeEnd: new Date().toLocaleDateString("en-CA"),
    search: "",
    documentNumber: "",
    employeeQuery: "",
    personType: undefined,
    branchId: undefined,
    jobId: undefined,
  };
}

export default function ManagementPage() {
  const t = useTranslations("assistanceManagement");
  const { companyId } = useCookieSession();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "1");
  const { startTour } = useAssistanceManagementDetailTour(activeTab);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );
  const [filter, setFilter] = useState<any>({
    page: 1,
    pageSize: 10,
    sort: "desc" as "asc" | "desc",
    dateFilterType: "range",
    dateRangeStart: new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toLocaleDateString("en-CA"), // 30 days ago
    dateRangeEnd: new Date().toLocaleDateString("en-CA"), // Today's date
  });
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const { control, handleSubmit, watch, reset, setValue, getValues } =
    useForm<AssistanceManagementFilterFormValues>({
      defaultValues: buildAssistanceManagementDefaultFormValues(),
    });

  const assistanceFilterInitRef = useRef(false);
  const assistanceHadUrlEmployeeRef = useRef(false);

  const { data: jobs } = useGetJobs({
    page: 1,
    pageSize: 500,
    sort: "asc",
  });

  const { data: branches } = useGetBranches({
    page: 1,
    pageSize: 500,
    sort: "asc",
  });

  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [selectedMark, setSelectedMark] = useState<MarkDto | null>(null);
  const selectedPersonType = watch("personType");

  const summaryParams = companyId
    ? (() => {
        const base = { companyId };
        const withPersonType = selectedPersonType
          ? { personType: selectedPersonType }
          : {};
        if (filter.month) {
          return { ...base, ...withPersonType, month: filter.month };
        }
        if (filter.date) {
          return {
            ...base,
            ...withPersonType,
            startDate: filter.date,
            endDate: filter.date,
          };
        }
        if (filter.year) {
          return {
            ...base,
            ...withPersonType,
            startDate: `${filter.year}-01-01`,
            endDate: `${filter.year}-12-31`,
          };
        }
        const startDate =
          filter.startDate ??
          filter.dateRangeStart ??
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
            "en-CA",
          );
        const endDate =
          filter.endDate ??
          filter.dateRangeEnd ??
          new Date().toLocaleDateString("en-CA");
        return { ...base, ...withPersonType, startDate, endDate };
      })()
    : undefined;

  const { data: assistanceCount } = useGetAssistanceCount(summaryParams, {
    enabled: !!companyId,
  });

  useEffect(() => {
    if (
      tabFromUrl &&
      ["1", "2", "3", "4", "5", "6", "7", "8"].includes(tabFromUrl)
    ) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (companyId) {
      setFilter((prev: any) => ({
        ...prev,
        companyId: companyId,
      }));
    }
  }, [companyId]);

  const branchId = watch("branchId");
  const jobId = watch("jobId");

  const handleSubmitFilter = useCallback(
    (data: AssistanceManagementFilterFormValues) => {
      const parts = splitEmployeeSearchQuery(data.employeeQuery ?? "");
      const assistanceFilters = {
        sort: "asc" as "asc" | "desc",
        companyId: companyId,
        search: parts.search,
        documentNumber: parts.documentNumber,
        personType: data.personType || undefined,
        branchId: data.branchId || undefined,
        jobId: data.jobId || undefined,
        ...(data.dateFilterType === "day" &&
          data.dateDay && { date: data.dateDay }),
        ...(data.dateFilterType === "month" &&
          data.dateMonth && { month: data.dateMonth }),
        ...(data.dateFilterType === "year" &&
          data.dateYear && { year: data.dateYear }),
        ...(data.dateFilterType === "range" &&
          data.dateRangeStart &&
          data.dateRangeEnd && {
            startDate: data.dateRangeStart,
            endDate: data.dateRangeEnd,
          }),
      };
      setFilter(assistanceFilters);
    },
    [companyId],
  );

  const searchParamsKey = searchParams.toString();

  useEffect(() => {
    if (!companyId) {
      return;
    }

    const docParam = searchParams.get("documentNumber");
    const searchParam = searchParams.get("search");
    const fromUrl = docParam ?? searchParam;

    if (fromUrl) {
      const employeeQuery = decodeURIComponent(fromUrl.replace(/\+/g, " "));
      const formData: AssistanceManagementFilterFormValues = {
        ...buildAssistanceManagementDefaultFormValues(),
        employeeQuery,
        search: "",
        documentNumber: "",
      };
      reset(formData);
      handleSubmitFilter(formData);
      assistanceFilterInitRef.current = true;
      assistanceHadUrlEmployeeRef.current = true;
      return;
    }

    if (assistanceHadUrlEmployeeRef.current) {
      assistanceHadUrlEmployeeRef.current = false;
      const current = getValues();
      const formData: AssistanceManagementFilterFormValues = {
        ...current,
        employeeQuery: "",
        search: "",
        documentNumber: "",
      };
      reset(formData);
      handleSubmitFilter(formData);
      return;
    }

    if (!assistanceFilterInitRef.current) {
      const formData = buildAssistanceManagementDefaultFormValues();
      reset(formData);
      handleSubmitFilter(formData);
      assistanceFilterInitRef.current = true;
    }
  }, [
    companyId,
    searchParamsKey,
    reset,
    handleSubmitFilter,
    searchParams,
    getValues,
  ]);

  const applyDefaultFilters = () => {
    const defaultFormData = buildAssistanceManagementDefaultFormValues();
    reset(defaultFormData);
    handleSubmitFilter(defaultFormData);
  };

  const handleLevelChange = (value: string, index: number) => {
    const newSelectedValues = [...selectedValues];
    newSelectedValues[index] = value;
    setSelectedValues(newSelectedValues);
  };

  return (
    <>
      <CHEKIOHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[t("breadcrumbs.dashboard"), t("breadcrumbs.assistance")]}
        actions={
          <CHEKIOButton variant="secondaryBlue" onClick={() => startTour()}>
            <HelpCircle className="h-4 w-4" />
            {t("detailTour.startButton")}
          </CHEKIOButton>
        }
      />
      <div
        className="flex gap-2 mt-6 px-2"
        data-tour="assistance-management-tabs"
      >
        {assistanceCount?.incompleteCount! > 0 && (
          <CustomTab
            label={t("assistanceIncomplete")}
            active={activeTab === "1"}
            onClick={() => {
              setActiveTab("1");
            }}
            count={assistanceCount?.incompleteCount!}
            color="#faad14"
            activateAlert
          />
        )}
        {assistanceCount?.withoutScheduleCount! > 0 && (
          <CustomTab
            label={t("assistanceWithoutSchedule")}
            active={activeTab === "2"}
            onClick={() => {
              setActiveTab("2");
            }}
            count={assistanceCount?.withoutScheduleCount!}
            color="#52c41a"
          />
        )}
        {assistanceCount?.absentCount! > 0 && (
          <CustomTab
            label={t("assistanceAbsent")}
            active={activeTab === "3"}
            onClick={() => {
              setActiveTab("3");
            }}
            count={assistanceCount?.absentCount!}
            color="#1890ff"
          />
        )}
        {assistanceCount?.completedCount! > 0 && (
          <CustomTab
            label={t("assistanceCompleted")}
            active={activeTab === "4"}
            onClick={() => {
              setActiveTab("4");
            }}
            count={assistanceCount?.completedCount!}
            color="#52c41a"
          />
        )}
        {assistanceCount?.markPendingCount! > 0 && (
          <CustomTab
            label={t("assistancePending")}
            active={activeTab === "5"}
            onClick={() => {
              setActiveTab("5");
            }}
            count={assistanceCount?.markPendingCount!}
            activateAlert
            color="#faad14"
          />
        )}
        {assistanceCount?.markRejectedCount! > 0 && (
          <CustomTab
            label={t("assistanceRejected")}
            active={activeTab === "6"}
            onClick={() => {
              setActiveTab("6");
            }}
            count={assistanceCount?.markRejectedCount!}
            color="#f5222d"
          />
        )}
        <CustomTab
          label={t("extraPendingApproval")}
          active={activeTab === "7"}
          onClick={() => {
            setActiveTab("7");
          }}
          count={assistanceCount?.extraPendingApprovalCount ?? 0}
          activateAlert={(assistanceCount?.extraPendingApprovalCount ?? 0) > 0}
          color="#faad14"
        />
        <CustomTab
          label={t("delayPendingApproval")}
          active={activeTab === "8"}
          onClick={() => {
            setActiveTab("8");
          }}
          count={assistanceCount?.delayPendingApprovalCount ?? 0}
          activateAlert={(assistanceCount?.delayPendingApprovalCount ?? 0) > 0}
          color="#faad14"
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm mb-6">
        <form onSubmit={handleSubmit(handleSubmitFilter)}>
          <div
            className="border-b border-gray-200 bg-gray-50/50 px-5 py-4"
            data-tour="assistance-management-filters"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por fecha
                </label>
                <Controller
                  name="dateFilterType"
                  control={control}
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value || DateFilterType.RANGE}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setValue("dateDay", undefined);
                        setValue("dateMonth", undefined);
                        setValue("dateYear", undefined);
                        setValue("dateRangeStart", undefined);
                        setValue("dateRangeEnd", undefined);
                      }}
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue placeholder="Tipo de filtro" />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        <CHEKIOSelectItem value={DateFilterType.DAY}>
                          Por día
                        </CHEKIOSelectItem>
                        <CHEKIOSelectItem value={DateFilterType.MONTH}>
                          Por mes
                        </CHEKIOSelectItem>
                        <CHEKIOSelectItem value={DateFilterType.YEAR}>
                          Por año
                        </CHEKIOSelectItem>
                        <CHEKIOSelectItem value={DateFilterType.RANGE}>
                          Por rango
                        </CHEKIOSelectItem>
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>
              {watch("dateFilterType") === DateFilterType.DAY && (
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <Controller
                    name="dateDay"
                    control={control}
                    render={({ field }) => (
                      <CHEKIOInput
                        type="date"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="Seleccionar día"
                      />
                    )}
                  />
                </div>
              )}
              {watch("dateFilterType") === DateFilterType.MONTH && (
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mes
                  </label>
                  <Controller
                    name="dateMonth"
                    control={control}
                    render={({ field }) => (
                      <CHEKIOInput
                        type="month"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="Seleccionar mes"
                      />
                    )}
                  />
                </div>
              )}
              {watch("dateFilterType") === DateFilterType.YEAR && (
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año
                  </label>
                  <Controller
                    name="dateYear"
                    control={control}
                    render={({ field }) => (
                      <CHEKIOInput
                        type="number"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="Ingrese año"
                      />
                    )}
                  />
                </div>
              )}
              {watch("dateFilterType") === DateFilterType.RANGE && (
                <>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha inicio
                    </label>
                    <Controller
                      name="dateRangeStart"
                      control={control}
                      render={({ field }) => (
                        <CHEKIOInput
                          type="date"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Fecha inicio"
                        />
                      )}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha fin
                    </label>
                    <Controller
                      name="dateRangeEnd"
                      control={control}
                      render={({ field }) => (
                        <CHEKIOInput
                          type="date"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Fecha fin"
                        />
                      )}
                    />
                  </div>
                </>
              )}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("filterEmployee")}
                </label>
                <Controller
                  name="employeeQuery"
                  control={control}
                  render={({ field }) => (
                    <CHEKIOInput
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={t("filterEmployeePlaceholder")}
                    />
                  )}
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <Controller
                  name="personType"
                  control={control}
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value || "all"}
                      onValueChange={(value) => {
                        field.onChange(value === "all" ? undefined : value);
                      }}
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue placeholder="Todos" />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        <CHEKIOSelectItem value="all">Todos</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="EMPLOYEE">
                          Empleado
                        </CHEKIOSelectItem>
                        <CHEKIOSelectItem value="STUDENT">
                          Estudiante
                        </CHEKIOSelectItem>
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <Controller
                  name="jobId"
                  control={control}
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value || ""}
                      onValueChange={(value) => {
                        field.onChange(value === "clear" ? undefined : value);
                      }}
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue placeholder="Seleccionar Cargo" />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        {jobId && (
                          <CHEKIOSelectItem value="clear">
                            Limpiar selección
                          </CHEKIOSelectItem>
                        )}
                        {jobs?.data.map((job: any) => (
                          <CHEKIOSelectItem
                            key={job.publicId}
                            value={job.publicId}
                          >
                            {job.name}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sucursal
                </label>
                <Controller
                  name="branchId"
                  control={control}
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value || ""}
                      onValueChange={(value) => {
                        field.onChange(value === "clear" ? undefined : value);
                      }}
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue placeholder="Seleccionar Sucursal" />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        {branchId && (
                          <CHEKIOSelectItem value="clear">
                            Limpiar selección
                          </CHEKIOSelectItem>
                        )}
                        {branches?.data.map((branch: any) => (
                          <CHEKIOSelectItem
                            key={branch.publicId}
                            value={branch.publicId}
                          >
                            {branch.name}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>
              {companyId && (
                <div className="md:col-span-3">
                  <OrganizationSelector
                    control={control}
                    name="organizationId"
                    companyId={companyId}
                    layout="horizontal"
                  />
                </div>
              )}
            </div>
            <div className="md:col-span-12 flex gap-2 justify-end items-end mt-4">
              <CHEKIOButton
                variant={ButtonVariant.REFRESH}
                onClick={applyDefaultFilters}
              >
                <RefreshCw className="h-4 w-4" />
                Limpiar
              </CHEKIOButton>
              <CHEKIOButton variant={ButtonVariant.SEARCH} type="submit">
                <Search className="h-4 w-4" />
                Buscar
              </CHEKIOButton>
            </div>
          </div>
        </form>
      </div>
      {activeTab === "0" && <InConstruction releaseDate="2025-12-15" />}
      {activeTab === "1" && <AssistanceIncomplete filters={filter} />}
      {activeTab === "2" && <AssistanceWithoutSchedule filters={filter} />}
      {activeTab === "3" && (
        <AssistanceAbsent filters={filter} companyId={companyId!} />
      )}
      {activeTab === "4" && <AssistanceCompleted filters={filter} />}
      {activeTab === "5" && <AssistancePendingMarks filters={filter} />}
      {activeTab === "6" && <InConstruction releaseDate="2025-12-15" />}
      {activeTab === "7" && <TabPendingExtraApproval filters={filter} />}
      {activeTab === "8" && <TabPendingDelayApproval filters={filter} />}

      <CHEKIOModal
        isOpen={isMarkModalOpen}
        onClose={() => setIsMarkModalOpen(false)}
        title="Detalles de Marcación"
        size="lg"
      >
        {selectedMark && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4 md:col-span-2">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-3">
                  Información Básica
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha:</span>
                    <span className="font-medium">
                      {selectedMark.timestamp}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hora:</span>
                    <span className="font-medium">
                      {selectedMark.timestamp}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo:</span>
                    <span className="font-medium">{selectedMark.type}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-3">
                  Ubicación
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sucursal:</span>
                    <span className="font-medium">
                      {selectedMark.isAditional ? "Adicional" : "Principal"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dispositivo:</span>
                    <span className="font-medium">{selectedMark.hash}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-3">
                  Estado
                </h4>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {selectedMark.isManual && (
                      <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                        Modificada
                      </span>
                    )}
                    {selectedMark.isManual && (
                      <span className="px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                        Offline
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedMark.isManual && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">
                    Modificaciones
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Usuario:</span>
                      <span className="font-medium">
                        {selectedMark.isManual}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fecha:</span>
                      <span className="font-medium">
                        {selectedMark.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-600 mb-3">
                  Verificación Digital
                </h4>
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    {/* <QRCode value={selectedMark.hash} size={180} /> */}
                  </div>
                  <div className="w-full">
                    <p className="text-xs text-gray-500 mb-1">
                      Hash de verificación:
                    </p>
                    <div className="bg-white p-2 rounded font-mono text-xs break-all">
                      {selectedMark.hash}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CHEKIOModal>
    </>
  );
}
