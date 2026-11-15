import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { IndustryType } from '../schemas/industryType.schema';

@Injectable()
export class IndustryTypeRepository extends BaseRepository<IndustryType> {
  constructor(
    @InjectModel(IndustryType.name)
    private readonly industryTypeModel: Model<IndustryType>,
  ) {
    super(industryTypeModel);
  }
}