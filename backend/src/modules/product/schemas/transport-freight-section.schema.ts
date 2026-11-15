import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TransportMethod } from '../enums/transport-method.enum';

@Schema({ _id: false })
export class TransportFreightSection {
  @Prop({ required: true, enum: TransportMethod })
  transportMethod: TransportMethod;

  @Prop({ required: true })
  transportOrigin: string;

  @Prop({ required: true })
  transportDestination: string;

  @Prop({ required: false })
  activityDescription: string;

  // (Optional) backend-only calculated distance
  @Prop()
  calculatedDistanceKm?: number;
}

export const TransportFreightSectionSchema = SchemaFactory.createForClass(
  TransportFreightSection,
);
