export interface FormatOption {
  value: string;
  label: string;
}

export const dateFormatOptions: FormatOption[] = [
  { value: "dd/MM/yyyy", label: "dd/MM/yyyy (15/01/2024)" },
  { value: "MM/dd/yyyy", label: "MM/dd/yyyy (01/15/2024)" },
  { value: "yyyy-MM-dd", label: "yyyy-MM-dd (2024-01-15)" },
  { value: "dd-MM-yyyy", label: "dd-MM-yyyy (15-01-2024)" },
  { value: "dd/MM/yy", label: "dd/MM/yy (15/01/24)" },
  { value: "dd MMM yyyy", label: "dd MMM yyyy (15 Ene 2024)" },
  { value: "dd MMMM yyyy", label: "dd MMMM yyyy (15 Enero 2024)" },
];

export const timeFormatOptions: FormatOption[] = [
  { value: "HH:mm", label: "HH:mm (08:30)" },
  { value: "hh:mm A", label: "hh:mm A (08:30 AM)" },
  { value: "HH:mm:ss", label: "HH:mm:ss (08:30:45)" },
  { value: "hh:mm:ss A", label: "hh:mm:ss A (08:30:45 AM)" },
  { value: "H:mm", label: "H:mm (8:30)" },
  { value: "h:mm A", label: "h:mm A (8:30 AM)" },
];

export const datetimeFormatOptions: FormatOption[] = [
  { value: "dd/MM/yyyy HH:mm", label: "dd/MM/yyyy HH:mm (15/01/2024 08:30)" },
  { value: "dd-MM-yyyy HH:mm", label: "dd-MM-yyyy HH:mm (15-01-2024 08:30)" },
  { value: "yyyy-MM-dd HH:mm", label: "yyyy-MM-dd HH:mm (2024-01-15 08:30)" },
  {
    value: "dd/MM/yyyy hh:mm A",
    label: "dd/MM/yyyy hh:mm A (15/01/2024 08:30 AM)",
  },
  {
    value: "dd/MM/yyyy HH:mm:ss",
    label: "dd/MM/yyyy HH:mm:ss (15/01/2024 08:30:45)",
  },
];

export const hoursFormatOptions: FormatOption[] = [
  { value: "default", label: "Número estándar (9.08)" },
  { value: "hours_hhmm", label: "Formato HH:mm (09:05)" },
  { value: "hours_decimal", label: "Decimal con unidad (9.08 hrs)" },
  { value: "hours_decimal_no_unit", label: "Decimal sin unidad (9.08)" },
  { value: "hours_minutes", label: "Minutos (545 min)" },
];
