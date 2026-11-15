import { IsOptional, IsObject } from "class-validator";

export class AuditDto {
  @IsOptional()
  @IsObject()
  query?: Record<string, any>;

  @IsOptional()
  @IsObject()
  result?: Record<string, any>;
}