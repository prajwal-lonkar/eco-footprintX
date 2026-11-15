import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class RawMaterialSupplierSectionDto {
  @IsString()
  @IsNotEmpty()
  internalSku: string;

  @IsString()
  @IsOptional()
  supplierSku?: string;

  @IsString()
  @IsOptional()
  casNumber: string;

  @IsString()
  @IsOptional()
  activityDescription: string;
}
