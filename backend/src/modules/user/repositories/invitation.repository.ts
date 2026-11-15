import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { Invitation } from '../schemas/invitation.schema';

@Injectable()
export class InvitationRepository extends BaseRepository<Invitation> {
  constructor(@InjectModel(Invitation.name) model: Model<Invitation>) {
    super(model);
  }
}
