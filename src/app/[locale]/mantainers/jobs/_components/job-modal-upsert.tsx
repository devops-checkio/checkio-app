"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
} from "@/components";
import SystemMultiSelect from "@/components/ui/multi-select";
import SystemInput from "@/components/ui/system-input";
import { useToast } from "@/hooks/use-toast";
import { useCreateJob, useUpdateJob } from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { CompanyOption } from "../../companies/_components/company.dto";
import { JobCreateDto, JobResponseDto, JobUpdateDto } from "./job.dto";

interface JobModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  editingJob: JobResponseDto | null;
  onSuccess: () => void;
  companyOptions: CompanyOption[];
}

export default function JobModalUpsert({
  isOpen,
  onClose,
  editingJob,
  onSuccess,
  companyOptions,
}: JobModalUpsertProps) {
  const t = useTranslations("mantainers.jobs");
  const tUpsert = useTranslations("mantainers.jobs.upsert");
  const { toast } = useToast();
  const { mutate: createJob, isPending: isCreatingJob } = useCreateJob();
  const { mutate: updateJob, isPending: isUpdatingJob } = useUpdateJob();

  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<JobCreateDto | JobUpdateDto>();

  useEffect(() => {
    if (editingJob) {
      reset({
        code: editingJob.code,
        name: editingJob.name,
        description: editingJob.description,
        companies: editingJob.companies,
      });
    } else {
      reset();
    }
  }, [editingJob, reset]);

  const onSubmit: SubmitHandler<JobCreateDto | JobUpdateDto> = (data) => {
    if (editingJob) {
      updateJob({ ...data, publicId: editingJob.publicId } as JobUpdateDto, {
        onSuccess: () => {
          toast({
            title: t("toast.updateSuccess.title"),
            description: t("toast.updateSuccess.description"),
          });
          onSuccess();
          onClose();
        },
        onError: (error) => {
          handleError(error, toast);
        },
      });
    } else {
      createJob(data as JobCreateDto, {
        onSuccess: () => {
          toast({
            title: t("toast.createSuccess.title"),
            description: t("toast.createSuccess.description"),
          });
          onSuccess();
          onClose();
        },
        onError: (error) => {
          handleError(error, toast);
        },
      });
    }
  };

  const handleSelectAll = () => {
    const allValues = companyOptions.map((option) => option.value);
    setValue("companies", allValues);
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingJob ? tUpsert("title.edit") : tUpsert("title.add")}
      size="2xl"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 py-4"
        data-tour="jobs-modal-upsert"
      >
        <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
          <SystemInput
            control={control}
            label={tUpsert("fields.code")}
            attribute="code"
            errors={errors}
            rules={{ required: tUpsert("validation.codeRequired") }}
            placeholder={tUpsert("placeholders.code")}
          />
          <SystemInput
            control={control}
            label={tUpsert("fields.name")}
            attribute="name"
            errors={errors}
            rules={{ required: tUpsert("validation.nameRequired") }}
            placeholder={tUpsert("placeholders.name")}
          />
          <SystemInput
            control={control}
            label={tUpsert("fields.description")}
            attribute="description"
            errors={errors}
            rules={{ required: tUpsert("validation.descriptionRequired") }}
            placeholder={tUpsert("placeholders.description")}
          />
          <SystemMultiSelect
            control={control}
            label={tUpsert("fields.companies")}
            attribute="companies"
            options={companyOptions}
            errors={errors}
            rules={{ required: tUpsert("validation.companiesRequired") }}
            placeholder={tUpsert("placeholders.companies")}
            showSelectAll={true}
            onSelectAll={handleSelectAll}
            searchable={true}
            showClear={true}
            maxItems={3}
            showError={true}
          />
        </div>

        <CHEKIOButton
          type="submit"
          variant="primary"
          disabled={isCreatingJob || isUpdatingJob}
          className="w-full"
        >
          {isCreatingJob || isUpdatingJob ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{editingJob ? t("buttons.updating") : t("buttons.creating")}</span>
            </>
          ) : (
            <span>{editingJob ? t("buttons.update") : t("buttons.save")}</span>
          )}
        </CHEKIOButton>
      </form>
    </CHEKIOModal>
  );
}
