import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { SubscriptionPlan } from '../schemas/subscription-plan.schema';

@Injectable()
export class SubscriptionPlanRepository extends BaseRepository<SubscriptionPlan> {
  constructor(
    @InjectModel(SubscriptionPlan.name)
    model: Model<SubscriptionPlan>,
  ) {
    super(model);
  }
}
