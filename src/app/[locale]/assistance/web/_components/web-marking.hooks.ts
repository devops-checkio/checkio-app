"use client";

import { useCallback, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import { LocationData } from "./web-marking.dto";

const loadModels = async (): Promise<boolean> => {
  try {
    const strategies = [
      () => `${window.location.origin}/models`,
      () => "/models",
      () => {
        const path = window.location.pathname;
        if (path.includes("/es/")) return "../models";
        if (path.includes("/en/")) return "../models";
        if (path.includes("/pt/")) return "../models";
        return "/models";
      },
    ];

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      const modelsPath = strategy();

      try {
        const manifestUrl = `${modelsPath}/ssd_mobilenetv1_model-weights_manifest.json`;
        const manifestResponse = await fetch(manifestUrl);

        if (manifestResponse.ok) {
          await faceapi.nets.ssdMobilenetv1.loadFromUri(modelsPath);
          return true;
        }
      } catch (strategyError) {
        console.error(`Strategy ${i + 1} failed:`, strategyError);
        continue;
      }
    }

    console.error("All strategies failed");
    return false;
  } catch (error) {
    console.error("Error in loadModels:", error);
    return false;
  }
};

export function useCameraPermission() {
  const [permission, setPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });
        stream.getTracks().forEach((track) => track.stop());
        setPermission(true);
        setError(null);
      } catch (err: any) {
        setPermission(false);
        setError(err.message || "Camera permission denied");
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, []);

  return { permission, loading, error };
}

export function useFaceDetection() {
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModelsWithRetry = async () => {
      let retries = 0;
      const maxRetries = 2;

      while (retries < maxRetries) {
        try {
          const success = await loadModels();
          if (success) {
            setModelsLoaded(true);
            setError(null);
            return;
          }
        } catch (error) {
          console.error(`Failed to load models (attempt ${retries + 1}):`, error);
        }
        retries++;

        if (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      setModelsLoaded(false);
      setError(null);
    };

    loadModelsWithRetry();
  }, []);

  const detectFace = useCallback(
    async (videoElement: HTMLVideoElement | null, countdownSeconds: number) => {
      if (!videoElement || !modelsLoaded) {
        return;
      }

      try {
        if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
          return;
        }

        const detection = await faceapi.detectSingleFace(
          videoElement,
          new faceapi.SsdMobilenetv1Options()
        );

        if (detection) {
          setFaceDetected(true);
          setProgress((prev) => {
            const newProgress = Math.min(100, prev + 100 / (countdownSeconds * 10));
            return newProgress;
          });
        } else {
          setFaceDetected(false);
          setProgress(0);
        }
      } catch (error) {
        console.error("Error detecting face:", error);
        setFaceDetected(false);
        setProgress(0);
      }
    },
    [modelsLoaded]
  );

  const resetDetection = useCallback(() => {
    setFaceDetected(false);
    setProgress(0);
  }, []);

  return {
    modelsLoaded,
    faceDetected,
    progress,
    error,
    detectFace,
    resetDetection,
  };
}

export function useLocationData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocationData = useCallback(async (): Promise<LocationData | null> => {
    setLoading(true);
    setError(null);

    try {
      // Get IP Address
      let ipAddress = "";
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (ipError) {
        console.error("Error getting IP:", ipError);
      }

      // Get Geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Get location name
      let location = "";
      try {
        const locationResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const locationData = await locationResponse.json();
        location = locationData.display_name || "";
      } catch (locationError) {
        console.error("Error getting location name:", locationError);
        location = "Ubicación no disponible";
      }

      return {
        latitude,
        longitude,
        location,
        ipAddress,
      };
    } catch (err: any) {
      setError(err.message || "Error getting location data");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getLocationData, loading, error };
}

export function usePhotoCapture() {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const capturePhoto = useCallback((webcamRef: React.RefObject<any>) => {
    if (!webcamRef.current) {
      return null;
    }

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedPhoto(imageSrc);
        return imageSrc;
      }
      return null;
    } catch (error) {
      console.error("Error capturing photo:", error);
      return null;
    }
  }, []);

  const clearPhoto = useCallback(() => {
    setCapturedPhoto(null);
  }, []);

  return { capturedPhoto, capturePhoto, clearPhoto };
}

