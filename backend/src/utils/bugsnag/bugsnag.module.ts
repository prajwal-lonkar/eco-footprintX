import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BugsnagService } from './bugsnag.service';

@Global() // optional: makes it available everywhere
@Module({
  imports: [ConfigModule],
  providers: [BugsnagService],
  exports: [BugsnagService],
})
export class BugsnagModule {}
