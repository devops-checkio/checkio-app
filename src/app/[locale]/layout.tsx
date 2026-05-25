import GoogleMapsProvider from "@/components/google-maps-provider";
import MenuComponent from "@/components/menu";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "@/components/ui/toaster";
import CookieSessionProvider from "@/context/CookieSessionContext";
import { loadMessages } from "@/i18n/loadMessages";
import { routing } from "@/i18n/routing";
import { ConfigProvider } from "antd";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  let messages;
  try {
    messages = await loadMessages(locale);
  } catch {
    notFound();
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <QueryProvider>
        <CookieSessionProvider>
          <GoogleMapsProvider>
            <ConfigProvider>
              <MenuComponent>{children}</MenuComponent>
            </ConfigProvider>
          </GoogleMapsProvider>
        </CookieSessionProvider>
      </QueryProvider>
      <Toaster />
    </NextIntlClientProvider>
  );
}
