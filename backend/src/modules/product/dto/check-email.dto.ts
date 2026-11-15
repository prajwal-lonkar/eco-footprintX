import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CheckEmailQueryDto {
  @Transform(({ value }) => value?.replace(/ /g, '+'))
  @Matches(/^[a-zA-Z0-9.+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/, {
    message: 'email must be a valid email address',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  componentName: string;
}
