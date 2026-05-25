"use client";

import {
  CHEKIOActionButton,
  CHEKIOButton,
  CHEKIOInput,
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
  CHEKIOTabs,
} from "@/components";
import { CheckioInputDate } from "@/components/ui/checkio-input-date";
import { Switch } from "@/components/ui/switch";
import SystemInput from "@/components/ui/system-input";
import { Upload } from "antd";
import {
  CheckCircle2,
  Download,
  Loader2,
  Plus,
  Trash2,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Controller,
  FieldErrors,
  UseFieldArrayReturn,
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { UPDATE_FIELDS } from "./employee-bulk-upload";
import { DocumentTypeOptions, GenderOptions } from "./employee.dto";

interface EmployeeBulkUploadTableProps {
  mode: "create" | "update";
  control: any;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  reset: () => void;
  processing: boolean;
  isComplete: boolean;
  selectedUpdateFields: string[];
  setSelectedUpdateFields: (fields: string[]) => void;
  jobs: any[];
  branches: any[];
  companyId: string;
  fields: any[];
  append: UseFieldArrayReturn<any, "employees">["append"];
  replace: UseFieldArrayReturn<any, "employees">["replace"];
  remove: UseFieldArrayReturn<any, "employees">["remove"];
  activeTab: "excel" | "manual";
  setActiveTab: (tab: "excel" | "manual") => void;
  onDownloadTemplate: () => Promise<void>;
  onExcelUpload: (file: File) => boolean;
  onProcess: () => Promise<void>;
  onRetryFailed: () => Promise<void>;
  onAddRow: () => void;
  onClose?: () => void;
  onDownloadSuccessfulExcel: () => Promise<void>;
  onDownloadErrorExcel: () => Promise<void>;
}

export default function EmployeeBulkUploadTable({
  mode,
  control,
  errors,
  watch,
  setValue,
  getValues,
  processing,
  isComplete,
  selectedUpdateFields,
  setSelectedUpdateFields,
  jobs,
  branches,
  fields,
  remove,
  activeTab,
  setActiveTab,
  onDownloadTemplate,
  onExcelUpload,
  onProcess,
  onRetryFailed,
  onAddRow,
  onClose,
  onDownloadSuccessfulExcel,
  onDownloadErrorExcel,
}: EmployeeBulkUploadTableProps) {
  const t = useTranslations("mantainers.employees");
  const employees = watch("employees");

  // Field selection for update mode
  const allUpdateFields = [
    ...UPDATE_FIELDS.personal,
    ...UPDATE_FIELDS.company,
    ...UPDATE_FIELDS.homeOffice,
    ...UPDATE_FIELDS.legal,
  ];

  const handleFieldToggle = (fieldKey: string) => {
    if (selectedUpdateFields.includes(fieldKey)) {
      setSelectedUpdateFields(
        selectedUpdateFields.filter((f) => f !== fieldKey)
      );
    } else {
      setSelectedUpdateFields([...selectedUpdateFields, fieldKey]);
    }
  };

  const renderFieldSelector = () => {
    if (mode !== "update") return null;

    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t("bulkUpload.selectFieldsTitle")}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allUpdateFields.map((field) => (
            <label
              key={field.key}
              className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 rounded"
            >
              <input
                type="checkbox"
                checked={selectedUpdateFields.includes(field.key)}
                onChange={() => handleFieldToggle(field.key)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {t(`bulkUpload.fields.${field.key}` as any)}
              </span>
            </label>
          ))}
        </div>
        {selectedUpdateFields.length === 0 && (
          <p className="text-sm text-red-500 mt-2">
            {t("bulkUpload.toast.selectAtLeastOneField")}
          </p>
        )}
      </div>
    );
  };

  const renderTable = () => {
    if (fields.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-600 font-medium">
            {t("bulkUpload.table.noEmployeesLoaded")}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {mode === "create"
              ? t("bulkUpload.table.descriptionCreate")
              : t("bulkUpload.table.descriptionUpdate")}
          </p>
        </div>
      );
    }

    // Get columns based on mode
    const getColumns = () => {
      if (mode === "create") {
        return [
          t("bulkUpload.table.columnFirstName"),
          t("bulkUpload.table.columnLastName"),
          t("bulkUpload.table.columnSecondLastName"),
          t("bulkUpload.table.columnDocumentType"),
          t("bulkUpload.table.columnDocumentNumber"),
          t("bulkUpload.table.columnAddress"),
          t("bulkUpload.table.columnPersonalEmail"),
          t("bulkUpload.table.columnPersonalPhone"),
          t("bulkUpload.table.columnGender"),
          t("bulkUpload.table.columnBirthDate"),
          t("bulkUpload.table.columnCode"),
          t("bulkUpload.table.columnWorkEmail"),
          t("bulkUpload.table.columnWorkPhone"),
          t("bulkUpload.table.columnStartDate"),
          t("bulkUpload.table.columnEndDate"),
          t("bulkUpload.table.columnContractedHours"),
          t("bulkUpload.table.columnBranch"),
          t("bulkUpload.table.columnJob"),
          t("bulkUpload.table.columnIntegrationCode"),
          t("bulkUpload.table.columnIndefinite"),
          t("bulkUpload.table.columnStatus"),
          t("bulkUpload.table.columnActions"),
        ];
      } else {
        return [
          t("bulkUpload.table.columnDocumentNumber"),
          ...selectedUpdateFields.map((field) =>
            t(`bulkUpload.fields.${field}` as any),
          ),
          t("bulkUpload.table.columnStatus"),
          t("bulkUpload.table.columnActions"),
        ];
      }
    };

    const columns = getColumns();

    return (
      <div className="overflow-x-auto">
        <CHEKIOTable>
          <CHEKIOTableHeader>
            <tr>
              {columns.map((col, idx) => (
                <CHEKIOTableHead key={idx} className="min-w-[120px]">
                  {col}
                </CHEKIOTableHead>
              ))}
            </tr>
          </CHEKIOTableHeader>
          <CHEKIOTableBody>
            {fields.map((field, index) => {
              const employee = watch(`employees.${index}`);
              const status = employee?.status || "pending";
              const isEditable = status === "error" || status === "pending";
              const isDisabled =
                status === "success" || (processing && status !== "error");

              return (
                <CHEKIOTableRow key={field.id} index={index}>
                  {mode === "create" ? (
                    <>
                      <CHEKIOTableCell>
                        <SystemInput
                          control={control}
                          label=""
                          attribute={`employees.${index}.firstName`}
                          errors={errors}
                          disabled={isDisabled}
                          className="min-w-[120px]"
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <SystemInput
                          control={control}
                          label=""
                          attribute={`employees.${index}.lastName`}
                          errors={errors}
                          disabled={isDisabled}
                          className="min-w-[120px]"
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <SystemInput
                          control={control}
                          label=""
                          attribute={`employees.${index}.secondLastName`}
                          errors={errors}
                          disabled={isDisabled}
                          className="min-w-[120px]"
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`employees.${index}.documentType`}
                          control={control}
                          render={({ field: fieldCtrl }) => (
                            <CHEKIOSelect
                              value={fieldCtrl.value || "RUT"}
                              onValueChange={fieldCtrl.onChange}
                              disabled={isDisabled}
                            >
                              <CHEKIOSelectTrigger className="min-w-[100px]">
                                <CHEKIOSelectValue />
                              </CHEKIOSelectTrigger>
                              <CHEKIOSelectContent>
                                {DocumentTypeOptions.map((opt) => (
                                  <CHEKIOSelectItem
                                    key={opt.value}
                                    value={opt.value}
                                  >
                                    {opt.label}
                                  </CHEKIOSelectItem>
                                ))}
                              </CHEKIOSelectContent>
                            </CHEKIOSelect>
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <SystemInput
                          control={control}
                          label=""
                          attribute={`employees.${index}.documentNumber`}
                          errors={errors}
                          disabled={isDisabled}
                          className="min-w-[150px]"
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <SystemInput
                          control={control}
                          label=""
                          attribute={`employees.${index}.address`}
                          errors={errors}
                          disabled={isDisabled}
                          className="min-w-[150px]"
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <SystemInput
                          control={control}
                          label=""
                          attribute={`employees.${index}.personalEmail`}
                          errors={errors}
                          disabled={isDisabled}
                          type="email"
                          className="min-w-[150px]"
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`employees.${index}.personalPhone`}
                          control={control}
                          render={({ field: fieldCtrl }) => (
                            <CHEKIOInput
                              {...fieldCtrl}
                              disabled={isDisabled}
                              className="min-w-[120px]"
                              onChange={(e) => {
                                const value = e.target.value.replace(
                                  /[^0-9+\-\s]/g,
                                  ""
                                );
                                fieldCtrl.onChange(value);
                              }}
                            />
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`employees.${index}.gender`}
                          control={control}
                          render={({ field: fieldCtrl }) => (
                            <CHEKIOSelect
                              value={fieldCtrl.value || ""}
                              onValueChange={fieldCtrl.onChange}
                              disabled={isDisabled}
                            >
                              <CHEKIOSelectTrigger className="min-w-[100px]">
                                <CHEKIOSelectValue
                                  placeholder={t("bulkUpload.table.columnGender")}
                                />
                              </CHEKIOSelectTrigger>
                              <CHEKIOSelectContent>
                                {GenderOptions.map((opt) => (
                                  <CHEKIOSelectItem
                                    key={opt.value}
                                    value={opt.value}
                                  >
                                    {opt.label}
                                  </CHEKIOSelectItem>
                                ))}
                              </CHEKIOSelectContent>
                            </CHEKIOSelect>
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`employees.${index}.birthDate`}
                          control={control}
                          render={({ field: fieldCtrl }) => (
                            <CheckioInputDate
                              value={fieldCtrl.value}
                              onChange={fieldCtrl.onChange}
                              placeholder="dd/mm/aaaa"
                              disabled={isDisabled}
                              error={
                                (errors.employees as any)?.[index]?.birthDate
                                  ?.message
                              }
                            />
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <SystemInput
                          control={control}
                          label=""
                          attribute={`employees.${index}.code`}
                          errors={errors}
                          disabled={isDisabled}
                          className="min-w-[100px]"
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <SystemInput
                          control={control}
                          label=""
                          attribute={`employees.${index}.workEmail`}
                          errors={errors}
                          disabled={isDisabled}
                          type="email"
                          className="min-w-[150px]"
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`employees.${index}.workPhone`}
                          control={control}
                          render={({ field: fieldCtrl }) => (
                            <CHEKIOInput
                              {...fieldCtrl}
                              disabled={isDisabled}
                              className="min-w-[120px]"
                              onChange={(e) => {
                                const value = e.target.value.replace(
                                  /[^0-9+\-\s]/g,
                                  ""
                                );
                                fieldCtrl.onChange(value);
                              }}
                            />
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`employees.${index}.startDate`}
                          control={control}
                          render={({ field: fieldCtrl }) => (
                            <CheckioInputDate
                              value={fieldCtrl.value}
                              onChange={fieldCtrl.onChange}
                              placeholder="dd/mm/aaaa"
                              disabled={isDisabled}
                              error={
                                (errors.employees as any)?.[index]?.startDate
                                  ?.message
                              }
                            />
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`employees.${index}.endDate`}
                          control={control}
                          render={({ field: fieldCtrl }) => (
                            <CheckioInputDate
                              value={fieldCtrl.value}
                              onChange={fieldCtrl.onChange}
                              placeholder="dd/mm/aaaa"
                              disabled={
                                isDisabled || employee?.isIndefiniteTerm
                              }
                              error={
                                (errors.employees as any)?.[index]?.endDate
                                  ?.message
                              }
                            />
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <SystemInput
                          control={control}
                          label=""
                          attribute={`employees.${index}.contractedHours`}
                          errors={errors}
                          disabled={isDisabled}
                          type="number"
                          className="min-w-[80px]"
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`employees.${index}.branchId`}
                          control={control}
                          render={({ field: fieldCtrl }) => (
                            <CHEKIOSelect
                              value={fieldCtrl.value || ""}
                              onValueChange={fieldCtrl.onChange}
                              disabled={isDisabled}
                            >
                              <CHEKIOSelectTrigger className="min-w-[150px]">
                                <CHEKIOSelectValue
                                  placeholder={t("bulkUpload.table.columnBranch")}
                                />
                              </CHEKIOSelectTrigger>
                              <CHEKIOSelectContent>
                                {branches.map((branch) => (
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
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`employees.${index}.jobId`}
                          control={control}
                          render={({ field: fieldCtrl }) => (
                            <CHEKIOSelect
                              value={fieldCtrl.value || ""}
                              onValueChange={fieldCtrl.onChange}
                              disabled={isDisabled}
                            >
                              <CHEKIOSelectTrigger className="min-w-[150px]">
                                <CHEKIOSelectValue
                                  placeholder={t("bulkUpload.table.columnJob")}
                                />
                              </CHEKIOSelectTrigger>
                              <CHEKIOSelectContent>
                                {jobs.map((job) => (
                                  <CHEKIOSelectItem
                                    key={job.publicId}
                                    value={job.publicId}
                                  >
                                    {job.name}
                                  </CHEKIOSelectItem>
                                ))}
                              </CHEKIOSelectContent>
                            </CHEKIOSelect>
                          )}
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <SystemInput
                          control={control}
                          label=""
                          attribute={`employees.${index}.integrationCode`}
                          errors={errors}
                          disabled={isDisabled}
                          className="min-w-[120px]"
                        />
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <Controller
                          name={`employees.${index}.isIndefiniteTerm`}
                          control={control}
                          render={({ field: fieldCtrl }) => (
                            <Switch
                              checked={fieldCtrl.value || false}
                              onCheckedChange={fieldCtrl.onChange}
                              disabled={isDisabled}
                            />
                          )}
                        />
                      </CHEKIOTableCell>
                    </>
                  ) : (
                    <>
                      <CHEKIOTableCell>
                        <SystemInput
                          control={control}
                          label=""
                          attribute={`employees.${index}.documentNumber`}
                          errors={errors}
                          disabled={isDisabled}
                          className="min-w-[150px]"
                        />
                      </CHEKIOTableCell>
                      {selectedUpdateFields.map((fieldKey) => {
                        const fieldInfo = allUpdateFields.find(
                          (f) => f.key === fieldKey
                        );
                        if (!fieldInfo) return null;

                        // Render field based on type
                        if (fieldKey.includes("legalMetadata")) {
                          return (
                            <CHEKIOTableCell key={fieldKey}>
                              <Controller
                                name={`employees.${index}.${fieldKey}`}
                                control={control}
                                render={({ field: fieldCtrl }) => (
                                  <Switch
                                    checked={fieldCtrl.value || false}
                                    onCheckedChange={fieldCtrl.onChange}
                                    disabled={isDisabled}
                                  />
                                )}
                              />
                            </CHEKIOTableCell>
                          );
                        }

                        if (
                          fieldKey === "gender" ||
                          fieldKey === "documentType"
                        ) {
                          const options =
                            fieldKey === "gender"
                              ? GenderOptions
                              : DocumentTypeOptions;
                          return (
                            <CHEKIOTableCell key={fieldKey}>
                              <Controller
                                name={`employees.${index}.${fieldKey}`}
                                control={control}
                                render={({ field: fieldCtrl }) => (
                                  <CHEKIOSelect
                                    value={fieldCtrl.value || ""}
                                    onValueChange={fieldCtrl.onChange}
                                    disabled={isDisabled}
                                  >
                                    <CHEKIOSelectTrigger className="min-w-[120px]">
                                      <CHEKIOSelectValue
                                        placeholder={t(`bulkUpload.fields.${fieldKey}` as any)}
                                      />
                                    </CHEKIOSelectTrigger>
                                    <CHEKIOSelectContent>
                                      {options.map((opt) => (
                                        <CHEKIOSelectItem
                                          key={opt.value}
                                          value={opt.value}
                                        >
                                          {opt.label}
                                        </CHEKIOSelectItem>
                                      ))}
                                    </CHEKIOSelectContent>
                                  </CHEKIOSelect>
                                )}
                              />
                            </CHEKIOTableCell>
                          );
                        }

                        if (fieldKey === "branchId" || fieldKey === "jobId") {
                          const options =
                            fieldKey === "branchId" ? branches : jobs;
                          return (
                            <CHEKIOTableCell key={fieldKey}>
                              <Controller
                                name={`employees.${index}.${fieldKey}`}
                                control={control}
                                render={({ field: fieldCtrl }) => (
                                  <CHEKIOSelect
                                    value={fieldCtrl.value || ""}
                                    onValueChange={fieldCtrl.onChange}
                                    disabled={isDisabled}
                                  >
                                    <CHEKIOSelectTrigger className="min-w-[150px]">
                                      <CHEKIOSelectValue
                                        placeholder={t(`bulkUpload.fields.${fieldKey}` as any)}
                                      />
                                    </CHEKIOSelectTrigger>
                                    <CHEKIOSelectContent>
                                      {options.map((opt: any) => (
                                        <CHEKIOSelectItem
                                          key={opt.publicId}
                                          value={opt.publicId}
                                        >
                                          {opt.name}
                                        </CHEKIOSelectItem>
                                      ))}
                                    </CHEKIOSelectContent>
                                  </CHEKIOSelect>
                                )}
                              />
                            </CHEKIOTableCell>
                          );
                        }

                        if (
                          fieldKey === "birthDate" ||
                          fieldKey === "startDate" ||
                          fieldKey === "endDate"
                        ) {
                          return (
                            <CHEKIOTableCell key={fieldKey}>
                              <Controller
                                name={`employees.${index}.${fieldKey}`}
                                control={control}
                                render={({ field: fieldCtrl }) => (
                                  <CheckioInputDate
                                    value={fieldCtrl.value}
                                    onChange={fieldCtrl.onChange}
                                    placeholder="dd/mm/aaaa"
                                    disabled={isDisabled}
                                    error={
                                      (errors.employees as any)?.[index]?.[
                                        fieldKey
                                      ]?.message
                                    }
                                  />
                                )}
                              />
                            </CHEKIOTableCell>
                          );
                        }

                        if (
                          fieldKey === "isIndefiniteTerm" ||
                          fieldKey.startsWith("can")
                        ) {
                          return (
                            <CHEKIOTableCell key={fieldKey}>
                              <Controller
                                name={`employees.${index}.${fieldKey}`}
                                control={control}
                                render={({ field: fieldCtrl }) => (
                                  <Switch
                                    checked={fieldCtrl.value || false}
                                    onCheckedChange={fieldCtrl.onChange}
                                    disabled={isDisabled}
                                  />
                                )}
                              />
                            </CHEKIOTableCell>
                          );
                        }

                        if (fieldKey === "contractedHours") {
                          return (
                            <CHEKIOTableCell key={fieldKey}>
                              <SystemInput
                                control={control}
                                label=""
                                attribute={`employees.${index}.${fieldKey}`}
                                errors={errors}
                                disabled={isDisabled}
                                type="number"
                                className="min-w-[80px]"
                              />
                            </CHEKIOTableCell>
                          );
                        }

                        // Default text input
                        return (
                          <CHEKIOTableCell key={fieldKey}>
                            <SystemInput
                              control={control}
                              label=""
                              attribute={`employees.${index}.${fieldKey}`}
                              errors={errors}
                              disabled={isDisabled}
                              type={
                                fieldKey.includes("Email") ? "email" : "text"
                              }
                              className="min-w-[120px]"
                            />
                          </CHEKIOTableCell>
                        );
                      })}
                    </>
                  )}
                  <CHEKIOTableCell>
                    {status === "pending" && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {t("table.status.pending")}
                      </span>
                    )}
                    {status === "processing" && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {t("table.status.processing")}
                      </span>
                    )}
                    {status === "success" && (
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3" />
                          {t("table.status.completed")}
                        </span>
                        <span className="text-xs text-green-600 mt-1 max-w-[200px]">
                          {t("bulkUpload.table.statusSuccessMessage")}
                        </span>
                      </div>
                    )}
                    {status === "error" && (
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          <X className="w-3 h-3" />
                          {t("table.status.error")}
                        </span>
                        {employee?.error && (
                          <span className="text-xs text-red-500 mt-1 max-w-[200px]">
                            {employee.error}
                          </span>
                        )}
                      </div>
                    )}
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>
                    <CHEKIOActionButton
                      variant="delete"
                      onClick={() => remove(index)}
                      disabled={processing || status === "success"}
                      aria-label={t("bulkUpload.table.deleteEmployee")}
                      className="h-auto w-auto px-3 py-1.5 gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>{t("bulkUpload.table.delete")}</span>
                    </CHEKIOActionButton>
                  </CHEKIOTableCell>
                </CHEKIOTableRow>
              );
            })}
          </CHEKIOTableBody>
        </CHEKIOTable>
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-6">
      {renderFieldSelector()}

      <CHEKIOTabs>
        <CHEKIOTab
          type="button"
          active={activeTab === "excel"}
          onClick={() => setActiveTab("excel")}
        >
          {t("tabs.excel")}
        </CHEKIOTab>
        <CHEKIOTab
          type="button"
          active={activeTab === "manual"}
          onClick={() => setActiveTab("manual")}
        >
          {t("tabs.manual")}
        </CHEKIOTab>
      </CHEKIOTabs>

      {activeTab === "excel" && (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-medium mb-2 text-green-800">
              {t("bulkUpload.instructions.excel.listTitle")}
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
              <li>{t("bulkUpload.instructions.excel.list1")}</li>
              <li>{t("bulkUpload.instructions.excel.list2")}</li>
              <li>{t("bulkUpload.instructions.excel.list3")}</li>
              <li>{t("bulkUpload.instructions.excel.list4")}</li>
              <li>{t("bulkUpload.instructions.excel.list5")}</li>
              <li>{t("bulkUpload.instructions.excel.list6")}</li>
            </ol>
          </div>
          <div className="flex gap-4">
            {!processing && !isComplete && (
              <>
                <CHEKIOButton
                  type="button"
                  variant="primary"
                  onClick={onDownloadTemplate}
                >
                  <Download className="h-4 w-4" />
                  {t("buttons.downloadTemplate")}
                </CHEKIOButton>
                <Upload
                  beforeUpload={onExcelUpload}
                  accept=".xlsx,.xls"
                  showUploadList={false}
                >
                  <CHEKIOButton type="button" variant="primary">
                    <UploadIcon className="h-4 w-4" />
                    {t("buttons.uploadExcel")}
                  </CHEKIOButton>
                </Upload>
              </>
            )}
          </div>
          {renderTable()}
        </div>
      )}

      {activeTab === "manual" && (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-medium mb-2 text-green-800">
              {t("bulkUpload.instructions.manual.listTitle")}
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
              <li>{t("bulkUpload.instructions.manual.list1")}</li>
              <li>{t("bulkUpload.instructions.manual.list2")}</li>
              <li>{t("bulkUpload.instructions.manual.list3")}</li>
              <li>{t("bulkUpload.instructions.manual.list4")}</li>
            </ol>
          </div>
          {!processing && !isComplete && (
            <CHEKIOButton type="button" variant="primary" onClick={onAddRow}>
              <Plus className="h-4 w-4" />
              {t("buttons.addRow")}
            </CHEKIOButton>
          )}
          {renderTable()}
        </div>
      )}

      <div className="space-y-4">
        {isComplete && (
          <div className="flex gap-4 pt-4 border-t">
            {employees.some((emp: any) => emp?.status === "success") && (
              <CHEKIOButton
                type="button"
                variant="primary"
                onClick={onDownloadSuccessfulExcel}
              >
                <Download className="h-4 w-4" />
                {t("bulkUpload.table.downloadSuccessful")}
              </CHEKIOButton>
            )}
            {employees.some((emp: any) => emp?.status === "error") && (
              <CHEKIOButton
                type="button"
                variant="secondaryBlue"
                onClick={onDownloadErrorExcel}
              >
                <Download className="h-4 w-4" />
                {t("bulkUpload.table.downloadErrors")}
              </CHEKIOButton>
            )}
          </div>
        )}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <CHEKIOButton
            type="button"
            variant="secondary"
            onClick={() => {
              if (onClose) {
                onClose();
              }
            }}
            disabled={processing}
          >
            <X className="h-4 w-4" />
            {isComplete ? t("buttons.close") : t("buttons.cancel")}
          </CHEKIOButton>
          {isComplete &&
            employees.some((emp: any) => emp?.status === "error") && (
              <CHEKIOButton
                type="button"
                variant="primary"
                onClick={onRetryFailed}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("buttons.processingLabel")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {t("buttons.retry")}
                  </>
                )}
              </CHEKIOButton>
            )}
          {!isComplete && (
            <CHEKIOButton
              type="button"
              variant="primary"
              onClick={onProcess}
              disabled={
                processing ||
                fields.length === 0 ||
                (mode === "update" && selectedUpdateFields.length === 0)
              }
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("buttons.processingLabel")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {t("buttons.process")}
                </>
              )}
            </CHEKIOButton>
          )}
        </div>
      </div>
    </div>
  );
}
