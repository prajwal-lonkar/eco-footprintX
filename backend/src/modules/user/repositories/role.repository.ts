import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { Role } from '../schemas/role.schema';

@Injectable()
export class RoleRepository extends BaseRepository<Role> {
  constructor(@InjectModel(Role.name) model: Model<Role>) {
    super(model);
  }

  async findByName(roleName: string) {
    return this.model.findOne({ roleName, isActive: true }).lean();
  }

  async findBySlug(roleSlug: string) {
    return this.model.findOne({ roleSlug, isActive: true }).lean();
  }

  async getSupplierRoleId(): Promise<string | null> {
    const role = await this.model.findOne({
      roleSlug: 'supplier_user',
      isActive: true,
    });

    return role?._id ? role._id.toString() : null;
  }
}
