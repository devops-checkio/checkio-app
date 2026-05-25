"use client";

import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useEffect, useState } from "react";

interface UnderConstructionProps {
  releaseDate: string;
  title?: string;
  description?: string;
  logoSrc?: string;
  logoWidth?: number;
  logoHeight?: number;
}

export default function InConstruction({
  releaseDate,
  title = "En Construcción!",
  description = "Esta sección está actualmente en desarrollo. Estamos trabajando para implementar esta funcionalidad pronto.",
  logoSrc = "/logos/logo.svg",
  logoWidth = 200,
  logoHeight = 200,
}: UnderConstructionProps) {
  const date = new Date(releaseDate);

  const calculateTimeLeft = () => {
    const now = new Date();
    const difference = date.getTime() - now.getTime();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [countdown, setCountdown] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
        <ExclamationCircleIcon className="w-8 h-8 text-yellow-500" />
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>

      <p className="text-gray-600 text-center mb-6">{description}</p>

      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
        <p className="text-sm font-medium text-blue-800 mb-1">Disponible en:</p>
        <div className="flex items-center justify-center gap-2 text-blue-700">
          <div className="flex flex-col items-center">
            <span className="font-mono bg-blue-100 px-2 py-1 rounded">
              {countdown.days}
            </span>
            <span className="text-xs mt-1">días</span>
          </div>
          :
          <div className="flex flex-col items-center">
            <span className="font-mono bg-blue-100 px-2 py-1 rounded">
              {countdown.hours.toString().padStart(2, "0")}
            </span>
            <span className="text-xs mt-1">horas</span>
          </div>
          :
          <div className="flex flex-col items-center">
            <span className="font-mono bg-blue-100 px-2 py-1 rounded">
              {countdown.minutes.toString().padStart(2, "0")}
            </span>
            <span className="text-xs mt-1">min</span>
          </div>
          :
          <div className="flex flex-col items-center">
            <span className="font-mono bg-blue-100 px-2 py-1 rounded">
              {countdown.seconds.toString().padStart(2, "0")}
            </span>
            <span className="text-xs mt-1">seg</span>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-1 text-center">
          Fecha de lanzamiento: {releaseDate}
        </p>
      </div>

      <Image
        src={logoSrc}
        alt="En Construcción"
        width={logoWidth}
        height={logoHeight}
      />
    </div>
  );
}
