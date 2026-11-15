import { IsString } from 'class-validator';

export class GetUploadUrlDto {
  @IsString()
  key: string;

  @IsString()
  contentType: string;
}
