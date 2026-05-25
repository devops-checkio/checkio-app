"use client";

import { ScheduleResponseDto } from "@/app/[locale]/mantainers/schedules/_components/schedule.dto";
import { Button } from "@/components/ui/button";
import { PaginationFilterDto } from "@/dto/pagination";
import { useGetSchedules } from "@/service/schedule.service";
import {
  ClockCircleOutlined,
  LoadingOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Drawer, Input, Pagination } from "antd";
import { DateTime } from "luxon";
import { useState } from "react";

interface SelectShiftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (schedule: ScheduleResponseDto) => void;
  employeeName?: string;
}

export default function SelectShiftDrawer({
  isOpen,
  onClose,
  onSelect,
  employeeName,
}: SelectShiftDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 10,
    next: null,
    previous: null,
    totalPages: 1,
    totalCount: 0,
    sort: "asc" as "asc" | "desc",
  });

  const { data: schedules, isLoading } = useGetSchedules(
    {
      page: pagination.current,
      pageSize: pagination.pageSize,
      sort: pagination.sort,
      code: searchTerm,
    },
    {
      includeBreaks: true,
    }
  );

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize: pageSize,
    }));
  };

  const handleSelect = (schedule: ScheduleResponseDto) => {
    onSelect(schedule);
    onClose();
  };

  return (
    <Drawer
      title={`Seleccionar Turno ${employeeName ? `- ${employeeName}` : ""}`}
      open={isOpen}
      onClose={onClose}
      width={500}
    >
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Buscar por nombre o código"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <LoadingOutlined className="text-2xl" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {schedules?.data.map((schedule) => (
                  <div
                    key={schedule.publicId}
                    className="w-full rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <h4 className="text-sm font-medium text-gray-900">
                          {schedule.name}
                        </h4>
                      </div>

                      <div className="text-xs text-gray-500">
                        Código: {schedule.code}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1 text-gray-600">
                          <ClockCircleOutlined className="h-3 w-3" />
                          <span className="text-xs">Horario:</span>
                        </div>

                        <div className="flex items-center justify-center gap-2 bg-blue-50 rounded-md p-1.5">
                          <span className="text-xs font-medium">
                            {DateTime.fromISO(schedule.startTime)
                              .toUTC()
                              .toFormat("HH:mm")}
                          </span>
                          <span className="text-xs text-gray-500">hasta</span>
                          <span className="text-xs font-medium">
                            {DateTime.fromISO(schedule.startTime)
                              .toUTC()
                              .plus({
                                hours: schedule.workHours,
                                minutes: schedule.workMinutes || 0,
                              })
                              .toFormat("HH:mm")}
                          </span>
                        </div>

                        <Button
                          className="mt-2"
                          size="sm"
                          onClick={() => handleSelect(schedule)}
                        >
                          Seleccionar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Pagination
              align="center"
              showSizeChanger
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={schedules?.pagination.totalCount}
              onChange={handlePaginationChange}
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} de ${total} registros`
              }
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </>
        )}
      </div>
    </Drawer>
  );
}
