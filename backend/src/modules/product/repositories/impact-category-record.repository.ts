import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { ImpactCategoryRecord } from '../schemas/impact-category-record.schema';

@Injectable()
export class ImpactCategoryRecordRepository extends BaseRepository<ImpactCategoryRecord> {
  constructor(
    @InjectModel(ImpactCategoryRecord.name)
    private readonly ImpactCategoryRecordModel: Model<ImpactCategoryRecord>,
  ) {
    super(ImpactCategoryRecordModel);
  }
    async countByFilter(filter: any) {
    return this.model.countDocuments(filter);
  }

    async findOneWithSession(filter, populate?: any, session?) {
    const query = this.model.findOne({ ...filter, deletedAt: null });

    if (populate) query.populate(populate);
    if (session) query.session(session);

    return query.exec();
  }

}
