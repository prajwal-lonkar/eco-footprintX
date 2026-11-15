import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class VerifyEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  otp: string;
}
