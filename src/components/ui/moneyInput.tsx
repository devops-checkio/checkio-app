import { ErrorMessage } from "@hookform/error-message";
import { Input } from "antd";
import { Controller } from "react-hook-form";

type SystemMoneyInputRulesProps = {
  required?: boolean | string;
  pattern?: {
    value: RegExp;
    message: string;
  };
  minLength?: {
    value: number;
    message: string;
  };
  maxLength?: {
    value: number;
    message: string;
  };
  min?: {
    value: number;
    message: string;
  };
  validate?: (value: any) => boolean | string;
};
type SystemMoneyInputProps = {
  label?: string;
  atribute: string;
  className?: string;
  placeholder?: string;
  control: any;
  type?: any;
  disabled?: boolean;
  rules?: SystemMoneyInputRulesProps;
  errors?: any;
  tooltip?: string;
  value?: any;
};

const formatToCLP = (value: string) => {
  // Remove non-numeric characters except decimal point
  const numericValue = value.replace(/[^\d.]/g, "");

  // Parse as number to preserve decimals
  const numValue = parseFloat(numericValue);

  if (isNaN(numValue)) return "";

  // Format as CLP with up to 10 decimal places
  const formatter = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 10,
  });

  return formatter.format(numValue);
};

const SystemMoneyInput = ({
  control,
  label,
  type,
  atribute,
  className = "",
  disabled = false,
  placeholder = "",
  errors = {},
  rules = {},
  tooltip = "",
}: SystemMoneyInputProps) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-gray-600">
          {label}
          {rules.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Controller
        name={atribute}
        control={control}
        disabled={disabled}
        rules={rules}
        render={({ field: { onChange, onBlur, value, ...field } }) => (
          <>
            <span className={`${className}`}>
              <Input
                type="text"
                id={field.name}
                className={"w-full"}
                placeholder={placeholder}
                {...field}
                value={value ? formatToCLP(value.toString()) : ""}
                onChange={(e) => {
                  // Allow decimal point and numbers
                  const rawValue = e.target.value
                    .replace(/[^\d.]/g, "")
                    .replace(/\s/g, "");
                  // Ensure only one decimal point
                  const parts = rawValue.split(".");
                  const formattedValue =
                    parts.length > 1
                      ? parts[0] + "." + parts.slice(1).join("")
                      : parts[0];
                  onChange(formattedValue);
                }}
                onBlur={onBlur}
              />
            </span>
            {errors && (
              <ErrorMessage
                errors={errors}
                name={atribute}
                render={({ message }) => (
                  <p className="text-xs text-red-500">{message}</p>
                )}
              />
            )}
          </>
        )}
      />
      {tooltip && <p className="text-xs text-gray-500">{tooltip}</p>}
    </div>
  );
};

export default SystemMoneyInput;
