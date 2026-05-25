"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type LocaleType = "es" | "en" | "fr" | "pt";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  locale?: LocaleType;
}

// Utility function to create a date in UTC
const createUTCDate = (year: number, month: number, day: number): Date => {
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
};

// Utility function to format date for display
const formatDateForDisplay = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
};

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Seleccionar fecha",
  className,
  disabled = false,
  locale = "es",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return date ? date.getUTCFullYear() : new Date().getFullYear();
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    return date ? date.getUTCMonth() : new Date().getMonth();
  });
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    return date ? date.getUTCDate() : 1;
  });

  // Generate year options (from 1900 to current year + 10)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - 1900 + 11 },
    (_, i) => 1900 + i
  ).reverse();

  // Month options
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  // Get days in month
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDateSelect = (day: number) => {
    const newDate = createUTCDate(selectedYear, selectedMonth, day);
    onDateChange?.(newDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    onDateChange?.(undefined);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className={cn(
            "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formatDateForDisplay(date) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          {/* Year and Month Selectors */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Año
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Mes
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Days Grid */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Día
            </label>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => handleDateSelect(day)}
                  className={cn(
                    "p-2 text-sm rounded-md hover:bg-blue-100 transition-colors",
                    date &&
                      date.getUTCFullYear() === selectedYear &&
                      date.getUTCMonth() === selectedMonth &&
                      date.getUTCDate() === day
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-50 hover:bg-blue-100"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-gray-600"
            >
              Limpiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
