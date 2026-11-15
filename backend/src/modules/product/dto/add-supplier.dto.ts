import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsObjectId } from 'src/shared/validators/is-object-id.validator';

export class AddSupplier {
  @IsString()
  @IsNotEmpty()
  supplierName: string;

  @IsString()
  @IsNotEmpty()
  companyRegistrationNumber: string;

  @IsObjectId()
  @IsOptional()
  supplierId: string;

  @IsArray()
  @IsString({ each: true })
  supplierRoles: string[];

  @IsString()
  @IsNotEmpty()
  supplierContactName: string;

  @IsEmail()
  @IsNotEmpty()
  supplierContactEmail: string;
}
