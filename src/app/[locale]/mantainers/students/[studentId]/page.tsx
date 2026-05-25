"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOLoading,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { CheckioInputDate } from "@/components/ui/checkio-input-date";
import { useCookieSession } from "@/context/useCookieSession";
import { DocumentType, Gender } from "@/dto/employees/employee.enums";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { useToast } from "@/hooks/use-toast";
import {
  useGetStudent,
  useGetBranches,
  useUpdateStudent,
} from "@/service/mantainer.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import {
  Controller,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { z } from "zod";
import {
  DocumentTypeOptions,
  GenderOptions,
} from "../_components/student.dto";
import countriesGeography from "../../branches/_data/country-geography.json";
import AttendanceSection from "./sections/attendance-section";
import ConsentsSection from "./sections/consents-section";

enum TabKey {
  PERSONAL = "personal",
  ATTENDANCE = "attendance",
  CONSENTS = "consents",
}

const studentDetailSchema = z.object({
  code: z.string().min(1, "Por favor ingrese la matrícula"),
  firstName: z.string().min(1, "Por favor ingrese los nombres"),
  lastName: z.string().min(1, "Por favor ingrese el apellido paterno"),
  secondLastName: z.string().optional(),
  documentType: z.nativeEnum(DocumentType),
  documentNumber: z.string().min(1),
  personalEmail: z.string().email().min(1),
  personalPhone: z.string().min(1),
  birthDate: z.string().min(1),
  gender: z.nativeEnum(Gender),
  branchId: z.string().min(1),
  country: z.string().optional(),
  lvl1: z.string().optional(),
  lvl2: z.string().optional(),
  lvl3: z.string().optional(),
  isActive: z.boolean(),
});

type StudentDetailFormData = z.infer<typeof studentDetailSchema>;

function StudentDetailContent({ studentId }: { studentId: string }) {
  const router = useRouter();
  const t = useTranslations("mantainers.students");
  const { companyId, canUpdate } = useCookieSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>(TabKey.PERSONAL);

  const { data: student, isLoading } = useGetStudent(studentId);
  const { mutate: updateStudent, isPending: isSaving } = useUpdateStudent();

  const { data: branchesData } = useGetBranches(
    { companyId: companyId ?? "", pageSize: 200, page: 1, sort: "asc" },
    { enabled: !!companyId },
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StudentDetailFormData>({
    resolver: zodResolver(studentDetailSchema),
    defaultValues: {
      code: "",
      firstName: "",
      lastName: "",
      secondLastName: "",
      documentType: DocumentType.RUT,
      documentNumber: "",
      personalEmail: "",
      personalPhone: "",
      birthDate: "",
      gender: Gender.MALE,
      branchId: "",
      country: "",
      lvl1: "",
      lvl2: "",
      lvl3: "",
      isActive: true,
    },
  });
  const selectedCountryCode = useWatch({ control, name: "country" });
  const selectedNivel1Code = useWatch({ control, name: "lvl1" });
  const selectedNivel2Code = useWatch({ control, name: "lvl2" });
  const selectedNivel3Code = useWatch({ control, name: "lvl3" });
  const countries = useMemo(() => countriesGeography.countries ?? [], []);
  const selectedCountry = useMemo(
    () => countries.find((country: any) => country.code === selectedCountryCode),
    [countries, selectedCountryCode],
  );
  const supportsNivel2 = (selectedCountry?.levels ?? []).includes("level2");
  const supportsNivel3 = (selectedCountry?.levels ?? []).includes("level3");
  const nivel1Options = selectedCountry?.level1 ?? [];
  const selectedNivel1 = nivel1Options.find(
    (level1: any) => level1.code === selectedNivel1Code,
  );
  const nivel2Options = supportsNivel2 ? selectedNivel1?.level2 ?? [] : [];
  const selectedNivel2 = nivel2Options.find(
    (level2: any) => level2.code === selectedNivel2Code,
  );
  const nivel3Options = supportsNivel3 ? (selectedNivel2 as any)?.level3 ?? [] : [];

  useEffect(() => {
    if (student) {
      reset({
        code: student.code ?? "",
        firstName: student.firstName ?? "",
        lastName: student.lastName ?? "",
        secondLastName: student.secondLastName ?? "",
        documentType: student.documentType ?? DocumentType.RUT,
        documentNumber: student.documentNumber ?? "",
        personalEmail: student.personalEmail ?? "",
        personalPhone: student.personalPhone ?? "",
        birthDate: student.birthDate ? student.birthDate.split("T")[0] : "",
        gender: student.gender ?? Gender.MALE,
        branchId: student.branchId ?? "",
        country: student.country ?? "",
        lvl1: student.lvl1 ?? "",
        lvl2: student.lvl2 ?? "",
        lvl3: student.lvl3 ?? "",
        isActive: student.isActive ?? true,
      });
    }
  }, [student, reset]);

  useEffect(() => {
    if (!selectedCountryCode) {
      setValue("lvl1", "");
      setValue("lvl2", "");
      setValue("lvl3", "");
    }
  }, [selectedCountryCode, setValue]);

  useEffect(() => {
    const currentLvl2 = selectedNivel2Code ?? "";
    const isLvl2Valid =
      currentLvl2 === "" ||
      nivel2Options.some(
        (level: any) => (level.code ?? level.name) === currentLvl2,
      );

    if (!isLvl2Valid) {
      setValue("lvl2", "");
      setValue("lvl3", "");
    }
  }, [selectedNivel1Code, selectedNivel2Code, nivel2Options, setValue]);

  useEffect(() => {
    const currentLvl3 = selectedNivel3Code ?? "";
    const isLvl3Valid =
      currentLvl3 === "" ||
      nivel3Options.some(
        (level: any) => (level.code ?? level.name) === currentLvl3,
      );

    if (!isLvl3Valid) {
      setValue("lvl3", "");
    }
  }, [selectedNivel2Code, selectedNivel3Code, nivel3Options, setValue]);

  const onSubmit: SubmitHandler<StudentDetailFormData> = (data) => {
    const {
      documentType: _documentType,
      documentNumber: _documentNumber,
      ...updateFields
    } = data;
    updateStudent(
      { id: studentId, ...updateFields },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["GetStudent", studentId] });
          queryClient.invalidateQueries({ queryKey: ["GetStudents"] });
          toast({
            title: t("toast.updateSuccess.title"),
            description: t("toast.updateSuccess.description"),
          });
        },
        onError: (error) => {
          const message = axios.isAxiosError(error)
            ? error.response?.data?.message ?? t("toast.error.description")
            : t("toast.error.description");
          toast({ title: t("toast.error.title"), description: message });
        },
      },
    );
  };

  if (isLoading) return <CHEKIOLoading />;

  const canEdit = canUpdate(OrganizationPermissionCode.STUDENT_MAINTENANCE);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-gray-200">
        <button
          onClick={() => router.push("/mantainers/students")}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {student
              ? `${student.firstName} ${student.lastName}${student.secondLastName ? ` ${student.secondLastName}` : ""}`
              : "..."}
          </h1>
          {student && (
            <p className="text-sm text-gray-500">
              {t("table.headers.code")}: {student.code} &middot;{" "}
              {student.documentType} {student.documentNumber}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6">
        {[TabKey.PERSONAL, TabKey.ATTENDANCE, TabKey.CONSENTS].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t(`detail.tabs.${tab === TabKey.PERSONAL ? "personalData" : tab === TabKey.ATTENDANCE ? "attendance" : "consents"}`)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === TabKey.PERSONAL && (
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("detail.personalData.fields.code")}
                </label>
                <CHEKIOInput
                  {...register("code")}
                  disabled={!canEdit}
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("detail.personalData.fields.documentType")}
                </label>
                <Controller
                  control={control}
                  name="documentType"
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!canEdit}
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        {DocumentTypeOptions.map((opt) => (
                          <CHEKIOSelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>

              {/* Document Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("detail.personalData.fields.documentNumber")}
                </label>
                <CHEKIOInput
                  {...register("documentNumber")}
                  disabled={!canEdit}
                />
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("detail.personalData.fields.firstName")}
                </label>
                <CHEKIOInput
                  {...register("firstName")}
                  disabled={!canEdit}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("detail.personalData.fields.lastName")}
                </label>
                <CHEKIOInput
                  {...register("lastName")}
                  disabled={!canEdit}
                />
              </div>

              {/* Second Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("detail.personalData.fields.secondLastName")}
                </label>
                <CHEKIOInput
                  {...register("secondLastName")}
                  disabled={!canEdit}
                />
              </div>

              {/* Personal Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("detail.personalData.fields.personalEmail")}
                </label>
                <CHEKIOInput
                  {...register("personalEmail")}
                  type="email"
                  disabled={!canEdit}
                />
              </div>

              {/* Personal Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("detail.personalData.fields.personalPhone")}
                </label>
                <CHEKIOInput
                  {...register("personalPhone")}
                  disabled={!canEdit}
                />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("detail.personalData.fields.birthDate")}
                </label>
                <Controller
                  control={control}
                  name="birthDate"
                  render={({ field }) => (
                    <CheckioInputDate
                      value={field.value}
                      onChange={field.onChange}
                      disabled={!canEdit}
                    />
                  )}
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("detail.personalData.fields.gender")}
                </label>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!canEdit}
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        {GenderOptions.map((opt) => (
                          <CHEKIOSelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>

              {/* Branch */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("detail.personalData.fields.branch")}
                </label>
                <Controller
                  control={control}
                  name="branchId"
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!canEdit}
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        {branchesData?.data?.map((branch) => (
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País
                </label>
                <Controller
                  control={control}
                  name="country"
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={!canEdit}
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue placeholder="Seleccione un país" />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        {countries.map((country: any) => (
                          <CHEKIOSelectItem key={country.code} value={country.code}>
                            {country.name}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel 1
                </label>
                <Controller
                  control={control}
                  name="lvl1"
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={!canEdit}
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue placeholder="Seleccione nivel 1" />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        {nivel1Options.map((level: any) => (
                          <CHEKIOSelectItem key={level.code} value={level.code}>
                            {level.name}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>

              {supportsNivel2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel 2
                  </label>
                  <Controller
                    control={control}
                    name="lvl2"
                    render={({ field }) => (
                      <CHEKIOSelect
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        disabled={!canEdit}
                      >
                        <CHEKIOSelectTrigger>
                          <CHEKIOSelectValue placeholder="Seleccione nivel 2" />
                        </CHEKIOSelectTrigger>
                        <CHEKIOSelectContent>
                          {nivel2Options.map((level: any, index: number) => (
                            <CHEKIOSelectItem
                              key={`${level.code ?? level.name}-${index}`}
                              value={level.code ?? level.name}
                            >
                              {level.name}
                            </CHEKIOSelectItem>
                          ))}
                        </CHEKIOSelectContent>
                      </CHEKIOSelect>
                    )}
                  />
                </div>
              )}

              {supportsNivel3 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel 3
                  </label>
                  <Controller
                    control={control}
                    name="lvl3"
                    render={({ field }) => (
                      <CHEKIOSelect
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        disabled={!canEdit}
                      >
                        <CHEKIOSelectTrigger>
                          <CHEKIOSelectValue placeholder="Seleccione nivel 3" />
                        </CHEKIOSelectTrigger>
                        <CHEKIOSelectContent>
                          {nivel3Options.map((level: any, index: number) => (
                            <CHEKIOSelectItem
                              key={`${level.code ?? level.name}-${index}`}
                              value={level.code ?? level.name}
                            >
                              {level.name}
                            </CHEKIOSelectItem>
                          ))}
                        </CHEKIOSelectContent>
                      </CHEKIOSelect>
                    )}
                  />
                </div>
              )}
            </div>

            {canEdit && (
              <div className="flex justify-end pt-2">
                <CHEKIOButton
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {t("buttons.save")}
                </CHEKIOButton>
              </div>
            )}
          </form>
        )}

        {activeTab === TabKey.ATTENDANCE && student && (
          <AttendanceSection employeeId={studentId} />
        )}

        {activeTab === TabKey.CONSENTS && student && (
          <ConsentsSection employeeId={studentId} />
        )}
      </div>
    </div>
  );
}

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);

  return (
    <AccessNotGranted
      OrganizationPermissionCode={OrganizationPermissionCode.STUDENT_MAINTENANCE}
    >
      <StudentDetailContent studentId={studentId} />
    </AccessNotGranted>
  );
}
