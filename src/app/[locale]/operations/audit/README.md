# Módulo de Auditoría - Frontend

Este módulo proporciona una interfaz completa para visualizar y gestionar los logs de auditoría del sistema.

## Estructura del Módulo

```
audit/
├── _components/
│   ├── audit.dto.ts              # DTOs y tipos TypeScript
│   ├── audit-log-modal.tsx       # Modal para ver detalles del log
│   ├── tab-all-logs.tsx          # Pestaña con todos los logs
│   ├── tab-authentication.tsx    # Pestaña de eventos de autenticación
│   └── tab-operations.tsx        # Pestaña de operaciones CRUD
├── page.tsx                      # Página principal del módulo
└── README.md                     # Este archivo
```

## Características

### 🎯 **Funcionalidades Principales**

- **Visualización Completa**: Todos los logs de auditoría con paginación
- **Filtros Avanzados**: Búsqueda por texto, acción, estado, fechas
- **Categorización**: Logs separados por tipo (autenticación, operaciones CRUD)
- **Detalles Completos**: Modal con información detallada de cada log
- **Estadísticas**: Contadores por tipo de acción
- **Integridad**: Visualización del hash de integridad HMAC

### 📊 **Pestañas Disponibles**

1. **Todos los Logs**: Vista completa con filtros avanzados
2. **Autenticación**: Eventos de login, logout y fallos de autenticación
3. **Operaciones CRUD**: Creaciones, actualizaciones y eliminaciones

### 🔍 **Filtros y Búsqueda**

- **Búsqueda por texto**: En descripciones de logs
- **Filtro por acción**: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.
- **Filtro por estado**: Éxito o error
- **Rango de fechas**: Filtro temporal
- **Paginación**: Navegación eficiente por grandes volúmenes de datos

### 🛡️ **Seguridad**

- **Control de acceso**: Integrado con sistema de permisos
- **Hash de integridad**: Visualización del HMAC para verificación
- **Información de red**: IP, User Agent, Session ID
- **Trazabilidad completa**: Usuario, fecha, acción, entidad afectada

## Componentes

### `TabAllLogs`

- Tabla completa con todos los logs
- Filtros avanzados en la parte superior
- Paginación y ordenamiento
- Acción para ver detalles

### `TabAuthentication`

- Logs específicos de autenticación
- Estadísticas de logins exitosos/fallidos
- Vista optimizada para eventos de seguridad

### `TabOperations`

- Logs de operaciones CRUD
- Estadísticas por tipo de operación
- Enfoque en cambios de datos

### `AuditLogModal`

- Modal detallado con toda la información del log
- Visualización de cambios de datos (antes/después)
- Información de red y seguridad
- Hash de integridad HMAC

## Servicios

### `audit.service.ts`

- `useGetAuditLogs`: Obtiene logs paginados con filtros
- `useGetAuditLogById`: Obtiene un log específico por ID
- `useGetAuditLogStats`: Obtiene estadísticas de logs

## DTOs y Tipos

### `AuditLogResponseDto`

```typescript
interface AuditLogResponseDto {
  id: string;
  userId: number | null;
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
}
```

### `AuditAction`

Enum con todas las acciones auditables:

- `LOGIN`, `LOGOUT`, `LOGIN_FAILED`
- `CREATE`, `UPDATE`, `DELETE`
- `ACCESS`, `UNAUTHORIZED`
- `PRIVILEGE_ESCALATION`, `CONFIG_CHANGE`

## Uso

### Acceso al Módulo

1. Navegar a **Operaciones** → **Auditoría**
2. Seleccionar la pestaña deseada
3. Usar filtros para encontrar logs específicos
4. Hacer clic en el ícono de acciones para ver detalles

### Filtrado

1. Usar el campo de búsqueda para texto libre
2. Seleccionar acción específica del dropdown
3. Elegir estado (éxito/error)
4. Establecer rango de fechas
5. Hacer clic en "Buscar" o presionar Enter

### Visualización de Detalles

1. Hacer clic en el ícono de acciones (👁️) en cualquier fila
2. Revisar la información detallada en el modal
3. Expandir secciones de cambios de datos si están disponibles
4. Verificar el hash de integridad

## Integración con Backend

El módulo se conecta con los endpoints:

- `GET /client/auth/audit-logs` - Lista paginada
- `GET /client/auth/audit-logs/:id` - Log específico

## Permisos Requeridos

El módulo requiere el permiso `AUDIT_LOGS_VIEW` para acceder a la funcionalidad.

## Estilo y UX

- **Diseño consistente** con el resto de la aplicación
- **Colores semánticos** para diferentes tipos de acciones
- **Iconografía clara** para identificación rápida
- **Responsive** para diferentes tamaños de pantalla
- **Carga optimizada** con paginación y filtros eficientes
