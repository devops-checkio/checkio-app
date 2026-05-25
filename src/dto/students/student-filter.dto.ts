import { PaginationRequestDto } from '@/dto/pagination';

export interface StudentFindFilterDto extends PaginationRequestDto {
  search?: string;
  companyId?: string;
  branchId?: string;
  isActive?: boolean;
}
