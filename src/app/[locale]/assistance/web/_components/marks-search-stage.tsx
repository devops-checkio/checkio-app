"use client";

import {
  EmployeeDeviceResponseDto,
  GeolocationZoneDto,
  PossibleMarkToDoDto,
} from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import { CHEKIOButton } from "@/components";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetEmployeeShift } from "@/service/mantainer.service";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { AlertCircle, CheckCircle2, MapPin, Search, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import LocationInfo from "./location-info";
import MarksList from "./marks-list";
import { sortPossibleMarks } from "./order-possible-marks";
import StepIndicator from "./step-indicator";
import { LocationData, MarkingStage } from "./web-marking.dto";
import { useLocationData } from "./web-marking.hooks";

interface MarksSearchStageProps {
  locationData: LocationData | null;
  onLocationDataFetched: (locationData: LocationData) => void;
  onMarkSelected: (
    mark: PossibleMarkToDoDto,
    employeeShift: EmployeeDeviceResponseDto,
  ) => void;
  shouldAutoSearch?: boolean;
  referenceDateTime?: string | null;
  onReferenceDateTimeChange?: (value: string | null) => void;
  showTimeShift?: boolean;
  currentStage: MarkingStage;
}

function MarksSkeleton() {
  return (
    <div className="space-y-4 animate-stage-fade-in-up">
      <Skeleton className="h-5 w-40 mb-3" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarksSearchStage({
  locationData: initialLocationData,
  onLocationDataFetched,
  onMarkSelected,
  shouldAutoSearch = false,
  referenceDateTime,
  onReferenceDateTimeChange,
  showTimeShift = false,
  currentStage,
}: MarksSearchStageProps) {
  const t = useTranslations("webMarking");
  const { getLocationData, loading: locationLoading } = useLocationData();
  const [errorGeolocationData, setErrorGeolocationData] = useState<{
    authorizedZones?: GeolocationZoneDto[];
    latitude?: number;
    longitude?: number;
    message?: string;
    possibleMarkToDo?: PossibleMarkToDoDto[];
  } | null>(null);
  const {
    mutate: getEmployeeShift,
    data: employeeShift,
    isPending: isSearchingMarks,
    error: searchError,
  } = useGetEmployeeShift();
  const [hasInitiatedSearch, setHasInitiatedSearch] = useState(false);
  const hasAutoSearchedRef = useRef(false);
  const hasAutoSelectedRef = useRef(false);

  useEffect(() => {
    if (searchError) {
      const errorData = searchError.response?.data;

      if (errorData && errorData.authorizedZones) {
        setErrorGeolocationData({
          authorizedZones: errorData.authorizedZones,
          latitude: errorData.latitude,
          longitude: errorData.longitude,
          message: errorData.message,
          possibleMarkToDo: errorData.possibleMarkToDo || [],
        });
      } else if (errorData?.message) {
        setErrorGeolocationData({
          authorizedZones: [],
          latitude: initialLocationData?.latitude,
          longitude: initialLocationData?.longitude,
          message: errorData.message,
        });
      } else {
        setErrorGeolocationData({
          message:
            searchError.response?.data?.message ||
            searchError.message ||
            "No se encuentra en una zona autorizada para realizar la marcación",
        });
      }
    } else {
      setErrorGeolocationData(null);
    }
  }, [searchError, initialLocationData]);

  useEffect(() => {
    if (!shouldAutoSearch) {
      hasAutoSearchedRef.current = false;
      setHasInitiatedSearch(false);
    }
  }, [shouldAutoSearch]);

  const handleSearchMarks = useCallback(async () => {
    if (hasInitiatedSearch) return;

    setHasInitiatedSearch(true);
    hasAutoSelectedRef.current = false;
    let location = initialLocationData;

    if (!location) {
      location = await getLocationData();
      if (location) {
        onLocationDataFetched(location);
      }
    }

    if (location) {
      const params: Parameters<typeof getEmployeeShift>[0] = {
        ipAddress: location.ipAddress,
        latitude: location.latitude,
        longitude: location.longitude,
      };
      if (referenceDateTime) {
        params.referenceDateTime = referenceDateTime;
      }
      getEmployeeShift(params);
    }
  }, [
    initialLocationData,
    hasInitiatedSearch,
    getLocationData,
    onLocationDataFetched,
    getEmployeeShift,
    referenceDateTime,
  ]);

  useEffect(() => {
    if (
      shouldAutoSearch &&
      !showTimeShift &&
      !hasAutoSearchedRef.current &&
      !hasInitiatedSearch
    ) {
      hasAutoSearchedRef.current = true;
      hasAutoSelectedRef.current = false;
      (async () => {
        setHasInitiatedSearch(true);
        let location = initialLocationData;

        if (!location) {
          location = await getLocationData();
          if (location) {
            onLocationDataFetched(location);
          }
        }

        if (location) {
          const params: Parameters<typeof getEmployeeShift>[0] = {
            ipAddress: location.ipAddress,
            latitude: location.latitude,
            longitude: location.longitude,
          };
          if (referenceDateTime) {
            params.referenceDateTime = referenceDateTime;
          }
          getEmployeeShift(params);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoSearch, showTimeShift]);

  const handleMarkSelect = useCallback(
    (mark: PossibleMarkToDoDto) => {
      if (employeeShift) {
        onMarkSelected(mark, employeeShift);
      }
    },
    [employeeShift, onMarkSelected],
  );

  useEffect(() => {
    const marks = employeeShift?.possibleMarkToDo;
    if (
      !marks?.length ||
      !employeeShift ||
      hasAutoSelectedRef.current ||
      errorGeolocationData
    ) {
      return;
    }
    const sorted = sortPossibleMarks(marks);
    const automaticMark = sorted.find((m) => m.automaticMark === true);
    if (!automaticMark) return;

    hasAutoSelectedRef.current = true;
    const timeoutId = setTimeout(() => {
      onMarkSelected(automaticMark, employeeShift);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [employeeShift, errorGeolocationData, onMarkSelected]);

  return (
    <div className="w-full h-[80vh] bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100/80 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                {t("availableMarkings") || "Marcaciones Disponibles"}
              </h2>
              <p className="text-xs text-gray-500">
                {t("searchMarksDescription") ||
                  "Busque las marcaciones disponibles según su ubicación"}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-700">
            Paso 3 de 4
          </span>
        </div>
        <StepIndicator currentStage={currentStage} compact />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden lg:max-w-[45%]">
            {!hasInitiatedSearch ? (
              <div className="flex-1 flex justify-center items-center">
                <div className="text-center w-full max-w-md">
                  {showTimeShift && onReferenceDateTimeChange && (
                    <div className="mb-4 p-4 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl text-left shadow-sm">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {(() => {
                          try {
                            return t("referenceDateTime");
                          } catch {
                            return "Fecha y hora de referencia";
                          }
                        })()}
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                        value={
                          referenceDateTime
                            ? (() => {
                                const d = new Date(referenceDateTime);
                                const pad = (n: number) =>
                                  String(n).padStart(2, "0");
                                return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
                              })()
                            : ""
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!v) {
                            onReferenceDateTimeChange(null);
                            return;
                          }
                          const isoUtcLiteral =
                            v.length === 16
                              ? `${v}:00.000Z`
                              : `${v.slice(0, 19)}.000Z`;
                          onReferenceDateTimeChange(isoUtcLiteral);
                        }}
                      />
                      <p className="text-xs text-gray-400 mt-1.5">
                        {(() => {
                          try {
                            return t("referenceDateTimeHelp");
                          } catch {
                            return "Opcional. Si se indica, las marcas posibles se calculan para esta fecha y hora.";
                          }
                        })()}
                      </p>
                    </div>
                  )}

                  <div className="p-6 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border border-blue-200/60 rounded-2xl mb-4 shadow-sm">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <GlobeAltIcon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm text-blue-800 font-semibold mb-1">
                      {t("searchMarksRequired") ||
                        "Buscar marcaciones disponibles"}
                    </p>
                    <p className="text-xs text-blue-600/80">
                      {t("searchMarksDescription") ||
                        "Presiona el botón para buscar las marcaciones disponibles según tu ubicación"}
                    </p>
                  </div>

                  <CHEKIOButton
                    variant="primary"
                    onClick={handleSearchMarks}
                    disabled={locationLoading || isSearchingMarks}
                    className="w-full h-14 text-lg transition-all duration-300 hover:shadow-lg rounded-xl"
                  >
                    <Search className="w-5 h-5" />
                    {locationLoading || isSearchingMarks
                      ? t("searching") || "Buscando..."
                      : t("searchMarks") || "Buscar Marcaciones"}
                  </CHEKIOButton>
                </div>
              </div>
            ) : isSearchingMarks || locationLoading ? (
              <div className="flex-1 flex flex-col justify-center px-2">
                {/* Employee info skeleton */}
                <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-50/60 to-indigo-50/60 border border-blue-100/50">
                  <Skeleton className="h-4 w-36 mb-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <MarksSkeleton />
              </div>
            ) : errorGeolocationData ? (
              <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
                {/* Error message */}
                <div className="mb-3 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/80 border-l-4 border-l-red-500 rounded-xl flex-shrink-0">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-red-900 mb-1">
                        {t("errorMarking") || "Error de Marcación"}
                      </h3>
                      <p className="text-sm text-red-700">
                        {errorGeolocationData.message ||
                          t("outsideZoneMessage") ||
                          "No se encuentra en una zona autorizada para realizar la marcación. Por favor, acérquese a una zona de marcación autorizada."}
                      </p>
                      {errorGeolocationData.latitude &&
                        errorGeolocationData.longitude && (
                          <p className="text-xs text-red-600/80 mt-2 font-mono">
                            {t("yourLocation") || "Su ubicación actual"}:{" "}
                            {errorGeolocationData.latitude.toFixed(6)},{" "}
                            {errorGeolocationData.longitude.toFixed(6)}
                          </p>
                        )}
                      {errorGeolocationData.possibleMarkToDo &&
                        errorGeolocationData.possibleMarkToDo.length > 0 && (
                          <p className="text-xs text-red-500/80 mt-2 italic">
                            {t("marksAvailableButOutOfZone") ||
                              "Nota: Hay marcaciones disponibles, pero no puede realizarlas desde su ubicación actual."}
                          </p>
                        )}
                    </div>
                  </div>
                </div>

                {/* Employee info on error */}
                {employeeShift && (
                  <div className="mb-3 p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-xl border border-blue-200/60 flex-shrink-0 shadow-sm">
                    <div className="flex items-center gap-2 mb-2.5">
                      <User className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-bold text-blue-900">
                        {t("employeeInfo") || "Información del Empleado"}
                      </h3>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-600 font-medium min-w-[100px]">
                          {t("name") || "Nombre"}:
                        </span>
                        <span className="text-xs font-bold text-blue-900">
                          {employeeShift.firstName} {employeeShift.lastName}
                          {employeeShift.secondLastName
                            ? ` ${employeeShift.secondLastName}`
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-600 font-medium min-w-[100px]">
                          {t("document") || "Documento"}:
                        </span>
                        <span className="text-xs font-bold text-blue-900">
                          {employeeShift.documentType}{" "}
                          {employeeShift.documentNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-600 font-medium min-w-[100px]">
                          {t("contractedHours") || "Horas Contratadas"}:
                        </span>
                        <span className="text-xs font-bold text-blue-900">
                          {employeeShift.contractedHours}{" "}
                          {t("hours") || "horas"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : employeeShift?.possibleMarkToDo &&
              employeeShift.possibleMarkToDo.length > 0 ? (
              <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
                {/* Employee info */}
                <div className="mb-3 p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-xl border border-blue-200/60 flex-shrink-0 shadow-sm">
                  <div className="flex items-center gap-2 mb-2.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-blue-900">
                      {t("employeeInfo") || "Información del Empleado"}
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-600 font-medium min-w-[100px]">
                        {t("name") || "Nombre"}:
                      </span>
                      <span className="text-xs font-bold text-blue-900">
                        {employeeShift.firstName} {employeeShift.lastName}
                        {employeeShift.secondLastName
                          ? ` ${employeeShift.secondLastName}`
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-600 font-medium min-w-[100px]">
                        {t("document") || "Documento"}:
                      </span>
                      <span className="text-xs font-bold text-blue-900">
                        {employeeShift.documentType}{" "}
                        {employeeShift.documentNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-600 font-medium min-w-[100px]">
                        {t("contractedHours") || "Horas Contratadas"}:
                      </span>
                      <span className="text-xs font-bold text-blue-900">
                        {employeeShift.contractedHours} {t("hours") || "horas"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Photo status */}
                <div className="mb-3 p-3 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 rounded-xl flex-shrink-0 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm text-emerald-700 font-semibold">
                      {t("photoCapturedReady") ||
                        "Foto capturada - Listo para marcar"}
                    </span>
                  </div>
                </div>

                {/* Marks list */}
                <div className="flex-1 overflow-y-auto">
                  <MarksList
                    marks={employeeShift.possibleMarkToDo}
                    onMarkSelect={handleMarkSelect}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex justify-center items-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    {t("noMarksAvailable") || "No hay marcaciones disponibles"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 lg:min-w-[55%]">
            <LocationInfo
              locationData={
                initialLocationData
                  ? initialLocationData
                  : errorGeolocationData?.latitude &&
                      errorGeolocationData?.longitude
                    ? {
                        latitude: errorGeolocationData.latitude,
                        longitude: errorGeolocationData.longitude,
                        location: "",
                        ipAddress: "",
                      }
                    : null
              }
              timestamp={new Date().toLocaleString()}
              employeeShift={
                errorGeolocationData &&
                errorGeolocationData.authorizedZones &&
                employeeShift
                  ? {
                      ...employeeShift,
                      authorizedZones: errorGeolocationData.authorizedZones,
                      isWithinAuthorizedZone: false,
                      isWithinWithMargin: false,
                      possibleMarkToDo: [],
                    }
                  : employeeShift || undefined
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
