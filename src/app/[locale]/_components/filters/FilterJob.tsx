"use client";

import {
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useGetJobs } from "@/service/mantainer.service";
import { Controller } from "react-hook-form";

interface FilterJobProps {
  control: any;
  value?: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export default function FilterJob({
  control,
  value,
  onChange,
  onClear,
}: FilterJobProps) {
  const { canRead, companyId } = useCookieSession();

  // Only fetch jobs if user has permission to read job maintenance
  const { data: jobs } = useGetJobs(
    {
      page: 1,
      pageSize: 1000,
      sort: "asc",
      companyId: companyId || "",
    },
    {
      enabled: canRead(OrganizationPermissionCode.JOB_MAINTENANCE),
    },
  );

  const filteredJobs = (jobs?.data || []).filter((job: any) => {
    if (!companyId) return false;
    const companies = job?.companies;
    if (Array.isArray(companies)) {
      return companies.some((companyRef: any) => {
        if (typeof companyRef === "string") return companyRef === companyId;
        return (
          companyRef?.publicId === companyId ||
          String(companyRef?.id ?? "") === String(companyId)
        );
      });
    }
    if (typeof job?.companyId === "string") return job.companyId === companyId;
    if (job?.companyId != null)
      return String(job.companyId) === String(companyId);
    return false;
  });

  // Don't render the component if user doesn't have permission
  if (!canRead(OrganizationPermissionCode.JOB_MAINTENANCE)) {
    return null;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Cargo
      </label>
      <Controller
        name="jobId"
        control={control}
        render={({ field }) => (
          <CHEKIOSelect
            value={field.value || undefined}
            onValueChange={(value) => {
              field.onChange(value);
              onChange(value);
            }}
          >
            <CHEKIOSelectTrigger>
              <CHEKIOSelectValue placeholder="Seleccionar Cargo" />
            </CHEKIOSelectTrigger>
            <CHEKIOSelectContent>
              {filteredJobs.map((job: any) => (
                <CHEKIOSelectItem key={job.publicId} value={job.publicId}>
                  {job.name}
                </CHEKIOSelectItem>
              ))}
            </CHEKIOSelectContent>
          </CHEKIOSelect>
        )}
      />
    </div>
  );
}
