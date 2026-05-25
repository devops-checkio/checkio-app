"use client";

import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";
import * as React from "react";
import { Controller } from "react-hook-form";
import { TimePickerInput } from "./time-picker-input";

interface TimePickerProps {
  name: string;
  control: any;
  rules?: any;
  label?: string;
  error?: boolean;
  errorMessage?: string;
  value?: string | Date;
  onChange: (value: Date) => void;
  withSeconds?: boolean;
  disabled?: boolean;
}

export function TimePicker({
  name,
  control,
  rules,
  label,
  error,
  errorMessage,
  value,
  onChange,
  withSeconds = false,
  disabled = false,
}: TimePickerProps) {
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);
  const secondRef = React.useRef<HTMLInputElement>(null);

  const dateValue = value
    ? typeof value === "string"
      ? new Date(value)
      : value
    : undefined;

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { value, onChange: fieldOnChange } }) => (
        <div>
          <div className="flex items-end gap-2">
            <div className="grid gap-1 text-center">
              <Label htmlFor="hours" className="text-xs">
                Hora
              </Label>
              <TimePickerInput
                picker="hours"
                date={dateValue}
                setDate={(date) => {
                  fieldOnChange(date);
                  onChange && onChange(date as Date);
                }}
                ref={hourRef}
                onRightFocus={() => minuteRef.current?.focus()}
                disabled={disabled}
              />
            </div>
            <div className="grid gap-1 text-center">
              <Label htmlFor="minutes" className="text-xs">
                Minutos
              </Label>
              <TimePickerInput
                picker="minutes"
                date={dateValue}
                setDate={(date) => {
                  fieldOnChange(date);
                  onChange && onChange(date as Date);
                }}
                ref={minuteRef}
                onLeftFocus={() => hourRef.current?.focus()}
                onRightFocus={() => secondRef.current?.focus()}
                disabled={disabled}
              />
            </div>
            {withSeconds && (
              <div className="grid gap-1 text-center">
                <Label htmlFor="seconds" className="text-xs">
                  Segundos
                </Label>
                <TimePickerInput
                  picker="seconds"
                  date={dateValue}
                  setDate={(date) => {
                    fieldOnChange(date);
                    onChange && onChange(date as Date);
                  }}
                  ref={secondRef}
                  onLeftFocus={() => minuteRef.current?.focus()}
                  disabled={disabled}
                />
              </div>
            )}
            <div className="flex h-10 items-center">
              <Clock className="ml-2 h-4 w-4" />
            </div>
          </div>
          {error && errorMessage && (
            <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
          )}
        </div>
      )}
    />
  );
}
