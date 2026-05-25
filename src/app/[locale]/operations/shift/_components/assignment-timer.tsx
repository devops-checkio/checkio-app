"use client";

import { useEffect, useState } from "react";

interface AssignmentTimerProps {
  startTime: Date;
}

export default function AssignmentTimer({ startTime }: AssignmentTimerProps) {
  const [elapsedTime, setElapsedTime] = useState<string>("00:00");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsedTime(
        `${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`
      );
    };

    // Actualizar inmediatamente
    updateTimer();

    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <div className="flex items-center gap-2">
      <svg
        className="w-4 h-4 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-sm font-medium text-gray-600">
        Tiempo transcurrido: {elapsedTime}
      </span>
    </div>
  );
}
