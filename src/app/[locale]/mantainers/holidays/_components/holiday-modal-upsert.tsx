"use client";

import { CHEKIOButton, CHEKIOModal } from "@/components";
import SystemMultiSelect from "@/components/ui/multi-select";
import SystemInput from "@/components/ui/system-input";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateHoliday,
  useGetBranches,
  useUpdateHoliday,
} from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { AlertCircle, Loader2 } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  HolidayCreateDto,
  HolidayResponseDto,
  HolidayUpdateDto,
} from "./holidays.dto";

interface HolidayModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  editingHoliday: HolidayResponseDto | null;
  onSuccess: () => void;
}

export default function HolidayModalUpsert({
  isOpen,
  onClose,
  editingHoliday,
  onSuccess,
}: HolidayModalUpsertProps) {
  const t = useTranslations("mantainers.holidays");
  const tUpsert = useTranslations("mantainers.holidays.upsert");
  const { toast } = useToast();
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [branchError, setBranchError] = useState<string>("");
  const { mutate: createHoliday, isPending: isCreatingHoliday } =
    useCreateHoliday();
  const { mutate: updateHoliday, isPending: isUpdatingHoliday } =
    useUpdateHoliday();

  const { data: branches } = useGetBranches({
    page: 1,
    pageSize: 1000,
  });

  const branchesOptions = branches?.data.map((branch) => ({
    value: branch.publicId,
    label: branch.name,
  }));

  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<HolidayCreateDto | HolidayUpdateDto>();

  useEffect(() => {
    if (editingHoliday) {
      reset({
        name: editingHoliday.name,
        isWaivable: editingHoliday.isWaivable,
        date: DateTime.fromISO(editingHoliday.date as string)
          .toUTC()
          .toFormat("yyyy-MM-dd"),
      });
      setSelectedBranches(editingHoliday.BranchHoliday);
    } else {
      reset();
      setSelectedBranches([]);
    }
  }, [editingHoliday, reset]);

  const onSubmit: SubmitHandler<HolidayCreateDto | HolidayUpdateDto> = (
    data
  ) => {
    if (editingHoliday) {
      updateHoliday(
        {
          publicId: editingHoliday.publicId,
          data: {
            name: data.name,
            date: DateTime.fromFormat(data.date as string, "yyyy-MM-dd")
              .setZone("utc", { keepLocalTime: true })
              .toISO(),
            isWaivable: data.isWaivable,
            BranchHoliday: selectedBranches,
          },
        } as {
          publicId: string;
          data: HolidayUpdateDto;
        },
        {
          onSuccess: () => {
            toast({
              title: t("toast.updateSuccess.title"),
              description: t("toast.updateSuccess.description"),
            });
            onSuccess();
            onClose();
          },
          onError: (error: any) => {
            handleError(error, toast);
          },
          onSettled: () => {
            onClose();
          },
        }
      );
    } else {
      createHoliday(
        {
          name: data.name,
          date: DateTime.fromFormat(data.date as string, "yyyy-MM-dd")
            .setZone("utc", { keepLocalTime: true })
            .toISO(),
          isWaivable: data.isWaivable,
          BranchHoliday: selectedBranches,
        } as HolidayCreateDto,
        {
          onSuccess: () => {
            toast({
              title: t("toast.createSuccess.title"),
              description: t("toast.createSuccess.description"),
            });
            onClose();
            onSuccess();
          },
          onError: (error: any) => {
            handleError(error, toast);
          },
          onSettled: () => {
            onClose();
          },
        }
      );
    }
  };

  const handleSelectAll = () => {
    const allValues = branchesOptions?.map((option) => option.value) || [];
    setSelectedBranches(allValues);
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingHoliday ? tUpsert("title.edit") : tUpsert("title.add")}
      size="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <SystemInput
            control={control}
            label={tUpsert("fields.name")}
            attribute="name"
            errors={errors}
            rules={{
              required: tUpsert("validation.nameRequired"),
            }}
            placeholder={tUpsert("placeholders.name")}
          />
          <SystemInput
            control={control}
            label={tUpsert("fields.date")}
            attribute="date"
            type="date"
            errors={errors}
            rules={{
              required: tUpsert("validation.dateRequired"),
            }}
            placeholder={tUpsert("placeholders.date")}
          />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">
                  {tUpsert("branchAssignment.title")}
                </h4>
                <p className="text-sm text-blue-800">
                  {selectedBranches.length === 0 ? (
                    <>
                      <strong>{tUpsert("branchAssignment.noBranches.label")}</strong> {tUpsert("branchAssignment.noBranches.description")}
                    </>
                  ) : (
                    <>
                      <strong>
                        {tUpsert("branchAssignment.withBranches.label", { count: selectedBranches.length })}
                      </strong>{" "}
                      {tUpsert("branchAssignment.withBranches.description")}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
          <SystemMultiSelect
            control={control}
            label={tUpsert("fields.branches")}
            attribute="branches"
            options={branchesOptions || []}
            placeholder={tUpsert("placeholders.branches")}
            showSelectAll={true}
            onSelectAll={handleSelectAll}
            searchable={true}
            showClear={true}
            maxItems={3}
            showError={false}
            disabled={isCreatingHoliday || isUpdatingHoliday}
            onChange={(values) => {
              setSelectedBranches(values);
              setBranchError("");
            }}
            tooltip={tUpsert("branchAssignment.tooltip")}
          />
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                {...control.register("isWaivable")}
                id="isWaivable"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="isWaivable" className="font-medium text-gray-900">
                {tUpsert("isWaivable.label")}
              </label>
              <p className="text-gray-600 text-sm">
                {tUpsert("isWaivable.description")}
              </p>
            </div>
          </div>
        </div>

        <CHEKIOButton
          type="submit"
          variant="primary"
          disabled={isCreatingHoliday || isUpdatingHoliday}
          className="w-full"
        >
          {isCreatingHoliday || isUpdatingHoliday ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{editingHoliday ? t("buttons.updating") : t("buttons.creating")}</span>
            </>
          ) : (
            <span>{editingHoliday ? t("buttons.update") : t("buttons.save")}</span>
          )}
        </CHEKIOButton>
      </form>
    </CHEKIOModal>
  );
}
