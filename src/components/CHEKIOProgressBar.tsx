import { cn } from "@/lib/utils";
import * as React from "react";

export interface CHEKIOProgressBarProps {
  current: number;
  total: number;
  text?: string;
  className?: string;
  showFraction?: boolean;
  showText?: boolean;
}

const CHEKIOProgressBar = React.forwardRef<
  HTMLDivElement,
  CHEKIOProgressBarProps
>(
  (
    { current, total, text, className, showFraction = true, showText = true },
    ref
  ) => {
    const percentage = (current / total) * 100;

    return (
      <div ref={ref} className={cn("space-y-1", className)}>
        <div className="flex items-center gap-2">
          <div className="relative w-full h-4 bg-gray-200 rounded-none overflow-hidden border border-gray-300">
            <div
              className="absolute inset-0 bg-blue-600"
              style={{
                width: `${percentage}%`,
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
              }}
            />
            {showFraction && (
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium z-10">
                {current}/{total}
              </span>
            )}
          </div>
        </div>
        {showText && text && (
          <div className="text-xs text-gray-600">{text}</div>
        )}
      </div>
    );
  }
);
CHEKIOProgressBar.displayName = "CHEKIOProgressBar";

export { CHEKIOProgressBar };
