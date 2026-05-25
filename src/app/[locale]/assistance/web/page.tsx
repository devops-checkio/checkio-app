"use client";

import {
  EmployeeDeviceResponseDto,
  PossibleMarkToDoDto,
} from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import { CHEKIOButton } from "@/components";
import { Skeleton } from "@/components/ui/skeleton";
import { useCookieSession } from "@/context/useCookieSession";
import { RoleType } from "@/dto/auth";
import { useToast } from "@/hooks/use-toast";
import { hasPendingConsent, useCheckConsent } from "@/service/consent.service";
import { CameraOff, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import InstructionsModal from "./_components/instructions-modal";
import MarkSaveStage from "./_components/mark-save-stage";
import MarksSearchStage from "./_components/marks-search-stage";
import PhotoCaptureStage from "./_components/photo-capture-stage";
import PhotoReviewStage from "./_components/photo-review-stage";
import {
  LocationData,
  MarkingStage,
  PhotoCaptureData,
} from "./_components/web-marking.dto";
import { useCameraPermission } from "./_components/web-marking.hooks";

function LoadingSkeleton() {
  return (
    <div className="w-full animate-stage-fade-in-up">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="w-full aspect-video rounded-xl" />
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsentRequiredCard({ onGoToConsent }: { onGoToConsent: () => void }) {
  const t = useTranslations("webMarking");

  return (
    <div className="w-full max-w-lg mx-auto animate-stage-fade-in-up">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
              {t("consentRequiredTitle")}
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              {t("consentRequiredDescription")}
            </p>
          </div>
          <CHEKIOButton
            variant="primary"
            onClick={onGoToConsent}
            className="w-full h-12 text-base transition-all duration-300 hover:shadow-lg"
          >
            {t("goToConsent")}
          </CHEKIOButton>
        </div>
      </div>
    </div>
  );
}

function CameraDeniedCard({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("webMarking");

  return (
    <div className="w-full max-w-lg mx-auto animate-stage-fade-in-up">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
            <CameraOff className="w-10 h-10 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
              {t("cameraRequiredTitle")}
            </h3>
            <ul className="space-y-2 mt-4">
              {[t("cameraRequired1"), t("cameraRequired2"), t("cameraRequired3")].map(
                (text, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-gray-600"
                  >
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-red-600">
                        {i + 1}
                      </span>
                    </div>
                    {text}
                  </li>
                )
              )}
            </ul>
          </div>
          <CHEKIOButton
            variant="primary"
            onClick={onRetry}
            className="w-full h-12 text-base transition-all duration-300 hover:shadow-lg"
          >
            {t("retry")}
          </CHEKIOButton>
        </div>
      </div>
    </div>
  );
}

export default function CameraWithWatermarkPage() {
  const t = useTranslations("webMarking");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "es";
  const { toast } = useToast();
  const { profile } = useCookieSession();
  const isEmployeeOrCustom =
    profile?.role === RoleType.EMPLOYEE || profile?.role === RoleType.CUSTOM;
  const {
    data: consentStatus,
    isLoading: consentLoading,
    isFetching: isConsentFetching,
  } = useCheckConsent(undefined, !!profile && isEmployeeOrCustom);
  const { permission: cameraPermission, loading: cameraLoading } =
    useCameraPermission();

  const needsConsent =
    isEmployeeOrCustom &&
    !consentLoading &&
    !isConsentFetching &&
    consentStatus != null &&
    hasPendingConsent(consentStatus);

  const [currentStage, setCurrentStage] = useState<MarkingStage>(
    MarkingStage.PHOTO_CAPTURE
  );
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [requiresPhoto, setRequiresPhoto] = useState<boolean>(true);
  const [photoData, setPhotoData] = useState<PhotoCaptureData | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [employeeShift, setEmployeeShift] =
    useState<EmployeeDeviceResponseDto | null>(null);
  const [selectedMark, setSelectedMark] = useState<PossibleMarkToDoDto | null>(
    null
  );
  const [shouldSearchMarks, setShouldSearchMarks] = useState<boolean>(false);
  const useTimeShift =
    process.env.NEXT_PUBLIC_USE_TIME_SHIFT === "true" ||
    process.env.NEXT_PUBLIC_USE_TIME_SHIFT === "1";
  const [referenceDateTime, setReferenceDateTime] = useState<string | null>(
    null
  );

  const stageKey = useMemo(() => currentStage, [currentStage]);

  const handlePhotoCaptured = (photo: string) => {
    setPhotoData({
      image: photo,
      timestamp: new Date().toLocaleString(),
    });
    setCurrentStage(MarkingStage.PHOTO_REVIEW);
  };

  const handlePhotoAccepted = () => {
    setShouldSearchMarks(true);
    setCurrentStage(MarkingStage.MARKS_SEARCH);
  };

  const handlePhotoRejected = () => {
    setPhotoData(null);
    setShouldSearchMarks(false);
    setCurrentStage(MarkingStage.PHOTO_CAPTURE);
  };

  const handleLocationDataFetched = (location: LocationData) => {
    setLocationData(location);
  };

  const handleMarkSelected = (
    mark: PossibleMarkToDoDto,
    shift: EmployeeDeviceResponseDto
  ) => {
    setSelectedMark(mark);
    setEmployeeShift(shift);
    setCurrentStage(MarkingStage.MARK_SAVE);
  };

  const handleOpenInstructions = () => {
    setShowInstructions(true);
  };

  const handleGoToConsent = () => {
    router.push(`/${locale}/consent`);
  };

  return (
    <>
      <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 -m-6 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {cameraLoading || (isEmployeeOrCustom && consentLoading) ? (
            <div className="max-w-2xl mx-auto">
              <LoadingSkeleton />
            </div>
          ) : needsConsent ? (
            <ConsentRequiredCard onGoToConsent={handleGoToConsent} />
          ) : !cameraPermission ? (
            <CameraDeniedCard onRetry={() => window.location.reload()} />
          ) : (
            <div key={stageKey} className="animate-stage-fade-in-up">
              {currentStage === MarkingStage.PHOTO_CAPTURE && (
                <PhotoCaptureStage
                  requiresPhoto={requiresPhoto}
                  onPhotoCaptured={handlePhotoCaptured}
                  onOpenInstructions={handleOpenInstructions}
                  currentStage={currentStage}
                />
              )}

              {currentStage === MarkingStage.PHOTO_REVIEW && photoData && (
                <PhotoReviewStage
                  photo={photoData.image}
                  onAccept={handlePhotoAccepted}
                  onReject={handlePhotoRejected}
                  currentStage={currentStage}
                />
              )}

              {currentStage === MarkingStage.MARKS_SEARCH && (
                <MarksSearchStage
                  locationData={locationData}
                  onLocationDataFetched={handleLocationDataFetched}
                  onMarkSelected={handleMarkSelected}
                  shouldAutoSearch={shouldSearchMarks}
                  referenceDateTime={
                    useTimeShift ? referenceDateTime : undefined
                  }
                  onReferenceDateTimeChange={
                    useTimeShift ? setReferenceDateTime : undefined
                  }
                  showTimeShift={useTimeShift}
                  currentStage={currentStage}
                />
              )}

              {currentStage === MarkingStage.MARK_SAVE &&
                selectedMark &&
                employeeShift &&
                photoData && (
                  <MarkSaveStage
                    photo={photoData.image}
                    mark={selectedMark}
                    employeeShift={employeeShift}
                    onComplete={() => {}}
                    locationData={locationData}
                  />
                )}
            </div>
          )}
        </div>
      </div>

      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </>
  );
}
