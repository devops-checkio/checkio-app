"use client";

import TabBaseTimeBank from "./tab-base-time-bank";
import { TimeBankResponseDto } from "./time-bank.dto";

interface TabExpiredTimeBanksProps {
  onEdit: (timeBank: TimeBankResponseDto) => void;
  onDelete: (id: string) => void;
  onViewDetail?: (timeBank: TimeBankResponseDto) => void;
  refetchTrigger: number;
  canUpdate: boolean;
  canDelete: boolean;
  forcedEmployeeId?: string;
}

export default function TabExpiredTimeBanks({
  onEdit,
  onDelete,
  onViewDetail,
  refetchTrigger,
  canUpdate,
  canDelete,
  forcedEmployeeId,
}: TabExpiredTimeBanksProps) {
  return (
    <TabBaseTimeBank
      status="expired"
      onEdit={onEdit}
      onDelete={onDelete}
      onViewDetail={onViewDetail}
      refetchTrigger={refetchTrigger}
      canUpdate={canUpdate}
      canDelete={canDelete}
      forcedEmployeeId={forcedEmployeeId}
    />
  );
}
