"use client";

import { Button } from "@/components/ui/button";
import { CloseCircleOutlined } from "@ant-design/icons";
import { Loader2 } from "lucide-react";
import React from "react";

type CheckIOButtonColor =
  | "default"
  | "success"
  | "danger"
  | "info"
  | "alert"
  | "excel"
  | "neutral";

interface CheckIOButtonProps {
  onClick?: () => void;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  color?: CheckIOButtonColor | "disabled";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "outline" | "ghost";
  /**
   * Agrega un color deshabilitado y permite usar el botón sin onClick.
   */
}

const colorClassMap: Record<
  NonNullable<CheckIOButtonProps["color"]>,
  { solid: string; outline: string; ghost: string }
> = {
  default: {
    solid: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg",
    outline:
      "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700",
    ghost: "text-blue-600 hover:bg-blue-50 hover:text-blue-700",
  },
  success: {
    solid:
      "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg",
    outline:
      "border-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700",
    ghost: "text-green-600 hover:bg-green-50 hover:text-green-700",
  },
  danger: {
    solid: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg",
    outline:
      "border-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700",
    ghost: "text-red-600 hover:bg-red-50 hover:text-red-700",
  },
  info: {
    solid: "bg-cyan-600 hover:bg-cyan-700 text-white shadow-md hover:shadow-lg",
    outline:
      "border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-700",
    ghost: "text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700",
  },
  alert: {
    solid:
      "bg-yellow-600 hover:bg-yellow-700 text-white shadow-md hover:shadow-lg",
    outline:
      "border-2 border-yellow-600 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-700",
    ghost: "text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700",
  },
  disabled: {
    solid: "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none",
    outline: "border-2 border-gray-300 text-gray-400 cursor-not-allowed",
    ghost: "text-gray-400 cursor-not-allowed",
  },
  excel: {
    solid:
      "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg",
    outline:
      "border-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700",
    ghost: "text-green-600 hover:bg-green-50 hover:text-green-700",
  },
  neutral: {
    solid:
      "bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md border border-gray-200",
    outline:
      "border-2 border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300 bg-white/80",
    ghost: "text-gray-600 hover:bg-white/50 hover:text-gray-700 bg-transparent",
  },
};

const sizeClassMap = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

/**
 * Modern template button for Check In/Out actions with gradient effects and multiple variants.
 *
 * @param onClick - Function to execute on button click (optional)
 * @param label - Optional label for the button
 * @param icon - Optional icon to display (default: CloseCircleOutlined)
 * @param className - Optional additional class names
 * @param color - Button color style: "default", "success", "danger", "info", "alert", "disabled", "excel", "neutral"
 * @param type - Button type: "button", "submit", "reset"
 * @param disabled - If true, disables the button
 * @param loading - If true, shows loading spinner
 * @param size - Button size: "sm", "md", "lg"
 * @param variant - Button variant: "solid", "outline", "ghost"
 */
export const CheckIOButton: React.FC<CheckIOButtonProps> = ({
  onClick,
  label,
  icon = <CloseCircleOutlined className="w-4 h-4" />,
  className = "",
  color = "default",
  type = "button",
  disabled = false,
  loading = false,
  size = "md",
  variant = "solid",
}) => {
  const isDisabled = disabled || color === "disabled" || loading;
  const colorClasses =
    colorClassMap[color || "default"] || colorClassMap["default"];
  const sizeClasses = sizeClassMap[size];
  const variantClasses = colorClasses[variant] || colorClasses["solid"];

  return (
    <Button
      className={`
        flex items-center justify-center gap-2 font-semibold
        ${variantClasses}
        ${sizeClasses}
        rounded-lg transition-all duration-300 transform hover:scale-[1.02]
        ${isDisabled ? "hover:scale-100" : ""}
        ${className}
      `}
      onClick={isDisabled || !onClick ? undefined : onClick}
      type={type}
      disabled={isDisabled}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {label}
    </Button>
  );
};
