import { ErrorMessage } from "@hookform/error-message";
import { Checkbox } from "antd";
import { Controller } from "react-hook-form";

type SystemCheckboxRulesProps = {
  required?: boolean | string;
  validate?: (value: any) => boolean | string;
};

interface SystemCheckboxProps {
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
}

const SystemCheckbox = ({
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
}: SystemCheckboxProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Controller
        name={attribute}
        control={control}
        disabled={disabled}
        rules={rules}
        render={({ field }) => (
          <>
            <span className={`${className}`}>
              <Checkbox
                id={field.name}
                className="flex items-center"
                disabled={disabled}
                checked={field.value || false}
                onChange={(e) => {
                  const value = e.target.checked;
                  field.onChange(value);
                  onChange?.(value);
                }}
              >
                {label}
                {rules?.required && <span className="text-red-500 ml-1">*</span>}
              </Checkbox>
            </span>
            {(showError || errors[attribute]) && errors[attribute] && (
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
        )}
      />
      {tooltip && <p className="text-xs text-gray-500">{tooltip}</p>}
    </div>
  );
};

export default SystemCheckbox;
