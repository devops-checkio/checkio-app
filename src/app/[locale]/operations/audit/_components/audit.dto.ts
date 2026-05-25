export interface AuditLogResponseDto {
  id: string;
  userId: string | null;
  action: AuditAction;
  entityName: string | null;
  entityId: string | null;
  description: string | null;
  previousValues: any;
  newValues: any;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  isSuccess: boolean;
  createdAt: string;
  integrityHash: string;
  userEmail: string | null;
  userName: string | null;
  userUsername: string | null;
  userDocumentNumber: string | null;
}

export interface AuditLogFindFilterDto {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  userId?: number;
  action?: AuditAction;
  entityName?: string;
  entityId?: string;
  isSuccess?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationFilterDto {
  current: number;
  next: number | null;
  previous: number | null;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  sort: "asc" | "desc";
}

export interface PaginationAuditLogDto {
  pagination: PaginationFilterDto;
  data: AuditLogResponseDto[];
}

export enum AuditAction {
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  LOGIN_FAILED = "LOGIN_FAILED",
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  ACCESS = "ACCESS",
  UNAUTHORIZED = "UNAUTHORIZED",
  PRIVILEGE_ESCALATION = "PRIVILEGE_ESCALATION",
  CONFIG_CHANGE = "CONFIG_CHANGE",
}

// AuditActionLabels moved to components that use translations
// This will be replaced by translation keys in the components

export const AuditActionColors: Record<AuditAction, string> = {
  [AuditAction.LOGIN]: "#52c41a",
  [AuditAction.LOGOUT]: "#1890ff",
  [AuditAction.LOGIN_FAILED]: "#ff4d4f",
  [AuditAction.CREATE]: "#52c41a",
  [AuditAction.UPDATE]: "#faad14",
  [AuditAction.DELETE]: "#ff4d4f",
  [AuditAction.ACCESS]: "#1890ff",
  [AuditAction.UNAUTHORIZED]: "#ff4d4f",
  [AuditAction.PRIVILEGE_ESCALATION]: "#722ed1",
  [AuditAction.CONFIG_CHANGE]: "#fa8c16",
};
