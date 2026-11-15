import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsDate,
} from 'class-validator';

export class ProfileDetailsResponseDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @IsObject()
  @IsNotEmpty()
  industry: {
    _id: string;
    type: string;
  };

  @IsObject()
  @IsNotEmpty()
  companyType: {
    _id: string;
    type: string;
  };

  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @IsOptional()
  @IsString()
  dunsNumber?: string;

  @IsString()
  @IsNotEmpty()
  companyContactName: string;

  @IsString()
  @IsNotEmpty()
  companyContactEmail: string;

  @IsString()
  @IsNotEmpty()
  companyAddress: string;

  @IsDate()
  @IsNotEmpty()
  createdAt: Date;
}
