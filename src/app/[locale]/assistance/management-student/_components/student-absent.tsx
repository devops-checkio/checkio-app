"use client";

import { useGetAllAssistancesAbsent } from "@/service/mantainer.service";
import { useMemo } from "react";
import { StudentTable } from "./student-table";

interface StudentAbsentProps {
  filters?: any;
  companyId?: string;
}

export default function StudentAbsent({ filters }: StudentAbsentProps) {
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

  const { data, isLoading } = useGetAllAssistancesAbsent(combinedFilters);

  return <StudentTable data={data} isLoading={isLoading} filters={filters} />;
}
