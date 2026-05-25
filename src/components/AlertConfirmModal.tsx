"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import * as React from "react";

export interface AlertConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  /** When true, shows destructive (red) accent styling */
  variant?: "default" | "destructive";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function AlertConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  maxWidth = "lg",
  variant = "destructive",
}: AlertConfirmModalProps) {
  const isDestructive = variant === "destructive";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%]",
            "border border-gray-200 bg-white shadow-xl",
            "duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "rounded-none",
            sizeClasses[maxWidth],
            "flex flex-col max-h-[90vh] overflow-hidden",
            className
          )}
        >
          {/* Header with optional left accent */}
          <div
            className={cn(
              "flex items-start gap-4 px-6 py-4 border-b border-gray-100",
              isDestructive && "border-l-4 border-l-red-500"
            )}
          >
            <div className="flex-1 min-w-0">
              <DialogPrimitive.Title className="text-lg font-semibold text-gray-900 tracking-tight">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description
                  asChild
                  className="mt-1 text-sm text-gray-500"
                >
                  <p>{description}</p>
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className={cn(
                "rounded-sm opacity-60 hover:opacity-100 transition-opacity",
                "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
                "disabled:pointer-events-none p-1 -m-1"
              )}
            >
              <span className="sr-only">Cerrar</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </DialogPrimitive.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
