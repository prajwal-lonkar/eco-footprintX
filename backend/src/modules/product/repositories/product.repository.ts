import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { Product } from '../schemas/product.schema';
import { UpdateRecycleProductInfoDto } from '../dto/update-recycle-product-info';

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {
    super(productModel);
  }

  static findOne(model: Model<Product>) {
    return model.findOne({ isActive: true }).exec();
  }

  async findByIdForCompany(productId: string, companyId: Types.ObjectId) {
    return this.model
      .findOne({ _id: productId, companyId, deletedAt: null })
      .lean();
  }

  async findByFilter(
    filter: any,
    options: { skip?: number; limit?: number; sort?: any },
  ) {
    return this.model
      .find(filter)
      .skip(options.skip || 0)
      .limit(options.limit || 0)
      .sort(options.sort || {})
      .lean();
  }

  async countByFilter(filter: any) {
    return this.model.countDocuments(filter);
  }
}
