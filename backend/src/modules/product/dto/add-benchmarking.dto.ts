import {
  IsArray,
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BenchmarkingDataItemDto {
  // Used by Raw Material, Storage, Packaging, CPG, Retailer, Contract
  @IsOptional()
  @IsString()
  componentName?: string;

  @IsOptional()
  @IsString()
  activityDescription?: string;

  @IsOptional()
  @IsString()
  supplierLocation?: string;

  @IsOptional()
  @IsNumber()
  casNumber?: number;

  // Used by Transport & Freight
  @IsOptional()
  @IsString()
  transportMethod?: string;

  @IsOptional()
  @IsString()
  transportDescription?: string;

  @IsOptional()
  @IsString()
  transportRegion?: string;

  @IsOptional()
  @IsString()
  lciaMethodology?: string;

  @IsOptional()
  @IsString()
  databaseReportedImpact?: string;

  @IsOptional()
  @IsNumber()
  netWeightUsedPerSku?: number;

  @IsOptional()
  @IsString()
  netWeightUnit?: string;
}

export class UpdateBenchmarkingDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BenchmarkingDataItemDto)
  benchmarkingData: BenchmarkingDataItemDto[];
}
