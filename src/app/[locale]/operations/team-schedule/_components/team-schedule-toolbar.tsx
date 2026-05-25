"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { useGetBranches } from "@/service/mantainer.service";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

const MONTH_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

/** Valor interno del Select para “todas las sucursales” (Radix no deja `value` vacío estable). */
const ALL_BRANCHES_VALUE = "__ALL_BRANCHES__";

export interface TeamScheduleFilters {
  search: string;
  documentNumber: string;
  branchId: string | undefined;
  personType?: "EMPLOYEE" | "STUDENT" | "ALL";
}

const ALL_PERSON_TYPE_VALUE = "__ALL_PERSON_TYPE__";

interface TeamScheduleToolbarProps {
  currentDate: Date;
  filters: TeamScheduleFilters;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTodayMonth: () => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onFiltersChange: (filters: TeamScheduleFilters) => void;
  onClearSelection?: () => void;
  selectionBar?: React.ReactNode;
}

export function TeamScheduleToolbar({
  currentDate,
  filters,
  onPrevMonth,
  onNextMonth,
  onTodayMonth,
  onMonthChange,
  onYearChange,
  onFiltersChange,
  onClearSelection,
  selectionBar,
}: TeamScheduleToolbarProps) {
  const t = useTranslations("operations.teamSchedule");
  const { getTemplateUser, companyId } = useCookieSession();
  const templateUser = getTemplateUser();

  const meses = useMemo(() => MONTH_KEYS.map((key) => t(`months.${key}`)), [t]);

  const { data: branches } = useGetBranches(
    {
      page: 1,
      pageSize: 1000,
      sort: "asc",
      companyId: companyId || undefined,
    },
    { enabled: !!companyId },
  );

  const { handleSubmit, control, reset } = useForm<TeamScheduleFilters>({
    defaultValues: filters,
  });

  const generateYearOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      years.push({ value: year, label: year.toString() });
    }
    return years;
  };

  const generateMonthOptions = () =>
    meses.map((month, index) => ({ value: index, label: month }));

  const onSubmit = (data: TeamScheduleFilters) => {
    onFiltersChange({
      ...data,
      branchId: data.branchId || undefined,
      personType: data.personType || "EMPLOYEE",
    });
  };

  const handleClear = () => {
    reset({
      search: "",
      documentNumber: "",
      branchId: undefined,
      personType: "EMPLOYEE",
    });
    onFiltersChange({
      search: "",
      documentNumber: "",
      branchId: undefined,
      personType: "EMPLOYEE",
    });
    onClearSelection?.();
  };

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/[0.03]">
      {/* Date navigation row */}
      <div className="flex flex-col gap-3 border-b border-gray-100 bg-gradient-to-r from-slate-50/95 via-white to-blue-50/40 px-4 py-3.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:mr-1">
          <CalendarDays
            className="h-4 w-4 shrink-0"
            style={{ color: templateUser.primary }}
          />
          <span>{t("navigation.period")}</span>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center overflow-hidden rounded-lg border border-gray-200/90 bg-white shadow-sm">
            <button
              type="button"
              onClick={onPrevMonth}
              className="rounded-l-lg p-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onTodayMonth}
              className="border-x border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              {t("navigation.today")}
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              className="rounded-r-lg p-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <CHEKIOSelect
              value={currentDate.getMonth().toString()}
              onValueChange={(value: string) => onMonthChange(parseInt(value))}
            >
              <CHEKIOSelectTrigger className="w-[130px]">
                <CHEKIOSelectValue placeholder={t("navigation.month")} />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                {generateMonthOptions().map((month) => (
                  <CHEKIOSelectItem
                    key={month.value}
                    value={month.value.toString()}
                  >
                    {month.label}
                  </CHEKIOSelectItem>
                ))}
              </CHEKIOSelectContent>
            </CHEKIOSelect>

            <CHEKIOSelect
              value={currentDate.getFullYear().toString()}
              onValueChange={(value: string) => onYearChange(parseInt(value))}
            >
              <CHEKIOSelectTrigger className="w-[100px]">
                <CHEKIOSelectValue placeholder={t("navigation.year")} />
              </CHEKIOSelectTrigger>
              <CHEKIOSelectContent>
                {generateYearOptions().map((year) => (
                  <CHEKIOSelectItem
                    key={year.value}
                    value={year.value.toString()}
                  >
                    {year.label}
                  </CHEKIOSelectItem>
                ))}
              </CHEKIOSelectContent>
            </CHEKIOSelect>
          </div>
        </div>
      </div>

      {/* Filters row */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-wrap items-end gap-x-3 gap-y-3 border-t border-gray-100 bg-slate-50/20 px-4 py-4"
      >
        <div className="flex min-w-[180px] flex-col gap-1">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <Search
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: `${templateUser.primary}99` }}
            />
            {t("filters.search")}
          </label>
          <Controller
            name="search"
            control={control}
            render={({ field }) => (
              <CHEKIOInput
                {...field}
                placeholder={t("filters.placeholderSearch")}
              />
            )}
          />
        </div>

        <div className="flex min-w-[160px] flex-col gap-1">
          <label className="text-xs font-medium text-gray-700">
            {t("filters.documentNumber")}
          </label>
          <Controller
            name="documentNumber"
            control={control}
            render={({ field }) => (
              <CHEKIOInput
                {...field}
                placeholder={t("filters.placeholderDocument")}
              />
            )}
          />
        </div>

        <div className="flex min-w-[160px] flex-col gap-1">
          <label className="text-xs font-medium text-gray-700">Tipo</label>
          <Controller
            name="personType"
            control={control}
            render={({ field }) => {
              const selectValue =
                !field.value || field.value === "ALL"
                  ? ALL_PERSON_TYPE_VALUE
                  : field.value;
              return (
                <CHEKIOSelect
                  value={selectValue}
                  onValueChange={(value: string) => {
                    field.onChange(
                      value === ALL_PERSON_TYPE_VALUE ? "ALL" : value,
                    );
                  }}
                >
                  <CHEKIOSelectTrigger className="min-w-[160px] max-w-[220px]">
                    <CHEKIOSelectValue placeholder="Tipo de persona" />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    <CHEKIOSelectItem value="EMPLOYEE">
                      Trabajador
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem value="STUDENT">
                      Estudiante
                    </CHEKIOSelectItem>
                    <CHEKIOSelectItem value={ALL_PERSON_TYPE_VALUE}>
                      Todos
                    </CHEKIOSelectItem>
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              );
            }}
          />
        </div>

        <div className="flex min-w-[160px] flex-col gap-1">
          <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
            <Building2
              className="h-3.5 w-3.5"
              style={{ color: `${templateUser.primary}99` }}
            />
            {t("filters.branch")}
          </label>
          <Controller
            name="branchId"
            control={control}
            render={({ field }) => {
              const selectValue =
                field.value && field.value !== ALL_BRANCHES_VALUE
                  ? field.value
                  : ALL_BRANCHES_VALUE;
              return (
                <CHEKIOSelect
                  value={selectValue}
                  onValueChange={(value: string) => {
                    field.onChange(
                      value === ALL_BRANCHES_VALUE ? undefined : value,
                    );
                  }}
                >
                  <CHEKIOSelectTrigger className="min-w-[200px] max-w-[260px]">
                    <CHEKIOSelectValue
                      placeholder={t("filters.selectBranch")}
                    />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    <CHEKIOSelectItem value={ALL_BRANCHES_VALUE}>
                      {t("filters.allBranches")}
                    </CHEKIOSelectItem>
                    {(branches?.data ?? []).map(
                      (branch: { publicId: string; name: string }) => (
                        <CHEKIOSelectItem
                          key={branch.publicId}
                          value={branch.publicId}
                        >
                          {branch.name}
                        </CHEKIOSelectItem>
                      ),
                    )}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              );
            }}
          />
        </div>

        <div className="flex items-end gap-2">
          <CHEKIOButton variant="refresh" type="button" onClick={handleClear}>
            <X className="h-4 w-4" />
            {t("filters.buttons.clear")}
          </CHEKIOButton>
          <CHEKIOButton variant="search" type="submit">
            <Search className="h-4 w-4" />
            {t("filters.buttons.search")}
          </CHEKIOButton>
        </div>

        {selectionBar && (
          <>
            <div className="h-8 w-px bg-gray-200 self-center" />
            <div className="flex items-end gap-2">{selectionBar}</div>
          </>
        )}
      </form>
    </div>
  );
}
