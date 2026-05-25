import { useGetEmployeesWithShiftActive } from "@/service/mantainer.service";
import { TabShift } from "./tab-shift";
export const TabShiftActive = () => {
  return (
    <TabShift title="Turnos Activos" queryFn={useGetEmployeesWithShiftActive} />
  );
};
