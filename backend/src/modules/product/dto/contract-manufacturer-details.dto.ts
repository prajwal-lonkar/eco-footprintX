import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IntersectionType } from '@nestjs/mapped-types';

class VolumeBlockDto {
  @IsOptional()
  @IsNumber()
  volumePerUnit?: number;

  @IsOptional()
  @IsString()
  volumeUnit?: string;
}

class TemperatureBlockDto {
  @IsOptional()
  @IsNumber()
  currentTemperature?: number;

  @IsOptional()
  @IsNumber()
  targetTemperature?: number;
}

class HeatingBlockDto extends IntersectionType(
  VolumeBlockDto,
  TemperatureBlockDto,
) {}

export class ContractManufacturerDetailsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => VolumeBlockDto)
  filling?: VolumeBlockDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VolumeBlockDto)
  mixing?: VolumeBlockDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VolumeBlockDto)
  homogenising?: VolumeBlockDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VolumeBlockDto)
  fermenting?: VolumeBlockDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VolumeBlockDto)
  packaging?: VolumeBlockDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => HeatingBlockDto)
  cooling?: HeatingBlockDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => HeatingBlockDto)
  heating?: HeatingBlockDto;

  @IsOptional()
  labelling?: {
    numberOfLabels?: number;
  };
}
