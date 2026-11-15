import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { ImpactCategoryRequest } from '../schemas/impact-category-request.schema';

@Injectable()
export class ImpactCategoryRequestRepository extends BaseRepository<ImpactCategoryRequest> {
  constructor(
    @InjectModel(ImpactCategoryRequest.name)
    private readonly ImpactCategoryRequestModel: Model<ImpactCategoryRequest>,
  ) {
    super(ImpactCategoryRequestModel);
  }
  
  async findLatestRequestDate(recordIds) {
    return this.ImpactCategoryRequestModel.find({
      impactCategoryRecordId: { $in: recordIds },
      isRequested: true,
      deletedAt: null,
    })
      .sort({ createdAt: -1 }) // latest request
      .limit(1)
      .exec();
  }
}
