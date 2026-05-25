"use client";

import { EmployeeResponseDto } from "@/app/[locale]/mantainers/employees/_components/employee.dto";
import { ShiftResponseDto } from "@/app/[locale]/mantainers/shifts/_components/shifth.dto";
import { createContext, ReactNode, useContext, useState } from "react";

export enum ShiftType {
  FIRST_SHIFT = "FIRST_SHIFT",
  NEW_SHIFT = "NEW_SHIFT",
}

export enum RequestShiftType {
  EMPLOYER = "EMPLOYER",
  EMPLOYEE = "EMPLOYEE",
}
export interface FilterFormValues {
  search: string;
  documentNumber: string;
  /** Unified employee search (name or document) for assistance management */
  employeeQuery?: string;
  branchId?: string;
  jobId?: string;
  subUnit1Id?: string;
  subUnit2Id?: string;
  subUnit3Id?: string;
  subUnit4Id?: string;
  subUnit5Id?: string;
  subUnit6Id?: string;
  subUnit7Id?: string;
  subUnit8Id?: string;
  dateFilterType: string;
  dateDay?: string;
  dateMonth?: string;
  dateYear?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

interface ShiftContextType {
  // Estados principales
  selectedEmployees: EmployeeResponseDto[];
  setSelectedEmployees: (employees: EmployeeResponseDto[]) => void;
  selectedShift: ShiftResponseDto | null;
  setSelectedShift: (shift: ShiftResponseDto | null) => void;

  // Estados de UI
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isEmployeeSelectorOpen: boolean;
  setIsEmployeeSelectorOpen: (isOpen: boolean) => void;
  isModalShiftBaseOpen: boolean;
  setIsModalShiftBaseOpen: (isOpen: boolean) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  requestShiftType: RequestShiftType;
  setRequestShiftType: (type: RequestShiftType) => void;

  isFistAssignment: boolean;
  setIsFistAssignment: (isOpen: boolean) => void;
  reset: () => void;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export function ShiftProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState("assignment");
  const [isFistAssignment, setIsFistAssignment] = useState(false);
  const [requestShiftType, setRequestShiftType] = useState<RequestShiftType>(
    () => {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("requestShiftType");
        return saved ? JSON.parse(saved) : RequestShiftType.EMPLOYER;
      }
      return RequestShiftType.EMPLOYER;
    }
  );

  const reset = () => {
    // Clear session storage
    sessionStorage.removeItem("selectedEmployees");
    sessionStorage.removeItem("selectedShift");

    // Reset all state values
    setSelectedEmployees([]);
    setSelectedShift(null);
    setActiveTab("1");
    setIsEmployeeSelectorOpen(false);
    setIsModalShiftBaseOpen(false);
    setCurrentView("assignment");
    setIsFistAssignment(false);
  };

  // Inicializar estados desde sessionStorage solo al montar el provider
  const [selectedEmployees, setSelectedEmployees] = useState<
    EmployeeResponseDto[]
  >(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("selectedEmployees");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [selectedShift, setSelectedShift] = useState<ShiftResponseDto | null>(
    () => {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("selectedShift");
        return saved ? JSON.parse(saved) : null;
      }
      return null;
    }
  );

  // Función wrapper para actualizar selectedShift
  const updateSelectedShift = (shift: ShiftResponseDto | null) => {
    setSelectedShift(shift);
    if (shift) {
      sessionStorage.setItem("selectedShift", JSON.stringify(shift));
    } else {
      sessionStorage.removeItem("selectedShift");
    }
  };

  // Estados de UI
  const [activeTab, setActiveTab] = useState("1");
  const [isEmployeeSelectorOpen, setIsEmployeeSelectorOpen] = useState(false);
  const [isModalShiftBaseOpen, setIsModalShiftBaseOpen] = useState(false);

  return (
    <ShiftContext.Provider
      value={{
        selectedEmployees,
        setSelectedEmployees,
        selectedShift,
        setSelectedShift: updateSelectedShift,
        activeTab,
        setActiveTab,
        isEmployeeSelectorOpen,
        setIsEmployeeSelectorOpen,
        isModalShiftBaseOpen,
        setIsModalShiftBaseOpen,
        currentView,
        setCurrentView,
        requestShiftType,
        setRequestShiftType,
        reset,
        isFistAssignment,
        setIsFistAssignment,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (context === undefined) {
    throw new Error("useShift must be used within a ShiftProvider");
  }
  return context;
}
