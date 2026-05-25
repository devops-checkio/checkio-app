export interface UserResponseDto {
  id: string;
  name: string;
  rut: string;
  rolesId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateDto {
  name: string;
  rut: string;
  password: string;
  roleId: string;
}

export interface UserUpdateDto {
  id: string;
  name?: string;
  rut?: string;
  password?: string;
  roleId?: string;
}

export interface UserFindFilterDto {
  name?: string;
  rut?: string;
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
}

export interface PaginationUserDto {
  pagination: {
    current: number;
    next: number | null;
    previous: number | null;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    sort: "asc" | "desc";
  };
  data: UserResponseDto[];
}
