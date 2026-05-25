"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
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
import SystemMultiSelect from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import { useCreateHoliday, useGetBranches } from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { HolidayApiResponse, HolidayAssignmentItem } from "./holidays.dto";

interface ModalMassHolidaysProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLoadingText?: string;
  onSuccess: () => void;
}

const ModalMassHolidays = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText,
  buttonLoadingText,
  onSuccess,
}: ModalMassHolidaysProps) => {
  const t = useTranslations("mantainers.holidays");
  const tMassive = useTranslations("mantainers.holidays.massive");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const modalTitle = title || tMassive("title");
  const modalMessage = message || tMassive("message");
  const modalButtonText = buttonText || t("buttons.importButton");
  const modalButtonLoadingText = buttonLoadingText || t("buttons.importing");
  const [isPending, setIsPending] = useState(false);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [assignmentItems, setAssignmentItems] = useState<
    HolidayAssignmentItem[]
  >([]);
  const createHoliday = useCreateHoliday();

  const { control } = useForm();

  const { data: branches } = useGetBranches({
    page: 1,
    pageSize: 1000,
  });

  const branchesOptions =
    branches?.data.map((branch) => ({
      value: branch.publicId,
      label: branch.name,
    })) || [];

  const handleSelectAll = () => {
    const allValues = branchesOptions.map((option) => option.value);
    setSelectedBranches(allValues);
  };

  // Generar lista de años (desde 2020 hasta 2030)
  const years = Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) =>
    year.toString()
  );

  const fetchHolidays = async () => {
    if (!selectedYear) {
      toast({
        title: t("toast.yearRequired.title"),
        description: t("toast.yearRequired.description"),
        variant: "destructive",
      });
      return;
    }

    setIsLoadingHolidays(true);
    setAssignmentItems([]);

    try {
      const response = await fetch(
        `https://api.boostr.cl/holidays/${selectedYear}.json`
      );
      const data: HolidayApiResponse = await response.json();

      if (data.status === "success") {
        setAssignmentItems(
          data.data.map((holiday, index) => ({
            id: `holiday-${index}`,
            date: holiday.date,
            title: holiday.title,
            type: holiday.type,
            inalienable: holiday.inalienable,
            status: "pending",
          }))
        );
        toast({
          title: t("toast.loadSuccess.title"),
          description: t("toast.loadSuccess.description", { count: data.data.length, year: selectedYear }),
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: t("toast.loadError.title"),
        description: t("toast.loadError.description"),
        variant: "destructive",
      });
    } finally {
      setIsLoadingHolidays(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Resetear el año al año actual cuando se abre el modal
      setSelectedYear(new Date().getFullYear().toString());
      setAssignmentItems([]);
      setSelectedBranches([]);
    }
  }, [isOpen]);

  const renderStatusBadge = (status: string, error?: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {tMassive("table.status.pending")}
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            <Loader2 className="w-3 h-3 animate-spin" />
            {tMassive("table.status.processing")}
          </span>
        );
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            {tMassive("table.status.completed")}
          </span>
        );
      case "error":
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3" />
              {tMassive("table.status.error")}
            </span>
            {error && (
              <span className="text-xs text-red-500 mt-1">{error}</span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const processAssignments = async () => {
    setIsPending(true);

    for (let i = 0; i < assignmentItems.length; i++) {
      const holiday = assignmentItems[i];

      setAssignmentItems((prev) =>
        prev.map((h, index) =>
          index === i ? { ...h, status: "processing" } : h
        )
      );

      try {
        await createHoliday.mutateAsync({
          name: holiday.title,
          date: new Date(holiday.date),
          isWaivable: !holiday.inalienable,
          BranchHoliday: selectedBranches,
        });

        setAssignmentItems((prev) =>
          prev.map((h, index) =>
            index === i ? { ...h, status: "success" } : h
          )
        );
      } catch (error: any) {
        setAssignmentItems((prev) =>
          prev.map((h, index) =>
            index === i
              ? {
                  ...h,
                  status: "error",
                  error:
                    error?.response?.data?.message ||
                    t("toast.error.description"),
                }
              : h
          )
        );
      }
    }

    const successCount = assignmentItems.filter(
      (holiday) => holiday.status === "success"
    ).length;
    const errorCount = assignmentItems.filter(
      (holiday) => holiday.status === "error"
    ).length;

    if (errorCount === 0) {
      toast({
        title: t("toast.importSuccess.title"),
        description: t("toast.importSuccess.description"),
      });
    } else {
      toast({
        title: t("toast.importWithErrors.title"),
        description: t("toast.importWithErrors.description", { success: successCount, errors: errorCount }),
        variant: "destructive",
      });
    }

    queryClient.invalidateQueries({
      queryKey: ["GetHolidays"],
    });

    setIsPending(false);
    onSuccess();
  };

  return (
    <CHEKIOModal isOpen={isOpen} onClose={onClose} title={modalTitle} size="5xl">
      <div className="space-y-6 py-4">
        <p className="text-gray-700 flex items-center gap-3 text-lg">
          <AlertCircle className="text-orange-500 h-5 w-5" />
          {modalMessage}
        </p>

        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              {tMassive("selectYear")}
            </label>
            <div className="flex items-center gap-2">
              <CHEKIOSelect
                value={selectedYear}
                onValueChange={setSelectedYear}
              >
                <CHEKIOSelectTrigger className="w-[150px]">
                  <CHEKIOSelectValue placeholder={tMassive("yearPlaceholder")} />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  {years.map((year) => (
                    <CHEKIOSelectItem key={year} value={year}>
                      {year}
                    </CHEKIOSelectItem>
                  ))}
                </CHEKIOSelectContent>
              </CHEKIOSelect>
              <CHEKIOButton
                type="button"
                variant="search"
                onClick={fetchHolidays}
                disabled={isLoadingHolidays || !selectedYear}
              >
                {isLoadingHolidays ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("buttons.loading")}
                  </>
                ) : (
                  t("buttons.loadHolidays")
                )}
              </CHEKIOButton>
            </div>
          </div>
        </div>

        {assignmentItems.length === 0 && !isLoadingHolidays && (
          <div className="text-center py-8 text-gray-500">
            <p>
              {tMassive("noHolidaysMessage")}
            </p>
          </div>
        )}

        {isLoadingHolidays && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-600 mt-2">{tMassive("loadingHolidays")}</p>
          </div>
        )}

        {assignmentItems.length > 0 && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-600 h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">
                    {tMassive("branchAssignment.title")}
                  </h4>
                  <p className="text-sm text-blue-800">
                    {selectedBranches.length === 0 ? (
                      <>
                        <strong>{tMassive("branchAssignment.noBranches.label")}</strong> {tMassive("branchAssignment.noBranches.description")}
                      </>
                    ) : (
                      <>
                        <strong>
                          {tMassive("branchAssignment.withBranches.label", { count: selectedBranches.length })}
                        </strong>{" "}
                        {tMassive("branchAssignment.withBranches.description")}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <SystemMultiSelect
                control={control}
                label={t("upsert.fields.branches")}
                attribute="branches"
                options={branchesOptions}
                placeholder={t("upsert.placeholders.branches")}
                showSelectAll={true}
                onSelectAll={handleSelectAll}
                searchable={true}
                showClear={true}
                maxItems={3}
                showError={false}
                disabled={isPending || isLoadingHolidays}
                onChange={(values) => {
                  setSelectedBranches(values);
                }}
                tooltip={tMassive("branchAssignment.tooltip")}
              />
            </div>

            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <CHEKIOTable>
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>{tMassive("table.headers.date")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tMassive("table.headers.name")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tMassive("table.headers.type")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tMassive("table.headers.isWaivable")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tMassive("table.headers.status")}</CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {assignmentItems.map((item, index) => (
                    <CHEKIOTableRow key={item.id} index={index}>
                      <CHEKIOTableCell className="font-medium">
                        {DateTime.fromFormat(item.date, "yyyy-MM-dd")
                          .setLocale("es")
                          .toLocaleString({
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="font-medium">
                        {item.title}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            item.type === "Civil"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {item.type}
                        </span>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            item.inalienable
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {item.inalienable ? t("yes") : t("no")}
                        </span>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {renderStatusBadge(item.status, item.error)}
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>
          </>
        )}

        <div className="flex justify-end gap-4">
          <CHEKIOButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
            {t("buttons.cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            type="button"
            variant="primary"
            disabled={isPending || assignmentItems.length === 0}
            onClick={processAssignments}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {modalButtonLoadingText}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {modalButtonText}
              </>
            )}
          </CHEKIOButton>
        </div>
      </div>
    </CHEKIOModal>
  );
};

export default ModalMassHolidays;
