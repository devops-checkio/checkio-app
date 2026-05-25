"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { useToast } from "@/hooks/use-toast";
import { useUpdateEmployeeGeolocations } from "@/service/mantainer.service";
import {
  Circle,
  GoogleMap,
  Marker,
  StandaloneSearchBox,
} from "@react-google-maps/api";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Plus, Save, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Control, Controller, UseFieldArrayReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useDebouncedCallback } from "use-debounce";
import { v4 as uuidv4 } from "uuid";

const defaultCenter = {
  lat: -33.45694,
  lng: -70.64827,
};

// Componente para la búsqueda de ubicaciones
const LocationSearchBox = React.memo(
  ({
    onPlaceSelected,
  }: {
    onPlaceSelected: (lat: number, lng: number, name: string) => void;
  }) => {
    const t = useTranslations("mantainers.employees");
    const inputRef = useRef<HTMLInputElement>(null);
    const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

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

            // Clear input
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
          {t("detail.homeOffice.searchLocation")}
        </label>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <StandaloneSearchBox
            onLoad={onSearchBoxLoad}
            onPlacesChanged={onPlacesChanged}
          >
            <input
              ref={inputRef}
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("detail.homeOffice.searchPlaceholder")}
            />
          </StandaloneSearchBox>
          <CHEKIOButton
            variant="primary"
            onClick={() => {
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
            }}
          >
            <Plus className="h-4 w-4" />
            {t("detail.homeOffice.add")}
          </CHEKIOButton>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {t("detail.homeOffice.searchHint")}
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
    // Crear un ID único para el marcador y el círculo
    const markerId = React.useRef(`marker-${field.id}`).current;
    const circleId = React.useRef(`circle-${field.id}`).current;

    return (
      <>
        <Marker
          key={markerId}
          position={{ lat: field.latitude, lng: field.longitude }}
          draggable={true}
          onDragEnd={(e) => {
            if (e.latLng) {
              onUpdate(index, e.latLng.lat(), e.latLng.lng());
            }
          }}
          onClick={() => onSelect(field.id)}
          icon={markerIcon}
        />
        <Circle
          key={circleId}
          center={{ lat: field.latitude, lng: field.longitude }}
          radius={field.radius}
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

// Primero, crear un componente separado para el input del radio
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
    const debouncedUpdate = useDebouncedCallback((value: number) => {
      onRadiusChange(index, value);
    }, 2000);

    return (
      <CHEKIOInput
        type="number"
        min={1}
        value={field.value}
        onChange={(e) => {
          const value = Number(e.target.value);
          field.onChange(value);
          debouncedUpdate(value);
        }}
        onBlur={field.onBlur}
        name={field.name}
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
      <CHEKIOInput
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

interface HomeOfficeLocation {
  publicId: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

interface PersonalHomeOfficeProps {
  isUpdate?: boolean;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  initialRadius?: number;
  onPositionChange?: (position: { lat: number; lng: number }) => void;
  onRadiusChange?: (radius: number) => void;
  control: Control<any, any>;
  errors: any;
  geolocationArray: UseFieldArrayReturn<any, "EmployeeGeolocation", "publicId">;
  handleOpenDeleteModal?: (publicId: string) => void;
  employeeId: string;
}

const PersonalHomeOffice = ({
  isUpdate = false,
  geolocationArray,
  control,
  errors,
  initialRadius = 100,
  onPositionChange,
  onRadiusChange,
  handleOpenDeleteModal,
  employeeId,
}: PersonalHomeOfficeProps) => {
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { fields, append, remove, update } = geolocationArray;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: updateGeolocations, isPending: isSaving } =
    useUpdateEmployeeGeolocations();

  // Verificar si Google Maps está disponible
  useEffect(() => {
    // Verificar periódicamente si Google Maps está cargado
    const checkGoogleMaps = () => {
      if (typeof window !== "undefined" && window.google?.maps?.places) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    // Verificar inmediatamente
    if (checkGoogleMaps()) {
      return;
    }

    // Si no está cargado, verificar cada 100ms durante 10 segundos
    let attempts = 0;
    const maxAttempts = 100; // 10 segundos (100ms * 100)

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
    fields.length > 0
      ? {
          lat: (fields[0] as HomeOfficeLocation).latitude,
          lng: (fields[0] as HomeOfficeLocation).longitude,
        }
      : defaultCenter;

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newGeolocation = {
          name: `Punto ${fields.length + 1}`,
          latitude: e.latLng.lat(),
          longitude: e.latLng.lng(),
          radius: initialRadius,
          id: uuidv4(),
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

  const handleTypeChange = useCallback(
    (index: number, type: string) => {
      update(index, {
        ...fields[index],
        type,
      });
    },
    [fields, update]
  );

  const handleRadiusChange = useCallback(
    (index: number, radius: number) => {
      requestAnimationFrame(() => {
        update(index, {
          ...fields[index],
          radius,
        });

        if (fields[index].publicId === selectedPoint) {
          onRadiusChange?.(radius);
        }
      });
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
        id: uuidv4(),
      };

      append(newGeolocation);
      onPositionChange?.({ lat, lng });
    },
    [fields.length, initialRadius, onPositionChange, append]
  );

  const handleSaveGeolocations = useCallback(() => {
    if (!employeeId) {
      toast({
        title: "Error",
        description: "No se puede guardar sin un ID de empleado",
        variant: "destructive",
      });
      return;
    }

    const geolocations = fields.map((field: any) => ({
      name: field.name || `Punto ${field.publicId || field.id}`,
      latitude: field.latitude,
      longitude: field.longitude,
      radius: field.radius || initialRadius,
      publicId: field.publicId,
    }));

    updateGeolocations(
      {
        id: employeeId,
        EmployeeGeolocation: geolocations,
      },
      {
        onSuccess: () => {
          toast({
            title: "Geolocalizaciones guardadas",
            description: "Las ubicaciones se han guardado correctamente",
          });
          queryClient.invalidateQueries({ queryKey: ["GetEmployee", employeeId] });
        },
        onError: (error: any) => {
          toast({
            title: "Error al guardar",
            description:
              error.response?.data?.message ||
              "Error al guardar las geolocalizaciones",
            variant: "destructive",
          });
        },
      }
    );
  }, [
    fields,
    employeeId,
    initialRadius,
    updateGeolocations,
    toast,
    queryClient,
  ]);

  if (loadError) return <div>Error al cargar el mapa</div>;
  if (!isLoaded) return <div>Cargando mapa...</div>;

  const markerIcon = {
    url: "/logos/geo-point.png",
    scaledSize: new google.maps.Size(55, 55),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(26, 40),
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col gap-6">
        <div className="flex justify-end">
          <CHEKIOButton
            variant="primary"
            onClick={handleSaveGeolocations}
            disabled={isSaving || fields.length === 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Ubicaciones
              </>
            )}
          </CHEKIOButton>
        </div>
        <LocationSearchBox onPlaceSelected={handlePlaceSelected} />
        <div className="h-[500px] w-full rounded-md overflow-hidden shadow-md">
          <GoogleMap
            zoom={15}
            center={mapCenter}
            mapContainerClassName="w-full h-full"
            onClick={handleMapClick}
            options={{
              gestureHandling: "greedy",
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              zoomControl: true,
              mapTypeId: google.maps.MapTypeId.ROADMAP,
            }}
          >
            {fields.map((field, index) => (
              <MapPoint
                key={`point-${field.publicId}`}
                field={field}
                index={index}
                isSelected={field.publicId === selectedPoint}
                onUpdate={handlePointUpdate}
                onSelect={setSelectedPoint}
                markerIcon={markerIcon}
              />
            ))}
          </GoogleMap>
        </div>

        {fields.length > 0 ? (
          <CHEKIOTable>
            <CHEKIOTableHeader>
              <tr>
                <CHEKIOTableHead>Nombre</CHEKIOTableHead>
                <CHEKIOTableHead>Latitud</CHEKIOTableHead>
                <CHEKIOTableHead>Longitud</CHEKIOTableHead>
                <CHEKIOTableHead>Radio (m)</CHEKIOTableHead>
                <CHEKIOTableHead>Acciones</CHEKIOTableHead>
              </tr>
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {fields.map((field: any, index: number) => (
                <CHEKIOTableRow key={field.publicId || field.id} index={index}>
                  <CHEKIOTableCell>
                    <Controller
                      name={`EmployeeGeolocation.${index}.name`}
                      control={control}
                      render={({ field: formField }) => (
                        <DescriptionInput
                          field={formField}
                          index={index}
                          onNameChange={handleNameChange}
                        />
                      )}
                    />
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>{field.latitude}</CHEKIOTableCell>
                  <CHEKIOTableCell>{field.longitude}</CHEKIOTableCell>
                  <CHEKIOTableCell>
                    <Controller
                      name={`EmployeeGeolocation.${index}.radius`}
                      control={control}
                      render={({ field: formField }) => (
                        <RadiusInput
                          field={formField}
                          index={index}
                          onRadiusChange={handleRadiusChange}
                        />
                      )}
                    />
                  </CHEKIOTableCell>
                  <CHEKIOTableCell>
                    <div className="flex gap-2">
                      <CHEKIOButton
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={() => setSelectedPoint(field.publicId)}
                      >
                        <MapPin
                          className={`h-4 w-4 ${
                            selectedPoint === field.publicId
                              ? "text-blue-500"
                              : ""
                          }`}
                        />
                      </CHEKIOButton>
                      <CHEKIOButton
                        variant="destructive"
                        size="sm"
                        type="button"
                        onClick={() => {
                          handleDeletePoint(index);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </CHEKIOButton>
                    </div>
                  </CHEKIOTableCell>
                </CHEKIOTableRow>
              ))}
            </CHEKIOTableBody>
          </CHEKIOTable>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-600 font-medium">
              No hay ubicaciones configuradas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalHomeOffice;
