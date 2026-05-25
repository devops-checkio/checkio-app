import { cn } from "@/lib/utils";
import * as React from "react";

export type CHEKIOTabsVariant = "default" | "pills" | "underline" | "modern";

interface TabsContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: CHEKIOTabsVariant;
}

const TabsContext = React.createContext<TabsContextValue>({});

export interface CHEKIOTabsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: CHEKIOTabsVariant;
}

const CHEKIOTabs = React.forwardRef<HTMLDivElement, CHEKIOTabsProps>(
  ({ className, children, value, onValueChange, variant = "modern", ...props }, ref) => {
    const contextValue = React.useMemo(
      () => ({ value, onValueChange, variant }),
      [value, onValueChange, variant]
    );

    const containerClasses = cn(
      "relative",
      {
        "border-b border-gray-200": variant === "default" || variant === "underline",
        "bg-gray-100 rounded-lg p-1": variant === "pills",
        "rounded-xl bg-gray-100/80 p-1.5": variant === "modern",
      },
      className
    );

    const innerClasses = cn(
      "flex",
      {
        "space-x-8": variant === "default" || variant === "underline",
        "space-x-1": variant === "pills",
        "gap-1": variant === "modern",
      }
    );

    return (
      <TabsContext.Provider value={contextValue}>
        <div ref={ref} className={containerClasses} {...props}>
          <div className={innerClasses}>{children}</div>
        </div>
      </TabsContext.Provider>
    );
  }
);
CHEKIOTabs.displayName = "CHEKIOTabs";

export interface CHEKIOTabProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  value?: string;
  label?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "primary" | "success" | "warning" | "danger" | "neutral";
}

const CHEKIOTab = React.forwardRef<HTMLButtonElement, CHEKIOTabProps>(
  (
    {
      className,
      active: activeProp,
      icon,
      children,
      value: tabValue,
      label,
      badge,
      badgeVariant = "primary",
      onClick,
      ...props
    },
    ref
  ) => {
    const { value: contextValue, onValueChange, variant = "modern" } =
      React.useContext(TabsContext);

    const isActive =
      activeProp !== undefined
        ? activeProp
        : contextValue !== undefined && contextValue === tabValue;

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (tabValue !== undefined && onValueChange) {
          onValueChange(tabValue);
        }
        onClick?.(e);
      },
      [tabValue, onValueChange, onClick]
    );

    const content = label !== undefined ? label : children;

    const badgeColors = {
      primary: "bg-blue-500 text-white",
      success: "bg-green-500 text-white",
      warning: "bg-amber-500 text-white",
      danger: "bg-red-500 text-white",
      neutral: "bg-gray-500 text-white",
    };

    const getTabClasses = () => {
      const baseClasses = "relative flex items-center gap-2 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

      switch (variant) {
        case "pills":
          return cn(
            baseClasses,
            "px-4 py-2 rounded-md",
            isActive
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          );

        case "underline":
          return cn(
            baseClasses,
            "px-4 py-3 border-b-2",
            isActive
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          );

        case "modern":
          return cn(
            baseClasses,
            "flex-1 min-w-0 justify-center px-4 py-2.5 rounded-lg font-medium transition-colors duration-200",
            isActive
              ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200/60"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
          );

        case "default":
        default:
          return cn(
            baseClasses,
            "px-4 py-3 border-b-2",
            isActive
              ? "border-blue-600 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          );
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(getTabClasses(), className)}
        onClick={handleClick}
        role="tab"
        aria-selected={isActive}
        {...props}
      >
        {icon && (
          <span className={cn(
            "h-4 w-4 transition-transform duration-200",
            isActive && "scale-110"
          )}>
            {icon}
          </span>
        )}
        <span className="truncate">{content}</span>
        {badge !== undefined && (
          <span
            className={cn(
              "ml-1 px-2 py-0.5 text-xs font-semibold rounded-full min-w-[20px] text-center",
              badgeColors[badgeVariant]
            )}
          >
            {badge}
          </span>
        )}
      </button>
    );
  }
);
CHEKIOTab.displayName = "CHEKIOTab";

export { CHEKIOTab, CHEKIOTabs };
