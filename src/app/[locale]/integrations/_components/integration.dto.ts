import { PaginationFilterDto } from "@/dto/pagination";

// Enums for Integration Status
export enum IntegrationStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ERROR = "ERROR",
  PENDING = "PENDING",
}

export interface IntegrationResponseDto {
  publicId: string;
  name: string;
  description: string | null;
  companyLogo: string | null;
  status: IntegrationStatus;
  lastSuccessfulExecution: string | null;
  nextExecution: string | null;
  lastFailure: string | null;
  lastFailureMessage: string | null;
  apiUrl: string | null;
  token: string | null;
  integrationCode: string | null;
  isEncrypted: boolean;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown> | null;
  integrationTypes: string[];
  schedule?: {
    days: string[];
    timeSlots: string[];
  };
}

export interface IntegrationCreateDto {
  name: string;
  description?: string;
  companyLogo?: string;
  apiUrl?: string;
  token?: string;
  status?: IntegrationStatus;
  integrationTypes: string[];
  schedule?: {
    days: string[];
    timeSlots: string[];
  };
  retryCount?: number;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

export type UpdateIntegrationDto = Partial<IntegrationCreateDto>;

export interface IntegrationFindFilterDto {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  search?: string;
  status?: IntegrationStatus;
}

export interface PaginationIntegrationDto {
  pagination: PaginationFilterDto;
  data: IntegrationResponseDto[];
}

export interface IntegrationTestConnectionResponseDto {
  success: boolean;
  message: string;
}

/** Filtro de pestañas en la lista de integraciones */
export enum IntegrationListTab {
  ALL = "ALL",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  ERROR = "ERROR",
}

export interface IntegrationOption {
  value: string;
  label: string;
  description: string;
  logo: string;
  supportedDataTypes: IntegrationDataType[]; // Array of supported data type values
}

// Tipos de datos que se pueden integrar
export const INTEGRATION_DATA_TYPES = [
  {
    value: "JOBS",
    label: "Cargos",
    description: "Sincronizar cargos y posiciones de trabajo",
  },
  {
    value: "AREAS",
    label: "Áreas",
    description: "Sincronizar áreas y departamentos",
  },
  {
    value: "WORKERS",
    label: "Trabajadores",
    description: "Sincronizar información de empleados",
  },
  {
    value: "ABSENCES",
    label: "Ausentismos",
    description: "Sincronizar registros de ausentismos",
  },
  {
    value: "ABSENCE_TYPE",
    label: "Tipos de Ausentismo",
    description: "Sincronizar tipos y categorías de ausentismo",
  },
  {
    value: "VACATIONS",
    label: "Vacaciones",
    description: "Sincronizar registros de vacaciones",
  },
  {
    value: "LICENSE",
    label: "Licencias",
    description: "Sincronizar licencias médicas y permisos",
  },
  {
    value: "PERMISSION",
    label: "Permisos",
    description: "Sincronizar permisos especiales",
  },
  {
    value: "COMPANIES",
    label: "Empresa",
    description: "Sincronizar información de la empresa",
  },
  {
    value: "BRANCHES",
    label: "Sucursales",
    description: "Sincronizar sucursales y ubicaciones",
  },
  {
    value: "SCHEDULES",
    label: "Horarios",
    description: "Sincronizar horarios",
  },
  {
    value: "SHIFTS",
    label: "Turnos",
    description: "Sincronizar turnos",
  },
  {
    value: "STRUCTURES",
    label: "Estructuras",
    description: "Sincronizar estructuras organizacionales",
  },
  {
    value: "ROLES",
    label: "Roles",
    description: "Sincronizar roles",
  },
  {
    value: "USERS",
    label: "Usuarios",
    description: "Sincronizar usuarios del sistema externo",
  },
];

export enum IntegrationDataType {
  JOBS = "JOBS",
  AREAS = "AREAS",
  WORKERS = "WORKERS",
  ABSENCES = "ABSENCES",
  ABSENCE_TYPE = "ABSENCE_TYPE",
  VACATIONS = "VACATIONS",
  COMPANY = "COMPANIES",
  BRANCHES = "BRANCHES",
  PERMISSION = "PERMISSION",
  LICENSE = "LICENSE",
  SCHEDULES = "SCHEDULES",
  SHIFTS = "SHIFTS",
  STRUCTURES = "STRUCTURES",
  ROLES = "ROLES",
  USERS = "USERS",
}

// Mock data for available integrations
export const AVAILABLE_INTEGRATIONS: IntegrationOption[] = [
  {
    value: "buk",
    label: "BUK",
    description:
      "Integración con sistema BUK para sincronización de empleados y datos empresariales",
    logo: "/integrations/buk.png",
    supportedDataTypes: [
      IntegrationDataType.JOBS,
      IntegrationDataType.AREAS,
      IntegrationDataType.WORKERS,
      IntegrationDataType.ABSENCES,
      IntegrationDataType.ABSENCE_TYPE,
      IntegrationDataType.VACATIONS,
      IntegrationDataType.LICENSE,
      IntegrationDataType.PERMISSION,
    ],
  },
  {
    value: "inputsoft",
    label: "InputSoft",
    description:
      "Integración con sistema InputSoft para sincronización de empleados y datos empresariales",
    logo: "/integrations/inputsoft.jpeg",
    supportedDataTypes: [
      IntegrationDataType.COMPANY,
      IntegrationDataType.BRANCHES,
      IntegrationDataType.JOBS,
      IntegrationDataType.WORKERS,
    ],
  },
];

// Configuration schema for each integration type
export interface IntegrationConfigSchema {
  fields: {
    name: string;
    type: "text" | "password" | "url" | "number" | "select" | "file";
    label: string;
    placeholder?: string;
    required: boolean;
    description?: string;
    options?: { value: string; label: string }[];
    accept?: string; // For file type fields
  }[];
}

export const INTEGRATION_CONFIGS: Record<string, IntegrationConfigSchema> = {
  buk: {
    fields: [
      {
        name: "apiUrl",
        type: "url",
        label: "URL de la API",
        placeholder: "https://api.buk.com/v1",
        required: true,
        description: "URL base de la API de BUK",
      },
      {
        name: "apiKey",
        type: "password",
        label: "API Key",
        placeholder: "Ingrese la API Key",
        required: true,
        description: "Clave de API de BUK",
      },
    ],
  },
  adp: {
    fields: [
      {
        name: "sftpHost",
        type: "text",
        label: "SFTP Host",
        placeholder: "connection-mft.latam.adp.com",
        required: true,
        description: "Host SFTP proporcionado por ADP",
      },
      {
        name: "sftpPort",
        type: "number",
        label: "SFTP Port",
        placeholder: "10022",
        required: true,
        description: "Puerto SFTP proporcionado por ADP",
      },
      {
        name: "sftpHostIp",
        type: "text",
        label: "SFTP Host IP",
        placeholder: "192.168.1.1",
        required: false,
        description: "Dirección IP del host SFTP (opcional, si aplica)",
      },
      {
        name: "sftpUsername",
        type: "text",
        label: "SFTP Username",
        placeholder: "usuario",
        required: true,
        description: "Usuario SFTP proporcionado por ADP",
      },
      {
        name: "sftpDirectory",
        type: "text",
        label: "SFTP Directory",
        placeholder: "/home/user/adp",
        required: true,
        description:
          "Ruta del directorio SFTP (opcional, si se utiliza autenticación por contraseña)",
      },
      {
        name: "sftpPrivateKey",
        type: "file",
        label: "SFTP Private Key",
        placeholder: "Selecciona archivo .pem",
        required: true,
        description: "Archivo de clave privada SFTP (.pem)",
        accept: ".pem,application/x-pem-file,text/plain",
      },
    ],
  },
  talana: {
    fields: [
      {
        name: "apiUrl",
        type: "url",
        label: "URL de la API",
        placeholder: "https://api.talana.com/v1",
        required: true,
        description: "URL base de la API de Talana",
      },
    ],
  },
  campushr: {
    fields: [
      {
        name: "apiUrl",
        type: "url",
        label: "URL de la API",
        placeholder: "https://api.campushr.com/v1",
        required: true,
        description: "URL base de la API de Campus HR",
      },
      {
        name: "username",
        type: "text",
        label: "Usuario",
        placeholder: "usuario@empresa.com",
        required: true,
        description: "Usuario de Campus HR",
      },
      {
        name: "password",
        type: "password",
        label: "Contraseña",
        placeholder: "Ingrese la contraseña",
        required: true,
        description: "Contraseña de Campus HR",
      },
    ],
  },
  inputsoft: {
    fields: [
      {
        name: "apiUrl",
        type: "url",
        label: "URL de la API (opcional)",
        placeholder: "https://salary.inputsoft.cl/AppWeb/ApiSalary/api",
        required: false,
        description:
          "Si está vacío se usa la URL por defecto de InputSoft Salary API",
      },
      {
        name: "username",
        type: "text",
        label: "Usuario",
        placeholder: "usuario@empresa.com",
        required: true,
        description: "Usuario de InputSoft",
      },
      {
        name: "password",
        type: "password",
        label: "Contraseña",
        placeholder: "Ingrese la contraseña",
        required: true,
        description: "Clave de API de InputSoft",
      },
    ],
  },
};
