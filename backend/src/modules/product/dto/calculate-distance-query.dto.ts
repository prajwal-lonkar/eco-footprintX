import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { UserTransportMethod } from 'src/utils/openai/openai.types';

export class CalculateDistanceQueryDto {
  @IsNotEmpty()
  @IsString()
  roleSlug: string;

  @IsNotEmpty()
  @IsEnum(UserTransportMethod)
  transportMethod: UserTransportMethod;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  originLatitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  originLongitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  destinationLatitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  destinationLongitude: number;
}
