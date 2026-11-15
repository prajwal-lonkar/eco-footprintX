import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../../../shared/schemas/base.schema';

@Schema({ timestamps: true, collection: 'whitelisted_emails' })
export class WhitelistedEmail extends BaseSchema {
  @Prop({ type: String, required: true })
  email: string;
}

export const WhitelistedEmailSchema =
  SchemaFactory.createForClass(WhitelistedEmail);
