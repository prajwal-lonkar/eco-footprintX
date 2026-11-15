import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from 'src/shared/schemas/base.schema';

export type OtpSessionDocument = HydratedDocument<OtpSession>;
@Schema({ collection: 'otpSesions' })
export class OtpSession extends BaseSchema {

  @Prop({ required: true, unique: true, lowercase: true, type: String })
  email: string;

  @Prop({ required: true })
  otpCode: string;

  @Prop()
  emailType: string;

  @Prop()
  expiresAt: Date;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  userId: Types.ObjectId;
}

export const OtpSessionSchema = SchemaFactory.createForClass(OtpSession);