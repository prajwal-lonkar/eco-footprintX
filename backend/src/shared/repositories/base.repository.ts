import {
  Model,
  FilterQuery,
  UpdateQuery,
  PopulateOptions,
  ClientSession,
  Types,
} from 'mongoose';
import { DuplicateKeyError } from '../errorResponse/common.errors';

interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(doc: Partial<T>, session?: ClientSession): Promise<any> {
    try {
      const created = new this.model(doc);
      return session ? created.save({ session }) : created.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new DuplicateKeyError(error); // generic error
      }
      throw error;
    }
  }

  async findAllWithPagination(
    filter: FilterQuery<T> = {},
    options: PaginationOptions = {},
    populate?: any,
  ): Promise<{ data: T[]; total: number }> {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const query = this.model
      .find({ ...filter })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    if (populate) query.populate(populate);

    const [data, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments({ ...filter, deletedAt: null }),
    ]);

    return { data, total };
  }

  async findOne(filter: FilterQuery<T>, populate?: any): Promise<T | null> {
    const query = this.model.findOne({ ...filter, deletedAt: null });
    if (populate) query.populate(populate);
    return query.exec();
  }

  async findById(
    id: string | Types.ObjectId,
    populate?: any,
  ): Promise<T | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const query = this.model.findOne({ _id: objectId });
    if (populate) query.populate(populate);
    return query.exec();
  }

  async update(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(filter, update, { new: true, session })
      .exec();
  }

  async softDelete(
    filter: FilterQuery<T>,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        filter,
        { deletedAt: new Date() },
        { new: true, session },
      )
      .exec();
  }

  async deletePermanently(
    filter: FilterQuery<T>,
    session?: ClientSession,
  ): Promise<void> {
    await this.model.deleteOne(filter, { session }).exec();
  }

  async startTransaction(): Promise<ClientSession> {
    const session = await this.model.db.startSession();
    session.startTransaction();
    return session;
  }

  async commitTransaction(session: ClientSession): Promise<void> {
    await session.commitTransaction();
    session.endSession();
  }

  async abortTransaction(session: ClientSession): Promise<void> {
    await session.abortTransaction();
    session.endSession();
  }

  async findAll(
    filter: FilterQuery<T> = {},
    sort: any = { createdAt: -1 },
    populate?: any,
  ): Promise<{ data: T[]; total: number }> {
    const query = this.model.find({ ...filter }).sort(sort);

    if (populate) query.populate(populate);

    const [data, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments({ ...filter, deletedAt: null }),
    ]);

    return { data, total };
  }

  // Find one with filters + sorting + optional populate
  async findOneWithSorting(
    filter: FilterQuery<T>,
    sort: Record<string, 1 | -1>,
    populate?: any,
  ): Promise<T | null> {
    const query = this.model.findOne({ ...filter }).sort(sort);
    if (populate) query.populate(populate);
    return query.exec();
  }

  // Update multiple documents
  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    session?: ClientSession,
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const result: any = await this.model
      .updateMany(filter, update, { session })
      .exec();
    return {
      matchedCount: result.matchedCount ?? result.n ?? 0,
      modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
    };
  }

  async deleteMany(
    filter: FilterQuery<T>,
    session?: ClientSession,
  ): Promise<{ deletedCount?: number }> {
    return this.model.deleteMany(filter, { session }).exec();
  }

  async softDeleteOnIsActiveField(
    filter: FilterQuery<T>,
    updatePayload: any,
    session?: ClientSession,
  ): Promise<T | null> {
    const defaultPayload: any = {
      isActive: false,
      deletedAt: new Date(),
    };
    const finalUpdate = { ...defaultPayload, ...updatePayload };
    return this.model
      .findOneAndUpdate(filter, finalUpdate, { new: true, session })
      .exec();
  }

  // Returns plain array of documents, no total, no pagination
  async find(
    filter: FilterQuery<T> = {},
    sort: any = { createdAt: -1 },
    populate?: any,
  ): Promise<T[]> {
    const query = this.model.find({ ...filter, deletedAt: null }).sort(sort);
    if (populate) query.populate(populate);
    return query.exec();
  }

  async aggregate(pipeline: any[]) {
    return this.model.aggregate(pipeline).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.exists({
      ...filter,
      deletedAt: null,
    });
    return Boolean(result);
  }
}
