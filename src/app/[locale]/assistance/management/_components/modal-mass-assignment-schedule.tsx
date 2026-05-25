"use client";

import {
  PersonType,
  ScheduleResponseDto,
} from "@/app/[locale]/mantainers/schedules/_components/schedule.dto";
import SelectScheduleDrawer from "@/app/[locale]/mantainers/shifts/editor/[shiftId]/_components/select-schedule-drawer";
import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOModal,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { useToast } from "@/hooks/use-toast";
import { useSetAssignedAssistanceScheduleDay } from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { AssistanceResponseDto } from "../../_components/assistance.dto";

interface AssignmentItem {
  id: string;
  date: string;
  schedule: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
  employeeName: string;
  currentSchedule?: string;
  row: AssistanceResponseDto;
}

interface ModalMassAssignmentScheduleProps {
  isOpen: boolean;
  onClose: () => void;
  assistances: AssistanceResponseDto[];
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLoadingText?: string;
  cleanSelectedDays?: () => void;
}

const ModalMassAssignmentSchedule = ({
  isOpen,
  onClose,
  assistances,
  title = "Asignación Masiva",
  message = "Seleccione el horario que desea asignar a los siguientes días:",
  buttonText = "Asignar",
  buttonLoadingText = "Asignando...",
  cleanSelectedDays,
}: ModalMassAssignmentScheduleProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<ScheduleResponseDto | null>(null);
  const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false);
  const [assignmentItems, setAssignmentItems] = useState<AssignmentItem[]>([]);
  const setAssignedScheduleDay = useSetAssignedAssistanceScheduleDay();
  const selectedPersonType = useMemo(() => {
    const personTypes = new Set(
      assistances.map((a) => a.Employee.personType ?? "EMPLOYEE"),
    );
    if (personTypes.size !== 1) return null;
    return personTypes.has("STUDENT")
      ? PersonType.STUDENT
      : PersonType.EMPLOYEE;
  }, [assistances]);

  useEffect(() => {
    if (assistances.length > 0) {
      setAssignmentItems(
        assistances.map((assistance, index) => ({
          id: `day-${index}`,
          row: assistance,
          date: DateTime.fromFormat(assistance.day.toString(), "yyyy-MM-dd")
            .setLocale("es")
            .toLocaleString({
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          schedule: "Sin asignación",
          status: "pending",
          employeeName: `${assistance.Employee.firstName} ${assistance.Employee.lastName} ${assistance.Employee.secondLastName}`,
          currentSchedule: assistance.Schedule
            ? "Horario asignado"
            : "Sin horario asignado",
        }))
      );
    } else {
      setAssignmentItems([]);
    }
  }, [assistances]);

  const handleScheduleSelect = (schedule: ScheduleResponseDto) => {
    setSelectedSchedule(schedule);
  };

  const renderScheduleBadge = (text: string, isNew = false) => {
    switch (text) {
      case "Holiday":
        return (
          <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-100">
            Festivo
          </span>
        );
      case "Free":
        return (
          <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-md bg-green-50 text-green-700 border border-green-100">
            Libre
          </span>
        );
      case "Sin horario asignado":
        return (
          <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-md bg-gray-50 text-gray-600 border border-gray-100">
            Sin horario
          </span>
        );
      default:
        return (
          <span
            className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-md ${
              isNew
                ? "bg-gray-50 text-gray-600 border border-gray-100"
                : "bg-orange-50 text-orange-700 border border-orange-100"
            }`}
          >
            {text || "Pendiente"}
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string, error?: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Pendiente
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            <Loader2 className="h-3 w-3 animate-spin" />
            Procesando
          </span>
        );
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <Check className="h-3 w-3" />
            Completado
          </span>
        );
      case "error":
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
              <AlertCircle className="h-3 w-3" />
              Error
            </span>
            {error && (
              <span className="text-xs text-red-500 mt-1">{error}</span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const processAssignments = async () => {
    if (!selectedSchedule) {
      toast({
        title: "Error",
        description: "Por favor seleccione un horario",
        variant: "destructive",
      });
      return;
    }

    setIsPending(true);

    // Procesar cada asignación secuencialmente
    for (let i = 0; i < assignmentItems.length; i++) {
      const assignment = assignmentItems[i];

      // Actualizar el estado a "procesando" para el día actual
      setAssignmentItems((prev) =>
        prev.map((d, index) =>
          index === i ? { ...d, status: "processing" } : d
        )
      );

      try {
        await setAssignedScheduleDay.mutateAsync({
          assistanceId: assignment.row.publicId,
          scheduleId: selectedSchedule.publicId,
        });

        // Actualizar el estado a éxito
        setAssignmentItems((prev) =>
          prev.map((d, index) =>
            index === i
              ? { ...d, status: "success", schedule: selectedSchedule.code }
              : d
          )
        );
      } catch (error: any) {
        // Actualizar el estado a error
        setAssignmentItems((prev) =>
          prev.map((d, index) =>
            index === i
              ? {
                  ...d,
                  status: "error",
                  error:
                    error?.response?.data?.message ||
                    "Error al asignar el horario",
                }
              : d
          )
        );
      }
    }

    const successCount = assignmentItems.filter(
      (day) => day.status === "success"
    ).length;
    const errorCount = assignmentItems.filter(
      (day) => day.status === "error"
    ).length;

    if (errorCount === 0) {
      toast({
        title: "Horarios asignados",
        description: "Los horarios han sido asignados correctamente",
      });
    } else {
      toast({
        title: "Proceso completado con errores",
        description: `${successCount} horarios asignados correctamente, ${errorCount} con errores`,
        variant: "destructive",
      });
    }

    queryClient.invalidateQueries({
      queryKey: ["GetCalendar"],
    });

    setIsPending(false);
    cleanSelectedDays?.();
  };

  return (
    <>
      <CHEKIOModal
        isOpen={isOpen}
        onClose={isPending ? () => {} : onClose}
        title={title || "Asignar Horarios"}
        size="lg"
      >
        <div className="space-y-6 py-4">
          <p className="text-gray-700 flex items-center gap-3 text-lg">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            {message}
          </p>

          <div className="space-y-2 mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Seleccionar Horario
            </label>
            <div className="flex items-center gap-2">
              <CHEKIOInput
                type="text"
                readOnly
                value={selectedSchedule?.code || ""}
                placeholder="Seleccione un horario"
                className="flex-1"
              />
              <CHEKIOButton
                variant="primary"
                onClick={() => setIsScheduleDrawerOpen(true)}
                disabled={!selectedPersonType}
              >
                Seleccionar
              </CHEKIOButton>
            </div>
            {!selectedPersonType && (
              <p className="text-red-500 text-xs mt-1">
                Selecciona asistencias de un mismo tipo (empleado o estudiante)
                para asignar horarios masivamente.
              </p>
            )}
            {!selectedSchedule && (
              <p className="text-red-500 text-xs mt-1">
                Por favor seleccione un horario
              </p>
            )}
          </div>

          <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <CHEKIOTable>
              <CHEKIOTableHeader>
                <tr>
                  <CHEKIOTableHead>Fecha</CHEKIOTableHead>
                  <CHEKIOTableHead>Empleado</CHEKIOTableHead>
                  <CHEKIOTableHead>Horario Actual</CHEKIOTableHead>
                  <CHEKIOTableHead>Nuevo Horario</CHEKIOTableHead>
                  <CHEKIOTableHead>Estado</CHEKIOTableHead>
                </tr>
              </CHEKIOTableHeader>
              <CHEKIOTableBody>
                {assignmentItems.map((assignment, index) => {
                  const date = DateTime.fromObject({
                    day: assignment.row.day,
                    month: assignment.row.month,
                    year: assignment.row.year,
                  }).toFormat("dd/MM/yyyy");

                  return (
                    <CHEKIOTableRow key={assignment.id} index={index}>
                      <CHEKIOTableCell>{date}</CHEKIOTableCell>
                      <CHEKIOTableCell className="font-medium">
                        {assignment.employeeName}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {renderScheduleBadge(assignment.currentSchedule || "")}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {renderScheduleBadge(assignment.schedule, true)}
                      </CHEKIOTableCell>
                      <CHEKIOTableCell>
                        {renderStatusBadge(assignment.status, assignment.error)}
                      </CHEKIOTableCell>
                    </CHEKIOTableRow>
                  );
                })}
              </CHEKIOTableBody>
            </CHEKIOTable>
          </div>

          <div className="flex justify-end gap-4">
            <CHEKIOButton
              variant="secondaryBlue"
              onClick={onClose}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
              Cancelar
            </CHEKIOButton>
            <CHEKIOButton
              variant="primary"
              disabled={isPending || !selectedSchedule || !selectedPersonType}
              onClick={processAssignments}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {buttonLoadingText}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {buttonText}
                </>
              )}
            </CHEKIOButton>
          </div>
        </div>
      </CHEKIOModal>

      <SelectScheduleDrawer
        isOpen={isScheduleDrawerOpen}
        onClose={() => setIsScheduleDrawerOpen(false)}
        onSelect={handleScheduleSelect}
        personType={selectedPersonType ?? undefined}
      />
    </>
  );
};

export default ModalMassAssignmentSchedule;
