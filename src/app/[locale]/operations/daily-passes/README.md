# Módulo de Pases Diarios de Acceso

## Descripción

Este módulo permite gestionar pases temporales de acceso para empleados que han perdido su documento de identidad o necesitan acceso temporal al sistema. El sistema genera códigos QR diarios que se envían por correo electrónico según el horario asignado del empleado.

## Funcionalidades

### 1. Creación de Pases

- **Selección de Empleados**: Buscar y seleccionar empleados usando filtros avanzados
- **Configuración de Fechas**: Definir período de validez del pase (fecha inicio y fin)
- **Motivo**: Especificar la razón del pase temporal
- **Procesamiento Masivo**: Crear pases para múltiples empleados simultáneamente

### 2. Gestión de Pases Activos

- **Vista de Pases Activos**: Lista de todos los pases vigentes
- **Acciones Disponibles**:
  - Ver detalles del pase
  - Desactivar pase
  - Renovar pase por días adicionales

### 3. Gestión de Pases Vencidos

- **Vista de Pases Vencidos**: Lista de pases expirados o desactivados
- **Acciones Disponibles**:
  - Ver detalles del pase
  - Renovar pase (solo para pases expirados, no desactivados)

### 4. Estados del Pase

- **ACTIVE**: Pase vigente y funcional
- **EXPIRED**: Pase que ha vencido por fecha
- **DEACTIVATED**: Pase desactivado manualmente

## Estructura del Proyecto

```
daily-passes/
├── page.tsx                           # Página principal con tabs
├── _components/
│   ├── daily-pass.dto.ts             # DTOs y tipos TypeScript
│   ├── daily-pass-modal.tsx          # Modal para crear pases
│   ├── daily-pass-actions-modal.tsx  # Modal para acciones (ver/renovar/desactivar)
│   ├── tab-active.tsx                # Tab de pases activos
│   └── tab-expired.tsx               # Tab de pases vencidos
└── README.md                         # Esta documentación
```

## Servicios

### daily-pass.service.tsx

Servicio mock que simula las operaciones CRUD para pases diarios:

- `useGetDailyPasses()` - Obtener todos los pases
- `useGetActiveDailyPasses()` - Obtener pases activos
- `useGetExpiredDailyPasses()` - Obtener pases vencidos
- `useCreateDailyPass()` - Crear nuevo pase
- `useDeactivateDailyPass()` - Desactivar pase
- `useRenewDailyPass()` - Renovar pase
- `useDeleteDailyPass()` - Eliminar pase

## Flujo de Trabajo

### 1. Crear Pase

1. Usuario hace clic en "Crear Pase"
2. Se abre modal con selector de empleados
3. Usuario busca y selecciona empleados
4. Usuario configura fechas y motivo
5. Sistema procesa la creación secuencialmente
6. Se muestran códigos QR y se envían por email

### 2. Gestionar Pase

1. Usuario hace clic en "Ver" en cualquier pase
2. Se abre modal con dos tabs: "Detalles" y "Acciones"
3. En "Detalles" se muestra información completa del pase
4. En "Acciones" se pueden realizar operaciones según el estado

### 3. Renovar Pase

1. Usuario selecciona "Renovar" en un pase activo o expirado
2. Selecciona cantidad de días adicionales (1, 3, 7, 14, 30)
3. Sistema actualiza la fecha de fin y reactiva el pase
4. Se generan nuevos códigos QR para el período extendido

## Características Técnicas

### Tecnologías Utilizadas

- **React** con TypeScript
- **React Hook Form** para formularios
- **React Query** para gestión de estado del servidor
- **Ant Design** para componentes UI
- **Luxon** para manejo de fechas
- **Tailwind CSS** para estilos

### Patrones de Diseño

- **Componente Modal**: Para creación y gestión de pases
- **Tabs**: Para separar pases activos y vencidos
- **DataTable**: Para mostrar listas de pases
- **Formularios Controlados**: Para entrada de datos
- **Manejo de Estados**: Para procesos asíncronos

### Validaciones

- Fechas de inicio y fin obligatorias
- Fecha de fin debe ser posterior a fecha de inicio
- Motivo obligatorio
- Al menos un empleado seleccionado
- Días adicionales entre 1 y 30 para renovación

## Mock Data

El servicio incluye datos de ejemplo para desarrollo:

```typescript
const mockDailyPasses: DailyPassResponseDto[] = [
  {
    publicId: "1",
    employeeId: "emp1",
    employeeName: "Juan Pérez",
    employeeEmail: "juan.perez@empresa.com",
    startDate: "2024-01-15",
    endDate: "2024-01-20",
    status: DailyPassStatus.ACTIVE,
    // ... más campos
  },
  // ... más pases
];
```

## Próximos Pasos

1. **Integración con Backend**: Reemplazar servicios mock con llamadas reales a la API
2. **Generación de QR**: Implementar generación real de códigos QR
3. **Envío de Emails**: Integrar con servicio de email
4. **Notificaciones**: Agregar notificaciones push para pases próximos a vencer
5. **Reportes**: Generar reportes de uso de pases
6. **Auditoría**: Agregar logs de todas las acciones realizadas

## Notas de Desarrollo

- El módulo sigue las convenciones de diseño del sistema
- Usa los mismos componentes UI que otros módulos
- Implementa manejo de errores y estados de carga
- Incluye validaciones de formulario
- Sigue el patrón de arquitectura establecido
