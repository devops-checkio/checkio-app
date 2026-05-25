"use client";
import SystemInput from "@/components/ui/system-input";
import {
  Permission,
  PermissionTemplateDto,
  UpdateRolePermission,
  UpdateRolePermissions,
} from "@/dto/security";
import {
  useGetRoleById,
  useGetServices,
  useUpdateRolePermissions,
} from "@/service/security.service";

import LoadingCheckIO from "@/app/[locale]/_components/loading";
import { VerticalTabs } from "@/app/[locale]/_components/vertical-tabs";
import { CHEKIOButton } from "@/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import { ChevronLeft, Filter, Settings, Shield, ShieldCheck, ShieldX } from "lucide-react";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import AdvancedAccessControl from "./_components/advanced-access-control";
import { AccessControlConfig, AccessMode } from "./_components/types";

interface RolePermissionsForm {
  name: string;
  filterByBoss: boolean;
  RolePermissions: UpdateRolePermission[];
  accessControlConfig?: AccessControlConfig;
}

type Params = { roleId: string };

export default function RoleEditPage({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  const routeParams = useParams<{ roleId?: string }>();
  const roleId =
    routeParams?.roleId ??
    (params as Params | undefined)?.roleId ??
    "";
  const { data: role, isLoading: isLoadingRole } = useGetRoleById(roleId);
  const { data: services, isLoading: isLoadingServices } = useGetServices();

  const [accessControlConfig, setAccessControlConfig] =
    useState<AccessControlConfig>({
      companies: {
        mode: AccessMode.NONE,
        rules: [],
      },
      structure: {
        enabled: false,
        rules: [],
        levels: [],
        levelNames: [],
      },
      branches: {
        mode: AccessMode.NONE,
        rules: [],
      },
    });

  const [activeTab, setActiveTab] = useState("permissions");

  const { mutateAsync: updatePermissions } = useUpdateRolePermissions();

  const router = useRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<RolePermissionsForm>({
    defaultValues: {
      name: "",
      filterByBoss: false,
      RolePermissions: [],
      accessControlConfig: accessControlConfig,
    },
  });

  // Compute effective services with injected permissions for backward-compatible role editor.
  const effectiveServices = useMemo(() => {
    if (!services) return [];
    const hasAttendanceReports = services
      .flatMap((s) => s.permissions)
      .some((p: any) => p.code === OrganizationPermissionCode.ATTENDANCE_REPORTS);

    let result = hasAttendanceReports
      ? services
      : [
          ...services,
          {
            code: "reports",
            name: "Reportes",
            permissions: [
              {
                code: OrganizationPermissionCode.ATTENDANCE_REPORTS,
                name: "Acceso a Reportes",
                description: "Permite ver y generar reportes de asistencia",
                create: false,
                read: true,
                update: false,
                delete: false,
              },
            ],
          },
        ];

    // Inject missing OP permissions into OPERATIONS if backend doesn't provide them yet.
    const operationsService = result.find((s: any) => s.code === "OPERATIONS");
    const hasConsentHistoryOps = operationsService?.permissions?.some(
      (p: any) =>
        p.code === OrganizationPermissionCode.CONSENT_HISTORY_OPERATIONS
    );
    const hasStudentScheduleOps = operationsService?.permissions?.some(
      (p: any) =>
        p.code ===
        OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS
    );

    if (operationsService && (!hasConsentHistoryOps || !hasStudentScheduleOps)) {
      result = result.map((s: any) =>
        s.code === "OPERATIONS"
          ? {
              ...s,
              permissions: [
                ...(s.permissions || []),
                ...(!hasConsentHistoryOps
                  ? [
                      {
                        code: OrganizationPermissionCode.CONSENT_HISTORY_OPERATIONS,
                        name: "Operaciones Historial de Consentimiento",
                        description:
                          "Permite ver consentimientos por empleado y exportar evidencia",
                        create: false,
                        read: true,
                        update: false,
                        delete: false,
                      },
                    ]
                  : []),
                ...(!hasStudentScheduleOps
                  ? [
                      {
                        code:
                          OrganizationPermissionCode.STUDENT_SCHEDULE_ASSIGNMENT_OPERATIONS,
                        name: "Asignación de horario estudiantes",
                        description:
                          "Permite ver y gestionar la asignación de horario para estudiantes",
                        create: true,
                        read: true,
                        update: true,
                        delete: true,
                      },
                    ]
                  : []),
              ],
            }
          : s
      );
    }
    return result;
  }, [services]);

  const backendSupportedPermissions = useMemo(() => {
    if (!services) return new Map<string, string>();
    const permissionMap = new Map<string, string>();

    services.forEach((service: any) => {
      (service.permissions || []).forEach((permission: any) => {
        permissionMap.set(permission.code, service.code);
      });
    });

    return permissionMap;
  }, [services]);

  const currentRolePermissions = useMemo(() => {
    if (!role) return [];

    // Compatibilidad entre respuestas antiguas/nuevas del backend.
    const roleWithVariants = role as {
      RolePermission?: Permission[];
      RolePermissions?: Permission[];
    };

    return (
      roleWithVariants.RolePermission ??
      roleWithVariants.RolePermissions ??
      []
    );
  }, [role]);

  const currentRolePermissionIdByCode = useMemo(() => {
    const permissionIdMap = new Map<string, string>();
    currentRolePermissions.forEach((permission) => {
      if (permission?.code && permission?.id) {
        permissionIdMap.set(permission.code, permission.id);
      }
    });
    return permissionIdMap;
  }, [currentRolePermissions]);

  useEffect(() => {
    if (role && effectiveServices.length > 0) {
      // Initialize all permissions from all services
      const allPermissions = effectiveServices.flatMap((service: any) =>
        service.permissions.map((permission: any) => {
          // Find existing permission from role
          const existingPermission = currentRolePermissions.find(
            (p: Permission) => p.code === permission.code
          );

          return {
            code: permission.code,
            service: service.code,
            create: existingPermission?.create ?? false,
            read: existingPermission?.read ?? false,
            update: existingPermission?.update ?? false,
            delete: existingPermission?.delete ?? false,
            id: existingPermission?.id,
          } as UpdateRolePermission;
        })
      );

      reset({
        name: role.name,
        filterByBoss: role.filterByBoss || false,
        RolePermissions: allPermissions,
        accessControlConfig: accessControlConfig,
      });

      console.log(
        "Initialized permissions:",
        allPermissions.length,
        "total permissions"
      );
    }
  }, [role, effectiveServices, reset, accessControlConfig, currentRolePermissions]);

  if (isLoadingRole || isLoadingServices) {
    return <LoadingCheckIO />;
  }

  const rolePermissions = watch("RolePermissions") ?? [];

  // Function to ensure all permissions are loaded
  const ensureAllPermissions = () => {
    if (effectiveServices.length > 0) {
      const allPermissions = effectiveServices.flatMap((service: any) =>
        service.permissions.map((permission: any) => {
          // Find existing permission data
          const existingPermission = rolePermissions.find(
            (p: UpdateRolePermission) => p?.code === permission.code
          );

          return {
            code: permission.code,
            service: service.code,
            create: existingPermission?.create ?? false,
            read: existingPermission?.read ?? false,
            update: existingPermission?.update ?? false,
            delete: existingPermission?.delete ?? false,
            id: existingPermission?.id,
          } as UpdateRolePermission;
        })
      );

      setValue("RolePermissions", allPermissions);
      console.log(
        "Refreshed permissions:",
        allPermissions.length,
        "total permissions"
      );
    }
  };

  

  const onSubmit = async (data: RolePermissionsForm) => {
    try {
      const formPermissionsByCode = new Map(
        (data.RolePermissions || [])
          .filter((permission) => !!permission?.code)
          .map((permission) => [permission.code, permission] as const)
      );

      const allPermissions = Array.from(backendSupportedPermissions.entries()).map(
        ([permissionCode, serviceCode]) => {
          const formPermission = formPermissionsByCode.get(permissionCode);
          return {
            code: permissionCode,
            service: serviceCode,
            create: formPermission?.create ?? false,
            read: formPermission?.read ?? false,
            update: formPermission?.update ?? false,
            delete: formPermission?.delete ?? false,
            id:
              formPermission?.id ||
              currentRolePermissionIdByCode.get(permissionCode),
          };
        }
      );

      const updateData: UpdateRolePermissions = {
        publicId: roleId,
        name: data.name,
        filterByBoss: data.filterByBoss,
        RolePermission: allPermissions,
      };

      console.log(
        "Sending permissions:",
        allPermissions.length,
        "total permissions"
      );

      // TODO: Add access control config to the update data
      console.log("Access control config:", accessControlConfig);

      await updatePermissions(updateData);
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.invalidateQueries({ queryKey: ["role", roleId] });

      router.push(`/${locale}/mantainers/roles`);
      // You might want to use a toast notification here instead of message
    } catch (error) {
      console.error("Error updating permissions:", error);
      // Handle error with toast notification
    }
  };

  const PermissionCheckbox = ({
    permissionCode,
    permissionType,
    isDisabled = false,
  }: {
    permissionCode: string;
    permissionType: "create" | "read" | "update" | "delete";
    isDisabled?: boolean;
  }) => {
    if (isDisabled) {
      return (
        <div className="flex items-center justify-center w-4 h-4 text-gray-400">
          <ShieldX className="w-4 h-4" />
        </div>
      );
    }

    return (
      <Controller
        name="RolePermissions"
        control={control}
        render={({ field }) => {
          // Find the permission by code
          const permissionIndex = rolePermissions.findIndex(
            (p: UpdateRolePermission) => p?.code === permissionCode
          );

          // If permission doesn't exist, create it
          if (permissionIndex === -1) {
            const newPermission: UpdateRolePermission = {
              code: permissionCode,
              service: "",
              create: false,
              read: false,
              update: false,
              delete: false,
            };
            newPermission[permissionType] = false;

            return (
              <Checkbox
                checked={false}
                onCheckedChange={(checked) => {
                  const currentPermissions = getValues("RolePermissions") || [];
                  const updatedPermissions = [
                    ...currentPermissions,
                    newPermission,
                  ];
                  setValue("RolePermissions", updatedPermissions);
                }}
                className={`w-5 h-5 shadow-sm border-2 transition-all duration-200 hover:scale-110 ${
                  permissionType === "create"
                    ? "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    : permissionType === "read"
                    ? "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    : permissionType === "update"
                    ? "data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    : "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                }`}
              />
            );
          }

          return (
            <Checkbox
              checked={
                getValues(
                  `RolePermissions.${permissionIndex}.${permissionType}`
                ) || false
              }
              onCheckedChange={(checked) => {
                setValue(
                  `RolePermissions.${permissionIndex}.${permissionType}`,
                  checked as boolean
                );
              }}
              className={`w-5 h-5 shadow-sm border-2 transition-all duration-200 hover:scale-110 ${
                permissionType === "create"
                  ? "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  : permissionType === "read"
                  ? "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  : permissionType === "update"
                  ? "data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  : "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
              }`}
            />
          );
        }}
      />
    );
  };

  const PermissionTable = ({ service }: { service: any }) => {
    // Helper functions for bulk operations
    const selectAllForPermission = (permissionCode: string) => {
      const currentPermissions = getValues("RolePermissions") || [];
      const permissionIndex = currentPermissions.findIndex(
        (p: UpdateRolePermission) => p?.code === permissionCode
      );

      if (permissionIndex === -1) {
        // Create new permission with all permissions enabled
        const newPermission: UpdateRolePermission = {
          code: permissionCode,
          service: service?.code || "",
          create: true,
          read: true,
          update: true,
          delete: true,
        };
        setValue("RolePermissions", [...currentPermissions, newPermission]);
      } else {
        // Update existing permission
        setValue(`RolePermissions.${permissionIndex}.create`, true);
        setValue(`RolePermissions.${permissionIndex}.read`, true);
        setValue(`RolePermissions.${permissionIndex}.update`, true);
        setValue(`RolePermissions.${permissionIndex}.delete`, true);
      }
    };

    const selectAllForColumn = (
      permissionType: "create" | "read" | "update" | "delete"
    ) => {
      const currentPermissions = getValues("RolePermissions") || [];

      service?.permissions.forEach((permission: PermissionTemplateDto) => {
        const permissionIndex = currentPermissions.findIndex(
          (p: UpdateRolePermission) => p?.code === permission.code
        );

        if (permissionIndex === -1) {
          // Create new permission with only the specified type enabled
          const newPermission: UpdateRolePermission = {
            code: permission.code,
            service: service.code,
            create: false,
            read: false,
            update: false,
            delete: false,
          };
          newPermission[permissionType] = true;

          currentPermissions.push(newPermission);
        } else {
          // Update existing permission
          setValue(
            `RolePermissions.${permissionIndex}.${permissionType}`,
            true
          );
        }
      });

      setValue("RolePermissions", currentPermissions);
    };

    return (
      <div className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b-2 border-gray-200">
              <TableHead className="font-bold text-gray-800 text-left p-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Información</span>
                </div>
              </TableHead>
              <TableHead className="text-center font-bold text-gray-800 w-24 p-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Crear</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => selectAllForColumn("create")}
                    className="h-7 px-3 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 transition-all duration-200 shadow-sm"
                  >
                    Todo
                  </Button>
                </div>
              </TableHead>
              <TableHead className="text-center font-bold text-gray-800 w-24 p-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Ver</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => selectAllForColumn("read")}
                    className="h-7 px-3 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-all duration-200 shadow-sm"
                  >
                    Todo
                  </Button>
                </div>
              </TableHead>
              <TableHead className="text-center font-bold text-gray-800 w-24 p-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Editar</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => selectAllForColumn("update")}
                    className="h-7 px-3 text-xs bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 transition-all duration-200 shadow-sm"
                  >
                    Todo
                  </Button>
                </div>
              </TableHead>
              <TableHead className="text-center font-bold text-gray-800 w-24 p-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Eliminar</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => selectAllForColumn("delete")}
                    className="h-7 px-3 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100 transition-all duration-200 shadow-sm"
                  >
                    Todo
                  </Button>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {service.permissions.map(
              (permission: PermissionTemplateDto, index: number) => {
                return (
                  <TableRow
                    key={`${service.code}-${permission.code}-${index}`}
                    className={`hover:bg-blue-50 transition-all duration-200 border-b border-gray-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <TableCell className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-base mb-1">
                              {permission.name}
                            </div>
                            <div className="text-sm text-gray-600 leading-relaxed">
                              {permission.description}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            selectAllForPermission(permission.code)
                          }
                          className="h-8 px-4 text-xs font-medium bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span>Seleccionar Todo</span>
                          </div>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-4">
                      <div className="flex justify-center">
                        <PermissionCheckbox
                          permissionCode={permission.code}
                          permissionType="create"
                          isDisabled={
                            !effectiveServices
                              .flatMap((x: any) => x.permissions)
                              .find(
                                (x) =>
                                  x.code === permission.code &&
                                  x.create === true
                              )
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-4">
                      <div className="flex justify-center">
                        <PermissionCheckbox
                          permissionCode={permission.code}
                          permissionType="read"
                          isDisabled={
                            !effectiveServices
                              .flatMap((x: any) => x.permissions)
                              .find(
                                (x) => x.code === permission.code && x.read === true
                              )
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-4">
                      <div className="flex justify-center">
                        <PermissionCheckbox
                          permissionCode={permission.code}
                          permissionType="update"
                          isDisabled={
                            !effectiveServices
                              .flatMap((x: any) => x.permissions)
                              .find(
                                (x) =>
                                  x.code === permission.code &&
                                  x.update === true
                              )
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-4">
                      <div className="flex justify-center">
                        <PermissionCheckbox
                          permissionCode={permission.code}
                          permissionType="delete"
                          isDisabled={
                            !effectiveServices
                              .flatMap((x: any) => x.permissions)
                              .find(
                                (x) =>
                                  x.code === permission.code &&
                                  x.delete === true
                              )
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Vertical tabs configuration
  const verticalTabs = [
    {
      id: "permissions",
      label: "Permisos",
      count: 0,
      color: "#1890ff",
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: "access-control",
      label: "Control Avanzado",
      count: 0,
      color: "#52c41a",
      icon: <Filter className="w-4 h-4" />,
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="relative bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center space-x-4">
              <CHEKIOButton
                type="button"
                variant="secondaryBlue"
                className="h-9 w-9 p-0 rounded-lg flex items-center justify-center"
                onClick={() => router.push(`/${locale}/mantainers/roles`)}
                aria-label="Volver al listado de roles"
              >
                <ChevronLeft className="h-4 w-4" />
              </CHEKIOButton>
              <div className="p-4 bg-blue-500 rounded-2xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Editar Rol
                  </h1>
                  <div className="px-3 py-1 bg-blue-100 rounded-full">
                    <span className="text-sm font-semibold text-blue-700">
                      {role?.name || "Sin nombre"}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-lg">
                  Configura los permisos y restricciones del rol de manera
                  granular
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Vertical Tabs Sidebar */}
          <VerticalTabs
            tabs={verticalTabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === "permissions" && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* General Information Card */}
                <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden">
                  <CardHeader className="bg-blue-50 border-b border-blue-100">
                    <CardTitle className="flex items-center space-x-3 text-xl text-gray-800 gap-3">
                      <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-bold">Información General</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <SystemInput
                          label="Nombre del Rol"
                          className="w-full"
                          control={control}
                          attribute="name"
                          placeholder="Ingresa el nombre del rol"
                          errors={errors}
                          rules={{ required: "El nombre es requerido" }}
                        />
                      </div>
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                          <Controller
                            name="filterByBoss"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                id="filterByBoss"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 w-5 h-5"
                              />
                            )}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor="filterByBoss"
                              className="text-sm font-semibold text-gray-800 cursor-pointer block"
                            >
                              Filtrar por Jefe
                            </label>
                            <p className="text-xs text-gray-600 mt-1">
                              Permite ver información de subordinados además de
                              la propia
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Permissions Card */}
                <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden">
                  <CardHeader className="bg-green-50 border-b border-green-100">
                    <CardTitle className="flex items-center space-x-3 text-xl text-gray-800 gap-3">
                      <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                        <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-bold">Permisos del Sistema</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative p-8">
                    <Tabs defaultValue={effectiveServices[0]?.code} className="w-full">
                      <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 bg-gray-100 rounded-xl mb-8 border border-gray-200 shadow-inner">
                        {effectiveServices.map((service: any) => (
                          <TabsTrigger
                            key={service.code}
                            value={service.code}
                            className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-gray-200 rounded-lg transition-all duration-200 hover:bg-white/50"
                          >
                            {service.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {effectiveServices.map((service: any) => (
                        <TabsContent
                          key={service.code}
                          value={service.code}
                          className="mt-0"
                        >
                          <PermissionTable service={service} />
                        </TabsContent>
                      ))}
                    </Tabs>

                    <div className="mt-8 pt-6 border-t-2 border-gray-200">
                      <Button
                        type="submit"
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <div className="flex items-center justify-center space-x-3">
                          <ShieldCheck className="w-5 h-5" />
                          <span className="text-base">
                            Guardar Cambios ({rolePermissions.length} permisos)
                          </span>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            )}

            {activeTab === "access-control" && (
              <div className="space-y-6">
                <AdvancedAccessControl
                  roleId={roleId}
                  companyId="1" // Default company ID - will be enhanced with company selection
                  onConfigChange={setAccessControlConfig}
                  onSave={async (data) => {
                    try {
                      // TODO: Implement save logic for access control configuration
                      console.log("Saving access control config:", data);

                      // Here you would typically call an API to save the configuration
                      // const response = await saveAccessControlConfig(roleId, data);

                      return {
                        success: true,
                        message:
                          "Configuración de acceso guardada exitosamente",
                      };
                    } catch (error) {
                      console.error(
                        "Error saving access control config:",
                        error
                      );
                      return {
                        success: false,
                        message: "Error al guardar la configuración de acceso",
                      };
                    }
                  }}
                  defaultValues={{
                    companies: {
                      mode: AccessMode.NONE,
                      selectedCompanies: [],
                      description: "",
                    },
                    structure: {
                      enabled: false,
                      structureId: "",
                      selectedLevels: [],
                      selectedSubUnits: [],
                      description: "",
                    },
                    branches: {
                      mode: AccessMode.NONE,
                      selectedBranches: [],
                      description: "",
                    },
                    metadata: {
                      comment: "",
                      tags: [],
                    },
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
