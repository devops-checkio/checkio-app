import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ErrorMessage } from "@hookform/error-message";
import { useEffect, useRef, useState } from "react";
import { Controller } from "react-hook-form";

type SystemMultiSelectRulesProps = {
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

type SystemMultiSelectProps = {
  label?: string;
  attribute: string;
  disabled?: boolean;
  className?: string;
  control: any;
  options?: any[];
  value?: any;
  rules?: SystemMultiSelectRulesProps;
  errors?: any;
  tooltip?: string;
  placeholder?: string;
  onChange?: (value: any) => void;
  onClear?: () => void;
  showClear?: boolean;
  showError?: boolean;
  isValid?: boolean | null;
  showSelectAll?: boolean;
  onSelectAll?: () => void;
  searchable?: boolean;
  maxItems?: number;
};

const SystemMultiSelect = ({
  control,
  label,
  options = [],
  attribute,
  value,
  placeholder = "Seleccione opciones...",
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
  showSelectAll = false,
  onSelectAll,
  searchable = true,
  maxItems,
}: SystemMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastFieldValueRef = useRef<any>(null);

  // Sync selectedValues with form value
  useEffect(() => {
    if (value === undefined || value === null) {
      setSelectedValues([]);
    } else if (Array.isArray(value)) {
      setSelectedValues(value);
    } else {
      setSelectedValues([]);
    }
  }, [value]);

  // Sync selectedValues with field value from Controller
  useEffect(() => {
    if (lastFieldValueRef.current !== undefined) {
      if (
        lastFieldValueRef.current === undefined ||
        lastFieldValueRef.current === null
      ) {
        setSelectedValues([]);
      } else if (Array.isArray(lastFieldValueRef.current)) {
        setSelectedValues(lastFieldValueRef.current);
      } else {
        setSelectedValues([]);
      }
    }
  }, [lastFieldValueRef.current]);

  const getBorderClass = () => {
    if (errors[attribute]) return "border-red-500";
    if (isValid === true) return "border-green-500";
    if (isValid === false) return "border-yellow-500";
    return "border-gray-300";
  };

  // Filter options based on search term
  const filteredOptions = options.filter((option) => {
    const label = String(option.label || option || "");
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, searchable]);

  const getSelectedLabels = () => {
    return selectedValues.map((value) => {
      const option = options.find((opt) => (opt.value || opt) === value);
      return option?.label || option || value;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Controller
        name={attribute}
        control={control}
        disabled={disabled}
        rules={rules}
        render={({ field }) => {
          // Update ref when field value changes
          if (lastFieldValueRef.current !== field.value) {
            lastFieldValueRef.current = field.value;
          }

          const handleSelect = (optionValue: string) => {
            const newValues = selectedValues.includes(optionValue)
              ? selectedValues.filter((v) => v !== optionValue)
              : [...selectedValues, optionValue];

            setSelectedValues(newValues);
            field.onChange(newValues);
            if (onChange) {
              onChange(newValues);
            }
          };

          const handleRemoveTag = (valueToRemove: string) => {
            const newValues = selectedValues.filter((v) => v !== valueToRemove);
            setSelectedValues(newValues);
            field.onChange(newValues);
            if (onChange) {
              onChange(newValues);
            }
          };

          const handleSelectAll = () => {
            const allValues = options.map((option) => option.value || option);
            setSelectedValues(allValues);
            field.onChange(allValues);
            if (onChange) {
              onChange(allValues);
            }
            if (onSelectAll) {
              onSelectAll();
            }
          };

          const handleClear = () => {
            setSelectedValues([]);
            field.onChange([]);
            if (onChange) {
              onChange([]);
            }
            if (onClear) {
              onClear();
            }
          };

          return (
            <>
              {(label || showSelectAll) && (
                <div className="flex justify-between items-center">
                  {label && (
                    <label className="text-gray-600">
                      {label}
                      {rules?.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                  )}
                  {showSelectAll && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs text-blue-500 hover:text-blue-600"
                    >
                      Seleccionar todas
                    </button>
                  )}
                </div>
              )}
              <div className={`relative ${className}`} ref={containerRef}>
                <div
                  onClick={() => !disabled && setIsOpen(!isOpen)}
                  className={`w-full min-h-[42px] p-2 border ${getBorderClass()} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                    disabled
                      ? "bg-gray-100 cursor-not-allowed"
                      : "cursor-pointer"
                  } ${isOpen ? "ring-2 ring-blue-500" : ""}`}
                >
                  <div className="flex flex-wrap gap-1 items-center">
                    {selectedValues.length > 0 ? (
                      <>
                        {getSelectedLabels().map((label, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1 max-w-full"
                          >
                            <span className="truncate">{label}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTag(selectedValues[index]);
                              }}
                              className="hover:text-blue-600 flex-shrink-0"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        {maxItems && selectedValues.length >= maxItems && (
                          <span className="text-gray-500 text-sm">
                            +{selectedValues.length - maxItems} más
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500">{placeholder}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex-1" />
                    <div className="flex items-center gap-1">
                      {showClear && selectedValues.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClear();
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                      <ChevronDownIcon
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          isOpen ? "transform rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Dropdown */}
                {isOpen && !disabled && (
                  <div
                    className={`z-[100] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden ${
                      dropdownPosition ? "fixed" : "absolute"
                    }`}
                    style={
                      dropdownPosition
                        ? {
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                            width: `${dropdownPosition.width}px`,
                          }
                        : undefined
                    }
                  >
                    {/* Search Input */}
                    {searchable && (
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}

                    {/* Options List */}
                    <div className="max-h-48 overflow-y-auto">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => {
                          const optionValue = option.value || option;
                          const optionLabel = option.label || option;
                          const isSelected =
                            selectedValues.includes(optionValue);

                          return (
                            <div
                              key={optionValue}
                              onClick={() => handleSelect(optionValue)}
                              className={`px-4 py-2 cursor-pointer hover:bg-blue-50 flex items-center gap-2 ${
                                isSelected ? "bg-blue-100" : ""
                              }`}
                            >
                              <div
                                className={`w-4 h-4 border rounded flex items-center justify-center ${
                                  isSelected
                                    ? "bg-blue-500 border-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm">{optionLabel}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                          No se encontraron opciones
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {(showError || errors[attribute]) && errors[attribute] && (
                <ErrorMessage
                  errors={errors}
                  name={attribute}
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
          );
        }}
      />
      {tooltip && <p className="text-xs text-gray-500">{tooltip}</p>}
    </div>
  );
};

export default SystemMultiSelect;
