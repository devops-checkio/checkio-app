import { cn } from "@/lib/utils";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";

// Wrapper component to ensure CHEKIOSelect works correctly with react-hook-form
// This normalizes empty/null values to undefined for Radix UI Select
const CHEKIOSelect = ({
  value,
  onValueChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>) => {
  // Normalize empty string, null, or undefined to undefined
  // This ensures the component is always controlled and prevents
  // "uncontrolled to controlled" warnings
  const normalizedValue = React.useMemo(() => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return value;
  }, [value]);

  // Wrap onValueChange to prevent clearing when empty string is passed
  const handleValueChange = React.useCallback(
    (newValue: string) => {
      // Only call onValueChange if there's a valid value or if it's explicitly undefined
      // Don't call with empty string as it would clear the selection
      if (newValue !== "" && onValueChange) {
        onValueChange(newValue);
      }
    },
    [onValueChange]
  );

  return (
    <SelectPrimitive.Root
      value={normalizedValue}
      onValueChange={handleValueChange}
      {...props}
    />
  );
};
CHEKIOSelect.displayName = "CHEKIOSelect";

const CHEKIOSelectGroup = SelectPrimitive.Group;

const CHEKIOSelectValue = SelectPrimitive.Value;

const CHEKIOSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
      "placeholder:text-gray-400",
      "transition-all duration-200 ease-in-out",
      "hover:border-gray-300",
      "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:ring-offset-0",
      "data-[placeholder]:text-gray-400",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200",
      "ring-offset-background [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
CHEKIOSelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const CHEKIOSelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
CHEKIOSelectScrollUpButton.displayName =
  SelectPrimitive.ScrollUpButton.displayName;

const CHEKIOSelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
CHEKIOSelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const CHEKIOSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border border-gray-100 bg-white text-gray-900 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <CHEKIOSelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1.5",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <CHEKIOSelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
CHEKIOSelectContent.displayName = SelectPrimitive.Content.displayName;

const CHEKIOSelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-2 pl-3 pr-3 text-xs font-medium text-gray-500", className)}
    {...props}
  />
));
CHEKIOSelectLabel.displayName = SelectPrimitive.Label.displayName;

const CHEKIOSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-3 text-sm outline-none transition-colors",
      "text-gray-900 hover:bg-gray-50 focus:bg-gray-50 data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-blue-600" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
CHEKIOSelectItem.displayName = SelectPrimitive.Item.displayName;

const CHEKIOSelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-100", className)}
    {...props}
  />
));
CHEKIOSelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectGroup,
  CHEKIOSelectItem,
  CHEKIOSelectLabel,
  CHEKIOSelectScrollDownButton,
  CHEKIOSelectScrollUpButton,
  CHEKIOSelectSeparator,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
};
