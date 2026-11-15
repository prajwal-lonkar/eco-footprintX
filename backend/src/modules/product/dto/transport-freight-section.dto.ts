import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TransportMethod } from '../enums/transport-method.enum';

export class TransportFreightSectionDto {
  @IsEnum(TransportMethod)
  @IsNotEmpty()
  transportMethod: TransportMethod;

  @IsString()
  @IsOptional()
  activityDescription: string;

  @IsString()
  @IsNotEmpty()
  transportOrigin: string;

  @IsString()
  @IsNotEmpty()
  transportDestination: string;

  @IsNumber()
  @IsOptional()
  calculatedDistanceKm?: number;
}
