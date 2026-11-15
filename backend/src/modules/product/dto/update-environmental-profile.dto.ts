import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MaterialEnvProfileDto } from './material-env-profile.dto';
import { TransportEnvProfileDto } from './transport-env-profile.dto';
import { StorageEnvProfileDto } from './storage-env-profile.dto';
import { ContractManufacturerDetailsDto } from './contract-manufacturer-details.dto';

export class CompleteSupplierDetailsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => MaterialEnvProfileDto)
  rawMaterialSupplierDetails?: MaterialEnvProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TransportEnvProfileDto)
  transportFreightDetails?: TransportEnvProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StorageEnvProfileDto)
  storageFulfilmentDetails?: StorageEnvProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StorageEnvProfileDto)
  cpgBrandDetails?: StorageEnvProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StorageEnvProfileDto)
  retailerDetails?: StorageEnvProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MaterialEnvProfileDto)
  packagingManufacturerDetails?: MaterialEnvProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContractManufacturerDetailsDto)
  contractManufacturerDetails?: ContractManufacturerDetailsDto;
}
