"use client";

import { PaginationFilterDto } from "@/dto/pagination";
import { useToast } from "@/hooks/use-toast";
import { HeaderMapping, generateExcel } from "@/utils/excel";
import { DownloadOutlined } from "@ant-design/icons";
import { UseQueryResult } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIOButton } from "../template/checkIO-button";
import { DataTable } from "./table-generic";

interface TablePaginatedProps<T, R, K> {
  columns: any[];
  queryFn: (params: R, body?: any) => UseQueryResult<K, Error>;
  rowKey?: string;
  refetchTrigger?: number;
  enableRowSelection?: boolean;
  params?: R;
  body?: any;
  onSelectedRowsChange?: (selectedRows: T[]) => void;
  actions?: React.ReactNode;
  excelConfig?: {
    headers: HeaderMapping[];
    filename: string;
    sheetName?: string;
  };
}

export function TablePaginated<
  T extends { publicId: string },
  R extends { page?: number; pageSize?: number; sort?: "asc" | "desc" },
  K extends { pagination: PaginationFilterDto; data: T[] }
>({
  columns,
  queryFn,
  rowKey = "id",
  refetchTrigger,
  enableRowSelection,
  onSelectedRowsChange,
  params,
  body,
  actions,
  excelConfig,
}: TablePaginatedProps<T, R, K>) {
  const { toast } = useToast();
  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "desc",
  });
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [isExcelGenerated, setIsExcelGenerated] = useState(false);

  const isInitialMount = useRef(true);

  const { data, isLoading, refetch } = queryFn(
    {
      ...params,
      page: pagination.current,
      pageSize: pagination.pageSize,
      sort: pagination.sort,
    } as R,
    body
  );

  useEffect(() => {
    if (data?.pagination) {
      setPagination(data.pagination);
    }
  }, [data]);

  useEffect(() => {
    if (refetchTrigger) {
      refetch();
    }
  }, [refetchTrigger, refetch]);

  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
      }));
    },
    []
  );

  const handleDownloadExcel = async () => {
    if (!excelConfig || !data?.data) return;

    try {
      setIsGeneratingExcel(true);
      await generateExcel(
        data.data,
        excelConfig.headers,
        excelConfig.filename,
        excelConfig.sheetName
      );
      setIsExcelGenerated(true);
      toast({
        title: "Excel generado exitosamente",
        variant: "default",
      });
      // Reset the generated state after 2 seconds
      setTimeout(() => {
        setIsExcelGenerated(false);
      }, 2000);
    } catch (error) {
      console.error("Error downloading excel:", error);
      toast({
        title: "Error al generar el Excel",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const excelButton = excelConfig && (
    <CheckIOButton
      label={
        isGeneratingExcel
          ? "Generando..."
          : isExcelGenerated
          ? "Generado"
          : "Descargar Excel"
      }
      icon={<DownloadOutlined />}
      onClick={handleDownloadExcel}
      disabled={isGeneratingExcel}
      color={isExcelGenerated ? "excel" : "default"}
    />
  );

  return (
    <div className={`flex flex-col ${actions ? "gap-4" : ""}`}>
      <div className="flex justify-end gap-2 mb-4">
        {excelButton}
        {actions}
      </div>
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        enableRowSelection={enableRowSelection}
        onSelectedRowsChange={onSelectedRowsChange}
        noResultsMessage="No hay resultados."
        filterPlaceholder="Filtrar..."
        serverPagination={{
          totalCount: pagination.totalCount,
          currentPage: pagination.current,
          pageSize: pagination.pageSize,
          onPageChange: handlePaginationChange,
        }}
        queryKey={[]}
      />
    </div>
  );
}
