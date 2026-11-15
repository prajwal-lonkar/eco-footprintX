import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { Component, ComponentDocument } from '../schemas/component.schema';

@Injectable()
export class ComponentRepository extends BaseRepository<Component> {
  constructor(
    @InjectModel(Component.name)
    private readonly ComponentModel: Model<Component>,
  ) {
    super(ComponentModel);
  }

  static findOne(model: Model<Component>) {
    return model.findOne({ isActive: true }).exec();
  }

  async count(filter: FilterQuery<ComponentDocument>): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}
