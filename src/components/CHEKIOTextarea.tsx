import { cn } from "@/lib/utils";
import * as React from "react";

export interface CHEKIOTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // CHEKIO Textarea specific props can be added here
  variant?: "default" | "error";
}

const CHEKIOTextarea = React.forwardRef<
  HTMLTextAreaElement,
  CHEKIOTextareaProps
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
CHEKIOTextarea.displayName = "CHEKIOTextarea";

export { CHEKIOTextarea };
