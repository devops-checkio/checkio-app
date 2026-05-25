import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function VacationView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Vacaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="multiple"
          selected={[
            new Date(2024, 5, 1),
            new Date(2024, 5, 2),
            new Date(2024, 5, 3),
            new Date(2024, 5, 4),
            new Date(2024, 5, 5),
          ]}
          className="rounded-md border"
        />
      </CardContent>
    </Card>
  );
}
