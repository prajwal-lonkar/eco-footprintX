import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/shared/schemas/base.schema';

export type ImpactCategoryRecordDocument = ImpactCategoryRecord & Document;

@Schema({ timestamps: true, collection: 'impactCategoryRecord' })
export class ImpactCategoryRecord extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Component', required: true })
  componentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RoleDetails', required: true })
  roleDetailsId: Types.ObjectId;

  @Prop({ required: true })
  supplierLinkedRole: string;

  @Prop({
    type: String,
    enum: ['carbon', 'water', 'land'],
    required: true,
  })
  impactCategory: string;

  @Prop()
  supplierContactName: string;

  @Prop()
  supplierContactEmail: string;

  @Prop()
  companyName: string;

  @Prop({
    type: String,
    enum: ['manual', 'database', 'supplier'],
    required: false,
  })
  dataSource: string;

  @Prop({ default: false })
  requestEmailSent: boolean;
}

export const ImpactCategoryRecordSchema =
  SchemaFactory.createForClass(ImpactCategoryRecord);

  ImpactCategoryRecordSchema.index(
  { componentId: 1, roleDetailsId: 1, supplierLinkedRole: 1, impactCategory: 1 },
  { unique: true }
);
