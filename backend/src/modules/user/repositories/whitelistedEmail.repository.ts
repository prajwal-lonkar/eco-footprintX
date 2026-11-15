import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { WhitelistedEmail } from '../schemas/whitelistedEmail.schema';

@Injectable()
export class WhitelistedEmailRepository extends BaseRepository<WhitelistedEmail> {
  constructor(
    @InjectModel(WhitelistedEmail.name) model: Model<WhitelistedEmail>,
  ) {
    super(model);
  }
}
