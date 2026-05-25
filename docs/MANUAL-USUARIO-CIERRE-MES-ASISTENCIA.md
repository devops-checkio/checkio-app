# Manual de uso: Cierre de mes de asistencia

**Versión para el cliente**  
Documento exclusivo de uso del módulo *Cierre de mes (Asistencia)*.

---

## 1. ¿Qué es el Cierre de mes de asistencia?

El **Cierre de mes de asistencia** permite bloquear un período (año y mes) de registros de asistencia por empresa, de forma que no se puedan modificar marcas ni asistencias una vez cerrado. Incluye:

- **Cierre directo**: un usuario con permiso cierra el mes y queda bloqueado.
- **Precierre con aprobadores**: se precerra el mes, se asignan aprobadores y el cierre definitivo requiere que cada uno confirme con su **PIN de cierre**.

Además puede **reabrirse** un mes ya cerrado (con motivo obligatorio) y consultar **consolidados** y **detalle por unidades**.

---

## 2. Acceso a la pantalla

1. En el menú principal, vaya a **Mantenedores**.
2. Seleccione **Cierre de mes** (o “Cierre de mes (Asistencia)” según la configuración).
3. Se mostrará la pantalla de **Cierre de mes de asistencia** con filtros y el estado del período seleccionado.

---

## 3. Filtros

Antes de realizar cualquier acción debe elegir el período y la empresa:

| Filtro   | Descripción |
|----------|-------------|
| **Empresa** | Lista de empresas. Debe seleccionar una para ver estado y acciones. |
| **Año**     | Año del período (por ejemplo 2025). |
| **Mes**     | Mes del período (Enero a Diciembre). |

- Use **Actualizar** (icono de actualizar) para recargar el estado después de un cierre, precierre o reapertura.

---

## 4. Estados del mes

El mes puede estar en uno de estos estados:

| Estado       | Significado |
|-------------|-------------|
| **Abierto** | El período permite editar asistencias. Puede cerrar o precerrar. |
| **Precerrado** | El mes está en proceso de cierre: ya no se pueden editar asistencias y los aprobadores deben confirmar con su PIN. |
| **Cerrado** | El mes está cerrado de forma definitiva. Solo se puede reabrir (si tiene permiso). |

Los estados se muestran con un indicador de color (verde / ámbar / rojo) y el nombre del mes y año.

---

## 5. Cerrar el mes (cierre directo)

Cuando el mes está **Abierto** y su empresa usa **cierre directo** (sin aprobadores):

1. Seleccione **Empresa**, **Año** y **Mes**.
2. Pulse **Cerrar mes**.
3. En el mensaje de confirmación lea la advertencia: *"Al cerrar el mes no se permitirán más modificaciones de asistencia para este período."*
4. Pulse **Confirmar**.

**Importante:**

- Si hay registros de asistencia **incompletos** en ese período, el sistema no permitirá cerrar y mostrará cuántos hay. Debe completar o regularizar esas asistencias antes de cerrar.

---

## 6. Precerrar el mes (con aprobadores)

Cuando el mes está **Abierto** y su empresa usa **precierre con aprobadores**:

1. Seleccione **Empresa**, **Año** y **Mes**.
2. Pulse **Precerrar mes**.
3. Lea el mensaje: *"Al precerrar se calcularán los consolidados y no se permitirán ediciones de asistencia hasta que todos los aprobadores confirmen con su PIN."*
4. Pulse **Precerrar** (o el botón equivalente en el cuadro de diálogo).

Tras precerrar:

- El estado pasa a **Precerrado**.
- Se muestran los **aprobadores** y quién ha confirmado (Aprobado / Pendiente).
- Cada aprobador debe **Confirmar con mi PIN** (véase sección 8).
- Cuando **todos** los aprobadores hayan confirmado, el mes pasará automáticamente a **Cerrado**.

De nuevo, si hay asistencias incompletas en el período, el precierre no se permitirá.

---

## 7. Configurar o cambiar su PIN de cierre

El **PIN de cierre** es un código numérico de **4 a 8 dígitos** que usan los aprobadores para confirmar el cierre. Debe configurarlo antes de poder confirmar como aprobador.

1. En la pantalla de Cierre de mes, pulse **Configurar PIN** (en la parte superior).
2. Se abrirá un cuadro de diálogo:
   - **Si aún no tiene PIN**: indique **PIN nuevo** y **Repetir PIN nuevo** (ambos deben coincidir).
   - **Si ya tiene PIN**: indique **PIN actual**, **PIN nuevo** y **Repetir PIN nuevo**.
3. Pulse **Guardar**.

Requisitos del PIN:

- Solo números.
- Entre 4 y 8 dígitos.
- No comparta su PIN; es de uso personal para autorizar el cierre.

---

## 8. Confirmar el cierre con mi PIN (aprobadores)

Si usted es **aprobador** de un mes **Precerrado** y aún no ha confirmado:

1. En la sección **Aprobadores** verá el botón **Confirmar con mi PIN**.
2. Pulse **Confirmar con mi PIN**.
3. En el cuadro de diálogo ingrese su **PIN de cierre** (4 a 8 dígitos).
4. Pulse **Confirmar**.

Si el PIN es correcto, su aprobación quedará registrada y verá el estado actualizado. Cuando todos los aprobadores hayan confirmado, el mes pasará a **Cerrado**.

Si aparece un mensaje de error (PIN incorrecto o no configurado), compruebe que ha configurado su PIN (sección 7) y que lo está ingresando correctamente.

---

## 9. Reabrir el mes

Solo puede **reabrir** un mes que esté **Precerrado** o **Cerrado**:

- Si el cierre se hizo **con aprobadores**, solo esos mismos aprobadores pueden reabrir.
- Si el cierre fue **directo** (sin aprobadores), podrá reabrir quien tenga permiso en la pantalla.

Pasos:

1. Seleccione **Empresa**, **Año** y **Mes** con estado Precerrado o Cerrado.
2. Pulse **Reabrir mes**.
3. En el cuadro de diálogo escriba el **Motivo** de la reapertura (es obligatorio).
4. Pulse el botón de confirmar reapertura.

El sistema registrará la reapertura y el mes volverá a estado **Abierto**, permitiendo de nuevo editar asistencias de ese período.

---

## 10. Ver historial de reaperturas

Para revisar quién y cuándo reabrió un mes:

1. Con el período y empresa seleccionados, pulse **Ver historial de reaperturas**.
2. Se abrirá un cuadro con una tabla que muestra **Fecha** y **Motivo** de cada reapertura.

Útil para auditoría y seguimiento.

---

## 11. Consolidados del cierre

Cuando el mes está **Precerrado** o **Cerrado**, en la misma pantalla se muestra la sección **Consolidados del cierre** con:

| Dato | Descripción |
|------|-------------|
| **Incompletas** | Cantidad de asistencias incompletas al momento del cierre. |
| **Completadas** | Cantidad de asistencias completadas. |
| **Ausentes** | Cantidad de ausentes. |
| **Sin horario** | Cantidad sin horario. |
| **Horas extras aprobadas (min)** | Total de minutos de horas extras aprobadas. |
| **Atrasos aprobados (min)** | Total de minutos de atrasos aprobados. |
| **Calculado el** | Fecha y hora en que se calcularon estos valores. |

Estos valores son los que se guardaron al precerrar o cerrar y no se recalculan al consultar.

---

## 12. Ver detalle por unidades

Para ver el estado de cierre por **empresa** y por **unidad organizativa** (si aplica):

1. Pulse **Ver detalle por unidades**.
2. Se abrirá un cuadro con una tabla que muestra, para cada alcance (Empresa o nombre de unidad):
   - **Alcance** (Empresa o nombre de la unidad).
   - **Estado** (Abierto / Precerrado / Cerrado).
   - Los mismos consolidados (incompletas, completadas, ausentes, sin horario, horas extras y atrasos aprobados).

Sirve para tener una vista unificada de empresa y unidades en ese año y mes.

---

## 13. Resumen de botones y acciones

| Botón o acción | Cuándo se muestra | Qué hace |
|----------------|------------------|----------|
| **Cerrar mes** | Mes Abierto | Cierra el mes de forma directa (sin aprobadores). |
| **Precerrar mes** | Mes Abierto | Inicia el precierre con aprobadores. |
| **Confirmar con mi PIN** | Mes Precerrado y usted es aprobador pendiente | Registra su aprobación con su PIN. |
| **Reabrir mes** | Mes Precerrado o Cerrado (y usted puede reabrir) | Vuelve el mes a Abierto; debe indicar motivo. |
| **Ver historial de reaperturas** | Mes Precerrado o Cerrado | Muestra fechas y motivos de reaperturas. |
| **Ver detalle por unidades** | Siempre (con empresa seleccionada) | Muestra tabla de cierres por empresa y unidades. |
| **Configurar PIN** | Siempre (en la cabecera) | Abre el cuadro para configurar o cambiar su PIN de cierre. |
| **Actualizar** | Siempre | Recarga el estado del período en pantalla. |

---

## 14. Mensajes de error frecuentes

| Mensaje o situación | Qué hacer |
|---------------------|-----------|
| No se puede cerrar / precerrar: hay X registro(s) incompleto(s) | Revise y complete o regularice las asistencias incompletas del período antes de cerrar o precerrar. |
| El mes ya está cerrado | El período ya está cerrado; si debe modificarlo, use *Reabrir mes* (si tiene permiso). |
| El mes ya está abierto | No hay nada que reabrir en ese período. |
| Solo los aprobadores del cierre pueden reabrir el mes | Su usuario no está en la lista de aprobadores de ese cierre; pida a un aprobador que realice la reapertura. |
| PIN incorrecto o no configurado | Configure su PIN en *Configurar PIN* o verifique que está ingresando el PIN correcto. |
| El motivo es obligatorio para reabrir | Debe escribir un motivo en el cuadro de reapertura antes de confirmar. |

---

## 15. Buenas prácticas

1. **Antes de cerrar o precerrar**: revise que no queden asistencias incompletas en el período.
2. **PIN**: configure su PIN con antelación si va a actuar como aprobador; no lo comparta.
3. **Reapertura**: use reapertura solo cuando sea necesario y siempre indique un motivo claro.
4. **Consolidados**: consulte los consolidados después del cierre para verificar que los totales coinciden con lo esperado.
5. **Detalle por unidades**: use *Ver detalle por unidades* para supervisar empresa y unidades en un mismo período.

---

## 16. Soporte

Para dudas sobre permisos, configuración de aprobadores por empresa o incidencias en el uso del módulo, contacte al administrador del sistema o al soporte técnico indicado por su organización.

---

*Documento de uso del módulo Cierre de mes de asistencia. Reservado para el cliente.*
