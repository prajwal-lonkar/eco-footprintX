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

export enum LandDataSource {
  SUPPLIER = 'supplier',
  MANUAL = 'manual',
  DATABASE = 'database',
}

export enum LandUnit {
  M2 = 'm2/unit',
}

export class LandDto {
  @IsOptional()
  @IsEnum(LandDataSource)
  dataSource: LandDataSource;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsEnum(LandUnit)
  unit: LandUnit;

  @IsOptional()
  @IsEnum(LciaMethodology)
  lciaMethodology: LciaMethodology;

  @IsOptional()
  @IsNumber()
  tempQuantity: number;

  @IsOptional()
  @IsEnum(LandUnit)
  tempUnit: LandUnit;

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
  @IsEnum(LandDataSource)
  requestedDataSource: LandDataSource;

  @IsOptional()
  @IsNumber()
  requestedQuantity: number;

  @IsOptional()
  @IsEnum(LandUnit)
  requestedUnit: LandUnit;

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
