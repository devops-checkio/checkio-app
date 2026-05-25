"use client";

import { cn } from "@/lib/utils";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";

export type LocaleType = "es" | "en" | "fr" | "pt";

interface CheckioInputDateProps {
  value?: string; // ISO string format
  onChange?: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  locale?: LocaleType;
  label?: string;
  required?: boolean;
  error?: string;
}

// Utility function to format date for display
const formatDateForInput = (isoString: string | undefined): string => {
  if (!isoString) return "";

  try {
    // Parse the ISO string and extract only the date part to avoid timezone issues
    const datePart = isoString.split("T")[0]; // Get "1995-11-15" from "1995-11-15T00:00:00.000Z"
    const [year, month, day] = datePart.split("-").map(Number);

    // Debug log
    console.log("formatDateForInput - Input:", isoString, "Parsed:", {
      year,
      month,
      day,
    });

    // Format directly without using Luxon to avoid timezone conversion
    const dayStr = String(day).padStart(2, "0");
    const monthStr = String(month).padStart(2, "0");
    const result = `${dayStr}/${monthStr}/${year}`;

    console.log("formatDateForInput - Result:", result);
    return result;
  } catch (error) {
    console.error("Error formatting date:", error);
  }

  return "";
};

// Utility function to format input as user types (DD/MM/YYYY)
const formatInputAsUserTypes = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, "");

  // Apply formatting based on length
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(
      4,
      8,
    )}`;
  }
};

// Utility function to parse input date to ISO
const parseInputToISO = (inputValue: string): string | null => {
  if (!inputValue.trim()) return null;

  try {
    // Try different date formats
    const formats = [
      "dd/MM/yyyy",
      "d/M/yyyy",
      "dd/M/yyyy",
      "d/MM/yyyy",
      "dd-MM-yyyy",
      "d-M-yyyy",
      "dd-M-yyyy",
      "d-MM-yyyy",
      "yyyy-MM-dd",
      "yyyy/MM/dd",
    ];

    for (const format of formats) {
      const parsed = DateTime.fromFormat(inputValue, format);
      if (parsed.isValid) {
        return parsed.toISO();
      }
    }

    // If no format matches, try parsing as ISO
    const isoParsed = DateTime.fromISO(inputValue);
    if (isoParsed.isValid) {
      return isoParsed.toISO();
    }
  } catch (error) {
    console.error("Error parsing date:", error);
  }

  return null;
};

export function CheckioInputDate({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  className,
  disabled = false,
  locale = "es",
  label,
  required = false,
  error,
}: CheckioInputDateProps) {
  const [inputValue, setInputValue] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);
  const [showError, setShowError] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [lastPropValue, setLastPropValue] = useState<string | undefined>(value);

  // Initialize input value on mount and when value changes
  useEffect(() => {
    if (!isFocused) {
      const formattedValue = formatDateForInput(value);
      setInputValue(formattedValue);
      setLastPropValue(value);
    }
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Apply formatting while user types
    const formattedValue = formatInputAsUserTypes(rawValue);
    setInputValue(formattedValue);

    if (formattedValue.trim() === "") {
      setIsValid(true);
      setShowError(false);
      onChange?.(null);
      return;
    }

    // Only validate if we have a complete date (DD/MM/YYYY)
    if (formattedValue.length === 10) {
      const isoDate = parseInputToISO(formattedValue);
      const isValidDate = isoDate !== null;

      setIsValid(isValidDate);
      setShowError(!isValidDate);

      if (isValidDate) {
        onChange?.(isoDate);
      }
    } else {
      // While typing, don't show validation errors
      setIsValid(true);
      setShowError(false);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue.trim() && !isValid) {
      setShowError(true);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowError(false);
  };

  const getBorderClass = () => {
    if (error || showError) return "border-red-500";
    // Only show green border if we have a complete valid date
    if (inputValue && isValid && inputValue.length === 10)
      return "border-green-500";
    return "";
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-none border border-gray-300 bg-white text-black px-3 py-2 text-sm",
            "ring-offset-background placeholder:text-gray-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus:border-blue-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            getBorderClass(),
            className,
          )}
        />

        {/* Validation indicator */}
        {inputValue && inputValue.length === 10 && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Error message - only show if error prop is not provided (internal validation) */}
      {!error && showError && (
        <p className="text-xs text-red-500">
          Formato de fecha inválido. Use dd/mm/aaaa
        </p>
      )}

      {/* Help text */}
      {!error &&
        !showError &&
        inputValue &&
        isValid &&
        inputValue.length === 10 && (
          <p className="text-xs text-green-600">Fecha válida</p>
        )}

      {/* Format examples - only show when there's no error prop and no input value */}
      {!error && !inputValue && (
        <p className="text-xs text-gray-500">
          Formatos aceptados: dd/mm/aaaa, dd-mm-aaaa, aaaa-mm-dd
        </p>
      )}
    </div>
  );
}
