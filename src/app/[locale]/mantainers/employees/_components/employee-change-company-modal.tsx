"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { useToast } from "@/hooks/use-toast";
import {
  useChangeEmployeeCompany,
  useGetCompanies,
} from "@/service/mantainer.service";
import { ErrorMessage } from "@hookform/error-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
}

interface EmployeeChangeCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    code: string;
    currentCompanyName: string;
  } | null;
  onSuccess: () => void;
}

const changeCompanySchema = z.object({
  newCompanyId: z.string().min(1, "Por favor seleccione la empresa de destino"),
});

type ChangeCompanyFormData = z.infer<typeof changeCompanySchema>;

export default function EmployeeChangeCompanyModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: EmployeeChangeCompanyModalProps) {
  const { toast } = useToast();
  const t = useTranslations("mantainers.employees");
  const { data: companiesData, isLoading } = useGetCompanies({
    page: 1,
    pageSize: 100,
    sort: "asc",
    selector: true,
  });

  const changeEmployeeCompany = useChangeEmployeeCompany();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangeCompanyFormData>({
    resolver: zodResolver(changeCompanySchema),
    defaultValues: {
      newCompanyId: "",
    },
  });

  // Transform companies data into options format, excluding current company
  const companyOptions =
    companiesData?.data
      .filter((company) => company.publicId !== employee?.id)
      .map((company) => ({
        value: company.publicId,
        label: company.businessName,
        key: company.publicId,
      })) || [];

  const onSubmit: SubmitHandler<ChangeCompanyFormData> = async (data) => {
    try {
      if (!employee) return;

      await changeEmployeeCompany.mutateAsync({
        employeeId: employee.id,
        newCompanyId: data.newCompanyId,
      });

      toast({
        title: t("changeCompany.toastSuccess.title"),
        description: t("changeCompany.toastSuccess.description", {
          name: `${employee.firstName} ${employee.lastName}`,
        }),
      });

      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: t("changeCompany.toastError.title"),
        description: t("changeCompany.toastError.description"),
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!employee) return null;

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("changeCompany.title")}
      size="lg"
    >
      <div className="space-y-6">
        {/* Header with icon */}
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-800">
            {t("changeCompany.title")}
          </h3>
        </div>

        {/* Employee Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">
            {t("changeCompany.employeeInfo")}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">{t("changeCompany.code")}</span>
              <span className="ml-2 font-medium">{employee.code}</span>
            </div>
            <div>
              <span className="text-gray-600">{t("changeCompany.name")}</span>
              <span className="ml-2 font-medium">
                {employee.firstName} {employee.lastName}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">
                {t("changeCompany.currentCompany")}
              </span>
              <span className="ml-2 font-medium text-blue-600">
                {employee.currentCompanyName}
              </span>
            </div>
          </div>
        </div>

        {/* Important Information Alert */}
        <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-800 mb-2">
                {t("changeCompany.importantInfo")}
              </h4>
              <div className="space-y-2 text-sm text-orange-700">
                <p>
                  <strong>Historial:</strong> {t("changeCompany.historyNote")}
                </p>
                <p>
                  <strong>Turnos:</strong> {t("changeCompany.shiftsNote")}
                </p>
                <p>
                  <strong>Horarios:</strong> {t("changeCompany.schedulesNote")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("changeCompany.destinationCompany")}
            </label>
            <Controller
              name="newCompanyId"
              control={control}
              render={({ field }) => (
                <CHEKIOSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading || isSubmitting}
                >
                  <CHEKIOSelectTrigger
                    className={errors.newCompanyId ? "border-red-500" : ""}
                  >
                    <CHEKIOSelectValue
                      placeholder={t(
                        "changeCompany.destinationCompanyPlaceholder",
                      )}
                    />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    {companyOptions.map((option) => (
                      <CHEKIOSelectItem key={option.value} value={option.value}>
                        {option.label}
                      </CHEKIOSelectItem>
                    ))}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
              )}
            />
            <ErrorMessage
              errors={errors}
              name="newCompanyId"
              render={({ message }) => (
                <p className="text-red-500 text-xs mt-1">{message}</p>
              )}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <CHEKIOButton
              variant={ButtonVariant.SECONDARY}
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t("buttons.cancel")}
            </CHEKIOButton>
            <CHEKIOButton
              variant={ButtonVariant.PRIMARY}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("buttons.processing")}</span>
                </>
              ) : (
                t("buttons.confirmChange")
              )}
            </CHEKIOButton>
          </div>
        </form>
      </div>
    </CHEKIOModal>
  );
}
