"use client";

import {
  CHEKIOActionButton,
  CHEKIOButton,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAuditLogs } from "@/service/audit.service";
import { Card } from "antd";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { AuditLogModal } from "./audit-log-modal";
import {
  AuditAction,
  AuditActionColors,
  AuditLogFindFilterDto,
  AuditLogResponseDto,
} from "./audit.dto";

export default function TabAuthentication() {
  const t = useTranslations("audit");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLog, setSelectedLog] = useState<AuditLogResponseDto | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filters: AuditLogFindFilterDto = {
    page,
    pageSize,
    sort: "desc",
    action: undefined, // Get all logs, filter auth actions on client
  };

  const { data: auditLogsData, isLoading } = useGetAuditLogs(filters);

  // Filter authentication logs on the client side
  const authLogs = useMemo(() => {
    const authActions = [
      AuditAction.LOGIN,
      AuditAction.LOGOUT,
      AuditAction.LOGIN_FAILED,
    ];

    return (
      auditLogsData?.data?.filter((log) => authActions.includes(log.action)) ||
      []
    );
  }, [auditLogsData?.data]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = authLogs.length;
    const successful = authLogs.filter(
      (log) => log.action === AuditAction.LOGIN && log.isSuccess
    ).length;
    const failed = authLogs.filter(
      (log) => log.action === AuditAction.LOGIN_FAILED
    ).length;
    const logout = authLogs.filter(
      (log) => log.action === AuditAction.LOGOUT
    ).length;

    return { total, successful, failed, logout };
  }, [authLogs]);

  // Calculate pagination for filtered results
  const totalCount = stats.total;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedAuthLogs = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return authLogs.slice(startIndex, endIndex);
  }, [authLogs, page, pageSize]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleViewLog = useCallback((log: AuditLogResponseDto) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  }, []);

  const getActionLabel = (action: AuditAction) => {
    const actionMap: Record<AuditAction, string> = {
      [AuditAction.LOGIN]: t("login"),
      [AuditAction.LOGOUT]: t("logout"),
      [AuditAction.LOGIN_FAILED]: t("loginFailed"),
      [AuditAction.CREATE]: t("create"),
      [AuditAction.UPDATE]: t("update"),
      [AuditAction.DELETE]: t("delete"),
      [AuditAction.ACCESS]: t("access"),
      [AuditAction.UNAUTHORIZED]: t("unauthorized"),
      [AuditAction.PRIVILEGE_ESCALATION]: t("privilegeEscalation"),
      [AuditAction.CONFIG_CHANGE]: t("configChange"),
    };
    return actionMap[action] || action;
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case AuditAction.LOGIN:
        return (
          <LogIn
            className="w-4 h-4"
            style={{ color: AuditActionColors[action] }}
          />
        );
      case AuditAction.LOGOUT:
        return (
          <LogOut
            className="w-4 h-4"
            style={{ color: AuditActionColors[action] }}
          />
        );
      case AuditAction.LOGIN_FAILED:
        return (
          <AlertCircle
            className="w-4 h-4"
            style={{ color: AuditActionColors[action] }}
          />
        );
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card bordered={false}>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">
              {t("statistics.totalEvents")}
            </div>
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
        </Card>

        <Card bordered={false}>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">
              {t("statistics.successfulLogins")}
            </div>
            <LogIn className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats.successful}
          </div>
        </Card>

        <Card bordered={false}>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">
              {t("statistics.failedLogins")}
            </div>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
        </Card>

        <Card bordered={false}>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">{t("statistics.logouts")}</div>
            <LogOut className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.logout}
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card bordered={false}>
        {isLoading ? (
          <div className="animate-content-fade-in">
            <CHEKIOTable>
              <CHEKIOTableHeader>
                <tr>
                  <CHEKIOTableHead>{t("action")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("user")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("description")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("date")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("status")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("actions")}</CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {Array.from({ length: 8 }).map((_, index) => (
                  <CHEKIOTableRow key={index} index={index}>
                    <CHEKIOTableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-6 w-20 rounded" />
                      </div>
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32 rounded" />
                          <Skeleton className="h-3 w-16 rounded" />
                        </div>
                      </div>
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <Skeleton className="h-4 w-40 max-w-xs rounded" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-20 rounded" />
                        <Skeleton className="h-3 w-14 rounded" />
                      </div>
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <Skeleton className="h-6 w-16 rounded" />
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      <div className="flex justify-center">
                        <Skeleton className="h-8 w-20 rounded" />
                      </div>
                    </CHEKIOTableCell>
                  </CHEKIOTableRow>
                ))}
              </CHEKIOTableBody>
            </CHEKIOTable>
            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-40 rounded" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-10 w-24 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-lg" />
                <Skeleton className="h-10 w-20 rounded-md" />
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-content-fade-in">
            <CHEKIOTable>
              <CHEKIOTableHeader>
                <tr>
                  <CHEKIOTableHead>{t("action")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("user")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("description")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("date")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("status")}</CHEKIOTableHead>
                  <CHEKIOTableHead>{t("actions")}</CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {paginatedAuthLogs.length === 0 ? (
                  <tr>
                    <CHEKIOTableCell colSpan={6} className="text-center py-10">
                      <p className="text-gray-600 font-medium">
                        {t("table.noData")}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {t("table.noDataDescription")}
                      </p>
                    </CHEKIOTableCell>
                  </tr>
                ) : (
                  paginatedAuthLogs.map((log, index) => (
                    <CHEKIOTableRow key={log.id} index={index}>
                      <CHEKIOTableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span
                            className="inline-block px-2 py-1 rounded text-xs font-medium w-fit"
                            style={{
                              backgroundColor:
                                AuditActionColors[log.action] + "20",
                              borderColor: AuditActionColors[log.action],
                              color: AuditActionColors[log.action],
                              border: "1px solid",
                            }}
                          >
                            {getActionLabel(log.action)}
                          </span>
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {log.userEmail || (
                                <span className="text-gray-400">{t("system")}</span>
                              )}
                            </span>
                            {log.userId && (
                              <span className="text-xs text-gray-500">
                                ID: {log.userId}
                              </span>
                            )}
                          </div>
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div
                          className="max-w-xs truncate"
                          title={log.description || t("noDescription")}
                        >
                          {log.description || (
                            <span className="text-gray-400">{t("noDescription")}</span>
                          )}
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-xs">
                              {DateTime.fromISO(log.createdAt).toFormat("dd/MM/yyyy")}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {DateTime.fromISO(log.createdAt).toFormat("HH:mm:ss")}
                          </span>
                        </div>
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {log.action === AuditAction.LOGOUT ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 w-fit">
                            {t("logout")}
                          </span>
                        ) : (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium w-fit ${
                              log.isSuccess
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {log.isSuccess ? t("success") : t("error")}
                          </span>
                        )}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="flex flex-row gap-2 justify-center">
                          <CHEKIOActionButton
                            variant="view"
                            onClick={() => handleViewLog(log)}
                            aria-label={t("viewLog")}
                            className="h-auto w-auto px-3 py-1.5 gap-1.5"
                          >
                            <Eye className="h-4 w-4" />
                            <span>{t("viewLog")}</span>
                          </CHEKIOActionButton>
                        </div>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))
                )}
              </CHEKIOTableBody>
            </CHEKIOTable>

            {totalCount > 0 && (
              <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {t("pagination.showing", {
                      current: paginatedAuthLogs.length,
                      total: totalCount,
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Registros por página:
                    </label>
                    <CHEKIOSelect
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        handlePageSizeChange(parseInt(value, 10));
                      }}
                    >
                      <CHEKIOSelectTrigger className="w-24">
                        <CHEKIOSelectValue />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        <CHEKIOSelectItem value="10">10</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="20">20</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="50">50</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="100">100</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="200">200</CHEKIOSelectItem>
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("pagination.previous")}
                  </CHEKIOButton>
                  <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                    {t("pagination.page", {
                      current: page,
                      total: totalPages,
                    })}
                  </div>
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    {t("pagination.next")}
                    <ChevronRight className="h-4 w-4" />
                  </CHEKIOButton>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modal */}
      <AuditLogModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null);
        }}
        auditLog={selectedLog}
      />
    </div>
  );
}
