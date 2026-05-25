import { ErrorMessage } from "@hookform/error-message";
import { Controller } from "react-hook-form";

type SystemSelectRulesProps = {
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
  validate?: (value: any) => boolean | string;
};

type SystemSelectProps = {
  label?: string;
  attribute: string;
  disabled?: boolean;
  className?: string;
  control: any;
  options?: any[];
  value?: any;
  rules?: SystemSelectRulesProps;
  errors?: any;
  tooltip?: string;
  placeholder?: string;
  onChange?: (value: any) => void;
  onClear?: () => void;
  showClear?: boolean;
  showError?: boolean;
  isValid?: boolean | null;
  multiple?: boolean;
  showSelectAll?: boolean;
  onSelectAll?: () => void;
};

const SystemSelect = ({
  control,
  label,
  options = [],
  attribute,
  value,
  placeholder,
  className = "",
  disabled = false,
  rules = {},
  errors = {},
  tooltip = "",
  onChange,
  onClear,
  showClear = false,
  showError = false,
  isValid,
  multiple = false,
  showSelectAll = false,
  onSelectAll,
}: SystemSelectProps) => {
  const getNestedError = (errors: any, path: string) => {
    const keys = path.split(".");
    let current = errors;
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    return current;
  };

  const getBorderClass = () => {
    const error = getNestedError(errors, attribute);
    if (error) return "border-red-500";
    if (isValid === true) return "border-green-500";
    if (isValid === false) return "border-yellow-500";
    return "border-gray-300";
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-gray-600">
            {label}
            {rules?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {showSelectAll && onSelectAll && (
            <button
              type="button"
              onClick={onSelectAll}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              Seleccionar todas
            </button>
          )}
        </div>
      )}
      <Controller
        name={attribute}
        control={control}
        disabled={disabled}
        rules={rules}
        render={({ field }) => (
          <>
            <span className={`${className}`}>
              <select
                id={field.name}
                className={`w-full p-2 border ${getBorderClass()} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                  disabled ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"
                }`}
                disabled={disabled}
                multiple={multiple}
                value={field.value ?? (multiple ? [] : "")}
                onChange={(e) => {
                  let value;
                  if (multiple) {
                    const selectedOptions = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    value = selectedOptions;
                  } else {
                    value = e.target.value;
                  }
                  field.onChange(value);
                  if (onChange) {
                    onChange(value);
                  }
                }}
              >
                {placeholder && !multiple && (
                  <option value="" disabled>
                    {placeholder}
                  </option>
                )}
                {options.map((option) => (
                  <option
                    key={option.value || option}
                    value={option.value || option}
                  >
                    {option.label || option}
                  </option>
                ))}
              </select>
            </span>
            {(showError || getNestedError(errors, attribute)) &&
              getNestedError(errors, attribute) && (
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
            {showClear && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
              >
                Limpiar
              </button>
            )}
          </>
        )}
      />
      {tooltip && <p className="text-xs text-gray-500">{tooltip}</p>}
    </div>
  );
};

export default SystemSelect;
