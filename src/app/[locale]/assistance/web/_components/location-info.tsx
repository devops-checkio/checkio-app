"use client";

import { EmployeeDeviceResponseDto } from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import {
  Map,
  MapCircle,
  MapControls,
  MapMarker,
  MarkerContent,
} from "@/components/ui/map";
import { AlertCircle, Calendar, CheckCircle, MapPin, Wifi } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { LocationData } from "./web-marking.dto";

interface LocationInfoProps {
  locationData: LocationData | null;
  timestamp: string;
  employeeShift?: EmployeeDeviceResponseDto;
}

export default function LocationInfo({
  locationData,
  timestamp,
  employeeShift,
}: LocationInfoProps) {
  const t = useTranslations("webMarking");

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-4 h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto">
        {/* Map with markers */}
        {locationData && locationData.latitude && locationData.longitude && (
          <div className="flex-shrink-0">
            <div className="h-[500px] rounded-2xl overflow-hidden ring-1 ring-black/5 bg-white shadow-lg relative">
              <Map
                center={[locationData.longitude, locationData.latitude]}
                zoom={15}
                theme="light"
              >
                <MapControls />
                {employeeShift?.authorizedZones?.map((zone) => (
                  <React.Fragment key={zone.id}>
                    <MapCircle
                      longitude={zone.longitude}
                      latitude={zone.latitude}
                      radius={zone.radius}
                      fillColor={zone.type === "BRANCH" ? "#3b82f6" : "#10b981"}
                      fillOpacity={0.2}
                      strokeColor={
                        zone.type === "BRANCH" ? "#3b82f6" : "#10b981"
                      }
                      strokeWidth={2}
                      strokeOpacity={0.8}
                    />
                    <MapMarker
                      longitude={zone.longitude}
                      latitude={zone.latitude}
                    >
                      <MarkerContent>
                        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg px-2.5 py-1">
                          <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">
                            {zone.label || zone.name}
                          </span>
                        </div>
                      </MarkerContent>
                    </MapMarker>
                  </React.Fragment>
                ))}
                {locationData && (
                  <MapCircle
                    longitude={locationData.longitude}
                    latitude={locationData.latitude}
                    radius={30}
                    fillColor="#fbbf24"
                    fillOpacity={0.3}
                    strokeColor="#f59e0b"
                    strokeWidth={2}
                    strokeOpacity={0.8}
                  />
                )}
                <MapMarker
                  longitude={locationData.longitude}
                  latitude={locationData.latitude}
                >
                  <MarkerContent>
                    <div className="relative">
                      <div className="h-5 w-5 rounded-full border-2 border-white bg-red-500 shadow-lg animate-pulse" />
                      <div className="absolute inset-0 h-5 w-5 rounded-full border-2 border-red-400 animate-ping" />
                    </div>
                  </MarkerContent>
                </MapMarker>
              </Map>

              {/* Status indicator */}
              {employeeShift?.isWithinAuthorizedZone !== undefined && (
                <div
                  className={`absolute top-3 right-3 z-10 ${
                    employeeShift.isWithinAuthorizedZone ||
                    employeeShift.isWithinWithMargin
                      ? employeeShift.isWithinAuthorizedZone
                        ? "bg-emerald-500/95 border-emerald-300/50"
                        : "bg-amber-500/95 border-amber-300/50"
                      : "bg-red-500/95 border-red-300/50"
                  } backdrop-blur-md rounded-xl border shadow-lg p-2.5`}
                >
                  <div className="flex items-center gap-2">
                    {employeeShift.isWithinAuthorizedZone ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-white" />
                    )}
                    <span className="text-xs font-semibold text-white">
                      {employeeShift.isWithinAuthorizedZone
                        ? t("withinAuthorizedZone") ||
                          "Dentro de zona autorizada"
                        : employeeShift.isWithinWithMargin
                          ? t("withinMarginZone") ||
                            "Dentro de margen de error (30m)"
                          : t("errorMarking") || "Error de Marcación"}
                    </span>
                  </div>
                  {!employeeShift.isWithinAuthorizedZone &&
                    employeeShift.distanceToEdge !== undefined && (
                      <p className="text-[10px] text-white/90 mt-1 ml-6">
                        {employeeShift.isWithinWithMargin
                          ? t("withinMarginDescription") ||
                            "Puede marcar (dentro del margen de 30m)"
                          : `${t("distanceToEdge") || "Distancia al borde de la zona"}: ${(
                              employeeShift.distanceToEdge / 1000
                            ).toFixed(2)} km`}
                      </p>
                    )}
                </div>
              )}

              {/* Legend */}
              <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200/80 shadow-lg p-2.5">
                <div className="flex flex-col gap-1.5">
                  {employeeShift?.authorizedZones &&
                  employeeShift.authorizedZones.length > 0 ? (
                    <>
                      {employeeShift.authorizedZones.some(
                        (z) => z.type === "BRANCH",
                      ) && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 bg-blue-500/20" />
                          <span className="text-[11px] font-medium text-gray-700">
                            {t("branchZone") || "Zona de sucursal"}
                          </span>
                        </div>
                      )}
                      {(employeeShift.authorizedZones.some(
                        (z) => z.type === "EMPLOYEE_HOME_OFFICE",
                      ) ||
                        employeeShift.authorizedZones.some(
                          (z) => z.type === "EMPLOYEE_GEOLOCATION",
                        )) && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-green-500 bg-green-500/20" />
                          <span className="text-[11px] font-medium text-gray-700">
                            {t("homeOfficeZone") || "Zona de home office"}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-yellow-500 bg-yellow-500/20" />
                        <span className="text-[11px] font-medium text-gray-700">
                          {t("errorMarginZone") || "Margen de error (30m)"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-green-500 bg-green-500/35" />
                      <span className="text-[11px] font-medium text-gray-700">
                        {t("authorizedMarkingArea") ||
                          "Zona autorizada de marcación"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-shrink-0">
          {/* Location info */}
          <div className="p-3 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-sm rounded-xl border border-emerald-200/60">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-100/80 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <h3 className="text-xs font-semibold text-emerald-800">
                {t("location")}
              </h3>
            </div>
            <p className="text-xs font-medium text-emerald-900 mb-2 line-clamp-2">
              {locationData?.location || t("loading")}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-1.5 bg-white/60 rounded-lg">
                <span className="text-[10px] text-emerald-600 font-medium block mb-0.5">
                  {t("latitude")}
                </span>
                <span className="text-[11px] font-bold text-emerald-800">
                  {locationData?.latitude?.toFixed(6) || t("loading")}
                </span>
              </div>
              <div className="p-1.5 bg-white/60 rounded-lg">
                <span className="text-[10px] text-emerald-600 font-medium block mb-0.5">
                  {t("longitude")}
                </span>
                <span className="text-[11px] font-bold text-emerald-800">
                  {locationData?.longitude?.toFixed(6) || t("loading")}
                </span>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="p-3 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-xl border border-blue-200/60">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-100/80 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <h3 className="text-xs font-semibold text-blue-800">
                {t("dateTime")}
              </h3>
            </div>
            <p className="text-xs font-bold text-blue-900">{timestamp}</p>
          </div>

          {/* IP Address */}
          <div className="p-3 bg-gradient-to-br from-violet-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl border border-violet-200/60">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-violet-100/80 rounded-lg">
                <Wifi className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <h3 className="text-xs font-semibold text-violet-800">
                {t("ipAddress")}
              </h3>
            </div>
            <p className="text-xs font-bold text-violet-900 font-mono">
              {locationData?.ipAddress || t("loading")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
