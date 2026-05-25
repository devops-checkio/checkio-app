# Reglas i18n: un archivo por módulo

Este documento define el patrón de traducciones **por módulo/ventana**: cada pantalla o módulo tiene sus propios archivos JSON por idioma en lugar de vivir todo en los JSON globales (`messages/en.json`, etc.).

## Objetivo

- Mantener las traducciones de cada ventana en archivos separados.
- Evitar archivos globales gigantes y facilitar el mantenimiento.
- No cambiar el uso en componentes: `useTranslations("namespace")` sigue igual.
- El contrato con next-intl se mantiene: un único objeto de mensajes por locale; `loadMessages` solo cambia el origen de cada namespace.

## Estructura de carpetas

```
messages/
├── en.json, es.json, fr.json, pt.json   # Mensajes globales (sin los módulos extraídos)
├── warning-types/                        # Namespace: warningTypes
│   ├── en.json
│   ├── es.json
│   ├── fr.json
│   └── pt.json
└── operations/
    └── absences/
        └── batch-assignment/             # Namespace: operations.absences.batchAssignment
            ├── en.json
            ├── es.json
            ├── fr.json
            └── pt.json
```

## Convención de nombres

| Carpeta | Clave en el objeto de mensajes |
|---------|---------------------------------|
| `messages/warning-types/` | `messages.warningTypes` |
| `messages/operations/absences/batch-assignment/` | `messages.operations.absences.batchAssignment` |

Regla: el **path de la carpeta** (relativo a `messages/`) se convierte en la **clave** del objeto final, reemplazando `/` por `.` y usando camelCase si aplica (p. ej. `warning-types` → `warningTypes`).

## Contenido de cada JSON del módulo

- Cada archivo (`en.json`, `es.json`, etc.) contiene **solo el objeto** que en el JSON global estaba bajo esa clave.
- **No** se envuelve de nuevo en la clave del namespace.

**Ejemplo:** si en el global tenías `"warningTypes": { "title": "...", "breadcrumbs": { ... } }`, en `messages/warning-types/en.json` va:

```json
{
  "title": "...",
  "breadcrumbs": { ... },
  "modal": { ... }
}
```

Sin una clave `"warningTypes"` alrededor; esa clave la añade `loadMessages` al hacer el merge.

## Cómo añadir un nuevo módulo

1. **Crear la carpeta** bajo `messages/` con el path que corresponda al namespace (ej. `messages/mi-modulo/` para namespace `miModulo`, o `messages/operations/requests/overtime/` para `operations.requests.overtime`).

2. **Crear los 4 archivos** por idioma: `en.json`, `es.json`, `fr.json`, `pt.json`, con la misma estructura de claves y los textos traducidos.

3. **Actualizar** [src/i18n/loadMessages.ts](src/i18n/loadMessages.ts):
   - Después de cargar el JSON principal, añadir un bloque que cargue el módulo y lo asigne a la clave correcta:

   ```ts
   // Merge mi-modulo messages from dedicated folder
   try {
     const miModuloMessages = (
       await import(`../../messages/mi-modulo/${locale}.json`)
     ).default;
     messages.miModulo = miModuloMessages;
   } catch {
     // If file is missing for this locale, leave messages unchanged
   }
   ```

   Para subnamespaces (ej. `operations.absences.batchAssignment`), asegurar primero que exista el padre (`operations`, `operations.absences`) y luego asignar la propiedad correspondiente (como en el bloque de `batch-assignment`).

4. **Eliminar** del JSON global la clave y todo su objeto en los 4 archivos (`messages/en.json`, `es.json`, `fr.json`, `pt.json`), para que la única fuente de verdad sea la carpeta del módulo.

5. **No modificar componentes**: siguen usando `useTranslations("miModulo")` (o el namespace que corresponda) sin cambios.

## Contrato de loadMessages

- **Entrada:** `locale` (ej. `"en"`, `"es"`, `"fr"`, `"pt"`).
- **Salida:** un único objeto con todos los namespaces que la app usa.
- **Comportamiento:** carga el JSON global y, para cada módulo con carpeta propia, importa su `{locale}.json` y lo asigna en la clave del namespace. Si un archivo de módulo no existe, se ignora (try/catch) y no se rompe la carga.

## Ejemplos de referencia

- **Namespace top-level:** [messages/warning-types/](messages/warning-types/) → `warningTypes`. Uso en código: `useTranslations("warningTypes")`.
- **Subnamespace:** [messages/operations/absences/batch-assignment/](messages/operations/absences/batch-assignment/) → `operations.absences.batchAssignment`. Uso: `useTranslations("operations.absences.batchAssignment")`.

## Checklist al migrar una ventana

- [ ] Crear `messages/<ruta-namespace>/` con `en.json`, `es.json`, `fr.json`, `pt.json`.
- [ ] Copiar en cada archivo el objeto que está bajo esa clave en el JSON global (sin envolver en la clave).
- [ ] Añadir en `loadMessages.ts` el bloque de import y asignación (try/catch).
- [ ] Eliminar la clave del módulo de los cuatro JSON globales.
- [ ] Verificar que la ventana muestra bien los textos en todos los idiomas (y que el build pasa).

---

**Última actualización:** Enero 2025  
**Mantenido por:** Equipo de Desarrollo CheckIO
