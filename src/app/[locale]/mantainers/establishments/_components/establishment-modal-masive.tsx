"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
  CHEKIOProgressBar,
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
import SystemMultiSelect from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import { TIME_ZONE_OPTIONS } from "@/lib/options/time-zone";
import { useCreateEstablishment } from "@/service/mantainer.service";
import { parseFirstWorksheetToJsonRecords } from "@/utils/parseXlsxFirstSheet";
import { Upload } from "antd";
import ExcelJS from "exceljs";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  Plus,
  Trash2,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { CompanyOption } from "../../companies/_components/company.dto";
import { EstablishmentCreateDto } from "./establishment.dto";

interface EstablishmentModalMasiveProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyOptions: CompanyOption[];
}

interface EstablishmentFormData {
  id?: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  companies: string[];
  timezone: string;
  error?: string;
  success?: boolean;
  status?: "pending" | "processing" | "success" | "error";
}

interface FormValues {
  establishments: EstablishmentFormData[];
  companies: string[];
}

export default function EstablishmentModalMasive({
  isOpen,
  onClose,
  onSuccess,
  companyOptions,
}: EstablishmentModalMasiveProps) {
  const tMassive = useTranslations("mantainers.establishments.massive");
  const { mutateAsync: createEstablishment } = useCreateEstablishment();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const { control, handleSubmit, watch, setValue, reset } =
    useForm<FormValues>({
      defaultValues: { establishments: [], companies: [] },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "establishments",
  });

  const globalCompanies = watch("companies");

  useEffect(() => {
    if (!isOpen) {
      reset({ establishments: [], companies: [] });
      setUploadProgress(0);
      setProcessing(false);
    }
  }, [isOpen, reset]);

  const downloadTemplate = useCallback(async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tMassive("template.sheetName"));
    worksheet.columns = [
      { header: tMassive("template.headers.code"), key: "code", width: 15 },
      { header: tMassive("template.headers.name"), key: "name", width: 25 },
      {
        header: tMassive("template.headers.address"),
        key: "address",
        width: 30,
      },
      { header: tMassive("template.headers.phone"), key: "phone", width: 15 },
      {
        header: tMassive("template.headers.timezone"),
        key: "timezone",
        width: 20,
      },
    ];
    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = tMassive("template.filename");
    link.click();
    URL.revokeObjectURL(url);
  }, [tMassive]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      try {
        const records = await parseFirstWorksheetToJsonRecords(
          await file.arrayBuffer(),
        );
        const mapped: EstablishmentFormData[] = (records as any[]).map(
          (row) => ({
            code: String(row[tMassive("template.headers.code")] ?? ""),
            name: String(row[tMassive("template.headers.name")] ?? ""),
            address: String(row[tMassive("template.headers.address")] ?? ""),
            phone: String(row[tMassive("template.headers.phone")] ?? ""),
            timezone: String(
              row[tMassive("template.headers.timezone")] ?? "",
            ),
            companies: globalCompanies,
            status: "pending",
          }),
        );
        append(mapped);
      } catch {
        toast({
          title: tMassive("errors.parseError"),
          variant: "destructive",
        });
      }
      return false;
    },
    [append, globalCompanies, tMassive, toast],
  );

  const onSubmit = async (values: FormValues) => {
    if (values.establishments.length === 0) return;
    setProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < values.establishments.length; i++) {
      const row = values.establishments[i];
      setValue(`establishments.${i}.status`, "processing");
      try {
        const dto: EstablishmentCreateDto = {
          code: row.code,
          name: row.name,
          address: row.address,
          phone: row.phone || undefined,
          timezone: row.timezone,
          companies: row.companies.length ? row.companies : values.companies,
          isActive: true,
        };
        await createEstablishment(dto);
        setValue(`establishments.${i}.status`, "success");
        setValue(`establishments.${i}.success`, true);
        successCount++;
      } catch (e: any) {
        setValue(`establishments.${i}.status`, "error");
        setValue(
          `establishments.${i}.error`,
          e?.response?.data?.message ?? tMassive("errors.unknown"),
        );
        errorCount++;
      }
      setUploadProgress(Math.round(((i + 1) / values.establishments.length) * 100));
    }

    setProcessing(false);
    if (errorCount === 0) {
      toast({
        title: tMassive("toast.successTitle"),
        description: tMassive("toast.successDescription", { count: successCount }),
      });
      onSuccess();
      onClose();
    } else {
      toast({
        title: tMassive("toast.partialTitle"),
        description: tMassive("toast.partialDescription", {
          successCount,
          errorCount,
        }),
        variant: "destructive",
      });
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={tMassive("title")}
      size="5xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
        {/* Global company selector */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <SystemMultiSelect
            control={control}
            label={tMassive("globalCompanies")}
            attribute="companies"
            options={companyOptions}
            errors={{}}
            rules={{ required: tMassive("errors.companiesRequired") }}
            placeholder={tMassive("companiesPlaceholder")}
            showSelectAll
            onSelectAll={() =>
              setValue("companies", companyOptions.map((o) => o.value))
            }
            searchable
            showClear
            maxItems={3}
          />
        </div>

        {/* Upload + Template */}
        <div className="flex gap-3">
          <CHEKIOButton
            variant="secondaryBlue"
            type="button"
            onClick={downloadTemplate}
          >
            <Download className="h-4 w-4" />
            {tMassive("buttons.downloadTemplate")}
          </CHEKIOButton>
          <Upload
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={(file) => {
              handleFileUpload(file);
              return false;
            }}
          >
            <CHEKIOButton variant="primary" type="button">
              <UploadIcon className="h-4 w-4" />
              {tMassive("buttons.upload")}
            </CHEKIOButton>
          </Upload>
          <CHEKIOButton
            variant="primary"
            type="button"
            onClick={() =>
              append({
                code: "",
                name: "",
                address: "",
                phone: "",
                timezone: "",
                companies: globalCompanies,
                status: "pending",
              })
            }
          >
            <Plus className="h-4 w-4" />
            {tMassive("buttons.addRow")}
          </CHEKIOButton>
        </div>

        {/* Table */}
        {fields.length > 0 && (
          <>
            {processing && (
              <CHEKIOProgressBar
                current={uploadProgress}
                total={100}
                className="h-2"
                showFraction={false}
                showText={false}
              />
            )}
            <div className="overflow-x-auto max-h-64 overflow-y-auto border rounded-lg">
              <CHEKIOTable className="rounded-none border-0 shadow-none">
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead>{tMassive("table.code")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tMassive("table.name")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tMassive("table.address")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tMassive("table.phone")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tMassive("table.timezone")}</CHEKIOTableHead>
                    <CHEKIOTableHead>{tMassive("table.status")}</CHEKIOTableHead>
                    <CHEKIOTableHead />
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {fields.map((field, index) => {
                    const status = watch(`establishments.${index}.status`);
                    const err = watch(`establishments.${index}.error`);
                    return (
                      <CHEKIOTableRow key={field.id} index={index}>
                        <CHEKIOTableCell>
                          <Controller
                            control={control}
                            name={`establishments.${index}.code`}
                            render={({ field: f }) => (
                              <input
                                {...f}
                                className="w-24 border rounded px-2 py-1 text-sm"
                              />
                            )}
                          />
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <Controller
                            control={control}
                            name={`establishments.${index}.name`}
                            render={({ field: f }) => (
                              <input
                                {...f}
                                className="w-36 border rounded px-2 py-1 text-sm"
                              />
                            )}
                          />
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <Controller
                            control={control}
                            name={`establishments.${index}.address`}
                            render={({ field: f }) => (
                              <input
                                {...f}
                                className="w-48 border rounded px-2 py-1 text-sm"
                              />
                            )}
                          />
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <Controller
                            control={control}
                            name={`establishments.${index}.phone`}
                            render={({ field: f }) => (
                              <input
                                {...f}
                                className="w-28 border rounded px-2 py-1 text-sm"
                              />
                            )}
                          />
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <Controller
                            control={control}
                            name={`establishments.${index}.timezone`}
                            render={({ field: f }) => (
                              <CHEKIOSelect
                                value={f.value}
                                onValueChange={f.onChange}
                              >
                                <CHEKIOSelectTrigger className="w-36">
                                  <CHEKIOSelectValue />
                                </CHEKIOSelectTrigger>
                                <CHEKIOSelectContent>
                                  {TIME_ZONE_OPTIONS.map((opt) => (
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
                          {status === "success" && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3" />
                              {tMassive("status.success")}
                            </span>
                          )}
                          {status === "error" && (
                            <span
                              className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full"
                              title={err}
                            >
                              <AlertCircle className="h-3 w-3" />
                              {tMassive("status.error")}
                            </span>
                          )}
                          {status === "processing" && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          )}
                          {(!status || status === "pending") && (
                            <span className="text-xs text-gray-400">
                              {tMassive("status.pending")}
                            </span>
                          )}
                        </CHEKIOTableCell>
                        <CHEKIOTableCell>
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            disabled={processing}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </CHEKIOTableCell>
                      </CHEKIOTableRow>
                    );
                  })}
                </CHEKIOTableBody>
              </CHEKIOTable>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <CHEKIOButton
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={processing}
          >
            <X className="h-4 w-4" />
            {tMassive("buttons.cancel")}
          </CHEKIOButton>
          <CHEKIOButton
            variant="primary"
            type="submit"
            disabled={processing || fields.length === 0}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {tMassive("buttons.process")}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}
