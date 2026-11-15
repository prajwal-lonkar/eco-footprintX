import { BaseSchema } from 'src/shared/schemas/base.schema';
import { Component } from './component.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CarbonSchema, Carbon } from './carbon.schema';
import { Water, WaterSchema } from './water.schema';
import { Land, LandSchema } from './land.schema';

export type ImpactCategoryDataDocument = HydratedDocument<ImpactCategoryData>;

@Schema({ timestamps: true, collection: 'impactCategoryData' })
export class ImpactCategoryData extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: Component.name, required: true })
  componentId: Types.ObjectId;

  @Prop({ required: true, type: String })
  supplierLinkedRole: string;

  @Prop({ type: Types.ObjectId, required: true })
  supplierLinkedId: Types.ObjectId;

  @Prop({ required: false, type: String })
  supplierContactName: string;

  @Prop({ required: false, type: String })
  supplierContactEmail: string;

  @Prop({ required: false,type: CarbonSchema })
  carbon: Carbon;

  @Prop({ required: false,type: WaterSchema })
  water: Water;

  @Prop({ required: false,type: LandSchema })
  land: Land;

  @Prop({ type: Boolean, required: false, default: false })
  requestEmailSent: boolean;
}
export const ImpactCategoryDataSchema =
  SchemaFactory.createForClass(ImpactCategoryData);
