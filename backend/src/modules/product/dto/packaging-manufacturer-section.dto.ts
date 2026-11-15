import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PackagingManufacturerSectionDto {
  @IsString()
  @IsOptional()
  activityDescription: string;
}
