"use client";

import { useGetAllAssistancesIncomplete } from "@/service/mantainer.service";
import { useMemo } from "react";
import { StudentTable } from "./student-table";

interface StudentIncompleteProps {
  filters?: any;
}

export default function StudentIncomplete({ filters }: StudentIncompleteProps) {
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

  const { data, isLoading } = useGetAllAssistancesIncomplete(combinedFilters);

  return <StudentTable data={data} isLoading={isLoading} filters={filters} />;
}
