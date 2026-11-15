import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class TransportEnvProfileDto {
  @IsNumber()
  @IsNotEmpty()
  netWeightPerUnit: number;

  @IsString()
  @IsNotEmpty()
  netWeightUnit: string;

  @IsString()
  @IsNotEmpty()
  transportRegion: string;

  @IsNumber()
  @IsOptional()
  calculatedDistanceKm?: number;
}
