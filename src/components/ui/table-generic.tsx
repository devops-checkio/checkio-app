"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCookieSession } from "@/context/useCookieSession";
import {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  Row,
  SortingState,
  Table as TableInstance,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";

export enum SelectAllBehavior {
  DEFAULT = "DEFAULT",
  SELECT_ALL_DISTINCT_KEY = "SELECT_ALL_DISTINCT_KEY",
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  queryKey: string[];
  data: TData[];
  isLoading?: boolean;
  error?: Error | null;
  noResultsMessage?: string | React.ReactNode;
  filterPlaceholder?: string;
  onSelectedRowsChange?: (selectedRows: TData[]) => void;
  enableRowSelection?: boolean;
  isRowSelectable?: (row: Row<TData>) => boolean;
  selectAllBehavior?: SelectAllBehavior;
  serverPagination?: {
    totalCount: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number, pageSize: number) => void;
  };
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactElement;
  getRowCanExpand?: (row: Row<TData>) => boolean;
  clearSelection?: boolean;
}

const MAX_FILTER_LENGTH = 100;
const DEFAULT_PAGE_SIZE = 10;

export function DataTable<TData extends Record<string, any>, TValue>({
  columns,
  data = [],
  isLoading = false,
  error = null,
  noResultsMessage = "No results.",
  filterPlaceholder = "Filter...",
  onSelectedRowsChange,
  enableRowSelection = false,
  isRowSelectable,
  selectAllBehavior = SelectAllBehavior.DEFAULT,
  serverPagination,
  renderSubComponent,
  getRowCanExpand = () => false,
  clearSelection = false,
}: DataTableProps<TData, TValue>) {
  const { getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({});
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = React.useState(0);

  // Efecto para limpiar la selección cuando clearSelection cambia a true
  React.useEffect(() => {
    if (clearSelection) {
      setRowSelection({});
    }
  }, [clearSelection]);

  // Sincronizar el estado interno de paginación con serverPagination
  React.useEffect(() => {
    if (serverPagination) {
      setPageIndex(serverPagination.currentPage - 1);
      setPageSize(serverPagination.pageSize);
    }
  }, [serverPagination]);

  // Referencia para evitar actualizaciones infinitas
  const rowSelectionRef = React.useRef(rowSelection);
  rowSelectionRef.current = rowSelection;

  const handleRowSelectionChange: OnChangeFn<typeof rowSelection> =
    React.useCallback(
      (updaterOrValue) => {
        const newSelection =
          typeof updaterOrValue === "function"
            ? updaterOrValue(rowSelection)
            : updaterOrValue;

        setRowSelection(newSelection);

        if (onSelectedRowsChange) {
          const selectedRows = data.filter((_, index) => newSelection[index]);
          onSelectedRowsChange(selectedRows);
        }
      },
      [data, onSelectedRowsChange, rowSelection],
    );

  // Ensure unique column IDs by adding prefixes only when necessary
  const processedColumns = React.useMemo(() => {
    const systemIds = ["expander", "select"];
    const usedIds = new Set<string>();
    const processed = columns.map((col, index) => {
      let finalId: string = col.id || "";

      // If column has no id, generate one based on accessorKey or index
      if (!finalId) {
        const accessorKey = (col as any).accessorKey;
        finalId = accessorKey || `column_${index}`;
      }

      // Only change the id if it conflicts with system columns or other columns
      if (systemIds.includes(finalId) || usedIds.has(finalId)) {
        finalId = `user_${finalId}_${index}`;
      }

      usedIds.add(finalId);

      return {
        ...col,
        id: finalId,
      };
    });

    return processed;
  }, [columns]);

  const table = useReactTable({
    data,
    columns: [
      ...(renderSubComponent
        ? [
            {
              id: "expander",
              header: () => null,
              cell: ({ row }: { row: Row<TData> }) => {
                return getRowCanExpand(row) ? (
                  <button
                    onClick={() => row.toggleExpanded()}
                    className="p-1 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105"
                  >
                    {row.getIsExpanded() ? (
                      <ChevronDown className="h-3 w-3 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-gray-600" />
                    )}
                  </button>
                ) : null;
              },
              size: 40,
            },
          ]
        : []),
      ...(enableRowSelection
        ? [
            {
              id: "select",
              header: ({ table }: { table: TableInstance<TData> }) => {
                // Get all rows from the current page
                const allRows = table.getRowModel().rows;

                // Filter selectable rows
                const selectableRows = allRows.filter((row) =>
                  isRowSelectable ? isRowSelectable(row) : true,
                );

                let isAllSelected = false;
                let isIndeterminate = false;

                if (
                  selectAllBehavior ===
                  SelectAllBehavior.SELECT_ALL_DISTINCT_KEY
                ) {
                  // For distinct key behavior, group by publicId and check unique selections
                  const uniqueGroups = new Map();
                  allRows.forEach((row) => {
                    const publicId = (row.original as any).publicId;
                    if (!uniqueGroups.has(publicId)) {
                      uniqueGroups.set(publicId, []);
                    }
                    uniqueGroups.get(publicId).push(row);
                  });

                  const uniqueKeys = Array.from(uniqueGroups.keys());
                  const selectedUniqueKeys = uniqueKeys.filter((key) => {
                    const group = uniqueGroups.get(key);
                    const hasSelected = group.some((row: any) =>
                      row.getIsSelected(),
                    );
                    console.log(`🔍 Checking group for ${key}:`, {
                      groupSize: group.length,
                      hasSelected,
                      rowStates: group.map((row: any) => ({
                        publicId: row.original.publicId,
                        isSelected: row.getIsSelected(),
                        rowId: row.id,
                        selectionState: row.getIsSelected()
                          ? "SELECTED"
                          : "NOT_SELECTED",
                      })),
                    });
                    return hasSelected;
                  });

                  // For Select All, we consider "all selected" when all unique employees are selected
                  // regardless of how many rows are selectable
                  isAllSelected =
                    uniqueKeys.length > 0 &&
                    selectedUniqueKeys.length === uniqueKeys.length;
                  isIndeterminate =
                    selectedUniqueKeys.length > 0 &&
                    selectedUniqueKeys.length < uniqueKeys.length;
                } else {
                  // Default behavior - check all rows
                  const selectedRows = allRows.filter((row) =>
                    row.getIsSelected(),
                  );
                  isAllSelected =
                    allRows.length > 0 &&
                    selectedRows.length === allRows.length;
                  isIndeterminate =
                    selectedRows.length > 0 &&
                    selectedRows.length < allRows.length;
                }

                const handleSelectAll = (value: boolean) => {
                  if (value) {
                    if (
                      selectAllBehavior ===
                      SelectAllBehavior.SELECT_ALL_DISTINCT_KEY
                    ) {
                      // For distinct key behavior, select only the first occurrence of each unique publicId
                      const uniqueGroups = new Map();
                      allRows.forEach((row) => {
                        const publicId = (row.original as any).publicId;
                        if (!uniqueGroups.has(publicId)) {
                          uniqueGroups.set(publicId, row);
                        }
                      });

                      console.log("🎯 Selecting unique rows:", {
                        uniqueGroups: uniqueGroups.size,
                        totalRows: allRows.length,
                        rowsToSelect: Array.from(uniqueGroups.values()).map(
                          (row) => ({
                            publicId: row.original.publicId,
                            currentlySelected: row.getIsSelected(),
                          }),
                        ),
                      });

                      // Use table method for SELECT_ALL_DISTINCT_KEY selection
                      const distinctRowSelection: Record<string, boolean> = {};
                      const selectedPublicIds = new Set<string>();

                      allRows.forEach((row, index) => {
                        const publicId = (row.original as any).publicId;
                        // Only select the first occurrence of each unique publicId
                        if (!selectedPublicIds.has(publicId)) {
                          distinctRowSelection[index.toString()] = true;
                          selectedPublicIds.add(publicId);
                          console.log(
                            "🎯 Selecting distinct row:",
                            publicId,
                            "at index:",
                            index,
                          );
                        }
                      });

                      console.log(
                        "🎯 Setting distinct row selection:",
                        distinctRowSelection,
                      );
                      table.setRowSelection(distinctRowSelection);
                    } else {
                      // Default: select all rows using table method
                      console.log(
                        "🎯 Selecting all rows (DEFAULT behavior):",
                        allRows.length,
                      );

                      // Use table's built-in method to select all rows
                      const allRowSelection: Record<string, boolean> = {};
                      allRows.forEach((row, index) => {
                        allRowSelection[index.toString()] = true;
                      });

                      console.log("🎯 Setting row selection:", allRowSelection);
                      table.setRowSelection(allRowSelection);
                    }
                  } else {
                    // Deselect all rows
                    console.log("🎯 Deselecting all rows:", {
                      totalRows: allRows.length,
                      rowStates: allRows.map((row) => ({
                        publicId: row.original.publicId,
                        currentlySelected: row.getIsSelected(),
                      })),
                    });

                    // Use table's built-in method to deselect all rows
                    console.log("🎯 Deselecting ALL rows using table method");

                    // Use React Table's built-in method to clear all selections
                    table.setRowSelection({});

                    console.log(
                      "🎯 All rows deselected using table.setRowSelection({})",
                    );
                  }
                };

                return (
                  <Checkbox
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el && "indeterminate" in el) {
                        (el as any).indeterminate = isIndeterminate;
                      }
                    }}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                );
              },
              cell: ({ row }: { row: Row<TData> }) => {
                const isSelectable = isRowSelectable
                  ? isRowSelectable(row)
                  : true;
                return (
                  <Checkbox
                    checked={row.getIsSelected()}
                    disabled={!isSelectable}
                    onCheckedChange={(value) =>
                      isSelectable && row.toggleSelected(!!value)
                    }
                    aria-label="Select row"
                    className={`data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 ${
                      !isSelectable ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  />
                );
              },
            },
          ]
        : []),
      ...processedColumns,
    ] as ColumnDef<TData, any>[],
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleRowSelectionChange,
    manualPagination: !!serverPagination,
    // getRowCanSelect: isRowSelectable, // Commented out as it may not be supported in this version
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    getRowCanExpand,
  });

  React.useEffect(() => {
    // Limpiar los listeners cuando el componente se desmonte
    const cleanup = () => {
      setSorting([]);
      setColumnFilters([]);
      setColumnVisibility({});
      setRowSelection({});
      setPageIndex(0);
      setPageSize(DEFAULT_PAGE_SIZE);
    };

    return cleanup;
  }, []);

  if (isLoading)
    return (
      <div className="w-full h-20 flex items-center justify-center mt-4">
        <div className="relative w-24 h-24">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
            <div className="w-full h-full rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500"></div>
          </div>

          {/* Inner spinning ring */}
          <div className="absolute inset-4 animate-[spin_2s_linear_infinite_reverse]">
            <div className="w-full h-full rounded-full border-2 border-transparent border-t-indigo-500 border-l-indigo-500"></div>
          </div>

          {/* Logo container */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-10 h-10">
              <Image
                src="/logos/logo.svg"
                alt="Checkio Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="w-full h-20 flex items-center justify-center">
        <div className="text-red-500 text-sm">
          Error loading data: {(error as Error).message}
        </div>
      </div>
    );

  const nameColumn = columns.find((col) => col.id === "name")
    ? table.getColumn("name")
    : null;

  const renderNoResultsMessage = () => {
    if (typeof noResultsMessage === "string") {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">
            {noResultsMessage}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Try adjusting your search criteria
          </p>
        </div>
      );
    }
    return noResultsMessage;
  };

  return (
    <div className="w-full space-y-3">
      {/* Search and Filter Section */}
      <div className="flex items-center justify-between">
        {nameColumn && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={filterPlaceholder}
              value={((nameColumn?.getFilterValue() as string) ?? "").slice(
                0,
                100,
              )}
              onChange={(event) => {
                const value = event.target.value;
                if (value.length <= 100) {
                  nameColumn?.setFilterValue(value);
                }
              }}
              className="pl-10 h-8 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          {enableRowSelection &&
            table.getFilteredSelectedRowModel().rows.length > 0 && (
              <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                {table.getFilteredSelectedRowModel().rows.length}{" "}
                seleccionado(s)
              </div>
            )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader style={{ backgroundColor: templateUser?.primary }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-white/20"
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className={`px-3 py-2 text-left font-semibold text-white text-sm ${
                          header.column.columns
                            ? "text-center border-x border-white/20"
                            : ""
                        }`}
                        colSpan={header.colSpan}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={
                              header.column.getCanSort()
                                ? "flex items-center space-x-2 cursor-pointer select-none hover:text-white/80 transition-colors duration-200 group"
                                : header.column.columns
                                  ? "flex justify-center w-full"
                                  : "flex items-center"
                            }
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getCanSort() && (
                              <div className="flex items-center ml-2">
                                {header.column.getIsSorted() === "asc" ? (
                                  <ArrowUpDown className="h-4 w-4 text-white group-hover:text-white/90 transition-all duration-300 transform rotate-0" />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <ArrowUpDown className="h-4 w-4 text-white group-hover:text-white/90 transition-all duration-300 transform rotate-180" />
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 text-white/50 group-hover:text-white/70 transition-all duration-300 transform rotate-0 hover:scale-110" />
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      } ${
                        row.getIsSelected()
                          ? "bg-blue-50/50 border-blue-200"
                          : ""
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="px-3 py-2 text-gray-700 text-sm"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && renderSubComponent && (
                      <TableRow>
                        <TableCell
                          colSpan={row.getVisibleCells().length}
                          className="p-0 bg-gray-50/50"
                        >
                          <div className="px-3 py-1.5 border-l-2 border-blue-500">
                            {renderSubComponent({ row })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className="h-24"
                  >
                    {renderNoResultsMessage()}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination and Selection Info */}
      <div className="flex items-center justify-between bg-white border border-gray-200 px-4 py-3">
        {enableRowSelection && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <span>
              {table.getFilteredSelectedRowModel().rows.length} de{" "}
              {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s)
            </span>
          </div>
        )}

        {/* Custom Pagination */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Mostrar</span>
              <select
                value={serverPagination?.pageSize ?? pageSize}
                onChange={(e) => {
                  const newPageSize = Number(e.target.value);
                  if (serverPagination) {
                    serverPagination.onPageChange(1, newPageSize);
                  } else {
                    setPageSize(newPageSize);
                    table.setPageSize(newPageSize);
                    setPageIndex(0);
                    table.setPageIndex(0);
                  }
                }}
                className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>por página</span>
            </div>

            {/* Page Info */}
            <div className="text-xs text-gray-600 ml-4">
              {(() => {
                const currentPage =
                  serverPagination?.currentPage ??
                  table.getState().pagination.pageIndex + 1;
                const totalPages = serverPagination
                  ? Math.ceil(
                      serverPagination.totalCount / serverPagination.pageSize,
                    )
                  : table.getPageCount();
                const totalItems =
                  serverPagination?.totalCount ??
                  table.getFilteredRowModel().rows.length;
                const startItem =
                  (currentPage - 1) * (serverPagination?.pageSize ?? pageSize) +
                  1;
                const endItem = Math.min(
                  currentPage * (serverPagination?.pageSize ?? pageSize),
                  totalItems,
                );

                return `${startItem}-${endItem} de ${totalItems} items`;
              })()}
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-1">
          {(() => {
            const currentPage =
              serverPagination?.currentPage ??
              table.getState().pagination.pageIndex + 1;
            const totalPages = serverPagination
              ? Math.ceil(
                  serverPagination.totalCount / serverPagination.pageSize,
                )
              : table.getPageCount();

            const handlePageChange = (page: number) => {
              if (serverPagination) {
                serverPagination.onPageChange(page, serverPagination.pageSize);
              } else {
                const newIndex = page - 1;
                setPageIndex(newIndex);
                table.setPageIndex(newIndex);
              }
            };

            const renderPageNumbers = () => {
              const pages = [];
              const maxVisiblePages = 5;

              if (totalPages <= maxVisiblePages) {
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                if (currentPage <= 3) {
                  for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                  }
                  pages.push("...");
                  pages.push(totalPages);
                } else if (currentPage >= totalPages - 2) {
                  pages.push(1);
                  pages.push("...");
                  for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  pages.push(1);
                  pages.push("...");
                  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                  }
                  pages.push("...");
                  pages.push(totalPages);
                }
              }

              return pages;
            };

            return (
              <>
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>

                {/* Page Numbers */}
                {renderPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      typeof page === "number" ? handlePageChange(page) : null
                    }
                    disabled={page === "..."}
                    className={`px-2 py-1 rounded-md border text-xs font-medium transition-colors duration-200 ${
                      page === currentPage
                        ? "bg-blue-500 border-blue-500 text-white"
                        : page === "..."
                          ? "border-gray-200 text-gray-400 cursor-default"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
