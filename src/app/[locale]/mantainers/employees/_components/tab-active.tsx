"use client";

import TabBase from "./tab-base";

interface TabActiveProps {
  onDownloadExcelReady?: (
    downloadFn: () => Promise<void>,
    isLoading: boolean
  ) => void;
}

export default function TabActive({ onDownloadExcelReady }: TabActiveProps) {
  return (
    <TabBase
      status="active"
      title="Empleados Activos"
      onDownloadExcelReady={onDownloadExcelReady}
    />
  );
}
