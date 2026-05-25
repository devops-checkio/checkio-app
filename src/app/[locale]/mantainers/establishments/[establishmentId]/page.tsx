"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
  CHEKIOButton,
  CHEKIOLoading,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import {
  useGetCompanies,
  useGetEstablishmentById,
} from "@/service/mantainer.service";
import { ArrowLeft, Building2, CheckCircle2, Hospital, MapPin, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import EstablishmentModalUpsert from "../_components/establishment-modal-upsert";
import EstablishmentAttendanceDashboard from "./_components/establishment-attendance-dashboard";

enum EstablishmentDetailTab {
  PROFILE = "PROFILE",
  ATTENDANCE = "ATTENDANCE",
}

export default function EstablishmentDetailPage({
  params,
}: {
  params: Promise<{ establishmentId: string }>;
}) {
  const { establishmentId } = use(params);
  return <EstablishmentDetailContent establishmentId={establishmentId} />;
}

function EstablishmentDetailContent({
  establishmentId,
}: {
  establishmentId: string;
}) {
  const router = useRouter();
  const t = useTranslations("mantainers.establishments");
  const { canRead, canUpdate } = useCookieSession();
  const [activeTab, setActiveTab] = useState<EstablishmentDetailTab>(
    EstablishmentDetailTab.ATTENDANCE,
  );
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: establishment, isLoading, refetch } =
    useGetEstablishmentById(establishmentId);
  const { data: companies } = useGetCompanies({
    page: 1,
    pageSize: 100,
    sort: "asc",
    selector: true,
  });

  if (!canRead(OrganizationPermissionCode.ESTABLISHMENT_MAINTENANCE)) {
    return (
      <AccessNotGranted
        OrganizationPermissionCode={
          OrganizationPermissionCode.ESTABLISHMENT_MAINTENANCE
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <CHEKIOLoading />
      </div>
    );
  }

  const companyOptions =
    companies?.data?.map((company: any) => ({
      value: company.publicId,
      label: company.tradeName || company.businessName || company.publicId,
    })) ?? [];
  const canEdit = canUpdate(OrganizationPermissionCode.ESTABLISHMENT_MAINTENANCE);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-5 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/mantainers/establishments")}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100"
              aria-label={t("detail.buttons.back")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <Hospital className="h-4 w-4 text-blue-600" />
                <span>{t("breadcrumbs.maintainers")}</span>
                <span>/</span>
                <span>{t("breadcrumbs.establishments")}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-950">
                {establishment?.name ?? t("detail.fallbackName")}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {establishment?.code} · {establishment?.address}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {establishment?.isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("table.active")}
              </span>
            )}
            {canEdit && (
              <CHEKIOButton variant="secondaryBlue" onClick={() => setIsEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                {t("detail.buttons.edit")}
              </CHEKIOButton>
            )}
          </div>
        </div>
      </header>

      <div className="mb-5 flex flex-wrap gap-2 border-b border-gray-200">
        {Object.values(EstablishmentDetailTab).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
              activeTab === tab
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab === EstablishmentDetailTab.PROFILE
              ? t("detail.tabs.profile")
              : t("detail.tabs.attendance")}
          </button>
        ))}
      </div>

      {activeTab === EstablishmentDetailTab.PROFILE && establishment && (
        <section className="grid gap-4 md:grid-cols-12">
          <InfoCard
            icon={Building2}
            label={t("detail.basicInfo.code")}
            value={establishment.code}
          />
          <InfoCard
            icon={MapPin}
            label={t("detail.basicInfo.address")}
            value={establishment.address}
          />
          <InfoCard
            icon={Hospital}
            label={t("detail.basicInfo.timezone")}
            value={establishment.timezone}
          />
          <InfoCard
            icon={Building2}
            label={t("detail.basicInfo.companies")}
            value={`${establishment.companies?.length ?? 0}`}
          />
        </section>
      )}

      {activeTab === EstablishmentDetailTab.ATTENDANCE && (
        <EstablishmentAttendanceDashboard
          establishmentId={establishmentId}
          timezone={establishment?.timezone}
        />
      )}

      {establishment && (
        <EstablishmentModalUpsert
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          editingEstablishment={establishment}
          onSuccess={() => refetch()}
          companyOptions={companyOptions}
        />
      )}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:col-span-3">
      <div className="mb-3 inline-flex rounded-xl bg-blue-50 p-2 text-blue-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-gray-950">{value ?? "-"}</p>
    </div>
  );
}
