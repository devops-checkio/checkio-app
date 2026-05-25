"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Map,
  MapCircle,
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
} from "@/components/ui/map";
import SystemSelect from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DeleteOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { Table } from "antd";
import type { MapMouseEvent } from "maplibre-gl";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Control, Controller, UseFieldArrayReturn } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { v4 as uuidv4 } from "uuid";
import {
  EstablishmentCreateDto,
  EstablishmentGeolocationType,
  EstablishmentUpdateDto,
} from "./establishment.dto";

const defaultCenter = {
  lat: -33.45694,
  lng: -70.64827,
};

const INITIAL_RADIUS = 100;

interface EstablishmentGeolocationMapEditorProps {
  control: Control<EstablishmentCreateDto | EstablishmentUpdateDto, unknown>;
  errors: unknown;
  geolocationArray: UseFieldArrayReturn<
    EstablishmentCreateDto | EstablishmentUpdateDto,
    "geolocations",
    "publicId"
  >;
  centerLocation?: { lat: number; lng: number } | null;
}

const RadiusInput = React.memo(
  ({
    field,
    index,
    onRadiusChange,
  }: {
    field: {
      value: number | undefined;
      onChange: (v: number) => void;
      onBlur: () => void;
      name: string;
    };
    index: number;
    onRadiusChange: (index: number, value: number) => void;
  }) => {
    const tDetail = useTranslations("mantainers.branches.detail");
    const debouncedUpdate = useDebouncedCallback((value: number) => {
      onRadiusChange(index, value);
    }, 100);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        field.onChange(value);
        debouncedUpdate(value);
      },
      [field, debouncedUpdate]
    );

    return (
      <Input
        type="number"
        min={1}
        max={10000}
        step={1}
        value={field.value ?? INITIAL_RADIUS}
        onChange={handleChange}
        onBlur={field.onBlur}
        name={field.name}
        placeholder={tDetail("geolocation.radiusPlaceholder")}
      />
    );
  }
);
RadiusInput.displayName = "RadiusInput";

const DescriptionInput = React.memo(
  ({
    field,
    index,
    onNameChange,
  }: {
    field: {
      value: string | undefined;
      onChange: (v: string) => void;
      onBlur: () => void;
      name: string;
    };
    index: number;
    onNameChange: (index: number, value: string) => void;
  }) => {
    const debouncedUpdate = useDebouncedCallback((value: string) => {
      onNameChange(index, value);
    }, 2000);

    return (
      <Input
        value={field.value ?? ""}
        onBlur={field.onBlur}
        name={field.name}
        onChange={(e) => {
          field.onChange(e.target.value);
          debouncedUpdate(e.target.value);
        }}
      />
    );
  }
);
DescriptionInput.displayName = "DescriptionInput";

function EstablishmentMapInteractions({
  fieldsLength,
  append,
  centerLocation,
  selectedPoint,
  fieldsSnapshot,
}: {
  fieldsLength: number;
  append: EstablishmentGeolocationMapEditorProps["geolocationArray"]["append"];
  centerLocation: { lat: number; lng: number } | null | undefined;
  selectedPoint: string | null;
  fieldsSnapshot: Array<{
    publicId?: string;
    latitude: number;
    longitude: number;
  }>;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const onMapClick = (e: MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      append({
        name: `Punto ${fieldsLength + 1}`,
        latitude: lat,
        longitude: lng,
        radius: INITIAL_RADIUS,
        type: EstablishmentGeolocationType.MIXED,
        publicId: uuidv4(),
      });
    };

    map.on("click", onMapClick);
    return () => {
      map.off("click", onMapClick);
    };
  }, [map, isLoaded, append, fieldsLength]);

  useEffect(() => {
    if (!map || !isLoaded || !centerLocation) return;
    map.flyTo({
      center: [centerLocation.lng, centerLocation.lat],
      zoom: 16,
      duration: 900,
    });
  }, [map, isLoaded, centerLocation]);

  useEffect(() => {
    if (!map || !isLoaded || !selectedPoint) return;
    const row = fieldsSnapshot.find((f) => f.publicId === selectedPoint);
    if (
      row &&
      row.latitude != null &&
      row.longitude != null &&
      row.latitude !== 0 &&
      row.longitude !== 0
    ) {
      map.flyTo({
        center: [row.longitude, row.latitude],
        zoom: 16,
        duration: 600,
      });
    }
  }, [map, isLoaded, selectedPoint, fieldsSnapshot]);

  return null;
}

export default function EstablishmentGeolocationMapEditor({
  control,
  geolocationArray,
  centerLocation,
}: EstablishmentGeolocationMapEditorProps) {
  const tDetail = useTranslations("mantainers.branches.detail");
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const { fields, append, remove, update } = geolocationArray;

  const initialMapCenter = useMemo((): [number, number] => {
    if (centerLocation) {
      return [centerLocation.lng, centerLocation.lat];
    }
    const first = fields.find((f) => f.latitude && f.longitude);
    if (first) {
      return [first.longitude, first.latitude];
    }
    return [defaultCenter.lng, defaultCenter.lat];
  }, [centerLocation, fields]);

  const fieldsSnapshot = useMemo(
    () =>
      fields.map((f) => ({
        publicId: f.publicId,
        latitude: f.latitude,
        longitude: f.longitude,
      })),
    [fields]
  );

  const handleNameChange = useCallback(
    (index: number, name: string) => {
      update(index, {
        ...fields[index],
        name,
      });
    },
    [fields, update]
  );

  const handleRadiusChange = useCallback(
    (index: number, radius: number) => {
      update(index, {
        ...fields[index],
        radius,
      });
    },
    [fields, update]
  );

  const handleDeletePoint = useCallback(
    (index: number) => {
      const deleted = fields[index];
      remove(index);
      if (deleted.publicId === selectedPoint) {
        setSelectedPoint(null);
      }
    },
    [fields, remove, selectedPoint]
  );

  const handlePointUpdate = useCallback(
    (index: number, lat: number, lng: number) => {
      update(index, {
        ...fields[index],
        latitude: lat,
        longitude: lng,
      });
    },
    [fields, update]
  );

  const columns = [
    {
      title: tDetail("geolocation.name"),
      dataIndex: "name",
      key: "name",
      render: (_: string, __: unknown, index: number) => (
        <Controller
          name={`geolocations.${index}.name`}
          control={control}
          render={({ field }) => (
            <DescriptionInput
              field={field}
              index={index}
              onNameChange={handleNameChange}
            />
          )}
        />
      ),
    },
    {
      title: "Marcación",
      dataIndex: "marking",
      key: "marking",
      render: (_: string, __: unknown, index: number) => (
        <Controller
          name={`geolocations.${index}.type`}
          control={control}
          render={({ field }) => (
            <SystemSelect
              options={[
                {
                  label: "Entrada",
                  value: EstablishmentGeolocationType.CHECK_IN,
                },
                {
                  label: "Salida",
                  value: EstablishmentGeolocationType.CHECK_OUT,
                },
                {
                  label: "Mixto",
                  value: EstablishmentGeolocationType.MIXED,
                },
              ]}
              attribute={`geolocations.${index}.type`}
              control={control}
              value={field.value}
            />
          )}
        />
      ),
    },
    {
      title: "Latitud",
      dataIndex: "latitude",
      key: "latitude",
    },
    {
      title: "Longitud",
      dataIndex: "longitude",
      key: "longitude",
    },
    {
      title: "Radio (m)",
      dataIndex: "radius",
      key: "radius",
      render: (_: number, __: unknown, index: number) => (
        <Controller
          name={`geolocations.${index}.radius`}
          control={control}
          render={({ field }) => (
            <RadiusInput
              field={field}
              index={index}
              onRadiusChange={handleRadiusChange}
            />
          )}
        />
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_: unknown, __: unknown, index: number) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => {
              const pointId = fields[index].publicId;
              setSelectedPoint(pointId ?? null);
            }}
          >
            <EnvironmentOutlined
              className={
                selectedPoint === fields[index].publicId ? "text-blue-500" : ""
              }
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => handleDeletePoint(index)}
          >
            <DeleteOutlined />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-500">
        Haz clic en el mapa para agregar un punto. Arrastra el marcador para
        ajustar la ubicación.
      </p>
      <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-200">
        <Map center={initialMapCenter} zoom={15} theme="light">
          <EstablishmentMapInteractions
            fieldsLength={fields.length}
            append={append}
            centerLocation={centerLocation}
            selectedPoint={selectedPoint}
            fieldsSnapshot={fieldsSnapshot}
          />
          <MapControls />
          {fields.map((field, index) => {
            if (!field.latitude || !field.longitude) {
              return null;
            }
            const isSelected = selectedPoint === field.publicId;
            const fill = isSelected ? "#FFA500" : "#DCDCBCFF";
            return (
              <React.Fragment key={field.publicId ?? `temp-${index}`}>
                <MapCircle
                  longitude={field.longitude}
                  latitude={field.latitude}
                  radius={field.radius || INITIAL_RADIUS}
                  fillColor={fill}
                  strokeColor={fill}
                  fillOpacity={0.35}
                  strokeOpacity={0.85}
                  strokeWidth={2}
                />
                <MapMarker
                  longitude={field.longitude}
                  latitude={field.latitude}
                  draggable
                  onDragEnd={({ lng, lat }) =>
                    handlePointUpdate(index, lat, lng)
                  }
                  onClick={() => {
                    if (field.publicId) setSelectedPoint(field.publicId);
                  }}
                >
                  <MarkerContent>
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border-2 border-white shadow-lg",
                        isSelected ? "bg-orange-500" : "bg-[#c4c4a8]"
                      )}
                    />
                  </MarkerContent>
                </MapMarker>
              </React.Fragment>
            );
          })}
        </Map>
      </div>

      <Table
        dataSource={fields}
        columns={columns}
        rowKey="publicId"
        pagination={false}
        size="small"
      />
    </div>
  );
}
