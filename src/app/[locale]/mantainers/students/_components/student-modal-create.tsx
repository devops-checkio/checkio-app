"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { CheckioInputDate } from "@/components/ui/checkio-input-date";
import { useCookieSession } from "@/context/useCookieSession";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateStudent,
  useGetBranches,
  useUpdateStudent,
} from "@/service/mantainer.service";
import { ErrorMessage } from "@hookform/error-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import countriesGeography from "../../branches/_data/country-geography.json";
import {
  DocumentType,
  DocumentTypeOptions,
  Gender,
  GenderOptions,
} from "./student.dto";

enum ButtonVariant {
  PRIMARY = "primary",
}

interface StudentModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  editingStudent: any | null;
  onSuccess: () => void;
}

export const studentSchema = z.object({
  firstName: z.string().min(1, "Por favor ingrese los nombres"),
  lastName: z.string().min(1, "Por favor ingrese el apellido paterno"),
  secondLastName: z.string().optional(),
  code: z.string().min(1, "Por favor ingrese la matrícula"),
  documentType: z.nativeEnum(DocumentType),
  documentNumber: z.string().min(1, "Por favor ingrese el número de documento"),
  personalEmail: z
    .string()
    .min(1, "Por favor ingrese el email personal")
    .email("Por favor ingrese un email válido"),
  personalPhone: z.string().min(1, "Por favor ingrese el teléfono personal"),
  birthDate: z.string().min(1, "Por favor ingrese la fecha de nacimiento"),
  gender: z.nativeEnum(Gender),
  branchId: z.string().min(1, "Por favor seleccione la sede"),
  country: z.string().optional(),
  lvl1: z.string().optional(),
  lvl2: z.string().optional(),
  lvl3: z.string().optional(),
  companyId: z.string().min(1),
  /** Solo se envía al backend en edición; en creación siempre activo */
  isActive: z.boolean(),
});

type StudentFormData = z.infer<typeof studentSchema>;

export default function StudentModalUpsert({
  isOpen,
  onClose,
  editingStudent,
  onSuccess,
}: StudentModalUpsertProps) {
  const t = useTranslations("mantainers.students");
  const { companyId } = useCookieSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: createStudent, isPending: isCreating } = useCreateStudent();
  const { mutate: updateStudent, isPending: isUpdating } = useUpdateStudent();

  const { data: branchesData } = useGetBranches(
    { companyId: companyId ?? "", pageSize: 200, page: 1, sort: "asc" },
    { enabled: !!companyId && isOpen },
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      secondLastName: "",
      code: "",
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
      companyId: companyId ?? "",
      isActive: true,
    },
  });

  const selectedCountryCode = useWatch({ control, name: "country" });
  const selectedNivel1Code = useWatch({ control, name: "lvl1" });
  const selectedNivel2Code = useWatch({ control, name: "lvl2" });
  const selectedNivel3Code = useWatch({ control, name: "lvl3" });
  const countries = useMemo(() => countriesGeography.countries ?? [], []);
  const selectedCountry = useMemo(
    () =>
      countries.find((country: any) => country.code === selectedCountryCode),
    [countries, selectedCountryCode],
  );
  const supportsNivel2 = (selectedCountry?.levels ?? []).includes("level2");
  const supportsNivel3 = (selectedCountry?.levels ?? []).includes("level3");
  const nivel1Options = selectedCountry?.level1 ?? [];
  const selectedNivel1 = nivel1Options.find(
    (level1: any) => level1.code === selectedNivel1Code,
  );
  const nivel2Options = supportsNivel2 ? (selectedNivel1?.level2 ?? []) : [];
  const selectedNivel2 = nivel2Options.find(
    (level2: any) => level2.code === selectedNivel2Code,
  );
  const nivel3Options = supportsNivel3
    ? ((selectedNivel2 as any)?.level3 ?? [])
    : [];

  useEffect(() => {
    if (editingStudent) {
      reset({
        firstName: editingStudent.firstName ?? "",
        lastName: editingStudent.lastName ?? "",
        secondLastName: editingStudent.secondLastName ?? "",
        code: editingStudent.code ?? "",
        documentType: editingStudent.documentType ?? DocumentType.RUT,
        documentNumber: editingStudent.documentNumber ?? "",
        personalEmail: editingStudent.personalEmail ?? "",
        personalPhone: editingStudent.personalPhone ?? "",
        birthDate: editingStudent.birthDate
          ? editingStudent.birthDate.split("T")[0]
          : "",
        gender: editingStudent.gender ?? Gender.MALE,
        branchId: editingStudent.branchId ?? "",
        country: editingStudent.country ?? "",
        lvl1: editingStudent.lvl1 ?? "",
        lvl2: editingStudent.lvl2 ?? "",
        lvl3: editingStudent.lvl3 ?? "",
        companyId: companyId ?? "",
        isActive: editingStudent.isActive ?? true,
      });
    } else {
      reset({
        firstName: "",
        lastName: "",
        secondLastName: "",
        code: "",
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
        companyId: companyId ?? "",
        isActive: true,
      });
    }
  }, [editingStudent, companyId, reset, isOpen]);

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

  const onSubmit: SubmitHandler<StudentFormData> = (data) => {
    if (editingStudent) {
      const {
        companyId: _companyId,
        documentType: _documentType,
        documentNumber: _documentNumber,
        ...updateFields
      } = data;
      updateStudent(
        { id: editingStudent.publicId, ...updateFields },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["GetStudents"] });
            queryClient.invalidateQueries({
              queryKey: ["GetStudent", editingStudent.publicId],
            });
            onSuccess();
            onClose();
          },
          onError: (error) => {
            const message = axios.isAxiosError(error)
              ? (error.response?.data?.message ?? t("toast.error.description"))
              : t("toast.error.description");
            toast({ title: t("toast.error.title"), description: message });
          },
        },
      );
    } else {
      const { isActive: _omitIsActive, ...createPayload } = data;
      createStudent(createPayload, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["GetStudents"] });
          onSuccess();
          onClose();
        },
        onError: (error) => {
          const message = axios.isAxiosError(error)
            ? (error.response?.data?.message ?? t("toast.error.description"))
            : t("toast.error.description");
          toast({ title: t("toast.error.title"), description: message });
        },
      });
    }
  };

  const isEditing = !!editingStudent;
  const isPending = isCreating || isUpdating;

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t("modal.editTitle") : t("modal.createTitle")}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Code / Matrícula */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("modal.fields.code")} *
            </label>
            <CHEKIOInput
              {...register("code")}
              placeholder={t("modal.placeholders.code")}
            />
            <ErrorMessage
              errors={errors}
              name="code"
              render={({ message }) => (
                <p className="text-red-500 text-xs mt-1">{message}</p>
              )}
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("modal.fields.documentType")} *
            </label>
            <Controller
              control={control}
              name="documentType"
              render={({ field }) => (
                <CHEKIOSelect
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <CHEKIOSelectTrigger>
                    <CHEKIOSelectValue
                      placeholder={t("modal.placeholders.selectDocumentType")}
                    />
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
            <ErrorMessage
              errors={errors}
              name="documentType"
              render={({ message }) => (
                <p className="text-red-500 text-xs mt-1">{message}</p>
              )}
            />
          </div>

          {/* Document Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("modal.fields.documentNumber")} *
            </label>
            <CHEKIOInput
              {...register("documentNumber")}
              placeholder={t("modal.placeholders.documentNumber")}
            />
            <ErrorMessage
              errors={errors}
              name="documentNumber"
              render={({ message }) => (
                <p className="text-red-500 text-xs mt-1">{message}</p>
              )}
            />
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("modal.fields.firstName")} *
            </label>
            <CHEKIOInput
              {...register("firstName")}
              placeholder={t("modal.placeholders.firstName")}
            />
            <ErrorMessage
              errors={errors}
              name="firstName"
              render={({ message }) => (
                <p className="text-red-500 text-xs mt-1">{message}</p>
              )}
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("modal.fields.lastName")} *
            </label>
            <CHEKIOInput
              {...register("lastName")}
              placeholder={t("modal.placeholders.lastName")}
            />
            <ErrorMessage
              errors={errors}
              name="lastName"
              render={({ message }) => (
                <p className="text-red-500 text-xs mt-1">{message}</p>
              )}
            />
          </div>

          {/* Second Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("modal.fields.secondLastName")}
            </label>
            <CHEKIOInput
              {...register("secondLastName")}
              placeholder={t("modal.placeholders.secondLastName")}
            />
          </div>

          {/* Personal Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("modal.fields.personalEmail")} *
            </label>
            <CHEKIOInput
              {...register("personalEmail")}
              type="email"
              placeholder={t("modal.placeholders.personalEmail")}
            />
            <ErrorMessage
              errors={errors}
              name="personalEmail"
              render={({ message }) => (
                <p className="text-red-500 text-xs mt-1">{message}</p>
              )}
            />
          </div>

          {/* Personal Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("modal.fields.personalPhone")} *
            </label>
            <CHEKIOInput
              {...register("personalPhone")}
              placeholder={t("modal.placeholders.personalPhone")}
            />
            <ErrorMessage
              errors={errors}
              name="personalPhone"
              render={({ message }) => (
                <p className="text-red-500 text-xs mt-1">{message}</p>
              )}
            />
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("modal.fields.birthDate")} *
            </label>
            <Controller
              control={control}
              name="birthDate"
              render={({ field }) => (
                <CheckioInputDate
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <ErrorMessage
              errors={errors}
              name="birthDate"
              render={({ message }) => (
                <p className="text-red-500 text-xs mt-1">{message}</p>
              )}
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("modal.fields.gender")} *
            </label>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <CHEKIOSelect
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <CHEKIOSelectTrigger>
                    <CHEKIOSelectValue
                      placeholder={t("modal.placeholders.selectGender")}
                    />
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
            <ErrorMessage
              errors={errors}
              name="gender"
              render={({ message }) => (
                <p className="text-red-500 text-xs mt-1">{message}</p>
              )}
            />
          </div>

          {/* Branch */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("modal.fields.branch")} *
            </label>
            <Controller
              control={control}
              name="branchId"
              render={({ field }) => (
                <CHEKIOSelect
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <CHEKIOSelectTrigger>
                    <CHEKIOSelectValue
                      placeholder={t("modal.placeholders.selectBranch")}
                    />
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
            <ErrorMessage
              errors={errors}
              name="branchId"
              render={({ message }) => (
                <p className="text-red-500 text-xs mt-1">{message}</p>
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

          {isEditing && (
            <div className="md:col-span-2 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {t("modal.fields.isActive")}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t("modal.fields.isActiveHint")}
                </p>
              </div>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <CHEKIOButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            {t("buttons.cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            type="submit"
            variant={ButtonVariant.PRIMARY}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t("buttons.save")
            )}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}
