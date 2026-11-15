import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class RecycleInstructionItemDto {
    @IsString()
    @IsNotEmpty()
    component: string;

    @IsString()
    @IsNotEmpty()
    instructions: string;
}

export class UpdateRecycleProductInfoDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecycleInstructionItemDto)
    recycleInstructions?: RecycleInstructionItemDto[];

    @IsOptional()
    @IsString()
    image?: string;
}