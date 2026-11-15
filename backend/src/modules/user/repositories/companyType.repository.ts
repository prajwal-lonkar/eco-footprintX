import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { CompanyType } from '../schemas/companyType.schema';

@Injectable()
export class CompanyTypeRepository extends BaseRepository<CompanyType> {
  constructor(
    @InjectModel(CompanyType.name)
    private readonly companyTypeModel: Model<CompanyType>,
  ) {
    super(companyTypeModel);
  }

  async findActiveCompanyTypes() {
    return this.companyTypeModel.find({ isActive: true }).exec();
  }
}
