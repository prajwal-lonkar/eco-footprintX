import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from '../../../shared/schemas/base.schema';

@Schema({ timestamps: true, collection: 'invitations' })
export class Invitation extends BaseSchema {
  @Prop({ type: String, required: true })
  invitedEmail: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['pending', 'accepted', 'cancelled'],
    default: 'pending',
    required: true,
  })
  status: string;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);
