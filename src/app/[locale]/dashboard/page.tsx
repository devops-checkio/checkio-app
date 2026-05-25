"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * /dashboard redirects to the root dashboard (Inicio) which is at /[locale]
 */
export default function DashboardRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "es";

  useEffect(() => {
    router.replace(`/${locale}`);
  }, [locale, router]);

  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
    </div>
  );
}
