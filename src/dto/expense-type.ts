export interface ExpenseTypeResponseDto {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseTypeCreateDto {
  name: string;
}

export interface ExpenseTypeUpdateDto {
  id: string;
  name?: string;
}
