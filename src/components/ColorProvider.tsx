"use client";

import { colorCSSVariables } from "@/lib/colors";
import { useEffect } from "react";

export function ColorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply CSS custom properties to the document root
    const root = document.documentElement;

    Object.entries(colorCSSVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Cleanup function to remove custom properties when component unmounts
    return () => {
      Object.keys(colorCSSVariables).forEach((property) => {
        root.style.removeProperty(property);
      });
    };
  }, []);

  return <>{children}</>;
}
