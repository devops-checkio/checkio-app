"use client";

import { CheckIOButton } from "@/components/template/checkIO-button";
import { Input, Typography } from "antd";
import { ArrowLeft, Shield } from "lucide-react";

const { Title } = Typography;
const { Search } = Input;

interface TitleProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: {
    href?: string;
    label: string;
  }[];
  onBack?: () => void;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function TitleHeader({
  title,
  subtitle,
  breadcrumbs,
  onBack,
  actions,
  icon = <Shield className="w-5 h-5 text-blue-600" />,
}: TitleProps) {
  return (
    <div className="w-full bg-white border-b border-gray-100 shadow-sm px-6 py-4 mb-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 shadow-md">
                <span className="text-blue-600 text-xl">{icon}</span>
              </div>
            )}
            <h1 className="text-2xl font-semibold text-gray-900 truncate">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {actions}
          {onBack && (
            <CheckIOButton
              type="button"
              label="Regresar"
              icon={<ArrowLeft className="w-4 h-4" />}
              color="neutral"
              variant="outline"
              onClick={onBack}
            />
          )}
        </div>
      </div>
      {breadcrumbs && (
        <nav className="flex items-center gap-1 mt-3 ml-1 overflow-x-auto">
          {breadcrumbs.map((crumb, index) => (
            <div key={`${crumb.label}-${index}`} className="flex items-center">
              <span
                className="text-xs text-gray-400 hover:text-blue-600 transition-colors cursor-pointer px-1 rounded"
                tabIndex={0}
                role="link"
                style={{ outline: "none" }}
              >
                {crumb.label}
              </span>
              {index < breadcrumbs.length - 1 && (
                <span className="text-xs text-gray-300 mx-1 select-none">
                  ›
                </span>
              )}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}
