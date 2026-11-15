import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';

@Module({})
export class OpenAIModule {
  static forRoot(): DynamicModule {
    return {
      module: OpenAIModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'OPENAI_OPTIONS',
          useFactory: (config: ConfigService) => ({
            apiKey: config.get<string>('OPENAI_API_KEY'),
          }),
          inject: [ConfigService],
        },
        {
          provide: OpenAIService,
          useFactory: (options: { apiKey: string }) => new OpenAIService(options),
          inject: ['OPENAI_OPTIONS'],
        },
      ],
      exports: [OpenAIService],
    };
  }
}
