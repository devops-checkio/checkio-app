import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const chekioButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium rounded-lg ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        primary:
          "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md",
        secondaryBlue:
          "bg-blue-100 text-blue-700 hover:bg-blue-200/90 border border-blue-200/50",
        search:
          "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md",
        refresh:
          "bg-blue-100 text-blue-700 hover:bg-blue-200/90 border border-blue-200/50",
        approve:
          "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md",
        reject:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface CHEKIOButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chekioButtonVariants> {
  asChild?: boolean;
}

const CHEKIOButton = React.forwardRef<HTMLButtonElement, CHEKIOButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(chekioButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
CHEKIOButton.displayName = "CHEKIOButton";

export { CHEKIOButton, chekioButtonVariants };
