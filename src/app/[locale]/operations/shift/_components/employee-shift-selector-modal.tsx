"use client";

import { RotationType } from "@/app/[locale]/mantainers/shifts/_components/shifth.dto";
import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOModal,
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
} from "@/components";
import { Badge } from "@/components/ui/badge";
import { useCookieSession } from "@/context/useCookieSession";
import { useGetShifts } from "@/service/shift.service";
import { Check, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

interface EmployeeShiftSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftSelect: (shift: any) => void;
  employeeName: string;
  currentShiftId?: string;
}

interface FilterFormValues {
  name?: string;
  type?: RotationType;
}

export default function EmployeeShiftSelectorModal({
  isOpen,
  onClose,
  onShiftSelect,
  employeeName,
  currentShiftId,
}: EmployeeShiftSelectorModalProps) {
  const { companyId } = useCookieSession();
  const { control, watch, setValue, handleSubmit } = useForm<FilterFormValues>({
    defaultValues: {
      name: "",
    },
  });

  const type = watch("type");
  const name = watch("name");
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [searchParams, setSearchParams] = useState<{
    name?: string;
    type?: RotationType;
    page?: number;
    pageSize?: number;
    sort?: "desc" | "asc";
    companyId?: string;
  }>({
    name: "",
    type: undefined,
    page: 1,
    pageSize: 10,
    sort: "desc",
    companyId: companyId ?? undefined,
  });

  // Update search params when form values change
  useEffect(() => {
    setSearchParams({
      name: name || "",
      type: type,
      page: 1,
      pageSize: 10,
      sort: "desc",
      companyId: companyId ?? undefined,
    });
  }, [name, type, companyId]);

  const handleClearSearch = () => {
    setValue("name", "");
  };

  const handleSearchChange = (value: string) => {
    setValue("name", value);
  };

  const handleShiftSelect = (shift: any) => {
    setSelectedShift(shift);
  };

  const handleConfirm = () => {
    if (selectedShift) {
      onShiftSelect(selectedShift);
      onClose();
    }
  };

  const { data: shiftsData, isLoading } = useGetShifts(searchParams);
  const shiftsList = shiftsData?.data || [];
  const pagination = shiftsData?.pagination || {
    current: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ ...searchParams, page: newPage });
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Seleccionar Turno para ${employeeName}`}
      size="5xl"
    >
      <form onSubmit={handleSubmit(handleConfirm)}>
        <div className="space-y-6">
          {/* Search and Filter Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Buscar por nombre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <CHEKIOInput
                        {...field}
                        placeholder="Buscar por nombre"
                        className="pl-10"
                      />
                    )}
                  />
                  {name && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de rotación
                </label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <CHEKIOSelect
                      value={field.value || "ALL"}
                      onValueChange={(value) =>
                        field.onChange(value === "ALL" ? undefined : value)
                      }
                    >
                      <CHEKIOSelectTrigger>
                        <CHEKIOSelectValue placeholder="Seleccione tipo" />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        <CHEKIOSelectItem value="ALL">Todos</CHEKIOSelectItem>
                        <CHEKIOSelectItem value={RotationType.WEEKLY}>
                          Rotativo Semanal
                        </CHEKIOSelectItem>
                        <CHEKIOSelectItem value={RotationType.DAILY}>
                          Rotativo por Días
                        </CHEKIOSelectItem>
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Shifts Table Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Turnos Disponibles
              {selectedShift && (
                <span className="ml-2 text-sm font-normal text-blue-600">
                  • Turno seleccionado: {selectedShift.name}
                </span>
              )}
            </h2>

            {isLoading ? (
              <>
                <div className="border border-gray-200 overflow-hidden">
                  <CHEKIOTable>
                    <CHEKIOTableHeader>
                      <tr>
                        <CHEKIOTableHead>Nombre</CHEKIOTableHead>
                        <CHEKIOTableHead>Tipo</CHEKIOTableHead>
                        <CHEKIOTableHead>Días</CHEKIOTableHead>
                        <CHEKIOTableHead>Semanas</CHEKIOTableHead>
                        <CHEKIOTableHead>Nomenclatura</CHEKIOTableHead>
                        <CHEKIOTableHead>Acciones</CHEKIOTableHead>
                      </tr>
                    </CHEKIOTableHeader>
                    <CHEKIOTableBody>
                      {Array.from({ length: searchParams.pageSize ?? 10 }).map(
                        (_, index) => (
                          <CHEKIOTableRow key={index} index={index}>
                            <CHEKIOTableCell>
                              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              <div className="h-5 w-24 animate-pulse rounded-full bg-gray-200" />
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              <div className="h-9 w-24 animate-pulse rounded bg-gray-200" />
                            </CHEKIOTableCell>
                          </CHEKIOTableRow>
                        )
                      )}
                    </CHEKIOTableBody>
                  </CHEKIOTable>
                </div>
                <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
                    <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-200" />
                    <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
                  </div>
                </div>
              </>
            ) : shiftsList.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-600 font-medium">
                  No se encontraron turnos
                </p>
              </div>
            ) : (
              <>
                <div className="border border-gray-200 overflow-hidden">
                  <CHEKIOTable>
                    <CHEKIOTableHeader>
                      <tr>
                        <CHEKIOTableHead>Nombre</CHEKIOTableHead>
                        <CHEKIOTableHead>Tipo</CHEKIOTableHead>
                        <CHEKIOTableHead>Días</CHEKIOTableHead>
                        <CHEKIOTableHead>Semanas</CHEKIOTableHead>
                        <CHEKIOTableHead>Nomenclatura</CHEKIOTableHead>
                        <CHEKIOTableHead>Acciones</CHEKIOTableHead>
                      </tr>
                    </CHEKIOTableHeader>
                    <CHEKIOTableBody>
                      {shiftsList.map((shift: any, index: number) => {
                        const isSelected =
                          selectedShift?.publicId === shift.publicId;
                        const isCurrentShift =
                          currentShiftId === shift.publicId;

                        return (
                          <CHEKIOTableRow key={shift.publicId} index={index}>
                            <CHEKIOTableCell className="font-medium">
                              {shift.name}
                              {isCurrentShift && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 bg-blue-100 text-blue-800 border-blue-300"
                                >
                                  Actual
                                </Badge>
                              )}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              <Badge
                                variant="outline"
                                className={
                                  shift.type === RotationType.WEEKLY
                                    ? "bg-blue-100 text-blue-800 border-blue-300"
                                    : "bg-green-100 text-green-800 border-green-300"
                                }
                              >
                                {shift.type === RotationType.WEEKLY
                                  ? "Rotativo Semanal"
                                  : "Rotativo por Días"}
                              </Badge>
                            </CHEKIOTableCell>
                            <CHEKIOTableCell className="font-medium">
                              {shift.days || "-"}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell className="font-medium">
                              {shift.weeks || "-"}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell className="text-gray-600 text-sm">
                              {shift.nomenclature || "-"}
                            </CHEKIOTableCell>
                            <CHEKIOTableCell>
                              <div className="flex items-center justify-center">
                                {isSelected ? (
                                  <button
                                    type="button"
                                    onClick={() => handleShiftSelect(shift)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                                    title="Turno seleccionado"
                                    aria-label="Turno seleccionado"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <CHEKIOButton
                                    variant="secondaryBlue"
                                    onClick={() => handleShiftSelect(shift)}
                                    className="h-auto px-3 py-1.5 text-sm"
                                  >
                                    <Check className="h-4 w-4" />
                                    Seleccionar
                                  </CHEKIOButton>
                                )}
                              </div>
                            </CHEKIOTableCell>
                          </CHEKIOTableRow>
                        );
                      })}
                    </CHEKIOTableBody>
                  </CHEKIOTable>
                </div>

                <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {shiftsList.length} de {pagination.totalCount}{" "}
                    resultados
                  </div>
                  <div className="flex items-center gap-2">
                    <CHEKIOButton
                      variant="secondaryBlue"
                      onClick={() => handlePageChange(pagination.current - 1)}
                      disabled={pagination.current === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </CHEKIOButton>
                    <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                      Página {pagination.current} de {pagination.totalPages}
                    </div>
                    <CHEKIOButton
                      variant="secondaryBlue"
                      onClick={() => handlePageChange(pagination.current + 1)}
                      disabled={pagination.current >= pagination.totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </CHEKIOButton>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <CHEKIOButton variant="secondary" onClick={onClose}>
            <X className="h-4 w-4" />
            Cancelar
          </CHEKIOButton>
          {selectedShift && (
            <CHEKIOButton variant="primary" type="submit">
              <Check className="h-4 w-4" />
              Confirmar
            </CHEKIOButton>
          )}
        </div>
      </form>
    </CHEKIOModal>
  );
}
