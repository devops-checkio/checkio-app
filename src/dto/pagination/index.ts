export interface PaginationFilterDto {
  current: number;
  next: number | null;
  previous: number | null;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  sort: "asc" | "desc";
}

export interface PaginationRequestDto {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
}
