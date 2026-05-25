"use client";

import FilterJob from "@/app/[locale]/_components/filters/FilterJob";
import EmployeeChangeCompanyModal from "@/app/[locale]/mantainers/employees/_components/employee-change-company-modal";
import OrganizationSelector from "@/app/[locale]/mantainers/employees/_components/organization-selector";
import {
  CHEKIOButton,
  CHEKIOInput,
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
import { useCookieSession } from "@/context/useCookieSession";
import { PaginationFilterDto } from "@/dto/pagination";
import { useToast } from "@/hooks/use-toast";
import {
  useGetBranches,
  useGetEmployees,
  useGetJobs,
} from "@/service/mantainer.service";
import { generateExcel, HeaderMapping } from "@/utils/excel";
import {
  ArrowLeftRight,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Hash,
  ImageIcon,
  Mail,
  Pencil,
  RefreshCw,
  Search,
  User,
  Users,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  SEARCH = "search",
  REFRESH = "refresh",
}

/** Valores vacíos de subunidades para filtro de listado (OrganizationSelector). */
const EMPLOYEE_LIST_ORG_FILTER_EMPTY = {
  subUnit1Id: undefined as string | undefined,
  subUnit2Id: undefined as string | undefined,
  subUnit3Id: undefined as string | undefined,
  subUnit4Id: undefined as string | undefined,
  subUnit5Id: undefined as string | undefined,
  subUnit6Id: undefined as string | undefined,
  subUnit7Id: undefined as string | undefined,
  subUnit8Id: undefined as string | undefined,
};

interface TabBaseProps {
  status: "active" | "expiring" | "recent_dismissals" | "inactive";
  title: string;
  onDownloadExcelReady?: (
    downloadFn: () => Promise<void>,
    isLoading: boolean,
  ) => void;
}

export default function TabBase({
  status,
  title,
  onDownloadExcelReady,
}: TabBaseProps) {
  const router = useRouter();
  const t = useTranslations("mantainers.employees");
  const { companyId, getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const { toast } = useToast();
  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "desc" as "asc" | "desc",
  });
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // State for change company modal
  const [isChangeCompanyModalOpen, setIsChangeCompanyModalOpen] =
    useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    code: string;
    currentCompanyName: string;
  } | null>(null);

  const { handleSubmit, watch, setValue, control, reset } = useForm({
    defaultValues: {
      search: "",
      documentNumber: "",
      jobId: undefined,
      branchId: undefined,
      organizationId: undefined,
      ...EMPLOYEE_LIST_ORG_FILTER_EMPTY,
    },
  });

  // State for active search filters (only updated when "Buscar" is pressed)
  const [activeFilters, setActiveFilters] = useState({
    search: "",
    documentNumber: "",
    jobId: undefined as string | undefined,
    branchId: undefined as string | undefined,
    organizationId: undefined as string | undefined,
    ...EMPLOYEE_LIST_ORG_FILTER_EMPTY,
  });

  const { canRead } = useCookieSession();

  const { data: branches } = useGetBranches({
    page: 1,
    pageSize: 1000,
    sort: "asc",
    companyId: companyId || "",
  });

  const { data: jobs } = useGetJobs({
    page: 1,
    pageSize: 1000,
    sort: "asc",
    companyId: companyId || "",
  });

  const filteredBranches = useMemo(
    () => branches?.data ?? [],
    [branches?.data],
  );
  const filteredJobs = useMemo(() => jobs?.data ?? [], [jobs?.data]);

  const jobId = watch("jobId");

  const { data, isLoading, error, refetch } = useGetEmployees({
    page: pagination.current,
    pageSize: pagination.pageSize,
    sort: pagination.sort,
    search: activeFilters.search,
    companyId: companyId || "",
    status,
    personType: "EMPLOYEE",
    documentNumber: activeFilters.documentNumber,
    jobId: activeFilters.jobId,
    branchId: activeFilters.branchId,
    subUnit1Id: activeFilters.subUnit1Id,
    subUnit2Id: activeFilters.subUnit2Id,
    subUnit3Id: activeFilters.subUnit3Id,
    subUnit4Id: activeFilters.subUnit4Id,
    subUnit5Id: activeFilters.subUnit5Id,
    subUnit6Id: activeFilters.subUnit6Id,
    subUnit7Id: activeFilters.subUnit7Id,
    subUnit8Id: activeFilters.subUnit8Id,
  });

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data]);

  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
      }));
    },
    [],
  );

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: newPageSize,
      current: 1, // Reset to first page when changing page size
    }));
  }, []);

  const handleLevelChange = (
    value: string,
    field:
      | "search"
      | "documentNumber"
      | "jobId"
      | "branchId"
      | "organizationId",
  ) => {
    setValue(field, value);
  };

  const onSubmitSearch = (data: {
    search: string;
    documentNumber: string;
    jobId?: string;
    branchId?: string;
    organizationId?: string;
    subUnit1Id?: string;
    subUnit2Id?: string;
    subUnit3Id?: string;
    subUnit4Id?: string;
    subUnit5Id?: string;
    subUnit6Id?: string;
    subUnit7Id?: string;
    subUnit8Id?: string;
  }) => {
    setActiveFilters({
      search: data.search || "",
      documentNumber: data.documentNumber || "",
      jobId: data.jobId,
      branchId: data.branchId,
      organizationId: data.organizationId,
      subUnit1Id: data.subUnit1Id,
      subUnit2Id: data.subUnit2Id,
      subUnit3Id: data.subUnit3Id,
      subUnit4Id: data.subUnit4Id,
      subUnit5Id: data.subUnit5Id,
      subUnit6Id: data.subUnit6Id,
      subUnit7Id: data.subUnit7Id,
      subUnit8Id: data.subUnit8Id,
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleClearSearch = () => {
    reset({
      search: "",
      documentNumber: "",
      jobId: undefined,
      branchId: undefined,
      organizationId: undefined,
      ...EMPLOYEE_LIST_ORG_FILTER_EMPTY,
    });
    setFormKey((prev) => prev + 1);
    setActiveFilters({
      search: "",
      documentNumber: "",
      jobId: undefined,
      branchId: undefined,
      organizationId: undefined,
      ...EMPLOYEE_LIST_ORG_FILTER_EMPTY,
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleOpenChangeCompanyModal = (employee: any) => {
    setSelectedEmployee({
      id: employee.publicId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      code: employee.code,
      currentCompanyName: "Empresa Actual", // Placeholder - could be enhanced to fetch company name
    });
    setIsChangeCompanyModalOpen(true);
  };

  const handleCloseChangeCompanyModal = () => {
    setIsChangeCompanyModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleChangeCompanySuccess = () => {
    refetch(); // Refresh the table data
  };

  // Helper functions for gender-based styling
  const getBorderColor = (gender: string) => {
    switch (gender) {
      case "MALE":
        return "border-blue-400";
      case "FEMALE":
        return "border-pink-400";
      case "OTHER":
        return "border-purple-400";
      default:
        return "border-gray-300";
    }
  };

  const getPlaceholderBg = (gender: string) => {
    switch (gender) {
      case "MALE":
        return "bg-blue-50";
      case "FEMALE":
        return "bg-pink-50";
      case "OTHER":
        return "bg-purple-50";
      default:
        return "bg-gray-100";
    }
  };

  const getPlaceholderIconColor = (gender: string) => {
    switch (gender) {
      case "MALE":
        return "text-blue-400";
      case "FEMALE":
        return "text-pink-400";
      case "OTHER":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const handleDownloadExcel = useCallback(async () => {
    if (!data?.data) return;

    try {
      setIsGeneratingExcel(true);

      // Prepare Excel columns with all available fields
      const EMPLOYEE_COLUMNS_EXCEL: HeaderMapping[] = [
        {
          attribute: "code",
          header: "Código",
        },
        {
          attribute: "firstName",
          header: "Nombres",
        },
        {
          attribute: "lastName",
          header: "Primer Apellido",
        },
        {
          attribute: "secondLastName",
          header: "Segundo Apellido",
          render: (value: string | null | undefined) => value || "-",
        },
        {
          attribute: "documentType",
          header: "Tipo de Documento",
        },
        {
          attribute: "documentNumber",
          header: "Número de Documento",
        },
        {
          attribute: "documentNumberHash",
          header: "Hash de Documento",
          render: (value: string | null | undefined) => value || "-",
        },
        {
          attribute: "gender",
          header: "Género",
          render: (value: string) => {
            switch (value) {
              case "MALE":
                return "Masculino";
              case "FEMALE":
                return "Femenino";
              case "OTHER":
                return "Otro";
              default:
                return value || "-";
            }
          },
        },
        {
          attribute: "birthDate",
          header: "Fecha de Nacimiento",
          render: (value: string | null | undefined) =>
            value ? DateTime.fromISO(value).toFormat("dd/MM/yyyy") : "-",
        },
        {
          attribute: "address",
          header: "Dirección",
          render: (value: string | null | undefined) => value || "-",
        },
        {
          attribute: "personalEmail",
          header: "Email Personal",
          render: (value: string | null | undefined) => value || "-",
        },
        {
          attribute: "workEmail",
          header: "Email Laboral",
          render: (value: string | null | undefined) => value || "-",
        },
        {
          attribute: "personalPhone",
          header: "Teléfono Personal",
          render: (value: string | null | undefined) => value || "-",
        },
        {
          attribute: "workPhone",
          header: "Teléfono Laboral",
          render: (value: string | null | undefined) => value || "-",
        },
        {
          attribute: "branchId",
          header: "Sucursal",
          render: (value: string | null | undefined, record: any) => {
            if (!value) return "-";
            const branch = filteredBranches.find(
              (branch: any) => branch.publicId === value,
            );
            return branch ? branch.name : value;
          },
        },
        {
          attribute: "jobId",
          header: "Cargo",
          render: (value: string | null | undefined, record: any) => {
            if (!value) return "-";
            const job = filteredJobs.find((job: any) => job.publicId === value);
            return job ? job.name : value;
          },
        },
        {
          attribute: "companyId",
          header: "ID Empresa",
          render: (value: string | number | null | undefined) =>
            value?.toString() || "-",
        },
        {
          attribute: "startDate",
          header: "Fecha de Inicio",
          render: (value: string | Date | null | undefined) => {
            if (!value) return "-";
            const dateStr =
              typeof value === "string" ? value : value.toISOString();
            return DateTime.fromISO(dateStr).toFormat("dd/MM/yyyy");
          },
        },
        {
          attribute: "endDate",
          header: "Fecha de Término",
          render: (value: string | Date | null | undefined) => {
            if (!value) return "-";
            const dateStr =
              typeof value === "string" ? value : value.toISOString();
            return DateTime.fromISO(dateStr).toFormat("dd/MM/yyyy");
          },
        },
        {
          attribute: "isIndefiniteTerm",
          header: "Contrato Indefinido",
          render: (value: boolean) => (value ? "Sí" : "No"),
        },
        {
          attribute: "contractedHours",
          header: "Horas Contratadas",
          render: (value: number | null | undefined) =>
            value?.toString() || "-",
        },
        {
          attribute: "canCheckAnywhere",
          header: "Puede Marcar en Cualquier Lugar",
          render: (value: boolean | null | undefined) => (value ? "Sí" : "No"),
        },
        {
          attribute: "canCheckFromAnyBranch",
          header: "Puede Marcar desde Cualquier Sucursal",
          render: (value: boolean | null | undefined) => (value ? "Sí" : "No"),
        },
        {
          attribute: "canCheckFromWeb",
          header: "Puede Marcar desde Web",
          render: (value: boolean | null | undefined) => (value ? "Sí" : "No"),
        },
        {
          attribute: "canCheckInOtherBranch",
          header: "Puede Marcar en Otra Sucursal",
          render: (value: boolean | null | undefined) => (value ? "Sí" : "No"),
        },
        {
          attribute: "canCheckWithoutShift",
          header: "Puede Marcar sin Turno",
          render: (value: boolean | null | undefined) => (value ? "Sí" : "No"),
        },
        {
          attribute: "requiresPassword",
          header: "Requiere Contraseña",
          render: (value: boolean | null | undefined) => (value ? "Sí" : "No"),
        },
        {
          attribute: "isActive",
          header: "Activo",
          render: (value: boolean | null | undefined) => (value ? "Sí" : "No"),
        },
        {
          attribute: "isEncrypted",
          header: "Encriptado",
          render: (value: boolean | null | undefined) => (value ? "Sí" : "No"),
        },
        {
          attribute: "integrationCode",
          header: "Código de Integración",
          render: (value: string | null | undefined) => value || "-",
        },
        {
          attribute: "homeOfficeLat",
          header: "Latitud Oficina en Casa",
          render: (value: number | null | undefined) =>
            value?.toString() || "-",
        },
        {
          attribute: "homeOfficeLong",
          header: "Longitud Oficina en Casa",
          render: (value: number | null | undefined) =>
            value?.toString() || "-",
        },
        {
          attribute: "homeOfficeRangeMeters",
          header: "Rango en Metros (Oficina en Casa)",
          render: (value: number | null | undefined) =>
            value?.toString() || "-",
        },
        {
          attribute: "userId",
          header: "ID Usuario",
          render: (value: number | null | undefined) =>
            value?.toString() || "-",
        },
        {
          attribute: "photo",
          header: "Foto",
          render: (value: string | null | undefined) => (value ? "Sí" : "No"),
        },
        {
          attribute: "legalMetadata.article22",
          header: "Artículo 22",
          render: (value: boolean | null | undefined, record: any) => {
            if (record?.legalMetadata?.article22 !== undefined) {
              return record.legalMetadata.article22 ? "Sí" : "No";
            }
            return "-";
          },
        },
        {
          attribute: "legalMetadata.article27",
          header: "Artículo 27",
          render: (value: boolean | null | undefined, record: any) => {
            if (record?.legalMetadata?.article27 !== undefined) {
              return record.legalMetadata.article27 ? "Sí" : "No";
            }
            return "-";
          },
        },
        {
          attribute: "legalMetadata.flexibilityHours",
          header: "Horas de Flexibilidad",
          render: (value: boolean | null | undefined, record: any) => {
            if (record?.legalMetadata?.flexibilityHours !== undefined) {
              return record.legalMetadata.flexibilityHours ? "Sí" : "No";
            }
            return "-";
          },
        },
        {
          attribute: "createdAt",
          header: "Fecha de Creación",
          render: (value: string | Date | null | undefined) => {
            if (!value) return "-";
            const dateStr =
              typeof value === "string" ? value : value.toISOString();
            return DateTime.fromISO(dateStr).toFormat("dd/MM/yyyy HH:mm:ss");
          },
        },
        {
          attribute: "updatedAt",
          header: "Fecha de Actualización",
          render: (value: string | Date | null | undefined) => {
            if (!value) return "-";
            const dateStr =
              typeof value === "string" ? value : value.toISOString();
            return DateTime.fromISO(dateStr).toFormat("dd/MM/yyyy HH:mm:ss");
          },
        },
      ];

      await generateExcel(
        data.data,
        EMPLOYEE_COLUMNS_EXCEL,
        "empleados",
        "Empleados",
      );
      toast({
        title: t("toast.excelSuccess.title"),
        variant: "default",
      });
    } catch (error) {
      console.error("Error downloading excel:", error);
      toast({
        title: t("toast.excelError.title"),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingExcel(false);
    }
  }, [data?.data, filteredBranches, filteredJobs, t, toast]);

  // Expose download function to parent component
  useEffect(() => {
    if (onDownloadExcelReady) {
      onDownloadExcelReady(handleDownloadExcel, isGeneratingExcel);
    }
  }, [handleDownloadExcel, isGeneratingExcel, onDownloadExcelReady]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-red-600 font-medium">{t("toast.loadError")}</p>
          <CHEKIOButton
            variant={ButtonVariant.PRIMARY}
            onClick={() => refetch()}
            className="mt-4"
          >
            {t("buttons.retry")}
          </CHEKIOButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 w-full">
      <form
        onSubmit={handleSubmit(onSubmitSearch)}
        className="border-b border-gray-200 bg-gray-50/50 px-5 py-4"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[160px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("filters.search")}
            </label>
            <Controller
              name="search"
              control={control}
              render={({ field }) => (
                <CHEKIOInput
                  {...field}
                  placeholder={t("filters.searchPlaceholder")}
                />
              )}
            />
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("filters.documentNumber")}
            </label>
            <Controller
              name="documentNumber"
              control={control}
              render={({ field }) => (
                <CHEKIOInput
                  {...field}
                  placeholder={t("filters.documentNumberPlaceholder")}
                />
              )}
            />
          </div>
          <div className="min-w-[180px]">
            <FilterJob
              key={`jobId-${formKey}`}
              control={control}
              value={jobId}
              onChange={(value) => handleLevelChange(value, "jobId")}
              onClear={() => setValue("jobId", undefined)}
            />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("filters.branch")}
            </label>
            <Controller
              key={`branchId-${formKey}`}
              name="branchId"
              control={control}
              render={({ field }) => (
                <CHEKIOSelect
                  value={field.value || undefined}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleLevelChange(value, "branchId");
                  }}
                >
                  <CHEKIOSelectTrigger>
                    <CHEKIOSelectValue
                      placeholder={t("filters.branchPlaceholder")}
                    />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    {filteredBranches.map((branch: any) => (
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
            <div className="min-w-0 w-full sm:flex-1 sm:min-w-[280px]">
              <OrganizationSelector
                key={`org-filter-${companyId}-${formKey}`}
                control={control}
                name="organizationId"
                companyId={companyId}
                layout="horizontal"
              />
            </div>
          )}
          <div className="flex gap-2 items-end">
            <CHEKIOButton
              variant={ButtonVariant.REFRESH}
              type="button"
              onClick={handleClearSearch}
            >
              <RefreshCw className="h-4 w-4" />
              {t("buttons.clear")}
            </CHEKIOButton>
            <CHEKIOButton variant={ButtonVariant.SEARCH} type="submit">
              <Search className="h-4 w-4" />
              {t("buttons.search")}
            </CHEKIOButton>
          </div>
        </div>
      </form>

      <div className="flex flex-col w-full">
        {isLoading ? (
          <>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[60px]">
                      <span className="flex items-center gap-2">
                        <ImageIcon
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.photo")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Hash
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.code")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[180px]">
                      <span className="flex items-center gap-2">
                        <User
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.name")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Hash
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.documentNumber")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[160px]">
                      <span className="flex items-center gap-2">
                        <Mail
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.email")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Building2
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.branch")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Calendar
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.startDate")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Calendar
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.endDate")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <FileText
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.contractType")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px] text-right">
                      {t("table.headers.actions")}
                    </CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {[...Array(pagination.pageSize)].map((_, index) => (
                    <CHEKIOTableRow key={index} index={index}>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                        </div>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>

            <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
                <div className="flex items-center gap-2">
                  <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
          </>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("table.noData")}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
              {t("table.noDataDescription")}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead className="min-w-[60px]">
                      <span className="flex items-center gap-2">
                        <ImageIcon
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.photo")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Hash
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.code")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[180px]">
                      <span className="flex items-center gap-2">
                        <User
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.name")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Hash
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.documentNumber")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[160px]">
                      <span className="flex items-center gap-2">
                        <Mail
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.email")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[120px]">
                      <span className="flex items-center gap-2">
                        <Building2
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.branch")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Calendar
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.startDate")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <Calendar
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.endDate")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px]">
                      <span className="flex items-center gap-2">
                        <FileText
                          className="h-4 w-4"
                          style={{ color: `${templateUser.primary}99` }}
                        />
                        {t("table.headers.contractType")}
                      </span>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="min-w-[100px] text-right">
                      {t("table.headers.actions")}
                    </CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {data.data.map((employee: any, index: number) => {
                    const branch = filteredBranches.find(
                      (branch: any) => branch.publicId === employee.branchId,
                    );
                    const gender = employee.gender;

                    return (
                      <CHEKIOTableRow key={employee.publicId} index={index}>
                        <CHEKIOTableCell className="px-5 py-3.5">
                          <div
                            className={`w-12 h-12 rounded-full border-3 ${getBorderColor(
                              gender,
                            )} overflow-hidden ${getPlaceholderBg(
                              gender,
                            )} flex items-center justify-center shadow-sm`}
                          >
                            {employee.photo ? (
                              <Image
                                src={employee.photo}
                                alt={`Foto de ${employee.firstName} ${employee.lastName}`}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover object-center"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  target.nextElementSibling?.classList.remove(
                                    "hidden",
                                  );
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-full h-full flex items-center justify-center rounded-full ${
                                employee.photo ? "hidden" : ""
                              }`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-6 w-6 ${getPlaceholderIconColor(
                                  gender,
                                )}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                          </div>
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 font-mono text-sm font-medium text-gray-900">
                          {employee.code}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 font-medium text-gray-900">
                          {[employee.firstName, employee.lastName]
                            .filter(Boolean)
                            .join(" ")}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {employee.documentNumber}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {employee.personalEmail}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {branch ? branch.name : "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {DateTime.fromISO(employee.startDate)
                            .toUTC()
                            .toFormat("dd/MM/yyyy")}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {employee.endDate
                            ? DateTime.fromISO(employee.endDate)
                                .toUTC()
                                .toFormat("dd/MM/yyyy")
                            : "-"}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-sm text-gray-600">
                          {employee.isIndefiniteTerm
                            ? t("table.contractType.indefinite")
                            : t("table.contractType.fixedTerm")}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/mantainers/employees/${employee.publicId}`,
                                )
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                              title={t("buttons.edit")}
                              aria-label={t("ariaLabels.editEmployee")}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenChangeCompanyModal(employee)
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                              title={t("buttons.changeCompany")}
                              aria-label={t("ariaLabels.changeCompany")}
                            >
                              <ArrowLeftRight className="h-4 w-4" />
                            </button>
                          </div>
                        </CHEKIOTableCell>
                      </CHEKIOTableRow>
                    );
                  })}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>

            {data.data.length > 0 && (
              <div className="flex flex-col border-t border-gray-200 bg-gray-50 px-5 py-4 md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {t("pagination.showing", {
                      current: data.data.length,
                      total: pagination.totalCount,
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      {t("pagination.recordsPerPage")}
                    </label>
                    <CHEKIOSelect
                      value={pagination.pageSize.toString()}
                      onValueChange={(value) => {
                        handlePageSizeChange(parseInt(value, 10));
                      }}
                    >
                      <CHEKIOSelectTrigger className="w-24">
                        <CHEKIOSelectValue />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        <CHEKIOSelectItem value="10">10</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="20">20</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="50">50</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="100">100</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="200">200</CHEKIOSelectItem>
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() =>
                      handlePaginationChange(
                        pagination.current - 1,
                        pagination.pageSize,
                      )
                    }
                    disabled={pagination.current === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("pagination.previous")}
                  </CHEKIOButton>
                  <span className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                    {t("pagination.page", {
                      current: pagination.current,
                      total: pagination.totalPages,
                    })}
                  </span>
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() =>
                      handlePaginationChange(
                        pagination.current + 1,
                        pagination.pageSize,
                      )
                    }
                    disabled={pagination.current >= pagination.totalPages}
                  >
                    {t("pagination.next")}
                    <ChevronRight className="h-4 w-4" />
                  </CHEKIOButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Change Company Modal */}
      {isChangeCompanyModalOpen && selectedEmployee && (
        <EmployeeChangeCompanyModal
          isOpen={isChangeCompanyModalOpen}
          onClose={handleCloseChangeCompanyModal}
          employee={selectedEmployee}
          onSuccess={handleChangeCompanySuccess}
        />
      )}
    </div>
  );
}
