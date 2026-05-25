"use client";

import { CHEKIOButton } from "@/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface LanguageSwitcherProps {
  compact?: boolean;
}

export default function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");

  const handleLanguageChange = (newLocale: string) => {
    // Use window.location.pathname to get the full path including locale
    const fullPathname =
      typeof window !== "undefined" ? window.location.pathname : "";

    // Split the pathname into segments
    const segments = fullPathname.split("/").filter(Boolean);

    // If the first segment is a locale, remove it
    if (segments.length > 0 && ["es", "en", "pt", "fr"].includes(segments[0])) {
      segments.shift(); // Remove the current locale
    }

    // Build the new path
    const newPath =
      segments.length > 0
        ? `/${newLocale}/${segments.join("/")}`
        : `/${newLocale}`;

    // Use Next.js router directly
    router.push(newPath);
  };

  const getLanguageName = (locale: string) => {
    switch (locale) {
      case "es":
        return "Español";
      case "en":
        return "English";
      case "pt":
        return "Português";
      case "fr":
        return "Français";
      default:
        return locale;
    }
  };

  const getFlag = (locale: string) => {
    switch (locale) {
      case "es":
        return "🇪🇸";
      case "en":
        return "🇺🇸";
      case "pt":
        return "🇧🇷";
      case "fr":
        return "🇫🇷";
      default:
        return "🌐";
    }
  };

  const languages = [
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "pt", name: "Português", flag: "🇧🇷" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <button
            className="flex items-center gap-1.5 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100"
            aria-label={t("changeLanguage")}
          >
            <Globe className="h-5 w-5" />
            <span className="text-base">{getFlag(locale)}</span>
          </button>
        ) : (
          <CHEKIOButton
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover:bg-gray-50 transition-colors duration-200"
          >
            <Globe className="h-4 w-4 text-blue-600" />
            <span className="text-lg">{getFlag(locale)}</span>
            <span className="font-medium">{getLanguageName(locale)}</span>
          </CHEKIOButton>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200 ${
              locale === lang.code
                ? "bg-blue-50 border-l-4 border-blue-500"
                : ""
            }`}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className="font-medium">{lang.name}</span>
            {locale === lang.code && (
              <span className="ml-auto text-blue-600 text-sm">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
