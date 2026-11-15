import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/shared/schemas/base.schema';

export type ImpactCategoryVersionDocument = ImpactCategoryVersion & Document;

@Schema({ timestamps: true, collection: 'impactCategoryVersion' })
export class ImpactCategoryVersion extends BaseSchema {
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

  @Prop({
    type: String,
    enum: ['company', 'supplier'],
    required: true,
  })
  versionOwner: string;

  @Prop({ type: Number })
  quantity: number;

  @Prop()
  unit: string;

  @Prop()
  lciaMethodology: string;

  @Prop({ type: Number })
  tempQuantity: number;

  @Prop()
  tempUnit: string;

  @Prop()
  tempLciaMethodology: string;

  @Prop()
  dataSource: string;

  @Prop({ default: false })
  isSubmitted: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  offsetCarbonImpact: boolean;

  @Prop({ type: Boolean, required: false, default: true })
  isImpactPresent: boolean;

  @Prop({ type: Number, required: false })
  offsetQuantity: number;

  @Prop({
    type: String,
    enum: ['kg CO2-eq/unit'],
    required: false,
  })
  offsetUnit: string;

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

  @Prop({ default: false })
  isLatest: boolean;

  @Prop({ default: false })
  isApproved: boolean;

  @Prop({ default: null })
  submittedAt: Date;

  @Prop({ default: null })
  submittedBy: string;

  @Prop({ default: null })
  approvedAt: Date;

  @Prop({ default: null })
  approvedBy: string;

  @Prop({ type: Number, required: true })
  versionNumber: number;

  @Prop({ default: false })
  isRejected: boolean;

  @Prop({ default: null })
  rejectedAt: Date;

  @Prop({ default: null })
  rejectedBy: string;

  @Prop({ default: false })
  isProspective: boolean;

  @Prop({ type: String, required: false })
  masterDataUuid?: string;
}

export const ImpactCategoryVersionSchema = SchemaFactory.createForClass(
  ImpactCategoryVersion,
);

ImpactCategoryVersionSchema.index({
  impactCategoryRecordId: 1,
  versionOwner: 1,
  isLatest: 1,
});

ImpactCategoryVersionSchema.index({
  impactCategoryRecordId: 1,
  versionOwner: 1,
  submissionVersion: -1,
});

ImpactCategoryVersionSchema.index({
  impactCategoryRecordId: 1,
  isLatest: 1,
});
