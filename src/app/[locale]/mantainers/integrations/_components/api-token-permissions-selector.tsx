"use client";

import { CHEKIOButton } from "@/components";
import { CheckIOCheckbox } from "@/components/ui/checkio-checkbox";
import { useTranslations } from "next-intl";
import {
  ApiTokenAction,
  ApiTokenModule,
  ApiTokenPermissionDto,
} from "./api-token.dto";

interface ApiTokenPermissionsSelectorProps {
  permissions: ApiTokenPermissionDto[];
  onChange: (permissions: ApiTokenPermissionDto[]) => void;
  errors?: any;
}

export default function ApiTokenPermissionsSelector({
  permissions,
  onChange,
  errors,
}: ApiTokenPermissionsSelectorProps) {
  const t = useTranslations("mantainers.integrations.modal.permissions");

  // Module labels
  const moduleLabels: Record<ApiTokenModule, string> = {
    [ApiTokenModule.EMPRESAS]: "Empresas",
    [ApiTokenModule.SUCURSALES]: "Sucursales",
    [ApiTokenModule.EMPLEADOS]: "Empleados",
    [ApiTokenModule.CARGOS]: "Cargos",
    [ApiTokenModule.ESTRUCTURAS]: "Estructuras",
    [ApiTokenModule.AUSENCIAS]: "Ausencias",
    [ApiTokenModule.BANCO]: "Banco de horas",
    [ApiTokenModule.ASISTENCIAS]: "",
    [ApiTokenModule.DISPOSITIVOS]: "",
  };

  // Action labels
  const actionLabels: Record<ApiTokenAction, string> = {
    [ApiTokenAction.VER]: "Ver",
    [ApiTokenAction.CREAR]: "Crear",
    [ApiTokenAction.EDITAR]: "Editar",
    [ApiTokenAction.ELIMINAR]: "Eliminar",
  };

  // Get all modules and actions
  const modules = Object.values(ApiTokenModule).filter(
    (module) =>
      module !== ApiTokenModule.ASISTENCIAS &&
      module !== ApiTokenModule.DISPOSITIVOS,
  );
  const actions = Object.values(ApiTokenAction);

  // Check if a permission exists
  const hasPermission = (module: ApiTokenModule, action: ApiTokenAction) => {
    return permissions.some((p) => p.module === module && p.action === action);
  };

  // Toggle permission
  const togglePermission = (module: ApiTokenModule, action: ApiTokenAction) => {
    const newPermissions = [...permissions];
    const index = newPermissions.findIndex(
      (p) => p.module === module && p.action === action,
    );

    if (index >= 0) {
      newPermissions.splice(index, 1);
    } else {
      newPermissions.push({ module, action });
    }

    onChange(newPermissions);
  };

  // Select all actions for a module
  const selectAllForModule = (module: ApiTokenModule) => {
    const modulePermissions = permissions.filter((p) => p.module === module);
    const allSelected = actions.every((action) =>
      modulePermissions.some((p) => p.action === action),
    );

    const newPermissions = permissions.filter((p) => p.module !== module);

    if (!allSelected) {
      // Add all actions for this module
      actions.forEach((action) => {
        newPermissions.push({ module, action });
      });
    }

    onChange(newPermissions);
  };

  // Check if all actions are selected for a module
  const areAllActionsSelected = (module: ApiTokenModule) => {
    return actions.every((action) => hasPermission(module, action));
  };

  // Count selected permissions
  const selectedCount = permissions.length;

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
        <label className="text-sm font-semibold text-gray-900">
          {t("title")}
        </label>
        <span className="text-sm text-gray-500">
          {selectedCount}{" "}
          {selectedCount === 1
            ? t("permissionSelected")
            : t("permissionsSelected")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        {modules.map((module) => {
          const allSelected = areAllActionsSelected(module);
          return (
            <div
              key={module}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 px-4 py-3">
                <h4 className="font-semibold text-gray-900">
                  {moduleLabels[module]}
                </h4>
                <CHEKIOButton
                  type="button"
                  variant="secondaryBlue"
                  onClick={() => selectAllForModule(module)}
                  className="h-8 text-xs"
                >
                  {allSelected ? t("deselectAll") : t("selectAll")}
                </CHEKIOButton>
              </div>

              <div className="space-y-1 p-4">
                {actions.map((action) => {
                  const isSelected = hasPermission(module, action);
                  return (
                    <div
                      key={`${module}-${action}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => togglePermission(module, action)}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          togglePermission(module, action);
                        }
                      }}
                      className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <CheckIOCheckbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            togglePermission(module, action)
                          }
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {actionLabels[action]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {errors?.permissions && (
        <p className="px-5 pb-4 text-xs text-red-500">
          {errors.permissions.message || "Al menos un permiso es requerido"}
        </p>
      )}
    </div>
  );
}
