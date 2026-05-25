"use client";

import { CustomTab } from "@/app/[locale]/_components/custom-tab";
import OrganizationSelector from "@/app/[locale]/mantainers/employees/_components/organization-selector";
import { FilterFormValues } from "@/app/[locale]/operations/shift/_components/shift.context";
import {
  CHEKIOButton,
  CHEKIOHeader,
  CHEKIOInput,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { splitEmployeeSearchQuery } from "@/lib/employee-search-query";
import {
  useGetAssistanceCount,
  useGetBranches,
  useGetEstablishments,
} from "@/service/mantainer.service";
import { RefreshCw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import StudentAbsent from "./_components/student-absent";
import StudentCompleted from "./_components/student-completed";
import StudentIncomplete from "./_components/student-incomplete";

// Enums
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

type StudentAssistanceFilterFormValues = FilterFormValues & {
  organizationId?: string;
  establishmentId?: string;
};

function buildDefaultFormValues(): StudentAssistanceFilterFormValues {
  return {
    dateFilterType: "range",
    dateRangeStart: new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toLocaleDateString("en-CA"),
    dateRangeEnd: new Date().toLocaleDateString("en-CA"),
    search: "",
    documentNumber: "",
    employeeQuery: "",
    branchId: undefined,
    establishmentId: undefined,
  };
}

export default function ManagementStudentPage() {
  const t = useTranslations("assistanceManagementStudent");
  const tNav = useTranslations("navbar");
  const { companyId } = useCookieSession();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "1");
  const [filter, setFilter] = useState<any>({
    page: 1,
    pageSize: 10,
    sort: "desc" as "asc" | "desc",
    dateFilterType: "range",
    dateRangeStart: new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toLocaleDateString("en-CA"),
    dateRangeEnd: new Date().toLocaleDateString("en-CA"),
    personType: "STUDENT",
  });

  const { control, handleSubmit, watch, reset, setValue, getValues } =
    useForm<StudentAssistanceFilterFormValues>({
      defaultValues: buildDefaultFormValues(),
    });

  const assistanceFilterInitRef = useRef(false);
  const assistanceHadUrlEmployeeRef = useRef(false);

  const { data: branches } = useGetBranches({
    page: 1,
    pageSize: 500,
    sort: "asc",
  });

  const { data: establishmentsData } = useGetEstablishments({
    page: 1,
    pageSize: 500,
    sort: "asc",
  });

  const branchId = watch("branchId");
  const establishmentId = watch("establishmentId");

  const summaryParams = companyId
    ? (() => {
        const base = { companyId, personType: "STUDENT" as const };
        const withEstablishment =
          filter.establishmentId
            ? { establishmentId: filter.establishmentId }
            : {};
        if (filter.month) {
          return { ...base, ...withEstablishment, month: filter.month };
        }
        if (filter.date) {
          return {
            ...base,
            ...withEstablishment,
            startDate: filter.date,
            endDate: filter.date,
          };
        }
        if (filter.year) {
          return {
            ...base,
            ...withEstablishment,
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
        return { ...base, ...withEstablishment, startDate, endDate };
      })()
    : undefined;

  const { data: assistanceCount } = useGetAssistanceCount(summaryParams, {
    enabled: !!companyId,
  });

  useEffect(() => {
    if (tabFromUrl && ["1", "2", "3"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (companyId) {
      setFilter((prev: any) => ({
        ...prev,
        companyId,
      }));
    }
  }, [companyId]);

  const handleSubmitFilter = useCallback(
    (data: StudentAssistanceFilterFormValues) => {
      const parts = splitEmployeeSearchQuery(data.employeeQuery ?? "");
      const assistanceFilters = {
        sort: "asc" as "asc" | "desc",
        companyId,
        personType: "STUDENT",
        search: parts.search,
        documentNumber: parts.documentNumber,
        branchId: data.branchId || undefined,
        establishmentId: data.establishmentId || undefined,
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
    if (!companyId) return;

    const docParam = searchParams.get("documentNumber");
    const searchParam = searchParams.get("search");
    const fromUrl = docParam ?? searchParam;

    if (fromUrl) {
      const employeeQuery = decodeURIComponent(fromUrl.replace(/\+/g, " "));
      const formData: StudentAssistanceFilterFormValues = {
        ...buildDefaultFormValues(),
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
      const formData: StudentAssistanceFilterFormValues = {
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
      const formData = buildDefaultFormValues();
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
    const defaultFormData = buildDefaultFormValues();
    reset(defaultFormData);
    handleSubmitFilter(defaultFormData);
  };

  return (
    <>
      <CHEKIOHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[
          t("breadcrumbs.dashboard"),
          t("breadcrumbs.assistance"),
        ]}
      />

      {/* Tabs */}
      <div className="flex gap-2 mt-6 px-2">
        <CustomTab
          label={t("assistanceIncomplete")}
          active={activeTab === "1"}
          onClick={() => setActiveTab("1")}
          count={assistanceCount?.incompleteCount ?? 0}
          color="#faad14"
          activateAlert={(assistanceCount?.incompleteCount ?? 0) > 0}
        />
        <CustomTab
          label={t("assistanceAbsent")}
          active={activeTab === "2"}
          onClick={() => setActiveTab("2")}
          count={assistanceCount?.absentCount ?? 0}
          color="#1890ff"
          activateAlert={false}
        />
        <CustomTab
          label={t("assistanceCompleted")}
          active={activeTab === "3"}
          onClick={() => setActiveTab("3")}
          count={assistanceCount?.completedCount ?? 0}
          color="#52c41a"
          activateAlert={false}
        />
      </div>

      {/* Filters */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm mb-6">
        <form onSubmit={handleSubmit(handleSubmitFilter)}>
          <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Date filter type */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("filterDateType")}
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
                          {t("filterDateDay")}
                        </CHEKIOSelectItem>
                        <CHEKIOSelectItem value={DateFilterType.MONTH}>
                          {t("filterDateMonth")}
                        </CHEKIOSelectItem>
                        <CHEKIOSelectItem value={DateFilterType.YEAR}>
                          {t("filterDateYear")}
                        </CHEKIOSelectItem>
                        <CHEKIOSelectItem value={DateFilterType.RANGE}>
                          Por rango
                        </CHEKIOSelectItem>
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>

              {/* Day picker */}
              {watch("dateFilterType") === DateFilterType.DAY && (
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("filterDateDay")}
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

              {/* Month picker */}
              {watch("dateFilterType") === DateFilterType.MONTH && (
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("filterDateMonth")}
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

              {/* Year picker */}
              {watch("dateFilterType") === DateFilterType.YEAR && (
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("filterDateYear")}
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

              {/* Range pickers */}
              {watch("dateFilterType") === DateFilterType.RANGE && (
                <>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("filterDateStart")}
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
                      {t("filterDateEnd")}
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

              {/* Student search */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("filterStudent")}
                </label>
                <Controller
                  name="employeeQuery"
                  control={control}
                  render={({ field }) => (
                    <CHEKIOInput
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={t("filterStudentPlaceholder")}
                    />
                  )}
                />
              </div>

              {/* Branch */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("filterBranch")}
                </label>
                <Controller
                  name="branchId"
                  control={control}
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value || ""}
                      onValueChange={(value) =>
                        field.onChange(value === "clear" ? undefined : value)
                      }
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

              {/* Establishment */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("filterEstablishment")}
                </label>
                <Controller
                  name="establishmentId"
                  control={control}
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value || ""}
                      onValueChange={(value) =>
                        field.onChange(value === "clear" ? undefined : value)
                      }
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue placeholder="Seleccionar Establecimiento" />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        {establishmentId && (
                          <CHEKIOSelectItem value="clear">
                            Limpiar selección
                          </CHEKIOSelectItem>
                        )}
                        {establishmentsData?.data.map((est: any) => (
                          <CHEKIOSelectItem
                            key={est.publicId}
                            value={est.publicId}
                          >
                            {est.name}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>

              {/* Organization selector */}
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
                type="button"
              >
                <RefreshCw className="h-4 w-4" />
                {t("clearFilters")}
              </CHEKIOButton>
              <CHEKIOButton variant={ButtonVariant.SEARCH} type="submit">
                <Search className="h-4 w-4" />
                {t("search")}
              </CHEKIOButton>
            </div>
          </div>
        </form>
      </div>

      {/* Tab content */}
      {activeTab === "1" && <StudentIncomplete filters={filter} />}
      {activeTab === "2" && (
        <StudentAbsent filters={filter} companyId={companyId!} />
      )}
      {activeTab === "3" && <StudentCompleted filters={filter} />}
    </>
  );
}
