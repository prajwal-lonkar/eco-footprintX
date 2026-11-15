import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ApprovedCategoryItemDto {
  @IsString()
  @IsNotEmpty()
  impactCategory: string;

  @IsNumber()
  @IsNotEmpty()
  versionNumber: number;
}

export class ApproveRejectImpactCategoryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovedCategoryItemDto)
  approvedCategories: ApprovedCategoryItemDto[];
}
