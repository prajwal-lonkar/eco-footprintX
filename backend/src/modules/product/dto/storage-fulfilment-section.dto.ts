import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StorageType } from '../enums/storage-type.enum';

export class StorageFulfilmentSectionDto {
  @IsEnum(StorageType)
  @IsNotEmpty()
  storageType: StorageType;

  @IsString()
  @IsOptional()
  activityDescription: string;
}
