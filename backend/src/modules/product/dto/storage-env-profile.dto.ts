import { IsNotEmpty, IsNumber } from 'class-validator';

export class StorageEnvProfileDto {
  @IsNumber()
  @IsNotEmpty()
  storageDays: number;

  @IsNumber()
  @IsNotEmpty()
  volumePerSku: number;

  @IsNumber()
  @IsNotEmpty()
  floorAreaPerSku: number;
}
