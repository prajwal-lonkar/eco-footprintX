import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { ResetSessions } from '../schemas/resetSessions.schema';

@Injectable()
export class ResetSessionsRepository extends BaseRepository<ResetSessions> {
    constructor(
        @InjectModel(ResetSessions.name)
        private readonly ResetSessionsModel: Model<ResetSessions>,
    ) {
        super(ResetSessionsModel);
    }

    async findActiveResetSessions() {
        return this.ResetSessionsModel.find({ isActive: true }).exec();
    }

    static findOne(model: Model<ResetSessions>) {
        return model.findOne({ isActive: true }).exec();
    }
}