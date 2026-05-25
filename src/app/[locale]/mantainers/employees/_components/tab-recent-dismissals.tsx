"use client";

import TabBase from "./tab-base";

interface TabRecentDismissalsProps {
  onDownloadExcelReady?: (
    downloadFn: () => Promise<void>,
    isLoading: boolean
  ) => void;
}

export default function TabRecentDismissals({
  onDownloadExcelReady,
}: TabRecentDismissalsProps) {
  return (
    <TabBase
      status="recent_dismissals"
      title="Despidos Recientes"
      onDownloadExcelReady={onDownloadExcelReady}
    />
  );
}
