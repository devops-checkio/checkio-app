"use client";

import { useCookieSession } from "@/context/useCookieSession";
import { RoleType } from "@/dto/auth";
import { hasPendingConsent, useCheckConsent } from "@/service/consent.service";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import HomeAdmin from "./_components/HomeAdmin";
import HomeCustom from "./_components/HomeCustom";
import HomeEmployee from "./_components/HomeEmployee";

export default function DashboardPage() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, profile } = useCookieSession();
  const {
    data: consentStatus,
    isLoading: isConsentLoading,
    isFetching: isConsentFetching,
  } = useCheckConsent(
    undefined,
    isAuthenticated &&
      (profile?.role === RoleType.EMPLOYEE || profile?.role === RoleType.CUSTOM)
  );

  // Post-login: redirect to consent if employee lacks required consents
  useEffect(() => {
    if (
      !isAuthenticated ||
      isConsentLoading ||
      isConsentFetching ||
      !consentStatus ||
      profile?.role === RoleType.ADMIN
    ) {
      return;
    }
    const needsConsent = hasPendingConsent(consentStatus);
    const isOnConsentPage = pathname?.includes("/consent");
    if (needsConsent && !isOnConsentPage) {
      router.replace(`/${locale}/consent`);
    }
  }, [
    isAuthenticated,
    isConsentLoading,
    isConsentFetching,
    consentStatus,
    profile?.role,
    pathname,
    locale,
    router,
  ]);

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  // Render different home components based on role type
  switch (profile?.role) {
    case RoleType.ADMIN:
      return <HomeAdmin />;
    case RoleType.EMPLOYEE:
      return <HomeEmployee />;
    case RoleType.CUSTOM:
      return <HomeCustom />;
    default:
      // Fallback to employee view if role is not recognized
      return <HomeEmployee />;
  }
}
