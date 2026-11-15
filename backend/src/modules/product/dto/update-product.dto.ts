import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  internalSku?: string;

  @IsOptional()
  @IsNumber()
  gstin?: number;

  @IsOptional()
  @IsNumber()
  netSize?: number;

  @IsOptional()
  @IsEnum(['kg', 'g', 't', 'oz', 'lb', 'fl_oz', 'ml', 'l', 'Other'])
  unit?: string;

  @IsOptional()
  @IsString()
  customUnit?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  comparisonProductDescription?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsEnum(['pending', 'published', 'ready', 'partial'])
  publishStatus?: string;
}
