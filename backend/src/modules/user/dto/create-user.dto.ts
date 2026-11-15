// src/modules/user/dto/create-user.dto.ts

import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateCompanyDetailsDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  industryType: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  companyType: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @IsString()
  @IsOptional()
  dunsNumber?: string;
}

export class CreateUserDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;

  @IsOptional()
  @IsString()
  deletedBy?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  // User fields
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  // Assigned automatically by the system based on eligibility — not from client input
  @IsString()
  @IsOptional()
  role?: string;

  @IsNotEmpty()
  companyDetails: CreateCompanyDetailsDto;

  @IsOptional()
  @IsString()
  invitedBy?: string;
}
