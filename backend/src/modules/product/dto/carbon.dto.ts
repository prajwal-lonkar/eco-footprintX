import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AuditDto } from './audit.dto';

export enum CarbonDataSource {
  SUPPLIER = 'supplier',
  MANUAL = 'manual',
  DATABASE = 'database',
}

export enum CarbonUnit {
  KG_CO2_EQ = 'kg CO2-eq/unit',
}

export enum LciaMethodology {
  TRACI = 'TRACI',
  RECIPE = 'ReCIPe',
  CML = 'CML',
  EF = 'EF',
}

export class CarbonDto {
  @IsOptional()
  @IsEnum(CarbonDataSource)
  dataSource: CarbonDataSource;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsEnum(CarbonUnit)
  unit: CarbonUnit;

  @IsOptional()
  @IsEnum(LciaMethodology)
  lciaMethodology: LciaMethodology;

  @IsOptional()
  @IsNumber()
  offsetQuantity: number;

  @IsOptional()
  @IsEnum(CarbonUnit)
  offsetUnit: CarbonUnit;

  @IsOptional()
  @IsNumber()
  tempQuantity: number;

  @IsOptional()
  @IsEnum(CarbonUnit)
  tempUnit: CarbonUnit;

  @IsOptional()
  @IsBoolean()
  offsetCarbonImpact: boolean;

  @IsOptional()
  @IsBoolean()
  isSubmitted: boolean;

  @IsOptional()
  @IsBoolean()
  isRequested: boolean;

  @IsOptional()
  @IsEnum(LciaMethodology)
  tempLciaMethodology: LciaMethodology;

  @IsOptional()
  @IsEnum(CarbonDataSource)
  requestedDataSource: CarbonDataSource;

  @IsOptional()
  @IsNumber()
  requestedQuantity: number;

  @IsOptional()
  @IsEnum(CarbonUnit)
  requestedUnit: CarbonUnit;

  @IsOptional()
  @IsEnum(LciaMethodology)
  requestedLciaMethodology: LciaMethodology;

  @IsOptional()
  @IsNumber()
  requestedOffsetQuantity: number;

  @IsOptional()
  @IsEnum(CarbonUnit)
  requestedOffsetUnit: CarbonUnit;

  @IsOptional()
  @IsBoolean()
  requestedOffsetCarbonImpact: boolean;

  @IsOptional()
  @IsString()
  dateOfRequest: string;

  @IsOptional()
  @IsBoolean()
  requestedDataConsent: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => AuditDto)
  audit?: AuditDto;
}
