import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { RawMaterialSupplierSectionDto } from './raw-material-supplier-section.dto';
import { TransportFreightSectionDto } from './transport-freight-section.dto';
import { StorageFulfilmentSectionDto } from './storage-fulfilment-section.dto';
import { PackagingManufacturerSectionDto } from './packaging-manufacturer-section.dto';
import { CpgBrandSectionDto } from './cpg-brand-section.dto';
import { RetailerSectionDto } from './retailer-section.dto';
import { ContractManufacturerSectionDto } from './contract-manufacturer-section.dto';

export class UpdateSupplierDetailsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => RawMaterialSupplierSectionDto)
  rawMaterialSupplier?: RawMaterialSupplierSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TransportFreightSectionDto)
  transportFreight?: TransportFreightSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StorageFulfilmentSectionDto)
  storageFulfilment?: StorageFulfilmentSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PackagingManufacturerSectionDto)
  packagingManufacturer?: PackagingManufacturerSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CpgBrandSectionDto)
  cpgBrand?: CpgBrandSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RetailerSectionDto)
  retailer?: RetailerSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContractManufacturerSectionDto)
  contractManufacturer?: ContractManufacturerSectionDto;
}
