import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from 'src/shared/schemas/base.schema';

export type CompanyTypeDocument = HydratedDocument<CompanyType>;
@Schema({ timestamps: true, collection: 'companyTypes' })
export class CompanyType extends BaseSchema {
  @Prop({ type: String, required: true })
  type: string;
}

export const CompanyTypeSchema = SchemaFactory.createForClass(CompanyType);
