import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export const proxy = createMiddleware({
  ...routing,
  // Enable locale detection
  localeDetection: true,
  // Always redirect to a locale
  alternateLinks: true,
});

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  // - … the models folder for face-api.js
  // - … other static assets
  matcher: [
    // Skip all internal paths (_next)
    // Exclude `monitoring`: Sentry tunnel (next.config.js tunnelRoute) must not get a locale prefix.
    "/((?!_next|api|trpc|models|monitoring|.*\\..*).*)",
    // Optional: Match all pathnames except for the ones that start with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - models (model files)
  ],
};
