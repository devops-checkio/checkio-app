import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "es", "pt", "fr"],

  // Used when no locale matches
  defaultLocale: "es",

  // Disable locale detection to avoid redirects
  localeDetection: true,
});
