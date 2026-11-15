import { IsNumber, IsNotEmpty, IsString } from 'class-validator';

export class MaterialEnvProfileDto {
  @IsNumber()
  @IsNotEmpty()
  netWeightUsedPerSku: number;

  @IsString()
  @IsNotEmpty()
  netWeightUnit: string;

  @IsString()
  @IsNotEmpty()
  supplierLocation: string;
}
