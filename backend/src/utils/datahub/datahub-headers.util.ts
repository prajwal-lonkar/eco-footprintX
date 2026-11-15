import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatahubHeadersService {
  constructor(private readonly config: ConfigService) {}

  get(): Record<string, string> {
    const apiKey = this.config.get<string>('DATAHUB_API_KEY');
    if (!apiKey) {
      console.warn(
        '[Datahub] DATAHUB_API_KEY is not set — requests will be sent without authentication',
      );
    }
    return apiKey ? { 'x-api-key': apiKey } : {};
  }
}
