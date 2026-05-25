export interface ExpenseCreateDto {
  name: string;
}

export interface ExpenseUpdateDto {
  name: string;
}

export interface ExpenseResponseDto {
  publicId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
