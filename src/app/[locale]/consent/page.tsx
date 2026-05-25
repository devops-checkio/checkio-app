"use client";

import { CHEKIOButton, CHEKIOInput } from "@/components";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  consentKeys,
  ConsentResponseDecision,
  hasPendingConsent,
  useCheckConsent,
  useGetActivePolicy,
  type ConsentPurposeDto,
  type ConsentStatusDto,
  useRespondConsent,
} from "@/service/consent.service";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, PenLine, Shield, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type LocaleKey = "es" | "en" | "pt" | "fr";
type PurposeResponse = ConsentResponseDecision | undefined;

function responseFromStoredConsent(
  purposeCode: string,
  status: ConsentStatusDto,
): PurposeResponse {
  switch (purposeCode) {
    case "PHOTO_ON_CHECKIN":
      return status.hasPhotoConsent
        ? ConsentResponseDecision.ACCEPTED
        : ConsentResponseDecision.DECLINED;
    case "BIOMETRY":
      return status.hasBiometryConsent
        ? ConsentResponseDecision.ACCEPTED
        : ConsentResponseDecision.DECLINED;
    case "GEOLOCATION":
      return status.hasGeolocationConsent
        ? ConsentResponseDecision.ACCEPTED
        : ConsentResponseDecision.DECLINED;
    case "EMAIL":
      return status.hasEmailConsent
        ? ConsentResponseDecision.ACCEPTED
        : ConsentResponseDecision.DECLINED;
    default:
      return undefined;
  }
}

function PurposeCard({
  purpose,
  content,
  isRequired,
  response,
  onResponseChange,
  interactionDisabled,
  t,
}: {
  purpose: ConsentPurposeDto;
  content: string;
  isRequired: boolean;
  response?: PurposeResponse;
  onResponseChange?: (response: ConsentResponseDecision) => void;
  interactionDisabled?: boolean;
  t: (key: string) => string;
}) {
  const nameKey = purpose.nameKey.replace("consent.purpose.", "");
  const purposeName =
    t(`purpose.${nameKey}` as "purpose.attendanceRecord") || purpose.nameKey;
  const isAccepted = response === ConsentResponseDecision.ACCEPTED;
  const isDeclined = response === ConsentResponseDecision.DECLINED;
  const statusText = isRequired
    ? t("informativo")
    : isAccepted
      ? t("responseAccepted")
      : isDeclined
        ? t("responseDeclined")
        : t("responsePending");
  const statusClassName = isRequired
    ? "bg-amber-50 text-amber-700 border border-amber-200"
    : isAccepted
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : isDeclined
        ? "bg-red-50 text-red-700 border border-red-200"
        : "bg-gray-100 text-gray-600 border border-gray-200";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-gray-900">
              {purposeName}
            </h3>
            <span
              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                isRequired
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {isRequired ? t("required") : t("optional")}
            </span>
            <span
              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusClassName}`}
            >
              {statusText}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
          {!isRequired && !interactionDisabled && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <CHEKIOButton
                variant={isAccepted ? "primary" : "secondaryBlue"}
                type="button"
                onClick={() =>
                  onResponseChange?.(ConsentResponseDecision.ACCEPTED)
                }
                className="flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("acceptOption")}
              </CHEKIOButton>
              <CHEKIOButton
                variant="secondaryBlue"
                type="button"
                onClick={() =>
                  onResponseChange?.(ConsentResponseDecision.DECLINED)
                }
                className={`flex items-center justify-center gap-2 ${
                  isDeclined
                    ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    : ""
                }`}
              >
                <XCircle className="h-4 w-4" />
                {t("declineOption")}
              </CHEKIOButton>
            </div>
          )}
          {isRequired && (
            <p className="text-xs text-amber-600 mt-2 italic">
              {t("informativo")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConsentPage() {
  const t = useTranslations("consent");
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const locale = (params?.locale as LocaleKey) || "es";

  const { data: policy, isLoading, error } = useGetActivePolicy();
  const {
    data: consentStatus,
    isLoading: isConsentStatusLoading,
    isFetching: isConsentStatusFetching,
  } = useCheckConsent();
  const respondMutation = useRespondConsent();

  const [responses, setResponses] = useState<Record<string, PurposeResponse>>(
    {}
  );
  const [confirmationTyped, setConfirmationTyped] = useState("");

  const agreePhrase = t("agreePhrase");
  const isConfirmationValid =
    confirmationTyped.trim().toLowerCase() === agreePhrase.toLowerCase();

  const optionalPurposes = useMemo(
    () =>
      policy?.purposes.filter((p) => !p.isRequired) ?? [],
    [policy]
  );

  const handleResponseChange = useCallback(
    (code: string, response: ConsentResponseDecision) => {
      setResponses((prev) => ({ ...prev, [code]: response }));
    },
    []
  );

  const allResponded = useMemo(
    () => optionalPurposes.every((purpose) => responses[purpose.code] !== undefined),
    [optionalPurposes, responses]
  );

  const answeredCount = useMemo(
    () =>
      optionalPurposes.filter((purpose) => responses[purpose.code] !== undefined)
        .length,
    [optionalPurposes, responses]
  );

  const acceptedCount = useMemo(
    () =>
      optionalPurposes.filter(
        (purpose) => responses[purpose.code] === ConsentResponseDecision.ACCEPTED
      ).length,
    [optionalPurposes, responses]
  );

  const declinedCount = useMemo(
    () =>
      optionalPurposes.filter(
        (purpose) => responses[purpose.code] === ConsentResponseDecision.DECLINED
      ).length,
    [optionalPurposes, responses]
  );

  const isReviewOnly = Boolean(
    consentStatus &&
      !isConsentStatusLoading &&
      !isConsentStatusFetching &&
      !hasPendingConsent(consentStatus),
  );

  const handleSubmitResponses = useCallback(async () => {
    if (!policy) return;

    if (!allResponded) {
      toast({
        title: t("incompleteResponsesTitle"),
        description: t("respondRequired"),
        variant: "destructive",
      });
      return;
    }

    const payload = {
      purposes: optionalPurposes.map((purpose) => ({
        purposeCode: purpose.code,
        response: responses[purpose.code]!,
        acceptedContent:
          responses[purpose.code] === ConsentResponseDecision.ACCEPTED
            ? purpose.content
            : undefined,
      })),
      method: "WEB" as const,
    };

    try {
      await respondMutation.mutateAsync(payload);

      queryClient.setQueriesData(
        { queryKey: consentKeys.check() },
        () => ({
          hasPhotoConsent:
            responses.PHOTO_ON_CHECKIN === ConsentResponseDecision.ACCEPTED,
          hasBiometryConsent:
            responses.BIOMETRY === ConsentResponseDecision.ACCEPTED,
          hasGeolocationConsent:
            responses.GEOLOCATION === ConsentResponseDecision.ACCEPTED,
          hasEmailConsent:
            responses.EMAIL === ConsentResponseDecision.ACCEPTED,
          hasAllRequiredConsents: true,
          pendingPurposes: [],
        })
      );

      await queryClient.invalidateQueries({ queryKey: consentKeys.check() });
      await queryClient.refetchQueries({
        queryKey: consentKeys.check(),
        type: "active",
      });

      toast({
        title: t("success"),
        variant: "default",
      });
      router.replace(`/${locale}`);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : t("submitError");
      toast({
        title: t("errorTitle"),
        description: message,
        variant: "destructive",
      });
    }
  }, [
    policy,
    allResponded,
    optionalPurposes,
    responses,
    respondMutation,
    queryClient,
    toast,
    t,
    router,
    locale,
  ]);

  const handleReject = useCallback(() => {
    router.back();
  }, [router]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-14 w-14 rounded-xl flex-shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 rounded" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
          </div>

          {/* Purpose cards skeleton - matches PurposeCard layout */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  {i > 1 && (
                    <Skeleton className="h-5 w-5 rounded flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-40 rounded" />
                      <Skeleton className="h-5 w-16 rounded" />
                    </div>
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-4/5 rounded" />
                    {i === 1 && (
                      <Skeleton className="h-4 w-3/4 rounded mt-1" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Confirmation section skeleton */}
          <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-72 rounded" />
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-10 w-full max-w-md rounded" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <Skeleton className="h-10 w-24 rounded" />
              <Skeleton className="h-10 w-36 rounded" />
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Skeleton className="h-4 w-48 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-800 font-medium">
            No se pudo cargar la política de consentimiento.
          </p>
          <CHEKIOButton
            variant="secondaryBlue"
            onClick={() => router.back()}
            className="mt-4"
          >
            Volver
          </CHEKIOButton>
        </div>
      </div>
    );
  }

  const localeContent = (content: Record<string, string>) =>
    content[locale] || content.es || "";

  const requiredPurposes = policy.purposes.filter((p) => p.isRequired);

  return (
    <div className="space-y-8">
      {isReviewOnly && (
        <div
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
          role="status"
        >
          {t("reviewOnlyInfo")}
        </div>
      )}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              {t("subtitle")} v{policy.version}
            </p>
          </div>
        </div>

        {policy.preamble && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 mb-6">
            <h2 className="text-base font-semibold text-blue-900 mb-2">
              {t("preambleTitle")}
            </h2>
            <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
              {policy.preamble[locale] || policy.preamble.es}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {requiredPurposes.map((purpose) => (
            <PurposeCard
              key={purpose.code}
              purpose={purpose}
              content={localeContent(purpose.content)}
              isRequired={true}
              t={t}
            />
          ))}

          {optionalPurposes.length > 0 && !isReviewOnly && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-5">
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                <span className="font-medium">
                  {t("answeredSummary", {
                    answered: answeredCount,
                    total: optionalPurposes.length,
                  })}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("acceptedSummary", { count: acceptedCount })}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                  <XCircle className="h-3.5 w-3.5" />
                  {t("declinedSummary", { count: declinedCount })}
                </span>
              </div>
              {!allResponded && (
                <p className="mt-3 text-sm text-amber-700">
                  {t("respondRequired")}
                </p>
              )}
            </div>
          )}

          {optionalPurposes.map((purpose) => (
            <PurposeCard
              key={purpose.code}
              purpose={purpose}
              content={localeContent(purpose.content)}
              isRequired={false}
              response={
                isReviewOnly && consentStatus
                  ? responseFromStoredConsent(purpose.code, consentStatus)
                  : responses[purpose.code]
              }
              onResponseChange={
                isReviewOnly
                  ? undefined
                  : (response) => handleResponseChange(purpose.code, response)
              }
              interactionDisabled={isReviewOnly}
              t={t}
            />
          ))}
        </div>

        {!isReviewOnly && (
          <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    isConfirmationValid
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {isConfirmationValid ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <PenLine className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-4">
                  <p className="text-sm text-gray-600">
                    {t("typeToConfirm")}
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 font-mono text-base font-medium text-gray-800">
                    &quot;{agreePhrase}&quot;
                  </div>
                  <div className="relative max-w-md">
                    <CHEKIOInput
                      value={confirmationTyped}
                      onChange={(e) => setConfirmationTyped(e.target.value)}
                      placeholder={agreePhrase}
                      className={`pr-10 ${
                        confirmationTyped.length > 0 && !isConfirmationValid
                          ? "border-amber-300 focus-visible:ring-amber-500"
                          : ""
                      } ${
                        isConfirmationValid
                          ? "border-emerald-300 focus-visible:ring-emerald-500"
                          : ""
                      }`}
                    />
                    {isConfirmationValid && (
                      <CheckCircle2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <CHEKIOButton
                variant="secondaryBlue"
                onClick={handleReject}
                disabled={respondMutation.isPending}
              >
                {t("reject")}
              </CHEKIOButton>
              <CHEKIOButton
                variant="primary"
                onClick={handleSubmitResponses}
                disabled={
                  respondMutation.isPending ||
                  !isConfirmationValid ||
                  !allResponded
                }
              >
                {respondMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {t("saveResponses")}...
                  </>
                ) : (
                  t("saveResponses")
                )}
              </CHEKIOButton>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-6 text-center">
          <Link
            href={`/${locale}/consent/document`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {t("privacyLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
