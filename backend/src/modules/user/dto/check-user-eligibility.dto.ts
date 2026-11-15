import { IsEmail, IsNotEmpty } from 'class-validator';

export class CheckUserEligibilityDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
