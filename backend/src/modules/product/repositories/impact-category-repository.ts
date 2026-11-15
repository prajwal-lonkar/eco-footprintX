import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { ImpactCategoryData } from '../schemas/impact-category-data.schema';

@Injectable()
export class ImpactCategoryDataRepository extends BaseRepository<ImpactCategoryData> {
  constructor(
    @InjectModel(ImpactCategoryData.name)
    private readonly ImpactCategoryDataModel: Model<ImpactCategoryData>,
  ) {
    super(ImpactCategoryDataModel);
  }
}
