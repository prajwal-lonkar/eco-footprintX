import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecycleInstructionDto {
  @IsOptional()
  @IsString()
  component?: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  internalSku: string;

  @IsNumber()
  gstin: number;

  @IsNumber()
  @IsNotEmpty()
  netSize: number;

  @IsEnum(['kg', 'g', 't', 'oz', 'lb', 'fl_oz', 'ml', 'l', 'Other'])
  unit: string;

  @IsOptional()
  @IsString()
  customUnit?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsNotEmpty()
  @IsString()
  comparisonProductDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsEnum(['pending', 'published', 'ready', 'partial'])
  publishStatus?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecycleInstructionDto)
  recycleInstructions?: RecycleInstructionDto[];
}
