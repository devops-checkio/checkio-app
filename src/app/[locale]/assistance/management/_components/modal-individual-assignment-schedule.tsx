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
} from "@/components";
import { useToast } from "@/hooks/use-toast";
import { useSetAssignedAssistanceScheduleDay } from "@/service/mantainer.service";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { AssistanceResponseDto } from "../../_components/assistance.dto";
import { isAssistanceDayEditable } from "../_utils/assistance-date-lock";

interface ModalIndividualAssignmentScheduleProps {
  isOpen: boolean;
  onClose: () => void;
  assistance: AssistanceResponseDto;
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLoadingText?: string;
  onSuccess?: () => void;
}

const ModalIndividualAssignmentSchedule = ({
  isOpen,
  onClose,
  assistance,
  title = "Actualizar Horario",
  message = "Seleccione el nuevo horario para este empleado:",
  buttonText = "Actualizar",
  buttonLoadingText = "Actualizando...",
  onSuccess,
}: ModalIndividualAssignmentScheduleProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const isEditableByDate = isAssistanceDayEditable(assistance);
  const [selectedSchedule, setSelectedSchedule] =
    useState<ScheduleResponseDto | null>(null);
  const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false);
  const selectedPersonType =
    assistance.Employee.personType === "STUDENT"
      ? PersonType.STUDENT
      : PersonType.EMPLOYEE;
  const setAssignedScheduleDay = useSetAssignedAssistanceScheduleDay();

  const handleScheduleSelect = (schedule: ScheduleResponseDto) => {
    setSelectedSchedule(schedule);
  };

  const processAssignment = async () => {
    if (!isEditableByDate) {
      toast({
        title: "Acción no permitida",
        description: "Solo puedes actualizar horarios de días anteriores a hoy.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSchedule) {
      toast({
        title: "Error",
        description: "Por favor seleccione un horario",
        variant: "destructive",
      });
      return;
    }

    setIsPending(true);

    try {
      await setAssignedScheduleDay.mutateAsync({
        assistanceId: assistance.publicId,
        scheduleId: selectedSchedule.publicId,
      });

      toast({
        title: "Horario actualizado",
        description: "El horario ha sido actualizado correctamente",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["GetAllAssistancesAbsent"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetAllAssistancesIncomplete"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetAllAssistancesWithoutSchedule"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetAllAssistancesCompleted"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetAssistanceCount"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GetCalendar"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["GetAssistance", assistance.publicId],
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Error al actualizar el horario",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const getCurrentScheduleDisplay = () => {
    if (!assistance.Schedule) {
      return (
        <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-md bg-gray-50 text-gray-600 border border-gray-100">
          Sin horario asignado
        </span>
      );
    }

    return (
      <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-md bg-orange-50 text-orange-700 border border-orange-100">
        {assistance.Schedule.name || "Horario asignado"}
      </span>
    );
  };

  const getNewScheduleDisplay = () => {
    if (!selectedSchedule) {
      return (
        <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-md bg-gray-50 text-gray-600 border border-gray-100">
          Pendiente
        </span>
      );
    }

    return (
      <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-md bg-green-50 text-green-700 border border-green-100">
        {selectedSchedule.code}
      </span>
    );
  };

  return (
    <>
      <CHEKIOModal
        isOpen={isOpen}
        onClose={isPending ? () => {} : onClose}
        title={title || "Asignar Horario"}
        size="md"
      >
        <div className="space-y-6 py-4">
          <p className="text-gray-700 flex items-center gap-3 text-lg">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            {message}
          </p>

          {/* Employee Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">
              Información del Empleado
            </h4>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-500">Nombre:</span>
                <span className="ml-2 font-medium">
                  {assistance.Employee.firstName} {assistance.Employee.lastName}{" "}
                  {assistance.Employee.secondLastName}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Documento:</span>
                <span className="ml-2 font-medium">
                  {assistance.Employee.documentNumber}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Fecha:</span>
                <span className="ml-2 font-medium">
                  {DateTime.fromObject({
                    day: assistance.day,
                    month: assistance.month,
                    year: assistance.year,
                  }).toFormat("dd/MM/yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-3">
              Información de Horarios
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Horario Actual:</span>
                {getCurrentScheduleDisplay()}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Nuevo Horario:</span>
                {getNewScheduleDisplay()}
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Seleccionar Nuevo Horario
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
              disabled={!isEditableByDate || isPending}
              >
                Seleccionar
              </CHEKIOButton>
            </div>
            {!selectedSchedule && (
              <p className="text-red-500 text-xs mt-1">
                Por favor seleccione un horario
              </p>
            )}
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
              disabled={isPending || !selectedSchedule || !isEditableByDate}
              onClick={processAssignment}
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
        personType={selectedPersonType}
      />
    </>
  );
};

export default ModalIndividualAssignmentSchedule;
