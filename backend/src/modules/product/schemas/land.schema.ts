import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Land {
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
    enum: ['m2/unit'],
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
  tempQuantity: number;

  @Prop({
    type: String,
    enum: ['m2/unit'],
    required: false,
  })
  tempUnit: string;

  @Prop({ type: Boolean, required: false, default: false })
  isSubmitted: boolean;

  @Prop({ type: Boolean, required: false, default: true })
  isImpactPresent: boolean;

  @Prop({ type: Boolean, required: false, default: false })
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

  @Prop({ type: String, required: false })
  dateOfRequest: string;

  @Prop({ type: Boolean, required: false, default: false })
  requestedDataConsent: boolean;

  @Prop({ type: Boolean, required: false, default: true })
  requestedIsImpactPresent: boolean;

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

export const LandSchema = SchemaFactory.createForClass(Land);
