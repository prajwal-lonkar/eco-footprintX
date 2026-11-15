export class LoginResponseDto {
  accessToken: string;
  isEmailVerified: boolean;
  roleSlug: string;
}

export class RefreshResponseDto {
  accessToken: string;
}

export class LogoutResponseDto {
  message: string;
}
