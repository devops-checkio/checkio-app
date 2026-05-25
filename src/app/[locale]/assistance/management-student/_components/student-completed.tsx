"use client";

import { useGetAllAssistancesCompleted } from "@/service/mantainer.service";
import { useMemo } from "react";
import { StudentTable } from "./student-table";

interface StudentCompletedProps {
  filters?: any;
}

export default function StudentCompleted({ filters }: StudentCompletedProps) {
  const combinedFilters = useMemo(
    () => ({
      page: 1,
      pageSize: 10,
      sort: "asc" as const,
      ...filters,
      personType: "STUDENT",
    }),
    [filters],
  );

  const { data, isLoading } = useGetAllAssistancesCompleted(combinedFilters);

  return <StudentTable data={data} isLoading={isLoading} filters={filters} />;
}
