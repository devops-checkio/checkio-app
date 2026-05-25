import { cn } from "@/lib/utils";
import * as React from "react";

/**
 * CHEKIOInput - Input moderno con esquinas redondeadas, transiciones suaves y estados de focus mejorados.
 */
const CHEKIOInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, value, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
        "placeholder:text-gray-400",
        "transition-all duration-200 ease-in-out",
        "hover:border-gray-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "ring-offset-background",
        className
      )}
      ref={ref}
      {...props}
      value={value === null ? "" : value}
    />
  );
});
CHEKIOInput.displayName = "CHEKIOInput";

export { CHEKIOInput };
