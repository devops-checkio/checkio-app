"use client";

import {
  AbsenceTypeResponseDto,
} from "@/app/[locale]/mantainers/absence-types/_components/absence-type.dto";
import {
  TimeBankType,
} from "@/app/[locale]/mantainers/time-bank/_components/time-bank.dto";
import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOLoading,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
  CHEKIOTextarea,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { useToast } from "@/hooks/use-toast";
import {
  useCheckFreedayOverlap,
  useCreateFreedayRequest,
} from "@/service/freeday.service";
import { useGetAbsenceTypes, useGetTimeBanks } from "@/service/mantainer.service";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  FreedayOverlapConflictType,
  FreedayRequestCreateDto,
  FreedayRequestResponseDto,
} from "./freeday.dto";

/** HTML date inputs and APIs must use calendar dates (yyyy-MM-dd), not shifted by local TZ vs UTC. */
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const formatDateForInput = (value: string | Date | undefined): string => {
  if (!value) return "";
  if (typeof value === "string") {
    const head = value.slice(0, 10);
    if (DATE_ONLY_REGEX.test(head)) return head;
    return value.split("T")[0] ?? "";
  }
  return DateTime.fromJSDate(value, { zone: "utc" }).toISODate() ?? "";
};

/** Coerces form value to yyyy-MM-dd for the API (no Date("yyyy-MM-dd") → Luxon local shift). */
function toApiDateOnlyString(value: string | Date | undefined): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string") {
    const head = value.slice(0, 10);
    return DATE_ONLY_REGEX.test(head) ? head : "";
  }
  return DateTime.fromJSDate(value, { zone: "utc" }).toISODate() ?? "";
}

function parseFormCalendarDate(value: string | undefined): DateTime | null {
  if (!value || !DATE_ONLY_REGEX.test(value)) return null;
  return DateTime.fromISO(value, { setZone: true });
}

interface FreedayRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  request?: FreedayRequestResponseDto;
  mode?: "create" | "view" | "edit";
}

interface FreedayRequestFormData {
  absenceTypeId: string;
  reason?: string;
  /** yyyy-MM-dd from <input type="date"> — never store `new Date("yyyy-MM-dd")` (UTC/local shift). */
  startDate: string;
  endDate: string;
  observation?: string;
  withSalary: boolean;
  isTimeBankCharge: boolean;
}

const FreedayRequestModal = ({
  isOpen,
  onClose,
  onSuccess,
  request,
  mode = "create",
}: FreedayRequestModalProps) => {
  const t = useTranslations("operations.requests.freeday.modal");
  const { toast } = useToast();
  const { profile } = useCookieSession();
  const createFreedayRequest = useCreateFreedayRequest();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FreedayRequestFormData>({
    defaultValues: {
      absenceTypeId: "",
      reason: "",
      startDate: "",
      endDate: "",
      observation: "",
      withSalary: false,
      isTimeBankCharge: false,
    },
  });

  const selectedAbsenceTypeId = watch("absenceTypeId");
  const isTimeBankCharge = watch("isTimeBankCharge");
  const watchedStartDate = watch("startDate");
  const watchedEndDate = watch("endDate");

  const { startIso, endIso } = useMemo(() => {
    const s = toApiDateOnlyString(watchedStartDate);
    const e = toApiDateOnlyString(watchedEndDate);
    if (!s || !e) {
      return {
        startIso: undefined as string | undefined,
        endIso: undefined as string | undefined,
      };
    }
    return { startIso: s, endIso: e };
  }, [watchedStartDate, watchedEndDate]);

  const { data: absenceTypesData, isLoading: isLoadingAbsenceTypes } =
    useGetAbsenceTypes({
      page: 1,
      pageSize: 200,
      sort: "asc",
      isEmployeeRequestable: true,
    });

  const employeePublicId = profile?.user?.employeeId;
  const employeeName = profile?.user?.name;

  const overlapQueryEnabled = isOpen && (mode === "create" || mode === "edit");
  const excludeOverlapPublicId =
    mode === "edit" && request?.publicId ? request.publicId : undefined;

  const { data: overlapData, isFetching: overlapFetching } =
    useCheckFreedayOverlap(
      employeePublicId,
      startIso,
      endIso,
      overlapQueryEnabled,
      excludeOverlapPublicId,
    );

  const conflictTypeLabel = (type: FreedayOverlapConflictType): string => {
    switch (type) {
      case FreedayOverlapConflictType.FREEDAY:
        return t("overlap.typeFREEDAY");
      case FreedayOverlapConflictType.ABSENCE:
        return t("overlap.typeABSENCE");
      case FreedayOverlapConflictType.HOURLY_PERMISSION:
        return t("overlap.typeHOURLY_PERMISSION");
      default:
        return type;
    }
  };

  const { data: employeeTimeBanks } = useGetTimeBanks({
    page: 1,
    pageSize: 10,
    sort: "desc",
    employeeId: employeePublicId,
    type: TimeBankType.REST_DAYS,
    status: "active",
  });

  const activeRestDaysBank = employeeTimeBanks?.data?.find(
    (tb) => tb.type === TimeBankType.REST_DAYS,
  );

  const selectedAbsenceType = useMemo(() => {
    if (!selectedAbsenceTypeId || !absenceTypesData?.data) return null;
    return absenceTypesData.data.find(
      (at: AbsenceTypeResponseDto) => at.publicId === selectedAbsenceTypeId,
    ) ?? null;
  }, [selectedAbsenceTypeId, absenceTypesData]);

  useEffect(() => {
    if (!selectedAbsenceType?.isTimeBankCompensable) {
      setValue("isTimeBankCharge", false);
    }
  }, [selectedAbsenceType, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (request && (mode === "view" || mode === "edit")) {
        reset({
          absenceTypeId: request.absenceTypeId || "",
          reason: request.reason || "",
          startDate: formatDateForInput(request.startDate),
          endDate: formatDateForInput(request.endDate),
          observation: request.observation || "",
          withSalary: request.withSalary,
          isTimeBankCharge: request.isTimeBankCharge || false,
        });
      } else {
        reset({
          absenceTypeId: "",
          reason: "",
          startDate: "",
          endDate: "",
          observation: "",
          withSalary: false,
          isTimeBankCharge: false,
        });
      }
    }
  }, [isOpen, request, mode, reset]);

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const onSubmit: SubmitHandler<FreedayRequestFormData> = async (data) => {
    if (mode === "view") return;

    if (!employeePublicId) {
      toast({
        title: t("toast.error.title"),
        description: t("validation.noEmployeeId"),
        variant: "destructive",
      });
      return;
    }

    const formattedStartDate = toApiDateOnlyString(data.startDate);
    const formattedEndDate = toApiDateOnlyString(data.endDate);

    if (!formattedStartDate || !formattedEndDate) {
      toast({
        title: t("toast.error.title"),
        description: t("validation.invalidDates"),
        variant: "destructive",
      });
      return;
    }

    try {
      const requestData: FreedayRequestCreateDto = {
        employeeId: employeePublicId,
        absenceTypeId: data.absenceTypeId || undefined,
        reason: data.reason || undefined,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        observation: data.observation || undefined,
        withSalary: data.withSalary,
        isTimeBankCharge: data.isTimeBankCharge,
      };

      await createFreedayRequest.mutateAsync(requestData);

      toast({
        title: t("toast.success.title"),
        description: t("toast.success.description"),
      });

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      toast({
        title: t("toast.error.title"),
        description:
          error?.response?.data?.message || t("toast.error.description"),
        variant: "destructive",
      });
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "create":
        return t("title.create");
      case "view":
        return t("title.view");
      case "edit":
        return t("title.edit");
      default:
        return t("title.create");
    }
  };

  const isReadOnly = mode === "view";

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      size="4xl"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 py-4"
      >
        {/* Employee info (auto-filled from session) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("fields.employee")}
          </label>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
              {employeeName?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {employeeName || "—"}
            </span>
          </div>
        </div>

        {/* Absence Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("fields.absenceType")} <span className="text-red-500">*</span>
          </label>
          {isLoadingAbsenceTypes ? (
            <div className="flex items-center gap-2 py-2">
              <CHEKIOLoading size="sm" variant="modern" />
              <span className="text-sm text-gray-500">
                {t("loadingAbsenceTypes")}
              </span>
            </div>
          ) : (
            <Controller
              name="absenceTypeId"
              control={control}
              rules={{
                required: t("validation.absenceTypeRequired"),
              }}
              render={({ field }) => (
                <CHEKIOSelect
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  disabled={isReadOnly}
                >
                  <CHEKIOSelectTrigger
                    className={errors.absenceTypeId ? "border-red-500" : ""}
                  >
                    <CHEKIOSelectValue
                      placeholder={t("fields.absenceTypePlaceholder")}
                    />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    {(absenceTypesData?.data || []).map(
                      (absenceType: AbsenceTypeResponseDto) => (
                        <CHEKIOSelectItem
                          key={absenceType.publicId}
                          value={absenceType.publicId}
                        >
                          {absenceType.name}
                        </CHEKIOSelectItem>
                      ),
                    )}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              )}
            />
          )}
          {errors.absenceTypeId && (
            <p className="text-red-500 text-sm mt-1">
              {errors.absenceTypeId.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("fields.startDate")} <span className="text-red-500">*</span>
            </label>
            <Controller
              name="startDate"
              control={control}
              rules={{
                required: t("validation.startDateRequired"),
                validate: (value) => {
                  if (!value) return true;
                  const selectedDate = parseFormCalendarDate(String(value));
                  if (!selectedDate?.isValid) {
                    return t("validation.invalidDates");
                  }
                  const today = DateTime.now().startOf("day");
                  if (selectedDate.startOf("day") <= today) {
                    return t("validation.startDateFuture");
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <div>
                  <CHEKIOInput
                    type="date"
                    value={formatDateForInput(field.value)}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                    }}
                    disabled={isReadOnly}
                    min={DateTime.now()
                      .plus({ days: 1 })
                      .toFormat("yyyy-MM-dd")}
                    className={errors.startDate ? "border-red-500" : ""}
                  />
                  {errors.startDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("fields.endDate")} <span className="text-red-500">*</span>
            </label>
            <Controller
              name="endDate"
              control={control}
              rules={{
                required: t("validation.endDateRequired"),
                validate: (value) => {
                  if (!value) return true;
                  const selectedEndDate = parseFormCalendarDate(String(value));
                  if (!selectedEndDate?.isValid) {
                    return t("validation.invalidDates");
                  }
                  const startDateVal = watch("startDate");

                  if (startDateVal) {
                    const selectedStartDate = parseFormCalendarDate(
                      String(startDateVal),
                    );
                    if (
                      selectedStartDate?.isValid &&
                      selectedEndDate.startOf("day") <
                        selectedStartDate.startOf("day")
                    ) {
                      return t("validation.endDateAfterStart");
                    }
                  }

                  const today = DateTime.now().startOf("day");
                  if (selectedEndDate.startOf("day") <= today) {
                    return t("validation.endDateFuture");
                  }

                  return true;
                },
              }}
              render={({ field }) => {
                const startDateVal = watch("startDate");
                const minDate = startDateVal
                  ? toApiDateOnlyString(startDateVal) ||
                    DateTime.now().plus({ days: 1 }).toFormat("yyyy-MM-dd")
                  : DateTime.now().plus({ days: 1 }).toFormat("yyyy-MM-dd");

                return (
                  <div>
                    <CHEKIOInput
                      type="date"
                      value={formatDateForInput(field.value)}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                      }}
                      disabled={isReadOnly}
                      min={minDate}
                      className={errors.endDate ? "border-red-500" : ""}
                    />
                    {errors.endDate && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.endDate.message}
                      </p>
                    )}
                  </div>
                );
              }}
            />
          </div>
        </div>

        {/* With Salary */}
        <div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="withSalary"
              checked={watch("withSalary")}
              onChange={(e) => setValue("withSalary", e.target.checked)}
              disabled={isReadOnly}
              className="rounded"
            />
            <label
              htmlFor="withSalary"
              className="text-sm font-medium text-gray-700"
            >
              {t("fields.withSalary")}
            </label>
          </div>
        </div>

        {/* Time Bank Charge (only if selected absence type is compensable) */}
        {!isReadOnly &&
          mode === "create" &&
          selectedAbsenceType?.isTimeBankCompensable && (
            <div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-blue-100 rounded-md">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <label
                        htmlFor="isTimeBankCharge"
                        className="text-sm font-semibold text-blue-900 cursor-pointer"
                      >
                        {t("timeBank.title")}
                      </label>
                      <p className="text-xs text-blue-700 mt-0.5">
                        {t("timeBank.description")}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="isTimeBankCharge"
                    checked={isTimeBankCharge}
                    onChange={(e) =>
                      setValue("isTimeBankCharge", e.target.checked)
                    }
                    className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {isTimeBankCharge && (
                  <div className="border-t border-blue-200 pt-3">
                    {activeRestDaysBank ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-800 font-medium">
                          {t("timeBank.availableBalance")}:
                        </span>
                        <span
                          className={`font-bold ${activeRestDaysBank.availableHours >= 0 ? "text-green-700" : "text-red-600"}`}
                        >
                          {activeRestDaysBank.availableHours.toFixed(1)}{" "}
                          {t("timeBank.hours")}
                          {activeRestDaysBank.hoursPerDay > 0 && (
                            <span className="font-normal text-blue-700 ml-1">
                              (~
                              {(
                                activeRestDaysBank.availableHours /
                                activeRestDaysBank.hoursPerDay
                              ).toFixed(1)}{" "}
                              {t("timeBank.days")})
                            </span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                        {t("timeBank.noActiveBank")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Show time bank info in view mode if applicable */}
        {isReadOnly && request?.isTimeBankCharge && (
          <div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-blue-800 font-medium">
                {t("timeBank.viewInfo")}
              </span>
            </div>
          </div>
        )}

        {/* Additional reason (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("fields.reason")}
          </label>
          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <CHEKIOInput
                type="text"
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={t("fields.reasonPlaceholder")}
                disabled={isReadOnly}
              />
            )}
          />
        </div>

        {/* Observation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("fields.observation")}
          </label>
          <Controller
            name="observation"
            control={control}
            render={({ field }) => (
              <CHEKIOTextarea
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={t("fields.observationPlaceholder")}
                disabled={isReadOnly}
                rows={3}
              />
            )}
          />
        </div>

        {/* Request Info (for view mode) */}
        {mode === "view" && request && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium text-gray-900">
              {t("requestInfo.title")}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">
                  {t("requestInfo.requestedBy")}:
                </span>
                <p className="text-gray-600">{request.requestedByName}</p>
              </div>
              <div>
                <span className="font-medium">
                  {t("requestInfo.requestDate")}:
                </span>
                <p className="text-gray-600">
                  {DateTime.fromISO(request.createdAt as string).toFormat(
                    "dd/MM/yyyy HH:mm",
                  )}
                </p>
              </div>
              {request.absenceTypeName && (
                <div>
                  <span className="font-medium">
                    {t("fields.absenceType")}:
                  </span>
                  <p className="text-gray-600">{request.absenceTypeName}</p>
                </div>
              )}
              {request.approvedByName && (
                <div>
                  <span className="font-medium">
                    {t("requestInfo.approvedBy")}:
                  </span>
                  <p className="text-gray-600">{request.approvedByName}</p>
                </div>
              )}
              {request.approvedAt && (
                <div>
                  <span className="font-medium">
                    {t("requestInfo.approvalDate")}:
                  </span>
                  <p className="text-gray-600">
                    {DateTime.fromISO(request.approvedAt as string).toFormat(
                      "dd/MM/yyyy HH:mm",
                    )}
                  </p>
                </div>
              )}
              {request.rejectedByName && (
                <div>
                  <span className="font-medium">
                    {t("requestInfo.rejectedBy")}:
                  </span>
                  <p className="text-gray-600">{request.rejectedByName}</p>
                </div>
              )}
              {request.rejectedAt && (
                <div>
                  <span className="font-medium">
                    {t("requestInfo.rejectionDate")}:
                  </span>
                  <p className="text-gray-600">
                    {DateTime.fromISO(request.rejectedAt as string).toFormat(
                      "dd/MM/yyyy HH:mm",
                    )}
                  </p>
                </div>
              )}
              {request.rejectionReason && (
                <div className="col-span-2">
                  <span className="font-medium">
                    {t("requestInfo.rejectionReason")}:
                  </span>
                  <p className="text-gray-600">{request.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {overlapQueryEnabled && startIso && endIso && (
          <div className="mt-4 space-y-2">
            {overlapFetching && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin"
                  aria-hidden
                />
                <span>{t("overlap.checking")}</span>
              </div>
            )}
            {!overlapFetching &&
              overlapData?.hasOverlap &&
              overlapData.conflicts.length > 0 && (
                <div
                  className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
                  role="alert"
                >
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                    {t("overlap.title")}
                  </div>
                  <ul className="list-disc space-y-1 pl-5">
                    {overlapData.conflicts.map((conflict, index) => {
                      const startLabel = DateTime.fromISO(
                        conflict.startDate,
                      )
                        .toUTC()
                        .toFormat("dd/MM/yyyy");
                      const endLabel = DateTime.fromISO(conflict.endDate)
                        .toUTC()
                        .toFormat("dd/MM/yyyy");
                      const rangeLabel =
                        startLabel === endLabel
                          ? startLabel
                          : t("overlap.dateRange", {
                              start: startLabel,
                              end: endLabel,
                            });
                      return (
                        <li key={`${conflict.type}-${index}`}>
                          <span className="font-medium">
                            {conflictTypeLabel(conflict.type)}
                          </span>
                          {": "}
                          {rangeLabel}
                          {conflict.detail ? ` — ${conflict.detail}` : ""}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <CHEKIOButton
            type="button"
            variant="secondaryBlue"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
            {mode === "view" ? t("buttons.close") : t("buttons.cancel")}
          </CHEKIOButton>

          {mode !== "view" && (
            <CHEKIOButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("buttons.processing")}
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  {mode === "edit"
                    ? t("buttons.update")
                    : t("buttons.submit")}
                </>
              )}
            </CHEKIOButton>
          )}
        </div>
      </form>
    </CHEKIOModal>
  );
};

export { FreedayRequestModal };
