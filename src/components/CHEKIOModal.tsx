"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import * as React from "react";

export interface CHEKIOModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

const CHEKIOModal = React.forwardRef<HTMLDivElement, CHEKIOModalProps>(
  ({ isOpen, onClose, title, children, className, size = "4xl" }, ref) => {
    // Cerrar con Escape
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
          onClick={onClose}
          aria-hidden
        />

        {/* Modal container */}
        <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={cn(
              "relative w-full max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl pointer-events-auto",
              "border border-gray-100",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              sizeClasses[size],
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
                <h2
                  id="modal-title"
                  className="text-xl font-semibold text-gray-900 tracking-tight"
                >
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 pb-6 pt-2 max-h-[calc(90vh-88px)]">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
CHEKIOModal.displayName = "CHEKIOModal";

export { CHEKIOModal };
