import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { CompanySubscription } from '../schemas/company-subscription.schema';

@Injectable()
export class CompanySubscriptionRepository extends BaseRepository<CompanySubscription> {
  constructor(
    @InjectModel(CompanySubscription.name)
    model: Model<CompanySubscription>,
  ) {
    super(model);
  }
}
