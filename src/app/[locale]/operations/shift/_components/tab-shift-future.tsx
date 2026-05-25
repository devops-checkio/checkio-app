import { useGetEmployeesWithShiftFuture } from "@/service/mantainer.service";
import { TabShift } from "./tab-shift";

export const TabShiftFuture = () => {
  return (
    <TabShift title="Turnos Futuros" queryFn={useGetEmployeesWithShiftFuture} />
  );
};
