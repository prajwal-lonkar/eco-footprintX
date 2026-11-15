import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SendEmailDto {
  @IsEmail()
  @IsNotEmpty()
  toEmail: string;
  
  @IsString()
  @IsNotEmpty()
  emailType: string;
}