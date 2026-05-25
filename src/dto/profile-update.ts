export interface UpdateProfileDto {
  email?: string;
  password?: string;
  currentPassword?: string;
}

export interface UpdateProfileResponseDto {
  message: string;
  success: boolean;
}

export interface SetPasswordDto {
  email: string;
  password: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface SetPasswordResponseDto {
  message: string;
  success: boolean;
}
