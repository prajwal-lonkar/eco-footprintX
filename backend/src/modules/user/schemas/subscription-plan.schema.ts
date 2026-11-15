import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../../../shared/schemas/base.schema';
import { SubscriptionTier } from '../enums/subscription-tier.enums';

@Schema({
  collection: 'subscriptionPlans',
  timestamps: true,
})
export class SubscriptionPlan extends BaseSchema {
  @Prop({
    required: true,
    enum: SubscriptionTier,
    unique: true,
    lowercase: true,
  })
  tier: SubscriptionTier;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  })
  slug: string;

  // Max number of products allowed
  @Prop({ type: Number, default: null })
  maxProducts: number | null;

  // Controls upgrade CTA visibility
  @Prop({ type: Boolean, default: true })
  isSelectable: boolean;

  // UI ordering
  @Prop({ type: Number, required: true })
  sortOrder: number;

  @Prop({ type: Number, default: 0 })
  monthlyPrice: number;

  @Prop({ type: Number, default: 0 })
  yearlyPrice: number;

  @Prop({ type: String })
  currency: string;
}

export const SubscriptionPlanSchema =
  SchemaFactory.createForClass(SubscriptionPlan);

SubscriptionPlanSchema.index({ sortOrder: 1 });
