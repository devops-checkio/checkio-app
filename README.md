# Checkio App - Sistema de Gestión de Roles y Permisos

## Descripción

Sistema avanzado de control de acceso con gestión granular de roles y permisos por empresa, estructura organizacional y sucursal.
test
## Características Principales

- **Control de Acceso Avanzado**: Gestión granular de permisos por empresa, estructura organizacional y sucursal
- **Formularios React Hook Form**: Validación robusta con Zod
- **Interfaz Moderna**: UI/UX optimizada con Tailwind CSS y Radix UI
- **Validación en Tiempo Real**: Feedback inmediato al usuario
- **Persistencia de Datos**: Integración completa con Prisma ORM

## Esquema de Base de Datos - Prisma

### Tablas Principales para Gestión de Roles y Permisos

```prisma
// ============================================================================
// MODELOS DE USUARIOS Y AUTENTICACIÓN
// ============================================================================

model User {
  id                String   @id @default(cuid())
  publicId          String   @unique @default(cuid())
  email             String   @unique
  username          String   @unique
  password          String
  firstName         String
  lastName          String
  isActive          Boolean  @default(true)
  emailVerified     Boolean  @default(false)
  lastLoginAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  // Relaciones
  userRoles         UserRole[]
  userPermissions   UserPermission[]
  sessions          Session[]
  auditLogs         AuditLog[]
  createdBy         String?
  updatedBy         String?

  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  token        String   @unique
  expiresAt    DateTime
  ipAddress    String?
  userAgent    String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relaciones
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// ============================================================================
// MODELOS DE ROLES Y PERMISOS
// ============================================================================

model Role {
  id          String   @id @default(cuid())
  publicId    String   @unique @default(cuid())
  name        String   @unique
  description String?
  isActive    Boolean  @default(true)
  isSystem    Boolean  @default(false)
  priority    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  // Relaciones
  userRoles           UserRole[]
  rolePermissions     RolePermission[]
  accessControlConfig AccessControlConfig[]
  auditLogs           AuditLog[]
  createdBy           String?
  updatedBy           String?

  @@map("roles")
}

model Permission {
  id          String   @id @default(cuid())
  publicId    String   @unique @default(cuid())
  name        String   @unique
  description String?
  resource    String   // Recurso al que se aplica el permiso
  action      String   // Acción permitida (create, read, update, delete, etc.)
  isActive    Boolean  @default(true)
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  // Relaciones
  userPermissions     UserPermission[]
  rolePermissions     RolePermission[]
  auditLogs           AuditLog[]
  createdBy           String?
  updatedBy           String?

  @@unique([resource, action])
  @@map("permissions")
}

model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  isActive  Boolean  @default(true)
  grantedAt DateTime @default(now())
  grantedBy String?
  expiresAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@map("user_roles")
}

model UserPermission {
  id           String   @id @default(cuid())
  userId       String
  permissionId String
  isActive     Boolean  @default(true)
  grantedAt    DateTime @default(now())
  grantedBy    String?
  expiresAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relaciones
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([userId, permissionId])
  @@map("user_permissions")
}

model RolePermission {
  id           String   @id @default(cuid())
  roleId       String
  permissionId String
  isActive     Boolean  @default(true)
  grantedAt    DateTime @default(now())
  grantedBy    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relaciones
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

// ============================================================================
// MODELOS DE CONTROL DE ACCESO AVANZADO
// ============================================================================

model AccessControlConfig {
  id          String   @id @default(cuid())
  publicId    String   @unique @default(cuid())
  roleId      String
  name        String
  description String?
  isActive    Boolean  @default(true)
  version     String   @default("1.0.0")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  // Relaciones
  role                Role                    @relation(fields: [roleId], references: [id], onDelete: Cascade)
  companyRules        CompanyAccessRule[]
  structureRules      StructureAccessRule[]
  branchRules         BranchAccessRule[]
  auditLogs           AuditLog[]
  createdBy           String?
  updatedBy           String?

  @@map("access_control_configs")
}

model CompanyAccessRule {
  id                    String   @id @default(cuid())
  publicId              String   @unique @default(cuid())
  configId              String
  companyId             String
  mode                  AccessMode
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?

  // Relaciones
  config                AccessControlConfig @relation(fields: [configId], references: [id], onDelete: Cascade)
  company               Company             @relation(fields: [companyId], references: [id], onDelete: Cascade)
  auditLogs             AuditLog[]
  createdBy             String?
  updatedBy             String?

  @@unique([configId, companyId])
  @@map("company_access_rules")
}

model StructureAccessRule {
  id                    String   @id @default(cuid())
  publicId              String   @unique @default(cuid())
  configId              String
  structureId           String
  organizationalUnitId  String
  level                 Int
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?

  // Relaciones
  config                AccessControlConfig    @relation(fields: [configId], references: [id], onDelete: Cascade)
  structure             OrganizationalStructure @relation(fields: [structureId], references: [id], onDelete: Cascade)
  organizationalUnit    OrganizationalUnit     @relation(fields: [organizationalUnitId], references: [id], onDelete: Cascade)
  auditLogs             AuditLog[]
  createdBy             String?
  updatedBy             String?

  @@unique([configId, structureId, organizationalUnitId])
  @@map("structure_access_rules")
}

model BranchAccessRule {
  id                    String   @id @default(cuid())
  publicId              String   @unique @default(cuid())
  configId              String
  branchId              String
  mode                  AccessMode
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?

  // Relaciones
  config                AccessControlConfig @relation(fields: [configId], references: [id], onDelete: Cascade)
  branch                Branch             @relation(fields: [branchId], references: [id], onDelete: Cascade)
  auditLogs             AuditLog[]
  createdBy             String?
  updatedBy             String?

  @@unique([configId, branchId])
  @@map("branch_access_rules")
}

// ============================================================================
// MODELOS DE ENTIDADES ORGANIZACIONALES
// ============================================================================

model Company {
  id            String   @id @default(cuid())
  publicId      String   @unique @default(cuid())
  businessName  String
  documentNumber String  @unique
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Relaciones
  branches              Branch[]
  structures            OrganizationalStructure[]
  companyAccessRules    CompanyAccessRule[]
  auditLogs             AuditLog[]
  createdBy             String?
  updatedBy             String?

  @@map("companies")
}

model Branch {
  id          String   @id @default(cuid())
  publicId    String   @unique @default(cuid())
  name        String
  code        String   @unique
  companyId   String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  // Relaciones
  company             Company             @relation(fields: [companyId], references: [id], onDelete: Cascade)
  branchAccessRules   BranchAccessRule[]
  auditLogs           AuditLog[]
  createdBy           String?
  updatedBy           String?

  @@map("branches")
}

model OrganizationalStructure {
  id          String   @id @default(cuid())
  publicId    String   @unique @default(cuid())
  name        String
  description String?
  companyId   String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  // Relaciones
  company             Company                 @relation(fields: [companyId], references: [id], onDelete: Cascade)
  organizationalUnits OrganizationalUnit[]
  structureAccessRules StructureAccessRule[]
  auditLogs           AuditLog[]
  createdBy           String?
  updatedBy           String?

  @@map("organizational_structures")
}

model OrganizationalUnit {
  id                    String   @id @default(cuid())
  publicId              String   @unique @default(cuid())
  name                  String
  description           String?
  structureId           String
  parentUnitId          String?
  level                 Int
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  deletedAt             DateTime?

  // Relaciones
  structure             OrganizationalStructure @relation(fields: [structureId], references: [id], onDelete: Cascade)
  parentUnit            OrganizationalUnit?     @relation("UnitHierarchy", fields: [parentUnitId], references: [id])
  childUnits            OrganizationalUnit[]    @relation("UnitHierarchy")
  structureAccessRules  StructureAccessRule[]
  auditLogs             AuditLog[]
  createdBy             String?
  updatedBy             String?

  @@map("organizational_units")
}

// ============================================================================
// MODELOS DE AUDITORÍA Y LOGS
// ============================================================================

model AuditLog {
  id          String      @id @default(cuid())
  publicId    String      @unique @default(cuid())
  userId      String?
  action      String      // CREATE, UPDATE, DELETE, LOGIN, etc.
  resource    String      // Nombre del recurso afectado
  resourceId  String?     // ID del recurso específico
  details     Json?       // Detalles adicionales de la acción
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime    @default(now())
  isSuccess   Boolean     @default(true)
  errorMessage String?

  // Relaciones polimórficas
  user                User?                @relation(fields: [userId], references: [id])
  role                Role?                @relation(fields: [resourceId], references: [id])
  permission          Permission?          @relation(fields: [resourceId], references: [id])
  accessControlConfig AccessControlConfig? @relation(fields: [resourceId], references: [id])
  company             Company?             @relation(fields: [resourceId], references: [id])
  branch              Branch?              @relation(fields: [resourceId], references: [id])
  structure           OrganizationalStructure? @relation(fields: [resourceId], references: [id])
  organizationalUnit  OrganizationalUnit?  @relation(fields: [resourceId], references: [id])
  companyAccessRule   CompanyAccessRule?   @relation(fields: [resourceId], references: [id])
  structureAccessRule StructureAccessRule? @relation(fields: [resourceId], references: [id])
  branchAccessRule    BranchAccessRule?    @relation(fields: [resourceId], references: [id])

  @@map("audit_logs")
}

// ============================================================================
// ENUMS
// ============================================================================

enum AccessMode {
  WHITELIST
  BLACKLIST
  NONE
}

// ============================================================================
// ÍNDICES PARA OPTIMIZACIÓN
// ============================================================================

// Índices para búsquedas frecuentes
@@index([email], name: "idx_users_email")
@@index([username], name: "idx_users_username")
@@index([publicId], name: "idx_users_public_id")

@@index([roleId], name: "idx_user_roles_role_id")
@@index([userId], name: "idx_user_roles_user_id")

@@index([permissionId], name: "idx_role_permissions_permission_id")
@@index([roleId], name: "idx_role_permissions_role_id")

@@index([configId], name: "idx_company_access_rules_config_id")
@@index([companyId], name: "idx_company_access_rules_company_id")

@@index([configId], name: "idx_structure_access_rules_config_id")
@@index([structureId], name: "idx_structure_access_rules_structure_id")

@@index([configId], name: "idx_branch_access_rules_config_id")
@@index([branchId], name: "idx_branch_access_rules_branch_id")

@@index([timestamp], name: "idx_audit_logs_timestamp")
@@index([userId], name: "idx_audit_logs_user_id")
@@index([action], name: "idx_audit_logs_action")
@@index([resource], name: "idx_audit_logs_resource")
```

## Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- Prisma CLI

### Instalación

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd checkio-app
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env
```

4. **Configurar la base de datos**

```bash
npx prisma generate
npx prisma db push
```

5. **Ejecutar migraciones**

```bash
npx prisma migrate dev
```

6. **Iniciar el servidor de desarrollo**

```bash
npm run dev
```

## Uso del Componente AdvancedAccessControl

### Props del Componente

```typescript
interface AdvancedAccessControlProps {
  roleId: string; // ID del rol
  companyId: string; // ID de la empresa
  onConfigChange?: (config: AccessControlConfig) => void; // Callback para cambios
  onSave?: FormSaveCallback; // Callback para guardar
  config?: FormConfig; // Configuración del formulario
  defaultValues?: Partial<AdvancedAccessControlFormData>; // Valores por defecto
}
```

### Ejemplo de Uso

```tsx
import AdvancedAccessControl from "./_components/advanced-access-control";

function RoleManagementPage({ roleId, companyId }) {
  const handleSave = async (data: AdvancedAccessControlFormData) => {
    try {
      // Lógica para guardar en la base de datos
      const response = await saveAccessControlConfig(roleId, data);
      return {
        success: true,
        message: "Configuración guardada exitosamente",
      };
    } catch (error) {
      return {
        success: false,
        message: "Error al guardar la configuración",
      };
    }
  };

  return (
    <AdvancedAccessControl
      roleId={roleId}
      companyId={companyId}
      onSave={handleSave}
      defaultValues={{
        companies: {
          mode: "whitelist",
          selectedCompanies: [],
          description: "",
        },
        structure: {
          enabled: false,
          structureId: "",
          selectedLevels: [],
          description: "",
        },
        branches: {
          mode: "none",
          selectedBranches: [],
          description: "",
        },
      }}
    />
  );
}
```

## Características del Formulario

### Validación con Zod

- **Validación en tiempo real** de todos los campos
- **Reglas de negocio** integradas en el esquema
- **Mensajes de error** personalizados en español
- **Validación condicional** basada en el estado del formulario

### Estados del Formulario

- **isDirty**: Detecta cambios no guardados
- **isValid**: Valida la integridad de los datos
- **isSubmitting**: Controla el estado de envío
- **errors**: Muestra errores de validación

### Funcionalidades

- **Auto-guardado** opcional
- **Confirmación de salida** para cambios no guardados
- **Toast notifications** para feedback del usuario
- **Resumen en tiempo real** de la configuración

## Estructura de Archivos

```
src/app/[locale]/mantainers/roles/[roleId]/_components/
├── advanced-access-control.tsx    # Componente principal
├── types.ts                       # Tipos TypeScript y Zod schemas
└── README.md                      # Documentación
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: add amazing feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
