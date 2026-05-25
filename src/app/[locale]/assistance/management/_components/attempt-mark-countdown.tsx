"use client";

import { Clock } from "lucide-react";
import { DateTime } from "luxon";
import { memo, useEffect, useState } from "react";
import { AttemptMarkStatus } from "../../_components/assistance.dto";

interface AttemptMarkCountdownProps {
  expiresAt: string;
  status: AttemptMarkStatus;
  createdAt: string;
}

const AttemptMarkCountdown = memo(
  ({ expiresAt, status, createdAt }: AttemptMarkCountdownProps) => {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
      // Solo activar cuenta regresiva para intentos en progreso
      if (status !== AttemptMarkStatus.IN_PROGRESS) {
        return;
      }

      const calculateTimeRemaining = () => {
        const now = DateTime.now();
        const expires = DateTime.fromISO(expiresAt);
        const diff = expires.diff(now, "seconds").seconds;

        if (diff <= 0) {
          setIsExpired(true);
          setTimeRemaining(0);
          return false; // Detener el interval
        }

        setTimeRemaining(Math.floor(diff));
        setIsExpired(false);
        return true; // Continuar el interval
      };

      // Calcular inmediatamente al montar
      const shouldContinue = calculateTimeRemaining();

      if (!shouldContinue) {
        return;
      }

      // Actualizar cada segundo
      const interval = setInterval(() => {
        const shouldContinue = calculateTimeRemaining();
        if (!shouldContinue) {
          clearInterval(interval);
        }
      }, 1000);

      // Cleanup: limpiar interval al desmontar
      return () => clearInterval(interval);
    }, [expiresAt, status]);

    // No mostrar si no es IN_PROGRESS
    if (status !== AttemptMarkStatus.IN_PROGRESS) {
      return null;
    }

    // Mostrar estado expirado
    if (isExpired) {
      return (
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-red-600" />
          <span className="text-xs font-medium text-red-600">
            Tiempo expirado
          </span>
        </div>
      );
    }

    // Calcular minutos y segundos
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    // Determinar color según tiempo restante
    let colorClass = "text-green-600"; // Más de 2 minutos
    let bgClass = "bg-green-50";
    let progressColor = "bg-green-600";

    if (timeRemaining <= 30) {
      // Menos de 30 segundos
      colorClass = "text-red-600";
      bgClass = "bg-red-50";
      progressColor = "bg-red-600";
    } else if (timeRemaining <= 120) {
      // Menos de 2 minutos
      colorClass = "text-yellow-600";
      bgClass = "bg-yellow-50";
      progressColor = "bg-yellow-600";
    }

    // Calcular porcentaje de tiempo transcurrido (para la barra de progreso)
    const created = DateTime.fromISO(createdAt);
    const expires = DateTime.fromISO(expiresAt);
    const totalDuration = expires.diff(created, "seconds").seconds;
    const elapsedTime = totalDuration - timeRemaining;
    const progressPercentage = Math.min(
      100,
      (elapsedTime / totalDuration) * 100
    );

    return (
      <div className={`flex flex-col gap-1.5 p-2 rounded-lg ${bgClass}`}>
        <div className="flex items-center gap-1.5">
          <Clock className={`w-3 h-3 ${colorClass}`} />
          <span className={`text-xs font-medium ${colorClass}`}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}{" "}
            restantes
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`${progressColor} h-1.5 rounded-full transition-all duration-1000`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {/* Mensaje de advertencia si queda poco tiempo */}
        {timeRemaining <= 30 && (
          <span className="text-[10px] text-red-600 font-medium animate-pulse">
            ⚠️ Tiempo próximo a expirar
          </span>
        )}
      </div>
    );
  }
);

AttemptMarkCountdown.displayName = "AttemptMarkCountdown";

export default AttemptMarkCountdown;
