import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}