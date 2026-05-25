"use client";

import AccessNotGranted from "@/app/[locale]/_components/acces-not-granted";
import {
  CHEKIOActionButton,
  CHEKIOButton,
  CHEKIOHeader,
  CHEKIOInput,
  CHEKIOLoading,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
  CheckIOUploadModal,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import type {
  SubOrganizationalUnitListItemDto,
  SubUnitSortField,
} from "@/dto/structure";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateSubOrganizationalUnit,
  useDeleteSubOrganizationalUnit,
  useGetOrganizationalUnits,
  useGetStructures,
  useGetSubOrganizationalUnitsByLevel,
  useGetValidParentsForLevel,
} from "@/service/mantainer.service";
import type { FieldDefinition } from "@/utils/excelParser";
import type { TemplateField } from "@/utils/excelTemplateGenerator";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DeleteSubUnitConfirmModal } from "../../_components/DeleteSubUnitConfirmModal";
import { SubUnitModalByLevel } from "../../_components/SubUnitModalByLevel";

const PAGE_SIZES = [10, 20, 50, 100, 200];

/** Aligned with max 8 organizational levels (Rubrika: show “Ver hijos” when level ≤ 7). */
const MAX_LEVEL_FOR_CHILD_NAV = 7;

enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

function resolveOneParentReference(
  validParents: SubOrganizationalUnitListItemDto[],
  segment: string,
): string {
  const value = segment.trim();
  if (!value) {
    throw new Error("Referencia de padre vacía.");
  }
  const byPublicId = validParents.find((p) => p.publicId === value);
  if (byPublicId) return byPublicId.publicId;
  const codeMatches = validParents.filter(
    (p) => p.code.trim().toLowerCase() === value.toLowerCase(),
  );
  if (codeMatches.length === 1) return codeMatches[0].publicId;
  if (codeMatches.length > 1) {
    throw new Error(
      `Código de padre ambiguo: "${value}". Use el UUID del padre o separe varios UUID con coma.`,
    );
  }
  const nameMatches = validParents.filter(
    (p) => p.name.trim().toLowerCase() === value.toLowerCase(),
  );
  if (nameMatches.length === 1) return nameMatches[0].publicId;
  if (nameMatches.length > 1) {
    throw new Error(
      `Nombre de padre ambiguo: "${value}". Use el UUID del padre o un código único.`,
    );
  }
  throw new Error(
    `Padre no encontrado: "${value}". Use código, nombre o UUID del nivel anterior.`,
  );
}

function resolveParentIdsForBulk(
  validParents: SubOrganizationalUnitListItemDto[],
  codigoPadreRaw: string,
): string[] {
  const raw = codigoPadreRaw.trim();
  if (!raw) {
    throw new Error("Debe indicar al menos un padre.");
  }
  const segments = raw.includes(",")
    ? raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [raw];
  const ids = segments.map((s) => resolveOneParentReference(validParents, s));
  return [...new Set(ids)];
}

function LevelPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? "es";
  const structureId = params?.structureId as string;
  const levelParam = params?.level as string;
  const level = parseInt(levelParam, 10) || 1;

  const t = useTranslations("mantainers.structures");
  const tLevel = useTranslations("mantainers.structures.levelDetail");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate, canUpdate, canDelete, companyId } = useCookieSession();

  const parentFromUrl = searchParams.get("parent") ?? "";
  const [parentId, setParentId] = useState<string | "">(parentFromUrl);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState<string | undefined>(
    undefined,
  );
  const [sortBy, setSortBy] = useState<SubUnitSortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.ASC);

  useEffect(() => {
    const p = searchParams.get("parent") ?? "";
    setParentId(p);
    setPage(1);
  }, [searchParams]);

  const [pageSize, setPageSize] = useState(10);
  const [subUnitModalOpen, setSubUnitModalOpen] = useState(false);
  const [editingSubUnitId, setEditingSubUnitId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subUnitToDelete, setSubUnitToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: structuresData } = useGetStructures({
    page: 1,
    pageSize: 1000,
    sort: "asc",
    ...(companyId ? { companyId } : {}),
  });
  const { data: organizationalUnits } = useGetOrganizationalUnits(structureId);
  const currentLevelOu = useMemo(
    () => organizationalUnits?.find((ou) => ou.level === level),
    [organizationalUnits, level],
  );
  const levelName =
    currentLevelOu?.name ?? `${t("structureDetail.level")} ${level}`;
  const levelOuPublicId = currentLevelOu?.publicId ?? "";

  const { data: validParents = [] } = useGetValidParentsForLevel(
    structureId,
    level,
  );

  const initialParentSubUnitIdsForModal = useMemo(() => {
    const pid = typeof parentId === "string" ? parentId.trim() : "";
    if (!pid) return undefined;
    if (!validParents.some((p) => p.publicId === pid)) return undefined;
    return [pid];
  }, [parentId, validParents]);

  const {
    data: paginatedData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSubOrganizationalUnitsByLevel(structureId, level, {
    parentId: parentId || undefined,
    page,
    pageSize,
    search: searchFilter,
    sortBy,
    sortOrder,
  });

  const { mutateAsync: createSubUnitAsync } = useCreateSubOrganizationalUnit();
  const { mutateAsync: deleteSubUnit, isPending: isDeletingSubUnit } =
    useDeleteSubOrganizationalUnit();

  const structureName = useMemo(() => {
    const s = structuresData?.data?.find((x) => x.publicId === structureId);
    return s?.name ?? t("structureDetail.structureLabel");
  }, [structuresData, structureId, t]);

  const basePath = `/${locale}/mantainers/structures/${structureId}`;
  const totalPages = paginatedData?.totalPages ?? 1;
  const totalCount = paginatedData?.total ?? 0;
  const items = paginatedData?.data ?? [];

  const invalidateSubUnitQueries = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (q) => {
        const key = q.queryKey;
        return (
          Array.isArray(key) &&
          key[0] === "GetSubOrganizationalUnitsByLevel" &&
          key[1] === structureId
        );
      },
    });
    queryClient.invalidateQueries({
      queryKey: ["GetValidParentsForLevel", structureId, level],
    });
    queryClient.invalidateQueries({
      queryKey: ["GetOrganizationalUnits", structureId],
    });
    queryClient.invalidateQueries({
      queryKey: ["GetOrganizationalUnitsTreeDetailed", structureId],
    });
  }, [queryClient, structureId, level]);

  const handleParentFilterChange = useCallback(
    (value: string) => {
      const newParentId = value === "all" ? "" : value;
      setParentId(newParentId);
      setPage(1);
      const path = `${basePath}/nivel/${level}`;
      const search = newParentId ? `?parent=${newParentId}` : "";
      router.replace(path + search, { scroll: false });
    },
    [router, basePath, level],
  );

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleSearch = useCallback(() => {
    setSearchFilter(searchTerm.trim() || undefined);
    setPage(1);
  }, [searchTerm]);

  const handleSort = useCallback(
    (column: SubUnitSortField) => {
      if (sortBy === column) {
        setSortOrder((o) =>
          o === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC,
        );
      } else {
        setSortBy(column);
        setSortOrder(SortOrder.ASC);
      }
      setPage(1);
    },
    [sortBy],
  );

  const sortIcon = useCallback(
    (column: SubUnitSortField) => {
      if (sortBy !== column) {
        return <ArrowUpDown className="h-4 w-4 text-gray-400" aria-hidden />;
      }
      return sortOrder === SortOrder.ASC ? (
        <ArrowUp className="h-4 w-4" aria-hidden />
      ) : (
        <ArrowDown className="h-4 w-4" aria-hidden />
      );
    },
    [sortBy, sortOrder],
  );

  const handleCreateSuccess = useCallback(() => {
    invalidateSubUnitQueries();
    setSubUnitModalOpen(false);
    setEditingSubUnitId(null);
    toast({
      title: t("successTitle"),
      description: tLevel("toastSubunitCreated"),
    });
  }, [invalidateSubUnitQueries, toast, t, tLevel]);

  const handleUpdateSuccess = useCallback(() => {
    invalidateSubUnitQueries();
    setSubUnitModalOpen(false);
    setEditingSubUnitId(null);
    toast({
      title: t("successTitle"),
      description: tLevel("toastSubunitUpdated"),
    });
  }, [invalidateSubUnitQueries, toast, t, tLevel]);

  const openDeleteModal = useCallback((id: string, name: string) => {
    setSubUnitToDelete({ id, name });
    setDeleteError(null);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!subUnitToDelete) return;
    setDeleteError(null);
    try {
      await deleteSubUnit({
        structureId,
        id: subUnitToDelete.id,
      });
      invalidateSubUnitQueries();
      setDeleteModalOpen(false);
      setSubUnitToDelete(null);
      toast({
        title: t("successTitle"),
        description: tLevel("toastSubunitDeleted"),
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al eliminar la subunidad";
      setDeleteError(msg);
    }
  }, [
    subUnitToDelete,
    structureId,
    deleteSubUnit,
    invalidateSubUnitQueries,
    toast,
    t,
    tLevel,
  ]);

  const uploadFields: TemplateField[] = useMemo(
    () => [
      { key: "name", label: "Nombre", type: "text", exampleValue: "Ejemplo" },
      { key: "code", label: "Código", type: "text", exampleValue: "COD-01" },
      ...(level >= 2
        ? [
            {
              key: "codigo_padre",
              label: tLevel("bulkParentColumnLabel"),
              type: "text" as const,
              exampleValue: validParents[0]?.publicId ?? "uuid-padre",
            },
          ]
        : []),
    ],
    [level, validParents, tLevel],
  );

  const uploadFieldDefinitions: FieldDefinition[] = useMemo(
    () => [
      { key: "name", label: "Nombre", type: "text", required: true },
      { key: "code", label: "Código", type: "text", required: true },
      ...(level >= 2
        ? [
            {
              key: "codigo_padre",
              label: tLevel("bulkParentColumnLabel"),
              type: "text" as const,
              required: true,
            },
          ]
        : []),
    ],
    [level, tLevel],
  );

  const handleBulkUpload = useCallback(
    async (rows: Record<string, unknown>[]) => {
      if (!levelOuPublicId) {
        throw new Error("No existe la unidad organizacional para este nivel.");
      }
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = String(row.name ?? "").trim();
        const code = String(row.code ?? "").trim();
        if (!name || !code) {
          throw new Error(
            `Fila ${i + 1}: nombre y código son obligatorios y no pueden estar vacíos.`,
          );
        }
        let parentSubUnitIds: string[] = [];
        if (level >= 2) {
          const codigoPadre = String(row.codigo_padre ?? "").trim();
          if (!codigoPadre) {
            throw new Error(
              `Fila ${i + 1}: debe indicar el padre (nivel anterior): código, nombre, UUID o varios UUID separados por coma.`,
            );
          }
          try {
            parentSubUnitIds = resolveParentIdsForBulk(
              validParents,
              codigoPadre,
            );
          } catch (err) {
            throw new Error(
              `Fila ${i + 1}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
        await createSubUnitAsync({
          name,
          code,
          organizationalUnitId: levelOuPublicId,
          parentSubUnitIds,
        });
      }
      invalidateSubUnitQueries();
    },
    [
      level,
      levelOuPublicId,
      validParents,
      createSubUnitAsync,
      invalidateSubUnitQueries,
    ],
  );

  const breadcrumbs = [
    t("breadcrumbs.dashboard"),
    t("breadcrumbs.maintainers"),
    t("breadcrumbs.structures"),
    structureName,
    levelName,
  ];

  const toolbarButtons = canCreate(
    OrganizationPermissionCode.STRUCTURE_MAINTENANCE,
  ) ? (
    <div className="flex items-center gap-2">
      <CHEKIOButton
        variant="primary"
        onClick={() => {
          setEditingSubUnitId(null);
          setSubUnitModalOpen(true);
        }}
      >
        <Plus className="h-4 w-4" />
        {tLevel("new")}
      </CHEKIOButton>
      <CHEKIOButton
        variant="primary"
        onClick={() => setUploadModalOpen(true)}
        disabled={level >= 2 && validParents.length === 0}
      >
        <Upload className="h-4 w-4" />
        {tLevel("bulkUpload")}
      </CHEKIOButton>
    </div>
  ) : null;

  const errorMessage =
    error instanceof Error ? error.message : String(error ?? "");

  return (
    <>
      <CHEKIOHeader
        title={levelName}
        breadcrumbs={breadcrumbs}
        onBack={() => router.push(basePath)}
        backStyle="secondaryBlue"
        backAriaLabel={tLevel("backAria")}
        actions={toolbarButtons}
      />
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {organizationalUnits
            ?.sort((a, b) => a.level - b.level)
            .map((ou) => (
              <Link
                key={ou.publicId}
                href={`${basePath}/nivel/${ou.level}`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  ou.level === level
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {ou.name}
              </Link>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 space-y-1.5">
            <label
              htmlFor="subunit-level-search"
              className="text-sm font-medium text-gray-700 block"
            >
              {tLevel("searchLabel")}
            </label>
            <CHEKIOInput
              id="subunit-level-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder={tLevel("searchPlaceholder")}
              className="w-full"
            />
          </div>
          <div className="md:col-span-2 flex flex-col justify-end">
            <CHEKIOButton
              type="button"
              variant="search"
              onClick={handleSearch}
              className="flex items-center justify-center gap-1.5 w-full"
            >
              <Search className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm whitespace-nowrap">
                {tLevel("searchButton")}
              </span>
            </CHEKIOButton>
          </div>
          {level >= 2 && (
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-sm font-medium text-gray-700 block">
                {tLevel("filterByParent")}
              </label>
              <CHEKIOSelect
                value={parentId || "all"}
                onValueChange={handleParentFilterChange}
              >
                <CHEKIOSelectTrigger className="w-full">
                  <CHEKIOSelectValue placeholder={tLevel("all")} />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  <CHEKIOSelectItem value="all">
                    {tLevel("all")}
                  </CHEKIOSelectItem>
                  {validParents.map((p) => (
                    <CHEKIOSelectItem key={p.publicId} value={p.publicId}>
                      {p.name} ({p.code})
                    </CHEKIOSelectItem>
                  ))}
                </CHEKIOSelectContent>
              </CHEKIOSelect>
            </div>
          )}
        </div>

        {!isLoading && searchFilter && (
          <p className="text-sm text-gray-600">
            {totalCount > 0
              ? tLevel("searchResults", {
                  count: totalCount,
                  term: searchFilter,
                })
              : tLevel("searchNoResults", { term: searchFilter })}
          </p>
        )}

        {isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              {tLevel("loadError")}: {errorMessage}
            </p>
            <CHEKIOButton
              type="button"
              variant="secondaryBlue"
              onClick={() => refetch()}
              className="mt-2"
            >
              {tLevel("retry")}
            </CHEKIOButton>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <CHEKIOLoading
                size="lg"
                variant="modern"
                text={tLevel("loadingData")}
              />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600 font-medium">
                {tLevel("noSubunits")}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {tLevel("noSubunitsDescription")}
              </p>
            </div>
          ) : (
            <>
              <CHEKIOTable>
                <CHEKIOTableHeader>
                  <tr>
                    <CHEKIOTableHead
                      aria-sort={
                        sortBy === "name"
                          ? sortOrder === SortOrder.ASC
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-medium cursor-pointer hover:text-blue-700"
                        onClick={() => handleSort("name")}
                      >
                        {tLevel("name")}
                        {sortIcon("name")}
                      </button>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead
                      aria-sort={
                        sortBy === "code"
                          ? sortOrder === SortOrder.ASC
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-medium cursor-pointer hover:text-blue-700"
                        onClick={() => handleSort("code")}
                      >
                        {tLevel("code")}
                        {sortIcon("code")}
                      </button>
                    </CHEKIOTableHead>
                    {level >= 2 && (
                      <CHEKIOTableHead
                        aria-sort={
                          sortBy === "parentName"
                            ? sortOrder === SortOrder.ASC
                              ? "ascending"
                              : "descending"
                            : undefined
                        }
                      >
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 font-medium cursor-pointer hover:text-blue-700"
                          onClick={() => handleSort("parentName")}
                        >
                          {tLevel("parent")}
                          {sortIcon("parentName")}
                        </button>
                      </CHEKIOTableHead>
                    )}
                    <CHEKIOTableHead
                      aria-sort={
                        sortBy === "employeeCount"
                          ? sortOrder === SortOrder.ASC
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-medium cursor-pointer hover:text-blue-700"
                        onClick={() => handleSort("employeeCount")}
                      >
                        {tLevel("employees")}
                        {sortIcon("employeeCount")}
                      </button>
                    </CHEKIOTableHead>
                    <CHEKIOTableHead className="w-40">
                      {t("table.headers.actions")}
                    </CHEKIOTableHead>
                  </tr>
                </CHEKIOTableHeader>
                <CHEKIOTableBody>
                  {items.map((row, index) => (
                    <CHEKIOTableRow key={row.publicId} index={index}>
                      <CHEKIOTableCell>{row.name}</CHEKIOTableCell>
                      <CHEKIOTableCell>{row.code}</CHEKIOTableCell>
                      {level >= 2 && (
                        <CHEKIOTableCell>
                          {row.parentName ?? "-"}
                        </CHEKIOTableCell>
                      )}
                      <CHEKIOTableCell className="tabular-nums">
                        {row.employeeCount ?? 0}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        <div className="flex items-center gap-1">
                          {level <= MAX_LEVEL_FOR_CHILD_NAV && (
                            <Link
                              href={`${basePath}/nivel/${level + 1}?parent=${row.publicId}`}
                            >
                              <CHEKIOActionButton
                                variant="view"
                                size="sm"
                                className="flex items-center gap-1.5 px-2 py-1.5 h-auto w-auto min-w-fit"
                              >
                                <span className="text-xs whitespace-nowrap">
                                  {tLevel("viewChildren")}
                                </span>
                              </CHEKIOActionButton>
                            </Link>
                          )}
                          {canUpdate(
                            OrganizationPermissionCode.STRUCTURE_MAINTENANCE,
                          ) && (
                            <CHEKIOActionButton
                              variant="edit"
                              size="sm"
                              onClick={() => {
                                setEditingSubUnitId(row.publicId);
                                setSubUnitModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-2 py-1.5 h-auto w-auto min-w-fit"
                            >
                              <span className="text-xs whitespace-nowrap">
                                {tLevel("edit")}
                              </span>
                            </CHEKIOActionButton>
                          )}
                          {canDelete(
                            OrganizationPermissionCode.STRUCTURE_MAINTENANCE,
                          ) && (
                            <CHEKIOActionButton
                              variant="delete"
                              size="sm"
                              onClick={() =>
                                openDeleteModal(row.publicId, row.name)
                              }
                              className="flex items-center gap-1.5 px-2 py-1.5 h-auto w-auto min-w-fit"
                            >
                              <Trash2 className="h-3 w-3 flex-shrink-0" />
                              <span className="text-xs whitespace-nowrap">
                                {tLevel("delete")}
                              </span>
                            </CHEKIOActionButton>
                          )}
                        </div>
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  ))}
                </CHEKIOTableBody>
              </CHEKIOTable>

              <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 pb-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {t("pagination.showing", {
                      current: items.length,
                      total: totalCount,
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      {t("pagination.recordsPerPage")}
                    </label>
                    <CHEKIOSelect
                      value={String(pageSize)}
                      onValueChange={(v) =>
                        handlePageSizeChange(parseInt(v, 10))
                      }
                    >
                      <CHEKIOSelectTrigger className="w-24">
                        <CHEKIOSelectValue />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        {PAGE_SIZES.map((n) => (
                          <CHEKIOSelectItem key={n} value={String(n)}>
                            {n}
                          </CHEKIOSelectItem>
                        ))}
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("pagination.previous")}
                  </CHEKIOButton>
                  <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                    {t("pagination.page", {
                      current: page,
                      total: totalPages,
                    })}
                  </div>
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    {t("pagination.next")}
                    <ChevronRight className="h-4 w-4" />
                  </CHEKIOButton>
                </div>
              </div>
            </>
          )}
        </div>

        <SubUnitModalByLevel
          isOpen={subUnitModalOpen}
          onClose={() => {
            setSubUnitModalOpen(false);
            setEditingSubUnitId(null);
          }}
          structureId={structureId}
          level={level}
          levelOuPublicId={levelOuPublicId}
          validParents={validParents}
          editingSubUnitId={editingSubUnitId}
          editingSubUnit={
            editingSubUnitId
              ? (items.find((i) => i.publicId === editingSubUnitId) ?? null)
              : null
          }
          onSuccess={
            editingSubUnitId ? handleUpdateSuccess : handleCreateSuccess
          }
          initialParentSubUnitIds={initialParentSubUnitIdsForModal}
        />

        <DeleteSubUnitConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSubUnitToDelete(null);
            setDeleteError(null);
          }}
          subUnitName={subUnitToDelete?.name ?? ""}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeletingSubUnit}
          errorMessage={deleteError}
        />

        <CheckIOUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          title={tLevel("bulkUploadModalTitle", { levelName })}
          entityName="subunidades"
          fields={uploadFields}
          fieldDefinitions={uploadFieldDefinitions}
          onUpload={handleBulkUpload}
          extraContent={
            level >= 2 && validParents.length === 0 ? (
              <p className="text-sm text-amber-800 bg-amber-50 p-2 rounded">
                {tLevel("uploadNoParentsWarning")}
              </p>
            ) : undefined
          }
        />
      </div>
    </>
  );
}

export default function LevelPage() {
  return (
    <AccessNotGranted
      OrganizationPermissionCode={
        OrganizationPermissionCode.STRUCTURE_MAINTENANCE
      }
    >
      <LevelPageContent />
    </AccessNotGranted>
  );
}
