"use client";

import SystemMultiSelect from "@/components/ui/multi-select";
import { useGetCompanies } from "@/service/mantainer.service";
import {
  Control,
  FieldErrors,
  FieldValues,
  Path,
  UseFormSetValue,
} from "react-hook-form";

interface CompanySelectorProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  rules?: {
    required?: boolean | string;
    [key: string]: any;
  };
  disabled?: boolean;
  errors?: FieldErrors<any>;
  errorMessage?: string;
  className?: string;
  mode: "multiple" | "tags" | undefined;
  setValue: UseFormSetValue<any>;
}

export default function CompanySelector<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "Seleccione empresas",
  rules,
  disabled = false,
  errors,
  mode,
  errorMessage,
  setValue,
  className,
}: CompanySelectorProps<T>) {
  // Fetch companies data
  const { data: companiesData, isLoading } = useGetCompanies({
    page: 1,
    pageSize: 100,
    sort: "asc",
    selector: true,
  });

  // Transform companies data into options format
  const companyOptions =
    companiesData?.data.map((company) => ({
      value: company.publicId,
      label: company.businessName,
      key: company.publicId,
    })) || [];

  const handleSelectAll = () => {
    const allValues = companyOptions.map((option) => option.value);
    setValue(name as any, allValues);
  };

  return (
    <SystemMultiSelect
      control={control as Control<any, any>}
      label={label}
      attribute={name}
      options={companyOptions}
      rules={rules}
      errors={errors}
      placeholder={placeholder}
      disabled={disabled || isLoading}
      showSelectAll={mode === "multiple"}
      onSelectAll={handleSelectAll}
      searchable={true}
      showClear={true}
      maxItems={3}
      showError={true}
      className={className}
      onChange={(value) => setValue(name as any, value)}
    />
  );
}
