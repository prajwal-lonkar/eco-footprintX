import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../../shared/schemas/base.schema';

export type SessionDocument = HydratedDocument<Session>;

@Schema({ timestamps: true })
export class Session extends BaseSchema {
  @Prop({ type: String, required: true })
  refreshToken: string; // Hashed refresh token

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isValid: boolean;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Add compound index for better query performance
SessionSchema.index({ userId: 1, isValid: 1 });
