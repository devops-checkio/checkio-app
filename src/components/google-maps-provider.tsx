"use client";

import { useEffect, useState } from "react";

// Variable global para rastrear el estado de carga
let isGoogleMapsLoaded = false;
let isGoogleMapsLoading = false;
const loadCallbacks: Array<() => void> = [];

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

const GoogleMapsProvider = ({ children }: GoogleMapsProviderProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Si no hay API key, no hacer nada
    if (!apiKey) {
      setIsLoaded(true); // Marcar como "loaded" para que los children se rendericen
      return;
    }

    // Si ya está cargado, actualizar el estado
    if (isGoogleMapsLoaded) {
      setIsLoaded(true);
      return;
    }

    // Si está en proceso de carga, agregar a la cola
    if (isGoogleMapsLoading) {
      loadCallbacks.push(() => setIsLoaded(true));
      return;
    }

    // Verificar si el script ya existe en el DOM
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );

    if (existingScript) {
      isGoogleMapsLoaded = true;
      setIsLoaded(true);
      return;
    }

    // Cargar el script
    isGoogleMapsLoading = true;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isGoogleMapsLoaded = true;
      isGoogleMapsLoading = false;
      setIsLoaded(true);

      // Ejecutar todos los callbacks pendientes
      loadCallbacks.forEach((callback) => callback());
      loadCallbacks.length = 0;
    };

    script.onerror = () => {
      isGoogleMapsLoading = false;
      setIsLoaded(true); // Marcar como loaded de todos modos para que la app funcione

      // Ejecutar todos los callbacks pendientes
      loadCallbacks.forEach((callback) => callback());
      loadCallbacks.length = 0;
    };

    document.head.appendChild(script);
  }, [apiKey]);

  // No bloquear el render de los children
  return <>{children}</>;
};

export default GoogleMapsProvider;
