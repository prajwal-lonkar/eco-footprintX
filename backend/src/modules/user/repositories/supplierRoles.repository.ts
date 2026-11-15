import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { SupplierRoles } from '../schemas/supplierRoles.schema';

@Injectable()
export class SupplierRolesRepository extends BaseRepository<SupplierRoles> {
    constructor(
        @InjectModel(SupplierRoles.name)
        private readonly SupplierModel: Model<SupplierRoles>,
    ) {
        super(SupplierModel);
    }

    static findOne(model: Model<SupplierRoles>) {
        return model.findOne({ isActive: true }).exec();
    }
}