"use client";

import {
  CHEKIOModal,
  CHEKIOTab,
  CHEKIOTabs,
} from "@/components";
import { Card } from "antd";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  FileCheck,
  Globe,
  Info,
  Lock,
  Server,
  Shield,
  ShieldCheck,
  Smartphone,
  User,
  Zap,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AuditActionColors, AuditLogResponseDto } from "./audit.dto";
import { JsonDiffViewer } from "./json-diff-viewer";

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLog: AuditLogResponseDto | null;
}

export function AuditLogModal({
  isOpen,
  onClose,
  auditLog,
}: AuditLogModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const t = useTranslations("audit.modal");

  if (!auditLog) return null;

  const formatJsonValue = (value: any) => {
    if (!value) return null;
    return JSON.stringify(value, null, 2);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "LOGIN":
      case "LOGOUT":
        return <User className="w-4 h-4" />;
      case "CREATE":
      case "UPDATE":
      case "DELETE":
        return <Database className="w-4 h-4" />;
      case "ACCESS":
      case "UNAUTHORIZED":
        return <Shield className="w-4 h-4" />;
      case "CONFIG_CHANGE":
        return <Info className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      LOGIN: t("login"),
      LOGOUT: t("logout"),
      LOGIN_FAILED: t("loginFailed"),
      CREATE: t("create"),
      UPDATE: t("update"),
      DELETE: t("delete"),
      ACCESS: t("access"),
      UNAUTHORIZED: t("unauthorized"),
      PRIVILEGE_ESCALATION: t("privilegeEscalation"),
      CONFIG_CHANGE: t("configChange"),
    };
    return actionMap[action] || action;
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="7xl"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="space-y-4 pb-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t("subtitle")}</p>
                <div className="text-xs text-gray-500 mt-1">
                  {t("logId")}: <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{auditLog.id}</code>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {DateTime.fromISO(auditLog.createdAt).toFormat(
                    "dd/MM/yyyy HH:mm:ss"
                  )}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {DateTime.fromISO(auditLog.createdAt).toRelative()}
              </div>
            </div>
          </div>

          {/* Status and Action Header */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {getActionIcon(auditLog.action)}
                <span
                  className="inline-block px-3 py-1 rounded text-sm font-medium"
                  style={{
                    backgroundColor: AuditActionColors[auditLog.action] + "20",
                    borderColor: AuditActionColors[auditLog.action],
                    color: AuditActionColors[auditLog.action],
                    border: "1px solid",
                  }}
                >
                  {getActionLabel(auditLog.action)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {auditLog.isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span
                  className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    auditLog.isSuccess
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-red-100 text-red-800 border border-red-300"
                  }`}
                >
                  {auditLog.isSuccess
                    ? t("operationSuccessful")
                    : t("operationFailed")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <CHEKIOTabs value={activeTab} onValueChange={setActiveTab}>
          <CHEKIOTab value="overview" icon={<Info className="w-4 h-4" />}>
            {t("overview")}
          </CHEKIOTab>
          <CHEKIOTab value="technical" icon={<Server className="w-4 h-4" />}>
            {t("technical")}
          </CHEKIOTab>
          <CHEKIOTab value="security" icon={<Shield className="w-4 h-4" />}>
            {t("security")}
          </CHEKIOTab>
          <CHEKIOTab value="data" icon={<Database className="w-4 h-4" />}>
            {t("dataChanges")}
          </CHEKIOTab>
          <CHEKIOTab value="compliance" icon={<FileCheck className="w-4 h-4" />}>
            {t("compliance")}
          </CHEKIOTab>
        </CHEKIOTabs>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Event Details */}
                <Card bordered={false}>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      {t("eventDetails")}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t("actionType")}
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            {getActionIcon(auditLog.action)}
                            <span className="font-medium">
                              {getActionLabel(auditLog.action)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t("eventCategory")}
                          </label>
                          <div className="mt-1">
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium border border-gray-300">
                              {["CREATE", "UPDATE", "DELETE"].includes(
                                auditLog.action
                              )
                                ? t("businessOperation")
                                : t("securityEvent")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {t("description")}
                        </label>
                        <p className="mt-1 text-sm bg-gray-50 p-3 rounded border">
                          {auditLog.description || t("noDescriptionProvided")}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t("timestampUtc")}
                          </label>
                          <div className="mt-1">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                              {DateTime.fromISO(auditLog.createdAt).toFormat(
                                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
                              )}
                            </code>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t("localTime")}
                          </label>
                          <div className="mt-1 text-sm">
                            {DateTime.fromISO(auditLog.createdAt).toFormat(
                              "dd/MM/yyyy HH:mm:ss"
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* User & Session */}
                <Card bordered={false}>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-green-600" />
                      {t("userSession")}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {t("userIdentity")}
                        </label>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">
                              {auditLog.userName
                                ? `${t("userName")}: ${auditLog.userName}`
                                : t("systemOperation")}
                            </span>
                          </div>
                            {auditLog.userUsername && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>
                                  {t("userUsername")}: {auditLog.userUsername}
                                </span>
                              </div>
                            )}
                          {auditLog.userDocumentNumber && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="font-mono">
                                {auditLog.userDocumentNumber}
                              </span>
                            </div>
                          )}
                          {auditLog.userId && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>
                                {t("userId")}: {auditLog.userId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {auditLog.sessionId && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t("sessionId")}
                          </label>
                          <code className="mt-1 block text-xs bg-gray-100 px-2 py-1 rounded font-mono break-all">
                            {auditLog.sessionId}
                          </code>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {t("ipAddress")}
                        </label>
                        <div className="mt-1">
                          {auditLog.ipAddress ? (
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-gray-500" />
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                {auditLog.ipAddress}
                              </code>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              {t("notAvailable")}
                            </span>
                          )}
                        </div>
                      </div>

                      {auditLog.userAgent && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t("userAgent")}
                          </label>
                          <div className="mt-1">
                            <div className="flex items-start gap-2">
                              <Smartphone className="w-4 h-4 text-gray-500 mt-0.5" />
                              <span className="text-xs bg-gray-50 p-2 rounded border break-all">
                                {auditLog.userAgent}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Entity Information */}
              {(auditLog.entityName || auditLog.entityId) && (
                <Card bordered={false}>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Database className="w-5 h-5 text-purple-600" />
                      {t("entityInformation")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {auditLog.entityName && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t("entityType")}
                          </label>
                          <p className="mt-1 font-medium text-lg">
                            {auditLog.entityName}
                          </p>
                        </div>
                      )}
                      {auditLog.entityId && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t("entityId")}
                          </label>
                          <code className="mt-1 block text-sm bg-gray-100 px-3 py-2 rounded font-mono">
                            {auditLog.entityId}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === "technical" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card bordered={false}>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Server className="w-5 h-5 text-blue-600" />
                      {t("databaseInfrastructure")}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Database className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-blue-900">
                            {t("postgresqlDatabase")}
                          </div>
                          <div className="text-sm text-blue-700">
                            {t("enterpriseGradeAcid")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Zap className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-900">
                            {t("prismaOrm")}
                          </div>
                          <div className="text-sm text-green-700">
                            {t("typeSafeOperations")}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {t("technicalSpecifications")}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {t("storageEngine")}:
                          </span>
                          <span className="font-mono">PostgreSQL 14+</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {t("ormFramework")}:
                          </span>
                          <span className="font-mono">Prisma v5.x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {t("transactionSupport")}:
                          </span>
                          <span className="font-mono">{t("acidCompliant")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("indexing")}:</span>
                          <span className="font-mono">B-tree, GIN, Hash</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card bordered={false}>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-red-600" />
                      {t("securityArchitecture")}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                        <Shield className="w-5 h-5 text-red-600" />
                        <div>
                          <div className="font-medium text-red-900">
                            {t("roleBasedAccess")}
                          </div>
                          <div className="text-sm text-red-700">
                            {t("appInsertOnly")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-yellow-600" />
                        <div>
                          <div className="font-medium text-yellow-900">
                            {t("hmacIntegrity")}
                          </div>
                          <div className="text-sm text-yellow-700">
                            {t("tamperProofTrail")}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {t("securityFeatures")}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>{t("immutableRecords")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>{t("cryptographicVerification")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>{t("roleBasedPermissions")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>{t("encryptedTransmission")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <Card bordered={false} className="border-blue-200 bg-blue-50">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                    {t("hmacIntegrityVerification")}
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {t("hmacDescription")}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-blue-800 uppercase tracking-wide">
                    {t("integrityHash")}
                  </label>
                  <div className="mt-2 p-3 bg-white border border-blue-200 rounded">
                    <code className="text-xs font-mono break-all text-gray-800">
                      {auditLog.integrityHash}
                    </code>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="font-medium text-green-900">
                      {t("tamperProof")}
                    </div>
                    <div className="text-xs text-green-700">
                      {t("recordCannotBeModified")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Lock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="font-medium text-blue-900">
                      {t("cryptographicallySecure")}
                    </div>
                    <div className="text-xs text-blue-700">
                      {t("hmacSha256Protection")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="font-medium text-purple-900">
                      {t("verifiable")}
                    </div>
                    <div className="text-xs text-purple-700">
                      {t("hashCanBeVerified")}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t("howHmacWorks")}
                  </h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• {t("hmacStep1")}</p>
                    <p>• {t("hmacStep2")}</p>
                    <p>• {t("hmacStep3")}</p>
                    <p>• {t("hmacStep4")}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "data" && (
            <div className="space-y-6">
              {auditLog.previousValues || auditLog.newValues ? (
                <div className="space-y-4">
                  <JsonDiffViewer
                    oldValue={auditLog.previousValues}
                    newValue={auditLog.newValues}
                  />
                </div>
              ) : (
                <Card bordered={false}>
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t("noDataChanges")}
                    </h3>
                    <p className="text-gray-600">
                      {t("noDataChangesDescription")}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === "compliance" && (
            <Card bordered={false} className="border-green-200 bg-green-50">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                    <FileCheck className="w-6 h-6 text-green-600" />
                    {t("complianceStandards")}
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    {t("complianceDescription")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded border border-green-200">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">{t("iso27001")}</div>
                        <div className="text-sm text-gray-600">
                          {t("informationSecurityManagement")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white rounded border border-green-200">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">{t("gdpr")}</div>
                        <div className="text-sm text-gray-600">
                          {t("generalDataProtection")}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded border border-green-200">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">{t("hipaa")}</div>
                        <div className="text-sm text-gray-600">
                          {t("healthInsurancePortability")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white rounded border border-green-200">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">{t("pciDss")}</div>
                        <div className="text-sm text-gray-600">
                          {t("paymentCardIndustry")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-green-200 pt-6 mt-6">
                  <h4 className="font-medium text-gray-900 mb-4">
                    {t("complianceFeatures")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>{t("immutableRecords")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>{t("completeActivityTracking")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>{t("cryptographicVerification")}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>{t("roleBasedPermissions")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>{t("comprehensiveEventLogging")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>{t("longTermRetention")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded border border-green-200 mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t("auditTrailGuarantees")}
                  </h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      • <strong>{t("nonRepudiation")}</strong>
                    </p>
                    <p>
                      • <strong>{t("integrity")}</strong>
                    </p>
                    <p>
                      • <strong>{t("completeness")}</strong>
                    </p>
                    <p>
                      • <strong>{t("availability")}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </CHEKIOModal>
  );
}
