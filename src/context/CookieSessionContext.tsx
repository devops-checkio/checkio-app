"use client";
import { PersmissionDto, ProfileResponseDto, RoleType } from "@/dto/auth";
import { IntegrationProductModule } from "@/dto/enum/integration-product-module.enum";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import axiosInstance from "@/utils/axios";
import { useRouter } from "next/navigation";
import React, {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const defaultTemplateUser: TemplateUser = {
  primary: "#1752E7",
  secondary: "#1752E7",
  success: "#1752E7",
  warning: "#1752E7",
  danger: "#1752E7",
  info: "#1752E7",
  logo: "/logos/logo.svg",
};

const normalizeTemplateUser = (
  value?: Partial<TemplateUser> | null,
): TemplateUser => ({
  primary: value?.primary || defaultTemplateUser.primary,
  secondary: value?.secondary || defaultTemplateUser.secondary,
  success: value?.success || defaultTemplateUser.success,
  warning: value?.warning || defaultTemplateUser.warning,
  danger: value?.danger || defaultTemplateUser.danger,
  info: value?.info || defaultTemplateUser.info,
  logo: value?.logo || defaultTemplateUser.logo,
});

export type TemplateUser = {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  logo: string;
};

type CookieSessionContextType = {
  addProfile: (profile: ProfileResponseDto) => void;
  logout: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  user: any;
  addUser: (user: any) => void;
  isAuthenticated: boolean;
  profile: ProfileResponseDto | null;
  canCreate: (code: OrganizationPermissionCode) => boolean;
  canRead: (code: OrganizationPermissionCode) => boolean;
  canUpdate: (code: OrganizationPermissionCode) => boolean;
  canDelete: (code: OrganizationPermissionCode) => boolean;
  companyId: string | null;
  updateCompanyId: (companyId: string) => void;
  addTemplateUser: (templateUser: TemplateUser) => void;
  getTemplateUser: () => TemplateUser;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
  isRefreshing: boolean;
  isProfileAdmin: () => boolean;
  isProfileEmployee: () => boolean;
  isProfileCustom: () => boolean;
  hasProductModule: (module: IntegrationProductModule) => boolean;
  hasStudentsModule: () => boolean;
};

export const CookieSessionContext =
  createContext<CookieSessionContextType | null>(null);

interface CookieSessionProviderProps {
  children: ReactNode;
}

const CookieSessionProvider: React.FC<CookieSessionProviderProps> = ({
  children,
}) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileResponseDto | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [templateUser, setTemplateUser] = useState<TemplateUser | null>(
    defaultTemplateUser,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ref para evitar race conditions
  const isInitialized = useRef(false);

  // Clear session completely - Sin dependencias circulares
  const clearSession = useCallback(() => {
    setProfile(null);
    setCompanyId(null);
    setTemplateUser(defaultTemplateUser);
    setUser(null);

    // Clear sessionStorage (client-side state only)
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("companyId");
      sessionStorage.removeItem("templateUser");
    }
  }, []);

  // Check authentication status with httpOnly cookies
  const checkAuthStatus = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else if (!isInitialized.current) {
        setIsLoading(true);
      }

      try {
        const response = await axiosInstance.get("/client/auth/profile");
        const profileData = response.data;

        setProfile(profileData);

        if (typeof window !== "undefined") {
          const storedCompanyId = sessionStorage.getItem("companyId");
          if (storedCompanyId) {
            setCompanyId(storedCompanyId);
          }

          // Load templateUser from sessionStorage if exists (fallback local)
          const storedTemplateUser = sessionStorage.getItem("templateUser");
          if (storedTemplateUser) {
            try {
              setTemplateUser(
                normalizeTemplateUser(JSON.parse(storedTemplateUser)),
              );
            } catch (error) {
              setTemplateUser(defaultTemplateUser);
            }
          } else {
            // Set default template user
            sessionStorage.setItem(
              "templateUser",
              JSON.stringify(defaultTemplateUser),
            );
            setTemplateUser(defaultTemplateUser);
          }

          // Always try to refresh organization theme from backend when session exists
          try {
            const themeResponse = await axiosInstance.get("/client/auth/theme");
            const normalizedTheme = normalizeTemplateUser(themeResponse.data);
            setTemplateUser(normalizedTheme);
            sessionStorage.setItem(
              "templateUser",
              JSON.stringify(normalizedTheme),
            );
          } catch (themeError) {
            // Keep current/local theme if backend theme is temporarily unavailable
          }
        }
      } catch (error: any) {
        // If 401 or 403 error, just clear session (normal for unauthenticated users)
        if (error.response?.status === 401 || error.response?.status === 403) {
          clearSession();
          return; // Don't log as error, this is expected
        }

        clearSession();
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isInitialized.current = true;
      }
    },
    [clearSession],
  );

  // Manual login
  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      setIsLoading(true);

      try {
        await axiosInstance.post("/client/auth/login", credentials);

        await checkAuthStatus();

        const lenguaje = window.location.pathname.split("/")[1] || "es";
        router.push(`/${lenguaje}`);
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [checkAuthStatus, router],
  );

  // Manual logout
  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      // Clear state immediately
      clearSession();

      // Call backend logout (this will clear httpOnly cookies)
      await axiosInstance.post("/client/auth/logout");

      // Redirect to login
      router.push("/login");
    } catch (error) {
      // Still clear the local session
      clearSession();
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [clearSession, router]);

  // Initialize context - Mejorado
  useEffect(() => {
    setIsClient(true);

    // Solo verificar auth si no se ha inicializado
    if (!isInitialized.current) {
      checkAuthStatus();
    }

    // Listen for unauthorized events from axios interceptor
    const handleUnauthorized = () => {
      clearSession();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth:unauthorized", handleUnauthorized);
    }

    // Cleanup
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("auth:unauthorized", handleUnauthorized);
      }
    };
  }, [checkAuthStatus, clearSession]);

  const addProfile = useCallback((profile: ProfileResponseDto) => {
    setProfile(profile);
  }, []);

  const addUser = useCallback((user: any) => {
    setUser(user);
  }, []);

  const updateCompanyId = useCallback((companyId: string) => {
    setCompanyId(companyId);
    // Store in sessionStorage for client-side state persistence
    if (typeof window !== "undefined") {
      sessionStorage.setItem("companyId", companyId);
    }
  }, []);

  const addTemplateUser = useCallback((templateUser: TemplateUser) => {
    const normalizedTheme = normalizeTemplateUser(templateUser);
    setTemplateUser(normalizedTheme);
    // Store in sessionStorage for client-side state persistence
    if (typeof window !== "undefined") {
      sessionStorage.setItem("templateUser", JSON.stringify(normalizedTheme));
    }
  }, []);

  const getTemplateUser = useCallback(() => {
    if (typeof window === "undefined") return defaultTemplateUser;
    const templateUser = sessionStorage.getItem("templateUser");
    return templateUser ? JSON.parse(templateUser) : defaultTemplateUser;
  }, []);

  const refreshAuth = useCallback(async () => {
    await checkAuthStatus(true);
  }, [checkAuthStatus]);

  const canCreate = useCallback(
    (code: OrganizationPermissionCode) => {
      return (
        profile?.RolePermission?.find(
          (x: PersmissionDto) => x.code === code && x.create,
        ) != null
      );
    },
    [profile],
  );

  const canRead = useCallback(
    (code: OrganizationPermissionCode) => {
      return (
        profile?.RolePermission?.find(
          (x: PersmissionDto) => x.code === code && x.read,
        ) != null
      );
    },
    [profile],
  );

  const canUpdate = useCallback(
    (code: OrganizationPermissionCode) => {
      return (
        profile?.RolePermission?.find(
          (x: PersmissionDto) => x.code === code && x.update,
        ) != null
      );
    },
    [profile],
  );

  const canDelete = useCallback(
    (code: OrganizationPermissionCode) => {
      return (
        profile?.RolePermission?.find(
          (x: PersmissionDto) => x.code === code && x.delete,
        ) != null
      );
    },
    [profile],
  );

  const isProfileAdmin = useCallback(() => {
    return profile?.role === RoleType.ADMIN;
  }, [profile]);

  const isProfileEmployee = useCallback(() => {
    return profile?.role === RoleType.EMPLOYEE;
  }, [profile]);

  const isProfileCustom = useCallback(() => {
    return profile?.role === RoleType.CUSTOM;
  }, [profile]);

  const hasProductModule = useCallback(
    (module: IntegrationProductModule) => {
      if (module === IntegrationProductModule.ETL) {
        return profile?.moduleIntegrationEtlEnabled === true;
      }
      return profile?.moduleIntegrationApiEnabled === true;
    },
    [profile],
  );

  const hasStudentsModule = useCallback(() => {
    return profile?.moduleStudentsEnabled === true;
  }, [profile]);

  if (!isClient) {
    return null;
  }

  const isAuthenticated = !!profile;

  return (
    <CookieSessionContext.Provider
      value={{
        profile,
        user,
        isAuthenticated,
        logout,
        login,
        addUser,
        addProfile,
        canCreate,
        canRead,
        canUpdate,
        canDelete,
        companyId,
        updateCompanyId,
        addTemplateUser,
        getTemplateUser,
        isLoading,
        refreshAuth,
        isRefreshing,
        isProfileAdmin,
        isProfileEmployee,
        isProfileCustom,
        hasProductModule,
        hasStudentsModule,
      }}
    >
      {children}
    </CookieSessionContext.Provider>
  );
};

export default CookieSessionProvider;
