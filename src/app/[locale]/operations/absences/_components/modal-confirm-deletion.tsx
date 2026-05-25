"use client";

import { useToast } from "@/hooks/use-toast";
import { useDeleteAbsence } from "@/service/mantainer.service";
import {
  CloseCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { AbsenceResponseDto } from "./absence.dto";

interface DeletionItem {
  id: string;
  publicId: string;
  employee: string;
  absenceType: string;
  startDate: string;
  endDate: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

interface ModalConfirmDeletionProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAbsences: AbsenceResponseDto[];
  title?: string;
  message?: string;
  buttonText?: string;
  buttonLoadingText?: string;
  cleanSelectedAbsences?: () => void;
}

const ModalConfirmDeletion = ({
  isOpen,
  onClose,
  selectedAbsences,
  title = "Confirmar Eliminación",
  message = "¿Está seguro de que desea eliminar las siguientes ausencias?",
  buttonText = "Eliminar",
  buttonLoadingText = "Eliminando...",
  cleanSelectedAbsences,
}: ModalConfirmDeletionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [deletionItems, setDeletionItems] = useState<DeletionItem[]>([]);
  const deleteAbsence = useDeleteAbsence();

  useEffect(() => {
    if (selectedAbsences.length > 0) {
      setDeletionItems(
        selectedAbsences.map((absence) => ({
          id: `absence-${absence.publicId}`,
          publicId: absence.publicId,
          employee: absence.employee
            ? `${absence.employee.firstName} ${absence.employee.lastName}`
            : "N/A",
          absenceType: absence.absenceType?.name || "N/A",
          startDate: DateTime.fromISO(absence.startDate.toString())
            .setLocale("es")
            .toLocaleString({
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          endDate: DateTime.fromISO(absence.endDate.toString())
            .setLocale("es")
            .toLocaleString({
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          status: "pending",
        }))
      );
    } else {
      setDeletionItems([]);
    }
  }, [selectedAbsences]);

  const columns: ColumnsType<DeletionItem> = [
    {
      title: "Empleado",
      dataIndex: "employee",
      key: "employee",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Tipo de Ausencia",
      dataIndex: "absenceType",
      key: "absenceType",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Fecha Inicio",
      dataIndex: "startDate",
      key: "startDate",
    },
    {
      title: "Fecha Fin",
      dataIndex: "endDate",
      key: "endDate",
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
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
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Procesando
              </span>
            );
          case "success":
            return (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Completado
              </span>
            );
          case "error":
            return (
              <div className="flex flex-col">
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    ></path>
                  </svg>
                  Error
                </span>
                {record.error && (
                  <span className="text-xs text-red-500 mt-1">
                    {record.error}
                  </span>
                )}
              </div>
            );
          default:
            return null;
        }
      },
    },
  ];

  const processDeletions = async () => {
    setIsPending(true);

    // Procesar cada eliminación secuencialmente
    for (let i = 0; i < deletionItems.length; i++) {
      const item = deletionItems[i];

      // Actualizar el estado a "procesando" para la ausencia actual
      setDeletionItems((prev) =>
        prev.map((d, index) =>
          index === i ? { ...d, status: "processing" } : d
        )
      );

      try {
        await deleteAbsence.mutateAsync(item.publicId);

        // Actualizar el estado a éxito
        setDeletionItems((prev) =>
          prev.map((d, index) =>
            index === i ? { ...d, status: "success" } : d
          )
        );

        // Pequeña pausa para mejor visualización del proceso
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error: any) {
        // Actualizar el estado a error
        setDeletionItems((prev) =>
          prev.map((d, index) =>
            index === i
              ? {
                  ...d,
                  status: "error",
                  error:
                    error?.response?.data?.message ||
                    "Error al eliminar la ausencia",
                }
              : d
          )
        );
      }
    }

    const successCount = deletionItems.filter(
      (item) => item.status === "success"
    ).length;
    const errorCount = deletionItems.filter(
      (item) => item.status === "error"
    ).length;

    if (errorCount === 0) {
      toast({
        title: "Ausencias eliminadas",
        description: "Las ausencias han sido eliminadas correctamente",
      });
    } else {
      toast({
        title: "Proceso completado con errores",
        description: `${successCount} ausencias eliminadas correctamente, ${errorCount} con errores`,
        variant: "destructive",
      });
    }

    // Invalidar consultas para actualizar los datos
    queryClient.invalidateQueries({
      queryKey: ["GetAbsences"],
    });

    setIsPending(false);
    cleanSelectedAbsences?.();
  };

  const renderSummary = () => {
    if (
      !isPending &&
      !deletionItems.some((d) => d.status === "success" || d.status === "error")
    )
      return null;

    const pending = deletionItems.filter(
      (item) => item.status === "pending"
    ).length;
    const processing = deletionItems.filter(
      (item) => item.status === "processing"
    ).length;
    const success = deletionItems.filter(
      (item) => item.status === "success"
    ).length;
    const error = deletionItems.filter(
      (item) => item.status === "error"
    ).length;
    const completed = success + error;
    const total = deletionItems.length;
    const progressPercentage = Math.round((completed / total) * 100) || 0;

    return (
      <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="mb-2 flex justify-between items-center">
          <h4 className="font-medium">Progreso: {progressPercentage}%</h4>
          <div className="text-sm text-gray-500">
            {completed} de {total} completados
          </div>
        </div>

        <div className="w-full bg-gray-200 h-2 rounded-full mb-3">
          <div
            className={`h-2 rounded-full ${
              error > 0
                ? "bg-gradient-to-r from-green-500 to-red-500"
                : "bg-green-500"
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span className="text-sm">Pendientes: {pending}</span>
          </div>
          {processing > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-300 rounded-full animate-pulse"></div>
              <span className="text-sm">Procesando: {processing}</span>
            </div>
          )}
          {success > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm">Completados: {success}</span>
            </div>
          )}
          {error > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-sm">Errores: {error}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 text-lg font-semibold text-red-800">
          <div className="p-2 bg-red-100 rounded-lg">
            <DeleteOutlined className="text-xl text-red-600" />
          </div>
          <span>{title}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={700}
      className="animate-fadeIn"
      maskClosable={!isPending}
      closable={!isPending}
      centered
    >
      <div className="space-y-4 py-4">
        <p className="text-gray-700 flex items-center gap-3 text-lg border-l-4 border-red-500 pl-3 py-1">
          <ExclamationCircleOutlined className="text-red-500 text-xl" />
          {message}
        </p>

        <div className="border rounded-lg overflow-hidden shadow-sm">
          <Table
            columns={columns}
            dataSource={deletionItems}
            pagination={false}
            rowKey="id"
            size="small"
            className="max-h-64 overflow-y-auto"
          />
        </div>

        {renderSummary()}

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CloseCircleOutlined />
            Cancelar
          </button>
          <button
            type="button"
            disabled={isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            onClick={processDeletions}
          >
            {isPending ? (
              <>
                <LoadingOutlined spin />
                {buttonLoadingText}
              </>
            ) : (
              <>
                <DeleteOutlined />
                {buttonText}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalConfirmDeletion;
