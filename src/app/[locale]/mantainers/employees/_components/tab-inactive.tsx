"use client";

import TabBase from "./tab-base";

interface TabInactiveProps {
  onDownloadExcelReady?: (
    downloadFn: () => Promise<void>,
    isLoading: boolean
  ) => void;
}

export default function TabInactive({ onDownloadExcelReady }: TabInactiveProps) {
  return (
    <TabBase
      status="inactive"
      title="Empleados Inactivos"
      onDownloadExcelReady={onDownloadExcelReady}
    />
  );
}
