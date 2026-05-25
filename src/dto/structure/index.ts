import { PaginationFilterDto } from "../pagination";

export interface StructureCreateDto {
  name: string;
  companies: string[];
}

export interface StructureResponseDto {
  publicId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  companies: string[];
}

export interface StructureParamDto {
  publicId: string;
}

export interface StructureUpdateDto {
  publicId: string;
  name: string;
  companies: string[];
}

export interface StructureFindFilterDto {
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
  search?: string;
  /** Empresa activa en sesión: solo estructuras vinculadas a esta empresa */
  companyId?: string;
}

export interface PaginationStructureDto {
  data: StructureResponseDto[];
  pagination: PaginationFilterDto;
}

export interface CreateOrganizationalUnitConfigRequestDto {
  name: string;
}

export interface CreateOrganizationalUnitRequestDto {
  name: string;
  level: number;
  structureId: string;
}

/** Query / UI sort field for paginated sub-units by level (aligned with API). */
export type SubUnitSortField =
  | "name"
  | "code"
  | "parentName"
  | "employeeCount";

export interface SubOrganizationalUnitTreeNodeDto {
  id: string;
  name: string;
  code: string;
  organizationalUnitId: string;
  organizationalUnitName: string | null;
  level: number;
  parentSubUnitIds: string[];
  parentSubUnitId: string | null;
  pathKey: string;
  children: SubOrganizationalUnitTreeNodeDto[];
  employeeCount?: number;
}

export interface SubOrganizationalUnitResponseDto {
  publicId: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  organizationalUnitId?: string;
  /** Parent sub-unit public IDs (level N-1). */
  parentSubUnitIds?: string[];
  /** @deprecated Prefer parentSubUnitIds */
  subRelationId?: string | null;
}

export interface SubOrganizationalUnitListItemDto
  extends SubOrganizationalUnitResponseDto {
  parentName?: string | null;
  employeeCount?: number;
}

export interface SubOrganizationalUnitsPaginatedResponseDto {
  data: SubOrganizationalUnitListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UpdateSubOrganizationalUnitRequestDto {
  name?: string;
  code?: string;
  organizationalUnitId?: string;
  /** Replaces full parent set when sent */
  parentSubUnitIds?: string[];
  /** @deprecated Prefer parentSubUnitIds */
  subRelationId?: string | null;
}

export interface CreateSubOrganizationalUnitRequestDto {
  name: string;
  code: string;
  organizationalUnitId: string;
  parentSubUnitIds?: string[];
  /** @deprecated Prefer parentSubUnitIds */
  subRelationId?: string | null;
}

export interface UpdateOrganizationalUnitRequestDto {
  name?: string;
  level?: number;
}

export interface OrganizationalUnitResponseDto {
  publicId: string;
  name: string;
  level: number;
  createdAt: Date;
  updatedAt: Date;
  SubOrganizationalUnit: SubOrganizationalUnitResponseDto[];
}
