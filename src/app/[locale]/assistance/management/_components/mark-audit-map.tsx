"use client";

import { GeolocationZoneDto } from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import {
  Map,
  MapCircle,
  MapControls,
  MapMarker,
  MarkerContent,
} from "@/components/ui/map";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { MarkDto } from "../../_components/assistance.dto";

interface MarkAuditMapProps {
  mark: MarkDto;
}

export default function MarkAuditMap({ mark }: MarkAuditMapProps) {
  const t = useTranslations("assistanceManagement");

  if (!mark.latitude || !mark.longitude) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">
            {t("auditMap.noLocationData") ||
              "No hay datos de geolocalización disponibles para esta marcación"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Indicator */}
      {mark.isWithinAuthorizedZone !== undefined && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg border ${
            mark.isWithinAuthorizedZone
              ? mark.isWithinWithMargin && !mark.isWithinAuthorizedZone
                ? "bg-yellow-50 border-yellow-200"
                : "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          {mark.isWithinAuthorizedZone ? (
            mark.isWithinWithMargin && !mark.isWithinAuthorizedZone ? (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span
            className={`text-sm font-medium ${
              mark.isWithinAuthorizedZone
                ? mark.isWithinWithMargin && !mark.isWithinAuthorizedZone
                  ? "text-yellow-800"
                  : "text-green-800"
                : "text-red-800"
            }`}
          >
            {mark.isWithinAuthorizedZone
              ? mark.isWithinWithMargin && !mark.isWithinAuthorizedZone
                ? t("auditMap.withinMarginZone") ||
                  "Dentro de margen de error (30m)"
                : t("auditMap.withinAuthorizedZone") ||
                  "Dentro de zona autorizada"
              : t("auditMap.errorMarking") || "Error de Marcación"}
          </span>
        </div>
      )}

      {/* Map */}
      <div className="h-[500px] rounded-lg overflow-hidden border border-gray-200 bg-white shadow-lg relative">
        <Map center={[mark.longitude, mark.latitude]} zoom={15} theme="light">
          <MapControls />
          {/* Render authorized zones */}
          {mark.authorizedZones?.map((zone: GeolocationZoneDto) => (
            <React.Fragment key={zone.id}>
              <MapCircle
                longitude={zone.longitude}
                latitude={zone.latitude}
                radius={zone.radius}
                fillColor={zone.type === "BRANCH" ? "#3b82f6" : "#10b981"}
                fillOpacity={0.2}
                strokeColor={zone.type === "BRANCH" ? "#3b82f6" : "#10b981"}
                strokeWidth={2}
                strokeOpacity={0.8}
              />
              {/* Marcador con el nombre de la zona en el centro */}
              <MapMarker longitude={zone.longitude} latitude={zone.latitude}>
                <MarkerContent>
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg border-2 border-gray-300 shadow-lg px-2 py-1">
                    <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">
                      {zone.label || zone.name}
                    </span>
                  </div>
                </MarkerContent>
              </MapMarker>
            </React.Fragment>
          ))}
          {/* Geolocation error margin circle (30 meters) */}
          <MapCircle
            longitude={mark.longitude}
            latitude={mark.latitude}
            radius={30}
            fillColor="#fbbf24"
            fillOpacity={0.3}
            strokeColor="#f59e0b"
            strokeWidth={2}
            strokeOpacity={0.8}
          />
          {/* Mark location marker */}
          <MapMarker longitude={mark.longitude} latitude={mark.latitude}>
            <MarkerContent>
              <div className="relative">
                <div className="h-5 w-5 rounded-full border-2 border-white bg-red-500 shadow-lg animate-pulse" />
                <div className="absolute inset-0 h-5 w-5 rounded-full border-2 border-red-400 animate-ping" />
              </div>
            </MarkerContent>
          </MapMarker>
        </Map>

        {/* Legend */}
        <div className="absolute top-2 left-2 z-10 bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 shadow-md p-2.5 max-w-xs">
          <div className="flex flex-col gap-1.5">
            {mark.authorizedZones && mark.authorizedZones.length > 0 ? (
              <>
                <div className="text-xs font-semibold text-gray-700 mb-1">
                  Leyenda:
                </div>
                {mark.authorizedZones.some(
                  (z: GeolocationZoneDto) => z.type === "BRANCH",
                ) && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500/20" />
                    <span className="text-xs font-medium text-gray-800">
                      {t("auditMap.branchZone") || "Zona de sucursal"}
                    </span>
                  </div>
                )}
                {(mark.authorizedZones.some(
                  (z: GeolocationZoneDto) => z.type === "EMPLOYEE_HOME_OFFICE",
                ) ||
                  mark.authorizedZones.some(
                    (z: GeolocationZoneDto) =>
                      z.type === "EMPLOYEE_GEOLOCATION",
                  )) && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500/20" />
                    <span className="text-xs font-medium text-gray-800">
                      {t("auditMap.homeOfficeZone") || "Zona de home office"}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full border-2 border-yellow-500 bg-yellow-500/30" />
                  <span className="text-xs font-medium text-gray-800">
                    {t("auditMap.errorMarginZone") || "Margen de error (30m)"}
                  </span>
                </div>

                {/* Lista detallada de zonas con labels descriptivos */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Zonas autorizadas:
                  </div>
                  {(
                    mark.authorizedZones.slice(0, 5) as GeolocationZoneDto[]
                  ).map((zone: GeolocationZoneDto) => (
                    <div
                      key={zone.id}
                      className="flex items-start gap-1.5 mt-1"
                    >
                      <div
                        className={`w-3 h-3 mt-0.5 rounded-full border ${
                          zone.type === "BRANCH"
                            ? "border-blue-500 bg-blue-500/20"
                            : "border-green-500 bg-green-500/20"
                        }`}
                      />
                      <span className="text-xs text-gray-700 flex-1">
                        {zone.label || zone.name}
                      </span>
                    </div>
                  ))}
                  {mark.authorizedZones.length > 5 && (
                    <div className="text-xs text-gray-500 mt-1 ml-4">
                      +{mark.authorizedZones.length - 5} más
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500/35" />
                <span className="text-xs font-medium text-gray-800">
                  {t("auditMap.authorizedMarkingArea") ||
                    "Zona autorizada de marcación"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {t("auditMap.locationInfo") || "Información de Ubicación"}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-gray-500">
              {t("auditMap.latitude") || "Latitud"}:
            </span>
            <p className="text-sm font-medium text-gray-800">
              {mark.latitude.toFixed(6)}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500">
              {t("auditMap.longitude") || "Longitud"}:
            </span>
            <p className="text-sm font-medium text-gray-800">
              {mark.longitude.toFixed(6)}
            </p>
          </div>
          {mark.authorizedZones && mark.authorizedZones.length > 0 && (
            <div className="col-span-2">
              <span className="text-xs text-gray-500">
                {t("auditMap.authorizedZonesCount") || "Zonas autorizadas"}:
              </span>
              <p className="text-sm font-medium text-gray-800">
                {mark.authorizedZones.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
