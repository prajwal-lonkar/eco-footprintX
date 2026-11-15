import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from 'src/shared/schemas/base.schema';

export type IndustryTypeDocument = HydratedDocument<IndustryType>;

@Schema({ timestamps: true, collection: 'industryTypes' })
export class IndustryType extends BaseSchema {
  @Prop({ type: String, required: true })
  type: string;
}

export const IndustryTypeSchema = SchemaFactory.createForClass(IndustryType);
