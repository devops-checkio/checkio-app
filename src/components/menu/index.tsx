"use client";

import { CommandDialogDemo } from "@/app/[locale]/_components/command-menu-modal";
import LoadingCheckIO from "@/app/[locale]/_components/loading";
import { useCookieSession } from "@/context/useCookieSession";
import { RoleType } from "@/dto/auth";
import { hasPendingConsent, useCheckConsent } from "@/service/consent.service";
import { CategoryScale } from "chart.js";
import Chart from "chart.js/auto";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { AppSidebar } from "../app-sidebar";
import { CHEKIONavbar } from "../CHEKIONavbar";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";

Chart.register(CategoryScale);

export default function MenuComponent({ children }: any) {
  const { isAuthenticated, isLoading, refreshAuth, profile } =
    useCookieSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isEmployeeOrCustom =
    profile?.role === RoleType.EMPLOYEE || profile?.role === RoleType.CUSTOM;
  const {
    data: consentStatus,
    isLoading: isConsentLoading,
    isFetching: isConsentFetching,
  } = useCheckConsent(undefined, isAuthenticated && isEmployeeOrCustom);

  // Ref para evitar redirecciones múltiples durante el proceso SSO
  const ssoProcessingRef = useRef(false);
  const redirectAttemptedRef = useRef(false);
  const wasAuthenticatedRef = useRef(false);

  // Detectar si el usuario llegó por SSO
  const isSSOAccess = () => {
    const ssoToken = searchParams.get("sso_token");
    const appId = searchParams.get("app_id");
    return !!(ssoToken && appId);
  };

  // Detectar si estamos en la página de recepción SSO
  const isSSOReceivePage = () => {
    return pathname.includes("/sso-receive");
  };

  // Detectar si estamos en una página pública (sin sesión requerida)
  const isPublicPageRoute = () => {
    return (
      pathname.includes("/public/") ||
      pathname.includes("/not-found") ||
      isSSOReceivePage()
    );
  };

  useEffect(() => {
    const isLoginPage = pathname.includes("/login");
    const isPublicPage =
      pathname.includes("/forgot-password") ||
      pathname.includes("/register") ||
      isPublicPageRoute();

    // Solo verificar autenticación si no estamos en páginas públicas y no está cargando
    if (!isLoginPage && !isPublicPage && !isLoading) {
      refreshAuth();
    }
  }, [pathname, refreshAuth, isLoading]);

  useEffect(() => {
    if (wasAuthenticatedRef.current && !isAuthenticated && !isLoading) {
      redirectAttemptedRef.current = false;
    }
    wasAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    // No hacer nada mientras está cargando
    if (isLoading) {
      return;
    }

    const isLoginPage = pathname.includes("/login");
    const isPublicPage =
      pathname.includes("/forgot-password") ||
      pathname.includes("/register") ||
      isPublicPageRoute();
    const lenguaje = pathname.split("/")[1] || "es";

    // Si estamos procesando SSO, no hacer redirecciones automáticas
    if (ssoProcessingRef.current) {
      console.log("SSO processing in progress, skipping redirects");
      return;
    }

    // Si llegamos por SSO y estamos en la página de recepción, marcar como procesando
    if (isSSOAccess() && isSSOReceivePage()) {
      ssoProcessingRef.current = true;
      console.log("SSO access detected, processing...");
      return;
    }

    // Solo redirigir cuando estemos 100% seguros del estado de autenticación
    // y no hayamos intentado redirigir ya
    if (
      !isAuthenticated &&
      !isLoginPage &&
      !isPublicPage &&
      !redirectAttemptedRef.current
    ) {
      redirectAttemptedRef.current = true;
      console.log("User not authenticated, redirecting to login");
      router.replace(`/${lenguaje}/login`);
    } else if (
      isAuthenticated &&
      isLoginPage &&
      !redirectAttemptedRef.current
    ) {
      redirectAttemptedRef.current = true;
      console.log("User authenticated on login page, redirecting to dashboard");
      setTimeout(() => {
        router.replace(`/${lenguaje}`);
      }, 100);
    }

    // Reset redirect attempt flag when pathname changes
    if (pathname !== window.location.pathname) {
      redirectAttemptedRef.current = false;
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Reset SSO processing flag when authentication state changes
  useEffect(() => {
    if (isAuthenticated && ssoProcessingRef.current) {
      console.log("SSO processing completed, user authenticated");
      ssoProcessingRef.current = false;
    }
  }, [isAuthenticated]);

  // Consent guard: redirect employees/custom to /consent when they lack required consents
  useEffect(() => {
    if (
      !isAuthenticated ||
      !isEmployeeOrCustom ||
      isConsentLoading ||
      isConsentFetching ||
      !consentStatus
    ) {
      return;
    }
    const needsConsent = hasPendingConsent(consentStatus);
    const isOnConsentPage =
      pathname?.includes("/consent/document") || pathname?.includes("/consent");
    if (needsConsent && !isOnConsentPage) {
      const locale = pathname?.split("/")[1] || "es";
      router.replace(`/${locale}/consent`);
    }
  }, [
    isAuthenticated,
    isEmployeeOrCustom,
    isConsentLoading,
    isConsentFetching,
    consentStatus,
    pathname,
    router,
  ]);

  const isLoginPage = pathname.includes("/login");
  const isPublicPage =
    pathname.includes("/forgot-password") ||
    pathname.includes("/register") ||
    isPublicPageRoute();

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return <LoadingCheckIO />;
  }

  // Para páginas públicas, mostrar directamente
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Para página de login, mostrar directamente
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Para páginas protegidas, solo mostrar contenido si está autenticado
  if (!isAuthenticated) {
    return <LoadingCheckIO />;
  }

  // Solo mostrar la interfaz completa cuando estemos 100% seguros de autenticación
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-w-0">
        <CHEKIONavbar />
        <CommandDialogDemo />
        <main className="flex-1 min-h-0 min-w-0 pt-14 overflow-y-auto">
          <div className="p-6 bg-[#f9fafb] min-h-full">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
