"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  useGetAccessControlConfig,
  useSetAccessControlConfig,
} from "@/service/auths.service";
import {
  useGetBranches,
  useGetCompanies,
  useGetOrganizationalUnits,
  useGetStructures,
} from "@/service/mantainer.service";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Building,
  CheckCircle,
  Filter,
  Layers,
  MapPin,
  Save,
  Settings,
  Shield,
  ShieldCheck,
  ShieldX,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import {
  AccessControlConfig,
  AccessControlConfigUpdateDto,
  AccessMode,
  AdvancedAccessControlFormData,
  FormConfig,
  FormSaveCallback,
} from "./types";

// Schema de validación con Zod
const advancedAccessControlSchema: z.ZodType<AdvancedAccessControlFormData> = z.object({
  companies: z.object({
    mode: z.nativeEnum(AccessMode),
    selectedCompanies: z.array(z.string()),
    description: z.string().optional(),
  }),
  structure: z.object({
    enabled: z.boolean(),
    structureId: z.string(),
    selectedLevels: z.array(z.string()),
    selectedSubUnits: z.array(z.string()),
    description: z.string().optional(),
  }),
  branches: z.object({
    mode: z.nativeEnum(AccessMode),
    selectedBranches: z.array(z.string()),
    description: z.string().optional(),
  }),
  metadata: z
    .object({
      comment: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

interface AdvancedAccessControlProps {
  roleId: string;
  companyId: string;
  onConfigChange?: (config: AccessControlConfig) => void;
  onSave?: FormSaveCallback;
  config?: FormConfig;
  defaultValues?: Partial<AdvancedAccessControlFormData>;
}

// Componente para seleccionar niveles de estructura organizacional
interface StructureLevelSelectorProps {
  structureId: string;
  onLevelsChange: (levels: string[]) => void;
  onSubUnitsChange: (subUnits: string[]) => void;
  selectedLevels: string[];
  selectedSubUnits: string[];
  control: any;
  name: string;
}

function StructureLevelSelector({
  structureId,
  onLevelsChange,
  onSubUnitsChange,
  selectedLevels,
  selectedSubUnits,
  control,
  name,
}: StructureLevelSelectorProps) {
  const { data: organizationalUnits, isLoading } =
    useGetOrganizationalUnits(structureId);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Cargando estructura...</span>
      </div>
    );
  }

  if (!organizationalUnits || organizationalUnits.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-600 text-center">
          No hay unidades organizacionales disponibles
        </p>
      </div>
    );
  }

  const handleLevelToggle = (levelId: string) => {
    const newSelectedLevels = selectedLevels.includes(levelId)
      ? selectedLevels.filter((id) => id !== levelId)
      : [...selectedLevels, levelId];
    onLevelsChange(newSelectedLevels);
  };

  const handleSubUnitToggle = (subUnitId: string) => {
    const newSelectedSubUnits = selectedSubUnits.includes(subUnitId)
      ? selectedSubUnits.filter((id) => id !== subUnitId)
      : [...selectedSubUnits, subUnitId];
    onSubUnitsChange(newSelectedSubUnits);
  };

  const handleExpandLevel = (levelId: string) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(levelId)) {
      newExpanded.delete(levelId);
    } else {
      newExpanded.add(levelId);
    }
    setExpandedLevels(newExpanded);
  };

  const renderSubUnits = (subUnits: any[], level: number, parentId: string) => {
    if (!expandedLevels.has(parentId)) return null;

    return (
      <div className="ml-6 mt-2 space-y-2">
        {subUnits.map((subUnit) => (
          <div key={subUnit.publicId} className="flex items-center space-x-2">
            <Checkbox
              checked={selectedSubUnits.includes(subUnit.publicId)}
              onCheckedChange={() => handleSubUnitToggle(subUnit.publicId)}
            />
            <span className="text-sm text-gray-700">{subUnit.name}</span>
            {subUnit.SubOrganizationalUnit &&
              subUnit.SubOrganizationalUnit.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExpandLevel(subUnit.publicId)}
                  className="h-6 w-6 p-0"
                >
                  {expandedLevels.has(subUnit.publicId) ? "−" : "+"}
                </Button>
              )}
            {subUnit.SubOrganizationalUnit &&
              subUnit.SubOrganizationalUnit.length > 0 &&
              renderSubUnits(
                subUnit.SubOrganizationalUnit,
                level + 1,
                subUnit.publicId
              )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-700">
              Niveles de Estructura
            </h4>
            <Badge variant="outline">
              {selectedLevels.length} niveles, {selectedSubUnits.length}{" "}
              subunidades
            </Badge>
          </div>

          <div className="space-y-3">
            {organizationalUnits.map((unit) => (
              <div key={unit.publicId} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedLevels.includes(unit.publicId)}
                      onCheckedChange={() => handleLevelToggle(unit.publicId)}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {unit.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          Nivel {unit.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        ID: {unit.publicId}
                      </p>
                    </div>
                  </div>

                  {unit.SubOrganizationalUnit &&
                    unit.SubOrganizationalUnit.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {unit.SubOrganizationalUnit.length} subunidades
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExpandLevel(unit.publicId)}
                          className="h-6 w-6 p-0"
                        >
                          {expandedLevels.has(unit.publicId) ? "−" : "+"}
                        </Button>
                      </div>
                    )}
                </div>

                {unit.SubOrganizationalUnit &&
                  unit.SubOrganizationalUnit.length > 0 &&
                  renderSubUnits(
                    unit.SubOrganizationalUnit,
                    unit.level + 1,
                    unit.publicId
                  )}
              </div>
            ))}
          </div>

          {selectedLevels.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">
                Niveles Seleccionados:
              </h5>
              <div className="flex flex-wrap gap-2">
                {selectedLevels.map((levelId) => {
                  const unit =
                    organizationalUnits.find((u) => u.publicId === levelId) ||
                    organizationalUnits
                      .flatMap((u) => u.SubOrganizationalUnit || [])
                      .find((su) => su.publicId === levelId);
                  return (
                    <Badge
                      key={levelId}
                      variant="default"
                      className="bg-blue-100 text-blue-800"
                    >
                      {unit?.name || levelId}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {selectedSubUnits.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <h5 className="font-medium text-green-900 mb-2">
                Subunidades Seleccionadas:
              </h5>
              <div className="flex flex-wrap gap-2">
                {selectedSubUnits.map((subUnitId) => {
                  const subUnit = organizationalUnits
                    .flatMap((u) => u.SubOrganizationalUnit || [])
                    .find((su) => su.publicId === subUnitId);
                  return (
                    <Badge
                      key={subUnitId}
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      {subUnit?.name || subUnitId}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    />
  );
}

export default function AdvancedAccessControl({
  roleId,
  companyId,
  onConfigChange,
  onSave,
  config,
  defaultValues,
}: AdvancedAccessControlProps) {
  const { toast } = useToast();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string>("");
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Servicios de autenticación
  const { data: accessControlConfig, isLoading: isLoadingConfig } =
    useGetAccessControlConfig(roleId);
  const setAccessControlConfigMutation = useSetAccessControlConfig();

  // Configuración por defecto del formulario
  const defaultFormValues: AdvancedAccessControlFormData = {
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
    ...defaultValues,
  };

  // Configuración de react-hook-form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty, isValid, isSubmitting },
    reset,
    trigger,
  } = useForm<AdvancedAccessControlFormData>({
    resolver: zodResolver(advancedAccessControlSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  // Observar cambios en el formulario
  const formValues = watch();

  // Cargar configuración existente cuando esté disponible
  useEffect(() => {
    if (accessControlConfig && !isLoadingConfig) {
      // Determinar el modo de empresas basado en las reglas existentes
      let companyMode = AccessMode.NONE;
      if (
        accessControlConfig.companyRules &&
        accessControlConfig.companyRules.length > 0
      ) {
        // Si hay reglas, determinar el modo basado en la primera regla
        const firstRule = accessControlConfig.companyRules[0];
        companyMode = firstRule.mode;
      }

      // Determinar el modo de sucursales basado en las reglas existentes
      let branchMode = AccessMode.NONE;
      if (
        accessControlConfig.branchRules &&
        accessControlConfig.branchRules.length > 0
      ) {
        // Si hay reglas, determinar el modo basado en la primera regla
        const firstRule = accessControlConfig.branchRules[0];
        branchMode = firstRule.mode;
      }

      const configData: AdvancedAccessControlFormData = {
        companies: {
          mode: companyMode,
          selectedCompanies:
            accessControlConfig.companyRules?.map(
              (rule) => rule.companyPublicId
            ) || [],
          description: "",
        },
        structure: {
          enabled:
            (accessControlConfig.structureRules?.length ?? 0) > 0 ||
            (accessControlConfig.subOrganizationalUnitRules?.length ?? 0) > 0,
          structureId:
            accessControlConfig.structureRules?.[0]?.structurePublicId ||
            accessControlConfig.subOrganizationalUnitRules?.[0]
              ?.structurePublicId ||
            "",
          selectedLevels:
            accessControlConfig.structureRules?.map(
              (rule) => rule.organizationalUnitPublicId
            ) || [],
          selectedSubUnits:
            accessControlConfig.subOrganizationalUnitRules?.map(
              (rule) => rule.subOrganizationalUnitPublicId
            ) || [],
          description: "",
        },
        branches: {
          mode: branchMode,
          selectedBranches:
            accessControlConfig.branchRules?.map(
              (rule) => rule.branchPublicId
            ) || [],
          description: "",
        },
        metadata: {
          comment: accessControlConfig.description || "",
          tags: [],
        },
      };

      reset(configData);
      setIsFormDirty(false);
    }
  }, [accessControlConfig, isLoadingConfig, reset]);

  // Fetch companies data
  const { data: companiesData, isLoading: isLoadingCompanies } =
    useGetCompanies({
      page: 1,
      pageSize: 100,
      sort: "asc",
      selector: true,
    });

  // Fetch branches data
  const { data: branchesData, isLoading: isLoadingBranches } = useGetBranches({
    page: 1,
    pageSize: 100,
    sort: "asc",
  });

  // Fetch structures data
  const { data: structuresData, isLoading: isLoadingStructures } =
    useGetStructures({
      page: 1,
      pageSize: 100,
      sort: "asc",
    });

  // Set default structure if available
  useEffect(() => {
    if (
      structuresData?.data &&
      structuresData.data.length > 0 &&
      !selectedStructureId
    ) {
      setSelectedStructureId(structuresData.data[0].publicId);
      setValue("structure.structureId", structuresData.data[0].publicId, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [structuresData, selectedStructureId, setValue]);

  // Watch for form changes to update dirty state
  useEffect(() => {
    // Check if form values have changed from defaults
    const hasChanges =
      formValues.companies.mode !== defaultFormValues.companies.mode ||
      formValues.companies.selectedCompanies.length !==
        defaultFormValues.companies.selectedCompanies.length ||
      formValues.companies.description !==
        defaultFormValues.companies.description ||
      formValues.structure.enabled !== defaultFormValues.structure.enabled ||
      formValues.structure.structureId !==
        defaultFormValues.structure.structureId ||
      formValues.structure.selectedLevels.length !==
        defaultFormValues.structure.selectedLevels.length ||
      formValues.structure.selectedSubUnits.length !==
        defaultFormValues.structure.selectedSubUnits.length ||
      formValues.structure.description !==
        defaultFormValues.structure.description ||
      formValues.branches.mode !== defaultFormValues.branches.mode ||
      formValues.branches.selectedBranches.length !==
        defaultFormValues.branches.selectedBranches.length ||
      formValues.branches.description !==
        defaultFormValues.branches.description ||
      formValues.metadata?.comment !== defaultFormValues.metadata?.comment ||
      JSON.stringify(formValues.metadata?.tags) !==
        JSON.stringify(defaultFormValues.metadata?.tags);

    setIsFormDirty(hasChanges);
  }, [formValues, defaultFormValues]);

  // Validation function
  const validateConfiguration = (
    values: AdvancedAccessControlFormData
  ): string[] => {
    const errors: string[] = [];

    // Check for conflicting company rules
    if (
      values.companies.mode === AccessMode.WHITELIST &&
      values.companies.selectedCompanies.length === 0
    ) {
      errors.push("Debe seleccionar al menos una empresa en modo lista blanca");
    }

    if (
      values.companies.mode === AccessMode.BLACKLIST &&
      values.companies.selectedCompanies.length === 0
    ) {
      errors.push("Debe seleccionar al menos una empresa en modo lista negra");
    }

    // Check for conflicting branch rules
    if (
      values.branches.mode === AccessMode.WHITELIST &&
      values.branches.selectedBranches.length === 0
    ) {
      errors.push(
        "Debe seleccionar al menos una sucursal en modo lista blanca"
      );
    }

    if (
      values.branches.mode === AccessMode.BLACKLIST &&
      values.branches.selectedBranches.length === 0
    ) {
      errors.push("Debe seleccionar al menos una sucursal en modo lista negra");
    }

    // Check structure configuration
    if (
      values.structure.enabled &&
      (!values.structure.structureId ||
        values.structure.selectedLevels.length === 0)
    ) {
      errors.push(
        "Debe seleccionar una estructura y al menos un nivel cuando el control está habilitado"
      );
    }

    return errors;
  };

  // Handle form submission
  const onSubmit = async (data: AdvancedAccessControlFormData) => {
    try {
      // Validate before submission
      const validationErrors = validateConfiguration(data);
      if (validationErrors.length > 0) {
        setValidationErrors(validationErrors);
        toast({
          title: "Error de validación",
          description: "Por favor, corrija los errores antes de guardar",
          variant: "destructive",
        });
        return;
      }

      // Preparar datos para el backend
      const updateData: AccessControlConfigUpdateDto = {
        name: `Configuración de acceso para rol ${roleId}`,
        companies: {
          mode: data.companies.mode,
          selectedCompanies: data.companies.selectedCompanies,
          description: data.companies.description || "",
        },
        structure: {
          enabled: data.structure.enabled,
          structureId: data.structure.structureId || "",
          selectedLevels: data.structure.selectedLevels,
          selectedSubUnits: data.structure.selectedSubUnits,
          description: data.structure.description || "",
        },
        branches: {
          mode: data.branches.mode,
          selectedBranches: data.branches.selectedBranches,
          description: data.branches.description || "",
        },
        metadata: {
          comment: data.metadata?.comment || "",
          tags: data.metadata?.tags || [],
        },
      };

      // Usar el servicio de autenticación para guardar
      const result = await setAccessControlConfigMutation.mutateAsync({
        roleId,
        data: updateData,
      });

      if (result) {
        toast({
          title: "Configuración guardada",
          description: "La configuración se ha guardado exitosamente",
        });
        reset(data); // Reset form to mark as not dirty
        setValidationErrors([]); // Clear validation errors
        setIsFormDirty(false); // Reset manual dirty state

        // Llamar callback personalizado si existe
        if (onSave) {
          await onSave(data);
        }
      }
    } catch (error: any) {
      console.error("Error saving access control config:", error);
      toast({
        title: "Error al guardar",
        description:
          error?.response?.data?.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  };

  // Company access control handlers
  const handleCompanyModeChange = (mode: AccessMode) => {
    setValue("companies.mode", mode, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (mode === AccessMode.NONE) {
      setValue("companies.selectedCompanies", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    // Clear validation errors when mode changes
    setValidationErrors([]);
    setIsFormDirty(true);
  };

  const handleCompanyToggle = (companyId: string, companyName: string) => {
    const currentSelected = formValues.companies.selectedCompanies;
    const newSelected = currentSelected.includes(companyId)
      ? currentSelected.filter((id) => id !== companyId)
      : [...currentSelected, companyId];

    setValue("companies.selectedCompanies", newSelected, {
      shouldDirty: true,
      shouldValidate: true,
    });
    // Clear validation errors when selection changes
    setValidationErrors([]);
    setIsFormDirty(true);
  };

  // Branch access control handlers
  const handleBranchModeChange = (mode: AccessMode) => {
    setValue("branches.mode", mode, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (mode === AccessMode.NONE) {
      setValue("branches.selectedBranches", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    // Clear validation errors when mode changes
    setValidationErrors([]);
    setIsFormDirty(true);
  };

  const handleBranchToggle = (branchId: string, branchName: string) => {
    const currentSelected = formValues.branches.selectedBranches;
    const newSelected = currentSelected.includes(branchId)
      ? currentSelected.filter((id) => id !== branchId)
      : [...currentSelected, branchId];

    setValue("branches.selectedBranches", newSelected, {
      shouldDirty: true,
      shouldValidate: true,
    });
    // Clear validation errors when selection changes
    setValidationErrors([]);
    setIsFormDirty(true);
  };

  // Structure access control handlers
  const handleStructureToggle = (enabled: boolean) => {
    setValue("structure.enabled", enabled, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (!enabled) {
      setValue("structure.selectedLevels", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("structure.selectedSubUnits", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("structure.structureId", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    // Clear validation errors when structure control changes
    setValidationErrors([]);
    setIsFormDirty(true);
  };

  const handleStructureLevelsChange = (levels: string[]) => {
    setValue("structure.selectedLevels", levels, {
      shouldDirty: true,
      shouldValidate: true,
    });
    // Clear validation errors when levels change
    setValidationErrors([]);
    setIsFormDirty(true);
  };

  const handleStructureSubUnitsChange = (subUnits: string[]) => {
    setValue("structure.selectedSubUnits", subUnits, {
      shouldDirty: true,
      shouldValidate: true,
    });
    // Clear validation errors when sub units change
    setValidationErrors([]);
    setIsFormDirty(true);
  };

  // Prevent form submission on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLTextAreaElement) {
      e.preventDefault();
    }
  };

  const getAccessStatus = (
    targetId: string,
    targetType: "company" | "branch"
  ) => {
    const config =
      targetType === "company" ? formValues.companies : formValues.branches;
    const selected =
      targetType === "company"
        ? formValues.companies.selectedCompanies
        : formValues.branches.selectedBranches;

    if (config.mode === AccessMode.NONE) return "none";
    if (selected.includes(targetId)) {
      return config.mode === AccessMode.WHITELIST ? "allow" : "deny";
    }
    return config.mode === AccessMode.WHITELIST ? "deny" : "allow";
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Control de Acceso Avanzado
            </h2>
            <p className="text-gray-600">
              Configura reglas granulares de acceso por empresa, estructura
              organizacional y sucursal
            </p>
          </div>
        </div>

        {/* Save Button */}
        <Button
          type="submit"
          disabled={!isFormDirty || isSubmitting || !isValid || isLoadingConfig}
          className="flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>
            {isSubmitting
              ? "Guardando..."
              : isLoadingConfig
              ? "Cargando..."
              : "Guardar Configuración"}
          </span>
        </Button>
      </div>

      {/* Loading State */}
      {isLoadingConfig && (
        <Alert>
          <AlertDescription>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Cargando configuración existente...</span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Form Errors */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>
                  {field}: {error?.message || "Campo inválido"}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="companies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="companies"
            className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Building className="w-4 h-4" />
            <span>Empresas</span>
          </TabsTrigger>
          <TabsTrigger
            value="structure"
            className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Layers className="w-4 h-4" />
            <span>Estructura</span>
          </TabsTrigger>
          <TabsTrigger
            value="branches"
            className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <MapPin className="w-4 h-4" />
            <span>Sucursales</span>
          </TabsTrigger>
        </TabsList>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-lg text-gray-800">
                <Building className="w-5 h-5 text-blue-600" />
                Control de Acceso por Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Modo de Control</h3>
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant={
                      formValues.companies.mode === AccessMode.NONE
                        ? "default"
                        : "outline"
                    }
                    onClick={() => handleCompanyModeChange(AccessMode.NONE)}
                    className="flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Sin Restricciones</span>
                  </Button>
                  <Button
                    type="button"
                    variant={
                      formValues.companies.mode === AccessMode.WHITELIST
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      handleCompanyModeChange(AccessMode.WHITELIST)
                    }
                    className="flex items-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Lista Blanca</span>
                  </Button>
                  <Button
                    type="button"
                    variant={
                      formValues.companies.mode === AccessMode.BLACKLIST
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      handleCompanyModeChange(AccessMode.BLACKLIST)
                    }
                    className="flex items-center space-x-2"
                  >
                    <ShieldX className="w-4 h-4" />
                    <span>Lista Negra</span>
                  </Button>
                </div>
              </div>

              {/* Mode Description */}
              {formValues.companies.mode !== AccessMode.NONE && (
                <Alert>
                  <AlertDescription>
                    <strong>
                      Modo{" "}
                      {formValues.companies.mode === AccessMode.WHITELIST
                        ? "Lista Blanca"
                        : "Lista Negra"}
                      :
                    </strong>
                    {formValues.companies.mode === AccessMode.WHITELIST
                      ? " Solo las empresas seleccionadas tendrán acceso. El resto estarán denegadas por defecto."
                      : " Las empresas seleccionadas estarán denegadas. El resto tendrán acceso por defecto."}
                  </AlertDescription>
                </Alert>
              )}

              {/* Company List */}
              {formValues.companies.mode !== AccessMode.NONE && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Empresas</h3>
                  {isLoadingCompanies ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">
                        Cargando empresas...
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {companiesData?.data.map((company) => {
                        const status = getAccessStatus(
                          company.publicId,
                          "company"
                        );

                        return (
                          <div
                            key={company.publicId}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              status === "allow"
                                ? "border-green-200 bg-green-50"
                                : status === "deny"
                                ? "border-red-200 bg-red-50"
                                : "border-gray-200 bg-gray-50"
                            }`}
                            onClick={() =>
                              handleCompanyToggle(
                                company.publicId,
                                company.businessName
                              )
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {company.businessName}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {company.documentNumber}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {status === "allow" && (
                                  <Badge
                                    variant="default"
                                    className="bg-green-100 text-green-800"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Permitido
                                  </Badge>
                                )}
                                {status === "deny" && (
                                  <Badge variant="destructive">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Denegado
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="companies-description">
                  Descripción (opcional)
                </Label>
                <Controller
                  name="companies.description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="companies-description"
                      placeholder="Describe la configuración de acceso por empresa..."
                      className="resize-none"
                      rows={3}
                      onKeyDown={handleKeyDown}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Structure Tab */}
        <TabsContent value="structure" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-lg text-gray-800">
                <Layers className="w-5 h-5 text-green-600" />
                Control por Estructura Organizacional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Structure Control */}
              <div className="flex items-center space-x-3">
                <Controller
                  name="structure.enabled"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        handleStructureToggle(checked as boolean);
                      }}
                    />
                  )}
                />
                <label className="font-medium text-gray-700">
                  Habilitar control por estructura organizacional
                </label>
              </div>

              {formValues.structure.enabled && (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      <strong>Filtros Jerárquicos:</strong> Selecciona los
                      niveles de la estructura organizacional a los que este rol
                      tendrá acceso. Los filtros se aplican de forma granular
                      por nivel.
                    </AlertDescription>
                  </Alert>

                  {/* Structure Selection */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="structure-select">
                        Estructura Organizacional
                      </Label>
                      {isLoadingStructures ? (
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          <span className="text-sm text-gray-600">
                            Cargando estructuras...
                          </span>
                        </div>
                      ) : (
                        <Controller
                          name="structure.structureId"
                          control={control}
                          render={({ field }) => (
                            <select
                              {...field}
                              id="structure-select"
                              className="w-full p-2 border border-gray-300 rounded-md mt-1"
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                setSelectedStructureId(e.target.value);
                              }}
                            >
                              <option value="">Seleccionar estructura</option>
                              {structuresData?.data.map((structure) => (
                                <option
                                  key={structure.publicId}
                                  value={structure.publicId}
                                >
                                  {structure.name}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      )}
                    </div>

                    {/* Structure Level Selector */}
                    {selectedStructureId && (
                      <StructureLevelSelector
                        structureId={selectedStructureId}
                        selectedLevels={formValues.structure.selectedLevels}
                        onLevelsChange={handleStructureLevelsChange}
                        selectedSubUnits={formValues.structure.selectedSubUnits}
                        onSubUnitsChange={handleStructureSubUnitsChange}
                        control={control}
                        name="structure.selectedLevels"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="structure-description">
                  Descripción (opcional)
                </Label>
                <Controller
                  name="structure.description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="structure-description"
                      placeholder="Describe la configuración de acceso por estructura..."
                      className="resize-none"
                      rows={3}
                      onKeyDown={handleKeyDown}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-lg text-gray-800">
                <MapPin className="w-5 h-5 text-purple-600" />
                Control de Acceso por Sucursal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Modo de Control</h3>
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant={
                      formValues.branches.mode === AccessMode.NONE
                        ? "default"
                        : "outline"
                    }
                    onClick={() => handleBranchModeChange(AccessMode.NONE)}
                    className="flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Sin Restricciones</span>
                  </Button>
                  <Button
                    type="button"
                    variant={
                      formValues.branches.mode === AccessMode.WHITELIST
                        ? "default"
                        : "outline"
                    }
                    onClick={() => handleBranchModeChange(AccessMode.WHITELIST)}
                    className="flex items-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Lista Blanca</span>
                  </Button>
                  <Button
                    type="button"
                    variant={
                      formValues.branches.mode === AccessMode.BLACKLIST
                        ? "default"
                        : "outline"
                    }
                    onClick={() => handleBranchModeChange(AccessMode.BLACKLIST)}
                    className="flex items-center space-x-2"
                  >
                    <ShieldX className="w-4 h-4" />
                    <span>Lista Negra</span>
                  </Button>
                </div>
              </div>

              {/* Mode Description */}
              {formValues.branches.mode !== AccessMode.NONE && (
                <Alert>
                  <AlertDescription>
                    <strong>
                      Modo{" "}
                      {formValues.branches.mode === AccessMode.WHITELIST
                        ? "Lista Blanca"
                        : "Lista Negra"}
                      :
                    </strong>
                    {formValues.branches.mode === AccessMode.WHITELIST
                      ? " Solo las sucursales seleccionadas tendrán acceso. El resto estarán denegadas por defecto."
                      : " Las sucursales seleccionadas estarán denegadas. El resto tendrán acceso por defecto."}
                  </AlertDescription>
                </Alert>
              )}

              {/* Branch List */}
              {formValues.branches.mode !== AccessMode.NONE && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Sucursales</h3>
                  {isLoadingBranches ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <span className="ml-2 text-gray-600">
                        Cargando sucursales...
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {branchesData?.data.map((branch) => {
                        const status = getAccessStatus(
                          branch.publicId,
                          "branch"
                        );

                        return (
                          <div
                            key={branch.publicId}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              status === "allow"
                                ? "border-green-200 bg-green-50"
                                : status === "deny"
                                ? "border-red-200 bg-red-50"
                                : "border-gray-200 bg-gray-50"
                            }`}
                            onClick={() =>
                              handleBranchToggle(branch.publicId, branch.name)
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {branch.name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {branch.code}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {status === "allow" && (
                                  <Badge
                                    variant="default"
                                    className="bg-green-100 text-green-800"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Permitido
                                  </Badge>
                                )}
                                {status === "deny" && (
                                  <Badge variant="destructive">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Denegado
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="branches-description">
                  Descripción (opcional)
                </Label>
                <Controller
                  name="branches.description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="branches-description"
                      placeholder="Describe la configuración de acceso por sucursal..."
                      className="resize-none"
                      rows={3}
                      onKeyDown={handleKeyDown}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Metadata Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">Metadatos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comment">Comentario (opcional)</Label>
            <Controller
              name="metadata.comment"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="comment"
                  placeholder="Agrega un comentario sobre esta configuración..."
                  className="resize-none"
                  rows={3}
                  onKeyDown={handleKeyDown}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-lg text-gray-800">
            <Filter className="w-5 h-5 text-blue-600" />
            Resumen de Configuración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700">Empresas</h4>
              <p className="text-sm text-gray-600">
                {formValues.companies.mode === AccessMode.NONE &&
                  "Sin restricciones"}
                {formValues.companies.mode === AccessMode.WHITELIST &&
                  `${formValues.companies.selectedCompanies.length} empresas permitidas`}
                {formValues.companies.mode === AccessMode.BLACKLIST &&
                  `${formValues.companies.selectedCompanies.length} empresas denegadas`}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700">Estructura</h4>
              <p className="text-sm text-gray-600">
                {formValues.structure.enabled
                  ? `${formValues.structure.selectedLevels.length} niveles y ${formValues.structure.selectedSubUnits.length} subunidades seleccionados`
                  : "Sin control"}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700">Sucursales</h4>
              <p className="text-sm text-gray-600">
                {formValues.branches.mode === AccessMode.NONE &&
                  "Sin restricciones"}
                {formValues.branches.mode === AccessMode.WHITELIST &&
                  `${formValues.branches.selectedBranches.length} sucursales permitidas`}
                {formValues.branches.mode === AccessMode.BLACKLIST &&
                  `${formValues.branches.selectedBranches.length} sucursales denegadas`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
