import type { MassAssignmentExistingSlot } from "./modal-mass-assignment";

export type SelectedDayDto = {
  date: string;
  schedule: string;
  error?: string;
  existingScheduleSlots?: MassAssignmentExistingSlot[];
  recordType?: string;
  scheduleOptions?: Array<{
    scheduleId: string;
    scheduleCode: string;
    scheduleName?: string;
  }>;
};
