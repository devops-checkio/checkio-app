/** Ausencia por día y empleado (misma fuente que schedule/[employeId]: useGetAbsences). */
export type TeamAbsenceDayInfo = {
  absenceTypeName: string;
  typeCode: string;
  startDate: string | Date;
  endDate: string | Date;
  withoutPay: boolean;
};
