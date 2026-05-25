import { ErrorMessage } from "@hookform/error-message";
import { Controller } from "react-hook-form";
import { cn } from "@/lib/utils";
import { CHEKIOInput } from "../CHEKIOInput";

type SystemInputRulesProps = {
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
  max?: {
    value: number;
    message: string;
  };
  validate?: (value: any) => boolean | string;
};

interface SystemInputProps {
  label: string;
  attribute: string;
  control: any;
  type?: string;
  errors?: any;
  rules?: any;
  showError?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  tooltip?: string;
  value?: any;
  ref?: React.ForwardedRef<unknown>;
  onChange?: (value: any) => void;
  isValid?: boolean | null;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
}

const SystemInput = ({
  label,
  attribute,
  control,
  type = "text",
  errors,
  rules,
  showError = false,
  className = "",
  placeholder = "",
  disabled = false,
  tooltip = "",
  value,
  ref,
  isValid,
  onKeyPress,
  onInput,
}: SystemInputProps) => {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={attribute}
          className="text-sm font-medium text-gray-700"
        >
          {label}
          {rules?.required && (
            <span className="ml-0.5 text-red-500" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      <Controller
        name={attribute}
        control={control}
        disabled={disabled}
        rules={rules}
        render={({ field }) => {
          const minValue = rules?.min?.value;
          const maxValue = rules?.max?.value;

          const getNestedError = (errors: any, path: string) => {
            const parts = path.split(".");
            let current = errors;
            for (const part of parts) {
              if (current && typeof current === "object" && part in current) {
                current = current[part];
              } else {
                return undefined;
              }
            }
            return current;
          };

          const fieldError = getNestedError(errors, attribute);
          const hasError = !!fieldError;

          const inputClassName = cn(
            "w-full",
            hasError &&
              "border-red-500 focus-visible:ring-red-500/30 focus-visible:border-red-500",
            isValid === true &&
              "border-green-500 focus-visible:ring-green-500/30 focus-visible:border-green-500",
            isValid === false &&
              "border-amber-500 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
          );

          return (
            <>
              <div>
                <CHEKIOInput
                  type={type}
                  id={field.name}
                  className={inputClassName}
                  disabled={disabled}
                  placeholder={placeholder}
                  value={field.value ?? ""}
                  min={
                    type === "number" && minValue !== undefined
                      ? minValue
                      : undefined
                  }
                  max={
                    type === "number" && maxValue !== undefined
                      ? maxValue
                      : undefined
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value);
                  }}
                  onKeyPress={onKeyPress}
                  onInput={onInput}
                />
              </div>
              {(showError || hasError) && (
                <ErrorMessage
                  errors={errors}
                  name={attribute}
                  render={({ message }) => (
                    <p className="mt-0.5 text-xs text-red-600" role="alert">
                      {message === "Required"
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
      {tooltip && (
        <p className="text-xs text-gray-500">{tooltip}</p>
      )}
    </div>
  );
};

export default SystemInput;
