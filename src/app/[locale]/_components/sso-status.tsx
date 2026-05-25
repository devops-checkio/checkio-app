"use client";

import { Badge } from "@/components/ui/badge";
import { useCookieSession } from "@/context/useCookieSession";
import { ExternalLink, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export function SSOStatus() {
  const { isAuthenticated, profile } = useCookieSession();
  const router = useRouter();

  const handleSSOAccess = () => {
    const lenguaje = window.location.pathname.split("/")[1] || "es";
    router.push(`/${lenguaje}/sso-receive`);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Badge variant="outline" className="flex items-center space-x-1">
        <Shield className="w-3 h-3" />
        <span>SSO Ready</span>
      </Badge>
      <button
        onClick={handleSSOAccess}
        className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
      >
        <ExternalLink className="w-3 h-3" />
        <span>SSO Access</span>
      </button>
    </div>
  );
}
