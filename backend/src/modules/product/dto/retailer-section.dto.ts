import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StorageType } from '../enums/storage-type.enum';

export class RetailerSectionDto {
  @IsNotEmpty()
  @IsEnum(StorageType)
  storageType: StorageType;

  @IsString()
  @IsOptional()
  activityDescription: string;
}
