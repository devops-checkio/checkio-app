import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";

/** Rutas `/integrations` (ETL): solo permiso de integración externa; tokens API van a mantenedores. */
export const INTEGRATION_MODULE_ACCESS_PERMISSIONS: OrganizationPermissionCode[] = [
  OrganizationPermissionCode.EXTERNAL_INTEGRATION_MAINTENANCE,
];

export function hasAnyIntegrationModulePermission(
  check: (code: OrganizationPermissionCode) => boolean,
): boolean {
  return INTEGRATION_MODULE_ACCESS_PERMISSIONS.some((code) => check(code));
}
