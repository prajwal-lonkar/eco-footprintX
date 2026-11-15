import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class AddComponentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  internalSku: string;

  @IsBoolean()
  isNewComponent: boolean;
}
