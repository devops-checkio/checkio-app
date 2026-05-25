# Sistema de Control de Acceso Avanzado para Roles

## 🎯 Descripción General

Este sistema implementa un control de acceso granular y avanzado para roles, permitiendo definir reglas de acceso por empresa, estructura organizacional y sucursal. El sistema está diseñado para ser extensible y fácil de usar.

## ✨ Funcionalidades Principales

### 1. Control de Acceso por Empresa

- **Lista Blanca**: Solo las empresas seleccionadas tienen acceso
- **Lista Negra**: Las empresas seleccionadas están denegadas
- **Sin Restricciones**: Acceso a todas las empresas
- **Validación**: No permite reglas contradictorias

### 2. Filtros por Estructura Organizacional

- **Niveles Jerárquicos Dinámicos**: Soporta estructuras organizacionales flexibles
- **Control Granular**: Permite definir accesos por nivel específico
- **Integración con OrganizationSelector**: Utiliza el selector existente para la estructura

### 3. Control por Sucursal

- **Lista Blanca**: Solo las sucursales seleccionadas tienen acceso
- **Lista Negra**: Las sucursales seleccionadas están denegadas
- **Sin Restricciones**: Acceso a todas las sucursales

## 🏗️ Arquitectura del Sistema

### Componentes Principales

#### 1. `AdvancedAccessControl`

- **Propósito**: Interfaz principal para configurar reglas de acceso
- **Características**:
  - Tabs para cada tipo de control (Empresas, Estructura, Sucursales)
  - Validación en tiempo real
  - Resumen visual de la configuración
  - Integración con react-hook-form

#### 2. `AccessEvaluator`

- **Propósito**: Motor de evaluación de reglas de acceso
- **Características**:
  - Evaluación en tiempo de ejecución
  - Validación de consistencia lógica
  - Ruta de evaluación detallada
  - Soporte para contextos complejos

#### 3. `AccessTestingPanel`

- **Propósito**: Panel de pruebas para validar configuraciones
- **Características**:
  - Pruebas manuales y predefinidas
  - Escenarios de prueba comunes
  - Resultados detallados con ruta de evaluación

### Tipos de Datos

#### `AccessRule`

```typescript
interface AccessRule {
  id: string;
  type: "allow" | "deny";
  targetType: "company" | "structure" | "branch";
  targetId: string;
  targetName: string;
  level?: number; // Para niveles de estructura organizacional
}
```

#### `AccessControlConfig`

```typescript
interface AccessControlConfig {
  companies: {
    mode: "whitelist" | "blacklist" | "none";
    rules: AccessRule[];
  };
  structure: {
    enabled: boolean;
    rules: AccessRule[];
    levels: TreeItem[][];
    levelNames: string[];
  };
  branches: {
    mode: "whitelist" | "blacklist" | "none";
    rules: AccessRule[];
  };
}
```

#### `AccessContext`

```typescript
interface AccessContext {
  companyId: string;
  branchId?: string;
  structureLevels?: string[]; // Array de IDs de niveles desde raíz hasta actual
  userId?: string;
  roleId?: string;
}
```

## 🔧 Uso del Sistema

### 1. Configuración Básica

```typescript
import { AccessControlConfig } from "./advanced-access-control";

const config: AccessControlConfig = {
  companies: {
    mode: "whitelist",
    rules: [
      {
        id: "company_1",
        type: "allow",
        targetType: "company",
        targetId: "1",
        targetName: "Empresa A",
      },
    ],
  },
  structure: {
    enabled: true,
    rules: [],
    levels: [],
    levelNames: [],
  },
  branches: {
    mode: "none",
    rules: [],
  },
};
```

### 2. Evaluación de Acceso

```typescript
import { evaluateAccess, AccessContext } from "./access-evaluator";

const context: AccessContext = {
  companyId: "1",
  branchId: "1",
  structureLevels: ["1", "2", "3"],
};

const result = evaluateAccess(config, context);
console.log(result.allowed); // true/false
console.log(result.reason); // Razón del resultado
console.log(result.evaluationPath); // Ruta de evaluación
```

### 3. Validación de Configuración

```typescript
import { AccessEvaluator } from "./access-evaluator";

const evaluator = new AccessEvaluator(config);
const validation = evaluator.validateConfiguration();

if (!validation.valid) {
  console.log("Errores de validación:", validation.errors);
}
```

## 🎨 Interfaz de Usuario

### Pestañas Disponibles

1. **Permisos**: Configuración tradicional de permisos CRUD
2. **Control Avanzado**: Nuevo sistema de control de acceso
3. **Pruebas**: Panel de testing para validar configuraciones
4. **Empresas**: Control básico por empresa (legacy)
5. **Sucursales**: Control básico por sucursal (legacy)
6. **Áreas**: Control básico por área (legacy)

### Flujo de Trabajo Recomendado

1. **Configurar Permisos Básicos**: Definir permisos CRUD en la pestaña "Permisos"
2. **Configurar Control Avanzado**: Usar la pestaña "Control Avanzado" para reglas granulares
3. **Probar Configuración**: Usar la pestaña "Pruebas" para validar el comportamiento
4. **Guardar Cambios**: El sistema guarda tanto permisos como reglas de acceso

## 🔍 Lógica de Evaluación

### Orden de Evaluación

1. **Empresa**: Primera validación - si falla, acceso denegado
2. **Estructura**: Si está habilitada y hay niveles en el contexto
3. **Sucursal**: Si hay sucursal en el contexto

### Reglas de Negocio

#### Empresas

- **Lista Blanca**: Solo empresas explícitamente permitidas tienen acceso
- **Lista Negra**: Todas las empresas tienen acceso excepto las explícitamente denegadas
- **Sin Restricciones**: Todas las empresas tienen acceso

#### Estructura Organizacional

- **Habilitado**: Evalúa la ruta completa de niveles
- **Deshabilitado**: No aplica restricciones de estructura
- **Reglas Granulares**: Permite/deniega por nivel específico

#### Sucursales

- **Lista Blanca**: Solo sucursales explícitamente permitidas
- **Lista Negra**: Todas las sucursales excepto las explícitamente denegadas
- **Sin Restricciones**: Todas las sucursales tienen acceso

## 🚀 Escenarios de Uso

### Escenario 1: Rol de Gerente Regional

```typescript
{
  companies: { mode: "whitelist", rules: [/* empresas específicas */] },
  structure: { enabled: true, rules: [/* niveles de gerencia */] },
  branches: { mode: "whitelist", rules: [/* sucursales de la región */] }
}
```

### Escenario 2: Rol de Auditor

```typescript
{
  companies: { mode: "blacklist", rules: [/* empresas restringidas */] },
  structure: { enabled: false },
  branches: { mode: "none" }
}
```

### Escenario 3: Rol de Supervisor de Área

```typescript
{
  companies: { mode: "none" },
  structure: { enabled: true, rules: [/* área específica */] },
  branches: { mode: "whitelist", rules: [/* sucursal local */] }
}
```

## 🔧 Extensibilidad

### Agregar Nuevas Dimensiones

Para agregar nuevas dimensiones de control (ej: región, país):

1. **Extender `AccessRule`**:

```typescript
interface AccessRule {
  // ... existing properties
  targetType: "company" | "structure" | "branch" | "region" | "country";
}
```

2. **Extender `AccessControlConfig`**:

```typescript
interface AccessControlConfig {
  // ... existing properties
  regions: {
    mode: "whitelist" | "blacklist" | "none";
    rules: AccessRule[];
  };
}
```

3. **Actualizar `AccessEvaluator`**:

```typescript
evaluateAccess(context: AccessContext): AccessResult {
  // ... existing evaluation
  // Add region evaluation
  if (context.regionId) {
    const regionResult = this.evaluateRegionAccess(context.regionId);
    if (!regionResult.allowed) return regionResult;
  }
}
```

## 🧪 Testing

### Escenarios Predefinidos

1. **Lista Blanca de Empresa**: Prueba acceso con empresa en lista blanca
2. **Lista Negra de Empresa**: Prueba acceso con empresa en lista negra
3. **Solo Estructura**: Prueba control solo por estructura organizacional
4. **Solo Sucursal**: Prueba control solo por sucursal
5. **Escenario Complejo**: Prueba combinación de todos los controles

### Pruebas Manuales

- Selección de empresa específica
- Selección de sucursal específica
- Selección de niveles de estructura
- Combinaciones de diferentes contextos

## 📝 Notas de Implementación

### Integración con APIs Existentes

- **OrganizationSelector**: Reutiliza el componente existente para estructura organizacional
- **React Hook Form**: Integración completa con el sistema de formularios
- **Servicios de Mantenimiento**: Compatible con servicios existentes

### Consideraciones de Rendimiento

- **Evaluación Lazy**: Las reglas se evalúan solo cuando es necesario
- **Caching**: Los resultados pueden ser cacheados para contextos repetidos
- **Validación Optimizada**: Validaciones se ejecutan solo en cambios de configuración

### Seguridad

- **Validación de Entrada**: Todas las entradas son validadas
- **Sanitización**: Los datos se sanitizan antes de procesar
- **Auditoría**: Las evaluaciones pueden ser registradas para auditoría

## 🔄 Migración

### Desde Sistema Anterior

1. **Compatibilidad**: El sistema es compatible con configuraciones existentes
2. **Migración Gradual**: Se puede migrar rol por rol
3. **Fallback**: Si no hay configuración avanzada, usa configuración básica

### Configuración por Defecto

```typescript
const defaultConfig: AccessControlConfig = {
  companies: { mode: "none", rules: [] },
  structure: { enabled: false, rules: [], levels: [], levelNames: [] },
  branches: { mode: "none", rules: [] },
};
```

## 📞 Soporte

Para dudas o problemas con el sistema:

1. Revisar la documentación de tipos TypeScript
2. Usar el panel de pruebas para validar configuraciones
3. Verificar la consola para errores de validación
4. Consultar los logs de evaluación para debugging
