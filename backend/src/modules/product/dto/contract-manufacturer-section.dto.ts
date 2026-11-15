import { IsArray, IsNotEmpty, IsString, ArrayNotEmpty, IsOptional } from 'class-validator';

export class ContractManufacturerSectionDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  manufacturingActivityTypes: string[];

  @IsString()
  @IsOptional()
  activityDescription: string;
}
