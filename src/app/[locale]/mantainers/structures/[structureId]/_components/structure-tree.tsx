"use client";
import { CHEKIOButton, CHEKIOInput } from "@/components";
import {
  useUpdateOrganizationalUnitName,
  useUpdateSubOrganizationalUnitName,
} from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  Building2,
  ChevronDown,
  ChevronRight,
  Edit,
  FolderTree,
  Hash,
  Layers,
  Loader2,
  PlusCircle,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  OrganizationalUnitDto,
  SubOrganizationalUnitDto,
} from "./organizationalUnit.dto";

export interface AddUnitProps {
  parentId: string;
  parentLevel: number;
  isRoot: boolean;
  subRelationId?: string;
}

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  DESTRUCTIVE = "destructive",
}

type TreeNode = OrganizationalUnitDto | SubOrganizationalUnitDto;

interface StructureTreeProps {
  data: OrganizationalUnitDto[];
  structureId: string;
  onAddUnit: (props: AddUnitProps) => void;
  onDeleteUnit: (id: string) => void;
}

const MAX_LEVELS = 10;

// Build tree structure based on levels and subRelationId
function buildTree(
  data: any,
  parentId: string | null,
  topLevel: number,
  level = 1,
  parentUnitName = "",
) {
  let tree = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].subRelationId == parentId) {
      if (level === topLevel) {
        data[i].items = [];
      } else {
        let children = buildTree(
          data,
          data[i].publicId,
          topLevel,
          level + 1,
          data[i].name,
        );
        if (children.length > 0) {
          data[i].items =
            children.map((x: any) => {
              return {
                code: x.publicId || x.code || x.name,
                name: x.name,
                items: x.items || [],
                level: x.level || level + 1,
                organizationalUnitName: data[i].name,
              };
            }) || [];
        }
      }

      tree.push({
        ...data[i],
        organizationalUnitName: parentUnitName,
      });
    }
  }
  return tree.map((x) => {
    return {
      code: x.publicId || x.code || x.name,
      name: x.name,
      items: x.items,
      level: x.level || level,
      organizationalUnitName: x.organizationalUnitName,
    };
  });
}

// Organizational Units Header Component
const OrganizationalUnitsHeader = ({
  data,
  structureId,
}: {
  data: OrganizationalUnitDto[];
  structureId: string;
}) => {
  const queryClient = useQueryClient();
  const { mutate: updateName, isPending } = useUpdateOrganizationalUnitName();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const sortedUnits = useMemo(() => {
    return [...data].sort((a, b) => a.level - b.level);
  }, [data]);

  const handleStartEdit = (unit: OrganizationalUnitDto) => {
    setEditingId(unit.publicId);
    setEditValue(unit.name);
  };

  const handleSaveEdit = (publicId: string) => {
    if (editValue.trim()) {
      setUpdatingId(publicId);
      updateName(
        { publicId, structureId, name: editValue.trim() },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["GetOrganizationalUnits", structureId],
            });
            setEditingId(null);
            setEditValue("");
            setUpdatingId(null);
          },
          onError: () => {
            setUpdatingId(null);
          },
        },
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  return (
    <div className="bg-gray-50 p-4 mb-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Unidades Organizacionales
        </h3>
        <div className="px-2 py-1 bg-blue-50 border border-blue-100">
          <span className="text-sm font-medium text-blue-700">
            {sortedUnits.length} niveles
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {sortedUnits.map((unit, index) => (
          <div key={unit.publicId} className="relative">
            {index < sortedUnits.length - 1 && (
              <div className="absolute left-4 top-6 bottom-0 w-px bg-gray-200" />
            )}

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white rounded-full border-2 border-blue-500 z-10">
                <span className="text-xs font-semibold text-blue-700">
                  {unit.level}
                </span>
              </div>

              <div className="flex-1 w-full bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                <div className="flex items-center w-full justify-between gap-2">
                  {editingId === unit.publicId ? (
                    <div className="flex-1 flex items-center gap-2">
                      <CHEKIOInput
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                          if (!updatingId) {
                            handleSaveEdit(unit.publicId);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !updatingId) {
                            handleSaveEdit(unit.publicId);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                        className="flex-1 text-sm"
                        autoFocus
                        disabled={updatingId === unit.publicId}
                      />
                      {updatingId === unit.publicId && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      )}
                    </div>
                  ) : (
                    <>
                      <span
                        className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 flex items-center gap-1"
                        onClick={() => handleStartEdit(unit)}
                      >
                        {unit.name}
                        <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                      </span>
                      {unit.SubOrganizationalUnit && (
                        <div className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100">
                          <span className="text-xs font-medium text-emerald-700">
                            {unit.SubOrganizationalUnit.length} subunidades
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500">ID: {unit.publicId}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Nivel jerárquico</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Subunidades</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Tree Node Component
const TreeNode = ({
  node,
  level,
  onAddUnit,
  onDeleteUnit,
  searchTerm,
  onSearch,
  onClearSearch,
  sortedUnits,
  structureId,
}: {
  node: any;
  level: number;
  onAddUnit: (props: AddUnitProps) => void;
  onDeleteUnit: (id: string) => void;
  searchTerm: string;
  onSearch: (value: string) => void;
  onClearSearch: () => void;
  sortedUnits: OrganizationalUnitDto[];
  structureId: string;
}) => {
  const queryClient = useQueryClient();
  const { mutate: updateName, isPending } =
    useUpdateSubOrganizationalUnitName();
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const hasChildren = node.items && node.items.length > 0;
  const isLastLevel = level >= MAX_LEVELS - 1;

  const handleStartEdit = () => {
    setEditingId(node.code);
    setEditValue(node.name);
  };

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      setUpdatingId(node.code);
      updateName(
        { publicId: node.code, structureId, name: editValue.trim() },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["GetOrganizationalUnits", structureId],
            });
            setEditingId(null);
            setEditValue("");
            setUpdatingId(null);
          },
          onError: () => {
            setUpdatingId(null);
          },
        },
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const filteredItems = useMemo(() => {
    if (!searchTerm || !hasChildren) return node.items || [];

    const searchLower = searchTerm.toLowerCase();
    return (node.items || []).filter((item: any) => {
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.code.toLowerCase().includes(searchLower)
      );
    });
  }, [node.items, searchTerm, hasChildren]);

  const handleSearch = (value: string) => {
    onSearch(value);
    if (value) {
      setIsExpanded(true);
    }
  };

  const handleClearSearch = () => {
    onClearSearch();
    setIsExpanded(false);
  };

  return (
    <div className="ml-6">
      <div className="flex items-center mb-2">
        <div className="w-6 flex items-center justify-center">
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
          <div className="p-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="px-2 py-1 bg-blue-50 border border-blue-100">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-blue-700" />
                        <span className="text-xs font-medium text-blue-700">
                          {sortedUnits[level]?.name}
                        </span>
                      </div>
                    </div>
                    {hasChildren && (
                      <div className="px-2 py-1 bg-purple-50 border border-purple-100">
                        <div className="flex items-center gap-1.5">
                          <BarChart className="h-3.5 w-3.5 text-purple-700" />
                          <span className="text-xs font-medium text-purple-700">
                            {filteredItems.length}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-gray-700" />
                        {editingId === node.code ? (
                          <div className="flex items-center gap-2 flex-1">
                            <CHEKIOInput
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => {
                                if (!updatingId) {
                                  handleSaveEdit();
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !updatingId) {
                                  handleSaveEdit();
                                } else if (e.key === "Escape") {
                                  handleCancelEdit();
                                }
                              }}
                              className="flex-1 text-base font-medium"
                              autoFocus
                              disabled={updatingId === node.code}
                            />
                            {updatingId === node.code && (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            )}
                          </div>
                        ) : (
                          <span
                            className="font-medium text-base text-gray-900 cursor-pointer hover:text-blue-600 flex items-center gap-1"
                            onClick={handleStartEdit}
                          >
                            {sortedUnits[level]?.name}: {node.name}
                            <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Hash className="h-3.5 w-3.5 text-gray-400" />
                          Código:{" "}
                          <span className="text-gray-700 font-medium">
                            {node.code}
                          </span>
                        </span>
                        {node.level && (
                          <span className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-gray-400" />
                            <span>Nivel:</span>
                            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-white rounded-full border-2 border-blue-500 z-10">
                              <span className="text-xs font-semibold text-blue-700">
                                {node.level - 1}
                              </span>
                            </div>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {!isLastLevel && (
                    <CHEKIOButton
                      variant={ButtonVariant.SECONDARY}
                      onClick={() => {
                        onAddUnit({
                          parentId: sortedUnits[level + 1].publicId,
                          parentLevel: level,
                          isRoot: false,
                          subRelationId: node.code,
                        });
                      }}
                      className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 px-2 py-1 h-auto text-xs"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      {sortedUnits[level + 1]?.name && (
                        <span>Agregar {sortedUnits[level + 1]?.name}</span>
                      )}
                    </CHEKIOButton>
                  )}
                  {(!node.items || node.items.length === 0) && (
                    <CHEKIOButton
                      variant={ButtonVariant.DESTRUCTIVE}
                      onClick={() => onDeleteUnit(node.code)}
                      className="flex items-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 border-red-200 px-2 py-1 h-auto text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Eliminar</span>
                    </CHEKIOButton>
                  )}
                </div>
              </div>
              {hasChildren && (
                <div className="relative w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <CHEKIOInput
                      placeholder={`Buscar en ${
                        sortedUnits[level + 1]?.name || `Nivel ${level + 1}`
                      }...`}
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full text-sm pl-9 pr-9"
                    />
                    {searchTerm && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
          <div className="space-y-2">
            {filteredItems.map((child: any) => (
              <TreeNode
                key={child.code}
                node={child}
                level={level + 1}
                onAddUnit={onAddUnit}
                onDeleteUnit={onDeleteUnit}
                searchTerm=""
                onSearch={() => {}}
                onClearSearch={() => {}}
                sortedUnits={sortedUnits}
                structureId={structureId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Tree Component
const CustomTree = ({
  data,
  onAddUnit,
  onDeleteUnit,
  searchTerms,
  onSearch,
  onClearSearch,
  sortedUnits,
  structureId,
}: {
  data: any[];
  onAddUnit: (props: AddUnitProps) => void;
  onDeleteUnit: (id: string) => void;
  searchTerms: { [key: number]: string };
  onSearch: (level: number, value: string) => void;
  onClearSearch: (level: number) => void;
  sortedUnits: OrganizationalUnitDto[];
  structureId: string;
}) => {
  return (
    <div className="p-4">
      {data.map((node) => (
        <TreeNode
          key={node.code}
          node={node}
          level={0}
          onAddUnit={onAddUnit}
          onDeleteUnit={onDeleteUnit}
          searchTerm={searchTerms[0] || ""}
          onSearch={(value) => onSearch(0, value)}
          onClearSearch={() => onClearSearch(0)}
          sortedUnits={sortedUnits}
          structureId={structureId}
        />
      ))}
    </div>
  );
};

export const StructureTree = ({
  data,
  onAddUnit,
  onDeleteUnit,
  structureId,
}: StructureTreeProps) => {
  const [searchTerms, setSearchTerms] = useState<{ [key: number]: string }>({});
  const treeData = buildTree(
    data.flatMap((x) => x.SubOrganizationalUnit),
    null,
    10,
  );

  const sortedUnits = useMemo(() => {
    return [...data].sort((a, b) => a.level - b.level);
  }, [data]);

  const handleSearch = (level: number, value: string) => {
    setSearchTerms((prev) => ({ ...prev, [level]: value }));
  };

  const handleClearSearch = (level: number) => {
    setSearchTerms((prev) => {
      const newTerms = { ...prev };
      delete newTerms[level];
      return newTerms;
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-2">
        <div className="space-y-2 col-span-3">
          <OrganizationalUnitsHeader data={data} structureId={structureId} />
        </div>

        <div className="space-y-2 col-span-9">
          {treeData.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 text-gray-500 py-6">
              <p className="text-sm">No hay unidades organizacionales</p>
              <CHEKIOButton
                variant={ButtonVariant.SECONDARY}
                onClick={() => {
                  onAddUnit({
                    parentId: sortedUnits[0].publicId,
                    parentLevel: 0,
                    isRoot: true,
                  });
                }}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 px-3 py-1.5 h-auto"
              >
                <PlusCircle className="h-4 w-4" />
                {sortedUnits[0]?.name || "Agregar unidad"}
              </CHEKIOButton>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <CHEKIOButton
                variant={ButtonVariant.SECONDARY}
                onClick={() => {
                  onAddUnit({
                    parentId: sortedUnits[0].publicId,
                    parentLevel: 0,
                    isRoot: true,
                  });
                }}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 px-3 py-1.5 h-auto"
              >
                <PlusCircle className="h-4 w-4" />
                Agregar unidad {sortedUnits[0]?.name || "Agregar unidad"}
              </CHEKIOButton>
              <CustomTree
                data={treeData}
                onAddUnit={onAddUnit}
                onDeleteUnit={onDeleteUnit}
                searchTerms={searchTerms}
                onSearch={handleSearch}
                onClearSearch={handleClearSearch}
                sortedUnits={sortedUnits}
                structureId={structureId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
