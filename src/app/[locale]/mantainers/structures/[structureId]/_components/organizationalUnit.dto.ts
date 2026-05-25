interface CreateOrganizationalUnitInput {
  name: string;
  level: number;
}

export interface DeleteOrganizationalUnitInput {
  id: number;
}

export interface OrganizationalUnitDto {
  publicId: string;
  name: string;
  level: number;
  structureId: number;
  subRelationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  SubOrganizationalUnit: SubOrganizationalUnitDto[];
}

export interface SubOrganizationalUnitDto {
  publicId: string;
  name: string;
  code: string;
  organizationalUnitId: string;
  subRelationId?: string | null;
  parentSubUnitIds?: string[];
  createdAt: Date;
  updatedAt: Date;
  SubOrganizationalUnit?: SubOrganizationalUnitDto[];
}

export interface CreateSubOrganizationalUnitRequestDto {
  name: string;
  code: string;
  organizationalUnitId: string;
  parentSubUnitIds?: string[];
  subRelationId?: string | null;
}

export default CreateOrganizationalUnitInput;
