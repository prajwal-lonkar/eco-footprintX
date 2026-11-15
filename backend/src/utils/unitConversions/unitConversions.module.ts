import { DynamicModule, Module } from '@nestjs/common';
import { UnitConversionsService } from './unitConversions.service';

@Module({})
export class UnitConversionsModule {
  static forRoot(): DynamicModule {
    return {
      module: UnitConversionsModule,
      imports: [],
      providers: [UnitConversionsService],
      exports: [UnitConversionsService],
    };
  }
}
