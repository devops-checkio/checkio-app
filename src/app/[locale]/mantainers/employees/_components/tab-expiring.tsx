"use client";

import TabBase from "./tab-base";

interface TabExpiringProps {
  onDownloadExcelReady?: (
    downloadFn: () => Promise<void>,
    isLoading: boolean
  ) => void;
}

export default function TabExpiring({
  onDownloadExcelReady,
}: TabExpiringProps) {
  return (
    <TabBase
      status="expiring"
      title="Empleados por Vencer"
      onDownloadExcelReady={onDownloadExcelReady}
    />
  );
}
