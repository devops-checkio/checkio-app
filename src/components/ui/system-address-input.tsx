"use client";

import { ErrorMessage } from "@hookform/error-message";
import { Input } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller } from "react-hook-form";

interface SystemAddressInputProps {
  label: string;
  attribute: string;
  control: any;
  errors?: any;
  rules?: any;
  showError?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  tooltip?: string;
  onPlaceSelected?: (
    place: google.maps.places.PlaceResult,
    coordinates?: { lat: number; lng: number }
  ) => void;
}

const SystemAddressInput = ({
  label,
  attribute,
  control,
  errors,
  rules,
  showError = false,
  className = "",
  placeholder = "Ingrese una dirección",
  disabled = false,
  tooltip = "",
  onPlaceSelected,
}: SystemAddressInputProps) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const fieldOnChangeRef = useRef<((value: string) => void) | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // Verificar si Google Maps está disponible
  useEffect(() => {
    if (!apiKey) {
      setManualMode(true);
      return;
    }

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
        setManualMode(true);
        clearInterval(interval);
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [apiKey]);

  // Función para inicializar autocomplete (memoizada)
  const initializeAutocomplete = useCallback(
    (inputElement: HTMLInputElement) => {
      try {
        // Limpiar autocomplete anterior si existe
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
          autocompleteRef.current = null;
        }

        const autocomplete = new google.maps.places.Autocomplete(inputElement, {
          componentRestrictions: {
            country: ["cl", "ar", "pe", "co", "mx"],
          },
          types: ["address"],
          fields: [
            "formatted_address",
            "geometry",
            "address_components",
            "name",
          ],
        });

        const listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();

          const addressText =
            place.formatted_address ||
            (place as any)?.description ||
            (place.name as string) ||
            "";

          if (addressText && fieldOnChangeRef.current) {
            fieldOnChangeRef.current(addressText);

            if (inputRef.current) {
              inputRef.current.value = addressText;
            }

            let coordinates: { lat: number; lng: number } | undefined;
            if (place.geometry?.location) {
              coordinates = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              };
            }

            // Callback para obtener información adicional si es necesario
            if (onPlaceSelected) {
              onPlaceSelected(place, coordinates);
            }
          }
        });

        autocompleteRef.current = autocomplete;

        // Guardar función de limpieza
        cleanupRef.current = () => {
          if (listener) {
            google.maps.event.removeListener(listener);
          }
          if (autocompleteRef.current) {
            google.maps.event.clearInstanceListeners(autocompleteRef.current);
            autocompleteRef.current = null;
          }
        };
      } catch (error) {
        setManualMode(true);
      }
    },
    [onPlaceSelected]
  );

  // Callback ref para el input
  const handleInputRef = (el: any) => {
    const inputElement = el?.input || null;
    inputRef.current = inputElement;

    // Limpiar instancia anterior si existe
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Inicializar autocomplete si está todo listo
    if (
      inputElement &&
      isLoaded &&
      !manualMode &&
      window.google?.maps?.places
    ) {
      initializeAutocomplete(inputElement);
    }
  };

  const geocodeByText = useCallback(
    (text: string) => {
      if (!text || !window.google?.maps) return;
      try {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: text }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const loc = results[0].geometry?.location;
            const coordinates = loc
              ? { lat: loc.lat(), lng: loc.lng() }
              : undefined;
            // Forzar escritura en el input y en RHF
            if (fieldOnChangeRef.current) fieldOnChangeRef.current(text);
            if (inputRef.current) inputRef.current.value = text;
            onPlaceSelected?.(results[0] as any, coordinates);
          }
        });
      } catch {}
    },
    [onPlaceSelected]
  );

  // Efecto para inicializar autocomplete cuando Google Maps se carga después del input
  useEffect(() => {
    if (
      isLoaded &&
      !manualMode &&
      inputRef.current &&
      window.google?.maps?.places
    ) {
      // Si el input ya está montado pero Google Maps acaba de cargar
      if (!autocompleteRef.current) {
        initializeAutocomplete(inputRef.current);
      }
    }
  }, [isLoaded, manualMode, initializeAutocomplete]);

  // Modo manual (sin Google Maps)
  if (manualMode || !apiKey) {
    const errorMessage = !apiKey
      ? "⚠️ API Key de Google Maps no configurada. Usando input manual."
      : "⚠️ Google Maps no disponible. Usando input manual.";

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-gray-600">
            {label}
            {rules?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <Controller
          name={attribute}
          control={control}
          disabled={disabled}
          rules={rules}
          render={({ field }) => (
            <>
              <Input
                type="text"
                id={field.name}
                placeholder={placeholder}
                disabled={disabled}
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                autoComplete="off"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {(showError || (errors && errors[attribute])) &&
                errors &&
                errors[attribute] && (
                  <ErrorMessage
                    errors={errors}
                    name={attribute}
                    render={({ message }) => (
                      <p className="text-xs text-red-500">
                        {message === "Required"
                          ? "Este campo es requerido"
                          : message}
                      </p>
                    )}
                  />
                )}
            </>
          )}
        />
        <p className="text-xs text-amber-600">{errorMessage}</p>
        {!apiKey && (
          <p className="text-xs text-gray-500">
            💡 Crea un archivo{" "}
            <code className="bg-gray-100 px-1 rounded">.env.local</code> con:{" "}
            <code className="bg-gray-100 px-1 rounded">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_key
            </code>
          </p>
        )}
        {tooltip && <p className="text-xs text-gray-500">{tooltip}</p>}
      </div>
    );
  }

  // Mientras está cargando
  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-gray-600">
            {label}
            {rules?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <Input
          type="text"
          placeholder="Cargando Google Maps..."
          disabled
          autoComplete="off"
          className="w-full p-2 border border-gray-300 rounded-md animate-pulse"
        />
        <p className="text-xs text-blue-600 flex items-center gap-1">
          <span className="animate-spin">⏳</span> Cargando autocompletado de
          direcciones...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-gray-600">
          {label}
          {rules?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Controller
        name={attribute}
        control={control}
        disabled={disabled}
        rules={rules}
        render={({ field }) => {
          // Guardar referencia del onChange para usar en el autocomplete
          fieldOnChangeRef.current = field.onChange;

          return (
            <>
              <div className="relative">
                <Input
                  ref={handleInputRef}
                  type="text"
                  id={field.name}
                  className={`w-full p-2 border ${
                    errors && errors[attribute]
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
                  disabled={disabled}
                  placeholder={placeholder}
                  autoComplete="off"
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                  }}
                  onBlur={(e) => {
                    // Fallback si no hubo place_changed
                    const text = e.target.value?.trim();
                    if (text) geocodeByText(text);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const text = (e.target as HTMLInputElement).value?.trim();
                      if (text) geocodeByText(text);
                    }
                  }}
                />
                {isLoaded && !manualMode && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <span
                      className="text-xs text-green-600"
                      title="Google Maps Autocomplete activo"
                    >
                      ✓
                    </span>
                  </div>
                )}
              </div>
              {(showError || (errors && errors[attribute])) &&
                errors &&
                errors[attribute] && (
                  <ErrorMessage
                    errors={errors}
                    name={attribute}
                    render={({ message }) => (
                      <p className="text-xs text-red-500">
                        {message === "Required"
                          ? "Este campo es requerido"
                          : message}
                      </p>
                    )}
                  />
                )}
            </>
          );
        }}
      />
      {isLoaded && !manualMode && (
        <p className="text-xs text-gray-500">
          💡 Comienza a escribir y selecciona una dirección de las sugerencias
        </p>
      )}
      {tooltip && <p className="text-xs text-gray-500">{tooltip}</p>}
    </div>
  );
};

export default SystemAddressInput;
