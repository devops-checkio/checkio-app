import { useGetEmployeesWithShiftPast } from "@/service/mantainer.service";
import { TabShift } from "./tab-shift";

export const TabShiftPast = () => {
  return (
    <TabShift title="Turnos Pasados" queryFn={useGetEmployeesWithShiftPast} />
  );
};
