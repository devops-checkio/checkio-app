# Employee DTOs - checkio-app (Frontend)

DTOs centralizados para el módulo de empleados. Importar desde `@/dto/employees`.

## Estructura de archivos

| Archivo | Contenido |
|---------|-----------|
| `employee.enums.ts` | DocumentType, Gender, ManagerType, opciones para selects |
| `employee-filter.dto.ts` | EmployeeFindFilterDto |
| `employee-create-update.dto.ts` | EmployeeCreateDto, EmployeeUpdateDto |
| `employee-geolocation.dto.ts` | EmployeeGeolocationCreateDto, EmployeeLegalMetadataDto |
| `employee-response.dto.ts` | EmployeeDto, EmployeeResponseDto, PaginationEmployeeDto |
| `employee-manager.dto.ts` | DTOs de managers y subordinados |
| `employee-device.dto.ts` | GeolocationZoneDto, PossibleMarkToDoDto, AttemptMarkSearchDto, EmployeeDeviceResponseDto |
| `employee-company-history.dto.ts` | EmployeeChangeCompanyDto, EmployeeCompanyHistoryDto |
| `employee-shift.dto.ts` | ShiftDto, EmployeeShiftDto, EmployeeWithoutShiftDto |
| `employee-summary-shift.dto.ts` | EmployeeSummaryShiftResponseDto |
| `employee-tree.dto.ts` | TreeItem (unidades jerárquicas) |
| `index.ts` | Barrel export |

## Uso

```ts
import {
  EmployeeResponseDto,
  EmployeeCreateDto,
  DocumentType,
  GenderOptions,
} from "@/dto/employees";
```

## Compatibilidad

El archivo `mantainers/employees/_components/employee.dto.ts` reexporta desde aquí para compatibilidad. Nuevo código debe importar desde `@/dto/employees`.

## Alineación con Backend

Alineado con `checkio-suite/libs/core/src/client/employee/`. Ver README-DTO.md en el backend para la estructura equivalente.
