// src/modules/user/dto/update-company-details.dto.ts

import { IsString, IsNotEmpty, IsMongoId, IsOptional } from 'class-validator';

export class UpdateCompanyDetailsDto {
  // Contact person name -> maps to root-level user.name
  @IsString()
  @IsNotEmpty()
  contactName: string;

  // Company name -> maps to companyDetails.name
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsMongoId()
  @IsNotEmpty()
  industryType: string;

  @IsMongoId()
  @IsNotEmpty()
  companyType: string;

  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @IsOptional()
  @IsString()
  dunsNumber?: string;
}
