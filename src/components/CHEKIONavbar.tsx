"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { useCookieSession } from "@/context/useCookieSession";
import { EmployeeResponseDto } from "@/dto/employees";
import { splitEmployeeSearchQuery } from "@/lib/employee-search-query";
import { getPageTitleTranslationKey } from "@/lib/nav/route-titles";
import { cn } from "@/lib/utils";
import {
  useGetCompaniesSelector,
  useGetEmployees,
} from "@/service/mantainer.service";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  HelpCircle,
  Loader2,
  LogOut,
  Menu,
  Pencil,
  Search,
  User,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { CHEKIOActionButton } from "./CHEKIOActionButton";
import { CHEKIOAvatar, getInitials } from "./CHEKIOAvatar";
import { CHEKIOInput } from "./CHEKIOInput";
import {
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "./CHEKIOSelect";
import LanguageSwitcher from "./language-switcher";

/** WCAG-based relative luminance (0–1) for a hex color string. */
function hexLuminance(hex: string): number {
  const clean = hex.replace("#", "").slice(0, 6);
  if (clean.length < 6) return 0;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Returns the foreground color (white or dark) that achieves the highest
 * WCAG contrast ratio against the given background hex color.
 */
function bestContrastColor(bgHex: string): string {
  const L = hexLuminance(bgHex);
  const onWhite = (1 + 0.05) / (L + 0.05);
  const onDark = (L + 0.05) / (0 + 0.05);
  return onWhite >= onDark ? "#ffffff" : "#1a1a1a";
}

export function CHEKIONavbar() {
  const { state, toggleSidebar } = useSidebar();
  const isSidebarCollapsed = state === "collapsed";
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("navbar");
  const tSidebar = useTranslations("sidebar");
  const {
    logout,
    profile,
    companyId,
    updateCompanyId,
    isAuthenticated,
    getTemplateUser,
  } = useCookieSession();

  const templateUser = getTemplateUser();
  const primaryColor = templateUser?.primary ?? "#eb1d2e";
  const secondaryColor = templateUser?.secondary ?? "#eb1d2e";
  const primarySurfaceMuted = `${primaryColor}15`;
  const navFgColor = bestContrastColor(secondaryColor);

  const { data: companies, isLoading: isLoadingCompanies } =
    useGetCompaniesSelector(
      {
        page: 1,
        pageSize: 100,
        sort: "asc",
        selector: true,
      },
      {
        enabled: isAuthenticated,
      },
    );

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearchTerm(value);
  }, 400);

  const employeeListFilter = useMemo(() => {
    return {
      page: 1,
      pageSize: 10,
      sort: "asc" as const,
      companyId: companyId || "",
      status: "active" as const,
      ...splitEmployeeSearchQuery(debouncedSearchTerm),
    };
  }, [companyId, debouncedSearchTerm]);

  const hasEmployeeSearchQuery = debouncedSearchTerm.trim().length > 0;

  const { data: employeesData, isLoading: isLoadingEmployees } =
    useGetEmployees(employeeListFilter, {
      enabled: !!companyId && hasEmployeeSearchQuery,
    });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
    if (value.length > 0) {
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
    }
  };

  const resetEmployeeSearchState = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setIsSearchOpen(false);
  }, []);

  const handleOpenEmployeeProfile = (employee: EmployeeResponseDto) => {
    const locale = pathname?.split("/")[1] || "es";
    router.push(`/${locale}/mantainers/employees/${employee.publicId}`);
    resetEmployeeSearchState();
  };

  const handleOpenEmployeeAssistance = (employee: EmployeeResponseDto) => {
    const locale = pathname?.split("/")[1] || "es";
    router.push(
      `/${locale}/assistance/management?documentNumber=${encodeURIComponent(employee.documentNumber)}`,
    );
    resetEmployeeSearchState();
  };

  const getBorderColor = (gender: string) => {
    switch (gender) {
      case "MALE":
        return "border-blue-400";
      case "FEMALE":
        return "border-pink-400";
      case "OTHER":
        return "border-purple-400";
      default:
        return "border-gray-300";
    }
  };

  const getPlaceholderBg = (gender: string) => {
    switch (gender) {
      case "MALE":
        return "bg-blue-50";
      case "FEMALE":
        return "bg-pink-50";
      case "OTHER":
        return "bg-purple-50";
      default:
        return "bg-gray-100";
    }
  };

  const getPlaceholderIconColor = (gender: string) => {
    switch (gender) {
      case "MALE":
        return "text-blue-400";
      case "FEMALE":
        return "text-pink-400";
      case "OTHER":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const pageTitleKey = getPageTitleTranslationKey(pathname ?? "/");
  const pageTitle = pageTitleKey ? tSidebar(pageTitleKey) : tSidebar("home");
  const selectedCompany = companies?.data.find((c) => c.publicId === companyId);

  const displayName = profile?.user?.name || profile?.user?.email || "Usuario";
  const displayEmail = profile?.user?.email ?? "";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        notificationsMenuRef.current &&
        !notificationsMenuRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    if (isUserMenuOpen || isNotificationsOpen || isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen, isNotificationsOpen, isSearchOpen]);

  const handleCompanyChange = useCallback(
    (newCompanyId: string) => {
      updateCompanyId(newCompanyId);
    },
    [updateCompanyId],
  );

  // Auto-select first company when companyId is undefined and companies are loaded
  useEffect(() => {
    if (companies?.data?.length && !companyId && companies.data[0]?.publicId) {
      updateCompanyId(companies.data[0].publicId);
    }
  }, [companies?.data, companyId, updateCompanyId]);

  return (
    <nav
      className="fixed top-0 z-50 h-14 border-b border-gray-200 shadow-sm right-0 transition-[left] duration-300 ease-linear"
      style={{
        left: isSidebarCollapsed
          ? "var(--sidebar-width-icon)"
          : "var(--sidebar-width)",
        backgroundColor: secondaryColor,
      }}
    >
      <div className="flex h-full items-center justify-between gap-4 px-4">
        {/* Left: Toggle + Page Title */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="shrink-0 rounded-md p-1.5 transition-colors"
            style={{
              color: navFgColor,
              ["--tw-hover-bg" as string]: `${navFgColor}15`,
            }}
            aria-label={
              isSidebarCollapsed ? t("sidebar.expand") : t("sidebar.collapse")
            }
          >
            {isSidebarCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </button>
          <h1
            className="truncate text-lg font-bold sm:text-xl lg:text-2xl"
            style={{ color: navFgColor }}
          >
            {pageTitle}
          </h1>
        </div>

        {/* Center: Search */}
        <div
          className="hidden flex-1 max-w-xl md:flex md:justify-center"
          ref={searchRef}
        >
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 z-10 opacity-70"
              style={{ color: navFgColor }}
            />
            <CHEKIOInput
              type="search"
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchTerm.length > 0) {
                  setIsSearchOpen(true);
                }
              }}
              className="rounded-md border-gray-200 bg-gray-50 pl-10"
              aria-label={t("searchAriaLabel")}
            />

            {/* Search Results Dropdown */}
            {isSearchOpen && debouncedSearchTerm.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-md border border-gray-200 bg-white shadow-lg z-50 max-h-96 overflow-y-auto">
                {isLoadingEmployees ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-6 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{t("searchLoading")}</span>
                  </div>
                ) : !employeesData?.data || employeesData.data.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <User className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">
                      {t("searchNoResults")}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t("searchNoResultsHint")}
                    </p>
                  </div>
                ) : (
                  <div className="py-1">
                    <div
                      className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100"
                      style={{ backgroundColor: primarySurfaceMuted }}
                    >
                      {t("searchResultsCount", {
                        count: employeesData.data.length,
                      })}
                    </div>
                    {employeesData.data.map((employee) => {
                      const gender = employee.gender || "";
                      return (
                        <div
                          key={employee.publicId}
                          className="flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-gray-50"
                        >
                          <div
                            className={`w-10 h-10 rounded-full border-2 ${getBorderColor(
                              gender,
                            )} overflow-hidden ${getPlaceholderBg(
                              gender,
                            )} flex shrink-0 items-center justify-center`}
                          >
                            {employee.photo ? (
                              <Image
                                src={employee.photo}
                                alt={`${employee.firstName} ${employee.lastName}`}
                                width={40}
                                height={40}
                                className="h-full w-full object-cover object-center"
                              />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-5 w-5 ${getPlaceholderIconColor(
                                  gender,
                                )}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-mono">
                                {employee.documentNumber}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span>{employee.code}</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <CHEKIOActionButton
                              variant="edit"
                              type="button"
                              title={t("searchOpenProfile")}
                              aria-label={t("searchOpenProfile")}
                              onClick={() =>
                                handleOpenEmployeeProfile(employee)
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </CHEKIOActionButton>
                            <CHEKIOActionButton
                              variant="view"
                              type="button"
                              title={t("searchOpenAssistance")}
                              aria-label={t("searchOpenAssistance")}
                              onClick={() =>
                                handleOpenEmployeeAssistance(employee)
                              }
                            >
                              <CalendarDays className="h-4 w-4" />
                            </CHEKIOActionButton>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Company Selector, Bell, Help, User Profile */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Company Selector */}
          {companies && companies.data.length > 0 && (
            <div className="hidden sm:block">
              <CHEKIOSelect
                value={companyId || ""}
                onValueChange={handleCompanyChange}
              >
                <CHEKIOSelectTrigger className="w-[200px]">
                  <CHEKIOSelectValue placeholder={t("company.select")}>
                    {selectedCompany?.businessName}
                  </CHEKIOSelectValue>
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  {companies.data.map((company) => (
                    <CHEKIOSelectItem
                      key={company.publicId}
                      value={company.publicId}
                    >
                      {company.businessName}
                    </CHEKIOSelectItem>
                  ))}
                </CHEKIOSelectContent>
              </CHEKIOSelect>
            </div>
          )}

          {/* Notifications dropdown */}
          <div className="relative" ref={notificationsMenuRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative rounded-md p-2 transition-colors"
              style={{ color: navFgColor }}
              aria-label={t("notifications.ariaLabel")}
            >
              <Bell className="h-5 w-5" />
              {/* Badge - uncomment when notifications are implemented */}
              {/* <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#eb1d2e] px-1 text-[10px] font-medium text-white">
                3
              </span> */}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-md border border-gray-200 bg-white shadow-lg">
                <div
                  className="border-b border-gray-200 px-3 py-2 text-sm font-medium text-gray-900"
                  style={{ backgroundColor: primarySurfaceMuted }}
                >
                  {t("notifications.title")}
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  <div className="px-3 py-4 text-center text-sm text-gray-500">
                    {t("notifications.empty")}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help icon */}
          <button
            onClick={() => {
              const locale = pathname?.split("/")[1] || "es";
              router.push(`/${locale}/help`);
            }}
            className="rounded-md p-2 transition-colors"
            style={{ color: navFgColor }}
            aria-label={t("help.ariaLabel")}
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher compact />

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors min-w-0"
              style={{ color: navFgColor }}
            >
              <div className="hidden min-w-0 text-right sm:block">
                <div className="truncate text-sm font-medium">
                  {displayName || "Usuario"}
                </div>
                <div className="truncate text-xs opacity-70">
                  {profile?.role || "Usuario"}
                </div>
              </div>
              <CHEKIOAvatar
                src={undefined}
                alt={displayName || "Usuario"}
                fallback={getInitials(displayName || "?")}
                size="default"
                className="shrink-0"
              />
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  isUserMenuOpen && "rotate-180",
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
                <div
                  className="border-b border-gray-200 px-3 py-2"
                  style={{ backgroundColor: primarySurfaceMuted }}
                >
                  {displayName && (
                    <p className="truncate text-sm font-medium text-gray-900">
                      {displayName}
                    </p>
                  )}
                  {displayEmail && (
                    <p className="truncate text-xs text-gray-500">
                      {displayEmail}
                    </p>
                  )}
                </div>
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("user.logout")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
