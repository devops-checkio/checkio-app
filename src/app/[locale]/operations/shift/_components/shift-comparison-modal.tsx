"use client";

import { Gender } from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import { RotationType } from "@/app/[locale]/mantainers/shifts/_components/shifth.dto";
import { Button } from "@/components/ui/button";
import {
  CheckOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  SearchOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { Input, Modal } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import SelectorDaySchedule from "./selector-day-schedule/index";

interface Employee {
  publicId: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  gender: Gender;
}

interface EmployeeConfiguration {
  employee: Employee;
  shiftId: string;
  dayIndex: number;
  weekIndex: number;
  isConfigured: boolean;
  includeHoliday: boolean;
  shiftName?: string;
  shiftType?: RotationType;
}

interface EmployeeComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  employeeConfigurations: EmployeeConfiguration[];
  onEmployeeSelect: (employeeIndex: number) => void;
  getEmployeeShiftData: (employeeIndex: number) => any;
  hasCustomShift: (employeeIndex: number) => boolean;
  // Props for SelectorDaySchedule
  startDate: any;
  startDateWeek: any;
  rotationType: RotationType;
  schedules: any[];
  scheduleDetails: any[];
  holidays: any[];
  setFormValue: any;
  getFormValues: any;
}

interface FilterFormValues {
  name?: string;
}

export default function EmployeeComparisonModal({
  isOpen,
  onClose,
  employees,
  employeeConfigurations,
  onEmployeeSelect,
  getEmployeeShiftData,
  hasCustomShift,
  startDate,
  startDateWeek,
  rotationType,
  schedules,
  scheduleDetails,
  holidays,
  setFormValue,
  getFormValues,
}: EmployeeComparisonModalProps) {
  const { control, watch, setValue } = useForm<FilterFormValues>({
    defaultValues: {
      name: "",
    },
  });

  const name = watch("name");
  const [selectedEmployeeIndexes, setSelectedEmployeeIndexes] = useState<
    number[]
  >([]);

  // Filter employees based on search term
  const filteredEmployees = employees.filter((employee) => {
    if (!name) return true;
    const searchTerm = name.toLowerCase();
    return (
      employee.firstName.toLowerCase().includes(searchTerm) ||
      employee.lastName.toLowerCase().includes(searchTerm) ||
      employee.documentNumber.toLowerCase().includes(searchTerm)
    );
  });

  const handleClearSearch = () => {
    setValue("name", "");
  };

  const handleSearchChange = (value: string) => {
    setValue("name", value);
  };

  const handleEmployeeSelect = (employeeIndex: number) => {
    if (selectedEmployeeIndexes.includes(employeeIndex)) {
      // Remove from selection if already selected
      setSelectedEmployeeIndexes((prev) =>
        prev.filter((i) => i !== employeeIndex)
      );
    } else {
      // Add to selection (max 2 employees)
      if (selectedEmployeeIndexes.length < 2) {
        setSelectedEmployeeIndexes((prev) => [...prev, employeeIndex]);
      } else {
        // Replace the first selected employee
        setSelectedEmployeeIndexes((prev) => [prev[1], employeeIndex]);
      }
    }
  };

  const removeEmployee = (employeeIndex: number) => {
    setSelectedEmployeeIndexes((prev) =>
      prev.filter((i) => i !== employeeIndex)
    );
  };

  const renderEmployeeComparison = () => {
    if (selectedEmployeeIndexes.length === 0) {
      return (
        <div className="flex items-center justify-center p-8 text-gray-500">
          <div className="text-center">
            <SwapOutlined className="text-4xl mb-4 text-gray-300" />
            <p>Selecciona dos empleados para comparar sus configuraciones</p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedEmployeeIndexes.map((employeeIndex, displayIndex) => {
          const employee = employees[employeeIndex];
          const config = employeeConfigurations[employeeIndex];
          const shiftData = getEmployeeShiftData(employeeIndex);
          const hasCustom = hasCustomShift(employeeIndex);

          return (
            <div
              key={employee.publicId}
              className="bg-white rounded-lg border p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      employee.gender === Gender.FEMALE
                        ? "bg-pink-100"
                        : "bg-blue-100"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        employee.gender === Gender.FEMALE
                          ? "text-pink-600"
                          : "text-blue-600"
                      }`}
                    >
                      {employee.firstName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {employee.documentNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeEmployee(employeeIndex)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                >
                  <DeleteOutlined />
                </button>
              </div>

              <div className="space-y-4">
                {/* Shift Information Summary */}
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">
                        Turno:
                      </span>
                      <span className="text-sm font-medium">
                        {shiftData?.name || "No asignado"}
                      </span>
                      {hasCustom && (
                        <SwapOutlined className="text-xs text-orange-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {config.isConfigured ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckOutlined className="text-xs" />
                          <span className="text-xs">Completado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <ClockCircleOutlined className="text-xs" />
                          <span className="text-xs">Pendiente</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Schedule Configuration */}
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    <SelectorDaySchedule
                      key={`schedule-${employee.publicId}`}
                      setValue={setFormValue}
                      getValues={getFormValues}
                      startDate={startDate}
                      startDateWeek={startDateWeek}
                      rotationType={
                        getEmployeeShiftData(employeeIndex)?.type ||
                        rotationType
                      }
                      schedules={
                        getEmployeeShiftData(employeeIndex)?.schedules ||
                        schedules ||
                        []
                      }
                      scheduleDetails={scheduleDetails || []}
                      holidays={holidays || []}
                      employeeIndex={employeeIndex}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {selectedEmployeeIndexes.length === 1 && (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <SwapOutlined className="text-2xl mb-2" />
              <p className="text-sm">Selecciona otro empleado para comparar</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      onCancel={onClose}
      title={
        <div className="flex items-center gap-3 text-lg font-semibold text-gray-800">
          <div className="p-2 bg-purple-100 rounded-lg">
            <SwapOutlined className="w-6 h-6 text-purple-600" />
          </div>
          Comparar Configuraciones de Empleados
        </div>
      }
      open={isOpen}
      width={1400}
      footer={null}
    >
      <div className="space-y-6">
        {/* Search Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="relative">
            <label htmlFor="search" className="text-sm font-medium">
              Buscar empleado
            </label>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Buscar por nombre o documento..."
              value={name}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full"
            />
            {name && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <DeleteOutlined />
              </button>
            )}
          </div>
        </div>

        {/* Comparison Section */}
        <div className="bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 p-4 border-b">
            Comparación de Configuraciones
            {selectedEmployeeIndexes.length > 0 && (
              <span className="ml-2 text-sm font-normal text-purple-600">
                • {selectedEmployeeIndexes.length} empleado
                {selectedEmployeeIndexes.length > 1 ? "s" : ""} seleccionado
                {selectedEmployeeIndexes.length > 1 ? "s" : ""}
              </span>
            )}
          </h2>
          <div className="p-4">{renderEmployeeComparison()}</div>
        </div>

        {/* Employee List Section */}
        <div className="bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 p-4 border-b">
            Empleados Disponibles
          </h2>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredEmployees.map((employee, index) => {
                const originalIndex = employees.findIndex(
                  (emp) => emp.publicId === employee.publicId
                );
                const isSelected =
                  selectedEmployeeIndexes.includes(originalIndex);
                const config = employeeConfigurations[originalIndex];
                const hasCustom = hasCustomShift(originalIndex);

                return (
                  <div
                    key={employee.publicId}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleEmployeeSelect(originalIndex)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          employee.gender === Gender.FEMALE
                            ? "bg-pink-100"
                            : "bg-blue-100"
                        }`}
                      >
                        <span
                          className={`text-xs font-medium ${
                            employee.gender === Gender.FEMALE
                              ? "text-pink-600"
                              : "text-blue-600"
                          }`}
                        >
                          {employee.firstName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {employee.firstName} {employee.lastName}
                          </h4>
                          {hasCustom && (
                            <SwapOutlined
                              className="text-xs text-orange-600"
                              title="Turno personalizado"
                            />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {employee.documentNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {config.isConfigured ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckOutlined className="text-xs" />
                            <span className="text-xs">Completado</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <ClockCircleOutlined className="text-xs" />
                            <span className="text-xs">Pendiente</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
