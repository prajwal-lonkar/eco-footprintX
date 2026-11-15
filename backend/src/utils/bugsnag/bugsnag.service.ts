import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Bugsnag from '@bugsnag/js';
import BugsnagPluginExpress from '@bugsnag/plugin-express';

@Injectable()
export class BugsnagService {
  public middleware: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('BUGSNAG_API_KEY');

    if (!apiKey) {
      throw new Error('BUGSNAG_API_KEY is missing in secret manager');
    }

    const releaseStage =
      this.configService.get<string>('NODE_ENV') || 'development';

    Bugsnag.start({
      apiKey,
      plugins: [BugsnagPluginExpress],
      releaseStage,
      enabledReleaseStages: ['development', 'testing', 'staging', 'production'],
    });

    this.middleware = Bugsnag.getPlugin('express');
  }
}
