import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from '../../../shared/schemas/base.schema';
import { SubscriptionPlan } from './subscription-plan.schema';
import { User } from './user.schema';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

@Schema({
  collection: 'companySubscriptions',
  timestamps: true,
})
export class CompanySubscription extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: SubscriptionPlan.name,
    required: true,
  })
  planId: Types.ObjectId;

  @Prop({ type: String, required: true })
  planSlug: string;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, default: null })
  endDate: Date | null;

  @Prop({
    type: String,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;
}

export const CompanySubscriptionSchema =
  SchemaFactory.createForClass(CompanySubscription);

CompanySubscriptionSchema.index({ userId: 1, status: 1 });
CompanySubscriptionSchema.index({ planId: 1 });
