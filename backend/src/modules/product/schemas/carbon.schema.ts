import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Carbon {
  @Prop({
    type: String,
    enum: ['manual', 'database', ''],
    required: false,
  })
  dataSource?: string;

  @Prop({ type: Number, required: false })
  quantity: number;

  @Prop({
    type: String,
    enum: ['kg CO2-eq/unit'],
    required: false,
  })
  unit: string;

  @Prop({
    type: String,
    enum: ['TRACI', 'ReCIPe', 'CML', 'EF'],
    required: false,
  })
  lciaMethodology: string;

  @Prop({ type: Number, required: false })
  offsetQuantity: number;

  @Prop({
    type: String,
    enum: ['kg CO2-eq/unit'],
    required: false,
  })
  offsetUnit: string;

  @Prop({ type: Number, required: false })
  tempQuantity: number;

  @Prop({
    type: String,
    enum: ['kg CO2-eq/unit'],
    required: false,
  })
  tempUnit: string;

  @Prop({ type: Boolean, required: false, default: false })
  offsetCarbonImpact: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  isSubmitted: boolean;

  @Prop({ type: Boolean, default: false, required: false })
  isRequested: boolean;

  @Prop({
    type: String,
    enum: ['TRACI', 'ReCIPe', 'CML', 'EF'],
    required: false,
  })
  tempLciaMethodology: string;

  @Prop({
    type: String,
    enum: ['manual', 'database', ''],
    required: false,
  })
  requestedDataSource?: string;

  @Prop({ type: Number, required: false })
  requestedQuantity: number;

  @Prop({
    type: String,
    enum: ['kg CO2-eq/unit'],
    required: false,
  })
  requestedUnit: string;

  @Prop({
    type: String,
    enum: ['TRACI', 'ReCIPe', 'CML', 'EF'],
    required: false,
  })
  requestedLciaMethodology: string;

  @Prop({ type: Number, required: false })
  requestedOffsetQuantity: number;

  @Prop({
    type: String,
    enum: ['kg CO2-eq/unit'],
    required: false,
  })
  requestedOffsetUnit: string;

  @Prop({ type: String, required: false })
  dateOfRequest: string;

  @Prop({ type: Boolean, required: false, default: false })
  requestedOffsetCarbonImpact: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  requestedDataConsent: boolean;

   @Prop({
    type: {
      query: { type: Object, required: false },
      result: { type: Object, required: false },
    },
    required: false,
  })
  audit?: {
    query?: Record<string, any>;
    result?: Record<string, any>;
  };
}

export const CarbonSchema = SchemaFactory.createForClass(Carbon);
