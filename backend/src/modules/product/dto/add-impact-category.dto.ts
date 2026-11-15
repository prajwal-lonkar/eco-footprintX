import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsMongoId,
  IsString,
  IsOptional,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { CarbonDto } from './carbon.dto';
import { LandDto } from './land.dto';
import { WaterDto } from './water.dto';

export class AddImpactCategoryDto {
  @IsNotEmpty()
  @IsString()
  supplierLinkedRole: string;

  @IsOptional()
  supplierContactName: string;

  @IsOptional()
  supplierName: string;

  @IsOptional()
  supplierContactEmail: string;

  @IsOptional()
  @Type(() => CarbonDto)
  carbon: CarbonDto;

  @IsOptional()
  @Type(() => WaterDto)
  water: WaterDto;

  @IsOptional()
  @Type(() => LandDto)
  land: LandDto;

  @IsNotEmpty()
  @IsBoolean()
  isSaveAndExit: boolean;

  @IsOptional()
  @IsBoolean()
  requestEmailSent: boolean;
}
