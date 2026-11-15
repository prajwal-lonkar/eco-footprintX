import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class FetchCompanyDetailsDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    website: string;

    @IsString()
    @IsNotEmpty()
    registrationNumber: string;

    @IsString()
    @IsNotEmpty()
    industryType: string;

    @IsString()
    @IsNotEmpty()
    companyType: string;

    @IsString()
    @IsOptional()
    dunsNumber: string;

    @IsString()
    @IsNotEmpty()
    contactName: string;

    @IsString()
    @IsNotEmpty()
    contactEmail: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsNotEmpty()
    createdAt: Date
}