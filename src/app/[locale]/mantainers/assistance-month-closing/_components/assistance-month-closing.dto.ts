export type AssistanceMonthClosingStatus = "OPEN" | "PRECLOSED" | "CLOSED";

export interface AssistanceMonthClosingStatsResponseDto {
  countIncomplete: number;
  countCompleted: number;
  countAbsent: number;
  countWithoutSchedule: number;
  totalExtraSecondsApproved: number;
  totalDelaySecondsApproved: number;
  calculatedAt: string;
}

export interface AssistanceMonthClosingResponseDto {
  id: number;
  publicId: string;
  companyId: number;
  year: number;
  month: number;
  status: AssistanceMonthClosingStatus;
  closedAt: string | null;
  closedByUserId: number | null;
  reopenCount: number;
  createdAt: string;
  updatedAt: string;
  stats: AssistanceMonthClosingStatsResponseDto | null;
  scopeType?: "COMPANY" | "ORGANIZATIONAL_UNIT";
  organizationalUnitId?: number | null;
  organizationalUnitName?: string | null;
}

export interface AssistanceMonthClosingListResponseDto {
  data: AssistanceMonthClosingResponseDto[];
}

export interface AssistanceMonthReopenAuditResponseDto {
  id: number;
  publicId: string;
  companyId: number;
  year: number;
  month: number;
  reopenedAt: string;
  userId: number;
  reason: string;
}

export interface PaginatedReopenHistoryDto {
  data: AssistanceMonthReopenAuditResponseDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CloseMonthBodyDto {
  year: number;
  month: number;
}

export interface ReopenMonthBodyDto {
  year: number;
  month: number;
  reason: string;
}

export interface PrecloseMonthBodyDto {
  year: number;
  month: number;
  approverUserIds?: number[];
}

export interface AssistanceMonthClosingApproverResponseDto {
  userId: number;
  approvedAt: string | null;
  order: number;
  userName?: string | null;
  isCurrentUser?: boolean;
}

export interface AssistanceMonthClosingApproversResponseDto {
  data: AssistanceMonthClosingApproverResponseDto[];
}
