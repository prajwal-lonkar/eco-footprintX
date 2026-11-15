import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from 'src/shared/schemas/base.schema';
import { User } from 'src/modules/user/schemas/user.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, collection: 'products' })
export class Product extends BaseSchema {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  internalSku: string;

  @Prop({ type: Number, required: true, index: { unique: true } })
  gstin: number;

  @Prop({ type: Number, required: true })
  netSize: number;

  @Prop({
    type: String,
    enum: ['kg', 'g', 't', 'oz', 'lb', 'fl_oz', 'ml', 'l', 'Other'],
    required: true,
  })
  unit: string;

  @Prop({ type: String })
  customUnit?: string;

  @Prop({ type: String, required: true })
  category: string;

  @Prop({ type: String })
  batchNumber?: string;

  @Prop({ type: String, required: true })
  comparisonProductDescription?: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  companyId: Types.ObjectId;

  @Prop({ type: String })
  image?: string; // file key

  @Prop({
    type: String,
    enum: ['pending', 'awaiting', 'ready', 'partial', 'published'],
    default: 'pending',
    required: true,
  })
  publishStatus: string;

  @Prop({ type: Boolean, default: false })
  isPubliclyAccessible: boolean;

  @Prop([
    {
      component: { type: String },
      instructions: { type: String },
    },
  ])
  recycleInstructions?: Array<{
    component?: string;
    instructions?: string;
  }>;

  @Prop({
    _id: false,
    type: {
      carbon: { type: Boolean, default: false },
      water: { type: Boolean, default: false },
      land: { type: Boolean, default: false },
    },
    default: {},
  })
  impactCategoryPublishStatus: {
    carbon?: boolean;
    water?: boolean;
    land?: boolean;
  };

  @Prop({
    _id: false,
    type: {
      carbon: { type: Number },
      water: { type: Number },
      land: { type: Number },
      metadata: { type: Object },
    },
  })
  impactBenchMarking?: {
    carbon?: number;
    water?: number;
    land?: number;
    metadata?: Record<string, any>;
  };

  @Prop({ type: String, required: false })
  masterDataUuid?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
