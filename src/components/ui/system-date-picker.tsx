import { ErrorMessage } from "@hookform/error-message";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { DateTime } from "luxon";
import { Controller } from "react-hook-form";

function getNestedFormError(
  errors: Record<string, unknown> | undefined,
  path: string,
): { message?: string } | undefined {
  if (!errors || !path) return undefined;
  const parts = path.split(".");
  let current: unknown = errors;
  for (const part of parts) {
    if (
      current &&
      typeof current === "object" &&
      part in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current as { message?: string } | undefined;
}

type SystemDatePickerRulesProps = {
  required?: boolean | string;
  validate?: (value: any) => boolean | string;
};

interface SystemDatePickerProps {
  label: string;
  attribute: string;
  control: any;
  errors?: any;
  rules?: any;
  showError?: boolean;
  className?: string;
  disabled?: boolean;
  tooltip?: string;
  value?: any;
  ref?: React.ForwardedRef<unknown>;
  onChange?: (value: any) => void;
  pickerType?: "date" | "week" | "month" | "quarter" | "year";
  placeholder?: string;
  format?: string;
}

const SystemDatePicker = ({
  label,
  attribute,
  control,
  errors,
  rules,
  showError = false,
  className = "",
  disabled = false,
  tooltip = "",
  value,
  ref,
  onChange,
  pickerType = "date",
  placeholder,
  format = "DD/MM/YYYY",
}: SystemDatePickerProps) => {
  const fieldError = getNestedFormError(errors, attribute);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {rules?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Controller
        name={attribute}
        control={control}
        disabled={disabled}
        rules={rules}
        render={({ field }) => {
          // Convert ISO string or Date object to dayjs for Ant Design DatePicker
          const getDateValue = () => {
            if (!field.value) return null;

            try {
              if (typeof field.value === "string") {
                // Handle ISO string
                const dateTime = DateTime.fromISO(field.value);
                if (dateTime.isValid) {
                  return dayjs(dateTime.toJSDate());
                }
              } else if (field.value instanceof Date) {
                // Handle Date object
                return dayjs(field.value);
              } else if (dayjs.isDayjs(field.value)) {
                // Already a dayjs object
                return field.value;
              }
            } catch (error) {
              console.error("Error parsing date value:", error);
            }

            return null;
          };

          return (
            <>
              <span className={`${className}`}>
                <DatePicker
                  id={field.name}
                  picker={pickerType}
                  placeholder={placeholder}
                  format={format}
                  className={`w-full ${
                    fieldError ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={disabled}
                  value={getDateValue()}
                  onChange={(date, dateString) => {
                    if (date) {
                      // Convert dayjs to ISO string for form storage
                      const isoDate = date.toISOString();
                      field.onChange(isoDate);
                      onChange?.(isoDate);
                    } else {
                      field.onChange(null);
                      onChange?.(null);
                    }
                  }}
                />
              </span>
              {(showError || fieldError) && fieldError && (
                <ErrorMessage
                  errors={errors}
                  name={attribute}
                  render={({ message }) => (
                    <p className="text-xs text-red-500">
                      {message == "Required"
                        ? "Este campo es requerido"
                        : message}
                    </p>
                  )}
                />
              )}
            </>
          );
        }}
      />
      {tooltip && <p className="text-xs text-gray-500">{tooltip}</p>}
    </div>
  );
};

export default SystemDatePicker;
