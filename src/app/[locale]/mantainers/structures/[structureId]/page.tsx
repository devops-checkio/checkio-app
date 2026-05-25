"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import { CHEKIOButton, CHEKIOHeader, CHEKIOInput } from "@/components";
import EmptyIcon from "@/components/icons/empty-icon";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import type { SubOrganizationalUnitTreeNodeDto } from "@/dto/structure";
import { useToast } from "@/hooks/use-toast";
import {
  useGetOrganizationalUnits,
  useGetStructures,
  useUpdateStructure,
} from "@/service/mantainer.service";
import axiosInstance from "@/utils/axios";
import { handleError } from "@/utils/error";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Download, Edit, Layers, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { LevelsManagerModal } from "./_components/LevelsManagerModal";

/**
 * CSV export uses `tree-detailed` so each row reflects one path in the
 * multi-parent tree (same logical node may appear multiple times under different parents).
 */
function flattenTreeDetailedToCSVRows(
  roots: SubOrganizationalUnitTreeNodeDto[],
  columnCount: number,
): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  const emitRow = (path: string[], code: string, id: string) => {
    const row: Record<string, string> = {};
    for (let i = 0; i < columnCount; i++) {
      row[`Nivel ${i + 1}`] = path[i] ?? "";
    }
    row["Código"] = code;
    row["Nombre Completo"] = path.join(" > ");
    row["ID"] = id;
    rows.push(row);
  };
  const walk = (node: SubOrganizationalUnitTreeNodeDto, path: string[]) => {
    const next = [...path, node.name];
    emitRow(next, node.code, node.id);
    for (const ch of node.children ?? []) {
      walk(ch, next);
    }
  };
  for (const r of roots) {
    walk(r, []);
  }
  return rows;
}

function StructureLandingContent({ structureId }: { structureId: string }) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const t = useTranslations("mantainers.structures");
  const tDetail = useTranslations("mantainers.structures.structureDetail");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUpdate, canRead, companyId } = useCookieSession();
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [levelsModalOpen, setLevelsModalOpen] = useState(false);
  const [isEditingStructureName, setIsEditingStructureName] = useState(false);
  const [structureName, setStructureName] = useState("");

  const { data: organizationalUnits, isLoading } =
    useGetOrganizationalUnits(structureId);
  const { data: structuresData } = useGetStructures({
    page: 1,
    pageSize: 1000,
    sort: "asc",
    ...(companyId ? { companyId } : {}),
  });
  const { mutate: updateStructure, isPending: isUpdatingStructure } =
    useUpdateStructure();

  useEffect(() => {
    if (structuresData?.data) {
      const structure = structuresData.data.find(
        (s) => s.publicId === structureId,
      );
      if (structure) setStructureName(structure.name);
    }
  }, [structuresData, structureId]);

  const handleSaveStructureName = useCallback(() => {
    if (!structureName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la estructura no puede estar vacío",
        variant: "destructive",
      });
      return;
    }
    const structure = structuresData?.data?.find(
      (s) => s.publicId === structureId,
    );
    if (!structure) return;
    updateStructure(
      {
        publicId: structureId,
        name: structureName.trim(),
        companies: structure.companies,
      },
      {
        onSuccess: () => {
          setIsEditingStructureName(false);
          toast({
            title: "Éxito",
            description: "Nombre de estructura actualizado exitosamente",
          });
          queryClient.invalidateQueries({ queryKey: ["GetStructures"] });
        },
        onError: (error: unknown) => handleError(error, toast),
      },
    );
  }, [
    structureName,
    structureId,
    structuresData,
    updateStructure,
    toast,
    queryClient,
  ]);

  const handleDownloadCSV = useCallback(async () => {
    if (!organizationalUnits || organizationalUnits.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay unidades organizacionales para exportar",
        variant: "default",
      });
      return;
    }
    setIsExportingCsv(true);
    try {
      const tree = await queryClient.fetchQuery({
        queryKey: ["GetOrganizationalUnitsTreeDetailed", structureId],
        queryFn: async () => {
          const response = await axiosInstance.get<
            SubOrganizationalUnitTreeNodeDto[]
          >(
            `/client/mantainer/structures/${structureId}/organizational-units/tree-detailed`,
          );
          return response.data;
        },
      });
      const sortedUnits = [...organizationalUnits].sort(
        (a, b) => a.level - b.level,
      );
      const columnCount = sortedUnits.length;
      const csvData = flattenTreeDetailedToCSVRows(tree, columnCount);
      if (csvData.length === 0) {
        toast({
          title: "No hay datos",
          description: "No hay subunidades para exportar",
          variant: "default",
        });
        return;
      }
      const headers = [
        ...sortedUnits.map((_, i) => `Nivel ${i + 1}`),
        "Código",
        "Nombre Completo",
        "ID",
      ];
      const csvContent = [
        headers.join(","),
        ...csvData.map((row) =>
          headers
            .map((h) => {
              const value = row[h] ?? "";
              if (value.includes(",") || value.includes('"'))
                return `"${value.replace(/"/g, '""')}"`;
              return value;
            })
            .join(","),
        ),
      ].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `estructura-organizacional-${structureId}.csv`;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Éxito",
        description: "Estructura organizacional descargada exitosamente",
        variant: "default",
      });
    } catch {
      toast({
        title: "Error",
        description: "Error al generar el archivo CSV",
        variant: "destructive",
      });
    } finally {
      setIsExportingCsv(false);
    }
  }, [organizationalUnits, structureId, toast, queryClient]);

  const sortedLevels = [...(organizationalUnits ?? [])].sort(
    (a, b) => a.level - b.level,
  );
  const basePath = `/${locale}/mantainers/structures/${structureId}`;

  const actions = (
    <div className="flex items-center gap-2">
      {canUpdate(OrganizationPermissionCode.STRUCTURE_MAINTENANCE) && (
        <CHEKIOButton
          variant="secondaryBlue"
          onClick={() => setLevelsModalOpen(true)}
        >
          {tDetail("configureLevels")}
        </CHEKIOButton>
      )}
      {canRead(OrganizationPermissionCode.STRUCTURE_MAINTENANCE) && (
        <CHEKIOButton
          variant="secondaryBlue"
          onClick={handleDownloadCSV}
          disabled={
            !organizationalUnits ||
            organizationalUnits.length === 0 ||
            isExportingCsv
          }
        >
          <Download className="h-4 w-4" />
          {tDetail("downloadStructure")}
        </CHEKIOButton>
      )}
    </div>
  );

  return (
    <>
      <CHEKIOHeader
        title={structureName || t("structureDetail.structureLabel")}
        breadcrumbs={[
          t("breadcrumbs.dashboard"),
          t("breadcrumbs.maintainers"),
          t("breadcrumbs.structures"),
          structureName || t("structureDetail.structureLabel"),
        ]}
        onBack={() => router.push(`/${locale}/mantainers/structures`)}
        backStyle="secondaryBlue"
        backAriaLabel={tDetail("backAria")}
        actions={actions}
      />
      <div className="space-y-4">
        {structureName && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                {tDetail("structureLabel")}:
              </span>
              {isEditingStructureName ? (
                <div className="flex items-center gap-2 flex-1">
                  <CHEKIOInput
                    value={structureName}
                    onChange={(e) => setStructureName(e.target.value)}
                    className="w-64"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveStructureName();
                      if (e.key === "Escape") {
                        setIsEditingStructureName(false);
                        const s = structuresData?.data?.find(
                          (x) => x.publicId === structureId,
                        );
                        if (s) setStructureName(s.name);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveStructureName}
                    disabled={isUpdatingStructure}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                    title={t("buttons.save")}
                    aria-label={t("buttons.save")}
                  >
                    {isUpdatingStructure ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingStructureName(false);
                      const s = structuresData?.data?.find(
                        (x) => x.publicId === structureId,
                      );
                      if (s) setStructureName(s.name);
                    }}
                    disabled={isUpdatingStructure}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                    title={t("buttons.cancel")}
                    aria-label={t("buttons.cancel")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    {structureName}
                  </span>
                  {canUpdate(
                    OrganizationPermissionCode.STRUCTURE_MAINTENANCE,
                  ) && (
                    <button
                      type="button"
                      onClick={() => setIsEditingStructureName(true)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                      title={t("buttons.edit")}
                      aria-label={t("buttons.edit")}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : !organizationalUnits || organizationalUnits.length === 0 ? (
          <EmptyIcon
            title={tDetail("noLevelsConfigured")}
            description={tDetail("noLevelsDescription")}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedLevels.map((ou) => (
              <Link
                key={ou.publicId}
                href={`${basePath}/nivel/${ou.level}`}
                className="block p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 hover:shadow transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {ou.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {tDetail("level")} {ou.level}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <LevelsManagerModal
          isOpen={levelsModalOpen}
          onClose={() => setLevelsModalOpen(false)}
          structureId={structureId}
          levels={organizationalUnits ?? []}
        />
      </div>
    </>
  );
}

type Params = Promise<{ structureId: string }>;

export default function Page(props: { params: Params }) {
  const { structureId } = use(props.params);
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.STRUCTURE_MAINTENANCE
      }
    >
      <StructureLandingContent structureId={structureId} />
    </AccessNotGranted>
  );
}
