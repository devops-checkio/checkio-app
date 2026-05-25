"use client";

import {
  CHEKIOActionButton,
  CHEKIOButton,
  CHEKIOLoading,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
  CHEKIOTab,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { Switch } from "@/components/ui/switch";
import { useCookieSession } from "@/context/useCookieSession";
import { useToast } from "@/hooks/use-toast";
import { documentValidators, formatDocumentType } from "@/lib/utils";
import {
  useDeleteManager,
  useDeleteSubordinate,
  useGetEmployee,
  useGetEmployeeManagers,
  useGetEmployeeSubordinates,
  useUpdateEmployee,
  useUploadEmployeePhoto,
} from "@/service/mantainer.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import React, { use, useEffect, useState } from "react";
import {
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { z } from "zod";
import ManagerModal from "../_components/manager-modal";
import SubordinatesModal from "../_components/subordinates-modal";
import PersonalCompanyHistory from "./sections/personal-company-history";
import PersonalContract from "./sections/personal-contract";
import PersonalData from "./sections/personal-data";
import PersonalHomeOffice from "./sections/personal-home-office";
import PersonalSummary from "./sections/personal-summary";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  DESTRUCTIVE = "destructive",
}

enum TabKey {
  SUMMARY = "summary",
  PERSONAL = "personal",
  COMPANY = "company",
  HOMEOFFICE = "homeoffice",
  CONFIGURATION = "configuration",
  MANAGERS = "managers",
  SUBORDINATES = "subordinates",
  COMPANY_HISTORY = "company-history",
}

function buildEmployeeSchema(t: (key: string) => string) {
  return z.object({
    firstName: z.string().min(1, t("detail.validation.firstNameRequired")),
    lastName: z.string().min(1, t("detail.validation.lastNameRequired")),
    secondLastName: z.string().optional(),
    address: z.string().min(1, t("detail.validation.addressRequired")),
    personalEmail: z
      .string()
      .email(t("detail.validation.personalEmailInvalid"))
      .min(1, t("detail.validation.personalEmailRequired")),
    personalPhone: z
      .string()
      .min(1, t("detail.validation.personalPhoneRequired")),
    gender: z.string().min(1, t("detail.validation.genderRequired")),
    birthDate: z.string().min(1, t("detail.validation.birthDateRequired")),

    code: z.string().min(1, t("detail.validation.codeRequired")),
    workEmail: z
      .union([
        z.string().email(t("detail.validation.personalEmailInvalid")),
        z.literal(""),
        z.null(),
      ])
      .nullish(),
    workPhone: z.union([z.string(), z.literal(""), z.null()]).nullish(),
    startDate: z.string().min(1, t("detail.validation.startDateRequired")),
    endDate: z.string().optional().or(z.literal("")).or(z.literal(null)),
    contractedHours: z
      .union([
        z.string().min(1, t("detail.validation.contractedHoursRequired")),
        z.number().min(1, t("detail.validation.contractedHoursRequired")),
      ])
      .transform((val) => (typeof val === "string" ? Number(val) : val)),
    branchId: z.string().min(1, t("detail.validation.branchRequired")),
    country: z.union([z.string(), z.literal(""), z.null()]).nullish(),
    lvl1: z.union([z.string(), z.literal(""), z.null()]).nullish(),
    lvl2: z.union([z.string(), z.literal(""), z.null()]).nullish(),
    lvl3: z.union([z.string(), z.literal(""), z.null()]).nullish(),
    jobId: z.string().min(1, t("detail.validation.jobRequired")),
    integrationCode: z.union([z.string(), z.literal(""), z.null()]).nullish(),
    isIndefiniteTerm: z.boolean(),
    isActive: z.boolean(),

    canCheckInOtherBranch: z.boolean(),
    requiresPassword: z.boolean(),
    canCheckWithoutShift: z.boolean(),
    canCheckAnywhere: z.boolean(),
    canCheckFromAnyBranch: z.boolean(),
    canCheckFromWeb: z.boolean(),

    documentType: z
      .string()
      .min(1, t("detail.validation.documentTypeRequired")),
    documentNumber: z
      .string()
      .min(1, t("detail.validation.documentNumberRequired")),
    photo: z.any().optional(),
    legalMetadata: z
      .object({
        article22: z.boolean().optional().nullable(),
        article27: z.boolean().optional().nullable(),
        flexibilityHours: z.boolean().optional().nullable(),
      })
      .optional()
      .nullable(),
    organizationId: z.string().optional(),
    subUnit1Id: z.string().optional(),
    subUnit2Id: z.string().optional(),
    subUnit3Id: z.string().optional(),
    subUnit4Id: z.string().optional(),
    subUnit5Id: z.string().optional(),
    subUnit6Id: z.string().optional(),
    subUnit7Id: z.string().optional(),
    subUnit8Id: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const docType = data.documentType;
    const docNumber = data.documentNumber;
    if (!docType || !docNumber) return;
    const validator =
      documentValidators[docType as keyof typeof documentValidators];
    if (validator && !validator(docNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t("detail.validation.documentInvalid"),
        path: ["documentNumber"],
      });
    }
  });
}

type EmployeeFormData = z.infer<ReturnType<typeof buildEmployeeSchema>>;

type Params = Promise<{ employeeId: string }>;

export default function EmployeeDetails(props: { params: Params }) {
  const router = useRouter();
  const { toast } = useToast();
  const { companyId: activeCompanyId } = useCookieSession();
  const params = use(props.params);
  const employeeId = params.employeeId;
  const [managers, setManagers] = useState<any[]>([]);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isInactivateModalOpen, setIsInactivateModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [managersPage, setManagersPage] = useState(1);
  const [managersPageSize, setManagersPageSize] = useState(10);
  const [subordinatesPage, setSubordinatesPage] = useState(1);
  const [subordinatesPageSize, setSubordinatesPageSize] = useState(10);

  const handleManagersPageSizeChange = (newPageSize: number) => {
    setManagersPageSize(newPageSize);
    setManagersPage(1); // Reset to first page when changing page size
  };

  const handleSubordinatesPageSizeChange = (newPageSize: number) => {
    setSubordinatesPageSize(newPageSize);
    setSubordinatesPage(1); // Reset to first page when changing page size
  };
  const { data: employee } = useGetEmployee(employeeId);
  const companyIdForWorkData = activeCompanyId || employee?.companyId || "";
  const { mutate: updateEmployee, isPending: isUpdatingEmployee } =
    useUpdateEmployee();
  const { mutateAsync: uploadEmployeePhoto } = useUploadEmployeePhoto();
  const {
    data: employeeManagersData,
    isLoading: isLoadingManagers,
    refetch: refetchManagers,
  } = useGetEmployeeManagers(employeeId, {
    page: managersPage,
    pageSize: managersPageSize,
    sort: "desc",
  });
  const {
    data: employeeSubordinatesData,
    isLoading: isLoadingSubordinates,
    refetch: refetchSubordinates,
  } = useGetEmployeeSubordinates(employeeId, {
    page: subordinatesPage,
    pageSize: subordinatesPageSize,
    sort: "desc",
  });
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [attendanceStats, setAttendanceStats] = useState({
    onTimePercentage: 0,
    latePercentage: 0,
    absencePercentage: 0,
    earlyDeparturePercentage: 0,
    totalAttendances: 0,
    hoursWorked: 0,
    expectedHours: 0,
    overtimeHours: 0,
    recentAttendances: [] as any[],
    monthlyAttendance: [] as any[],
    weekdayDistribution: [] as any[],
    hourlyDistribution: [] as any[],
    attendanceTrend: [] as any[],
  });
  const [isSubordinatesModalOpen, setIsSubordinatesModalOpen] = useState(false);
  const [subordinates, setSubordinates] = useState<any[]>([]);
  const queryClient = useQueryClient();
  const t = useTranslations("mantainers.employees");
  const employeeSchema = React.useMemo(
    () => buildEmployeeSchema((key) => t(key)),
    [t]
  );

  const defaultValues = React.useMemo(
    () => ({
      firstName: "",
      lastName: "",
      secondLastName: "",
      address: "",
      personalEmail: "",
      personalPhone: "",
      gender: "",
      birthDate: "",
      code: "",
      workEmail: "",
      workPhone: "",
      startDate: "",
      endDate: "",
      contractedHours: 45,
      branchId: "",
      country: "",
      lvl1: "",
      lvl2: "",
      lvl3: "",
      jobId: "",
      integrationCode: "",
      isIndefiniteTerm: false,
      isActive: true,
      canCheckInOtherBranch: false,
      requiresPassword: false,
      canCheckWithoutShift: true,
      canCheckAnywhere: false,
      canCheckFromAnyBranch: false,
      canCheckFromWeb: false,
      documentType: "",
      documentNumber: "",
      photo: null,
      organizationId: "",
      subUnit1Id: undefined as string | undefined,
      subUnit2Id: undefined as string | undefined,
      subUnit3Id: undefined as string | undefined,
      subUnit4Id: undefined as string | undefined,
      subUnit5Id: undefined as string | undefined,
      subUnit6Id: undefined as string | undefined,
      subUnit7Id: undefined as string | undefined,
      subUnit8Id: undefined as string | undefined,
      legalMetadata: {
        article22: false,
        article27: false,
        flexibilityHours: false,
      },
      EmployeeGeolocation: [],
    }),
    [],
  );
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [hasPhotoChanged, setHasPhotoChanged] = useState(false);
  // Fetch attendance statistics
  useEffect(() => {
    const fetchAttendanceStats = async () => {
      // Set sample data for demonstration
      setAttendanceStats({
        onTimePercentage: 85,
        latePercentage: 10,
        absencePercentage: 3,
        earlyDeparturePercentage: 2,
        totalAttendances: 120,
        hoursWorked: 168,
        expectedHours: 160,
        overtimeHours: 8,
        recentAttendances: [
          {
            date: "2023-06-01",
            checkIn: "08:55",
            checkOut: "18:05",
            status: "on-time",
          },
          {
            date: "2023-06-02",
            checkIn: "09:10",
            checkOut: "18:00",
            status: "late",
          },
          {
            date: "2023-06-05",
            checkIn: "08:50",
            checkOut: "18:00",
            status: "on-time",
          },
          {
            date: "2023-06-06",
            checkIn: "08:58",
            checkOut: "17:45",
            status: "early-departure",
          },
          {
            date: "2023-06-07",
            checkIn: null,
            checkOut: null,
            status: "absent",
          },
        ],
        monthlyAttendance: [
          { month: "Ene", onTime: 22, late: 1, absent: 0, earlyDeparture: 0 },
          { month: "Feb", onTime: 18, late: 2, absent: 1, earlyDeparture: 1 },
          { month: "Mar", onTime: 20, late: 2, absent: 0, earlyDeparture: 0 },
          { month: "Abr", onTime: 19, late: 3, absent: 0, earlyDeparture: 1 },
          { month: "May", onTime: 21, late: 1, absent: 1, earlyDeparture: 0 },
          { month: "Jun", onTime: 17, late: 2, absent: 0, earlyDeparture: 2 },
        ],
        weekdayDistribution: [
          { name: "Lunes", value: 95, fill: "#8884d8" },
          { name: "Martes", value: 90, fill: "#83a6ed" },
          { name: "Miércoles", value: 98, fill: "#8dd1e1" },
          { name: "Jueves", value: 85, fill: "#82ca9d" },
          { name: "Viernes", value: 88, fill: "#a4de6c" },
        ],
        hourlyDistribution: [
          { hour: "08:00", count: 5 },
          { hour: "08:30", count: 12 },
          { hour: "08:45", count: 8 },
          { hour: "09:00", count: 3 },
          { hour: "09:15", count: 1 },
          { hour: "09:30", count: 0 },
        ],
        attendanceTrend: [
          { date: "01/06", status: "on-time", hours: 8.5 },
          { date: "02/06", status: "late", hours: 8.0 },
          { date: "03/06", status: "weekend", hours: 0 },
          { date: "04/06", status: "weekend", hours: 0 },
          { date: "05/06", status: "on-time", hours: 8.5 },
          { date: "06/06", status: "early-departure", hours: 7.5 },
          { date: "07/06", status: "absent", hours: 0 },
          { date: "08/06", status: "on-time", hours: 9.0 },
          { date: "09/06", status: "on-time", hours: 8.5 },
          { date: "10/06", status: "weekend", hours: 0 },
          { date: "11/06", status: "weekend", hours: 0 },
          { date: "12/06", status: "on-time", hours: 8.5 },
          { date: "13/06", status: "on-time", hours: 8.5 },
          { date: "14/06", status: "late", hours: 8.0 },
        ],
      });
    };

    if (employeeId) {
      fetchAttendanceStats();
    }
  }, [employeeId]);

  const {
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(employeeSchema),
    defaultValues: defaultValues,
  });

  const geolocationArray = useFieldArray<
    any,
    "EmployeeGeolocation",
    "publicId"
  >({
    control,
    name: "EmployeeGeolocation",
  });

  const documentType = watch("documentType");
  const documentNumber = watch("documentNumber");
  const birthDate = watch("birthDate");
  const geolocation = watch("EmployeeGeolocation");
  const isIndefiniteTerm = watch("isIndefiniteTerm");

  useEffect(() => {
    if (employee) {
      const formattedEmployee = {
        ...defaultValues,
        ...employee,
        branchId: (employee as any).branchId ?? "",
        country: (employee as any).country ?? "",
        lvl1: (employee as any).lvl1 ?? "",
        lvl2: (employee as any).lvl2 ?? "",
        lvl3: (employee as any).lvl3 ?? "",
        jobId: (employee as any).jobId ?? "",
        legalMetadata:
          (employee as any).legalMetadata ?? defaultValues.legalMetadata,
        subUnit1Id: (employee as any).subUnit1Id || undefined,
        subUnit2Id: (employee as any).subUnit2Id || undefined,
        subUnit3Id: (employee as any).subUnit3Id || undefined,
        subUnit4Id: (employee as any).subUnit4Id || undefined,
        subUnit5Id: (employee as any).subUnit5Id || undefined,
        subUnit6Id: (employee as any).subUnit6Id || undefined,
        subUnit7Id: (employee as any).subUnit7Id || undefined,
        subUnit8Id: (employee as any).subUnit8Id || undefined,
        birthDate:
          typeof (employee as any).birthDate === "string"
            ? (employee as any).birthDate
            : (employee as any).birthDate
              ? DateTime.fromJSDate(
                  new Date((employee as any).birthDate),
                ).toISODate()
              : "",
        startDate:
          typeof (employee as any).startDate === "string"
            ? (employee as any).startDate
            : (employee as any).startDate
              ? DateTime.fromJSDate(
                  new Date((employee as any).startDate),
                ).toISODate()
              : "",
        endDate:
          (employee as any).endDate
            ? typeof (employee as any).endDate === "string"
              ? (employee as any).endDate
              : DateTime.fromJSDate(
                  new Date((employee as any).endDate),
                ).toISODate()
            : "",
      };

      reset(formattedEmployee);

      if ((employee as any).photo) {
        setImagePreview((employee as any).photo);
        setSelectedImageFile(null);
        setValue("photo", (employee as any).photo);
      } else {
        setImagePreview("");
        setSelectedImageFile(null);
        setValue("photo", null);
      }
      setHasPhotoChanged(false);
    }
  }, [employee, reset, defaultValues, setValue]);

  // Add useEffect for document formatting
  useEffect(() => {
    if (documentType && documentNumber) {
      const formattedValue =
        formatDocumentType[documentType as keyof typeof formatDocumentType]?.(
          documentNumber,
        );
      if (formattedValue) {
        setValue("documentNumber", formattedValue);
      }
    }
  }, [documentType, documentNumber, setValue]);

  const generateUUID = () => {
    if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
      return (crypto as any).randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: t("toast.photoInvalidFile.title"),
        description: t("toast.photoInvalidFile.description"),
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t("toast.photoTooLarge.title"),
        description: t("toast.photoTooLarge.description"),
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setSelectedImageFile(file);
      setValue("photo", file);
      setHasPhotoChanged(true);
    };

    reader.onerror = () => {
      toast({
        title: t("toast.photoReadError.title"),
        description: t("toast.photoReadError.description"),
        variant: "destructive",
      });
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setSelectedImageFile(null);
    setValue("photo", null);
    setHasPhotoChanged(true);
  };

  const onSubmit: SubmitHandler<any> = async (data) => {
    const birthDateIso = data.birthDate
      ? DateTime.fromISO(String(data.birthDate)).toUTC().toISODate()
      : undefined;
    const startDateIso = data.startDate
      ? DateTime.fromISO(String(data.startDate)).toUTC().toISODate()
      : undefined;
    const endDateIso = data.endDate
      ? DateTime.fromISO(String(data.endDate)).toUTC().toISODate()
      : null;

    const cleanedGeolocations = Array.isArray(geolocation)
      ? geolocation.map((location: any) => {
          const { id: _omit, ...rest } = location || {};
          return rest;
        })
      : [];

    try {
      let photoKey: string | null = null;

      if (hasPhotoChanged) {
        if (selectedImageFile) {
          const fileExtension = selectedImageFile.name.split(".").pop();
          const uniqueFileName = `${generateUUID()}.${fileExtension}`;

          const uploadData = await uploadEmployeePhoto({
            fileName: uniqueFileName,
            contentType: selectedImageFile.type,
          });

          const uploadResponse = await fetch(uploadData.uploadUrl, {
            method: "PUT",
            body: selectedImageFile,
            headers: {
              "Content-Type": selectedImageFile.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(
              `Failed to upload photo: ${uploadResponse.statusText}`,
            );
          }

          photoKey = uploadData.key;
        } else {
          photoKey = null;
        }
      }

      const { organizationId, ...dataWithoutOrgId } = data;
      const employeeData: any = {
        ...dataWithoutOrgId,
        legalMetadata: {
          article22: Boolean(data?.legalMetadata?.article22 ?? false),
          article27: Boolean(data?.legalMetadata?.article27 ?? false),
          flexibilityHours: Boolean(
            data?.legalMetadata?.flexibilityHours ?? false,
          ),
        },
        birthDate: birthDateIso,
        startDate: startDateIso,
        endDate: endDateIso,
        id: employeeId,
        EmployeeGeolocation: cleanedGeolocations,
      };

      if (hasPhotoChanged) {
        employeeData.photo = photoKey;
      }

      updateEmployee(employeeData, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["GetEmployees"] });
          queryClient.invalidateQueries({
            queryKey: ["GetEmployee", employeeId],
          });
          toast({
            title: "Empleado actualizado exitosamente",
            description: "El empleado ha sido actualizado correctamente",
          });
          router.push("/mantainers/employees");
        },
        onError: (error: any) => {
          if (axios.isAxiosError(error)) {
            toast({
              title: "Error al actualizar el empleado",
              description: error.response?.data.message,
            });
          }
        },
      });
    } catch (error) {
      toast({
        title: t("toast.photoError.title"),
        description: t("toast.photoError.description"),
        variant: "destructive",
      });
    }
  };

  const onInvalid = (formErrors: any) => {
    const firstError = Object.entries(formErrors)[0];
    if (firstError) {
      const [field, error] = firstError;
      const err = error as { message?: string };
      const message = err?.message || "Por favor corrija los errores en el formulario";
      toast({
        title: "Error de validación",
        description: `${String(field)}: ${message}`,
        variant: "destructive",
      });
    }
  };

  const getErrorCount = (fields: string[]) => {
    return Object.keys(errors).filter((key) => fields.includes(key)).length;
  };

  const personalErrors = getErrorCount([
    "firstName",
    "lastName",
    "documentType",
    "documentNumber",
    "address",
    "personalEmail",
    "personalPhone",
    "gender",
    "birthDate",
    "secondLastName",
  ]);

  const companyErrors = getErrorCount([
    "code",
    "startDate",
    "contractedHours",
    "branchId",
    "jobId",
    "workPhone",
    "integrationCode",
  ]);

  const homeofficeErrors = getErrorCount([
    "canCheckInOtherBranch",
    "requiresPassword",
    "canCheckWithoutShift",
    "canCheckAnywhere",
    "canCheckFromAnyBranch",
    "canCheckFromWeb",
  ]);

  const handleOpenManagerModal = (manager: any = null) => {
    setSelectedManager(manager);
    setIsManagerModalOpen(true);
  };

  const handleOpenInactivateModal = (manager: any) => {
    setSelectedManager(manager);
    setIsInactivateModalOpen(true);
  };

  const handleCloseInactivateModal = () => {
    setIsInactivateModalOpen(false);
    setSelectedManager(null);
  };

  const { mutate: deleteManager, isPending: isDeletingManager } =
    useDeleteManager();
  const { mutate: deleteSubordinate, isPending: isDeletingSubordinate } =
    useDeleteSubordinate();

  const isDeletingLink = isDeletingManager || isDeletingSubordinate;
  const isSubordinate = !!selectedManager?.employeeName;

  const handleInactivateManager = () => {
    if (!selectedManager) return;

    const onSuccess = () => {
      toast({
        title: "Éxito",
        description: isSubordinate
          ? "Subordinado inactivado correctamente"
          : "Jefe/Supervisor inactivado correctamente",
      });
      if (isSubordinate) refetchSubordinates();
      else refetchManagers();
      handleCloseInactivateModal();
    };

    const onError = (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast({
          title: "Error",
          description:
            error.response?.data.message ||
            (isSubordinate
              ? "Ocurrió un error al inactivar el subordinado"
              : "Ocurrió un error al inactivar el jefe/supervisor"),
        });
      }
    };

    if (isSubordinate) {
      deleteSubordinate(
        {
          id: employeeId,
          assignmentId: selectedManager.publicId,
        },
        { onSuccess, onError },
      );
    } else {
      deleteManager(
        {
          id: employeeId,
          managerId: selectedManager.publicId,
        },
        { onSuccess, onError },
      );
    }
  };

  const handleOpenSubordinatesModal = () => {
    setIsSubordinatesModalOpen(true);
  };

  const handleSubordinatesSuccess = () => {
    refetchSubordinates();
  };

  const [activeTab, setActiveTab] = useState<TabKey>(TabKey.PERSONAL);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col md:flex-row min-h-[600px]">
            {/* Tabs verticales a la izquierda */}
            <div className="flex-shrink-0 md:w-64 bg-gray-50 border-r border-gray-200 md:border-b-0 border-b">
              <div className="p-4 space-y-1">
                <CHEKIOButton
                  type="button"
                  variant="secondaryBlue"
                  className="h-9 w-9 p-0 rounded-lg flex items-center justify-center mb-3"
                  onClick={() => router.push("/mantainers/employees")}
                  aria-label="Volver a empleados"
                >
                  <ChevronLeft className="h-4 w-4" />
                </CHEKIOButton>
                {/* <CHEKIOTab
                  type="button"
                  active={activeTab === TabKey.SUMMARY}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(TabKey.SUMMARY);
                  }}
                  className="w-full justify-start border-b-0 border-l-4 rounded-none text-left"
                >
                  <div className="relative flex items-center text-sm w-full">
                    <span>Resumen</span>
                  </div>
                </CHEKIOTab> */}
                <CHEKIOTab
                  type="button"
                  active={activeTab === TabKey.PERSONAL}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(TabKey.PERSONAL);
                  }}
                  className="w-full justify-start border-b-0 border-l-4 rounded-none text-left"
                >
                  <div className="relative flex items-center text-sm w-full">
                    <span>{t("detail.personalData")}</span>
                    {personalErrors > 0 && (
                      <span className="ml-auto bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {personalErrors}
                      </span>
                    )}
                  </div>
                </CHEKIOTab>
                <CHEKIOTab
                  type="button"
                  active={activeTab === TabKey.COMPANY}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(TabKey.COMPANY);
                  }}
                  className="w-full justify-start border-b-0 border-l-4 rounded-none text-left"
                >
                  <div className="relative flex items-center text-sm w-full">
                    <span>{t("detail.workData")}</span>
                    {companyErrors > 0 && (
                      <span className="ml-auto bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {companyErrors}
                      </span>
                    )}
                  </div>
                </CHEKIOTab>
                <CHEKIOTab
                  type="button"
                  active={activeTab === TabKey.HOMEOFFICE}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(TabKey.HOMEOFFICE);
                  }}
                  className="w-full justify-start border-b-0 border-l-4 rounded-none text-left"
                >
                  <div className="relative flex items-center text-sm w-full">
                    <span>{t("detail.homeOffice.label")}</span>
                  </div>
                </CHEKIOTab>
                <CHEKIOTab
                  type="button"
                  active={activeTab === TabKey.CONFIGURATION}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(TabKey.CONFIGURATION);
                  }}
                  className="w-full justify-start border-b-0 border-l-4 rounded-none text-left"
                >
                  <div className="relative flex items-center text-sm w-full">
                    <span>{t("detail.attendanceConfig")}</span>
                    {homeofficeErrors > 0 && (
                      <span className="ml-auto bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {homeofficeErrors}
                      </span>
                    )}
                  </div>
                </CHEKIOTab>
                <CHEKIOTab
                  type="button"
                  active={activeTab === TabKey.MANAGERS}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(TabKey.MANAGERS);
                  }}
                  className="w-full justify-start border-b-0 border-l-4 rounded-none text-left"
                >
                  <div className="relative flex items-center text-sm w-full">
                    <span>{t("detail.managersAndSubstitutes")}</span>
                  </div>
                </CHEKIOTab>
                <CHEKIOTab
                  type="button"
                  active={activeTab === TabKey.SUBORDINATES}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(TabKey.SUBORDINATES);
                  }}
                  className="w-full justify-start border-b-0 border-l-4 rounded-none text-left"
                >
                  <div className="relative flex items-center text-sm w-full">
                    <span>{t("detail.subordinatesTab")}</span>
                  </div>
                </CHEKIOTab>
                <CHEKIOTab
                  type="button"
                  active={activeTab === TabKey.COMPANY_HISTORY}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(TabKey.COMPANY_HISTORY);
                  }}
                  className="w-full justify-start border-b-0 border-l-4 rounded-none text-left"
                >
                  <div className="relative flex items-center text-sm w-full">
                    <span>{t("detail.companyHistory")}</span>
                  </div>
                </CHEKIOTab>
              </div>
            </div>

            {/* Contenido de tabs */}
            <div className="flex-1 p-6 overflow-auto">
              {activeTab === TabKey.SUMMARY && employee && (
                <PersonalSummary
                  attendanceStats={attendanceStats}
                  employee={{
                    id: employee.publicId,
                    firstName: employee.firstName,
                    lastName: employee.lastName,
                    secondLastName: employee.secondLastName,
                    photo: (employee as any).photo,
                    code: employee.code,
                    branch: (employee as any).branch,
                    job: (employee as any).job,
                  }}
                />
              )}

              {activeTab === TabKey.PERSONAL && (
                <PersonalData
                  control={control}
                  errors={errors}
                  documentType={documentType}
                  setSelectedDocType={setSelectedDocType}
                  setValue={setValue}
                  employee={employee}
                  imagePreview={imagePreview}
                  onFileSelect={handleFileSelect}
                  onRemoveImage={handleRemoveImage}
                />
              )}

              {activeTab === TabKey.COMPANY && (
                <PersonalContract
                  control={control}
                  errors={errors}
                  watch={watch}
                  companyId={companyIdForWorkData}
                  setValue={setValue}
                />
              )}

              {activeTab === TabKey.HOMEOFFICE && (
                <PersonalHomeOffice
                  control={control}
                  errors={errors}
                  geolocationArray={geolocationArray}
                  employeeId={employeeId}
                />
              )}

              {activeTab === TabKey.CONFIGURATION && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="canCheckAnywhere"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <span>Puede marcar en cualquier lugar</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="canCheckFromWeb"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <span>Puede marcar desde web</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="canCheckFromAnyBranch"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <span>Puede marcar desde cualquier sucursal</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === TabKey.MANAGERS && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-end mb-4">
                    <CHEKIOButton
                      type="button"
                      variant={ButtonVariant.PRIMARY}
                      onClick={() => handleOpenManagerModal()}
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Supervisor/Suplente
                    </CHEKIOButton>
                  </div>
                  {isLoadingManagers ? (
                    <div className="flex justify-center py-8">
                      <CHEKIOLoading
                        size="lg"
                        variant="modern"
                        text="Cargando supervisor/suplentes..."
                      />
                    </div>
                  ) : employeeManagersData?.data &&
                    employeeManagersData.data.length > 0 ? (
                    <>
                      <CHEKIOTable>
                        <CHEKIOTableHeader>
                          <tr>
                            <CHEKIOTableHead>Nombre</CHEKIOTableHead>
                            <CHEKIOTableHead>
                              Número de Documento
                            </CHEKIOTableHead>
                            <CHEKIOTableHead>Tipo</CHEKIOTableHead>
                            <CHEKIOTableHead>Fecha Inicio</CHEKIOTableHead>
                            <CHEKIOTableHead>Fecha Fin</CHEKIOTableHead>
                            <CHEKIOTableHead>Días Restantes</CHEKIOTableHead>
                            <CHEKIOTableHead>Estado</CHEKIOTableHead>
                            <CHEKIOTableHead>Acciones</CHEKIOTableHead>
                          </tr>
                        </CHEKIOTableHeader>
                        <CHEKIOTableBody>
                          {employeeManagersData.data.map(
                            (manager: any, index: number) => (
                              <CHEKIOTableRow
                                key={manager.publicId}
                                index={index}
                              >
                                <CHEKIOTableCell>
                                  {manager.managerName}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {manager.documentNumber || "-"}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {manager.type === "MANAGER"
                                    ? "Supervisor"
                                    : "Suplente"}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {DateTime.fromISO(
                                    manager.startDate,
                                  ).toLocaleString(DateTime.DATE_FULL)}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {manager.endDate
                                    ? DateTime.fromISO(
                                        manager.endDate,
                                      ).toLocaleString(DateTime.DATE_FULL)
                                    : "Indefinido"}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {(() => {
                                    if (!manager.endDate || !manager.startDate)
                                      return "N/A";
                                    const today = DateTime.now();
                                    const end = DateTime.fromISO(
                                      manager.endDate,
                                    );
                                    if (end < today) return "Finalizado";
                                    const daysRemaining = Math.ceil(
                                      end.diff(today, "days").days,
                                    );
                                    return daysRemaining > 0
                                      ? `${daysRemaining} días`
                                      : "Hoy finaliza";
                                  })()}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {manager.isActive ? "Activo" : "Inactivo"}
                                </CHEKIOTableCell>
                                <CHEKIOTableCell>
                                  {manager.isActive && (
                                    <CHEKIOActionButton
                                      variant="delete"
                                      onClick={() =>
                                        handleOpenInactivateModal(manager)
                                      }
                                      aria-label="Inactivar"
                                      className="h-auto w-auto px-3 py-1.5 gap-1.5"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span>Eliminar</span>
                                    </CHEKIOActionButton>
                                  )}
                                </CHEKIOTableCell>
                              </CHEKIOTableRow>
                            ),
                          )}
                        </CHEKIOTableBody>
                      </CHEKIOTable>

                      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            Mostrando {employeeManagersData.data.length} de{" "}
                            {employeeManagersData.pagination.totalCount}{" "}
                            supervisor/suplentes
                          </div>
                          {/* Selector de registros por página */}
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                              Registros por página:
                            </label>
                            <CHEKIOSelect
                              value={managersPageSize.toString()}
                              onValueChange={(value) => {
                                handleManagersPageSizeChange(
                                  parseInt(value, 10),
                                );
                              }}
                            >
                              <CHEKIOSelectTrigger className="w-24">
                                <CHEKIOSelectValue />
                              </CHEKIOSelectTrigger>
                              <CHEKIOSelectContent>
                                <CHEKIOSelectItem value="10">
                                  10
                                </CHEKIOSelectItem>
                                <CHEKIOSelectItem value="20">
                                  20
                                </CHEKIOSelectItem>
                                <CHEKIOSelectItem value="50">
                                  50
                                </CHEKIOSelectItem>
                                <CHEKIOSelectItem value="100">
                                  100
                                </CHEKIOSelectItem>
                                <CHEKIOSelectItem value="200">
                                  200
                                </CHEKIOSelectItem>
                              </CHEKIOSelectContent>
                            </CHEKIOSelect>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CHEKIOButton
                            variant="secondaryBlue"
                            onClick={() => setManagersPage(managersPage - 1)}
                            disabled={managersPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </CHEKIOButton>
                          <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                            Página {employeeManagersData.pagination.current} de{" "}
                            {employeeManagersData.pagination.totalPages}
                          </div>
                          <CHEKIOButton
                            variant="secondaryBlue"
                            onClick={() => setManagersPage(managersPage + 1)}
                            disabled={
                              managersPage >=
                              employeeManagersData.pagination.totalPages
                            }
                          >
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                          </CHEKIOButton>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-600 font-medium">
                        No hay supervisor/suplentes asignados
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === TabKey.SUBORDINATES && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-end mb-4">
                    <CHEKIOButton
                      type="button"
                      variant={ButtonVariant.PRIMARY}
                      onClick={handleOpenSubordinatesModal}
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Subordinados
                    </CHEKIOButton>
                  </div>
                  {isLoadingSubordinates ? (
                    <div className="flex justify-center py-8">
                      <CHEKIOLoading
                        size="lg"
                        variant="modern"
                        text="Cargando subordinados..."
                      />
                    </div>
                  ) : employeeSubordinatesData?.data !== undefined ? (
                    <>
                      <CHEKIOTable>
                        <CHEKIOTableHeader>
                          <tr>
                            <CHEKIOTableHead>Nombre</CHEKIOTableHead>
                            <CHEKIOTableHead>Tipo</CHEKIOTableHead>
                            <CHEKIOTableHead>Fecha Inicio</CHEKIOTableHead>
                            <CHEKIOTableHead>Fecha Fin</CHEKIOTableHead>
                            <CHEKIOTableHead>Días Restantes</CHEKIOTableHead>
                            <CHEKIOTableHead>Estado</CHEKIOTableHead>
                            <CHEKIOTableHead>Acciones</CHEKIOTableHead>
                          </tr>
                        </CHEKIOTableHeader>
                        <CHEKIOTableBody>
                          {employeeSubordinatesData.data.length > 0 ? (
                            employeeSubordinatesData.data.map(
                              (subordinate: any, index: number) => (
                                <CHEKIOTableRow
                                  key={subordinate.publicId}
                                  index={index}
                                >
                                  <CHEKIOTableCell>
                                    {subordinate.employeeName}
                                  </CHEKIOTableCell>
                                  <CHEKIOTableCell>
                                    {subordinate.type === "MANAGER"
                                      ? "Jefe"
                                      : "Supervisor"}
                                  </CHEKIOTableCell>
                                  <CHEKIOTableCell>
                                    {DateTime.fromISO(
                                      subordinate.startDate,
                                    ).toLocaleString(DateTime.DATE_FULL)}
                                  </CHEKIOTableCell>
                                  <CHEKIOTableCell>
                                    {subordinate.endDate
                                      ? DateTime.fromISO(
                                          subordinate.endDate,
                                        ).toLocaleString(DateTime.DATE_FULL)
                                      : "Indefinido"}
                                  </CHEKIOTableCell>
                                  <CHEKIOTableCell>
                                    {(() => {
                                      if (
                                        !subordinate.endDate ||
                                        !subordinate.startDate
                                      )
                                        return "N/A";
                                      const today = DateTime.now();
                                      const end = DateTime.fromISO(
                                        subordinate.endDate,
                                      );
                                      if (end < today) return "Finalizado";
                                      const daysRemaining = Math.ceil(
                                        end.diff(today, "days").days,
                                      );
                                      return daysRemaining > 0
                                        ? `${daysRemaining} días`
                                        : "Hoy finaliza";
                                    })()}
                                  </CHEKIOTableCell>
                                  <CHEKIOTableCell>
                                    {subordinate.isActive
                                      ? "Activo"
                                      : "Inactivo"}
                                  </CHEKIOTableCell>
                                  <CHEKIOTableCell>
                                    {subordinate.isActive && (
                                      <CHEKIOActionButton
                                        variant="delete"
                                        onClick={() =>
                                          handleOpenInactivateModal(subordinate)
                                        }
                                        aria-label="Inactivar"
                                        className="h-auto w-auto px-3 py-1.5 gap-1.5"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span>Eliminar</span>
                                      </CHEKIOActionButton>
                                    )}
                                  </CHEKIOTableCell>
                                </CHEKIOTableRow>
                              ),
                            )
                          ) : (
                            <CHEKIOTableRow index={0}>
                              <CHEKIOTableCell
                                colSpan={7}
                                className="text-center py-10"
                              >
                                <p className="text-gray-600 font-medium">
                                  No hay subordinados asignados
                                </p>
                              </CHEKIOTableCell>
                            </CHEKIOTableRow>
                          )}
                        </CHEKIOTableBody>
                      </CHEKIOTable>

                      {employeeSubordinatesData.data.length > 0 && (
                        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600">
                              Mostrando {employeeSubordinatesData.data.length}{" "}
                              de{" "}
                              {employeeSubordinatesData.pagination.totalCount}{" "}
                              subordinados
                            </div>
                            {/* Selector de registros por página */}
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                Registros por página:
                              </label>
                              <CHEKIOSelect
                                value={subordinatesPageSize.toString()}
                                onValueChange={(value) => {
                                  handleSubordinatesPageSizeChange(
                                    parseInt(value, 10),
                                  );
                                }}
                              >
                                <CHEKIOSelectTrigger className="w-24">
                                  <CHEKIOSelectValue />
                                </CHEKIOSelectTrigger>
                                <CHEKIOSelectContent>
                                  <CHEKIOSelectItem value="10">
                                    10
                                  </CHEKIOSelectItem>
                                  <CHEKIOSelectItem value="20">
                                    20
                                  </CHEKIOSelectItem>
                                  <CHEKIOSelectItem value="50">
                                    50
                                  </CHEKIOSelectItem>
                                  <CHEKIOSelectItem value="100">
                                    100
                                  </CHEKIOSelectItem>
                                  <CHEKIOSelectItem value="200">
                                    200
                                  </CHEKIOSelectItem>
                                </CHEKIOSelectContent>
                              </CHEKIOSelect>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CHEKIOButton
                              variant="secondaryBlue"
                              onClick={() =>
                                setSubordinatesPage(subordinatesPage - 1)
                              }
                              disabled={subordinatesPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Anterior
                            </CHEKIOButton>
                            <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                              Página{" "}
                              {employeeSubordinatesData.pagination.current} de{" "}
                              {employeeSubordinatesData.pagination.totalPages}
                            </div>
                            <CHEKIOButton
                              variant="secondaryBlue"
                              onClick={() =>
                                setSubordinatesPage(subordinatesPage + 1)
                              }
                              disabled={
                                subordinatesPage >=
                                employeeSubordinatesData.pagination.totalPages
                              }
                            >
                              Siguiente
                              <ChevronRight className="h-4 w-4" />
                            </CHEKIOButton>
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              )}

              {activeTab === TabKey.COMPANY_HISTORY && (
                <PersonalCompanyHistory employeeId={employeeId} />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <CHEKIOButton
            type="button"
            variant={ButtonVariant.PRIMARY}
            onClick={() => {
              handleSubmit(onSubmit, onInvalid)();
            }}
            disabled={isUpdatingEmployee}
          >
            {isUpdatingEmployee ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </CHEKIOButton>
        </div>
      </form>

      {isManagerModalOpen && (
        <ManagerModal
          isOpen={isManagerModalOpen}
          onClose={() => setIsManagerModalOpen(false)}
          employeeId={employeeId}
          manager={selectedManager}
          onSuccess={() => {
            setIsManagerModalOpen(false);
            refetchManagers();
          }}
          companyId={companyIdForWorkData}
        />
      )}

      {isInactivateModalOpen && selectedManager && (
        <CHEKIOModal
          isOpen={isInactivateModalOpen}
          onClose={handleCloseInactivateModal}
          title={
            isSubordinate ? "Inactivar Subordinado" : "Inactivar Jefe/Supervisor"
          }
          size="md"
        >
          <div className="py-4">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <p className="text-gray-700">
                  {isSubordinate ? (
                    <>
                      Está a punto de inactivar a{" "}
                      <strong>{selectedManager.employeeName}</strong> como
                      subordinado.
                    </>
                  ) : (
                    <>
                      Está a punto de inactivar a{" "}
                      <strong>{selectedManager.managerName}</strong> como
                      <strong>
                        {" "}
                        {selectedManager.type === "MANAGER"
                          ? "Jefe"
                          : "Supervisor"}
                      </strong>
                      .
                    </>
                  )}
                </p>
              </div>

              {selectedManager.endDate && (
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-4">
                  <p className="text-sm text-yellow-700">
                    <strong>Nota:</strong> Este vínculo tiene una fecha de
                    finalización programada
                    {(() => {
                      if (!selectedManager.endDate) return "";

                      const today = DateTime.now();
                      const end = DateTime.fromISO(selectedManager.endDate);

                      if (end < today) return " que ya ha pasado.";

                      const daysRemaining = Math.ceil(
                        end.diff(today, "days").days,
                      );
                      return daysRemaining > 0
                        ? ` y finalizará automáticamente en ${daysRemaining} días.`
                        : " y finalizará hoy.";
                    })()}
                  </p>
                </div>
              )}

              <p className="text-gray-700 mb-4">
                ¿Está seguro que desea continuar? Esta acción no puede ser
                revertida.
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <CHEKIOButton
                variant={ButtonVariant.SECONDARY}
                onClick={handleCloseInactivateModal}
              >
                Cancelar
              </CHEKIOButton>
              <CHEKIOButton
                variant={ButtonVariant.DESTRUCTIVE}
                onClick={handleInactivateManager}
                disabled={isDeletingLink}
              >
                {isDeletingLink ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Inactivando...</span>
                  </>
                ) : (
                  "Sí, inactivar"
                )}
              </CHEKIOButton>
            </div>
          </div>
        </CHEKIOModal>
      )}

      <SubordinatesModal
        isOpen={isSubordinatesModalOpen}
        onClose={() => setIsSubordinatesModalOpen(false)}
        employeeId={employeeId}
        onSuccess={handleSubordinatesSuccess}
      />
    </div>
  );
}
