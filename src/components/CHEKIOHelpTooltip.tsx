"use client";

import { HelpCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CHEKIOHelpTooltipProps {
  content: string;
  articleId?: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function CHEKIOHelpTooltip({
  content,
  articleId,
  position = "top",
  className = "",
}: CHEKIOHelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent",
    right:
      "right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent",
  };

  const handleViewArticle = () => {
    if (articleId) {
      const locale = window.location.pathname.split("/")[1] || "es";
      router.push(`/${locale}/help/article/${articleId}`);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        aria-label="Ayuda"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`absolute z-50 w-72 ${positionClasses[position]}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-900 text-white text-sm rounded-lg shadow-lg p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="flex-1 leading-relaxed">{content}</p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="shrink-0 text-gray-400 hover:text-white transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {articleId && (
                <button
                  onClick={handleViewArticle}
                  className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                >
                  Ver artículo completo →
                </button>
              )}
            </div>
            <div
              className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
            />
          </div>
        </>
      )}
    </div>
  );
}
