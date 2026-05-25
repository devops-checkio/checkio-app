# Banco de Horas - Módulo de Gestión

## Descripción

El módulo de Banco de Horas permite gestionar las horas acumuladas de los empleados, configurar diferentes tipos de horas extras con sus respectivos porcentajes, y administrar la asignación de permisos de compensación.

## Características Principales

### 1. Dashboard con KPIs

- Total de empleados con banco de horas
- Horas acumuladas totales
- Promedio de horas por empleado
- Empleados sin banco de horas

### 2. Gestión de Empleados con Banco de Horas

- Lista de empleados que tienen banco de horas configurado
- Filtros por: búsqueda, documento, cargo, sucursal, estado
- Visualización de horas totales, disponibles y utilizadas
- Estados: Activo, Inactivo, Expirado

### 3. Gestión de Empleados sin Banco de Horas

- Lista de empleados que no tienen banco de horas
- Filtros por: búsqueda, documento, cargo, sucursal
- Acción rápida para crear banco de horas

### 4. Configuración del Sistema

- Duración máxima del banco de horas (1-12 meses)
- Configuración de tipos de horas por defecto
- Permisos para saldo negativo
- Expiración automática configurable

### 5. Configuración de Banco de Horas por Empleado

- Selección de empleado
- Configuración de período (fecha inicio/fin)
- Configuración de tipos de horas con porcentajes:
  - 100% - Horas Extras
  - 75% - Horas Extras
  - 50% - Horas Extras
  - 35% - Horas Extras
  - 25% - Horas Extras

## Estructura de Archivos

```
time-bank/
├── _components/
│   ├── time-bank.dto.ts              # DTOs y tipos TypeScript
│   ├── tab-employees-with-time-bank.tsx    # Tab de empleados con banco
│   ├── tab-employees-without-time-bank.tsx # Tab de empleados sin banco
│   ├── tab-time-bank-config.tsx      # Tab de configuración
│   └── time-bank-config-modal.tsx    # Modal de configuración
├── page.tsx                          # Página principal
└── README.md                         # Esta documentación
```

## Tecnologías Utilizadas

- **React** con TypeScript
- **React Hook Form** para formularios
- **Zod** para validación
- **React Query** para gestión de estado del servidor
- **shadcn/ui** para componentes de UI
- **Tailwind CSS** para estilos

## API Endpoints

### Time Bank CRUD

- `GET /client/mantainer/time-banks` - Listar bancos de horas
- `POST /client/mantainer/time-banks` - Crear banco de horas
- `PUT /client/mantainer/time-banks/{id}` - Actualizar banco de horas
- `DELETE /client/mantainer/time-banks/{id}` - Eliminar banco de horas

### Empleados

- `GET /client/mantainer/time-banks/employees-with-time-bank` - Empleados con banco
- `GET /client/mantainer/time-banks/employees-without-time-bank` - Empleados sin banco

### KPIs y Configuración

- `GET /client/mantainer/time-banks/kpi` - KPIs del sistema
- `GET /client/mantainer/time-banks/config` - Configuración del sistema
- `POST /client/mantainer/time-banks/config` - Crear configuración
- `PUT /client/mantainer/time-banks/config/{id}` - Actualizar configuración

## Flujo de Trabajo

1. **Configuración Inicial**: El administrador configura los parámetros del sistema
2. **Asignación de Banco**: Se asigna banco de horas a empleados específicos
3. **Gestión de Horas**: Se gestionan las horas acumuladas y utilizadas
4. **Monitoreo**: Se monitorean los KPIs y el estado de los bancos

## Consideraciones de Diseño

- **Responsive**: Diseño adaptativo para diferentes tamaños de pantalla
- **Accesibilidad**: Componentes accesibles con ARIA labels
- **Performance**: Optimización con React Query para caché y revalidación
- **UX**: Estados de carga, errores y feedback visual apropiados

## Integración futura con Aprobación de Asistencia

Las aprobaciones de **horas extra** y **atrasos** en **Gestión de Asistencia** (`/assistance/management`) serán en el futuro el origen de transacciones en el banco de horas:

- **Horas extra aprobadas** → transacción tipo ADD (agregar horas al banco).
- **Atrasos / salida anticipada aprobados** → transacción tipo SUBTRACT (descontar del banco).

Esa generación automática de transacciones a partir de la aprobación de asistencia **no está implementada aún**; queda documentada aquí como flujo previsto.

## Próximas Mejoras

- [ ] Historial de transacciones de banco de horas
- [ ] Reportes detallados de utilización
- [ ] Integración con sistema de nóminas
- [ ] Notificaciones automáticas de expiración
- [ ] Exportación de datos a Excel/PDF
- [ ] Generación automática de transacciones ADD/SUBTRACT desde aprobación de asistencia (horas extra / atrasos)
