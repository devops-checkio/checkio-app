import { TreeItem } from "@/app/[locale]/mantainers/employees/_components/employee.dto";

/**
 * Regla de acceso individual
 */
export interface AccessRule {
  /** Identificador único de la regla */
  id: string;
  /** Tipo de regla: permitir o denegar */
  type: "allow" | "deny";
  /** Tipo de objetivo al que se aplica la regla */
  targetType: "company" | "structure" | "branch";
  /** ID del objetivo */
  targetId: string;
  /** Nombre del objetivo para display */
  targetName: string;
  /** Nivel en la jerarquía (solo para estructura organizacional) */
  level?: number;
  /** Fecha de creación de la regla */
  createdAt?: Date;
  /** Fecha de última modificación */
  updatedAt?: Date;
  /** Usuario que creó la regla */
  createdBy?: string;
  /** Usuario que modificó la regla por última vez */
  updatedBy?: string;
}

/**
 * Configuración de control de acceso por empresa
 */
export interface CompanyAccessConfig {
  /** Modo de control: whitelist, blacklist, o none */
  mode: AccessMode;
  /** Lista de reglas de acceso */
  rules: AccessRule[];
  /** Descripción del modo actual */
  description?: string;
}

/**
 * Configuración de control de acceso por estructura organizacional
 */
export interface StructureAccessConfig {
  /** Si el control de estructura está habilitado */
  enabled: boolean;
  /** Lista de reglas de acceso */
  rules: AccessRule[];
  /** Niveles de la estructura organizacional */
  levels: TreeItem[][];
  /** Nombres de los niveles */
  levelNames: string[];
  /** Descripción de la configuración */
  description?: string;
}

/**
 * Configuración de control de acceso por sucursal
 */
export interface BranchAccessConfig {
  /** Modo de control: whitelist, blacklist, o none */
  mode: AccessMode;
  /** Lista de reglas de acceso */
  rules: AccessRule[];
  /** Descripción del modo actual */
  description?: string;
}

/**
 * Configuración completa del sistema de control de acceso
 */
export interface AccessControlConfig {
  /** Configuración de acceso por empresa */
  companies: CompanyAccessConfig;
  /** Configuración de acceso por estructura organizacional */
  structure: StructureAccessConfig;
  /** Configuración de acceso por sucursal */
  branches: BranchAccessConfig;
  /** Metadatos de la configuración */
  metadata?: {
    /** Versión de la configuración */
    version: string;
    /** Fecha de creación */
    createdAt: Date;
    /** Fecha de última modificación */
    updatedAt: Date;
    /** Usuario que creó la configuración */
    createdBy: string;
    /** Usuario que modificó la configuración por última vez */
    updatedBy: string;
  };
}

/**
 * Contexto para evaluar acceso
 */
export interface AccessContext {
  /** ID de la empresa */
  companyId: string;
  /** ID de la sucursal (opcional) */
  branchId?: string;
  /** Array de IDs de niveles de estructura desde raíz hasta actual */
  structureLevels?: string[];
  /** ID del usuario */
  userId?: string;
  /** ID del rol */
  roleId?: string;
  /** ID de la sesión */
  sessionId?: string;
  /** Timestamp de la evaluación */
  timestamp?: Date;
  /** Información adicional del contexto */
  metadata?: Record<string, any>;
}

/**
 * Resultado de la evaluación de acceso
 */
export interface AccessResult {
  /** Si el acceso está permitido */
  allowed: boolean;
  /** Razón del resultado */
  reason: string;
  /** Reglas aplicadas durante la evaluación */
  appliedRules: AccessRule[];
  /** Ruta de evaluación paso a paso */
  evaluationPath: string[];
  /** Timestamp de la evaluación */
  timestamp: Date;
  /** Duración de la evaluación en milisegundos */
  evaluationTime?: number;
  /** Información adicional del resultado */
  metadata?: Record<string, any>;
}

/**
 * Resultado de validación de configuración
 */
export interface ValidationResult {
  /** Si la configuración es válida */
  valid: boolean;
  /** Lista de errores encontrados */
  errors: string[];
  /** Lista de advertencias */
  warnings: string[];
  /** Información adicional de validación */
  metadata?: Record<string, any>;
}

/**
 * Resumen de configuración
 */
export interface ConfigurationSummary {
  /** Resumen de configuración de empresas */
  companies: {
    mode: string;
    count: number;
    description: string;
  };
  /** Resumen de configuración de estructura */
  structure: {
    enabled: boolean;
    levels: number;
    description: string;
  };
  /** Resumen de configuración de sucursales */
  branches: {
    mode: string;
    count: number;
    description: string;
  };
  /** Información general */
  general: {
    totalRules: number;
    lastModified: Date;
    complexity: "low" | "medium" | "high";
  };
}

/**
 * Opciones para el evaluador de acceso
 */
export interface AccessEvaluatorOptions {
  /** Si debe cachear resultados */
  enableCaching?: boolean;
  /** Tiempo de vida del cache en milisegundos */
  cacheTTL?: number;
  /** Si debe registrar evaluaciones para auditoría */
  enableAuditLog?: boolean;
  /** Si debe validar configuración antes de evaluar */
  validateBeforeEvaluate?: boolean;
  /** Callback para logging */
  onLog?: (message: string, level: "info" | "warn" | "error") => void;
}

/**
 * Estadísticas de evaluación
 */
export interface EvaluationStats {
  /** Total de evaluaciones realizadas */
  totalEvaluations: number;
  /** Evaluaciones que resultaron en acceso permitido */
  allowedCount: number;
  /** Evaluaciones que resultaron en acceso denegado */
  deniedCount: number;
  /** Tiempo promedio de evaluación en milisegundos */
  averageEvaluationTime: number;
  /** Tiempo total de evaluación en milisegundos */
  totalEvaluationTime: number;
  /** Última evaluación realizada */
  lastEvaluation?: {
    timestamp: Date;
    result: AccessResult;
    context: AccessContext;
  };
}

/**
 * Configuración para el panel de pruebas
 */
export interface TestingPanelConfig {
  /** Si debe mostrar escenarios predefinidos */
  showPresetScenarios?: boolean;
  /** Si debe permitir pruebas manuales */
  allowManualTesting?: boolean;
  /** Si debe mostrar resultados detallados */
  showDetailedResults?: boolean;
  /** Escenarios predefinidos personalizados */
  customScenarios?: Array<{
    id: string;
    name: string;
    description: string;
    context: AccessContext;
  }>;
}

/**
 * Evento de cambio de configuración
 */
export interface ConfigChangeEvent {
  /** Tipo de cambio */
  type: "companies" | "structure" | "branches" | "all";
  /** Configuración anterior */
  previousConfig: AccessControlConfig;
  /** Nueva configuración */
  newConfig: AccessControlConfig;
  /** Usuario que realizó el cambio */
  userId?: string;
  /** Timestamp del cambio */
  timestamp: Date;
  /** Comentario del cambio */
  comment?: string;
}

/**
 * Configuración de exportación/importación
 */
export interface ImportExportConfig {
  /** Formato de exportación */
  format: "json" | "yaml" | "csv";
  /** Si debe incluir metadatos */
  includeMetadata?: boolean;
  /** Si debe incluir estadísticas */
  includeStats?: boolean;
  /** Filtros para la exportación */
  filters?: {
    /** Solo reglas activas */
    activeOnly?: boolean;
    /** Solo reglas de un tipo específico */
    targetType?: AccessRule["targetType"];
    /** Solo reglas creadas después de una fecha */
    createdAfter?: Date;
  };
}

/**
 * Configuración de notificaciones
 */
export interface NotificationConfig {
  /** Si debe notificar cambios de configuración */
  notifyConfigChanges?: boolean;
  /** Si debe notificar errores de validación */
  notifyValidationErrors?: boolean;
  /** Si debe notificar evaluaciones fallidas */
  notifyFailedEvaluations?: boolean;
  /** Canales de notificación */
  channels?: Array<"email" | "slack" | "webhook">;
  /** Configuración de canales */
  channelConfig?: {
    email?: {
      recipients: string[];
      template?: string;
    };
    slack?: {
      webhookUrl: string;
      channel?: string;
    };
    webhook?: {
      url: string;
      headers?: Record<string, string>;
    };
  };
}

/**
 * Configuración completa del sistema
 */
export interface SystemConfig {
  /** Configuración de acceso */
  accessControl: AccessControlConfig;
  /** Opciones del evaluador */
  evaluatorOptions: AccessEvaluatorOptions;
  /** Configuración del panel de pruebas */
  testingPanel: TestingPanelConfig;
  /** Configuración de notificaciones */
  notifications: NotificationConfig;
  /** Configuración de importación/exportación */
  importExport: ImportExportConfig;
}

/**
 * Tipos de eventos del sistema
 */
export type SystemEvent =
  | { type: "config_changed"; data: ConfigChangeEvent }
  | {
      type: "access_evaluated";
      data: { result: AccessResult; context: AccessContext };
    }
  | {
      type: "validation_failed";
      data: { errors: string[]; config: AccessControlConfig };
    }
  | { type: "test_executed"; data: { result: AccessResult; scenario: string } };

/**
 * Callback para eventos del sistema
 */
export type SystemEventHandler = (event: SystemEvent) => void;

/**
 * Configuración de auditoría
 */
export interface AuditConfig {
  /** Si debe habilitar auditoría */
  enabled: boolean;
  /** Nivel de detalle de auditoría */
  level: "basic" | "detailed" | "verbose";
  /** Retención de logs en días */
  retentionDays: number;
  /** Eventos a auditar */
  events: Array<"config_change" | "access_evaluation" | "validation" | "test">;
  /** Callback para logging personalizado */
  onAudit?: (event: SystemEvent) => void;
}

export enum AccessMode {
  WHITELIST = "WHITELIST",
  BLACKLIST = "BLACKLIST",
  NONE = "NONE",
}

// ============================================================================
// FORM TYPES FOR REACT-HOOK-FORM
// ============================================================================

/**
 * Formulario de configuración de acceso por empresa
 */
export interface CompanyAccessFormData {
  /** Modo de control */
  mode: AccessMode;
  /** IDs de empresas seleccionadas */
  selectedCompanies: string[];
  /** Descripción opcional */
  description?: string;
}

/**
 * Formulario de configuración de acceso por estructura organizacional
 */
export interface StructureAccessFormData {
  /** Si está habilitado */
  enabled: boolean;
  /** ID de la estructura seleccionada */
  structureId: string;
  /** IDs de niveles seleccionados */
  selectedLevels: string[];
  /** IDs de subunidades seleccionadas */
  selectedSubUnits: string[];
  /** Descripción opcional */
  description?: string;
}

/**
 * Formulario de configuración de acceso por sucursal
 */
export interface BranchAccessFormData {
  /** Modo de control */
  mode: AccessMode;
  /** IDs de sucursales seleccionadas */
  selectedBranches: string[];
  /** Descripción opcional */
  description?: string;
}

/**
 * Formulario completo de control de acceso avanzado
 */
export interface AdvancedAccessControlFormData {
  /** Configuración de empresas */
  companies: CompanyAccessFormData;
  /** Configuración de estructura organizacional */
  structure: StructureAccessFormData;
  /** Configuración de sucursales */
  branches: BranchAccessFormData;
  /** Metadatos del formulario */
  metadata?: {
    /** Comentario del usuario */
    comment?: string;
    /** Tags para categorización */
    tags?: string[];
  };
}

/**
 * Esquema de validación para el formulario
 */
export interface AdvancedAccessControlFormSchema {
  companies: {
    mode: AccessMode;
    selectedCompanies: string[];
    description?: string;
  };
  structure: {
    enabled: boolean;
    structureId: string;
    selectedLevels: string[];
    description?: string;
  };
  branches: {
    mode: AccessMode;
    selectedBranches: string[];
    description?: string;
  };
  metadata?: {
    comment?: string;
    tags?: string[];
  };
}

/**
 * Estado del formulario
 */
export interface FormState {
  /** Si el formulario está siendo enviado */
  isSubmitting: boolean;
  /** Si el formulario es válido */
  isValid: boolean;
  /** Si el formulario ha sido modificado */
  isDirty: boolean;
  /** Errores de validación */
  errors: Record<string, any>;
  /** Valores actuales del formulario */
  values: AdvancedAccessControlFormData;
}

/**
 * Callback para cambios en el formulario
 */
export type FormChangeCallback = (
  data: AdvancedAccessControlFormData,
  isValid: boolean
) => void;

/**
 * Callback para guardar el formulario
 */
export type FormSaveCallback = (
  data: AdvancedAccessControlFormData
) => Promise<{
  success: boolean;
  message?: string;
  errors?: string[];
}>;

/**
 * Configuración del formulario
 */
export interface FormConfig {
  /** Si debe validar automáticamente */
  autoValidate?: boolean;
  /** Si debe guardar automáticamente */
  autoSave?: boolean;
  /** Intervalo de auto-guardado en milisegundos */
  autoSaveInterval?: number;
  /** Si debe mostrar confirmación antes de salir */
  showExitConfirmation?: boolean;
  /** Callback para cambios */
  onChange?: FormChangeCallback;
  /** Callback para guardar */
  onSave?: FormSaveCallback;
  /** Valores iniciales */
  defaultValues?: Partial<AdvancedAccessControlFormData>;
}

export interface CompanyConfigDto {
  /** Modo de acceso a compañías */
  mode: AccessMode;
  /** IDs de compañías seleccionadas */
  selectedCompanies: string[];
  /** Descripción de la configuración de compañías */
  description: string;
}

export interface StructureConfigDto {
  /** ¿Está habilitada la configuración de estructura? */
  enabled: boolean;
  /** ID de la estructura */
  structureId: string;
  /** Niveles seleccionados */
  selectedLevels: string[];
  /** Subunidades seleccionadas */
  selectedSubUnits: string[];
  /** Descripción de la configuración de estructura */
  description: string;
}

export interface BranchConfigDto {
  /** Modo de acceso a sucursales */
  mode: AccessMode;
  /** IDs de sucursales seleccionadas */
  selectedBranches: string[];
  /** Descripción de la configuración de sucursales */
  description: string;
}

export interface MetadataConfigDto {
  /** Comentario adicional */
  comment: string;
  /** Etiquetas */
  tags: string[];
}

export interface AccessControlConfigUpdateDto {
  /** Nombre de la configuración */
  name: string;
  /** Configuración de compañías */
  companies: CompanyConfigDto;
  /** Configuración de estructura */
  structure: StructureConfigDto;
  /** Configuración de sucursales */
  branches: BranchConfigDto;
  /** Metadatos adicionales */
  metadata: MetadataConfigDto;
}

export interface AccessControlConfigResponseDto {
  /** ID público de la configuración */
  publicId: string;
  /** ID público del rol */
  rolePublicId: string;
  /** Nombre de la configuración */
  name: string;
  /** Descripción de la configuración */
  description?: string;
  /** Indica si la configuración está activa */
  isActive: boolean;
  /** Fecha de creación */
  createdAt: Date;
  /** Fecha de actualización */
  updatedAt: Date;
  /** Fecha de eliminación */
  deletedAt?: Date;
  /** Usuario que creó la configuración */
  createdBy?: string;
  /** Usuario que actualizó la configuración */
  updatedBy?: string;
  /** Reglas de acceso por compañías */
  companyRules?: Array<{
    publicId: string;
    companyPublicId: string;
    mode: AccessMode;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  /** Reglas de acceso por estructura */
  structureRules?: Array<{
    publicId: string;
    structurePublicId: string;
    organizationalUnitPublicId: string;
    level: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  /** Reglas de acceso por subunidades organizacionales */
  subOrganizationalUnitRules?: Array<{
    publicId: string;
    structurePublicId: string;
    organizationalUnitPublicId: string;
    subOrganizationalUnitPublicId: string;
    level: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    organizationalUnitName: string;
    organizationalUnitLevel: number;
    subOrganizationalUnitName: string;
    subOrganizationalUnitCode: string;
    type: string;
  }>;
  /** Reglas de acceso por sucursales */
  branchRules?: Array<{
    publicId: string;
    branchPublicId: string;
    mode: AccessMode;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
}
