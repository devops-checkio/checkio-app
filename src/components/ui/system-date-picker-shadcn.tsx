"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ErrorMessage } from "@hookform/error-message";
import { DateTime } from "luxon";
import { Controller } from "react-hook-form";
import { DatePicker } from "./date-picker";

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
  placeholder?: string;
  locale?: "es" | "en" | "fr" | "pt";
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
  placeholder = "Seleccionar fecha",
  locale = "es",
}: SystemDatePickerProps) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-gray-600">
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
          // Convert ISO string to Date object for the DatePicker
          const getDateValue = (): Date | undefined => {
            if (!field.value) return undefined;

            try {
              if (typeof field.value === "string") {
                // Handle ISO string
                const dateTime = DateTime.fromISO(field.value);
                if (dateTime.isValid) {
                  return dateTime.toJSDate();
                }
              } else if (field.value instanceof Date) {
                // Already a Date object
                return field.value;
              }
            } catch (error) {
              console.error("Error parsing date value:", error);
            }

            return undefined;
          };

          const handleDateChange = (date: Date | undefined) => {
            if (date) {
              // Convert Date to ISO string for form storage
              const isoDate = DateTime.fromJSDate(date).toISO();
              field.onChange(isoDate);
            } else {
              field.onChange(null);
            }
          };

                        return (
                <>
                  <DatePicker
                    date={getDateValue()}
                    onDateChange={handleDateChange}
                    placeholder={placeholder}
                    className={cn(
                      className,
                      errors[attribute] ? "border-red-500" : "border-gray-300"
                    )}
                    disabled={disabled}
                    locale={locale}
                  />
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
          );
        }}
      />
      {tooltip && <p className="text-xs text-gray-500">{tooltip}</p>}
    </div>
  );
};

export default SystemDatePicker;
