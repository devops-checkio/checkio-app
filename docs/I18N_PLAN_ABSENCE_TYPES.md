# Plan de traducción modularizada: mantainers.absenceTypes

Este documento describe los pasos para extraer las traducciones del módulo **Tipos de Ausencia** (`src/app/[locale]/mantainers/absence-types`) a archivos por módulo, siguiendo [I18N_PER_MODULE_RULES.md](./I18N_PER_MODULE_RULES.md).

---

## 1. Contexto

| Concepto | Valor |
|----------|--------|
| **Ruta del módulo en la app** | `src/app/[locale]/mantainers/absence-types/` |
| **Namespace actual** | `mantainers.absenceTypes` (y subnamespaces `mantainers.absenceTypes.upsert`, `mantainers.absenceTypes.massive`) |
| **Ubicación actual de las claves** | Dentro de `messages/{locale}.json` bajo `mantainers.absenceTypes` |
| **Carpeta destino de mensajes** | `messages/mantainers/absence-types/` |
| **Clave final en el objeto de mensajes** | `mantainers.absenceTypes` |

Los componentes ya usan:

- `useTranslations("mantainers.absenceTypes")` — page, modales
- `useTranslations("mantainers.absenceTypes.upsert")` — modal upsert
- `useTranslations("mantainers.absenceTypes.massive")` — modal masivo

No se modifican componentes; solo se cambia el origen de los mensajes (global → carpeta del módulo).

---

## 2. Estructura de claves a extraer

El objeto a mover es todo lo que está bajo `mantainers.absenceTypes` en cada JSON global. Incluye (referencia desde `en.json`):

- `title`, `breadcrumbs` (dashboard, maintainers, absenceTypes)
- `buttons` (add, massive, downloadExcel, previous, next, edit, delete)
- `table` (headers, loading, noData, noDataDescription)
- `pagination` (showing, page)
- `delete` (title, description, error, confirmMessage)
- `excel` (success, error, filename, sheetName, headers)
- `ariaLabels` (editAbsenceType, deleteAbsenceType)
- `errors` (title)
- `classifications` (todos los tipos: UNJUSTIFIED_ABSENCE, JUSTIFIED_ABSENCE, etc.)
- `upsert` (title, fields, placeholders, validation, info, buttons, toast)
- `massive` (title, tabs, instructions, buttons, table, validation, excel, toast, progress, ariaLabels, tooltips)

En cada archivo del módulo (`messages/mantainers/absence-types/{locale}.json`) va **solo ese objeto**, sin envolver en la clave `"absenceTypes"`; la clave la añade `loadMessages` al hacer el merge.

---

## 3. Checklist de implementación

### Paso 1: Crear la carpeta del módulo

- [ ] Crear directorio: `messages/mantainers/absence-types/`

### Paso 2: Crear los 4 JSON por idioma

- [ ] **en.json**  
  Copiar el objeto completo que en `messages/en.json` está bajo `mantainers.absenceTypes` (desde `"title"` hasta el cierre del objeto, sin la clave `"absenceTypes"`). Pegar como contenido raíz del archivo.

- [ ] **es.json**  
  Igual desde `messages/es.json` → `mantainers.absenceTypes`.

- [ ] **fr.json**  
  Igual desde `messages/fr.json` → `mantainers.absenceTypes`.

- [ ] **pt.json**  
  Igual desde `messages/pt.json` → `mantainers.absenceTypes`.

Cada archivo debe ser un JSON válido cuya raíz es el objeto de mensajes del módulo (sin wrapper extra).

### Paso 3: Actualizar `loadMessages.ts`

- [ ] Asegurar que el objeto `mantainers` exista en `messages` (crear si no existe).
- [ ] Añadir bloque que cargue el módulo y asigne a `messages.mantainers.absenceTypes`:

```ts
// Merge mantainers.absenceTypes from dedicated folder
if (!messages.mantainers) (messages as Record<string, unknown>).mantainers = {};
const mantainers = (messages as Record<string, unknown>).mantainers as Record<string, unknown>;
try {
  const absenceTypesMessages = (
    await import(`../../messages/mantainers/absence-types/${locale}.json`)
  ).default;
  mantainers.absenceTypes = absenceTypesMessages;
} catch {
  // If file is missing for this locale, leave messages unchanged
}
```

Colocarlo después de los merges existentes (p. ej. después de `warning-types` y antes o después de `operations`), manteniendo el mismo estilo de try/catch.

### Paso 4: Eliminar del JSON global

- [ ] En **messages/en.json**: eliminar la clave `"absenceTypes"` y todo su objeto dentro de `mantainers`.
- [ ] En **messages/es.json**: igual.
- [ ] En **messages/fr.json**: igual.
- [ ] En **messages/pt.json**: igual.

Comprobar que la estructura de `mantainers` sigue siendo válida (no dejar comas huérfanas).

### Paso 5: Verificación

- [ ] Build: `npm run build` (o el comando de build del proyecto) sin errores.
- [ ] Probar la pantalla Tipos de Ausencia en los 4 idiomas (en, es, fr, pt):
  - Títulos, breadcrumbs, tabla, paginación.
  - Modal de crear/editar (upsert).
  - Modal de carga masiva (massive).
- [ ] Confirmar que no quedan referencias a `mantainers.absenceTypes` en los JSON globales.

---

## 4. Resumen

| Acción | Detalle |
|--------|---------|
| Crear | `messages/mantainers/absence-types/en.json`, `es.json`, `fr.json`, `pt.json` |
| Contenido | Objeto que hoy está en `mantainers.absenceTypes` en cada global, sin envolver en clave |
| Modificar | `src/i18n/loadMessages.ts`: merge de `mantainers/absence-types/{locale}.json` → `messages.mantainers.absenceTypes` |
| Eliminar | Clave `absenceTypes` dentro de `mantainers` en los 4 JSON globales |
| Código | Sin cambios en `useTranslations` ni en componentes |

Al terminar, la única fuente de verdad para las cadenas del módulo será `messages/mantainers/absence-types/`.
