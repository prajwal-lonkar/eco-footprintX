import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { LciaMethodology } from './carbon.dto';
import { Type } from 'class-transformer';
import { AuditDto } from './audit.dto';

export enum WaterDataSource {
  SUPPLIER = 'supplier',
  MANUAL = 'manual',
  DATABASE = 'database',
}

export enum WaterUnit {
  M3 = 'm3/unit',
}

export class WaterDto {
  @IsOptional()
  @IsEnum(WaterDataSource)
  dataSource: WaterDataSource;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsEnum(WaterUnit)
  unit: WaterUnit;

  @IsOptional()
  @IsEnum(LciaMethodology)
  lciaMethodology: LciaMethodology;

  @IsOptional()
  @IsNumber()
  tempQuantity: number;

  @IsOptional()
  @IsEnum(WaterUnit)
  tempUnit: WaterUnit;

  @IsOptional()
  @IsBoolean()
  isSubmitted: boolean;

  @IsOptional()
  @IsBoolean()
  isImpactPresent: boolean;

  @IsOptional()
  @IsBoolean()
  isRequested: boolean;

  @IsOptional()
  @IsEnum(LciaMethodology)
  tempLciaMethodology: LciaMethodology;

  @IsOptional()
  @IsEnum(WaterDataSource)
  requestedDataSource: WaterDataSource;

  @IsOptional()
  @IsNumber()
  requestedQuantity: number;

  @IsOptional()
  @IsEnum(WaterUnit)
  requestedUnit: WaterUnit;

  @IsOptional()
  @IsEnum(LciaMethodology)
  requestedLciaMethodology: LciaMethodology;

  @IsOptional()
  @IsBoolean()
  isUpdated: boolean;

  @IsOptional()
  @IsString()
  dateOfRequest: string;

  @IsOptional()
  @IsBoolean()
  requestedDataConsent: boolean;

  @IsOptional()
  @IsBoolean()
  requestedIsImpactPresent: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => AuditDto)
  audit?: AuditDto;
}
