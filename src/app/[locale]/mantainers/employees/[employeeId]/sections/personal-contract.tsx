import {
  CHEKIOInput,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { CheckioInputDate } from "@/components/ui/checkio-input-date";
import { Switch } from "@/components/ui/switch";
import { useGetBranches, useGetJobs } from "@/service/mantainer.service";
import { ErrorMessage } from "@hookform/error-message";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormWatch,
} from "react-hook-form";
import OrganizationSelector from "../../_components/organization-selector";

interface PersonalContractProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
  companyId: string;
  setValue: any;
}

// Helper function to convert locale to CheckioInputDate locale
const getDatePickerLocale = (locale: string): "es" | "en" | "fr" | "pt" => {
  switch (locale) {
    case "en":
      return "en";
    case "fr":
      return "fr";
    case "pt":
      return "pt";
    case "es":
    default:
      return "es";
  }
};

const PersonalContract = ({
  control,
  errors,
  watch,
  companyId,
  setValue,
}: PersonalContractProps) => {
  const params = useParams();
  const t = useTranslations("mantainers.employees");
  const currentLocale = getDatePickerLocale(params.locale as string);
  const { data: jobs } = useGetJobs(
    {
      page: 1,
      pageSize: 1000,
      sort: "asc",
      companyId: companyId || undefined,
    },
    {
      enabled: !!companyId,
    },
  );

  const { data: branches } = useGetBranches(
    {
      page: 1,
      pageSize: 100,
      sort: "asc",
      companyId: companyId || undefined,
    },
    {
      enabled: !!companyId,
    },
  );


  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("upsert.fields.code")}
          </label>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <>
                <CHEKIOInput
                  {...field}
                  className={errors.code ? "border-red-500" : ""}
                />
                {errors.code && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.code.message as string}
                  </p>
                )}
              </>
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("upsert.fields.workEmail")}
          </label>
          <Controller
            name="workEmail"
            control={control}
            render={({ field }) => (
              <>
                <CHEKIOInput
                  {...field}
                  type="email"
                  className={errors.workEmail ? "border-red-500" : ""}
                />
                {errors.workEmail && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.workEmail.message as string}
                  </p>
                )}
              </>
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("detail.workPhone")}
          </label>
          <Controller
            name="workPhone"
            control={control}
            render={({ field }) => (
              <>
                <CHEKIOInput
                  {...field}
                  className={errors.workPhone ? "border-red-500" : ""}
                />
                {errors.workPhone && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.workPhone.message as string}
                  </p>
                )}
              </>
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("detail.startDate")}
          </label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <>
                <CheckioInputDate
                  value={field.value}
                  onChange={field.onChange}
                  label=""
                  placeholder={t("detail.datePlaceholder")}
                  locale={currentLocale}
                  error={errors.startDate?.message as string}
                />
                {errors.startDate && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.startDate.message as string}
                  </p>
                )}
              </>
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("detail.endDate")}
          </label>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <>
                <CheckioInputDate
                  value={field.value}
                  onChange={field.onChange}
                  label=""
                  placeholder={t("detail.datePlaceholder")}
                  locale={currentLocale}
                  error={errors.endDate?.message as string}
                />
                {errors.endDate && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.endDate.message as string}
                  </p>
                )}
              </>
            )}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Controller
            name="isIndefiniteTerm"
            control={control}
            render={({ field }) => (
              <>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                  }}
                />
                <span>{t("detail.indefiniteTerm")}</span>
              </>
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("detail.contractedHours")}
          </label>
          <Controller
            name="contractedHours"
            control={control}
            render={({ field }) => (
              <>
                <CHEKIOInput
                  {...field}
                  type="number"
                  className={errors.contractedHours ? "border-red-500" : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? "" : Number(value));
                  }}
                />
                {errors.contractedHours && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.contractedHours.message as string}
                  </p>
                )}
              </>
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("detail.branch")}
          </label>
          <Controller
            name="branchId"
            control={control}
            render={({ field }) => (
              <>
                <CHEKIOSelect
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <CHEKIOSelectTrigger
                    className={errors.branchId ? "border-red-500" : ""}
                  >
                    <CHEKIOSelectValue placeholder={t("detail.selectBranch")} />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    {branches?.data.map((branch: any) => (
                      <CHEKIOSelectItem
                        key={branch.publicId}
                        value={branch.publicId}
                      >
                        {branch.name}
                      </CHEKIOSelectItem>
                    ))}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
                <ErrorMessage
                  errors={errors}
                  name="branchId"
                  render={({ message }) => (
                    <p className="text-xs text-red-500">{message}</p>
                  )}
                />
              </>
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("detail.job")}
          </label>
          <Controller
            name="jobId"
            control={control}
            render={({ field }) => (
              <>
                <CHEKIOSelect
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <CHEKIOSelectTrigger
                    className={errors.jobId ? "border-red-500" : ""}
                  >
                    <CHEKIOSelectValue placeholder={t("detail.selectJob")} />
                  </CHEKIOSelectTrigger>
                  <CHEKIOSelectContent>
                    {jobs?.data.map((job: any) => (
                      <CHEKIOSelectItem key={job.publicId} value={job.publicId}>
                        {job.name}
                      </CHEKIOSelectItem>
                    ))}
                  </CHEKIOSelectContent>
                </CHEKIOSelect>
                <ErrorMessage
                  errors={errors}
                  name="jobId"
                  render={({ message }) => (
                    <p className="text-xs text-red-500">{message}</p>
                  )}
                />
              </>
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("detail.integrationCode")}
          </label>
          <Controller
            name="integrationCode"
            control={control}
            render={({ field }) => (
              <>
                <CHEKIOInput
                  {...field}
                  className={errors.integrationCode ? "border-red-500" : ""}
                />
                {errors.integrationCode && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.integrationCode.message as string}
                  </p>
                )}
              </>
            )}
          />
        </div>
        <OrganizationSelector
          control={control}
          name="organizationId"
          companyId={companyId}
          resetFieldsFn={(fields) => {
            fields.forEach((field) => {
              setValue(field as any, undefined);
            });
          }}
        />

        {/* Legal Metadata Section */}
        <div className="col-span-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t("detail.contractLegalInfo")}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Controller
                name="legalMetadata.article22"
                control={control}
                render={({ field }) => (
                  <>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                    <span>{t("detail.article22")}</span>
                  </>
                )}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="legalMetadata.article27"
                control={control}
                render={({ field }) => (
                  <>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                    <span>{t("detail.article27")}</span>
                  </>
                )}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="legalMetadata.flexibilityHours"
                control={control}
                render={({ field }) => (
                  <>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                    <span>{t("detail.flexibilityHours")}</span>
                  </>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalContract;
