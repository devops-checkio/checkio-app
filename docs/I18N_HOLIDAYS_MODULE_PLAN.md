# Plan de traducción modularizada: mantainers/holidays

Este documento describe el plan para migrar las traducciones del módulo **Holidays** (`src/app/[locale]/mantainers/holidays`) a archivos por módulo, siguiendo [I18N_PER_MODULE_RULES.md](./I18N_PER_MODULE_RULES.md).

---

## 1. Estado actual

| Aspecto                            | Detalle                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| **Namespace en código**            | `mantainers.holidays` y `mantainers.holidays.massive`                             |
| **Ubicación actual**               | Objeto bajo `mantainers.holidays` en los JSON globales (`messages/en.json`, etc.) |
| **Archivos que usan traducciones** | `page.tsx`, `holiday-modal-upsert.tsx`, `modal-mass-holidays.tsx`                 |
| **Idiomas**                        | `en`, `es`, `fr`, `pt`                                                            |

### Claves de traducción usadas (resumen)

- **Página principal (`page.tsx`)**: `title`, `subtitle`, `breadcrumbs.*`, `buttons.*`, `table.*`, `pagination.*`, `delete.*`, `excel.*`, `ariaLabels.*`, `yes`, `no`.
- **Modal upsert (`holiday-modal-upsert.tsx`)**: `upsert.*` (title, fields, placeholders, validation, toast), `buttons.*`.
- **Modal masivo (`modal-mass-holidays.tsx`)**: `buttons.*`, `toast.*`, `upsert.fields.branches`, `upsert.placeholders.branches`, y todo el subnamespace `massive` (title, message, selectYear, yearPlaceholder, noHolidaysMessage, loadingHolidays, branchAssignment._, table._).

---

## 2. Estructura objetivo

Convención de nombres (según I18N_PER_MODULE_RULES): el path de la carpeta relativo a `messages/` se convierte en la clave del objeto, con `/` → `.` y guiones a camelCase.

| Carpeta                         | Clave en el objeto de mensajes |
| ------------------------------- | ------------------------------ |
| `messages/mantainers/holidays/` | `mantainers.holidays`          |

Estructura de carpetas a crear:

```
messages/
├── en.json, es.json, fr.json, pt.json   # Sin la clave mantainers.holidays
└── mantainers/
    └── holidays/
        ├── en.json
        ├── es.json
        ├── fr.json
        └── pt.json
```

Cada archivo `messages/mantainers/holidays/{locale}.json` contendrá **solo el objeto** que hoy está bajo `mantainers.holidays` en el global (sin envolver en una clave `"holidays"`). Incluye el subobjeto `massive` para que `useTranslations("mantainers.holidays.massive")` siga funcionando.

---

## 3. Contenido de cada JSON del módulo

Cada `messages/mantainers/holidays/{locale}.json` debe tener la misma estructura de claves que el objeto actual en el global. Ejemplo de estructura (referencia desde `en.json`):

- `title`, `subtitle`
- `breadcrumbs`: `dashboard`, `maintainers`, `holidays`
- `buttons`: `add`, `import`, `downloadExcel`, `previous`, `next`, `edit`, `delete`, `save`, `update`, `creating`, `updating`, `cancel`, `importButton`, `importing`, `loadHolidays`, `loading`
- `table`: `headers` (name, date, isWaivable, actions), `loading`, `noData`, `noDataDescription`
- `pagination`: `showing`, `page`
- `delete`: `title`, `message`, `success` (title, description), `error` (title, description)
- `excel`: `success`, `error`, `filename`, `sheetName`, `headers` (name, date, isWaivable)
- `ariaLabels`: `editHoliday`, `deleteHoliday`
- `toast`: `createSuccess`, `updateSuccess`, `deleteSuccess`, `importSuccess`, `importWithErrors`, `loadSuccess`, `loadError`, `yearRequired` (y si se usa: `error`)
- `upsert`: `title` (edit, add), `fields`, `placeholders`, `validation`, `branchAssignment`, `isWaivable`
- `massive`: `title`, `message`, `selectYear`, `yearPlaceholder`, `noHolidaysMessage`, `loadingHolidays`, `branchAssignment`, `table` (headers, status)
- `yes`, `no`

---

## 4. Tareas del plan (checklist)

### Paso 1: Crear la carpeta y los 4 JSON del módulo

- [ ] Crear `messages/mantainers/holidays/`.
- [ ] Crear `en.json`: copiar el objeto que está bajo `mantainers.holidays` en `messages/en.json` (sin la clave `"holidays"`).
- [ ] Crear `es.json`: mismo contenido estructural, textos en español (copiar desde `messages/es.json`).
- [ ] Crear `fr.json`: mismo contenido estructural, textos en francés (copiar desde `messages/fr.json`).
- [ ] Crear `pt.json`: mismo contenido estructural, textos en portugués (copiar desde `messages/pt.json`).

### Paso 2: Registrar el módulo en loadMessages

- [ ] Abrir `src/i18n/loadMessages.ts`.
- [ ] Asegurar que exista el objeto `messages.mantainers` (crear si no existe).
- [ ] Añadir bloque que importe `messages/mantainers/holidays/${locale}.json` y asigne el resultado a `messages.mantainers.holidays` (con try/catch para ignorar si falta el archivo).

Ejemplo de código a añadir:

```ts
// Ensure mantainers exists
if (!messages.mantainers) messages.mantainers = {};
const mantainers = messages.mantainers as Record<string, unknown>;

// Merge mantainers.holidays from dedicated folder
try {
  const holidaysMessages = (
    await import(`../../messages/mantainers/holidays/${locale}.json`)
  ).default;
  mantainers.holidays = holidaysMessages;
} catch {
  // If file is missing for this locale, leave messages unchanged
}
```

### Paso 3: Limpiar los JSON globales

- [ ] En `messages/en.json`: eliminar la clave `"holidays"` y todo su objeto dentro de `mantainers` (mantener el resto de `mantainers`: companies, schedules, etc.).
- [ ] En `messages/es.json`: lo mismo.
- [ ] En `messages/fr.json`: lo mismo.
- [ ] En `messages/pt.json`: lo mismo.

### Paso 4: Verificación

- [ ] No modificar componentes: siguen usando `useTranslations("mantainers.holidays")` y `useTranslations("mantainers.holidays.massive")` sin cambios.
- [ ] Probar la ventana Holidays en los 4 idiomas (en, es, fr, pt).
- [ ] Comprobar que el build pasa (`npm run build` o el comando equivalente).

---

## 5. Referencia rápida

| Regla                         | Aplicación                                              |
| ----------------------------- | ------------------------------------------------------- |
| Path → clave                  | `messages/mantainers/holidays/` → `mantainers.holidays` |
| Contenido del JSON del módulo | Solo el objeto (sin clave "holidays" alrededor).        |
| Subnamespace `massive`        | Va dentro del mismo JSON; no hace falta carpeta aparte. |
| Componentes                   | Sin cambios; mismo namespace.                           |

---

## 6. Orden sugerido de ejecución

1. Crear carpeta y los 4 JSON (Paso 1).
2. Actualizar `loadMessages.ts` (Paso 2).
3. Eliminar `mantainers.holidays` de los 4 globales (Paso 3).
4. Verificar en navegador y build (Paso 4).

**Última actualización:** Enero 2025  
**Módulo:** `src/app/[locale]/mantainers/holidays`  
**Reglas base:** [I18N_PER_MODULE_RULES.md](./I18N_PER_MODULE_RULES.md)
