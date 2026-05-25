import { cn } from "@/lib/utils";
import * as React from "react";

export interface CHEKIOListboxProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
  multiple?: boolean;
}

const CHEKIOListbox = React.forwardRef<HTMLSelectElement, CHEKIOListboxProps>(
  ({ className, options, multiple = false, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-32 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          multiple && "min-h-[120px]",
          className
        )}
        ref={ref}
        multiple={multiple}
        {...props}
      >
        {options.map((option, index) => (
          <option
            key={`${option.value}-${index}`}
            value={option.value}
            className="text-gray-900 bg-white"
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);
CHEKIOListbox.displayName = "CHEKIOListbox";

export { CHEKIOListbox };
