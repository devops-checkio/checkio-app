# CHEKIOTabs - Ejemplos de Uso

## Características Modernizadas

✨ **Nuevo diseño moderno** con 4 variantes de estilo
🎨 **Mejor feedback visual** con animaciones suaves
🏷️ **Soporte para badges** con diferentes variantes de color
♿ **Accesibilidad mejorada** con roles ARIA
🎯 **Focus visible** para navegación por teclado

---

## Variantes Disponibles

### 1. Modern (Default) - Recomendado
Diseño moderno con tabs elevados y línea indicadora animada.

```tsx
import { CHEKIOTabs, CHEKIOTab } from "@/components";
import { Home, Settings, Users } from "lucide-react";

<CHEKIOTabs value={activeTab} onValueChange={setActiveTab} variant="modern">
  <CHEKIOTab value="home" icon={<Home />}>
    Inicio
  </CHEKIOTab>
  <CHEKIOTab value="users" icon={<Users />} badge={12}>
    Usuarios
  </CHEKIOTab>
  <CHEKIOTab value="settings" icon={<Settings />}>
    Configuración
  </CHEKIOTab>
</CHEKIOTabs>
```

### 2. Pills
Diseño tipo píldora con fondo redondeado.

```tsx
<CHEKIOTabs value={activeTab} onValueChange={setActiveTab} variant="pills">
  <CHEKIOTab value="all" badge={45} badgeVariant="neutral">
    Todos
  </CHEKIOTab>
  <CHEKIOTab value="active" badge={12} badgeVariant="success">
    Activos
  </CHEKIOTab>
  <CHEKIOTab value="pending" badge={8} badgeVariant="warning">
    Pendientes
  </CHEKIOTab>
  <CHEKIOTab value="inactive" badge={25} badgeVariant="danger">
    Inactivos
  </CHEKIOTab>
</CHEKIOTabs>
```

### 3. Underline
Diseño clásico con línea inferior.

```tsx
<CHEKIOTabs value={activeTab} onValueChange={setActiveTab} variant="underline">
  <CHEKIOTab value="overview">Vista General</CHEKIOTab>
  <CHEKIOTab value="analytics">Analíticas</CHEKIOTab>
  <CHEKIOTab value="reports">Reportes</CHEKIOTab>
</CHEKIOTabs>
```

### 4. Default
Diseño original con fondo de color.

```tsx
<CHEKIOTabs value={activeTab} onValueChange={setActiveTab} variant="default">
  <CHEKIOTab value="tab1">Pestaña 1</CHEKIOTab>
  <CHEKIOTab value="tab2">Pestaña 2</CHEKIOTab>
  <CHEKIOTab value="tab3">Pestaña 3</CHEKIOTab>
</CHEKIOTabs>
```

---

## Badges

Los badges son perfectos para mostrar contadores o notificaciones.

### Variantes de Badge

```tsx
<CHEKIOTabs value={activeTab} onValueChange={setActiveTab} variant="modern">
  <CHEKIOTab value="all" badge={150} badgeVariant="primary">
    Todos
  </CHEKIOTab>
  <CHEKIOTab value="completed" badge={120} badgeVariant="success">
    Completados
  </CHEKIOTab>
  <CHEKIOTab value="pending" badge={25} badgeVariant="warning">
    Pendientes
  </CHEKIOTab>
  <CHEKIOTab value="failed" badge={5} badgeVariant="danger">
    Fallidos
  </CHEKIOTab>
  <CHEKIOTab value="archived" badge={30} badgeVariant="neutral">
    Archivados
  </CHEKIOTab>
</CHEKIOTabs>
```

---

## Con Iconos

Los iconos añaden contexto visual a cada tab.

```tsx
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  Bell 
} from "lucide-react";

<CHEKIOTabs value={activeTab} onValueChange={setActiveTab} variant="modern">
  <CHEKIOTab value="dashboard" icon={<LayoutDashboard />}>
    Dashboard
  </CHEKIOTab>
  <CHEKIOTab value="users" icon={<Users />} badge={24}>
    Usuarios
  </CHEKIOTab>
  <CHEKIOTab value="documents" icon={<FileText />} badge={8} badgeVariant="warning">
    Documentos
  </CHEKIOTab>
  <CHEKIOTab value="notifications" icon={<Bell />} badge={3} badgeVariant="danger">
    Notificaciones
  </CHEKIOTab>
  <CHEKIOTab value="settings" icon={<Settings />}>
    Configuración
  </CHEKIOTab>
</CHEKIOTabs>
```

---

## Ejemplo Completo con Estado

```tsx
"use client";

import { useState } from "react";
import { CHEKIOTabs, CHEKIOTab } from "@/components";
import { Home, Users, Settings, FileText } from "lucide-react";

export default function MyComponent() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <CHEKIOTabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        variant="modern"
      >
        <CHEKIOTab value="home" icon={<Home />}>
          Inicio
        </CHEKIOTab>
        <CHEKIOTab value="users" icon={<Users />} badge={12} badgeVariant="primary">
          Usuarios
        </CHEKIOTab>
        <CHEKIOTab value="documents" icon={<FileText />} badge={5} badgeVariant="warning">
          Documentos
        </CHEKIOTab>
        <CHEKIOTab value="settings" icon={<Settings />}>
          Configuración
        </CHEKIOTab>
      </CHEKIOTabs>

      {/* Tab Content */}
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        {activeTab === "home" && <div>Contenido de Inicio</div>}
        {activeTab === "users" && <div>Contenido de Usuarios</div>}
        {activeTab === "documents" && <div>Contenido de Documentos</div>}
        {activeTab === "settings" && <div>Contenido de Configuración</div>}
      </div>
    </div>
  );
}
```

---

## Props API

### CHEKIOTabs

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `string` | - | Valor del tab activo (controlado) |
| `onValueChange` | `(value: string) => void` | - | Callback cuando cambia el tab activo |
| `variant` | `"default" \| "pills" \| "underline" \| "modern"` | `"modern"` | Variante de estilo |
| `className` | `string` | - | Clases CSS adicionales |

### CHEKIOTab

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `string` | - | Valor único del tab |
| `active` | `boolean` | - | Estado activo manual (no controlado) |
| `icon` | `React.ReactNode` | - | Icono a mostrar |
| `label` | `React.ReactNode` | - | Etiqueta alternativa |
| `badge` | `string \| number` | - | Contenido del badge |
| `badgeVariant` | `"primary" \| "success" \| "warning" \| "danger" \| "neutral"` | `"primary"` | Color del badge |
| `className` | `string` | - | Clases CSS adicionales |

---

## Accesibilidad

✅ **Roles ARIA**: Cada tab tiene `role="tab"` y `aria-selected`
✅ **Focus Visible**: Anillo de enfoque visible para navegación por teclado
✅ **Semántica**: Estructura HTML semántica correcta

---

## Migrando desde la Versión Anterior

Si estás usando la versión anterior de CHEKIOTabs, la migración es simple:

### Antes
```tsx
<CHEKIOTabs value={activeTab} onValueChange={setActiveTab}>
  <CHEKIOTab active={activeTab === "tab1"} onClick={() => setActiveTab("tab1")}>
    Tab 1
  </CHEKIOTab>
</CHEKIOTabs>
```

### Después (Recomendado)
```tsx
<CHEKIOTabs value={activeTab} onValueChange={setActiveTab} variant="modern">
  <CHEKIOTab value="tab1">
    Tab 1
  </CHEKIOTab>
</CHEKIOTabs>
```

### Cambios Principales:
1. ✅ Añadida prop `variant` con 4 opciones
2. ✅ Añadido soporte para `badge` y `badgeVariant`
3. ✅ Mejoradas animaciones y transiciones
4. ✅ Mejor accesibilidad con ARIA
5. ✅ Focus visible para teclado
6. ✅ Compatibilidad hacia atrás mantenida

---

## Tips de Diseño

1. **Usa "modern"** para aplicaciones modernas y dashboards
2. **Usa "pills"** para filtros y categorías
3. **Usa "underline"** para navegación simple y limpia
4. **Añade badges** para mostrar contadores o notificaciones
5. **Combina con iconos** para mejor UX visual
