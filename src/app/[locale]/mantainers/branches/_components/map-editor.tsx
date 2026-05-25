"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SystemSelect from "@/components/ui/select";
import { DeleteOutlined, EnvironmentOutlined } from "@ant-design/icons";
import {
  Circle,
  GoogleMap,
  Marker,
  StandaloneSearchBox,
} from "@react-google-maps/api";
import { Table } from "antd";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useState } from "react";
import { Control, Controller, UseFieldArrayReturn } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { v4 as uuidv4 } from "uuid";
import {
  BranchCreateDto,
  BranchGeolocationType,
  BranchUpdateDto,
} from "./branch.dto";

interface MapEditorProps {
  isUpdate?: boolean;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  initialRadius?: number;
  onPositionChange?: (position: { lat: number; lng: number }) => void;
  onRadiusChange?: (radius: number) => void;
  control: Control<BranchCreateDto | BranchUpdateDto, any>;
  errors: any;
  geolocationArray: UseFieldArrayReturn<
    BranchCreateDto | BranchUpdateDto,
    "geolocations",
    "publicId"
  >;
  handleOpenDeleteModal?: (publicId: string) => void;
  centerLocation?: {
    lat: number;
    lng: number;
  } | null;
  showSearchBox?: boolean;
}

const defaultCenter = {
  lat: -33.45694,
  lng: -70.64827,
};

const LocationSearchBox = React.memo(
  ({
    onPlaceSelected,
  }: {
    onPlaceSelected: (lat: number, lng: number, name: string) => void;
  }) => {
    const tDetail = useTranslations("mantainers.branches.detail");
    const inputRef = React.useRef<HTMLInputElement>(null);
    const searchBoxRef = React.useRef<google.maps.places.SearchBox | null>(
      null
    );

    const onSearchBoxLoad = (ref: google.maps.places.SearchBox) => {
      searchBoxRef.current = ref;
    };

    const onPlacesChanged = () => {
      if (searchBoxRef.current) {
        const places = searchBoxRef.current.getPlaces();
        if (places && places.length > 0) {
          const place = places[0];
          if (place.geometry && place.geometry.location) {
            onPlaceSelected(
              place.geometry.location.lat(),
              place.geometry.location.lng(),
              place.name || place.formatted_address || ""
            );

            if (inputRef.current) {
              inputRef.current.value = "";
            }
          }
        }
      }
    };

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {tDetail("geolocation.searchLocation")}
        </label>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <StandaloneSearchBox
            onLoad={onSearchBoxLoad}
            onPlacesChanged={onPlacesChanged}
          >
            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={tDetail("geolocation.searchPlaceholder")}
            />
          </StandaloneSearchBox>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {tDetail("geolocation.searchDescription")}
        </p>
      </div>
    );
  }
);

LocationSearchBox.displayName = "LocationSearchBox";

// Componente separado para el marcador y círculo
const MapPoint = React.memo(
  ({
    field,
    index,
    isSelected,
    onUpdate,
    onSelect,
    markerIcon,
  }: {
    field: any;
    index: number;
    isSelected: boolean;
    onUpdate: (index: number, lat: number, lng: number) => void;
    onSelect: (id: string) => void;
    markerIcon: google.maps.Icon;
  }) => {
    const markerRef = React.useRef<google.maps.Marker | null>(null);
    const circleRef = React.useRef<google.maps.Circle | null>(null);
    const mapRef = React.useRef<google.maps.Map | null>(null);

    // Callback para cuando el mapa esté listo
    const onMapLoad = React.useCallback((map: google.maps.Map) => {
      mapRef.current = map;
    }, []);

    // Callback para cuando el marcador esté listo
    const onMarkerLoad = React.useCallback((marker: google.maps.Marker) => {
      markerRef.current = marker;
    }, []);

    // Callback para cuando el círculo esté listo
    const onCircleLoad = React.useCallback((circle: google.maps.Circle) => {
      circleRef.current = circle;
    }, []);

    // Actualizar la posición del círculo cuando cambie la posición del punto
    React.useEffect(() => {
      if (circleRef.current) {
        circleRef.current.setCenter({
          lat: field.latitude,
          lng: field.longitude,
        });
      }
    }, [field.latitude, field.longitude]);

    // Actualizar el radio del círculo cuando cambie
    React.useEffect(() => {
      if (circleRef.current) {
        circleRef.current.setRadius(field.radius || 100);
      }
    }, [field.radius]);

    // Actualizar las opciones del círculo cuando cambie la selección
    React.useEffect(() => {
      if (circleRef.current) {
        circleRef.current.setOptions({
          fillColor: isSelected ? "#FFA500" : "#DCDCBCFF",
          strokeColor: isSelected ? "#FFA500" : "#DCDCBCFF",
        });
      }
    }, [isSelected]);

    // Limpiar al desmontar
    React.useEffect(() => {
      return () => {
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
        if (circleRef.current) {
          circleRef.current.setMap(null);
        }
      };
    }, []);

    // No renderizar si no hay datos necesarios
    if (!field.latitude || !field.longitude) {
      return null;
    }

    // Usar un ID temporal si publicId no está disponible
    const pointId = field.publicId || `temp-${index}`;

    return (
      <>
        <Marker
          key={`marker-${pointId}`}
          position={{ lat: field.latitude, lng: field.longitude }}
          draggable={true}
          onLoad={onMarkerLoad}
          onDragEnd={(e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              onUpdate(index, e.latLng.lat(), e.latLng.lng());
            }
          }}
          onClick={() => field.publicId && onSelect(field.publicId)}
          icon={markerIcon}
        />
        <Circle
          key={`circle-${pointId}`}
          center={{ lat: field.latitude, lng: field.longitude }}
          radius={field.radius || 100}
          onLoad={onCircleLoad}
          options={{
            fillColor: isSelected ? "#FFA500" : "#DCDCBCFF",
            fillOpacity: 0.35,
            strokeColor: isSelected ? "#FFA500" : "#DCDCBCFF",
            strokeOpacity: 0.8,
            strokeWeight: 2,
          }}
        />
      </>
    );
  }
);

MapPoint.displayName = "MapPoint";

// Componente separado para el input del radio
const RadiusInput = React.memo(
  ({
    field,
    index,
    onRadiusChange,
  }: {
    field: any;
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
        value={field.value}
        onChange={handleChange}
        onBlur={field.onBlur}
        name={field.name}
        placeholder={tDetail("geolocation.radiusPlaceholder")}
      />
    );
  }
);

RadiusInput.displayName = "RadiusInput";

// Componente separado para el input de descripción
const DescriptionInput = React.memo(
  ({
    field,
    index,
    onNameChange,
  }: {
    field: any;
    index: number;
    onNameChange: (index: number, value: string) => void;
  }) => {
    const debouncedUpdate = useDebouncedCallback((value: string) => {
      onNameChange(index, value);
    }, 2000);

    return (
      <Input
        {...field}
        onChange={(e) => {
          field.onChange(e.target.value);
          debouncedUpdate(e.target.value);
        }}
      />
    );
  }
);

DescriptionInput.displayName = "DescriptionInput";

export default function MapEditor({
  isUpdate = false,
  geolocationArray,
  control,
  initialRadius = 100,
  onPositionChange,
  onRadiusChange,
  handleOpenDeleteModal,
  centerLocation,
  showSearchBox = true,
}: MapEditorProps) {
  const tDetail = useTranslations("mantainers.branches.detail");
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { fields, append, remove, update } = geolocationArray;

  // Verificar si Google Maps está disponible
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== "undefined" && window.google?.maps?.places) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 100;

    const interval = setInterval(() => {
      attempts++;

      if (checkGoogleMaps()) {
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        setLoadError(true);
        clearInterval(interval);
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const mapCenter =
    centerLocation ||
    (fields.length > 0
      ? { lat: fields[0].latitude, lng: fields[0].longitude }
      : defaultCenter);

  // Callback para cuando el mapa esté listo
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Efecto para centrar el mapa cuando cambie centerLocation
  React.useEffect(() => {
    if (map && centerLocation) {
      map.panTo(centerLocation);
      map.setZoom(16);
    }
  }, [map, centerLocation]);

  // Efecto para centrar el mapa cuando se seleccione un punto
  React.useEffect(() => {
    if (map && selectedPoint) {
      const selectedField = fields.find(
        (field) => field.publicId === selectedPoint
      );
      if (selectedField && selectedField.latitude && selectedField.longitude) {
        const position = {
          lat: selectedField.latitude,
          lng: selectedField.longitude,
        };
        map.panTo(position);
        map.setZoom(16);
      }
    }
  }, [map, selectedPoint, fields]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newGeolocation = {
          name: `Punto ${fields.length + 1}`,
          latitude: e.latLng.lat(),
          longitude: e.latLng.lng(),
          radius: initialRadius,
          type: BranchGeolocationType.MIXED,
          publicId: uuidv4(), // Assign a unique publicId
        };

        append(newGeolocation);
        onPositionChange?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    },
    [fields.length, initialRadius, onPositionChange, append]
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

  const handleMarkingChange = useCallback(
    (index: number, type: BranchGeolocationType) => {
      update(index, {
        ...fields[index],
        type,
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

      if (fields[index].publicId === selectedPoint) {
        onRadiusChange?.(radius);
      }
    },
    [fields, selectedPoint, onRadiusChange, update]
  );

  const handleDeletePoint = useCallback(
    (index: number) => {
      const deletedPoint = fields[index];
      remove(index);

      if (deletedPoint.publicId === selectedPoint) {
        setSelectedPoint(null);
        onPositionChange?.(defaultCenter);
        onRadiusChange?.(initialRadius);
      }
    },
    [
      fields,
      selectedPoint,
      remove,
      onPositionChange,
      onRadiusChange,
      initialRadius,
    ]
  );

  const handlePointUpdate = useCallback(
    (index: number, lat: number, lng: number) => {
      update(index, {
        ...fields[index],
        latitude: lat,
        longitude: lng,
      });
      onPositionChange?.({ lat, lng });
    },
    [fields, update, onPositionChange]
  );

  const handlePlaceSelected = useCallback(
    (lat: number, lng: number, name: string) => {
      const newGeolocation = {
        name: name || `Punto ${fields.length + 1}`,
        latitude: lat,
        longitude: lng,
        radius: initialRadius,
        type: BranchGeolocationType.MIXED,
        publicId: uuidv4(),
      };

      append(newGeolocation);
      onPositionChange?.({ lat, lng });
    },
    [fields.length, initialRadius, onPositionChange, append]
  );

  const columns = [
    {
      title: tDetail("geolocation.name"),
      dataIndex: "name",
      key: "name",
      render: (_: string, __: any, index: number) => (
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
      render: (_: string, __: any, index: number) => (
        <Controller
          name={`geolocations.${index}.type`}
          control={control}
          render={({ field }) => (
            <SystemSelect
              options={[
                {
                  label: "Entrada",
                  value: BranchGeolocationType.CHECK_IN,
                },
                {
                  label: "Salida",
                  value: BranchGeolocationType.CHECK_OUT,
                },
                {
                  label: "Mixto",
                  value: BranchGeolocationType.MIXED,
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
      render: (_: number, __: any, index: number) => (
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
      render: (_: any, __: any, index: number) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => {
              const pointId = fields[index].publicId;
              setSelectedPoint(pointId);
              // Centrar el mapa en el punto seleccionado
              if (map && fields[index].latitude && fields[index].longitude) {
                const position = {
                  lat: fields[index].latitude,
                  lng: fields[index].longitude,
                };
                map.panTo(position);
                map.setZoom(16);
              }
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
            onClick={() => {
              handleDeletePoint(index);
            }}
          >
            <DeleteOutlined />
          </Button>
        </div>
      ),
    },
  ];

  if (loadError) return <div>Error al cargar el mapa</div>;
  if (!isLoaded) return <div>Cargando mapa...</div>;

  const markerIcon = {
    url: "/logos/geo-point.png",
    scaledSize: new google.maps.Size(55, 55),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(26, 40),
  };

  return (
    <div className="flex flex-col gap-4">
      {showSearchBox && (
        <LocationSearchBox onPlaceSelected={handlePlaceSelected} />
      )}
      <div className="h-[400px] w-full">
        <GoogleMap
          zoom={15}
          key={JSON.stringify(fields)}
          center={mapCenter}
          mapContainerClassName="w-full h-full"
          onLoad={onMapLoad}
          onClick={handleMapClick}
          options={{
            gestureHandling: "greedy",
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
          }}
        >
          {fields.map((field, index) => (
            <MapPoint
              key={field.publicId || `temp-${index}`}
              field={field}
              index={index}
              isSelected={selectedPoint === field.publicId}
              onUpdate={handlePointUpdate}
              onSelect={setSelectedPoint}
              markerIcon={markerIcon}
            />
          ))}
        </GoogleMap>
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
