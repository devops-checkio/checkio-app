"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
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
import SystemInput from "@/components/ui/system-input";
import SystemMultiSelect from "@/components/ui/multi-select";
import { useScheduleDetailTour } from "@/hooks/useScheduleDetailTour";
import { useToast } from "@/hooks/use-toast";
import { useGetCompaniesSelector } from "@/service/mantainer.service";
import {
  useCreateSchedule,
  useGetSchedule,
  useUpdateSchedule,
} from "@/service/schedule.service";
import { checkOverlap, positionInTime } from "@/utils/control-overlap";
import {
  AlertCircle,
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
  Loader2,
  PlusCircle,
  Trash2,
  X,
} from "lucide-react";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY_BLUE = "secondaryBlue",
}
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { CompanyOption } from "../../companies/_components/company.dto";
import ScheduleTimeline from "../_components/schedule-timeline";
import {
  BreakType,
  PersonType,
  ScheduleBreakCreateDto,
  ScheduleBreakDto,
  ScheduleBreakUpdateDto,
  ScheduleCreateDto,
  ScheduleUpdateDto,
} from "../_components/schedule.dto";

interface ScheduleFormPageProps {
  params: Promise<{
    scheduleId: string;
  }>;
}

interface CustomAlertProps {
  type: "success" | "error";
  message: string;
  description: string;
  onClose: () => void;
}

function getBreakDurationMinutes(
  start: Date | string,
  end: Date | string
): number {
  const startDt =
    typeof start === "string"
      ? DateTime.fromISO(start.replace("Z", ""))
      : DateTime.fromJSDate(start as Date);
  const endDt =
    typeof end === "string"
      ? DateTime.fromISO(end.replace("Z", ""))
      : DateTime.fromJSDate(end as Date);
  return Math.round(endDt.diff(startDt, "minutes").minutes);
}

function generateScheduleName(params: {
  startFormatted: string;
  endFormatted: string;
  breaks: (ScheduleBreakDto | ScheduleBreakCreateDto | ScheduleBreakUpdateDto)[];
  discountMinutes: number;
  workHours: number;
  workMinutes: number;
}): string {
  const {
    startFormatted,
    endFormatted,
    breaks,
    discountMinutes,
    workHours,
    workMinutes,
  } = params;

  // 1. Build breakItems (incremental: each break with type and day)
  let breakItems: string;
  if (!breaks || breaks.length === 0) {
    breakItems = "S/C";
  } else {
    const sorted = [...breaks].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      const aStart =
        a.startTime instanceof Date
          ? a.startTime.getTime()
          : new Date(a.startTime as string).getTime();
      const bStart =
        b.startTime instanceof Date
          ? b.startTime.getTime()
          : new Date(b.startTime as string).getTime();
      return aStart - bStart;
    });
    breakItems = sorted
      .map((b) => {
        const prefix = b.type === BreakType.LUNCH ? "C" : "P";
        return `${prefix}-D${b.day}`;
      })
      .join(" ");
  }

  // 2. Calculate totalDeductibleMinutes
  let totalDeductibleMinutes = discountMinutes || 0;
  if (breaks?.length) {
    for (const b of breaks) {
      if (b.deductible) {
        totalDeductibleMinutes += getBreakDurationMinutes(b.startTime, b.endTime);
      }
    }
  }

  // 3. deductibleInfo
  const hasDeductible =
    discountMinutes > 0 || (breaks?.some((b) => b.deductible) ?? false);
  const deductibleInfo = hasDeductible ? "C/D" : "S/D";

  // 4. Build name
  const minutesPart =
    totalDeductibleMinutes > 0 ? ` ${totalDeductibleMinutes}min` : "";
  const baseName = `${startFormatted} - ${endFormatted} ${breakItems}${minutesPart} ${deductibleInfo}`.trim();

  if (workHours >= 24) {
    return `${baseName} ${workHours}:${String(workMinutes || 0).padStart(2, "0")}`;
  }
  return baseName.trim();
}

const CustomAlert = ({
  type,
  message,
  description,
  onClose,
}: CustomAlertProps) => {
  const bgColor = type === "success" ? "bg-green-50" : "bg-red-50";
  const borderColor =
    type === "success" ? "border-green-200" : "border-red-200";
  const textColor = type === "success" ? "text-green-800" : "text-red-800";
  const iconColor = type === "success" ? "text-green-500" : "text-red-500";

  return (
    <div
      className={`${bgColor} border ${borderColor} rounded-lg p-4 relative animate-fade-in`}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={18} />
      </button>
      <div className="flex items-start gap-3">
        {type === "success" ? (
          <CheckCircle2 className={`${iconColor} mt-0.5`} size={20} />
        ) : (
          <AlertCircle className={`${iconColor} mt-0.5`} size={20} />
        )}
        <div className="flex-1">
          <h4 className={`font-medium ${textColor}`}>{message}</h4>
          <p className={`text-sm mt-1 ${textColor} opacity-90`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function ScheduleFormPage({ params }: ScheduleFormPageProps) {
  const t = useTranslations("mantainers.schedules");
  const tForm = useTranslations("mantainers.schedules.form");
  const router = useRouter();
  const { startTour } = useScheduleDetailTour();
  const { toast } = useToast();
  const resolvedParams = use(params);
  const isCreating = resolvedParams.scheduleId === "new";

  const { mutate: createSchedule, isPending: isCreatingSchedule } =
    useCreateSchedule();
  const { mutate: updateSchedule, isPending: isUpdatingSchedule } =
    useUpdateSchedule();
  const { data: schedule, isLoading } = useGetSchedule(
    isCreating ? null : resolvedParams.scheduleId
  );

  const { data: companiesData } = useGetCompaniesSelector({
    page: 1,
    pageSize: 100,
    sort: "asc",
  });
  const companyOptions: CompanyOption[] =
    companiesData?.data.map((c) => ({
      value: c.publicId,
      label: c.businessName,
    })) ?? [];

  const [calculatedEndTime, setCalculatedEndTime] = useState<DateTime | null>(
    null
  );
  const [totalDays, setTotalDays] = useState<number>(0);

  const {
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ScheduleCreateDto | ScheduleUpdateDto>({
    defaultValues: {
      name: "",
      code: "",
      startTime: new Date(new Date().setHours(8, 0, 0, 0)),
      workHours: 8,
      workMinutes: 0,
      discountMinutes: 0,
      isActive: true,
      ScheduleBreaks: [],
      companies: [],
      personType: PersonType.EMPLOYEE,
    },
  });

  const breaks = watch("ScheduleBreaks");
  const startTime = watch("startTime");
  const workHours = watch("workHours");
  const workMinutes = watch("workMinutes");
  const discountMinutes = watch("discountMinutes");

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
    description: string;
  } | null>(null);

  // Reset form when schedule data is loaded
  useEffect(() => {
    if (schedule && !isCreating) {
      // Convertir startTime de string ISO a Date sin zona horaria
      // La API envía en UTC, pero necesitamos mantener la hora local
      let startTimeDate: Date;
      if (schedule.startTime) {
        if (typeof schedule.startTime === "string") {
          // Parsear la fecha ISO y crear Date local (sin conversión de zona)
          const dateStr = schedule.startTime.replace("Z", "");
          const [datePart, timePart] = dateStr.split("T");
          const [year, month, day] = datePart.split("-").map(Number);
          const [hours, minutes, seconds = 0] = timePart
            .split(":")
            .map((s: string) => parseFloat(s));
          startTimeDate = new Date(
            year,
            month - 1,
            day,
            hours,
            minutes,
            seconds
          );
        } else {
          startTimeDate = schedule.startTime as Date;
        }
      } else {
        startTimeDate = new Date(new Date().setHours(8, 0, 0, 0));
      }

      // Convertir ScheduleBreaks: convertir strings ISO a Date
      const processedBreaks = schedule.ScheduleBreaks.map((breakItem: any) => {
        let breakStartTime: Date;
        let breakEndTime: Date;

        if (typeof breakItem.startTime === "string") {
          const dateStr = breakItem.startTime.replace("Z", "");
          const [datePart, timePart] = dateStr.split("T");
          const [year, month, day] = datePart.split("-").map(Number);
          const [hours, minutes, seconds = 0] = timePart
            .split(":")
            .map((s: string) => parseFloat(s));
          breakStartTime = new Date(
            year,
            month - 1,
            day,
            hours,
            minutes,
            seconds
          );
        } else {
          breakStartTime = breakItem.startTime as Date;
        }

        if (typeof breakItem.endTime === "string") {
          const dateStr = breakItem.endTime.replace("Z", "");
          const [datePart, timePart] = dateStr.split("T");
          const [year, month, day] = datePart.split("-").map(Number);
          const [hours, minutes, seconds = 0] = timePart
            .split(":")
            .map((s: string) => parseFloat(s));
          breakEndTime = new Date(
            year,
            month - 1,
            day,
            hours,
            minutes,
            seconds
          );
        } else {
          breakEndTime = breakItem.endTime as Date;
        }

        return {
          ...breakItem,
          startTime: breakStartTime,
          endTime: breakEndTime,
        };
      });

      reset({
        name: schedule.name,
        code: schedule.code,
        startTime: startTimeDate,
        workHours: schedule.workHours,
        workMinutes: schedule.workMinutes,
        discountMinutes: schedule.discountMinutes || 0,
        isActive: schedule.isActive ?? true,
        ScheduleBreaks: processedBreaks,
        companies: schedule.companies ?? [],
        personType: schedule.personType ?? PersonType.EMPLOYEE,
      });
    }
  }, [schedule, isCreating, reset]);

  const validateBreaks = useCallback(
    (breaksToValidate: ScheduleBreakDto[]) => {
      if (!startTime || !calculatedEndTime) return breaksToValidate;

      // Crear DateTime sin zona horaria (solo hora local)
      const scheduleStart = DateTime.fromJSDate(startTime as Date).setZone(
        "local",
        { keepLocalTime: true }
      );
      const scheduleEnd = calculatedEndTime;

      return breaksToValidate.map((breakItem) => {
        // Crear DateTime sin zona horaria para pausas (solo hora local)
        let breakStart = DateTime.fromJSDate(
          breakItem.startTime as Date
        ).setZone("local", { keepLocalTime: true });
        let breakEnd = DateTime.fromJSDate(breakItem.endTime as Date).setZone(
          "local",
          { keepLocalTime: true }
        );

        if (breakItem.day < 1 || breakItem.day > totalDays) {
          return {
            ...breakItem,
            error: tForm("breaks.validation.dayRange", { totalDays }),
          };
        }

        [breakStart, breakEnd] = positionInTime(
          breakStart,
          breakEnd,
          breakItem.day
        );

        if (breakItem.day > totalDays) {
          return {
            ...breakItem,
            error: tForm("breaks.validation.cannotEndNextDay"),
          };
        }

        if (breakStart < scheduleStart) {
          return {
            ...breakItem,
            error: tForm("breaks.validation.startsBeforeSchedule"),
          };
        }
        if (breakEnd > scheduleEnd) {
          return {
            ...breakItem,
            error: tForm("breaks.validation.endsAfterSchedule"),
          };
        }

        const hasOverlap = breaksToValidate.some((otherBreak) => {
          if (otherBreak.publicId === breakItem.publicId) return false;

          [breakStart, breakEnd] = positionInTime(
            breakStart,
            breakEnd,
            breakItem.day
          );
          // Crear DateTime sin zona horaria (solo hora local)
          let otherStart = DateTime.fromJSDate(
            otherBreak.startTime as Date
          ).setZone("local", { keepLocalTime: true });
          let otherEnd = DateTime.fromJSDate(
            otherBreak.endTime as Date
          ).setZone("local", { keepLocalTime: true });
          [otherStart, otherEnd] = positionInTime(
            otherStart,
            otherEnd,
            otherBreak.day
          );

          return checkOverlap(breakStart, breakEnd, otherStart, otherEnd);
        });

        if (hasOverlap) {
          return { ...breakItem, error: tForm("breaks.validation.overlaps") };
        }

        return { ...breakItem, error: undefined };
      });
    },
    [startTime, calculatedEndTime, totalDays]
  );

  const handleBreakChange = (index: number, field: string, value: any) => {
    const currentBreaks = [...(breaks || [])];

    currentBreaks[index] = {
      ...currentBreaks[index],
      [field]:
        field === "startTime" || field === "endTime" ? new Date(value) : value,
    };

    const validatedBreaks = validateBreaks(currentBreaks);
    setValue("ScheduleBreaks", validatedBreaks, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  useEffect(() => {
    if (
      startTime &&
      workHours &&
      startTime instanceof Date &&
      !isNaN(startTime.getTime())
    ) {
      // Crear DateTime sin zona horaria (solo hora local)
      const start = DateTime.fromJSDate(startTime as Date).setZone("local", {
        keepLocalTime: true,
      });

      // Validar que start sea válido
      if (!start.isValid) {
        return;
      }
      const end = start.plus({
        hours: workHours,
        minutes: workMinutes || 0,
      });
      const startDay = start.startOf("day");
      const endDay = end.startOf("day");
      const totalDays = Math.ceil(endDay.diff(startDay, "days").days + 1);
      setCalculatedEndTime(end);
      setTotalDays(totalDays);

      const startFormatted = start.toFormat("HH:mm");
      const endFormatted = end.toFormat("HH:mm");

      const generatedName = generateScheduleName({
        startFormatted,
        endFormatted,
        breaks: breaks || [],
        discountMinutes: discountMinutes || 0,
        workHours,
        workMinutes: workMinutes || 0,
      });
      setValue("name", generatedName);
    }
  }, [
    startTime,
    workHours,
    workMinutes,
    breaks,
    discountMinutes,
    setValue,
  ]);

  useEffect(() => {
    if (breaks?.length) {
      const validatedBreaks = validateBreaks(breaks);
      const hasChanges = validatedBreaks.some((newBreak, index) => {
        if (index >= breaks.length) return true;
        const oldBreak = breaks[index];

        const startTimeChanged =
          newBreak.startTime instanceof Date &&
          oldBreak.startTime instanceof Date
            ? newBreak.startTime.getTime() !== oldBreak.startTime.getTime()
            : newBreak.startTime !== oldBreak.startTime;

        const endTimeChanged =
          newBreak.endTime instanceof Date && oldBreak.endTime instanceof Date
            ? newBreak.endTime.getTime() !== oldBreak.endTime.getTime()
            : newBreak.endTime !== oldBreak.endTime;

        return (
          newBreak.error !== oldBreak.error ||
          startTimeChanged ||
          endTimeChanged ||
          newBreak.day !== oldBreak.day ||
          newBreak.type !== oldBreak.type ||
          newBreak.deductible !== oldBreak.deductible ||
          newBreak.description !== oldBreak.description
        );
      });

      if (hasChanges) {
        setValue("ScheduleBreaks", validatedBreaks);
      }
    }
  }, [breaks, validateBreaks, setValue]);

  const onSubmit = (data: ScheduleCreateDto | ScheduleUpdateDto) => {
    const hasErrors = data.ScheduleBreaks.some(
      (b: ScheduleBreakDto | ScheduleBreakUpdateDto) => b.error
    );
    if (hasErrors) {
      setAlert({
        type: "error",
        message: tForm("breaks.validation.hasErrors"),
        description: tForm("breaks.validation.hasErrorsDescription"),
      });
      return;
    }

    if (isCreating) {
      createSchedule(
        {
          ...data,
          startTime: DateTime.fromJSDate(data.startTime as Date)
            .setZone("utc", { keepLocalTime: true })
            .toJSDate(),
          ScheduleBreaks: data.ScheduleBreaks.map((breakItem) => {
            // Procesar cada pausa: convertir fechas manteniendo solo la hora sin zona horaria
            const processedBreak = {
              ...breakItem,
              startTime:
                breakItem.startTime instanceof Date
                  ? convertTimeToDateWithoutTimezone(breakItem.startTime)
                  : breakItem.startTime,
              endTime:
                breakItem.endTime instanceof Date
                  ? convertTimeToDateWithoutTimezone(breakItem.endTime)
                  : breakItem.endTime,
            };
            // Remover campos que no deben enviarse (publicId, error)
            const { publicId, error, ...rest } = processedBreak;
            return rest;
          }),
          name: watch("name"),
        } as ScheduleCreateDto,
        {
          onSuccess: () => {
            toast({
              title: tForm("toast.createSuccess.title"),
              description: tForm("toast.createSuccess.description"),
            });
            setTimeout(() => {
              router.push("/mantainers/schedules");
            }, 1500);
          },
          onError: (error: any) => {
            const errorMessage =
              error?.response?.data?.message ||
              (typeof error?.response?.data === 'string' ? error.response.data : null) ||
              (error?.message?.includes('status code') ? null : error?.message) ||
              tForm("toast.createError.description");
            toast({
              title: tForm("toast.createError.title"),
              description: errorMessage,
              variant: "destructive",
            });
          },
        }
      );
    } else {
      updateSchedule(
        {
          ...data,
          publicId: resolvedParams.scheduleId,
          startTime: DateTime.fromJSDate(data.startTime as Date)
            .setZone("utc", { keepLocalTime: true })
            .toJSDate(),
          ScheduleBreaks: data.ScheduleBreaks.map((breakItem) => {
            // Procesar cada pausa: convertir fechas manteniendo solo la hora sin zona horaria
            const processedBreak = {
              ...breakItem,
              startTime:
                breakItem.startTime instanceof Date
                  ? convertTimeToDateWithoutTimezone(breakItem.startTime)
                  : breakItem.startTime,
              endTime:
                breakItem.endTime instanceof Date
                  ? convertTimeToDateWithoutTimezone(breakItem.endTime)
                  : breakItem.endTime,
            };
            // Remover campos que no deben enviarse
            const { error, ...rest } = processedBreak;
            return rest;
          }),
          name: watch("name"),
        } as ScheduleUpdateDto,
        {
          onSuccess: () => {
            toast({
              title: tForm("toast.updateSuccess.title"),
              description: tForm("toast.updateSuccess.description"),
            });
            setTimeout(() => {
              router.push("/mantainers/schedules");
            }, 1500);
          },
          onError: (error: any) => {
            const errorMessage =
              error?.response?.data?.message ||
              (typeof error?.response?.data === 'string' ? error.response.data : null) ||
              (error?.message?.includes('status code') ? null : error?.message) ||
              tForm("toast.updateError.description");
            toast({
              title: tForm("toast.updateError.title"),
              description: errorMessage,
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const handleAddBreak = () => {
    const newBreak: ScheduleBreakCreateDto | ScheduleBreakUpdateDto = {
      publicId: crypto.randomUUID(),
      description: "",
      type: BreakType.BREAK,
      startTime: new Date(new Date().setHours(0, 0, 0, 0)),
      endTime: new Date(new Date().setHours(0, 0, 0, 0)),
      deductible: false,
      day: 1,
    };
    const currentBreaks = breaks || [];
    setValue("ScheduleBreaks", validateBreaks([...currentBreaks, newBreak]), {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleAddLunchBreak = () => {
    const lunchBreak: ScheduleBreakCreateDto | ScheduleBreakUpdateDto = {
      publicId: crypto.randomUUID(),
      description: tForm("breaks.defaultLunchDescription"),
      type: BreakType.LUNCH,
      startTime: new Date(new Date().setHours(12, 0, 0, 0)),
      endTime: new Date(new Date().setHours(13, 0, 0, 0)),
      deductible: true,
      day: 1,
    };
    const currentBreaks = breaks || [];
    setValue("ScheduleBreaks", validateBreaks([...currentBreaks, lunchBreak]), {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleSelectAllCompanies = () => {
    setValue(
      "companies",
      companyOptions.map((o) => o.value)
    );
  };

  const handleDeleteBreak = (publicId: string | undefined) => {
    if (!publicId) return;
    const updatedBreaks = breaks.filter(
      (b: ScheduleBreakDto) => b.publicId !== publicId
    );
    setValue("ScheduleBreaks", validateBreaks(updatedBreaks), {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  // Función helper para convertir Date a formato sin zona horaria
  // Toma solo la hora (HH:mm) y crea un Date con fecha base y esa hora exacta
  // La hora se mantiene exactamente como se ingresó, sin conversión de zona horaria
  const convertTimeToDateWithoutTimezone = (date: Date): Date => {
    // Obtener la hora local del Date (sin conversión)
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Usar la fecha del startTime del schedule como base, o fecha actual
    const baseDate = startTime instanceof Date ? startTime : new Date();
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const day = baseDate.getDate();

    // Crear Date local con la hora seleccionada (sin zona horaria)
    const localDate = new Date(year, month, day, hours, minutes, 0, 0);

    // Convertir a UTC manteniendo la hora exacta (sin conversión de zona)
    // Esto asegura que 12:00 pm se envíe como 12:00 pm UTC
    return DateTime.fromJSDate(localDate)
      .setZone("utc", { keepLocalTime: true })
      .toJSDate();
  };

  if (isLoading && !isCreating) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CHEKIOLoading size="lg" variant="modern" text={tForm("loading")} />
      </div>
    );
  }

  const title = isCreating ? tForm("title.create") : tForm("title.edit");

  return (
    <>
      <div className="mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <CHEKIOButton
            type="button"
            variant="secondaryBlue"
            className="h-9 w-9 p-0 rounded-lg flex items-center justify-center"
            onClick={() => router.push("/mantainers/schedules")}
            aria-label="Volver al listado de horarios"
          >
            <ChevronLeft className="h-4 w-4" />
          </CHEKIOButton>
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={() => startTour()}
            className="flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            {t("detailTour.startButton")}
          </CHEKIOButton>
        </div>
        <form
          id="scheduleForm"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {alert && (
            <CustomAlert
              type={alert.type}
              message={alert.message}
              description={alert.description}
              onClose={() => setAlert(null)}
            />
          )}

          {/* Información Básica y Configuración del Horario */}
          <div
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            data-tour="schedule-detail-basic-info"
          >
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                {tForm("basicInfo.title")}
              </h3>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {tForm("basicInfo.name")}
                  </label>
                  <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                    {watch("name") || "-"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {tForm("basicInfo.nameDescription")}
                  </div>
                </div>
                <SystemInput
                  control={control}
                  label={tForm("basicInfo.code")}
                  attribute="code"
                  placeholder={tForm("basicInfo.codePlaceholder")}
                  errors={errors}
                  rules={{ required: tForm("basicInfo.codeRequired") }}
                />
                <div className="md:col-span-2">
                  <SystemMultiSelect
                    control={control}
                    label={tForm("basicInfo.companies")}
                    attribute="companies"
                    options={companyOptions}
                    errors={errors}
                    rules={{ required: tForm("basicInfo.companiesRequired") }}
                    placeholder={tForm("basicInfo.companiesPlaceholder")}
                    showSelectAll={true}
                    onSelectAll={handleSelectAllCompanies}
                    searchable={true}
                    showClear={true}
                    maxItems={3}
                    showError={true}
                  />
                </div>
                {!isCreating && (
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-5 w-5 rounded-lg border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="isActive"
                          className="text-sm font-medium text-gray-700"
                        >
                          {tForm("basicInfo.isActive")}
                        </label>
                      </div>
                    )}
                  />
                )}
                <Controller
                  name="personType"
                  control={control}
                  rules={{ required: "Seleccione el tipo de horario" }}
                  render={({ field }) => (
                    <div className="space-y-2 md:col-span-1 max-w-xs">
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo de horario
                      </label>
                      <CHEKIOSelect
                        value={field.value || PersonType.EMPLOYEE}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <CHEKIOSelectTrigger className="w-full h-9">
                          <CHEKIOSelectValue placeholder="Seleccione tipo" />
                        </CHEKIOSelectTrigger>
                        <CHEKIOSelectContent>
                          <CHEKIOSelectItem value={PersonType.EMPLOYEE}>
                            Trabajador
                          </CHEKIOSelectItem>
                          <CHEKIOSelectItem value={PersonType.STUDENT}>
                            Estudiante
                          </CHEKIOSelectItem>
                        </CHEKIOSelectContent>
                      </CHEKIOSelect>
                    </div>
                  )}
                />
              </div>

              <div
                className="border-t border-gray-200 pt-6"
                data-tour="schedule-detail-schedule-config"
              >
                <h4 className="mb-4 text-sm font-semibold text-gray-700">
                  {tForm("scheduleConfig.title")}
                </h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <Controller
                name="startTime"
                control={control}
                rules={{ required: tForm("scheduleConfig.startTimeRequired") }}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {tForm("scheduleConfig.startTime")} <span className="text-red-500">*</span>
                    </label>
                    <CHEKIOInput
                      type="time"
                      onChange={(e) => {
                        const timeString = e.target.value;
                        const [hours, minutes] = timeString
                          .split(":")
                          .map(Number);
                        const date = new Date();
                        date.setHours(hours, minutes, 0, 0);
                        field.onChange(date);
                      }}
                      value={
                        field.value
                          ? new Date(field.value).toLocaleTimeString("en-US", {
                              hour12: false,
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""
                      }
                    />
                    {fieldState.error && (
                      <p className="text-sm text-red-500">
                        {fieldState.error.message}
                      </p>
                    )}
                    <div className="text-xs text-gray-500">
                      {tForm("scheduleConfig.startTimeDescription")}
                    </div>
                  </div>
                )}
              />

              <Controller
                name="workHours"
                control={control}
                rules={{ required: tForm("scheduleConfig.workHoursRequired") }}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {tForm("scheduleConfig.workHours")} <span className="text-red-500">*</span>
                    </label>
                    <CHEKIOInput
                      type="number"
                      {...field}
                      min={1}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        field.onChange(value);
                      }}
                      value={field.value || ""}
                    />
                    {fieldState.error && (
                      <p className="text-sm text-red-500">
                        {fieldState.error.message}
                      </p>
                    )}
                    <div className="text-xs text-gray-500">
                      {tForm("scheduleConfig.workHoursDescription")}
                    </div>
                  </div>
                )}
              />

              <Controller
                name="workMinutes"
                control={control}
                rules={{
                  required: tForm("scheduleConfig.workMinutesRequired"),
                }}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {tForm("scheduleConfig.workMinutes")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <CHEKIOInput
                      type="number"
                      {...field}
                      min={0}
                      max={59}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        field.onChange(value);
                      }}
                      value={field.value || ""}
                    />
                    {fieldState.error && (
                      <p className="text-sm text-red-500">
                        {fieldState.error.message}
                      </p>
                    )}
                    <div className="text-xs text-gray-500">
                      {tForm("scheduleConfig.workMinutesDescription")}
                    </div>
                  </div>
                )}
                  />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Controller
                    name="discountMinutes"
                    control={control}
                    rules={{
                      required: tForm("scheduleConfig.discountMinutesRequired"),
                    }}
                    render={({ field, fieldState }) => (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                              {tForm("scheduleConfig.discountMinutes")}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <CHEKIOInput
                          type="number"
                          {...field}
                          min={0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            field.onChange(value);
                          }}
                          value={field.value || ""}
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-500">
                            {fieldState.error.message}
                          </p>
                        )}
                        <div className="text-xs text-gray-500">
                          {tForm("scheduleConfig.discountMinutesDescription")}
                        </div>
                      </div>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {tForm("scheduleConfig.calculatedEndTime")}
                    </label>
                    <CHEKIOInput
                      type="time"
                      readOnly
                      disabled
                      value={
                        calculatedEndTime ? calculatedEndTime.toFormat("HH:mm") : ""
                      }
                      className="cursor-not-allowed bg-gray-50"
                    />
                    <div className="text-xs text-gray-500">
                      {tForm("scheduleConfig.calculatedEndTimeDescription")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visualización de Línea de Tiempo */}
          {startTime && calculatedEndTime && (
            <div data-tour="schedule-detail-timeline">
            <ScheduleTimeline
              startTime={DateTime.fromJSDate(startTime as Date)
                .setZone("local", { keepLocalTime: true })
                .toFormat("HH:mm")}
              endTime={calculatedEndTime.toFormat("HH:mm")}
              totalDays={totalDays}
              breaks={breaks || []}
            />
            </div>
          )}

          {/* Pausas y Colaciones */}
          <div
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            data-tour="schedule-detail-breaks"
          >
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                {tForm("breaks.title")}
              </h3>
            </div>
            <div className="p-6">
            <div className="mb-4 flex justify-end gap-2">
              <CHEKIOButton
                type="button"
                variant={ButtonVariant.SECONDARY_BLUE}
                onClick={handleAddLunchBreak}
              >
                <PlusCircle className="h-4 w-4" />
                {tForm("breaks.addLunch")}
              </CHEKIOButton>
              <CHEKIOButton
                type="button"
                variant={ButtonVariant.PRIMARY}
                onClick={handleAddBreak}
              >
                <PlusCircle className="h-4 w-4" />
                {tForm("breaks.addBreak")}
              </CHEKIOButton>
            </div>

            {breaks && breaks.length > 0 ? (
              <CHEKIOTable>
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>{tForm("breaks.table.headers.description")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tForm("breaks.table.headers.type")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tForm("breaks.table.headers.day")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tForm("breaks.table.headers.startTime")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tForm("breaks.table.headers.endTime")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tForm("breaks.table.headers.deductible")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tForm("breaks.table.headers.status")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tForm("breaks.table.headers.actions")}</CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {breaks.map((breakItem: ScheduleBreakDto, index: number) => (
                    <CHEKIOTableRow
                      key={breakItem.publicId}
                      index={index}
                      className={breakItem.error ? "bg-red-50" : ""}
                    >
                      <CHEKIOTableCell>
                        <Controller
                          name={`ScheduleBreaks.${index}.description`}
                          control={control}
                          render={({ field }) => (
                            <CHEKIOInput
                              {...field}
                              type="text"
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                handleBreakChange(
                                  index,
                                  "description",
                                  e.target.value
                                );
                              }}
                              value={field.value || ""}
                            />
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`ScheduleBreaks.${index}.type`}
                          control={control}
                          render={({ field }) => (
                            <CHEKIOSelect
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleBreakChange(index, "type", value);
                              }}
                            >
                              <CHEKIOSelectTrigger className="w-full">
                                <CHEKIOSelectValue placeholder={tForm("breaks.table.typePlaceholder")} />
                              </CHEKIOSelectTrigger>
                              <CHEKIOSelectContent>
                                <CHEKIOSelectItem value={BreakType.BREAK}>
                                  {tForm("breaks.table.type.break")}
                                </CHEKIOSelectItem>
                                <CHEKIOSelectItem value={BreakType.LUNCH}>
                                  {tForm("breaks.table.type.lunch")}
                                </CHEKIOSelectItem>
                              </CHEKIOSelectContent>
                            </CHEKIOSelect>
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`ScheduleBreaks.${index}.day`}
                          control={control}
                          render={({ field }) => (
                            <CHEKIOSelect
                              value={String(field.value || 1)}
                              onValueChange={(value) => {
                                const dayValue = parseInt(value);
                                field.onChange(dayValue);
                                handleBreakChange(index, "day", dayValue);
                              }}
                            >
                              <CHEKIOSelectTrigger className="w-full">
                                <CHEKIOSelectValue placeholder={tForm("breaks.table.dayPlaceholder")} />
                              </CHEKIOSelectTrigger>
                              <CHEKIOSelectContent>
                                {Array.from({ length: totalDays }, (_, i) => (
                                  <CHEKIOSelectItem
                                    key={i + 1}
                                    value={String(i + 1)}
                                  >
                                    {tForm("breaks.table.day", { day: i + 1 })}
                                  </CHEKIOSelectItem>
                                ))}
                              </CHEKIOSelectContent>
                            </CHEKIOSelect>
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`ScheduleBreaks.${index}.startTime`}
                          control={control}
                          render={({ field }) => (
                            <CHEKIOInput
                              type="time"
                              onChange={(e) => {
                                const timeString = e.target.value;
                                const [hours, minutes] = timeString
                                  .split(":")
                                  .map(Number);
                                const date = new Date();
                                date.setHours(hours, minutes, 0, 0);
                                field.onChange(date);
                                handleBreakChange(index, "startTime", date);
                              }}
                              value={
                                field.value
                                  ? new Date(field.value).toLocaleTimeString(
                                      "en-US",
                                      {
                                        hour12: false,
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )
                                  : ""
                              }
                            />
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`ScheduleBreaks.${index}.endTime`}
                          control={control}
                          render={({ field }) => (
                            <CHEKIOInput
                              type="time"
                              onChange={(e) => {
                                const timeString = e.target.value;
                                const [hours, minutes] = timeString
                                  .split(":")
                                  .map(Number);
                                const date = new Date();
                                date.setHours(hours, minutes, 0, 0);
                                field.onChange(date);
                                handleBreakChange(index, "endTime", date);
                              }}
                              value={
                                field.value
                                  ? new Date(field.value).toLocaleTimeString(
                                      "en-US",
                                      {
                                        hour12: false,
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )
                                  : ""
                              }
                            />
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`ScheduleBreaks.${index}.deductible`}
                          control={control}
                          render={({ field }) => (
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={field.value || false}
                                onChange={(e) => {
                                  field.onChange(e.target.checked);
                                  handleBreakChange(
                                    index,
                                    "deductible",
                                    e.target.checked
                                  );
                                }}
                                className="h-4 w-4 rounded-lg border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {breakItem.error ? (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <div className="flex flex-col">
                              <span className="text-red-700 font-medium text-sm">
                                {tForm("breaks.table.status.error")}
                              </span>
                              <span className="text-red-600 text-xs">
                                {breakItem.error}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-green-700 font-medium text-sm">
                              {tForm("breaks.table.status.valid")}
                            </span>
                          </div>
                        )}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <button
                          type="button"
                          onClick={() => handleDeleteBreak(breakItem.publicId)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                          title={tForm("breaks.table.delete")}
                          aria-label={t("ariaLabels.deleteBreak")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-600 font-medium">
                  {tForm("breaks.noBreaks")}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {tForm("breaks.noBreaksDescription")}
                </p>
              </div>
            )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-4">
            <CHEKIOButton
              type="button"
              variant={ButtonVariant.SECONDARY_BLUE}
              onClick={() => router.push("/mantainers/schedules")}
            >
              <X className="h-4 w-4" />
              {tForm("buttons.cancel")}
            </CHEKIOButton>
            <CHEKIOButton
              type="submit"
              variant={ButtonVariant.PRIMARY}
              disabled={isCreatingSchedule || isUpdatingSchedule}
            >
              {isCreatingSchedule || isUpdatingSchedule ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isCreating ? tForm("buttons.creating") : tForm("buttons.updating")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {isCreating ? tForm("buttons.create") : tForm("buttons.update")}
                </>
              )}
            </CHEKIOButton>
          </div>
        </form>
      </div>
    </>
  );
}
