import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { OtpSession } from '../schemas/otpSessions.schema';

@Injectable()
export class OtpSessionRepository extends BaseRepository<OtpSession> {
    constructor(
        @InjectModel(OtpSession.name)
        private readonly OtpSessionModel: Model<OtpSession>,
    ) {
        super(OtpSessionModel);
    }

    async findActiveOtpSessions() {
        return this.OtpSessionModel.find({ isActive: true }).exec();
    }

    static findOne(model: Model<OtpSession>) {
        return model.findOne({ isActive: true }).exec();
    }
}
