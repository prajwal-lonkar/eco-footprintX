// src/modules/user/repositories/user.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { User } from '../schemas/user.schema';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {
    super(userModel);
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  // FINAL GENERIC METHOD — role-based + pagination
  async findUsersByRole(
    roleId: any,
    limit: number,
    skip: number,
    projection: any = {},
    populate: string[] = [],
    sort: Record<string, 1 | -1>, // required sort param
  ) {
    let query = this.userModel
      .find({ role: roleId, deletedAt: null }, projection)
      .sort(sort)
      .limit(limit)
      .skip(skip);

    populate.forEach((field) => {
      query = query.populate(field);
    });

    return query.lean();
  }

  async countUsersByRole(roleId: any) {
    return this.userModel.countDocuments({
      role: roleId,
      deletedAt: null,
    });
  }

  /**
   * Accepts nested companyDetails object (cleaner & matches your usage).
   */
  async updateCompanyDetails(
    userId: string | Types.ObjectId,
    payload: {
      contactName: string;
      companyName: string;
      website?: string;
      address: string;
      industryType: string;
      companyType: string;
      registrationNumber: string;
      dunsNumber?: string;
    },
  ) {
    const update: any = {
      name: payload.contactName,
      companyDetails: {
        name: payload.companyName,
        address: payload.address,
        industryType: payload.industryType,
        companyType: payload.companyType,
        registrationNumber: payload.registrationNumber,
      },
    };

    // Add optional fields only if provided
    if (payload.website !== undefined) {
      update.companyDetails.website = payload.website;
    }

    if (payload.dunsNumber !== undefined) {
      update.companyDetails.dunsNumber = payload.dunsNumber;
    }
    return this.userModel.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    });
  }

  // Get profile
  async findMyProfileByUserId(userId: string) {
    return this.userModel
      .findById(userId)
      .select('-password')
      .populate('companyDetails.industryType', 'type')
      .populate('companyDetails.companyType', 'type')
      .lean<{
        _id: string;
        name: string;
        email: string;
        createdAt: Date;
        companyDetails: {
          name: string;
          website?: string;
          address: string;
          registrationNumber: string;
          dunsNumber?: string;
          industryType: { _id: string; type: string };
          companyType: { _id: string; type: string };
        };
      }>();
  }

  async getCompaniesForCsvExport(
    companyRoleId: Types.ObjectId,
    endOfMonth: Date,
  ) {
    return this.userModel.aggregate([
      { $match: { role: companyRoleId, deletedAt: null } },
      {
        $lookup: {
          from: 'companySubscriptions',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $lte: ['$startDate', endOfMonth] },
                    {
                      $or: [
                        { $eq: ['$endDate', null] },
                        { $gt: ['$endDate', endOfMonth] },
                      ],
                    },
                  ],
                },
              },
            },
            { $sort: { startDate: -1 } },
            { $limit: 1 },
          ],
          as: 'subscription',
        },
      },
      {
        $unwind: { path: '$subscription', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'subscriptionPlans',
          localField: 'subscription.planId',
          foreignField: '_id',
          as: 'subscriptionPlan',
        },
      },
      {
        $unwind: {
          path: '$subscriptionPlan',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'products',
          let: { companyId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$companyId', '$$companyId'] },
                    { $lte: ['$createdAt', endOfMonth] },
                    { $eq: ['$deletedAt', null] },
                  ],
                },
              },
            },
            { $count: 'count' },
          ],
          as: 'productCount',
        },
      },
      {
        $project: {
          companyName: '$companyDetails.name',
          email: 1,
          subscriptionTier: { $ifNull: ['$subscriptionPlan.tier', 'none'] },
          numberOfProducts: {
            $ifNull: [{ $arrayElemAt: ['$productCount.count', 0] }, 0],
          },
          isActive: 1,
        },
      },
      { $sort: { companyName: 1 } },
    ]);
  }

  /**
   * Update a user's isActive status by their email address.
   * Returns the updated document, or null if no matching user was found.
   */
  async updateIsActiveByEmail(
    email: string,
    isActive: boolean,
  ): Promise<User | null> {
    return this.userModel.findOneAndUpdate(
      { email, deletedAt: null },
      { isActive },
      { new: true },
    );
  }

  // Search supplier
  async searchSuppliers(
    query: string,
    supplierRoleId: string,
    companyId: string,
  ) {
    const data = await this.userModel
      .find(
        {
          role: new Types.ObjectId(supplierRoleId),
          invitedBy: companyId,
          deletedAt: null,
          'companyDetails.name': { $regex: query, $options: 'i' },
        },
        {
          password: 0,
          createdAt: 0,
          updatedAt: 0,
        },
      )
      .limit(10)
      .lean();
    return data;
  }
}
