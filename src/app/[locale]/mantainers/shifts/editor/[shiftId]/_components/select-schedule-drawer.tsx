"use client";

import ScheduleModalUpsert from "@/app/[locale]/mantainers/schedules/_components/schedule-modal-upsert";
import {
  PersonType,
  ScheduleResponseDto,
} from "@/app/[locale]/mantainers/schedules/_components/schedule.dto";
import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOLoading,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { PaginationFilterDto } from "@/dto/pagination";
import { useGetSchedules } from "@/service/schedule.service";
import { ChevronLeft, ChevronRight, Clock, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

interface SelectScheduleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (schedule: ScheduleResponseDto) => void;
  companyIds?: string[];
  personType?: PersonType;
  /** Si devuelve texto, el horario no se puede elegir (ej. traslape). */
  getScheduleSelectBlockReason?: (
    schedule: ScheduleResponseDto,
  ) => string | null;
}

export default function SelectScheduleDrawer({
  isOpen,
  onClose,
  onSelect,
  companyIds = [],
  personType = PersonType.EMPLOYEE,
  getScheduleSelectBlockReason,
}: SelectScheduleDrawerProps) {
  const t = useTranslations("mantainers.shifts");
  const tSelect = useTranslations("mantainers.shifts.editor.selectSchedule");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [publicId, setPublicId] = useState("");
  const [pagination, setPagination] = useState<PaginationFilterDto>({
    current: 1,
    pageSize: 20,
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
      personType,
    },
    {
      includeBreaks: true,
      companyIds: companyIds.length > 0 ? companyIds : undefined,
    },
  );

  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
      }));
    },
    [],
  );

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: newPageSize,
      current: 1, // Reset to first page when changing page size
    }));
  }, []);

  const handleClearSearch = () => {
    setSearchTerm("");
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleSelect = (schedule: ScheduleResponseDto) => {
    if (getScheduleSelectBlockReason?.(schedule)) return;
    onSelect(schedule);
    onClose();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPublicId("");
  };

  const paginationData = schedules?.pagination || pagination;
  const totalPages = Math.ceil(
    (paginationData.totalCount || 0) / pagination.pageSize,
  );

  return (
    <>
      <CHEKIOModal
        isOpen={isOpen}
        onClose={onClose}
        title={tSelect("title")}
        size="6xl"
      >
        <div
          className="flex flex-col gap-4"
          data-tour="shifts-editor-schedule-drawer"
        >
          <div className="relative flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <CHEKIOInput
                placeholder={tSelect("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <CHEKIOLoading
                size="lg"
                variant="modern"
                text={tSelect("loading")}
              />
            </div>
          ) : schedules?.data && schedules.data.length > 0 ? (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {schedules.data.map((schedule) => {
                    const selectBlockReason =
                      getScheduleSelectBlockReason?.(schedule) ?? null;
                    return (
                    <div
                      key={schedule.publicId}
                      className="w-full border-2 border-gray-300 p-3 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="space-y-2 text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{tSelect("schedule")}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <h4 className="text-sm font-medium text-gray-900">
                            {schedule.code}
                          </h4>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 p-2">
                            <span className="text-xs font-medium">
                              {schedule.name}
                            </span>
                          </div>

                          <div className="text-[10px] text-gray-500">
                            {tSelect("total", {
                              hours: schedule.workHours,
                              minutes: schedule.workMinutes,
                            })}
                          </div>

                          <div className="flex items-center justify-center gap-2 pt-2">
                            <CHEKIOButton
                              variant="primary"
                              disabled={!!selectBlockReason}
                              title={selectBlockReason ?? undefined}
                              onClick={() => handleSelect(schedule)}
                              className="flex-1"
                            >
                              {t("buttons.select")}
                            </CHEKIOButton>
                            <CHEKIOButton
                              variant="secondaryBlue"
                              onClick={() => {
                                setIsModalOpen(true);
                                setPublicId(schedule.publicId);
                              }}
                            >
                              {t("buttons.view")}
                            </CHEKIOButton>
                          </div>
                          {selectBlockReason && (
                            <p className="text-[10px] text-red-600 leading-snug px-1">
                              {selectBlockReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>

              {/* Paginación manual */}
              <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {tSelect("pagination.showing", {
                      current: schedules.data.length,
                      total: paginationData.totalCount,
                    })}
                  </div>
                  {/* Selector de registros por página */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Registros por página:
                    </label>
                    <CHEKIOSelect
                      value={pagination.pageSize.toString()}
                      onValueChange={(value) => {
                        handlePageSizeChange(parseInt(value, 10));
                      }}
                    >
                      <CHEKIOSelectTrigger className="w-24">
                        <CHEKIOSelectValue />
                      </CHEKIOSelectTrigger>
                      <CHEKIOSelectContent>
                        <CHEKIOSelectItem value="10">10</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="20">20</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="50">50</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="100">100</CHEKIOSelectItem>
                        <CHEKIOSelectItem value="200">200</CHEKIOSelectItem>
                      </CHEKIOSelectContent>
                    </CHEKIOSelect>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() =>
                      handlePaginationChange(
                        pagination.current - 1,
                        pagination.pageSize,
                      )
                    }
                    disabled={pagination.current === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("buttons.previous")}
                  </CHEKIOButton>
                  <div className="px-4 py-2 border bg-white text-sm text-gray-700">
                    {t("pagination.page", {
                      current: pagination.current,
                      total: totalPages,
                    })}
                  </div>
                  <CHEKIOButton
                    variant="secondaryBlue"
                    onClick={() =>
                      handlePaginationChange(
                        pagination.current + 1,
                        pagination.pageSize,
                      )
                    }
                    disabled={pagination.current >= totalPages}
                  >
                    {t("buttons.next")}
                    <ChevronRight className="h-4 w-4" />
                  </CHEKIOButton>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-600 font-medium">{tSelect("noData")}</p>
            </div>
          )}
        </div>
      </CHEKIOModal>
      {isModalOpen && (
        <ScheduleModalUpsert
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          publicId={publicId}
          onSuccess={() => {}}
          isPreview={true}
        />
      )}
    </>
  );
}
