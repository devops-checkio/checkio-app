import { cn } from "@/lib/utils";
import * as React from "react";

export interface CHEKIOActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "edit" | "delete" | "view" | "approve" | "reject";
  size?: "sm" | "md";
}

const CHEKIOActionButton = React.forwardRef<
  HTMLButtonElement,
  CHEKIOActionButtonProps
>(({ className, variant = "edit", size = "sm", children, ...props }, ref) => {
  const sizeStyles = {
    sm: "h-8 w-8 p-1",
    md: "h-10 w-10 p-2",
  };

  const variantStyles = {
    edit:
      "bg-orange-600 text-white hover:bg-orange-700 shadow-sm focus-visible:ring-orange-500/30",
    delete:
      "bg-red-600 text-white hover:bg-red-700 shadow-sm focus-visible:ring-red-500/30",
    view:
      "bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus-visible:ring-blue-500/30",
    approve:
      "bg-green-600 text-white hover:bg-green-700 shadow-sm focus-visible:ring-green-500/30",
    reject:
      "bg-red-600 text-white hover:bg-red-700 shadow-sm focus-visible:ring-red-500/30",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-all duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
CHEKIOActionButton.displayName = "CHEKIOActionButton";

export { CHEKIOActionButton };
