import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ErrorMessage } from "@hookform/error-message";
import { useEffect, useRef, useState } from "react";
import { Controller } from "react-hook-form";

interface Option {
  value: string;
  label: string;
  key?: string;
}

interface SystemSelectProps {
  label?: string;
  atribute: string;
  control: any;
  options: Option[];
  errors?: any;
  rules?: {
    required?: boolean | string;
    [key: string]: any;
  };
  showError?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  tooltip?: string;
  mode?: "multiple" | "tags" | undefined;
  onChange?: (value: any) => void;
  isValid?: boolean | null;
}

const SystemSelect = ({
  label,
  atribute,
  control,
  options,
  errors,
  rules,
  showError = false,
  className = "",
  placeholder = "Seleccione una opción",
  disabled = false,
  tooltip = "",
  mode,
  onChange,
  isValid,
}: SystemSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSelectedLabels = () => {
    if (!selectedValues.length) return placeholder;
    return selectedValues
      .map((value) => options.find((opt) => opt.value === value)?.label)
      .join(", ");
  };

  const handleSelect = (value: string) => {
    let newValues: string[];
    if (mode === "multiple") {
      newValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
    } else {
      newValues = [value];
      setIsOpen(false);
    }
    setSelectedValues(newValues);
    onChange?.(mode === "multiple" ? newValues : newValues[0]);
  };

  const removeValue = (value: string) => {
    const newValues = selectedValues.filter((v) => v !== value);
    setSelectedValues(newValues);
    onChange?.(mode === "multiple" ? newValues : newValues[0]);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-gray-600">
          {label}
          {rules?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Controller
        name={atribute}
        control={control}
        rules={rules}
        render={({ field }) => (
          <>
            <div className={`relative ${className}`} ref={selectRef}>
              <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full p-2 border ${
                  errors?.[atribute]
                    ? "border-red-500"
                    : isValid === true
                    ? "border-green-500"
                    : isValid === false
                    ? "border-yellow-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center justify-between ${
                  disabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex flex-wrap gap-1">
                  {mode === "multiple" ? (
                    selectedValues.length > 0 ? (
                      selectedValues.map((value) => (
                        <span
                          key={value}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                        >
                          {options.find((opt) => opt.value === value)?.label}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeValue(value);
                            }}
                            className="hover:text-blue-600"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">{placeholder}</span>
                    )
                  ) : (
                    <span
                      className={selectedValues.length ? "" : "text-gray-500"}
                    >
                      {getSelectedLabels()}
                    </span>
                  )}
                </div>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    isOpen ? "transform rotate-180" : ""
                  }`}
                />
              </div>
              {isOpen && !disabled && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {options.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                        selectedValues.includes(option.value)
                          ? "bg-blue-100"
                          : ""
                      }`}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {(showError || errors?.[atribute]) && errors?.[atribute] && (
              <ErrorMessage
                errors={errors}
                name={atribute}
                render={({ message }) => (
                  <p className="text-xs text-red-500">
                    {message === "Required"
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

export default SystemSelect;
