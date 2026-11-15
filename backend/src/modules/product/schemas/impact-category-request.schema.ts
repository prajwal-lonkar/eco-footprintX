import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/shared/schemas/base.schema';

export type ImpactCategoryRequestDocument = ImpactCategoryRequest & Document;

@Schema({ timestamps: true, collection: 'impactCategoryRequest' })
export class ImpactCategoryRequest extends BaseSchema {
  @Prop({
    type: Types.ObjectId,
    ref: 'ImpactCategoryRecord',
    required: true,
  })
  impactCategoryRecordId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['carbon', 'water', 'land'],
    required: true,
  })
  impactCategory: string;

  @Prop({ default: false })
  isRequested: boolean;

  @Prop({ default: false })
  isFulfilled: boolean;

  @Prop({ type: Types.ObjectId })
  requestedBy: Types.ObjectId;
}

export const ImpactCategoryRequestSchema = SchemaFactory.createForClass(
  ImpactCategoryRequest,
);

ImpactCategoryRequestSchema.index({ impactCategoryRecordId: 1 });
ImpactCategoryRequestSchema.index({ isRequested: 1, isFulfilled: 1 });
