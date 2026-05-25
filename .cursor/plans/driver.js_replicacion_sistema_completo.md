# Guía Master: Tours driver.js – Replicación en todo el sistema

Este documento es la **referencia canónica** para implementar guías interactivas con [driver.js](https://driverjs.com/) en todos los módulos del sistema Checkio. Basado en la implementación existente en el módulo de Empresas.

---

## Referencias de implementación

| Módulo              | Tipo                    | Referencia                                      |
| ------------------- | ----------------------- | ----------------------------------------------- |
| Empresas (lista)    | Lista CRUD              | `useCompaniesTour.ts`, `companies/page.tsx`      |
| Empresas (detalle)  | Detalle con tabs        | `useCompanyDetailTour.ts`, `[companyId]/page.tsx` |

---

## Patrón 1: Páginas de lista (mantenedores CRUD)

### Contexto

Páginas que muestran una tabla con toolbar (agregar, carga masiva, descargar Excel), tabla ordenable y paginación.

### Archivos a crear/modificar

| Archivo                           | Acción |
| --------------------------------- | ------ |
| `package.json`                    | Agregar `driver.js` (si no existe) |
| `src/hooks/use{Módulo}Tour.ts`     | Crear hook del tour |
| `messages/mantainers/{módulo}/*.json` | Agregar sección `tour` |
| `src/app/[locale]/mantainers/{módulo}/page.tsx` | `data-tour`, botón, import CSS |

### Estructura del hook (patrón useCompaniesTour)

```typescript
"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function use{Módulo}Tour() {
  const t = useTranslations("mantainers.{módulo}");

  const startTour = useCallback(() => {
    const steps: DriveStep[] = [
      {
        popover: {
          title: t("tour.steps.welcome.title"),
          description: t("tour.steps.welcome.description"),
        },
      },
      {
        element: '[data-tour="{módulo}-toolbar"]',
        popover: {
          title: t("tour.steps.toolbar.title"),
          description: t("tour.steps.toolbar.description"),
        },
      },
      {
        element: '[data-tour="{módulo}-table"]',
        popover: {
          title: t("tour.steps.table.title"),
          description: t("tour.steps.table.description"),
        },
      },
    ];

    // Paso condicional: solo si existe paginación
    if (document.querySelector('[data-tour="{módulo}-pagination"]')) {
      steps.push({
        element: '[data-tour="{módulo}-pagination"]',
        popover: {
          title: t("tour.steps.pagination.title"),
          description: t("tour.steps.pagination.description"),
        },
      });
    }

    const driverObj = driver({
      showProgress: true,
      steps,
      nextBtnText: t("tour.buttons.next"),
      prevBtnText: t("tour.buttons.previous"),
      doneBtnText: t("tour.buttons.done"),
    });

    driverObj.drive();
  }, [t]);

  return { startTour };
}
```

### Traducciones (sección `tour`)

```json
{
  "tour": {
    "startButton": "Ver guía",
    "buttons": {
      "next": "Siguiente",
      "previous": "Anterior",
      "done": "Finalizar"
    },
    "steps": {
      "welcome": {
        "title": "Bienvenido al módulo {Nombre}",
        "description": "Descripción breve del módulo y qué aprenderá en esta guía."
      },
      "toolbar": {
        "title": "Acciones principales",
        "description": "Explicar botones: agregar, carga masiva (si aplica), descargar Excel."
      },
      "table": {
        "title": "Tabla de {entidades}",
        "description": "Ordenamiento por columnas, acciones (editar, eliminar, ver)."
      },
      "pagination": {
        "title": "Paginación",
        "description": "Navegar entre páginas y ajustar registros por página."
      }
    }
  }
}
```

### Atributos `data-tour` en la página

| Elemento        | Atributo                      | Ubicación                       |
| --------------- | ----------------------------- | ------------------------------- |
| Toolbar         | `data-tour="{módulo}-toolbar"` | Contenedor de botones (Agregar, Carga masiva, Excel) |
| Tabla           | `data-tour="{módulo}-table"`   | Wrapper de la tabla (incluye loading/empty) |
| Paginación      | `data-tour="{módulo}-pagination"` | Contenedor de controles de paginación      |

### Integración en page.tsx

```tsx
// 1. Imports
import { HelpCircle } from "lucide-react";
import { use{Módulo}Tour } from "@/hooks/use{Módulo}Tour";

// 2. En el componente
const { startTour } = use{Módulo}Tour();

// 3. En CHEKIOHeader actions (o equivalente)
actions={
  <CHEKIOButton
    variant="secondaryBlue"
    onClick={startTour}
    ...
  >
    <HelpCircle className="h-4 w-4" />
    {t("tour.startButton")}
  </CHEKIOButton>
}
```

### Checklist – Página de lista

- [ ] Dependencia `driver.js` en package.json
- [ ] Hook `use{Módulo}Tour.ts` creado
- [ ] Sección `tour` en es.json, en.json, fr.json, pt.json
- [ ] `data-tour="{módulo}-toolbar"` en contenedor del toolbar
- [ ] `data-tour="{módulo}-table"` en contenedor de la tabla
- [ ] `data-tour="{módulo}-pagination"` en contenedor de paginación
- [ ] Botón "Ver guía" en header con `onClick={startTour}`
- [ ] Import de `driver.js/dist/driver.css` en el hook (o globals.css)

---

## Patrón 2: Páginas de detalle con tabs

### Contexto

Páginas con tabs (ej: `[companyId]/page.tsx`, `[branchId]/page.tsx`) donde cada tab tiene contenido distinto.

### Estrategia

- **Un botón "Ver guía" junto a los tabs** que inicia el tour del **tab activo**.
- Cada tab tiene sus propios steps definidos en traducciones por índice de tab.

### Archivos a crear/modificar

| Archivo                                 | Acción |
| --------------------------------------- | ------ |
| `src/hooks/use{Módulo}DetailTour.ts`     | Crear hook con lógica por tab |
| `messages/mantainers/{módulo}/*.json`   | Sección `detailTour.tabs.{0..n}` |
| `page.tsx` (detalle)                    | `data-tour` por sección, botón "Ver guía" |
| Componentes hijos (si aplica)           | `data-tour` en sus contenedores |

### Estructura del hook (patrón useCompanyDetailTour)

```typescript
"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function use{Módulo}DetailTour(activeTab: string) {
  const t = useTranslations("mantainers.{módulo}");

  const startTour = useCallback(() => {
    const tabKey = `detailTour.tabs.${activeTab}`;
    const steps: DriveStep[] = [];

    const addStep = (element: string | null, stepKey: string) => {
      if (!element) {
        // Paso sin highlight (bienvenida u otro)
        steps.push({
          popover: {
            title: t(`${tabKey}.steps.${stepKey}.title`),
            description: t(`${tabKey}.steps.${stepKey}.description`),
          },
        });
      } else if (document.querySelector(`[data-tour="${element}"]`)) {
        // Solo agregar si el elemento existe (permisos, estado vacío)
        steps.push({
          element: `[data-tour="${element}"]`,
          popover: {
            title: t(`${tabKey}.steps.${stepKey}.title`),
            description: t(`${tabKey}.steps.${stepKey}.description`),
          },
        });
      }
    };

    const addWelcome = () => {
      steps.push({
        popover: {
          title: t(`${tabKey}.steps.welcome.title`),
          description: t(`${tabKey}.steps.welcome.description`),
        },
      });
    };

    switch (activeTab) {
      case "0":
        addWelcome();
        addStep("{módulo}-detail-tab-xxx", "xxx");
        addStep("{módulo}-detail-tab-yyy", "yyy");
        break;
      case "1":
        addWelcome();
        addStep("{módulo}-detail-tab-aaa", "aaa");
        // ...
        break;
      // ... más tabs
      default:
        return;
    }

    if (steps.length === 0) return;

    const driverObj = driver({
      showProgress: true,
      steps,
      nextBtnText: t("tour.buttons.next"),
      prevBtnText: t("tour.buttons.previous"),
      doneBtnText: t("tour.buttons.done"),
    });

    driverObj.drive();
  }, [t, activeTab]);

  return { startTour };
}
```

### Traducciones (sección `detailTour`)

```json
{
  "detailTour": {
    "startButton": "Ver guía",
    "tabs": {
      "0": {
        "steps": {
          "welcome": {
            "title": "Nombre del Tab 0",
            "description": "Descripción general del contenido de este tab."
          },
          "xxx": {
            "title": "Título del paso",
            "description": "Descripción del elemento destacado."
          }
        }
      },
      "1": { "steps": { /* ... */ } }
    }
  }
}
```

### Nomenclatura de `data-tour`

- Formato: `{módulo}-detail-tab-{identificador}`
- Ejemplos: `company-detail-tab-basic-info`, `company-detail-tab-tolerances`, `branch-detail-tab-schedule`

### Checklist – Página de detalle

- [ ] Hook `use{Módulo}DetailTour.ts` con `switch(activeTab)` por cada tab
- [ ] Sección `detailTour.tabs.{0..n}` en traducciones
- [ ] Botón "Ver guía" en barra de tabs conectado a `startTour`
- [ ] `data-tour` en cada sección del contenido (inline y componentes hijos)
- [ ] Verificación `document.querySelector` para steps condicionales (permisos, elementos vacíos)

---

## Consideraciones transversales

### Permisos

- Algunos elementos solo se muestran con permisos (`canCreate`, `canUpdate`, etc.).
- Usar `document.querySelector` antes de agregar el step: si el elemento no existe, omitirlo.

### Estado vacío

- Paginación: no se renderiza cuando no hay datos → step condicional.
- Tablas vacías: el contenedor suele existir; el step puede explicar la tabla aunque no haya filas.

### Autostart

- No implementar autostart por defecto.
- El tour se inicia solo al hacer clic en "Ver guía".

### CSS

- Importar `driver.js/dist/driver.css` en el hook (o centralizado en `globals.css`).
- Opcional: personalizar con variables del proyecto (primary blue `#2563eb`).

---

## Inventario de módulos a replicar

### Páginas de lista (Patrón 1)

| Módulo           | Ruta                           | Hook sugerido     |
| ---------------- | ------------------------------ | ------------------ |
| Usuarios         | `mantainers/users`             | `useUsersTour`     |
| Roles            | `mantainers/roles`             | `useRolesTour`     |
| Turnos           | `mantainers/shifts`            | `useShiftsTour`    |
| Estructuras      | `mantainers/structures`        | `useStructuresTour`|
| Cargos           | `mantainers/jobs`              | `useJobsTour`      |
| Dispositivos     | `mantainers/devices`           | `useDevicesTour`   |
| Integraciones    | `mantainers/integrations`      | `useIntegrationsTour` |
| SSO              | `mantainers/sso`               | `useSSOTour`       |
| Cierre mensual   | `mantainers/assistance-month-closing` | `useAssistanceMonthClosingTour` |
| Tipos de aviso   | `mantainers/warning-types`     | `useWarningTypesTour` |
| Horarios         | `mantainers/schedules`         | `useSchedulesTour`  |
| Feriados         | `mantainers/holidays`          | `useHolidaysTour`  |
| Tipos de ausencia| `mantainers/absence-types`     | `useAbsenceTypesTour` |
| Pase diario      | `mantainers/daily-pass`        | `useDailyPassTour` |
| Sucursales       | `mantainers/branches`          | `useBranchesTour`  |
| Empleados        | `mantainers/employees`         | `useEmployeesTour` |
| Banco de tiempo  | `mantainers/time-bank`         | `useTimeBankTour`  |

### Páginas de detalle con tabs (Patrón 2)

| Módulo           | Ruta                           | Hook sugerido           |
| ---------------- | ------------------------------ | ------------------------ |
| Empresas         | `mantainers/companies/[companyId]` | `useCompanyDetailTour` ✓ |
| Sucursales       | `mantainers/branches/[branchId]`   | `useBranchDetailTour`    |
| Estructuras      | `mantainers/structures/[structureId]` | `useStructureDetailTour` |
| Empleados        | `mantainers/employees/[employeeId]` | `useEmployeeDetailTour` |
| Horarios         | `mantainers/schedules/[scheduleId]` | `useScheduleDetailTour` |
| Roles            | `mantainers/roles/[roleId]`        | `useRoleDetailTour`     |
| Banco tiempo     | `mantainers/time-bank/[employeeId]` | `useTimeBankDetailTour` |

---

## Resumen de convenciones

| Aspecto        | Convención                                           |
| -------------- | ---------------------------------------------------- |
| Hook lista     | `use{Módulo}Tour`                                    |
| Hook detalle   | `use{Módulo}DetailTour`                              |
| data-tour lista | `{módulo}-toolbar`, `{módulo}-table`, `{módulo}-pagination` |
| data-tour detalle | `{módulo}-detail-tab-{identificador}`           |
| Namespace i18n | `mantainers.{módulo}`                                |
| Botón guía     | `HelpCircle` + `t("tour.startButton")` o `t("detailTour.startButton")` |
| Botones driver | Reutilizar `tour.buttons` (next, previous, done)    |

---

## Orden sugerido de implementación

1. Módulos más usados: **Usuarios**, **Empleados**, **Sucursales**
2. Mantenedores simples (solo lista): **Roles**, **Turnos**, **Cargos**
3. Mantenedores con detalle y tabs: **Sucursales**, **Estructuras**
4. Resto según prioridad de negocio
