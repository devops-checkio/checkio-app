"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export function AttendanceMarker() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const handleAttendance = () => {
    setIsCheckedIn(!isCheckedIn);
    // Aquí iría la lógica para registrar la asistencia en el backend
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marcar Asistencia</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleAttendance}>
          {isCheckedIn ? "Marcar Salida" : "Marcar Entrada"}
        </Button>
        <p className="mt-4">
          Estado: {isCheckedIn ? "Trabajando" : "Fuera de la oficina"}
        </p>
      </CardContent>
    </Card>
  );
}
