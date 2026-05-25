"use client";

import { CHEKIOButton } from "@/components";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCookieSession } from "@/context/useCookieSession";
import { ArrowLeft, ChevronDown, ChevronRight, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

type LocaleKey = "es" | "en" | "pt" | "fr";

const DOCUMENT_SECTIONS = [
  "intro",
  "controller",
  "purposes",
  "dataCategories",
  "legalBasis",
  "retention",
  "rights",
  "rightsProcedure",
  "transfers",
  "security",
  "contact",
] as const;

const SECTION_KEYS: Record<(typeof DOCUMENT_SECTIONS)[number], string> = {
  intro: "sectionIntro",
  controller: "sectionController",
  purposes: "sectionPurposes",
  dataCategories: "sectionDataCategories",
  legalBasis: "sectionLegalBasis",
  retention: "sectionRetention",
  rights: "sectionRights",
  rightsProcedure: "sectionRightsProcedure",
  transfers: "sectionTransfers",
  security: "sectionSecurity",
  contact: "sectionContact",
};

function DocumentSection({
  sectionKey,
  title,
  content,
  defaultOpen = false,
  primaryColor,
}: {
  sectionKey: string;
  title: string;
  content: string;
  defaultOpen?: boolean;
  primaryColor: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
          {isOpen ? (
            <ChevronDown
              className="h-5 w-5 flex-shrink-0"
              style={{ color: primaryColor }}
            />
          ) : (
            <ChevronRight
              className="h-5 w-5 flex-shrink-0"
              style={{ color: primaryColor }}
            />
          )}
          <h2
            className="text-lg font-semibold text-gray-900"
            style={{ borderLeftColor: primaryColor }}
            id={sectionKey}
          >
            {title}
          </h2>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5 pt-0 pl-12">
            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function AuthoritiesSection({
  title,
  intro,
  authorities,
  primaryColor,
}: {
  title: string;
  intro: string;
  authorities: Record<string, string>;
  primaryColor: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const order = ["CL", "BR", "AR", "MX", "CO", "PE", "UY", "other"];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
          {isOpen ? (
            <ChevronDown
              className="h-5 w-5 flex-shrink-0"
              style={{ color: primaryColor }}
            />
          ) : (
            <ChevronRight
              className="h-5 w-5 flex-shrink-0"
              style={{ color: primaryColor }}
            />
          )}
          <h2 className="text-lg font-semibold text-gray-900" id="authorities">
            {title}
          </h2>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5 pt-0 pl-12 space-y-2">
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              {intro}
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-base text-gray-700">
              {order.map(
                (key) =>
                  authorities[key] && (
                    <li key={key} className="leading-relaxed">
                      {authorities[key]}
                    </li>
                  )
              )}
            </ul>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function ConsentDocumentPage() {
  const t = useTranslations("consent.document");
  const params = useParams();
  const locale = (params?.locale as LocaleKey) || "es";
  const { getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const primaryColor = templateUser?.primary ?? "#2563eb";

  const getSectionTitle = (key: (typeof DOCUMENT_SECTIONS)[number]) =>
    t(SECTION_KEYS[key] as "sectionIntro");

  const authorities = t.raw("authorities") as Record<string, string> | undefined;
  const authoritiesObj =
    authorities && typeof authorities === "object" ? authorities : {};

  return (
    <div className="space-y-8 w-full">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-8">
          <CHEKIOButton variant="secondaryBlue" asChild>
            <Link href={`/${locale}/consent`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("backToPolicies")}
            </Link>
          </CHEKIOButton>
          <div className="flex items-center gap-4 flex-1 justify-end">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
          >
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("pageTitle")}
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">{t("pageSubtitle")}</p>
          </div>
          </div>
        </div>

        <nav className="mb-8 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
            {t("tocTitle")}
          </p>
          <ul className="space-y-1.5 text-sm">
            {DOCUMENT_SECTIONS.map((key, index) => (
              <li key={key}>
                <a
                  href={`#${key}`}
                  className="text-gray-700 hover:text-gray-900 hover:underline"
                >
                  {index + 1}. {getSectionTitle(key)}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#authorities"
                className="text-gray-700 hover:text-gray-900 hover:underline"
              >
                {DOCUMENT_SECTIONS.length + 1}. {t("authoritiesTitle")}
              </a>
            </li>
          </ul>
        </nav>

        <div className="space-y-4">
          {DOCUMENT_SECTIONS.map((key, index) => {
            const content = t(key as "intro");
            if (!content || content === key) return null;
            return (
              <DocumentSection
                key={key}
                sectionKey={key}
                title={getSectionTitle(key)}
                content={content}
                defaultOpen={index === 0}
                primaryColor={primaryColor}
              />
            );
          })}

          <AuthoritiesSection
            title={t("authoritiesTitle")}
            intro={t("authoritiesIntro")}
            authorities={authoritiesObj}
            primaryColor={primaryColor}
          />
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center">
          <CHEKIOButton variant="secondaryBlue" asChild>
            <Link href={`/${locale}/consent`}>{t("backToPolicies")}</Link>
          </CHEKIOButton>
        </div>
      </div>
    </div>
  );
}
