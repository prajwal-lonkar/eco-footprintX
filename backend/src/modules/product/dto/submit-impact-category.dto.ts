import { IsArray, IsString, IsIn } from 'class-validator';

export class SubmitImpactCategoryDto {

  @IsArray()
  @IsString({ each: true })
  @IsIn(['carbon', 'water', 'land'], { each: true })
  categories: string[];
}
